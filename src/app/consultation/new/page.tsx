"use client";

import { useState, useEffect, useMemo, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PHENOTYPES,
  ETIOLOGIES,
  COMORBIDITIES,
  DRUGS,
} from "@/lib/cdss/data";
import { evaluateCDSS, CDSSResult, RankedDrug } from "@/lib/cdss/engine";
import { checkInteraction } from "@/lib/cdss/ddi";
import { getClinicFormulary, getPatientCases, createPatientCase, saveConsultationRecord } from "@/app/actions";
import {
  CheckCircle2,
  Copy,
  BookOpen,
  Pill,
  User,
  Activity,
  Printer,
  X,
  Plus,
  ArrowRight,
  AlertTriangle,
  FileText,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";

function ConsultationForm() {
  const searchParams = useSearchParams();
  const urlCaseId = searchParams.get("caseId");

  // Clinician assessment state
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);

  // New case fields
  const [newCaseAge, setNewCaseAge] = useState<string>("45-65");
  const [newCaseSex, setNewCaseSex] = useState<string>("FEMALE");
  const [newCaseEgfr, setNewCaseEgfr] = useState<string>("75");
  const [newCaseLft, setNewCaseLft] = useState<string>("NORMAL");

  // Clinical evaluation state
  const [painScore, setPainScore] = useState<number>(7);
  const [phenotypeId, setPhenotypeId] = useState<string>("burning");
  const [etiologyId, setEtiologyId] = useState<string>("dpn");
  const [selectedComorbidities, setSelectedComorbidities] = useState<string[]>([]);
  const [formularyStock, setFormularyStock] = useState<Record<string, boolean>>({});

  // DDI checker state
  const [drugA, setDrugA] = useState<string>("tramadol");
  const [drugB, setDrugB] = useState<string>("duloxetine");

  // Guideline drawer state
  const [showGuidelineDrawer, setShowGuidelineDrawer] = useState(false);

  // Prescription decision state
  const [chosenDrugId, setChosenDrugId] = useState<string>("pregabalin");
  const [chosenDose, setChosenDose] = useState<string>("25-75 mg HS");
  const [clinicalRationale, setClinicalRationale] = useState<string>("");

  // SOAP drawer inspector state
  const [savedSoapNote, setSavedSoapNote] = useState<string | null>(null);
  const [copiedSoap, setCopiedSoap] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Selected case object & longitudinal context
  const selectedCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  const latestVisit = useMemo(() => {
    if (!selectedCase?.consultations || selectedCase.consultations.length === 0) {
      return null;
    }
    return selectedCase.consultations[selectedCase.consultations.length - 1];
  }, [selectedCase]);

  const visitCount = selectedCase?.consultations?.length || 0;

  // Carry forward logic
  const applyCaseData = (pCase: any) => {
    if (!pCase) return;

    const visits = pCase.consultations || [];
    if (visits.length > 0) {
      const latest = visits[visits.length - 1];

      // 1. Etiology from latest visit
      if (latest.selectedEtiology) {
        setEtiologyId(latest.selectedEtiology);
      }

      // 2. Phenotype from latest visit
      if (latest.selectedPhenotype) {
        setPhenotypeId(latest.selectedPhenotype);
      }

      // 3. Comorbidities: combine baseline and latest visit
      let baselineComorbs: string[] = [];
      try {
        if (pCase.baselineComorbidities) {
          baselineComorbs = JSON.parse(pCase.baselineComorbidities);
        }
      } catch (e) {}

      let visitComorbs: string[] = [];
      try {
        if (latest.selectedComorbidities) {
          visitComorbs = JSON.parse(latest.selectedComorbidities);
        }
      } catch (e) {}

      const combined = Array.from(new Set([...baselineComorbs, ...visitComorbs]));
      setSelectedComorbidities(combined);

      // 4. Pain score starts at previous visit score
      if (typeof latest.painScore === "number") {
        setPainScore(latest.painScore);
      }

      // 5. Prescribed drug: initialize with previously prescribed drug for titration
      if (latest.chosenDrugId) {
        setChosenDrugId(latest.chosenDrugId);
        if (latest.chosenDose) {
          setChosenDose(latest.chosenDose);
        }
      }
    } else {
      // 0 visits: brand new patient case
      let baselineComorbs: string[] = [];
      try {
        if (pCase.baselineComorbidities) {
          baselineComorbs = JSON.parse(pCase.baselineComorbidities);
        }
      } catch (e) {}
      setSelectedComorbidities(baselineComorbs);
      setPainScore(7);
      setPhenotypeId("burning");
      setEtiologyId("dpn");
    }
  };

  // Load initial data
  useEffect(() => {
    async function load() {
      const [stock, caseList] = await Promise.all([
        getClinicFormulary(),
        getPatientCases(),
      ]);
      setFormularyStock(stock);
      setCases(caseList);

      const targetId =
        urlCaseId && caseList.some((c: any) => c.id === urlCaseId)
          ? urlCaseId
          : caseList.length > 0
          ? caseList[0].id
          : "";

      if (targetId) {
        setSelectedCaseId(targetId);
        const targetCase = caseList.find((c: any) => c.id === targetId);
        if (targetCase) {
          applyCaseData(targetCase);
        }
      }
    }
    load();
  }, [urlCaseId]);

  const handleCaseChange = (newCaseId: string) => {
    setSelectedCaseId(newCaseId);
    const targetCase = cases.find((c) => c.id === newCaseId);
    if (targetCase) {
      applyCaseData(targetCase);
    }
  };

  // Compute CDSS recommendation
  const cdssResult: CDSSResult = useMemo(() => {
    return evaluateCDSS({
      phenotypeId,
      etiologyId,
      comorbidityIds: selectedComorbidities,
      formularyStock,
    });
  }, [phenotypeId, etiologyId, selectedComorbidities, formularyStock]);

  // Set default prescription to Top 1 only when not in follow-up mode or no prior drug chosen
  useEffect(() => {
    if (cdssResult.topRecommendations.length > 0) {
      if (!chosenDrugId) {
        const top = cdssResult.topRecommendations[0];
        setChosenDrugId(top.id);
        setChosenDose(top.startingDose);
      }
    }
  }, [cdssResult.topRecommendations, chosenDrugId]);

  // Toggle comorbidity
  const toggleComorbidity = (id: string) => {
    setSelectedComorbidities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // DDI evaluation
  const interaction = useMemo(() => {
    return checkInteraction(drugA, drugB);
  }, [drugA, drugB]);

  // Real-time pain delta
  const painDelta = latestVisit ? painScore - latestVisit.painScore : 0;

  // Quick rationale chips
  const rationaleChips = useMemo(() => {
    return [
      ...(latestVisit
        ? [
            "ปรับเพิ่มขนาดยา (Titration) เนื่องจากอาการปวดทุเลาแต่ยังรบกวนชีวิตประจำวัน",
            "คงขนาดยาเดิม (Maintenance) เนื่องจากควบคุมอาการปวดได้ดีและไม่มีผลข้างเคียง",
            "เปลี่ยนกลุ่มยาเนื่องจากอาการปวดไม่ตอบสนองต่อยาขนานแรกอย่างเพียงพอ",
            "ปรับลดยาเนื่องจากคนไข้มีอาการข้างเคียง (ง่วงซึม/เวียนศีรษะ/บวมน้ำ)",
          ]
        : [
            "เริ่มยาขนาดต่ำตามแนวทาง Start Low, Go Slow",
            "ปรับลดยาเนื่องจากค่าการทำงานของไต (eGFR)",
            "เลือกยานี้เพราะได้ประโยชน์เรื่องช่วยนอนหลับร่วมด้วย",
            "ผู้ป่วยเคยมีประวัติแพ้หรือทนผลข้างเคียงยาตัวอื่นไม่ได้",
          ]),
      "เลือกสั่งจ่ายยาที่มีพร้อมในคลังของคลินิก",
    ];
  }, [latestVisit]);

  // Handle create new case
  const handleCreateCase = () => {
    startTransition(async () => {
      const res = await createPatientCase({
        ageGroup: newCaseAge,
        sex: newCaseSex,
        baselineEgfr: newCaseEgfr ? parseFloat(newCaseEgfr) : null,
        baselineLft: newCaseLft,
        baselineComorbidities: selectedComorbidities,
      });

      if (res.success && res.case) {
        setCases((prev) => [res.case, ...prev]);
        setSelectedCaseId(res.case.id);
        setShowNewCaseModal(false);
        setToastMessage(`สร้างแฟ้มเคส ${res.case.caseCode} สำเร็จ`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    });
  };

  // Handle Save Consultation
  const handleSaveConsultation = () => {
    if (!selectedCaseId) {
      alert("กรุณาเลือกหรือสร้างเคสผู้ป่วยก่อนบันทึก");
      return;
    }

    const isTopRecommended = cdssResult.topRecommendations.some(
      (d) => d.id === chosenDrugId
    );

    startTransition(async () => {
      const res = await saveConsultationRecord({
        caseId: selectedCaseId,
        painScore,
        phenotypeId,
        etiologyId,
        comorbidityIds: selectedComorbidities,
        chosenDrugId,
        chosenDose,
        isOverride: !isTopRecommended,
        clinicalRationale:
          clinicalRationale ||
          (isTopRecommended
            ? "จ่ายยาตามคำแนะนำอันดับแรกของระบบ"
            : "แพทย์ปรับเปลี่ยนตามวิจารณญาณทางคลินิก"),
      });

      if (res.success && res.soapNote) {
        setSavedSoapNote(res.soapNote);
      }
    });
  };

  // Copy to clipboard
  const handleCopySoap = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSoap(true);
    setToastMessage("คัดลอก SOAP Note ลงใน Clipboard แล้ว");
    setTimeout(() => {
      setCopiedSoap(false);
      setToastMessage(null), 3000;
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-800 flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Pinned Sticky Patient Context Bar (Q5) */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 -mx-4 md:-mx-6 px-4 md:px-6 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Patient Identity & Physiological Context */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-950 text-white flex items-center justify-center text-xs font-mono font-bold">
            {selectedCase ? selectedCase.caseCode.split("-").slice(-1)[0] : "Rx"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-slate-950">
                {selectedCase ? selectedCase.caseCode : "ยังไม่ได้เลือกเคส"}
              </span>
              {selectedCase && (
                <>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedCase.sex === "MALE" ? "ชาย" : "หญิง"}, {selectedCase.ageGroup} ปี
                  </span>
                  {selectedCase.baselineEgfr !== null ? (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        selectedCase.baselineEgfr < 30
                          ? "bg-rose-50 text-rose-700 border-rose-200 font-semibold"
                          : selectedCase.baselineEgfr < 60
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      eGFR: {selectedCase.baselineEgfr} mL/min
                    </span>
                  ) : null}
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              TASP 2020 Clinical Decision Support Workbench
            </div>
          </div>
        </div>

        {/* Case Switcher & Action Controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCaseId}
            onChange={(e) => handleCaseChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none focus:border-slate-400 focus:bg-white transition"
          >
            <option value="">-- สลับแฟ้มเคส --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseCode} ({c.sex === "MALE" ? "ชาย" : "หญิง"}, {c.ageGroup} ปี)
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewCaseModal(true)}
            className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" /> เคสใหม่
          </button>

          <button
            onClick={() => setShowGuidelineDrawer(true)}
            className="inline-flex items-center gap-1.5 bg-slate-950 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-xs transition"
          >
            <BookOpen className="h-3.5 w-3.5" /> คู่มือ TASP
          </button>
        </div>
      </div>

      {/* Previous Visit Summary Banner (Longitudinal Context) */}
      {latestVisit && (
        <div className="bg-sky-50/80 border border-sky-200/90 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start md:items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs font-mono font-bold text-xs">
              #{visitCount}
            </div>
            <div>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <span>
                  ประวัติการตรวจล่าสุด ({new Date(latestVisit.visitDate).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-sky-800 border border-sky-200 font-bold">
                  Follow-up Mode
                </span>
              </div>
              <div className="text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  ยาเดิม: <strong className="text-slate-900 capitalize">{latestVisit.chosenDrugId}</strong> ({latestVisit.chosenDose})
                </span>
                <span>&bull;</span>
                <span>
                  ความปวดเดิม: <strong className="text-slate-900 font-mono">NRS {latestVisit.painScore}/10</strong>
                </span>
                <span>&bull;</span>
                <span>
                  อาการเดิม: {PHENOTYPES.find((p) => p.id === latestVisit.selectedPhenotype)?.th || latestVisit.selectedPhenotype}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/cases/${selectedCase?.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 font-semibold transition text-xs shadow-xs"
            >
              <span>ดูไทม์ไลน์ทั้งหมด</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Unified Clinical Workbench Surface (Q1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clinical Examination Canvas */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Pain Intensity Slider */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-600" />
                <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                  ระดับความปวดปัจจุบัน (Pain Score: NRS 0-10)
                </h2>
              </div>
              <span
                className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                  painScore >= 7
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : painScore >= 4
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                NRS {painScore} / 10 &bull; {painScore >= 7 ? "รุนแรง (Severe)" : painScore >= 4 ? "ปานกลาง (Moderate)" : "เล็กน้อย (Mild)"}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="10"
              value={painScore}
              onChange={(e) => setPainScore(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-950"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium font-mono">
              <span>0 (ไม่ปวด)</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10 (ปวดมากที่สุด)</span>
            </div>

            {/* Real-time Pain Score Delta Indicator */}
            {latestVisit && (
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                <div className="text-slate-500 flex items-center gap-1.5">
                  <span>ความปวดครั้งก่อนหน้า:</span>
                  <span className="font-mono font-bold text-slate-800">
                    NRS {latestVisit.painScore}/10
                  </span>
                </div>

                <div>
                  {painDelta < 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-mono text-[11px]">
                      <TrendingDown className="h-3.5 w-3.5" />
                      ลดลง {Math.abs(painDelta)} คะแนน (ทุเลาลง{" "}
                      {Math.round(
                        (Math.abs(painDelta) / (latestVisit.painScore || 1)) * 100
                      )}
                      %)
                    </span>
                  ) : painDelta > 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 font-mono text-[11px]">
                      <TrendingUp className="h-3.5 w-3.5" />
                      เพิ่มขึ้น +{painDelta} คะแนน (ปวดมากขึ้น)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                      <Minus className="h-3.5 w-3.5" />
                      ระดับความปวดคงเดิม
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Underlying Etiology (Guideline First-line Driver) */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                  1. ภาวะที่เป็นสาเหตุ (Underlying Etiology)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">กำหนด First-line ตามแนวทางเวชปฏิบัติ TASP 2020</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {ETIOLOGIES.map((item) => {
                const isSelected = etiologyId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setEtiologyId(item.id)}
                    className={`text-left p-3 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? "bg-slate-950 text-white border-slate-950 shadow-xs font-semibold"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 font-normal"
                    }`}
                  >
                    <div className="font-semibold">{item.th}</div>
                    <div className={`text-[11px] mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {item.note}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Dominant Sensory Phenotype */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                  2. ลักษณะอาการปวดเด่น (Pain Phenotype)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">สะท้อนกลไกพยาธิสรีรวิทยา (Mechanism-based targeting)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {PHENOTYPES.map((p) => {
                const isSelected = phenotypeId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPhenotypeId(p.id)}
                    className={`text-left p-3 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? "bg-slate-950 text-white border-slate-950 shadow-xs font-semibold"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs">{p.th}</div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {p.en.split("/")[0].trim()}
                      </span>
                    </div>
                    <div className={`text-xs mt-1 leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Comorbidities & Safety Matrix */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                  3. โรคร่วมและข้อควรระวัง (Comorbidities & Precautions)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">คลิกเลือกหลายโรคได้ ระบบคำนวณข้อห้ามใช้และอันดับยาทันที</p>
              </div>
              {selectedComorbidities.length > 0 && (
                <button
                  onClick={() => setSelectedComorbidities([])}
                  className="text-xs text-rose-600 hover:underline font-medium"
                >
                  ล้าง ({selectedComorbidities.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {COMORBIDITIES.map((c) => {
                const isSelected = selectedComorbidities.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleComorbidity(c.id)}
                    className={`text-left p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                      isSelected
                        ? c.group === "positive"
                          ? "bg-emerald-50/90 border-emerald-300 text-emerald-900 font-medium"
                          : c.group === "avoid"
                          ? "bg-rose-50/90 border-rose-300 text-rose-900 font-medium"
                          : "bg-amber-50/90 border-amber-300 text-amber-900 font-medium"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full mt-1 shrink-0 ${
                        isSelected
                          ? c.group === "positive"
                            ? "bg-emerald-600"
                            : c.group === "avoid"
                            ? "bg-rose-600"
                            : "bg-amber-600"
                          : c.group === "positive"
                          ? "bg-emerald-400"
                          : c.group === "avoid"
                          ? "bg-rose-400"
                          : "bg-amber-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs truncate">{c.th}</div>
                      <div className={`text-[11px] mt-0.5 truncate ${
                        isSelected
                          ? c.group === "positive"
                            ? "text-emerald-700"
                            : c.group === "avoid"
                            ? "text-rose-700"
                            : "text-amber-700"
                          : "text-slate-500"
                      }`}>
                        {c.hint}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Integrated DDI Quick Checker */}
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-slate-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Drug-Drug Interaction Checker (DDI)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-slate-600">ยาตัวที่ 1 (Drug A)</label>
                <select
                  value={drugA}
                  onChange={(e) => setDrugA(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-slate-400"
                >
                  {DRUGS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.mech})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">ยาตัวที่ 2 (Drug B)</label>
                <select
                  value={drugB}
                  onChange={(e) => setDrugB(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-slate-400"
                >
                  {DRUGS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.mech})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {interaction ? (
              <div
                className={`rounded-lg border p-3 text-xs ${
                  interaction.severity === "high"
                    ? "bg-rose-50 border-rose-200 text-rose-950"
                    : interaction.severity === "moderate"
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.2 rounded-full uppercase ${
                      interaction.severity === "high"
                        ? "bg-rose-700 text-white"
                        : interaction.severity === "moderate"
                        ? "bg-amber-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    ความรุนแรง: {interaction.severity}
                  </span>
                  <span className="font-semibold">{interaction.type}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed">{interaction.desc}</p>
                <div className="mt-2 pt-2 border-t border-black/10 text-xs">
                  <span className="font-bold">คำแนะนำการจัดการ:</span> {interaction.management}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200/80 bg-white p-2.5 text-xs text-slate-500 text-center">
                เลือกยาตัวเดียวกัน หรือไม่มีข้อมูลปฏิกิริยาระหว่างยาที่มีนัยสำคัญ
              </div>
            )}
          </div>
        </div>

        {/* Right Column: CDSS Decision Engine & Pharmacological Matrix (Q3) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top 2 Recommendation Deck (Split Comparison) */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950">
                  ยาที่แนะนำอันดับ 1-2 (TASP 2020 Top Choices)
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                Guideline First-line
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {cdssResult.topRecommendations.slice(0, 2).map((d, index) => {
                const isSelected = chosenDrugId === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      setChosenDrugId(d.id);
                      setChosenDose(d.startingDose);
                    }}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-slate-950 bg-slate-50/80 shadow-xs ring-1 ring-slate-950"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="h-5 w-5 rounded-md bg-slate-900 text-white font-mono font-bold text-[11px] flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-600">
                        {d.totalScore.toFixed(1)} pt
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="font-bold text-sm text-slate-950">{d.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{d.startingDose}</div>
                      <div className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {d.mechTh}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {d.tierScoreLabel}
                      </span>
                      <span className={`text-[10px] font-medium ${isSelected ? "text-slate-900 font-bold" : "text-slate-400"}`}>
                        {isSelected ? "กำลังเลือก" : "คลิกเพื่อเลือก"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pharmacological Matrix: All 8 Drugs */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                ตารางเปรียบเทียบยาทั้ง 8 ชนิด (Pharmacological Matrix)
              </h2>
              <span className="text-[10px] font-mono text-slate-500">เรียงตามคะแนนสุทธิ</span>
            </div>

            <div className="border border-slate-200/80 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                  <tr>
                    <th className="p-2.5 font-medium">ชื่อยา</th>
                    <th className="p-2.5 font-medium">ขนาดเริ่ม</th>
                    <th className="p-2.5 font-medium">คะแนน</th>
                    <th className="p-2.5 font-medium text-right">เลือก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cdssResult.rankedDrugs.map((drug, idx) => {
                    const isSelected = chosenDrugId === drug.id;
                    const hasContra = drug.comorbiditySummary.level === "contra";

                    return (
                      <tr
                        key={drug.id}
                        className={`transition-colors ${
                          isSelected ? "bg-slate-100/80 font-medium" : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-slate-400">#{idx + 1}</span>
                            <span className="font-bold text-slate-900">{drug.name}</span>
                            {!drug.isInStock && (
                              <span className="text-[9px] px-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                หมด
                              </span>
                            )}
                          </div>
                          {drug.comorbiditySummary.items.length > 0 && (
                            <div className="text-[10px] mt-0.5 space-y-0.5">
                              {drug.comorbiditySummary.items.map((item, i) => (
                                <div
                                  key={i}
                                  className={
                                    item.level === "contra"
                                      ? "text-rose-700 font-semibold"
                                      : item.level === "caution"
                                      ? "text-amber-700"
                                      : "text-emerald-700"
                                  }
                                >
                                  {item.level === "contra" ? "[ห้ามใช้]" : item.level === "caution" ? "[ระวัง]" : "[เด่น]"}{" "}
                                  {item.reason}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 text-[11px]">{drug.startingDose}</td>
                        <td className="p-2.5 font-mono text-slate-900 font-semibold">{drug.totalScore.toFixed(1)}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => {
                              setChosenDrugId(drug.id);
                              setChosenDose(drug.startingDose);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                              isSelected
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            {isSelected ? "เลือกแล้ว" : "เลือก"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Prescription & Titration Decision Console */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-slate-900" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950">
                การตัดสินใจสั่งจ่ายยาของแพทย์ (Physician Decision)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">ยาที่ตัดสินใจสั่งใช้</label>
                <select
                  value={chosenDrugId}
                  onChange={(e) => {
                    setChosenDrugId(e.target.value);
                    const found = DRUGS.find((d) => d.id === e.target.value);
                    if (found) setChosenDose(found.startingDose);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400"
                >
                  {DRUGS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {formularyStock[d.id] === false ? "(ไม่มีในคลัง)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">ขนาดและวิธีใช้เริ่มต้น (Dose)</label>
                <input
                  type="text"
                  value={chosenDose}
                  onChange={(e) => setChosenDose(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">
                เหตุผลทางคลินิก (Clinical Rationale)
              </label>
              <textarea
                rows={2}
                value={clinicalRationale}
                onChange={(e) => setClinicalRationale(e.target.value)}
                placeholder="ระบุเหตุผลทางคลินิก หรือคลิกเลือกข้อความแนะนำด้านล่าง..."
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-slate-400"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {rationaleChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setClinicalRationale(chip)}
                    className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveConsultation}
              disabled={isPending}
              className="w-full py-3 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isPending ? "กำลังบันทึกข้อมูล..." : "บันทึกผลการประเมินและสร้าง SOAP Note"}
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Over Clinical Inspector Drawer for SOAP Note (Q8) */}
      {savedSoapNote && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-xs transition-opacity"
            onClick={() => setSavedSoapNote(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-xl w-full flex pl-10">
            <div className="w-full bg-white shadow-2xl border-l border-slate-200/80 flex flex-col justify-between p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">
                        บันทึกการประเมินและสร้าง SOAP Note สำเร็จ
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        {selectedCase?.caseCode} &bull; Longitudinal Consultation Recorded
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSavedSoapNote(null)}
                    className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed">
                  ข้อความถูกจัดรูปแบบตามมาตรฐานเวชระเบียน SOAP พร้อมนำไปวางในโปรแกรม HIS ของโรงพยาบาลได้ทันที (1-Click Copy)
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 max-h-[60vh] overflow-y-auto">
                  <pre className="text-xs font-mono text-slate-900 whitespace-pre-wrap leading-relaxed">
                    {savedSoapNote}
                  </pre>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                >
                  <Printer className="h-3.5 w-3.5" /> พิมพ์เอกสาร
                </button>

                <button
                  onClick={() => handleCopySoap(savedSoapNote)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-[0.99] ${
                    copiedSoap
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-950 hover:bg-slate-800 text-white"
                  }`}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedSoap ? "คัดลอกลง Clipboard แล้ว" : "คัดลอก SOAP Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Case Creation Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-950">สร้างแฟ้มเคสผู้ป่วยใหม่ (De-identified)</h3>
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="h-7 w-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700">กลุ่มอายุ (Age Group)</label>
                <select
                  value={newCaseAge}
                  onChange={(e) => setNewCaseAge(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:border-slate-400"
                >
                  <option value="<45">น้อยกว่า 45 ปี (&lt;45)</option>
                  <option value="45-65">45-65 ปี</option>
                  <option value=">65">มากกว่า 65 ปี (&gt;65 / ผู้สูงอายุ)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">เพศ (Sex)</label>
                <select
                  value={newCaseSex}
                  onChange={(e) => setNewCaseSex(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:border-slate-400"
                >
                  <option value="FEMALE">หญิง (Female)</option>
                  <option value="MALE">ชาย (Male)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Baseline eGFR (mL/min/1.73m2)</label>
                <input
                  type="number"
                  value={newCaseEgfr}
                  onChange={(e) => setNewCaseEgfr(e.target.value)}
                  placeholder="เช่น 75.0"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">การทำงานของตับ (LFT)</label>
                <select
                  value={newCaseLft}
                  onChange={(e) => setNewCaseLft(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:border-slate-400"
                >
                  <option value="NORMAL">ปกติ (Normal)</option>
                  <option value="MILD_ELEVATED">เอนไซม์ตับขึ้นเล็กน้อย (Mild elevated)</option>
                  <option value="CHRONIC_LIVER_DISEASE">โรคตับเรื้อรัง / ตับแข็ง (Chronic liver disease)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateCase}
              className="w-full py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition"
            >
              ยืนยันการสร้างแฟ้มเคส
            </button>
          </div>
        </div>
      )}

      {/* Guideline Tables Drawer */}
      {showGuidelineDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white max-w-2xl w-full h-full p-6 shadow-2xl overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-950">
                  ตารางอ้างอิง TASP 2020 Guidelines
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clinical Guidance for Neuropathic Pain & Fibromyalgia 2020
                </p>
              </div>
              <button
                onClick={() => setShowGuidelineDrawer(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Table 3.1.4 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">
                Table 3.1.4: First-line และ Second-line ตามโรค
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-950 text-white text-[11px]">
                    <tr>
                      <th className="p-2.5 text-left">โรค</th>
                      <th className="p-2.5 text-left">First-line</th>
                      <th className="p-2.5 text-left">Second-line / Add-on</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-bold">DPN</td>
                      <td className="p-2.5">Pregabalin, Gabapentin, Duloxetine, Amitriptyline</td>
                      <td className="p-2.5 text-slate-500">Venlafaxine, Tramadol (ระยะสั้น)</td>
                    </tr>
                    <tr className="bg-slate-50/60">
                      <td className="p-2.5 font-bold">PHN</td>
                      <td className="p-2.5">TCA, Gabapentin, Pregabalin, Lidocaine patch</td>
                      <td className="p-2.5 text-slate-500">Capsaicin, Tramadol</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">TGN</td>
                      <td className="p-2.5">Carbamazepine, Oxcarbazepine</td>
                      <td className="p-2.5 text-slate-500">Lamotrigine, Baclofen, Surgery</td>
                    </tr>
                    <tr className="bg-slate-50/60">
                      <td className="p-2.5 font-bold">Central Pain</td>
                      <td className="p-2.5">Amitriptyline, Pregabalin</td>
                      <td className="p-2.5 text-slate-500">Gabapentin, Duloxetine, Tramadol</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Fibromyalgia</td>
                      <td className="p-2.5">Duloxetine 60mg, Amitriptyline 10-25mg, Pregabalin</td>
                      <td className="p-2.5 text-slate-500">Tramadol (จำกัด), Non-pharm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 3.1.5 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">
                Table 3.1.5: ขนาดยาแนะนำและการปรับ (Start Low, Go Slow)
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-900 text-white text-[11px]">
                    <tr>
                      <th className="p-2.5 text-left">ยา</th>
                      <th className="p-2.5 text-left">ขนาดเริ่ม</th>
                      <th className="p-2.5 text-left">ช่วงขนาดยา</th>
                      <th className="p-2.5 text-left">ข้อควรระวังสำคัญ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {DRUGS.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold">{d.name}</td>
                        <td className="p-2.5 font-mono">{d.startingDose}</td>
                        <td className="p-2.5 font-mono">{d.dose}</td>
                        <td className="p-2.5 text-slate-600">{d.neg.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
          กำลังโหลดข้อมูลการประเมิน...
        </div>
      }
    >
      <ConsultationForm />
    </Suspense>
  );
}

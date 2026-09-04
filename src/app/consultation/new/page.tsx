"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
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
  AlertTriangle,
  CheckCircle2,
  Copy,
  BookOpen,
  ChevronDown,
  Info,
  Pill,
  User,
  Activity,
  Sparkles,
  Printer,
  X,
  Plus,
} from "lucide-react";

export default function NewConsultationPage() {
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

  // SOAP modal state
  const [savedSoapNote, setSavedSoapNote] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load initial data
  useEffect(() => {
    async function load() {
      const [stock, caseList] = await Promise.all([
        getClinicFormulary(),
        getPatientCases(),
      ]);
      setFormularyStock(stock);
      setCases(caseList);
      if (caseList.length > 0) {
        setSelectedCaseId(caseList[0].id);
      }
    }
    load();
  }, []);

  // Compute CDSS recommendation
  const cdssResult: CDSSResult = useMemo(() => {
    return evaluateCDSS({
      phenotypeId,
      etiologyId,
      comorbidityIds: selectedComorbidities,
      formularyStock,
    });
  }, [phenotypeId, etiologyId, selectedComorbidities, formularyStock]);

  // Set default prescription to Top 1
  useEffect(() => {
    if (cdssResult.topRecommendations.length > 0) {
      const top = cdssResult.topRecommendations[0];
      setChosenDrugId(top.id);
      setChosenDose(top.startingDose);
    }
  }, [cdssResult.topRecommendations]);

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

  // Quick rationale chips
  const rationaleChips = [
    "เริ่มยาขนาดต่ำตามแนวทาง Start Low, Go Slow",
    "ปรับลดยาเนื่องจากค่าการทำงานของไต (eGFR)",
    "เลือกยานี้เพราะได้ประโยชน์เรื่องช่วยนอนหลับร่วมด้วย",
    "ผู้ป่วยเคยมีประวัติแพ้หรือทนผลข้างเคียงยาตัวอื่นไม่ได้",
    "เลือกสั่งจ่ายยาที่มีพร้อมในคลังของคลินิก",
  ];

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
        clinicalRationale: clinicalRationale || (isTopRecommended ? "จ่ายยาตามคำแนะนำอันดับแรกของระบบ" : "แพทย์ปรับเปลี่ยนตามวิจารณญาณทางคลินิก"),
      });

      if (res.success && res.soapNote) {
        setSavedSoapNote(res.soapNote);
      }
    });
  };

  // Copy to clipboard
  const handleCopySoap = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage("คัดลอก SOAP Note ลงใน Clipboard แล้ว!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              การประเมินและเลือกใช้ยา Neuropathic Pain
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              TASP 2020 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            วิเคราะห์จาก Mechanism สู่ Drug Choice • ตรวจสอบโรคร่วมและ DDI แบบเรียลไทม์
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuidelineDrawer(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            <BookOpen className="h-4 w-4" /> ดูตารางแนวทาง TASP 2020
          </button>
        </div>
      </div>

      {/* Case Selector Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <div className="text-xs text-blue-200">แฟ้มเคสที่กำลังตรวจ (De-identified Patient Case)</div>
            <div className="text-sm font-bold mt-0.5">
              {selectedCase ? (
                <span>
                  {selectedCase.caseCode} • เพศ {selectedCase.sex === "MALE" ? "ชาย" : "หญิง"} • อายุ {selectedCase.ageGroup} ปี
                  {selectedCase.baselineEgfr && ` • eGFR ${selectedCase.baselineEgfr}`}
                </span>
              ) : (
                <span className="text-blue-300 font-normal">ยังไม่ได้เลือกเคสผู้ป่วย</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-xs outline-none focus:bg-white/20"
          >
            <option value="" className="text-slate-900">-- เลือกแฟ้มเคส --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id} className="text-slate-900">
                {c.caseCode} ({c.sex}, {c.ageGroup})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewCaseModal(true)}
            className="inline-flex items-center gap-1 bg-white text-blue-950 px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition"
          >
            <Plus className="h-3.5 w-3.5" /> เคสใหม่
          </button>
        </div>
      </div>

      {/* Section 1: Pain Assessment (NRS Slider + Phenotype + Etiology) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assessment Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pain Score Slider */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-bold text-slate-800">
                  ระดับความปวดปัจจุบัน (Pain Score: NRS 0–10)
                </span>
              </div>
              <span
                className={`text-sm font-extrabold px-3 py-1 rounded-full ${
                  painScore >= 7
                    ? "bg-rose-100 text-rose-700"
                    : painScore >= 4
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {painScore} / 10 • {painScore >= 7 ? "รุนแรง (Severe)" : painScore >= 4 ? "ปานกลาง (Moderate)" : "เล็กน้อย (Mild)"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={painScore}
              onChange={(e) => setPainScore(parseInt(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
              <span>0 (ไม่ปวดเลย)</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10 (ปวดมากที่สุด)</span>
            </div>
          </div>

          {/* Etiology Selector */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">
                1. ภาวะที่เป็นสาเหตุ (Underlying Etiology)
              </span>
              <span className="text-[11px] text-slate-400">กำหนด First-line ตาม TASP</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {ETIOLOGIES.map((item) => {
                const isSelected = etiologyId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setEtiologyId(item.id)}
                    className={`text-left p-3 rounded-2xl border text-xs transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-bold"
                        : "bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 text-slate-700 font-medium"
                    }`}
                  >
                    <div>{item.th}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                      {item.note}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pain Phenotype Selector */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">
                2. ลักษณะอาการปวดเด่น (Pain Phenotype)
              </span>
              <span className="text-[11px] text-slate-400">สะท้อนกลไกพยาธิสรีรวิทยา</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {PHENOTYPES.map((p) => {
                const isSelected = phenotypeId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPhenotypeId(p.id)}
                    className={`text-left p-3 rounded-2xl border text-xs transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md font-bold"
                        : "bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-lg shrink-0">{p.emoji}</span>
                    <div>
                      <div>{p.th}</div>
                      <div className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                        {p.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comorbidities Checklist Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-bold text-slate-800">
                  3. โรคร่วมและภาวะที่ต้องระวัง (Comorbidities & Precautions)
                </span>
                <p className="text-[11px] text-slate-400">คลิกเลือกหลายโรคได้ ระบบจะหัก/เพิ่มคะแนนทันที</p>
              </div>
              {selectedComorbidities.length > 0 && (
                <button
                  onClick={() => setSelectedComorbidities([])}
                  className="text-[11px] text-rose-600 hover:underline font-semibold"
                >
                  ล้าง ({selectedComorbidities.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {COMORBIDITIES.map((c) => {
                const isSelected = selectedComorbidities.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleComorbidity(c.id)}
                    className={`text-left p-2.5 rounded-2xl border text-xs flex items-start gap-2 transition-all ${
                      isSelected
                        ? c.group === "positive"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : c.group === "avoid"
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-slate-50/50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-base shrink-0">{c.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[11px] truncate">{c.th}</div>
                      <div className={`text-[9px] mt-0.5 ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                        {c.hint}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Ranked Drug Cards & Prescribing */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top Recommendation Summary */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span className="text-xs font-bold tracking-wider uppercase text-cyan-200">
                ยาที่แนะนำอันดับ 1–2 (TASP 2020 Guidance)
              </span>
            </div>

            <div className="space-y-2 mt-3">
              {cdssResult.topRecommendations.map((d, index) => (
                <div
                  key={d.id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-cyan-400 text-blue-950 font-black text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-white">{d.name}</div>
                      <div className="text-[10px] text-cyan-100">
                        ขนาดแนะนำ: {d.startingDose}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 font-extrabold">
                    {d.tierScoreLabel}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-cyan-100/80 mt-3">
              * คำนวณจาก Phenotype match + Etiology guidance + โรคร่วม โดยคัดกรองยาที่มีในคลังของคลินิก
            </div>
          </div>

          {/* Full Ranked Drug List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">การจัดอันดับยาทั้ง 8 ชนิด</span>
              <span className="text-xs text-slate-400">เรียงตามคะแนนสุทธิ</span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {cdssResult.rankedDrugs.map((drug) => {
                const isTop = cdssResult.topRecommendations.some((t) => t.id === drug.id);
                const hasContra = drug.comorbiditySummary.level === "contra";
                const hasCaution = drug.comorbiditySummary.level === "caution";
                const hasBenefit = drug.comorbiditySummary.level === "benefit";

                return (
                  <div
                    key={drug.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      hasContra
                        ? "bg-rose-50/50 border-rose-200"
                        : isTop
                        ? "bg-blue-50/40 border-blue-300 ring-1 ring-blue-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{drug.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${drug.tierScoreClass}`}>
                            {drug.tierScoreLabel}
                          </span>
                          {!drug.isInStock && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              ไม่มีในคลัง
                            </span>
                          )}
                          {drug.isFirstLine && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                              First-line
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{drug.mechTh}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-700">
                          {drug.totalScore.toFixed(1)} คะแนน
                        </span>
                      </div>
                    </div>

                    {/* Comorbidity Warning Alerts */}
                    {drug.comorbiditySummary.items.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[10px]">
                        {drug.comorbiditySummary.items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-1 ${
                              item.level === "contra"
                                ? "text-rose-700 font-medium"
                                : item.level === "caution"
                                ? "text-amber-700"
                                : "text-emerald-700"
                            }`}
                          >
                            <span className="shrink-0 mt-0.5">
                              {item.level === "contra" ? "⛔" : item.level === "caution" ? "⚠️" : "🌟"}
                            </span>
                            <span>{item.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prescription Decision & Save Box */}
          <div className="bg-white rounded-3xl border-2 border-blue-500/30 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                การตัดสินใจสั่งจ่ายยาของแพทย์ (Physician Decision)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">เลือกยาที่จะสั่งใช้</label>
                <select
                  value={chosenDrugId}
                  onChange={(e) => {
                    setChosenDrugId(e.target.value);
                    const found = DRUGS.find((d) => d.id === e.target.value);
                    if (found) setChosenDose(found.startingDose);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
                >
                  {DRUGS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {formularyStock[d.id] === false ? "(ไม่มีในคลัง)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">ขนาดและวิธีใช้เริ่มต้น</label>
                <input
                  type="text"
                  value={chosenDose}
                  onChange={(e) => setChosenDose(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Clinical Rationale */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">
                เหตุผลทางคลินิก (Clinical Rationale)
              </label>
              <textarea
                rows={2}
                value={clinicalRationale}
                onChange={(e) => setClinicalRationale(e.target.value)}
                placeholder="ระบุเหตุผลทางคลินิก หรือคลิกเลือกข้อความแนะนำด้านล่าง..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:border-blue-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {rationaleChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setClinicalRationale(chip)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveConsultation}
              disabled={isPending}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              {isPending ? "กำลังบันทึกข้อมูล..." : "บันทึกผลการประเมิน & สร้าง SOAP Note"}
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: DDI Interaction Checker Widget */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              ⚡
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Drug-Drug Interaction Checker (ตรวจสอบปฏิกิริยาระหว่างยา)
              </h3>
              <p className="text-[11px] text-slate-400">
                วิเคราะห์ Pharmacodynamic & Pharmacokinetic Interactions ตามมาตรฐาน TASP 2020
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">ยาตัวที่ 1 (Drug A)</label>
            <select
              value={drugA}
              onChange={(e) => setDrugA(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500"
            >
              {DRUGS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.mech}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">ยาตัวที่ 2 (Drug B)</label>
            <select
              value={drugB}
              onChange={(e) => setDrugB(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500"
            >
              {DRUGS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.mech}
                </option>
              ))}
            </select>
          </div>
        </div>

        {interaction ? (
          <div
            className={`rounded-2xl border p-4 text-xs ${
              interaction.severity === "high"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : interaction.severity === "moderate"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  interaction.severity === "high"
                    ? "bg-rose-600 text-white"
                    : interaction.severity === "moderate"
                    ? "bg-amber-600 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {interaction.severity} risk
              </span>
              <span className="font-bold text-sm">{interaction.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 border">
                {interaction.type}
              </span>
            </div>
            <p className="mt-1 leading-relaxed">{interaction.desc}</p>
            <div className="mt-2.5 pt-2 border-t border-black/10 font-medium">
              💡 <span className="font-bold">คำแนะนำการจัดการ:</span> {interaction.management}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 text-center">
            เลือกยาตัวเดียวกัน หรือไม่มีข้อมูลปฏิกิริยาระหว่างยาที่มีนัยสำคัญ
          </div>
        )}
      </div>

      {/* SOAP Note Success Modal */}
      {savedSoapNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  บันทึกการประเมินและสร้าง SOAP Note สำเร็จ
                </h3>
              </div>
              <button
                onClick={() => setSavedSoapNote(null)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              ข้อความถูกจัดรูปแบบตามมาตรฐานเวชระเบียน สามารถกดปุ่มด้านล่างเพื่อคัดลอกและนำไปวางในโปรแกรม HIS (HOSxP, JHCIS) ได้ทันที
            </p>

            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-800">
                {savedSoapNote}
              </pre>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
              >
                <Printer className="h-4 w-4" /> พิมพ์เอกสาร A4
              </button>

              <button
                onClick={() => handleCopySoap(savedSoapNote)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition"
              >
                <Copy className="h-4 w-4" /> 1-Click คัดลอก SOAP Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Case Creation Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">สร้างแฟ้มเคสผู้ป่วยใหม่ (De-identified)</h3>
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600">กลุ่มอายุ (Age Group)</label>
                <select
                  value={newCaseAge}
                  onChange={(e) => setNewCaseAge(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none"
                >
                  <option value="<45">น้อยกว่า 45 ปี (&lt;45)</option>
                  <option value="45-65">45 – 65 ปี</option>
                  <option value=">65">มากกว่า 65 ปี (&gt;65 / ผู้สูงอายุ)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600">เพศ (Sex)</label>
                <select
                  value={newCaseSex}
                  onChange={(e) => setNewCaseSex(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none"
                >
                  <option value="FEMALE">หญิง (Female)</option>
                  <option value="MALE">ชาย (Male)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600">Baseline eGFR (mL/min/1.73m2)</label>
                <input
                  type="number"
                  value={newCaseEgfr}
                  onChange={(e) => setNewCaseEgfr(e.target.value)}
                  placeholder="เช่น 60.0"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600">การทำงานของตับ (LFT)</label>
                <select
                  value={newCaseLft}
                  onChange={(e) => setNewCaseLft(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none"
                >
                  <option value="NORMAL">ปกติ (Normal)</option>
                  <option value="MILD_ELEVATED">เอนไซม์ตับขึ้นเล็กน้อย (Mild elevated)</option>
                  <option value="CHRONIC_LIVER_DISEASE">โรคตับเรื้อรัง / ตับแข็ง (Chronic liver disease)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateCase}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
            >
              ยืนยันการสร้างแฟ้มเคส
            </button>
          </div>
        </div>
      )}

      {/* Guideline Tables Drawer */}
      {showGuidelineDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white max-w-2xl w-full h-full p-6 shadow-2xl overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ตารางอ้างอิง TASP 2020 Guidelines
                </h3>
                <p className="text-xs text-slate-500">
                  Clinical Guidance for Neuropathic Pain & Fibromyalgia 2020
                </p>
              </div>
              <button
                onClick={() => setShowGuidelineDrawer(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Table 3.1.4 */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                Table 3.1.4 — First-line / Second-line ตามโรค
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-900 text-white text-[11px]">
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
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                Table 3.1.5 — ขนาดยาแนะนำและการปรับ (Start Low, Go Slow)
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead className="bg-blue-600 text-white text-[11px]">
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
                        <td className="p-2.5">{d.startingDose}</td>
                        <td className="p-2.5">{d.dose}</td>
                        <td className="p-2.5 text-slate-500">{d.neg.join(", ")}</td>
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

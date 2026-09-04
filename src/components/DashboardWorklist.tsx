"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Activity,
  TrendingDown,
  TrendingUp,
  Minus,
  Search,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";

interface CaseItem {
  id: string;
  caseCode: string;
  ageGroup: string;
  sex: string;
  baselineEgfr: number | null;
  baselineLft: string | null;
  baselineComorbidities: string;
  updatedAt: string | Date;
  consultations: {
    id: string;
    visitDate: string | Date;
    painScore: number;
    chosenDrugId: string;
    chosenDose: string;
    selectedPhenotype: string;
    selectedEtiology: string;
  }[];
  _count: {
    consultations: number;
  };
}

interface DashboardWorklistProps {
  cases: CaseItem[];
  formularyStock: Record<string, boolean>;
}

export function DashboardWorklist({ cases, formularyStock }: DashboardWorklistProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "severe" | "titration" | "improving">("all");
  const [referenceExpanded, setReferenceExpanded] = useState(false);

  // Compute case stats
  const casesWithMetrics = useMemo(() => {
    return cases.map((c) => {
      const visits = c.consultations;
      const initialVisit = visits[0];
      const latestVisit = visits[visits.length - 1];

      const painScore = latestVisit?.painScore ?? 0;
      const initialScore = initialVisit?.painScore ?? painScore;
      const delta = initialScore - painScore; // positive means pain decreased

      const isSevere = painScore >= 7;
      const isImproving = delta > 0;
      const isTitrationDue = visits.length >= 1 && painScore >= 4;
      const isRenalAlert = c.baselineEgfr !== null && c.baselineEgfr < 30;

      return {
        ...c,
        latestVisit,
        initialVisit,
        painScore,
        delta,
        isSevere,
        isImproving,
        isTitrationDue,
        isRenalAlert,
      };
    });
  }, [cases]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: casesWithMetrics.length,
      severe: casesWithMetrics.filter((c) => c.isSevere).length,
      titration: casesWithMetrics.filter((c) => c.isTitrationDue).length,
      improving: casesWithMetrics.filter((c) => c.isImproving).length,
    };
  }, [casesWithMetrics]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return casesWithMetrics.filter((c) => {
      // Tab filter
      if (activeTab === "severe" && !c.isSevere) return false;
      if (activeTab === "titration" && !c.isTitrationDue) return false;
      if (activeTab === "improving" && !c.isImproving) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const codeMatch = c.caseCode.toLowerCase().includes(query);
        const drugMatch = c.latestVisit?.chosenDrugId.toLowerCase().includes(query) ?? false;
        const phenotypeMatch = c.latestVisit?.selectedPhenotype.toLowerCase().includes(query) ?? false;
        const etiologyMatch = c.latestVisit?.selectedEtiology.toLowerCase().includes(query) ?? false;
        return codeMatch || drugMatch || phenotypeMatch || etiologyMatch;
      }

      return true;
    });
  }, [casesWithMetrics, activeTab, searchQuery]);

  const inStockCount = Object.values(formularyStock).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Clinical Workbench Header */}
      <div className="border-b border-slate-200/80 pb-6 pt-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
              Family Medicine CDSS
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
              Active Queue
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-950 mt-1">
            เวชระเบียนและการติดตามผล Neuropathic Pain
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed max-w-3xl">
            ศูนย์ติดตามการตอบสนองต่อการรักษาและปรับขนาดยา (Longitudinal Pain Tracker) อ้างอิงแนวทาง TASP 2020
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/consultation/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.99]"
          >
            <Stethoscope className="h-4 w-4" /> เริ่มประเมินเคสใหม่
          </Link>
          <Link
            href="/settings/formulary"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200/80 shadow-xs transition-all"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
            คลังยา ({inStockCount}/8)
          </Link>
        </div>
      </div>

      {/* Triage Tabs & Search Bar Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-0.5">
          <button
            onClick={() => setActiveTab("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
              activeTab === "all"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
            }`}
          >
            <span>ทั้งหมด</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              activeTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("severe")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
              activeTab === "severe"
                ? "bg-rose-900 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-rose-900 hover:bg-rose-50/50 font-medium"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            <span>ปวดรุนแรง (NRS ≥ 7)</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              activeTab === "severe" ? "bg-white/20 text-white" : "bg-rose-100/70 text-rose-700"
            }`}>
              {counts.severe}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("titration")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
              activeTab === "titration"
                ? "bg-amber-900 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-amber-900 hover:bg-amber-50/50 font-medium"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            <span>ต้องปรับยา (NRS ≥ 4)</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              activeTab === "titration" ? "bg-white/20 text-white" : "bg-amber-100/70 text-amber-800"
            }`}>
              {counts.titration}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("improving")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
              activeTab === "improving"
                ? "bg-emerald-900 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/50 font-medium"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>ตอบสนองดี (ปวดลดลง)</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              activeTab === "improving" ? "bg-white/20 text-white" : "bg-emerald-100/70 text-emerald-800"
            }`}>
              {counts.improving}
            </span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหารหัสเคส, ชื่อยา, อาการ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 transition"
          />
        </div>
      </div>

      {/* Main Clinical Worklist Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-medium">
                <th className="py-3 px-4 font-medium">รหัสเคสผู้ป่วย</th>
                <th className="py-3 px-4 font-medium">ข้อมูลสรีรวิทยา (eGFR / ตับ)</th>
                <th className="py-3 px-4 font-medium">ระดับความปวด & การตอบสนอง</th>
                <th className="py-3 px-4 font-medium">ยาล่าสุดที่แพทย์สั่งจ่าย</th>
                <th className="py-3 px-4 font-medium">ตรวจล่าสุด</th>
                <th className="py-3 px-4 font-medium text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="text-slate-400 font-mono text-xs">ไม่พบเคสผู้ป่วยในหมวดหมู่นี้</div>
                      <p className="text-[11px] text-slate-400">
                        ลองเปลี่ยนคำค้นหา หรือกดเริ่มประเมินเคสใหม่
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const visitsCount = c.consultations.length;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Case Code */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-950 text-xs">
                            {c.caseCode}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {c.sex === "MALE" ? "ชาย" : "หญิง"}, {c.ageGroup} ปี
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {c.latestVisit ? (
                            <span>{c.latestVisit.selectedEtiology} • {c.latestVisit.selectedPhenotype}</span>
                          ) : (
                            <span>ยังไม่มีประวัติการตรวจ</span>
                          )}
                        </div>
                      </td>

                      {/* Physiology / Renal */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-slate-500">eGFR:</span>
                            {c.baselineEgfr !== null ? (
                              <span
                                className={`font-semibold tabular-nums ${
                                  c.baselineEgfr < 30
                                    ? "text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200"
                                    : c.baselineEgfr < 60
                                    ? "text-amber-700"
                                    : "text-slate-900"
                                }`}
                              >
                                {c.baselineEgfr} mL/min
                              </span>
                            ) : (
                              <span className="text-slate-400 font-sans">ไม่ได้ระบุ</span>
                            )}
                          </div>
                          {c.isRenalAlert && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                              <AlertTriangle className="h-3 w-3" /> ไตเสื่อมรุนแรง (Stage 4-5)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pain Score & Trajectory */}
                      <td className="py-3.5 px-4 align-top">
                        {c.latestVisit ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                                  c.painScore >= 7
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : c.painScore >= 4
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                NRS {c.painScore}/10
                              </span>

                              {visitsCount > 1 ? (
                                c.delta > 0 ? (
                                  <span className="inline-flex items-center text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                    <TrendingDown className="h-3 w-3 mr-0.5" /> ลดลง {c.delta} pt
                                  </span>
                                ) : c.delta < 0 ? (
                                  <span className="inline-flex items-center text-[10px] font-mono font-medium text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                                    <TrendingUp className="h-3 w-3 mr-0.5" /> เพิ่มขึ้น {Math.abs(c.delta)} pt
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-[10px] font-mono text-slate-500">
                                    <Minus className="h-3 w-3 mr-0.5" /> คงที่
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] text-slate-400 font-sans">ครั้งแรก (Baseline)</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ตรวจแล้ว {visitsCount} ครั้ง
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Prescribed Drug */}
                      <td className="py-3.5 px-4 align-top">
                        {c.latestVisit ? (
                          <div>
                            <div className="font-semibold text-slate-900 capitalize">
                              {c.latestVisit.chosenDrugId}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {c.latestVisit.chosenDose}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">ยังไม่มียา</span>
                        )}
                      </td>

                      {/* Last Visit Date */}
                      <td className="py-3.5 px-4 align-top font-mono text-slate-600 text-[11px]">
                        {c.latestVisit
                          ? new Date(c.latestVisit.visitDate).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            })
                          : "-"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/consultation/new?caseId=${c.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition"
                            title="บันทึกการตรวจนัดถัดไป"
                          >
                            <Stethoscope className="h-3 w-3" /> ตรวจ
                          </Link>
                          <Link
                            href={`/cases/${c.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
                            title="ดูไทม์ไลน์รักษา"
                          >
                            <Activity className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Docked TASP Clinical Guidance Strip */}
      <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4">
        <div
          onClick={() => setReferenceExpanded(!referenceExpanded)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-900">
              ข้อควรจำทางคลินิกและข้อห้ามใช้เด็ดขาด (TASP 2020 Dosing Pearls & Safety)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
              Guideline Summary
            </span>
          </div>

          <button className="text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1">
            <span>{referenceExpanded ? "ซ่อนรายละเอียด" : "คลิกเพื่อดูแนวทาง"}</span>
            {referenceExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {referenceExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                หลักการเริ่มยา: "Start Low, Go Slow"
              </div>
              <ul className="text-slate-600 space-y-1 pl-4 list-disc text-[11px] leading-relaxed">
                <li><strong>Amitriptyline:</strong> เริ่ม 10 mg HS ค่อยๆ เพิ่มทุก 3-7 วัน (ระวัง Anticholinergic ในผู้สูงอายุ)</li>
                <li><strong>Gabapentin:</strong> เริ่ม 100-300 mg HS ปรับเพิ่มทีละ 100-300 mg ทุก 3 วัน (ไตเสื่อม eGFR &lt;30 ต้องลดยา)</li>
                <li><strong>Pregabalin:</strong> เริ่ม 25-50 mg HS หรือ 75 mg BID ได้ผลเร็วกว่า Gabapentin</li>
                <li><strong>Carbamazepine:</strong> First-line เฉพาะ Trigeminal Neuralgia เริ่ม 100-200 mg BID (ตรวจ Na+ และผื่นแพ้ยา)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-rose-900 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                ข้อห้ามใช้เด็ดขาดที่พบบ่อย (Table 3.1.1)
              </div>
              <ul className="text-rose-950/80 space-y-1 pl-4 list-disc text-[11px] leading-relaxed">
                <li><strong>โรคหัวใจ / เต้นผิดจังหวะ:</strong> ห้ามใช้ TCA (Amitriptyline) เสี่ยง Arrhythmia / QT prolongation</li>
                <li><strong>ความดันโลหิตสูงควบคุมไม่ได้:</strong> ห้ามใช้ Venlafaxine XR (เพิ่มความดันโลหิต)</li>
                <li><strong>ต่อมลูกหมากโต / ต้อหินมุมปิด / สมองเสื่อม:</strong> ห้ามใช้ TCA เพราะฤทธิ์ Anticholinergic สูงสุด</li>
                <li><strong>โรคลมชัก:</strong> ห้ามใช้ Tramadol เด็ดขาด เพราะลด seizure threshold</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

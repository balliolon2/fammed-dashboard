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
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs shadow-emerald-700/20 transition-all active:scale-[0.99]"
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

      {/* Donezo-Inspired 4 Clinical Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Cases */}
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
            activeTab === "all"
              ? "bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white shadow-lg shadow-emerald-950/25 ring-2 ring-emerald-500"
              : "bg-white hover:border-emerald-300 hover:shadow-xs border border-slate-200/80 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span
              className={`text-xs font-bold tracking-tight ${
                activeTab === "all" ? "text-emerald-300" : "text-slate-500"
              }`}
            >
              เคสทั้งหมดในความดูแล
            </span>
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                activeTab === "all" ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
              {counts.all}
            </div>
            <p
              className={`text-[11px] mt-1 truncate ${
                activeTab === "all" ? "text-emerald-200/80" : "text-slate-400"
              }`}
            >
              Active Queue &bull; ติดตามผลต่อเนื่อง
            </p>
          </div>
        </button>

        {/* Card 2: Severe Pain Cases */}
        <button
          type="button"
          onClick={() => setActiveTab("severe")}
          className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
            activeTab === "severe"
              ? "bg-gradient-to-br from-rose-950 via-rose-900 to-rose-800 text-white shadow-lg shadow-rose-950/25 ring-2 ring-rose-500"
              : "bg-white hover:border-rose-300 hover:shadow-xs border border-slate-200/80 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span
              className={`text-xs font-bold tracking-tight ${
                activeTab === "severe" ? "text-rose-300" : "text-slate-500"
              }`}
            >
              ปวดรุนแรง (Severe)
            </span>
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                activeTab === "severe" ? "bg-white/10 text-white" : "bg-rose-50 text-rose-700"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                activeTab === "severe" ? "text-white" : "text-rose-700"
              }`}
            >
              {counts.severe}
            </div>
            <p
              className={`text-[11px] mt-1 truncate ${
                activeTab === "severe" ? "text-rose-200/80" : "text-slate-400"
              }`}
            >
              NRS ≥ 7 &bull; ต้องการดูแลเร่งด่วน
            </p>
          </div>
        </button>

        {/* Card 3: Titration Due */}
        <button
          type="button"
          onClick={() => setActiveTab("titration")}
          className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
            activeTab === "titration"
              ? "bg-gradient-to-br from-amber-950 via-amber-900 to-amber-800 text-white shadow-lg shadow-amber-950/25 ring-2 ring-amber-500"
              : "bg-white hover:border-amber-300 hover:shadow-xs border border-slate-200/80 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span
              className={`text-xs font-bold tracking-tight ${
                activeTab === "titration" ? "text-amber-300" : "text-slate-500"
              }`}
            >
              ต้องปรับขนาดยา
            </span>
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                activeTab === "titration" ? "bg-white/10 text-white" : "bg-amber-50 text-amber-700"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                activeTab === "titration" ? "text-white" : "text-amber-700"
              }`}
            >
              {counts.titration}
            </div>
            <p
              className={`text-[11px] mt-1 truncate ${
                activeTab === "titration" ? "text-amber-200/80" : "text-slate-400"
              }`}
            >
              NRS ≥ 4 &bull; ควรพิจารณาไตเตรทยารักษา
            </p>
          </div>
        </button>

        {/* Card 4: Improving */}
        <button
          type="button"
          onClick={() => setActiveTab("improving")}
          className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
            activeTab === "improving"
              ? "bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-800 text-white shadow-lg shadow-emerald-950/25 ring-2 ring-emerald-400"
              : "bg-white hover:border-emerald-300 hover:shadow-xs border border-slate-200/80 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span
              className={`text-xs font-bold tracking-tight ${
                activeTab === "improving" ? "text-emerald-200" : "text-slate-500"
              }`}
            >
              ตอบสนองดี (Improved)
            </span>
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                activeTab === "improving" ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                activeTab === "improving" ? "text-white" : "text-emerald-700"
              }`}
            >
              {counts.improving}
            </div>
            <p
              className={`text-[11px] mt-1 truncate ${
                activeTab === "improving" ? "text-emerald-200/80" : "text-slate-400"
              }`}
            >
              ระดับคะแนนความปวดลดลง
            </p>
          </div>
        </button>
      </div>

      {/* Filter Status Strip & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">มุมมองปัจจุบัน:</span>
          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
            {activeTab === "all" && "เคสทั้งหมด"}
            {activeTab === "severe" && "ปวดรุนแรง (NRS ≥ 7)"}
            {activeTab === "titration" && "ต้องปรับยา (NRS ≥ 4)"}
            {activeTab === "improving" && "ตอบสนองดี (ปวดลดลง)"}
          </span>
          <span className="text-slate-400 text-[11px]">({filteredCases.length} เคส)</span>
          {activeTab !== "all" && (
            <button
              onClick={() => setActiveTab("all")}
              className="text-xs text-emerald-700 hover:underline font-semibold ml-1 cursor-pointer"
            >
              ดูทั้งหมด
            </button>
          )}
        </div>

        {/* Search Box */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหารหัสเคส, ชื่อยา, อาการปวด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200/90 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
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

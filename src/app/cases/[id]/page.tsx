import Link from "next/link";
import { notFound } from "next/navigation";
import { getCaseDetail } from "@/app/actions";
import {
  Activity,
  Calendar,
  Pill,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Stethoscope,
} from "lucide-react";

export default async function CaseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const patientCase = await getCaseDetail(params.id);

  if (!patientCase) {
    notFound();
  }

  const visits = patientCase.consultations;
  const initialVisit = visits[0];
  const latestVisit = visits[visits.length - 1];

  // Calculate pain reduction delta
  const painDelta =
    initialVisit && latestVisit && visits.length > 1
      ? initialVisit.painScore - latestVisit.painScore
      : 0;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/cases"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="h-4 w-4" /> ย้อนกลับไปหน้ารวมเคส
      </Link>

      {/* Case Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
            {patientCase.caseCode.split("-").slice(-1)[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{patientCase.caseCode}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                De-identified Case
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              เพศ {patientCase.sex === "MALE" ? "ชาย" : "หญิง"} • ช่วงอายุ {patientCase.ageGroup} ปี • Baseline eGFR:{" "}
              {patientCase.baselineEgfr ? `${patientCase.baselineEgfr} mL/min` : "ไม่ได้ระบุ"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/consultation/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Stethoscope className="h-4 w-4" /> บันทึกการตรวจนัดถัดไป
          </Link>
        </div>
      </div>

      {/* Pain Trajectory Sparkline / Summary */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-500" />
              กราฟแนวโน้มระดับความปวด (Pain Score NRS Trajectory)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามการตอบสนองต่อการรักษาและการ Titrate ยาตามเวลา (Longitudinal Follow-up)
            </p>
          </div>

          {visits.length > 1 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                ความปวดลดลง {painDelta} คะแนน (จาก {initialVisit.painScore} เหลือ {latestVisit.painScore})
              </span>
            </div>
          )}
        </div>

        {/* Visual Pain Trend Points */}
        <div className="pt-2 pb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-0"></div>
            {visits.map((v, idx) => (
              <div key={v.id} className="relative z-10 flex flex-col items-center">
                <span
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md ${
                    v.painScore >= 7
                      ? "bg-rose-600"
                      : v.painScore >= 4
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                >
                  {v.painScore}
                </span>
                <span className="text-[10px] font-semibold text-slate-700 mt-1.5">
                  Visit #{idx + 1}
                </span>
                <span className="text-[9px] text-slate-400">
                  {new Date(v.visitDate).toLocaleDateString("th-TH", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chronological Visits List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          ประวัติการตรวจรักษาทั้งหมด ({visits.length} ครั้ง)
        </h3>

        {visits.map((visit, index) => (
          <div
            key={visit.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
                  #{index + 1}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    ตรวจเมื่อ: {new Date(visit.visitDate).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Phenotype: {visit.selectedPhenotype} • สาเหตุ: {visit.selectedEtiology}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    visit.painScore >= 7
                      ? "bg-rose-100 text-rose-700"
                      : visit.painScore >= 4
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  NRS {visit.painScore} / 10
                </span>
              </div>
            </div>

            {/* Prescribed Drug Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-slate-400 text-[10px]">ยาและขนาดที่แพทย์สั่งจ่าย:</div>
                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Pill className="h-4 w-4 text-blue-600" />
                  <span className="capitalize">{visit.chosenDrugId}</span> — {visit.chosenDose}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-slate-400 text-[10px]">เหตุผลทางคลินิก (Clinical Rationale):</div>
                <div className="text-slate-700 mt-0.5 italic">
                  &ldquo;{visit.clinicalRationale || "สั่งจ่ายตามคำแนะนำมาตรฐานของระบบ"}&rdquo;
                </div>
              </div>
            </div>

            {/* View SOAP Accordion */}
            <details className="text-xs pt-1">
              <summary className="text-blue-600 hover:underline font-semibold cursor-pointer select-none">
                ดูบันทึกเวชระเบียน SOAP Note ของครั้งนี้
              </summary>
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto">
                <pre className="text-[11px] font-mono whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {visit.soapNote}
                </pre>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

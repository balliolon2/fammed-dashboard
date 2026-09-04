import Link from "next/link";
import { notFound } from "next/navigation";
import { getCaseDetail } from "@/app/actions";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Pill,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";

export const dynamic = "force-dynamic";

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
      <div>
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> ย้อนกลับไปทะเบียนเคส
        </Link>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-xs font-mono">
            {patientCase.caseCode.split("-").slice(-1)[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-950 font-mono tracking-tight">
                {patientCase.caseCode}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                De-identified Profile
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              เพศ {patientCase.sex === "MALE" ? "ชาย" : "หญิง"} &bull; ช่วงอายุ {patientCase.ageGroup} ปี &bull; Baseline eGFR:{" "}
              <span className="font-mono font-semibold text-slate-800">
                {patientCase.baselineEgfr ? `${patientCase.baselineEgfr} mL/min` : "ไม่ได้ระบุ"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/consultation/new?caseId=${patientCase.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition active:scale-[0.99]"
          >
            <Stethoscope className="h-4 w-4" /> บันทึกการตรวจนัดถัดไป
          </Link>
        </div>
      </div>

      {/* Longitudinal Pain Trajectory Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xs font-bold text-slate-950 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="h-4 w-4 text-rose-600" />
              แนวโน้มระดับความปวดต่อเนื่อง (Longitudinal Pain Trajectory)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกคะแนนความปวด NRS (0-10) ในแต่ละครั้งของการตรวจรักษาและการ Titrate ยา
            </p>
          </div>

          {visits.length > 1 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                ความปวดลดลง <strong className="font-mono">{painDelta}</strong> คะแนน (จาก {initialVisit.painScore} เหลือ {latestVisit.painScore})
              </span>
            </div>
          )}
        </div>

        {/* Visual Pain Trend Points */}
        <div className="pt-4 pb-4 px-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-slate-200 -z-0"></div>
            {visits.map((v, idx) => (
              <div key={v.id} className="relative z-10 flex flex-col items-center">
                <span
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs font-mono ring-4 ring-white ${
                    v.painScore >= 7
                      ? "bg-rose-600"
                      : v.painScore >= 4
                      ? "bg-amber-600"
                      : "bg-emerald-600"
                  }`}
                >
                  {v.painScore}
                </span>
                <span className="text-xs font-semibold text-slate-900 mt-1.5 font-mono">
                  Visit #{idx + 1}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(v.visitDate).toLocaleDateString("th-TH", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-[10px] text-slate-600 font-medium capitalize mt-0.5">
                  {v.chosenDrugId}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chronological Visits List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          ประวัติการตรวจรักษาทั้งหมด ({visits.length} ครั้ง)
        </h2>

        {visits.map((visit, index) => (
          <div
            key={visit.id}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="h-6 w-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-mono">
                  #{index + 1}
                </span>
                <div>
                  <div className="text-xs font-semibold text-slate-950">
                    ตรวจเมื่อ: {new Date(visit.visitDate).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Phenotype: {visit.selectedPhenotype} &bull; สาเหตุ: {visit.selectedEtiology}
                  </div>
                </div>
              </div>

              <div>
                <span
                  className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                    visit.painScore >= 7
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : visit.painScore >= 4
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  NRS {visit.painScore} / 10
                </span>
              </div>
            </div>

            {/* Prescribed Drug Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-xs">ยาและขนาดที่แพทย์สั่งจ่าย:</div>
                <div className="font-semibold text-slate-950 mt-1 flex items-center gap-1.5">
                  <Pill className="h-4 w-4 text-slate-700" />
                  <span className="capitalize">{visit.chosenDrugId}</span> ({visit.chosenDose})
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-xs">เหตุผลทางคลินิก (Clinical Rationale):</div>
                <div className="text-slate-700 mt-1 italic text-xs leading-relaxed">
                  &ldquo;{visit.clinicalRationale || "สั่งจ่ายตามคำแนะนำมาตรฐานของระบบ"}&rdquo;
                </div>
              </div>
            </div>

            {/* View SOAP Accordion */}
            <details className="text-xs pt-1">
              <summary className="text-slate-600 hover:text-slate-950 font-medium cursor-pointer select-none">
                ดูบันทึกเวชระเบียน SOAP Note ของครั้งนี้
              </summary>
              <div className="mt-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap text-slate-900 leading-relaxed">
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

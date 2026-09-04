import Link from "next/link";
import { getPatientCases } from "@/app/actions";
import { User, Activity, Calendar, ArrowRight, Plus, Stethoscope } from "lucide-react";

export default async function CasesPage() {
  const cases = await getPatientCases();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">ทะเบียนเคสผู้ป่วย (Patient Cases Directory)</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              {cases.length} เคสทั้งหมด
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ข้อมูลแบบ De-identified ตาม PDPA • จัดเก็บประวัติการรักษาและการติดตามอาการปวดต่อเนื่อง
          </p>
        </div>

        <Link
          href="/consultation/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="h-4 w-4" /> ประเมินผู้ป่วยรายใหม่
        </Link>
      </div>

      {/* Cases List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cases.map((c) => {
          const latestVisit = c.consultations[0];
          const comorbs: string[] = JSON.parse(c.baselineComorbidities || "[]");

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs">
                      {c.caseCode.split("-").slice(-1)[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{c.caseCode}</h3>
                      <div className="text-xs text-slate-500">
                        {c.sex === "MALE" ? "ชาย" : "หญิง"} • ช่วงอายุ {c.ageGroup} ปี
                      </div>
                    </div>
                  </div>

                  {latestVisit && (
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        latestVisit.painScore >= 7
                          ? "bg-rose-100 text-rose-700"
                          : latestVisit.painScore >= 4
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      NRS {latestVisit.painScore}/10
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Baseline eGFR:</span>
                    <span className="font-semibold text-slate-800">
                      {c.baselineEgfr ? `${c.baselineEgfr} mL/min` : "ไม่ได้ระบุ"}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>จำนวนครั้งที่ตรวจ (Visits):</span>
                    <span className="font-semibold text-slate-800">{c._count.consultations} ครั้ง</span>
                  </div>

                  {latestVisit && (
                    <div className="flex justify-between text-slate-600">
                      <span>ยาล่าสุดที่สั่ง:</span>
                      <span className="font-semibold text-blue-700">
                        {latestVisit.chosenDrugId} ({latestVisit.chosenDose})
                      </span>
                    </div>
                  )}

                  {comorbs.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {comorbs.map((comId, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                        >
                          {comId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Link
                  href={`/cases/${c.id}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold text-center border border-slate-200 transition flex items-center justify-center gap-1.5"
                >
                  <Activity className="h-3.5 w-3.5 text-blue-600" /> ไทม์ไลน์รักษา
                </Link>
                <Link
                  href={`/consultation/new`}
                  className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold text-center border border-blue-200 transition"
                  title="ประเมินนัดใหม่"
                >
                  <Stethoscope className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

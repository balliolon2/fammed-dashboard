import Link from "next/link";
import { getPatientCases } from "@/app/actions";
import { Stethoscope, Activity, Plus, ArrowRight, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const cases = await getPatientCases();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
              Registry
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {cases.length} Total Cases
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-950 mt-1">
            ทะเบียนประวัติผู้ป่วย (Patient Cases Directory)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ข้อมูลเวชระเบียนจัดเก็บแบบ De-identified ตามข้อกำหนด PDPA สำหรับติดตามการตอบสนองต่อยาแก้ปวดระยะยาว
          </p>
        </div>

        <Link
          href="/consultation/new"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" /> ประเมินผู้ป่วยรายใหม่
        </Link>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-medium">
                <th className="py-3 px-4 font-medium">รหัสเคส (Case Reference)</th>
                <th className="py-3 px-4 font-medium">ข้อมูลประชากร</th>
                <th className="py-3 px-4 font-medium">Baseline eGFR</th>
                <th className="py-3 px-4 font-medium">ระดับความปวดล่าสุด</th>
                <th className="py-3 px-4 font-medium">ยาล่าสุดที่สั่ง</th>
                <th className="py-3 px-4 font-medium">จำนวนตรวจ</th>
                <th className="py-3 px-4 font-medium text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    ยังไม่มีข้อมูลเคสผู้ป่วยในระบบ
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const visits = c.consultations;
                  const latestVisit = visits[visits.length - 1];
                  const comorbs: string[] = JSON.parse(c.baselineComorbidities || "[]");

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-950 text-xs">
                        <Link href={`/cases/${c.id}`} className="hover:underline flex items-center gap-1.5">
                          <span>{c.caseCode}</span>
                          <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        {c.sex === "MALE" ? "ชาย" : "หญิง"}, {c.ageGroup} ปี
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {c.baselineEgfr ? (
                          <span className={c.baselineEgfr < 30 ? "text-rose-700 font-semibold" : "text-slate-800"}>
                            {c.baselineEgfr} mL/min
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {latestVisit ? (
                          <span
                            className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                              latestVisit.painScore >= 7
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : latestVisit.painScore >= 4
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            NRS {latestVisit.painScore}/10
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {latestVisit ? (
                          <div>
                            <span className="font-semibold capitalize text-slate-900">
                              {latestVisit.chosenDrugId}
                            </span>{" "}
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({latestVisit.chosenDose})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {c._count.consultations} ครั้ง
                      </td>

                      <td className="py-3.5 px-4 text-right">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
                            title="ดูไทม์ไลน์รักษา"
                          >
                            <Activity className="h-3 w-3" /> ไทม์ไลน์
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
    </div>
  );
}

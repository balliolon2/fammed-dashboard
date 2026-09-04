import Link from "next/link";
import { getPatientCases, getClinicFormulary } from "@/app/actions";
import { DRUGS } from "@/lib/cdss/data";
import {
  Stethoscope,
  Users,
  Activity,
  Pill,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default async function DashboardPage() {
  const [cases, formularyStock] = await Promise.all([
    getPatientCases(),
    getClinicFormulary(),
  ]);

  const totalVisits = cases.reduce((acc, c) => acc + c._count.consultations, 0);
  const inStockCount = DRUGS.filter((d) => formularyStock[d.id] ?? true).length;

  // Recent consultations across all cases
  const recentVisits: any[] = [];
  cases.forEach((c) => {
    c.consultations.forEach((v: any) => {
      recentVisits.push({ ...v, caseCode: c.caseCode, caseId: c.id });
    });
  });
  recentVisits.sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg shadow-blue-900/10">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" /> เวชปฏิบัติครอบครัวและคลินิกปฐมภูมิ (FamMed Primary Care)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-snug">
            ระบบช่วยตัดสินใจและติดตามการรักษา Neuropathic Pain
          </h1>
          <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
            อ้างอิงแนวทางเวชปฏิบัติ Clinical Guidance for Neuropathic Pain 2020 โดยสมาคมการศึกษาเรื่องความปวดแห่งประเทศไทย (TASP)
            เปลี่ยนจากการลองผิดลองถูก สู่การเลือกยาตาม Mechanism, Phenotype, และโรคร่วมอย่างปลอดภัย
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/consultation/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold shadow-md transition"
            >
              <Stethoscope className="h-4 w-4" /> เริ่มประเมินคนไข้เคสใหม่
            </Link>
            <Link
              href="/cases"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition"
            >
              <Users className="h-4 w-4" /> ทะเบียนเคสทั้งหมด ({cases.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">เคสผู้ป่วยทั้งหมด</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{cases.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">De-identified Patient Cases</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">การตรวจสะสม (Visits)</span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{totalVisits}</div>
          <div className="text-[10px] text-slate-400 mt-1">Longitudinal Encounters</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">คลังยาคลินิก</span>
            <Pill className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {inStockCount} <span className="text-xs font-normal text-slate-400">/ 8 ชนิด</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-semibold">พร้อมจ่ายตาม Formulary</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">เกณฑ์มาตรฐาน</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">TASP 2020</div>
          <div className="text-[10px] text-slate-400 mt-1">Thai Guideline Reference</div>
        </div>
      </div>

      {/* Main Content Grid: Recent Consultations & Clinical Pearls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Consultations */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">การประเมินล่าสุด (Recent Consultations)</h2>
              <p className="text-xs text-slate-400 mt-0.5">ประวัติการตรวจรักษาและ Pain score ล่าสุด</p>
            </div>
            <Link href="/cases" className="text-xs text-blue-600 font-semibold hover:underline">
              ดูทั้งหมด
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentVisits.slice(0, 5).map((visit) => (
              <div key={visit.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {visit.caseCode.split("-").slice(-1)[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{visit.caseCode}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          visit.painScore >= 7
                            ? "bg-rose-100 text-rose-700"
                            : visit.painScore >= 4
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        NRS {visit.painScore}/10
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ยาที่สั่ง: <span className="font-semibold text-slate-700 capitalize">{visit.chosenDrugId}</span> ({visit.chosenDose})
                    </div>
                  </div>
                </div>

                <Link
                  href={`/cases/${visit.caseId}`}
                  className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition font-medium"
                >
                  ดูเคส <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Clinical Pearls & Safety Rules */}
        <div className="lg:col-span-5 space-y-4">
          {/* TASP Titration Pearls */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-md space-y-3">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold tracking-widest uppercase">Dosing Pearls • TASP 2020</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="font-semibold text-blue-200">เริ่ม Low, Go Slow ในผู้สูงอายุ</div>
                <p className="mt-1 text-[11px] text-slate-300">
                  Amitriptyline เริ่ม 10 mg HS (เพิ่มทุก 3–7 วัน) • Gabapentin 100–300 mg HS • Pregabalin 25–50 mg HS
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="font-semibold text-emerald-200">DPN + นอนไม่หลับ หรือ ซึมเศร้า</div>
                <p className="mt-1 text-[11px] text-slate-300">
                  เลือก Amitriptyline (ช่วยนอนหลับ) หรือ Duloxetine 60 mg (แก้ปวด + ซึมเศร้า) • ถ้าไตเสื่อม eGFR &lt;30 ให้เลี่ยง Gabapentin ขนาดสูง
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="font-semibold text-amber-200">Trigeminal Neuralgia (TGN)</div>
                <p className="mt-1 text-[11px] text-slate-300">
                  Carbamazepine 100–200 mg BID เป็น First-line อันดับหนึ่ง • ระวังตรวจ Na+ และอาการผื่นแพ้ยา HLA-B*15:02
                </p>
              </div>
            </div>
          </div>

          {/* Comorbidity Red Flags Card */}
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>ข้อห้ามใช้เด็ดขาดที่พบบ่อย (Table 3.1.1)</span>
            </div>
            <ul className="text-[11px] text-rose-900/90 space-y-1 pl-4 list-disc">
              <li><strong>โรคหัวใจ / เต้นผิดจังหวะ:</strong> ห้ามใช้ TCA (Amitriptyline) เด็ดขาด เสี่ยง Arrhythmia / QT prolongation</li>
              <li><strong>ความดันสูงควบคุมไม่ได้:</strong> ห้ามใช้ Venlafaxine XR (เพิ่มความดันโลหิตแบบ dose-dependent)</li>
              <li><strong>ต่อมลูกหมากโต / ต้อหินมุมปิด / สมองเสื่อม:</strong> ห้ามใช้ TCA เพราะฤทธิ์ Anticholinergic สูงสุด</li>
              <li><strong>โรคลมชัก:</strong> ห้ามใช้ Tramadol เด็ดขาด เพราะลด seizure threshold รุนแรง</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

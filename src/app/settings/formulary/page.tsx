"use client";

import { useEffect, useState, useTransition } from "react";
import { DRUGS } from "@/lib/cdss/data";
import { getClinicFormulary, toggleFormularyStock } from "@/app/actions";
import { Pill, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

export default function FormularyPage() {
  const [stockMap, setStockMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const stock = await getClinicFormulary();
      setStockMap(stock);
      setLoading(false);
    }
    load();
  }, []);

  const handleToggle = (drugId: string) => {
    const current = stockMap[drugId] ?? true;
    const updated = !current;

    setStockMap((prev) => ({ ...prev, [drugId]: updated }));

    startTransition(async () => {
      const res = await toggleFormularyStock(drugId, updated);
      if (res.success) {
        const drug = DRUGS.find((d) => d.id === drugId);
        setToastMessage(`อัปเดตสถานะ ${drug?.name} เป็น ${updated ? "มีในคลัง (In-Stock)" : "ไม่มีในคลัง (Out-of-Stock)"}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    });
  };

  const inStockCount = DRUGS.filter((d) => stockMap[d.id] ?? true).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">คลังยา Neuropathic Pain ประจำคลินิก (Formulary)</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดสถานะความพร้อมของยา 8 ชนิดตามแนวทาง TASP 2020 เพื่อให้ระบบ CDSS แนะนำยาที่เบิกจ่ายได้จริง
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          <div className="text-right">
            <div className="text-xs text-slate-500">สถานะคลังยาปัจจุบัน</div>
            <div className="text-sm font-bold text-slate-800">
              มีในคลัง <span className="text-emerald-600">{inStockCount}</span> / 8 ชนิด
            </div>
          </div>
          {isPending && <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />}
        </div>
      </div>

      {/* Guidance Alert */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-blue-900">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">ผลกระทบต่อระบบคำนวณ (CDSS):</span>{" "}
          หากยาตัวใดถูกปิดสถานะเป็น "ไม่มีในคลัง" ระบบจะยังคงแสดงในรายการเพื่อความสมบูรณ์ทางวิชาการ แต่จะมีป้ายสีส้มเตือนว่า{" "}
          <span className="font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">Out-of-Stock</span> และจะถูกลดอันดับลง
          เพื่อให้ยาตัวเลือกแรก (First-line) ที่มีในคลังถูกคัดเลือกขึ้นเป็น Top Recommendation แทน
        </div>
      </div>

      {/* Drug List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DRUGS.map((drug) => {
          const inStock = stockMap[drug.id] ?? true;
          return (
            <div
              key={drug.id}
              className={`rounded-2xl border p-5 transition-all bg-white ${
                inStock ? "border-slate-200 shadow-sm" : "border-slate-200/60 bg-slate-50/50 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{drug.name}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {drug.mech}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{drug.mechTh}</p>
                </div>

                {/* Switch Toggle */}
                <button
                  onClick={() => handleToggle(drug.id)}
                  disabled={loading || isPending}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    inStock ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={inStock}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      inStock ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <div className="text-slate-600">
                  <span className="text-slate-400">ขนาดแนะนำ:</span>{" "}
                  <span className="font-medium text-slate-700">{drug.startingDose}</span>
                </div>
                <div>
                  {inStock ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> มีพร้อมจ่ายในคลินิก
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" /> ยาหมด / ไม่มีในคลัง
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

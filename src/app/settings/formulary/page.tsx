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
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-800 flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 pt-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
              Clinic Pharmacy
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {inStockCount} / 8 In-Stock
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-950 mt-1">
            คลังยา Neuropathic Pain ประจำคลินิก (Clinic Formulary)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดสถานะความพร้อมของยา 8 ชนิดตามแนวทาง TASP 2020 เพื่อให้ระบบ CDSS คัดเลือกยาตัวเลือกแรกที่มีพร้อมจ่ายจริง
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-right">
            <div className="text-[10px] text-slate-500">สถานะคลังยาปัจจุบัน</div>
            <div className="text-xs font-bold text-slate-900 font-mono">
              พร้อมจ่าย <span className="text-emerald-600">{inStockCount}</span> / 8 ชนิด
            </div>
          </div>
          {isPending && <RefreshCw className="h-4 w-4 text-slate-600 animate-spin" />}
        </div>
      </div>

      {/* Guidance Alert */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-700">
        <ShieldCheck className="h-5 w-5 text-slate-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-950">ผลต่อระบบตัดสินใจ (CDSS Engine):</span>{" "}
          หากยาตัวใดถูกปิดสถานะเป็น "ไม่มีในคลัง" ระบบจะลดอันดับลงและแจ้งเตือนป้าย{" "}
          <span className="font-mono text-amber-800 bg-amber-100/60 border border-amber-200 px-1 py-0.2 rounded text-[11px]">Out-of-Stock</span>{" "}
          เพื่อให้ยา First-line ทางเลือกอื่นที่มีพร้อมจ่ายในคลินิกถูกแนะนำขึ้นมาแทน
        </div>
      </div>

      {/* Structured Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-medium">
                <th className="py-3 px-4 font-medium">ชื่อยา (Generic Name)</th>
                <th className="py-3 px-4 font-medium">กลุ่มยา / กลไกออกฤทธิ์</th>
                <th className="py-3 px-4 font-medium">ขนาดเริ่มต้นแนะนำ</th>
                <th className="py-3 px-4 font-medium">สถานะจ่ายยาในคลินิก</th>
                <th className="py-3 px-4 font-medium text-right">เปิด/ปิดในคลัง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DRUGS.map((drug) => {
                const inStock = stockMap[drug.id] ?? true;
                return (
                  <tr key={drug.id} className={`transition-colors ${inStock ? "hover:bg-slate-50/70" : "bg-slate-50/40 opacity-70"}`}>
                    <td className="py-3.5 px-4 font-bold text-slate-950 text-xs">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-slate-600" />
                        <span>{drug.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{drug.mech}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{drug.mechTh}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {drug.startingDose}
                    </td>

                    <td className="py-3.5 px-4">
                      {inStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 className="h-3 w-3" /> มีพร้อมจ่ายในคลินิก
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          <AlertCircle className="h-3 w-3" /> ยาหมด / ไม่มีในคลัง
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggle(drug.id)}
                        disabled={loading || isPending}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          inStock ? "bg-slate-950" : "bg-slate-300"
                        }`}
                        role="switch"
                        aria-checked={inStock}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            inStock ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

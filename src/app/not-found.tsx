import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
      <div className="h-14 w-14 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
        <FileQuestion className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">ไม่พบหน้าที่ค้นหา (404)</h2>
      <p className="text-xs text-slate-500 max-w-md">
        ไม่พบแฟ้มเคสหรือหน้าที่ต้องการในระบบ กรุณาตรวจสอบรหัสเคสหรือกลับไปที่หน้าหลัก
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" /> กลับสู่หน้าแดชบอร์ด
      </Link>
    </div>
  );
}

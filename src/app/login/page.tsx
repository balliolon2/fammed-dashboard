"use client";

import { useEffect, useState } from "react";
import { getAllClinicians } from "@/app/actions";
import { signIn } from "next-auth/react";
import { ShieldCheck, ArrowRight, UserCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [clinicians, setClinicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const list = await getAllClinicians();
      setClinicians(list);
      setLoading(false);
    }
    load();
  }, []);

  const handleGoogleSignIn = () => {
    setSigningIn("google");
    signIn("google", { callbackUrl: "/" });
  };

  const handleSelectClinician = (userId: string) => {
    setSigningIn(userId);
    signIn("clinician-credentials", {
      clinicianId: userId,
      callbackUrl: "/",
    });
  };

  const showDemoLogin = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== "false";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-slate-950 text-white flex items-center justify-center mx-auto shadow-xs font-mono font-bold text-sm tracking-tight">
            FM
          </div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">FamMed CDSS</h1>
          <p className="text-xs text-slate-500">
            ระบบสนับสนุนการตัดสินใจเวชปฏิบัติครอบครัว &bull; เข้าสู่ระบบสำหรับบุคลากรทางการแพทย์
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          {/* Production OAuth Section */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-slate-700" />
              <span>เข้าสู่ระบบด้วยบัญชีองค์กร (Production SSO)</span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn !== null}
              className="w-full py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50"
            >
              {signingIn === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>
                {signingIn === "google"
                  ? "กำลังเชื่อมต่อไปยัง Google..."
                  : "เข้าสู่ระบบด้วย Google Workspace"}
              </span>
            </button>
          </div>

          {showDemoLogin && (
            <>
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] text-slate-400 font-medium absolute">หรือทดสอบด้วยแพทย์จำลอง</span>
              </div>

              {/* Quick Clinician Switcher */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-slate-700" />
                    <span>เข้าสู่ระบบด่วนเฉพาะแพทย์ตัวอย่าง (Demo OPD)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                    Demo Mode
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  เลือกโปรไฟล์แพทย์จำลองเพื่อทดสอบระบบ (แพทย์จริงต้องเข้าสู่ระบบด้วย Google Workspace เท่านั้น)
                </p>

                <div className="space-y-2">
                  {loading ? (
                    <div className="text-xs text-center py-4 text-slate-400">กำลังโหลดรายชื่อแพทย์...</div>
                  ) : (
                    clinicians.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectClinician(c.id)}
                        disabled={signingIn !== null}
                        className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition flex items-center justify-between group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center group-hover:bg-slate-800 transition">
                            {signingIn === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : c.name.includes("สมชาย") ? (
                              "สม"
                            ) : (
                              "รัต"
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition">
                              {c.name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {c.clinic?.name || "คลินิกเวชปฏิบัติครอบครัว"}
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Security Footer Notice */}
        <div className="text-center text-[10px] text-slate-400 leading-relaxed">
          ระบบมีการรักษาความปลอดภัยของข้อมูลผู้ป่วยตามข้อกำหนด PDPA <br />
          ข้อมูลเคสทั้งหมดจัดเก็บในรูปแบบ De-identified Case Records
        </div>
      </div>
    </div>
  );
}

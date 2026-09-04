"use client";

import { useEffect, useState } from "react";
import { getAllClinicians } from "@/app/actions";
import { signIn } from "next-auth/react";
import {
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Loader2,
  Stethoscope,
  Activity,
  CheckCircle2,
  Lock,
  FileCheck2,
  ChevronRight,
} from "lucide-react";

export default function LoginPage() {
  const [clinicians, setClinicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"sso" | "demo">("sso");

  useEffect(() => {
    async function load() {
      try {
        const list = await getAllClinicians();
        setClinicians(list || []);
      } catch (err) {
        console.error("Failed to load clinicians:", err);
      } finally {
        setLoading(false);
      }
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
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-between overflow-hidden">
      {/* Background Ambient Glows inspired by modern design systems */}
      <div className="absolute top-1/4 right-5 sm:right-16 w-80 sm:w-96 h-80 sm:h-96 bg-sky-400/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-72 sm:w-80 h-72 sm:h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-16 right-10 sm:right-32 w-80 sm:w-96 h-80 sm:h-96 bg-violet-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-rose-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Split Hero Content */}
      <div className="w-full max-w-7xl mx-auto py-6 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Editorial Clinical Typography & Authentication */}
          <div className="lg:col-span-7 space-y-7">
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/[0.04] border border-slate-900/10 text-xs font-medium text-slate-700 shadow-2xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold tracking-tight">TASP 2020 Clinical Guidance</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-500">Family Medicine CDSS</span>
            </div>

            {/* Headline with High Editorial Presence */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-slate-950 tracking-tight leading-[1.12]">
                ระบบสนับสนุนการตัดสินใจ <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-950 via-slate-800 to-sky-700">
                  เวชปฏิบัติครอบครัว
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                ยกระดับการประเมินและวางแผนการรักษาผู้ป่วย Neuropathic Pain ในคลินิกบริการปฐมภูมิ
                ด้วยระบบแนะนำยาตามฟีโนไทป์อาการ คัดกรองข้อห้ามใช้และอันตรกิริยาระหว่างยาอัตโนมัติ
              </p>
            </div>

            {/* Quick Clinical Value Badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>TASP 2020 Protocol</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200/80 shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                <span>Automated DDI & Safety Filter</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200/80 shadow-2xs">
                <Activity className="h-3.5 w-3.5 text-indigo-600" />
                <span>Longitudinal Consultation Tracking</span>
              </div>
            </div>

            {/* Modern Authentication Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xl shadow-slate-200/40 max-w-lg space-y-6">
              {/* Segmented Mode Selector */}
              {showDemoLogin && (
                <div className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAuthMode("sso")}
                    className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-2 ${
                      authMode === "sso"
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/70 font-bold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>บัญชีองค์กร (SSO)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("demo")}
                    className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-2 ${
                      authMode === "demo"
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/70 font-bold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>แพทย์จำลอง (Demo OPD)</span>
                  </button>
                </div>
              )}

              {/* Mode 1: Production Google SSO */}
              {authMode === "sso" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      เข้าสู่ระบบสำหรับบุคลากรทางการแพทย์
                    </h3>
                    <p className="text-xs text-slate-500">
                      ใช้งานด้วยบัญชี Google Workspace ของโรงพยาบาลหรือหน่วยบริการปฐมภูมิ
                    </p>
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={signingIn !== null}
                    className="w-full py-3 px-5 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-semibold transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
                  >
                    {signingIn === "google" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                    ) : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
                    <ArrowRight className="h-4 w-4 ml-1 opacity-70" />
                  </button>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span>การเชื่อมต่อปลอดภัยระดับ TLS 1.3 พร้อมการคุ้มครองข้อมูล PDPA</span>
                  </div>
                </div>
              )}

              {/* Mode 2: Demo OPD Clinicians */}
              {authMode === "demo" && showDemoLogin && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-slate-900">
                        เลือกโปรไฟล์แพทย์สำหรับทดสอบ
                      </h3>
                      <p className="text-xs text-slate-500">
                        จำลองบทบาทแพทย์ประจำคลินิกเพื่อทดสอบการประเมินเคส
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200 shrink-0">
                      Demo OPD
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {loading ? (
                      <div className="text-xs text-center py-6 text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>กำลังโหลดรายชื่อแพทย์จำลอง...</span>
                      </div>
                    ) : (
                      clinicians.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectClinician(c.id)}
                          disabled={signingIn !== null}
                          className="w-full text-left p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-400 hover:bg-slate-50/80 active:scale-[0.99] transition-all flex items-center justify-between group disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-slate-950 text-white font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-slate-800 transition shadow-xs">
                              {signingIn === c.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                              ) : c.name.includes("สมชาย") ? (
                                "สม"
                              ) : (
                                "รัต"
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-slate-950 transition truncate">
                                {c.name}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                                <span>{c.clinic?.name || "คลินิกเวชปฏิบัติครอบครัว"}</span>
                                <span className="text-slate-300">&bull;</span>
                                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {c.role === "ADMIN" ? "Staff" : "Resident"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* PDPA & Confidentiality Badge */}
              <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 leading-normal">
                <FileCheck2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  ข้อมูลเคสผู้ป่วยจัดเก็บในรูปแบบ <strong>De-identified Records</strong>{" "}
                  ไม่ระบุตัวตนบุคคล ตามข้อกำหนด PDPA สำหรับการตัดสินใจทางคลินิก
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Isometric Medical Tech Wireframe Graphic (Inspired by Ionic) */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-6 lg:pt-0">
            {/* The Graphic Container */}
            <div className="relative w-full max-w-[480px] aspect-[4/5] sm:aspect-square flex items-center justify-center select-none">
              {/* Wireframe Line Network & Decision Nodes */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Decorative Dot Matrix in top-left & bottom-right (like Ionic) */}
                <div className="absolute top-4 left-6 grid grid-cols-5 gap-2 opacity-30">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={`dot-1-${i}`} className="h-1 w-1 rounded-full bg-slate-900" />
                  ))}
                </div>
                <div className="absolute bottom-6 right-8 grid grid-cols-6 gap-2 opacity-30">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={`dot-2-${i}`} className="h-1 w-1 rounded-full bg-slate-900" />
                  ))}
                </div>

                {/* Abstract Code / Bracket Glyphs */}
                <div className="absolute top-8 right-12 text-slate-400 font-mono text-xl font-light opacity-60">
                  {"{"}
                </div>
                <div className="absolute top-1/2 right-2 text-slate-400 font-mono text-sm font-light opacity-60">
                  {"</>"}
                </div>
                <div className="absolute bottom-16 left-6 text-slate-400 font-mono text-lg font-light opacity-60">
                  {"[]"}
                </div>

                {/* SVG Connecting Isometric Pathways */}
                <svg
                  className="w-full h-full text-slate-800"
                  viewBox="0 0 500 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Large Angled Wireframe Card 1 (Back Layer) */}
                  <rect
                    x="160"
                    y="60"
                    width="260"
                    height="320"
                    rx="28"
                    transform="rotate(8 290 220)"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeDasharray="4 4"
                    className="text-slate-300/80"
                  />

                  {/* Main Wireframe Screen Card (Front Layer) */}
                  <rect
                    x="110"
                    y="70"
                    width="280"
                    height="340"
                    rx="32"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-800"
                  />

                  {/* Top Notch of Wireframe */}
                  <path
                    d="M 220 70 C 220 78, 280 78, 280 70"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-800"
                  />

                  {/* Curved Decision Path Lines */}
                  <path
                    d="M 140 180 C 200 180, 220 240, 310 240"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-sky-600"
                  />
                  <path
                    d="M 140 240 C 200 240, 240 310, 320 310"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-emerald-600"
                  />

                  {/* Terminal Arrowhead */}
                  <path
                    d="M 325 305 L 335 310 L 325 315"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-600"
                  />

                  {/* Small Circle Nodes */}
                  <circle cx="140" cy="180" r="4.5" fill="currentColor" className="text-sky-600" />
                  <circle cx="140" cy="240" r="4.5" fill="currentColor" className="text-emerald-600" />
                  <circle cx="310" cy="240" r="4.5" fill="currentColor" className="text-slate-800" />
                  <circle cx="280" cy="130" r="8" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
                </svg>

                {/* Floating Rich Glassmorphic Clinical Cards on top of wireframe */}
                <div className="absolute top-12 left-2 sm:left-4 bg-white/90 backdrop-blur-md rounded-xl p-3.5 border border-slate-200/90 shadow-lg shadow-slate-200/50 max-w-[210px] space-y-1.5 transition-transform hover:-translate-y-1 duration-300">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/60">
                      PHENOTYPE
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                  </div>
                  <div className="text-xs font-bold text-slate-900">Burning & Allodynia</div>
                  <div className="text-[10px] text-slate-500">NRS Pain Score: 7/10</div>
                </div>

                <div className="absolute top-1/3 -right-2 sm:right-2 bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-slate-200/90 shadow-xl shadow-slate-200/60 max-w-[230px] space-y-2 transition-transform hover:-translate-y-1 duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                      TASP §1A FIRST-LINE
                    </span>
                    <Stethoscope className="h-3 w-3 text-emerald-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-950">Gabapentinoid Regimen</div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Pregabalin 75mg qHS &bull; Titration plan ready
                  </div>
                </div>

                <div className="absolute bottom-10 left-6 sm:left-8 bg-white/90 backdrop-blur-md rounded-xl p-3.5 border border-slate-200/90 shadow-lg shadow-slate-200/50 max-w-[220px] space-y-1.5 transition-transform hover:-translate-y-1 duration-300">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                    <span>DDI & RENAL SAFETY</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800">eGFR 48 mL/min verified</div>
                  <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Dose auto-adjusted for safety</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Clinical Trust Bar (Inspired by Ionic's partner logos section) */}
      <div className="border-t border-slate-200/70 pt-8 pb-4 mt-6">
        <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-5">
          มาตรฐานและแนวทางเวชปฏิบัติที่ระบบรองรับ (CLINICAL STANDARDS & COMPLIANCE)
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] font-mono text-slate-800">
              TASP
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">TASP 2020</div>
              <div className="text-[9px] text-slate-500">สมาคมการศึกษาความปวดแห่งประเทศไทย</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2 text-slate-700">
            <div className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] font-mono text-slate-800">
              PDPA
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">PDPA Healthcare</div>
              <div className="text-[9px] text-slate-500">มาตรฐานคุ้มครองข้อมูลส่วนบุคคล</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2 text-slate-700">
            <div className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] font-mono text-slate-800">
              FM
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">Primary Care Clinic</div>
              <div className="text-[9px] text-slate-500">ระบบคลังยาและบริการปฐมภูมิ</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2 text-slate-700">
            <div className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] font-mono text-slate-800">
              CDSS
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">Evidence-Based Engine</div>
              <div className="text-[9px] text-slate-500">ระบบช่วยตัดสินใจระดับ 1A/1B</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

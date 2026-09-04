"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Stethoscope,
  ClipboardList,
  Pill,
  BookOpen,
  UserCheck,
  LogOut,
  Menu,
  X,
  Plus,
  ShieldCheck,
  ChevronRight,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { getCurrentClinician } from "@/app/actions";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [clinician, setClinician] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guidelineModalOpen, setGuidelineModalOpen] = useState(false);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    async function load() {
      try {
        const current = await getCurrentClinician();
        setClinician(current);
      } catch (err) {
        console.error("Failed to load clinician in shell:", err);
      }
    }
    if (!isLoginPage) {
      load();
    }
  }, [pathname, isLoginPage]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  // If on login page, render with dedicated top header and clean layout
  if (isLoginPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fcfcfd]">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
          <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-mono font-bold text-xs tracking-tight shadow-sm shadow-emerald-700/20">
                FM
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-slate-950 tracking-tight">FamMed CDSS</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    TASP
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Family Medicine Engine</p>
              </div>
            </Link>
            <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span className="hidden sm:inline text-slate-600">พร้อมให้บริการคลินิก</span>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                TASP 2020 Engine
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-6 py-6">
          {children}
        </main>
      </div>
    );
  }

  const navItems = [
    {
      label: "แดชบอร์ด",
      href: "/",
      icon: LayoutDashboard,
      description: "ภาพรวมและรายการเคสรอตรวจ",
    },
    {
      label: "ประเมินคนไข้ (CDSS)",
      href: "/consultation/new",
      icon: Stethoscope,
      description: "ระบบช่วยตัดสินใจสั่งยา TASP",
    },
    {
      label: "ทะเบียนเคส",
      href: "/cases",
      icon: ClipboardList,
      description: "ประวัติเคสและไทม์ไลน์รักษา",
    },
    {
      label: "คลังยาคลินิก",
      href: "/settings/formulary",
      icon: Pill,
      description: "สถานะสต็อกยาในคลินิก",
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#fcfcfd] text-slate-900 antialiased font-sans">
      {/* ---------------------------------------------------- */}
      {/* Desktop Left Sidebar (Donezo style)                  */}
      {/* ---------------------------------------------------- */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-slate-200/80 shrink-0 h-screen sticky top-0 z-30 select-none">
        {/* Sidebar Header / Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-mono font-bold text-xs tracking-tight shadow-sm shadow-emerald-700/20 group-hover:bg-emerald-800 transition">
              FM
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-slate-950 tracking-tight">FamMed CDSS</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  TASP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Family Medicine Engine</p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1.5">
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              เมนูระบบ (Menu)
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 group ${
                      isActive
                        ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/60 shadow-xs"
                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition ${
                        isActive
                          ? "text-emerald-700 stroke-[2.25]"
                          : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Action Button */}
          <div className="pt-2 px-1">
            <Link
              href="/consultation/new"
              className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm shadow-emerald-700/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เริ่มประเมินเคสใหม่</span>
            </Link>
          </div>

          {/* Guidelines & Utilities */}
          <div className="space-y-1.5 pt-2">
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              แนวทาง & ระบบ (Standards)
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setGuidelineModalOpen(true)}
                className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium transition group"
              >
                <BookOpen className="h-4 w-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
                <span className="truncate">แนวทางเวชปฏิบัติ TASP</span>
              </button>

              <Link
                href="/login"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium transition group"
              >
                <UserCheck className="h-4 w-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
                <span className="truncate">สลับแพทย์ผู้ตรวจ</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Attending Clinician Profile (Donezo style bottom card) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {clinician?.image ? (
                <img
                  src={clinician.image}
                  alt={clinician.name}
                  className="h-8 w-8 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs font-mono">
                  {clinician?.name?.includes("สมชาย") ? "สม" : clinician?.name?.slice(0, 2) || "พ"}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {clinician?.name || "นพ. สมชาย รักษาดี"}
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{clinician?.role === "ADMIN" ? "Staff Physician" : "Resident"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="h-7 w-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition shrink-0"
              title="ออกจากระบบ"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* Main Content Area with Top Utility Bar               */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header (< lg) */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-14 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-mono font-bold text-[11px] shadow-xs">
              FM
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-950 tracking-tight">FamMed CDSS</span>
              <span className="text-[9px] font-mono ml-1.5 px-1 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                TASP
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 transition"
              aria-label="เปิดเมนู"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex flex-col justify-end sm:justify-start">
            <div className="bg-white border-b border-slate-200 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                    FM
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-950">FamMed CDSS</div>
                    <div className="text-[10px] text-slate-400">ระบบช่วยตัดสินใจเวชปฏิบัติครอบครัว</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition ${
                        isActive
                          ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? "text-emerald-700" : "text-slate-500"}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  );
                })}
              </div>

              {/* Clinician Switch / Logout in mobile drawer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-800">
                  {clinician?.name || "นพ. ผู้ตรวจ"}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-600 font-medium hover:underline flex items-center gap-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Desktop Top Utility Bar (Donezo style) */}
        <div className="hidden lg:flex h-14 border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-6 xl:px-8 items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-800 font-semibold">คลินิกเวชปฏิบัติครอบครัว &bull; TASP 2020 Guidelines</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-mono text-[11px]">Primary Care Neuropathic Pain Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200/70">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>PDPA Compliant (De-identified)</span>
            </div>

            <Link
              href="/consultation/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition active:scale-[0.99]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>ประเมินเคส</span>
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12 min-w-0">
          {children}
        </main>

        {/* Desktop Subtle Footer */}
        <footer className="border-t border-slate-200/80 bg-white/60 py-4 px-6 text-center text-xs text-slate-400 hidden lg:block">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between text-[11px]">
            <div>FamMed CDSS &bull; Clinical Guidance for Neuropathic Pain 2020 (TASP)</div>
            <div className="font-mono text-slate-400">Family Medicine Decision Support Engine</div>
          </div>
        </footer>

        {/* ---------------------------------------------------- */}
        {/* Mobile Fixed Bottom Navigation Bar (1-Thumb UX)      */}
        {/* ---------------------------------------------------- */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
                  isActive ? "text-emerald-800 font-bold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center mb-0.5 transition ${
                    isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70" : "text-slate-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="truncate max-w-[64px] text-center leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* TASP Guideline Modal Quick Reference */}
      {guidelineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <BookOpen className="h-4 w-4" />
                <span>แนวทางเวชปฏิบัติ TASP 2020 Neuropathic Pain</span>
              </div>
              <button
                onClick={() => setGuidelineModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-900">
                <strong>First-line Recommendations:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Gabapentinoids (Gabapentin, Pregabalin)</li>
                  <li>TCAs (Amitriptyline, Nortriptyline)</li>
                  <li>SNRIs (Duloxetine)</li>
                </ul>
              </div>
              <p>
                <strong>Dosing Pearl:</strong> ปรับขนาดยาตาม eGFR โดยเฉพาะผู้สูงอายุหรือผู้ป่วยโรคไตเรื้อรัง (CKD)
                และระวังการใช้ TCA ในผู้ป่วยที่มีโรคหัวใจขาดเลือดหรือต้อหินมุมปิด
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setGuidelineModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

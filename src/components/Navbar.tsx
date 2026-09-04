"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Stethoscope,
  ClipboardList,
  Pill,
  Home,
  Activity,
  LogOut,
  RefreshCw,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { getCurrentClinician } from "@/app/actions";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [clinician, setClinician] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // If on login page, don't show full navigation
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    async function load() {
      const current = await getCurrentClinician();
      setClinician(current);
    }
    if (!isLoginPage) {
      load();
    }
  }, [pathname, isLoginPage]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    signOut({ callbackUrl: "/login" });
  };

  const navItems = [
    { label: "แดชบอร์ด", href: "/", icon: Home },
    { label: "ประเมินคนไข้ (CDSS)", href: "/consultation/new", icon: Stethoscope },
    { label: "ทะเบียนเคส", href: "/cases", icon: ClipboardList },
    { label: "คลังยาคลินิก", href: "/settings/formulary", icon: Pill },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-slate-950 flex items-center justify-center text-white font-mono font-bold text-xs tracking-tight shadow-sm">
              FM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-950 tracking-tight font-sans">FamMed CDSS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200/80">
                  TASP 2020
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-none tracking-tight">Neuropathic Pain Decision Support</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links - Hidden on Login */}
        {!isLoginPage && (
          <nav className="flex items-center gap-1 overflow-x-auto p-0.5 rounded-lg bg-slate-100/70 border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all shrink-0 ${
                    isActive
                      ? "bg-white text-slate-950 font-semibold shadow-xs border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50 font-medium"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Clinician Profile & Dropdown Menu */}
        {!isLoginPage && (
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-slate-100/70 border border-slate-200/80 transition text-left select-none bg-white"
            >
              {clinician?.image ? (
                <img
                  src={clinician.image}
                  alt={clinician.name || "Clinician"}
                  className="h-6 w-6 rounded-md object-cover border border-slate-200"
                />
              ) : (
                <div className="h-6 w-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold font-mono">
                  {clinician?.name?.includes("สมชาย") ? "สม" : clinician?.name ? clinician.name.slice(0, 2) : "พ"}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {clinician?.name || "นพ. ผู้ตรวจ"}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  {clinician?.role === "ADMIN" ? "หัวหน้าคลินิก" : "แพทย์ประจำคลินิก"}
                </div>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    ผู้ปฏิบัติหน้าที่ปัจจุบัน
                  </div>
                  <div className="flex items-center gap-2.5">
                    {clinician?.image ? (
                      <img
                        src={clinician.image}
                        alt={clinician.name || "Clinician"}
                        className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
                        {clinician?.name?.includes("สมชาย") ? "สม" : clinician?.name ? clinician.name.slice(0, 2) : "พ"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {clinician?.name || "นพ. สมชาย รักษาดี"}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate">
                        {clinician?.email || "somchai.med@fammed.local"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <Link
                    href="/login"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-blue-700 transition font-medium"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                    <span>สลับแพทย์ผู้ตรวจ</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-rose-50 text-rose-600 transition font-medium"
                  >
                    <LogOut className="h-3.5 w-3.5 text-rose-500" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

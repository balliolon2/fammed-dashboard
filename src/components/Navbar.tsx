"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, ClipboardList, Pill, Home, Activity } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: "แดชบอร์ด", href: "/", icon: Home },
    { label: "ประเมินคนไข้ (CDSS)", href: "/consultation/new", icon: Stethoscope },
    { label: "ทะเบียนเคส", href: "/cases", icon: ClipboardList },
    { label: "คลังยาคลินิก", href: "/settings/formulary", icon: Pill },
  ];

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-slate-200">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-slate-900 tracking-tight">FamMed CDSS</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                  TASP 2020
                </span>
              </div>
              <p className="text-[11px] text-slate-500">ระบบช่วยตัดสินใจรักษา Neuropathic Pain</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition shrink-0 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Clinician Profile */}
        <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
            สม
          </div>
          <div className="text-left">
            <div className="text-[12px] font-semibold text-slate-800">นพ. สมชาย รักษาดี</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
              เวชปฏิบัติครอบครัว • คลินิกปฐมภูมิ
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

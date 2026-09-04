import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-thai",
});

export const metadata: Metadata = {
  title: "FamMed CDSS | Neuropathic Pain Decision Support",
  description: "ระบบช่วยตัดสินใจและบันทึกประวัติการรักษา Neuropathic Pain ในเวชปฏิบัติครอบครัว อ้างอิง TASP Guidelines 2020",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${GeistSans.variable} ${GeistMono.variable} ${ibmPlexSansThai.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[#fcfcfd] text-slate-900 antialiased font-sans selection:bg-slate-900 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-6 py-6">{children}</main>
        <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-500">
          <div className="max-w-[1440px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>FamMed CDSS &bull; Clinical Guidance for Neuropathic Pain 2020 (TASP)</div>
            <div className="text-slate-400 text-[11px] font-mono">Family Medicine Decision Support Engine</div>
          </div>
        </footer>
      </body>
    </html>
  );
}

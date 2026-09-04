import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

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
    <html lang="th">
      <body className="min-h-screen flex flex-col bg-[#f8fbff] text-slate-800 antialiased">
        <Navbar />
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-8 py-6">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-[11px] text-slate-500">
          FamMed CDSS — สร้างเพื่อการศึกษาและสนับสนุนเวชปฏิบัติครอบครัว อ้างอิง Clinical Guidance for Neuropathic Pain 2020 (TASP) • พัฒนาด้วย Next.js Fullstack
        </footer>
      </body>
    </html>
  );
}

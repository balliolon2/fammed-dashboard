import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

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
      <body className="min-h-screen bg-[#fcfcfd] text-slate-900 antialiased font-sans selection:bg-emerald-900 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

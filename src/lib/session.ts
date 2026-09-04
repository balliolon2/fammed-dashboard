import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "./prisma";

export async function getClinicianSession(): Promise<{
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  clinicId: string | null;
} | null> {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
      return {
        id: session.user.id,
        name: session.user.name || "แพทย์ผู้ตรวจ",
        email: session.user.email || "",
        image: session.user.image || null,
        role: session.user.role || "CLINICIAN",
        clinicId: session.user.clinicId || null,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching clinician session from NextAuth:", error);
    return null;
  }
}


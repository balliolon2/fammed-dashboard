import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== "false"
      ? [
          CredentialsProvider({
            id: "clinician-credentials",
            name: "OPD Clinician Switcher",
            credentials: {
              clinicianId: { label: "Clinician ID", type: "text" },
            },
            async authorize(credentials) {
              if (!credentials?.clinicianId) {
                return null;
              }

              try {
                const clinician = await prisma.user.findUnique({
                  where: { id: credentials.clinicianId },
                  include: { clinic: true },
                });

                // SECURITY: Only mock clinicians (@fammed.local) can use passwordless quick login!
                // Real Google accounts must authenticate via Google OAuth.
                if (!clinician || !clinician.email.endsWith("@fammed.local")) {
                  return null;
                }

                return {
                  id: clinician.id,
                  name: clinician.name,
                  email: clinician.email,
                  image: clinician.image,
                  role: clinician.role,
                  clinicId: clinician.clinicId,
                };
              } catch (error) {
                console.error("Error authorizing clinician credentials:", error);
                return null;
              }
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        try {
          // Look up user in database
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Auto-provision user if first time logging in
          if (!dbUser) {
            let defaultClinic = await prisma.clinic.findFirst();
            if (!defaultClinic) {
              defaultClinic = await prisma.clinic.create({
                data: {
                  code: "FAMMED-01",
                  name: "คลินิกเวชปฏิบัติครอบครัวและปฐมภูมิ (FamMed Primary Care Clinic)",
                  type: "PRIMARY_CARE",
                },
              });
            }

            dbUser = await prisma.user.create({
              data: {
                name: user.name || "แพทย์ผู้ตรวจ (Google Clinician)",
                email: user.email,
                image: user.image || null,
                role: "CLINICIAN",
                clinicId: defaultClinic.id,
              },
            });
          } else if (user.image && dbUser.image !== user.image) {
            // Update profile avatar if changed
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: user.image },
            });
          }

          user.id = dbUser.id;
          user.role = dbUser.role;
          user.clinicId = dbUser.clinicId;
          return true;
        } catch (error) {
          console.error("Error during Google OAuth sign-in:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "CLINICIAN";
        token.clinicId = user.clinicId || null;
        if (user.image) {
          token.picture = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = (token.role as string) || "CLINICIAN";
        session.user.clinicId = (token.clinicId as string | null) || null;
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

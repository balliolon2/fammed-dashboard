# FamMed CDSS: Neuropathic Pain Clinical Decision Support System

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Neon](https://img.shields.io/badge/Database-Neon_Postgres-00E599?style=flat&logo=postgresql)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Auth.js](https://img.shields.io/badge/Auth-NextAuth_Google_OAuth-blue?style=flat&logo=google)](https://next-auth.js.org/)
[![Guideline](https://img.shields.io/badge/Guideline-TASP_2020-emerald?style=flat)](https://www.tasp.or.th/)

A full-stack clinical decision support and longitudinal consultation tracking system designed for family medicine and primary care clinicians managing neuropathic pain, developed in accordance with the **TASP 2020 (Thai Association for the Study of Pain)** clinical practice guidelines.

---

## 🩺 Key Features

* **TASP 2020 Decision Engine**: Multi-factorial recommendation scoring combining Pain Phenotype (burning, lancinating, allodynia, paresthesia), Etiology (DPN, PHN, TGN, Fibromyalgia, etc.), and comorbidity safety profiles.
* **Drug-Drug Interaction (DDI) & Contraindication Alerts**: Real-time screening for serious clashes (e.g. Tramadol + SSRI/SNRI serotonin syndrome risk, TCA cardiac contraindications, renal dose adjustments).
* **Clinic Formulary Management**: Filter and rank drug recommendations dynamically based on actual medication availability within the local facility.
* **Longitudinal Care Timeline**: Track patient pain intensity trajectories (NRS 0–10), titration histories, and treatment responses across consecutive consultations.
* **Automated SOAP Progress Notes**: Instant generation of structured Subjective, Objective, Assessment, and Plan notes ready for direct transfer into hospital information systems (HIS).
* **PDPA-Compliant De-identification**: Strict zero-PII architecture utilizing de-identified Patient Cases and surrogate demographic/renal biomarkers.
* **Unified Dual-Mode Authentication**: Secure Google Workspace OAuth (with auto-provisioning for institutional clinicians) alongside an OPD Quick Switcher for rotational clinic stations and demonstrations.

---

## 🛠️ Technology Stack

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Server Components)
* **Frontend**: React 18, [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
* **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)
* **ORM**: [Prisma](https://www.prisma.io/)
* **Authentication**: [NextAuth.js v4](https://next-auth.js.org/) (JWT Session Strategy with Google Provider & Credentials Provider)
* **Testing**: [Vitest](https://vitest.dev/) (Unit tests for scoring matrix, DDI safety checks, and SOAP generator)
* **Deployment**: [Vercel](https://vercel.com/) Edge/Serverless Runtime

---

## 📂 Project Structure

```
├── docs/
│   ├── adr/                         # Architecture Decision Records (0001 - 0008)
│   ├── specs/                       # Clinical Decision Support specifications
│   └── agents/                      # Repository guidelines and domain notes
├── prisma/
│   ├── schema.prisma                # PostgreSQL Prisma schema
│   └── seed.ts                      # Facility, formulary, clinicians, and demo case seeding
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/  # NextAuth API endpoints
│   │   ├── cases/                   # Patient Case registry & longitudinal timeline
│   │   ├── consultation/new/        # Interactive CDSS evaluation & consultation workflow
│   │   ├── login/                   # Dual-mode authentication screen
│   │   ├── settings/formulary/      # Clinic drug stock toggling & management
│   │   ├── actions.ts               # Type-safe Next.js Server Actions
│   │   └── page.tsx                 # Clinical dashboard and worklist
│   ├── components/
│   │   ├── Navbar.tsx               # Clinician profile dropdown & navigation
│   │   └── DashboardWorklist.tsx    # Active cases and quick consultation launcher
│   ├── lib/
│   │   ├── cdss/                    # Core clinical rule engine, formulary data & SOAP builder
│   │   ├── auth.ts                  # NextAuth configuration and auto-provisioning
│   │   ├── prisma.ts                # Shared Prisma client singleton
│   │   └── session.ts               # Clinician session helper
│   └── middleware.ts                # Route protection via NextAuth JWT
├── tests/                           # Vitest clinical engine test suite
├── CONTEXT.md                       # Canonical domain glossary and language rules
└── neon.ts                          # Neon serverless branch configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites

* Node.js 18.17 or higher
* A [Neon](https://neon.tech/) account (Free tier supported)
* A Google Cloud Project with OAuth 2.0 Credentials (for Google sign-in)

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# Neon Serverless PostgreSQL Connection String
DATABASE_URL="postgresql://neondb_owner:password@ep-your-host-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-character-secret"

# Google OAuth 2.0 Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Demo Mode Configuration
NEXT_PUBLIC_ENABLE_DEMO_LOGIN="true"
```

### 3. Database Initialization

Push the schema to your Neon database and populate initial clinic data, formularies, and sample cases:

```bash
# Push schema to PostgreSQL
npx prisma db push

# Seed default clinic, clinicians, TASP formulary drugs, and demo cases
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run the automated test suite covering CDSS recommendation logic, comorbidity penalties, contraindications, and SOAP generation:

```bash
npm test
```

---

## ☁️ Deployment on Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/).
3. Configure the following **Environment Variables** in Vercel Project Settings:
   * `DATABASE_URL`: Your pooled Neon connection string.
   * `NEXTAUTH_URL`: Your production Vercel URL (e.g. `https://fammed-cdss.vercel.app`).
   * `NEXTAUTH_SECRET`: A secure random 32-character secret string.
   * `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
   * `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.
   * `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`: `"true"` (or `"false"` to enforce Google SSO only).
4. Ensure your Google Cloud Console **Authorized Redirect URIs** include:
   * `https://<your-project-name>.vercel.app/api/auth/callback/google`
5. Deploy! Vercel automatically runs `prisma generate && next build`.

---

## 📚 Architecture Decision Records (ADR)

* [0001: De-identified Patient Consultation Model](docs/adr/0001-de-identified-consultation-model.md)
* [0002: Fullstack Next.js with Prisma ORM](docs/adr/0002-fullstack-nextjs-with-prisma.md)
* [0003: OAuth Authentication for Clinicians](docs/adr/0003-oauth-authentication.md)
* [0004: Longitudinal Consultation Tracking](docs/adr/0004-longitudinal-consultation-tracking.md)
* [0005: Dual-Mode Authentication and SQLite Development](docs/adr/0005-dual-mode-auth-and-sqlite-dev.md)
* [0006: Clinic Formulary Availability](docs/adr/0006-clinic-formulary-availability.md)
* [0007: Clinician Session Lifecycle and Route Protection](docs/adr/0007-session-lifecycle-and-route-protection.md)
* [0008: Serverless PostgreSQL and Unified NextAuth with Auto-Provisioning](docs/adr/0008-serverless-postgres-and-unified-nextauth.md)

---

## 📜 License

This project is private and intended for family medicine and clinical decision support research.
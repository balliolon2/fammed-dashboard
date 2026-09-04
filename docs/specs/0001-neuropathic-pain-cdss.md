# Spec 0001: Neuropathic Pain Clinical Decision Support System (CDSS) & Case Tracker

## Problem Statement

แพทย์เวชปฏิบัติครอบครัวและแพทย์คลินิกปฐมภูมิ-ทุติยภูมิต้องเผชิญกับผู้ป่วยที่มีอาการปวดจากรอยโรคระบบประสาท (Neuropathic Pain) จำนวนมาก การเลือกใช้ยาแก้ปวดที่ตรงกับกลไกพยาธิสรีรวิทยา (Mechanism-based) ตามแนวทาง TASP 2020 มีความซับซ้อนสูง เนื่องจาก:
1. ผู้ป่วยมักมีโรคร่วม (Comorbidities) เช่น โรคหัวใจ, ไตเสื่อม, ตับเสื่อม, ต่อมลูกหมากโต, หรือต้อหินมุมปิด ซึ่งมีข้อห้ามใช้ยาเฉพาะ
2. คลังยาของแต่ละสถานพยาบาล (Hospital Formulary) มีรายการยาไม่เท่ากัน
3. การติดตามผลการรักษาต้องอาศัยการปรับขนาดยาอย่างต่อเนื่อง ("Start Low, Go Slow") แต่ระบบเวชระเบียนทั่วไปไม่มีโมดูลติดตาม Pain trajectory แบบเฉพาะเจาะจง
4. การบันทึกและส่งข้อมูลเข้าสู่ระบบ HIS หลักของโรงพยาบาลทำได้ยากและเสียเวลา

## Solution

ระบบเว็บแอปพลิเคชัน Full-Stack (Next.js + Prisma ORM) ที่ทำหน้าที่เป็น Clinical Decision Support System (CDSS) และ Longitudinal Case Tracker:
- ให้คำแนะนำการเลือกใช้ยา 8 ชนิดตามแนวทาง TASP 2020 แบบเรียลไทม์ โดยประเมินจาก Pain Phenotype, Etiology, โรคร่วม และสถานะยาในคลังของคลินิก
- แจ้งเตือนข้อห้ามใช้ (⛔), ข้อควรระวัง (⚠️), และอันตรกิริยาระหว่างยา (DDI) อย่างชัดเจน
- บันทึกและติดตามผลการรักษาต่อเนื่อง (Longitudinal Timeline) 1 Case : หลาย Consultations พร้อมกราฟระดับความปวด (NRS/VAS 0–10)
- บันทึกการตัดสินใจจริงของแพทย์ (Physician Decision) พร้อมเหตุผลทางคลินิก (Clinical Rationale)
- สร้างข้อความ SOAP Note สรุปการตรวจรักษาด้วยการคลิกเพียงครั้งเดียว (1-Click Copy) เพื่อนำไปวางในโปรแกรม HIS ของโรงพยาบาลได้ทันที
- รักษาความปลอดภัยของข้อมูลตามกฎหมาย PDPA ด้วยการจัดเก็บแบบ De-identified

## User Stories

1. As a clinician, I want to authenticate via Google OAuth or a quick development session, so that my consultations are securely associated with my clinical identity.
2. As a clinician, I want to create a de-identified Patient Case (specifying age group, sex, eGFR, LFT), so that patient privacy is protected under PDPA while preserving physiological context for drug dosing.
3. As a clinician, I want to assess the patient's current Pain Score (NRS 0–10) and primary sensory phenotype (Burning, Lancinating, Allodynia, Paresthesia, Mixed), so that the CDSS can target the underlying neurobiological pain mechanism.
4. As a clinician, I want to select the patient's underlying etiology (DPN, PHN, TGN, Central, Phantom, Fibromyalgia, Myofascial), so that guideline-recommended first-line agents receive proper prioritization.
5. As a clinician, I want to check all relevant patient comorbidities (Cardiac, Uncontrolled HT, BPH, Glaucoma, Dementia, Epilepsy, Renal, Liver, Fall Risk, Diuretics, Depression/Insomnia), so that contraindications (⛔) and precautions (⚠️) are immediately surfaced.
6. As a clinician, I want the system to dynamically calculate Recommendation Scores and rank the 8 neuropathic pain medications in real-time, highlighting the Top 2 choices.
7. As a clinician, I want the system to flag medications that are currently out-of-stock in my clinic's formulary, so that I do not prescribe unavailable drugs.
8. As a clinician, I want to view the TASP 2020 guideline tables (Table 3.1.4 and Table 3.1.5) in a slide-over reference drawer, so that I can double-check dosing and titration rules ("Start Low, Go Slow").
9. As a clinician, I want to run the 2-drug Interaction Checker, so that potentially life-threatening interactions (such as Serotonin Syndrome or CYP induction) are caught before prescribing.
10. As a clinician, I want to record my final chosen medication, starting dose, and titration interval, so that the clinical decision is permanently documented.
11. As a clinician, I want to provide a Clinical Rationale whenever I override the system's top recommendation or select a medication with a caution flag, so that my clinical judgment is logged for auditability.
12. As a clinician, I want to click a single button to copy a fully formatted SOAP Note to my clipboard, so that I can paste it into the hospital HIS without re-typing.
13. As a clinician, I want to view a longitudinal timeline of a patient case with past visits, past medications, and a pain score trend chart, so that I can evaluate treatment efficacy at follow-up visits.
14. As a clinic administrator, I want to toggle the in-stock availability of medications in the Clinic Formulary settings page, so that recommendations align with our actual pharmacy inventory.

## Implementation Decisions

- **Full-Stack Next.js with Prisma ORM**: Unified TypeScript codebase utilizing App Router, Server Actions for mutations, and Route Handlers for API access.
- **SQLite for Development with Zero Setup**: Local database file (`prisma/dev.db`) seeded with comprehensive TASP 2020 knowledge data, structured for direct migration to PostgreSQL.
- **De-identified Data Architecture**: No direct patient identifiers (Names, National IDs, Hospital Numbers) stored; cases use auto-generated case reference codes.
- **Deterministic Pure CDSS Engine**: The clinical recommendation and DDI algorithms are isolated into pure TypeScript functions (`src/lib/cdss/engine.ts` and `src/lib/cdss/ddi.ts`) that are independently testable.
- **Longitudinal 1:N Model**: `PatientCase` links to multiple `Consultation` records, enabling time-series tracking of Pain Scores and medication titration adjustments.
- **Dual-Mode Auth**: Production uses Google OAuth via NextAuth/Auth.js; local development includes a 1-click Dev Clinician bypass session.

## Testing Decisions

- **Focus on Behavior Over Implementation**: Tests will target the external interfaces of the CDSS engine and consultation lifecycle, avoiding tests that couple to internal UI DOM structure.
- **Clinical Guideline Compliance Suite**: Unit tests will verify specific clinical edge cases defined by TASP 2020:
  - Diabetic Neuropathy + Cardiac Arrhythmia must assign Amitriptyline a -5 penalty and flag it ⛔ Contraindicated.
  - Trigeminal Neuralgia must assign Carbamazepine/Oxcarbazepine first-line top ranks.
  - Concomitant Tramadol + Venlafaxine must trigger a High-severity Serotonin Syndrome warning.
  - An out-of-stock first-line medication must be de-prioritized in favor of the highest in-stock alternative.
- **Longitudinal Continuity Suite**: Integration tests verifying that consecutive consultations for a single case correctly compute the change in pain score ($\Delta \text{NRS}$) and record titration progression.

## Out of Scope

- Direct bidirectional HL7 FHIR or proprietary database sync with hospital HIS (deferred; solved via 1-Click SOAP Note copy).
- Patient-facing self-service portal or mobile patient reporting app (this product is clinician-facing).
- Full hospital inpatient pharmacy billing and inventory decrement ledger (formulary is a clinical availability toggle, not an ERP inventory system).

## Further Notes

- TASP Guidelines: Clinical Guidance for Neuropathic Pain 2020 and Myofascial/Fibromyalgia Guidance 2020 (Thai Association for the Study of Pain).
- Fonts and styling will incorporate `IBM Plex Sans Thai` and Tailwind CSS to maintain the aesthetics established in `React_Artifact.html`.

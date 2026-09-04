import { PrismaClient } from "@prisma/client";
import { DRUGS } from "../src/lib/cdss/data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create or upsert Default Clinic
  const clinic = await prisma.clinic.upsert({
    where: { code: "FAMMED-01" },
    update: {},
    create: {
      code: "FAMMED-01",
      name: "คลินิกเวชปฏิบัติครอบครัวและปฐมภูมิ (FamMed Primary Care Clinic)",
      type: "PRIMARY_CARE",
    },
  });

  // 2. Create or upsert Default Clinician Users
  const clinician = await prisma.user.upsert({
    where: { email: "somchai.med@fammed.local" },
    update: {},
    create: {
      name: "นพ. สมชาย รักษาดี (Staff Physician)",
      email: "somchai.med@fammed.local",
      role: "CLINICIAN",
      clinicId: clinic.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "rattana.med@fammed.local" },
    update: {},
    create: {
      name: "พญ. รัตนา ใจดี (Resident Physician)",
      email: "rattana.med@fammed.local",
      role: "CLINICIAN",
      clinicId: clinic.id,
    },
  });

  // 3. Seed Clinic Formulary (all 8 drugs in stock by default)
  for (const drug of DRUGS) {
    await prisma.clinicFormulary.upsert({
      where: {
        clinicId_drugId: {
          clinicId: clinic.id,
          drugId: drug.id,
        },
      },
      update: {},
      create: {
        clinicId: clinic.id,
        drugId: drug.id,
        isInStock: true,
        customStartingDose: drug.startingDose,
        notes: `TASP 2020: ${drug.dose}`,
      },
    });
  }

  // 4. Seed Demo Patient Cases
  const case1 = await prisma.patientCase.upsert({
    where: { caseCode: "CASE-2026-001" },
    update: {},
    create: {
      caseCode: "CASE-2026-001",
      ageGroup: ">65",
      sex: "FEMALE",
      baselineEgfr: 42.0,
      baselineLft: "NORMAL",
      baselineComorbidities: JSON.stringify(["cardiac", "renal", "diuretics"]),
      clinicId: clinic.id,
      createdByUserId: clinician.id,
    },
  });

  const case2 = await prisma.patientCase.upsert({
    where: { caseCode: "CASE-2026-002" },
    update: {},
    create: {
      caseCode: "CASE-2026-002",
      ageGroup: "45-65",
      sex: "MALE",
      baselineEgfr: 88.0,
      baselineLft: "NORMAL",
      baselineComorbidities: JSON.stringify(["depression"]),
      clinicId: clinic.id,
      createdByUserId: clinician.id,
    },
  });

  // 5. Seed Initial Consultation for Case 1 (Visit 1: Initial assessment)
  const existingConsultations = await prisma.consultation.findMany({
    where: { caseId: case1.id },
  });

  if (existingConsultations.length === 0) {
    const visit1Date = new Date();
    visit1Date.setDate(visit1Date.getDate() - 14); // 2 weeks ago

    await prisma.consultation.create({
      data: {
        caseId: case1.id,
        visitDate: visit1Date,
        painScore: 8,
        selectedPhenotype: "burning",
        selectedEtiology: "dpn",
        selectedComorbidities: JSON.stringify(["cardiac", "renal", "diuretics"]),
        calculatedScoreJson: JSON.stringify({
          top: ["pregabalin", "gabapentin"],
          contra: ["amitriptyline"],
        }),
        chosenDrugId: "pregabalin",
        chosenDose: "25 mg HS",
        isOverride: false,
        clinicalRationale: "ผู้ป่วยสูงอายุ eGFR 42 มี Arrhythmia เลี่ยง TCA เริ่ม Pregabalin ขนาดต่ำ 25 mg ก่อนนอน",
        soapNote: `S: ผู้ป่วยหญิงอายุ >65 ปี มาด้วยอาการปวดแสบร้อนปลายเท้าทั้งสองข้าง (Burning pain, Stocking distribution) เป็นมา 6 เดือน NRS 8/10 มีโรคประจำตัว เบาหวาน, โรคหัวใจเต้นผิดจังหวะ, ไตเสื่อม (eGFR 42), ได้รับยาขับปัสสาวะ
O: Sensory loss to pinprick both feet, DTR 1+ all, eGFR 42 mL/min/1.73m2
A: Diabetic Peripheral Neuropathy with Neuropathic Pain (High severity) with CKD stage 3b and Cardiac Arrhythmia (TCA Contraindicated)
P: Start Pregabalin 25 mg HS (Renal-adjusted low dose), F/U 2 weeks to evaluate pain reduction and dizziness`,
        clinicianId: clinician.id,
      },
    });

    // Visit 2: Follow-up (Today)
    await prisma.consultation.create({
      data: {
        caseId: case1.id,
        visitDate: new Date(),
        painScore: 4,
        selectedPhenotype: "burning",
        selectedEtiology: "dpn",
        selectedComorbidities: JSON.stringify(["cardiac", "renal", "diuretics"]),
        calculatedScoreJson: JSON.stringify({
          top: ["pregabalin", "gabapentin"],
          contra: ["amitriptyline"],
        }),
        chosenDrugId: "pregabalin",
        chosenDose: "50 mg HS",
        isOverride: false,
        clinicalRationale: "หลังเริ่ม Pregabalin 25 mg อาการปวดลดลงจาก 8/10 เหลือ 4/10 ไม่มีอาการบวมหรือเวียนศีรษะ ปรับเพิ่มขนาดยาเป็น 50 mg HS",
        soapNote: `S: นัดติดตามผลการรักษา 2 สัปดาห์ อาการปวดแสบร้อนทุเลาลง NRS ลดจาก 8/10 เหลือ 4/10 ไม่มีเวียนศีรษะ ไม่มีขาบวม
O: Vital signs stable, No peripheral edema, Gait steady
A: DPN with partial response to Pregabalin 25 mg HS (Pain reduced by 50%)
P: Titrate Pregabalin to 50 mg HS, Continue lifestyle modification, F/U 4 weeks`,
        clinicianId: clinician.id,
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

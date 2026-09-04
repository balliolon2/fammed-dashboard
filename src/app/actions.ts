"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateSoapNote, SoapInput } from "@/lib/cdss/soap-generator";
import { evaluateCDSS } from "@/lib/cdss/engine";
import { getClinicianSession } from "@/lib/session";

export async function getCurrentClinician() {
  return await getClinicianSession();
}

export async function getAllClinicians() {
  try {
    const users = await prisma.user.findMany({
      where: {
        email: {
          endsWith: "@fammed.local",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clinic: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return users;
  } catch (error) {
    console.error("Failed to get clinicians:", error);
    return [];
  }
}

export async function getClinicFormulary() {
  try {
    const clinic = await prisma.clinic.findFirst();
    if (!clinic) return {};

    const items = await prisma.clinicFormulary.findMany({
      where: { clinicId: clinic.id },
    });

    const stockMap: Record<string, boolean> = {};
    items.forEach((item) => {
      stockMap[item.drugId] = item.isInStock;
    });
    return stockMap;
  } catch (error) {
    console.error("Failed to fetch formulary:", error);
    return {};
  }
}

export async function toggleFormularyStock(drugId: string, isInStock: boolean) {
  try {
    const clinic = await prisma.clinic.findFirst();
    if (!clinic) throw new Error("No clinic found");

    await prisma.clinicFormulary.upsert({
      where: {
        clinicId_drugId: {
          clinicId: clinic.id,
          drugId,
        },
      },
      update: { isInStock },
      create: {
        clinicId: clinic.id,
        drugId,
        isInStock,
      },
    });

    revalidatePath("/settings/formulary");
    revalidatePath("/consultation/new");
    return { success: true };
  } catch (error) {
    console.error("Failed to update formulary stock:", error);
    return { success: false, error: String(error) };
  }
}

export async function getPatientCases() {
  try {
    const cases = await prisma.patientCase.findMany({
      include: {
        consultations: {
          orderBy: { visitDate: "asc" },
        },
        _count: {
          select: { consultations: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return cases;
  } catch (error) {
    console.error("Failed to fetch cases:", error);
    return [];
  }
}

export async function createPatientCase(data: {
  ageGroup: string;
  sex: string;
  baselineEgfr?: number | null;
  baselineLft?: string | null;
  baselineComorbidities: string[];
}) {
  try {
    const clinic = await prisma.clinic.findFirst();
    let clinician = await getClinicianSession();
    if (!clinician) {
      clinician = await prisma.user.findFirst();
    }

    if (!clinic || !clinician) throw new Error("Clinic or user missing");

    // Generate unique sequential case code
    const count = await prisma.patientCase.count();
    const codeNumber = (count + 1).toString().padStart(3, "0");
    const caseCode = `CASE-2026-${codeNumber}`;

    const newCase = await prisma.patientCase.create({
      data: {
        caseCode,
        ageGroup: data.ageGroup,
        sex: data.sex,
        baselineEgfr: data.baselineEgfr ?? null,
        baselineLft: data.baselineLft || "NORMAL",
        baselineComorbidities: JSON.stringify(data.baselineComorbidities),
        clinicId: clinic.id,
        createdByUserId: clinician.id,
      },
    });

    revalidatePath("/cases");
    return { success: true, case: newCase };
  } catch (error) {
    console.error("Failed to create case:", error);
    return { success: false, error: String(error) };
  }
}

export async function saveConsultationRecord(data: {
  caseId: string;
  painScore: number;
  phenotypeId: string;
  etiologyId: string;
  comorbidityIds: string[];
  chosenDrugId: string;
  chosenDose: string;
  isOverride: boolean;
  clinicalRationale?: string | null;
}) {
  try {
    let clinician = await getClinicianSession();
    if (!clinician) {
      clinician = await prisma.user.findFirst();
    }
    if (!clinician) throw new Error("Clinician not found");

    const patientCase = await prisma.patientCase.findUnique({
      where: { id: data.caseId },
    });
    if (!patientCase) throw new Error("Case not found");

    // Evaluate CDSS for snapshot
    const formularyStock = await getClinicFormulary();
    const cdssResult = evaluateCDSS({
      phenotypeId: data.phenotypeId,
      etiologyId: data.etiologyId,
      comorbidityIds: data.comorbidityIds,
      formularyStock,
    });

    // Generate SOAP note
    const soapInput: SoapInput = {
      caseCode: patientCase.caseCode,
      ageGroup: patientCase.ageGroup,
      sex: patientCase.sex,
      baselineEgfr: patientCase.baselineEgfr,
      baselineLft: patientCase.baselineLft,
      painScore: data.painScore,
      phenotypeId: data.phenotypeId,
      etiologyId: data.etiologyId,
      comorbidityIds: data.comorbidityIds,
      chosenDrugId: data.chosenDrugId,
      chosenDose: data.chosenDose,
      clinicalRationale: data.clinicalRationale,
      topRankedDrugs: cdssResult.topRecommendations,
    };

    const soapNote = generateSoapNote(soapInput);

    const consultation = await prisma.consultation.create({
      data: {
        caseId: data.caseId,
        painScore: data.painScore,
        selectedPhenotype: data.phenotypeId,
        selectedEtiology: data.etiologyId,
        selectedComorbidities: JSON.stringify(data.comorbidityIds),
        calculatedScoreJson: JSON.stringify(cdssResult),
        chosenDrugId: data.chosenDrugId,
        chosenDose: data.chosenDose,
        isOverride: data.isOverride,
        clinicalRationale: data.clinicalRationale ?? null,
        soapNote,
        clinicianId: clinician.id,
      },
    });

    // Update patient case updated timestamp
    await prisma.patientCase.update({
      where: { id: data.caseId },
      data: { updatedAt: new Date() },
    });

    revalidatePath(`/cases/${data.caseId}`);
    revalidatePath("/cases");
    revalidatePath("/");

    return { success: true, consultation, soapNote };
  } catch (error) {
    console.error("Failed to save consultation:", error);
    return { success: false, error: String(error) };
  }
}

export async function getCaseDetail(caseId: string) {
  try {
    const patientCase = await prisma.patientCase.findUnique({
      where: { id: caseId },
      include: {
        consultations: {
          orderBy: { visitDate: "asc" },
        },
        clinic: true,
      },
    });
    return patientCase;
  } catch (error) {
    console.error("Failed to get case detail:", error);
    return null;
  }
}

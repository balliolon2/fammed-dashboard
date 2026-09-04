import { describe, it, expect } from "vitest";
import { generateSoapNote, SoapInput } from "../src/lib/cdss/soap-generator";
import { evaluateCDSS } from "../src/lib/cdss/engine";

describe("SOAP Note Generator", () => {
  it("formats a standard medical SOAP note matching TASP guidance", () => {
    const cdss = evaluateCDSS({
      phenotypeId: "burning",
      etiologyId: "dpn",
      comorbidityIds: ["cardiac", "renal"],
    });

    const input: SoapInput = {
      caseCode: "CASE-2026-TEST",
      ageGroup: ">65",
      sex: "FEMALE",
      baselineEgfr: 45,
      baselineLft: "NORMAL",
      painScore: 7,
      phenotypeId: "burning",
      etiologyId: "dpn",
      comorbidityIds: ["cardiac", "renal"],
      chosenDrugId: "pregabalin",
      chosenDose: "25 mg HS",
      clinicalRationale: "ผู้ป่วยมี Arrhythmia ห้ามใช้ TCA จึงเลือกใช้ Pregabalin ปรับลดขนาดยาตามไต",
      topRankedDrugs: cdss.topRecommendations,
    };

    const note = generateSoapNote(input);

    expect(note).toContain("CASE-2026-TEST");
    expect(note).toContain("S (Subjective):");
    expect(note).toContain("O (Objective):");
    expect(note).toContain("A (Assessment):");
    expect(note).toContain("P (Plan):");
    expect(note).toContain("NRS 7/10");
    expect(note).toContain("TCA (Amitriptyline) Contraindicated");
    expect(note).toContain("Pregabalin 25 mg HS");
  });
});

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

  it("formats a follow-up longitudinal SOAP note with pain score delta", () => {
    const cdss = evaluateCDSS({
      phenotypeId: "burning",
      etiologyId: "dpn",
      comorbidityIds: ["renal"],
    });

    const input: SoapInput = {
      caseCode: "CASE-2026-TEST",
      ageGroup: ">65",
      sex: "FEMALE",
      baselineEgfr: 45,
      baselineLft: "NORMAL",
      painScore: 3,
      phenotypeId: "burning",
      etiologyId: "dpn",
      comorbidityIds: ["renal"],
      chosenDrugId: "pregabalin",
      chosenDose: "50 mg HS",
      clinicalRationale: "Titrate Pregabalin to 50 mg HS due to good pain reduction without adverse events",
      topRankedDrugs: cdss.topRecommendations,
      visitNumber: 2,
      previousPainScore: 7,
      previousDrugId: "pregabalin",
      previousDose: "25 mg HS",
    };

    const note = generateSoapNote(input);

    expect(note).toContain("Visit #2 (Follow-up)");
    expect(note).toContain("ติดตามผลการรักษา (Follow-up Consultation ครั้งที่ 2)");
    expect(note).toContain("ความปวดเดิม NRS 7/10");
    expect(note).toContain("NRS 3/10 (ลดลง 4 คะแนน, ทุเลาลง)");
    expect(note).toContain("อาการปวดตอบสนองต่อการรักษา (Pain score ลดลงจาก NRS 7 เหลือ 3)");
    expect(note).toContain("Prescribed Pregabalin 50 mg HS");
  });
});

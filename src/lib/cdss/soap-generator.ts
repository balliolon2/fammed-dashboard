import { PHENOTYPES, ETIOLOGIES, COMORBIDITIES, DRUGS } from "./data";
import { RankedDrug } from "./engine";

export interface SoapInput {
  caseCode: string;
  ageGroup: string;
  sex: string;
  baselineEgfr?: number | null;
  baselineLft?: string | null;
  painScore: number;
  phenotypeId: string;
  etiologyId: string;
  comorbidityIds: string[];
  chosenDrugId: string;
  chosenDose: string;
  clinicalRationale?: string | null;
  topRankedDrugs: RankedDrug[];
  visitNumber?: number;
  previousPainScore?: number | null;
  previousDrugId?: string | null;
  previousDose?: string | null;
}

export function generateSoapNote(input: SoapInput): string {
  const phenotype = PHENOTYPES.find((p) => p.id === input.phenotypeId);
  const etiology = ETIOLOGIES.find((e) => e.id === input.etiologyId);
  const chosenDrug = DRUGS.find((d) => d.id === input.chosenDrugId);

  const isFollowUp = (input.visitNumber ?? 1) > 1;
  const previousDrug = input.previousDrugId
    ? DRUGS.find((d) => d.id === input.previousDrugId)?.name || input.previousDrugId
    : null;

  const delta =
    input.previousPainScore !== undefined && input.previousPainScore !== null
      ? input.painScore - input.previousPainScore
      : null;

  const deltaText =
    delta !== null
      ? delta < 0
        ? `(ลดลง ${Math.abs(delta)} คะแนน, ทุเลาลง)`
        : delta > 0
        ? `(เพิ่มขึ้น +${delta} คะแนน)`
        : "(คงที่เท่าเดิม)"
      : "";

  const comorbidityLabels = input.comorbidityIds
    .map((id) => COMORBIDITIES.find((c) => c.id === id)?.th)
    .filter(Boolean)
    .join(", ");

  const topDrugsText = input.topRankedDrugs
    .slice(0, 2)
    .map((d) => `${d.name} (${d.tierScoreLabel})`)
    .join(", ");

  const dateStr = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return `[PROGRESS NOTE - NEUROPATHIC PAIN CLINICAL EVALUATION]
Date: ${dateStr} | Ref: ${input.caseCode} | ${isFollowUp ? `Visit #${input.visitNumber} (Follow-up)` : "Initial Visit"}

S (Subjective):
- ผู้ป่วยเพศ ${input.sex === "MALE" ? "ชาย" : input.sex === "FEMALE" ? "หญิง" : "ทั่วไป"} ช่วงอายุ ${input.ageGroup} ปี
- ประเภทการตรวจ: ${isFollowUp ? `ติดตามผลการรักษา (Follow-up Consultation ครั้งที่ ${input.visitNumber})` : "ประเมินตั้งต้น (Initial Consultation)"}
${isFollowUp && previousDrug ? `- การรักษาเดิม: ได้รับยา ${previousDrug} ${input.previousDose || ""}, ความปวดเดิม NRS ${input.previousPainScore}/10\n` : ""}- อาการสำคัญ: ปวดระบบประสาท ลักษณะ ${phenotype?.th || input.phenotypeId} (${phenotype?.en || ""})
- ระดับความปวดปัจจุบัน (Pain Score): NRS ${input.painScore}/10 ${deltaText}
- โรคหรือภาวะที่เป็นสาเหตุ (Etiology): ${etiology?.th || input.etiologyId} (${etiology?.en || ""})
- โรคร่วมและประวัติสำคัญ: ${comorbidityLabels || "ไม่มีโรคร่วมที่มีข้อห้ามใช้ชัดเจน"}

O (Objective):
- Baseline eGFR: ${input.baselineEgfr ? `${input.baselineEgfr} mL/min/1.73m2` : "ไม่ได้ระบุ"}
- Liver Function (LFT): ${input.baselineLft || "Normal"}
- Vital signs & physical findings compatible with neuropathic pain etiology

A (Assessment):
- Diagnosis: Neuropathic Pain secondary to ${etiology?.th || input.etiologyId} (${phenotype?.th || input.phenotypeId} phenotype)
${isFollowUp && delta !== null ? `- Treatment Response: ${delta < 0 ? `อาการปวดตอบสนองต่อการรักษา (Pain score ลดลงจาก NRS ${input.previousPainScore} เหลือ ${input.painScore})` : delta > 0 ? `อาการปวดเพิ่มขึ้นจากครั้งก่อน (NRS ${input.previousPainScore} -> ${input.painScore}) พิจารณาปรับเพิ่มยาหรือเปลี่ยนกลุ่มยา` : "อาการปวดทรงตัวเมื่อเทียบกับครั้งก่อน"}\n` : ""}- CDSS TASP 2020 Guidance: Top First-line recommended agents = ${topDrugsText}
${input.comorbidityIds.includes("cardiac") ? "- Safety Alert: TCA (Amitriptyline) Contraindicated due to cardiac arrhythmia risk\n" : ""}${input.comorbidityIds.includes("renal") ? "- Safety Alert: Dose adjustment required for Gabapentinoids due to renal impairment\n" : ""}
P (Plan):
- Pharmacotherapy: Prescribed ${chosenDrug?.name || input.chosenDrugId} ${input.chosenDose}
- Titration Strategy: Start Low, Go Slow ตามแนวทาง TASP 2020
${input.clinicalRationale ? `- Clinical Rationale / Override Note: ${input.clinicalRationale}\n` : ""}- Patient Education: แนะนำอาการข้างเคียงสำคัญ (ง่วงซึม, เวียนศีรษะ, บวมน้ำ) และข้อควรระวังในการขับขี่ยานพาหนะ
- Follow-up: นัดติดตามประเมินผลการรักษาและ Pain Score อีก 2-4 สัปดาห์`;
}

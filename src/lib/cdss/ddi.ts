export interface InteractionResult {
  type: string;
  severity: "high" | "moderate" | "low";
  title: string;
  desc: string;
  management: string;
}

const KNOWN_PAIRS: Record<string, InteractionResult> = {
  "amitriptyline+tramadol": {
    type: "Pharmacodynamic",
    severity: "high",
    title: "Serotonin Syndrome + Sedation",
    desc: "TCA + Tramadol เสริม Serotonin และ NE พร้อมฤทธิ์ Anticholinergic และกดประสาท เสี่ยง Serotonin syndrome, ชัก, ง่วงซึมรุนแรง",
    management: "หลีกเลี่ยงการใช้ร่วมกันอย่างยิ่ง หรือเปลี่ยนเป็น Gabapentinoid ร่วมกับ Tramadol ระยะสั้น",
  },
  "duloxetine+tramadol": {
    type: "Pharmacodynamic",
    severity: "high",
    title: "Serotonin Syndrome",
    desc: "SNRI + Tramadol ทั้งคู่เพิ่ม 5-HT เสี่ยง Serotonin syndrome (กระสับกระส่าย, ไข้, clonus, สับสน) ห้ามใช้ร่วมโดยไม่จำเป็น",
    management: "หลีกเลี่ยงร่วมกัน หากจำเป็นต้องใช้แก้ปวดเฉียบพลัน ให้เริ่ม Tramadol ขนาดต่ำสุดและเฝ้าระวังอาการทางระบบประสาทอย่างใกล้ชิด",
  },
  "tramadol+venlafaxine": {
    type: "Pharmacodynamic",
    severity: "high",
    title: "Serotonin Syndrome + ชัก",
    desc: "Venlafaxine + Tramadol เพิ่มความเสี่ยง Serotonin syndrome และลด seizure threshold",
    management: "หลีกเลี่ยงร่วมกัน เปลี่ยนไปใช้ยากลุ่มอื่นที่ไม่มีฤทธิ์ Serotonergic",
  },
  "amitriptyline+duloxetine": {
    type: "Pharmacodynamic",
    severity: "moderate",
    title: "Serotonin + Anticholinergic",
    desc: "TCA+SNRI เพิ่ม 5-HT/NE มากเกิน + ฤทธิ์ Anticholinergic ของ Amitriptyline เสริมกัน เสี่ยง QT prolong, ความดันสูง",
    management: "เริ่มขนาดต่ำสุด ติดตามความดันโลหิตและ ECG หากใช้ในขนาดสูง",
  },
  "amitriptyline+venlafaxine": {
    type: "Pharmacodynamic",
    severity: "moderate",
    title: "Serotonin + QT",
    desc: "เสี่ยง Serotonin toxicity และ QT prolongation",
    management: "ติดตาม ECG และระดับ Serotonin toxicity",
  },
  "duloxetine+venlafaxine": {
    type: "Pharmacodynamic",
    severity: "moderate",
    title: "Duplicate SNRI",
    desc: "กลไกซ้ำซ้อน ไม่เพิ่มประสิทธิผล แต่เพิ่มความดันโลหิตและ Hyponatremia",
    management: "ไม่แนะนำให้ใช้ยากลุ่มเดียวกันซ้ำซ้อน เลือกใช้เพียงตัวใดตัวหนึ่ง",
  },
  "carbamazepine+duloxetine": {
    type: "Pharmacokinetic",
    severity: "high",
    title: "CYP1A2/2D6 Induction",
    desc: "Carbamazepine เป็น CYP inducer แรง (3A4, 2C9, 1A2) ลดระดับ Duloxetine 30-50% อาจไม่ได้ผล",
    management: "พิจารณาปรับเพิ่มขนาดยา Duloxetine หรือเปลี่ยนเป็น Gabapentinoids ซึ่งไม่ผ่าน CYP",
  },
  "amitriptyline+carbamazepine": {
    type: "Pharmacokinetic",
    severity: "high",
    title: "↓ TCA level + ↑ toxicity",
    desc: "Carbamazepine เร่งเมตาบอลิซึม Amitriptyline และอาจเพิ่ม epoxide metabolite ที่เป็นพิษ",
    management: "ติดตามระดับยาในเลือดหรือหลีกเลี่ยงการใช้ร่วม",
  },
  "carbamazepine+tramadol": {
    type: "Pharmacokinetic + PD",
    severity: "high",
    title: "↓ Tramadol + ↑ ชัก",
    desc: "Carbamazepine ลดระดับ Tramadol (CYP3A4 induction) และทั้งคู่ลด seizure threshold",
    management: "หลีกเลี่ยงการใช้ร่วม เสี่ยงต่อโรคลมชักกำเริบสูง",
  },
  "carbamazepine+pregabalin": {
    type: "Pharmacokinetic",
    severity: "low",
    title: "No significant PK",
    desc: "Pregabalin ไม่ผ่าน CYP จึงปลอดภัยกว่าเมื่อต้องใช้ร่วมกับ Carbamazepine แต่ยังง่วงเสริมกัน",
    management: "เริ่ม Pregabalin ขนาดต่ำ ระวังอาการง่วงซึมในผู้สูงอายุ",
  },
  "gabapentin+pregabalin": {
    type: "Pharmacodynamic",
    severity: "moderate",
    title: "Duplicate α2δ",
    desc: "กลไกซ้ำซ้อน ไม่แนะนำใช้ร่วม ประสิทธิผลไม่เพิ่ม แต่บวม ง่วง เวียนหัว เพิ่ม",
    management: "หยุดตัวใดตัวหนึ่ง ไม่ควรใช้ยาสองตัวนี้ร่วมกัน",
  },
  "carbamazepine+oxcarbazepine": {
    type: "Pharmacodynamic",
    severity: "moderate",
    title: "Duplicate Na-blocker + Hyponatremia",
    desc: "กลไกซ้ำซ้อน + เสี่ยง Hyponatremia รุนแรงโดยเฉพาะผู้สูงอายุ",
    management: "ห้ามใช้ร่วมกัน เลือกตัวใดตัวหนึ่งสำหรับ TGN",
  },
  "gabapentin+tramadol": {
    type: "Pharmacodynamic",
    severity: "moderate",
    title: "Sedation + Respiratory depression",
    desc: "เสริมฤทธิ์กดประสาทส่วนกลาง โดยเฉพาะผู้สูงอายุ เสี่ยงหกล้ม กดหายใจ",
    management: "เริ่มขนาดต่ำ เฝ้าระวังอาการง่วงซึมและการทรงตัว",
  },
  "pregabalin+tramadol": {
    type: "Pharmacodynamic",
    severity: "moderate",
    title: "Sedation + น้ำหนักเพิ่ม",
    desc: "ง่วงซึม เวียนหัว บวม เพิ่มขึ้นเมื่อใช้ร่วมกัน",
    management: "เริ่มขนาดต่ำ ติดตามอาการข้างเคียงอย่างใกล้ชิด",
  },
  "oxcarbazepine+duloxetine": {
    type: "Pharmacodynamic",
    severity: "moderate",
    title: "Hyponatremia",
    desc: "ทั้ง Oxcarbazepine และ SNRI ทำให้ Na ต่ำได้ โดยเฉพาะผู้สูงอายุ + diuretics ต้องตรวจ Na+",
    management: "ตรวจระดับ Serum Sodium ก่อนเริ่มและติดตามหลังเริ่มยา 2-4 สัปดาห์",
  },
};

export function checkInteraction(drugA: string, drugB: string): InteractionResult | null {
  if (!drugA || !drugB || drugA === drugB) return null;

  const key = [drugA, drugB].sort().join("+");
  if (KNOWN_PAIRS[key]) {
    return KNOWN_PAIRS[key];
  }

  // Generic rules
  if ((drugA === "carbamazepine" || drugB === "carbamazepine") && !["gabapentin", "pregabalin"].includes(drugA) && !["gabapentin", "pregabalin"].includes(drugB)) {
    const other = drugA === "carbamazepine" ? drugB : drugA;
    if (["duloxetine", "venlafaxine", "amitriptyline", "tramadol", "oxcarbazepine"].includes(other)) {
      return {
        type: "Pharmacokinetic",
        severity: "high",
        title: "CYP Induction",
        desc: `Carbamazepine ลดระดับ ${other} ผ่าน CYP3A4/2C9 induction ต้องปรับขนาดหรือหลีกเลี่ยง`,
        management: "ติดตามประสิทธิภาพการรักษา อาจต้องเพิ่มขนาดยาหรือเปลี่ยนเป็นยาที่ไม่ผ่าน CYP",
      };
    }
  }

  const sedatives = ["gabapentin", "pregabalin", "amitriptyline", "tramadol"];
  if (sedatives.includes(drugA) && sedatives.includes(drugB)) {
    return {
      type: "Pharmacodynamic",
      severity: "low",
      title: "Additive Sedation",
      desc: "เสริมฤทธิ์ง่วงซึม เวียนหัว ต้องเริ่มขนาดต่ำและเตือนเรื่องขับรถ หกล้ม",
      management: "เริ่ม Low, Go Slow และเตือนผู้ป่วยเรื่องการทรงตัว ขับขี่ยานพาหนะ",
    };
  }

  return {
    type: "Pharmacodynamic",
    severity: "low",
    title: "ระวังการใช้ร่วม",
    desc: "ไม่มีปฏิกิริยารุนแรงตาม Guideline แต่ควรประเมินความเสี่ยงรายบุคคล เริ่ม Low go Slow",
    management: "เริ่มขนาดยาต่ำและติดตามผลข้างเคียงตามปกติ",
  };
}

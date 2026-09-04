export interface Phenotype {
  id: string;
  th: string;
  en: string;
  emoji: string;
  desc: string;
}

export interface Etiology {
  id: string;
  th: string;
  en: string;
  note: string;
  firstLine: string[];
}

export interface Comorbidity {
  id: string;
  th: string;
  en: string;
  emoji: string;
  group: "avoid" | "caution" | "positive";
  hint: string;
}

export interface DrugRule {
  level: "contra" | "caution" | "benefit";
  reason: string;
}

export interface Drug {
  id: string;
  name: string;
  mech: string;
  mechTh: string;
  dose: string;
  startingDose: string;
  pos: string[];
  neg: string[];
  color: string;
  scores: Record<string, number>;
}

export const PHENOTYPES: Phenotype[] = [
  { id: "burning", th: "แสบร้อน", en: "Burning", emoji: "🔥", desc: "Small fiber, C-fiber sensitization" },
  { id: "lancinating", th: "แปล๊บ ไฟช็อต", en: "Lancinating / Electric shock", emoji: "⚡", desc: "Ectopic Na-channel burst" },
  { id: "allodynia", th: "แตะก็ปวด", en: "Allodynia / Hyperalgesia", emoji: "🖐️", desc: "Central sensitization, Aβ to pain" },
  { id: "paresthesia", th: "ชา ยิบๆ ถุงมือถุงเท้า", en: "Paresthesia / Dysesthesia", emoji: "🧤", desc: "Stocking-glove, DPN-like" },
  { id: "mixed", th: "Mixed / DPN pattern", en: "Mixed / DPN pattern", emoji: "🧩", desc: "ผสมหลายกลไก" },
];

export const ETIOLOGIES: Etiology[] = [
  { id: "dpn", th: "DPN", en: "Diabetic Peripheral Neuropathy", note: "เบาหวาน", firstLine: ["pregabalin", "gabapentin", "duloxetine"] },
  { id: "phn", th: "PHN", en: "Postherpetic Neuralgia", note: "หลังงูสวัด", firstLine: ["amitriptyline", "gabapentin", "pregabalin"] },
  { id: "tgn", th: "TGN", en: "Trigeminal Neuralgia", note: "ปวดเส้นประสาทใบหน้า", firstLine: ["carbamazepine", "oxcarbazepine"] },
  { id: "central", th: "Central Pain", en: "Central Neuropathic Pain", note: "Post-stroke / SCI", firstLine: ["amitriptyline", "pregabalin"] },
  { id: "phantom", th: "Phantom Pain", en: "Phantom Limb Pain", note: "ปวดแขนขาเทียม", firstLine: ["gabapentin", "amitriptyline"] },
  { id: "fibro", th: "Fibromyalgia", en: "Fibromyalgia", note: "Myofascial/Fibro 2020", firstLine: ["duloxetine", "amitriptyline", "pregabalin"] },
  { id: "myofascial", th: "Myofascial", en: "Myofascial Pain", note: "ปวดกล้ามเนื้อ", firstLine: ["amitriptyline", "duloxetine"] },
];

export const COMORBIDITIES: Comorbidity[] = [
  { id: "cardiac", th: "โรคหัวใจ / เต้นผิดจังหวะ", en: "Cardiac / Arrhythmia", emoji: "❤️", group: "avoid", hint: "เลี่ยง TCA" },
  { id: "ht", th: "ความดันสูงควบคุมไม่ได้", en: "HT uncontrolled", emoji: "🩸", group: "caution", hint: "ระวัง TCA/SNRI" },
  { id: "bph", th: "ต่อมลูกหมากโต / ปัสสาวะลำบาก", en: "BPH", emoji: "🚽", group: "avoid", hint: "เลี่ยง TCA" },
  { id: "glaucoma", th: "ต้อหินมุมปิด", en: "Closed-angle glaucoma", emoji: "👁️", group: "avoid", hint: "เลี่ยง TCA" },
  { id: "dementia", th: "สมองเสื่อม / อายุ >65", en: "Dementia / Elderly >65", emoji: "🧠", group: "avoid", hint: "เลี่ยง TCA" },
  { id: "epilepsy", th: "โรคลมชัก", en: "Epilepsy", emoji: "⚡", group: "avoid", hint: "เลี่ยง TCA/Tramadol" },
  { id: "renal", th: "โรคไตเสื่อม", en: "Renal impairment", emoji: "🫘", group: "caution", hint: "ลดขนาด Gabapentinoids" },
  { id: "liver", th: "โรคตับ", en: "Liver disease", emoji: "🫁", group: "caution", hint: "ระวัง CBZ/OXC" },
  { id: "gait", th: "Gait instability / เสี่ยงล้ม", en: "Fall risk", emoji: "🦯", group: "caution", hint: "ระวังยากดประสาท" },
  { id: "diuretics", th: "ใช้ยาขับปัสสาวะ", en: "Diuretics", emoji: "💧", group: "caution", hint: "Hyponatremia + CBZ" },
  { id: "depression", th: "ซึมเศร้า / นอนไม่หลับ", en: "Depression / Insomnia", emoji: "🌙", group: "positive", hint: "ได้ประโยชน์ 2 ต่อ" },
];

export const COMORBIDITY_RULES: Record<string, Record<string, DrugRule>> = {
  cardiac: {
    amitriptyline: { level: "contra", reason: "TCA → tachycardia + anticholinergic + QT prolong → เสี่ยง arrhythmia / MI (Table 3.1.1)" },
  },
  ht: {
    amitriptyline: { level: "caution", reason: "TCA ↑ sympathetic → ความดันแกว่ง + orthostatic hypotension" },
    venlafaxine: { level: "contra", reason: "Venlafaxine ↑ BP แบบ dose-dependent ห้ามใน HT ควบคุมไม่ได้ (Table 3.1.1)" },
    duloxetine: { level: "caution", reason: "อาจเพิ่ม BP เล็กน้อย ต้องติดตาม BP ทุก 2 สัปดาห์" },
  },
  bph: {
    amitriptyline: { level: "contra", reason: "Anticholinergic แรง → กด detrusor + เพิ่ม sphincter tone → ปัสสาวะค้างเฉียบพลัน" },
  },
  glaucoma: {
    amitriptyline: { level: "contra", reason: "Anticholinergic → ม่านตาขยาย → ปิดมุมตา → IOP พุ่งเฉียบพลัน (มุมปิด)" },
  },
  dementia: {
    amitriptyline: { level: "contra", reason: "Anticholinergic สูงสุด → สับสน, ความจำแย่, ↑ risk dementia, Beers criteria ห้ามใน >65" },
    carbamazepine: { level: "caution", reason: "ง่วง สับสน เดินเซ เสี่ยงล้ม" },
  },
  epilepsy: {
    amitriptyline: { level: "caution", reason: "ลด seizure threshold ในขนาดสูง >75mg" },
    tramadol: { level: "contra", reason: "ลด seizure threshold แรง + ลด metabolism ของ carbamazepine → เสี่ยงชัก" },
  },
  renal: {
    gabapentin: { level: "caution", reason: "ขับทางไต 100% ต้องลดขนาดตาม eGFR (eGFR <30: max 700mg/d, <15: max 300mg qod)" },
    pregabalin: { level: "caution", reason: "ขับทางไต 98% ต้องลดขนาดตาม eGFR (eGFR <30: max 75mg/d)" },
    tramadol: { level: "caution", reason: "Metabolite M1 สะสม → ง่วง, ชัก, ต้องลด dose เหลือ 50-100mg q12h เมื่อ eGFR<30" },
  },
  liver: {
    carbamazepine: { level: "contra", reason: "Hepatotoxicity, Black box warning → ห้ามใช้ในโรคตับรุนแรง" },
    duloxetine: { level: "contra", reason: "เสี่ยง Hepatic failure, ห้ามใช้ใน Chronic liver disease / Cirrhosis" },
    oxcarbazepine: { level: "caution", reason: "ระวังในตับเสื่อมปานกลาง-รุนแรง" },
  },
  gait: {
    amitriptyline: { level: "caution", reason: "ง่วง, orthostatic hypotension, anticholinergic → ล้ม, กระดูกหักในผู้สูงอายุ" },
    gabapentin: { level: "caution", reason: "Ataxia, dizziness, sedation → ระวังล้ม เริ่ม 100-300mg HS" },
    pregabalin: { level: "caution", reason: "Ataxia, dizziness, peripheral edema → เริ่ม 25-50mg HS" },
    tramadol: { level: "caution", reason: "Dizziness, sedation, orthostasis" },
  },
  diuretics: {
    carbamazepine: { level: "contra", reason: "SIADH-like effect + Diuretics → Hyponatremia รุนแรง (ตรวจ Na+ ก่อนและหลังเริ่ม)" },
    oxcarbazepine: { level: "contra", reason: "Hyponatremia สูงกว่า CBZ (2.5-3 เท่า) ห้ามร่วมกับ Diuretics ถ้า Na <135" },
    duloxetine: { level: "caution", reason: "SNRI ทำให้เกิด SIADH / Hyponatremia ได้ โดยเฉพาะผู้สูงอายุหญิง" },
    venlafaxine: { level: "caution", reason: "SNRI ทำให้เกิด SIADH / Hyponatremia ได้" },
  },
  depression: {
    amitriptyline: { level: "benefit", reason: "ได้ 2 ต่อ: แก้ปวด + ซึมเศร้า + นอนไม่หลับ (sedative HS) → First-line ถ้าไม่มีข้อห้าม" },
    duloxetine: { level: "benefit", reason: "ได้ 2 ต่อ: ข้อบ่งชี้ทั้ง MDD + Neuropathic Pain + Fibromyalgia (60 mg OD)" },
    venlafaxine: { level: "benefit", reason: "ได้ 2 ต่อ: รักษาโรคซึมเศร้า + วิตกกังวล + อาการปวด (75-150 mg)" },
    pregabalin: { level: "benefit", reason: "ได้ประโยชน์เสริม: ลดโรควิตกกังวล + นอนไม่หลับ (อนุมัติ GAD)" },
  },
};

export const DRUGS: Drug[] = [
  {
    id: "amitriptyline",
    name: "Amitriptyline",
    mech: "TCA / SNRI + Na blocker",
    mechTh: "ยับยั้งนำกลับ Serotonin/NE + ปิดช่องโซเดียม",
    dose: "10-75 mg HS",
    startingDose: "10 mg HS (เพิ่ม 10-25 mg ทุก 3-7 วัน)",
    pos: ["ซึมเศร้า", "นอนไม่หลับ", "ปวดศีรษะตึงตัวร่วม", "ราคาประหยัด"],
    neg: ["โรคหัวใจ", "BPH", "ต้อหินมุมปิด", "ผู้สูงอายุ >65 (Beers)"],
    color: "bg-blue-600",
    scores: { burning: 3, lancinating: 1, allodynia: 3, paresthesia: 2, mixed: 3, dpn: 2, phn: 3, tgn: 0, central: 3, phantom: 2, fibro: 3, myofascial: 3 },
  },
  {
    id: "gabapentin",
    name: "Gabapentin",
    mech: "α2δ Calcium Ligand",
    mechTh: "จับ subunit α2δ ลดการหลั่ง Glutamate / Substance P",
    dose: "300-2400 mg/day (แบ่ง TID)",
    startingDose: "100-300 mg HS (ไตปกติเริ่ม 300 mg HS)",
    pos: ["ปลอดภัยในโรคหัวใจ", "ไม่ผ่านตับ CYP", "โรคลมชักร่วม"],
    neg: ["ไตเสื่อม (ต้องปรับ dose)", "บวมน้ำ", "เวียนหัว / ล้มในผู้สูงอายุ"],
    color: "bg-emerald-600",
    scores: { burning: 3, lancinating: 2, allodynia: 3, paresthesia: 3, mixed: 3, dpn: 3, phn: 3, tgn: 1, central: 2, phantom: 3, fibro: 2, myofascial: 1 },
  },
  {
    id: "pregabalin",
    name: "Pregabalin",
    mech: "α2δ Calcium Ligand (High affinity)",
    mechTh: "จับ α2δ แน่นกว่า Gabapentin 6 เท่า ดูดซึมเชิงเส้น คาดการณ์ได้",
    dose: "75-600 mg/day (แบ่ง BID)",
    startingDose: "25-75 mg HS (ผู้สูงอายุเริ่ม 25-50 mg)",
    pos: ["ออกฤทธิ์เร็วกว่า GP", "วิตกกังวลร่วม (GAD)", "นอนไม่หลับ"],
    neg: ["น้ำหนักตัวเพิ่ม", "บวมข้อเท้า", "ไตเสื่อม (ต้องปรับ dose)"],
    color: "bg-teal-600",
    scores: { burning: 3, lancinating: 2, allodynia: 3, paresthesia: 3, mixed: 3, dpn: 3, phn: 3, tgn: 1, central: 3, phantom: 2, fibro: 3, myofascial: 1 },
  },
  {
    id: "duloxetine",
    name: "Duloxetine",
    mech: "SNRI (Balanced 5-HT/NE)",
    mechTh: "ยับยั้งนำกลับ Serotonin & NE สมดุล เสริม Descending inhibition",
    dose: "30-60 mg OD",
    startingDose: "30 mg OD พร้อมอาหารเช้า 1 สัปดาห์ → 60 mg OD",
    pos: ["DPN ชัดเจน", "Fibromyalgia", "ซึมเศร้า / ปวดเรื้อรัง"],
    neg: ["ตับเสื่อม", "Hyponatremia ร่วมกับ Diuretics / NSAIDs"],
    color: "bg-emerald-600",
    scores: { burning: 2, lancinating: 1, allodynia: 2, paresthesia: 3, mixed: 3, dpn: 3, phn: 1, tgn: 0, central: 2, phantom: 1, fibro: 3, myofascial: 3 },
  },
  {
    id: "venlafaxine",
    name: "Venlafaxine XR",
    mech: "SNRI (Dose-dependent)",
    mechTh: "ยับยั้ง 5-HT ในขนาดต่ำ และยับยั้ง NE ในขนาด >150 mg",
    dose: "75-150 mg/day (max 225)",
    startingDose: "37.5-75 mg OD เช้า",
    pos: ["ซึมเศร้า", "วิตกกังวล"],
    neg: ["ความดันสูงควบคุมไม่ได้", "Hyponatremia", "อาการถอนยาเร็ว"],
    color: "bg-teal-600",
    scores: { burning: 2, lancinating: 1, allodynia: 2, paresthesia: 2, mixed: 2, dpn: 2, phn: 1, tgn: 0, central: 2, phantom: 1, fibro: 2, myofascial: 2 },
  },
  {
    id: "carbamazepine",
    name: "Carbamazepine",
    mech: "Voltage-gated Na+ Blocker",
    mechTh: "บล็อกช่องโซเดียม ลด ectopic high-frequency discharge",
    dose: "200-1200 mg/day (แบ่ง BID-TID)",
    startingDose: "100-200 mg BID พร้อมอาหาร",
    pos: ["Trigeminal Neuralgia (First-line อันดับ 1)"],
    neg: ["CYP inducer แรง", "Hyponatremia", "ผื่นรุนแรง HLA-B*15:02", "ผู้สูงอายุ"],
    color: "bg-amber-600",
    scores: { burning: 1, lancinating: 3, allodynia: 1, paresthesia: 1, mixed: 1, dpn: 0, phn: 1, tgn: 3, central: 0, phantom: 1, fibro: 0, myofascial: 0 },
  },
  {
    id: "oxcarbazepine",
    name: "Oxcarbazepine",
    mech: "Voltage-gated Na+ Blocker (Keto-analog)",
    mechTh: "คล้าย Carbamazepine แต่เกิด CYP induction น้อยกว่า ไม่ผ่าน epoxide",
    dose: "300-1800 mg/day (แบ่ง BID)",
    startingDose: "150-300 mg BID",
    pos: ["TGN ทางเลือกเมื่อทน CBZ ไม่ได้"],
    neg: ["Hyponatremia รุนแรงกว่า CBZ (ตรวจ Na+)", "ผู้สูงอายุ"],
    color: "bg-orange-600",
    scores: { burning: 1, lancinating: 3, allodynia: 1, paresthesia: 1, mixed: 1, dpn: 0, phn: 1, tgn: 3, central: 0, phantom: 1, fibro: 0, myofascial: 0 },
  },
  {
    id: "tramadol",
    name: "Tramadol",
    mech: "Weak μ-Opioid + SNRI",
    mechTh: "กระตุ้น receptor โอปิออยด์ + ยับยั้งนำกลับ 5-HT/NE (Second-line)",
    dose: "50-400 mg/day (max 400, ผู้สูงอายุ max 300)",
    startingDose: "50 mg prn q 6-8h หรือ 50 mg HS",
    pos: ["ปวดเฉียบพลันรุนแรงกำเริบ (Breakthrough pain)"],
    neg: ["เสพติด / พึ่งพิง", "ลด seizure threshold", "คลื่นไส้อาเจียน", "ผู้สูงอายุหกล้ม"],
    color: "bg-slate-700",
    scores: { burning: 1, lancinating: 1, allodynia: 1, paresthesia: 0, mixed: 1, dpn: 1, phn: 1, tgn: 0, central: 1, phantom: 1, fibro: 1, myofascial: 1 },
  },
];

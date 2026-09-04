import { DRUGS, ETIOLOGIES, COMORBIDITY_RULES, COMORBIDITIES, Drug, DrugRule } from "./data";

export interface ComorbidityAlertItem {
  comorbidityId: string;
  comorbidityLabel: string;
  level: "contra" | "caution" | "benefit";
  reason: string;
}

export interface DrugComorbiditySummary {
  level: "none" | "contra" | "caution" | "benefit";
  items: ComorbidityAlertItem[];
}

export interface RankedDrug extends Drug {
  phenotypeScore: number;
  etiologyScore: number;
  firstLineBonus: number;
  comorbidityAdjustment: number;
  totalScore: number;
  comorbiditySummary: DrugComorbiditySummary;
  isFirstLine: boolean;
  isInStock: boolean;
  tierScoreLabel: string;
  tierScoreClass: string;
}

export interface EvaluationInput {
  phenotypeId: string;
  etiologyId: string;
  comorbidityIds: string[];
  formularyStock?: Record<string, boolean>; // drugId -> isInStock
}

export interface CDSSResult {
  rankedDrugs: RankedDrug[];
  topRecommendations: RankedDrug[];
  selectedPhenotypeId: string;
  selectedEtiologyId: string;
  selectedComorbidityIds: string[];
  activeAlertCount: {
    contra: number;
    caution: number;
    benefit: number;
  };
}

export function getTierScoreBadge(score: number): { label: string; className: string } {
  if (score >= 5.5) {
    return { label: "+++", className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  }
  if (score >= 4.0) {
    return { label: "++", className: "text-blue-700 bg-blue-50 border-blue-200" };
  }
  if (score >= 2.5) {
    return { label: "+", className: "text-amber-700 bg-amber-50 border-amber-200" };
  }
  return { label: "+/-", className: "text-slate-500 bg-slate-50 border-slate-200" };
}

export function evaluateCDSS(input: EvaluationInput): CDSSResult {
  const { phenotypeId, etiologyId, comorbidityIds, formularyStock } = input;

  const currentEtiology = ETIOLOGIES.find((e) => e.id === etiologyId);
  const firstLineList = currentEtiology?.firstLine ?? [];

  // Compute comorbidity alerts for each drug
  const drugComorbidityMap: Record<string, DrugComorbiditySummary> = {};

  let totalContra = 0;
  let totalCaution = 0;
  let totalBenefit = 0;

  DRUGS.forEach((drug) => {
    const alertItems: ComorbidityAlertItem[] = [];

    comorbidityIds.forEach((cId) => {
      const rule: DrugRule | undefined = COMORBIDITY_RULES[cId]?.[drug.id];
      if (rule) {
        const comorbDef = COMORBIDITIES.find((c) => c.id === cId);
        alertItems.push({
          comorbidityId: cId,
          comorbidityLabel: comorbDef?.th || cId,
          level: rule.level,
          reason: rule.reason,
        });
      }
    });

    let overallLevel: "none" | "contra" | "caution" | "benefit" = "none";
    if (alertItems.some((item) => item.level === "contra")) {
      overallLevel = "contra";
      totalContra++;
    } else if (alertItems.some((item) => item.level === "caution")) {
      overallLevel = "caution";
      totalCaution++;
    } else if (alertItems.some((item) => item.level === "benefit")) {
      overallLevel = "benefit";
      totalBenefit++;
    }

    drugComorbidityMap[drug.id] = {
      level: overallLevel,
      items: alertItems,
    };
  });

  // Calculate scores and rank
  const ranked: RankedDrug[] = DRUGS.map((drug) => {
    const ps = drug.scores[phenotypeId] ?? 0;
    const ds = drug.scores[etiologyId] ?? 0;
    const isFirstLine = firstLineList.includes(drug.id);
    const firstLineBonus = isFirstLine ? 0.6 : 0;

    const cSummary = drugComorbidityMap[drug.id];
    let comorbidityAdjustment = 0;
    if (cSummary.level === "contra") {
      comorbidityAdjustment = -5.0;
    } else if (cSummary.level === "caution") {
      comorbidityAdjustment = -1.2;
    } else if (cSummary.level === "benefit") {
      comorbidityAdjustment = 1.0;
    }

    const totalScore = ps + ds + firstLineBonus + comorbidityAdjustment;
    const isInStock = formularyStock ? (formularyStock[drug.id] ?? true) : true;
    const tier = getTierScoreBadge(totalScore);

    return {
      ...drug,
      phenotypeScore: ps,
      etiologyScore: ds,
      firstLineBonus,
      comorbidityAdjustment,
      totalScore,
      comorbiditySummary: cSummary,
      isFirstLine,
      isInStock,
      tierScoreLabel: tier.label,
      tierScoreClass: tier.className,
    };
  });

  // Sorting: In-stock first, then by totalScore descending
  ranked.sort((a, b) => {
    if (a.isInStock !== b.isInStock) {
      return a.isInStock ? -1 : 1;
    }
    return b.totalScore - a.totalScore;
  });

  // Top recommendations: highest scored in-stock drugs that are not contraindicated
  const eligible = ranked.filter((d) => d.isInStock && d.comorbiditySummary.level !== "contra");
  const topRecommendations = eligible.slice(0, 2);

  return {
    rankedDrugs: ranked,
    topRecommendations,
    selectedPhenotypeId: phenotypeId,
    selectedEtiologyId: etiologyId,
    selectedComorbidityIds: comorbidityIds,
    activeAlertCount: {
      contra: totalContra,
      caution: totalCaution,
      benefit: totalBenefit,
    },
  };
}

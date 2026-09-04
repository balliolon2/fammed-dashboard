import { describe, it, expect } from "vitest";
import { evaluateCDSS } from "../src/lib/cdss/engine";
import { checkInteraction } from "../src/lib/cdss/ddi";

describe("TASP 2020 Clinical CDSS Engine", () => {
  it("recommends Pregabalin or Gabapentin for DPN with Burning pain", () => {
    const result = evaluateCDSS({
      phenotypeId: "burning",
      etiologyId: "dpn",
      comorbidityIds: [],
    });

    expect(result.topRecommendations.length).toBe(2);
    const topIds = result.topRecommendations.map((d) => d.id);
    expect(topIds).toContain("pregabalin");
    expect(topIds).toContain("gabapentin");
  });

  it("assigns Contraindication penalty (-5) to Amitriptyline in Cardiac Arrhythmia", () => {
    const result = evaluateCDSS({
      phenotypeId: "burning",
      etiologyId: "dpn",
      comorbidityIds: ["cardiac"],
    });

    const ami = result.rankedDrugs.find((d) => d.id === "amitriptyline");
    expect(ami).toBeDefined();
    expect(ami?.comorbiditySummary.level).toBe("contra");
    expect(ami?.comorbidityAdjustment).toBe(-5.0);

    const topIds = result.topRecommendations.map((d) => d.id);
    expect(topIds).not.toContain("amitriptyline");
  });

  it("prioritizes Carbamazepine and Oxcarbazepine for Trigeminal Neuralgia (TGN)", () => {
    const result = evaluateCDSS({
      phenotypeId: "lancinating",
      etiologyId: "tgn",
      comorbidityIds: [],
    });

    expect(result.topRecommendations[0]?.id).toBe("carbamazepine");
    expect(result.topRecommendations[1]?.id).toBe("oxcarbazepine");
  });

  it("deprioritizes out-of-stock medications when formulary stock is provided", () => {
    const result = evaluateCDSS({
      phenotypeId: "burning",
      etiologyId: "dpn",
      comorbidityIds: [],
      formularyStock: {
        pregabalin: false,
        gabapentin: true,
        duloxetine: true,
        amitriptyline: true,
      },
    });

    const pregabalin = result.rankedDrugs.find((d) => d.id === "pregabalin");
    expect(pregabalin?.isInStock).toBe(false);

    // Should not be in top recommendations because it is out of stock
    const topIds = result.topRecommendations.map((d) => d.id);
    expect(topIds).not.toContain("pregabalin");
    expect(topIds[0]).toBe("gabapentin");
  });

  it("correctly identifies high-risk Drug-Drug Interactions (DDIs)", () => {
    // Tramadol + Duloxetine -> Serotonin Syndrome
    const tramDulox = checkInteraction("tramadol", "duloxetine");
    expect(tramDulox).not.toBeNull();
    expect(tramDulox?.severity).toBe("high");
    expect(tramDulox?.title).toContain("Serotonin");

    // Amitriptyline + Tramadol -> High risk
    const amiTram = checkInteraction("amitriptyline", "tramadol");
    expect(amiTram?.severity).toBe("high");

    // Duplicate Gabapentinoid
    const gabapreg = checkInteraction("gabapentin", "pregabalin");
    expect(gabapreg?.severity).toBe("moderate");
    expect(gabapreg?.title).toContain("Duplicate");
  });
});

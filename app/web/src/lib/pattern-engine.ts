import "server-only";
import type {
  TimelineYear,
  ClimateVector,
  AnalogYear,
  PatternProjection,
  PatternAnalysis,
  YearClassification,
} from "./types";

// Weights derived from risk engine correlations
const WEIGHTS: Record<string, number> = {
  season_rain_mm: 0.20,
  critical_rain_mm: 0.18,
  hot_days: 0.18,
  frost_days: 0.08,
  avg_soil_moisture: 0.14,
  enso_code: 0.10,
  avg_tmax_summer: 0.07,
  winter_rain_mm: 0.05,
};

const DIMENSION_LABELS: Record<string, string> = {
  season_rain_mm: "Chuva safra (out-mar)",
  critical_rain_mm: "Chuva critica (dez-fev)",
  hot_days: "Dias quentes (>=32C)",
  frost_days: "Geadas (jul-set)",
  avg_soil_moisture: "Umidade do solo",
  enso_code: "ENSO",
  avg_tmax_summer: "Temperatura verao",
  winter_rain_mm: "Chuva inverno",
};

function ensoToCode(enso: string): number {
  const e = (enso ?? "").toLowerCase();
  if (e.includes("nino") || e.includes("niño") || e === "el_nino") return 1;
  if (e.includes("nina") || e.includes("niña") || e === "la_nina") return -1;
  return 0;
}

export function buildClimateVectors(
  timeline: TimelineYear[],
  monthlyData?: { month: number; avg_rain_mm: number }[]
): ClimateVector[] {
  return timeline
    .filter((y) => y.year > 0)
    .map((y) => {
      const seasonRain = y.season_rain_mm ?? y.annual_rain_mm * 0.55;
      const criticalRain = seasonRain * 0.45;
      const winterRain = y.annual_rain_mm - seasonRain;

      return {
        year: y.year,
        season_rain_mm: seasonRain,
        critical_rain_mm: criticalRain,
        hot_days: y.hot_days ?? 0,
        frost_days: y.frost_days ?? 0,
        avg_soil_moisture: y.avg_soil_moisture ?? 0,
        enso_code: ensoToCode(y.enso),
        avg_tmax_summer: y.avg_tmax_c ?? 0,
        winter_rain_mm: winterRain,
      };
    });
}

function zNormalize(
  vectors: ClimateVector[]
): { normalized: Record<number, Record<string, number>>; means: Record<string, number>; stds: Record<string, number> } {
  const keys = Object.keys(WEIGHTS);
  const means: Record<string, number> = {};
  const stds: Record<string, number> = {};

  for (const k of keys) {
    const vals = vectors.map((v) => (v as any)[k] as number);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    means[k] = mean;
    stds[k] = Math.sqrt(variance) || 1;
  }

  const normalized: Record<number, Record<string, number>> = {};
  for (const v of vectors) {
    normalized[v.year] = {};
    for (const k of keys) {
      normalized[v.year][k] = ((v as any)[k] - means[k]) / stds[k];
    }
  }

  return { normalized, means, stds };
}

function weightedEuclidean(a: Record<string, number>, b: Record<string, number>): number {
  let sum = 0;
  for (const k of Object.keys(WEIGHTS)) {
    sum += WEIGHTS[k] * (a[k] - b[k]) ** 2;
  }
  return Math.sqrt(sum);
}

function findMatchingDimensions(
  a: Record<string, number>,
  b: Record<string, number>,
  threshold: number = 0.5
): { matching: string[]; diverging: string[] } {
  const matching: string[] = [];
  const diverging: string[] = [];

  for (const k of Object.keys(WEIGHTS)) {
    if (Math.abs(a[k] - b[k]) <= threshold) {
      matching.push(DIMENSION_LABELS[k]);
    } else {
      diverging.push(DIMENSION_LABELS[k]);
    }
  }

  return { matching, diverging };
}

export function findAnalogYears(
  vectors: ClimateVector[],
  targetYear: number,
  classifications: YearClassification[],
  topN: number = 5
): AnalogYear[] {
  const { normalized } = zNormalize(vectors);
  const targetNorm = normalized[targetYear];
  if (!targetNorm) return [];

  const classMap = new Map(classifications.map((c) => [c.year, c]));
  const rawVectorMap = new Map(vectors.map((v) => [v.year, v]));

  const results: AnalogYear[] = [];

  for (const v of vectors) {
    if (v.year === targetYear) continue;
    const otherNorm = normalized[v.year];
    const distance = weightedEuclidean(targetNorm, otherNorm);
    const similarity = 1 / (1 + distance) * 100;
    const { matching, diverging } = findMatchingDimensions(targetNorm, otherNorm);

    const cls = classMap.get(v.year);
    const raw = rawVectorMap.get(v.year)!;

    results.push({
      year: v.year,
      similarity_pct: Math.round(similarity * 10) / 10,
      distance: Math.round(distance * 1000) / 1000,
      matching_dimensions: matching,
      diverging_dimensions: diverging,
      outcome: {
        yield_sc_ha: cls?.yield_sc_ha ?? null,
        class: cls?.class ?? "sem_dados",
        season_rain_mm: raw.season_rain_mm,
        hot_days: raw.hot_days,
        enso: cls?.enso ?? (raw.enso_code === 1 ? "El Nino" : raw.enso_code === -1 ? "La Nina" : "Neutro"),
      },
    });
  }

  results.sort((a, b) => b.similarity_pct - a.similarity_pct);
  return results.slice(0, topN);
}

export function projectOutcome(
  analogs: AnalogYear[],
  historicalAvg: number
): PatternProjection {
  const withYield = analogs.filter((a) => a.outcome.yield_sc_ha != null);

  if (withYield.length === 0) {
    return {
      expected_yield_range: [historicalAvg * 0.85, historicalAvg * 1.15],
      confidence: "baixa",
      risk_factors: ["Dados insuficientes para projecao precisa"],
      positive_factors: [],
      recommendation: "Historico limitado impede projecao confiavel. Use a media historica como referencia.",
    };
  }

  const totalSim = withYield.reduce((s, a) => s + a.similarity_pct, 0);
  const weightedYield = withYield.reduce(
    (s, a) => s + (a.outcome.yield_sc_ha! * a.similarity_pct) / totalSim,
    0
  );

  const yields = withYield.map((a) => a.outcome.yield_sc_ha!);
  const minY = Math.min(...yields);
  const maxY = Math.max(...yields);

  const spread = maxY - minY;
  const confidence: "alta" | "media" | "baixa" =
    withYield.length >= 4 && spread < historicalAvg * 0.3
      ? "alta"
      : withYield.length >= 2 && spread < historicalAvg * 0.5
        ? "media"
        : "baixa";

  const riskFactors: string[] = [];
  const positiveFactors: string[] = [];

  const badYears = withYield.filter((a) => a.outcome.class === "safra_ruim");
  if (badYears.length > withYield.length / 2) {
    riskFactors.push(
      `${badYears.length} dos ${withYield.length} anos analogos tiveram safra ruim`
    );
  }

  const ninoYears = withYield.filter(
    (a) => a.outcome.enso.toLowerCase().includes("nino") || a.outcome.enso.toLowerCase().includes("niño")
  );
  if (ninoYears.length > withYield.length / 2) {
    riskFactors.push("Maioria dos anos analogos foram El Nino — risco de excesso de chuva no trigo");
  }

  const ninaYears = withYield.filter(
    (a) => a.outcome.enso.toLowerCase().includes("nina") || a.outcome.enso.toLowerCase().includes("niña")
  );
  if (ninaYears.length > withYield.length / 2) {
    riskFactors.push("Maioria dos anos analogos foram La Nina — risco de deficit hidrico na soja");
  }

  const lowRainYears = withYield.filter((a) => a.outcome.season_rain_mm < 600);
  if (lowRainYears.length > 0) {
    riskFactors.push("Alguns anos analogos tiveram chuva abaixo de 600mm na safra");
  }

  const goodYears = withYield.filter((a) => a.outcome.class === "safra_boa");
  if (goodYears.length > withYield.length / 2) {
    positiveFactors.push(
      `${goodYears.length} dos ${withYield.length} anos analogos tiveram safra boa`
    );
  }

  if (weightedYield > historicalAvg) {
    positiveFactors.push("Projecao ponderada acima da media historica");
  }

  const margin = spread * 0.3;
  const recommendation = buildRecommendation(weightedYield, historicalAvg, riskFactors, confidence);

  return {
    expected_yield_range: [
      Math.round((weightedYield - margin) * 10) / 10,
      Math.round((weightedYield + margin) * 10) / 10,
    ],
    confidence,
    risk_factors: riskFactors,
    positive_factors: positiveFactors,
    recommendation,
  };
}

function buildRecommendation(
  projected: number,
  avg: number,
  risks: string[],
  confidence: string
): string {
  const parts: string[] = [];

  if (projected > avg * 1.1) {
    parts.push("Padrao climatico favoravel comparado a media historica.");
  } else if (projected < avg * 0.9) {
    parts.push("Padrao climatico abaixo da media. Considere estrategia conservadora.");
  } else {
    parts.push("Padrao climatico dentro da normalidade.");
  }

  if (risks.length > 0) {
    parts.push(`Atencao: ${risks[0].toLowerCase()}.`);
  }

  if (confidence === "baixa") {
    parts.push("Confianca baixa — monitore com frequencia.");
  }

  return parts.join(" ");
}

export async function analyzePatterns(
  siteId: string,
  timeline: TimelineYear[],
  classifications: YearClassification[],
  historicalAvgYield: number,
  targetYear?: number
): Promise<PatternAnalysis> {
  const vectors = buildClimateVectors(timeline);
  const target = targetYear ?? Math.max(...vectors.map((v) => v.year));
  const analogs = findAnalogYears(vectors, target, classifications);
  const projection = projectOutcome(analogs, historicalAvgYield);

  const targetVec = vectors.find((v) => v.year === target)!;

  return {
    site_id: siteId,
    target_year: target,
    target_vector: targetVec,
    analog_years: analogs,
    projection,
    all_vectors: vectors,
    stats: {
      total_years_analyzed: vectors.length,
      years_with_yield: classifications.length,
      vector_dimensions: Object.keys(WEIGHTS).length,
    },
  };
}

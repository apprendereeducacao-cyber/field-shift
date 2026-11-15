import type {
  CoverCrop,
  CoverCropsData,
  TimelineYear,
  TimelineData,
  RiskEngineData,
} from "./types";

// --- Types ---

export type ProducerProfile = {
  has_cattle: boolean;
  soil_compacted: boolean;
  used_green_manure: boolean;
  main_problems: string[];
  recent_yield: string;
  winter_crop_used: string;
};

export type ScoredCrop = {
  crop: CoverCrop;
  score: number;
  reasons: string[];
};

export type CropCombo = {
  crops: ScoredCrop[];
  comboScore: number;
  name: string;
  why: string;
  calendar: { month: string; action: string }[];
};

export type Recommendation = {
  year: number;
  riskScore: number;
  riskLabel: string;
  primaryNeed: string;
  bestCombo: CropCombo;
  alternatives: CropCombo[];
  climateContext: string;
};

// --- Helpers ---

function getRiskScore(year: number, riskEngineData: RiskEngineData, timelineData: TimelineData): number {
  const yr = riskEngineData.year_risks.find((y) => y.year === year);
  if (yr) return yr.risk_score;
  const tl = timelineData.timeline.find((y) => y.year === year);
  if (!tl) return 50;
  return computeRiskFromTimeline(tl, riskEngineData);
}

function computeRiskFromTimeline(tl: TimelineYear, riskEngineData: RiskEngineData): number {
  const avgs = riskEngineData.historical_averages;
  const rainDef = Math.max(0, (avgs.season_rain_mm - (tl.season_rain_mm ?? avgs.season_rain_mm)) / avgs.season_rain_mm) * 100;
  const heatExcess = Math.max(0, (tl.hot_days - avgs.hot_days) / avgs.hot_days) * 100;
  const moistDef = Math.max(0, (avgs.avg_soil_moisture - (tl.avg_soil_moisture ?? avgs.avg_soil_moisture)) / avgs.avg_soil_moisture) * 100;
  return Math.min(100, rainDef * 0.36 + heatExcess * 0.37 + moistDef * 0.27);
}

function riskLabel(score: number): string {
  if (score >= 65) return "alto";
  if (score >= 40) return "medio";
  return "baixo";
}

// --- Scoring Engine ---

function detectPrimaryNeed(
  riskScore: number,
  tl: TimelineYear,
  profile: ProducerProfile | null,
  riskEngineData: RiskEngineData
): string {
  const avgs = riskEngineData.historical_averages;
  const problems = profile?.main_problems ?? [];

  if (profile?.soil_compacted || problems.includes("solo_compactado")) return "descompactacao";

  const rainDef = (tl.season_rain_mm ?? avgs.season_rain_mm) < avgs.season_rain_mm * 0.85;
  const soilDry = (tl.avg_soil_moisture ?? avgs.avg_soil_moisture) < avgs.avg_soil_moisture * 0.9;

  if (problems.includes("seca") || (rainDef && soilDry)) {
    return "retencao_umidade";
  }

  if (riskScore >= 65) {
    return "protecao_maxima";
  }

  if (profile?.has_cattle) {
    return "forragem_inverno";
  }

  if (profile?.recent_yield === "ruim" || profile?.recent_yield === "perda_total") {
    return "recuperacao_solo";
  }

  if (riskScore < 30) {
    return "renda_inverno";
  }

  return "cobertura_geral";
}

function scoreCrop(
  crop: CoverCrop,
  need: string,
  riskScore: number,
  tl: TimelineYear,
  profile: ProducerProfile | null
): ScoredCrop {
  let score = 0;
  const reasons: string[] = [];
  const fns = new Set(crop.functions);

  // Score by primary need
  switch (need) {
    case "descompactacao":
      if (fns.has("descompactacao")) {
        score += 40;
        reasons.push(`Raiz pivotante rompe camada compactada — alternativa ao subsolador (economia de R$200-400/ha)`);
      }
      if (fns.has("cobertura_rapida")) {
        score += 10;
        reasons.push("Cobre o solo rapido apos a semeadura");
      }
      break;

    case "retencao_umidade":
      if (fns.has("palha_duradoura")) {
        score += 35;
        reasons.push("Palha duradoura reduz evaporacao e mantem umidade no solo");
      }
      if (fns.has("cobertura_rapida")) {
        score += 15;
        reasons.push("Fecha o solo rapido — menos agua perdida por evaporacao direta");
      }
      break;

    case "protecao_maxima":
      if (fns.has("palha_duradoura")) {
        score += 30;
        reasons.push("Palha protege contra erosao e mantem umidade em ano de risco alto");
      }
      if (fns.has("fixa_nitrogenio")) {
        score += 20;
        reasons.push("Nitrogenio fixado reduz custo com adubo na proxima safra");
      }
      if (fns.has("cobertura_rapida")) {
        score += 10;
        reasons.push("Cobertura rapida = proteção desde o inicio do inverno");
      }
      break;

    case "forragem_inverno":
      if (crop.id === "aveia-preta" || crop.id === "aveia-branca" || crop.id === "azevem") {
        score += 35;
        reasons.push("Serve como pasto no inverno — gado bem alimentado sem custo extra de racao");
      }
      if (fns.has("palha_duradoura")) {
        score += 10;
        reasons.push("Apos o pastejo, ainda deixa residuo que protege o solo");
      }
      break;

    case "recuperacao_solo":
      if (fns.has("fixa_nitrogenio")) {
        score += 30;
        reasons.push("Fixa nitrogenio do ar — recupera fertilidade sem custo de ureia");
      }
      if (fns.has("palha_duradoura")) {
        score += 15;
        reasons.push("Materia organica da palha alimenta a biologia do solo");
      }
      if (fns.has("descompactacao")) {
        score += 15;
        reasons.push("Abre caminho para as raizes da soja no verao");
      }
      break;

    case "renda_inverno":
      if (fns.has("renda_grao")) {
        score += 40;
        reasons.push("Grao vendavel no inverno — renda extra enquanto protege o solo");
      }
      if (fns.has("palha_duradoura")) {
        score += 10;
        reasons.push("Resteva apos colheita protege o solo ate o plantio da soja");
      }
      break;

    default: // cobertura_geral
      if (fns.has("palha_duradoura")) score += 20;
      if (fns.has("cobertura_rapida")) score += 15;
      if (fns.has("fixa_nitrogenio")) score += 15;
      if (fns.has("descompactacao")) score += 10;
      if (reasons.length === 0 && score > 0) {
        reasons.push("Cobertura equilibrada para protecao geral do solo");
      }
      break;
  }

  // Bonus: experience
  if (profile && !profile.used_green_manure) {
    if (crop.id === "aveia-preta") {
      score += 10;
      reasons.push("Manejo simples — ideal para quem nunca usou cobertura de inverno");
    }
  }

  // Bonus: biomass potential
  if (crop.dry_matter_t_ha) {
    const maxDM = crop.dry_matter_t_ha[1] ?? crop.dry_matter_t_ha[0];
    if (maxDM && maxDM >= 6) {
      score += 5;
      reasons.push(`Produz ate ${maxDM} t/ha de materia seca`);
    }
  }

  // Penalty: incomplete data (less reliable recommendation)
  if (!crop.sowing_months || crop.sowing_months.length === 0) {
    score -= 10;
  }

  return { crop, score: Math.max(0, score), reasons };
}

// --- Combo Builder ---

function buildCombos(
  scored: ScoredCrop[],
  need: string,
  profile: ProducerProfile | null
): CropCombo[] {
  const combos: CropCombo[] = [];
  const top = scored.filter((s) => s.score > 0).slice(0, 6);

  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      const a = top[i];
      const b = top[j];

      // Skip if same family (redundant)
      if (a.crop.family === b.crop.family && a.crop.group === b.crop.group) continue;

      // Synergy bonus
      let synergy = 0;
      let why = "";
      const aFns = new Set(a.crop.functions);
      const bFns = new Set(b.crop.functions);

      // Graminea + leguminosa = classic combo
      if (
        (a.crop.group === "graminea" && b.crop.group === "leguminosa") ||
        (a.crop.group === "leguminosa" && b.crop.group === "graminea")
      ) {
        synergy += 15;
        const gram = a.crop.group === "graminea" ? a.crop : b.crop;
        const leg = a.crop.group === "leguminosa" ? a.crop : b.crop;
        why = `${gram.name} faz palha duradoura + ${leg.name} fixa nitrogenio — combinacao classica que cobre e alimenta o solo`;
      }

      // Descompactacao + cobertura
      if (
        (aFns.has("descompactacao") && bFns.has("palha_duradoura")) ||
        (bFns.has("descompactacao") && aFns.has("palha_duradoura"))
      ) {
        synergy += 10;
        if (!why) why = "Raiz profunda descompacta + palha protege a superficie";
      }

      // Renda + protecao
      if (
        (aFns.has("renda_grao") && (bFns.has("fixa_nitrogenio") || bFns.has("descompactacao"))) ||
        (bFns.has("renda_grao") && (aFns.has("fixa_nitrogenio") || aFns.has("descompactacao")))
      ) {
        synergy += 10;
        if (!why) why = "Grao gera renda no inverno + a outra especie melhora o solo";
      }

      if (!why) {
        why = `${a.crop.name} + ${b.crop.name} — funcoes complementares para o inverno`;
      }

      const comboScore = a.score + b.score + synergy;
      const calendar = buildCalendar(a.crop, b.crop, need);

      combos.push({
        crops: [a, b],
        comboScore,
        name: `${a.crop.name} + ${b.crop.name}`,
        why,
        calendar,
      });
    }
  }

  // Also add single-crop options for simplicity
  for (const s of top.slice(0, 3)) {
    if (s.score >= 20) {
      combos.push({
        crops: [s],
        comboScore: s.score * 0.7, // single crop gets penalty vs combo
        name: s.crop.name,
        why: `${s.crop.name} sozinha — opcao mais simples se quiser comecar devagar`,
        calendar: buildCalendarSingle(s.crop, need),
      });
    }
  }

  return combos.sort((a, b) => b.comboScore - a.comboScore);
}

function buildCalendar(a: CoverCrop, b: CoverCrop, need: string): { month: string; action: string }[] {
  const hasGrain = a.functions.includes("renda_grao") || b.functions.includes("renda_grao");
  const grain = a.functions.includes("renda_grao") ? a : b;
  const other = a.functions.includes("renda_grao") ? b : a;

  if (hasGrain && grain.id === "trigo") {
    return [
      { month: "Mai-Jun", action: `Plantar ${grain.name}` },
      { month: "Jul-Ago", action: `${grain.name} em desenvolvimento` },
      { month: "Set", action: `Plantar ${other.name} nas entrelinhas ou apos colheita` },
      { month: "Out", action: `Colher ${grain.name} (renda). ${other.name} crescendo` },
      { month: "Nov", action: `Dessecar ${other.name}. Plantar soja sobre a palha` },
    ];
  }

  // Default: simultaneous sowing
  return [
    { month: "Abr", action: `Plantar ${a.name} + ${b.name} juntas` },
    { month: "Mai-Ago", action: "Cobertura em crescimento. Protegendo o solo durante o inverno" },
    { month: "Set", action: "Avaliar ponto de dessecacao (florescimento pleno = maxima biomassa)" },
    { month: "Out", action: "Dessecar e plantar soja sobre a palha" },
  ];
}

function buildCalendarSingle(crop: CoverCrop, need: string): { month: string; action: string }[] {
  if (crop.functions.includes("renda_grao")) {
    return [
      { month: "Mai-Jun", action: `Plantar ${crop.name}` },
      { month: "Jul-Set", action: `${crop.name} em desenvolvimento` },
      { month: "Out", action: `Colher ${crop.name}. Plantar soja sobre a resteva` },
    ];
  }
  return [
    { month: "Abr-Mai", action: `Plantar ${crop.name}` },
    { month: "Jun-Ago", action: `${crop.name} crescendo e protegendo o solo` },
    { month: "Set-Out", action: `Dessecar e plantar soja sobre a palha` },
  ];
}

// --- Need labels ---

const NEED_LABELS: Record<string, string> = {
  descompactacao: "Descompactar o solo",
  retencao_umidade: "Reter umidade (ano seco)",
  protecao_maxima: "Protecao maxima (risco alto)",
  forragem_inverno: "Forragem para o gado no inverno",
  recuperacao_solo: "Recuperar o solo apos safra ruim",
  renda_inverno: "Gerar renda no inverno",
  cobertura_geral: "Cobertura equilibrada",
};

// --- Main API ---

export type RecommendationInput = {
  coverCropsData: CoverCropsData;
  timelineData: TimelineData;
  riskEngineData: RiskEngineData;
};

export function getSmartRecommendation(
  year: number,
  input: RecommendationInput,
  profile: ProducerProfile | null = null
): Recommendation {
  const { coverCropsData, timelineData, riskEngineData } = input;
  const tl = timelineData.timeline.find((y) => y.year === year);
  if (!tl) {
    throw new Error(`Ano ${year} nao encontrado na timeline`);
  }

  const riskScore = getRiskScore(year, riskEngineData, timelineData);
  const rLabel = riskLabel(riskScore);
  const need = detectPrimaryNeed(riskScore, tl, profile, riskEngineData);
  const avgs = riskEngineData.historical_averages;

  const scored = coverCropsData.crops
    .map((crop) => scoreCrop(crop, need, riskScore, tl, profile))
    .sort((a, b) => b.score - a.score);

  // Build combos
  const combos = buildCombos(scored, need, profile);

  // Climate context
  const rainDiff = (tl.season_rain_mm ?? 0) - avgs.season_rain_mm;
  const hotDiff = tl.hot_days - avgs.hot_days;
  let context = `Safra ${year}: `;
  if (rainDiff < -100) context += `chuva bem abaixo da media (${Math.round(rainDiff)} mm). `;
  else if (rainDiff > 100) context += `chuva acima da media (+${Math.round(rainDiff)} mm). `;
  else context += "chuva proxima da media. ";

  if (hotDiff > 10) context += `Calor acima do normal (+${Math.round(hotDiff)} dias acima de 32C). `;
  else if (hotDiff < -5) context += "Menos calor que o normal. ";

  const ensoLabel = tl.enso.includes("la_nina") ? "La Nina (menos chuva)" : tl.enso.includes("el_nino") ? "El Nino (mais chuva)" : "ENSO neutro";
  context += ensoLabel + ".";

  return {
    year,
    riskScore,
    riskLabel: rLabel,
    primaryNeed: NEED_LABELS[need] ?? need,
    bestCombo: combos[0],
    alternatives: combos.slice(1, 3),
    climateContext: context,
  };
}

export const DEFAULT_PROFILE: ProducerProfile = {
  has_cattle: false,
  soil_compacted: false,
  used_green_manure: false,
  main_problems: [],
  recent_yield: "normal",
  winter_crop_used: "pousio",
};

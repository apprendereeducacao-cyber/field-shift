// Origem: apprendereeducacao-cyber/fieldshift-kaua, branch fieldshift/evolucao (commit f33ade2), arquivo app/web/src/lib/zarcnm.ts.
// Portado sem mudança de lógica; testes em scripts/test-zarcnm.mjs.
// Regras do ZarcNM (soja), portadas linha a linha de analysis/zarcnm-precheck/zarcnm_rules.py
// e da função nm_range de precheck.py (repo da equipe). Não é a classificação oficial: essa sai
// só do SINM da Embrapa (IN SPA/MAPA 2/2025, art. 3º). Aqui é sempre "pré-checagem".
// Cada função cita o item da norma; as interpretações são as mesmas do módulo Python
// (README do zarcnm-precheck). scripts/test-zarcnm.mts confere este porte contra o precheck.json.

export type Level = 1 | 2 | 3 | 4;
export type IndicatorCode = "V%" | "Ca" | "m%" | "T" | "C" | "D";
export const INDICATORS: IndicatorCode[] = ["V%", "Ca", "m%", "T", "C", "D"];

export const FABACEAE = "Fabaceae";
export const POACEAE = "Poaceae";
export const SOYBEAN_SPECIES = "Glycine max";
// "mais de 4 meses": INTERPRETAÇÃO como 4 meses médios (121,75 dias), igual ao Python.
export const FOUR_MONTHS_DAYS = (4 * 365.25) / 12;
export const COVER_MIN_DAYS = 45;
export const SUBSIDY_PCT_SOY: Record<Level, number> = { 1: 20, 2: 30, 3: 35, 4: 40 }; // CGSR 111/2026
export const ROOT_DEPTH_CM: Record<Level, number> = { 1: 40, 2: 60, 3: 80, 4: 100 }; // Portaria 209/2026, 2.5

const count = (v: number, lims: number[]) => lims.filter((l) => v >= l).length;

/** Tabela 1, linha 1 (item 2.1-I): V% 0–20 cm, limites pela CTC a pH 7. */
export function levelBaseSaturation(vPct: number, cec: number): Level {
  const lims = cec < 5 ? [35, 40, 50] : cec < 10 ? [40, 45, 55] : [50, 55, 65];
  return (1 + count(vPct, lims)) as Level;
}
/** Tabela 1, linha 2 (item 2.1-II): Ca 20–40 cm. */
export function levelCalcium(ca: number): Level {
  return (1 + count(ca, [0.5, 1.0, 1.5])) as Level;
}
/** Tabela 1, linha 3 (item 2.1-III): m% 20–40 cm. */
export function levelAluminiumSaturation(mPct: number): Level {
  return (4 - count(mPct, [5, 10, 20])) as Level;
}
/** Tabela 1, linha 4 (item 2.1-IV): anos completos sem revolvimento. */
export function levelYearsWithoutTillage(years: number): Level {
  return (1 + count(years, [3, 5, 8])) as Level;
}
/** Tabela 1, linha 5 (item 2.1-V): cobertura com palha antes da semeadura. */
export function levelStrawCover(cPct: number): Level {
  return (1 + count(cPct, [30, 60, 90])) as Level;
}

export type Crop = {
  name: string;
  species: string[];
  families: string[];
  isCover?: boolean;
  days?: number;
  conservedForage?: boolean;
  shortWindowGrass?: boolean;
  pastureMonths?: number;
  grazed?: boolean;
};

const isSoybean = (c: Crop) => c.species.length === 1 && c.species[0] === SOYBEAN_SPECIES;
const legumeOnly = (c: Crop) => c.families.length > 0 && c.families.every((f) => f === FABACEAE);

/** Contagens da Tabela 1 linha 6 com os critérios do item 2.4. */
export function countDiversity(crops: Crop[]) {
  const counted = crops.filter((c) => !c.conservedForage); // 2.4-III
  const species = new Set(counted.flatMap((c) => c.species));
  const families = new Set(counted.flatMap((c) => c.families));
  const longCovers = counted.filter(
    (c) => c.isCover && (c.days ?? 0) > FOUR_MONTHS_DAYS && c.families.includes(POACEAE), // 2.4-IV
  ).length;
  const covers45 = counted.filter((c) => (c.isCover && (c.days ?? 0) > COVER_MIN_DAYS) || c.shortWindowGrass).length;
  const waived = counted.some((c) => (c.pastureMonths ?? 0) >= 12); // 2.4-V
  return { crops: counted.length, species: species.size, families: families.size, longCovers, covers45, waived };
}

/** Tabela 1 linha 6 (item 2.1-VI) lida com o item 2.4; mesmas interpretações do Python. */
export function levelDiversity(crops: Crop[]): Level {
  const d = countDiversity(crops);
  const enough = (n: number) => d.waived || d.crops >= n;
  if (enough(6) && d.species >= 4 && d.families >= 2 && d.longCovers >= 1 && d.covers45 >= 3) return 4;
  if (enough(6) && d.species >= 2 && d.families >= 2 && (d.longCovers >= 1 || d.covers45 >= 3)) return 3;
  if (enough(4) && d.species >= 2 && d.families >= 2) return 2;
  return 1;
}

/** Item 3.2.1-II: soja sobre soja. INTERPRETAÇÃO literal: pousio não quebra a sequência. */
export function hasConsecutiveSoybean(seq: Crop[]): boolean {
  return seq.some((c, i) => i + 1 < seq.length && isSoybean(c) && isSoybean(seq[i + 1]));
}
/** Item 3.2.1-III: cultivo só de leguminosa antes ou depois da soja. */
export function hasLegumeOnlySuccession(seq: Crop[]): boolean {
  return seq.some((c, i) => {
    if (!isSoybean(c)) return false;
    const n = [seq[i - 1], seq[i + 1]].filter(Boolean) as Crop[];
    return n.some(legumeOnly);
  });
}

/** Item 3.2: NM pela média. */
export function nmFromMean(mi: number): Level {
  if (mi <= 1.75) return 1;
  if (mi <= 2.75) return 2;
  if (mi <= 3.5) return 3;
  return 4;
}

export type SiteFacts = {
  slopePct?: number | null;
  contourShare?: number | null;
  consecutiveSoybean?: boolean;
  legumeOnlySuccession?: boolean;
  usefulSoilDepthCm?: number | null;
};

export type Lock = { rule: string; cap: Level; citation: string };

export function depthCap(zus: number): Level {
  const allowed = ([1, 2, 3, 4] as Level[]).filter((nm) => ROOT_DEPTH_CM[nm] < zus);
  return allowed.length ? (Math.max(...allowed) as Level) : 1;
}

/** Item 3.2 com as travas do item 3.2.1 (vence a mais restritiva, como no Python). */
export function classify(levels: Record<IndicatorCode, Level>, facts: SiteFacts = {}) {
  const lv = INDICATORS.map((k) => levels[k]);
  const mi = lv.reduce((a, b) => a + b, 0) / 6;
  const base = nmFromMean(mi);
  const locks: Lock[] = [];
  if (facts.slopePct != null && facts.slopePct >= 3 && facts.contourShare != null && facts.contourShare < 0.75)
    locks.push({ rule: "slope ≥ 3% without contour sowing on 75% of the area", cap: 1, citation: "IN 2/2025, item 3.2.1-I" });
  if (facts.consecutiveSoybean)
    locks.push({ rule: "two or more consecutive soybean crops", cap: 1, citation: "IN 2/2025, item 3.2.1-II" });
  if (facts.legumeOnlySuccession)
    locks.push({ rule: "legume-only crop before or after soybean", cap: 2, citation: "IN 2/2025, item 3.2.1-III" });
  const n1 = lv.filter((v) => v === 1).length;
  const n2 = lv.filter((v) => v === 2).length;
  if (n1 >= 2) locks.push({ rule: "two or more indicators at level 1", cap: 1, citation: "IN 2/2025, item 3.2.1-IV-a" });
  else if (n2 >= 2 || (n1 >= 1 && n2 >= 1))
    locks.push({ rule: "two at level 2, or one at 1 and one at 2", cap: 2, citation: "IN 2/2025, item 3.2.1-IV-b" });
  if (base >= 3 && levels["m%"] === 1) locks.push({ rule: "m% at level 1", cap: 2, citation: "IN 2/2025, item 3.2.1-V-a" });
  else if (base >= 3 && levels["m%"] === 2) locks.push({ rule: "m% at level 2", cap: 3, citation: "IN 2/2025, item 3.2.1-V-b" });
  if (facts.usefulSoilDepthCm != null) {
    const cap = depthCap(facts.usefulSoilDepthCm);
    if (cap < 4) locks.push({ rule: "useful soil depth", cap, citation: "Portaria 209/2026, item 2.4" });
  }
  const nm = Math.min(base, ...locks.map((l) => l.cap)) as Level;
  return { nm, mean: mi, nmFromMean: base, locks };
}

export type Range = [Level, Level];
const span = (r: Range) => {
  const out: Level[] = [];
  for (let v = r[0]; v <= r[1]; v++) out.push(v as Level);
  return out;
};

/**
 * Mesma conta de nm_range (precheck.py): varre as faixas de T, C e D, os níveis de solo dados
 * e as leituras de soja sobre soja; contorno e profundidade entram como fatos (padrão: atendidos).
 */
export function nmRange(
  ind: { T: Range; C: Range; D: Range },
  soil: { "V%": Level; Ca: Level; "m%": Level },
  sosOptions: boolean[],
  legumeOnlySucc: boolean,
  facts: Pick<SiteFacts, "slopePct" | "contourShare" | "usefulSoilDepthCm"> = { slopePct: 0, usefulSoilDepthCm: 200 },
): Range {
  const res: Level[] = [];
  for (const t of span(ind.T))
    for (const c of span(ind.C))
      for (const d of span(ind.D))
        for (const sos of sosOptions)
          res.push(
            classify(
              { ...soil, T: t, C: c, D: d },
              { ...facts, consecutiveSoybean: sos, legumeOnlySuccession: legumeOnlySucc },
            ).nm,
          );
  return [Math.min(...res) as Level, Math.max(...res) as Level];
}

// ---- Culturas e caminhos, iguais ao precheck.py ----

export const SOYBEAN: Crop = { name: "soybean", species: [SOYBEAN_SPECIES], families: [FABACEAE], days: 130 };
export const WHEAT: Crop = { name: "wheat (grain)", species: ["Triticum aestivum"], families: [POACEAE], days: 150 };
// Janela da cobertura no precheck: semeada 15 abr–31 mai, dessecada 1 set–31 out → 93 a 199 dias.
export const COVER_DAYS_MIN = 93;
export const COVER_DAYS_MAX = 199;
export const oatVetch = (days: number): Crop => ({
  name: "black oat + common vetch (cover)",
  species: ["Avena strigosa", "Vicia sativa"],
  families: [POACEAE, FABACEAE],
  isCover: true,
  days,
});
// Fora do precheck (escolha do produtor em "My farm"): aveia-preta solteira como cobertura,
// mesma janela; a contagem de espécies e famílias é a da própria norma.
export const blackOat = (days: number): Crop => ({
  name: "black oat (cover)",
  species: ["Avena strigosa"],
  families: [POACEAE],
  isCover: true,
  days,
});

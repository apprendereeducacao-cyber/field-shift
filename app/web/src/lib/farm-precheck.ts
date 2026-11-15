// Origem: apprendereeducacao-cyber/fieldshift-kaua, branch fieldshift/evolucao (commit f33ade2), arquivo app/web/src/components/ux/farm-precheck.ts.
// Portado sem mudança de lógica; PATHS vem do recorte em lib/ux-facts.ts.
// "My farm": aplica as regras portadas (lib/zarcnm.ts) aos dados que o produtor digita.
// Mesma conta do precheck.py (nm_range); o que o produtor não sabe vira faixa, nunca chute.
import {
  COVER_DAYS_MAX,
  COVER_DAYS_MIN,
  POACEAE,
  SOYBEAN,
  WHEAT,
  blackOat,
  hasConsecutiveSoybean,
  hasLegumeOnlySuccession,
  levelAluminiumSaturation,
  levelBaseSaturation,
  levelCalcium,
  levelDiversity,
  nmRange,
  oatVetch,
  type Crop,
  type Level,
  type Range,
} from "@/lib/zarcnm";
import { PATHS } from "@/lib/ux-facts";

export type Winter = "wheat" | "oat_vetch" | "black_oat" | "pasture" | "other_grain" | "fallow" | "unknown";
export type Tillage = "lt3" | "3to4" | "5to7" | "8plus" | "unknown";
export type Contour = "yes" | "flat" | "no" | "unknown";
export type YesNo = "yes" | "no" | "unknown";

export type Farm = {
  v: 1;
  label: string;
  lat: number | null;
  lon: number | null;
  municipality: string;
  areaHa: number | null;
  winters: [Winter, Winter, Winter]; // [2026, 2025, 2024]
  tillage: Tillage;
  contour: Contour;
  soilTest: YesNo;
  soil: { v: number | null; cec: number | null; ca: number | null; m: number | null };
  noTillPlanter: YesNo;
  coverSeeder: YesNo;
};

export const EMPTY_FARM: Farm = {
  v: 1,
  label: "",
  lat: null,
  lon: null,
  municipality: "",
  areaHa: null,
  winters: ["unknown", "unknown", "unknown"],
  tillage: "unknown",
  contour: "unknown",
  soilTest: "unknown",
  soil: { v: null, cec: null, ca: null, m: null },
  noTillPlanter: "unknown",
  coverSeeder: "unknown",
};

export const WINTER_YEARS = [2026, 2025, 2024];

// Pastagem de inverno (aveia + azevém) pastejada: INTERPRETAÇÃO desta tela, não do precheck —
// contada como cobertura pastejada (IN 2/2025, item 2.4-II). Outro grão de inverno: gramínea genérica.
const pasture = (days: number): Crop => ({
  name: "oat + ryegrass pasture (grazed cover)",
  species: ["Avena strigosa", "Lolium multiflorum"],
  families: [POACEAE],
  isCover: true,
  grazed: true,
  days,
});
const OTHER_GRAIN: Crop = { name: "other winter grain", species: ["other winter cereal"], families: [POACEAE], days: 150 };

/** Opções de cultura para um inverno (o desconhecido vira todas as opções conhecidas). */
function winterOptions(w: Winter): (Crop | null)[] {
  switch (w) {
    case "wheat":
      return [WHEAT];
    case "oat_vetch":
      return [oatVetch(COVER_DAYS_MIN), oatVetch(COVER_DAYS_MAX)];
    case "black_oat":
      return [blackOat(COVER_DAYS_MIN), blackOat(COVER_DAYS_MAX)];
    case "pasture":
      return [pasture(COVER_DAYS_MIN), pasture(COVER_DAYS_MAX)];
    case "other_grain":
      return [OTHER_GRAIN];
    case "fallow":
      return [null];
    case "unknown":
      return [null, WHEAT, oatVetch(COVER_DAYS_MIN), oatVetch(COVER_DAYS_MAX)];
  }
}

const pathC = (id: string) => PATHS.find((p) => p.id === id)!.C as Range;

/** Palha antes da soja (C) pelo inverno mais recente, com as faixas do precheck. */
function strawRange(w: Winter): { range: Range; modelled: boolean } {
  switch (w) {
    case "wheat":
      return { range: pathC("soy-wheat"), modelled: true };
    case "oat_vetch":
      return { range: pathC("soy-cover"), modelled: true };
    case "fallow":
      return { range: pathC("soy-fallow"), modelled: true };
    case "black_oat":
      return { range: pathC("soy-cover"), modelled: false }; // palha estimada como a de aveia + ervilhaca
    case "other_grain":
      return { range: pathC("soy-wheat"), modelled: false }; // estimada como a do trigo
    default:
      return { range: [1, 4], modelled: false }; // pastagem e desconhecido: sem modelo
  }
}

const T_RANGE: Record<Tillage, Range> = { lt3: [1, 1], "3to4": [2, 2], "5to7": [3, 3], "8plus": [4, 4], unknown: [1, 4] };

export function soilLevels(f: Farm): { "V%": Level; Ca: Level; "m%": Level } | null {
  const { v, cec, ca, m } = f.soil;
  if (f.soilTest !== "yes" || v == null || cec == null || ca == null || m == null) return null;
  return { "V%": levelBaseSaturation(v, cec), Ca: levelCalcium(ca), "m%": levelAluminiumSaturation(m) };
}

export type FarmResult = {
  D: Range;
  C: Range;
  cModelled: boolean;
  T: Range;
  soyOnSoyLiteral: boolean;
  soyOnSoyPossible: boolean;
  legumeOnly: boolean;
  soil: ReturnType<typeof soilLevels>;
  nm: Range; // com a análise de solo informada, ou no melhor caso (nível 4)
  nmSoil3: Range | null; // se a análise ficar no nível 3 (só quando não há números)
  contourBlocks: boolean;
};

export function precheckFarm(f: Farm): FarmResult {
  const [w26, w25, w24] = f.winters;
  // Três anos agrícolas em ordem: soja, inverno 2024, soja, inverno 2025, soja, inverno 2026.
  const seqs: Crop[][] = [];
  for (const a of winterOptions(w24))
    for (const b of winterOptions(w25))
      for (const c of winterOptions(w26)) {
        const s: Crop[] = [SOYBEAN];
        if (a) s.push(a);
        s.push(SOYBEAN);
        if (b) s.push(b);
        s.push(SOYBEAN);
        if (c) s.push(c);
        seqs.push(s);
      }
  const dl = seqs.map(levelDiversity);
  const D: Range = [Math.min(...dl) as Level, Math.max(...dl) as Level];
  const sosAny = seqs.some(hasConsecutiveSoybean);
  const sosAll = seqs.every(hasConsecutiveSoybean);
  const legAny = seqs.some(hasLegumeOnlySuccession);
  const legAll = seqs.every(hasLegumeOnlySuccession);
  const { range: C, modelled } = strawRange(w26);
  const T = T_RANGE[f.tillage];

  // Leituras de soja sobre soja: igual ao precheck (literal ou não) quando a sequência tem pousio.
  const sosOptions = sosAny ? [true, false] : [false];
  const legOptions = legAll ? [true] : legAny ? [true, false] : [false];
  const contourOptions =
    f.contour === "yes" || f.contour === "flat"
      ? [{ slopePct: 0, usefulSoilDepthCm: 200 }]
      : f.contour === "no"
        ? [{ slopePct: 3, contourShare: 0, usefulSoilDepthCm: 200 }]
        : [
            { slopePct: 0, usefulSoilDepthCm: 200 },
            { slopePct: 3, contourShare: 0, usefulSoilDepthCm: 200 },
          ];

  const run = (soil: { "V%": Level; Ca: Level; "m%": Level }): Range => {
    let lo = 4,
      hi = 1;
    for (const leg of legOptions)
      for (const facts of contourOptions) {
        const [a, b] = nmRange({ T, C, D }, soil, sosOptions, leg, facts);
        lo = Math.min(lo, a);
        hi = Math.max(hi, b);
      }
    return [lo as Level, hi as Level];
  };

  const soil = soilLevels(f);
  const nm = run(soil ?? { "V%": 4, Ca: 4, "m%": 4 });
  const nmSoil3 = soil ? null : run({ "V%": 3, Ca: 3, "m%": 3 });
  return {
    D,
    C,
    cModelled: modelled,
    T,
    soyOnSoyLiteral: sosAll,
    soyOnSoyPossible: sosAny,
    legumeOnly: legAll,
    soil,
    nm,
    nmSoil3,
    contourBlocks: f.contour === "no",
  };
}

const num = (x: unknown, lo: number, hi: number): number | null =>
  typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi ? x : null;
const pick = <T extends string>(x: unknown, allowed: readonly T[], dflt: T): T =>
  typeof x === "string" && (allowed as readonly string[]).includes(x) ? (x as T) : dflt;

const WINTERS = ["wheat", "oat_vetch", "black_oat", "pasture", "other_grain", "fallow", "unknown"] as const;
const YN = ["yes", "no", "unknown"] as const;

/** Valida um JSON importado ou salvo: só campos conhecidos, números em faixa; o resto cai no padrão. */
export function sanitizeFarm(raw: unknown): Farm {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const w = Array.isArray(r.winters) ? r.winters : [];
  const s = (r.soil && typeof r.soil === "object" ? r.soil : {}) as Record<string, unknown>;
  return {
    v: 1,
    label: typeof r.label === "string" ? r.label.slice(0, 60) : "",
    lat: num(r.lat, -34, 6),
    lon: num(r.lon, -75, -30),
    municipality: typeof r.municipality === "string" ? r.municipality.slice(0, 60) : "",
    areaHa: num(r.areaHa, 0.1, 100000),
    winters: [0, 1, 2].map((i) => pick(w[i], WINTERS, "unknown")) as [Winter, Winter, Winter],
    tillage: pick(r.tillage, ["lt3", "3to4", "5to7", "8plus", "unknown"] as const, "unknown"),
    contour: pick(r.contour, ["yes", "flat", "no", "unknown"] as const, "unknown"),
    soilTest: pick(r.soilTest, YN, "unknown"),
    soil: { v: num(s.v, 0, 100), cec: num(s.cec, 0, 100), ca: num(s.ca, 0, 50), m: num(s.m, 0, 100) },
    noTillPlanter: pick(r.noTillPlanter, YN, "unknown"),
    coverSeeder: pick(r.coverSeeder, YN, "unknown"),
  };
}

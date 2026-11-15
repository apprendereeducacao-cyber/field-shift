// Respostas do formulário "Conte sobre ..." (HomeClient) → Farm de farm-precheck.ts.
// Sem JSX para o teste rodar no Node (scripts/test-farm-precheck.mjs).
import { EMPTY_FARM, sanitizeFarm, type Contour, type Farm, type Tillage, type Winter, type YesNo } from "@/lib/farm-precheck";

// Valores de inverno do formulário (WINTER_CROPS em HomeClient) → Winter da pré-checagem.
// O que a pré-checagem não modela vira "unknown" (faixa, nunca chute).
export const WINTER_MAP: Record<string, Winter> = {
  trigo: "wheat",
  aveia_preta: "black_oat",
  aveia_branca: "other_grain", // grão de inverno
  centeio: "other_grain", // gramínea de inverno, contada como outro grão
  azevem: "pasture",
  aveia_ervilhaca: "oat_vetch",
  aveia_ervilhaca_nabo: "oat_vetch", // conta só aveia + ervilhaca (o nabo não entra: leitura conservadora)
  pousio: "fallow",
  nao_sei: "unknown",
};
// Sem modelo na pré-checagem: canola, ervilhaca solteira, nabo, centeio + nabo, outro.
const NOT_MODELLED = new Set(["canola", "ervilhaca", "nabo_forrageiro", "centeio_nabo", "outro"]);
export const toWinter = (v: string): Winter => WINTER_MAP[v] ?? "unknown";

export type PrecheckAnswers = {
  olderWinter: string; // inverno de WINTER_YEARS[2], mesmo vocabulário de WINTER_CROPS
  tillage: Tillage | "";
  contour: Contour | "";
  soilTest: YesNo | "";
  soil: { v: string; cec: string; ca: string; m: string };
};
export const EMPTY_ANSWERS: PrecheckAnswers = {
  olderWinter: "",
  tillage: "",
  contour: "",
  soilTest: "",
  soil: { v: "", cec: "", ca: "", m: "" },
};

const parseNum = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

/** Invernos do mais recente para o mais antigo; os que faltam viram "unknown". Validação: sanitizeFarm. */
export function buildFarm(recentWinters: string[], a: PrecheckAnswers): Farm {
  const ws = [...recentWinters.slice(0, 2), a.olderWinter];
  return sanitizeFarm({
    ...EMPTY_FARM,
    winters: [0, 1, 2].map((i) => toWinter(ws[i] ?? "")),
    tillage: a.tillage || "unknown",
    contour: a.contour || "unknown",
    soilTest: a.soilTest || "unknown",
    soil: { v: parseNum(a.soil.v), cec: parseNum(a.soil.cec), ca: parseNum(a.soil.ca), m: parseNum(a.soil.m) },
  });
}

export const hasUnmodelledWinter = (values: string[]) => values.some((v) => NOT_MODELLED.has(v));

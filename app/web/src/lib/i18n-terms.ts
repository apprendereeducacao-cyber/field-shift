// Termos agronômicos vindos do banco (slugs em português) com rótulo EN/PT.
import type { Lang } from "./i18n";

const CROP_PT: Record<string, string> = {
  aveia_preta_ervilhaca: "Aveia-preta + Ervilhaca (mix)",
  centeio_nabo: "Centeio + Nabo forrageiro (mix)",
  brachiaria_ruziziensis: "Brachiaria ruziziensis",
  nabo_forrageiro: "Nabo forrageiro",
  aveia_preta: "Aveia-preta",
};

const CROP_EN: Record<string, string> = {
  soja: "Soybean",
  milho: "Corn",
  trigo: "Wheat",
  aveia: "Oat",
  aveia_preta: "Black oat",
  aveia_branca: "White oat",
  ervilhaca: "Common vetch",
  nabo_forrageiro: "Forage radish",
  aveia_preta_ervilhaca: "Black oat + vetch (mix)",
  centeio_nabo: "Rye + forage radish (mix)",
  centeio: "Rye",
  azevem: "Ryegrass",
  canola: "Canola",
  feijao: "Beans",
  sorgo: "Sorghum",
  girassol: "Sunflower",
  milheto: "Pearl millet",
  crotalaria: "Crotalaria",
  brachiaria_ruziziensis: "Brachiaria ruziziensis",
  pousio: "Fallow",
  tremoco: "Lupin",
  trevo: "Clover",
  // classes de safra (risk engine)
  safra_boa: "Good season",
  safra_normal: "Normal season",
  safra_ruim: "Poor season",
};

function titleCase(name: string) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function slug(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim().replace(/[\s-]+/g, "_");
}

/** Nome de cultura/classe para exibir. Em PT mantém o comportamento original. */
export function cropLabel(name: string, lang: Lang): string {
  if (lang === "pt") return CROP_PT[name] ?? titleCase(name);
  return CROP_EN[name] ?? CROP_EN[slug(name)] ?? titleCase(name);
}

const SEASON_PT: Record<string, string> = {
  summer: "Verão",
  safrinha: "Safrinha",
  winter: "Inverno",
  winter_late: "Pós-colheita inverno",
  winter_mix: "Inverno consórcio",
};

const SEASON_EN: Record<string, string> = {
  summer: "Summer",
  safrinha: "Double crop",
  winter: "Winter",
  winter_late: "Late winter, after harvest",
  winter_mix: "Winter mix",
};

export function seasonLabel(season: string, lang: Lang): string {
  return (lang === "pt" ? SEASON_PT[season] : SEASON_EN[season]) ?? season;
}

const STRATEGY_EN: Record<string, string> = {
  baseline: "Fallow (idle land)",
  conservative: "Black oat + vetch",
  adaptive: "Wheat + forage radish",
};

/** Nome da estratégia: em EN usa o id; em PT (ou id desconhecido) usa o nome do banco. */
export function strategyName(id: string | undefined, name: string, lang: Lang): string {
  if (lang === "en" && id && STRATEGY_EN[id]) return STRATEGY_EN[id];
  return name;
}

// Frases geradas em português pelo pattern-engine (servidor). Em EN, troca frase a frase;
// números ficam como estão.
const PATTERN_EN: [RegExp, string][] = [
  [/Chuva safra \(out-mar\)/g, "Season rain (Oct-Mar)"],
  [/Chuva critica \(dez-fev\)/g, "Critical rain (Dec-Feb)"],
  [/Dias quentes \(>=32C\)/g, "Hot days (>=32C)"],
  [/Geadas \(jul-set\)/g, "Frost (Jul-Sep)"],
  [/Umidade do solo/g, "Soil moisture"],
  [/Temperatura verao/g, "Summer temperature"],
  [/Chuva inverno/g, "Winter rain"],
  [/Dados insuficientes para projecao precisa/gi, "Not enough data for a precise projection"],
  [/Historico limitado impede projecao confiavel\. Use a media historica como referencia\./g,
    "Limited history prevents a reliable projection. Use the historical average as a reference."],
  [/(\d+) dos (\d+) anos analogos tiveram safra ruim/gi, "$1 of the $2 analog years had a poor season"],
  [/(\d+) dos (\d+) anos analogos tiveram safra boa/gi, "$1 of the $2 analog years had a good season"],
  [/Maioria dos anos analogos foram El Nino — risco de excesso de chuva no trigo/gi,
    "Most analog years were El Niño — risk of excess rain on wheat"],
  [/Maioria dos anos analogos foram La Nina — risco de deficit hidrico na soja/gi,
    "Most analog years were La Niña — risk of water deficit on soybean"],
  [/Alguns anos analogos tiveram chuva abaixo de 600mm na safra/gi,
    "Some analog years had less than 600mm of rain in the season"],
  [/Projecao ponderada acima da media historica/g, "Weighted projection above the historical average"],
  [/Padrao climatico favoravel comparado a media historica\./g, "Favorable climate pattern compared to the historical average."],
  [/Padrao climatico abaixo da media\. Considere estrategia conservadora\./g,
    "Climate pattern below average. Consider a conservative strategy."],
  [/Padrao climatico dentro da normalidade\./g, "Climate pattern within the normal range."],
  [/Atencao: /g, "Warning: "],
  [/Confianca baixa — monitore com frequencia\./g, "Low confidence — monitor often."],
  [/\bNeutro\b/g, "Neutral"],
];

export function translatePattern(text: string, lang: Lang): string {
  if (lang === "pt") return text;
  return PATTERN_EN.reduce((acc, [re, rep]) => acc.replace(re, rep), text);
}

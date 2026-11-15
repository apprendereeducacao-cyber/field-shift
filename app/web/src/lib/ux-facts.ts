// Recorte de app/web/src/lib/ux-facts.ts (apprendereeducacao-cyber/fieldshift-kaua, branch
// fieldshift/evolucao, commit f33ade2): só o que farm-precheck.ts e o cartão de pré-checagem usam.
// Mesmo código do original nesses trechos; tudo sai de data/soil_level.json e data/policy_targeting.json.
import soilLevel from "../../data/soil_level.json";
import policy from "../../data/policy_targeting.json";

const paths = soilLevel.precheck.paths;
const pathOf = (id: string) => {
  const p = paths.find((x) => x.id === id);
  if (!p) throw new Error(`path ${id} missing in soil_level.json`);
  return p;
};
const indOf = (id: string, code: string) => {
  const i = pathOf(id).indicators.find((x) => x.code === code);
  if (!i || i.level_min == null || i.level_max == null) throw new Error(`indicator ${code} missing in ${id}`);
  return [i.level_min, i.level_max] as [number, number];
};

export const PATHS = (["soy-cover", "soy-wheat", "soy-fallow"] as const).map((id) => {
  const p = pathOf(id);
  return {
    id,
    nm: [p.nm_range.min, p.nm_range.max] as [number, number],
    subsidy: [p.subsidy_pct_range.min, p.subsidy_pct_range.max] as [number, number],
    C: indOf(id, "C"),
    D: indOf(id, "D"),
    T: indOf(id, "T"),
  };
});

export const SUBSIDY = soilLevel.subsidy_by_level; // NM1..NM4 → % do prêmio (CGSR 111/2026)
export const BUDGET = soilLevel.budget_note; // R$ 1 milhão, soja, 4 estados

// Do original: análise de solo ~R$ 5/ha/ano (UFPel: R$ 50 por análise, 2 camadas, 1 amostra a cada 10 ha, a cada 24 meses).
export const SOIL_TEST_BRL_HA_YEAR = 5;

// Cruz Alta, imóveis avaliados (analysis/farm-reports e analysis/policy-targeting do repo da equipe).
export const FARMS = {
  assessed: policy.inputs.properties_assessed, // 1.286
  readyNm3plus: policy.inputs.ready_nm3plus_if_soil_level4, // 1.263
};
export const FARM_REPORTS_URL = "https://github.com/FieldShift-SpaceApp/fieldshift/tree/main/analysis/farm-reports";

// Voucher de análise de solo: R$ 100 mil, cenário "metade das análises favorável" (0.5).
const VOUCHER_BUDGET = 100000;
const vi = policy.budgets_brl.indexOf(VOUCHER_BUDGET);
if (vi < 0) throw new Error("budget 100000 missing in policy_targeting.json");
export const VOUCHER = {
  budgetBrl: VOUCHER_BUDGET,
  targetedSmall: policy.curves_targeted["0.5"].families[vi].small_served, // 454
  firstComeSmall: policy.curves_first_come["0.5"][vi].mean.small_served, // 61
  source: policy.source,
};

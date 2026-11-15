// Origem: apprendereeducacao-cyber/fieldshift-kaua, branch fieldshift/evolucao (commit f33ade2), app/web/scripts/test-zarcnm.mjs.
// Confere o porte TS das regras (src/lib/zarcnm.ts) contra o precheck.json do repo da equipe,
// copiado em data/soil_level.json. Uso: node scripts/test-zarcnm.mjs
import { readFileSync } from "node:fs";
import {
  COVER_DAYS_MAX,
  COVER_DAYS_MIN,
  SOYBEAN,
  WHEAT,
  hasConsecutiveSoybean,
  hasLegumeOnlySuccession,
  levelAluminiumSaturation,
  levelBaseSaturation,
  levelCalcium,
  levelDiversity,
  levelStrawCover,
  levelYearsWithoutTillage,
  nmRange,
  oatVetch,
} from "../src/lib/zarcnm.ts";

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
};

// Tabela 1, bordas (mesmas dos testes Python)
eq("V% CEC<5 34.9", levelBaseSaturation(34.9, 4), 1);
eq("V% CEC<5 50", levelBaseSaturation(50, 4), 4);
eq("V% CEC 5-10 54.9", levelBaseSaturation(54.9, 7), 3);
eq("V% CEC>=10 65", levelBaseSaturation(65, 12), 4);
eq("Ca 0.49", levelCalcium(0.49), 1);
eq("Ca 1.5", levelCalcium(1.5), 4);
eq("m% 20", levelAluminiumSaturation(20), 1);
eq("m% 4.9", levelAluminiumSaturation(4.9), 4);
eq("T 8", levelYearsWithoutTillage(8), 4);
eq("T 2", levelYearsWithoutTillage(2), 1);
eq("C 89.9", levelStrawCover(89.9), 3);
eq("C 30", levelStrawCover(30), 2);

const three = (w) => {
  const s = [];
  for (let i = 0; i < 3; i++) {
    s.push(SOYBEAN);
    if (w) s.push(w);
  }
  return s;
};

const sl = JSON.parse(readFileSync(new URL("../data/soil_level.json", import.meta.url), "utf-8"));
const winters = {
  "soy-wheat": [WHEAT],
  "soy-cover": [oatVetch(COVER_DAYS_MIN), oatVetch(COVER_DAYS_MAX)],
  "soy-fallow": [],
};
for (const p of sl.precheck.paths) {
  const ind = Object.fromEntries(
    p.indicators.filter((i) => i.observable).map((i) => [i.code, [i.level_min, i.level_max]]),
  );
  const seqs = winters[p.id].length ? winters[p.id].map((w) => three(w)) : [three(null)];
  const dl = seqs.map(levelDiversity);
  eq(`${p.id} D range`, [Math.min(...dl), Math.max(...dl)], ind.D);
  const sos = hasConsecutiveSoybean(seqs[0]);
  const leg = hasLegumeOnlySuccession(seqs[0]);
  for (const n of [1, 2, 3, 4]) {
    const r = nmRange(ind, { "V%": n, Ca: n, "m%": n }, sos ? [true, false] : [false], leg);
    eq(`${p.id} soil ${n}`, { min: r[0], max: r[1] }, p.nm_range_by_soil_level[String(n)]);
  }
}
// "Alternar trigo e cobertura": o porte TS precisa dar o mesmo que soil_level.json (derivado em Python).
{
  const alt = sl.alternate;
  const orders = [COVER_DAYS_MIN, COVER_DAYS_MAX].flatMap((days) => [
    { ws: [WHEAT, oatVetch(days), WHEAT], C: [2, 3] },
    { ws: [oatVetch(days), WHEAT, oatVetch(days)], C: [2, 4] },
  ]);
  const seqOf = (ws) => ws.flatMap((w) => [SOYBEAN, w]);
  const dl = orders.map((o) => levelDiversity(seqOf(o.ws)));
  eq("alternate D range", [Math.min(...dl), Math.max(...dl)], alt.indicators.D);
  const r = nmRange({ T: alt.indicators.T, C: alt.indicators.C, D: alt.indicators.D }, { "V%": 4, Ca: 4, "m%": 4 }, [false], false);
  eq("alternate NM soil 4", { min: r[0], max: r[1] }, { min: alt.nm_range.min, max: alt.nm_range.max });
}
console.log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);

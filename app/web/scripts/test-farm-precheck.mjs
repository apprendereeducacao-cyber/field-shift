// Confere precheckFarm (src/lib/farm-precheck.ts) nos casos do formulário contra data/soil_level.json.
// Uso: node scripts/test-farm-precheck.mjs (Node 22.15+ ou 24: tira os tipos do .ts e resolve "@/").
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";

const SRC = new URL("../src/", import.meta.url);
registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith("@/")) return next(new URL(spec.slice(2) + ".ts", SRC).href, ctx);
    if (spec.startsWith(".") && !/\.[cm]?[jt]s(on)?$/.test(spec)) {
      try {
        return next(spec + ".ts", ctx);
      } catch {
        /* cai no padrão */
      }
    }
    return next(spec, ctx);
  },
  // O Next importa JSON sem atributo; o Node pede "type: json".
  load(url, ctx, next) {
    return next(url, url.endsWith(".json") ? { ...ctx, importAttributes: { type: "json" } } : ctx);
  },
});

const { EMPTY_FARM, precheckFarm } = await import("../src/lib/farm-precheck.ts");
const sl = JSON.parse(readFileSync(new URL("../data/soil_level.json", import.meta.url), "utf-8"));
const path = (id) => sl.precheck.paths.find((p) => p.id === id).nm_range_by_soil_level;

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
};
const farm = (w, extra = {}) => ({ ...EMPTY_FARM, winters: [w, w, w], ...extra });
const asRange = (r) => (r ? { min: r[0], max: r[1] } : null);
// Mesmas condições das faixas de soil_level.json: 8+ anos sem revolver e contorno confirmado.
const pathConditions = { tillage: "8plus", contour: "yes" };

for (const [w, id] of [
  ["oat_vetch", "soy-cover"],
  ["fallow", "soy-fallow"],
  ["wheat", "soy-wheat"],
]) {
  const r = precheckFarm(farm(w, pathConditions));
  eq(`${w} x3, soil top level = ${id} soil 4`, asRange(r.nm), path(id)["4"]);
  eq(`${w} x3, soil one level lower = ${id} soil 3`, asRange(r.nmSoil3), path(id)["3"]);
}

// O que o produtor vê sem responder o resto (anos sem revolver, contorno e análise: "não sei").
console.log("\nCasos do formulário (resto em 'não sei'):");
for (const [name, f] of [
  ["cover x3", farm("oat_vetch")],
  ["fallow x3", farm("fallow")],
  ["all not sure", farm("unknown")],
]) {
  const r = precheckFarm(f);
  console.log(`  ${name}: NM${r.nm[0]}-NM${r.nm[1]} (soil one level lower: NM${r.nmSoil3[0]}-NM${r.nmSoil3[1]})`);
}
// Contorno "não sei" inclui a leitura com declive ≥ 3% sem nível: o piso cai para NM1.
eq("all not sure floor", precheckFarm(farm("unknown")).nm[0], 1);
// Análise de solo com números: V% 70 (CTC 12), Ca 2, m% 2 → níveis 4/4/4, igual ao nível máximo.
eq(
  "soil numbers at top level = soil 4",
  asRange(
    precheckFarm(farm("oat_vetch", { ...pathConditions, soilTest: "yes", soil: { v: 70, cec: 12, ca: 2, m: 2 } })).nm,
  ),
  path("soy-cover")["4"],
);

console.log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);

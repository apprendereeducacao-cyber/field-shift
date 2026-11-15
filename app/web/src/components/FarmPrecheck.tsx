"use client";

// Pré-checagem ZarcNM ligada ao formulário "Conte sobre ...": perguntas extras, cartão de resultado
// e cartão para cooperativas e governo. Tudo roda no navegador (precheckFarm), sem API nem Supabase.
import { WINTER_YEARS, precheckFarm, type Contour, type Farm, type Tillage, type YesNo } from "@/lib/farm-precheck";
import type { PrecheckAnswers } from "@/lib/precheck-form";
import type { Level, Range } from "@/lib/zarcnm";
import { BUDGET, FARMS, FARM_REPORTS_URL, SOIL_TEST_BRL_HA_YEAR, SUBSIDY, VOUCHER } from "@/lib/ux-facts";
import { DEFAULT_LANG, fmtInt, tx, type Lang, type Tx } from "@/lib/text";

/* ── Textos ── */

const T = {
  section: { en: "ZarcNM pre-check", pt: "Pré-checagem ZarcNM" },
  intro: {
    en: "Three more questions for the soybean insurance pre-check. Not sure? Pick “Not sure”: it becomes a range, never a guess.",
    pt: "Mais três perguntas para a pré-checagem do seguro da soja. Não sabe? Escolha “Não sei”: vira faixa, nunca chute.",
  },
  select: { en: "Select…", pt: "Selecione…" },
  notSure: { en: "Not sure", pt: "Não sei" },
  olderWinter: { en: `Winter ${WINTER_YEARS[2]} (optional)`, pt: `Inverno ${WINTER_YEARS[2]} (opcional)` },
  tillage: { en: "Years in no-till without ploughing", pt: "Anos em plantio direto sem revolver o solo" },
  contour: { en: "Do you plant on the contour?", pt: "Você planta em nível?" },
  soilTest: { en: "Do you have a soil test?", pt: "Tem análise de solo?" },
  soilHint: {
    en: "Optional: the numbers from the lab report. Leave blank if you don't have them.",
    pt: "Opcional: os números do laudo. Deixe em branco se não tiver.",
  },
  yes: { en: "Yes", pt: "Sim" },
  no: { en: "No", pt: "Não" },
} satisfies Record<string, Tx>;

const TILLAGE_OPTS: { v: Tillage; t: Tx }[] = [
  { v: "lt3", t: { en: "Less than 3 years", pt: "Menos de 3 anos" } },
  { v: "3to4", t: { en: "3 to 4 years", pt: "3 a 4 anos" } },
  { v: "5to7", t: { en: "5 to 7 years", pt: "5 a 7 anos" } },
  { v: "8plus", t: { en: "8 years or more", pt: "8 anos ou mais" } },
  { v: "unknown", t: T.notSure },
];
const CONTOUR_OPTS: { v: Contour; t: Tx }[] = [
  { v: "yes", t: { en: "Yes, on the contour", pt: "Sim, em nível" } },
  { v: "flat", t: { en: "The land is flat (slope under 3%)", pt: "A terra é plana (declive menor que 3%)" } },
  { v: "no", t: { en: "No", pt: "Não" } },
  { v: "unknown", t: T.notSure },
];
const SOILTEST_OPTS: { v: YesNo; t: Tx }[] = [
  { v: "yes", t: T.yes },
  { v: "no", t: T.no },
  { v: "unknown", t: T.notSure },
];
const SOIL_FIELDS: { k: keyof PrecheckAnswers["soil"]; t: Tx }[] = [
  { k: "v", t: { en: "V% (0–20 cm)", pt: "V% (0–20 cm)" } },
  { k: "cec", t: { en: "CEC at pH 7 (0–20 cm)", pt: "CTC a pH 7 (0–20 cm)" } },
  { k: "ca", t: { en: "Ca, cmolc/dm³ (20–40 cm)", pt: "Ca, cmolc/dm³ (20–40 cm)" } },
  { k: "m", t: { en: "m% (20–40 cm)", pt: "m% (20–40 cm)" } },
];

const sel =
  "w-full appearance-none rounded-xl border border-border bg-muted px-4 py-2 text-sm text-foreground outline-none focus:border-primary";
const lbl = "mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide";

/* ── Perguntas ── */

export function PrecheckQuestions({
  answers,
  onChange,
  winterOptions,
  lang = DEFAULT_LANG,
}: {
  answers: PrecheckAnswers;
  onChange: (a: PrecheckAnswers) => void;
  winterOptions: { value: string; label: string }[];
  lang?: Lang;
}) {
  const set = <K extends keyof PrecheckAnswers>(k: K, v: PrecheckAnswers[K]) => onChange({ ...answers, [k]: v });
  return (
    <div className="rounded-[24px] border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{tx(T.section, lang)}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{tx(T.intro, lang)}</p>
      </div>
      <div>
        <label htmlFor="pc-older-winter" className={lbl}>{tx(T.olderWinter, lang)}</label>
        <select id="pc-older-winter" value={answers.olderWinter} onChange={(e) => set("olderWinter", e.target.value)} className={sel}>
          <option value="" disabled>{tx(T.select, lang)}</option>
          {winterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="pc-tillage" className={lbl}>{tx(T.tillage, lang)}</label>
        <select id="pc-tillage" value={answers.tillage} onChange={(e) => set("tillage", e.target.value as Tillage)} className={sel}>
          <option value="" disabled>{tx(T.select, lang)}</option>
          {TILLAGE_OPTS.map((o) => <option key={o.v} value={o.v}>{tx(o.t, lang)}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="pc-contour" className={lbl}>{tx(T.contour, lang)}</label>
        <select id="pc-contour" value={answers.contour} onChange={(e) => set("contour", e.target.value as Contour)} className={sel}>
          <option value="" disabled>{tx(T.select, lang)}</option>
          {CONTOUR_OPTS.map((o) => <option key={o.v} value={o.v}>{tx(o.t, lang)}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="pc-soiltest" className={lbl}>{tx(T.soilTest, lang)}</label>
        <select id="pc-soiltest" value={answers.soilTest} onChange={(e) => set("soilTest", e.target.value as YesNo)} className={sel}>
          <option value="" disabled>{tx(T.select, lang)}</option>
          {SOILTEST_OPTS.map((o) => <option key={o.v} value={o.v}>{tx(o.t, lang)}</option>)}
        </select>
      </div>
      {answers.soilTest === "yes" && (
        <div>
          <p className="text-xs text-muted-foreground">{tx(T.soilHint, lang)}</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {SOIL_FIELDS.map((f) => (
              <div key={f.k}>
                <label htmlFor={`pc-soil-${f.k}`} className={lbl}>{tx(f.t, lang)}</label>
                <input
                  id={`pc-soil-${f.k}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={answers.soil[f.k]}
                  onChange={(e) => set("soil", { ...answers.soil, [f.k]: e.target.value })}
                  className={sel}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Resultado ── */

const nmText = (r: Range) => (r[0] === r[1] ? `NM${r[0]}` : `NM${r[0]}–NM${r[1]}`);
const pct = (l: Level) => SUBSIDY[`NM${l}` as keyof typeof SUBSIDY];
const subsidyText = (r: Range) => (r[0] === r[1] ? `${pct(r[0])}%` : `${pct(r[0])}–${pct(r[1])}%`);
const sameRange = (a: Range, b: Range) => a[0] === b[0] && a[1] === b[1];

const link = "font-medium text-primary underline underline-offset-2 hover:text-foreground";

export function PrecheckCard({
  farm,
  notes,
  lang = DEFAULT_LANG,
}: {
  farm: Farm;
  notes?: { unmodelledWinter?: boolean; notSoybean?: boolean };
  lang?: Lang;
}) {
  const r = precheckFarm(farm);
  const nextYear = WINTER_YEARS[0] + 1;
  // Próximo inverno com cobertura: a janela de 3 anos anda um ano (o inverno mais antigo sai).
  const next = precheckFarm({ ...farm, winters: ["oat_vetch", farm.winters[0], farm.winters[1]] });
  const allUnknown = farm.winters.every((w) => w === "unknown");
  const needSoil = r.soil == null;
  const needContour = farm.contour === "unknown" || farm.contour === "no";
  const soilCost = `~R$ ${SOIL_TEST_BRL_HA_YEAR}`;

  const missing: Tx | null =
    needSoil && needContour
      ? {
          en: `What's missing: a soil test (${soilCost}/ha/yr) and a contour check`,
          pt: `O que falta: uma análise de solo (${soilCost}/ha/ano) e a conferência do plantio em nível`,
        }
      : needSoil
        ? { en: `What's missing: a soil test (${soilCost}/ha/yr)`, pt: `O que falta: uma análise de solo (${soilCost}/ha/ano)` }
        : needContour
          ? { en: "What's missing: a contour check", pt: "O que falta: a conferência do plantio em nível" }
          : null;

  const share = Math.round((FARMS.readyNm3plus / FARMS.assessed) * 100);

  return (
    <section aria-labelledby="pc-result" className="rounded-[24px] border border-primary/40 bg-card p-6 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 id="pc-result" className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
          {tx({ en: "Your ZarcNM pre-check", pt: "Sua pré-checagem ZarcNM" }, lang)}
        </h3>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
          {tx({ en: "Pre-check, not an official classification", pt: "Pré-checagem, não é a classificação oficial" }, lang)}
        </span>
      </div>

      <div aria-live="polite">
        <p className="text-4xl font-semibold tabular-nums text-foreground">{nmText(r.nm)}</p>
        <p className="text-sm font-medium text-foreground">
          {r.soil
            ? tx({ en: "with your soil test numbers", pt: "com os números da sua análise de solo" }, lang)
            : tx({ en: "if your soil test is at the top level", pt: "se a análise de solo ficar no nível máximo" }, lang)}
        </p>
        {r.nmSoil3 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {tx(
              {
                en: `If the soil test is one level lower: ${nmText(r.nmSoil3)}.`,
                pt: `Se a análise ficar um nível abaixo: ${nmText(r.nmSoil3)}.`,
              },
              lang,
            )}
          </p>
        )}
      </div>

      <p className="text-sm text-foreground">
        {tx(
          {
            en: `Soybean insurance subsidy: ${subsidyText(r.nm)} of the premium (Resolução CGSR 111/2026, a small pilot of R$ ${BUDGET.brl_million} million for soybean).`,
            pt: `Subvenção do seguro da soja: ${subsidyText(r.nm)} do prêmio (Resolução CGSR 111/2026, piloto pequeno de R$ ${BUDGET.brl_million} milhão para a soja).`,
          },
          lang,
        )}
      </p>

      <p className="text-sm text-foreground">
        {sameRange(next.nm, r.nm)
          ? tx(
              {
                en: `If the next winter (${nextYear}) is a cover crop (black oat + vetch): still ${nmText(next.nm)}.`,
                pt: `Se o próximo inverno (${nextYear}) for cobertura (aveia-preta + ervilhaca): continua ${nmText(next.nm)}.`,
              },
              lang,
            )
          : tx(
              {
                en: `If the next winter (${nextYear}) is a cover crop (black oat + vetch): ${nmText(next.nm)}, subsidy ${subsidyText(next.nm)}.`,
                pt: `Se o próximo inverno (${nextYear}) for cobertura (aveia-preta + ervilhaca): ${nmText(next.nm)}, subvenção de ${subsidyText(next.nm)}.`,
              },
              lang,
            )}
      </p>

      {missing && <p className="text-sm font-medium text-foreground">{tx(missing, lang)}</p>}

      {(allUnknown || notes?.unmodelledWinter || notes?.notSoybean || farm.contour === "no") && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {allUnknown && (
            <li>{tx({ en: "Answer the winters above to narrow the range.", pt: "Responda os invernos acima para estreitar a faixa." }, lang)}</li>
          )}
          {notes?.unmodelledWinter && (
            <li>
              {tx(
                {
                  en: "Some winters you chose (canola, turnip, vetch alone, other) are not in the pre-check yet: they count as “not sure”.",
                  pt: "Alguns invernos escolhidos (canola, nabo, ervilhaca solteira, outro) ainda não entram na pré-checagem: contam como “não sei”.",
                },
                lang,
              )}
            </li>
          )}
          {notes?.notSoybean && (
            <li>
              {tx(
                {
                  en: "This pre-check is for soybean: it assumes soybean every summer and does not count the safrinha.",
                  pt: "Esta pré-checagem é da soja: supõe soja todo verão e não conta a safrinha.",
                },
                lang,
              )}
            </li>
          )}
          {farm.contour === "no" && (
            <li>
              {tx(
                {
                  en: "On slopes of 3% or more, without contour planting on 75% of the area the level is NM1 (IN 2/2025, item 3.2.1-I).",
                  pt: "Em declive de 3% ou mais, sem plantio em nível em 75% da área, o nível é NM1 (IN 2/2025, item 3.2.1-I).",
                },
                lang,
              )}
            </li>
          )}
        </ul>
      )}

      <p className="border-t border-border pt-3 text-sm italic text-foreground">
        {tx(
          {
            en: "Not a new rating — a free preview of the official one, early enough to change the winter.",
            pt: "Não é uma nova nota — é uma prévia gratuita da oficial, a tempo de mudar o inverno.",
          },
          lang,
        )}
      </p>
      <p className="text-xs text-muted-foreground">
        {tx(
          {
            en: `In Cruz Alta, ${fmtInt(FARMS.readyNm3plus, lang)} of ${fmtInt(FARMS.assessed, lang)} assessed farms (${share}%) could reach NM3+ on the satellite side if the soil test and contour agree.`,
            pt: `Em Cruz Alta, ${fmtInt(FARMS.readyNm3plus, lang)} de ${fmtInt(FARMS.assessed, lang)} imóveis avaliados (${share}%) poderiam chegar a NM3+ pelo lado do satélite, se a análise de solo e o plantio em nível confirmarem.`,
          },
          lang,
        )}{" "}
        <a href={FARM_REPORTS_URL} target="_blank" rel="noopener noreferrer" className={link}>
          {tx({ en: "Source: farm-reports", pt: "Fonte: farm-reports" }, lang)}
        </a>
      </p>
      <p className="text-xs text-muted-foreground">
        {tx(
          {
            en: "Same rules as the team's ZarcNM pre-check (IN SPA/MAPA 2/2025); assumes soil deeper than 1 m. Your answers stay in this browser: nothing is sent.",
            pt: "Mesmas regras da pré-checagem ZarcNM da equipe (IN SPA/MAPA 2/2025); supõe solo com mais de 1 m. Suas respostas ficam neste navegador: nada é enviado.",
          },
          lang,
        )}
      </p>
    </section>
  );
}

/* ── Cooperativas e governo ── */

export function PolicyCard({ lang = DEFAULT_LANG }: { lang?: Lang }) {
  const ratio = Math.round(VOUCHER.targetedSmall / VOUCHER.firstComeSmall);
  return (
    <section aria-labelledby="pc-policy" className="rounded-[24px] border border-border bg-card p-6 space-y-2">
      <h3 id="pc-policy" className="text-base font-semibold text-foreground">
        {tx({ en: "For cooperatives and government", pt: "Para cooperativas e governo" }, lang)}
      </h3>
      <p className="text-sm text-foreground">
        {tx(
          {
            en: `With R$ ${fmtInt(VOUCHER.budgetBrl, lang)} in soil-test vouchers, prioritising small farms (under 50 ha) reaches ${fmtInt(VOUCHER.targetedSmall, lang)} of them, against ${fmtInt(VOUCHER.firstComeSmall, lang)} first come, first served (about ${ratio}×).`,
            pt: `Com R$ ${fmtInt(VOUCHER.budgetBrl, lang)} em vouchers de análise de solo, priorizar os imóveis pequenos (menos de 50 ha) atende ${fmtInt(VOUCHER.targetedSmall, lang)} deles, contra ${fmtInt(VOUCHER.firstComeSmall, lang)} por ordem de chegada (cerca de ${ratio}×).`,
          },
          lang,
        )}
      </p>
      <p className="text-xs font-medium text-muted-foreground">
        {tx(
          {
            en: "Scenario: assumes half of soil tests come back favourable.",
            pt: "Cenário: supõe que metade das análises de solo volte favorável.",
          },
          lang,
        )}{" "}
        <a href={VOUCHER.source} target="_blank" rel="noopener noreferrer" className={link}>
          {tx({ en: "Source: policy-targeting", pt: "Fonte: policy-targeting" }, lang)}
        </a>
      </p>
    </section>
  );
}

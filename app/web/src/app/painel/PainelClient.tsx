"use client";

import { useState } from "react";
import type {
  TimelineData,
  TimelineYear,
  RiskEngineData,
  Strategy,
  PatternAnalysis,
} from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { strategyName, translatePattern } from "@/lib/i18n-terms";

const ENSO_LABELS: Record<string, string> = {
  el_nino: "El Nino",
  el_nino_fraco: "El Nino Fraco",
  el_nino_forte: "El Nino Forte",
  la_nina: "La Nina",
  la_nina_fraca: "La Nina Fraca",
  la_nina_forte: "La Nina Forte",
  neutro: "Neutro",
};

const ENSO_LABELS_EN: Record<string, string> = {
  el_nino: "El Niño",
  el_nino_fraco: "Weak El Niño",
  el_nino_forte: "Strong El Niño",
  la_nina: "La Niña",
  la_nina_fraca: "Weak La Niña",
  la_nina_forte: "Strong La Niña",
  neutro: "Neutral",
};

const STRATEGY_NAMES: Record<string, string> = {
  baseline: "Pousio (terra parada)",
  conservative: "Aveia + Ervilhaca",
  adaptive: "Trigo + Nabo Forrageiro",
};

const STRATEGY_NAMES_EN: Record<string, string> = {
  baseline: "Fallow (idle land)",
  conservative: "Black oat + vetch",
  adaptive: "Wheat + forage radish",
};

const STRATEGY_COLORS: Record<string, string> = {
  baseline: "#EF4444",
  conservative: "#3B82F6",
  adaptive: "#10B981",
};

const CLASS_LABELS: Record<string, string> = {
  safra_boa: "Boa",
  safra_normal: "Normal",
  safra_ruim: "Ruim",
};

const CLASS_LABELS_EN: Record<string, string> = {
  safra_boa: "Good",
  safra_normal: "Normal",
  safra_ruim: "Poor",
};

const CONFIDENCE_EN: Record<string, string> = { alta: "High", media: "Medium", baixa: "Low" };

const CLASS_COLORS: Record<string, string> = {
  safra_boa: "text-leaf-600",
  safra_normal: "text-status-warning",
  safra_ruim: "text-destructive",
};

const CLASS_BG: Record<string, string> = {
  safra_boa: "bg-status-success-bg border-leaf-600/30",
  safra_normal: "bg-status-warning-bg border-status-warning/30",
  safra_ruim: "bg-status-critical-bg border-destructive/30",
};

function riskLevel(score: number) {
  if (score >= 65) return { label: "Alto", en: "High", color: "text-destructive" };
  if (score >= 40) return { label: "Medio", en: "Medium", color: "text-status-warning" };
  return { label: "Baixo", en: "Low", color: "text-leaf-600" };
}

type CalendarAction = { month: string; monthEn: string; action: string; actionEn: string };

const CALENDAR_ACTIONS: Record<string, CalendarAction[]> = {
  conservative: [
    { month: "Abril", monthEn: "April", action: "Plantar aveia-preta + ervilhaca", actionEn: "Sow black oat + vetch" },
    { month: "Mai-Ago", monthEn: "May-Aug", action: "Cobertura crescendo. Ervilhaca fixa nitrogenio. Raiz da aveia estrutura o solo", actionEn: "Cover crop growing. Vetch fixes nitrogen. Oat roots build soil structure" },
    { month: "Setembro", monthEn: "September", action: "Avaliar dessecacao. Aveia no florescimento = maxima biomassa", actionEn: "Plan desiccation. Oat at flowering = maximum biomass" },
    { month: "Outubro", monthEn: "October", action: "Dessecar e plantar soja sobre a palha", actionEn: "Desiccate and sow soybean no-till into the straw" },
  ],
  adaptive: [
    { month: "Mai-Jun", monthEn: "May-Jun", action: "Plantar trigo (12-15C ideal)", actionEn: "Sow wheat (12-15C ideal)" },
    { month: "Set", monthEn: "Sep", action: "Plantar nabo nas entrelinhas ou apos colheita do trigo", actionEn: "Sow forage radish between rows or after the wheat harvest" },
    { month: "Outubro", monthEn: "October", action: "Colher trigo (renda extra). Nabo quebrando compactacao", actionEn: "Harvest wheat (extra income). Radish breaking up compaction" },
    { month: "Novembro", monthEn: "November", action: "Dessecar nabo. Plantar soja sobre palha", actionEn: "Desiccate the radish. Sow soybean no-till into the straw" },
  ],
  baseline: [
    { month: "Abr-Set", monthEn: "Apr-Sep", action: "Solo exposto. Erosao. Umidade evaporando", actionEn: "Bare soil. Erosion. Moisture evaporating" },
    { month: "Outubro", monthEn: "October", action: "Plantio da soja em solo degradado", actionEn: "Soybean sown on degraded soil" },
  ],
};

type Props = {
  timeline: TimelineData;
  riskEngine: RiskEngineData;
  rotations: Strategy[];
  keyFindings: {
    data_years: number;
    data_start: number;
    data_end: number;
    [key: string]: any;
  };
  patterns: PatternAnalysis | null;
};

export default function PainelClient({ timeline, riskEngine, rotations, keyFindings, patterns }: Props) {
  const AVAILABLE_YEARS = timeline.timeline.map((y) => y.year).sort((a, b) => b - a);
  const [selectedYear, setSelectedYear] = useState(AVAILABLE_YEARS[0]);
  const { lang, t } = useLang();

  function computeRiskScore(tl: TimelineYear): number {
    const avgs = riskEngine.historical_averages;
    const rainDef = Math.max(0, (avgs.season_rain_mm - (tl.season_rain_mm ?? avgs.season_rain_mm)) / avgs.season_rain_mm) * 100;
    const heatExcess = Math.max(0, (tl.hot_days - avgs.hot_days) / avgs.hot_days) * 100;
    const moistDef = Math.max(0, (avgs.avg_soil_moisture - (tl.avg_soil_moisture ?? avgs.avg_soil_moisture)) / avgs.avg_soil_moisture) * 100;
    return Math.min(100, rainDef * 0.36 + heatExcess * 0.37 + moistDef * 0.27);
  }

  function getRecommendation(riskScore: number) {
    const level = riskScore >= 65 ? "high_risk" : riskScore >= 40 ? "medium_risk" : "low_risk";
    const adjustments = riskEngine.strategy_adjustments[level];
    return rotations.map((s) => {
      const adj = adjustments[s.id as keyof typeof adjustments] as number;
      return {
        strategy: s,
        baseScore: s.total_score,
        adjustment: adj,
        finalScore: s.total_score + adj,
        reasoning: adjustments.reasoning[s.id],
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }

  const tl = timeline.timeline.find((y) => y.year === selectedYear);
  if (!tl) return null;

  const yr = riskEngine.year_risks.find((y) => y.year === selectedYear);
  const riskScore = yr?.risk_score ?? computeRiskScore(tl);
  const risk = riskLevel(riskScore);
  const avgs = riskEngine.historical_averages;
  const ranked = getRecommendation(riskScore);
  const best = ranked[0];

  const rainDiff = (tl.season_rain_mm ?? 0) - avgs.season_rain_mm;
  const hotDiff = tl.hot_days - avgs.hot_days;
  const moistPct = tl.avg_soil_moisture !== null ? (tl.avg_soil_moisture * 100).toFixed(0) : "—";
  const avgMoistPct = (avgs.avg_soil_moisture * 100).toFixed(0);

  const calendarActions = CALENDAR_ACTIONS[best.strategy.id] ?? CALENDAR_ACTIONS.conservative;

  const similarYears = riskEngine.year_risks
    .filter((y) => y.year !== selectedYear && Math.abs(y.risk_score - riskScore) < 15)
    .sort((a, b) => Math.abs(a.risk_score - riskScore) - Math.abs(b.risk_score - riskScore))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header + Filtro */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {t("Decision Dashboard", "Painel de Decisão")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {keyFindings.data_years} {t("years of NASA + IBGE data", "anos de dados NASA + IBGE")}
          </p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          aria-label={t("Season", "Safra")}
          className="rounded-full border border-border bg-card px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary"
        >
          {AVAILABLE_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}/{y + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Risco + ENSO */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] border border-border bg-card p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">{t("Climate risk", "Risco climático")}</p>
          <p className={`text-4xl font-light tabular-nums ${risk.color}`}>
            {riskScore.toFixed(0)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">/100</span>
          </p>
          <div className="mt-3 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, riskScore)}%`,
                background: riskScore >= 65
                  ? "linear-gradient(90deg, #F97316, #EF4444)"
                  : riskScore >= 40
                    ? "linear-gradient(90deg, #F9A825, #F97316)"
                    : "linear-gradient(90deg, #10B981, #F9A825)",
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-stone-400">
            <span>{t("Low", "Baixo")}</span><span>{t("Medium", "Médio")}</span><span>{t("High", "Alto")}</span>
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-card p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">ENSO</p>
          <p className="text-2xl font-bold text-foreground">
            {(lang === "pt" ? ENSO_LABELS : ENSO_LABELS_EN)[tl.enso] ?? tl.enso.replace(/_/g, " ")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {tl.enso.includes("el_nino")
              ? t("El Niño brings more rain to Rio Grande do Sul", "El Nino traz mais chuva para o RS")
              : tl.enso.includes("la_nina")
                ? t("La Niña brings less rain — higher drought risk", "La Nina traz menos chuva — mais risco de seca")
                : t("No clear rainfall pattern", "Sem padrao definido de chuva")}
          </p>
          {tl.yield_sc_ha !== null && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("Yield", "Produtividade")}: {tl.yield_sc_ha} {t("bags/ha", "sc/ha")}
            </p>
          )}
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[16px] border border-border bg-card p-3 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">{t("Season rain", "Chuva safra")}</p>
          <p className="text-lg font-light tabular-nums text-primary">{tl.season_rain_mm ?? "—"} mm</p>
          <p className={`text-[10px] ${rainDiff < 0 ? "text-destructive" : "text-leaf-600"}`}>
            {rainDiff > 0 ? "+" : ""}{Math.round(rainDiff)} {t("vs average", "vs media")} ({avgs.season_rain_mm} mm)
          </p>
        </div>
        <div className="rounded-[16px] border border-border bg-card p-3 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">{t("Hot days", "Dias quentes")}</p>
          <p className="text-lg font-light tabular-nums text-primary">{tl.hot_days}</p>
          <p className={`text-[10px] ${hotDiff > 0 ? "text-destructive" : "text-leaf-600"}`}>
            {hotDiff > 0 ? "+" : ""}{Math.round(hotDiff)} {t("vs average", "vs media")} ({avgs.hot_days.toFixed(0)})
          </p>
        </div>
        <div className="rounded-[16px] border border-border bg-card p-3 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">{t("Soil moisture", "Umidade solo")}</p>
          <p className="text-lg font-light tabular-nums text-primary">{moistPct}%</p>
          <p className="text-[10px] text-muted-foreground">{t("Average", "Media")}: {avgMoistPct}%</p>
        </div>
      </div>

      {/* Recomendacao */}
      <div className="rounded-[24px] border-2 border-primary bg-forest-50 p-5">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
          {t("Recommended action for", "Acao recomendada para")} {selectedYear}
        </p>
        <h2 className="mt-1 text-lg font-bold text-foreground">
          {strategyName(best.strategy.id, best.strategy.name, lang)}
          <span className="ml-2 text-sm font-normal" style={{ color: STRATEGY_COLORS[best.strategy.id] }}>
            {best.finalScore} {t("pts", "pts")}
          </span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{best.reasoning}</p>

        {/* Calendario compacto */}
        <div className="mt-4 space-y-1.5">
          {calendarActions.map((item, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="w-16 shrink-0 font-semibold text-foreground">{t(item.monthEn, item.month)}</span>
              <span className="text-muted-foreground">{t(item.actionEn, item.action)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking das 3 estrategias */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">{t("3 options compared", "3 opcoes comparadas")}</h3>
        <div className="space-y-2">
          {ranked.map((s, i) => {
            const isBest = i === 0;
            const color = STRATEGY_COLORS[s.strategy.id] ?? "#6B7280";
            const name = (lang === "pt" ? STRATEGY_NAMES : STRATEGY_NAMES_EN)[s.strategy.id] ?? s.strategy.name;
            const pct = (s.finalScore / ranked[0].finalScore) * 100;

            return (
              <div
                key={s.strategy.id}
                className={`rounded-[16px] border p-3 ${isBest ? "border-primary/40 bg-forest-50" : "border-border bg-card"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    {isBest && (
                      <span className="rounded-full bg-forest-100 px-1.5 py-0.5 text-[10px] text-primary">{t("Recommended", "Recomendado")}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color }}>{s.finalScore}</span>
                    <span className="ml-1 text-[10px] text-stone-400">({s.baseScore}{s.adjustment >= 0 ? "+" : ""}{s.adjustment})</span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anos semelhantes */}
      {similarYears.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            {t("Seasons with a similar scenario", "Safras com cenario parecido")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">
                  <th className="text-left py-1.5 px-2">{t("Year", "Ano")}</th>
                  <th className="text-center py-1.5 px-2">{t("Risk", "Risco")}</th>
                  <th className="text-center py-1.5 px-2">{t("Yield", "Produtividade")}</th>
                  <th className="text-center py-1.5 px-2">{t("Outcome", "Resultado")}</th>
                </tr>
              </thead>
              <tbody>
                {similarYears.map((y) => (
                  <tr
                    key={y.year}
                    className="border-t border-border cursor-pointer hover:bg-muted"
                    onClick={() => setSelectedYear(y.year)}
                  >
                    <td className="py-1.5 px-2 font-medium text-primary">{y.year}</td>
                    <td className="py-1.5 px-2 text-center">{y.risk_score.toFixed(0)}</td>
                    <td className="py-1.5 px-2 text-center text-muted-foreground">{y.yield_sc_ha} {t("bags/ha", "sc/ha")}</td>
                    <td className="py-1.5 px-2 text-center">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium border ${CLASS_BG[y.class]} ${CLASS_COLORS[y.class]}`}>
                        {(lang === "pt" ? CLASS_LABELS : CLASS_LABELS_EN)[y.class] ?? y.class}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[10px] text-stone-400">{t("Click a year to see the details", "Clique em um ano para ver os detalhes")}</p>
        </div>
      )}

      {/* Padroes Climaticos (Year Analog Scoring) */}
      {patterns && (
        <div className="rounded-[24px] border border-border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3">
            {t("Climate Patterns", "Padroes Climaticos")} — {patterns.target_year}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-muted rounded-[16px] p-3 text-center">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">{t("Projection", "Projecao")}</p>
              <p className="text-2xl font-light tabular-nums text-primary mt-1">
                {patterns.projection.expected_yield_range[0]}-{patterns.projection.expected_yield_range[1]}
              </p>
              <p className="text-xs text-muted-foreground">{t("bags/ha", "sc/ha")}</p>
            </div>
            <div className="bg-muted rounded-[16px] p-3 text-center">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">{t("Confidence", "Confianca")}</p>
              <p className={`text-2xl font-light mt-1 ${
                patterns.projection.confidence === "alta" ? "text-leaf-600"
                : patterns.projection.confidence === "media" ? "text-status-warning"
                : "text-destructive"
              }`}>
                {lang === "pt"
                  ? patterns.projection.confidence.charAt(0).toUpperCase() + patterns.projection.confidence.slice(1)
                  : CONFIDENCE_EN[patterns.projection.confidence] ?? patterns.projection.confidence}
              </p>
            </div>
            <div className="bg-muted rounded-[16px] p-3 text-center">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">{t("Years analyzed", "Anos analisados")}</p>
              <p className="text-2xl font-light tabular-nums text-primary mt-1">
                {patterns.stats.total_years_analyzed}
              </p>
              <p className="text-xs text-muted-foreground">{patterns.stats.vector_dimensions} {t("dimensions", "dimensoes")}</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-foreground mb-2">
            {t("Years most similar to", "Anos mais parecidos com")} {patterns.target_year}
          </h3>
          <div className="space-y-2 mb-4">
            {patterns.analog_years.map((a) => (
              <div
                key={a.year}
                className="flex items-center gap-3 bg-muted rounded-[16px] px-3 py-2"
              >
                <span className="text-lg font-semibold text-primary tabular-nums w-12">
                  {a.year}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${a.similarity_pct}%`, maxWidth: "100%" }}
                    />
                    <span className="text-sm font-semibold tabular-nums text-primary">
                      {a.similarity_pct}%
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {translatePattern(a.matching_dimensions.slice(0, 3).join(", "), lang)}
                    {a.diverging_dimensions.length > 0 && (
                      <span className="text-destructive ml-1">
                        ({t("differs", "diverge")}: {translatePattern(a.diverging_dimensions.slice(0, 2).join(", "), lang)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${
                    a.outcome.class === "safra_boa" ? "text-leaf-600"
                    : a.outcome.class === "safra_ruim" ? "text-destructive"
                    : "text-status-warning"
                  }`}>
                    {a.outcome.yield_sc_ha ?? "?"} {t("bags/ha", "sc/ha")}
                  </span>
                  <p className="text-[10px] text-stone-400">{translatePattern(a.outcome.enso, lang)}</p>
                </div>
              </div>
            ))}
          </div>

          {patterns.projection.recommendation && (
            <div className="bg-background rounded-[16px] p-3 border border-border">
              <p className="text-xs text-muted-foreground">
                {translatePattern(patterns.projection.recommendation, lang)}
              </p>
              {patterns.projection.risk_factors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {patterns.projection.risk_factors.map((r, i) => (
                    <span key={i} className="text-[10px] bg-status-critical-bg text-destructive rounded-full px-1.5 py-0.5">
                      {translatePattern(r, lang)}
                    </span>
                  ))}
                </div>
              )}
              {patterns.projection.positive_factors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {patterns.projection.positive_factors.map((f, i) => (
                    <span key={i} className="text-[10px] bg-status-success-bg text-leaf-600 rounded-full px-1.5 py-0.5">
                      {translatePattern(f, lang)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="mt-2 text-[10px] text-stone-400">
            {t("Year Analog Scoring (YAS) — weighted Euclidean distance over 8 normalized climate dimensions", "Year Analog Scoring (YAS) — distancia euclidiana ponderada sobre 8 dimensoes climaticas normalizadas")}
          </p>
        </div>
      )}

      <p className="text-[10px] text-stone-400 border-t border-border pt-3">
        {t("Risk = 36% rain shortfall + 37% extreme heat + 27% dry soil | Data: NASA POWER + IBGE SIDRA", "Risco = 36% falta de chuva + 37% calor extremo + 27% solo seco | Dados: NASA POWER + IBGE SIDRA")} | {keyFindings.data_start}-{keyFindings.data_end}
      </p>
    </div>
  );
}

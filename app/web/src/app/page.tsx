"use client";

import { useState } from "react";
import Link from "next/link";
import {
  timeline,
  riskEngine,
  rotations,
  site,
  KEY_FINDINGS,
  type TimelineYear,
  type YearRisk,
} from "@/lib/data";

const ENSO_LABELS: Record<string, string> = {
  el_nino: "El Nino",
  el_nino_fraco: "El Nino Fraco",
  el_nino_forte: "El Nino Forte",
  la_nina: "La Nina",
  la_nina_fraca: "La Nina Fraca",
  la_nina_forte: "La Nina Forte",
  neutro: "Neutro",
};

const ENSO_COLORS: Record<string, string> = {
  el_nino: "text-amber-400",
  el_nino_fraco: "text-amber-300",
  el_nino_forte: "text-amber-500",
  la_nina: "text-sky-400",
  la_nina_fraca: "text-sky-300",
  la_nina_forte: "text-sky-500",
  neutro: "text-text-muted",
};

const STRATEGY_NAMES: Record<string, string> = {
  baseline: "Pousio (terra parada)",
  conservative: "Aveia + Ervilhaca",
  adaptive: "Trigo + Nabo Forrageiro",
};

const STRATEGY_COLORS: Record<string, string> = {
  baseline: "#EF4444",
  conservative: "#3B82F6",
  adaptive: "#10B981",
};

function riskLevel(score: number) {
  if (score >= 65) return { label: "Alto", color: "text-red-400", bg: "bg-red-500" };
  if (score >= 40) return { label: "Medio", color: "text-amber-400", bg: "bg-amber-500" };
  return { label: "Baixo", color: "text-emerald-400", bg: "bg-emerald-500" };
}

function getYearData(year: number) {
  const tl = timeline.timeline.find((y) => y.year === year);
  const yr = riskEngine.year_risks.find((y) => y.year === year);
  const yc = riskEngine.year_classifications.find((y) => y.year === year);
  return { timeline: tl, risk: yr, classification: yc };
}

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

  const ranked = rotations.map((s) => {
    const adj = adjustments[s.id as keyof typeof adjustments] as number;
    return {
      strategy: s,
      finalScore: s.total_score + adj,
      reasoning: adjustments.reasoning[s.id],
    };
  }).sort((a, b) => b.finalScore - a.finalScore);

  return ranked;
}

const AVAILABLE_YEARS = timeline.timeline
  .map((y) => y.year)
  .sort((a, b) => b - a);

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(AVAILABLE_YEARS[0]);

  const { timeline: tl, risk: yr } = getYearData(selectedYear);
  if (!tl) return null;

  const riskScore = yr?.risk_score ?? computeRiskScore(tl);
  const risk = riskLevel(riskScore);
  const ranked = getRecommendation(riskScore);
  const best = ranked[0];
  const avgs = riskEngine.historical_averages;

  const rainDiff = (tl.season_rain_mm ?? 0) - avgs.season_rain_mm;
  const hotDiff = tl.hot_days - avgs.hot_days;

  return (
    <div className="space-y-6">
      {/* Header + Seletor */}
      <header className="text-center">
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Field Shift
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {site.point.name}-{site.point.state} — Recomendacao de manejo baseada em {KEY_FINDINGS.data_years} anos de dados NASA
        </p>
      </header>

      {/* Seletor de Ano */}
      <div className="mx-auto max-w-sm">
        <label htmlFor="year-select" className="mb-1 block text-center text-xs text-text-muted">
          Selecione a safra
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="w-full rounded-xl border border-border bg-bg-surface px-4 py-3 text-center text-lg font-bold text-text-primary outline-none transition-colors focus:border-primary-light"
        >
          {AVAILABLE_YEARS.map((y) => (
            <option key={y} value={y}>
              Safra {y}/{y + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Card de Risco */}
      <div className="rounded-xl border-2 border-border bg-bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-dim">Risco climatico da safra</p>
            <p className={`text-4xl font-bold ${risk.color}`}>
              {riskScore.toFixed(0)}
              <span className="ml-1 text-base font-normal text-text-muted">/100</span>
            </p>
            <p className={`text-sm font-semibold ${risk.color}`}>Risco {risk.label}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-text-dim">ENSO</p>
            <p className={`text-lg font-bold ${ENSO_COLORS[tl.enso] ?? "text-text-muted"}`}>
              {ENSO_LABELS[tl.enso] ?? tl.enso.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Barra de risco */}
        <div className="mt-4 h-3 rounded-full bg-bg-surface-alt overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, riskScore))}%`,
              background: riskScore >= 65
                ? "linear-gradient(90deg, #F97316, #EF4444)"
                : riskScore >= 40
                  ? "linear-gradient(90deg, #F9A825, #F97316)"
                  : "linear-gradient(90deg, #10B981, #F9A825)",
            }}
          />
        </div>

        {/* Indicadores rapidos */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-bg-surface-alt p-3 text-center">
            <p className="text-xs text-text-dim">Chuva (dez-fev)</p>
            <p className="text-lg font-bold text-text-primary">{tl.season_rain_mm ?? "—"} mm</p>
            <p className={`text-[10px] ${rainDiff < 0 ? "text-red-400" : "text-emerald-400"}`}>
              {rainDiff > 0 ? "+" : ""}{Math.round(rainDiff)} mm vs media
            </p>
          </div>
          <div className="rounded-lg bg-bg-surface-alt p-3 text-center">
            <p className="text-xs text-text-dim">Dias acima 32C</p>
            <p className="text-lg font-bold text-text-primary">{tl.hot_days}</p>
            <p className={`text-[10px] ${hotDiff > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {hotDiff > 0 ? "+" : ""}{Math.round(hotDiff)} vs media
            </p>
          </div>
          <div className="rounded-lg bg-bg-surface-alt p-3 text-center">
            <p className="text-xs text-text-dim">Produtividade</p>
            <p className="text-lg font-bold text-text-primary">
              {tl.yield_sc_ha !== null ? `${tl.yield_sc_ha} sc/ha` : "—"}
            </p>
            <p className="text-[10px] text-text-muted">
              Media: {avgs.yield_sc_ha.toFixed(0)} sc/ha
            </p>
          </div>
        </div>
      </div>

      {/* Recomendacao Principal */}
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
        <p className="text-xs font-medium tracking-wider text-primary-light uppercase">
          Recomendacao para esta safra
        </p>
        <h2 className="mt-1 text-xl font-bold text-text-primary">
          {best.strategy.name}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {best.strategy.subtitle}
        </p>
        <p className="mt-3 text-sm text-text-secondary">
          {best.reasoning}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STRATEGY_COLORS[best.strategy.id] }} />
            <span className="text-sm font-bold text-primary-light">{best.finalScore} pts</span>
          </div>
          <span className="text-xs text-text-dim">|</span>
          <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary-light">
            Melhor opcao
          </span>
        </div>
      </div>

      {/* Comparativo das 3 estrategias */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Comparativo</h3>
        <div className="space-y-2">
          {ranked.map((s, i) => {
            const isBest = i === 0;
            const color = STRATEGY_COLORS[s.strategy.id] ?? "#6B7280";
            const name = STRATEGY_NAMES[s.strategy.id] ?? s.strategy.name;
            const maxScore = ranked[0].finalScore;
            const pct = (s.finalScore / maxScore) * 100;

            return (
              <div
                key={s.strategy.id}
                className={`rounded-lg border p-3 ${
                  isBest ? "border-primary/40 bg-primary/5" : "border-border bg-bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className={`text-sm font-medium ${isBest ? "text-primary-light" : "text-text-primary"}`}>
                      {name}
                    </span>
                    {isBest && (
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary-light">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold" style={{ color }}>{s.finalScore} pts</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-bg-surface-alt overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Links rapidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/produtor"
          className="rounded-xl border border-border bg-bg-surface p-4 text-center transition-colors hover:border-primary/40 hover:bg-bg-surface-alt"
        >
          <p className="text-sm font-semibold text-text-primary">Personalizar</p>
          <p className="mt-1 text-xs text-text-muted">Informe seu historico para recomendacao sob medida</p>
        </Link>
        <Link
          href="/painel"
          className="rounded-xl border border-border bg-bg-surface p-4 text-center transition-colors hover:border-primary/40 hover:bg-bg-surface-alt"
        >
          <p className="text-sm font-semibold text-text-primary">Painel completo</p>
          <p className="mt-1 text-xs text-text-muted">Analise detalhada do cenario climatico</p>
        </Link>
      </div>
    </div>
  );
}

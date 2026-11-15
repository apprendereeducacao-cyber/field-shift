"use client";

import { useState } from "react";
import {
  timeline,
  riskEngine,
  rotations,
  KEY_FINDINGS,
  type TimelineYear,
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

const CLASS_LABELS: Record<string, string> = {
  safra_boa: "Boa",
  safra_normal: "Normal",
  safra_ruim: "Ruim",
};

const CLASS_COLORS: Record<string, string> = {
  safra_boa: "text-emerald-700",
  safra_normal: "text-amber-700",
  safra_ruim: "text-red-600",
};

const CLASS_BG: Record<string, string> = {
  safra_boa: "bg-emerald-50 border-emerald-200",
  safra_normal: "bg-amber-50 border-amber-200",
  safra_ruim: "bg-red-50 border-red-200",
};

function riskLevel(score: number) {
  if (score >= 65) return { label: "Alto", color: "text-red-600" };
  if (score >= 40) return { label: "Medio", color: "text-amber-600" };
  return { label: "Baixo", color: "text-emerald-600" };
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

const CALENDAR_ACTIONS: Record<string, { month: string; action: string }[]> = {
  conservative: [
    { month: "Abril", action: "Plantar aveia-preta + ervilhaca" },
    { month: "Mai-Ago", action: "Cobertura crescendo. Ervilhaca fixa nitrogenio. Raiz da aveia estrutura o solo" },
    { month: "Setembro", action: "Avaliar dessecacao. Aveia no florescimento = maxima biomassa" },
    { month: "Outubro", action: "Dessecar e plantar soja sobre a palha" },
  ],
  adaptive: [
    { month: "Mai-Jun", action: "Plantar trigo (12-15C ideal)" },
    { month: "Set", action: "Plantar nabo nas entrelinhas ou apos colheita do trigo" },
    { month: "Outubro", action: "Colher trigo (renda extra). Nabo quebrando compactacao" },
    { month: "Novembro", action: "Dessecar nabo. Plantar soja sobre palha" },
  ],
  baseline: [
    { month: "Abr-Set", action: "Solo exposto. Erosao. Umidade evaporando" },
    { month: "Outubro", action: "Plantio da soja em solo degradado" },
  ],
};

const AVAILABLE_YEARS = timeline.timeline.map((y) => y.year).sort((a, b) => b - a);

export default function PainelPage() {
  const [selectedYear, setSelectedYear] = useState(AVAILABLE_YEARS[0]);

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
    <div className="space-y-6">
      {/* Header + Filtro */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
            Painel de Decisao
          </h1>
          <p className="text-xs text-text-muted">
            {KEY_FINDINGS.data_years} anos de dados NASA + IBGE
          </p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm font-bold text-text-primary outline-none focus:border-primary-light"
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
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <p className="text-xs text-text-dim">Risco climatico</p>
          <p className={`text-4xl font-bold ${risk.color}`}>
            {riskScore.toFixed(0)}
            <span className="ml-1 text-sm font-normal text-text-muted">/100</span>
          </p>
          <div className="mt-3 h-3 rounded-full bg-bg-surface-alt overflow-hidden">
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
          <div className="mt-1 flex justify-between text-[10px] text-text-dim">
            <span>Baixo</span><span>Medio</span><span>Alto</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <p className="text-xs text-text-dim">ENSO</p>
          <p className="text-2xl font-bold text-text-primary">
            {ENSO_LABELS[tl.enso] ?? tl.enso.replace(/_/g, " ")}
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            {tl.enso.includes("el_nino")
              ? "El Nino traz mais chuva para o RS"
              : tl.enso.includes("la_nina")
                ? "La Nina traz menos chuva — mais risco de seca"
                : "Sem padrao definido de chuva"}
          </p>
          {tl.yield_sc_ha !== null && (
            <p className="mt-2 text-xs text-text-muted">
              Produtividade: {tl.yield_sc_ha} sc/ha
            </p>
          )}
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-bg-surface p-3 text-center">
          <p className="text-[10px] text-text-dim">Chuva safra</p>
          <p className="text-lg font-bold text-text-primary">{tl.season_rain_mm ?? "—"} mm</p>
          <p className={`text-[10px] ${rainDiff < 0 ? "text-red-400" : "text-emerald-400"}`}>
            {rainDiff > 0 ? "+" : ""}{Math.round(rainDiff)} vs media ({avgs.season_rain_mm} mm)
          </p>
        </div>
        <div className="rounded-lg border border-border bg-bg-surface p-3 text-center">
          <p className="text-[10px] text-text-dim">Dias quentes</p>
          <p className="text-lg font-bold text-text-primary">{tl.hot_days}</p>
          <p className={`text-[10px] ${hotDiff > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {hotDiff > 0 ? "+" : ""}{Math.round(hotDiff)} vs media ({avgs.hot_days.toFixed(0)})
          </p>
        </div>
        <div className="rounded-lg border border-border bg-bg-surface p-3 text-center">
          <p className="text-[10px] text-text-dim">Umidade solo</p>
          <p className="text-lg font-bold text-text-primary">{moistPct}%</p>
          <p className="text-[10px] text-text-muted">Media: {avgMoistPct}%</p>
        </div>
      </div>

      {/* Recomendacao */}
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
        <p className="text-xs font-medium tracking-wider text-primary-light uppercase">
          Acao recomendada para {selectedYear}
        </p>
        <h2 className="mt-1 text-lg font-bold text-text-primary">
          {best.strategy.name}
          <span className="ml-2 text-sm font-normal" style={{ color: STRATEGY_COLORS[best.strategy.id] }}>
            {best.finalScore} pts
          </span>
        </h2>
        <p className="mt-2 text-sm text-text-secondary">{best.reasoning}</p>

        {/* Calendario compacto */}
        <div className="mt-4 space-y-1.5">
          {calendarActions.map((item, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="w-16 shrink-0 font-semibold text-text-primary">{item.month}</span>
              <span className="text-text-secondary">{item.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking das 3 estrategias */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">3 opcoes comparadas</h3>
        <div className="space-y-2">
          {ranked.map((s, i) => {
            const isBest = i === 0;
            const color = STRATEGY_COLORS[s.strategy.id] ?? "#6B7280";
            const name = STRATEGY_NAMES[s.strategy.id] ?? s.strategy.name;
            const pct = (s.finalScore / ranked[0].finalScore) * 100;

            return (
              <div
                key={s.strategy.id}
                className={`rounded-lg border p-3 ${isBest ? "border-primary/40 bg-primary/5" : "border-border bg-bg-surface"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium text-text-primary">{name}</span>
                    {isBest && (
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary-light">Recomendado</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color }}>{s.finalScore}</span>
                    <span className="ml-1 text-[10px] text-text-dim">({s.baseScore}{s.adjustment >= 0 ? "+" : ""}{s.adjustment})</span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-bg-surface-alt overflow-hidden">
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
          <h3 className="mb-2 text-sm font-semibold text-text-primary">
            Safras com cenario parecido
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-text-dim">
                  <th className="text-left py-1.5 px-2">Ano</th>
                  <th className="text-center py-1.5 px-2">Risco</th>
                  <th className="text-center py-1.5 px-2">Produtividade</th>
                  <th className="text-center py-1.5 px-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {similarYears.map((y) => (
                  <tr
                    key={y.year}
                    className="border-t border-border cursor-pointer hover:bg-bg-surface-alt"
                    onClick={() => setSelectedYear(y.year)}
                  >
                    <td className="py-1.5 px-2 font-medium text-primary-light">{y.year}</td>
                    <td className="py-1.5 px-2 text-center">{y.risk_score.toFixed(0)}</td>
                    <td className="py-1.5 px-2 text-center text-text-secondary">{y.yield_sc_ha} sc/ha</td>
                    <td className="py-1.5 px-2 text-center">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${CLASS_BG[y.class]} ${CLASS_COLORS[y.class]}`}>
                        {CLASS_LABELS[y.class] ?? y.class}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[10px] text-text-dim">Clique em um ano para ver os detalhes</p>
        </div>
      )}

      <p className="text-[10px] text-text-dim border-t border-border pt-3">
        Risco = 36% falta de chuva + 37% calor extremo + 27% solo seco | Dados: NASA POWER + IBGE SIDRA | {KEY_FINDINGS.data_start}-{KEY_FINDINGS.data_end}
      </p>
    </div>
  );
}

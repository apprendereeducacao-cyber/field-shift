"use client";

import { useState } from "react";
import {
  riskEngine,
  rotations,
  timeline,
  SCORE_LABELS,
  type RotationScores,
  type Strategy,
} from "@/lib/data";

const ENSO_LABELS: Record<string, string> = {
  el_nino: "El Niño",
  la_nina: "La Niña",
  neutro: "Neutro",
};

const ENSO_COLORS: Record<string, string> = {
  el_nino: "text-amber-400",
  la_nina: "text-sky-400",
  neutro: "text-text-muted",
};

const CLASS_LABELS: Record<string, string> = {
  safra_boa: "Boa",
  safra_normal: "Normal",
  safra_ruim: "Ruim",
};

const CLASS_COLORS: Record<string, string> = {
  safra_boa: "text-emerald-400",
  safra_normal: "text-amber-400",
  safra_ruim: "text-red-400",
};

const CLASS_BG: Record<string, string> = {
  safra_boa: "bg-emerald-900/30 border-emerald-800/40",
  safra_normal: "bg-amber-900/30 border-amber-800/40",
  safra_ruim: "bg-red-900/30 border-red-800/40",
};

const STRATEGY_COLORS: Record<string, string> = {
  baseline: "#EF4444",
  conservative: "#3B82F6",
  adaptive: "#10B981",
};

const STRATEGY_NAMES: Record<string, string> = {
  baseline: "Pousio (terra parada)",
  conservative: "Aveia + ervilhaca",
  adaptive: "Trigo + nabo forrageiro",
};

function riskLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 65) return { label: "Alto", color: "text-red-400", bg: "bg-red-900/30" };
  if (score >= 40) return { label: "Médio", color: "text-amber-400", bg: "bg-amber-900/30" };
  return { label: "Baixo", color: "text-emerald-400", bg: "bg-emerald-900/30" };
}

function riskThresholdLabel(variable: string, value: number): { label: string; color: string } {
  const t = riskEngine.risk_thresholds[variable];
  if (!t) return { label: "—", color: "text-text-muted" };
  if (t.alto && ((t.alto.max && value < t.alto.max) || (t.alto.min && value > t.alto.min))) {
    return { label: "Alto", color: "text-red-400" };
  }
  if (t.baixo && ((t.baixo.min && value >= t.baixo.min) || (t.baixo.max && value <= t.baixo.max))) {
    return { label: "Baixo", color: "text-emerald-400" };
  }
  return { label: "Médio", color: "text-amber-400" };
}

function getAdjustedStrategies(riskScore: number) {
  const level = riskScore >= 65 ? "high_risk" : riskScore >= 40 ? "medium_risk" : "low_risk";
  const adjustments = riskEngine.strategy_adjustments[level];

  return rotations.map((s) => {
    const adj = adjustments[s.id as keyof typeof adjustments] as number;
    const reasoning = adjustments.reasoning[s.id];
    return {
      strategy: s,
      baseScore: s.total_score,
      adjustment: adj,
      finalScore: s.total_score + adj,
      reasoning,
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

const CALENDAR_ACTIONS: Record<string, { month: string; action: string; color: string }[]> = {
  conservative: [
    { month: "Abril", action: "Plantar aveia-preta + ervilhaca. Semeadura conjunta protege o solo desde o início.", color: "#2D6A4F" },
    { month: "Maio–Junho", action: "Cobertura em crescimento. Geada não afeta a aveia — ela aguenta até 1°C.", color: "#1E88E5" },
    { month: "Julho–Agosto", action: "Inverno pleno. Raízes da aveia estruturando o solo. Ervilhaca fixando nitrogênio.", color: "#1E88E5" },
    { month: "Setembro", action: "Avaliar ponto de dessecação. Aveia no florescimento pleno = máxima biomassa.", color: "#FF8F00" },
    { month: "Outubro", action: "Dessecar e plantar soja sobre a palha. Solo coberto, úmido, com N da ervilhaca.", color: "#E65100" },
    { month: "Novembro–Março", action: "Soja em desenvolvimento. Solo protegido pela palha retém umidade no período crítico.", color: "#E65100" },
  ],
  adaptive: [
    { month: "Maio–Junho", action: "Plantar trigo. Temperatura de 12–15°C é ideal. Geada não afeta.", color: "#2D6A4F" },
    { month: "Julho–Agosto", action: "Trigo em desenvolvimento. Acompanhar geada tardia na florada.", color: "#1E88E5" },
    { month: "Setembro", action: "Plantar nabo forrageiro nas entrelinhas ou após colheita do trigo.", color: "#42A5F5" },
    { month: "Outubro", action: "Colher trigo (renda extra). Nabo crescendo e quebrando compactação.", color: "#FF8F00" },
    { month: "Novembro", action: "Dessecar nabo. Plantar soja sobre palha do trigo + nabo.", color: "#E65100" },
    { month: "Dezembro–Março", action: "Soja na palha. Solo descompactado pelo nabo retém mais água.", color: "#E65100" },
  ],
  baseline: [
    { month: "Abril–Setembro", action: "Solo exposto. Chuvaradas levam terra fértil. Umidade evapora.", color: "#EF4444" },
    { month: "Outubro", action: "Plantio da soja em solo degradado, sem cobertura, sem nitrogênio extra.", color: "#E65100" },
    { month: "Novembro–Março", action: "Soja sem proteção de palha. Cada dia sem chuva pesa mais.", color: "#E65100" },
  ],
};

function ScenarioCard({ label, value, unit, comparison, compLabel, riskVar }: {
  label: string; value: number; unit: string; comparison: number; compLabel: string; riskVar?: string;
}) {
  const diff = value - comparison;
  const diffPct = comparison !== 0 ? ((diff / comparison) * 100) : 0;
  const isWorse = riskVar === "hot_days" ? diff > 0 : diff < 0;
  const threshold = riskVar ? riskThresholdLabel(riskVar, value) : null;

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <p className="text-xs text-text-dim">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">
        {typeof value === "number" && value < 1 && value > 0
          ? (value * 100).toFixed(0) + "%"
          : value}
        <span className="ml-1 text-sm font-normal text-text-muted">{unit}</span>
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`text-xs ${isWorse ? "text-red-400" : "text-emerald-400"}`}>
          {diff > 0 ? "+" : ""}{riskVar === "soil_moisture" ? (diffPct).toFixed(1) + "%" : Math.round(diff)}
          {" vs "}média
        </span>
        {threshold && (
          <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${threshold.color} bg-bg-surface-alt`}>
            Risco {threshold.label}
          </span>
        )}
      </div>
      <p className="mt-1 text-[10px] text-text-dim">
        {compLabel}: {riskVar === "soil_moisture" ? (comparison * 100).toFixed(0) + "%" : comparison} {unit}
      </p>
    </div>
  );
}

function RiskGauge({ score }: { score: number }) {
  const { label, color } = riskLevel(score);
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-text-dim uppercase">
            Índice de risco climático
          </p>
          <p className={`mt-1 text-4xl font-bold ${color}`}>{score.toFixed(0)}</p>
          <p className={`text-sm font-medium ${color}`}>Risco {label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-dim">Escala 0–100</p>
          <p className="text-xs text-text-muted mt-1">0 = sem risco | 100 = máximo</p>
        </div>
      </div>
      <div className="h-4 rounded-full bg-bg-surface-alt overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct >= 65
              ? "linear-gradient(90deg, #F97316, #EF4444)"
              : pct >= 40
                ? "linear-gradient(90deg, #F9A825, #F97316)"
                : "linear-gradient(90deg, #10B981, #F9A825)",
          }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-text-dim">
        <span>Baixo (0–39)</span>
        <span>Médio (40–64)</span>
        <span>Alto (65–100)</span>
      </div>
    </div>
  );
}


function SimilarYearsTable() {
  const { similar_years } = riskEngine.current_scenario;
  if (similar_years.count === 0) return null;

  const badRate = Math.round(similar_years.bad_rate * 10);

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-2">
        Anos com cenário parecido
      </h3>
      <p className="text-sm text-text-secondary mb-4">
        Encontramos <span className="font-bold text-text-primary">{similar_years.count} anos</span> com
        condições climáticas similares ao ano atual.
        Desses, <span className="font-bold text-red-400">{similar_years.bad_outcomes}</span> tiveram safra ruim
        — ou seja, <span className="font-bold text-text-primary">{badRate} em cada 10</span>.
      </p>
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`h-6 flex-1 rounded ${i < badRate ? "bg-red-500/60" : "bg-emerald-500/40"}`}
          />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-dim text-xs">
              <th className="text-left py-2 px-2">Ano</th>
              <th className="text-center py-2 px-2">Produtividade</th>
              <th className="text-center py-2 px-2">Resultado</th>
              <th className="text-center py-2 px-2">Risco</th>
            </tr>
          </thead>
          <tbody>
            {similar_years.years
              .sort((a, b) => b.year - a.year)
              .map((y) => (
                <tr key={y.year} className="border-t border-border">
                  <td className="py-2 px-2 text-text-primary font-medium">{y.year}</td>
                  <td className="py-2 px-2 text-center text-text-secondary">{y.yield_sc_ha} sc/ha</td>
                  <td className="py-2 px-2 text-center">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium border ${CLASS_BG[y.class]} ${CLASS_COLORS[y.class]}`}>
                      {CLASS_LABELS[y.class]}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center text-text-muted">{y.risk_score.toFixed(0)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StrategyRanking({ strategies }: { strategies: ReturnType<typeof getAdjustedStrategies> }) {
  const maxScore = Math.max(...strategies.map((s) => s.finalScore));

  return (
    <div className="space-y-3">
      {strategies.map((s, i) => {
        const isBest = i === 0;
        const pct = (s.finalScore / maxScore) * 100;
        const color = STRATEGY_COLORS[s.strategy.id] ?? "#6B7280";
        const name = STRATEGY_NAMES[s.strategy.id] ?? s.strategy.name;

        return (
          <div
            key={s.strategy.id}
            className={`rounded-xl border p-5 ${
              isBest ? "border-primary bg-primary/5" : "border-border bg-bg-surface"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <h4 className={`font-semibold ${isBest ? "text-primary-light" : "text-text-primary"}`}>
                  {name}
                  {isBest && (
                    <span className="ml-2 rounded bg-primary/20 px-2 py-0.5 text-xs text-primary-light">
                      Recomendado
                    </span>
                  )}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold" style={{ color }}>{s.finalScore}</span>
                <span className="text-xs text-text-dim ml-1">pts</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-bg-surface-alt overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <div className="flex gap-4 text-xs text-text-muted mb-2">
              <span>Base: {s.baseScore}</span>
              <span className={s.adjustment >= 0 ? "text-emerald-400" : "text-red-400"}>
                Ajuste cenário: {s.adjustment > 0 ? "+" : ""}{s.adjustment}
              </span>
            </div>
            <p className="text-xs text-text-secondary">{s.reasoning}</p>
          </div>
        );
      })}
    </div>
  );
}

function CalendarTimeline({ strategyId }: { strategyId: string }) {
  const actions = CALENDAR_ACTIONS[strategyId] ?? CALENDAR_ACTIONS.conservative;

  return (
    <div className="space-y-2">
      {actions.map((item, i) => (
        <div key={i} className="flex gap-3 rounded-lg border border-border bg-bg-surface p-3">
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            {i < actions.length - 1 && (
              <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: item.color, opacity: 0.3 }} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{item.month}</p>
            <p className="text-sm text-text-secondary">{item.action}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScenarioDistribution() {
  const freqs = riskEngine.scenario_frequencies;

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Em 44 safras, o que aconteceu
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {(["safra_boa", "safra_normal", "safra_ruim"] as const).map((cls) => {
          const freq = freqs[cls];
          if (!freq) return null;
          return (
            <div key={cls} className={`rounded-lg border p-4 text-center ${CLASS_BG[cls]}`}>
              <p className={`text-2xl font-bold ${CLASS_COLORS[cls]}`}>{freq.count}</p>
              <p className={`text-xs font-medium ${CLASS_COLORS[cls]}`}>
                Safra {CLASS_LABELS[cls]} ({freq.pct}%)
              </p>
              <div className="mt-2 text-[10px] text-text-dim space-y-0.5">
                <p>Chuva média: {freq.avg_season_rain_mm} mm</p>
                <p>Dias quentes: {freq.avg_hot_days}</p>
                <p>Umidade solo: {(freq.avg_moisture * 100).toFixed(0)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PainelPage() {
  const current = riskEngine.current_scenario;
  const avgs = riskEngine.historical_averages;
  const risk = riskLevel(current.risk_score);
  const adjusted = getAdjustedStrategies(current.risk_score);
  const bestStrategy = adjusted[0];

  const [showCalendarFor, setShowCalendarFor] = useState(bestStrategy.strategy.id);

  const last5 = timeline.timeline.slice(-5);
  const avgYield5 = last5.reduce((a, y) => a + (y.yield_sc_ha ?? 0), 0) / last5.length;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium tracking-wider text-primary-light uppercase">
          Motor de decisão
        </p>
        <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
          Painel de Decisão — Sua Safra
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Cruzamos 44 anos de satélite da NASA com produtividade do IBGE para calcular
          o risco climático e recomendar a melhor ação para o próximo inverno.
        </p>
      </header>

      {/* Seção 1: Cenário Atual */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4">
          Cenário atual — {current.year}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScenarioCard
            label="Chuva na safra (dez–fev)"
            value={current.season_rain_mm}
            unit="mm"
            comparison={avgs.season_rain_mm}
            compLabel="Média 44 anos"
            riskVar="season_rain_mm"
          />
          <ScenarioCard
            label="Dias acima de 32°C"
            value={current.hot_days}
            unit="dias"
            comparison={avgs.hot_days}
            compLabel="Média 44 anos"
            riskVar="hot_days"
          />
          <ScenarioCard
            label="Umidade do solo"
            value={current.avg_soil_moisture}
            unit=""
            comparison={avgs.avg_soil_moisture}
            compLabel="Média 44 anos"
            riskVar="soil_moisture"
          />
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="text-xs text-text-dim">ENSO</p>
            <p className={`mt-1 text-2xl font-bold ${ENSO_COLORS[current.enso]}`}>
              {ENSO_LABELS[current.enso]}
            </p>
            <p className="mt-2 text-xs text-text-muted">
              {current.enso === "el_nino"
                ? "Historicamente traz mais chuva para o RS"
                : current.enso === "la_nina"
                  ? "Historicamente traz menos chuva — mais risco de seca"
                  : "Sem padrão definido de chuva"}
            </p>
            <p className="mt-1 text-[10px] text-text-dim">
              Média de rendimento: {riskEngine.enso_impact[current.enso]?.avg_yield_sc_ha} sc/ha
            </p>
          </div>
        </div>
      </section>

      {/* Seção 2: Motor de Risco */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4">
          Motor de risco
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <RiskGauge score={current.risk_score} />
          <SimilarYearsTable />
        </div>
        <div className="mt-4">
        </div>
        <div className="mt-4">
          <ScenarioDistribution />
        </div>
      </section>

      {/* Seção 3: Valor por Ação */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-2">
          Melhor ação para o cenário atual
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Com risco <span className={`font-semibold ${risk.color}`}>{risk.label.toLowerCase()}</span>,
          {current.risk_score >= 65
            ? " a prioridade é reter umidade e proteger o solo. Ações de cobertura ganham mais pontos."
            : current.risk_score >= 40
              ? " o equilíbrio entre proteção e renda importa. Trigo + nabo combina os dois."
              : " há espaço para investir em renda. Trigo gera retorno direto e o nabo melhora o solo."}
        </p>
        <StrategyRanking strategies={adjusted} />
      </section>

      {/* Seção 4: Calendário de Ação */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4">
          Calendário de ação
        </h2>
        <div className="flex gap-2 mb-4">
          {adjusted.map((s) => {
            const name = STRATEGY_NAMES[s.strategy.id] ?? s.strategy.name;
            const isActive = showCalendarFor === s.strategy.id;
            const color = STRATEGY_COLORS[s.strategy.id];
            return (
              <button
                key={s.strategy.id}
                onClick={() => setShowCalendarFor(s.strategy.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "border border-border bg-bg-surface text-text-muted hover:text-text-primary"
                }`}
                style={isActive ? { backgroundColor: color + "33", color } : undefined}
              >
                {name}
              </button>
            );
          })}
        </div>
        <CalendarTimeline strategyId={showCalendarFor} />
      </section>

      {/* Resumo rápido */}
      <section className="rounded-xl border-2 border-primary bg-primary/5 p-6">
        <h3 className="text-lg font-bold text-primary-light mb-3">
          Resumo: o que fazer
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-text-dim">Cenário</p>
            <p className="text-sm font-semibold text-text-primary">
              {current.year} — {ENSO_LABELS[current.enso]}, {current.season_rain_mm} mm de chuva, {current.hot_days} dias quentes
            </p>
          </div>
          <div>
            <p className="text-xs text-text-dim">Risco calculado</p>
            <p className={`text-sm font-semibold ${risk.color}`}>
              {current.risk_score.toFixed(0)} / 100 — {risk.label}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-dim">Ação recomendada</p>
            <p className="text-sm font-semibold text-primary-light">
              {STRATEGY_NAMES[bestStrategy.strategy.id]}
              <span className="ml-1 text-text-muted">({bestStrategy.finalScore} pts)</span>
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-text-muted">
          {bestStrategy.reasoning}
        </p>
      </section>

      <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
        <h3 className="text-sm font-semibold text-warning-light">
          Aviso importante
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          Este painel usa dados históricos para calcular probabilidades — não é uma previsão do futuro.
          O risco mostra o que aconteceu em anos com condições parecidas. Use como ponto de partida
          para a conversa com seu agrônomo, que conhece sua terra e sua realidade.
        </p>
      </div>

      <footer className="text-xs text-text-dim border-t border-border pt-4">
        Motor de risco Field Shift — {riskEngine.model.equation} |
        Dados: NASA POWER ({riskEngine.current_scenario.year} anos) + IBGE SIDRA |
        Correlações com detrending tecnológico | Validado contra estação INMET Cruz Alta
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  rotations,
  rotationsMeta,
  crops,
  SCORE_LABELS,
  SCORE_COLORS,
  type RotationScores,
  type Strategy,
} from "@/lib/data";

const STRATEGY_COLORS: Record<
  string,
  { fill: string; stroke: string; label: string }
> = {
  baseline: {
    fill: "rgba(239,68,68,0.15)",
    stroke: "#EF4444",
    label: "Nao plantar nada no inverno",
  },
  conservative: {
    fill: "rgba(59,130,246,0.15)",
    stroke: "#3B82F6",
    label: "Aveia + ervilhaca no inverno",
  },
  adaptive: {
    fill: "rgba(16,185,129,0.15)",
    stroke: "#10B981",
    label: "Trigo + nabo forrageiro no inverno",
  },
};

const STRATEGY_NAMES: Record<string, string> = {
  baseline: "Nao plantar nada no inverno",
  conservative: "Aveia + ervilhaca no inverno",
  adaptive: "Trigo + nabo forrageiro no inverno",
};

const DIMENSIONS = Object.keys(SCORE_LABELS) as (keyof RotationScores)[];

function RadarChart({ strategies }: { strategies: Strategy[] }) {
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 150;
  const levels = [25, 50, 75, 100];

  function polarToXY(angle: number, value: number) {
    const r = (value / 100) * maxR;
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const angleStep = 360 / DIMENSIONS.length;

  function hexagonPoints(radius: number) {
    return DIMENSIONS.map((_, i) => {
      const { x, y } = polarToXY(i * angleStep, (radius / maxR) * 100);
      return `${x},${y}`;
    }).join(" ");
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[400px] mx-auto"
    >
      {levels.map((l) => (
        <polygon
          key={l}
          points={hexagonPoints((l / 100) * maxR)}
          fill="none"
          stroke="#374151"
          strokeWidth="0.5"
        />
      ))}

      {DIMENSIONS.map((dim, i) => {
        const { x, y } = polarToXY(i * angleStep, 100);
        const labelPos = polarToXY(i * angleStep, 115);
        return (
          <g key={dim}>
            <line
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#374151"
              strokeWidth="0.5"
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={SCORE_COLORS[dim]}
              fontSize="9"
              fontWeight="600"
            >
              {SCORE_LABELS[dim]}
            </text>
          </g>
        );
      })}

      {strategies.map((s) => {
        const colors = STRATEGY_COLORS[s.id];
        const points = DIMENSIONS.map((dim, i) => {
          const { x, y } = polarToXY(i * angleStep, s.scores[dim]);
          return `${x},${y}`;
        }).join(" ");
        return (
          <polygon
            key={s.id}
            points={points}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth="2"
          />
        );
      })}

      {strategies.map((s) => {
        const colors = STRATEGY_COLORS[s.id];
        return DIMENSIONS.map((dim, i) => {
          const { x, y } = polarToXY(i * angleStep, s.scores[dim]);
          return (
            <circle
              key={`${s.id}-${dim}`}
              cx={x}
              cy={y}
              r="3"
              fill={colors.stroke}
            />
          );
        });
      })}
    </svg>
  );
}

function ScoreBar({
  label,
  scores,
}: {
  label: keyof RotationScores;
  scores: { id: string; value: number }[];
}) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-1">{SCORE_LABELS[label]}</div>
      <div className="flex gap-1">
        {scores.map((s) => (
          <div key={s.id} className="flex-1">
            <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${s.value}%`,
                  backgroundColor: STRATEGY_COLORS[s.id].stroke,
                }}
              />
            </div>
            <div className="text-[10px] text-text-dim mt-0.5 text-center">
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const colors = STRATEGY_COLORS[strategy.id];
  const displayName = STRATEGY_NAMES[strategy.id] || strategy.name;
  const cropDetails = strategy.sequence.map((s) => {
    const c = crops.find((cr) => cr.id === s.crop);
    return { ...s, name: c?.name || s.crop };
  });

  return (
    <div
      className="rounded-lg bg-bg-surface-alt p-6 border-t-2"
      style={{ borderColor: colors.stroke }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{displayName}</h3>
          <p className="text-text-muted text-sm">{strategy.subtitle}</p>
        </div>
        <div className="text-3xl font-bold" style={{ color: colors.stroke }}>
          {strategy.total_score}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {cropDetails.map((s, i) => (
          <span
            key={i}
            className="text-xs bg-bg-surface text-text-secondary px-2 py-1 rounded"
          >
            {s.season === "summer" ? "Verao" : "Inverno"}: {s.name}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-accent-light uppercase tracking-wider mb-1">
            O que o satelite da NASA mostra
          </h4>
          <p className="text-text-muted text-xs">
            {strategy.evidence.nasa_insight}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">
            O que faz com o solo
          </h4>
          <p className="text-text-muted text-xs">
            {strategy.evidence.soil_impact}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-warning uppercase tracking-wider mb-1">
            E o risco do clima?
          </h4>
          <p className="text-text-muted text-xs">
            {strategy.evidence.climate_risk}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">
            Quanto da de retorno
          </h4>
          <p className="text-text-muted text-xs">
            {strategy.evidence.economic}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <h4 className="text-xs font-semibold text-red-400 mb-2">
            Pontos fracos
          </h4>
          <ul className="space-y-1">
            {strategy.risks.map((r, i) => (
              <li key={i} className="text-xs text-text-muted flex gap-1">
                <span className="text-red-500 shrink-0">-</span> {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-green-400 mb-2">
            Pontos fortes
          </h4>
          <ul className="space-y-1">
            {strategy.benefits.map((b, i) => (
              <li key={i} className="text-xs text-text-muted flex gap-1">
                <span className="text-green-500 shrink-0">+</span> {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function RotacoesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const displayed = selectedId
    ? rotations.filter((s) => s.id === selectedId)
    : rotations;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-white">
          Qual manejo de inverno escolher
        </h1>
        <p className="mt-2 text-text-secondary">
          Tres opcoes comparadas lado a lado. Veja qual cuida melhor do solo, da
          mais retorno e protege contra o clima ruim — tudo baseado em{" "}
          {44} anos de dados reais.
        </p>
      </header>

      <section>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedId(null)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              !selectedId
                ? "bg-white/10 text-white"
                : "text-text-dim hover:text-text-secondary"
            }`}
          >
            Ver todas
          </button>
          {rotations.map((s) => {
            const colors = STRATEGY_COLORS[s.id];
            const displayName = STRATEGY_NAMES[s.id] || s.name;
            return (
              <button
                key={s.id}
                onClick={() =>
                  setSelectedId(selectedId === s.id ? null : s.id)
                }
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedId === s.id
                    ? "text-white"
                    : "text-text-dim hover:text-text-secondary"
                }`}
                style={
                  selectedId === s.id
                    ? { backgroundColor: colors.stroke + "33" }
                    : undefined
                }
              >
                {displayName}
              </button>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Comparacao visual
            </h2>
            <RadarChart strategies={displayed} />
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {rotations.map((s) => {
                const colors = STRATEGY_COLORS[s.id];
                const displayName = STRATEGY_NAMES[s.id] || s.name;
                return (
                  <span
                    key={s.id}
                    className="flex items-center gap-1.5 text-xs text-text-muted"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors.stroke }}
                    />
                    {displayName} ({s.total_score} pts)
                  </span>
                );
              })}
            </div>
            <p className="text-center text-xs text-text-dim mt-2">
              Quanto mais aberto o desenho, melhor a opcao
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Nota em cada quesito
            </h2>
            <div className="space-y-4">
              {DIMENSIONS.map((dim) => (
                <ScoreBar
                  key={dim}
                  label={dim}
                  scores={rotations.map((s) => ({
                    id: s.id,
                    value: s.scores[dim],
                  }))}
                />
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-bg-surface p-4">
              <h3 className="text-sm font-semibold text-white mb-2">
                Nota geral
              </h3>
              <div className="flex items-end gap-2 h-20">
                {rotations.map((s) => {
                  const colors = STRATEGY_COLORS[s.id];
                  return (
                    <div
                      key={s.id}
                      className="flex-1 flex flex-col items-center justify-end"
                    >
                      <span
                        className="text-sm font-bold"
                        style={{ color: colors.stroke }}
                      >
                        {s.total_score}
                      </span>
                      <div
                        className="w-full rounded-t mt-1"
                        style={{
                          height: `${s.total_score * 0.6}px`,
                          backgroundColor: colors.stroke,
                          opacity: 0.7,
                        }}
                      />
                      <span className="text-[10px] text-text-dim mt-1 text-center">
                        {STRATEGY_NAMES[s.id] || s.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Detalhes de cada opcao
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {(selectedId
            ? rotations.filter((s) => s.id === selectedId)
            : rotations
          ).map((s) => (
            <StrategyCard key={s.id} strategy={s} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Como avaliamos cada quesito
        </h2>
        <div className="rounded-lg bg-bg-surface-alt p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {DIMENSIONS.map((dim) => (
              <div key={dim} className="flex gap-3">
                <div
                  className="w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: SCORE_COLORS[dim] }}
                />
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {SCORE_LABELS[dim]}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {rotationsMeta[dim as keyof typeof rotationsMeta]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-xs text-text-dim border-t border-border pt-4">
        Notas baseadas em 44 anos de dados NASA POWER + pesquisa agronomica
        EMBRAPA. Consulte um agronomo antes de mudar o manejo.
      </footer>
    </div>
  );
}

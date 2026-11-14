"use client";

import { useState } from "react";
import {
  rotations,
  rotationsMeta,
  crops,
  coverCrops,
  SCORE_LABELS,
  SCORE_COLORS,
  MONTH_NAMES,
  type RotationScores,
  type Strategy,
  type CoverCrop,
} from "@/lib/data";

const STRATEGY_COLORS: Record<
  string,
  { fill: string; stroke: string; label: string }
> = {
  baseline: {
    fill: "rgba(239,68,68,0.15)",
    stroke: "#EF4444",
    label: "Não plantar nada no inverno",
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
  baseline: "Não plantar nada no inverno",
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
            {s.season === "summer" ? "Verão" : "Inverno"}: {s.name}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-accent-light uppercase tracking-wider mb-1">
            O que o satélite da NASA mostra
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

const FUNCTION_LABELS: Record<string, string> = {
  palha_duradoura: "Palha duradoura",
  cobertura_rapida: "Cobertura rápida",
  fixa_nitrogenio: "Fixa nitrogênio",
  descompactação: "Descompactação",
  libera_fosforo: "Libera fósforo",
  renda_grao: "Renda (grão)",
};

const FUNCTION_TAG_STYLES: Record<string, string> = {
  palha_duradoura: "bg-amber-900/30 text-amber-400 border-amber-800/40",
  cobertura_rapida: "bg-emerald-900/30 text-emerald-400 border-emerald-800/40",
  fixa_nitrogenio: "bg-sky-900/30 text-sky-400 border-sky-800/40",
  descompactação: "bg-orange-900/30 text-orange-400 border-orange-800/40",
  libera_fosforo: "bg-violet-900/30 text-violet-400 border-violet-800/40",
  renda_grao: "bg-yellow-900/30 text-yellow-400 border-yellow-800/40",
};

const GROUP_LABELS: Record<string, string> = {
  graminea: "Gramínea",
  leguminosa: "Leguminosa",
  crucifera: "Crucífera",
};

const GROUP_TAG_STYLES: Record<string, string> = {
  graminea: "text-emerald-400",
  leguminosa: "text-sky-400",
  crucifera: "text-orange-400",
};

const STRATEGY_COVER_CROPS: Record<string, string[]> = {
  baseline: [],
  conservative: ["aveia-preta", "ervilhaca-comum"],
  adaptive: ["trigo", "nabo-forrageiro"],
};

function formatRange(arr: (number | null)[] | null, unit: string): string {
  if (!arr) return "—";
  const [a, b] = arr;
  if (a === null && b === null) return "—";
  if (a === null) return `até ${b} ${unit}`;
  if (b === null) return `${a}+ ${unit}`;
  if (a === b) return `${a} ${unit}`;
  return `${a}–${b} ${unit}`;
}

function SowingMiniBar({ months }: { months: number[] | null }) {
  if (!months) return <span className="text-[10px] text-text-dim">A definir</span>;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const active = months.includes(m);
        return (
          <div
            key={m}
            className={`flex h-5 w-5 items-center justify-center rounded text-[8px] font-medium ${
              active
                ? "bg-primary/30 text-primary-light"
                : "bg-bg-surface-alt/50 text-text-dim"
            }`}
            title={MONTH_NAMES[i]}
          >
            {MONTH_NAMES[i].charAt(0)}
          </div>
        );
      })}
    </div>
  );
}

function CoverCropCard({ crop, highlight }: { crop: CoverCrop; highlight: string | null }) {
  const usedIn = Object.entries(STRATEGY_COVER_CROPS)
    .filter(([, ids]) => ids.includes(crop.id))
    .map(([stratId]) => STRATEGY_NAMES[stratId])
    .filter(Boolean);

  const isHighlighted = highlight ? STRATEGY_COVER_CROPS[highlight]?.includes(crop.id) : false;

  return (
    <div
      className={`rounded-xl border p-5 ${
        isHighlighted
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            {crop.name}
          </h3>
          <p className="text-xs text-text-dim">
            <span className="italic">{crop.scientific}</span>
            {" — "}
            <span className={GROUP_TAG_STYLES[crop.group] || "text-text-muted"}>
              {GROUP_LABELS[crop.group] || crop.group}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {crop.functions.map((fn) => (
          <span
            key={fn}
            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${
              FUNCTION_TAG_STYLES[fn] || "bg-bg-surface-alt border-border text-text-muted"
            }`}
          >
            {FUNCTION_LABELS[fn] || fn}
          </span>
        ))}
        {crop.functions.length === 0 && (
          <span className="text-[10px] text-text-dim">Funções a definir</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] font-medium text-text-dim uppercase">Matéria seca</p>
          <p className="text-sm font-semibold text-text-primary">
            {formatRange(crop.dry_matter_t_ha, "t/ha")}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-text-dim uppercase">Florescimento</p>
          <p className="text-sm font-semibold text-text-primary">
            {formatRange(crop.days_to_flower, "dias")}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-text-dim uppercase">Semente</p>
          <p className="text-sm font-semibold text-text-primary">
            {formatRange(crop.seed_kg_ha, "kg/ha")}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-[10px] font-medium text-text-dim uppercase">Época de semeadura</p>
        <SowingMiniBar months={crop.sowing_months} />
      </div>

      {usedIn.length > 0 && (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[10px] font-medium tracking-wider text-primary-light uppercase">
            Usada na estratégia
          </p>
          <p className="mt-1 text-xs text-text-muted">{usedIn.join(" / ")}</p>
        </div>
      )}

      {crop.notes.length > 0 && (
        <p className="mt-3 text-xs text-text-muted">{crop.notes[0]}</p>
      )}
    </div>
  );
}

function CoverCropsSection() {
  const [filterStrategy, setFilterStrategy] = useState<string | null>(null);
  const cropList = coverCrops.crops;

  const filteredCrops = filterStrategy
    ? cropList.filter((c) => STRATEGY_COVER_CROPS[filterStrategy]?.includes(c.id))
    : cropList;

  const nFixers = cropList.filter((c) => c.functions.includes("fixa_nitrogenio")).length;
  const withStraw = cropList.filter((c) => c.functions.includes("palha_duradoura")).length;

  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-4">
        Plantas de cobertura — o arsenal do inverno
      </h2>

      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-text-primary">
              {cropList.length} opções de cobertura para o inverno
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {withStraw} produzem palha duradoura para proteger o solo e {nFixers} fixam
              nitrogênio do ar — economia de adubo na soja seguinte.
            </p>
          </div>
          <div className="shrink-0 rounded-lg bg-primary/20 px-4 py-2 text-center">
            <p className="text-2xl font-bold text-primary-light">{cropList.length}</p>
            <p className="text-[10px] text-text-dim">espécies</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterStrategy(null)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            !filterStrategy
              ? "bg-white/10 text-white"
              : "text-text-dim hover:text-text-secondary"
          }`}
        >
          Todas
        </button>
        {rotations
          .filter((s) => s.id !== "baseline")
          .map((s) => {
            const colors = STRATEGY_COLORS[s.id];
            return (
              <button
                key={s.id}
                onClick={() =>
                  setFilterStrategy(filterStrategy === s.id ? null : s.id)
                }
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  filterStrategy === s.id
                    ? "text-white"
                    : "text-text-dim hover:text-text-secondary"
                }`}
                style={
                  filterStrategy === s.id
                    ? { backgroundColor: colors.stroke + "33" }
                    : undefined
                }
              >
                Usadas em: {STRATEGY_NAMES[s.id]}
              </button>
            );
          })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredCrops.map((crop) => (
          <CoverCropCard key={crop.id} crop={crop} highlight={filterStrategy} />
        ))}
      </div>

      {filterStrategy && filteredCrops.length === 0 && (
        <div className="rounded-lg border border-border bg-bg-surface p-6 text-center">
          <p className="text-sm text-text-muted">
            Essa estratégia não usa cobertura de inverno — é o sistema de pousio.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-border bg-bg-surface-alt p-4">
        <p className="text-xs text-text-dim">
          <strong>Fontes:</strong> Artigos científicos (SciELO), Embrapa Trigo, dissertações e extensão rural (Epagri).
          Valores marcados como "—" serão completados com dados do ZARC para Cruz Alta.
        </p>
      </div>
    </section>
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
          Tres opções comparadas lado a lado. Veja qual cuida melhor do solo, da
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
              Comparação visual
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
              Quanto mais aberto o desenho, melhor a opção
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
          Detalhes de cada opção
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

      <CoverCropsSection />

      <footer className="text-xs text-text-dim border-t border-border pt-4">
        Notas baseadas em 44 anos de dados NASA POWER + pesquisa agronômica
        Embrapa. Consulte um agrônomo antes de mudar o manejo.
      </footer>
    </div>
  );
}

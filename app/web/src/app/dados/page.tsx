"use client";

import { useState } from "react";
import {
  site,
  timeline,
  soil,
  topography,
  soilMoisture,
  ndvi,
  mapbiomas,
  MONTH_NAMES,
  KEY_FINDINGS,
  type TimelineYear,
  type MonthlyNormal,
} from "@/lib/data";

const ENSO_COLORS: Record<string, string> = {
  el_nino_forte: "#E53935",
  el_nino_moderado: "#EF5350",
  el_nino_fraco: "#EF9A9A",
  la_nina_forte: "#1E88E5",
  la_nina_moderado: "#42A5F5",
  la_nina_fraco: "#90CAF9",
  neutro: "#6B7280",
};

const ENSO_LABELS: Record<string, string> = {
  el_nino_forte: "El Niño Forte",
  el_nino_moderado: "El Niño Moderado",
  el_nino_fraco: "El Niño Fraco",
  la_nina_forte: "La Niña Forte",
  la_nina_moderado: "La Niña Moderado",
  la_nina_fraco: "La Niña Fraco",
  neutro: "Neutro",
};

type TabKey = "clima" | "historico" | "solo" | "vegetacao" | "uso-do-solo";

const TABS: { key: TabKey; label: string }[] = [
  { key: "clima", label: "Riscos Climáticos" },
  { key: "historico", label: "Histórico 44 anos" },
  { key: "solo", label: "Solo e Terreno" },
  { key: "vegetacao", label: "NDVI" },
  { key: "uso-do-solo", label: "Uso do Solo" },
];

// ── Shared chart components ──────────────────────────────

function BarChart({
  data,
  getValue,
  getColor,
  unit,
  label,
  minVal,
  maxVal,
}: {
  data: TimelineYear[];
  getValue: (d: TimelineYear) => number | null;
  getColor: (d: TimelineYear) => string;
  unit: string;
  label: string;
  minVal?: number;
  maxVal?: number;
}) {
  const values = data.map(getValue).filter((v): v is number => v !== null);
  const min = minVal ?? Math.min(...values);
  const max = maxVal ?? Math.max(...values);
  const range = max - min || 1;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
        <span className="text-xs text-text-muted">
          Média: {avg.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="relative overflow-x-auto rounded-lg border border-border bg-bg-surface p-4">
        <div className="relative" style={{ minWidth: data.length * 14 }}>
          <div
            className="absolute left-0 right-0 border-t border-dashed border-text-dim/30"
            style={{ bottom: `${((avg - min) / range) * 100}%` }}
          />
          <div className="flex items-end gap-px" style={{ height: 200 }}>
            {data.map((d, i) => {
              const val = getValue(d);
              if (val === null) return <div key={d.year} className="flex-1" />;
              const pct = ((val - min) / range) * 100;
              const color = getColor(d);
              return (
                <div
                  key={d.year}
                  className="group relative flex-1 cursor-pointer"
                  style={{ height: "100%" }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className="absolute bottom-0 w-full rounded-t-sm transition-opacity"
                    style={{
                      height: `${Math.max(pct, 1)}%`,
                      backgroundColor: color,
                      opacity: hovered === null || hovered === i ? 1 : 0.4,
                    }}
                  />
                  {hovered === i && (
                    <div className="pointer-events-none absolute -top-16 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                      <p className="font-semibold text-text-primary">
                        {d.year}
                      </p>
                      <p className="text-text-secondary">
                        {val.toFixed(1)}
                        {unit}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex">
            {data.map((d, i) =>
              i % 5 === 0 ? (
                <span
                  key={d.year}
                  className="text-[9px] text-text-dim"
                  style={{ width: `${(5 / data.length) * 100}%` }}
                >
                  {d.year}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthlyChart({
  data,
  getValue,
  color,
  unit,
  label,
}: {
  data: MonthlyNormal[];
  getValue: (d: MonthlyNormal) => number;
  color: string;
  unit: string;
  label: string;
}) {
  const values = data.map(getValue);
  const max = Math.max(...values);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-text-primary">{label}</h3>
      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {data.map((d, i) => {
            const val = getValue(d);
            const pct = (val / max) * 100;
            return (
              <div
                key={d.month}
                className="group relative flex flex-1 flex-col items-center"
                style={{ height: "100%" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="relative flex-1 w-full flex items-end justify-center">
                  <div
                    className="w-full max-w-8 rounded-t-sm transition-opacity"
                    style={{
                      height: `${pct}%`,
                      backgroundColor: color,
                      opacity: hovered === null || hovered === i ? 1 : 0.5,
                    }}
                  />
                  {hovered === i && (
                    <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                      <p className="text-text-primary">
                        {val.toFixed(1)}
                        {unit}
                      </p>
                    </div>
                  )}
                </div>
                <span className="mt-1 text-[10px] text-text-dim">
                  {MONTH_NAMES[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-text-dim">{sub}</p>}
    </div>
  );
}

function EnsoLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(ENSO_LABELS).map(([key, label]) => (
        <div key={key} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: ENSO_COLORS[key] }}
          />
          <span className="text-xs text-text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── TAB: Riscos Climáticos (ex-diagnostico) ──────────────

const RISK_KEYS = ["dry_spell", "heat", "heavy_rain", "frost"] as const;

const RISK_LABELS: Record<(typeof RISK_KEYS)[number], string> = {
  dry_spell: "Seca longa",
  heat: "Calor forte",
  heavy_rain: "Chuvarada",
  frost: "Geada",
};

function riskText(value: number): string {
  const pct = Math.round(value * 100);
  if (pct === 0) return "-";
  const de10 = Math.round(value * 10);
  return `${de10} em 10`;
}

function riskColor(value: number): string {
  if (value <= 0.2) return "bg-emerald-900/60 text-emerald-300";
  if (value <= 0.5) return "bg-yellow-900/60 text-yellow-300";
  if (value <= 0.75) return "bg-orange-900/60 text-orange-300";
  return "bg-red-900/60 text-red-300";
}

function ClimaTab() {
  const months = site.q2.months;
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Calendário de riscos — mês a mês
        </h2>
        <p className="text-text-muted text-sm mb-6">
          De cada 10 anos, quantas vezes cada problema aconteceu em cada mês.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-text-muted font-medium">
                  Risco
                </th>
                {MONTH_NAMES.map((m) => (
                  <th
                    key={m}
                    className="py-2 px-2 text-center text-text-muted font-medium min-w-[52px]"
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISK_KEYS.map((key) => (
                <tr key={key} className="border-t border-border">
                  <td className="py-3 px-3 text-text-secondary font-medium whitespace-nowrap">
                    {RISK_LABELS[key]}
                  </td>
                  {months.map((month, i) => {
                    const val = month[key];
                    return (
                      <td key={i} className="py-3 px-2 text-center">
                        <span
                          className={`inline-block w-full py-1 px-1 rounded text-xs font-semibold ${riskColor(val)}`}
                        >
                          {riskText(val)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-text-dim">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-900/60" /> Raro (até 2
            em 10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-yellow-900/60" /> Às vezes (3 a
            5 em 10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-900/60" /> Frequente (6
            a 7 em 10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-900/60" /> Quase todo ano
            (8+ em 10)
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-bg-surface-alt p-5">
          <h3 className="text-warning font-semibold mb-2">
            Verão (Dez a Fev) — Hora da soja
          </h3>
          <p className="text-text-secondary text-sm">
            É quando a soja mais precisa de chuva. O calor forte aparece em até
            7 de cada 10 janeiros.
          </p>
        </div>
        <div className="rounded-lg bg-bg-surface-alt p-5">
          <h3 className="text-accent-light font-semibold mb-2">
            Inverno (Jun a Ago) — Terra parada?
          </h3>
          <p className="text-text-secondary text-sm">
            Geada em {KEY_FINDINGS.frost_jul_pct} a{" "}
            {KEY_FINDINGS.frost_aug_pct}% dos anos. Quem planta aveia ou trigo
            aproveita esses meses.
          </p>
        </div>
        <div className="rounded-lg bg-bg-surface-alt p-5">
          <h3 className="text-primary-light font-semibold mb-2">
            Transições (Mar-Mai / Set-Nov)
          </h3>
          <p className="text-text-secondary text-sm">
            Chuvaradas fortes (50mm/dia) em até 4 de cada 10 anos. Se o solo
            está sem cobertura, a enxurrada leva a camada mais rica.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── TAB: Histórico 44 anos (ex-timeline) ─────────────────

function HistoricoTab() {
  const years = timeline.timeline;
  const normals = timeline.monthly_normals;
  const ensoImpact = timeline.enso_impact;
  const [subTab, setSubTab] = useState<
    "temperatura" | "chuva" | "produtividade" | "umidade" | "enso" | "mensal"
  >("enso");

  const SUB_TABS = [
    { key: "enso" as const, label: "El Niño / La Niña" },
    { key: "temperatura" as const, label: "Temperatura" },
    { key: "chuva" as const, label: "Chuva" },
    { key: "produtividade" as const, label: "Produtividade" },
    { key: "umidade" as const, label: "Umidade" },
    { key: "mensal" as const, label: "Médias Mensais" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Dados de satélite da NASA de 1981 até 2025, cruzados com a
        produtividade de soja do IBGE e a classificação El Niño/La Niña da NOAA.
      </p>
      <div className="flex flex-wrap gap-2">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              subTab === t.key
                ? "bg-primary/20 text-primary-light"
                : "bg-bg-surface text-text-muted hover:bg-bg-surface-alt"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "enso" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              value={`${ensoImpact.el_nino.avg_yield_sc_ha} sc/ha`}
              label={`El Niño (${ensoImpact.el_nino.n_safras} safras)`}
              sub={`${ensoImpact.el_nino.avg_season_rain_mm} mm de chuva na safra`}
            />
            <StatCard
              value={`${ensoImpact.la_nina.avg_yield_sc_ha} sc/ha`}
              label={`La Niña (${ensoImpact.la_nina.n_safras} safras)`}
              sub={`${ensoImpact.la_nina.avg_season_rain_mm} mm de chuva na safra`}
            />
            <StatCard
              value={`${ensoImpact.neutro.avg_yield_sc_ha} sc/ha`}
              label={`Neutro (${ensoImpact.neutro.n_safras} safras)`}
            />
          </div>
          <div className="rounded-lg border border-border bg-bg-surface p-4">
            <div className="flex flex-wrap gap-1">
              {years.map((y) => (
                <div key={y.year} className="flex flex-col items-center">
                  <div
                    className="h-8 w-5 rounded-sm"
                    style={{ backgroundColor: ENSO_COLORS[y.enso] }}
                    title={`${y.year}: ${ENSO_LABELS[y.enso]}`}
                  />
                  {y.year % 5 === 0 && (
                    <span className="mt-0.5 text-[8px] text-text-dim">
                      {y.year}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3">
              <EnsoLegend />
            </div>
          </div>
        </div>
      )}

      {subTab === "temperatura" && (
        <div className="space-y-6">
          <BarChart
            data={years}
            getValue={(d) => d.avg_temp_c}
            getColor={(d) => {
              const v = d.avg_temp_c ?? 19.5;
              return v > 20 ? "#E65100" : v > 19 ? "#FF8F00" : "#42A5F5";
            }}
            unit=" graus"
            label="Temperatura média anual (1981-2025)"
          />
          <BarChart
            data={years}
            getValue={(d) => d.hot_days}
            getColor={() => "#E53935"}
            unit=" dias"
            label="Dias com mais de 32 graus por ano"
            minVal={0}
          />
        </div>
      )}

      {subTab === "chuva" && (
        <div className="space-y-6">
          <BarChart
            data={years}
            getValue={(d) => d.annual_rain_mm}
            getColor={(d) => {
              const v = d.annual_rain_mm;
              return v > 2000
                ? "#1E88E5"
                : v > 1500
                  ? "#42A5F5"
                  : v > 1200
                    ? "#FF8F00"
                    : "#E53935";
            }}
            unit=" mm"
            label="Chuva total por ano (1981-2025)"
          />
          <BarChart
            data={years.filter((y) => y.season_rain_mm !== null)}
            getValue={(d) => d.season_rain_mm}
            getColor={(d) => ENSO_COLORS[d.enso]}
            unit=" mm"
            label="Chuva na safra (nov-mar) — cor por El Niño/La Niña"
          />
          <EnsoLegend />
        </div>
      )}

      {subTab === "produtividade" && (
        <div className="space-y-6">
          <BarChart
            data={years.filter((y) => y.yield_sc_ha !== null)}
            getValue={(d) => d.yield_sc_ha}
            getColor={(d) => ENSO_COLORS[d.enso]}
            unit=" sc/ha"
            label="Produtividade da soja por ano — cor por El Niño/La Niña"
            minVal={0}
          />
          <EnsoLegend />
        </div>
      )}

      {subTab === "umidade" && (
        <div className="space-y-6">
          <BarChart
            data={years.filter((y) => y.avg_soil_moisture !== null)}
            getValue={(d) =>
              d.avg_soil_moisture !== null ? d.avg_soil_moisture * 100 : null
            }
            getColor={(d) => {
              const v = d.avg_soil_moisture ?? 0.8;
              return v > 0.85
                ? "#1E88E5"
                : v > 0.75
                  ? "#42A5F5"
                  : v > 0.65
                    ? "#FF8F00"
                    : "#E53935";
            }}
            unit="%"
            label="Umidade média do solo (raiz) por ano"
          />
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="mb-4 text-xs text-text-dim">
              Umidade mensal — 0% = seco, 100% = saturado
            </p>
            <div className="flex items-end gap-1.5">
              {soilMoisture.monthly_averages.map((m) => {
                const rootH = m.root_zone * 200;
                const profH = m.profile * 200;
                return (
                  <div
                    key={m.month}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="flex items-end gap-0.5"
                      style={{ height: 200 }}
                    >
                      <div
                        className="w-3 rounded-t bg-emerald-500/70"
                        style={{ height: rootH }}
                        title={`Raiz: ${(m.root_zone * 100).toFixed(0)}%`}
                      />
                      <div
                        className="w-3 rounded-t bg-sky-500/70"
                        style={{ height: profH }}
                        title={`Perfil: ${(m.profile * 100).toFixed(0)}%`}
                      />
                    </div>
                    <span className="text-[10px] text-text-dim">{m.name}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/70" />
                Raiz (0-100cm)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-500/70" />
                Perfil completo
              </span>
            </div>
          </div>
        </div>
      )}

      {subTab === "mensal" && (
        <div className="space-y-6">
          <MonthlyChart
            data={normals}
            getValue={(d) => d.avg_rain_mm}
            color="#1E88E5"
            unit=" mm"
            label="Chuva média por mês"
          />
          <MonthlyChart
            data={normals}
            getValue={(d) => d.avg_tmax_c}
            color="#E65100"
            unit=" graus"
            label="Temperatura máxima média por mês"
          />
          <MonthlyChart
            data={normals}
            getValue={(d) => d.avg_moisture * 100}
            color="#2D6A4F"
            unit="%"
            label="Umidade do solo (raiz) por mês"
          />
        </div>
      )}
    </div>
  );
}

// ── TAB: Solo e Terreno (ex-solo) ────────────────────────

function elevationColor(elev: number, min: number, max: number): string {
  const pct = (elev - min) / (max - min);
  if (pct > 0.75) return "bg-emerald-700";
  if (pct > 0.5) return "bg-emerald-600";
  if (pct > 0.25) return "bg-yellow-700";
  return "bg-orange-700";
}

function SoloTab() {
  const topLayer = soil.layers[0];
  const topo = topography.summary;
  const points = topography.points;

  return (
    <div className="space-y-10">
      <div className="rounded-lg bg-bg-surface-alt p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Relevo da região
        </h3>
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="rounded-lg bg-bg-surface p-4">
            <p className="text-2xl font-bold text-text-primary">
              {topo.mean_elevation_m.toFixed(0)}m
            </p>
            <p className="text-xs text-text-muted">Altitude média</p>
          </div>
          <div className="rounded-lg bg-bg-surface p-4">
            <p className="text-2xl font-bold text-text-primary">
              {topo.min_elevation_m}m - {topo.max_elevation_m}m
            </p>
            <p className="text-xs text-text-muted">Variação de altitude</p>
          </div>
          <div className="rounded-lg bg-bg-surface p-4">
            <p className="text-2xl font-bold text-text-primary">
              {topo.range_m}m
            </p>
            <p className="text-xs text-text-muted">Desnível total</p>
          </div>
          <div className="rounded-lg bg-bg-surface p-4">
            <p className="text-2xl font-bold text-text-primary">Planalto</p>
            <p className="text-xs text-text-muted">Planalto Médio Gaúcho</p>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 max-w-sm">
          {points.map((p, i) => (
            <div
              key={i}
              className={`rounded-sm p-2 text-center ${elevationColor(p.elevation_m, topo.min_elevation_m, topo.max_elevation_m)}`}
              title={`${p.latitude.toFixed(2)}, ${p.longitude.toFixed(2)}: ${p.elevation_m}m`}
            >
              <span className="text-xs font-semibold text-white">
                {p.elevation_m}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-text-dim">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-orange-700" />
            <span>Baixo ({topo.min_elevation_m}m)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-emerald-700" />
            <span>Alto ({topo.max_elevation_m}m)</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-bg-surface-alt p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Textura: {soil.texture_class}
        </h3>
        <div className="space-y-3">
          {[
            {
              label: "Argila (segura água e nutriente)",
              value: topLayer.clay_pct,
              color: "#8B5E3C",
            },
            {
              label: "Areia (deixa a água passar)",
              value: topLayer.sand_pct,
              color: "#D97706",
            },
            {
              label: "Silte (meio termo)",
              value: topLayer.silt_pct,
              color: "#6B7280",
            },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">{item.label}</span>
                <span className="font-semibold" style={{ color: item.color }}>
                  {item.value}%
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-bg-surface-alt p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          O que fazer pra melhorar esse solo
        </h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-warning" />
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">Corrigir acidez:</strong>{" "}
              pH {topLayer.ph} — aplicar calcário pra subir pra pelo menos 5.5.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-light" />
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">
                Plantar leguminosa no inverno:
              </strong>{" "}
              Ervilhaca fixa nitrogênio de graça — economia de R$200-400/ha em
              adubo.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-light" />
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">
                Manter cobertura o ano todo:
              </strong>{" "}
              Aveia preta repõe 4-8 t/ha de palha no solo.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#8B5E3C]" />
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">
                Quebrar compactação:
              </strong>{" "}
              Nabo forrageiro — raiz que vai a 2 metros de profundidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TAB: NDVI (ex-vegetacao) ─────────────────────────────

function NdviBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  const green = Math.round(value * 255);
  const red = Math.round((1 - value) * 180);
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-bg-surface-alt">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: `rgb(${red}, ${green}, 60)`,
          }}
        />
      </div>
      <span className="w-12 text-right text-xs font-mono text-text-secondary">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function VegetacaoTab() {
  const s = ndvi.summary;
  const maxNdvi = Math.max(...ndvi.monthly_averages.map((m) => m.avg_ndvi));
  const maxAnnual = Math.max(...ndvi.annual_averages.map((a) => a.avg_ndvi));
  const minAnnual = Math.min(...ndvi.annual_averages.map((a) => a.avg_ndvi));
  const annualRange = maxAnnual - minAnnual || 0.01;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-dim uppercase">NDVI médio</p>
          <p className="mt-1 text-2xl font-bold text-primary-light">
            {s.overall_mean.toFixed(2)}
          </p>
          <p className="text-xs text-text-muted">2000-2025</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-dim uppercase">NDVI safra</p>
          <p className="mt-1 text-2xl font-bold text-accent-light">
            {s.growing_season_mean?.toFixed(2) ?? "—"}
          </p>
          <p className="text-xs text-text-muted">Out-Mar</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-dim uppercase">Amplitude</p>
          <p className="mt-1 text-2xl font-bold text-warning-light">
            {s.overall_min.toFixed(2)} — {s.overall_max.toFixed(2)}
          </p>
          <p className="text-xs text-text-muted">Min e max em 25 anos</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-dim uppercase">Observações</p>
          <p className="mt-1 text-2xl font-bold text-text-secondary">
            {s.n_good_quality.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-text-muted">Com qualidade boa</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          NDVI médio por mês
        </h3>
        <div className="space-y-2">
          {ndvi.monthly_averages.map((m) => (
            <div
              key={m.month}
              className="grid grid-cols-[3rem_1fr] items-center gap-3"
            >
              <span className="text-xs font-medium text-text-secondary">
                {m.name}
              </span>
              <NdviBar value={m.avg_ndvi} max={maxNdvi * 1.05} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Evolução anual
        </h3>
        <div className="overflow-x-auto">
          <div
            className="flex items-end gap-[3px]"
            style={{ minWidth: "600px", height: "200px" }}
          >
            {ndvi.annual_averages.map((a) => {
              const h = Math.round(
                ((a.avg_ndvi - minAnnual) / annualRange) * 160 + 20,
              );
              return (
                <div
                  key={a.year}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                  style={{ height: "200px" }}
                >
                  <div className="absolute -top-6 hidden rounded bg-bg-surface-alt px-2 py-1 text-[10px] text-text-secondary shadow-lg group-hover:block">
                    {a.year}: {a.avg_ndvi.toFixed(3)}
                  </div>
                  <div
                    className="relative w-full rounded-t bg-primary transition-all group-hover:bg-primary-light"
                    style={{ height: `${h}px` }}
                  />
                  {a.year % 5 === 0 && (
                    <span className="mt-1 text-[9px] text-text-dim">
                      {a.year}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TAB: Uso do Solo (ex-uso-do-solo) ────────────────────

const GROUP_LABELS: Record<string, string> = {
  soja: "Soja",
  outras_lavouras: "Outras lavouras",
  pastagem: "Pastagem",
  campo_nativo: "Campo nativo",
  floresta: "Floresta",
  silvicultura: "Silvicultura",
  água: "Água",
  urbano_outros: "Urbano/outros",
};

const GROUP_COLORS: Record<string, string> = {
  soja: "#F9A825",
  outras_lavouras: "#FF8F00",
  pastagem: "#AED581",
  campo_nativo: "#81C784",
  floresta: "#2D6A4F",
  silvicultura: "#5D4037",
  água: "#1E88E5",
  urbano_outros: "#9E9E9E",
};

const RELEVANT_GROUPS = [
  "soja",
  "outras_lavouras",
  "pastagem",
  "campo_nativo",
  "floresta",
  "silvicultura",
  "água",
  "urbano_outros",
];

function UsoDoSoloTab() {
  const cs = mapbiomas.current_state;
  const tr = mapbiomas.transitions;
  const ts = mapbiomas.group_timeseries;
  const sojaTs = ts.soja || [];
  const first = sojaTs[0];
  const last = sojaTs[sojaTs.length - 1];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          O que tem hoje ({last?.year || 2023})
        </h3>
        <div className="space-y-2">
          {RELEVANT_GROUPS.filter((g) => cs[g] && cs[g].area_ha > 0).map(
            (g) => {
              const state = cs[g];
              return (
                <div key={g} className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 shrink-0 rounded"
                    style={{ backgroundColor: GROUP_COLORS[g] }}
                  />
                  <span className="w-28 text-sm text-text-secondary">
                    {GROUP_LABELS[g]}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 overflow-hidden rounded-full bg-bg-surface-alt">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${state.pct}%`,
                          backgroundColor: GROUP_COLORS[g],
                          minWidth: state.pct > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-20 text-right text-xs font-mono text-text-secondary">
                    {state.area_ha.toLocaleString("pt-BR")} ha
                  </span>
                  <span className="w-12 text-right text-xs text-text-dim">
                    {state.pct}%
                  </span>
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="rounded-xl border border-warning/30 bg-warning/5 p-6">
        <h3 className="text-lg font-semibold text-warning-light mb-3">
          A explosão da soja
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-text-secondary">
              {first?.area_ha.toLocaleString("pt-BR")} ha
            </p>
            <p className="text-xs text-text-dim">
              Soja em {first?.year || 1985}
            </p>
          </div>
          <div className="flex items-center justify-center text-3xl text-warning-light">
            →
          </div>
          <div className="rounded-lg border border-border bg-bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-warning-light">
              {last?.area_ha.toLocaleString("pt-BR")} ha
            </p>
            <p className="text-xs text-text-dim">
              Soja em {last?.year || 2023}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-text-muted">
          A soja saiu de {tr.soja?.from_ha.toLocaleString("pt-BR")} ha pra{" "}
          {tr.soja?.to_ha.toLocaleString("pt-BR")} ha — aumento de{" "}
          {tr.soja?.change_pct > 0 ? "+" : ""}
          {tr.soja?.change_pct.toFixed(0)}%.
        </p>
      </div>

      <div className="overflow-x-auto">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Evolução da soja (1985 → 2023)
        </h3>
        <div
          className="flex items-end gap-[2px]"
          style={{ minWidth: "600px", height: "180px" }}
        >
          {sojaTs.map((entry) => {
            const maxHa = Math.max(...sojaTs.map((e) => e.area_ha));
            const h = Math.round((entry.area_ha / maxHa) * 160 + 10);
            return (
              <div
                key={entry.year}
                className="group relative flex flex-1 flex-col items-center justify-end"
                style={{ height: "180px" }}
              >
                <div className="absolute -top-6 hidden rounded bg-bg-surface-alt px-2 py-1 text-[10px] text-text-secondary shadow-lg group-hover:block">
                  {entry.year}: {entry.area_ha.toLocaleString("pt-BR")} ha
                </div>
                <div
                  className="relative w-full rounded-t transition-all group-hover:opacity-80"
                  style={{
                    height: `${h}px`,
                    backgroundColor: GROUP_COLORS.soja,
                  }}
                />
                {entry.year % 5 === 0 && (
                  <span className="mt-1 text-[9px] text-text-dim">
                    {entry.year}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────

export default function DadosPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("clima");

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-wider text-accent-light uppercase">
            Base de Dados
          </p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">
            Todos os dados de {site.point.name}-{site.point.state}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary">
            {KEY_FINDINGS.data_years} anos de clima, solo, vegetação e uso da
            terra — tudo em um lugar.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary/20 text-primary-light"
                  : "bg-bg-surface text-text-muted hover:bg-bg-surface-alt hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "clima" && <ClimaTab />}
        {activeTab === "historico" && <HistoricoTab />}
        {activeTab === "solo" && <SoloTab />}
        {activeTab === "vegetacao" && <VegetacaoTab />}
        {activeTab === "uso-do-solo" && <UsoDoSoloTab />}

        <div className="mt-12 rounded-xl border border-accent/20 bg-accent/5 p-5">
          <h3 className="text-sm font-semibold text-accent-light">
            Fontes de dados
          </h3>
          <div className="mt-2 grid gap-2 text-xs text-text-muted sm:grid-cols-2">
            <p>Clima: NASA POWER v2.0 (1981-2025)</p>
            <p>Umidade: NASA POWER GWETROOT (1981-2025)</p>
            <p>Produtividade: IBGE SIDRA tabela 1612</p>
            <p>El Niño/La Niña: NOAA ONI</p>
            <p>Solo: SoilGrids v2.0 ISRIC (250m)</p>
            <p>Topografia: SRTM/Copernicus DEM (30m)</p>
            <p>NDVI: MODIS MOD13Q1 via Earth Engine</p>
            <p>Uso do solo: MapBiomas Collection 9</p>
          </div>
        </div>
      </div>
    </div>
  );
}

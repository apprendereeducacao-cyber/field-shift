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
  evapotranspiration,
  smap,
  gpm,
  grace,
  climateExt,
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

type TabKey = "clima" | "historico" | "solo" | "vegetacao" | "uso-do-solo" | "satelite";

const TABS: { key: TabKey; label: string }[] = [
  { key: "clima", label: "Riscos Climaticos" },
  { key: "historico", label: "Historico 44 anos" },
  { key: "satelite", label: "Satelite NASA" },
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
  if (value <= 0.2) return "bg-emerald-50 text-emerald-700";
  if (value <= 0.5) return "bg-yellow-50 text-yellow-700";
  if (value <= 0.75) return "bg-orange-50 text-orange-700";
  return "bg-red-50 text-red-700";
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
            <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" /> Raro (até 2
            em 10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-yellow-50 border border-yellow-200" /> Às vezes (3 a
            5 em 10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-50 border border-orange-200" /> Frequente (6
            a 7 em 10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Quase todo ano
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
              <div className="h-3 bg-bg-surface-alt rounded-full overflow-hidden">
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

// ── TAB: Satelite NASA ──────────────────────────────────

function SateliteTab() {
  const [subTab, setSubTab] = useState<
    "grace" | "smap" | "gpm" | "et" | "clima-ext"
  >("grace");

  const SUB_TABS = [
    { key: "grace" as const, label: "Agua Subterranea (GRACE)" },
    { key: "smap" as const, label: "Umidade Solo (SMAP)" },
    { key: "gpm" as const, label: "Chuva Satelite (GPM)" },
    { key: "et" as const, label: "Evapotranspiracao" },
    { key: "clima-ext" as const, label: "Clima Completo" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Dados de 5 satelites NASA processados para Cruz Alta — agua subterranea,
        umidade do solo por microondas, chuva por radar, evapotranspiracao e
        variaveis climaticas estendidas.
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

      {subTab === "grace" && <GraceSection />}
      {subTab === "smap" && <SmapSection />}
      {subTab === "gpm" && <GpmSection />}
      {subTab === "et" && <ETSection />}
      {subTab === "clima-ext" && <ClimaExtSection />}
    </div>
  );
}

function GraceSection() {
  const trend = grace.trend;
  const clim = grace.monthly_climatology;
  const ts = grace.timeseries;
  const maxClim = Math.max(...clim.map((m) => Math.abs(m.avg_tws_anomaly_cm)));

  const annualAvg: { year: number; avg: number }[] = [];
  const byYear = new Map<number, number[]>();
  for (const r of ts) {
    if (!byYear.has(r.year)) byYear.set(r.year, []);
    byYear.get(r.year)!.push(r.tws_anomaly_cm);
  }
  for (const [year, vals] of byYear) {
    annualAvg.push({ year, avg: vals.reduce((a, b) => a + b, 0) / vals.length });
  }
  const minY = Math.min(...annualAvg.map((a) => a.avg));
  const maxY = Math.max(...annualAvg.map((a) => a.avg));
  const rangeY = maxY - minY || 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={`+${trend.change_cm.toFixed(1)} cm`}
          label="Agua subterranea ganhando"
          sub={`De ${trend.first_half_avg.toFixed(1)} para ${trend.second_half_avg.toFixed(1)} cm (2002-2024)`}
        />
        <StatCard
          value={`${ts.length}`}
          label="Medicoes do GRACE"
          sub="Meses com dados (2002-2024)"
        />
        <StatCard
          value={clim.reduce((best, m) => m.avg_tws_anomaly_cm > best.avg_tws_anomaly_cm ? m : best).name}
          label="Mes com mais agua"
          sub={`${clim.reduce((best, m) => m.avg_tws_anomaly_cm > best.avg_tws_anomaly_cm ? m : best).avg_tws_anomaly_cm.toFixed(1)} cm anomalia`}
        />
      </div>

      <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
        <p className="text-xs font-medium tracking-wider text-primary-light uppercase">
          O que isso significa pro produtor
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          A regiao de Cruz Alta esta <strong className="text-primary-light">ganhando agua subterranea</strong> — +{trend.change_cm.toFixed(1)} cm
          em 22 anos de medicao por satelite. Isso indica que o lencol freatico esta se recarregando,
          o que e bom sinal para periodos de seca. Setembro e o mes com maior reserva, e fevereiro
          o menor — coincide com o pico de consumo da soja.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Sazonalidade da agua subterranea (media mensal)
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <div className="flex items-end gap-2" style={{ height: 180 }}>
            {clim.map((m, i) => {
              const val = m.avg_tws_anomaly_cm;
              const isPositive = val >= 0;
              const pct = (Math.abs(val) / maxClim) * 45;
              return (
                <div
                  key={m.month}
                  className="flex flex-1 flex-col items-center justify-center"
                  style={{ height: "100%" }}
                >
                  <div className="relative flex flex-col items-center" style={{ height: "100%" }}>
                    <div className="flex-1 flex items-end">
                      {isPositive && (
                        <div
                          className="w-full max-w-8 rounded-t-sm bg-sky-500"
                          style={{ height: `${pct}%` }}
                          title={`${m.name}: ${val.toFixed(1)} cm`}
                        />
                      )}
                    </div>
                    <div className="w-full border-t border-text-dim/30" />
                    <div className="flex-1 flex items-start">
                      {!isPositive && (
                        <div
                          className="w-full max-w-8 rounded-b-sm bg-amber-500"
                          style={{ height: `${pct}%` }}
                          title={`${m.name}: ${val.toFixed(1)} cm`}
                        />
                      )}
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] text-text-dim">{MONTH_NAMES[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-500" /> Acima da media
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" /> Abaixo da media
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Tendencia anual (2002-2024)
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <div className="flex items-end gap-[3px]" style={{ height: 160, minWidth: annualAvg.length * 20 }}>
            {annualAvg.map((a) => {
              const pct = ((a.avg - minY) / rangeY) * 100;
              const color = a.avg >= 0 ? "#0ea5e9" : "#f59e0b";
              return (
                <div
                  key={a.year}
                  className="group relative flex-1"
                  style={{ height: "100%" }}
                >
                  <div
                    className="absolute bottom-0 w-full rounded-t-sm transition-opacity group-hover:opacity-80"
                    style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                  />
                  <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                    {a.year}: {a.avg.toFixed(1)} cm
                  </div>
                  {a.year % 4 === 0 && (
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-text-dim">{a.year}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-text-dim border-t border-border pt-3">
        Fonte: {grace.source} | {grace.period} | Unidade: {grace.unit}
      </p>
    </div>
  );
}

function SmapSection() {
  const clim = smap.monthly_climatology;
  const trend = smap.yearly_trend;
  const maxMoist = Math.max(...clim.map((m) => m.avg_soil_moisture));
  const minTrend = Math.min(...trend.map((t) => t.avg));
  const maxTrend = Math.max(...trend.map((t) => t.avg));
  const rangeTrend = maxTrend - minTrend || 0.01;

  const driestMonth = clim.reduce((a, b) => a.avg_soil_moisture < b.avg_soil_moisture ? a : b);
  const wettestMonth = clim.reduce((a, b) => a.avg_soil_moisture > b.avg_soil_moisture ? a : b);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={`${(maxMoist * 100).toFixed(0)}%`}
          label={`Solo mais umido: ${wettestMonth.name}`}
          sub={`${wettestMonth.avg_soil_moisture.toFixed(3)} cm3/cm3`}
        />
        <StatCard
          value={`${(driestMonth.avg_soil_moisture * 100).toFixed(0)}%`}
          label={`Solo mais seco: ${driestMonth.name}`}
          sub={`${driestMonth.avg_soil_moisture.toFixed(3)} cm3/cm3`}
        />
        <StatCard
          value={`${trend.length}`}
          label="Anos com medicao SMAP"
          sub="Satelite de microondas (2015-2025)"
        />
      </div>

      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
        <p className="text-xs font-medium tracking-wider text-accent uppercase">
          Interpretacao
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          O SMAP mede a umidade real do solo por microondas (9km de resolucao). Em Cruz Alta,
          o solo fica mais seco em <strong>dezembro-janeiro</strong> — justamente quando a soja
          mais precisa de agua. O inverno (junho-julho) e o periodo mais umido. Manter cobertura
          no verao reduz a perda de umidade por evaporacao.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Umidade do solo por mes (SMAP, media 2015-2025)
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {clim.map((m, i) => {
              const pct = (m.avg_soil_moisture / maxMoist) * 100;
              const color = m.avg_soil_moisture > 0.28 ? "#0ea5e9" : m.avg_soil_moisture > 0.22 ? "#f59e0b" : "#ef4444";
              return (
                <div key={m.month} className="group relative flex flex-1 flex-col items-center" style={{ height: "100%" }}>
                  <div className="relative flex-1 w-full flex items-end justify-center">
                    <div
                      className="w-full max-w-8 rounded-t-sm transition-opacity group-hover:opacity-80"
                      style={{ height: `${pct}%`, backgroundColor: color }}
                    />
                    <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                      {(m.avg_soil_moisture * 100).toFixed(1)}%
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] text-text-dim">{MONTH_NAMES[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-500" /> Umido ({">"}28%)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" /> Medio (22-28%)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" /> Seco ({"<"}22%)
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Tendencia anual (SMAP 2015-2025)
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <div className="flex items-end gap-2" style={{ height: 140 }}>
            {trend.map((t) => {
              const pct = ((t.avg - minTrend) / rangeTrend) * 80 + 10;
              return (
                <div key={t.year} className="group relative flex flex-1 flex-col items-center" style={{ height: "100%" }}>
                  <div className="relative flex-1 w-full flex items-end justify-center">
                    <div
                      className="w-full max-w-10 rounded-t-sm bg-sky-500 transition-opacity group-hover:opacity-80"
                      style={{ height: `${pct}%` }}
                    />
                    <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                      {t.year}: {(t.avg * 100).toFixed(1)}%
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] text-text-dim">{t.year}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-text-dim border-t border-border pt-3">
        Fonte: {smap.source} | {smap.period} | Unidade: {smap.unit}
      </p>
    </div>
  );
}

function GpmSection() {
  const clim = gpm.monthly_climatology;
  const annuals = gpm.annual_totals;
  const maxMonth = Math.max(...clim.map((m) => m.avg_precip_mm));
  const totalAvg = clim.reduce((s, m) => s + m.avg_precip_mm, 0);

  const last5 = annuals.slice(-5);
  const minAnn = Math.min(...annuals.map((a) => a.total_mm));
  const maxAnn = Math.max(...annuals.map((a) => a.total_mm));
  const rangeAnn = maxAnn - minAnn || 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={`${totalAvg.toFixed(0)} mm`}
          label="Chuva media anual (GPM)"
          sub="Media de 28 anos de satelite"
        />
        <StatCard
          value={`${last5[last5.length - 1]?.total_mm.toFixed(0)} mm`}
          label={`Ultimo ano completo (${last5[last5.length - 1]?.year})`}
          sub={last5[last5.length - 1]?.total_mm > totalAvg ? "Acima da media" : "Abaixo da media"}
        />
        <StatCard
          value={`${annuals.length}`}
          label="Anos medidos pelo GPM"
          sub="Satelite IMERG V07 (1998-2025)"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Chuva media mensal (GPM satelite, 1998-2025)
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {clim.map((m, i) => {
              const pct = (m.avg_precip_mm / maxMonth) * 100;
              const color = m.avg_precip_mm > 200 ? "#1e40af" : m.avg_precip_mm > 160 ? "#1E88E5" : "#42A5F5";
              return (
                <div key={m.month} className="group relative flex flex-1 flex-col items-center" style={{ height: "100%" }}>
                  <div className="relative flex-1 w-full flex items-end justify-center">
                    <div
                      className="w-full max-w-8 rounded-t-sm transition-opacity group-hover:opacity-80"
                      style={{ height: `${pct}%`, backgroundColor: color }}
                    />
                    <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                      {m.avg_precip_mm.toFixed(0)} mm
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] text-text-dim">{MONTH_NAMES[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Chuva total por ano (GPM satelite)
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4 overflow-x-auto">
          <div className="flex items-end gap-[2px]" style={{ height: 160, minWidth: annuals.length * 14 }}>
            {annuals.map((a) => {
              const pct = ((a.total_mm - minAnn) / rangeAnn) * 85 + 10;
              const color = a.total_mm > 2000 ? "#1e40af" : a.total_mm > 1600 ? "#1E88E5" : a.total_mm > 1200 ? "#f59e0b" : "#ef4444";
              return (
                <div key={a.year} className="group relative flex-1" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-sm transition-opacity group-hover:opacity-80"
                    style={{ height: `${pct}%`, backgroundColor: color }}
                  />
                  <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                    {a.year}: {a.total_mm.toFixed(0)} mm
                  </div>
                  {a.year % 5 === 0 && (
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-text-dim">{a.year}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-text-dim border-t border-border pt-3">
        Fonte: {gpm.source} | {gpm.period} | Unidade: {gpm.unit_monthly}
      </p>
    </div>
  );
}

function ETSection() {
  const et = evapotranspiration.evapotranspiration_monthly;
  const land = evapotranspiration.land_evaporation_monthly;
  const trend = evapotranspiration.et_yearly_trend;
  const maxET = Math.max(...et.map((m) => m.value));
  const minTrend = Math.min(...trend.map((t) => t.avg));
  const maxTrend = Math.max(...trend.map((t) => t.avg));
  const rangeTrend = maxTrend - minTrend || 0.1;

  const annualAvg = et.reduce((s, m) => s + m.value, 0) / 12;
  const summerAvg = [et[0], et[1], et[11]].reduce((s, m) => s + m.value, 0) / 3;
  const winterAvg = [et[5], et[6], et[7]].reduce((s, m) => s + m.value, 0) / 3;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={`${annualAvg.toFixed(1)} mm/dia`}
          label="ET media anual"
          sub="Evapotranspiracao total"
        />
        <StatCard
          value={`${summerAvg.toFixed(1)} mm/dia`}
          label="ET verao (Dez-Fev)"
          sub="Demanda maxima de agua"
        />
        <StatCard
          value={`${winterAvg.toFixed(1)} mm/dia`}
          label="ET inverno (Jun-Ago)"
          sub="Demanda minima"
        />
      </div>

      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
        <p className="text-xs font-medium tracking-wider text-accent uppercase">
          Por que isso importa
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          A evapotranspiracao mostra quanta agua a planta e o solo perdem por dia.
          No verao, Cruz Alta perde <strong>{summerAvg.toFixed(1)} mm/dia</strong> — se nao chover
          por 10 dias, sao {(summerAvg * 10).toFixed(0)} mm de deficit. Cobertura morta (palha) reduz
          a evaporacao do solo em 30-50%, mantendo mais agua pra raiz da soja.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Evapotranspiracao mensal (media 1981-2025)
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {et.map((m, i) => {
              const pct = (m.value / maxET) * 100;
              return (
                <div key={m.month} className="group relative flex flex-1 flex-col items-center" style={{ height: "100%" }}>
                  <div className="relative flex-1 w-full flex items-end justify-center">
                    <div className="flex gap-0.5 items-end w-full max-w-8">
                      <div
                        className="flex-1 rounded-t-sm bg-orange-500 transition-opacity group-hover:opacity-80"
                        style={{ height: `${pct}%` }}
                        title={`ET: ${m.value.toFixed(1)} mm/dia`}
                      />
                      <div
                        className="flex-1 rounded-t-sm bg-emerald-500 transition-opacity group-hover:opacity-80"
                        style={{ height: `${(land[i].value / maxET) * 100}%` }}
                        title={`Solo: ${land[i].value.toFixed(1)} mm/dia`}
                      />
                    </div>
                    <div className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                      <p>ET total: {m.value.toFixed(2)} mm/dia</p>
                      <p>Solo: {land[i].value.toFixed(2)} mm/dia</p>
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] text-text-dim">{MONTH_NAMES[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-500" /> Evapotranspiracao total
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Evaporacao do solo
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Tendencia anual da ET
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4 overflow-x-auto">
          <div className="flex items-end gap-[2px]" style={{ height: 140, minWidth: trend.length * 12 }}>
            {trend.map((t) => {
              const pct = ((t.avg - minTrend) / rangeTrend) * 80 + 10;
              return (
                <div key={t.year} className="group relative flex-1" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-sm bg-orange-500 transition-opacity group-hover:opacity-80"
                    style={{ height: `${pct}%` }}
                  />
                  <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                    {t.year}: {t.avg.toFixed(2)} mm/dia
                  </div>
                  {t.year % 5 === 0 && (
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-text-dim">{t.year}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-text-dim border-t border-border pt-3">
        Fonte: {evapotranspiration.source} | {evapotranspiration.period} | Unidade: {evapotranspiration.unit}
      </p>
    </div>
  );
}

function ClimaExtSection() {
  const params = climateExt.parameters;
  const items = [
    { key: "solar_radiation" as const, color: "#F9A825", label: "Radiacao Solar" },
    { key: "temperature" as const, color: "#E65100", label: "Temperatura Media" },
    { key: "relative_humidity" as const, color: "#1E88E5", label: "Umidade Relativa" },
    { key: "wind_speed_2m" as const, color: "#6B7280", label: "Velocidade do Vento" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const p = params[item.key];
          const maxVal = Math.max(...p.monthly.map((m) => m.value));
          return (
            <div key={item.key} className="rounded-lg border border-border bg-bg-surface p-4">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">{item.label}</h3>
                <span className="text-xs text-text-dim">{p.unit}</span>
              </div>
              <div className="flex items-end gap-1.5" style={{ height: 100 }}>
                {p.monthly.map((m, i) => {
                  const pct = (m.value / maxVal) * 100;
                  return (
                    <div key={m.month} className="group relative flex flex-1 flex-col items-center" style={{ height: "100%" }}>
                      <div className="relative flex-1 w-full flex items-end justify-center">
                        <div
                          className="w-full max-w-6 rounded-t-sm transition-opacity group-hover:opacity-80"
                          style={{ height: `${pct}%`, backgroundColor: item.color }}
                        />
                        <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                          {m.value.toFixed(1)} {p.unit}
                        </div>
                      </div>
                      <span className="mt-0.5 text-[8px] text-text-dim">{MONTH_NAMES[i]}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-text-muted">{p.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-xs font-medium tracking-wider text-primary-light uppercase">
          Resumo climatico completo
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Radiacao solar:</strong> Pico em janeiro
            ({params.solar_radiation.monthly[0].value.toFixed(1)} {params.solar_radiation.unit}),
            minimo em junho ({params.solar_radiation.monthly[5].value.toFixed(1)}).
            Alta radiacao no verao acelera evapotranspiracao.
          </p>
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Umidade relativa:</strong> Fica entre{" "}
            {Math.min(...params.relative_humidity.monthly.map((m) => m.value)).toFixed(0)}% e{" "}
            {Math.max(...params.relative_humidity.monthly.map((m) => m.value)).toFixed(0)}%.
            Umidade baixa + vento = mais perda de agua.
          </p>
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Vento:</strong> Media de{" "}
            {(params.wind_speed_2m.monthly.reduce((s, m) => s + m.value, 0) / 12).toFixed(1)} m/s.
            Ventos mais fortes em setembro-outubro, quando o solo pode estar exposto.
          </p>
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Temperatura:</strong> Media anual de{" "}
            {(params.temperature.monthly.reduce((s, m) => s + m.value, 0) / 12).toFixed(1)} graus.
            Janeiro mais quente ({params.temperature.monthly[0].value.toFixed(1)} graus), julho mais frio
            ({params.temperature.monthly[6].value.toFixed(1)} graus).
          </p>
        </div>
      </div>

      <p className="text-[10px] text-text-dim border-t border-border pt-3">
        Fonte: {climateExt.source} | {climateExt.period}
      </p>
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
        {activeTab === "satelite" && <SateliteTab />}
        {activeTab === "solo" && <SoloTab />}
        {activeTab === "vegetacao" && <VegetacaoTab />}
        {activeTab === "uso-do-solo" && <UsoDoSoloTab />}

      </div>
    </div>
  );
}

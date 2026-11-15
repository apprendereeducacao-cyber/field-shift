"use client";

import { useState } from "react";
import type {
  SiteData,
  TimelineData,
  SoilData,
  TopographyData,
  SoilMoistureData,
  NdviData,
  MapBiomasData,
  EvapotranspirationData,
  SmapData,
  GpmData,
  GraceData,
  ClimateExtData,
  LstData,
  TimelineYear,
  MonthlyNormal,
} from "@/lib/types";

type Props = {
  site: SiteData;
  timeline: TimelineData;
  soil: SoilData;
  topography: TopographyData;
  soilMoisture: SoilMoistureData;
  ndvi: NdviData;
  mapbiomas: MapBiomasData;
  evapotranspiration: EvapotranspirationData;
  smap: SmapData;
  gpm: GpmData;
  grace: GraceData;
  climateExt: ClimateExtData;
  lst: LstData | null;
  monthNames: string[];
  keyFindings: Record<string, any>;
};

export default function DadosClient({
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
  lst,
  monthNames: MONTH_NAMES,
  keyFindings: KEY_FINDINGS,
}: Props) {

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

type TabKey = "clima" | "historico" | "solo" | "vegetacao" | "uso-do-solo" | "satelite" | "glossario";

const TABS: { key: TabKey; label: string }[] = [
  { key: "clima", label: "Riscos Climaticos" },
  { key: "historico", label: "Historico 44 anos" },
  { key: "satelite", label: "Satelite NASA" },
  { key: "solo", label: "Solo e Terreno" },
  { key: "vegetacao", label: "NDVI" },
  { key: "uso-do-solo", label: "Uso do Solo" },
  { key: "glossario", label: "Entenda os Termos" },
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
  const maxEvi = Math.max(...ndvi.monthly_averages.map((m) => m.avg_evi));
  const maxAnnual = Math.max(...ndvi.annual_averages.map((a) => a.avg_ndvi));
  const minAnnual = Math.min(...ndvi.annual_averages.map((a) => a.avg_ndvi));
  const annualRange = maxAnnual - minAnnual || 0.01;
  const gsData = ndvi.annual_averages.filter((a) => a.growing_season_ndvi != null);
  const maxGs = gsData.length > 0 ? Math.max(...gsData.map((a) => a.growing_season_ndvi!)) : 1;
  const minGs = gsData.length > 0 ? Math.min(...gsData.map((a) => a.growing_season_ndvi!)) : 0;
  const gsRange = maxGs - minGs || 0.01;

  const [subTab, setSubTab] = useState<"ndvi" | "evi" | "safra">("ndvi");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-dim uppercase">NDVI medio</p>
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
          <p className="text-xs text-text-dim uppercase">EVI medio mensal</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {(ndvi.monthly_averages.reduce((s, m) => s + m.avg_evi, 0) / 12).toFixed(2)}
          </p>
          <p className="text-xs text-text-muted">Enhanced Vegetation Index</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-dim uppercase">Observacoes</p>
          <p className="mt-1 text-2xl font-bold text-text-secondary">
            {s.n_good_quality.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-text-muted">Com qualidade boa</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          { key: "ndvi" as const, label: "NDVI Mensal + Anual" },
          { key: "evi" as const, label: "EVI (Enhanced)" },
          { key: "safra" as const, label: "NDVI da Safra" },
        ]).map((t) => (
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

      {subTab === "ndvi" && (
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              NDVI medio por mes
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
              Evolucao anual do NDVI
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
      )}

      {subTab === "evi" && (
        <div className="space-y-8">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <p className="text-xs font-medium tracking-wider text-emerald-600 uppercase">
              O que e o EVI
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              O EVI (Enhanced Vegetation Index) e uma versao melhorada do NDVI. Corrige
              distorcoes causadas pela atmosfera e pelo brilho do solo exposto. Em regioes
              com vegetacao densa, o EVI continua subindo enquanto o NDVI ja satura (para de
              diferenciar). Valores tipicos: 0.2-0.5 para lavouras, 0.5+ para vegetacao muito densa.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              EVI medio por mes
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
                  <div className="flex items-center gap-2">
                    <div className="h-5 flex-1 overflow-hidden rounded-full bg-bg-surface-alt">
                      <div
                        className="h-full rounded-full transition-all bg-emerald-500"
                        style={{ width: `${(m.avg_evi / (maxEvi * 1.05)) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-mono text-text-secondary">
                      {m.avg_evi.toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              NDVI vs EVI — comparacao mensal
            </h3>
            <div className="rounded-lg border border-border bg-bg-surface p-4">
              <div className="flex items-end gap-2" style={{ height: 160 }}>
                {ndvi.monthly_averages.map((m, i) => {
                  const ndviPct = (m.avg_ndvi / (maxNdvi * 1.05)) * 100;
                  const eviPct = (m.avg_evi / (maxNdvi * 1.05)) * 100;
                  return (
                    <div key={m.month} className="group relative flex flex-1 flex-col items-center" style={{ height: "100%" }}>
                      <div className="relative flex-1 w-full flex items-end justify-center">
                        <div className="flex gap-0.5 items-end w-full max-w-8">
                          <div
                            className="flex-1 rounded-t-sm bg-primary transition-opacity group-hover:opacity-80"
                            style={{ height: `${ndviPct}%` }}
                          />
                          <div
                            className="flex-1 rounded-t-sm bg-emerald-500 transition-opacity group-hover:opacity-80"
                            style={{ height: `${eviPct}%` }}
                          />
                        </div>
                        <div className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                          <p>NDVI: {m.avg_ndvi.toFixed(3)}</p>
                          <p>EVI: {m.avg_evi.toFixed(3)}</p>
                        </div>
                      </div>
                      <span className="mt-1 text-[10px] text-text-dim">{MONTH_NAMES[i]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" /> NDVI
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> EVI
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === "safra" && (
        <div className="space-y-8">
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
            <p className="text-xs font-medium tracking-wider text-accent uppercase">
              NDVI da safra (Out-Mar)
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              O NDVI medio durante os meses da safra (outubro a marco) mostra como a
              vegetacao se comportou no periodo critico. Valores altos indicam boa
              cobertura e condicoes favoraveis; valores baixos apontam estresse hidrico
              ou termico durante o desenvolvimento da soja.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              NDVI da safra por ano (Out-Mar)
            </h3>
            <div className="overflow-x-auto">
              <div
                className="flex items-end gap-[3px]"
                style={{ minWidth: "600px", height: "200px" }}
              >
                {gsData.map((a) => {
                  const val = a.growing_season_ndvi!;
                  const h = Math.round(((val - minGs) / gsRange) * 160 + 20);
                  const color = val > 0.62 ? "#2D6A4F" : val > 0.58 ? "#42A5F5" : "#f59e0b";
                  return (
                    <div
                      key={a.year}
                      className="group relative flex flex-1 flex-col items-center justify-end"
                      style={{ height: "200px" }}
                    >
                      <div className="absolute -top-6 hidden rounded bg-bg-surface-alt px-2 py-1 text-[10px] text-text-secondary shadow-lg group-hover:block">
                        {a.year}: {val.toFixed(3)}
                      </div>
                      <div
                        className="relative w-full rounded-t transition-all group-hover:opacity-80"
                        style={{ height: `${h}px`, backgroundColor: color }}
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
            <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#2D6A4F]" /> Acima de 0.62
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#42A5F5]" /> 0.58-0.62
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#f59e0b]" /> Abaixo de 0.58
              </span>
            </div>
          </div>
        </div>
      )}
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
    "grace" | "smap" | "gpm" | "et" | "lst" | "clima-ext"
  >("grace");

  const SUB_TABS = [
    { key: "grace" as const, label: "Agua Subterranea (GRACE)" },
    { key: "smap" as const, label: "Umidade Solo (SMAP)" },
    { key: "gpm" as const, label: "Chuva Satelite (GPM)" },
    { key: "et" as const, label: "Evapotranspiracao" },
    ...(lst ? [{ key: "lst" as const, label: "Temperatura Solo (LST)" }] : []),
    { key: "clima-ext" as const, label: "Clima Completo" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Dados de {lst ? 6 : 5} satelites NASA processados para Cruz Alta — agua subterranea,
        umidade do solo por microondas, chuva por radar, evapotranspiracao{lst ? ", temperatura de superficie" : ""} e
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
      {subTab === "lst" && lst && <LstSection />}
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

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Serie temporal completa ({smap.timeseries.length} meses, 2015-2025)
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4 overflow-x-auto">
          <div className="flex items-end gap-[1px]" style={{ height: 180, minWidth: smap.timeseries.length * 4 }}>
            {(() => {
              const ts = smap.timeseries;
              const maxTs = Math.max(...ts.map((t) => t.soil_moisture));
              const minTs = Math.min(...ts.map((t) => t.soil_moisture));
              const rangeTs = maxTs - minTs || 0.01;
              return ts.map((t, i) => {
                const pct = ((t.soil_moisture - minTs) / rangeTs) * 80 + 10;
                const color = t.soil_moisture > 0.30 ? "#0ea5e9" : t.soil_moisture > 0.22 ? "#f59e0b" : "#ef4444";
                const isJan = t.month === 1;
                return (
                  <div key={t.date} className="group relative flex-1" style={{ height: "100%", minWidth: 3 }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-sm transition-opacity group-hover:opacity-80"
                      style={{ height: `${pct}%`, backgroundColor: color }}
                    />
                    <div className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                      <p className="font-semibold">{t.date}</p>
                      <p>{(t.soil_moisture * 100).toFixed(1)}% ({t.n_images} imgs)</p>
                    </div>
                    {isJan && (
                      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-text-dim">{t.year}</span>
                    )}
                  </div>
                );
              });
            })()}
          </div>
          <p className="mt-5 text-xs text-text-muted">
            Cada barra = 1 mes. Passe o mouse para ver data e valor exato.
          </p>
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

      <div className="rounded-xl border-2 border-sky-500/30 bg-sky-500/5 p-5">
        <p className="text-xs font-medium tracking-wider text-sky-600 uppercase">
          Tendencia de longo prazo
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-text-secondary">
              {gpm.trend.first_half_avg_mm.toFixed(0)} mm
            </p>
            <p className="text-xs text-text-dim">Media 1a metade (1998-2011)</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2">
              <p className="text-2xl font-bold text-sky-600">+{gpm.trend.change_pct}%</p>
              <p className="text-xs text-text-dim">Aumento</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-sky-600">
              {gpm.trend.second_half_avg_mm.toFixed(0)} mm
            </p>
            <p className="text-xs text-text-dim">Media 2a metade (2012-2025)</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          A chuva media anual aumentou {gpm.trend.change_pct}% entre a primeira e a segunda metade
          do periodo medido pelo GPM. Mais chuva e bom para a soja, mas chuvas mais concentradas
          aumentam o risco de enxurrada e erosao.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Serie temporal completa ({gpm.timeseries.length} meses, 1998-2025)
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4 overflow-x-auto">
          <div className="flex items-end gap-[1px]" style={{ height: 180, minWidth: gpm.timeseries.length * 3 }}>
            {(() => {
              const ts = gpm.timeseries;
              const maxTs = Math.max(...ts.map((t) => t.precip_mm_month));
              return ts.map((t) => {
                const pct = (t.precip_mm_month / maxTs) * 100;
                const color = t.precip_mm_month > 250 ? "#1e40af" : t.precip_mm_month > 150 ? "#1E88E5" : t.precip_mm_month > 80 ? "#42A5F5" : "#93c5fd";
                const isJan = t.month === 1;
                return (
                  <div key={t.date} className="group relative flex-1" style={{ height: "100%", minWidth: 2 }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-sm transition-opacity group-hover:opacity-80"
                      style={{ height: `${Math.max(pct, 1)}%`, backgroundColor: color }}
                    />
                    <div className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                      <p className="font-semibold">{t.date}</p>
                      <p>{t.precip_mm_month.toFixed(0)} mm</p>
                    </div>
                    {isJan && t.year % 3 === 0 && (
                      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-text-dim">{t.year}</span>
                    )}
                  </div>
                );
              });
            })()}
          </div>
          <p className="mt-5 text-xs text-text-muted">
            Cada barra = 1 mes. Padrao sazonal visivel: picos no verao, vales no inverno. Passe o mouse para detalhes.
          </p>
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

function LstSection() {
  if (!lst) return null;
  const clim = lst.monthly_climatology;
  const trend = lst.yearly_trend;
  const maxDay = Math.max(...clim.filter((m) => m.avg_lst_day_c != null).map((m) => m.avg_lst_day_c!));
  const minDay = Math.min(...clim.filter((m) => m.avg_lst_day_c != null).map((m) => m.avg_lst_day_c!));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={`${lst.summary.summer_avg_day_c ?? "—"} C`}
          label="Superficie no verao (dia)"
          sub="Temperatura do solo/vegetacao, nao do ar"
        />
        <StatCard
          value={`${lst.summary.winter_avg_day_c ?? "—"} C`}
          label="Superficie no inverno (dia)"
          sub="Solo mais frio = menos evaporacao"
        />
        <StatCard
          value={`${lst.summary.amplitude_c ?? "—"} C`}
          label="Amplitude termica anual"
          sub="Diferenca verao-inverno na superficie"
        />
      </div>

      <div className="rounded-xl border-2 border-orange-500/30 bg-orange-500/5 p-5">
        <p className="text-xs font-medium tracking-wider text-orange-600 uppercase">
          Por que a temperatura do solo importa
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          A temperatura da superficie (LST) e diferente da temperatura do ar. Solo exposto no verao
          pode atingir <strong>50-60 C</strong> enquanto o ar esta a 35 C. Cobertura vegetal (palha ou
          cultura de cobertura) reduz a LST em 10-20 C, protegendo a biologia do solo e reduzindo a
          evaporacao. Esta e a principal justificativa para nunca deixar o solo nu.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Temperatura da superficie por mes (dia vs noite)
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <div className="flex items-end gap-2" style={{ height: 180 }}>
            {clim.map((m, i) => {
              const dayVal = m.avg_lst_day_c;
              const nightVal = m.avg_lst_night_c;
              if (dayVal == null) return <div key={m.month} className="flex-1" />;
              const dayPct = ((dayVal - minDay) / (maxDay - minDay || 1)) * 70 + 20;
              const nightPct = nightVal != null ? ((nightVal - minDay) / (maxDay - minDay || 1)) * 70 + 5 : 0;
              return (
                <div key={m.month} className="group relative flex flex-1 flex-col items-center" style={{ height: "100%" }}>
                  <div className="relative flex-1 w-full flex items-end justify-center">
                    <div className="flex gap-0.5 items-end w-full max-w-8">
                      <div
                        className="flex-1 rounded-t-sm bg-orange-500 transition-opacity group-hover:opacity-80"
                        style={{ height: `${dayPct}%` }}
                      />
                      <div
                        className="flex-1 rounded-t-sm bg-indigo-500 transition-opacity group-hover:opacity-80"
                        style={{ height: `${Math.max(nightPct, 2)}%` }}
                      />
                    </div>
                    <div className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                      <p>Dia: {dayVal.toFixed(1)} C</p>
                      <p>Noite: {nightVal?.toFixed(1) ?? "—"} C</p>
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] text-text-dim">{MONTH_NAMES[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-500" /> Dia (superficie)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Noite (superficie)
            </span>
          </div>
        </div>
      </div>

      {lst.trend && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-secondary">{lst.trend.first_half_avg_c} C</p>
              <p className="text-xs text-text-dim">1a metade</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2">
                <p className="text-2xl font-bold text-orange-600">{lst.trend.change_c > 0 ? "+" : ""}{lst.trend.change_c} C</p>
                <p className="text-xs text-text-dim">{lst.trend.direction}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{lst.trend.second_half_avg_c} C</p>
              <p className="text-xs text-text-dim">2a metade</p>
            </div>
          </div>
        </div>
      )}

      {trend.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Tendencia anual da LST diurna ({trend[0].year}-{trend[trend.length - 1].year})
          </h3>
          <div className="rounded-lg border border-border bg-bg-surface p-4 overflow-x-auto">
            {(() => {
              const minT = Math.min(...trend.map((t) => t.avg_lst_day_c));
              const maxT = Math.max(...trend.map((t) => t.avg_lst_day_c));
              const rangeT = maxT - minT || 1;
              return (
                <div className="flex items-end gap-[2px]" style={{ height: 160, minWidth: trend.length * 16 }}>
                  {trend.map((t) => {
                    const pct = ((t.avg_lst_day_c - minT) / rangeT) * 80 + 10;
                    return (
                      <div key={t.year} className="group relative flex-1" style={{ height: "100%" }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t-sm bg-orange-500 transition-opacity group-hover:opacity-80"
                          style={{ height: `${pct}%` }}
                        />
                        <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded border border-border bg-bg-base px-2 py-1 text-xs shadow-lg">
                          {t.year}: {t.avg_lst_day_c} C
                        </div>
                        {t.year % 4 === 0 && (
                          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-text-dim">{t.year}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <p className="text-[10px] text-text-dim border-t border-border pt-3">
        Fonte: {lst.source} | {lst.period} | Resolucao: {lst.resolution}
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

// ── TAB: Glossario — Entenda os Termos ──────────────────

type GlossaryEntry = {
  term: string;
  simple: string;
  detail: string;
  example: string;
  where: string;
};

const GLOSSARY_SECTIONS: {
  title: string;
  color: string;
  entries: GlossaryEntry[];
}[] = [
  {
    title: "Agua e Chuva",
    color: "#1E88E5",
    entries: [
      {
        term: "Evapotranspiracao",
        simple:
          "A quantidade de agua que a planta e o solo perdem juntos para o ar.",
        detail:
          "E a soma de duas coisas: a agua que evapora direto do solo (como uma poca secando ao sol) mais a agua que a planta puxa pelas raizes e solta pelas folhas (transpiracao). Quando a evapotranspiracao e alta, a lavoura precisa de mais chuva ou irrigacao para nao secar.",
        example:
          "No verao de Cruz Alta, a planta e o solo perdem cerca de 4mm de agua por dia. Se nao chover pelo menos isso, a soja comeca a sofrer.",
        where: "Aba Satelite NASA > Evapotranspiracao",
      },
      {
        term: "Balanco hidrico",
        simple:
          "A conta de quanta agua entra (chuva) e quanta sai (evapotranspiracao).",
        detail:
          "Se chove 100mm no mes e a planta + solo perdem 95mm, o saldo e de apenas 5mm — quase no zero. Quando o saldo fica negativo por muitos dias seguidos, a planta entra em estresse hidrico. E como a conta bancaria da agua: se gasta mais do que entra, da problema.",
        example:
          "Na safra de soja (outubro a marco) em Cruz Alta, o balanco hidrico acumula apenas +38mm em 6 meses — muito apertado para uma cultura que precisa de 450-800mm.",
        where: "Aba Satelite NASA > Evapotranspiracao e Chuva Satelite",
      },
      {
        term: "Precipitacao por satelite (GPM)",
        simple:
          "Medicao de chuva feita por radar no espaco, sem depender de estacoes no chao.",
        detail:
          "O satelite GPM usa radar e microondas para medir quanta chuva esta caindo em qualquer ponto da Terra. A vantagem e que cobre areas onde nao existem pluviometros. A resolucao e de 10km — cada ponto representa um quadrado de 10x10km.",
        example:
          "Em Cruz Alta, o GPM mostra uma media de 1.740mm de chuva por ano, bem proximo do que a estacao do INMET registra no chao.",
        where: "Aba Satelite NASA > Chuva Satelite (GPM)",
      },
    ],
  },
  {
    title: "Solo e Umidade",
    color: "#8B5E3C",
    entries: [
      {
        term: "Umidade do solo (SMAP)",
        simple: "Quanta agua tem na camada superficial do solo, medido por satelite.",
        detail:
          "O satelite SMAP usa microondas para 'enxergar' a quantidade de agua nos primeiros centimetros do solo. Ele mede em cm3 de agua por cm3 de solo — se der 0.30, significa que 30% daquele pedaco de terra e agua. Quanto mais alta a umidade, melhor para a planta nascer e crescer.",
        example:
          "Em Cruz Alta, a umidade do solo fica acima de 28% no inverno (solo encharcado) e cai para menos de 22% em janeiro-fevereiro (solo mais seco, justamente quando a soja mais precisa de agua).",
        where: "Aba Satelite NASA > Umidade Solo (SMAP)",
      },
      {
        term: "Anomalia de umidade do solo",
        simple:
          "Quanto a umidade esta acima ou abaixo do normal para aquela epoca do ano.",
        detail:
          "Se em janeiro o normal e 24% de umidade e estamos com 18%, a anomalia e negativa (-6 pontos). Anomalias negativas no verao sao um sinal de alerta: o solo esta mais seco do que deveria, e a soja pode sofrer. Ja anomalias positivas significam solo mais umido que o habitual.",
        example:
          "Na seca de 2022 (La Nina forte), a anomalia de umidade chegou a -8 pontos em janeiro — o solo estava muito mais seco que o normal, e a produtividade caiu para 22 sc/ha.",
        where: "Aba Satelite NASA > Umidade Solo (SMAP)",
      },
      {
        term: "Agua subterranea (GRACE)",
        simple:
          "Quanta agua esta guardada no subsolo — nos lencois freaticos e aquiferos.",
        detail:
          "O satelite GRACE mede a variacao de gravidade da Terra para detectar mudancas na quantidade total de agua armazenada (chuva acumulada, rios, lencois freaticos). Quando o valor sobe, a regiao esta acumulando agua. Quando cai, esta perdendo. Mede em centimetros equivalentes de agua.",
        example:
          "Em Cruz Alta, o GRACE mostra que entre 2002 e 2024, a regiao ganhou +3.7cm de agua subterranea — sinal positivo de que os aquiferos estao se recarregando.",
        where: "Aba Satelite NASA > Agua Subterranea (GRACE)",
      },
    ],
  },
  {
    title: "Vegetacao e Saude da Planta",
    color: "#2D6A4F",
    entries: [
      {
        term: "NDVI (Indice de Vegetacao)",
        simple:
          "Um numero que mostra se a planta esta verde e saudavel ou amarelada e sofrendo.",
        detail:
          "O NDVI varia de -1 a +1. Plantas verdes e saudaveis refletem muita luz infravermelha e pouca luz vermelha, o que da um NDVI alto (acima de 0.6). Solo nu, agua ou planta morta dao NDVI baixo (abaixo de 0.3). E como um 'exame de sangue' da lavoura visto do espaco — quanto mais alto, mais saudavel a planta.",
        example:
          "O NDVI medio de Cruz Alta na safra e de 0.56. Nos piores anos (como 2020, com 82 dias quentes), caiu para 0.51 — a planta estava sofrendo com o calor.",
        where: "Aba NDVI",
      },
      {
        term: "Estresse da vegetacao",
        simple: "Quando a planta esta sofrendo por falta de agua, calor demais ou solo pobre.",
        detail:
          "A planta mostra estresse quando nao consegue fazer fotossintese normalmente. Isso aparece no NDVI mais baixo, nas folhas enrolando, e na producao caindo. Os maiores causadores em Cruz Alta sao: falta de chuva no verao, calor acima de 35C e solo compactado que nao deixa a raiz crescer.",
        example:
          "Quando o NDVI cai abaixo de 0.52 na safra, historicamente a produtividade da soja fica abaixo de 35 sc/ha.",
        where: "Aba NDVI",
      },
    ],
  },
  {
    title: "Clima e Riscos",
    color: "#E65100",
    entries: [
      {
        term: "Risco de geada",
        simple:
          "A chance de a temperatura cair abaixo de 2C e queimar a planta.",
        detail:
          "Geada acontece quando a temperatura no nivel do solo cai perto de 0C. A planta congela, as celulas estouram e ela morre ou perde folhas. Em Cruz Alta, geada e muito comum em junho, julho e agosto — por isso a soja e plantada so em outubro, quando o risco praticamente zera.",
        example:
          "Em Cruz Alta, julho tem geada em 76% dos anos e agosto em 80%. A partir de outubro, o risco cai para menos de 5%.",
        where: "Aba Riscos Climaticos",
      },
      {
        term: "Dias quentes (acima de 35C)",
        simple: "Quantos dias no ano a temperatura passou de 35C.",
        detail:
          "A soja sofre muito quando a temperatura passa de 35C. O polen morre, a flor cai e os graos nao se formam direito. Quanto mais dias quentes, pior para a produtividade. E um dos maiores inimigos da safra em Cruz Alta, e esta piorando: eram 26 dias/ano nos anos 80 e agora sao 37.",
        example:
          "Nos anos com mais de 50 dias quentes, a produtividade media da soja caiu para 28 sc/ha — contra 45 sc/ha nos anos com menos de 25 dias quentes.",
        where: "Aba Historico 44 anos e Painel de Decisao",
      },
      {
        term: "El Nino e La Nina (ENSO)",
        simple:
          "Padroes de aquecimento e resfriamento do oceano Pacifico que mudam o clima do RS.",
        detail:
          "El Nino aquece o Pacifico e traz mais chuva para o sul do Brasil — geralmente bom para a soja. La Nina resfria o Pacifico e traz menos chuva — perigo de seca. Esses ciclos duram de 1 a 2 anos e sao o maior fator de previsibilidade da safra. Quando aparece La Nina no painel, e hora de redobrar a atencao.",
        example:
          "Em anos de La Nina, a produtividade media em Cruz Alta cai para 36 sc/ha. Em El Nino, sobe para 46 sc/ha. Uma diferenca de 10 sacas por hectare.",
        where: "Aba Historico 44 anos e Painel de Decisao",
      },
    ],
  },
];

function GlossarioTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-text-secondary">
          Termos cientificos explicados de forma simples. Clique em qualquer
          termo para ver a explicacao completa com exemplos de Cruz Alta.
        </p>
      </div>

      {GLOSSARY_SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: section.color }}
            />
            <h3 className="text-sm font-semibold text-text-primary">
              {section.title}
            </h3>
          </div>

          <div className="space-y-2">
            {section.entries.map((entry) => {
              const isOpen = expanded === entry.term;
              return (
                <div
                  key={entry.term}
                  className="rounded-xl border border-border bg-bg-surface overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpanded(isOpen ? null : entry.term)
                    }
                    className="flex w-full items-start gap-3 p-4 text-left"
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: section.color }}
                    >
                      {isOpen ? "-" : "+"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">
                        {entry.term}
                      </p>
                      <p className="mt-0.5 text-sm text-text-secondary">
                        {entry.simple}
                      </p>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border bg-bg-base px-4 pb-4 pt-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-text-dim uppercase tracking-wider">
                          Como funciona
                        </p>
                        <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                          {entry.detail}
                        </p>
                      </div>
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs font-medium text-primary-light uppercase tracking-wider">
                          Exemplo em Cruz Alta
                        </p>
                        <p className="mt-1 text-sm text-text-primary leading-relaxed">
                          {entry.example}
                        </p>
                      </div>
                      <p className="text-[11px] text-text-dim">
                        Veja os dados: {entry.where}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Satelite vs Solo ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">
            Satelite vs Medicao no Chao — qual e melhor?
          </h3>
        </div>

        <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Nenhum dos dois e perfeito sozinho. A estacao meteorologica (INMET)
            mede com precisao, mas so enxerga o ponto onde esta instalada. O
            satelite enxerga a regiao inteira, mas de longe — como olhar a
            lavoura do aviao em vez de pisar no barro. Quando juntamos os dois,
            a foto fica mais completa.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-3 text-left text-xs font-medium text-text-dim" />
                  <th className="py-2 px-3 text-left text-xs font-medium text-text-dim">
                    Estacao no chao
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-text-dim">
                    Satelite
                  </th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-text-primary">
                    Area coberta
                  </td>
                  <td className="py-2 px-3">
                    Um ponto so (onde o aparelho esta)
                  </td>
                  <td className="py-2 px-3">
                    Quadrados de 250m a 55km, a regiao inteira
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-text-primary">
                    Precisao local
                  </td>
                  <td className="py-2 px-3">
                    Alta — mede exatamente aquele ponto
                  </td>
                  <td className="py-2 px-3">
                    Media — e uma media da area toda
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-text-primary">
                    Historico
                  </td>
                  <td className="py-2 px-3">
                    INMET Cruz Alta: desde 2007 (18 anos)
                  </td>
                  <td className="py-2 px-3">
                    POWER: 45 anos / GPM: 28 anos / GRACE: 22 anos
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-text-primary">
                    Falhas
                  </td>
                  <td className="py-2 px-3">
                    Quebra, falta manutencao, dias sem dado
                  </td>
                  <td className="py-2 px-3">
                    Nuvem atrapalha (optico), mas microondas funciona com chuva
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-text-primary">
                    O que mede
                  </td>
                  <td className="py-2 px-3">
                    Chuva, temperatura, umidade do ar
                  </td>
                  <td className="py-2 px-3">
                    Tudo isso + saude da planta, agua subterranea, uso do solo
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Validacao cruzada real */}
        <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-4">
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider">
            Como conferimos — validacao cruzada em Cruz Alta
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            Comparamos os dados do satelite com os da estacao do INMET em Cruz
            Alta para verificar se batem. Quanto mais proximo de 1.0 a
            correlacao, mais os dois concordam.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-bg-base p-3 text-center">
              <p className="text-xs text-text-dim">
                POWER vs INMET (chuva safra)
              </p>
              <p className="text-2xl font-bold text-emerald-600">0.886</p>
              <p className="text-xs text-text-muted">
                Correlacao alta — confiavel
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-bg-surface-alt overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: "88.6%" }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-bg-base p-3 text-center">
              <p className="text-xs text-text-dim">
                Vies do modelo POWER
              </p>
              <p className="text-2xl font-bold text-emerald-600">+1.8%</p>
              <p className="text-xs text-text-muted">
                Quase igual a estacao
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-bg-surface-alt overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: "98.2%" }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-bg-base p-3 text-center">
              <p className="text-xs text-text-dim">
                GPM vs POWER (chuva anual)
              </p>
              <p className="text-2xl font-bold text-amber-600">+13.6%</p>
              <p className="text-xs text-text-muted">
                GPM mede um pouco mais — normal
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-bg-surface-alt overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: "86.4%" }}
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">
            O modelo NASA POWER e a estacao do INMET concordam em 88.6% nas
            chuvas da safra, com apenas 1.8% de diferenca. Ja o satelite GPM
            registra 13.6% a mais de chuva que o POWER — isso acontece porque o
            radar no espaco capta chuvas leves que o modelo de chao pode
            subestimar. Nenhuma fonte mente; cada uma ve a chuva de um angulo
            diferente.
          </p>
        </div>

        {/* Resolucao dos satelites */}
        <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-3">
          <p className="text-xs font-medium text-text-dim uppercase tracking-wider">
            Resolucao — o tamanho do pixel de cada satelite
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            Cada satelite tem um &quot;tamanho de quadradinho&quot; diferente.
            Quanto menor o quadrado, mais detalhe ele enxerga. Para comparar:
            uma propriedade pequena em Cruz Alta tem cerca de 50 hectares (700m
            x 700m).
          </p>

          <div className="space-y-2">
            {[
              {
                name: "Sentinel-2 (NDVI)",
                res: "10m",
                note: "Enxerga detalhes de 0,01 ha — resolucao por talhao",
                pct: 100,
                color: "#2D6A4F",
              },
              {
                name: "SMAP (umidade solo)",
                res: "9 km",
                note: "Quadrado de 8.100 ha — media da vizinhanca",
                pct: 55,
                color: "#1E88E5",
              },
              {
                name: "GPM (chuva)",
                res: "10 km",
                note: "Quadrado de 10.000 ha — media regional",
                pct: 50,
                color: "#7CB342",
              },
              {
                name: "POWER (clima)",
                res: "~55 km",
                note: "Quadrado de ~300.000 ha — media do municipio inteiro",
                pct: 15,
                color: "#F9A825",
              },
              {
                name: "GRACE (agua subterranea)",
                res: "~300 km",
                note: "Quadrado enorme — tendencia regional de longo prazo",
                pct: 5,
                color: "#8B5E3C",
              },
            ].map((sat) => (
              <div
                key={sat.name}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-bg-base p-2.5"
              >
                <div className="w-28 shrink-0">
                  <p className="text-xs font-semibold text-text-primary">
                    {sat.name}
                  </p>
                  <p className="text-[11px] font-bold" style={{ color: sat.color }}>
                    {sat.res}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-bg-surface-alt overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${sat.pct}%`,
                        backgroundColor: sat.color,
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {sat.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-dim">
            Barra maior = mais detalhe espacial. Satelites com pixel grande
            compensam com historico longo e cobertura continua.
          </p>
        </div>

        {/* Por que combinar */}
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-5 space-y-3">
          <p className="text-xs font-medium text-primary-light uppercase tracking-wider">
            Por que o Field Shift combina os dois
          </p>
          <div className="space-y-2 text-sm text-text-secondary leading-relaxed">
            <p>
              A estacao do INMET em Cruz Alta so existe desde 2007. Para
              entender padroes de clima que levam decadas para aparecer (como o
              aumento de dias quentes), precisamos dos 45 anos do NASA POWER.
            </p>
            <p>
              Ao mesmo tempo, o POWER nao enxerga a saude da planta, o uso real
              do solo nem a agua subterranea. Ai entram Sentinel-2 (NDVI), MapBiomas
              e GRACE — dados que so existem por satelite.
            </p>
            <p>
              A combinacao funciona assim: usamos a estacao do INMET como
              referencia de verdade (r=0.886 com o POWER), e a partir dessa
              confianca, estendemos a analise com satelites que cobrem o que a
              estacao nao alcanca — 14 fontes de dados no total, cada uma
              complementando a outra.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-surface p-4">
        <p className="text-xs font-medium text-text-dim uppercase tracking-wider">
          Dica
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Estes termos aparecem nos graficos e tabelas das outras abas. Quando
          tiver duvida sobre algum numero, volte aqui para relembrar o que ele
          significa na pratica para a sua lavoura.
        </p>
      </div>
    </div>
  );
}

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
        {activeTab === "glossario" && <GlossarioTab />}

      </div>
    </div>
  );
}

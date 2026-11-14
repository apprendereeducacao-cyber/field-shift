"use client";

import { useState } from "react";
import {
  timeline,
  soilMoisture,
  MONTH_NAMES,
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
  el_nino_forte: "El Nino Forte",
  el_nino_moderado: "El Nino Moderado",
  el_nino_fraco: "El Nino Fraco",
  la_nina_forte: "La Nina Forte",
  la_nina_moderado: "La Nina Moderado",
  la_nina_fraco: "La Nina Fraco",
  neutro: "Neutro",
};

type TabKey =
  | "temperatura"
  | "chuva"
  | "produtividade"
  | "umidade"
  | "enso"
  | "mensal";

const TABS: { key: TabKey; label: string }[] = [
  { key: "temperatura", label: "Temperatura" },
  { key: "chuva", label: "Chuva" },
  { key: "produtividade", label: "Produtividade" },
  { key: "umidade", label: "Umidade do Solo" },
  { key: "enso", label: "El Nino / La Nina" },
  { key: "mensal", label: "Medias Mensais" },
];

const years = timeline.timeline;
const normals = timeline.monthly_normals;
const ensoImpact = timeline.enso_impact;

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
          Media: {avg.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="relative overflow-x-auto rounded-lg border border-border bg-bg-surface p-4">
        <div className="relative" style={{ minWidth: data.length * 14 }}>
          <div
            className="absolute left-0 right-0 border-t border-dashed border-text-dim/30"
            style={{
              bottom: `${((avg - min) / range) * 100}%`,
            }}
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
                      <p style={{ color }}>{ENSO_LABELS[d.enso]}</p>
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
              ) : null
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

function TemperaturaTab() {
  const recent10 = years.slice(-10);
  const all = years.filter((y) => y.avg_temp_c !== null);
  const avgAll =
    all.reduce((s, y) => s + (y.avg_temp_c ?? 0), 0) / all.length;
  const avgRecent =
    recent10.reduce((s, y) => s + (y.avg_temp_c ?? 0), 0) / recent10.length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={`${avgAll.toFixed(1)} graus`}
          label="Temperatura media (44 anos)"
        />
        <StatCard
          value={`${avgRecent.toFixed(1)} graus`}
          label="Media nos ultimos 10 anos"
          sub={
            avgRecent > avgAll
              ? `${(avgRecent - avgAll).toFixed(1)} graus mais quente`
              : undefined
          }
        />
        <StatCard
          value={`${years[years.length - 1].hot_days} dias`}
          label="Dias acima de 32 graus em 2025"
        />
      </div>
      <BarChart
        data={years}
        getValue={(d) => d.avg_temp_c}
        getColor={(d) => {
          const v = d.avg_temp_c ?? 19.5;
          return v > 20 ? "#E65100" : v > 19 ? "#FF8F00" : "#42A5F5";
        }}
        unit=" graus"
        label="Temperatura media anual (1981-2025)"
      />
      <BarChart
        data={years}
        getValue={(d) => d.hot_days}
        getColor={() => "#E53935"}
        unit=" dias"
        label="Dias com mais de 32 graus por ano"
        minVal={0}
      />
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary">
          O que isso significa pro produtor
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          A temperatura media subiu {(avgRecent - avgAll).toFixed(1)} graus nos
          ultimos 10 anos comparado com a media historica. Mais calor no verao
          significa que a soja sofre mais estresse no florescimento — e ai
          produz menos grao. Nos anos com muitos dias acima de 32 graus, a
          produtividade cai visivelmente.
        </p>
      </div>
    </div>
  );
}

function ChuvaTab() {
  const withSeason = years.filter((y) => y.season_rain_mm !== null);
  const avgAnnual =
    years.reduce((s, y) => s + y.annual_rain_mm, 0) / years.length;
  const avgSeason =
    withSeason.reduce((s, y) => s + (y.season_rain_mm ?? 0), 0) /
    withSeason.length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={`${Math.round(avgAnnual)} mm`}
          label="Chuva media por ano"
        />
        <StatCard
          value={`${Math.round(avgSeason)} mm`}
          label="Chuva na safra (nov-mar)"
          sub="Periodo critico da soja"
        />
        <StatCard
          value={`${Math.round(
            Math.min(...years.map((y) => y.annual_rain_mm))
          )} mm`}
          label="Ano mais seco"
          sub={`${
            years.find(
              (y) =>
                y.annual_rain_mm ===
                Math.min(...years.map((y) => y.annual_rain_mm))
            )?.year
          }`}
        />
      </div>
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
        data={withSeason}
        getValue={(d) => d.season_rain_mm}
        getColor={(d) => ENSO_COLORS[d.enso]}
        unit=" mm"
        label="Chuva na safra (nov-mar) — cor por El Nino/La Nina"
      />
      <EnsoLegend />
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary">
          O que isso significa pro produtor
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          Cruz Alta recebe em media {Math.round(avgAnnual)} mm de chuva por
          ano — o suficiente para soja. Mas o que importa e quanto chove entre
          novembro e marco (a safra). Nos anos de El Nino, a chuva na safra e
          maior ({ensoImpact.el_nino.avg_season_rain_mm} mm). Nos de La Nina,
          cai para {ensoImpact.la_nina.avg_season_rain_mm} mm — e a
          produtividade sofre.
        </p>
      </div>
    </div>
  );
}

function ProdutividadeTab() {
  const withYield = years.filter((y) => y.yield_sc_ha !== null);
  const first = withYield.slice(0, Math.ceil(withYield.length / 2));
  const second = withYield.slice(Math.ceil(withYield.length / 2));
  const avgFirst =
    first.reduce((s, y) => s + (y.yield_sc_ha ?? 0), 0) / first.length;
  const avgSecond =
    second.reduce((s, y) => s + (y.yield_sc_ha ?? 0), 0) / second.length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={`${avgFirst.toFixed(1)} sc/ha`}
          label={`Media 1a metade (${first[0].year}-${first[first.length - 1].year})`}
        />
        <StatCard
          value={`${avgSecond.toFixed(1)} sc/ha`}
          label={`Media 2a metade (${second[0].year}-${second[second.length - 1].year})`}
          sub={`+${(avgSecond - avgFirst).toFixed(1)} sc/ha (tecnologia)`}
        />
        <StatCard
          value={`${
            withYield.reduce(
              (best, y) =>
                (y.yield_sc_ha ?? 0) > (best.yield_sc_ha ?? 0) ? y : best,
              withYield[0]
            ).yield_sc_ha
          } sc/ha`}
          label="Recorde de produtividade"
          sub={`${
            withYield.reduce(
              (best, y) =>
                (y.yield_sc_ha ?? 0) > (best.yield_sc_ha ?? 0) ? y : best,
              withYield[0]
            ).year
          }`}
        />
      </div>
      <BarChart
        data={withYield}
        getValue={(d) => d.yield_sc_ha}
        getColor={(d) => ENSO_COLORS[d.enso]}
        unit=" sc/ha"
        label="Produtividade da soja por ano — cor por El Nino/La Nina"
        minVal={0}
      />
      <EnsoLegend />
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary">
          O que isso significa pro produtor
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          A produtividade cresceu {(avgSecond - avgFirst).toFixed(1)} sc/ha
          entre as duas metades do periodo — efeito da tecnologia (sementes,
          manejo, maquinario). Mas mesmo com tecnologia melhor, os anos de La
          Nina ainda derrubam a producao: media de{" "}
          {ensoImpact.la_nina.avg_yield_sc_ha} sc/ha contra{" "}
          {ensoImpact.el_nino.avg_yield_sc_ha} sc/ha no El Nino. Cobrir o
          solo no inverno ajuda a guardar agua pra aguentar os anos secos.
        </p>
      </div>
    </div>
  );
}

function UmidadeTab() {
  const withMoisture = years.filter((y) => y.avg_soil_moisture !== null);
  const first = withMoisture.slice(0, Math.ceil(withMoisture.length / 2));
  const second = withMoisture.slice(Math.ceil(withMoisture.length / 2));
  const avgFirst =
    first.reduce((s, y) => s + (y.avg_soil_moisture ?? 0), 0) / first.length;
  const avgSecond =
    second.reduce((s, y) => s + (y.avg_soil_moisture ?? 0), 0) / second.length;
  const changePct = ((avgSecond - avgFirst) / avgFirst) * 100;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={`${(avgFirst * 100).toFixed(0)}%`}
          label={`Umidade 1a metade (${first[0].year}-${first[first.length - 1].year})`}
        />
        <StatCard
          value={`${(avgSecond * 100).toFixed(0)}%`}
          label={`Umidade 2a metade (${second[0].year}-${second[second.length - 1].year})`}
          sub={`${changePct.toFixed(1)}% (solo esta ficando mais seco)`}
        />
        <StatCard
          value={`${(
            Math.min(...withMoisture.map((y) => y.avg_soil_moisture!)) * 100
          ).toFixed(0)}%`}
          label="Ano mais seco do solo"
          sub={`${
            withMoisture.reduce((worst, y) =>
              (y.avg_soil_moisture ?? 1) < (worst.avg_soil_moisture ?? 1)
                ? y
                : worst
            ).year
          }`}
        />
      </div>
      <BarChart
        data={withMoisture}
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
        label="Umidade media do solo (raiz) por ano — medida por satelite NASA"
      />
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary">
          O que isso significa pro produtor
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          O solo de Cruz Alta esta perdendo umidade: caiu{" "}
          {Math.abs(changePct).toFixed(1)}% entre a primeira e a segunda metade
          do periodo. Isso e medido pelo satelite da NASA na zona das raizes.
          Solo mais seco significa que a planta sofre mais rapido quando para de
          chover. Manter cobertura vegetal no inverno (aveia, ervilhaca) ajuda a
          segurar a umidade — o solo coberto evapora menos.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Umidade mensal: raiz vs perfil completo
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            value={`${Math.abs(soilMoisture.trend.change_pct)}%`}
            label="Queda de umidade"
            sub="Tendencia nos ultimos 22 anos"
          />
          <StatCard
            value={`${(soilMoisture.monthly_averages.reduce((s, m) => s + m.root_zone, 0) / 12 * 100).toFixed(0)}%`}
            label="Media raiz (0-100cm)"
            sub="Zona onde a soja busca agua"
          />
          <StatCard
            value={`${(soilMoisture.monthly_averages.reduce((s, m) => s + m.profile, 0) / 12 * 100).toFixed(0)}%`}
            label="Media perfil completo"
            sub="Reserva profunda do solo"
          />
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <p className="mb-4 text-xs text-text-dim">
            Media mensal 1981-2025 — 0% = seco, 100% = saturado
          </p>
          <div className="flex items-end gap-1.5">
            {soilMoisture.monthly_averages.map((m) => {
              const rootH = m.root_zone * 200;
              const profH = m.profile * 200;
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5" style={{ height: 200 }}>
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
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <p className="text-sm text-text-secondary">
            A zona da raiz (0-100cm) e onde a soja busca agua. O perfil completo
            vai mais fundo. Nos ultimos 22 anos, a umidade caiu 3.7% — o solo
            esta secando aos poucos. No verao (jan-fev), a umidade da raiz cai
            pra cerca de 74%, justamente quando a soja mais precisa.
          </p>
        </div>
      </div>
    </div>
  );
}

function EnsoTab() {
  const ensoYears = years.filter((y) => y.enso !== "neutro");
  const ninoYears = years.filter((y) => y.enso.startsWith("el_nino"));
  const ninaYears = years.filter((y) => y.enso.startsWith("la_nina"));
  const neutroYears = years.filter((y) => y.enso === "neutro");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          value={`${ensoImpact.el_nino.avg_yield_sc_ha} sc/ha`}
          label={`El Nino (${ensoImpact.el_nino.n_safras} safras)`}
          sub={`${ensoImpact.el_nino.avg_season_rain_mm} mm de chuva na safra`}
        />
        <StatCard
          value={`${ensoImpact.la_nina.avg_yield_sc_ha} sc/ha`}
          label={`La Nina (${ensoImpact.la_nina.n_safras} safras)`}
          sub={`${ensoImpact.la_nina.avg_season_rain_mm} mm de chuva na safra`}
        />
        <StatCard
          value={`${ensoImpact.neutro.avg_yield_sc_ha} sc/ha`}
          label={`Neutro (${ensoImpact.neutro.n_safras} safras)`}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-text-primary">
          Linha do tempo: cada ano e El Nino, La Nina ou Neutro
        </h3>
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <div className="flex flex-wrap gap-1">
            {years.map((y) => (
              <div
                key={y.year}
                className="group relative flex flex-col items-center"
              >
                <div
                  className="h-8 w-5 rounded-sm cursor-pointer"
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

      <div>
        <h3 className="mb-3 text-sm font-semibold text-text-primary">
          O que acontece na lavoura em cada fase do ENSO
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-[#E53935]" />
              <h4 className="font-semibold text-text-primary">El Nino</h4>
            </div>
            <p className="text-sm text-text-secondary">
              Mais chuva ({ensoImpact.el_nino.avg_season_rain_mm} mm na safra).
              Soja rende mais ({ensoImpact.el_nino.avg_yield_sc_ha} sc/ha em
              media). Risco maior de chuva em excesso na colheita e de doencas
              fungicas. {ninoYears.length} safras nos ultimos 44 anos.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-[#1E88E5]" />
              <h4 className="font-semibold text-text-primary">La Nina</h4>
            </div>
            <p className="text-sm text-text-secondary">
              Menos chuva ({ensoImpact.la_nina.avg_season_rain_mm} mm na
              safra). Soja rende menos ({ensoImpact.la_nina.avg_yield_sc_ha}{" "}
              sc/ha em media). Risco alto de seca entre dezembro e fevereiro.
              Ano pra caprichar na cobertura de inverno.{" "}
              {ninaYears.length} safras nos ultimos 44 anos.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-[#6B7280]" />
              <h4 className="font-semibold text-text-primary">Neutro</h4>
            </div>
            <p className="text-sm text-text-secondary">
              Chuva e temperatura dentro da media. Produtividade de{" "}
              {ensoImpact.neutro.avg_yield_sc_ha} sc/ha em media — o que mostra
              que o ENSO realmente faz diferenca.{" "}
              {neutroYears.length} safras nos ultimos 44 anos.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary">
          O que isso significa pro produtor
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          Saber se o ano vai ser El Nino ou La Nina antes de plantar ajuda a
          decidir: em ano de La Nina, a cobertura de inverno e ainda mais
          importante (guarda umidade). Em ano de El Nino, o risco e chuva
          demais na colheita — entao plantar mais cedo pode ser estrategia.
          A diferenca de produtividade entre El Nino e La Nina e de{" "}
          {(
            ensoImpact.el_nino.avg_yield_sc_ha -
            ensoImpact.la_nina.avg_yield_sc_ha
          ).toFixed(1)}{" "}
          sc/ha — isso e dinheiro.
        </p>
      </div>
    </div>
  );
}

function MensalTab() {
  return (
    <div className="space-y-8">
      <p className="text-sm text-text-secondary">
        Media de 44 anos de dados por satelite da NASA, mes a mes. Esses
        numeros mostram o padrao normal do clima de Cruz Alta ao longo do ano.
      </p>
      <MonthlyChart
        data={normals}
        getValue={(d) => d.avg_rain_mm}
        color="#1E88E5"
        unit=" mm"
        label="Chuva media por mes"
      />
      <MonthlyChart
        data={normals}
        getValue={(d) => d.avg_tmax_c}
        color="#E65100"
        unit=" graus"
        label="Temperatura maxima media por mes"
      />
      <MonthlyChart
        data={normals}
        getValue={(d) => d.avg_tmin_c}
        color="#42A5F5"
        unit=" graus"
        label="Temperatura minima media por mes"
      />
      <MonthlyChart
        data={normals}
        getValue={(d) => d.avg_moisture * 100}
        color="#2D6A4F"
        unit="%"
        label="Umidade do solo (zona da raiz) por mes"
      />
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary">
          O que isso significa pro produtor
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          Cruz Alta chove bem o ano todo, mas tem um pico entre setembro e
          marco. A temperatura maxima passa de 30 graus no verao (dez-fev) —
          nessa epoca a soja esta no periodo mais sensivel. No inverno
          (jun-ago), a temperatura minima cai abaixo de 10 graus e a umidade
          do solo baixa — por isso a cobertura de inverno precisa ser plantada
          cedo, pra aproveitar o resto de umidade.
        </p>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("enso");

  const TabContent: Record<TabKey, React.ReactNode> = {
    temperatura: <TemperaturaTab />,
    chuva: <ChuvaTab />,
    produtividade: <ProdutividadeTab />,
    umidade: <UmidadeTab />,
    enso: <EnsoTab />,
    mensal: <MensalTab />,
  };

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-wider text-accent-light uppercase">
            Historico Climatico
          </p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">
            44 anos de clima em Cruz Alta
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary">
            Dados de satelite da NASA de 1981 ate 2025, cruzados com a
            produtividade de soja do IBGE e a classificacao El Nino/La Nina da
            NOAA. Tudo transformado em informacao que o produtor consegue usar.
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

        {TabContent[activeTab]}

        <div className="mt-12 rounded-xl border border-accent/20 bg-accent/5 p-5">
          <h3 className="text-sm font-semibold text-accent-light">
            De onde vem esses dados
          </h3>
          <div className="mt-2 grid gap-2 text-xs text-text-muted sm:grid-cols-2">
            <p>Temperatura e chuva: NASA POWER v2.0 (1981-2025)</p>
            <p>Umidade do solo: NASA POWER GWETROOT (1981-2025)</p>
            <p>Produtividade da soja: IBGE SIDRA tabela 1612</p>
            <p>El Nino/La Nina: NOAA ONI (Oceanic Nino Index)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

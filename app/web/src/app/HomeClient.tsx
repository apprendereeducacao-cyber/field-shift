"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getSmartRecommendation,
  DEFAULT_PROFILE,
  type ProducerProfile,
  type Recommendation,
  type RecommendationInput,
} from "@/lib/recommendation-engine";
import type {
  TimelineData,
  RiskEngineData,
  SiteData,
  CoverCropsData,
} from "@/lib/types";
import Chat from "@/components/Chat";

const ENSO_LABELS: Record<string, string> = {
  el_nino: "El Nino",
  el_nino_fraco: "El Nino Fraco",
  el_nino_forte: "El Nino Forte",
  la_nina: "La Nina",
  la_nina_fraca: "La Nina Fraca",
  la_nina_forte: "La Nina Forte",
  neutro: "Neutro",
};

function riskColor(score: number) {
  if (score >= 65) return "#EF4444";
  if (score >= 40) return "#F59E0B";
  return "#10B981";
}

function riskLabelFn(score: number) {
  if (score >= 65) return "Alto";
  if (score >= 40) return "Medio";
  return "Baixo";
}

type Props = {
  timeline: TimelineData;
  riskEngine: RiskEngineData;
  site: SiteData;
  coverCrops: CoverCropsData;
  keyFindings: typeof import("@/lib/supabase-data").KEY_FINDINGS;
};

export default function HomeClient({ timeline, riskEngine, site, coverCrops, keyFindings }: Props) {
  const AVAILABLE_YEARS = timeline.timeline.map((y) => y.year).sort((a, b) => b - a);
  const [selectedYear, setSelectedYear] = useState(AVAILABLE_YEARS[0]);
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [localProfile, setLocalProfile] = useState<ProducerProfile>({ ...DEFAULT_PROFILE });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fieldshift_produtor");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.years?.length) {
          const p: ProducerProfile = {
            has_cattle: data.has_cattle ?? false,
            soil_compacted: data.soil_compacted ?? false,
            used_green_manure: data.used_green_manure ?? false,
            main_problems: data.years.map((y: { main_problem: string }) => y.main_problem).filter((p: string) => p !== "nenhum"),
            recent_yield: data.years[0]?.yield_result ?? "normal",
            winter_crop_used: data.years[0]?.winter_crop ?? "pousio",
          };
          setProfile(p);
          setLocalProfile(p);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const tl = timeline.timeline.find((y) => y.year === selectedYear);
  if (!tl) return null;

  const recInput: RecommendationInput = {
    coverCropsData: coverCrops,
    timelineData: timeline,
    riskEngineData: riskEngine,
  };
  const rec: Recommendation = getSmartRecommendation(selectedYear, recInput, profile);
  const avgs = riskEngine.historical_averages;
  const rainDiff = (tl.season_rain_mm ?? 0) - avgs.season_rain_mm;
  const hotDiff = tl.hot_days - avgs.hot_days;
  const color = riskColor(rec.riskScore);

  function applyProfile() {
    setProfile(localProfile);
    setShowProfile(false);
    try {
      const existing = localStorage.getItem("fieldshift_produtor");
      const data = existing ? JSON.parse(existing) : {};
      data.has_cattle = localProfile.has_cattle;
      data.soil_compacted = localProfile.soil_compacted;
      data.used_green_manure = localProfile.used_green_manure;
      localStorage.setItem("fieldshift_produtor", JSON.stringify(data));
    } catch { /* ignore */ }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Hero */}
      <header className="pt-2 text-center">
        <p className="text-xs font-medium tracking-widest text-primary uppercase">
          {site.point.name}-{site.point.state}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
          Qual planta de cobertura usar?
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Selecione a safra e descubra a melhor estrategia para o seu solo
        </p>
      </header>

      {/* Seletor de ano */}
      <div className="flex items-center justify-center gap-3">
        <label htmlFor="year-select" className="text-sm font-medium text-text-secondary">
          Safra
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-base font-bold text-text-primary shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        >
          {AVAILABLE_YEARS.map((y) => (
            <option key={y} value={y}>{y}/{y + 1}</option>
          ))}
        </select>
      </div>

      {/* Clima resumo */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="font-semibold" style={{ color }}>Risco {riskLabelFn(rec.riskScore)}</span>
          <span className="text-text-dim">({rec.riskScore.toFixed(0)}/100)</span>
        </span>
        <span className="text-text-muted">
          {ENSO_LABELS[tl.enso] ?? tl.enso.replace(/_/g, " ")}
        </span>
        <span className={rainDiff < 0 ? "text-amber-600" : "text-primary-light"}>
          {rainDiff > 0 ? "+" : ""}{Math.round(rainDiff)} mm chuva
        </span>
        <span className={hotDiff > 5 ? "text-red-500" : "text-text-muted"}>
          {tl.hot_days} dias quentes
        </span>
      </div>

      {/* Indicadores compactos */}
      <div className="grid grid-cols-3 divide-x divide-border text-center">
        <div className="py-2">
          <p className="text-2xl font-bold text-text-primary">{tl.season_rain_mm ?? "--"}</p>
          <p className="text-[11px] text-text-muted">mm de chuva</p>
        </div>
        <div className="py-2">
          <p className="text-2xl font-bold text-text-primary">{tl.hot_days}</p>
          <p className="text-[11px] text-text-muted">dias acima de 32C</p>
        </div>
        <div className="py-2">
          <p className="text-2xl font-bold text-text-primary">
            {tl.avg_soil_moisture !== null ? `${(tl.avg_soil_moisture * 100).toFixed(0)}%` : "--"}
          </p>
          <p className="text-[11px] text-text-muted">umidade do solo</p>
        </div>
      </div>

      {/* Necessidade detectada */}
      <p className="text-center text-sm text-text-secondary">
        Prioridade para esta safra:{" "}
        <span className="font-semibold text-primary">{rec.primaryNeed}</span>
        {profile && <span className="ml-1 text-accent">(personalizado)</span>}
      </p>

      {/* Recomendacao principal */}
      <section className="rounded-2xl border border-primary/20 bg-primary/[0.03] px-6 py-6">
        <p className="text-[11px] font-semibold tracking-widest text-primary uppercase">
          Recomendacao
        </p>
        <h2 className="mt-1 text-2xl font-bold text-text-primary">{rec.bestCombo.name}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{rec.bestCombo.why}</p>

        <ul className="mt-4 space-y-2">
          {rec.bestCombo.crops.map((sc) =>
            sc.reasons.slice(0, 2).map((r, i) => (
              <li key={`${sc.crop.id}-${i}`} className="flex items-start gap-2.5 text-sm text-text-secondary">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {r}
              </li>
            ))
          )}
        </ul>

        <div className="mt-5 border-t border-primary/10 pt-4">
          <p className="mb-2 text-[11px] font-semibold tracking-widest text-primary uppercase">
            Calendario
          </p>
          <div className="space-y-1.5">
            {rec.bestCombo.calendar.map((item, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="w-16 shrink-0 font-semibold text-text-primary">{item.month}</span>
                <span className="text-text-secondary">{item.action}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alternativas */}
      {rec.alternatives.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Outras opcoes</h3>
          <div className="space-y-2">
            {rec.alternatives.map((alt, i) => (
              <div key={i} className="flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{alt.name}</p>
                  <p className="mt-0.5 text-xs leading-snug text-text-muted">{alt.why}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-text-dim">{alt.comboScore.toFixed(0)} pts</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Personalizar */}
      <section className="rounded-2xl border border-border px-5 py-4">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex w-full items-center justify-between"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-text-primary">Personalizar recomendacao</p>
            <p className="text-xs text-text-muted">
              {profile ? "Seus dados estao sendo usados" : "3 perguntas para recomendacao sob medida"}
            </p>
          </div>
          <svg
            className={`h-4 w-4 text-text-dim transition-transform ${showProfile ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showProfile && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            {[
              { label: "Tem gado na propriedade?", key: "has_cattle" as const },
              { label: "Solo compactado?", key: "soil_compacted" as const },
              { label: "Ja usou adubo verde?", key: "used_green_manure" as const },
            ].map(({ label, key }) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{label}</span>
                <button
                  onClick={() => setLocalProfile((p) => ({ ...p, [key]: !p[key] }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${localProfile[key] ? "bg-primary" : "bg-border"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${localProfile[key] ? "translate-x-5" : ""}`} />
                </button>
              </label>
            ))}

            <div>
              <p className="mb-1.5 text-sm text-text-secondary">Maior problema recente</p>
              <select
                value={localProfile.main_problems[0] ?? "nenhum"}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocalProfile((p) => ({
                    ...p,
                    main_problems: v === "nenhum" ? [] : [v],
                  }));
                }}
                className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              >
                <option value="nenhum">Nenhum problema grave</option>
                <option value="seca">Seca</option>
                <option value="chuva_demais">Chuva demais</option>
                <option value="solo_compactado">Solo compactado</option>
                <option value="praga_doenca">Praga ou doenca</option>
                <option value="geada">Geada</option>
              </select>
            </div>

            <button
              onClick={applyProfile}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              Aplicar e ver recomendacao
            </button>
          </div>
        )}
      </section>

      {/* Links de navegacao */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/painel"
          className="group rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
        >
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary">Painel climatico</p>
          <p className="text-xs text-text-muted">Analise detalhada por ano</p>
        </Link>
        <Link
          href="/mapa"
          className="group rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
        >
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary">Mapa da regiao</p>
          <p className="text-xs text-text-muted">Relevo, temperatura, NDVI</p>
        </Link>
      </div>

      <p className="pb-2 text-center text-[10px] text-text-dim">
        {rec.climateContext} | Dados: NASA POWER + IBGE | {keyFindings.data_years} anos
      </p>

      <Chat />
    </div>
  );
}

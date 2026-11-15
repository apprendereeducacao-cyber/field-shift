"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  timeline,
  riskEngine,
  site,
  KEY_FINDINGS,
} from "@/lib/data";
import {
  getSmartRecommendation,
  DEFAULT_PROFILE,
  type ProducerProfile,
  type Recommendation,
} from "@/lib/recommendation-engine";

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

function riskLevel(score: number) {
  if (score >= 65) return { label: "Alto", color: "text-red-400" };
  if (score >= 40) return { label: "Medio", color: "text-amber-400" };
  return { label: "Baixo", color: "text-emerald-400" };
}

const AVAILABLE_YEARS = timeline.timeline.map((y) => y.year).sort((a, b) => b - a);

export default function Home() {
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

  const rec: Recommendation = getSmartRecommendation(selectedYear, profile);
  const risk = riskLevel(rec.riskScore);
  const avgs = riskEngine.historical_averages;
  const rainDiff = (tl.season_rain_mm ?? 0) - avgs.season_rain_mm;
  const hotDiff = tl.hot_days - avgs.hot_days;

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
    <div className="space-y-5">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Field Shift</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {site.point.name}-{site.point.state} — {KEY_FINDINGS.data_years} anos de dados NASA
        </p>
      </header>

      {/* Seletor */}
      <div className="mx-auto max-w-sm">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="w-full rounded-xl border border-border bg-bg-surface px-4 py-3 text-center text-lg font-bold text-text-primary outline-none focus:border-primary-light"
        >
          {AVAILABLE_YEARS.map((y) => (
            <option key={y} value={y}>Safra {y}/{y + 1}</option>
          ))}
        </select>
      </div>

      {/* Risco + Clima */}
      <div className="rounded-xl border border-border bg-bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-dim">Risco climatico</p>
            <p className={`text-3xl font-bold ${risk.color}`}>
              {rec.riskScore.toFixed(0)}<span className="text-sm font-normal text-text-muted">/100</span>
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold ${ENSO_COLORS[tl.enso] ?? "text-text-muted"}`}>
              {ENSO_LABELS[tl.enso] ?? tl.enso.replace(/_/g, " ")}
            </p>
            {tl.yield_sc_ha !== null && (
              <p className="text-xs text-text-muted">{tl.yield_sc_ha} sc/ha</p>
            )}
          </div>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-bg-surface-alt overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, rec.riskScore))}%`,
              background: rec.riskScore >= 65
                ? "linear-gradient(90deg, #F97316, #EF4444)"
                : rec.riskScore >= 40
                  ? "linear-gradient(90deg, #F9A825, #F97316)"
                  : "linear-gradient(90deg, #10B981, #F9A825)",
            }}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-text-dim">Chuva</p>
            <p className="text-sm font-bold text-text-primary">{tl.season_rain_mm ?? "—"} mm</p>
            <p className={`text-[10px] ${rainDiff < 0 ? "text-red-400" : "text-emerald-400"}`}>
              {rainDiff > 0 ? "+" : ""}{Math.round(rainDiff)} vs media
            </p>
          </div>
          <div>
            <p className="text-xs text-text-dim">Calor</p>
            <p className="text-sm font-bold text-text-primary">{tl.hot_days} dias</p>
            <p className={`text-[10px] ${hotDiff > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {hotDiff > 0 ? "+" : ""}{Math.round(hotDiff)} vs media
            </p>
          </div>
          <div>
            <p className="text-xs text-text-dim">Solo</p>
            <p className="text-sm font-bold text-text-primary">
              {tl.avg_soil_moisture !== null ? `${(tl.avg_soil_moisture * 100).toFixed(0)}%` : "—"}
            </p>
            <p className="text-[10px] text-text-muted">media: {(avgs.avg_soil_moisture * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Necessidade detectada */}
      <div className="rounded-lg bg-bg-surface-alt px-4 py-2">
        <p className="text-xs text-text-muted">
          Prioridade detectada: <span className="font-semibold text-text-primary">{rec.primaryNeed}</span>
          {profile && <span className="ml-1 text-primary-light">(personalizado)</span>}
        </p>
      </div>

      {/* Recomendacao Principal */}
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
        <p className="text-xs font-medium tracking-wider text-primary-light uppercase">
          Planta de cobertura recomendada
        </p>
        <h2 className="mt-1 text-xl font-bold text-text-primary">{rec.bestCombo.name}</h2>
        <p className="mt-2 text-sm text-text-secondary">{rec.bestCombo.why}</p>

        {/* Reasons */}
        <div className="mt-3 space-y-1.5">
          {rec.bestCombo.crops.map((sc) =>
            sc.reasons.slice(0, 2).map((r, i) => (
              <div key={`${sc.crop.id}-${i}`} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-light" />
                {r}
              </div>
            ))
          )}
        </div>

        {/* Calendar */}
        <div className="mt-4 space-y-1">
          {rec.bestCombo.calendar.map((item, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="w-14 shrink-0 font-semibold text-text-primary">{item.month}</span>
              <span className="text-text-secondary">{item.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alternativas */}
      {rec.alternatives.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Alternativas</h3>
          <div className="space-y-2">
            {rec.alternatives.map((alt, i) => (
              <div key={i} className="rounded-lg border border-border bg-bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">{alt.name}</span>
                  <span className="text-xs text-text-muted">{alt.comboScore.toFixed(0)} pts</span>
                </div>
                <p className="mt-1 text-xs text-text-secondary">{alt.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalizar */}
      <div className="rounded-xl border border-border bg-bg-surface p-4">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex w-full items-center justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-text-primary text-left">Personalizar recomendacao</p>
            <p className="text-xs text-text-muted text-left">
              {profile ? "Seus dados estao sendo usados" : "Responda 3 perguntas para recomendacao sob medida"}
            </p>
          </div>
          <svg
            className={`h-5 w-5 text-text-muted transition-transform ${showProfile ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showProfile && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Tem gado na propriedade?</span>
              <button
                onClick={() => setLocalProfile((p) => ({ ...p, has_cattle: !p.has_cattle }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${localProfile.has_cattle ? "bg-primary-light" : "bg-bg-surface-alt"}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-text-primary transition-transform ${localProfile.has_cattle ? "translate-x-5" : ""}`} />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Solo compactado?</span>
              <button
                onClick={() => setLocalProfile((p) => ({ ...p, soil_compacted: !p.soil_compacted }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${localProfile.soil_compacted ? "bg-primary-light" : "bg-bg-surface-alt"}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-text-primary transition-transform ${localProfile.soil_compacted ? "translate-x-5" : ""}`} />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Ja usou adubo verde?</span>
              <button
                onClick={() => setLocalProfile((p) => ({ ...p, used_green_manure: !p.used_green_manure }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${localProfile.used_green_manure ? "bg-primary-light" : "bg-bg-surface-alt"}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-text-primary transition-transform ${localProfile.used_green_manure ? "translate-x-5" : ""}`} />
              </button>
            </label>

            <div>
              <p className="mb-1 text-sm text-text-secondary">Maior problema recente</p>
              <select
                value={localProfile.main_problems[0] ?? "nenhum"}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocalProfile((p) => ({
                    ...p,
                    main_problems: v === "nenhum" ? [] : [v],
                  }));
                }}
                className="w-full rounded-lg border border-border bg-bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-light"
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
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
            >
              Aplicar e ver recomendacao
            </button>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/painel"
          className="rounded-xl border border-border bg-bg-surface p-3 text-center transition-colors hover:border-primary/40"
        >
          <p className="text-sm font-semibold text-text-primary">Painel climatico</p>
          <p className="text-xs text-text-muted">Analise detalhada por ano</p>
        </Link>
        <Link
          href="/mapa"
          className="rounded-xl border border-border bg-bg-surface p-3 text-center transition-colors hover:border-primary/40"
        >
          <p className="text-sm font-semibold text-text-primary">Mapa da regiao</p>
          <p className="text-xs text-text-muted">Relevo, temperatura, NDVI</p>
        </Link>
      </div>

      <p className="text-[10px] text-text-dim text-center">
        {rec.climateContext}
      </p>
    </div>
  );
}

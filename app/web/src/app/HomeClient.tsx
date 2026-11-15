"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
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
  if (score >= 40) return "#FF8F00";
  return "#74C69D";
}

function riskLabelFn(score: number) {
  if (score >= 65) return "Alto";
  if (score >= 40) return "Medio";
  return "Baixo";
}

// ── Globe component ──

function GlobeWireframe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group>
      <Sphere ref={meshRef} args={[2, 48, 48]}>
        <meshBasicMaterial
          color="#2D6A4F"
          wireframe
          transparent
          opacity={0.25}
        />
      </Sphere>
      <Sphere args={[1.98, 48, 48]}>
        <meshBasicMaterial
          color="#0B1120"
          transparent
          opacity={0.9}
        />
      </Sphere>
      {/* Cruz Alta marker */}
      <mesh position={[0.85, 1.22, -1.25]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#74C69D" />
      </mesh>
      {/* Glow ring around marker */}
      <mesh position={[0.85, 1.22, -1.25]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.09, 32]} />
        <meshBasicMaterial color="#74C69D" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function GlobeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <Suspense fallback={null}>
        <GlobeWireframe />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </Canvas>
  );
}

// ── Main component ──

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
    <div className="flex flex-col">
      {/* ── HERO: Globe + Search ── */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden">
        {/* Globe background */}
        <div className="absolute inset-0 opacity-60">
          <GlobeScene />
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          <p className="text-sm font-medium tracking-widest text-data uppercase">
            NASA Space Apps 2026
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text-primary sm:text-[52px] sm:leading-[1.1]"
              style={{ letterSpacing: "-0.025em" }}>
            Adapte sua lavoura<br />com dados da NASA
          </h1>
          <p className="mt-4 max-w-md text-base text-text-muted">
            44 anos de dados climaticos, 7 camadas de satelite, inteligencia para decidir o melhor manejo
          </p>

          {/* Search bar (demo — Cruz Alta fixed) */}
          <div className="mt-8 w-full max-w-md">
            <div className="flex items-center rounded-xl border border-border-control bg-bg-surface/80 px-4 py-3 backdrop-blur-md">
              <svg className="mr-3 h-5 w-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm text-text-secondary">Cruz Alta, RS</span>
              <span className="ml-auto rounded-md bg-primary/20 px-2 py-0.5 text-[11px] font-medium text-data">
                Demo
              </span>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-12 animate-bounce">
            <svg className="h-5 w-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── ANCHOR NUMBERS ── */}
      <section className="border-y border-border bg-bg-surface py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6">
          <div className="text-center">
            <p className="text-3xl font-semibold tabular-nums text-data sm:text-[40px]"
               style={{ letterSpacing: "-0.025em" }}>{keyFindings.data_years}</p>
            <p className="mt-1 text-xs text-text-dim">anos de dados NASA</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold tabular-nums text-data sm:text-[40px]"
               style={{ letterSpacing: "-0.025em" }}>7</p>
            <p className="mt-1 text-xs text-text-dim">camadas de satelite</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold tabular-nums text-data sm:text-[40px]"
               style={{ letterSpacing: "-0.025em" }}>10m</p>
            <p className="mt-1 text-xs text-text-dim">resolucao NDVI</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold tabular-nums text-data sm:text-[40px]"
               style={{ letterSpacing: "-0.025em" }}>r=0.63</p>
            <p className="mt-1 text-xs text-text-dim">chuva vs produtividade</p>
          </div>
        </div>
      </section>

      {/* ── RECOMMENDATION SECTION ── */}
      <section className="mx-auto w-full max-w-2xl space-y-8 px-4 py-10 sm:px-6">
        {/* Year selector */}
        <div className="flex items-center justify-center gap-3">
          <label htmlFor="year-select" className="text-sm font-medium text-text-secondary">
            Safra
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-base font-semibold text-text-primary shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            {AVAILABLE_YEARS.map((y) => (
              <option key={y} value={y}>{y}/{y + 1}</option>
            ))}
          </select>
        </div>

        {/* Climate badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="font-semibold" style={{ color }}>Risco {riskLabelFn(rec.riskScore)}</span>
            <span className="text-text-dim">({rec.riskScore.toFixed(0)}/100)</span>
          </span>
          <span className="text-text-muted">
            {ENSO_LABELS[tl.enso] ?? tl.enso.replace(/_/g, " ")}
          </span>
          <span className={rainDiff < 0 ? "text-warning" : "text-data"}>
            {rainDiff > 0 ? "+" : ""}{Math.round(rainDiff)} mm chuva
          </span>
          <span className={hotDiff > 5 ? "text-danger" : "text-text-muted"}>
            {tl.hot_days} dias quentes
          </span>
        </div>

        {/* Compact indicators */}
        <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-bg-surface text-center">
          <div className="py-4">
            <p className="text-2xl font-semibold tabular-nums text-data">{tl.season_rain_mm ?? "--"}</p>
            <p className="text-[11px] text-text-dim">mm de chuva</p>
          </div>
          <div className="py-4">
            <p className="text-2xl font-semibold tabular-nums text-data">{tl.hot_days}</p>
            <p className="text-[11px] text-text-dim">dias acima de 32C</p>
          </div>
          <div className="py-4">
            <p className="text-2xl font-semibold tabular-nums text-data">
              {tl.avg_soil_moisture !== null ? `${(tl.avg_soil_moisture * 100).toFixed(0)}%` : "--"}
            </p>
            <p className="text-[11px] text-text-dim">umidade do solo</p>
          </div>
        </div>

        {/* Detected need */}
        <p className="text-center text-sm text-text-secondary">
          Prioridade para esta safra:{" "}
          <span className="font-semibold text-data">{rec.primaryNeed}</span>
          {profile && <span className="ml-1 text-accent">(personalizado)</span>}
        </p>

        {/* Main recommendation */}
        <section className="rounded-2xl border border-primary/30 bg-primary/[0.05] px-6 py-6">
          <p className="text-[11px] font-semibold tracking-widest text-data uppercase">
            Recomendacao
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{rec.bestCombo.name}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{rec.bestCombo.why}</p>

          <ul className="mt-4 space-y-2">
            {rec.bestCombo.crops.map((sc) =>
              sc.reasons.slice(0, 2).map((r, i) => (
                <li key={`${sc.crop.id}-${i}`} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-data" />
                  {r}
                </li>
              ))
            )}
          </ul>

          <div className="mt-5 border-t border-primary/20 pt-4">
            <p className="mb-2 text-[11px] font-semibold tracking-widest text-data uppercase">
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

        {/* Alternatives */}
        {rec.alternatives.length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Outras opcoes</h3>
            <div className="space-y-2">
              {rec.alternatives.map((alt, i) => (
                <div key={i} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{alt.name}</p>
                    <p className="mt-0.5 text-xs leading-snug text-text-muted">{alt.why}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-data">{alt.comboScore.toFixed(0)} pts</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Profile customization */}
        <section className="rounded-2xl border border-border bg-bg-surface px-5 py-4">
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
                  className="w-full rounded-lg border border-border bg-bg-surface-alt px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
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
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                Aplicar e ver recomendacao
              </button>
            </div>
          )}
        </section>

        {/* Navigation links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/painel"
            className="group rounded-xl border border-border bg-bg-surface px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
          >
            <p className="text-sm font-semibold text-text-primary group-hover:text-data">Painel climatico</p>
            <p className="text-xs text-text-muted">Analise detalhada por ano</p>
          </Link>
          <Link
            href="/mapa"
            className="group rounded-xl border border-border bg-bg-surface px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
          >
            <p className="text-sm font-semibold text-text-primary group-hover:text-data">Mapa da regiao</p>
            <p className="text-xs text-text-muted">7 camadas de satelite</p>
          </Link>
        </div>

        <p className="pb-2 text-center text-[10px] text-text-dim">
          {rec.climateContext} | Dados: NASA POWER + IBGE | {keyFindings.data_years} anos
        </p>

        <Chat />
      </section>
    </div>
  );
}

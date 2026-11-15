"use client";

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const DATA_PARTNERS = [
  "NASA POWER",
  "Sentinel-2",
  "Copernicus",
  "MapBiomas",
  "ISRIC SoilGrids",
  "IBGE SIDRA",
  "NASA SMAP",
  "NASA GPM",
  "MODIS",
  "ECOSTRESS",
  "GRACE-FO",
  "SRTM",
];

type Municipality = {
  id: number;
  nome: string;
  microrregiao: { mesorregiao: { UF: { sigla: string } } };
};

type ReportData = {
  municipality: string;
  uf: string;
  loading: boolean;
  years: number[];
  selectedYear: number;
  riskScore: number | null;
  riskLabel: string | null;
  avgTemp: number | null;
  avgRain: number | null;
  yearData: { yield: number; rain: number; temp: number; spiDjf: number } | null;
  topCrops: string[];
  coverCrops: string[];
  rotation: { name: string; subtitle: string; scores: Record<string, number>; totalScore: number; sequence: { crop: string; season: string }[] } | null;
  strategies: { name: string; subtitle: string; totalScore: number; sequence: { crop: string; season: string }[] }[];
};

function GlobeWireframe({ targetLat, targetLon }: { targetLat?: number; targetLon?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef<number | null>(null);

  useEffect(() => {
    if (targetLon !== undefined) {
      targetRotation.current = THREE.MathUtils.degToRad(-targetLon - 90);
    }
  }, [targetLon]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (targetRotation.current !== null) {
      meshRef.current.rotation.y += (targetRotation.current - meshRef.current.rotation.y) * 0.03;
    } else {
      meshRef.current.rotation.y += delta * 0.12;
    }
  });

  const lat = targetLat ?? -28.6;
  const lon = targetLon ?? -53.6;
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 90);
  const r = 2.01;
  const markerPos: [number, number, number] = [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];

  return (
    <group>
      <Sphere ref={meshRef} args={[2, 48, 48]}>
        <meshBasicMaterial color="#21754C" wireframe transparent opacity={0.18} />
      </Sphere>
      <Sphere args={[1.98, 48, 48]}>
        <meshBasicMaterial color="#0B1A10" transparent opacity={0.92} />
      </Sphere>
      {targetLat !== undefined && (
        <>
          <mesh ref={markerRef} position={markerPos}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#E1F031" />
          </mesh>
          <mesh ref={haloRef} position={markerPos} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.07, 0.11, 32]} />
            <meshBasicMaterial color="#96E18E" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
}

function GlobeScene({ targetLat, targetLon }: { targetLat?: number; targetLon?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <Suspense fallback={null}>
        <GlobeWireframe targetLat={targetLat} targetLon={targetLon} />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.5} />
    </Canvas>
  );
}

const SEASON_LABEL: Record<string, string> = {
  summer: "Verao", winter: "Inverno", winter_late: "Inverno tardio", winter_mix: "Inverno consorcio",
};
function formatCrop(name: string) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CityReport({ report, onYearChange }: { report: ReportData; onYearChange: (year: number) => void }) {
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const askAI = async () => {
    if (!aiQuestion.trim() || aiLoading) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous_id: "home-report",
          message: `Contexto: ${report.municipality}, ${report.uf}, safra ${report.selectedYear}. ${aiQuestion}`,
        }),
      });
      if (!res.ok || !res.body) throw new Error("request failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.text) { text += parsed.text; setAiAnswer(text); }
          } catch { /* partial line */ }
        }
      }
      if (!text) setAiAnswer("Sem resposta do agronomo. Tente reformular.");
    } catch {
      setAiAnswer("Erro ao consultar o agronomo. Tente novamente.");
    }
    setAiLoading(false);
  };

  if (report.loading) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-10">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Analisando {report.municipality}, {report.uf}...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 px-4 py-12 sm:px-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Relatorio climatico</p>
        <h2 className="text-[32px] font-light leading-tight tracking-[-0.02em] text-foreground sm:text-[40px]">
          {report.municipality}, {report.uf}
        </h2>
        {report.years.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Safra:</label>
            <select
              value={report.selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground outline-none focus:border-primary"
            >
              {report.years.map((y) => (
                <option key={y} value={y}>{y}/{y + 1}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[24px] border border-border bg-card p-5 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Risco</p>
          <p className="mt-2 text-[36px] font-light tabular-nums text-primary">{report.riskScore ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{report.riskLabel ? formatCrop(report.riskLabel) : "de 100"}</p>
        </div>
        <div className="rounded-[24px] border border-border bg-card p-5 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Temperatura</p>
          <p className="mt-2 text-[36px] font-light tabular-nums text-ember-600">{report.yearData?.temp?.toFixed(1) ?? report.avgTemp?.toFixed(1) ?? "—"}</p>
          <p className="text-xs text-muted-foreground">graus C</p>
        </div>
        <div className="rounded-[24px] border border-border bg-card p-5 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Chuva</p>
          <p className="mt-2 text-[36px] font-light tabular-nums text-rain-600">{report.yearData?.rain?.toFixed(0) ?? report.avgRain?.toFixed(0) ?? "—"}</p>
          <p className="text-xs text-muted-foreground">mm/ano</p>
        </div>
        <div className="rounded-[24px] border border-border bg-card p-5 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Produtividade</p>
          <p className="mt-2 text-[36px] font-light tabular-nums text-leaf-600">{report.yearData?.yield?.toFixed(1) ?? "—"}</p>
          <p className="text-xs text-muted-foreground">sc/ha</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] border border-border bg-card p-6">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Rotacao recomendada</p>
          {report.rotation && (
            <>
              <p className="mt-2 text-base font-semibold text-foreground">{report.rotation.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{report.rotation.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {report.rotation.sequence.map((s, i) => (
                  <span key={i} className="rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-primary">
                    {formatCrop(s.crop)} <span className="text-stone-400">({SEASON_LABEL[s.season] ?? s.season})</span>
                  </span>
                ))}
              </div>
              <div className="mt-3 text-right">
                <span className="text-2xl font-light tabular-nums text-primary">{report.rotation.totalScore}</span>
                <span className="ml-1 text-xs text-muted-foreground">/ 100</span>
              </div>
            </>
          )}
          {!report.rotation && (
            <div className="mt-3 flex flex-wrap gap-2">
              {report.topCrops.map((c) => (
                <span key={c} className="rounded-full bg-forest-50 px-3 py-1 text-sm font-medium text-primary">{c}</span>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-[24px] border border-border bg-card p-6">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Cobertura de inverno</p>
          <p className="mt-2 text-sm text-muted-foreground">Plantas indicadas para entressafra:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {report.coverCrops.map((c) => (
              <span key={c} className="rounded-full bg-status-success-bg px-3 py-1 text-sm font-medium text-status-success">{c}</span>
            ))}
          </div>
          {report.strategies.length > 1 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Outras estrategias</p>
              {report.strategies.slice(1).map((s, i) => (
                <div key={i} className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-foreground">{s.name}</span>
                  <span className="tabular-nums text-primary">{s.totalScore}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Agronomo ── */}
      <div className="rounded-[24px] border border-border bg-card p-6">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Consultar agronomo IA</p>
        <p className="mt-1 text-sm text-muted-foreground">Pergunte sobre manejo, rotacao ou clima para {report.municipality}</p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askAI()}
            placeholder="Ex: Qual a melhor epoca para plantar aveia-preta?"
            className="flex-1 rounded-full border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-stone-400 outline-none focus:border-primary"
          />
          <button
            onClick={askAI}
            disabled={aiLoading || !aiQuestion.trim()}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {aiLoading ? "..." : "Perguntar"}
          </button>
        </div>
        {aiAnswer && (
          <div className="mt-4 rounded-[16px] bg-forest-50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{aiAnswer}</p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <Link href="/painel" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
          Ver painel completo
        </Link>
        <Link href="/mapa" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
          Abrir mapa
        </Link>
      </div>
    </section>
  );
}

export default function HomeClient() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Municipality[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState<{ name: string; uf: string; lat: number; lon: number } | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const municipiosCache = useRef<Municipality[] | null>(null);

  const searchMunicipalities = useCallback(async (term: string) => {
    if (term.length < 3) { setSuggestions([]); return; }
    try {
      if (!municipiosCache.current) {
        const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome");
        municipiosCache.current = await res.json();
      }
      const normalized = term.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const filtered = municipiosCache.current!
        .filter((m) => m.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(normalized))
        .slice(0, 8);
      setSuggestions(filtered);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchMunicipalities(value), 300);
  };

  const fetchReport = async (municipality: string, uf: string, year?: number) => {
    try {
      const url = year ? `/api/report?year=${year}` : "/api/report";
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport({
        municipality: data.municipality ?? municipality,
        uf: data.uf ?? uf,
        loading: false,
        years: data.years ?? [],
        selectedYear: data.selectedYear ?? year ?? new Date().getFullYear(),
        riskScore: data.riskScore,
        riskLabel: data.riskLabel,
        avgTemp: data.avgTemp,
        avgRain: data.avgRain,
        yearData: data.yearData,
        topCrops: data.topCrops ?? [],
        coverCrops: data.coverCrops ?? [],
        rotation: data.rotation,
        strategies: data.strategies ?? [],
      });
    } catch {
      setReport({
        municipality,
        uf,
        loading: false,
        years: [],
        selectedYear: new Date().getFullYear(),
        riskScore: null,
        riskLabel: null,
        avgTemp: null,
        avgRain: null,
        yearData: null,
        topCrops: ["Soja", "Milho", "Trigo", "Aveia"],
        coverCrops: [],
        rotation: null,
        strategies: [],
      });
    }
  };

  const handleYearChange = (year: number) => {
    if (!report) return;
    setReport({ ...report, selectedYear: year, loading: true });
    fetchReport(report.municipality, report.uf, year);
  };

  const selectCity = async (mun: Municipality) => {
    const uf = mun.microrregiao.mesorregiao.UF.sigla;
    setQuery(`${mun.nome}, ${uf}`);
    setShowSuggestions(false);
    setSuggestions([]);

    let lat = -28.6;
    let lon = -53.6;
    try {
      const geoRes = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${mun.id}`
      );
      const geoData = await geoRes.json();
      if (geoData.regiao_imediata) {
        lat = -28.6 + ((mun.id % 100) - 50) * 0.05;
        lon = -53.6 + ((mun.id % 73) - 36) * 0.05;
      }
    } catch { /* use defaults */ }

    setSelectedCity({ name: mun.nome, uf, lat, lon });
    setReport({
      municipality: mun.nome,
      uf,
      loading: true,
      years: [],
      selectedYear: new Date().getFullYear(),
      riskScore: null,
      riskLabel: null,
      avgTemp: null,
      avgRain: null,
      yearData: null,
      topCrops: [],
      coverCrops: [],
      rotation: null,
      strategies: [],
    });

    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);

    fetchReport(mun.nome, uf);
  };

  return (
    <div className="flex flex-col">
      {/* ── HERO ORBIT ── */}
      <section
        data-theme="orbit"
        className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden"
        style={{ background: "radial-gradient(120% 90% at 0% 0%, rgba(70,154,92,0.55) 0%, rgba(11,26,16,0) 60%), #0B1A10" }}
      >
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(rgba(150,225,142,0.16) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

        <div className="absolute inset-0 opacity-50">
          <GlobeScene targetLat={selectedCity?.lat} targetLon={selectedCity?.lon} />
        </div>

        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          <h1 className="text-[44px] font-light leading-[1.1] tracking-[-0.035em] text-stone-50 sm:text-[56px]">
            Adapte sua lavoura<br />com dados da NASA
          </h1>
          <p className="mt-4 max-w-md text-base text-stone-300" style={{ letterSpacing: "-0.005em" }}>
            44 anos de dados climaticos, 7 camadas de satelite, inteligencia para decidir o melhor manejo
          </p>

          <div className="relative mt-8 w-full max-w-md">
            <div className="flex items-center rounded-full border border-stone-700 bg-forest-900/80 px-5 py-3 backdrop-blur-md">
              <svg className="mr-3 h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Buscar municipio..."
                className="flex-1 bg-transparent text-sm text-stone-100 placeholder:text-stone-500 outline-none"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false); setSelectedCity(null); setReport(null); }}
                  className="ml-2 text-stone-400 hover:text-stone-200"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[16px] border border-stone-700 bg-forest-900/95 shadow-xl backdrop-blur-lg">
                {suggestions.map((mun) => (
                  <button
                    key={mun.id}
                    onClick={() => selectCity(mun)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-stone-200 transition-colors hover:bg-forest-800/50"
                  >
                    <svg className="h-4 w-4 shrink-0 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{mun.nome}</span>
                    <span className="ml-auto text-xs text-stone-500">{mun.microrregiao.mesorregiao.UF.sigla}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── SATELITES PARCEIROS ── */}
      <section className="border-y border-border bg-muted py-8 overflow-hidden">
        <h2 className="mb-6 text-center text-lg font-semibold tracking-[-0.01em] text-foreground sm:text-xl">
          Satelites Parceiros
        </h2>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-muted to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-muted to-transparent" />
          <div className="flex animate-scroll gap-5">
            {[...DATA_PARTNERS, ...DATA_PARTNERS].map((name, i) => (
              <span
                key={i}
                className="shrink-0 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-primary hover:text-primary"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CITY REPORT (appears after search) ── */}
      {report && (
        <div ref={reportRef} style={{ background: "#DCE8DD", color: "#151A17" }}>
          <CityReport report={report} onYearChange={handleYearChange} />
        </div>
      )}
    </div>
  );
}

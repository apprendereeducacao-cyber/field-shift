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

const MONTH_NAMES_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const RISK_KEYS = ["dry_spell", "heat", "heavy_rain", "frost"] as const;
const RISK_LABELS: Record<string, string> = { dry_spell: "Seca longa", heat: "Calor forte", heavy_rain: "Chuvarada", frost: "Geada" };
function riskText(v: number) { return `${Math.round(v * 10)} em 10`; }
function riskColor(v: number) {
  if (v <= 0) return "bg-stone-50 text-stone-400";
  if (v <= 0.2) return "bg-emerald-100 text-emerald-700";
  if (v <= 0.5) return "bg-amber-100 text-amber-700";
  if (v <= 0.75) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

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
  yearData: { yield: number; rain: number; temp: number; spiDjf: number; enso: string | null } | null;
  ensoImpact: { el_nino: { avg_yield_sc_ha: number; n_safras: number }; la_nina: { avg_yield_sc_ha: number; n_safras: number }; neutro: { avg_yield_sc_ha: number; n_safras: number } } | null;
  topCrops: string[];
  coverCrops: string[];
  rotation: { name: string; subtitle: string; scores: Record<string, number>; totalScore: number; sequence: { crop: string; season: string }[] } | null;
  strategies: { name: string; subtitle: string; totalScore: number; sequence: { crop: string; season: string }[] }[];
  riskCalendar: { dry_spell: number; heat: number; heavy_rain: number; frost: number }[];
  summary: string;
};

/* ── Producer Form Data ── */
const SUMMER_CROPS = [
  { value: "", label: "Selecione" },
  { value: "soja", label: "Soja" },
  { value: "milho", label: "Milho" },
  { value: "feijao", label: "Feijao" },
  { value: "outro", label: "Outro" },
  { value: "nenhum", label: "Nenhum" },
];

const SAFRINHA_CROPS = [
  { value: "", label: "Selecione" },
  { value: "soja_safrinha", label: "Soja safrinha (ciclo curto)" },
  { value: "milho_safrinha", label: "Milho safrinha" },
  { value: "feijao", label: "Feijao" },
  { value: "sorgo", label: "Sorgo" },
  { value: "girassol", label: "Girassol" },
  { value: "milheto", label: "Milheto (cobertura)" },
  { value: "brachiaria", label: "Brachiaria (cobertura)" },
  { value: "crotalaria", label: "Crotalaria (adubo verde)" },
  { value: "pousio", label: "Nao plantou safrinha" },
];

const WINTER_CROPS = [
  { value: "", label: "Selecione" },
  { value: "pousio", label: "Pousio (nao plantou nada)" },
  { value: "trigo", label: "Trigo (renda)" },
  { value: "aveia_preta", label: "Aveia-preta (cobertura)" },
  { value: "aveia_branca", label: "Aveia-branca (grao)" },
  { value: "centeio", label: "Centeio" },
  { value: "canola", label: "Canola (renda)" },
  { value: "ervilhaca", label: "Ervilhaca (fixa N)" },
  { value: "nabo_forrageiro", label: "Nabo forrageiro" },
  { value: "azevem", label: "Azevem (pastagem)" },
  { value: "aveia_ervilhaca", label: "Aveia + Ervilhaca (mix)" },
  { value: "centeio_nabo", label: "Centeio + Nabo (mix)" },
  { value: "aveia_ervilhaca_nabo", label: "Triplo mix" },
  { value: "outro", label: "Outro" },
];

const YIELD_RESULTS = [
  { value: "", label: "Selecione" },
  { value: "boa", label: "Boa (acima da media)" },
  { value: "normal", label: "Normal" },
  { value: "ruim", label: "Ruim (abaixo da media)" },
  { value: "perda_total", label: "Perda total" },
];

const PROBLEMS = [
  { value: "", label: "Selecione" },
  { value: "nenhum", label: "Nenhum problema grave" },
  { value: "seca", label: "Seca / estiagem" },
  { value: "chuva_demais", label: "Excesso de chuva" },
  { value: "praga_doenca", label: "Praga ou doenca" },
  { value: "nematoides", label: "Nematoides" },
  { value: "solo_compactado", label: "Solo compactado" },
  { value: "geada", label: "Geada" },
  { value: "granizo", label: "Granizo" },
];


function GlobeWireframe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group>
      <Sphere ref={meshRef} args={[2, 48, 48]}>
        <meshBasicMaterial color="#21754C" wireframe transparent opacity={0.18} />
      </Sphere>
      <Sphere args={[1.98, 48, 48]}>
        <meshBasicMaterial color="#0B1A10" transparent opacity={0.92} />
      </Sphere>
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
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.5} />
    </Canvas>
  );
}

const SEASON_LABEL: Record<string, string> = {
  summer: "Verao", safrinha: "Safrinha", winter: "Inverno", winter_late: "Pos-colheita inverno", winter_mix: "Inverno consorcio",
};
const CROP_DISPLAY: Record<string, string> = {
  aveia_preta_ervilhaca: "Aveia-preta + Ervilhaca (mix)",
  centeio_nabo: "Centeio + Nabo forrageiro (mix)",
  brachiaria_ruziziensis: "Brachiaria ruziziensis",
  nabo_forrageiro: "Nabo forrageiro",
  aveia_preta: "Aveia-preta",
};
function formatCrop(name: string) {
  if (CROP_DISPLAY[name]) return CROP_DISPLAY[name];
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const AVAILABLE_CITIES = ["cruz alta"];

function isAvailableCity(name: string): boolean {
  return AVAILABLE_CITIES.includes(name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
}

/* ── Inline Producer Form ── */
type SeasonData = { summer: string; safrinha: string; winter: string; yield_result: string; problem: string };
const EMPTY_SEASON: SeasonData = { summer: "", safrinha: "", winter: "", yield_result: "", problem: "" };

function SelectField({
  id, label, value, onChange, options, error,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label htmlFor={id} className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <button
        id={id} type="button" onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-[12px] border px-3 py-2 text-sm outline-none transition-colors ${
          error && !value ? "border-destructive bg-destructive/5"
            : open ? "border-primary bg-muted" : "border-border bg-muted"
        }`}
      >
        <span className={value ? "text-foreground" : "text-stone-400"}>
          {selected?.label || "Selecione"}
        </span>
        <svg className={`h-4 w-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-[12px] border border-border bg-card shadow-lg">
          {options.filter((o) => o.value !== "").map((opt) => (
            <button
              key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                opt.value === value ? "font-medium text-primary" : "text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {error && !value && <p className="mt-1 text-xs text-destructive">Obrigatorio</p>}
    </div>
  );
}

function ProducerForm({ municipality, onComplete }: { municipality: string; onComplete: () => void }) {
  const thisYear = new Date().getFullYear();
  const labels = [`${thisYear - 1}/${thisYear}`, `${thisYear - 2}/${thisYear - 1}`];
  const [seasons, setSeasons] = useState<SeasonData[]>([{ ...EMPTY_SEASON }, { ...EMPTY_SEASON }]);
  const [soilCompacted, setSoilCompacted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fieldshift_produtor");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.seasons?.length === 2) setSeasons(data.seasons);
        setSoilCompacted(data.soil_compacted ?? false);
      }
    } catch { /* ignore */ }
  }, []);

  function update(i: number, field: keyof SeasonData, value: string) {
    setSeasons((prev) => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next; });
  }

  const isFormComplete = seasons.every(
    (s) => s.summer && s.safrinha && s.winter && s.yield_result && s.problem
  );

  function handleSubmit() {
    if (!isFormComplete) { setShowErrors(true); return; }
    const data = { seasons, soil_compacted: soilCompacted, saved_at: new Date().toISOString() };
    try { localStorage.setItem("fieldshift_produtor", JSON.stringify(data)); } catch { /* ignore */ }
    setShowErrors(false);
    onComplete();
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-5 px-4 py-10 sm:px-10">
      <div className="text-center">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Sobre sua lavoura</p>
        <h2 className="mt-2 text-[28px] font-light leading-tight tracking-[-0.02em] text-foreground sm:text-[32px]">
          Conte sobre {municipality}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Informe o que plantou nas 2 ultimas safras para recomendacoes personalizadas.
        </p>
      </div>

      {seasons.map((s, i) => (
        <div key={i} className="rounded-[24px] border border-border bg-card p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Safra {labels[i]}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField id={`summer-${i}`} label="Verao" value={s.summer} onChange={(v) => update(i, "summer", v)} options={SUMMER_CROPS} error={showErrors} />
            <SelectField id={`safrinha-${i}`} label="Safrinha" value={s.safrinha} onChange={(v) => update(i, "safrinha", v)} options={SAFRINHA_CROPS} error={showErrors} />
          </div>
          <SelectField id={`winter-${i}`} label="Inverno" value={s.winter} onChange={(v) => update(i, "winter", v)} options={WINTER_CROPS} error={showErrors} />
          <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-3">
            <SelectField id={`yield-${i}`} label="Resultado do verao" value={s.yield_result} onChange={(v) => update(i, "yield_result", v)} options={YIELD_RESULTS} error={showErrors} />
            <SelectField id={`problem-${i}`} label="Maior problema" value={s.problem} onChange={(v) => update(i, "problem", v)} options={PROBLEMS} error={showErrors} />
          </div>
        </div>
      ))}

      <div className="flex cursor-pointer items-center justify-between rounded-[24px] border border-border bg-card p-4" onClick={() => setSoilCompacted(!soilCompacted)}>
        <div>
          <p className="text-sm font-medium text-foreground">O solo esta compactado?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Se a agua empoca ou a raiz nao desce, pode estar compactado. Isso muda a recomendacao de cobertura.</p>
        </div>
        <button role="switch" aria-checked={soilCompacted} onClick={(e) => { e.stopPropagation(); setSoilCompacted(!soilCompacted); }}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${soilCompacted ? "bg-primary" : "bg-muted"}`}>
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${soilCompacted ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2">
        {showErrors && !isFormComplete && (
          <div className="w-full rounded-[16px] border border-destructive/30 bg-destructive/5 p-4 text-center">
            <p className="text-sm text-destructive">Preencha todos os campos antes de continuar.</p>
          </div>
        )}
        <button onClick={handleSubmit} className="h-11 w-full rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto sm:px-12">
          Ver meu relatorio
        </button>
      </div>
    </section>
  );
}

type AnalogData = {
  analog_years: { year: number; similarity_pct: number; matching_dimensions: string[]; diverging_dimensions: string[]; outcome: { yield_sc_ha: number | null; class: string; season_rain_mm: number; hot_days: number; enso: string } }[];
  projection: { expected_yield_range: [number, number]; weighted_yield: number; confidence: string; outlook: "favoravel" | "neutro" | "atencao" | "risco"; outlook_label: string; action: string; risk_factors: string[]; positive_factors: string[]; recommendation: string; pct_vs_avg: number };
};

function CityReport({ report, onYearChange }: { report: ReportData; onYearChange: (year: number) => void }) {
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [analogData, setAnalogData] = useState<AnalogData | null>(null);
  const [analogLoading, setAnalogLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);
  const [aiStrategies, setAiStrategies] = useState<any[] | null>(null);
  const [aiStrategiesLoading, setAiStrategiesLoading] = useState(false);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"rotacao" | "clima" | "riscos">("rotacao");

  useEffect(() => {
    if (!yearOpen) return;
    function close(e: MouseEvent) {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setYearOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [yearOpen]);

  const latestAvailableYear = report.years.length > 0 ? Math.max(...report.years) : null;

  useEffect(() => {
    if (!latestAvailableYear || report.loading) return;
    setAnalogLoading(true);
    fetch(`/api/patterns?year=${latestAvailableYear}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data && !data.error) setAnalogData(data); })
      .catch(() => {})
      .finally(() => setAnalogLoading(false));
  }, [latestAvailableYear, report.loading]);

  useEffect(() => {
    if (!report.selectedYear || report.loading) return;
    setAiStrategiesLoading(true);
    setAiStrategies(null);
    let producer = null;
    try {
      const raw = localStorage.getItem("fieldshift_produtor");
      if (raw) {
        const data = JSON.parse(raw);
        const s = data.seasons?.[0] ?? data.years?.[0];
        if (s) {
          producer = {
            summer: s.summer_crop ?? s.summer ?? "soja",
            safrinha: s.safrinha ?? "nenhuma",
            winter: s.winter_crop ?? s.winter ?? "pousio",
            yield_result: s.yield_result ?? "normal",
            problem: s.main_problem ?? s.problem ?? "nenhum",
            soil_compacted: !!data.soil_compacted,
          };
        }
      }
    } catch {}
    fetch("/api/rotation-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        municipality: `${report.municipality}, ${report.uf}`,
        climate: {
          avgTemp: report.avgTemp,
          avgRain: report.avgRain,
          yield: report.yearData?.yield,
        },
        producer,
        riskScore: report.riskScore,
        riskLabel: report.riskLabel,
        analogData,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.strategies) setAiStrategies(data.strategies);
      })
      .catch(() => {})
      .finally(() => setAiStrategiesLoading(false));
  }, [report.selectedYear, report.loading]);

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

  const verdictLine = report.riskScore
    ? report.riskScore >= 70
      ? `Safra de risco elevado (${report.riskLabel ? formatCrop(report.riskLabel) : "alto"}). Atencao redobrada no manejo.`
      : report.riskScore >= 40
      ? `Risco moderado. Planeje cobertura de inverno e monitore a previsao.`
      : `Risco baixo — boas condicoes para alta produtividade.`
    : `Dados climaticos em analise para esta safra.`;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4 px-4 py-10 sm:px-10">
      {/* ── Header ── */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
          {report.municipality}, {report.uf}
        </h2>
      </div>

      {/* ── Section tabs ── */}
      <div className="flex justify-center gap-1 rounded-full border border-border bg-muted p-1">
        {([["rotacao", "Rotacao"], ["clima", "Analise da Safra"], ["riscos", "Riscos"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "clima" && (<>
      {/* ── Year selector ── */}
      {report.years.length > 0 && (
        <div ref={yearRef} className="relative flex items-center justify-center gap-2">
          <label className="text-sm text-muted-foreground">Safra:</label>
          <button
            type="button"
            onClick={() => setYearOpen(!yearOpen)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold outline-none transition-colors ${yearOpen ? "border-primary bg-card" : "border-border bg-card"} text-foreground`}
          >
            {report.selectedYear}/{report.selectedYear + 1}
            <svg className={`h-3.5 w-3.5 text-stone-400 transition-transform ${yearOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {yearOpen && (
            <div className="absolute top-full z-20 mt-1 max-h-56 min-w-[140px] overflow-y-auto rounded-[12px] border border-border bg-card shadow-lg">
              {report.years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => { onYearChange(y); setYearOpen(false); }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-muted ${y === report.selectedYear ? "font-semibold text-primary" : "text-foreground"}`}
                >
                  {y}/{y + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ── Veredicto da safra (hero card) ── */}
      <div className="rounded-[24px] border border-primary bg-primary/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Veredicto da safra {report.selectedYear}/{(report.selectedYear ?? 0) + 1}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {report.yearData?.yield?.toFixed(1) ?? "—"} <span className="text-base font-normal text-muted-foreground">sc/ha</span>
            </p>
          </div>
          {report.riskScore != null && (
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
                report.riskScore >= 70 ? "bg-red-100" : report.riskScore >= 40 ? "bg-amber-100" : "bg-emerald-100"
              }`}>
                <span className={`text-lg font-bold tabular-nums ${
                  report.riskScore >= 70 ? "text-red-700" : report.riskScore >= 40 ? "text-amber-700" : "text-emerald-700"
                }`}>{report.riskScore}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">risco</p>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-foreground">{verdictLine}</p>
      </div>

      {/* ── Clima do ano (compact pills) ── */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-[16px] border border-border bg-card px-4 py-3 text-center">
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Temperatura</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-ember-600">{report.yearData?.temp?.toFixed(1) ?? report.avgTemp?.toFixed(1) ?? "—"}<span className="text-xs font-normal text-muted-foreground"> C</span></p>
        </div>
        <div className="flex-1 rounded-[16px] border border-border bg-card px-4 py-3 text-center">
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Chuva</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-rain-600">{report.yearData?.rain?.toFixed(0) ?? report.avgRain?.toFixed(0) ?? "—"}<span className="text-xs font-normal text-muted-foreground"> mm</span></p>
        </div>
        <div className="flex-1 rounded-[16px] border border-border bg-card px-4 py-3 text-center">
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Produtividade</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-leaf-600">{report.yearData?.yield?.toFixed(1) ?? "—"}<span className="text-xs font-normal text-muted-foreground"> sc/ha</span></p>
        </div>
      </div>

      {/* ── ENSO indicator ── */}
      {report.yearData?.enso && (() => {
        const enso = report.yearData!.enso!;
        const isElNino = enso.includes("el_nino");
        const isLaNina = enso.includes("la_nina");
        const intensity = enso.includes("forte") ? "Forte" : enso.includes("fraco") ? "Fraco" : enso.includes("moderado") ? "Moderado" : "";
        const label = isElNino ? "El Nino" : isLaNina ? "La Nina" : "Ano Neutro";
        const fullLabel = intensity ? `${label} (${intensity})` : label;
        const phase = isElNino ? report.ensoImpact?.el_nino
          : isLaNina ? report.ensoImpact?.la_nina
          : report.ensoImpact?.neutro;
        return (
          <div className="rounded-[16px] border border-border bg-card px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Fenomeno climatico {report.selectedYear}/{report.selectedYear + 1}</p>
                <p className={`mt-1 text-lg font-semibold ${isElNino ? "text-red-600" : isLaNina ? "text-blue-600" : "text-stone-500"}`}>
                  {fullLabel}
                </p>
              </div>
              {phase && (
                <div className="text-right">
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Media historica nesse fenomeno</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{phase.avg_yield_sc_ha?.toFixed(1) ?? "—"} <span className="text-xs font-normal text-muted-foreground">sc/ha em {phase.n_safras} safras</span></p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Projecao proxima safra ── */}
      {analogLoading && (
        <div className="rounded-[24px] border border-border bg-card p-6 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Calculando tendencia climatica...</p>
        </div>
      )}
      {analogData?.projection && !analogLoading && (() => {
        const proj = analogData.projection;
        const outlookColors = {
          favoravel: "border-emerald-200 bg-emerald-50/50",
          neutro: "border-border bg-card",
          atencao: "border-amber-200 bg-amber-50/50",
          risco: "border-red-200 bg-red-50/50",
        };
        const outlookTextColors = {
          favoravel: "text-emerald-700",
          neutro: "text-foreground",
          atencao: "text-amber-700",
          risco: "text-red-700",
        };
        const outlookBadgeColors = {
          favoravel: "bg-emerald-100 text-emerald-700",
          neutro: "bg-stone-100 text-stone-600",
          atencao: "bg-amber-100 text-amber-700",
          risco: "bg-red-100 text-red-700",
        };
        const nextSafra = `${(latestAvailableYear ?? report.selectedYear) + 1}/${(latestAvailableYear ?? report.selectedYear) + 2}`;
        return (
          <div className={`rounded-[24px] border p-5 space-y-4 ${outlookColors[proj.outlook]}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Tendencia para {nextSafra}</p>
                <p className={`mt-1 text-xl font-semibold ${outlookTextColors[proj.outlook]}`}>{proj.outlook_label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-semibold tabular-nums text-foreground">{proj.weighted_yield.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">sc/ha estimado</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${outlookBadgeColors[proj.outlook]}`}>
                {proj.pct_vs_avg > 0 ? "+" : ""}{proj.pct_vs_avg}% vs media
              </span>
              <span className="text-xs text-muted-foreground">
                Faixa provavel: {proj.expected_yield_range[0].toFixed(0)}-{proj.expected_yield_range[1].toFixed(0)} sc/ha
              </span>
            </div>

            <p className="text-sm text-foreground">{proj.action}</p>

            {(proj.risk_factors.length > 0 || proj.positive_factors.length > 0) && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border/50 pt-3">
                {proj.positive_factors.map((f, i) => (
                  <p key={`p${i}`} className="text-xs text-emerald-600">+ {f}</p>
                ))}
                {proj.risk_factors.map((f, i) => (
                  <p key={`r${i}`} className="text-xs text-red-600">- {f}</p>
                ))}
              </div>
            )}

            <details className="group">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                Anos com clima similar (base do calculo)
              </summary>
              <div className="mt-2 divide-y divide-border/50">
                {analogData.analog_years.slice(0, 5).map((ay) => (
                  <div key={ay.year} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-foreground">{ay.year}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        ay.similarity_pct >= 70 ? "bg-emerald-100 text-emerald-700"
                          : ay.similarity_pct >= 50 ? "bg-amber-100 text-amber-700"
                          : "bg-stone-100 text-stone-500"
                      }`}>
                        {ay.similarity_pct.toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-sm tabular-nums text-foreground">
                      {ay.outcome.yield_sc_ha?.toFixed(1) ?? "—"} <span className="text-xs font-normal text-muted-foreground">sc/ha</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Tendencia baseada nos ultimos 3 anos ({(latestAvailableYear ?? report.selectedYear) - 2}-{latestAvailableYear ?? report.selectedYear}) comparados com 44 anos de dados NASA
              </p>
            </details>
          </div>
        );
      })()}

      </>)}

      {activeTab === "rotacao" && (<>
      {/* ── Estrategias de rotacao ── */}
      <div>
        <div className="mb-3 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Sua estrategia</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Rotacao para {report.municipality}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {aiStrategies
              ? "Recomendacao por IA agronoma baseada em pesquisas da Embrapa"
              : "Baseado em 44 anos de dados climaticos"}
          </p>
        </div>

        {aiStrategiesLoading && (
          <div className="rounded-[24px] border border-border bg-card p-6 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">Super inteligencia analisando melhores rotacoes...</p>
          </div>
        )}

        {!aiStrategiesLoading && (aiStrategies || report.strategies.length > 0) && (
          <div className="space-y-4">
            {(aiStrategies || report.strategies).slice(0, 3).map((s: any, i: number) => {
              const isExpanded = expandedStrategy === i;
              const hasYears = s.years && s.years.length > 0;
              const allSequences = hasYears
                ? s.years.flatMap((y: any) => y.sequence || [])
                : s.sequence || [];
              const uniqueCrops: string[] = Array.from(new Set(allSequences.map((seq: any) => String(formatCrop(seq.crop)))));
              return (
                <div key={i} className={`relative rounded-[24px] border bg-card transition-shadow ${i === 0 ? "border-primary shadow-sm" : "border-border"} ${isExpanded ? "shadow-md" : "hover:shadow-md"}`}>
                  {i === 0 && (
                    <span className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground uppercase">Recomendada</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedStrategy(isExpanded ? null : i)}
                    className="w-full p-5 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xl font-semibold tabular-nums text-primary">{s.score ?? s.totalScore}</span>
                          <span className="block text-[10px] text-muted-foreground">/ 100</span>
                        </div>
                        <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {hasYears ? (
                        <>
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{s.years.length} anos</span>
                          {uniqueCrops.slice(0, 6).map((crop: string, j: number) => (
                            <span key={j} className="rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-medium text-primary">{crop}</span>
                          ))}
                        </>
                      ) : (
                        allSequences.map((seq: any, j: number) => (
                          <span key={j} className="rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {formatCrop(seq.crop)} <span className="text-stone-400">({seq.month_range || SEASON_LABEL[seq.season] || seq.season})</span>
                          </span>
                        ))
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border px-5 pb-5 pt-4 space-y-5">
                      {hasYears ? (
                        s.years.map((year: any, yi: number) => (
                          <div key={yi}>
                            <p className="text-[10px] font-semibold tracking-wide text-primary uppercase mb-2">{year.year_label}</p>
                            <MonthTimeline sequence={year.sequence || []} />
                            {(year.sequence || []).some((seq: any) => seq.reason) && (
                              <div className="mt-2 space-y-1">
                                {(year.sequence || []).map((seq: any, j: number) => (
                                  seq.reason && (
                                    <div key={j} className="flex gap-2">
                                      <span className="shrink-0 text-[11px] font-semibold text-primary">{formatCrop(seq.crop)}</span>
                                      <span className="text-[11px] text-muted-foreground">{seq.reason}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <>
                          <MonthTimeline sequence={allSequences} />
                          {allSequences.some((seq: any) => seq.reason) && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Por que cada cultura</p>
                              {allSequences.map((seq: any, j: number) => (
                                seq.reason && (
                                  <div key={j} className="flex gap-2">
                                    <span className="shrink-0 text-xs font-semibold text-primary">{formatCrop(seq.crop)}</span>
                                    <span className="text-xs text-muted-foreground">{seq.reason}</span>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {s.justificativa && (
                        <div>
                          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Justificativa</p>
                          <p className="mt-1 text-xs leading-relaxed text-foreground">{s.justificativa}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!aiStrategiesLoading && !aiStrategies && report.strategies.length === 0 && !report.rotation && (
          <div className="rounded-[24px] border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Culturas indicadas para a regiao:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {report.topCrops.map((c) => (
                <span key={c} className="rounded-full bg-forest-50 px-3 py-1 text-sm font-medium text-primary">{c}</span>
              ))}
            </div>
          </div>
        )}
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
      </>)}

      {activeTab === "riscos" && report.riskCalendar?.length === 12 && (
        <div className="rounded-[24px] border border-border bg-card p-6">
          <p className="text-sm font-semibold text-foreground">Calendario de riscos detalhado</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Frequencia de cada risco por mes nos ultimos 44 anos</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="py-2 px-2 text-left text-xs text-muted-foreground font-medium">Risco</th>
                  {MONTH_NAMES_SHORT.map((m) => (
                    <th key={m} className="py-2 px-1 text-center text-xs text-muted-foreground font-medium min-w-[44px]">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RISK_KEYS.map((key) => (
                  <tr key={key} className="border-t border-border">
                    <td className="py-2.5 px-2 text-xs text-muted-foreground font-medium whitespace-nowrap">{RISK_LABELS[key]}</td>
                    {report.riskCalendar.map((month, i) => (
                      <td key={i} className="py-2.5 px-1 text-center">
                        <span className={`inline-block w-full rounded py-0.5 px-0.5 text-[10px] font-semibold ${riskColor(month[key])}`}>
                          {riskText(month[key])}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-stone-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-100" /> Raro</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-100" /> As vezes</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-100" /> Frequente</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-100" /> Quase todo ano</span>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Link href="/mapa" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
          Abrir mapa
        </Link>
      </div>
    </section>
  );
}

/* ── Month Timeline Bar ── */
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MONTH_MAP: Record<string, number> = { jan:0, fev:1, mar:2, abr:3, mai:4, jun:5, jul:6, ago:7, set:8, out:9, nov:10, dez:11 };
const SEQ_COLORS = [
  "bg-emerald-600 text-white",
  "bg-amber-500 text-white",
  "bg-sky-600 text-white",
  "bg-violet-600 text-white",
];

function parseMonthRange(range: string): [number, number] | null {
  const parts = range.toLowerCase().split("-").map(s => s.trim());
  if (parts.length !== 2) return null;
  const start = MONTH_MAP[parts[0]];
  const end = MONTH_MAP[parts[1]];
  if (start === undefined || end === undefined) return null;
  return [start, end];
}

function MonthTimeline({ sequence }: { sequence: { crop: string; month_range?: string; season?: string }[] }) {
  const cells: { color: string; label: string }[] = Array.from({ length: 12 }, () => ({ color: "bg-stone-100", label: "" }));

  sequence.forEach((seq, idx) => {
    const range = seq.month_range ? parseMonthRange(seq.month_range) : null;
    if (!range) return;
    const [start, end] = range;
    const color = SEQ_COLORS[idx % SEQ_COLORS.length];
    const shortCrop = formatCrop(seq.crop).split(" ")[0];
    if (end >= start) {
      for (let m = start; m <= end; m++) cells[m] = { color, label: shortCrop };
    } else {
      for (let m = start; m < 12; m++) cells[m] = { color, label: shortCrop };
      for (let m = 0; m <= end; m++) cells[m] = { color, label: shortCrop };
    }
  });

  return (
    <div>
      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase mb-2">Ocupacao do solo — 12 meses</p>
      <div className="flex gap-0.5">
        {cells.map((cell, i) => (
          <div key={i} className="flex-1 min-w-0">
            <div className={`h-6 rounded-sm flex items-center justify-center ${cell.color}`}>
              <span className="text-[8px] font-semibold truncate px-0.5">{cell.label}</span>
            </div>
            <p className="mt-0.5 text-center text-[8px] text-muted-foreground">{MONTHS_SHORT[i]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Unavailable City Notice ── */
function UnavailableCity({ name, uf, onReset }: { name: string; uf: string; onReset: () => void }) {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-10">
      <div className="rounded-[24px] border border-border bg-card p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">{name}, {uf}</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Ainda nao disponivel para este municipio. No momento, apenas <strong className="text-foreground">Cruz Alta - RS</strong> esta liberada com dados completos de satelite.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Estamos expandindo para mais municipios em breve.
        </p>
        <button
          onClick={onReset}
          className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Buscar outro municipio
        </button>
      </div>
    </section>
  );
}

export default function HomeClient() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Municipality[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState<{ name: string; uf: string; lat: number; lon: number } | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [unavailableCity, setUnavailableCity] = useState<{ name: string; uf: string } | null>(null);
  const [showProducerForm, setShowProducerForm] = useState(false);
  const [producerDone, setProducerDone] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
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
        ensoImpact: data.ensoImpact ?? null,
        topCrops: data.topCrops ?? [],
        coverCrops: data.coverCrops ?? [],
        rotation: data.rotation,
        strategies: data.strategies ?? [],
        riskCalendar: data.riskCalendar ?? [],
        summary: data.summary ?? "",
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
        ensoImpact: null,
        topCrops: ["Soja", "Milho", "Trigo", "Aveia"],
        coverCrops: [],
        rotation: null,
        strategies: [],
        riskCalendar: [],
        summary: "",
      });
    }
  };

  const handleYearChange = (year: number) => {
    if (!report) return;
    setReport({ ...report, selectedYear: year, loading: true });
    fetchReport(report.municipality, report.uf, year);
  };

  const handleReset = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setShowCityDropdown(false);
    setSelectedCity(null);
    setReport(null);
    setUnavailableCity(null);
    setShowProducerForm(false);
    setProducerDone(false);
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

    if (!isAvailableCity(mun.nome)) {
      setUnavailableCity({ name: mun.nome, uf });
      setReport(null);
      setShowProducerForm(false);
      setProducerDone(false);
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
      return;
    }

    setUnavailableCity(null);
    setProducerDone(false);
    setReport(null);

    try {
      const res = await fetch("/api/report");
      const data = await res.json();
      setAvailableYears(data.years ?? []);
    } catch {
      const fallback = Array.from({ length: 45 }, (_, i) => new Date().getFullYear() - i);
      setAvailableYears(fallback);
    }

    setShowProducerForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const handleProducerComplete = () => {
    if (!selectedCity) return;
    setShowProducerForm(false);
    setProducerDone(true);
    const latestYear = availableYears[0] ?? new Date().getFullYear();
    setReport({
      municipality: selectedCity.name,
      uf: selectedCity.uf,
      loading: true,
      years: [],
      selectedYear: latestYear,
      riskScore: null,
      riskLabel: null,
      avgTemp: null,
      avgRain: null,
      yearData: null,
      ensoImpact: null,
      topCrops: [],
      coverCrops: [],
      rotation: null,
      strategies: [],
      riskCalendar: [],
      summary: "",
    });

    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);

    fetchReport(selectedCity.name, selectedCity.uf, latestYear);
  };

  return (
    <div className="flex flex-col">
      {/* ── HERO ORBIT ── */}
      <section
        data-theme="orbit"
        className="relative flex min-h-[62vh] flex-col items-center justify-center overflow-hidden"
        style={{ background: "radial-gradient(120% 90% at 0% 0%, rgba(70,154,92,0.55) 0%, rgba(11,26,16,0) 60%), #0B1A10" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(rgba(150,225,142,0.16) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

        {/* Satellite image inside globe — circular clip with radial fade */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[min(60vw,440px)] w-[min(60vw,440px)]">
            <div className="absolute inset-0 overflow-hidden rounded-full" style={{ maskImage: "radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0.6) 55%, transparent 72%)", WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0.6) 55%, transparent 72%)" }}>
              <Image
                src="/hero-satellite.jpg"
                alt="Sensoriamento remoto agricola por satelite"
                width={520}
                height={520}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-50">
          <GlobeScene />
        </div>

        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          <h1 className="text-[44px] font-light leading-[1.1] tracking-[-0.035em] text-stone-50 sm:text-[56px]">
            Adapte sua lavoura<br />com dados da NASA
          </h1>

          <div className="relative mt-8 w-full max-w-md">
            <button
              onClick={() => setShowCityDropdown((v) => !v)}
              className="flex w-full items-center rounded-full border border-stone-700 bg-forest-900/80 px-5 py-3 backdrop-blur-md transition-colors hover:bg-forest-800/80"
            >
              <svg className="mr-3 h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className={selectedCity ? "text-sm text-stone-100" : "text-sm text-stone-500"}>
                {selectedCity ? `${selectedCity.name}, ${selectedCity.uf}` : "Selecione seu municipio"}
              </span>
              <svg className="ml-auto h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCityDropdown && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[16px] border border-stone-700 bg-forest-900/95 shadow-xl backdrop-blur-lg">
                <button
                  onClick={() => {
                    setShowCityDropdown(false);
                    selectCity({ id: 4305108, nome: "Cruz Alta", microrregiao: { mesorregiao: { UF: { sigla: "RS" } } } } as Municipality);
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm text-stone-200 transition-colors hover:bg-forest-800/50"
                >
                  <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span>Cruz Alta</span>
                  <span className="ml-auto text-xs text-stone-500">RS</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── SATELITES PARCEIROS ── */}
      <section className="border-y border-border bg-shell py-8 overflow-hidden">
        <h2 className="text-center text-lg font-semibold tracking-[-0.01em] text-white sm:text-xl">
          Satélites Parceiros
        </h2>
        <div className="relative mt-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-shell to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-shell to-transparent" />
          <div className="flex animate-scroll gap-4">
            {[...DATA_PARTNERS, ...DATA_PARTNERS].map((name, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center justify-center rounded-[16px] border-2 border-black bg-[#165337] px-6 py-4 text-sm font-semibold text-white shadow-md"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNAVAILABLE CITY NOTICE ── */}
      {unavailableCity && (
        <div ref={reportRef} style={{ background: "#DCE8DD", color: "#151A17" }}>
          <UnavailableCity name={unavailableCity.name} uf={unavailableCity.uf} onReset={handleReset} />
        </div>
      )}

      {/* ── PRODUCER FORM (inline after city selection) ── */}
      {showProducerForm && selectedCity && !unavailableCity && (
        <div ref={formRef} style={{ background: "#DCE8DD", color: "#151A17" }}>
          <ProducerForm municipality={selectedCity.name} onComplete={handleProducerComplete} />
        </div>
      )}

      {/* ── CITY REPORT (appears after producer form) ── */}
      {report && producerDone && (
        <div ref={reportRef} style={{ background: "#DCE8DD", color: "#151A17" }}>
          <CityReport report={report} onYearChange={handleYearChange} />
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="bg-shell text-stone-400">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Image
                src="/brand/stella-root-lockup-horizontal-white.png"
                alt="Stella Root"
                width={140}
                height={28}
                className="h-7 w-auto"
              />
              <p className="mt-4 text-sm leading-relaxed">
                Inteligencia agricola baseada em 44 anos de dados da NASA para ajudar produtores a tomar decisoes melhores sobre rotacao de culturas e manejo do solo.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Plataforma</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/" className="transition-colors hover:text-white">Inicio</Link></li>
                <li><Link href="/mapa" className="transition-colors hover:text-white">Mapa interativo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Fontes de dados</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>NASA MODIS / ECOSTRESS</li>
                <li>Sentinel-2 (ESA)</li>
                <li>NASA GPM / SMAP</li>
                <li>SRTM / GRACE-FO</li>
                <li>MapBiomas / IBGE</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Sobre</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>NASA Space Apps Challenge 2026</li>
                <li>Cruz Alta, Rio Grande do Sul</li>
                <li>Dados abertos e gratuitos</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
            <p className="text-xs">Stella Root — NASA Space Apps 2026</p>
            <p className="text-xs">Dados de satelites publicos. Uso educacional e agricola.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

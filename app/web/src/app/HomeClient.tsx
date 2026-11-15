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
  yearData: { yield: number; rain: number; temp: number; spiDjf: number } | null;
  topCrops: string[];
  coverCrops: string[];
  rotation: { name: string; subtitle: string; scores: Record<string, number>; totalScore: number; sequence: { crop: string; season: string }[] } | null;
  strategies: { name: string; subtitle: string; totalScore: number; sequence: { crop: string; season: string }[] }[];
  riskCalendar: { dry_spell: number; heat: number; heavy_rain: number; frost: number }[];
  summary: string;
};

/* ── Producer Form Data ── */
const SUMMER_CROPS = [
  { value: "soja", label: "Soja" },
  { value: "milho", label: "Milho" },
  { value: "feijao", label: "Feijão" },
  { value: "outro", label: "Outro" },
  { value: "nenhum", label: "Nenhum" },
];

const SAFRINHA_CROPS = [
  { value: "milho_safrinha", label: "Milho safrinha" },
  { value: "sorgo", label: "Sorgo" },
  { value: "feijao", label: "Feijão" },
  { value: "girassol", label: "Girassol" },
  { value: "brachiaria", label: "Brachiaria (cobertura)" },
  { value: "crotalaria", label: "Crotalária (adubo verde)" },
  { value: "milheto", label: "Milheto (cobertura)" },
  { value: "pousio", label: "Não plantou safrinha" },
];

const WINTER_CROPS = [
  { value: "trigo", label: "Trigo" },
  { value: "aveia_preta", label: "Aveia-preta" },
  { value: "centeio", label: "Centeio" },
  { value: "ervilhaca", label: "Ervilhaca" },
  { value: "nabo_forrageiro", label: "Nabo forrageiro" },
  { value: "azevem", label: "Azevém" },
  { value: "canola", label: "Canola" },
  { value: "consorcio", label: "Consórcio (aveia + ervilhaca)" },
  { value: "pousio", label: "Pousio (não plantou nada)" },
  { value: "outro", label: "Outro" },
];

const YIELD_RESULTS = [
  { value: "boa", label: "Boa (acima da média)" },
  { value: "normal", label: "Normal" },
  { value: "ruim", label: "Ruim (abaixo da média)" },
  { value: "perda_total", label: "Perda total" },
];

const PROBLEMS = [
  { value: "nenhum", label: "Nenhum problema grave" },
  { value: "seca", label: "Seca / estiagem" },
  { value: "chuva_demais", label: "Excesso de chuva" },
  { value: "praga_doenca", label: "Praga ou doença" },
  { value: "nematoides", label: "Nematóides" },
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
const EMPTY_SEASON: SeasonData = { summer: "soja", safrinha: "pousio", winter: "pousio", yield_result: "normal", problem: "nenhum" };

function ProducerForm({ municipality, onComplete }: { municipality: string; onComplete: () => void }) {
  const thisYear = new Date().getFullYear();
  const labels = [`${thisYear - 1}/${thisYear}`, `${thisYear - 2}/${thisYear - 1}`];
  const [seasons, setSeasons] = useState<SeasonData[]>([{ ...EMPTY_SEASON }, { ...EMPTY_SEASON }]);
  const [soilCompacted, setSoilCompacted] = useState(false);

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

  function handleSubmit() {
    const data = { seasons, soil_compacted: soilCompacted, saved_at: new Date().toISOString() };
    try { localStorage.setItem("fieldshift_produtor", JSON.stringify(data)); } catch { /* ignore */ }
    onComplete();
  }

  const sel = "w-full appearance-none rounded-xl border border-border bg-muted px-4 py-2 text-sm text-foreground outline-none focus:border-primary";

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
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Verao</label>
            <select value={s.summer} onChange={(e) => update(i, "summer", e.target.value)} className={sel}>
              {SUMMER_CROPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Safrinha</label>
            <select value={s.safrinha} onChange={(e) => update(i, "safrinha", e.target.value)} className={sel}>
              {SAFRINHA_CROPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Inverno</label>
            <select value={s.winter} onChange={(e) => update(i, "winter", e.target.value)} className={sel}>
              {WINTER_CROPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="border-t border-border pt-3">
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado do verao</label>
            <select value={s.yield_result} onChange={(e) => update(i, "yield_result", e.target.value)} className={sel}>
              {YIELD_RESULTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Maior problema</label>
            <select value={s.problem} onChange={(e) => update(i, "problem", e.target.value)} className={sel}>
              {PROBLEMS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
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
        <button onClick={handleSubmit} className="h-11 w-full rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto sm:px-12">
          Ver meu relatorio
        </button>
        <button onClick={() => onComplete()} className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
          Pular — ver relatorio sem personalizar
        </button>
      </div>
    </section>
  );
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

      {report.summary && (
        <div className="rounded-[24px] border border-border bg-card p-6">
          <p className="text-sm leading-relaxed text-foreground">{report.summary}</p>
        </div>
      )}

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

      {/* ── Calendario de riscos ── */}
      {report.riskCalendar?.length === 12 && (
        <div className="rounded-[24px] border border-border bg-card p-6">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Calendário de riscos</p>
          <p className="mt-1 text-sm text-muted-foreground">De cada 10 anos, quantas vezes cada problema aconteceu em cada mês.</p>
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
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-100" /> Às vezes</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-100" /> Frequente</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-100" /> Quase todo ano</span>
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Escolha sua estrategia</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">3 planos de rotacao para {report.municipality}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Baseado em 44 anos de dados climaticos e regras agronomicas</p>
        </div>

        {report.strategies.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {report.strategies.slice(0, 3).map((s, i) => (
              <div key={i} className={`relative rounded-[24px] border bg-card p-6 transition-shadow hover:shadow-md ${i === 0 ? "border-primary shadow-sm" : "border-border"}`}>
                {i === 0 && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground uppercase">Recomendada</span>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground">{s.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-light tabular-nums text-primary">{s.totalScore}</span>
                    <span className="block text-[10px] text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.sequence.map((seq, j) => (
                    <span key={j} className="rounded-full bg-forest-50 px-3 py-1 text-xs font-medium text-primary">
                      {formatCrop(seq.crop)} <span className="text-stone-400">({SEASON_LABEL[seq.season] ?? seq.season})</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : report.rotation ? (
          <div className="rounded-[24px] border border-primary bg-card p-6 shadow-sm">
            <p className="text-base font-semibold text-foreground">{report.rotation.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{report.rotation.subtitle}</p>
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
          </div>
        ) : (
          <div className="rounded-[24px] border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Culturas indicadas para a regiao:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {report.topCrops.map((c) => (
                <span key={c} className="rounded-full bg-forest-50 px-3 py-1 text-sm font-medium text-primary">{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[24px] border border-border bg-card p-6">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Mix de cobertura recomendados</p>
        <p className="mt-2 text-sm text-muted-foreground">Combinacoes de plantas que equilibram palhada, nitrogenio e descompactacao:</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-sm font-semibold text-foreground">Aveia-preta + Ervilhaca</p>
            <p className="mt-1 text-xs text-muted-foreground">Graminea (palhada duradoura, C:N alta) + leguminosa (fixa 80-120 kg N/ha). O mix mais usado no Sul.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-sm font-semibold text-foreground">Centeio + Nabo forrageiro</p>
            <p className="mt-1 text-xs text-muted-foreground">Centeio resiste a geada forte (-8C) e gera palha. Nabo descompacta 20-40 cm e cicla nutrientes.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-sm font-semibold text-foreground">Aveia-preta + Ervilhaca + Nabo</p>
            <p className="mt-1 text-xs text-muted-foreground">Triplo mix: palhada + nitrogenio + descompactacao. Ideal para solos degradados ou compactados.</p>
          </div>
        </div>
        {report.coverCrops.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Plantas disponiveis na regiao</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {report.coverCrops.map((c) => (
                <span key={c} className="rounded-full bg-status-success-bg px-2.5 py-0.5 text-xs font-medium text-status-success">{c}</span>
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
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(rgba(150,225,142,0.16) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

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

        <div className="absolute inset-0 opacity-50">
          <GlobeScene />
        </div>

        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          <h1 className="text-[44px] font-light leading-[1.1] tracking-[-0.035em] text-stone-50 sm:text-[56px]">
            Adapte sua lavoura<br />com dados da NASA
          </h1>

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
                  onClick={handleReset}
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

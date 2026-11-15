"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const SUMMER_CROPS = [
  { value: "", label: "Selecione" },
  { value: "soja", label: "Soja" },
  { value: "milho", label: "Milho" },
  { value: "milheto", label: "Milheto" },
  { value: "outro", label: "Outro" },
];

const WINTER_CROPS = [
  { value: "", label: "Selecione" },
  { value: "pousio", label: "Pousio (nao plantou nada)" },
  { value: "aveia_preta", label: "Aveia preta" },
  { value: "ervilhaca", label: "Ervilhaca" },
  { value: "nabo_forrageiro", label: "Nabo forrageiro" },
  { value: "trigo", label: "Trigo" },
  { value: "azevem", label: "Azevem" },
  { value: "canola", label: "Canola" },
  { value: "outro", label: "Outro" },
];

const YIELD_RESULTS = [
  { value: "", label: "Selecione" },
  { value: "bom", label: "Boa (acima da media)" },
  { value: "normal", label: "Normal" },
  { value: "ruim", label: "Ruim (abaixo da media)" },
  { value: "perda_total", label: "Perda total" },
];

const PROBLEMS = [
  { value: "", label: "Selecione" },
  { value: "nenhum", label: "Nenhum problema grave" },
  { value: "seca", label: "Seca" },
  { value: "chuva_demais", label: "Chuva demais" },
  { value: "geada", label: "Geada" },
  { value: "praga_doenca", label: "Praga ou doenca" },
  { value: "solo_compactado", label: "Solo compactado" },
  { value: "erosao", label: "Erosao" },
];

type YearData = {
  label: string;
  summer_crop: string;
  winter_crop: string;
  yield_result: string;
  main_problem: string;
};

type ProducerData = {
  years: YearData[];
  has_cattle: boolean;
  soil_compacted: boolean;
  used_green_manure: boolean;
  saved_at: string;
};

const YEAR_LABELS = ["Ano 1 (mais recente)", "Ano 2"];

const DEFAULT_YEAR: YearData = {
  label: "",
  summer_crop: "",
  winter_crop: "",
  yield_result: "",
  main_problem: "",
};

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: boolean;
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
      <label htmlFor={id} className="mb-1 block text-xs text-muted-foreground">
        {label}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-[12px] border px-3 py-2 text-sm outline-none transition-colors ${
          error && !value
            ? "border-destructive bg-destructive/5"
            : open
              ? "border-primary bg-muted"
              : "border-border bg-muted"
        }`}
      >
        <span className={value ? "text-foreground" : "text-stone-400"}>
          {selected?.label || "Selecione"}
        </span>
        <svg
          className={`h-4 w-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-[12px] border border-border bg-card shadow-lg">
          {options
            .filter((o) => o.value !== "")
            .map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  opt.value === value
                    ? "font-medium text-primary"
                    : "text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
        </div>
      )}
      {error && !value && (
        <p className="mt-1 text-xs text-destructive">Obrigatorio</p>
      )}
    </div>
  );
}

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex cursor-pointer items-center justify-between rounded-[24px] border border-border bg-card p-4"
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function ProdutorPage() {
  const [yearsData, setYearsData] = useState<YearData[]>(
    YEAR_LABELS.map((label) => ({ ...DEFAULT_YEAR, label }))
  );
  const [hasCattle, setHasCattle] = useState(false);
  const [soilCompacted, setSoilCompacted] = useState(false);
  const [usedGreenManure, setUsedGreenManure] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fieldshift_produtor");
      if (raw) {
        const data: ProducerData = JSON.parse(raw);
        if (data.years?.length === 2) {
          setYearsData(data.years);
          setHasCattle(data.has_cattle);
          setSoilCompacted(data.soil_compacted);
          setUsedGreenManure(data.used_green_manure);
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  function updateYear(index: number, field: keyof YearData, value: string) {
    setYearsData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setSaved(false);
  }

  const isFormComplete = yearsData.every(
    (y) => y.summer_crop && y.winter_crop && y.yield_result && y.main_problem
  );

  function handleSave() {
    if (!isFormComplete) {
      setShowErrors(true);
      return;
    }
    const data: ProducerData = {
      years: yearsData,
      has_cattle: hasCattle,
      soil_compacted: soilCompacted,
      used_green_manure: usedGreenManure,
      saved_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem("fieldshift_produtor", JSON.stringify(data));
      setSaved(true);
      setShowErrors(false);
    } catch {
      // ignore
    }
  }

  if (!loaded) return null;

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
            Sua Lavoura
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Conte a historia da sua lavoura
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Responda sobre os últimos 2 anos. Isso ajuda a gente a recomendar o
            melhor manejo de inverno pra você.
          </p>
        </header>

        <div className="space-y-8">
          {yearsData.map((year, i) => (
            <section
              key={i}
              className="rounded-[24px] border border-border bg-card p-6"
            >
              <h2 className="mb-5 text-lg font-semibold text-foreground">
                {year.label}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  id={`summer-${i}`}
                  label="O que plantou no verao?"
                  value={year.summer_crop}
                  onChange={(v) => updateYear(i, "summer_crop", v)}
                  options={SUMMER_CROPS}
                  error={showErrors}
                />
                <SelectField
                  id={`winter-${i}`}
                  label="O que plantou no inverno?"
                  value={year.winter_crop}
                  onChange={(v) => updateYear(i, "winter_crop", v)}
                  options={WINTER_CROPS}
                  error={showErrors}
                />
                <SelectField
                  id={`yield-${i}`}
                  label="Como foi a safra de verao?"
                  value={year.yield_result}
                  onChange={(v) => updateYear(i, "yield_result", v)}
                  options={YIELD_RESULTS}
                  error={showErrors}
                />
                <SelectField
                  id={`problem-${i}`}
                  label="Qual foi o maior problema?"
                  value={year.main_problem}
                  onChange={(v) => updateYear(i, "main_problem", v)}
                  options={PROBLEMS}
                  error={showErrors}
                />
              </div>
            </section>
          ))}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Sobre a sua propriedade
            </h2>
            <Toggle
              id="cattle"
              label="Tem gado na propriedade?"
              description="Se sim, culturas que servem de pasto no inverno ganham prioridade"
              checked={hasCattle}
              onChange={(v) => {
                setHasCattle(v);
                setSaved(false);
              }}
            />
            <Toggle
              id="compaction"
              label="O solo está compactado?"
              description="Se a água empoça ou a raiz não desce, o solo pode estar compactado"
              checked={soilCompacted}
              onChange={(v) => {
                setSoilCompacted(v);
                setSaved(false);
              }}
            />
            <Toggle
              id="green-manure"
              label="Já usou adubo verde alguma vez?"
              description="Ervilhaca, crotalaria, nabo — qualquer planta pra melhorar o solo"
              checked={usedGreenManure}
              onChange={(v) => {
                setUsedGreenManure(v);
                setSaved(false);
              }}
            />
          </section>

          <div className="flex flex-col items-center gap-4 pt-4">
            {showErrors && !isFormComplete && (
              <div className="w-full rounded-[16px] border border-destructive/30 bg-destructive/5 p-4 text-center">
                <p className="text-sm text-destructive">
                  Preencha todos os campos antes de salvar.
                </p>
              </div>
            )}

            <button
              onClick={handleSave}
              className="h-11 w-full rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto sm:px-12"
            >
              Salvar meu historico
            </button>

            {saved && (
              <div className="w-full rounded-[24px] border border-status-success/30 bg-status-success-bg p-5 text-center">
                <p className="text-sm font-medium text-status-success">
                  Historico salvo com sucesso
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Agora a gente pode cruzar seus dados com 44 anos de clima e
                  recomendar o melhor manejo.
                </p>
                <Link
                  href="/recomendacao"
                  className="mt-4 inline-block h-11 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Ver minha recomendacao
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

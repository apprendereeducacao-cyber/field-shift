"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SUMMER_CROPS = [
  { value: "soja", label: "Soja" },
  { value: "milho", label: "Milho" },
  { value: "outro", label: "Outro" },
  { value: "nenhum", label: "Nenhum" },
];

const WINTER_CROPS = [
  { value: "trigo", label: "Trigo" },
  { value: "aveia_preta", label: "Aveia Preta" },
  { value: "ervilhaca", label: "Ervilhaca" },
  { value: "nabo_forrageiro", label: "Nabo Forrageiro" },
  { value: "azevem", label: "Azevem" },
  { value: "canola", label: "Canola" },
  { value: "pousio", label: "Pousio (nao plantou nada)" },
  { value: "outro", label: "Outro" },
];

const YIELD_RESULTS = [
  { value: "boa", label: "Boa (acima da media)" },
  { value: "normal", label: "Normal" },
  { value: "ruim", label: "Ruim (abaixo da media)" },
  { value: "perda_total", label: "Perda total" },
];

const PROBLEMS = [
  { value: "nenhum", label: "Nenhum problema grave" },
  { value: "seca", label: "Seca" },
  { value: "chuva_demais", label: "Chuva demais" },
  { value: "praga_doenca", label: "Praga ou doenca" },
  { value: "solo_compactado", label: "Solo compactado" },
  { value: "geada", label: "Geada" },
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
  summer_crop: "soja",
  winter_crop: "pousio",
  yield_result: "normal",
  main_problem: "nenhum",
};

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-text-secondary">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary-light"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
      className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-bg-surface p-4"
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-0.5 text-xs text-text-muted">{description}</p>
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
          checked ? "bg-primary-light" : "bg-bg-surface-alt"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-text-primary transition-transform ${
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

  function handleSave() {
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
    } catch {
      // ignore
    }
  }

  if (!loaded) return null;

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="text-sm font-medium tracking-wider text-primary-light uppercase">
            Sua Lavoura
          </p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">
            Conte a historia da sua lavoura
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary">
            Responda sobre os ultimos 2 anos. Isso ajuda a gente a recomendar o
            melhor manejo de inverno pra voce.
          </p>
        </header>

        <div className="space-y-8">
          {yearsData.map((year, i) => (
            <section
              key={i}
              className="rounded-xl border border-border bg-bg-surface p-6"
            >
              <h2 className="mb-5 text-lg font-semibold text-text-primary">
                {year.label}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  id={`summer-${i}`}
                  label="O que plantou no verao?"
                  value={year.summer_crop}
                  onChange={(v) => updateYear(i, "summer_crop", v)}
                  options={SUMMER_CROPS}
                />
                <SelectField
                  id={`winter-${i}`}
                  label="O que plantou no inverno?"
                  value={year.winter_crop}
                  onChange={(v) => updateYear(i, "winter_crop", v)}
                  options={WINTER_CROPS}
                />
                <SelectField
                  id={`yield-${i}`}
                  label="Como foi a safra de verao?"
                  value={year.yield_result}
                  onChange={(v) => updateYear(i, "yield_result", v)}
                  options={YIELD_RESULTS}
                />
                <SelectField
                  id={`problem-${i}`}
                  label="Qual foi o maior problema?"
                  value={year.main_problem}
                  onChange={(v) => updateYear(i, "main_problem", v)}
                  options={PROBLEMS}
                />
              </div>
            </section>
          ))}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary">
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
              label="O solo esta compactado?"
              description="Se a agua empoça ou a raiz nao desce, o solo pode estar compactado"
              checked={soilCompacted}
              onChange={(v) => {
                setSoilCompacted(v);
                setSaved(false);
              }}
            />
            <Toggle
              id="green-manure"
              label="Ja usou adubo verde alguma vez?"
              description="Ervilhaca, crotalaria, nabo — qualquer planta pra melhorar o solo"
              checked={usedGreenManure}
              onChange={(v) => {
                setUsedGreenManure(v);
                setSaved(false);
              }}
            />
          </section>

          <div className="flex flex-col items-center gap-4 pt-4">
            <button
              onClick={handleSave}
              className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-primary-light sm:w-auto sm:px-12"
            >
              Salvar meu historico
            </button>

            {saved && (
              <div className="w-full rounded-xl border border-primary/30 bg-primary/10 p-5 text-center">
                <p className="text-sm font-medium text-primary-light">
                  Historico salvo com sucesso
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Agora a gente pode cruzar seus dados com 44 anos de clima e
                  recomendar o melhor manejo.
                </p>
                <Link
                  href="/recomendacao"
                  className="mt-4 inline-block rounded-lg bg-accent px-6 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-light"
                >
                  Ver minha recomendacao
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-accent/20 bg-accent/5 p-5">
          <h3 className="text-sm font-semibold text-accent-light">
            Por que essas perguntas?
          </h3>
          <p className="mt-2 text-sm text-text-muted">
            Saber o que voce plantou, o que deu certo e o que deu errado nos
            ajuda a cruzar com os dados do satelite da NASA (44 anos de clima),
            as condicoes do solo e o historico de El Nino/La Nina. Assim a
            recomendacao e feita pra sua realidade, nao uma sugestao generica.
          </p>
        </div>
      </div>
    </div>
  );
}

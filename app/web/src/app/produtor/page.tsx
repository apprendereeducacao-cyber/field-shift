"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

const SUMMER_CROPS = [
  { value: "soja", en: "Soybean", label: "Soja" },
  { value: "milho", en: "Corn", label: "Milho" },
  { value: "outro", en: "Other", label: "Outro" },
  { value: "nenhum", en: "None", label: "Nenhum" },
];

const WINTER_CROPS = [
  { value: "trigo", en: "Wheat", label: "Trigo" },
  { value: "aveia_preta", en: "Black oat", label: "Aveia Preta" },
  { value: "ervilhaca", en: "Common vetch", label: "Ervilhaca" },
  { value: "nabo_forrageiro", en: "Forage radish", label: "Nabo Forrageiro" },
  { value: "azevem", en: "Ryegrass", label: "Azevem" },
  { value: "canola", en: "Canola", label: "Canola" },
  { value: "pousio", en: "Fallow (nothing planted)", label: "Pousio (não plantou nada)" },
  { value: "outro", en: "Other", label: "Outro" },
];

const YIELD_RESULTS = [
  { value: "boa", en: "Good (above average)", label: "Boa (acima da média)" },
  { value: "normal", en: "Normal", label: "Normal" },
  { value: "ruim", en: "Poor (below average)", label: "Ruim (abaixo da média)" },
  { value: "perda_total", en: "Total loss", label: "Perda total" },
];

const PROBLEMS = [
  { value: "nenhum", en: "No serious problem", label: "Nenhum problema grave" },
  { value: "seca", en: "Drought", label: "Seca" },
  { value: "chuva_demais", en: "Too much rain", label: "Chuva demais" },
  { value: "praga_doenca", en: "Pest or disease", label: "Praga ou doenca" },
  { value: "solo_compactado", en: "Compacted soil", label: "Solo compactado" },
  { value: "geada", en: "Frost", label: "Geada" },
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
const YEAR_LABELS_EN = ["Year 1 (most recent)", "Year 2"];

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
  options: { value: string; en: string; label: string }[];
}) {
  const { t } = useLang();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border bg-muted px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.en, opt.label)}
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
  const { t } = useLang();

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
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
            {t("Your Field", "Sua Lavoura")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            {t("Tell us your field's story", "Conte a historia da sua lavoura")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {t(
              "Answer about the last 2 years. This helps us recommend the best winter management for you.",
              "Responda sobre os últimos 2 anos. Isso ajuda a gente a recomendar o melhor manejo de inverno pra você.",
            )}
          </p>
        </header>

        <div className="space-y-8">
          {yearsData.map((year, i) => (
            <section
              key={i}
              className="rounded-[24px] border border-border bg-card p-6"
            >
              <h2 className="mb-5 text-lg font-semibold text-foreground">
                {t(YEAR_LABELS_EN[i] ?? year.label, year.label)}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  id={`summer-${i}`}
                  label={t("What did you plant in summer?", "O que plantou no verão?")}
                  value={year.summer_crop}
                  onChange={(v) => updateYear(i, "summer_crop", v)}
                  options={SUMMER_CROPS}
                />
                <SelectField
                  id={`winter-${i}`}
                  label={t("What did you plant in winter?", "O que plantou no inverno?")}
                  value={year.winter_crop}
                  onChange={(v) => updateYear(i, "winter_crop", v)}
                  options={WINTER_CROPS}
                />
                <SelectField
                  id={`yield-${i}`}
                  label={t("How was the summer harvest?", "Como foi a safra de verão?")}
                  value={year.yield_result}
                  onChange={(v) => updateYear(i, "yield_result", v)}
                  options={YIELD_RESULTS}
                />
                <SelectField
                  id={`problem-${i}`}
                  label={t("What was the main problem?", "Qual foi o maior problema?")}
                  value={year.main_problem}
                  onChange={(v) => updateYear(i, "main_problem", v)}
                  options={PROBLEMS}
                />
              </div>
            </section>
          ))}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {t("About your farm", "Sobre a sua propriedade")}
            </h2>
            <Toggle
              id="cattle"
              label={t("Do you have cattle on the farm?", "Tem gado na propriedade?")}
              description={t("If so, crops that work as winter pasture get priority", "Se sim, culturas que servem de pasto no inverno ganham prioridade")}
              checked={hasCattle}
              onChange={(v) => {
                setHasCattle(v);
                setSaved(false);
              }}
            />
            <Toggle
              id="compaction"
              label={t("Is the soil compacted?", "O solo está compactado?")}
              description={t("If water ponds or roots cannot go deep, the soil may be compacted", "Se a água empoça ou a raiz não desce, o solo pode estar compactado")}
              checked={soilCompacted}
              onChange={(v) => {
                setSoilCompacted(v);
                setSaved(false);
              }}
            />
            <Toggle
              id="green-manure"
              label={t("Have you ever used green manure?", "Já usou adubo verde alguma vez?")}
              description={t("Vetch, crotalaria, radish — any plant to improve the soil", "Ervilhaca, crotalaria, nabo — qualquer planta pra melhorar o solo")}
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
              className="h-11 w-full rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto sm:px-12"
            >
              {t("Save my history", "Salvar meu histórico")}
            </button>

            {saved && (
              <div className="w-full rounded-[24px] border border-status-success/30 bg-status-success-bg p-5 text-center">
                <p className="text-sm font-medium text-status-success">
                  {t("History saved", "Histórico salvo com sucesso")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(
                    "Now we can cross your data with 44 years of climate and recommend the best management.",
                    "Agora a gente pode cruzar seus dados com 44 anos de clima e recomendar o melhor manejo.",
                  )}
                </p>
                <Link
                  href="/recomendacao"
                  className="mt-4 inline-block h-11 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  {t("See my recommendation", "Ver minha recomendação")}
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

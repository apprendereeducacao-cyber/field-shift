"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  TimelineData,
  TimelineYear,
  SiteData,
  SoilData,
  Strategy,
  Crop,
} from "@/lib/types";

type YearEntry = {
  summer_crop: string;
  winter_crop: string;
  yield_result: string;
  main_problem: string;
};

type ProducerData = {
  years: YearEntry[];
  has_cattle: boolean;
  soil_compacted: boolean;
  used_green_manure: boolean;
};

type ScoredStrategy = {
  strategy: Strategy;
  baseScore: number;
  contextBonus: number;
  climateBonus: number;
  finalScore: number;
  reasons: string[];
};

const CROP_LABELS: Record<string, string> = {
  soja: "Soja",
  milho: "Milho",
  trigo: "Trigo",
  pousio: "Pousio (terra parada)",
  aveia_preta: "Aveia Preta",
  ervilhaca: "Ervilhaca",
  nabo_forrageiro: "Nabo Forrageiro",
  canola: "Canola",
  azevem: "Azevem",
  milheto: "Milheto",
  crotalaria: "Crotalaria",
};

const YIELD_LABELS: Record<string, string> = {
  bom: "Boa",
  normal: "Normal",
  ruim: "Ruim",
};

const PROBLEM_LABELS: Record<string, string> = {
  seca: "Seca",
  geada: "Geada",
  praga: "Pragas/doenças",
  solo_compactado: "Solo compactado",
  erosão: "Erosão",
  nenhum: "Nenhum problema grave",
};

const STRATEGY_COLORS: Record<string, string> = {
  baseline: "#E53935",
  conservative: "#1E88E5",
  adaptive: "#2D6A4F",
};

type Props = {
  timeline: TimelineData;
  site: SiteData;
  soil: SoilData;
  rotations: Strategy[];
  crops: Crop[];
  keyFindings: { data_years: number; [key: string]: any };
};

function getRecentClimate(timelineData: TimelineData) {
  const years = timelineData.timeline;
  const last5 = years.slice(-5);
  const last3 = years.slice(-3);
  const current = years[years.length - 1];

  const avgMoisture5 =
    last5.reduce((s, y) => s + (y.avg_soil_moisture ?? 0), 0) / last5.length;
  const avgMoistureAll =
    years.reduce((s, y) => s + (y.avg_soil_moisture ?? 0), 0) / years.length;
  const moistureTrend = ((avgMoisture5 - avgMoistureAll) / avgMoistureAll) * 100;

  const avgHotDays5 =
    last5.reduce((s, y) => s + y.hot_days, 0) / last5.length;
  const avgHotDaysAll =
    years.reduce((s, y) => s + y.hot_days, 0) / years.length;

  const avgRain3 =
    last3.reduce((s, y) => s + y.annual_rain_mm, 0) / last3.length;
  const avgRainAll =
    years.reduce((s, y) => s + y.annual_rain_mm, 0) / years.length;

  const hadRecentLaNina = last5.some((y) => y.enso.startsWith("la_nina"));
  const hadRecentElNino = last5.some((y) => y.enso.startsWith("el_nino"));

  const recentBadYields = last5.filter(
    (y) => y.yield_sc_ha !== null && y.yield_sc_ha! < 35
  );

  return {
    current,
    last3,
    last5,
    avgMoisture5,
    moistureTrend,
    avgHotDays5,
    avgHotDaysAll,
    avgRain3,
    avgRainAll,
    hadRecentLaNina,
    hadRecentElNino,
    recentBadYields,
  };
}

function scoreStrategies(
  rotations: Strategy[],
  timelineData: TimelineData,
  producer: ProducerData,
  climate: ReturnType<typeof getRecentClimate>
): ScoredStrategy[] {
  return rotations.map((strategy) => {
    let contextBonus = 0;
    let climateBonus = 0;
    const reasons: string[] = [];

    const allPousio = producer.years.every((y) => y.winter_crop === "pousio");
    const hadDrought = producer.years.some((y) => y.main_problem === "seca");
    const hadCompaction =
      producer.soil_compacted ||
      producer.years.some((y) => y.main_problem === "solo_compactado");
    const hadBadYield = producer.years.some((y) => y.yield_result === "ruim");

    if (strategy.id === "conservative") {
      if (allPousio) {
        contextBonus += 10;
        reasons.push(
          "O senhor deixou a terra parada nos dois invernos — a aveia+ervilhaca é a forma mais simples de começar a cobrir o solo"
        );
      }
      if (hadDrought) {
        contextBonus += 10;
        reasons.push(
          `Seca foi problema na sua lavoura. A palha da aveia segura umidade no solo — em anos secos a diferença aparece no enchimento do grão`
        );
      }
      if (producer.has_cattle) {
        contextBonus += 10;
        reasons.push(
          "Com gado na propriedade, a aveia vira forragem de inverno além de cobertura"
        );
      }
      if (!producer.used_green_manure) {
        contextBonus += 5;
        reasons.push(
          "Nunca usou adubo verde — a aveia+ervilhaca é o manejo mais simples pra começar"
        );
      }
      if (hadCompaction) {
        contextBonus += 5;
        reasons.push(
          "Tem problema de compactação — a aveia ajuda na camada superficial, mas o nabo (estratégia 3) faz mais efeito em profundidade"
        );
      }
    }

    if (strategy.id === "adaptive") {
      if (hadCompaction) {
        contextBonus += 15;
        reasons.push(
          `Solo compactado: a raiz do nabo forrageiro penetra até 2 metros e quebra camadas duras sem gastar com subsolador (economia de R$200-400/ha)`
        );
      }
      if (hadBadYield && hadDrought) {
        contextBonus += 10;
        reasons.push(
          "Produtividade ruim por seca — o trigo gera renda de inverno e amortece o prejuízo. Nabo melhora a retenção de água pro próximo verão"
        );
      }
      if (producer.has_cattle) {
        contextBonus += 5;
        reasons.push(
          "O nabo serve como forragem para o gado nos meses mais frios"
        );
      }
      if (!producer.used_green_manure) {
        contextBonus -= 5;
        reasons.push(
          "Nunca usou adubo verde — trigo+nabo exige mais manejo. Pode ser melhor começar com aveia+ervilhaca (estratégia 2) e migrar depois"
        );
      }
      if (allPousio) {
        contextBonus += 5;
        reasons.push(
          "Terra parada no inverno ha 2 anos — qualquer cobertura já melhora, é o trigo ainda gera renda"
        );
      }
    }

    if (strategy.id === "baseline") {
      if (allPousio && hadBadYield) {
        contextBonus -= 10;
        reasons.push(
          "Deixar parado mais um inverno depois de safra ruim agrava a situação do solo"
        );
      }
      if (hadDrought) {
        contextBonus -= 5;
        reasons.push(
          "Com problema de seca, solo sem cobertura perde ainda mais umidade"
        );
      }
      if (!allPousio) {
        reasons.push("Voltar pro pousio depois de ter usado cobertura é um retrocesso");
      }
    }

    if (strategy.id !== "baseline") {
      if (climate.moistureTrend < -2) {
        climateBonus += 5;
        reasons.push(
          `O satélite mostra que a umidade do solo caiu ${Math.abs(climate.moistureTrend).toFixed(1)}% nos últimos anos — cobertura de inverno ajuda a segurar água`
        );
      }
      if (climate.avgHotDays5 > climate.avgHotDaysAll * 1.1) {
        climateBonus += 5;
        reasons.push(
          `Média de ${climate.avgHotDays5.toFixed(0)} dias acima de 32 graus nos últimos 5 anos (média histórica: ${climate.avgHotDaysAll.toFixed(0)}) — solo coberto resiste melhor ao calor`
        );
      }
      if (climate.hadRecentLaNina) {
        climateBonus += 5;
        reasons.push(
          `Houve La Niña recente (menos chuva na safra: ${timelineData.enso_impact.la_nina.avg_season_rain_mm} mm contra ${timelineData.enso_impact.el_nino.avg_season_rain_mm} mm no El Niño). Cada gota retida conta`
        );
      }
      if (climate.recentBadYields.length >= 2) {
        climateBonus += 5;
        reasons.push(
          `${climate.recentBadYields.length} safras abaixo de 35 sc/ha nos últimos 5 anos — sinal de que o clima está testando a lavoura`
        );
      }
    }

    return {
      strategy,
      baseScore: strategy.total_score,
      contextBonus,
      climateBonus,
      finalScore: strategy.total_score + contextBonus + climateBonus,
      reasons,
    };
  });
}

const CALENDAR = [
  { month: "Abril", action: "Plantar a cultura de inverno (aveia, ervilhaca, trigo ou nabo conforme a estratégia escolhida)", color: "#2D6A4F" },
  { month: "Maio", action: "Cultura de inverno em desenvolvimento. Trigo: aplicar N se necessário", color: "#2D6A4F" },
  { month: "Junho", action: "Inverno pleno. Geada em 76% dos anos — aveia e nabo aguentam bem", color: "#1E88E5" },
  { month: "Julho", action: "Pico de geada (80% dos anos). Cultura de inverno protegendo o solo", color: "#1E88E5" },
  { month: "Agosto", action: "Fim do inverno. Trigo: acompanhar florada. Aveia: avaliar ponto de dessecação", color: "#42A5F5" },
  { month: "Setembro", action: "Dessecar cobertura de inverno (aveia/ervilhaca). Trigo: colheita comecando", color: "#FF8F00" },
  { month: "Outubro", action: "Plantio da soja sobre a palha. Solo coberto, umido, com N da ervilhaca", color: "#E65100" },
  { month: "Novembro", action: "Soja em desenvolvimento. Solo com palha retendo umidade do período critico", color: "#E65100" },
];

function HistorySummary({ producer }: { producer: ProducerData }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-text-primary">
        O que vimos na sua historia
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {producer.years.map((year, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-bg-surface p-4"
          >
            <p className="text-sm font-semibold text-text-primary">
              {i === 0 ? "Ano passado" : "2 anos atrás"}
            </p>
            <div className="mt-2 space-y-1 text-sm text-text-secondary">
              <p>
                Verão: {CROP_LABELS[year.summer_crop] ?? year.summer_crop} /
                Inverno: {CROP_LABELS[year.winter_crop] ?? year.winter_crop}
              </p>
              <p>Resultado: {YIELD_LABELS[year.yield_result] ?? year.yield_result}</p>
              <p>
                Principal problema:{" "}
                {PROBLEM_LABELS[year.main_problem] ?? year.main_problem}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-bg-surface-alt p-3">
          <p className="text-xs text-text-muted">Gado na propriedade</p>
          <p className="text-sm font-semibold text-text-primary">
            {producer.has_cattle ? "Sim" : "Não"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-bg-surface-alt p-3">
          <p className="text-xs text-text-muted">Solo compactado</p>
          <p className="text-sm font-semibold text-text-primary">
            {producer.soil_compacted ? "Sim" : "Não"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-bg-surface-alt p-3">
          <p className="text-xs text-text-muted">Já usou adubo verde</p>
          <p className="text-sm font-semibold text-text-primary">
            {producer.used_green_manure ? "Sim" : "Não"}
          </p>
        </div>
      </div>
    </section>
  );
}

function ClimateSummarySection({
  climate,
  site,
  timeline,
}: {
  climate: ReturnType<typeof getRecentClimate>;
  site: SiteData;
  timeline: TimelineData;
}) {
  const current = climate.current;
  const q1 = site.q1;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-text-primary">
        O que o clima está mostrando
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-muted">ENSO atual (2025)</p>
          <p className="text-xl font-bold text-text-primary">
            El Niño Fraco
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Histórico: El Niño traz mais chuva ({timeline.enso_impact.el_nino.avg_season_rain_mm} mm na safra)
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-muted">Umidade do solo (5 anos)</p>
          <p className="text-xl font-bold text-text-primary">
            {(climate.avgMoisture5 * 100).toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-warning-light">
            {climate.moistureTrend.toFixed(1)}% vs média histórica — solo secando
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-muted">Dias quentes (5 anos)</p>
          <p className="text-xl font-bold text-text-primary">
            {climate.avgHotDays5.toFixed(0)} dias/ano
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Média histórica: {climate.avgHotDaysAll.toFixed(0)} dias/ano
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-muted">Chuva média (3 anos)</p>
          <p className="text-xl font-bold text-text-primary">
            {Math.round(climate.avgRain3)} mm
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Média histórica: {q1 ? Math.round(q1.annual_rainfall_mm.mean) : "—"} mm
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-border bg-bg-surface-alt p-4">
        <p className="text-sm text-text-secondary">
          Últimos 3 anos:{" "}
          {climate.last3.map((y) => (
            <span key={y.year} className="mr-2">
              <span className="font-semibold text-text-primary">{y.year}</span>{" "}
              <span className="text-text-muted">
                ({y.yield_sc_ha} sc/ha, {y.annual_rain_mm} mm,{" "}
                {y.enso.replace(/_/g, " ")})
              </span>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

function SoilSummarySection({ soil }: { soil: SoilData }) {
  const topLayer = soil.layers[0];
  const interp = soil.interpretation;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-text-primary">
        Como está o solo da região
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-muted">Argila</p>
          <p className="text-xl font-bold text-text-primary">
            {topLayer.clay_pct}%
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Solo argiloso — segura água e nutriente, mas compacta facil
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-muted">pH</p>
          <p className="text-xl font-bold text-text-primary">
            {topLayer.ph}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {topLayer.ph < 5.5
              ? "Acido — pode precisar de calagem"
              : topLayer.ph <= 6.5
                ? "Bom pra soja e cobertura de inverno"
                : "Levemente alcalino"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-muted">Carbono orgânico</p>
          <p className="text-xl font-bold text-text-primary">
            {topLayer.organic_carbon_g_kg} g/kg
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {topLayer.organic_carbon_g_kg > 20
              ? "Bom nível — manter com cobertura"
              : "Pode melhorar com adubo verde"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-4">
          <p className="text-xs text-text-muted">Retenção de água</p>
          <p className="text-xl font-bold text-text-primary capitalize">
            {interp.water_holding === "high"
              ? "Alta"
              : interp.water_holding === "moderate"
                ? "Moderada"
                : "Baixa"}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Com cobertura de palha, a retenção melhora ainda mais
          </p>
        </div>
      </div>
    </section>
  );
}

function RecommendationSection({
  scored,
  producer,
}: {
  scored: ScoredStrategy[];
  producer: ProducerData;
}) {
  const sorted = [...scored].sort((a, b) => b.finalScore - a.finalScore);
  const best = sorted[0];
  const maxScore = Math.max(...sorted.map((s) => s.finalScore));

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-text-primary">
        Nossa recomendação
      </h2>

      <div className="mb-6 rounded-xl border-2 border-primary bg-primary/5 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-primary-light uppercase">
              Melhor opção para a sua situação
            </p>
            <h3 className="mt-1 text-2xl font-bold text-text-primary">
              {best.strategy.name}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {best.strategy.subtitle}
            </p>
          </div>
          <div className="rounded-lg bg-primary/20 px-3 py-1">
            <p className="text-2xl font-bold text-primary-light">
              {best.finalScore}
            </p>
            <p className="text-[10px] text-text-muted">pontos</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-text-primary">
            Por que essa opção é a melhor pra sua lavoura:
          </p>
          <ul className="space-y-2">
            {best.reasons.map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-text-secondary"
              >
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-light" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-lg bg-bg-surface p-4">
          <p className="text-xs text-text-muted">Detalhamento da pontuação</p>
          <div className="mt-2 flex gap-4 text-sm">
            <div>
              <span className="text-text-muted">Base: </span>
              <span className="font-semibold text-text-primary">
                {best.baseScore}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Sua situação: </span>
              <span className="font-semibold text-primary-light">
                +{best.contextBonus}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Clima recente: </span>
              <span className="font-semibold text-accent-light">
                +{best.climateBonus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-text-primary">
        Comparativo das 3 opções
      </h3>
      <div className="space-y-3">
        {sorted.map((s) => {
          const isBest = s.strategy.id === best.strategy.id;
          const pct = (s.finalScore / maxScore) * 100;
          return (
            <div
              key={s.strategy.id}
              className={`rounded-xl border p-4 ${
                isBest
                  ? "border-primary bg-primary/5"
                  : "border-border bg-bg-surface"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`font-semibold ${
                      isBest ? "text-primary-light" : "text-text-primary"
                    }`}
                  >
                    {s.strategy.name}
                    {isBest && (
                      <span className="ml-2 rounded bg-primary/20 px-2 py-0.5 text-xs text-primary-light">
                        Recomendado
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted">
                    {s.strategy.subtitle}
                  </p>
                </div>
                <p className="text-lg font-bold text-text-primary">
                  {s.finalScore}
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-surface-alt">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      STRATEGY_COLORS[s.strategy.id] ?? "#6B7280",
                  }}
                />
              </div>
              {!isBest && s.reasons.length > 0 && (
                <p className="mt-2 text-xs text-text-dim">
                  {s.reasons[0]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CalendarSection({ best }: { best: ScoredStrategy }) {
  const isAdaptive = best.strategy.id === "adaptive";

  const calendarItems = isAdaptive
    ? [
        { month: "Maio-Junho", action: "Plantar trigo. Temperatura de 12-15 graus e ideal. Geada não afeta", color: "#2D6A4F" },
        { month: "Julho-Agosto", action: "Trigo em desenvolvimento. Acompanhar geada tardia na florada", color: "#1E88E5" },
        { month: "Setembro", action: "Plantar nabo forrageiro nas entrelinhas ou após colheita do trigo", color: "#42A5F5" },
        { month: "Outubro", action: "Colher trigo (renda extra). Nabo crescendo e quebrando compactação", color: "#FF8F00" },
        { month: "Novembro", action: "Dessecar nabo. Plantar soja sobre palha do trigo + nabo", color: "#E65100" },
      ]
    : CALENDAR;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-text-primary">
        Calendário de ação
      </h2>
      <p className="mb-4 text-sm text-text-secondary">
        Meses-chave para a estratégia{" "}
        <span className="font-semibold text-text-primary">
          {best.strategy.name}
        </span>
      </p>
      <div className="space-y-2">
        {calendarItems.map((item) => (
          <div
            key={item.month}
            className="flex items-start gap-3 rounded-lg border border-border bg-bg-surface p-3"
          >
            <div
              className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {item.month}
              </p>
              <p className="text-sm text-text-secondary">{item.action}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NoDataState() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium tracking-wider text-accent-light uppercase">
          Recomendação
        </p>
        <h1 className="mt-2 text-3xl font-bold text-text-primary">
          Recomendação para sua lavoura
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-text-secondary">
          Para gerar uma recomendação personalizada, primeiro precisamos saber o
          que o senhor plantou nos últimos 2 anos e como foi o resultado.
        </p>
        <Link
          href="/produtor"
          className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-primary-light"
        >
          Preencher meu histórico
        </Link>
        <p className="mt-4 text-xs text-text-dim">
          Leva menos de 2 minutos. Seus dados ficam salvos no seu navegador.
        </p>
      </div>
    </div>
  );
}

export default function RecomendacaoClient({ timeline, site, soil, rotations, crops, keyFindings }: Props) {
  const [producer, setProducer] = useState<ProducerData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fieldshift_produtor");
      if (stored) {
        const parsed = JSON.parse(stored) as ProducerData;
        if (parsed.years && parsed.years.length > 0) {
          setProducer(parsed);
        }
      }
    } catch {
      // localStorage blocked or corrupt
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-text-muted">Carregando...</p>
      </div>
    );
  }

  if (!producer) {
    return <NoDataState />;
  }

  const climate = getRecentClimate(timeline);
  const scored = scoreStrategies(rotations, timeline, producer, climate);
  const sorted = [...scored].sort((a, b) => b.finalScore - a.finalScore);
  const best = sorted[0];

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10">
          <p className="text-sm font-medium tracking-wider text-accent-light uppercase">
            Recomendação Personalizada
          </p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">
            Recomendação para sua lavoura
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary">
            Cruzamos o seu histórico com {keyFindings.data_years} anos de dados
            de satélite da NASA, produtividade do IBGE, análise de solo do
            SoilGrids é o padrão El Niño/La Niña da NOAA para gerar essa
            recomendação.
          </p>
        </header>

        <HistorySummary producer={producer} />
        <ClimateSummarySection climate={climate} site={site} timeline={timeline} />
        <SoilSummarySection soil={soil} />
        <RecommendationSection scored={scored} producer={producer} />
        <CalendarSection best={best} />

        <section className="mb-8">
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
            <h3 className="text-sm font-semibold text-warning-light">
              Aviso importante
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Esta recomendação foi gerada por um algoritmo que cruza dados
              publicos de satélite, solo e clima. Ela serve como ponto de
              partida para a conversa com seu agronomo — que conhece sua terra,
              seu maquinario e sua realidade. Nenhuma ferramenta substitui o
              olho de quem pisa na lavoura.
            </p>
          </div>
        </section>

        <div className="flex gap-3">
          <Link
            href="/produtor"
            className="rounded-lg bg-bg-surface px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-surface-alt hover:text-text-primary"
          >
            Atualizar meu histórico
          </Link>
          <Link
            href="/rotacoes"
            className="rounded-lg bg-bg-surface px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-surface-alt hover:text-text-primary"
          >
            Ver detalhes das 3 estrategias
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { site, KEY_FINDINGS } from "@/lib/data";

const STATS = [
  {
    value: "44 safras",
    label: "de clima analisadas",
    detail: "Dados de satélite da NASA, de 1981 até 2025",
  },
  {
    value: "7 em 10",
    label: "vezes a chuva decidiu a safra",
    detail: "Quando choveu bem entre dezembro e fevereiro, a soja rendeu mais",
  },
  {
    value: "3 opções",
    label: "de manejo comparadas",
    detail: "Do pousio atual até sistemas com renda no inverno",
  },
];

const FEATURES = [
  {
    title: "Painel de Decisão",
    description:
      "Motor de risco com 44 anos de dados. Veja o cenário atual, o risco calculado, quais anos foram parecidos e qual manejo tem mais chance de dar certo.",
    href: "/painel",
    cta: "Ver o painel",
  },
  {
    title: "Sua Lavoura",
    description:
      "Conte o que plantou nos últimos 2 anos e receba uma recomendação de inverno baseada no seu histórico, no clima e no solo da região.",
    href: "/produtor",
    cta: "Receber recomendação",
  },
  {
    title: "Dados Científicos",
    description:
      "44 anos de clima, solo, NDVI, uso do solo e produtividade — tudo reunido em abas interativas com dados de satélite.",
    href: "/dados",
    cta: "Explorar os dados",
  },
  {
    title: "Mapa de Cruz Alta",
    description:
      "Relevo, temperatura, vegetação e uso do solo em camadas interativas sobre o mapa da região.",
    href: "/mapa",
    cta: "Ver o mapa",
  },
  {
    title: "A Ciência por Trás",
    description:
      "Metodologia, fontes de dados, validação satélite vs estação local, equipe e estratégias de manejo comparadas.",
    href: "/sobre",
    cta: "Ver a metodologia",
  },
];

const DATA_SOURCES = [
  {
    label: "NASA",
    name: "Satélite da NASA",
    description: "Chuva e temperatura medidas do espaço, todo dia, por 44 anos.",
  },
  {
    label: "IBGE",
    name: "Produção agrícola (IBGE)",
    description:
      "Quanto de soja Cruz Alta produziu por hectare, ano a ano, desde 1974.",
  },
  {
    label: "SOLO",
    name: "Análise do solo",
    description:
      "Tipo de terra, acidez, matéria orgânica e capacidade de guardar água.",
  },
  {
    label: "INMET",
    name: "Estação do tempo local",
    description:
      "Estação meteorológica automática de Cruz Alta, medindo desde 2007.",
  },
  {
    label: "MODIS",
    name: "Vegetação por satélite (NDVI)",
    description:
      "Índice de vegetação MODIS a cada 16 dias, 250m de resolução, desde 2000. Via Google Earth Engine.",
  },
  {
    label: "MAP",
    name: "MapBiomas",
    description:
      "Uso e cobertura do solo mapeados com Landsat (30m) de 1985 a 2023. Projeto INPE + universidades.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--primary-dark)_0%,_transparent_60%)] opacity-30" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-medium tracking-wider text-accent-light uppercase">
            {site.point.name}-{site.point.state}
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl">
            Sua lavoura pode render mais
            <br />
            <span className="text-primary-light">
              com o manejo certo no inverno
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
            Analisamos {KEY_FINDINGS.data_years} anos de clima em Cruz Alta para
            mostrar, com dados reais, o que funciona e o que coloca sua safra em
            risco.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/produtor"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
            >
              Receber recomendação pra minha lavoura
            </Link>
            <Link
              href="/dados"
              className="rounded-lg border border-border bg-bg-surface px-6 py-3 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-surface-alt hover:text-text-primary"
            >
              Explorar os dados
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-bg-surface px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-bg-base p-6 text-center"
            >
              <p className="text-3xl font-bold text-accent-light">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-text-secondary">
                {stat.label}
              </p>
              <p className="mt-1 text-xs text-text-dim">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-text-primary">
            O que você vai encontrar aqui
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="group rounded-xl border border-border bg-bg-surface p-6 transition-colors hover:border-primary/40"
              >
                <h3 className="text-lg font-semibold text-primary-light">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {f.description}
                </p>
                <p className="mt-3 text-xs font-medium text-accent-light group-hover:underline">
                  {f.cta}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 text-center sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold text-warning-light">
                {KEY_FINDINGS.productivity_old} → {KEY_FINDINGS.productivity_new}{" "}
                sc/ha
              </p>
              <p className="mt-1 text-xs text-text-muted">
                A soja rende mais hoje por causa de sementes melhores e manejo.
                Mas o clima tá piorando.
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">
                +{KEY_FINDINGS.hot_days_increase_pct}% de calor
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Mais dias acima de 32 graus do que 20 anos atrás. A soja sofre
                com esse calor.
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-light">
                {KEY_FINDINGS.bare_soil_months} meses parado
              </p>
              <p className="mt-1 text-xs text-text-muted">
                É o tempo que o solo fica sem nada plantado no sistema
                soja-pousio. Terra nua é terra perdendo valor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-bg-surface px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-text-primary">
            De onde vêm os dados
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            Tudo o que mostramos aqui vem de fontes públicas e verificáveis
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {DATA_SOURCES.map((source) => (
              <div
                key={source.name}
                className="flex items-start gap-4 rounded-lg border border-border bg-bg-base p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent-light">
                  {source.label}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {source.name}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {source.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-6 text-center">
            <p className="text-xs font-medium tracking-wider text-accent-light uppercase">
              NASA Space Apps Challenge 2026
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Field Shift: Adapting Farms with NASA Data. Uma ferramenta para
              ajudar o agricultor a tomar decisões usando dados de satélite.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { site, KEY_FINDINGS } from "@/lib/data";

const STATS = [
  {
    value: "44 safras",
    label: "de clima analisadas",
    detail: "Dados de satelite da NASA, de 1981 ate 2025",
  },
  {
    value: "7 em 10",
    label: "vezes a chuva decidiu a safra",
    detail: "Quando choveu bem entre dezembro e fevereiro, a soja rendeu mais",
  },
  {
    value: "3 opcoes",
    label: "de manejo comparadas",
    detail: "Do pousio atual ate sistemas com renda no inverno",
  },
];

const FEATURES = [
  {
    title: "Recomendacao personalizada",
    description:
      "Conte o que plantou nos ultimos 2 anos e receba uma recomendacao de inverno baseada no seu historico, no clima e no solo da regiao.",
    href: "/produtor",
    cta: "Comecar agora",
  },
  {
    title: "44 anos de historico climatico",
    description:
      "Temperatura, chuva, produtividade, umidade do solo e El Nino/La Nina — tudo em graficos interativos, ano a ano.",
    href: "/timeline",
    cta: "Ver historico",
  },
  {
    title: "Solo, terreno e fertilidade",
    description:
      "Tipo de solo, acidez, materia organica, topografia da regiao e o que fazer pra melhorar a fertilidade.",
    href: "/solo",
    cta: "Ver o solo",
  },
  {
    title: "Comparar opcoes de manejo",
    description:
      "Tres estrategias lado a lado: pousio, aveia+ervilhaca, ou trigo+nabo. Com numeros reais e evidencia de satelite.",
    href: "/rotacoes",
    cta: "Comparar opcoes",
  },
  {
    title: "Culturas de cobertura",
    description:
      "9 opcoes de inverno com materia seca, funcao no solo, epoca de semeadura e fontes cientificas. Dados da Embrapa e pesquisa.",
    href: "/coberturas",
    cta: "Ver as coberturas",
  },
  {
    title: "Vegetacao por satelite (NDVI)",
    description:
      "25 anos de indice de vegetacao MODIS — sazonalidade, tendencia e o que o verde revela sobre sua lavoura.",
    href: "/vegetacao",
    cta: "Ver o NDVI",
  },
  {
    title: "Uso do solo — 39 anos",
    description:
      "Como a terra mudou de 1985 a 2023. MapBiomas mostra a explosao da soja e o que sumiu no caminho.",
    href: "/uso-do-solo",
    cta: "Ver a transformacao",
  },
  {
    title: "Como e o clima aqui",
    description:
      "Riscos mes a mes: seca, calor, chuvarada e geada. Baseado em 44 anos de satelite da NASA.",
    href: "/diagnostico",
    cta: "Ver o clima",
  },
  {
    title: "De onde vem cada conclusao",
    description:
      "A metodologia cientifica por tras de cada numero. Validacao satelite vs estacao local, correlacoes, fontes de dados.",
    href: "/evidencia",
    cta: "Ver as provas",
  },
];

const DATA_SOURCES = [
  {
    label: "NASA",
    name: "Satelite da NASA",
    description: "Chuva e temperatura medidas do espaco, todo dia, por 44 anos.",
  },
  {
    label: "IBGE",
    name: "Producao agricola (IBGE)",
    description:
      "Quanto de soja Cruz Alta produziu por hectare, ano a ano, desde 1974.",
  },
  {
    label: "SOLO",
    name: "Analise do solo",
    description:
      "Tipo de terra, acidez, materia organica e capacidade de guardar agua.",
  },
  {
    label: "INMET",
    name: "Estacao do tempo local",
    description:
      "Estacao meteorologica automatica de Cruz Alta, medindo desde 2007.",
  },
  {
    label: "MODIS",
    name: "Vegetacao por satelite (NDVI)",
    description:
      "Indice de vegetacao MODIS a cada 16 dias, 250m de resolucao, desde 2000. Via Google Earth Engine.",
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
              Receber recomendacao pra minha lavoura
            </Link>
            <Link
              href="/timeline"
              className="rounded-lg border border-border bg-bg-surface px-6 py-3 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-surface-alt hover:text-text-primary"
            >
              Ver 44 anos de historico
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
            O que voce vai encontrar aqui
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
                Mas o clima ta piorando.
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">
                +{KEY_FINDINGS.hot_days_increase_pct}% de calor
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Mais dias acima de 32 graus do que 20 anos atras. A soja sofre
                com esse calor.
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-light">
                {KEY_FINDINGS.bare_soil_months} meses parado
              </p>
              <p className="mt-1 text-xs text-text-muted">
                E o tempo que o solo fica sem nada plantado no sistema
                soja-pousio. Terra nua e terra perdendo valor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-bg-surface px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-text-primary">
            De onde vem os dados
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            Tudo o que mostramos aqui vem de fontes publicas e verificaveis
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
              ajudar o agricultor a tomar decisoes usando dados de satelite.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

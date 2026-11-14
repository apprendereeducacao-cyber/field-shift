export default function SobrePage() {
  const TEAM = [
    { name: "Kaua", role: "Desenvolvedor, Agronomo e Estrategia" },
    { name: "Luis", role: "Design" },
    { name: "Joao", role: "Pesquisa de Dados" },
    { name: "James", role: "Pesquisa de Dados" },
    { name: "Victor", role: "Analise de Dados" },
    { name: "Otavio", role: "Analise de Dados" },
  ];

  const DATA_SOURCES = [
    {
      name: "NASA POWER",
      what: "Chuva e temperatura medidas do espaco, todo dia, por 44 anos (desde 1981).",
      tech: "POWER Daily v2.0 — PRECTOTCORR, T2M_MAX, T2M_MIN",
      url: "power.larc.nasa.gov",
    },
    {
      name: "IBGE",
      what: "Quanto de soja Cruz Alta produziu por hectare, ano a ano, desde 1974.",
      tech: "SIDRA Tabela 1612 — municipio 4306106 — soja em grao",
      url: "sidra.ibge.gov.br",
    },
    {
      name: "SoilGrids (ISRIC)",
      what: "Tipo de solo, acidez, materia organica, capacidade de segurar agua. Mapeado por satelite com resolucao de 250 metros.",
      tech: "SoilGrids v2.0 REST API — textura, pH, SOC, N, CTC, densidade",
      url: "soilgrids.org",
    },
    {
      name: "INMET",
      what: "Estacao meteorologica automatica de Cruz Alta, medindo desde 2007. Usada para conferir se os dados do satelite estao corretos.",
      tech: "Estacao A853 — dados horarios agregados em diarios",
      url: "portal.inmet.gov.br",
    },
    {
      name: "NOAA (El Nino/La Nina)",
      what: "Classificacao dos anos em El Nino, La Nina ou Neutro. Usado pra entender como o oceano Pacifico afeta o clima de Cruz Alta.",
      tech: "NOAA ONI — Oceanic Nino Index, classificacao por safra",
      url: "origin.cpc.ncep.noaa.gov",
    },
    {
      name: "Open-Meteo Elevation",
      what: "Altitude e relevo da regiao mapeados por radar. Mostra onde a agua acumula e onde o terreno e mais alto.",
      tech: "SRTM/Copernicus DEM via Open-Meteo API, resolucao 30m",
      url: "open-meteo.com",
    },
  ];

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12">
          <p className="text-sm font-medium tracking-wider text-accent-light uppercase">
            Sobre
          </p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">
            Field Shift
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary">
            Uma ferramenta para ajudar o agricultor a escolher o que plantar no
            inverno usando dados reais de satelite. Feita para o NASA Space Apps
            Challenge 2026.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            O desafio
          </h2>
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-6">
            <h3 className="text-lg font-semibold text-accent-light">
              Field Shift: Adapting Farms with NASA Data
            </h3>
            <p className="mt-3 text-sm text-text-secondary">
              A NASA pediu para criar uma ferramenta que ajude agricultores a
              explorar opcoes de rotacao de culturas usando dados de satelite
              combinados com informacoes de solo, clima e as necessidades de cada
              lavoura.
            </p>
            <p className="mt-3 text-sm text-text-secondary">
              Nossa resposta: escolhemos Cruz Alta-RS como caso real. Cruzamos 44
              anos de dados de satelite da NASA com a producao de soja do IBGE, o
              solo mapeado pelo SoilGrids e conferimos tudo com a estacao
              meteorologica local do INMET. O resultado e essa plataforma — feita
              para o produtor rural entender e tomar decisao.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            Quem fez
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="rounded-xl border border-border bg-bg-surface p-4"
              >
                <p className="font-semibold text-text-primary">
                  {member.name}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            De onde vem os dados
          </h2>
          <div className="space-y-4">
            {DATA_SOURCES.map((source) => (
              <div
                key={source.name}
                className="rounded-xl border border-border bg-bg-surface p-5"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-text-primary">
                    {source.name}
                  </h3>
                  <span className="text-xs text-text-dim">{source.url}</span>
                </div>
                <p className="mt-2 text-sm text-text-secondary">
                  {source.what}
                </p>
                <p className="mt-1 text-xs text-text-dim">
                  Tecnico: {source.tech}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            Aviso importante
          </h2>
          <div className="rounded-xl border border-border bg-bg-surface p-6">
            <p className="text-sm text-text-secondary">
              Esta ferramenta e um prototipo feito para o NASA Space Apps
              Challenge 2026. As sugestoes de rotacao de culturas sao baseadas em
              dados publicos e pesquisa agronomica, mas nao substituem a
              orientacao de um agronomo que conhece a sua terra.
            </p>
            <p className="mt-3 text-sm text-text-secondary">
              Os dados de satelite cobrem uma area de ~55km e podem nao refletir
              exatamente o que acontece na sua propriedade. Conferimos o satelite
              com a estacao local e a diferenca foi pequena (4%), mas sempre
              consulte um profissional antes de mudar o manejo.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

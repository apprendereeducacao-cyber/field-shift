import { site, KEY_FINDINGS, rotations } from "@/lib/data";

function windowLabel(name: string): string {
  const map: Record<string, string> = {
    "nov-mar": "Nov a Mar (safra toda)",
    "dez-fev": "Dez a Fev (enchimento do grão)",
    "jan-fev": "Jan e Fev",
    jan: "Só janeiro",
    fev: "Só fevereiro",
  };
  return map[name] || name;
}

function strengthText(r: number): string {
  if (r >= 0.6) return "Forte";
  if (r >= 0.4) return "Moderada";
  return "Fraca";
}

const STRATEGY_COLORS: Record<string, string> = {
  baseline: "border-text-dim",
  conservative: "border-primary-light",
  adaptive: "border-accent-light",
};

export default function SobrePage() {
  const windows = site.q6.windows;
  const pvs = site.q6.power_vs_station;

  const TEAM = [
    { name: "Kaua", role: "Desenvolvedor, Agrônomo e Estratégia" },
    { name: "Luis", role: "Design" },
    { name: "João", role: "Pesquisa de Dados" },
    { name: "James", role: "Pesquisa de Dados" },
    { name: "Victor", role: "Análise de Dados" },
    { name: "Otavio", role: "Análise de Dados" },
  ];

  const DATA_SOURCES = [
    {
      label: "NASA",
      name: "NASA POWER",
      what: "Chuva e temperatura medidas do espaço, todo dia, por 44 anos (desde 1981).",
      tech: "POWER Daily v2.0 — PRECTOTCORR, T2M_MAX, T2M_MIN",
    },
    {
      label: "IBGE",
      name: "Produção agrícola (IBGE)",
      what: "Quanto de soja Cruz Alta produziu por hectare, ano a ano, desde 1974.",
      tech: "SIDRA Tabela 1612 — município 4306106 — soja em grão",
    },
    {
      label: "SOLO",
      name: "SoilGrids (ISRIC)",
      what: "Tipo de solo, acidez, matéria orgânica, mapeado por satélite com resolução de 250m.",
      tech: "SoilGrids v2.0 REST API — textura, pH, SOC, N, CTC, densidade",
    },
    {
      label: "INMET",
      name: "Estação local",
      what: "Estação meteorológica automática de Cruz Alta, desde 2007. Usada para conferir o satélite.",
      tech: "Estação A853 — dados horários agregados em diários",
    },
    {
      label: "MODIS",
      name: "Vegetação (NDVI)",
      what: "Índice de vegetação a cada 16 dias, 250m de resolução, desde 2000. Via Google Earth Engine.",
      tech: "MOD13Q1 Collection 6.1 — NDVI + EVI",
    },
    {
      label: "MAP",
      name: "MapBiomas",
      what: "Uso e cobertura do solo de 1985 a 2023. Projeto INPE + universidades.",
      tech: "Collection 9 — Landsat 30m — buffer 5km",
    },
  ];

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12">
          <p className="text-sm font-medium tracking-wider text-accent-light uppercase">
            NASA Space Apps Challenge 2026
          </p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">
            Sobre o Field Shift
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary">
            Uma ferramenta para ajudar o agricultor a escolher o que plantar no
            inverno usando dados reais de satélite — feita para o produtor rural
            entender e tomar decisão.
          </p>
        </header>

        {/* O DESAFIO */}
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
              explorar opções de rotação de culturas usando dados de satélite
              combinados com informações de solo, clima e as necessidades de cada
              lavoura.
            </p>
            <p className="mt-3 text-sm text-text-secondary">
              Nossa resposta: escolhemos Cruz Alta-RS como caso real. Cruzamos 44
              anos de dados de satélite da NASA com a produção de soja do IBGE, o
              solo mapeado pelo SoilGrids e conferimos tudo com a estação
              meteorológica local do INMET.
            </p>
          </div>
        </section>

        {/* QUEM FEZ */}
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

        {/* FONTES DE DADOS */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            De onde vêm os dados
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {DATA_SOURCES.map((source) => (
              <div
                key={source.name}
                className="flex items-start gap-4 rounded-xl border border-border bg-bg-surface p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent-light">
                  {source.label}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {source.name}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">{source.what}</p>
                  <p className="mt-1 text-[10px] text-text-dim">
                    {source.tech}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CIENCIA POR TRAS */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            A ciência por trás
          </h2>

          <div className="mb-8">
            <h3 className="mb-4 text-sm font-semibold text-text-primary">
              Chuva e produtividade — qual época mais importa?
            </h3>
            <p className="mb-4 text-sm text-text-secondary">
              Tiramos a melhoria de tecnologia (+{KEY_FINDINGS.trend_kg_ha_year}{" "}
              kg/ha por ano) e cruzamos o que sobra com a chuva em diferentes
              épocas:
            </p>
            <div className="grid gap-3 sm:grid-cols-5">
              {windows.map((w, i) => (
                <div
                  key={w.name}
                  className={`rounded-xl border p-4 text-center ${
                    i <= 1
                      ? "border-accent bg-accent/5"
                      : "border-border bg-bg-surface"
                  }`}
                >
                  <p className="text-[10px] font-medium text-text-dim">
                    {windowLabel(w.name)}
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      i <= 1 ? "text-accent-light" : "text-text-secondary"
                    }`}
                  >
                    {w.r.toFixed(2)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-text-dim">
                    {strengthText(w.r)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-text-muted">
              Dezembro a fevereiro (0.63) é a época mais importante — é quando o
              grão está enchendo. Em 7 de cada 10 anos, quem teve chuva boa
              nessa época colheu mais.
            </p>
          </div>

          {pvs && (
            <div className="mb-8">
              <h3 className="mb-4 text-sm font-semibold text-text-primary">
                O satélite é confiável?
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-bg-surface p-4 text-center">
                  <p className="text-2xl font-bold text-primary-light">
                    {pvs.r.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Correlação satélite vs estação
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-bg-surface p-4 text-center">
                  <p className="text-2xl font-bold text-accent-light">
                    {pvs.bias_pct}%
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Diferença média
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-bg-surface p-4 text-center">
                  <p className="text-2xl font-bold text-text-secondary">
                    {pvs.n}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Safras comparadas
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted">
                O satélite e a estação concordam em quase tudo (0.89 de
                correlação, só 4% de diferença). Os dados são confiáveis.
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-4 text-sm font-semibold text-text-primary">
              Três conclusões principais
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-surface p-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent-light">
                  1
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Produtividade subiu{" "}
                    {KEY_FINDINGS.productivity_increase_pct}%, mas não por causa
                    do clima
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    De {KEY_FINDINGS.productivity_old} para{" "}
                    {KEY_FINDINGS.productivity_new} sc/ha. A tecnologia segurou.
                    O clima está piorando.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-surface p-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent-light">
                  2
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    As 5 piores safras: sempre{" "}
                    {KEY_FINDINGS.worst_seasons_pattern}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    A receita da quebra é a mesma: pouca chuva + calor forte
                    entre dezembro e fevereiro. Rotação ajuda a diminuir o dano.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-surface p-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent-light">
                  3
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {KEY_FINDINGS.bare_soil_months} meses de solo parado = risco
                    evitável
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    No sistema só-soja, a terra fica pelada de abril a setembro.
                    Sem cobertura, a enxurrada leva a terra boa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ESTRATEGIAS */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            Estratégias comparadas
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {rotations.map((s) => (
              <div
                key={s.id}
                className={`rounded-xl border-l-4 ${STRATEGY_COLORS[s.id] || "border-border"} border border-border bg-bg-surface p-5`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {s.name}
                  </h3>
                  <span className="text-lg font-bold text-primary-light">
                    {s.total_score}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">{s.subtitle}</p>
                <div className="mt-3 space-y-1">
                  {s.sequence.map((step, i) => (
                    <p key={i} className="text-[10px] text-text-dim">
                      {step.season}: {step.crop}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Pontuação de 0 a 100 somando: saúde do solo, proteção contra erosão,
            eficiência hídrica, resiliência climática, retorno econômico e
            biodiversidade.
          </p>
        </section>

        {/* AVISO */}
        <section>
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            Aviso importante
          </h2>
          <div className="rounded-xl border border-border bg-bg-surface p-6">
            <p className="text-sm text-text-secondary">
              Esta ferramenta é um protótipo feito para o NASA Space Apps
              Challenge 2026. As sugestões de rotação de culturas são baseadas em
              dados públicos e pesquisa agronômica, mas não substituem a
              orientação de um agrônomo que conhece a sua terra.
            </p>
            <p className="mt-3 text-sm text-text-secondary">
              Os dados de satélite cobrem uma área de ~55km e podem não refletir
              exatamente o que acontece na sua propriedade. Conferimos o satélite
              com a estação local e a diferença foi pequena (4%), mas sempre
              consulte um profissional antes de mudar o manejo.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

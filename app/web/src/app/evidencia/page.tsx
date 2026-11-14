import { site, KEY_FINDINGS } from "@/lib/data";

function windowLabel(name: string): string {
  const map: Record<string, string> = {
    "nov-mar": "Nov a Mar (safra toda)",
    "dez-fev": "Dez a Fev (enchimento do grao)",
    "jan-fev": "Jan e Fev",
    jan: "So janeiro",
    fev: "So fevereiro",
  };
  return map[name] || name;
}

function strengthText(r: number): string {
  if (r >= 0.6) return "Forte";
  if (r >= 0.4) return "Moderada";
  return "Fraca";
}

export default function EvidenciaPage() {
  const windows = site.q6.windows;
  const pvs = site.q6.power_vs_station;

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12">
          <p className="text-sm font-medium tracking-wider text-accent-light uppercase">
            Para quem quer ver os numeros
          </p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">
            De onde vem cada conclusao
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary">
            Aqui mostramos a ciencia por tras de tudo. Como cruzamos chuva com
            produtividade, como conferimos os dados do satelite com a estacao
            local, e o que os numeros dizem.
          </p>
        </header>

        <section className="mb-16">
          <h2 className="mb-4 text-xl font-bold text-text-primary">
            Chuva e produtividade — qual epoca mais importa?
          </h2>
          <p className="mb-6 max-w-3xl text-sm text-text-secondary">
            A soja rende mais a cada ano por causa de sementes melhores e
            tecnologia (+{KEY_FINDINGS.trend_kg_ha_year} kg/ha por ano). Para
            saber o efeito real do clima, tiramos essa melhoria e olhamos so o
            que sobra. Depois cruzamos com a chuva em diferentes epocas:
          </p>
          <div className="grid gap-4 sm:grid-cols-5">
            {windows.map((w, i) => (
              <div
                key={w.name}
                className={`rounded-xl border p-5 text-center ${
                  i <= 1
                    ? "border-accent bg-accent/5"
                    : "border-border bg-bg-surface"
                }`}
              >
                <p className="text-xs font-medium text-text-dim">
                  {windowLabel(w.name)}
                </p>
                <p
                  className={`mt-2 text-3xl font-bold ${
                    i <= 1 ? "text-accent-light" : "text-text-secondary"
                  }`}
                >
                  {w.r.toFixed(2)}
                </p>
                <p className="mt-1 text-[10px] text-text-dim">
                  {strengthText(w.r)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-text-muted">
            A epoca mais importante e dezembro a fevereiro (0.63) — e quando o
            grao esta enchendo. Em 7 de cada 10 anos, quem teve chuva boa nessa
            epoca colheu mais. Quem nao teve, perdeu.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            O que mudou em {KEY_FINDINGS.data_years} anos
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <p className="text-xs font-medium tracking-wider text-primary-light uppercase">
                Tecnologia melhorou a produtividade
              </p>
              <p className="mt-3 text-4xl font-bold text-text-primary">
                +{KEY_FINDINGS.trend_kg_ha_year} kg/ha/ano
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Em {KEY_FINDINGS.data_years} safras, sementes e manejo
                empurraram a produtividade pra cima. Mas o clima nao ajudou —
                atrapalhou. A tecnologia esta compensando, mas tem limite.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <p className="text-xs font-medium tracking-wider text-warning uppercase">
                O calor esta piorando
              </p>
              <p className="mt-3 text-4xl font-bold text-text-primary">
                +{KEY_FINDINGS.hot_days_increase_pct}%
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Comparando as primeiras 20 safras com as ultimas 20, o numero de
                dias acima de 32 graus aumentou{" "}
                {KEY_FINDINGS.hot_days_increase_pct}%. E esse calor que
                prejudica a soja na hora do grao.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            Tres conclusoes principais
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent-light">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    Produtividade subiu{" "}
                    {KEY_FINDINGS.productivity_increase_pct}%, mas nao por causa
                    do clima
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    De {KEY_FINDINGS.productivity_old} para{" "}
                    {KEY_FINDINGS.productivity_new} sacos por hectare. Quem
                    segurou foi a tecnologia. O clima esta piorando — e quem nao
                    se adaptar, vai sentir.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent-light">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    As 5 piores safras: sempre{" "}
                    {KEY_FINDINGS.worst_seasons_pattern}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Nenhuma safra ruim teve so um problema. A receita da quebra e
                    sempre a mesma: pouca chuva + calor forte entre dezembro e
                    fevereiro. Rotacao de culturas ajuda a diminuir esse dano.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent-light">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {KEY_FINDINGS.bare_soil_months} meses de solo parado = risco
                    que da pra evitar
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    No sistema so-soja, a terra fica pelada de abril a setembro.
                    Nesse periodo, chuvaradas fortes (50mm num dia) acontecem em
                    ate 4 de cada 10 anos. Sem cobertura, a enxurrada leva a
                    terra boa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            Os dados do satelite sao confiaveis?
          </h2>
          <div className="rounded-xl border border-border bg-bg-surface p-6">
            {pvs ? (
              <div>
                <p className="text-sm text-text-secondary mb-4">
                  Comparamos os dados do satelite da NASA com a estacao
                  meteorologica de Cruz Alta (INMET, desde 2007):
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="bg-bg-base rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary-light">
                      {pvs.r.toFixed(2)}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Correlacao satelite vs estacao
                    </div>
                    <div className="text-[10px] text-text-dim mt-1">
                      Acima de 0.80 e considerado excelente
                    </div>
                  </div>
                  <div className="bg-bg-base rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-accent-light">
                      {pvs.bias_pct}%
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Diferenca media entre os dois
                    </div>
                    <div className="text-[10px] text-text-dim mt-1">
                      So 4% de diferenca — muito proximo
                    </div>
                  </div>
                  <div className="bg-bg-base rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-text-secondary">
                      {pvs.n}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Safras comparadas
                    </div>
                    <div className="text-[10px] text-text-dim mt-1">
                      {pvs.missing_note}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-text-muted">
                  Resultado: o satelite e a estacao local concordam em quase tudo
                  (0.89 de correlacao, so 4% de diferenca). Os dados que usamos
                  nessa plataforma sao confiaveis.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-text-muted">
                  Validacao em andamento — comparando satelite NASA POWER com a
                  estacao INMET de Cruz Alta (A853).
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            El Nino e La Nina — o efeito no rendimento
          </h2>
          <p className="mb-6 max-w-3xl text-sm text-text-secondary">
            O oceano Pacifico influencia diretamente o clima de Cruz Alta. Em
            anos de El Nino, chove mais no Rio Grande do Sul — e a soja rende
            melhor. Em anos de La Nina, a chuva diminui e as quebras de safra
            aumentam. Veja os numeros reais de 45 safras:
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-6 text-center">
              <p className="text-xs font-medium tracking-wider text-warning uppercase">
                El Nino (19 safras)
              </p>
              <p className="mt-3 text-4xl font-bold text-text-primary">
                39.1 <span className="text-lg">sc/ha</span>
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                830 mm de chuva na safra
              </p>
              <p className="mt-1 text-xs text-text-dim">
                Mais chuva = melhor rendimento
              </p>
            </div>
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-6 text-center">
              <p className="text-xs font-medium tracking-wider text-sky-400 uppercase">
                La Nina (16 safras)
              </p>
              <p className="mt-3 text-4xl font-bold text-text-primary">
                37.0 <span className="text-lg">sc/ha</span>
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                622 mm de chuva na safra
              </p>
              <p className="mt-1 text-xs text-text-dim">
                Menos chuva = mais risco de seca
              </p>
            </div>
            <div className="rounded-xl border border-border bg-bg-surface p-6 text-center">
              <p className="text-xs font-medium tracking-wider text-text-muted uppercase">
                Neutro (10 safras)
              </p>
              <p className="mt-3 text-4xl font-bold text-text-primary">
                26.0 <span className="text-lg">sc/ha</span>
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Sem padrao definido de chuva
              </p>
              <p className="mt-1 text-xs text-text-dim">
                Menos safras no dataset — resultado menos estavel
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-text-muted">
            Conclusao: saber se o proximo ano sera de El Nino ou La Nina ajuda a
            escolher o manejo. Em anos de La Nina, manter cobertura no solo e
            usar culturas que seguram umidade (como aveia-preta) vira prioridade.
            Em El Nino, ha mais espaco pra arriscar com trigo ou canola.
          </p>
        </section>

        <section>
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            Fontes e metodologia
          </h2>
          <p className="mb-4 text-sm text-text-muted">
            Para os juizes da NASA e quem quiser conferir os detalhes tecnicos:
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <h3 className="font-semibold text-accent-light">
                Dados de clima
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li>NASA POWER v2.0 — dados diarios por satelite</li>
                <li>Chuva corrigida (PRECTOTCORR), temperatura max e min</li>
                <li>
                  Periodo: {KEY_FINDINGS.data_start}-{KEY_FINDINGS.data_end}
                </li>
                <li>Resolucao: ~55km por pixel</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <h3 className="font-semibold text-accent-light">
                Dados de producao
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li>IBGE SIDRA — Tabela 1612</li>
                <li>Municipio: Cruz Alta-RS (cod. 4306106)</li>
                <li>Soja em grao — kg/ha por ano</li>
                <li>Periodo: 1974 a 2025 (52 anos)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <h3 className="font-semibold text-accent-light">
                Como analisamos
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li>Correlacao de Pearson entre chuva e produtividade</li>
                <li>
                  Removemos a tendencia de tecnologia (detrending linear)
                </li>
                <li>
                  Safra = 1 nov a 31 mar (pelo ano da colheita)
                </li>
                <li>Seca = 10+ dias sem chuva entre dez-fev</li>
                <li>Calor = dias com maxima acima de 32 graus</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <h3 className="font-semibold text-accent-light">Dados de solo</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li>SoilGrids v2.0 (ISRIC) — mapeamento por satelite</li>
                <li>Profundidades: 0-5cm, 5-15cm, 15-30cm</li>
                <li>
                  Textura, pH, carbono, nitrogenio, CTC, densidade
                </li>
                <li>Resolucao: 250m por pixel</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <h3 className="font-semibold text-accent-light">
                El Nino / La Nina
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li>NOAA ONI — Oceanic Nino Index</li>
                <li>Classificacao por safra: El Nino, La Nina ou Neutro</li>
                <li>68 classificacoes de 1981 a 2025</li>
                <li>Cruzado com produtividade e chuva de Cruz Alta</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-bg-surface p-6">
              <h3 className="font-semibold text-accent-light">
                Topografia
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li>Open-Meteo Elevation API</li>
                <li>Dados SRTM / Copernicus DEM</li>
                <li>25 pontos em grade 5x5 ao redor de Cruz Alta</li>
                <li>Resolucao: 30m por pixel</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

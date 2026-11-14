import { ndvi, MONTH_NAMES } from "@/lib/data";

const s = ndvi.summary;

const STAT_CARDS = [
  {
    label: "NDVI medio",
    value: s.overall_mean.toFixed(2),
    detail: "Media geral 2000-2025, qualidade boa",
    color: "text-primary-light",
  },
  {
    label: "NDVI safra (Out-Mar)",
    value: s.growing_season_mean?.toFixed(2) ?? "—",
    detail: "Media na epoca de crescimento da soja",
    color: "text-accent-light",
  },
  {
    label: "Amplitude",
    value: `${s.overall_min.toFixed(2)} — ${s.overall_max.toFixed(2)}`,
    detail: "Minimo e maximo observados em 25 anos",
    color: "text-warning-light",
  },
  {
    label: "Observacoes",
    value: s.n_good_quality.toLocaleString("pt-BR"),
    detail: `${s.n_total_records} totais, ${s.n_good_quality} com qualidade boa`,
    color: "text-text-secondary",
  },
];

function NdviBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  const green = Math.round(value * 255);
  const red = Math.round((1 - value) * 180);
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-bg-surface-alt">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: `rgb(${red}, ${green}, 60)`,
          }}
        />
      </div>
      <span className="w-12 text-right text-xs font-mono text-text-secondary">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

export default function VegetacaoPage() {
  const maxNdvi = Math.max(...ndvi.monthly_averages.map((m) => m.avg_ndvi));
  const maxAnnual = Math.max(...ndvi.annual_averages.map((a) => a.avg_ndvi));
  const minAnnual = Math.min(...ndvi.annual_averages.map((a) => a.avg_ndvi));
  const annualRange = maxAnnual - minAnnual || 0.01;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Vegetacao por Satelite
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Indice de vegetacao (NDVI) medido pelo satelite MODIS a cada 16 dias,
          resolucao 250m. {s.years_covered}, {s.n_good_quality} medicoes com
          qualidade verificada.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-bg-surface p-5"
          >
            <p className="text-xs font-medium tracking-wider text-text-dim uppercase">
              {card.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
            <p className="mt-1 text-xs text-text-muted">{card.detail}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-semibold text-text-primary">
          NDVI medio por mes
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Fevereiro tem o maior NDVI — e o pico da soja. Junho-agosto cai por
          causa do inverno e solo exposto.
        </p>
        <div className="mt-4 space-y-2">
          {ndvi.monthly_averages.map((m) => (
            <div key={m.month} className="grid grid-cols-[3rem_1fr] items-center gap-3">
              <span className="text-xs font-medium text-text-secondary">
                {m.name}
              </span>
              <NdviBar value={m.avg_ndvi} max={maxNdvi * 1.05} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-text-dim">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "rgb(40, 190, 60)" }} />
          <span>Verde forte = vegetacao densa</span>
          <div className="ml-4 h-3 w-3 rounded-full" style={{ backgroundColor: "rgb(160, 100, 60)" }} />
          <span>Amarelo/marrom = solo exposto ou vegetacao rala</span>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-primary">
          Evolucao anual do NDVI
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          NDVI medio e NDVI da safra (Out-Mar) ano a ano. Variacao reflete
          condicoes climaticas e manejo.
        </p>
        <div className="mt-4 overflow-x-auto">
          <div className="flex items-end gap-[3px]" style={{ minWidth: "600px", height: "200px" }}>
            {ndvi.annual_averages.map((a) => {
              const h = Math.round(((a.avg_ndvi - minAnnual) / annualRange) * 160 + 20);
              const gh = a.growing_season_ndvi
                ? Math.round(((a.growing_season_ndvi - minAnnual) / annualRange) * 160 + 20)
                : 0;
              return (
                <div
                  key={a.year}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                  style={{ height: "200px" }}
                >
                  <div className="absolute -top-6 hidden rounded bg-bg-surface-alt px-2 py-1 text-[10px] text-text-secondary shadow-lg group-hover:block">
                    {a.year}: {a.avg_ndvi.toFixed(3)}
                    {a.growing_season_ndvi && (
                      <> | safra: {a.growing_season_ndvi.toFixed(3)}</>
                    )}
                  </div>
                  {a.growing_season_ndvi && gh > 0 && (
                    <div
                      className="absolute bottom-0 w-full rounded-t opacity-30"
                      style={{
                        height: `${gh}px`,
                        backgroundColor: "#1E88E5",
                      }}
                    />
                  )}
                  <div
                    className="relative w-full rounded-t bg-primary transition-all group-hover:bg-primary-light"
                    style={{ height: `${h}px` }}
                  />
                  {a.year % 5 === 0 && (
                    <span className="mt-1 text-[9px] text-text-dim">
                      {a.year}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-text-dim">
          <div className="flex items-center gap-1">
            <div className="h-3 w-6 rounded bg-primary" />
            <span>NDVI medio anual</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-6 rounded bg-accent/30" />
            <span>NDVI safra (Out-Mar)</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-primary">
          O que o NDVI mostra pro agricultor
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="text-sm font-semibold text-primary-light">
              Fevereiro e o mes mais verde
            </p>
            <p className="mt-2 text-xs text-text-muted">
              NDVI de {ndvi.monthly_averages.find((m) => m.month === 2)?.avg_ndvi.toFixed(2) ?? "0.75"} em
              fevereiro — pico da biomassa da soja. Quando esse valor cai muito
              num ano especifico, e sinal de estresse hidrico ou termico.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="text-sm font-semibold text-warning-light">
              Inverno revela o manejo
            </p>
            <p className="mt-2 text-xs text-text-muted">
              NDVI de {ndvi.monthly_averages.find((m) => m.month === 7)?.avg_ndvi.toFixed(2) ?? "0.40"} em
              julho. Quem planta cobertura de inverno mantem NDVI mais alto.
              Solo nu fica abaixo de 0.30.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="text-sm font-semibold text-accent-light">
              EVI complementa o NDVI
            </p>
            <p className="mt-2 text-xs text-text-muted">
              EVI (Enhanced Vegetation Index) e mais sensivel em areas de
              vegetacao densa. Usamos os dois pra confirmar padroes.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="text-sm font-semibold text-text-secondary">
              25 anos de monitoramento
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Dados consistentes com a plataforma SATVeg da Embrapa, que usa a
              mesma base MODIS. {s.n_good_quality} medicoes com qualidade
              verificada pelo controle de qualidade do sensor.
            </p>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-border bg-bg-surface p-4 text-xs text-text-dim">
        <p>
          <strong>Fonte:</strong> {ndvi.source} | Resolucao: {ndvi.resolution} |
          Periodo: {ndvi.period}
        </p>
        <p className="mt-1">
          Validacao cruzada: Embrapa SATVeg (satveg.cnptia.embrapa.br) —
          mesma base de dados MODIS, plataforma brasileira de referencia.
        </p>
      </div>
    </div>
  );
}

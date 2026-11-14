import { site, MONTH_NAMES, KEY_FINDINGS } from "@/lib/data";

const RISK_KEYS = ["dry_spell", "heat", "heavy_rain", "frost"] as const;

const RISK_LABELS: Record<(typeof RISK_KEYS)[number], string> = {
  dry_spell: "Seca longa",
  heat: "Calor forte",
  heavy_rain: "Chuvarada",
  frost: "Geada",
};

const RISK_EXPLANATIONS: Record<(typeof RISK_KEYS)[number], string> = {
  dry_spell:
    "Quando fica mais de 10 dias seguidos sem chover. A planta sofre, especialmente se for na hora que a soja esta florando ou enchendo grao.",
  heat: "Quando faz mais de 32 graus por 5 dias seguidos. A soja nao consegue se desenvolver direito nesse calor — a flor cai e o grao nao enche.",
  heavy_rain:
    "Quando cai mais de 50mm num dia so. Leva terra embora, alaga a lavoura e deita a planta.",
  frost:
    "Quando a temperatura cai abaixo de 2 graus. Queima a planta. Mas e bom pra quem planta aveia ou trigo no inverno — essas aguentam.",
};

function riskText(value: number): string {
  const pct = Math.round(value * 100);
  if (pct === 0) return "-";
  const de10 = Math.round(value * 10);
  if (de10 <= 2) return `${de10} em 10`;
  return `${de10} em 10`;
}

function riskColor(value: number): string {
  if (value <= 0.2) return "bg-emerald-900/60 text-emerald-300";
  if (value <= 0.5) return "bg-yellow-900/60 text-yellow-300";
  if (value <= 0.75) return "bg-orange-900/60 text-orange-300";
  return "bg-red-900/60 text-red-300";
}

export default function DiagnosticoPage() {
  const months = site.q2.months;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-white">
          Como e o clima na sua regiao
        </h1>
        <p className="mt-2 text-text-secondary">
          {site.point.name}-{site.point.state} — O que {KEY_FINDINGS.data_years}{" "}
          anos de medicao por satelite mostram sobre os riscos para a lavoura,
          mes a mes.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-white mb-2">
          Calendario de riscos — mes a mes
        </h2>
        <p className="text-text-muted text-sm mb-6">
          De cada 10 anos, quantas vezes cada problema aconteceu em cada mes.
          Quanto mais vermelho, mais vezes aconteceu.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-text-muted font-medium">
                  Risco
                </th>
                {MONTH_NAMES.map((m) => (
                  <th
                    key={m}
                    className="py-2 px-2 text-center text-text-muted font-medium min-w-[52px]"
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISK_KEYS.map((key) => (
                <tr key={key} className="border-t border-border">
                  <td className="py-3 px-3 text-text-secondary font-medium whitespace-nowrap">
                    {RISK_LABELS[key]}
                  </td>
                  {months.map((month, i) => {
                    const val = month[key];
                    return (
                      <td key={i} className="py-3 px-2 text-center">
                        <span
                          className={`inline-block w-full py-1 px-1 rounded text-xs font-semibold ${riskColor(val)}`}
                        >
                          {riskText(val)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-xs text-text-dim">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-900/60" /> Raro (ate 2
            em 10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-yellow-900/60" /> As vezes (3 a
            5 em 10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-900/60" /> Frequente (6
            a 7 em 10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-900/60" /> Quase todo ano
            (8+ em 10)
          </span>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          O que acontece em cada epoca do ano
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-bg-surface-alt p-5">
            <h3 className="text-warning font-semibold mb-2">
              Verao (Dez a Fev) — Hora da soja
            </h3>
            <p className="text-text-secondary text-sm">
              E quando a soja mais precisa de chuva. Em 7 de cada 10 anos, a
              chuva nessa epoca decidiu se a safra foi boa ou ruim. Mas o calor
              forte tambem aparece — em ate 7 de cada 10 janeiros passa dos 32
              graus por dias seguidos.
            </p>
          </div>
          <div className="rounded-lg bg-bg-surface-alt p-5">
            <h3 className="text-accent-light font-semibold mb-2">
              Inverno (Jun a Ago) — Terra parada?
            </h3>
            <p className="text-text-secondary text-sm">
              Geada em {KEY_FINDINGS.frost_jul_pct} a{" "}
              {KEY_FINDINGS.frost_aug_pct} de cada 100 anos. Quem deixa a terra
              parada perde esses meses. Quem planta aveia ou trigo aproveita — essas
              culturas aguentam o frio e ainda protegem o solo.
            </p>
          </div>
          <div className="rounded-lg bg-bg-surface-alt p-5">
            <h3 className="text-primary-light font-semibold mb-2">
              Transicoes (Mar-Mai / Set-Nov)
            </h3>
            <p className="text-text-secondary text-sm">
              Chuvaradas fortes (50mm num dia) acontecem em ate 4 de cada 10
              anos nessa epoca. Se o solo esta sem nada plantado, a enxurrada
              leva a camada mais rica da terra. E justamente quando precisa
              estar protegido.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          O que mudou em {KEY_FINDINGS.data_years} anos
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-bg-surface-alt p-5">
            <div className="text-3xl font-bold text-primary-light">
              {KEY_FINDINGS.productivity_old} → {KEY_FINDINGS.productivity_new}{" "}
              sc/ha
            </div>
            <div className="text-text-muted text-sm mt-1">
              A soja rende mais hoje
            </div>
            <p className="text-text-secondary text-sm mt-3">
              Isso veio de sementes melhores e manejo — nao do clima. O clima na
              verdade piorou. A tecnologia esta segurando, mas tem limite.
            </p>
          </div>
          <div className="rounded-lg bg-bg-surface-alt p-5">
            <div className="text-3xl font-bold text-warning">
              +{KEY_FINDINGS.hot_days_increase_pct}% de calor
            </div>
            <div className="text-text-muted text-sm mt-1">
              Mais dias acima de 32 graus
            </div>
            <p className="text-text-secondary text-sm mt-3">
              Comparando as primeiras 20 safras com as ultimas 20, o calor forte
              aumentou {KEY_FINDINGS.hot_days_increase_pct}%. A soja sofre —
              aborta flor, grao nao enche.
            </p>
          </div>
          <div className="rounded-lg bg-bg-surface-alt p-5">
            <div className="text-3xl font-bold text-accent-light">
              7 em 10
            </div>
            <div className="text-text-muted text-sm mt-1">
              Chuva no verao decidiu a safra
            </div>
            <p className="text-text-secondary text-sm mt-3">
              Tirando o efeito da tecnologia, os anos com boa chuva entre
              dezembro e fevereiro tiveram safra boa. E os anos secos tiveram
              quebra. Simples assim.
            </p>
          </div>
          <div className="rounded-lg bg-bg-surface-alt p-5">
            <div className="text-3xl font-bold text-red-400">5 piores safras</div>
            <div className="text-text-muted text-sm mt-1">
              Todas com o mesmo padrao
            </div>
            <p className="text-text-secondary text-sm mt-3">
              As 5 maiores quebras de safra tiveram a mesma receita:{" "}
              {KEY_FINDINGS.worst_seasons_pattern}. A rotacao de culturas e a
              principal defesa contra isso.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Entenda cada risco
        </h2>
        <div className="space-y-3">
          {RISK_KEYS.map((key) => (
            <div key={key} className="rounded-lg bg-bg-surface p-4">
              <h3 className="text-text-primary font-medium">
                {RISK_LABELS[key]}
              </h3>
              <p className="text-text-muted text-sm mt-1">
                {RISK_EXPLANATIONS[key]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-xs text-text-dim border-t border-border pt-4">
        Fonte: NASA POWER (satelite) | Chuva e temperatura diaria |{" "}
        {KEY_FINDINGS.data_start}-{KEY_FINDINGS.data_end} |{" "}
        {KEY_FINDINGS.data_years} anos de dados
      </footer>
    </div>
  );
}

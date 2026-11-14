import { site, MONTH_NAMES, MONTH_NAMES_FULL, KEY_FINDINGS } from "@/lib/data";

type RiskLevel = "none" | "low" | "moderate" | "high" | "critical";

function classifyRisk(value: number): RiskLevel {
  if (value === 0) return "none";
  if (value <= 0.15) return "low";
  if (value <= 0.4) return "moderate";
  if (value <= 0.7) return "high";
  return "critical";
}

const LEVEL_STYLES: Record<RiskLevel, string> = {
  none: "bg-gray-800/50 text-gray-600",
  low: "bg-emerald-900/40 text-emerald-400",
  moderate: "bg-yellow-900/40 text-yellow-400",
  high: "bg-orange-900/40 text-orange-400",
  critical: "bg-red-900/40 text-red-400",
};

const BARE_SOIL_MONTHS = [3, 4, 5, 6, 7, 8];

function fractionToText(val: number): string {
  if (val === 0) return "-";
  const de10 = Math.round(val * 10);
  if (de10 === 0) return "<1";
  return String(de10);
}

export default function VulnerabilidadesPage() {
  const months = site.q2.months;

  const monthData = months.map((m, i) => ({
    name: MONTH_NAMES[i],
    fullName: MONTH_NAMES_FULL[i],
    index: i,
    isBare: BARE_SOIL_MONTHS.includes(i),
    isSoySeason: [10, 11, 0, 1, 2].includes(i),
    dryRisk: classifyRisk(m.dry_spell),
    heatRisk: classifyRisk(m.heat),
    rainRisk: classifyRisk(m.heavy_rain),
    frostRisk: classifyRisk(m.frost),
    dryVal: m.dry_spell,
    heatVal: m.heat,
    rainVal: m.heavy_rain,
    frostVal: m.frost,
  }));

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-white">
          O risco de deixar a terra parada
        </h1>
        <p className="mt-2 text-text-secondary">
          O que acontece com o solo de quem so planta soja no verao e deixa a
          terra sem nada no inverno — em {site.point.name}-{site.point.state}
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-white mb-2">
          Seu ano, mes a mes
        </h2>
        <p className="text-text-muted text-sm mb-6">
          De novembro a marco, a soja esta na terra. De abril a setembro, o solo
          fica exposto — sem raiz, sem palha, sem nada protegendo. Veja os
          riscos em cada mes (de cada 10 anos):
        </p>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-12 gap-1 min-w-[700px]">
            {monthData.map((m) => (
              <div key={m.index} className="text-center">
                <div className="text-xs text-text-dim mb-2">{m.name}</div>

                <div
                  className={`h-8 rounded-t flex items-center justify-center text-xs font-medium ${
                    m.isSoySeason
                      ? "bg-primary/30 text-primary-light"
                      : m.isBare
                        ? "bg-red-900/30 text-red-400 border border-dashed border-red-800"
                        : "bg-gray-800/30 text-text-dim"
                  }`}
                >
                  {m.isSoySeason ? "Soja" : m.isBare ? "Parado" : ""}
                </div>

                <div
                  className={`h-6 flex items-center justify-center text-[10px] font-semibold ${LEVEL_STYLES[m.dryRisk]}`}
                >
                  {fractionToText(m.dryVal)}
                </div>
                <div
                  className={`h-6 flex items-center justify-center text-[10px] font-semibold ${LEVEL_STYLES[m.heatRisk]}`}
                >
                  {fractionToText(m.heatVal)}
                </div>
                <div
                  className={`h-6 flex items-center justify-center text-[10px] font-semibold ${LEVEL_STYLES[m.rainRisk]}`}
                >
                  {fractionToText(m.rainVal)}
                </div>
                <div
                  className={`h-6 rounded-b flex items-center justify-center text-[10px] font-semibold ${LEVEL_STYLES[m.frostRisk]}`}
                >
                  {fractionToText(m.frostVal)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-6 mt-3 min-w-[700px] text-xs text-text-dim">
            <div className="w-24" />
            <span>Seca</span>
            <span>Calor</span>
            <span>Chuvarada</span>
            <span>Geada</span>
            <span className="ml-auto">Numeros = de cada 10 anos</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          {KEY_FINDINGS.bare_soil_months} meses de solo exposto — o que isso
          custa
        </h2>
        <div className="rounded-lg bg-bg-surface-alt p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-warning font-semibold mb-3">
                O que acontece de abril a setembro
              </h3>
              <div className="space-y-2">
                {BARE_SOIL_MONTHS.map((mi) => {
                  const m = monthData[mi];
                  return (
                    <div
                      key={mi}
                      className="flex items-center justify-between bg-bg-surface rounded px-3 py-2"
                    >
                      <span className="text-text-secondary text-sm">
                        {m.fullName}
                      </span>
                      <div className="flex gap-2 text-xs">
                        {m.dryVal > 0.15 && (
                          <span className="bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded">
                            Seca {Math.round(m.dryVal * 10)}/10
                          </span>
                        )}
                        {m.rainVal > 0.15 && (
                          <span className="bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded">
                            Chuvarada {Math.round(m.rainVal * 10)}/10
                          </span>
                        )}
                        {m.frostVal > 0.15 && (
                          <span className="bg-cyan-900/40 text-cyan-400 px-2 py-0.5 rounded">
                            Geada {Math.round(m.frostVal * 10)}/10
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-red-400 font-semibold mb-3">
                O efeito domino
              </h3>
              <div className="space-y-3">
                {[
                  {
                    step: "1",
                    title: "Solo pelado",
                    desc: "Sem raiz e sem palha cobrindo, a terra fica exposta ao sol, chuva e vento por 5-6 meses.",
                  },
                  {
                    step: "2",
                    title: "Enxurrada leva a terra boa",
                    desc: "As chuvaradas de outono e primavera (acontecem em ate 4 de cada 10 anos) carregam a camada mais fertil.",
                  },
                  {
                    step: "3",
                    title: "Nutrientes somem",
                    desc: "Sem planta para segurar, o nitrogenio e a materia organica vao embora. Adubo que era de graca vira custo.",
                  },
                  {
                    step: "4",
                    title: "Solo endurece",
                    desc: "Sem raiz para afofar, a terra compacta. Agua nao entra, escorre por cima. Raiz da soja nao desce.",
                  },
                  {
                    step: "5",
                    title: "Safra mais fragil",
                    desc: "Soja plantada num solo degradado aguenta menos. Qualquer seca ou calor forte vira quebra de safra.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-red-900/40 text-red-400 flex items-center justify-center text-xs font-bold">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-text-primary text-sm font-medium">
                        {item.title}
                      </div>
                      <div className="text-text-muted text-xs">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Calor no verao — quando a soja mais sofre
        </h2>
        <div className="rounded-lg bg-bg-surface-alt p-6">
          <p className="text-text-muted text-sm mb-4">
            Meses em que o calor forte (32 graus por 5 dias seguidos) apareceu em
            mais de 2 de cada 10 anos:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {monthData
              .filter((m) => m.heatVal > 0.2)
              .sort((a, b) => b.heatVal - a.heatVal)
              .map((m) => (
                <div
                  key={m.index}
                  className="bg-bg-surface rounded-lg p-4 text-center"
                >
                  <div className="text-2xl font-bold text-warning">
                    {Math.round(m.heatVal * 10)} em 10
                  </div>
                  <div className="text-text-secondary text-sm mt-1">
                    {m.fullName}
                  </div>
                  <div className="text-text-dim text-xs mt-1">anos</div>
                </div>
              ))}
          </div>
          <p className="text-text-muted text-sm mt-4">
            Janeiro e o pior: {Math.round(months[0].heat * 10)} de cada 10 anos
            tem onda de calor. E justamente quando a soja esta enchendo grao —
            calor + seca ao mesmo tempo e receita pra quebra de safra.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Seca — quando a chuva para de vez
        </h2>
        <div className="rounded-lg bg-bg-surface-alt p-6">
          <p className="text-text-muted text-sm mb-4">
            Chance de ficar mais de 10 dias sem chuva, por mes:
          </p>
          <div className="flex items-end gap-1 h-40">
            {monthData.map((m) => {
              const heightPct = m.dryVal * 100;
              return (
                <div
                  key={m.index}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <span className="text-[10px] text-text-muted mb-1">
                    {heightPct > 0
                      ? `${Math.round(m.dryVal * 10)}/10`
                      : ""}
                  </span>
                  <div
                    className={`w-full rounded-t ${
                      m.isSoySeason
                        ? "bg-warning"
                        : m.isBare
                          ? "bg-red-800/60"
                          : "bg-gray-700"
                    }`}
                    style={{ height: `${Math.max(heightPct * 1.2, 2)}%` }}
                  />
                  <span className="text-[10px] text-text-dim mt-1">
                    {m.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-text-dim">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-warning" /> Safra da soja
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-800/60" /> Terra parada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-700" /> Transicao
            </span>
          </div>
          <p className="text-text-muted text-sm mt-4">
            Julho e o mes com mais seca (4 de cada 10 anos). No verao, marco e o
            mais perigoso (3 em 10) — e justamente quando o grao da soja esta no
            final do enchimento.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          A saida: cobrir o solo no inverno
        </h2>
        <div className="rounded-lg bg-bg-surface p-6">
          <p className="text-text-secondary text-sm leading-relaxed">
            Todo esse problema vem de uma coisa: o solo fica pelado no inverno.
            Plantar aveia, ervilhaca, trigo ou nabo forrageiro entre abril e
            setembro resolve varias coisas ao mesmo tempo — protege contra
            enxurrada, segura nutrientes, afofa a terra com as raizes e guarda
            umidade pra proxima safra. Cada problema que apareceu acima tem
            solucao — e todas passam por nao deixar o solo parado nesses{" "}
            {KEY_FINDINGS.bare_soil_months} meses.
          </p>
        </div>
      </section>

      <footer className="text-xs text-text-dim border-t border-border pt-4">
        Dados de {KEY_FINDINGS.data_years} anos de satelite NASA POWER (
        {KEY_FINDINGS.data_start}-{KEY_FINDINGS.data_end}) para{" "}
        {site.point.name}-{site.point.state}
      </footer>
    </div>
  );
}

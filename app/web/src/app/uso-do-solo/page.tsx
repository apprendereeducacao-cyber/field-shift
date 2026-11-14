import { mapbiomas } from "@/lib/data";

const GROUP_LABELS: Record<string, string> = {
  soja: "Soja",
  outras_lavouras: "Outras lavouras",
  lavoura_perene: "Lavoura perene",
  pastagem: "Pastagem",
  campo_nativo: "Campo nativo",
  floresta: "Floresta",
  silvicultura: "Silvicultura",
  agua: "Agua",
  urbano_outros: "Urbano/outros",
  agricultura_geral: "Agricultura geral",
};

const GROUP_COLORS: Record<string, string> = {
  soja: "#F9A825",
  outras_lavouras: "#FF8F00",
  lavoura_perene: "#6D4C41",
  pastagem: "#AED581",
  campo_nativo: "#81C784",
  floresta: "#2D6A4F",
  silvicultura: "#5D4037",
  agua: "#1E88E5",
  urbano_outros: "#9E9E9E",
  agricultura_geral: "#FF6F00",
};

const RELEVANT_GROUPS = [
  "soja",
  "outras_lavouras",
  "pastagem",
  "campo_nativo",
  "floresta",
  "silvicultura",
  "agua",
  "urbano_outros",
];

export default function UsoDoSoloPage() {
  const cs = mapbiomas.current_state;
  const tr = mapbiomas.transitions;
  const ts = mapbiomas.group_timeseries;

  const sojaTs = ts.soja || [];
  const first = sojaTs[0];
  const last = sojaTs[sojaTs.length - 1];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Uso do Solo — 39 anos de transformacao
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Como a terra ao redor de Cruz Alta mudou de 1985 a 2023.
          Raio de {(mapbiomas.buffer_radius_m / 1000).toFixed(0)}km,{" "}
          {mapbiomas.total_area_ha.toLocaleString("pt-BR")} hectares mapeados
          pelo MapBiomas com imagens Landsat (30m).
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-text-primary">
          O que tem hoje ({last?.year || 2023})
        </h2>
        <div className="mt-4 space-y-2">
          {RELEVANT_GROUPS.filter((g) => cs[g] && cs[g].area_ha > 0).map(
            (g) => {
              const state = cs[g];
              return (
                <div key={g} className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 shrink-0 rounded"
                    style={{ backgroundColor: GROUP_COLORS[g] }}
                  />
                  <span className="w-28 text-sm text-text-secondary">
                    {GROUP_LABELS[g]}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 overflow-hidden rounded-full bg-bg-surface-alt">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${state.pct}%`,
                          backgroundColor: GROUP_COLORS[g],
                          minWidth: state.pct > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-20 text-right text-xs font-mono text-text-secondary">
                    {state.area_ha.toLocaleString("pt-BR")} ha
                  </span>
                  <span className="w-12 text-right text-xs text-text-dim">
                    {state.pct}%
                  </span>
                </div>
              );
            },
          )}
        </div>
      </section>

      <section className="rounded-xl border border-warning/30 bg-warning/5 p-6">
        <h2 className="text-lg font-semibold text-warning-light">
          A explosao da soja
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-text-secondary">
              {first?.area_ha.toLocaleString("pt-BR")} ha
            </p>
            <p className="mt-1 text-xs text-text-dim">
              Soja em {first?.year || 1985}
            </p>
          </div>
          <div className="flex items-center justify-center text-3xl text-warning-light">
            →
          </div>
          <div className="rounded-lg border border-border bg-bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-warning-light">
              {last?.area_ha.toLocaleString("pt-BR")} ha
            </p>
            <p className="mt-1 text-xs text-text-dim">
              Soja em {last?.year || 2023}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-text-muted">
          A soja saiu de {tr.soja?.from_ha.toLocaleString("pt-BR")} ha pra{" "}
          {tr.soja?.to_ha.toLocaleString("pt-BR")} ha — um aumento de{" "}
          {tr.soja?.change_pct > 0 ? "+" : ""}
          {tr.soja?.change_pct.toFixed(0)}%. Ocupou area de pastagem (
          {tr.pastagem?.change_pct.toFixed(0)}%), campo nativo (
          {tr.campo_nativo?.change_pct.toFixed(0)}%) e outras lavouras (
          {tr.outras_lavouras?.change_pct.toFixed(0)}%).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-primary">
          Transicoes 1985 → 2023
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          O que cresceu, o que encolheu, e em quanto.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {RELEVANT_GROUPS.filter(
            (g) => tr[g] && (tr[g].from_ha > 10 || tr[g].to_ha > 10),
          ).map((g) => {
            const t = tr[g];
            const isGrowth = t.change_pct > 0;
            return (
              <div
                key={g}
                className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface p-4"
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: GROUP_COLORS[g] }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {GROUP_LABELS[g]}
                  </p>
                  <p className="text-xs text-text-muted">
                    {t.from_ha.toLocaleString("pt-BR")} →{" "}
                    {t.to_ha.toLocaleString("pt-BR")} ha
                  </p>
                </div>
                <span
                  className={`text-sm font-bold ${isGrowth ? "text-warning-light" : "text-error"}`}
                >
                  {isGrowth ? "+" : ""}
                  {t.change_pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-primary">
          Evolucao da soja ao longo do tempo
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Area ocupada por soja (hectares) em cada ano, de 1985 a 2023.
        </p>
        <div className="mt-4 overflow-x-auto">
          <div
            className="flex items-end gap-[2px]"
            style={{ minWidth: "600px", height: "180px" }}
          >
            {sojaTs.map((entry) => {
              const maxHa = Math.max(...sojaTs.map((e) => e.area_ha));
              const h = Math.round((entry.area_ha / maxHa) * 160 + 10);
              return (
                <div
                  key={entry.year}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                  style={{ height: "180px" }}
                >
                  <div className="absolute -top-6 hidden rounded bg-bg-surface-alt px-2 py-1 text-[10px] text-text-secondary shadow-lg group-hover:block">
                    {entry.year}: {entry.area_ha.toLocaleString("pt-BR")} ha
                  </div>
                  <div
                    className="relative w-full rounded-t transition-all group-hover:opacity-80"
                    style={{
                      height: `${h}px`,
                      backgroundColor: GROUP_COLORS.soja,
                    }}
                  />
                  {entry.year % 5 === 0 && (
                    <span className="mt-1 text-[9px] text-text-dim">
                      {entry.year}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-primary">
          O que isso significa pro agricultor
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="text-sm font-semibold text-warning-light">
              Monocultura dominante
            </p>
            <p className="mt-2 text-xs text-text-muted">
              81% da area e soja. Essa concentracao aumenta o risco — se a safra
              falha, nao tem alternativa. Diversificar com cobertura de inverno
              reduz esse risco.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="text-sm font-semibold text-primary-light">
              Campo nativo praticamente sumiu
            </p>
            <p className="mt-2 text-xs text-text-muted">
              De 244 ha pra 37 ha. A biodiversidade caiu junto. Coberturas de
              inverno como aveia e ervilhaca ajudam a manter alguma diversidade
              biologica no sistema.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="text-sm font-semibold text-accent-light">
              Pastagem quase zerou
            </p>
            <p className="mt-2 text-xs text-text-muted">
              496 ha viraram 14 ha. A pecuaria saiu e a soja entrou. O solo
              perdeu a estrutura que o capim dava — mais um motivo pra
              investir em cobertura.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="text-sm font-semibold text-text-secondary">
              Floresta resistiu parcialmente
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Perdeu 13% (577 → 500 ha), mas se manteve melhor que outros usos.
              Areas de preservacao permanente protegem o que restou.
            </p>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-border bg-bg-surface p-4 text-xs text-text-dim">
        <p>
          <strong>Fonte:</strong> {mapbiomas.source} | Resolucao:{" "}
          {mapbiomas.resolution} | Periodo: {mapbiomas.period} | Area:{" "}
          {mapbiomas.total_area_ha.toLocaleString("pt-BR")} ha (raio de{" "}
          {(mapbiomas.buffer_radius_m / 1000).toFixed(0)}km)
        </p>
        <p className="mt-1">
          MapBiomas e um projeto colaborativo entre INPE, universidades e ONGs.
          Os dados sao derivados de imagens Landsat e verificados por
          especialistas.
        </p>
      </div>
    </div>
  );
}

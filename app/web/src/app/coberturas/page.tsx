import { coverCrops, MONTH_NAMES } from "@/lib/data";

const FUNCTION_ICONS: Record<string, string> = {
  palha_duradoura: "Palha",
  cobertura_rapida: "Cobertura",
  fixa_nitrogenio: "N",
  descompactacao: "Raiz",
  libera_fosforo: "P",
  renda_grao: "R$",
};

const FUNCTION_COLORS: Record<string, string> = {
  palha_duradoura: "bg-amber-800/20 text-amber-400 border-amber-800/40",
  cobertura_rapida: "bg-emerald-800/20 text-emerald-400 border-emerald-800/40",
  fixa_nitrogenio: "bg-sky-800/20 text-sky-400 border-sky-800/40",
  descompactacao: "bg-orange-800/20 text-orange-400 border-orange-800/40",
  libera_fosforo: "bg-violet-800/20 text-violet-400 border-violet-800/40",
  renda_grao: "bg-yellow-800/20 text-yellow-400 border-yellow-800/40",
};

const GROUP_COLORS: Record<string, string> = {
  graminea: "text-emerald-400",
  leguminosa: "text-sky-400",
  crucifera: "text-orange-400",
};

function formatRange(arr: (number | null)[] | null, unit: string): string {
  if (!arr) return "—";
  const [a, b] = arr;
  if (a === null && b === null) return "—";
  if (a === null) return `ate ${b} ${unit}`;
  if (b === null) return `${a}+ ${unit}`;
  if (a === b) return `${a} ${unit}`;
  return `${a}–${b} ${unit}`;
}

function SowingBar({ months }: { months: number[] | null }) {
  if (!months) return <span className="text-xs text-text-dim">A definir</span>;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const active = months.includes(m);
        return (
          <div
            key={m}
            className={`flex h-6 w-6 items-center justify-center rounded text-[9px] font-medium ${
              active
                ? "bg-primary/30 text-primary-light"
                : "bg-bg-surface-alt/50 text-text-dim"
            }`}
            title={MONTH_NAMES[i]}
          >
            {MONTH_NAMES[i].charAt(0)}
          </div>
        );
      })}
    </div>
  );
}

export default function CoberturasPage() {
  const { functions, system_rules, crops } = coverCrops;

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12">
          <p className="text-sm font-medium tracking-wider text-primary-light uppercase">
            Base de dados
          </p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">
            Culturas de cobertura pra Cruz Alta
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-text-secondary">
            Cada planta de inverno tem uma funcao diferente no sistema. Algumas
            protegem o solo com palha, outras fixam nitrogenio, outras quebram
            compactacao. Aqui estao as opcoes com dados reais de pesquisa.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-bold text-text-primary">
            O que cada funcao significa
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(functions).map(([key, description]) => (
              <div
                key={key}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  FUNCTION_COLORS[key] || "bg-bg-surface border-border"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-base/50 text-xs font-bold">
                  {FUNCTION_ICONS[key] || "?"}
                </span>
                <span className="text-sm">{description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-bold text-text-primary">
            Regras do sistema de rotacao
          </h2>
          <div className="space-y-3">
            {system_rules.map((rule, i) => (
              <div
                key={i}
                className="rounded-xl border border-accent/20 bg-accent/5 p-4"
              >
                <p className="text-sm text-text-secondary">{rule.rule}</p>
                <p className="mt-2 text-xs text-text-dim">
                  Fonte: {rule.quality}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-lg font-bold text-text-primary">
            {crops.length} culturas de cobertura
          </h2>
          <div className="space-y-6">
            {crops.map((crop) => (
              <div
                key={crop.id}
                className="rounded-xl border border-border bg-bg-surface p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {crop.name}
                    </h3>
                    <p className="text-xs text-text-dim">
                      <span className="italic">{crop.scientific}</span>
                      {" — "}
                      <span className={GROUP_COLORS[crop.group] || "text-text-muted"}>
                        {crop.group}
                      </span>
                      {" — "}
                      {crop.family}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {crop.functions.map((fn) => (
                      <span
                        key={fn}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                          FUNCTION_COLORS[fn] || "bg-bg-surface-alt border-border text-text-muted"
                        }`}
                      >
                        {FUNCTION_ICONS[fn]} {functions[fn]?.split(" ")[0]}
                      </span>
                    ))}
                    {crop.functions.length === 0 && (
                      <span className="text-xs text-text-dim">
                        Funcoes a definir
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-[10px] font-medium tracking-wider text-text-dim uppercase">
                      Materia seca
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      {formatRange(crop.dry_matter_t_ha, "t/ha")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium tracking-wider text-text-dim uppercase">
                      Florescimento
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      {formatRange(crop.days_to_flower, "dias")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium tracking-wider text-text-dim uppercase">
                      Semente
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      {formatRange(crop.seed_kg_ha, "kg/ha")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium tracking-wider text-text-dim uppercase">
                      Relacao C/N
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      {crop.cn_ratio
                        ? crop.cn_ratio === "alta"
                          ? "Alta (palha dura mais)"
                          : "Baixa (libera N rapido)"
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-1 text-[10px] font-medium tracking-wider text-text-dim uppercase">
                    Epoca de semeadura
                  </p>
                  <SowingBar months={crop.sowing_months} />
                </div>

                {crop.notes.length > 0 && (
                  <div className="mt-4 space-y-1">
                    {crop.notes.map((note, i) => (
                      <p key={i} className="text-xs text-text-muted">
                        {note}
                      </p>
                    ))}
                  </div>
                )}

                {crop.sources.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-1 text-[10px] font-medium tracking-wider text-text-dim uppercase">
                      Fontes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {crop.sources.map((src, i) => (
                        <span
                          key={i}
                          className="rounded bg-bg-surface-alt px-2 py-0.5 text-[10px] text-text-dim"
                        >
                          {src.field} — {src.quality}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 rounded-xl border border-accent/20 bg-accent/5 p-5">
          <h3 className="text-sm font-semibold text-accent-light">
            Sobre esses dados
          </h3>
          <p className="mt-2 text-sm text-text-muted">
            Esta base foi compilada a partir de artigos cientificos (Scielo),
            dissertacoes, boletins da Embrapa e guias de extensao rural (Epagri).
            Valores marcados como "a preencher" serao completados com dados da
            Embrapa Trigo e do ZARC (Zoneamento Agricola de Risco Climatico) para
            Cruz Alta. Sempre confirme com seu agronomo antes de decidir.
          </p>
        </div>
      </div>
    </div>
  );
}

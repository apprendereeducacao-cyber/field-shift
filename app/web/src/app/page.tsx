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

    </div>
  );
}

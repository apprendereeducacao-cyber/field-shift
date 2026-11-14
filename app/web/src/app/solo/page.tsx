import { soil, site, topography } from "@/lib/data";

const INTERP_TITLES: Record<string, string> = {
  fertility: "Fertilidade",
  compaction_risk: "Risco de compactacao",
  water_holding: "Capacidade de guardar agua",
  erosion_vulnerability: "Risco de erosao",
};

const INTERP_COLORS: Record<string, string> = {
  fertility: "border-primary-light",
  compaction_risk: "border-accent-light",
  water_holding: "border-accent-light",
  erosion_vulnerability: "border-warning",
};

function phDescription(ph: number): { text: string; color: string } {
  if (ph < 5.0)
    return {
      text: "Bem acido — a maioria das culturas nao gosta. Precisa de calagem.",
      color: "text-red-400",
    };
  if (ph < 5.5)
    return {
      text: "Acido — a soja prefere mais que isso (5.5 a 6.5). Aveia e ervilhaca aguentam.",
      color: "text-orange-400",
    };
  if (ph < 6.0)
    return {
      text: "Quase ideal — bom pra maioria das culturas.",
      color: "text-yellow-400",
    };
  return {
    text: "pH bom — faixa ideal pra soja e a maioria das culturas.",
    color: "text-emerald-400",
  };
}

function elevationColor(elev: number, min: number, max: number): string {
  const pct = (elev - min) / (max - min);
  if (pct > 0.75) return "bg-emerald-700";
  if (pct > 0.5) return "bg-emerald-600";
  if (pct > 0.25) return "bg-yellow-700";
  return "bg-orange-700";
}

export default function SoloPage() {
  const topLayer = soil.layers[0];
  const ph = phDescription(topLayer.ph);
  const topo = topography.summary;
  const points = topography.points;

  return (
    <div className="space-y-12">
      <header>
        <p className="text-sm font-medium tracking-wider text-primary-light uppercase">
          Solo e Terreno
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          Como e o solo e o terreno da sua regiao
        </h1>
        <p className="mt-2 text-text-secondary">
          {site.point.name}-{site.point.state} — Solo mapeado por satelite
          (SoilGrids, resolucao de 250m) e terreno medido por radar (SRTM, 30m).
        </p>
      </header>

      {/* TOPOGRAFIA */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Relevo da regiao
        </h2>
        <div className="rounded-lg bg-bg-surface-alt p-6">
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <div className="rounded-lg bg-bg-surface p-4">
              <p className="text-2xl font-bold text-text-primary">{topo.mean_elevation_m.toFixed(0)}m</p>
              <p className="text-xs text-text-muted">Altitude media</p>
            </div>
            <div className="rounded-lg bg-bg-surface p-4">
              <p className="text-2xl font-bold text-text-primary">{topo.min_elevation_m}m - {topo.max_elevation_m}m</p>
              <p className="text-xs text-text-muted">Variacao de altitude</p>
            </div>
            <div className="rounded-lg bg-bg-surface p-4">
              <p className="text-2xl font-bold text-text-primary">{topo.range_m}m</p>
              <p className="text-xs text-text-muted">Desnivel total</p>
            </div>
            <div className="rounded-lg bg-bg-surface p-4">
              <p className="text-2xl font-bold text-text-primary">Planalto</p>
              <p className="text-xs text-text-muted">Planalto Medio Gaucho</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Mapa de elevacao — grade 5x5 ao redor de Cruz Alta
          </h3>
          <div className="grid grid-cols-5 gap-1 max-w-sm">
            {points.map((p, i) => (
              <div
                key={i}
                className={`rounded-sm p-2 text-center ${elevationColor(p.elevation_m, topo.min_elevation_m, topo.max_elevation_m)}`}
                title={`${p.latitude.toFixed(2)}, ${p.longitude.toFixed(2)}: ${p.elevation_m}m`}
              >
                <span className="text-xs font-semibold text-white">{p.elevation_m}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-text-dim">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-orange-700" />
              <span>Baixo ({topo.min_elevation_m}m)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-yellow-700" />
              <span>Medio</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-emerald-600" />
              <span>Medio-alto</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-emerald-700" />
              <span>Alto ({topo.max_elevation_m}m)</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary">
              O que o terreno significa pro produtor
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Cruz Alta fica no Planalto Medio, entre {topo.min_elevation_m}m e{" "}
              {topo.max_elevation_m}m de altitude ({topo.range_m}m de desnivel).
              Terreno suavemente ondulado — bom pra mecanizacao, mas as areas
              mais baixas acumulam agua e as mais altas secam primeiro. Nas
              encostas, a enxurrada leva solo sem cobertura. Saber onde esta o
              baixo e o alto da lavoura ajuda a decidir onde plantar o que no
              inverno.
            </p>
          </div>
        </div>
      </section>

      {/* TEXTURA */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Tipo de solo: {soil.texture_class}
        </h2>
        <div className="rounded-lg bg-bg-surface-alt p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-text-secondary text-sm mb-4">
                Solo de textura media-argilosa, comum na regiao do Planalto
                Medio gaucho. Tem um bom equilibrio entre segurar agua e deixar
                escorrer o excesso.
              </p>
              <h3 className="text-text-primary font-medium text-sm mb-3">
                Do que e feito (camada de cima, 0-5cm)
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Argila (segura agua e nutriente)", value: topLayer.clay_pct, color: "#8B5E3C" },
                  { label: "Areia (deixa a agua passar)", value: topLayer.sand_pct, color: "#D97706" },
                  { label: "Silte (meio termo)", value: topLayer.silt_pct, color: "#6B7280" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="font-semibold" style={{ color: item.color }}>
                        {item.value}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.value}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-40 h-40 rounded-full border-4 border-[#8B5E3C] flex items-center justify-center bg-bg-surface">
                  <div>
                    <div className="text-3xl font-bold text-[#8B5E3C]">
                      {topLayer.clay_pct}%
                    </div>
                    <div className="text-xs text-text-muted">Argila</div>
                  </div>
                </div>
                <p className="text-text-dim text-xs mt-3">
                  Camada de cima (0-5cm)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* pH */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Acidez do solo (pH)
        </h2>
        <div className="rounded-lg bg-bg-surface-alt p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-4xl font-bold ${ph.color}`}>
              {topLayer.ph}
            </div>
            <p className="text-text-secondary text-sm">{ph.text}</p>
          </div>
          <div className="h-4 rounded-full bg-gradient-to-r from-red-600 via-yellow-500 to-emerald-600 relative">
            <div
              className="absolute top-0 w-1 h-4 bg-white rounded-full"
              style={{
                left: `${((topLayer.ph - 3.5) / (8.5 - 3.5)) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-dim mt-1">
            <span>3.5 (muito acido)</span>
            <span>5.5-6.5 (ideal soja)</span>
            <span>8.5 (alcalino)</span>
          </div>
        </div>
      </section>

      {/* MATERIA ORGANICA */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Materia organica — a riqueza do solo
        </h2>
        <div className="rounded-lg bg-bg-surface-alt p-6">
          <p className="text-text-muted text-sm mb-4">
            A materia organica (carbono) e o que faz o solo ser fertil — segura
            agua, guarda nutriente e alimenta os microrganismos. Quanto mais
            fundo, menos tem:
          </p>
          <div className="space-y-4">
            {soil.layers.map((layer, i) => {
              const maxC = soil.layers[0].organic_carbon_g_kg;
              const pct = (layer.organic_carbon_g_kg / maxC) * 100;
              return (
                <div key={layer.depth}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{layer.depth}</span>
                    <span className="text-primary-light font-semibold">
                      {layer.organic_carbon_g_kg} g/kg
                    </span>
                  </div>
                  <div className="h-6 bg-gray-800 rounded overflow-hidden">
                    <div
                      className="h-full rounded flex items-center justify-end pr-2"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: `rgba(45,106,79,${0.3 + (pct / 100) * 0.5})`,
                      }}
                    >
                      {i === 0 && (
                        <span className="text-[10px] text-emerald-200">
                          Camada mais rica
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-text-muted text-sm mt-4">
            A camada de cima tem{" "}
            {(
              (1 -
                soil.layers[2].organic_carbon_g_kg /
                  soil.layers[0].organic_carbon_g_kg) *
              100
            ).toFixed(0)}
            % mais materia organica que a camada de 15-30cm. E essa camada rica
            que a enxurrada leva primeiro quando o solo esta pelado.
          </p>
        </div>
      </section>

      {/* FERTILIDADE - RECOMENDACOES */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Fertilidade: o que o solo precisa
        </h2>
        <div className="rounded-lg bg-bg-surface-alt p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <div className="rounded-lg bg-bg-surface p-4 border-l-4 border-warning">
              <p className="text-sm font-semibold text-text-primary">Calagem necessaria</p>
              <p className="text-2xl font-bold text-warning mt-1">pH {topLayer.ph}</p>
              <p className="text-xs text-text-muted mt-1">
                A soja precisa de pH entre 5.5 e 6.5. Com pH {topLayer.ph},
                precisa aplicar calcario pra subir pelo menos 0.3 pontos.
                Calcule com seu agronomo a dose certa pro seu solo.
              </p>
            </div>
            <div className="rounded-lg bg-bg-surface p-4 border-l-4 border-primary-light">
              <p className="text-sm font-semibold text-text-primary">Nitrogenio</p>
              <p className="text-2xl font-bold text-primary-light mt-1">{topLayer.nitrogen_g_kg} g/kg</p>
              <p className="text-xs text-text-muted mt-1">
                Nivel razoavel. Plantar ervilhaca no inverno fixa 80-120 kg N/ha
                de graca — economiza 30-50% do adubo nitrogenado na soja
                seguinte.
              </p>
            </div>
            <div className="rounded-lg bg-bg-surface p-4 border-l-4 border-accent-light">
              <p className="text-sm font-semibold text-text-primary">CTC (capacidade de troca)</p>
              <p className="text-2xl font-bold text-accent-light mt-1">{topLayer.cec_cmol_kg}</p>
              <p className="text-xs text-text-muted mt-1">
                Boa capacidade de segurar nutrientes. O solo nao desperdiça
                adubo — mas sem cobertura, a chuva lava os nutrientes da
                superficie.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Resumo: o que fazer pra melhorar esse solo
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-warning" />
                <p className="text-sm text-text-secondary">
                  <strong className="text-text-primary">Corrigir acidez:</strong>{" "}
                  Aplicar calcario pra subir o pH de {topLayer.ph} pra pelo menos
                  5.5. A soja absorve nutriente melhor em solo menos acido.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-light" />
                <p className="text-sm text-text-secondary">
                  <strong className="text-text-primary">Plantar leguminosa no inverno:</strong>{" "}
                  Ervilhaca fixa nitrogenio de graca. A economia pode chegar a
                  R$200-400/ha em adubo.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-light" />
                <p className="text-sm text-text-secondary">
                  <strong className="text-text-primary">Manter cobertura o ano todo:</strong>{" "}
                  Com {topLayer.organic_carbon_g_kg} g/kg de carbono na camada de
                  cima, a materia organica e boa — mas sem palha no inverno, a
                  chuva leva embora. Aveia preta repoe com 4-8 t/ha de palha.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#8B5E3C]" />
                <p className="text-sm text-text-secondary">
                  <strong className="text-text-primary">Quebrar compactacao:</strong>{" "}
                  Nabo forrageiro tem raiz que vai a 2 metros de profundidade.
                  Faz o servico do subsolador sem gastar diesel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERPRETACAO */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Visao geral do solo
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(soil.interpretation).map(([key, value]) => (
            <div
              key={key}
              className={`rounded-lg bg-bg-surface p-5 border-l-4 ${INTERP_COLORS[key] || "border-gray-600"}`}
            >
              <h3 className="text-text-primary font-semibold mb-1">
                {INTERP_TITLES[key] || key}
              </h3>
              <p className="text-text-muted text-sm">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-xs text-text-dim border-t border-border pt-4">
        Solo: {soil.source} (250m) | Topografia: {topography.source} (30m) |{" "}
        {site.point.name}-{site.point.state}
      </footer>
    </div>
  );
}

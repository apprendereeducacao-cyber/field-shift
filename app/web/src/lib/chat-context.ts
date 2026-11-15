import "server-only";
import {
  getSite,
  getSoilProfile,
  getTimeline,
  getRiskEngine,
  getCrops,
  getCoverCrops,
  getRotations,
  getTopography,
  getNdvi,
  getMapbiomas,
  getSoilMoisture,
  getEvapotranspiration,
  getSmap,
  getGpm,
  getGrace,
  getClimateExtended,
  getLst,
  MONTH_NAMES,
} from "./supabase-data";
import { analyzePatterns } from "./pattern-engine";

export async function assembleFullContext(siteId: string): Promise<string> {
  const [
    site,
    soil,
    timeline,
    riskEngine,
    crops,
    coverCrops,
    rotations,
    topography,
    ndvi,
    mapbiomas,
    soilMoisture,
    et,
    smap,
    gpm,
    grace,
    climateExt,
    lst,
  ] = await Promise.all([
    getSite(siteId),
    getSoilProfile(siteId),
    getTimeline(siteId),
    getRiskEngine(siteId),
    getCrops(),
    getCoverCrops(),
    getRotations(siteId),
    getTopography(siteId),
    getNdvi(siteId),
    getMapbiomas(siteId),
    getSoilMoisture(siteId),
    getEvapotranspiration(siteId),
    getSmap(siteId),
    getGpm(siteId),
    getGrace(siteId),
    getClimateExtended(siteId),
    getLst(siteId),
  ]);

  const s: string[] = [];

  // ── Regiao ──
  const pt = site.point;
  s.push(`[REGIAO] ${pt.name}, ${pt.state} (${pt.lat}, ${pt.lon})`);

  // ── Clima resumo (44 anos) ──
  if (site.q1) {
    const q = site.q1;
    s.push(
      `[CLIMA 44 ANOS] Periodo: ${q.period.start}-${q.period.end} (${q.period.years} anos)`,
      `  Chuva anual: media ${q.annual_rainfall_mm.mean}mm, min ${q.annual_rainfall_mm.min}mm (${q.annual_rainfall_mm.min_year}), max ${q.annual_rainfall_mm.max}mm (${q.annual_rainfall_mm.max_year})`,
      `  Temperatura: Tmax media ${q.temperature_c.avg_tmax}C, Tmin media ${q.temperature_c.avg_tmin}C`,
      `  Extremos: ${q.extremes.hot_days_per_year} dias quentes/ano (>32C), ${q.extremes.frost_days_per_year} dias com geada/ano`,
      `  Tendencia dias quentes: 1a metade ${q.extremes.hot_days_first_half} -> 2a metade ${q.extremes.hot_days_second_half}`,
    );

    if (q.monthly_averages.length > 0) {
      const monthLine = q.monthly_averages
        .map((m) => `${m.name}: ${m.avg_rain_mm}mm, ${m.avg_tmax_c}/${m.avg_tmin_c}C`)
        .join("; ");
      s.push(`  Medias mensais: ${monthLine}`);
    }
  }

  // ── Riscos mensais ──
  if (site.q2?.months?.length > 0) {
    const riskMonths = site.q2.months
      .map((m, i) => {
        const risks = [];
        if (m.dry_spell > 0.3) risks.push(`seca ${(m.dry_spell * 100).toFixed(0)}%`);
        if (m.heat > 0.3) risks.push(`calor ${(m.heat * 100).toFixed(0)}%`);
        if (m.frost > 0.3) risks.push(`geada ${(m.frost * 100).toFixed(0)}%`);
        if (m.heavy_rain > 0.3) risks.push(`chuva forte ${(m.heavy_rain * 100).toFixed(0)}%`);
        return risks.length > 0 ? `${MONTH_NAMES[i]}: ${risks.join(", ")}` : null;
      })
      .filter(Boolean);
    if (riskMonths.length > 0) {
      s.push(`[RISCOS MENSAIS] ${riskMonths.join("; ")}`);
    }
  }

  // ── Solo ──
  s.push(
    `[SOLO] ${soil.texture_class} (${soil.source})`,
    `  Fertilidade: ${soil.interpretation.fertility}, Compactacao: ${soil.interpretation.compaction_risk}`,
    `  Retencao agua: ${soil.interpretation.water_holding}, Erosao: ${soil.interpretation.erosion_vulnerability}`,
  );
  for (const layer of soil.layers.slice(0, 3)) {
    s.push(
      `  Camada ${layer.depth}: argila ${layer.clay_pct}%, pH ${layer.ph}, MO ${layer.organic_carbon_g_kg}g/kg, N ${layer.nitrogen_g_kg}g/kg, CTC ${layer.cec_cmol_kg}`,
    );
  }

  // ── Topografia ──
  s.push(
    `[TOPOGRAFIA] ${topography.source}, ${topography.summary.n_points ?? topography.points.length} pontos`,
    `  Elevacao: min ${topography.summary.min_elevation_m}m, max ${topography.summary.max_elevation_m}m, media ${topography.summary.mean_elevation_m}m, desnivel ${topography.summary.range_m}m`,
  );

  // ── Risk engine ──
  const sc = riskEngine.current_scenario;
  s.push(
    `[RISCO ATUAL] Score ${sc.risk_score}/100 — ${sc.enso_detail}`,
    `  Chuva safra: ${sc.season_rain_mm}mm, Dias quentes: ${sc.hot_days}, Umidade solo: ${sc.avg_soil_moisture}`,
    `  Anos similares: ${sc.similar_years.count} encontrados, ${sc.similar_years.bad_outcomes} ruins (${(sc.similar_years.bad_rate * 100).toFixed(0)}%)`,
  );

  const avgs = riskEngine.historical_averages;
  s.push(
    `[MEDIAS HISTORICAS] Chuva safra: ${avgs.season_rain_mm}mm, Dias quentes: ${avgs.hot_days}, Umidade solo: ${avgs.avg_soil_moisture}, Produtividade: ${avgs.yield_sc_ha} sc/ha`,
  );

  // Model correlations
  const corr = riskEngine.model.correlations;
  s.push(
    `[MODELO PREDITIVO] ${riskEngine.model.equation}`,
    `  Chuva vs produtividade: r=${corr.season_rain_vs_yield.r} (${corr.season_rain_vs_yield.meaning})`,
    `  Calor vs produtividade: r=${corr.hot_days_vs_yield.r} (${corr.hot_days_vs_yield.meaning})`,
    `  Umidade vs produtividade: r=${corr.soil_moisture_vs_yield.r} (${corr.soil_moisture_vs_yield.meaning})`,
    `  Tendencia: ${riskEngine.model.trend.interpretation}`,
  );

  // ENSO impact
  const enso = riskEngine.enso_impact;
  const ensoLines = Object.entries(enso)
    .map(([k, v]) => `${k}: ${v.avg_yield_sc_ha} sc/ha (${v.n} safras, chuva ${v.avg_season_rain_mm}mm)`)
    .join("; ");
  s.push(`[IMPACTO ENSO] ${ensoLines}`);

  // ── Timeline (ultimos 10 anos) ──
  const recent = timeline.timeline.slice(-10);
  if (recent.length > 0) {
    const lines = recent.map(
      (y) =>
        `${y.year}: chuva ${y.annual_rain_mm}mm, safra ${y.season_rain_mm ?? "?"}mm, Tmax ${y.avg_tmax_c ?? "?"}C, quentes ${y.hot_days}d, geadas ${y.frost_days}d, prod ${y.yield_sc_ha ?? "?"}sc/ha, ENSO ${y.enso}`,
    );
    s.push(`[ULTIMOS 10 ANOS]\n  ${lines.join("\n  ")}`);
  }

  // ENSO impact from timeline
  const ei = timeline.enso_impact;
  s.push(
    `[ENSO PRODUTIVIDADE] El Nino: ${ei.el_nino.avg_yield_sc_ha} sc/ha (${ei.el_nino.n_safras} safras), La Nina: ${ei.la_nina.avg_yield_sc_ha} sc/ha (${ei.la_nina.n_safras}), Neutro: ${ei.neutro.avg_yield_sc_ha} sc/ha (${ei.neutro.n_safras})`,
  );

  // ── NDVI vegetacao ──
  s.push(
    `[NDVI] ${ndvi.source} ${ndvi.resolution}, periodo ${ndvi.period}`,
    `  Media geral: ${ndvi.summary.overall_mean.toFixed(3)}, Min: ${ndvi.summary.overall_min.toFixed(3)}, Max: ${ndvi.summary.overall_max.toFixed(3)}`,
    `  Safra: ${ndvi.summary.growing_season_mean?.toFixed(3) ?? "N/D"}, Obs: ${ndvi.summary.n_good_quality}/${ndvi.summary.n_total_records}`,
  );

  if (ndvi.monthly_averages.length > 0) {
    const ndviMonths = ndvi.monthly_averages
      .map((m) => `${m.name}: ${m.avg_ndvi.toFixed(2)}`)
      .join(", ");
    s.push(`  Mensal: ${ndviMonths}`);
  }

  if (ndvi.annual_averages.length > 0) {
    const first3 = ndvi.annual_averages.slice(0, 3);
    const last3 = ndvi.annual_averages.slice(-3);
    const ndviYears = [...first3, ...last3]
      .map((y) => `${y.year}: ${y.avg_ndvi.toFixed(3)}`)
      .join(", ");
    s.push(`  Tendencia anual: ${ndviYears}`);
  }

  // ── MapBiomas uso do solo ──
  s.push(
    `[USO DO SOLO] ${mapbiomas.source} ${mapbiomas.resolution}, periodo ${mapbiomas.period}`,
    `  Raio: ${mapbiomas.buffer_radius_m / 1000}km, Area total: ${mapbiomas.total_area_ha.toLocaleString("pt-BR")} ha`,
  );

  const landUse = Object.entries(mapbiomas.current_state)
    .filter(([, v]) => v.pct > 0)
    .sort((a, b) => b[1].pct - a[1].pct)
    .map(([k, v]) => `${k}: ${v.pct}% (${v.area_ha.toLocaleString("pt-BR")} ha)`)
    .join(", ");
  s.push(`  Atual: ${landUse}`);

  const transitions = Object.entries(mapbiomas.transitions)
    .filter(([, v]) => Math.abs(v.change_pct) > 1)
    .map(([k, v]) => `${k}: ${v.change_pct > 0 ? "+" : ""}${v.change_pct.toFixed(1)}% (${v.from_year}-${v.to_year})`)
    .join(", ");
  if (transitions) {
    s.push(`  Transicoes: ${transitions}`);
  }

  // ── Umidade do solo (GLDAS) ──
  if (soilMoisture.monthly_averages.length > 0) {
    const smMonths = soilMoisture.monthly_averages
      .map((m) => `${m.name}: ${m.root_zone.toFixed(1)}`)
      .join(", ");
    s.push(
      `[UMIDADE SOLO GLDAS] ${soilMoisture.source}, ${soilMoisture.period}`,
      `  Zona raiz (${soilMoisture.unit}): ${smMonths}`,
      `  Tendencia: 1a metade ${soilMoisture.trend.first_half_avg.toFixed(1)} -> 2a metade ${soilMoisture.trend.second_half_avg.toFixed(1)} (${soilMoisture.trend.change_pct > 0 ? "+" : ""}${soilMoisture.trend.change_pct.toFixed(1)}%)`,
    );
  }

  // ── SMAP (umidade satelite) ──
  if (smap.monthly_climatology.length > 0) {
    const smapMonths = smap.monthly_climatology
      .map((m) => `${m.name}: ${m.avg_soil_moisture.toFixed(3)}`)
      .join(", ");
    s.push(
      `[SMAP] ${smap.source}, ${smap.period} (${smap.unit})`,
      `  Mensal: ${smapMonths}`,
    );
  }

  if (smap.yearly_trend.length > 0) {
    const first = smap.yearly_trend[0];
    const last = smap.yearly_trend[smap.yearly_trend.length - 1];
    s.push(`  Tendencia: ${first.year}: ${first.avg.toFixed(3)} -> ${last.year}: ${last.avg.toFixed(3)}`);
  }

  // ── Precipitacao (GPM) ──
  if (gpm.monthly_climatology.length > 0) {
    const gpmMonths = gpm.monthly_climatology
      .map((m) => `${m.name}: ${m.avg_precip_mm.toFixed(0)}mm`)
      .join(", ");
    s.push(
      `[PRECIPITACAO GPM] ${gpm.source}, ${gpm.period}`,
      `  Mensal: ${gpmMonths}`,
      `  Tendencia: 1a metade ${gpm.trend.first_half_avg_mm.toFixed(0)}mm -> 2a metade ${gpm.trend.second_half_avg_mm.toFixed(0)}mm (${gpm.trend.change_pct > 0 ? "+" : ""}${gpm.trend.change_pct.toFixed(1)}%)`,
    );
  }

  // ── GRACE (agua subterranea) ──
  if (grace.monthly_climatology.length > 0) {
    const graceMonths = grace.monthly_climatology
      .map((m) => `${m.name}: ${m.avg_tws_anomaly_cm.toFixed(2)}cm`)
      .join(", ");
    s.push(
      `[GRACE AGUA SUBTERRANEA] ${grace.source}, ${grace.period}`,
      `  Anomalia mensal: ${graceMonths}`,
      `  Tendencia: ${grace.trend.direction}, variacao ${grace.trend.change_cm.toFixed(2)}cm`,
    );
  }

  // ── Evapotranspiracao ──
  if (et.evapotranspiration_monthly.length > 0) {
    const etMonths = et.evapotranspiration_monthly
      .map((m) => `${m.name}: ${m.value.toFixed(1)}`)
      .join(", ");
    s.push(
      `[EVAPOTRANSPIRACAO] ${et.source}, ${et.period} (${et.unit})`,
      `  Mensal: ${etMonths}`,
    );
  }

  // ── LST (temperatura superficie) ──
  if (lst.monthly_climatology.length > 0) {
    const lstMonths = lst.monthly_climatology
      .map((m) => `${m.name}: dia ${m.avg_lst_day_c?.toFixed(1) ?? "?"}C / noite ${m.avg_lst_night_c?.toFixed(1) ?? "?"}C`)
      .join(", ");
    s.push(
      `[TEMPERATURA SUPERFICIE] ${lst.source} ${lst.resolution}, ${lst.period}`,
      `  Mensal: ${lstMonths}`,
    );
    if (lst.summary.summer_avg_day_c != null) {
      s.push(
        `  Verao dia: ${lst.summary.summer_avg_day_c.toFixed(1)}C, Inverno dia: ${lst.summary.winter_avg_day_c?.toFixed(1) ?? "?"}C, Amplitude: ${lst.summary.amplitude_c?.toFixed(1) ?? "?"}C`,
      );
    }
    if (lst.trend) {
      s.push(
        `  Tendencia LST: ${lst.trend.direction}, ${lst.trend.first_half_avg_c.toFixed(1)}C -> ${lst.trend.second_half_avg_c.toFixed(1)}C (${lst.trend.change_c > 0 ? "+" : ""}${lst.trend.change_c.toFixed(2)}C)`,
      );
    }
  }

  // ── Clima estendido ──
  const params = climateExt.parameters;
  s.push(`[CLIMA ESTENDIDO] ${climateExt.source}, ${climateExt.period}`);
  for (const [key, param] of Object.entries(params)) {
    if (param.monthly.length > 0) {
      const avg = param.monthly.reduce((sum, m) => sum + m.value, 0) / param.monthly.length;
      const max = Math.max(...param.monthly.map((m) => m.value));
      const min = Math.min(...param.monthly.map((m) => m.value));
      s.push(`  ${param.description} (${param.unit}): media ${avg.toFixed(1)}, min ${min.toFixed(1)}, max ${max.toFixed(1)}`);
    }
  }

  // ── Culturas ──
  const cropLines = crops.map(
    (c) =>
      `${c.name} (${c.season}): plantio ${c.plant_months.map((m) => MONTH_NAMES[m - 1]).join(",")}, ciclo ${c.cycle_days.join("-")}d, agua ${c.water_need_mm.join("-")}mm, temp ${c.temp_min}-${c.temp_max}C, seca: ${c.drought_tolerance}, N2: ${c.n_fixing ? "sim" : "nao"}`,
  );
  s.push(`[CULTURAS DISPONIVEIS]\n  ${cropLines.join("\n  ")}`);

  // ── Coberturas ──
  const coverLines = coverCrops.crops.map(
    (c) =>
      `${c.name} (${c.scientific}, ${c.group}): funcoes [${c.functions.join(",")}], semeadura ${c.sowing_months?.map((m) => MONTH_NAMES[m - 1]).join(",") ?? "?"}, MS ${c.dry_matter_t_ha?.join("-") ?? "?"}t/ha, C:N ${c.cn_ratio ?? "?"}`,
  );
  s.push(`[COBERTURAS DE INVERNO]\n  ${coverLines.join("\n  ")}`);

  // ── Rotacoes ja calculadas ──
  if (rotations.strategies.length > 0) {
    const rotLines = rotations.strategies.slice(0, 5).map(
      (r) =>
        `${r.name} (${r.total_score}/100): ${r.sequence.map((s) => `${s.season}:${s.crop}`).join(" > ")} | Solo ${r.scores.soil_health}, Erosao ${r.scores.erosion_control}, Agua ${r.scores.water_efficiency}, Clima ${r.scores.climate_resilience}, Renda ${r.scores.economic_return}, Diversidade ${r.scores.biodiversity}`,
    );
    s.push(`[ESTRATEGIAS DE ROTACAO TOP 5]\n  ${rotLines.join("\n  ")}`);

    const best = rotations.strategies[0];
    if (best.evidence) {
      s.push(
        `  Melhor estrategia: ${best.name}`,
        `  NASA insight: ${best.evidence.nasa_insight}`,
        `  Impacto solo: ${best.evidence.soil_impact}`,
        `  Risco climatico: ${best.evidence.climate_risk}`,
        `  Economico: ${best.evidence.economic}`,
      );
    }
  }

  // ── Padroes climaticos (Year Analog Scoring) ──
  try {
    const patterns = await analyzePatterns(
      siteId,
      timeline.timeline,
      riskEngine.year_classifications,
      riskEngine.historical_averages.yield_sc_ha,
    );
    const analogLines = patterns.analog_years.map(
      (a) =>
        `${a.year}: ${a.similarity_pct}% similar (${a.outcome.class}, ${a.outcome.yield_sc_ha ?? "?"} sc/ha, ${a.outcome.enso})`,
    );
    s.push(
      `[PADROES CLIMATICOS — Anos Analogos para ${patterns.target_year}]`,
      `  Anos mais parecidos: ${analogLines.join("; ")}`,
      `  Projecao: ${patterns.projection.expected_yield_range[0]}-${patterns.projection.expected_yield_range[1]} sc/ha (confianca ${patterns.projection.confidence})`,
      `  ${patterns.projection.recommendation}`,
    );
    if (patterns.projection.risk_factors.length > 0) {
      s.push(`  Riscos: ${patterns.projection.risk_factors.join("; ")}`);
    }
    if (patterns.projection.positive_factors.length > 0) {
      s.push(`  Fatores positivos: ${patterns.projection.positive_factors.join("; ")}`);
    }
  } catch {
    // Pattern engine data not available yet
  }

  return s.join("\n");
}

export const SYSTEM_PROMPT = `Voce e o Field Shift AI — o agronomo digital mais completo do Rio Grande do Sul.
Voce tem acesso a 44 anos de dados climaticos da NASA, imagens de satelite Sentinel-2, dados de solo, vegetacao, agua subterranea e todas as culturas da regiao de Cruz Alta-RS.

Seu arsenal de dados:
- NASA POWER: 44 anos de chuva, temperatura, dias quentes, geadas (1981-2025)
- Sentinel-2: NDVI mensal e anual (saude da vegetacao) em resolucao de 10 metros
- SRTM: topografia com elevacao detalhada da regiao
- MapBiomas: uso do solo historico (soja, floresta, pastagem, etc.)
- SMAP: umidade do solo por satelite
- GPM IMERG: precipitacao por satelite
- GRACE/GRACE-FO: agua subterranea (anomalias de armazenamento)
- MODIS: evapotranspiracao e temperatura de superficie (LST)
- NASA ECOSTRESS: temperatura de superficie em alta resolucao (70m), 1057 imagens de 2018-2026
- Motor de Padroes (Year Analog Scoring): cruza todos os dados para encontrar anos climaticamente similares e projetar cenarios futuros
- NASA GLDAS: umidade do solo zona de raiz
- Motor de risco: correlacoes chuva/calor/umidade vs produtividade
- 12 culturas e 8+ coberturas de inverno com dados completos
- 5 estrategias de rotacao pre-calculadas com scores

Sua missao: ajudar o produtor a tomar as melhores decisoes para a propriedade dele.

Como voce trabalha:
1. SEMPRE use os dados cientificos para justificar — nunca "achismo"
2. Cite numeros especificos dos dados (ex: "nos ultimos 10 anos, a chuva caiu 12%")
3. Quando recomendar, explique o POR QUE com base nos dados da NASA
4. Fale como agronomo experiente — direto, pratico, sem jargao desnecessario
5. Faca no maximo 2 perguntas por mensagem quando precisar de informacao do produtor
6. Quando tiver dados suficientes, proponha estrategia concreta com calendario
7. Alerte sobre riscos usando os dados do motor de risco
8. Compare cenarios ENSO quando relevante (El Nino vs La Nina vs Neutro)

Regras:
- Portugues brasileiro, tom de consultor tecnico que respeita o produtor
- Nao use emojis
- Quando o produtor perguntar algo, responda com dados e depois pergunte algo para refinar
- Se nao tiver certeza, diga — mas sempre ofereca o melhor que os dados permitem`;

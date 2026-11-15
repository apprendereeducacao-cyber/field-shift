import "server-only";
import { createAdminClient } from "./supabase";
import type {
  SiteData,
  Crop,
  CoverCropsData,
  CoverCrop,
  Strategy,
  SoilData,
  TimelineData,
  TimelineYear,
  MonthlyNormal,
  TopographyData,
  NdviData,
  NdviTilesData,
  MapBiomasData,
  MapBiomasState,
  MapBiomasTransition,
  MapBiomasGroupEntry,
  RiskEngineData,
  SoilMoistureData,
  EvapotranspirationData,
  SmapData,
  GpmData,
  GraceData,
  ClimateExtData,
  LstData,
  RotationScores,
} from "./types";

// ── Constants (same as original data.ts) ──────────────────

export const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export const MONTH_NAMES_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const SCORE_LABELS: Record<keyof RotationScores, string> = {
  soil_health: "Cuida do solo",
  erosion_control: "Protege contra erosão",
  water_efficiency: "Aguenta a seca",
  climate_resilience: "Resiste ao clima ruim",
  economic_return: "Dá retorno",
  biodiversity: "Varia as culturas",
};

export const SCORE_COLORS: Record<keyof RotationScores, string> = {
  soil_health: "#8B5E3C",
  erosion_control: "#2D6A4F",
  water_efficiency: "#1E88E5",
  climate_resilience: "#E65100",
  economic_return: "#F9A825",
  biodiversity: "#7CB342",
};

export const KEY_FINDINGS = {
  correlation_dez_fev: 0.63,
  trend_kg_ha_year: 38.1,
  productivity_increase_pct: 56,
  productivity_old: 28.6,
  productivity_new: 44.5,
  hot_days_increase_pct: 36,
  bare_soil_months: "5-6",
  frost_jul_pct: 76,
  frost_aug_pct: 80,
  worst_seasons_pattern: "pouca chuva + calor extremo",
  data_years: 44,
  data_start: 1981,
  data_end: 2025,
};

// ── Helpers ──────────────────────────────────

function db() {
  return createAdminClient();
}

async function getSiteMeta(siteId: string) {
  const { data } = await db()
    .from("climate_yearly")
    .select("values")
    .eq("site_id", siteId)
    .eq("dataset", "site_meta")
    .eq("year", 0)
    .single();
  return data?.values ?? {};
}

// ── Core fetch functions ──────────────────────────────────

export async function getDefaultSiteId(): Promise<string> {
  const { data } = await db().from("sites").select("id").limit(1).single();
  if (!data) throw new Error("No site found in database");
  return data.id;
}

export async function getSite(siteId: string): Promise<SiteData> {
  const { data: siteRow } = await db()
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .single();

  if (!siteRow) throw new Error(`Site ${siteId} not found`);

  const meta = await getSiteMeta(siteId);

  const { data: powerMonthly } = await db()
    .from("climate_monthly")
    .select("month, name, values")
    .eq("site_id", siteId)
    .eq("dataset", "power")
    .order("month");

  const monthlyAverages = (powerMonthly ?? []).map((r: any) => ({
    month: r.month,
    name: r.name,
    avg_rain_mm: r.values.avg_rain_mm,
    avg_tmax_c: r.values.avg_tmax_c,
    avg_tmin_c: r.values.avg_tmin_c,
  }));

  const q1Summary = meta.q1_summary;
  const q1 = q1Summary
    ? { ...q1Summary, monthly_averages: monthlyAverages }
    : null;

  return {
    point: { name: siteRow.name, state: siteRow.state, lat: siteRow.lat, lon: siteRow.lon },
    q1,
    q2: meta.q2_risks ?? { status: "unavailable", source: "", months: [] },
    q3: null,
    q4: null,
    q6: meta.q6_validation ?? { power_vs_station: null, windows: [] },
  };
}

export async function getCrops(): Promise<Crop[]> {
  const { data } = await db().from("crops").select("*").order("id");
  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    name_en: c.name_en,
    season: c.season,
    plant_months: c.plant_months,
    harvest_months: c.harvest_months,
    cycle_days: c.cycle_days,
    temp_min: c.temp_min,
    temp_opt: c.temp_opt,
    temp_max: c.temp_max,
    heat_threshold: c.metadata?.heat_threshold ?? 32,
    frost_tolerant: c.metadata?.frost_tolerant ?? false,
    water_need_mm: c.water_need_mm,
    drought_tolerance: c.drought_tolerance,
    n_fixing: c.n_fixing,
    root_depth: c.metadata?.root_depth ?? "medio",
    root_depth_cm: c.root_depth_cm,
    organic_matter_input: c.metadata?.organic_matter_input ?? "medio",
    erosion_protection: c.metadata?.erosion_protection ?? "medio",
    soil_ph_range: c.metadata?.soil_ph_range ?? [5.0, 7.0],
    market_value: c.metadata?.market_value ?? "medio",
    forage_value: c.metadata?.forage_value ?? "baixo",
    pest_cycle_break: c.metadata?.pest_cycle_break ?? false,
    compaction_relief: c.metadata?.compaction_relief ?? false,
    tags: c.tags ?? [],
  }));
}

export async function getCoverCrops(): Promise<CoverCropsData> {
  const { data } = await db().from("cover_crops").select("*").order("id");
  const meta = await db()
    .from("climate_yearly")
    .select("values")
    .eq("dataset", "site_meta")
    .eq("year", 0)
    .limit(1)
    .single();

  const coverMeta = meta.data?.values?.cover_crops_meta ?? { functions: {}, system_rules: [] };

  const crops: CoverCrop[] = (data ?? []).map((c: any) => ({
    id: c.metadata?.original_id ?? c.id.replace(/_/g, "-"),
    name: c.name,
    name_en: c.name_en,
    scientific: c.scientific,
    family: c.family,
    group: c.group_type,
    functions: c.functions ?? [],
    sowing_months: c.sowing_months,
    days_to_flower: c.metadata?.days_to_flower ?? null,
    dry_matter_t_ha: c.dry_matter_t_ha,
    cn_ratio: c.cn_ratio,
    seed_kg_ha: c.metadata?.seed_kg_ha ?? null,
    notes: c.notes ?? [],
    sources: c.metadata?.sources ?? [],
  }));

  return {
    functions: coverMeta.functions,
    system_rules: coverMeta.system_rules,
    crops,
  };
}

export async function getRotations(siteId: string): Promise<{ strategies: Strategy[]; scoring_methodology: any }> {
  const { data } = await db()
    .from("rotation_strategies")
    .select("*")
    .eq("site_id", siteId)
    .order("total_score", { ascending: false });

  const meta = await getSiteMeta(siteId);

  const strategies: Strategy[] = (data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    subtitle: s.subtitle,
    sequence: s.sequence,
    scores: s.scores as RotationScores,
    total_score: s.total_score,
    evidence: s.evidence ?? { nasa_insight: "", soil_impact: "", climate_risk: "", economic: "" },
    risks: s.risks ?? [],
    benefits: s.benefits ?? [],
  }));

  return {
    strategies,
    scoring_methodology: meta.rotations_meta ?? null,
  };
}

export async function getSoilProfile(siteId: string): Promise<SoilData> {
  const { data } = await db()
    .from("soil_profiles")
    .select("*")
    .eq("site_id", siteId)
    .single();

  if (!data) throw new Error(`No soil profile for site ${siteId}`);

  const siteRow = await db().from("sites").select("lat, lon").eq("id", siteId).single();

  return {
    source: data.source,
    lat: siteRow.data?.lat ?? 0,
    lon: siteRow.data?.lon ?? 0,
    layers: data.layers,
    texture_class: data.texture_class,
    interpretation: data.interpretation,
  };
}

export async function getTimeline(siteId: string): Promise<TimelineData> {
  const { data: yearlyRows } = await db()
    .from("climate_yearly")
    .select("year, values")
    .eq("site_id", siteId)
    .eq("dataset", "timeline")
    .order("year");

  const timeline: TimelineYear[] = (yearlyRows ?? []).map((r: any) => ({
    year: r.year,
    annual_rain_mm: r.values.annual_rain_mm,
    avg_tmax_c: r.values.avg_tmax_c,
    avg_tmin_c: r.values.avg_tmin_c,
    avg_temp_c: r.values.avg_temp_c,
    hot_days: r.values.hot_days,
    frost_days: r.values.frost_days,
    avg_soil_moisture: r.values.avg_soil_moisture,
    season_rain_mm: r.values.season_rain_mm,
    yield_kg_ha: r.values.yield_kg_ha,
    yield_sc_ha: r.values.yield_sc_ha,
    enso: r.values.enso,
  }));

  const meta = await getSiteMeta(siteId);
  const monthlyNormals: MonthlyNormal[] = meta.timeline_monthly_normals ?? [];
  const ensoImpact = meta.timeline_enso_impact ?? {
    el_nino: { avg_yield_sc_ha: 0, n_safras: 0 },
    la_nina: { avg_yield_sc_ha: 0, n_safras: 0 },
    neutro: { avg_yield_sc_ha: 0, n_safras: 0 },
  };

  return { timeline, monthly_normals: monthlyNormals, enso_impact: ensoImpact };
}

export async function getTopography(siteId: string): Promise<TopographyData> {
  const { data: points } = await db()
    .from("topography_points")
    .select("latitude, longitude, elevation_m")
    .eq("site_id", siteId);

  const pts = points ?? [];
  const elevations = pts.map((p: any) => p.elevation_m);
  const minElev = Math.min(...elevations);
  const maxElev = Math.max(...elevations);
  const meanElev = elevations.reduce((a: number, b: number) => a + b, 0) / elevations.length;

  const lats = pts.map((p: any) => p.latitude);
  const lons = pts.map((p: any) => p.longitude);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;

  return {
    source: "NASA SRTM (30m)",
    center: { lat: centerLat, lon: centerLon },
    points: pts.map((p: any) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      elevation_m: p.elevation_m,
    })),
    summary: {
      min_elevation_m: minElev,
      max_elevation_m: maxElev,
      range_m: maxElev - minElev,
      mean_elevation_m: Math.round(meanElev * 10) / 10,
      n_points: pts.length,
    },
  };
}

export async function getNdvi(siteId: string): Promise<NdviData> {
  const { data: summaryRow } = await db()
    .from("ndvi_data")
    .select("values")
    .eq("site_id", siteId)
    .eq("type", "summary")
    .single();

  const { data: monthlyRows } = await db()
    .from("ndvi_data")
    .select("month, values")
    .eq("site_id", siteId)
    .eq("type", "monthly_avg")
    .order("month");

  const { data: annualRows } = await db()
    .from("ndvi_data")
    .select("year, values")
    .eq("site_id", siteId)
    .eq("type", "annual_avg")
    .order("year");

  const sv = summaryRow?.values ?? {};

  return {
    source: sv.source ?? "Sentinel-2",
    resolution: sv.resolution ?? "10m",
    location: sv.location ?? { name: "Cruz Alta", state: "RS", lat: -28.6033, lon: -53.6733 },
    period: sv.period ?? "",
    summary: {
      overall_mean: sv.overall_mean ?? 0,
      overall_min: sv.overall_min ?? 0,
      overall_max: sv.overall_max ?? 0,
      growing_season_mean: sv.growing_season_mean ?? null,
      n_total_records: sv.n_total_records ?? 0,
      n_good_quality: sv.n_good_quality ?? 0,
      years_covered: sv.years_covered ?? "",
    },
    monthly_averages: (monthlyRows ?? []).map((r: any) => ({
      month: r.month,
      name: MONTH_NAMES[r.month - 1],
      avg_ndvi: r.values.avg_ndvi,
      avg_evi: r.values.avg_evi,
      n_obs: r.values.n_obs,
    })),
    annual_averages: (annualRows ?? []).map((r: any) => ({
      year: r.year,
      avg_ndvi: r.values.avg_ndvi,
      n_obs: r.values.n_obs,
      growing_season_ndvi: r.values.growing_season_ndvi,
    })),
  };
}

export async function getNdviTiles(siteId: string): Promise<NdviTilesData> {
  const { data: metaRow } = await db()
    .from("ndvi_data")
    .select("values")
    .eq("site_id", siteId)
    .eq("type", "tile_metadata")
    .single();

  const { data: tileRows } = await db()
    .from("ndvi_data")
    .select("month, values")
    .eq("site_id", siteId)
    .eq("type", "tile")
    .order("month");

  const { data: yearRows } = await db()
    .from("ndvi_data")
    .select("year, values")
    .eq("site_id", siteId)
    .eq("type", "year_comparison")
    .order("year");

  const mv = metaRow?.values ?? {};

  return {
    source: mv.source ?? "Copernicus Sentinel-2 L2A (Harmonized)",
    resolution: mv.resolution ?? "10m",
    center: mv.center ?? { lat: -28.6033, lon: -53.6733 },
    zoom: mv.zoom ?? 13,
    palette: mv.palette ?? [],
    palette_labels: mv.palette_labels ?? [],
    monthly_tiles: (tileRows ?? []).map((r: any) => ({
      month: r.month,
      name: r.values.name,
      tile_url: r.values.tile_url,
      ndvi_mean: r.values.ndvi_mean,
      period: r.values.period,
    })),
    year_comparisons: yearRows?.length
      ? yearRows.map((r: any) => ({
          year: r.year,
          label: r.values.label,
          tile_url: r.values.tile_url,
          ndvi_mean: r.values.ndvi_mean,
          season: r.values.season,
        }))
      : undefined,
  };
}

export async function getMapbiomas(siteId: string): Promise<MapBiomasData> {
  const { data: metaRow } = await db()
    .from("mapbiomas_data")
    .select("values")
    .eq("site_id", siteId)
    .eq("land_use_key", "_metadata")
    .eq("type", "metadata")
    .single();

  const { data: stateRows } = await db()
    .from("mapbiomas_data")
    .select("land_use_key, values")
    .eq("site_id", siteId)
    .eq("type", "current_state");

  const { data: transRows } = await db()
    .from("mapbiomas_data")
    .select("land_use_key, values")
    .eq("site_id", siteId)
    .eq("type", "transition");

  const { data: tsRows } = await db()
    .from("mapbiomas_data")
    .select("land_use_key, year, values")
    .eq("site_id", siteId)
    .eq("type", "timeseries")
    .order("year");

  const mv = metaRow?.values ?? {};

  const current_state: Record<string, MapBiomasState> = {};
  for (const r of stateRows ?? []) {
    current_state[r.land_use_key] = r.values as MapBiomasState;
  }

  const transitions: Record<string, MapBiomasTransition> = {};
  for (const r of transRows ?? []) {
    transitions[r.land_use_key] = r.values as MapBiomasTransition;
  }

  const group_timeseries: Record<string, MapBiomasGroupEntry[]> = {};
  for (const r of tsRows ?? []) {
    if (!group_timeseries[r.land_use_key]) group_timeseries[r.land_use_key] = [];
    group_timeseries[r.land_use_key].push({ year: r.year, area_ha: r.values.area_ha });
  }

  return {
    source: mv.source ?? "MapBiomas",
    resolution: mv.resolution ?? "30m",
    location: mv.location ?? { name: "Cruz Alta", state: "RS", lat: -28.6033, lon: -53.6733 },
    buffer_radius_m: mv.buffer_radius_m ?? 20000,
    period: mv.period ?? "",
    total_area_ha: mv.total_area_ha ?? 0,
    current_state,
    transitions,
    group_timeseries,
  };
}

export async function getRiskEngine(siteId: string): Promise<RiskEngineData> {
  const { data } = await db()
    .from("risk_engine")
    .select("data")
    .eq("site_id", siteId)
    .single();
  if (!data) throw new Error(`No risk engine data for site ${siteId}`);
  return data.data as RiskEngineData;
}

export async function getSoilMoisture(siteId: string): Promise<SoilMoistureData> {
  const { data: monthlyRows } = await db()
    .from("climate_monthly")
    .select("month, name, values")
    .eq("site_id", siteId)
    .eq("dataset", "soil_moisture")
    .order("month");

  const meta = await getSiteMeta(siteId);

  return {
    source: "NASA GLDAS Noah v2.1",
    period: "1981-2024",
    unit: "kg/m2",
    monthly_averages: (monthlyRows ?? []).map((r: any) => ({
      month: r.month,
      name: r.name,
      root_zone: r.values.root_zone,
      profile: r.values.profile,
    })),
    trend: meta.soil_moisture_trend ?? { first_half_avg: 0, second_half_avg: 0, change_pct: 0 },
  };
}

export async function getEvapotranspiration(siteId: string): Promise<EvapotranspirationData> {
  const { data: monthlyRows } = await db()
    .from("climate_monthly")
    .select("month, name, values")
    .eq("site_id", siteId)
    .eq("dataset", "et")
    .order("month");

  const { data: yearlyRows } = await db()
    .from("climate_yearly")
    .select("year, values")
    .eq("site_id", siteId)
    .eq("dataset", "et")
    .order("year");

  const meta = await getSiteMeta(siteId);

  return {
    source: meta.et_meta?.source ?? "MODIS MOD16A2",
    period: meta.et_meta?.period ?? "",
    unit: meta.et_meta?.unit ?? "mm/mes",
    evapotranspiration_monthly: (monthlyRows ?? []).map((r: any) => ({
      month: r.month,
      name: r.name,
      value: r.values.evapotranspiration,
      n_years: r.values.n_years,
    })),
    land_evaporation_monthly: (monthlyRows ?? []).map((r: any) => ({
      month: r.month,
      name: r.name,
      value: r.values.land_evaporation,
      n_years: r.values.n_years,
    })),
    et_yearly_trend: (yearlyRows ?? []).map((r: any) => ({
      year: r.year,
      avg: r.values.avg,
    })),
  };
}

export async function getSmap(siteId: string): Promise<SmapData> {
  const { data: monthlyRows } = await db()
    .from("climate_monthly")
    .select("month, name, values")
    .eq("site_id", siteId)
    .eq("dataset", "smap")
    .order("month");

  const { data: yearlyRows } = await db()
    .from("climate_yearly")
    .select("year, values")
    .eq("site_id", siteId)
    .eq("dataset", "smap")
    .order("year");

  const { data: tsRows } = await db()
    .from("climate_timeseries")
    .select("date, year, month, values")
    .eq("site_id", siteId)
    .eq("dataset", "smap")
    .order("date");

  const meta = await getSiteMeta(siteId);
  const smapMeta = meta.smap_meta ?? {};

  return {
    source: smapMeta.source ?? "NASA SMAP L4",
    description: smapMeta.description ?? "",
    unit: smapMeta.unit ?? "m3/m3",
    period: smapMeta.period ?? "",
    location: smapMeta.location ?? "Cruz Alta-RS",
    band_used: smapMeta.band_used ?? "sm_rootzone",
    monthly_climatology: (monthlyRows ?? []).map((r: any) => ({
      month: r.month,
      name: r.name,
      avg_soil_moisture: r.values.avg_soil_moisture,
      n_years: r.values.n_years,
    })),
    yearly_trend: (yearlyRows ?? []).map((r: any) => ({
      year: r.year,
      avg: r.values.avg,
    })),
    timeseries: (tsRows ?? []).map((r: any) => ({
      date: r.date,
      year: r.year,
      month: r.month,
      soil_moisture: r.values.soil_moisture,
      n_images: r.values.n_images,
    })),
  };
}

export async function getGpm(siteId: string): Promise<GpmData> {
  const { data: monthlyRows } = await db()
    .from("climate_monthly")
    .select("month, name, values")
    .eq("site_id", siteId)
    .eq("dataset", "gpm")
    .order("month");

  const { data: yearlyRows } = await db()
    .from("climate_yearly")
    .select("year, values")
    .eq("site_id", siteId)
    .eq("dataset", "gpm")
    .order("year");

  const { data: tsRows } = await db()
    .from("climate_timeseries")
    .select("date, year, month, values")
    .eq("site_id", siteId)
    .eq("dataset", "gpm")
    .order("date");

  const meta = await getSiteMeta(siteId);
  const gpmMeta = meta.gpm_meta ?? {};

  return {
    source: gpmMeta.source ?? "NASA GPM IMERG",
    description: gpmMeta.description ?? "",
    unit_monthly: gpmMeta.unit_monthly ?? "mm/mes",
    unit_rate: gpmMeta.unit_rate ?? "mm/hr",
    period: gpmMeta.period ?? "",
    location: gpmMeta.location ?? "Cruz Alta-RS",
    monthly_climatology: (monthlyRows ?? []).map((r: any) => ({
      month: r.month,
      name: r.name,
      avg_precip_mm: r.values.avg_precip_mm,
      n_years: r.values.n_years,
    })),
    annual_totals: (yearlyRows ?? []).map((r: any) => ({
      year: r.year,
      total_mm: r.values.total_mm,
      months_counted: r.values.months_counted,
    })),
    trend: meta.gpm_trend ?? { first_half_avg_mm: 0, second_half_avg_mm: 0, change_pct: 0 },
    timeseries: (tsRows ?? []).map((r: any) => ({
      date: r.date,
      year: r.year,
      month: r.month,
      precip_mm_month: r.values.precip_mm_month,
      precip_mm_hr: r.values.precip_mm_hr,
    })),
  };
}

export async function getGrace(siteId: string): Promise<GraceData> {
  const { data: monthlyRows } = await db()
    .from("climate_monthly")
    .select("month, name, values")
    .eq("site_id", siteId)
    .eq("dataset", "grace")
    .order("month");

  const { data: tsRows } = await db()
    .from("climate_timeseries")
    .select("date, year, month, values")
    .eq("site_id", siteId)
    .eq("dataset", "grace")
    .order("date");

  const meta = await getSiteMeta(siteId);
  const graceMeta = meta.grace_meta ?? {};

  return {
    source: graceMeta.source ?? "NASA GRACE/GRACE-FO",
    description: graceMeta.description ?? "",
    unit: graceMeta.unit ?? "cm",
    period: graceMeta.period ?? "",
    location: graceMeta.location ?? "Cruz Alta-RS",
    monthly_climatology: (monthlyRows ?? []).map((r: any) => ({
      month: r.month,
      name: r.name,
      avg_tws_anomaly_cm: r.values.avg_tws_anomaly_cm,
      n_years: r.values.n_years,
    })),
    trend: meta.grace_trend ?? { first_half_avg: 0, second_half_avg: 0, period_split_year: 0, direction: "", change_cm: 0 },
    timeseries: (tsRows ?? []).map((r: any) => ({
      year: r.year,
      month: r.month,
      date: r.date,
      tws_anomaly_cm: r.values.tws_anomaly_cm,
    })),
  };
}

export async function getClimateExtended(siteId: string): Promise<ClimateExtData> {
  const paramKeys = ["solar_radiation", "wind_speed_2m", "relative_humidity", "temperature"];

  const results: Record<string, any> = {};

  for (const key of paramKeys) {
    const { data: rows } = await db()
      .from("climate_monthly")
      .select("month, name, values")
      .eq("site_id", siteId)
      .eq("dataset", `climate_ext_${key}`)
      .order("month");

    const first = rows?.[0]?.values;
    results[key] = {
      param: first?.param ?? key,
      unit: first?.unit ?? "",
      description: first?.param ?? key,
      monthly: (rows ?? []).map((r: any) => ({
        month: r.month,
        name: r.name,
        value: r.values.value,
        n_years: r.values.n_years,
      })),
    };
  }

  const meta = await getSiteMeta(siteId);
  const climExtMeta = meta.climate_ext_meta ?? {};

  return {
    source: climExtMeta.source ?? "NASA POWER",
    period: climExtMeta.period ?? "",
    parameters: results as ClimateExtData["parameters"],
  };
}

export async function getLst(siteId: string): Promise<LstData> {
  const { data: monthlyRows } = await db()
    .from("climate_monthly")
    .select("month, name, values")
    .eq("site_id", siteId)
    .eq("dataset", "lst")
    .order("month");

  const { data: yearlyRows } = await db()
    .from("climate_yearly")
    .select("year, values")
    .eq("site_id", siteId)
    .eq("dataset", "lst")
    .order("year");

  const meta = await getSiteMeta(siteId);
  const lstMeta = meta.lst_meta ?? {};

  return {
    source: lstMeta.source ?? "MODIS MOD11A2",
    description: lstMeta.description ?? "",
    resolution: lstMeta.resolution ?? "1km",
    period: lstMeta.period ?? "",
    unit: lstMeta.unit ?? "graus Celsius",
    total_images: lstMeta.total_images ?? 0,
    summary: meta.lst_summary ?? { summer_avg_day_c: null, winter_avg_day_c: null, amplitude_c: null },
    trend: meta.lst_trend ?? null,
    monthly_climatology: (monthlyRows ?? []).map((r: any) => ({
      month: r.month,
      name: r.name,
      avg_lst_day_c: r.values.avg_lst_day_c,
      avg_lst_night_c: r.values.avg_lst_night_c,
    })),
    yearly_trend: (yearlyRows ?? []).map((r: any) => ({
      year: r.year,
      avg_lst_day_c: r.values.avg_lst_day_c,
      avg_lst_night_c: r.values.avg_lst_night_c,
      n_images: r.values.n_images,
    })),
  };
}

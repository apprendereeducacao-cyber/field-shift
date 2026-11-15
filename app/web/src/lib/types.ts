// Field Shift — Shared type definitions
// Extracted from data.ts for use across server and client components

// ── Climate & Site ──────────────────────────────────

export type MonthRisk = {
  dry_spell: number;
  heat: number;
  heavy_rain: number;
  frost: number;
};

export type RainfallWindow = {
  name: string;
  r: number;
};

export type MonthlyAverage = {
  month: number;
  name: string;
  avg_rain_mm: number;
  avg_tmax_c: number;
  avg_tmin_c: number;
};

export type ClimateSummary = {
  status: string;
  source: string;
  period: { start: number; end: number; years: number };
  annual_rainfall_mm: {
    mean: number;
    median: number;
    min: number;
    max: number;
    min_year: number;
    max_year: number;
  };
  temperature_c: {
    avg_tmax: number;
    avg_tmin: number;
    avg_annual: number;
  };
  extremes: {
    hot_days_per_year: number;
    frost_days_per_year: number;
    hot_days_first_half: number;
    hot_days_second_half: number;
  };
  driest_years: { year: number; rain_mm: number }[];
  wettest_years: { year: number; rain_mm: number }[];
  monthly_averages: MonthlyAverage[];
};

export type SiteData = {
  point: { name: string; state: string; lat: number; lon: number };
  q1: ClimateSummary | null;
  q2: {
    status: string;
    source: string;
    months: MonthRisk[];
  };
  q3: unknown;
  q4: unknown;
  q6: {
    power_vs_station: { r: number; bias_pct: number; n: number; missing_note: string } | null;
    windows: RainfallWindow[];
  };
};

// ── Crops ──────────────────────────────────

export type Crop = {
  id: string;
  name: string;
  name_en: string;
  season: string;
  plant_months: number[];
  harvest_months: number[];
  cycle_days: number[];
  temp_min: number;
  temp_opt: number[];
  temp_max: number;
  heat_threshold: number;
  frost_tolerant: boolean;
  water_need_mm: number[];
  drought_tolerance: string;
  n_fixing: boolean;
  root_depth: string;
  root_depth_cm: number[];
  organic_matter_input: string;
  erosion_protection: string;
  soil_ph_range: number[];
  market_value: string;
  forage_value: string;
  pest_cycle_break: boolean;
  compaction_relief: boolean;
  tags: string[];
};

// ── Rotations ──────────────────────────────────

export type RotationScores = {
  soil_health: number;
  erosion_control: number;
  water_efficiency: number;
  climate_resilience: number;
  economic_return: number;
  biodiversity: number;
};

export type Strategy = {
  id: string;
  name: string;
  subtitle: string;
  sequence: { season: string; crop: string }[];
  scores: RotationScores;
  total_score: number;
  evidence: {
    nasa_insight: string;
    soil_impact: string;
    climate_risk: string;
    economic: string;
  };
  risks: string[];
  benefits: string[];
};

// ── Soil ──────────────────────────────────

export type SoilLayer = {
  depth: string;
  clay_pct: number;
  sand_pct: number;
  silt_pct: number;
  ph: number;
  organic_carbon_g_kg: number;
  nitrogen_g_kg: number;
  cec_cmol_kg: number;
  bulk_density_kg_dm3: number;
};

export type SoilData = {
  source: string;
  lat: number;
  lon: number;
  layers: SoilLayer[];
  texture_class: string;
  interpretation: {
    fertility: string;
    compaction_risk: string;
    water_holding: string;
    erosion_vulnerability: string;
  };
};

// ── Timeline ──────────────────────────────────

export type TimelineYear = {
  year: number;
  annual_rain_mm: number;
  avg_tmax_c: number | null;
  avg_tmin_c: number | null;
  avg_temp_c: number | null;
  hot_days: number;
  frost_days: number;
  avg_soil_moisture: number | null;
  season_rain_mm: number | null;
  yield_kg_ha: number | null;
  yield_sc_ha: number | null;
  enso: string;
};

export type MonthlyNormal = {
  month: number;
  name: string;
  avg_rain_mm: number;
  avg_tmax_c: number;
  avg_tmin_c: number;
  avg_moisture: number;
};

export type EnsoImpact = {
  avg_yield_sc_ha: number;
  avg_season_rain_mm?: number;
  n_safras: number;
};

export type TimelineData = {
  timeline: TimelineYear[];
  monthly_normals: MonthlyNormal[];
  enso_impact: {
    el_nino: EnsoImpact;
    la_nina: EnsoImpact;
    neutro: EnsoImpact;
  };
};

// ── Topography ──────────────────────────────────

export type TopoPoint = {
  latitude: number;
  longitude: number;
  elevation_m: number;
};

export type TopographyData = {
  source: string;
  center: { lat: number; lon: number };
  points: TopoPoint[];
  summary: {
    min_elevation_m: number;
    max_elevation_m: number;
    range_m: number;
    mean_elevation_m: number;
    n_points?: number;
  };
};

// ── Cover Crops ──────────────────────────────────

export type CoverCropSource = {
  field: string;
  url?: string;
  quality: string;
};

export type CoverCrop = {
  id: string;
  name: string;
  name_en: string;
  scientific: string;
  family: string;
  group: string;
  functions: string[];
  sowing_months: number[] | null;
  days_to_flower: number[] | null;
  dry_matter_t_ha: (number | null)[] | null;
  cn_ratio: string | null;
  seed_kg_ha: number[] | null;
  notes: string[];
  sources: CoverCropSource[];
};

export type CoverCropsData = {
  functions: Record<string, string>;
  system_rules: { rule: string; url: string; quality: string }[];
  crops: CoverCrop[];
};

// ── Soil Moisture ──────────────────────────────────

export type SoilMoistureMonth = {
  month: number;
  name: string;
  root_zone: number;
  profile: number;
};

export type SoilMoistureData = {
  source: string;
  period: string;
  unit: string;
  monthly_averages: SoilMoistureMonth[];
  trend: {
    first_half_avg: number;
    second_half_avg: number;
    change_pct: number;
  };
};

// ── NDVI ──────────────────────────────────

export type NdviMonthly = {
  month: number;
  name: string;
  avg_ndvi: number;
  avg_evi: number;
  n_obs: number;
};

export type NdviAnnual = {
  year: number;
  avg_ndvi: number;
  n_obs: number;
  growing_season_ndvi?: number;
};

export type NdviData = {
  source: string;
  resolution: string;
  location: { name: string; state: string; lat: number; lon: number };
  period: string;
  summary: {
    overall_mean: number;
    overall_min: number;
    overall_max: number;
    growing_season_mean: number | null;
    n_total_records: number;
    n_good_quality: number;
    years_covered: string;
  };
  monthly_averages: NdviMonthly[];
  annual_averages: NdviAnnual[];
};

export type NdviTile = {
  month: number;
  name: string;
  tile_url: string;
  ndvi_mean: number;
  period: string;
};

export type NdviTilesData = {
  source: string;
  resolution: string;
  center: { lat: number; lon: number };
  zoom: number;
  palette: string[];
  palette_labels: string[];
  monthly_tiles: NdviTile[];
  year_comparisons?: { year: number; label: string; tile_url: string; ndvi_mean: number; season: string }[];
};

// ── MapBiomas ──────────────────────────────────

export type MapBiomasGroupEntry = {
  year: number;
  area_ha: number;
};

export type MapBiomasState = {
  area_ha: number;
  pct: number;
};

export type MapBiomasTransition = {
  from_ha: number;
  to_ha: number;
  change_pct: number;
  from_year: number;
  to_year: number;
};

export type MapBiomasData = {
  source: string;
  resolution: string;
  location: { name: string; state: string; lat: number; lon: number };
  buffer_radius_m: number;
  period: string;
  total_area_ha: number;
  current_state: Record<string, MapBiomasState>;
  transitions: Record<string, MapBiomasTransition>;
  group_timeseries: Record<string, MapBiomasGroupEntry[]>;
};

// ── Risk Engine ──────────────────────────────────

export type RiskCorrelation = {
  r: number;
  weight: number;
  direction: string;
  meaning: string;
};

export type YearClassification = {
  year: number;
  yield_sc_ha: number;
  class: "safra_boa" | "safra_normal" | "safra_ruim";
  season_rain_mm: number;
  hot_days: number;
  avg_soil_moisture: number;
  enso: string;
};

export type YearRisk = {
  year: number;
  risk_score: number;
  yield_sc_ha: number;
  class: string;
};

export type ScenarioFrequency = {
  count: number;
  pct: number;
  avg_season_rain_mm: number;
  avg_hot_days: number;
  avg_moisture: number;
  enso_distribution: Record<string, number>;
};

export type StrategyAdjustment = {
  baseline: number;
  conservative: number;
  adaptive: number;
  reasoning: Record<string, string>;
};

export type RiskEngineData = {
  meta: { source: string; methodology: string; generated: string };
  model: {
    trend: { slope_sc_ha_year: number; slope_kg_ha_year: number; interpretation: string };
    correlations: {
      season_rain_vs_yield: RiskCorrelation;
      hot_days_vs_yield: RiskCorrelation;
      soil_moisture_vs_yield: RiskCorrelation;
    };
    equation: string;
  };
  risk_thresholds: Record<string, Record<string, { min?: number; max?: number }>>;
  historical_averages: {
    season_rain_mm: number;
    hot_days: number;
    avg_soil_moisture: number;
    yield_sc_ha: number;
  };
  enso_impact: Record<string, { n: number; avg_yield_sc_ha: number; avg_season_rain_mm: number }>;
  scenario_frequencies: Record<string, ScenarioFrequency | null>;
  year_classifications: YearClassification[];
  year_risks: YearRisk[];
  current_scenario: {
    year: number;
    season_rain_mm: number;
    hot_days: number;
    avg_soil_moisture: number;
    enso: string;
    enso_detail: string;
    risk_score: number;
    similar_years: {
      count: number;
      bad_outcomes: number;
      bad_rate: number;
      years: YearRisk[];
    };
  };
  strategy_adjustments: {
    description: string;
    high_risk: StrategyAdjustment;
    medium_risk: StrategyAdjustment;
    low_risk: StrategyAdjustment;
  };
};

// ── Satellite data ──────────────────────────────────

export type ETMonthly = {
  month: number;
  name: string;
  value: number;
  n_years: number;
};

export type ETYearlyTrend = {
  year: number;
  avg: number;
};

export type EvapotranspirationData = {
  source: string;
  period: string;
  unit: string;
  evapotranspiration_monthly: ETMonthly[];
  land_evaporation_monthly: ETMonthly[];
  et_yearly_trend: ETYearlyTrend[];
};

export type SmapMonthly = {
  month: number;
  name: string;
  avg_soil_moisture: number;
  n_years: number;
};

export type SmapYearlyTrend = {
  year: number;
  avg: number;
};

export type SmapTimeseries = {
  date: string;
  year: number;
  month: number;
  soil_moisture: number;
  n_images: number;
};

export type SmapData = {
  source: string;
  description: string;
  unit: string;
  period: string;
  location: string;
  band_used: string;
  monthly_climatology: SmapMonthly[];
  yearly_trend: SmapYearlyTrend[];
  timeseries: SmapTimeseries[];
};

export type GpmMonthly = {
  month: number;
  name: string;
  avg_precip_mm: number;
  n_years: number;
};

export type GpmAnnual = {
  year: number;
  total_mm: number;
  months_counted: number;
};

export type GpmTrend = {
  first_half_avg_mm: number;
  second_half_avg_mm: number;
  change_pct: number;
};

export type GpmTimeseries = {
  date: string;
  year: number;
  month: number;
  precip_mm_month: number;
  precip_mm_hr: number;
};

export type GpmData = {
  source: string;
  description: string;
  unit_monthly: string;
  unit_rate: string;
  period: string;
  location: string;
  monthly_climatology: GpmMonthly[];
  annual_totals: GpmAnnual[];
  trend: GpmTrend;
  timeseries: GpmTimeseries[];
};

export type GraceMonthly = {
  month: number;
  name: string;
  avg_tws_anomaly_cm: number;
  n_years: number;
};

export type GraceTimeseries = {
  year: number;
  month: number;
  date: string;
  tws_anomaly_cm: number;
};

export type GraceTrend = {
  first_half_avg: number;
  second_half_avg: number;
  period_split_year: number;
  direction: string;
  change_cm: number;
};

export type GraceData = {
  source: string;
  description: string;
  unit: string;
  period: string;
  location: string;
  monthly_climatology: GraceMonthly[];
  trend: GraceTrend;
  timeseries: GraceTimeseries[];
};

export type ClimateExtParam = {
  param: string;
  unit: string;
  description: string;
  monthly: { month: number; name: string; value: number; n_years: number }[];
};

export type ClimateExtData = {
  source: string;
  period: string;
  parameters: {
    solar_radiation: ClimateExtParam;
    wind_speed_2m: ClimateExtParam;
    relative_humidity: ClimateExtParam;
    temperature: ClimateExtParam;
  };
};

export type LstMonthly = {
  month: number;
  name: string;
  avg_lst_day_c: number | null;
  avg_lst_night_c: number | null;
};

export type LstYearly = {
  year: number;
  avg_lst_day_c: number;
  avg_lst_night_c: number;
  n_images: number;
};

export type LstTrend = {
  first_half_avg_c: number;
  second_half_avg_c: number;
  change_c: number;
  direction: string;
};

export type LstData = {
  source: string;
  description: string;
  resolution: string;
  period: string;
  unit: string;
  total_images: number;
  summary: {
    summer_avg_day_c: number | null;
    winter_avg_day_c: number | null;
    amplitude_c: number | null;
  };
  trend: LstTrend | null;
  monthly_climatology: LstMonthly[];
  yearly_trend: LstYearly[];
};

// ── Pattern Engine (Year Analog Scoring) ──────────────────────────────────

export type ClimateVector = {
  year: number;
  season_rain_mm: number;
  critical_rain_mm: number;
  hot_days: number;
  frost_days: number;
  avg_soil_moisture: number;
  enso_code: number;
  avg_tmax_summer: number;
  winter_rain_mm: number;
};

export type AnalogYear = {
  year: number;
  similarity_pct: number;
  distance: number;
  matching_dimensions: string[];
  diverging_dimensions: string[];
  outcome: {
    yield_sc_ha: number | null;
    class: string;
    season_rain_mm: number;
    hot_days: number;
    enso: string;
  };
};

export type PatternProjection = {
  expected_yield_range: [number, number];
  confidence: "alta" | "media" | "baixa";
  risk_factors: string[];
  positive_factors: string[];
  recommendation: string;
};

export type PatternAnalysis = {
  site_id: string;
  target_year: number;
  target_vector: ClimateVector;
  analog_years: AnalogYear[];
  projection: PatternProjection;
  all_vectors: ClimateVector[];
  stats: {
    total_years_analyzed: number;
    years_with_yield: number;
    vector_dimensions: number;
  };
};

// ── Map Tiles (GEE raster layers) ──────────────────────────────────

export type MapTileEntry = {
  tile_url: string;
  [key: string]: unknown;
};

export type MapTilesData = {
  elevation: {
    main: {
      tile_url: string;
      slope_tile_url: string;
      hillshade_tile_url: string;
      min_elevation: number;
      max_elevation: number;
      mean_elevation: number;
    } | null;
  };
  lst: {
    monthly: { month: number; name: string; tile_url: string; lst_mean: number }[];
    annual: { tile_url: string } | null;
  };
  precipitation: {
    monthly: { month: number; name: string; tile_url: string; precip_mean: number }[];
  };
  soil_moisture: {
    monthly: { month: number; name: string; tile_url: string; sm_mean: number }[];
  };
  mapbiomas_raster: {
    years: { year: number; tile_url: string }[];
  };
  ecostress: {
    monthly: { month: number; name: string; tile_url: string; lst_mean: number; n_images: number }[];
    annual: { tile_url: string; period: string; total_images: number } | null;
  };
};

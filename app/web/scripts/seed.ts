import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://xrtcqdzxstwbrqwwcmjr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const DATA_DIR = join(__dirname, "../data");

function loadJSON(filename: string) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), "utf-8"));
}

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

async function seed() {
  console.log("Starting seed...\n");

  // 1. Site
  const siteJson = loadJSON("site.json");
  const { data: siteRows, error: siteErr } = await supabase
    .from("sites")
    .upsert(
      {
        name: siteJson.point.name,
        state: siteJson.point.state,
        lat: siteJson.point.lat,
        lon: siteJson.point.lon,
      },
      { onConflict: "name,state" as any }
    )
    .select();

  if (siteErr) {
    // Try insert if upsert fails (no unique on name,state)
    const { data: existing } = await supabase.from("sites").select("id").limit(1);
    if (existing && existing.length > 0) {
      console.log(`sites: using existing row (${existing[0].id})`);
      var siteId = existing[0].id;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("sites")
        .insert({
          name: siteJson.point.name,
          state: siteJson.point.state,
          lat: siteJson.point.lat,
          lon: siteJson.point.lon,
        })
        .select();
      if (insertErr) throw insertErr;
      var siteId = inserted![0].id;
    }
  } else {
    var siteId = siteRows![0].id;
  }
  console.log(`sites: 1 row (id: ${siteId})`);

  // 2. Crops
  const cropsJson = loadJSON("crops.json");
  const cropRows = cropsJson.crops.map((c: any) => ({
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
    water_need_mm: c.water_need_mm,
    drought_tolerance: c.drought_tolerance,
    n_fixing: c.n_fixing,
    root_depth_cm: c.root_depth_cm,
    tags: c.tags,
    metadata: {
      heat_threshold: c.heat_threshold,
      frost_tolerant: c.frost_tolerant,
      root_depth: c.root_depth,
      organic_matter_input: c.organic_matter_input,
      erosion_protection: c.erosion_protection,
      soil_ph_range: c.soil_ph_range,
      market_value: c.market_value,
      forage_value: c.forage_value,
      pest_cycle_break: c.pest_cycle_break,
      compaction_relief: c.compaction_relief,
    },
  }));
  const { error: cropsErr } = await supabase.from("crops").upsert(cropRows, { onConflict: "id" });
  if (cropsErr) throw cropsErr;
  console.log(`crops: ${cropRows.length} rows`);

  // 3. Cover crops (normalize IDs: hyphens -> underscores)
  const coverJson = loadJSON("cover_crops.json");
  const coverRows = coverJson.crops.map((c: any) => ({
    id: c.id.replace(/-/g, "_"),
    name: c.name,
    name_en: c.name_en,
    scientific: c.scientific,
    family: c.family,
    group_type: c.group,
    functions: c.functions,
    sowing_months: c.sowing_months,
    dry_matter_t_ha: c.dry_matter_t_ha,
    cn_ratio: c.cn_ratio,
    notes: c.notes,
    metadata: {
      days_to_flower: c.days_to_flower,
      seed_kg_ha: c.seed_kg_ha,
      sources: c.sources,
      original_id: c.id,
    },
  }));
  const { error: coverErr } = await supabase.from("cover_crops").upsert(coverRows, { onConflict: "id" });
  if (coverErr) throw coverErr;
  console.log(`cover_crops: ${coverRows.length} rows`);

  // 4. Rotation strategies
  const rotJson = loadJSON("rotations.json");
  const rotRows = rotJson.strategies.map((s: any) => ({
    id: s.id,
    site_id: siteId,
    name: s.name,
    subtitle: s.subtitle,
    sequence: s.sequence,
    scores: s.scores,
    total_score: s.total_score,
    evidence: s.evidence,
    risks: s.risks,
    benefits: s.benefits,
  }));
  const { error: rotErr } = await supabase.from("rotation_strategies").upsert(rotRows, { onConflict: "id" });
  if (rotErr) throw rotErr;
  console.log(`rotation_strategies: ${rotRows.length} rows`);

  // 5. Soil profile
  const soilJson = loadJSON("soil.json");
  // Delete existing for this site first
  await supabase.from("soil_profiles").delete().eq("site_id", siteId);
  const { error: soilErr } = await supabase.from("soil_profiles").insert({
    site_id: siteId,
    source: soilJson.source,
    texture_class: soilJson.texture_class,
    interpretation: soilJson.interpretation,
    layers: soilJson.layers,
  });
  if (soilErr) throw soilErr;
  console.log("soil_profiles: 1 row");

  // 6. Climate monthly — unified from multiple sources
  const climateMonthlyRows: any[] = [];

  // 6a. NASA POWER monthly averages (from site.json q1)
  if (siteJson.q1?.monthly_averages) {
    for (const m of siteJson.q1.monthly_averages) {
      climateMonthlyRows.push({
        site_id: siteId,
        source: "NASA POWER",
        dataset: "power",
        month: m.month,
        name: m.name,
        values: { avg_rain_mm: m.avg_rain_mm, avg_tmax_c: m.avg_tmax_c, avg_tmin_c: m.avg_tmin_c },
      });
    }
  }

  // 6b. Soil moisture monthly (from soil_moisture.json)
  const smJson = loadJSON("soil_moisture.json");
  for (const m of smJson.monthly_averages) {
    climateMonthlyRows.push({
      site_id: siteId,
      source: smJson.source,
      dataset: "soil_moisture",
      month: m.month,
      name: m.name,
      values: { root_zone: m.root_zone, profile: m.profile },
    });
  }

  // 6c. SMAP monthly climatology
  const smapJson = loadJSON("smap_soil_moisture.json");
  for (const m of smapJson.monthly_climatology) {
    climateMonthlyRows.push({
      site_id: siteId,
      source: smapJson.source,
      dataset: "smap",
      month: m.month,
      name: m.name,
      values: { avg_soil_moisture: m.avg_soil_moisture, n_years: m.n_years },
    });
  }

  // 6d. GPM monthly climatology
  const gpmJson = loadJSON("gpm_precipitation.json");
  for (const m of gpmJson.monthly_climatology) {
    climateMonthlyRows.push({
      site_id: siteId,
      source: gpmJson.source,
      dataset: "gpm",
      month: m.month,
      name: m.name,
      values: { avg_precip_mm: m.avg_precip_mm, n_years: m.n_years },
    });
  }

  // 6e. GRACE monthly climatology
  const graceJson = loadJSON("grace_tws.json");
  for (const m of graceJson.monthly_climatology) {
    climateMonthlyRows.push({
      site_id: siteId,
      source: graceJson.source,
      dataset: "grace",
      month: m.month,
      name: m.name,
      values: { avg_tws_anomaly_cm: m.avg_tws_anomaly_cm, n_years: m.n_years },
    });
  }

  // 6f. Evapotranspiration monthly
  const etJson = loadJSON("evapotranspiration.json");
  for (const m of etJson.evapotranspiration_monthly) {
    climateMonthlyRows.push({
      site_id: siteId,
      source: etJson.source,
      dataset: "et",
      month: m.month,
      name: m.name,
      values: {
        evapotranspiration: m.value,
        land_evaporation: etJson.land_evaporation_monthly.find((le: any) => le.month === m.month)?.value ?? null,
        n_years: m.n_years,
      },
    });
  }

  // 6g. Climate extended (4 parameters)
  const climExtJson = loadJSON("climate_extended.json");
  for (const [key, param] of Object.entries(climExtJson.parameters) as [string, any][]) {
    for (const m of param.monthly) {
      climateMonthlyRows.push({
        site_id: siteId,
        source: climExtJson.source,
        dataset: `climate_ext_${key}`,
        month: m.month,
        name: m.name,
        values: { value: m.value, n_years: m.n_years, param: param.param, unit: param.unit },
      });
    }
  }

  // 6h. LST monthly climatology
  const lstJson = loadJSON("lst.json");
  for (const m of lstJson.monthly_climatology) {
    climateMonthlyRows.push({
      site_id: siteId,
      source: lstJson.source,
      dataset: "lst",
      month: m.month,
      name: m.name,
      values: { avg_lst_day_c: m.avg_lst_day_c, avg_lst_night_c: m.avg_lst_night_c },
    });
  }

  // 6i. NDVI monthly averages
  const ndviJson = loadJSON("ndvi.json");
  for (const m of ndviJson.monthly_averages) {
    climateMonthlyRows.push({
      site_id: siteId,
      source: ndviJson.source,
      dataset: "ndvi",
      month: m.month,
      name: m.name,
      values: { avg_ndvi: m.avg_ndvi, avg_evi: m.avg_evi, n_obs: m.n_obs },
    });
  }

  // Upsert all climate monthly
  // Delete existing first to avoid conflicts
  await supabase.from("climate_monthly").delete().eq("site_id", siteId);
  const { error: cmErr } = await supabase.from("climate_monthly").insert(climateMonthlyRows);
  if (cmErr) throw cmErr;
  console.log(`climate_monthly: ${climateMonthlyRows.length} rows`);

  // 7. Climate yearly
  const climateYearlyRows: any[] = [];

  // 7a. Timeline yearly
  const timelineJson = loadJSON("timeline.json");
  for (const y of timelineJson.timeline) {
    climateYearlyRows.push({
      site_id: siteId,
      source: "NASA POWER + CONAB",
      dataset: "timeline",
      year: y.year,
      values: {
        annual_rain_mm: y.annual_rain_mm,
        avg_tmax_c: y.avg_tmax_c,
        avg_tmin_c: y.avg_tmin_c,
        avg_temp_c: y.avg_temp_c,
        hot_days: y.hot_days,
        frost_days: y.frost_days,
        avg_soil_moisture: y.avg_soil_moisture,
        season_rain_mm: y.season_rain_mm,
        yield_kg_ha: y.yield_kg_ha,
        yield_sc_ha: y.yield_sc_ha,
        enso: y.enso,
      },
    });
  }

  // 7b. ET yearly trend
  for (const y of etJson.et_yearly_trend) {
    climateYearlyRows.push({
      site_id: siteId,
      source: etJson.source,
      dataset: "et",
      year: y.year,
      values: { avg: y.avg },
    });
  }

  // 7c. SMAP yearly trend
  for (const y of smapJson.yearly_trend) {
    climateYearlyRows.push({
      site_id: siteId,
      source: smapJson.source,
      dataset: "smap",
      year: y.year,
      values: { avg: y.avg },
    });
  }

  // 7d. GPM annual totals
  for (const y of gpmJson.annual_totals) {
    climateYearlyRows.push({
      site_id: siteId,
      source: gpmJson.source,
      dataset: "gpm",
      year: y.year,
      values: { total_mm: y.total_mm, months_counted: y.months_counted },
    });
  }

  // 7e. NDVI annual averages
  for (const y of ndviJson.annual_averages) {
    climateYearlyRows.push({
      site_id: siteId,
      source: ndviJson.source,
      dataset: "ndvi",
      year: y.year,
      values: { avg_ndvi: y.avg_ndvi, n_obs: y.n_obs, growing_season_ndvi: y.growing_season_ndvi },
    });
  }

  // 7f. LST yearly trend
  for (const y of lstJson.yearly_trend) {
    climateYearlyRows.push({
      site_id: siteId,
      source: lstJson.source,
      dataset: "lst",
      year: y.year,
      values: { avg_lst_day_c: y.avg_lst_day_c, avg_lst_night_c: y.avg_lst_night_c, n_images: y.n_images },
    });
  }

  await supabase.from("climate_yearly").delete().eq("site_id", siteId);
  const { error: cyErr } = await supabase.from("climate_yearly").insert(climateYearlyRows);
  if (cyErr) throw cyErr;
  console.log(`climate_yearly: ${climateYearlyRows.length} rows`);

  // 8. Climate timeseries
  const timeseriesRows: any[] = [];

  function normalizeDate(d: string): string {
    if (/^\d{4}-\d{2}$/.test(d)) return `${d}-01`;
    return d;
  }

  // 8a. SMAP timeseries
  for (const t of smapJson.timeseries) {
    timeseriesRows.push({
      site_id: siteId,
      dataset: "smap",
      date: normalizeDate(t.date),
      year: t.year,
      month: t.month,
      values: { soil_moisture: t.soil_moisture, n_images: t.n_images },
    });
  }

  // 8b. GPM timeseries
  for (const t of gpmJson.timeseries) {
    timeseriesRows.push({
      site_id: siteId,
      dataset: "gpm",
      date: normalizeDate(t.date),
      year: t.year,
      month: t.month,
      values: { precip_mm_month: t.precip_mm_month, precip_mm_hr: t.precip_mm_hr },
    });
  }

  // 8c. GRACE timeseries
  for (const t of graceJson.timeseries) {
    timeseriesRows.push({
      site_id: siteId,
      dataset: "grace",
      date: normalizeDate(t.date),
      year: t.year,
      month: t.month,
      values: { tws_anomaly_cm: t.tws_anomaly_cm },
    });
  }

  // Deduplicate by (dataset, date) — keep last occurrence
  const tsMap = new Map<string, any>();
  for (const row of timeseriesRows) {
    tsMap.set(`${row.dataset}::${row.date}`, row);
  }
  const dedupedTimeseries = Array.from(tsMap.values());

  await supabase.from("climate_timeseries").delete().eq("site_id", siteId);
  // Insert in batches of 500
  for (let i = 0; i < dedupedTimeseries.length; i += 500) {
    const batch = dedupedTimeseries.slice(i, i + 500);
    const { error: ctErr } = await supabase.from("climate_timeseries").insert(batch);
    if (ctErr) throw ctErr;
  }
  console.log(`climate_timeseries: ${dedupedTimeseries.length} rows (deduped from ${timeseriesRows.length})`);

  // 9. Topography points (2346 rows — batch insert)
  const topoJson = loadJSON("topography.json");
  await supabase.from("topography_points").delete().eq("site_id", siteId);
  const topoRows = topoJson.points.map((p: any) => ({
    site_id: siteId,
    latitude: p.latitude,
    longitude: p.longitude,
    elevation_m: p.elevation_m,
  }));
  for (let i = 0; i < topoRows.length; i += 500) {
    const batch = topoRows.slice(i, i + 500);
    const { error: tpErr } = await supabase.from("topography_points").insert(batch);
    if (tpErr) throw tpErr;
  }
  console.log(`topography_points: ${topoRows.length} rows`);

  // 10. NDVI data
  const ndviTilesJson = loadJSON("ndvi_tiles.json");
  await supabase.from("ndvi_data").delete().eq("site_id", siteId);
  const ndviRows: any[] = [];

  // Monthly averages
  for (const m of ndviJson.monthly_averages) {
    ndviRows.push({
      site_id: siteId,
      type: "monthly_avg",
      month: m.month,
      year: null,
      values: { avg_ndvi: m.avg_ndvi, avg_evi: m.avg_evi, n_obs: m.n_obs },
    });
  }

  // Annual averages
  for (const y of ndviJson.annual_averages) {
    ndviRows.push({
      site_id: siteId,
      type: "annual_avg",
      month: null,
      year: y.year,
      values: { avg_ndvi: y.avg_ndvi, n_obs: y.n_obs, growing_season_ndvi: y.growing_season_ndvi },
    });
  }

  // Tiles
  for (const t of ndviTilesJson.monthly_tiles) {
    ndviRows.push({
      site_id: siteId,
      type: "tile",
      month: t.month,
      year: null,
      values: {
        name: t.name,
        tile_url: t.tile_url,
        ndvi_mean: t.ndvi_mean,
        period: t.period,
      },
    });
  }

  // Year comparisons from ndvi_tiles
  if (ndviTilesJson.year_comparisons) {
    for (const yc of ndviTilesJson.year_comparisons) {
      ndviRows.push({
        site_id: siteId,
        type: "year_comparison",
        month: null,
        year: yc.year,
        values: { label: yc.label, tile_url: yc.tile_url, ndvi_mean: yc.ndvi_mean, season: yc.season },
      });
    }
  }

  // Store tile metadata (palette, center, zoom) as a special row
  ndviRows.push({
    site_id: siteId,
    type: "tile_metadata",
    month: null,
    year: null,
    values: {
      center: ndviTilesJson.center,
      zoom: ndviTilesJson.zoom,
      palette: ndviTilesJson.palette,
      palette_labels: ndviTilesJson.palette_labels,
      source: ndviTilesJson.source,
      resolution: ndviTilesJson.resolution,
    },
  });

  // Store ndvi summary as a special row
  ndviRows.push({
    site_id: siteId,
    type: "summary",
    month: null,
    year: null,
    values: {
      ...ndviJson.summary,
      source: ndviJson.source,
      resolution: ndviJson.resolution,
      period: ndviJson.period,
      location: ndviJson.location,
    },
  });

  const { error: ndviErr } = await supabase.from("ndvi_data").insert(ndviRows);
  if (ndviErr) throw ndviErr;
  console.log(`ndvi_data: ${ndviRows.length} rows`);

  // 11. MapBiomas data
  const mbJson = loadJSON("mapbiomas.json");
  await supabase.from("mapbiomas_data").delete().eq("site_id", siteId);
  const mbRows: any[] = [];

  // Current state
  for (const [key, val] of Object.entries(mbJson.current_state) as [string, any][]) {
    mbRows.push({
      site_id: siteId,
      land_use_key: key,
      type: "current_state",
      year: null,
      values: val,
    });
  }

  // Transitions
  for (const [key, val] of Object.entries(mbJson.transitions) as [string, any][]) {
    mbRows.push({
      site_id: siteId,
      land_use_key: key,
      type: "transition",
      year: null,
      values: val,
    });
  }

  // Timeseries
  for (const [key, entries] of Object.entries(mbJson.group_timeseries) as [string, any[]][]) {
    for (const entry of entries) {
      mbRows.push({
        site_id: siteId,
        land_use_key: key,
        type: "timeseries",
        year: entry.year,
        values: { area_ha: entry.area_ha },
      });
    }
  }

  // Store metadata
  mbRows.push({
    site_id: siteId,
    land_use_key: "_metadata",
    type: "metadata",
    year: null,
    values: {
      source: mbJson.source,
      resolution: mbJson.resolution,
      location: mbJson.location,
      buffer_radius_m: mbJson.buffer_radius_m,
      period: mbJson.period,
      total_area_ha: mbJson.total_area_ha,
    },
  });

  for (let i = 0; i < mbRows.length; i += 500) {
    const batch = mbRows.slice(i, i + 500);
    const { error: mbErr } = await supabase.from("mapbiomas_data").insert(batch);
    if (mbErr) throw mbErr;
  }
  console.log(`mapbiomas_data: ${mbRows.length} rows`);

  // 12. Risk engine (full JSON as blob)
  const riskJson = loadJSON("risk_engine.json");
  await supabase.from("risk_engine").delete().eq("site_id", siteId);
  const { error: riskErr } = await supabase.from("risk_engine").insert({
    site_id: siteId,
    data: riskJson,
  });
  if (riskErr) throw riskErr;
  console.log("risk_engine: 1 row");

  // Store extra site data (q1, q2, q6 from site.json) as metadata in the sites table
  // We'll store site.json extras in a separate approach — keep in climate_monthly/yearly
  // Store soil_moisture trend + site q2/q6 in a special climate_yearly row
  const siteExtras = {
    site_id: siteId,
    source: "site.json",
    dataset: "site_meta",
    year: 0,
    values: {
      q1_summary: siteJson.q1
        ? {
            status: siteJson.q1.status,
            source: siteJson.q1.source,
            period: siteJson.q1.period,
            annual_rainfall_mm: siteJson.q1.annual_rainfall_mm,
            temperature_c: siteJson.q1.temperature_c,
            extremes: siteJson.q1.extremes,
            driest_years: siteJson.q1.driest_years,
            wettest_years: siteJson.q1.wettest_years,
          }
        : null,
      q2_risks: siteJson.q2,
      q6_validation: siteJson.q6,
      soil_moisture_trend: smJson.trend,
      timeline_monthly_normals: timelineJson.monthly_normals,
      timeline_enso_impact: timelineJson.enso_impact,
      gpm_trend: gpmJson.trend,
      grace_trend: graceJson.trend,
      lst_trend: lstJson.trend,
      lst_summary: lstJson.summary,
      smap_meta: { source: smapJson.source, description: smapJson.description, unit: smapJson.unit, period: smapJson.period, location: smapJson.location, band_used: smapJson.band_used },
      gpm_meta: { source: gpmJson.source, description: gpmJson.description, unit_monthly: gpmJson.unit_monthly, unit_rate: gpmJson.unit_rate, period: gpmJson.period, location: gpmJson.location },
      grace_meta: { source: graceJson.source, description: graceJson.description, unit: graceJson.unit, period: graceJson.period, location: graceJson.location },
      lst_meta: { source: lstJson.source, description: lstJson.description, resolution: lstJson.resolution, period: lstJson.period, unit: lstJson.unit, total_images: lstJson.total_images, buffer_radius_m: lstJson.buffer_radius_m },
      et_meta: { source: etJson.source, unit: etJson.unit, period: etJson.period },
      climate_ext_meta: { source: climExtJson.source, period: climExtJson.period },
      rotations_meta: rotJson.scoring_methodology,
      cover_crops_meta: { functions: coverJson.functions, system_rules: coverJson.system_rules },
    },
  };
  await supabase.from("climate_yearly").upsert(siteExtras, { onConflict: "site_id,dataset,year" });
  console.log("site_meta: 1 row (in climate_yearly)");

  console.log("\nSeed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

// =============================================================
// Field Shift — Update ALL Map Tile URLs in Supabase
// =============================================================
// Usage:
//   1. Run each GEE script in Code Editor, copy tile URLs
//   2. Paste URLs into the sections below
//   3. Run: node scripts/gee/update-map-tiles.mjs
// =============================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}

const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const SITE_ID = "2fe73948-5483-409a-bb12-145dc2c1786c";

// ┌──────────────────────────────────────────────────────────┐
// │  PASTE GEE OUTPUT HERE                                    │
// └──────────────────────────────────────────────────────────┘

const ELEVATION = {
  tile_url: "PASTE_URL_HERE",
  slope_tile_url: "PASTE_URL_HERE",
  hillshade_tile_url: "PASTE_URL_HERE",
  min_elevation: 0,
  max_elevation: 0,
  mean_elevation: 0,
};

const LST_MONTHLY = [
  { month: 1,  name: "Janeiro",   tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 2,  name: "Fevereiro", tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 3,  name: "Marco",     tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 4,  name: "Abril",     tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 5,  name: "Maio",      tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 6,  name: "Junho",     tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 7,  name: "Julho",     tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 8,  name: "Agosto",    tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 9,  name: "Setembro",  tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 10, name: "Outubro",   tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 11, name: "Novembro",  tile_url: "PASTE_URL_HERE", lst_mean: 0 },
  { month: 12, name: "Dezembro",  tile_url: "PASTE_URL_HERE", lst_mean: 0 },
];

const LST_ANNUAL = {
  tile_url: "PASTE_URL_HERE",
};

const PRECIP_MONTHLY = [
  { month: 1,  name: "Janeiro",   tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 2,  name: "Fevereiro", tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 3,  name: "Marco",     tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 4,  name: "Abril",     tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 5,  name: "Maio",      tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 6,  name: "Junho",     tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 7,  name: "Julho",     tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 8,  name: "Agosto",    tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 9,  name: "Setembro",  tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 10, name: "Outubro",   tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 11, name: "Novembro",  tile_url: "PASTE_URL_HERE", precip_mean: 0 },
  { month: 12, name: "Dezembro",  tile_url: "PASTE_URL_HERE", precip_mean: 0 },
];

const SOIL_MOISTURE_MONTHLY = [
  { month: 1,  name: "Janeiro",   tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 2,  name: "Fevereiro", tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 3,  name: "Marco",     tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 4,  name: "Abril",     tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 5,  name: "Maio",      tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 6,  name: "Junho",     tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 7,  name: "Julho",     tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 8,  name: "Agosto",    tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 9,  name: "Setembro",  tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 10, name: "Outubro",   tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 11, name: "Novembro",  tile_url: "PASTE_URL_HERE", sm_mean: 0 },
  { month: 12, name: "Dezembro",  tile_url: "PASTE_URL_HERE", sm_mean: 0 },
];

const MAPBIOMAS = [
  { year: 2023, tile_url: "PASTE_URL_HERE" },
  { year: 2022, tile_url: "PASTE_URL_HERE" },
  { year: 2020, tile_url: "PASTE_URL_HERE" },
  { year: 2015, tile_url: "PASTE_URL_HERE" },
  { year: 2010, tile_url: "PASTE_URL_HERE" },
  { year: 2000, tile_url: "PASTE_URL_HERE" },
  { year: 1990, tile_url: "PASTE_URL_HERE" },
];

// =============================================================

async function upsertMapTile(dataset, type, key, values) {
  const { error } = await db
    .from("map_tiles")
    .upsert({
      site_id: SITE_ID,
      dataset,
      type,
      key,
      values,
    }, { onConflict: "site_id,dataset,type,key" });

  if (error) {
    console.error(`  [ERROR] ${dataset}/${type}/${key}: ${error.message}`);
    return false;
  }
  return true;
}

async function run() {
  console.log("=== Updating map tiles in Supabase ===\n");

  // 1. Elevation
  if (ELEVATION.tile_url !== "PASTE_URL_HERE") {
    console.log("ELEVATION (SRTM):");
    await upsertMapTile("srtm", "elevation", "main", ELEVATION);
    console.log("  [OK] Elevation tile saved");
  } else {
    console.log("ELEVATION: skipped (no URL)");
  }

  // 2. LST monthly
  let lstCount = 0;
  for (const t of LST_MONTHLY) {
    if (t.tile_url === "PASTE_URL_HERE") continue;
    await upsertMapTile("lst", "monthly", String(t.month), t);
    lstCount++;
  }
  console.log(`LST: ${lstCount}/12 monthly tiles saved`);

  if (LST_ANNUAL.tile_url !== "PASTE_URL_HERE") {
    await upsertMapTile("lst", "annual", "2020-2024", LST_ANNUAL);
    console.log("  [OK] LST annual tile saved");
  }

  // 3. Precipitation monthly
  let precipCount = 0;
  for (const t of PRECIP_MONTHLY) {
    if (t.tile_url === "PASTE_URL_HERE") continue;
    await upsertMapTile("gpm", "monthly", String(t.month), t);
    precipCount++;
  }
  console.log(`GPM PRECIPITATION: ${precipCount}/12 monthly tiles saved`);

  // 4. Soil moisture monthly
  let smCount = 0;
  for (const t of SOIL_MOISTURE_MONTHLY) {
    if (t.tile_url === "PASTE_URL_HERE") continue;
    await upsertMapTile("smap", "monthly", String(t.month), t);
    smCount++;
  }
  console.log(`SMAP SOIL MOISTURE: ${smCount}/12 monthly tiles saved`);

  // 5. MapBiomas
  let mbCount = 0;
  for (const t of MAPBIOMAS) {
    if (t.tile_url === "PASTE_URL_HERE") continue;
    await upsertMapTile("mapbiomas", "landuse", String(t.year), t);
    mbCount++;
  }
  console.log(`MAPBIOMAS: ${mbCount}/${MAPBIOMAS.length} year tiles saved`);

  console.log("\nDone!");
}

run().catch(console.error);

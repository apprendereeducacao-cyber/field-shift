// =============================================================
// Field Shift — Update Supabase NDVI tiles to Sentinel-2
// =============================================================
// Usage:
//   1. Run sentinel2-ndvi-tiles.js in GEE Code Editor
//   2. Copy the 12 tile URLs and NDVI means into TILES below
//   3. Run: node scripts/gee/update-ndvi-tiles.mjs
//
// Requires .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
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
// │  Replace each tile_url and ndvi_mean with actual values   │
// └──────────────────────────────────────────────────────────┘
const TILES = [
  { month: 1,  name: "Janeiro",   tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 2,  name: "Fevereiro", tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 3,  name: "Marco",     tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 4,  name: "Abril",     tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 5,  name: "Maio",      tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 6,  name: "Junho",     tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 7,  name: "Julho",     tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 8,  name: "Agosto",    tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 9,  name: "Setembro",  tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 10, name: "Outubro",   tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 11, name: "Novembro",  tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
  { month: 12, name: "Dezembro",  tile_url: "PASTE_URL_HERE", ndvi_mean: 0.0 },
];

async function updateTiles() {
  console.log("Updating 12 monthly NDVI tiles to Sentinel-2...\n");

  for (const tile of TILES) {
    if (tile.tile_url === "PASTE_URL_HERE") {
      console.log(`  [SKIP] Month ${tile.month} (${tile.name}) — URL not set`);
      continue;
    }

    const { error } = await db
      .from("ndvi_data")
      .update({
        values: {
          name: tile.name,
          period: "2020-2024 (media 5 anos)",
          tile_url: tile.tile_url,
          ndvi_mean: tile.ndvi_mean,
        },
      })
      .eq("site_id", SITE_ID)
      .eq("type", "tile")
      .eq("month", tile.month);

    if (error) {
      console.error(`  [ERROR] Month ${tile.month}: ${error.message}`);
    } else {
      console.log(`  [OK] Month ${tile.month} (${tile.name}) — NDVI mean: ${tile.ndvi_mean}`);
    }
  }

  console.log("\nUpdating tile metadata...");

  const { error: metaError } = await db
    .from("ndvi_data")
    .update({
      values: {
        source: "Copernicus Sentinel-2 L2A (Harmonized)",
        resolution: "10m",
        center: { lat: -28.6033, lon: -53.6733 },
        zoom: 13,
        palette: [
          "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf",
          "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837",
        ],
        palette_labels: [
          "Solo nu", "", "Vegetacao rala", "", "Moderada",
          "", "Densa", "", "Muito densa", "Maxima",
        ],
      },
    })
    .eq("site_id", SITE_ID)
    .eq("type", "tile_metadata");

  if (metaError) {
    console.error(`  [ERROR] Metadata: ${metaError.message}`);
  } else {
    console.log("  [OK] Metadata updated — source: Sentinel-2 L2A, resolution: 10m, zoom: 13");
  }

  console.log("\nDone!");
}

updateTiles();

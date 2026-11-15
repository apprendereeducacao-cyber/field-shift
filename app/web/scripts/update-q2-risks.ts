import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as fs from "fs";

const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const k = trimmed.slice(0, eqIdx).trim();
  const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[k]) process.env[k] = v;
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const q2Path = path.resolve(__dirname, "../../science/q2_risks_output.json");
const q2Data = JSON.parse(fs.readFileSync(q2Path, "utf-8"));

async function main() {
  const { data: rows, error: fetchErr } = await supabase
    .from("climate_yearly")
    .select("id, values")
    .eq("dataset", "site_meta")
    .eq("year", 0)
    .limit(1);

  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.error("No site_meta row found");
    process.exit(1);
  }

  const row = rows[0];
  const values = row.values as Record<string, unknown>;
  values.q2_risks = q2Data;

  const { error: updateErr } = await supabase
    .from("climate_yearly")
    .update({ values })
    .eq("id", row.id);

  if (updateErr) {
    console.error("Update error:", updateErr);
    process.exit(1);
  }

  console.log("q2_risks updated successfully in Supabase");
  console.log("New dry_spell values:");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  q2Data.months.forEach((m: { dry_spell: number }, i: number) => {
    console.log(`  ${months[i]}: ${m.dry_spell} (${Math.round(m.dry_spell * 10)} em 10)`);
  });
}

main();

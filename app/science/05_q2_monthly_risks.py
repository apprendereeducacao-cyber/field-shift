# SI-assisted — Q2: Monthly climate risk fractions from NASA POWER daily 1981-2025
# For each calendar month, fraction of years with:
#   dry_spell:  monthly precip < 50% of climatological normal OR 8+ consecutive days < 2mm
#   heat:       >= 5 days with Tmax >= 32 C
#   heavy_rain: >= 1 day with precip >= 50 mm
#   frost:      >= 1 day with Tmin <= 2 C

import json
import os
from datetime import date, timedelta
from collections import defaultdict

DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(DIR, "power_cruzalta.json")) as f:
    data = json.load(f)

precip = data["PRECTOTCORR"]
tmax = data["T2M_MAX"]
tmin = data["T2M_MIN"]

FILL = -999.0

def days_in_month(y, m):
    if m == 12:
        return (date(y + 1, 1, 1) - date(y, m, 1)).days
    return (date(y, m + 1, 1) - date(y, m, 1)).days

# Phase 1: compute monthly precipitation normals (climatological average)
monthly_totals = defaultdict(list)
for year in range(1981, 2026):
    for month in range(1, 13):
        try:
            n_days = days_in_month(year, month)
        except ValueError:
            continue
        total = 0.0
        valid = 0
        for day in range(1, n_days + 1):
            key = f"{year}{month:02d}{day:02d}"
            p = precip.get(key)
            if p is not None and p != FILL:
                total += p
                valid += 1
        if valid >= n_days * 0.7:
            monthly_totals[month].append(total)

monthly_normals = {}
for month in range(1, 13):
    vals = monthly_totals[month]
    monthly_normals[month] = sum(vals) / len(vals) if vals else 100.0

print("Monthly precip normals (mm):")
for m in range(1, 13):
    print(f"  {date(2000, m, 1).strftime('%b')}: {monthly_normals[m]:.1f} mm")

# Phase 2: compute risk fractions
results = []

for month in range(1, 13):
    years_with_data = []
    dry_count = 0
    heat_count = 0
    heavy_count = 0
    frost_count = 0

    for year in range(1981, 2026):
        try:
            n_days = days_in_month(year, month)
        except ValueError:
            continue

        daily_precip = []
        daily_tmax = []
        daily_tmin = []
        missing = 0

        for day in range(1, n_days + 1):
            key = f"{year}{month:02d}{day:02d}"
            p = precip.get(key)
            tx = tmax.get(key)
            tn = tmin.get(key)

            if p is None or p == FILL:
                missing += 1
                daily_precip.append(None)
            else:
                daily_precip.append(p)

            if tx is None or tx == FILL:
                daily_tmax.append(None)
            else:
                daily_tmax.append(tx)

            if tn is None or tn == FILL:
                daily_tmin.append(None)
            else:
                daily_tmin.append(tn)

        if missing > n_days * 0.3:
            continue

        years_with_data.append(year)

        # dry_spell: deficit hidrico — precip < 50% da normal OU 8+ dias consecutivos < 2mm
        month_total = sum(p for p in daily_precip if p is not None)
        deficit = month_total < (monthly_normals[month] * 0.5)

        max_streak = 0
        streak = 0
        for p in daily_precip:
            if p is not None and p < 2.0:
                streak += 1
                max_streak = max(max_streak, streak)
            else:
                streak = 0
        veranico = max_streak >= 8

        if deficit or veranico:
            dry_count += 1

        # heat: 5+ days with Tmax >= 32
        hot_days = sum(1 for t in daily_tmax if t is not None and t >= 32.0)
        if hot_days >= 5:
            heat_count += 1

        # heavy_rain: 1+ day with precip >= 50mm
        heavy_days = sum(1 for p in daily_precip if p is not None and p >= 50.0)
        if heavy_days >= 1:
            heavy_count += 1

        # frost: 1+ day with Tmin <= 2
        frost_days = sum(1 for t in daily_tmin if t is not None and t <= 2.0)
        if frost_days >= 1:
            frost_count += 1

    n = len(years_with_data)
    if n == 0:
        results.append({"dry_spell": 0.0, "heat": 0.0, "heavy_rain": 0.0, "frost": 0.0})
    else:
        results.append({
            "dry_spell": round(dry_count / n, 3),
            "heat": round(heat_count / n, 3),
            "heavy_rain": round(heavy_count / n, 3),
            "frost": round(frost_count / n, 3),
        })

    month_name = date(2000, month, 1).strftime("%b")
    print(f"{month_name}: dry={results[-1]['dry_spell']:.3f} heat={results[-1]['heat']:.3f} heavy={results[-1]['heavy_rain']:.3f} frost={results[-1]['frost']:.3f}  (n={n})")

# Output as JSON for Supabase update
q2_data = {
    "status": "real",
    "source": "NASA POWER daily 1981-2025",
    "months": results,
}

output_path = os.path.join(DIR, "q2_risks_output.json")
with open(output_path, "w") as f:
    json.dump(q2_data, indent=2, ensure_ascii=False, fp=f)

# Also try to update site.json if it exists
site_path = os.path.join(DIR, "..", "web", "data", "site.json")
if os.path.exists(site_path):
    with open(site_path) as f:
        site = json.load(f)
    site["q2"] = q2_data
    with open(site_path, "w") as f:
        json.dump(site, f, indent=2, ensure_ascii=False)
    print(f"\nUpdated q2 in {site_path}")
else:
    print(f"\nsite.json not found — output saved to {output_path}")
    print("Update Supabase climate_yearly.values.q2_risks with the new data")

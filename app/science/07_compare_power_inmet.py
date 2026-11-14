# SI-assisted — B1: Compare NASA POWER vs INMET station rainfall per soy season
# B2: Correlate detrended yield with rainfall in different windows

import csv
import json
import os
import math
from collections import defaultdict
from datetime import date, timedelta

DIR = os.path.dirname(os.path.abspath(__file__))

# --- Load POWER daily data ---
with open(os.path.join(DIR, "power_cruzalta.json")) as f:
    power_raw = json.load(f)
power_precip = power_raw["PRECTOTCORR"]
FILL = -999.0

# --- Load IBGE yield ---
ibge = {}
with open(os.path.join(DIR, "ibge_soja_cruzalta.csv")) as f:
    for row in csv.DictReader(f):
        ibge[int(row["ano"])] = int(row["kg_ha"])

# --- Load safras ---
safras = {}
with open(os.path.join(DIR, "safras_cruzalta.csv")) as f:
    for row in csv.DictReader(f):
        safras[int(row["safra"])] = float(row["chuva_nov_mar_mm"])

def daterange(start, end):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)

def pearson(xs, ys):
    n = len(xs)
    if n < 3:
        return float("nan"), n
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    dy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if dx == 0 or dy == 0:
        return float("nan"), n
    return num / (dx * dy), n

# ========== B1: POWER vs INMET (if data available) ==========
inmet_path = os.path.join(DIR, "inmet_daily_cruzalta.csv")
power_vs_station = None

if os.path.exists(inmet_path):
    inmet = {}
    with open(inmet_path) as f:
        for row in csv.DictReader(f):
            inmet[row["date"]] = float(row["precip_mm"])

    print("=" * 60)
    print("B1: POWER vs INMET station — Nov-Mar season rainfall")
    print("=" * 60)

    season_power = {}
    season_inmet = {}

    for harvest_year in range(2008, 2026):
        start = date(harvest_year - 1, 11, 1)
        end = date(harvest_year, 3, 31)
        total_days = (end - start).days + 1

        p_sum = 0.0
        i_sum = 0.0
        missing_days = 0

        for d in daterange(start, end):
            key_power = d.strftime("%Y%m%d")
            key_inmet = d.strftime("%Y-%m-%d")

            pv = power_precip.get(key_power)
            if pv is not None and pv != FILL:
                p_sum += pv

            iv = inmet.get(key_inmet)
            if iv is not None:
                i_sum += iv
            else:
                missing_days += 1

        miss_pct = missing_days / total_days
        if miss_pct <= 0.10:
            season_power[harvest_year] = round(p_sum, 1)
            season_inmet[harvest_year] = round(i_sum, 1)
            print(f"  {harvest_year}: POWER={p_sum:.1f}mm  INMET={i_sum:.1f}mm  missing={miss_pct:.0%} OK")
        else:
            print(f"  {harvest_year}: SKIP ({miss_pct:.0%} missing)")

    common_years = sorted(set(season_power.keys()) & set(season_inmet.keys()))
    if len(common_years) >= 3:
        pw = [season_power[y] for y in common_years]
        im = [season_inmet[y] for y in common_years]
        r, n = pearson(pw, im)
        diffs = [season_power[y] - season_inmet[y] for y in common_years]
        mean_power = sum(pw) / len(pw)
        mean_diff = sum(diffs) / len(diffs)
        bias_pct = round((mean_diff / mean_power) * 100, 1) if mean_power else 0
        missing_note = f"{n} seasons with <10% missing INMET data (station since 2007)"
        print(f"\n  Pearson r = {r:.3f}, n = {n}, bias = {bias_pct}%")
        power_vs_station = {"r": round(r, 3), "bias_pct": bias_pct, "n": n, "missing_note": missing_note}
else:
    print("B1: INMET data not yet available — power_vs_station = null")
    print("    (will update when INMET download completes)")

# ========== B2: Detrended yield vs rainfall windows ==========
print(f"\n{'=' * 60}")
print("B2: Detrended yield vs rainfall in different windows")
print("=" * 60)

common_prod = sorted(set(safras.keys()) & set(ibge.keys()))
years_arr = common_prod
prods = [ibge[y] for y in years_arr]

# Linear trend
n = len(years_arr)
mx = sum(years_arr) / n
my = sum(prods) / n
slope = sum((x - mx) * (y - my) for x, y in zip(years_arr, prods)) / sum((x - mx) ** 2 for x in years_arr)
intercept = my - slope * mx

residuals = {y: ibge[y] - (slope * y + intercept) for y in years_arr}
print(f"  Trend: {slope:.1f} kg/ha per year (intercept {intercept:.0f})")

windows = [
    ("nov-mar", [11, 12, 1, 2, 3]),
    ("dez-fev", [12, 1, 2]),
    ("jan-fev", [1, 2]),
    ("jan", [1]),
    ("fev", [2]),
]

window_results = []

for name, months in windows:
    rains = []
    resids = []
    for y in years_arr:
        total = 0.0
        for m in months:
            yr = y - 1 if m >= 11 else y
            d_start = date(yr, m, 1)
            if m == 12:
                d_end = date(yr, 12, 31)
            else:
                d_end = date(yr, m + 1, 1) - timedelta(days=1) if m < 12 else date(yr + 1, 1, 1) - timedelta(days=1)
            for day in daterange(d_start, d_end):
                key = day.strftime("%Y%m%d")
                pv = power_precip.get(key)
                if pv is not None and pv != FILL:
                    total += pv
        rains.append(total)
        resids.append(residuals[y])

    r, nn = pearson(rains, resids)
    print(f"  {name:>8}: r = {r:.3f} (n={nn})")
    window_results.append({"name": name, "r": round(r, 3)})

# ========== Update site.json ==========
site_path = os.path.join(DIR, "..", "web", "data", "site.json")
with open(site_path) as f:
    site = json.load(f)

if site.get("q6") is None:
    site["q6"] = {}

site["q6"]["power_vs_station"] = power_vs_station
site["q6"]["windows"] = window_results

with open(site_path, "w") as f:
    json.dump(site, f, indent=2, ensure_ascii=False)

print(f"\nUpdated q6 in {site_path}")

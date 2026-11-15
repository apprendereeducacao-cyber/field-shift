# SI-assisted — GRACE/GRACE-FO Terrestrial Water Storage anomaly via Earth Engine
# Dataset: NASA/GRACE/MASS_GRIDS/MASCON_CRI (JPL MASCON RL06.1 v03)
# Monthly TWS anomaly (lwe_thickness) for Cruz Alta-RS region
# Unit: cm equivalent water thickness (anomaly relative to 2004-2009 baseline)
# Resolution: ~0.5 degrees (~55 km)

import json
import os
import warnings
import ee

warnings.filterwarnings("ignore")

DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT = "apprendere-educacao"

# Cruz Alta-RS coordinates and region
LAT = -28.6033
LON = -53.6733
# Use a point with 0.5 degree buffer (GRACE resolution is coarse)
BUFFER_M = 30000  # 30 km radius

# Initialize Earth Engine (uses default credentials like other scripts)
ee.Initialize(project=PROJECT)
print("Earth Engine initialized")

# Define region of interest
point = ee.Geometry.Point([LON, LAT])
roi = point.buffer(BUFFER_M)

# GRACE MASCON dataset
# Try the JPL MASCON CRI collection first
# Try V04 (includes GRACE-FO), then fall back to older
for cid in [
    "NASA/GRACE/MASS_GRIDS_V04/MASCON_CRI",
    "NASA/GRACE/MASS_GRIDS/MASCON_CRI",
]:
    try:
        grace = ee.ImageCollection(cid)
        count = grace.size().getInfo()
        collection_id = cid
        print(f"Collection {collection_id}: {count} images")
        break
    except Exception as e:
        print(f"  {cid}: not available ({e})")
        continue

# Filter to our region and get band info
sample = grace.first()
bands = sample.bandNames().getInfo()
print(f"Bands: {bands}")

# Use lwe_thickness band (liquid water equivalent thickness anomaly)
band = "lwe_thickness" if "lwe_thickness" in bands else bands[0]
print(f"Using band: {band}")

# Get all monthly values for the region
def extract_monthly(image):
    date = ee.Date(image.get("system:time_start"))
    mean_val = image.select(band).reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=roi,
        scale=50000,  # GRACE is ~50km resolution
    ).get(band)
    return ee.Feature(None, {
        "year": date.get("year"),
        "month": date.get("month"),
        "date": date.format("YYYY-MM"),
        "tws_anomaly_cm": mean_val,
    })

print("Extracting monthly TWS anomaly values...")
features = grace.map(extract_monthly)
data_list = features.getInfo()["features"]

monthly_data = []
for feat in data_list:
    props = feat["properties"]
    val = props.get("tws_anomaly_cm")
    if val is not None:
        monthly_data.append({
            "year": props["year"],
            "month": props["month"],
            "date": props["date"],
            "tws_anomaly_cm": round(val, 3),
        })

monthly_data.sort(key=lambda x: x["date"])
print(f"Got {len(monthly_data)} monthly records")

# Compute monthly climatology
MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
               "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

clim = {m: [] for m in range(1, 13)}
for rec in monthly_data:
    clim[rec["month"]].append(rec["tws_anomaly_cm"])

monthly_avg = []
for m in range(1, 13):
    vals = clim[m]
    avg = round(sum(vals) / len(vals), 3) if vals else None
    monthly_avg.append({
        "month": m,
        "name": MONTH_NAMES[m - 1],
        "avg_tws_anomaly_cm": avg,
        "n_years": len(vals),
    })

# Compute trend (first half vs second half)
if monthly_data:
    mid_year = (monthly_data[0]["year"] + monthly_data[-1]["year"]) // 2
    first_half = [r["tws_anomaly_cm"] for r in monthly_data if r["year"] <= mid_year]
    second_half = [r["tws_anomaly_cm"] for r in monthly_data if r["year"] > mid_year]
    trend = {
        "first_half_avg": round(sum(first_half) / len(first_half), 3) if first_half else None,
        "second_half_avg": round(sum(second_half) / len(second_half), 3) if second_half else None,
        "period_split_year": mid_year,
    }
    if first_half and second_half:
        fh = trend["first_half_avg"]
        sh = trend["second_half_avg"]
        trend["direction"] = "gaining" if sh > fh else "losing"
        trend["change_cm"] = round(sh - fh, 3)
else:
    trend = None

# Build final summary
first_date = monthly_data[0]["date"] if monthly_data else "N/A"
last_date = monthly_data[-1]["date"] if monthly_data else "N/A"

summary = {
    "source": f"GRACE/GRACE-FO via Earth Engine ({collection_id})",
    "description": "Anomalia de Armazenamento Total de Agua (TWS) - agua subterranea + solo + superficie",
    "unit": "cm (espessura equivalente de agua liquida, anomalia vs 2004-2009)",
    "period": f"{first_date} a {last_date}",
    "location": "Cruz Alta-RS (buffer 30km)",
    "monthly_climatology": monthly_avg,
    "trend": trend,
    "timeseries": monthly_data,
}

out_path = os.path.join(DIR, "grace_tws_cruzalta.json")
with open(out_path, "w") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"\nSaved: {out_path}")
print(f"Period: {first_date} to {last_date}")
print(f"Monthly records: {len(monthly_data)}")
if trend:
    print(f"Trend: {trend['direction']} ({trend['change_cm']} cm)")

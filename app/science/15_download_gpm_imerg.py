# SI-assisted — GPM IMERG Satellite Precipitation via Earth Engine
# Dataset: NASA/GPM_L3/IMERG_MONTHLY_V07 (GPM IMERG Final Run monthly)
# Monthly precipitation for Cruz Alta-RS region
# Band: precipitation (mm/hr average for the month)
# Resolution: 0.1 degree (~10km)
# Available from 2000-06 onwards

import json
import os
import warnings
import ee

warnings.filterwarnings("ignore")

DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT = "apprendere-educacao"

LAT = -28.6033
LON = -53.6733
BUFFER_M = 10000  # 10 km

# Initialize Earth Engine (uses default credentials like other scripts)
ee.Initialize(project=PROJECT)
print("Earth Engine initialized")

point = ee.Geometry.Point([LON, LAT])
roi = point.buffer(BUFFER_M)

# Try GPM IMERG Monthly V07 first
collection_id = "NASA/GPM_L3/IMERG_MONTHLY_V07"
try:
    gpm = ee.ImageCollection(collection_id)
    count = gpm.size().getInfo()
    print(f"Collection {collection_id}: {count} images")
except Exception:
    # Fallback to V06
    collection_id = "NASA/GPM_L3/IMERG_MONTHLY_V06"
    try:
        gpm = ee.ImageCollection(collection_id)
        count = gpm.size().getInfo()
        print(f"Collection {collection_id}: {count} images")
    except Exception as e:
        print(f"GPM collection not found: {e}")
        raise

# Check bands
sample = gpm.first()
bands = sample.bandNames().getInfo()
print(f"Bands: {bands}")

band = "precipitation" if "precipitation" in bands else bands[0]
print(f"Using band: {band}")

MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
               "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

# Days in each month (approximate for conversion mm/hr -> mm/month)
DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

# Extract all monthly values
def extract_monthly(image):
    date = ee.Date(image.get("system:time_start"))
    mean_val = image.select(band).reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=roi,
        scale=10000,
    ).get(band)
    return ee.Feature(None, {
        "year": date.get("year"),
        "month": date.get("month"),
        "date": date.format("YYYY-MM"),
        "precip_mm_hr": mean_val,
    })

print("Extracting monthly precipitation values...")
features = gpm.map(extract_monthly)
data_list = features.getInfo()["features"]

monthly_data = []
for feat in data_list:
    props = feat["properties"]
    val = props.get("precip_mm_hr")
    if val is not None:
        month = props["month"]
        # Convert mm/hr to mm/month
        mm_month = val * 24 * DAYS_IN_MONTH[month - 1]
        monthly_data.append({
            "year": props["year"],
            "month": month,
            "date": props["date"],
            "precip_mm_hr": round(val, 4),
            "precip_mm_month": round(mm_month, 1),
        })

monthly_data.sort(key=lambda x: x["date"])
print(f"Got {len(monthly_data)} monthly records")

# Monthly climatology (mm/month)
clim = {m: [] for m in range(1, 13)}
for rec in monthly_data:
    clim[rec["month"]].append(rec["precip_mm_month"])

monthly_avg = []
for m in range(1, 13):
    vals = clim[m]
    avg = round(sum(vals) / len(vals), 1) if vals else None
    monthly_avg.append({
        "month": m,
        "name": MONTH_NAMES[m - 1],
        "avg_precip_mm": avg,
        "n_years": len(vals),
    })

# Annual totals
yearly = {}
for rec in monthly_data:
    y = rec["year"]
    if y not in yearly:
        yearly[y] = {"total": 0.0, "months": 0}
    yearly[y]["total"] += rec["precip_mm_month"]
    yearly[y]["months"] += 1

annual_totals = []
for y in sorted(yearly.keys()):
    if yearly[y]["months"] >= 10:
        annual_totals.append({
            "year": y,
            "total_mm": round(yearly[y]["total"], 1),
            "months_counted": yearly[y]["months"],
        })

# Trend
if annual_totals:
    first_half = [r["total_mm"] for r in annual_totals[:len(annual_totals)//2]]
    second_half = [r["total_mm"] for r in annual_totals[len(annual_totals)//2:]]
    trend = {
        "first_half_avg_mm": round(sum(first_half) / len(first_half), 1) if first_half else None,
        "second_half_avg_mm": round(sum(second_half) / len(second_half), 1) if second_half else None,
    }
    if first_half and second_half:
        fh = trend["first_half_avg_mm"]
        sh = trend["second_half_avg_mm"]
        trend["change_pct"] = round((sh - fh) / fh * 100, 1) if fh else None
else:
    trend = None

first_date = monthly_data[0]["date"] if monthly_data else "N/A"
last_date = monthly_data[-1]["date"] if monthly_data else "N/A"

summary = {
    "source": f"GPM IMERG via Earth Engine ({collection_id})",
    "description": "Precipitacao por satelite GPM IMERG - resolucao 10km",
    "unit_monthly": "mm/mes",
    "unit_rate": "mm/hr",
    "period": f"{first_date} a {last_date}",
    "location": "Cruz Alta-RS (buffer 10km)",
    "monthly_climatology": monthly_avg,
    "annual_totals": annual_totals,
    "trend": trend,
    "timeseries": monthly_data,
}

out_path = os.path.join(DIR, "gpm_precipitation_cruzalta.json")
with open(out_path, "w") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"\nSaved: {out_path}")
print(f"Period: {first_date} to {last_date}")
print("Monthly climatology (mm/month):")
for rec in monthly_avg:
    print(f"  {rec['name']}: {rec['avg_precip_mm']} mm")

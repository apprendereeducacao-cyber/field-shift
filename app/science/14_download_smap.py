# SI-assisted — SMAP Soil Moisture via Earth Engine
# Dataset: NASA/SMAP/SPL3SMP_E/006 (SMAP Enhanced L3 9km daily)
# Monthly averages of soil moisture for Cruz Alta-RS region
# Bands: soil_moisture_am (descending 6AM), soil_moisture_pm (ascending 6PM)
# Unit: cm3/cm3 (volumetric water content)
# Available from 2015-03-31 onwards

import json
import os
import warnings
import ee

warnings.filterwarnings("ignore")

DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT = "apprendere-educacao"

LAT = -28.6033
LON = -53.6733
BUFFER_M = 15000  # 15 km — SMAP is 9km resolution

# Initialize Earth Engine (uses default credentials like other scripts)
ee.Initialize(project=PROJECT)
print("Earth Engine initialized")

point = ee.Geometry.Point([LON, LAT])
roi = point.buffer(BUFFER_M)

# Try SMAP Enhanced L3 collection
collection_id = "NASA/SMAP/SPL3SMP_E/006"
try:
    smap = ee.ImageCollection(collection_id)
    count = smap.size().getInfo()
    print(f"Collection {collection_id}: {count} images")
except Exception:
    # Fallback to older version
    collection_id = "NASA/SMAP/SPL3SMP_E/005"
    try:
        smap = ee.ImageCollection(collection_id)
        count = smap.size().getInfo()
        print(f"Collection {collection_id}: {count} images")
    except Exception as e:
        print(f"SMAP collection not found: {e}")
        print("Trying NASA_USDA/HSL/SMAP10KM_soil_moisture...")
        collection_id = "NASA_USDA/HSL/SMAP10KM_soil_moisture"
        smap = ee.ImageCollection(collection_id)
        count = smap.size().getInfo()
        print(f"Collection {collection_id}: {count} images")

# Check bands
sample = smap.first()
bands = sample.bandNames().getInfo()
print(f"Bands: {bands}")

# Determine which band to use
if "soil_moisture_am" in bands:
    band = "soil_moisture_am"
elif "ssm" in bands:
    band = "ssm"
elif "smp" in bands:
    band = "smp"
else:
    band = bands[0]
print(f"Using band: {band}")

# Process monthly averages
# Generate monthly composites from 2015 to 2025
years = list(range(2015, 2026))
months = list(range(1, 13))

MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
               "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

print("Computing monthly averages...")
monthly_data = []

for year in years:
    for month in months:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"

        filtered = smap.filterDate(start_date, end_date).select(band)
        n_images = filtered.size().getInfo()

        if n_images == 0:
            continue

        monthly_mean = filtered.mean()
        val = monthly_mean.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=roi,
            scale=9000,
        ).get(band).getInfo()

        if val is not None:
            monthly_data.append({
                "year": year,
                "month": month,
                "date": f"{year}-{month:02d}",
                "soil_moisture": round(val, 4),
                "n_images": n_images,
            })
            print(f"  {year}-{month:02d}: {val:.4f} ({n_images} images)")

print(f"\nGot {len(monthly_data)} monthly records")

# Monthly climatology
clim = {m: [] for m in range(1, 13)}
for rec in monthly_data:
    clim[rec["month"]].append(rec["soil_moisture"])

monthly_avg = []
for m in range(1, 13):
    vals = clim[m]
    avg = round(sum(vals) / len(vals), 4) if vals else None
    monthly_avg.append({
        "month": m,
        "name": MONTH_NAMES[m - 1],
        "avg_soil_moisture": avg,
        "n_years": len(vals),
    })

# Yearly averages for trend
yearly = {}
for rec in monthly_data:
    y = rec["year"]
    if y not in yearly:
        yearly[y] = []
    yearly[y].append(rec["soil_moisture"])

yearly_avg = []
for y in sorted(yearly.keys()):
    vals = yearly[y]
    if len(vals) >= 6:
        yearly_avg.append({"year": y, "avg": round(sum(vals) / len(vals), 4)})

first_date = monthly_data[0]["date"] if monthly_data else "N/A"
last_date = monthly_data[-1]["date"] if monthly_data else "N/A"

summary = {
    "source": f"SMAP via Earth Engine ({collection_id})",
    "description": "Umidade do solo por satelite SMAP - resolucao 9km",
    "unit": "cm3/cm3 (conteudo volumetrico de agua)",
    "period": f"{first_date} a {last_date}",
    "location": "Cruz Alta-RS (buffer 15km)",
    "band_used": band,
    "monthly_climatology": monthly_avg,
    "yearly_trend": yearly_avg,
    "timeseries": monthly_data,
}

out_path = os.path.join(DIR, "smap_soil_moisture_cruzalta.json")
with open(out_path, "w") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"\nSaved: {out_path}")
print(f"Period: {first_date} to {last_date}")

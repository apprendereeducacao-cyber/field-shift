"""
09_download_ndvi.py
Download NDVI time series from Google Earth Engine for Cruz Alta-RS.
Uses MODIS MOD13Q1 (250m, 16-day composites, 2000-2025).

Usage:
    python3 09_download_ndvi.py

Requires:
    pip3 install earthengine-api
    Earth Engine project 'field-shift-ndvi' registered at:
    https://console.cloud.google.com/earth-engine/configuration?project=field-shift-ndvi
"""

import ee
import json
import warnings
from datetime import datetime

warnings.filterwarnings("ignore")

PROJECT = "field-shift-ndvi"
LAT, LON = -28.6033, -53.6733
START_DATE = "2000-02-18"  # MODIS MOD13Q1 starts here
END_DATE = "2025-12-31"
OUTPUT_FILE = "ndvi_cruzalta.json"
WEB_OUTPUT = "../web/data/ndvi.json"

def main():
    print("Inicializando Earth Engine...")
    ee.Initialize(project=PROJECT)
    print("Conectado.")

    point = ee.Geometry.Point([LON, LAT])

    print(f"Baixando NDVI MODIS MOD13Q1 para Cruz Alta ({LAT}, {LON})...")
    print(f"Periodo: {START_DATE} a {END_DATE}")

    collection = (
        ee.ImageCollection("MODIS/061/MOD13Q1")
        .filterDate(START_DATE, END_DATE)
        .filterBounds(point)
        .select(["NDVI", "EVI", "SummaryQA"])
    )

    n_images = collection.size().getInfo()
    print(f"Total de imagens encontradas: {n_images}")

    def extract_values(image):
        date = ee.Date(image.get("system:time_start"))
        values = image.reduceRegion(
            reducer=ee.Reducer.first(),
            geometry=point,
            scale=250,
        )
        return ee.Feature(None, {
            "date": date.format("YYYY-MM-dd"),
            "year": date.get("year"),
            "month": date.get("month"),
            "doy": date.getRelative("day", "year").add(1),
            "ndvi_raw": values.get("NDVI"),
            "evi_raw": values.get("EVI"),
            "qa": values.get("SummaryQA"),
        })

    print("Extraindo valores (isso pode levar alguns minutos)...")
    features = collection.map(extract_values)
    data = features.getInfo()

    records = []
    for f in data["features"]:
        p = f["properties"]
        ndvi_raw = p.get("ndvi_raw")
        evi_raw = p.get("evi_raw")
        qa = p.get("qa")

        if ndvi_raw is None:
            continue

        records.append({
            "date": p["date"],
            "year": int(p["year"]),
            "month": int(p["month"]),
            "doy": int(p["doy"]),
            "ndvi": round(ndvi_raw * 0.0001, 4),
            "evi": round(evi_raw * 0.0001, 4) if evi_raw is not None else None,
            "ndvi_raw": ndvi_raw,
            "qa": qa,
            "quality": "good" if qa in [0, 1] else "marginal" if qa == 2 else "poor",
        })

    print(f"Registros validos: {len(records)} de {n_images} imagens")

    good = [r for r in records if r["quality"] == "good"]
    print(f"Registros com qualidade boa: {len(good)}")

    # Monthly averages (only good quality)
    monthly = {}
    for r in good:
        key = r["month"]
        if key not in monthly:
            monthly[key] = {"ndvi_sum": 0, "evi_sum": 0, "count": 0}
        monthly[key]["ndvi_sum"] += r["ndvi"]
        if r["evi"] is not None:
            monthly[key]["evi_sum"] += r["evi"]
        monthly[key]["count"] += 1

    month_names = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ]

    monthly_averages = []
    for m in range(1, 13):
        if m in monthly:
            d = monthly[m]
            monthly_averages.append({
                "month": m,
                "name": month_names[m - 1],
                "avg_ndvi": round(d["ndvi_sum"] / d["count"], 4),
                "avg_evi": round(d["evi_sum"] / d["count"], 4),
                "n_obs": d["count"],
            })

    # Annual averages (only good quality, growing season Oct-Mar)
    annual = {}
    for r in good:
        y = r["year"]
        if y not in annual:
            annual[y] = {"ndvi_sum": 0, "count": 0, "grow_sum": 0, "grow_count": 0}
        annual[y]["ndvi_sum"] += r["ndvi"]
        annual[y]["count"] += 1
        if r["month"] in [10, 11, 12, 1, 2, 3]:
            annual[y]["grow_sum"] += r["ndvi"]
            annual[y]["grow_count"] += 1

    annual_averages = []
    for y in sorted(annual.keys()):
        d = annual[y]
        entry = {
            "year": y,
            "avg_ndvi": round(d["ndvi_sum"] / d["count"], 4),
            "n_obs": d["count"],
        }
        if d["grow_count"] > 0:
            entry["growing_season_ndvi"] = round(d["grow_sum"] / d["grow_count"], 4)
        annual_averages.append(entry)

    # Summary stats
    all_ndvi = [r["ndvi"] for r in good]
    grow_ndvi = [r["ndvi"] for r in good if r["month"] in [10, 11, 12, 1, 2, 3]]

    summary = {
        "overall_mean": round(sum(all_ndvi) / len(all_ndvi), 4),
        "overall_min": round(min(all_ndvi), 4),
        "overall_max": round(max(all_ndvi), 4),
        "growing_season_mean": round(sum(grow_ndvi) / len(grow_ndvi), 4) if grow_ndvi else None,
        "n_total_records": len(records),
        "n_good_quality": len(good),
        "years_covered": f"{min(annual.keys())}-{max(annual.keys())}",
    }

    output = {
        "source": "Google Earth Engine - MODIS MOD13Q1 v061",
        "resolution": "250m, 16-day composites",
        "location": {"name": "Cruz Alta", "state": "RS", "lat": LAT, "lon": LON},
        "period": f"{START_DATE} to {END_DATE}",
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "summary": summary,
        "monthly_averages": monthly_averages,
        "annual_averages": annual_averages,
        "timeseries": records,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Salvo: {OUTPUT_FILE}")

    # Web version (without full timeseries to keep file small)
    web_output = {
        "source": output["source"],
        "resolution": output["resolution"],
        "location": output["location"],
        "period": output["period"],
        "summary": output["summary"],
        "monthly_averages": output["monthly_averages"],
        "annual_averages": output["annual_averages"],
    }

    with open(WEB_OUTPUT, "w") as f:
        json.dump(web_output, f, indent=2, ensure_ascii=False)
    print(f"Salvo (web): {WEB_OUTPUT}")

    print("\n--- Resumo ---")
    print(f"NDVI medio geral: {summary['overall_mean']}")
    print(f"NDVI medio safra (Out-Mar): {summary['growing_season_mean']}")
    print(f"Registros totais: {summary['n_total_records']}")
    print(f"Qualidade boa: {summary['n_good_quality']}")
    print(f"Anos: {summary['years_covered']}")
    print("Concluido!")


if __name__ == "__main__":
    main()

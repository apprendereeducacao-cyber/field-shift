"""
11_ndvi_map_tiles.py
Generate NDVI map tile URLs from Google Earth Engine for Cruz Alta.
Produces monthly composite tile URLs for Leaflet overlay.

Usage:
    python3 11_ndvi_map_tiles.py
"""

import ee
import json
import warnings
from datetime import datetime

warnings.filterwarnings("ignore")

PROJECT = "apprendere-educacao"
LAT, LON = -28.6033, -53.6733
OUTPUT_FILE = "ndvi_tiles_cruzalta.json"
WEB_OUTPUT = "../web/data/ndvi_tiles.json"

NDVI_VIS = {
    "min": 0.0,
    "max": 0.9,
    "palette": [
        "#d73027",  # 0.0 - solo nu / sem vegetacao
        "#f46d43",  # 0.1
        "#fdae61",  # 0.2
        "#fee08b",  # 0.3
        "#ffffbf",  # 0.4
        "#d9ef8b",  # 0.5
        "#a6d96a",  # 0.6
        "#66bd63",  # 0.7
        "#1a9850",  # 0.8
        "#006837",  # 0.9 - vegetacao muito densa
    ],
}

MONTHS = [
    (1, "Janeiro"), (2, "Fevereiro"), (3, "Marco"), (4, "Abril"),
    (5, "Maio"), (6, "Junho"), (7, "Julho"), (8, "Agosto"),
    (9, "Setembro"), (10, "Outubro"), (11, "Novembro"), (12, "Dezembro"),
]


def main():
    print("Inicializando Earth Engine...")
    ee.Initialize(project=PROJECT)
    print("Conectado.")

    point = ee.Geometry.Point([LON, LAT])
    region = point.buffer(15000)  # 15km radius for the map view

    tiles = []

    # Generate monthly composites for a representative year (2023)
    # plus key comparison months
    print("Gerando tiles NDVI mensais (media 2020-2024)...")

    for month_num, month_name in MONTHS:
        # Use 5-year average for each month (smoother, more representative)
        collection = (
            ee.ImageCollection("MODIS/061/MOD13Q1")
            .filter(ee.Filter.calendarRange(month_num, month_num, "month"))
            .filterDate("2020-01-01", "2025-01-01")
            .select("NDVI")
        )

        composite = collection.mean().multiply(0.0001).clip(region)

        map_id = composite.getMapId(NDVI_VIS)
        tile_url = map_id["tile_fetcher"].url_format

        # Get mean NDVI for this month
        mean_val = composite.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=250,
        ).getInfo()

        ndvi_mean = mean_val.get("NDVI")
        if ndvi_mean is not None:
            ndvi_mean = round(ndvi_mean, 4)

        tiles.append({
            "month": month_num,
            "name": month_name,
            "tile_url": tile_url,
            "ndvi_mean": ndvi_mean,
            "period": "2020-2024 (media 5 anos)",
        })

        print(f"  {month_name}: NDVI medio = {ndvi_mean}")

    # Also generate specific year comparisons (good vs bad year)
    print("\nGerando comparativos anuais...")
    year_comparisons = []

    for year, label in [(2004, "Seca severa"), (2021, "Safra recorde"), (2023, "Normal")]:
        collection = (
            ee.ImageCollection("MODIS/061/MOD13Q1")
            .filterDate(f"{year}-01-01", f"{year}-03-31")  # Peak soy season
            .select("NDVI")
        )
        composite = collection.mean().multiply(0.0001).clip(region)
        map_id = composite.getMapId(NDVI_VIS)
        tile_url = map_id["tile_fetcher"].url_format

        mean_val = composite.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=250,
        ).getInfo()

        ndvi_mean = mean_val.get("NDVI")
        if ndvi_mean is not None:
            ndvi_mean = round(ndvi_mean, 4)

        year_comparisons.append({
            "year": year,
            "label": label,
            "tile_url": tile_url,
            "ndvi_mean": ndvi_mean,
            "season": "Jan-Mar (pico da soja)",
        })
        print(f"  {year} ({label}): NDVI medio = {ndvi_mean}")

    output = {
        "source": "Google Earth Engine - MODIS MOD13Q1 v061",
        "resolution": "250m",
        "center": {"lat": LAT, "lon": LON},
        "zoom": 11,
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "palette": NDVI_VIS["palette"],
        "palette_labels": [
            "Solo nu", "", "Vegetacao rala", "", "Moderada",
            "", "Densa", "", "Muito densa", "Maxima"
        ],
        "monthly_tiles": tiles,
        "year_comparisons": year_comparisons,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\nSalvo: {OUTPUT_FILE}")

    with open(WEB_OUTPUT, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Salvo (web): {WEB_OUTPUT}")

    print("\nConcluido! Tile URLs prontas para Leaflet.")


if __name__ == "__main__":
    main()

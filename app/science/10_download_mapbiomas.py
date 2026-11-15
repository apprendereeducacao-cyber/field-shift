"""
10_download_mapbiomas.py
Download land use/cover history from MapBiomas via Google Earth Engine
for Cruz Alta-RS region (1985-2023).

Uses MapBiomas Collection 9 (public asset on GEE).

Usage:
    python3 10_download_mapbiomas.py
"""

import ee
import json
import warnings
from datetime import datetime

warnings.filterwarnings("ignore")

PROJECT = "apprendere-educacao"
LAT, LON = -28.6033, -53.6733
RADIUS_M = 20000  # 20km radius — covers full Cruz Alta municipality
OUTPUT_FILE = "mapbiomas_cruzalta.json"
WEB_OUTPUT = "../web/data/mapbiomas.json"

# MapBiomas Collection 9 class IDs relevant for agriculture in RS
# Full legend: https://brasil.mapbiomas.org/wp-content/uploads/sites/4/2024/08/Legenda-Colecao-9-MAPBIOMAS.pdf
CLASS_NAMES = {
    3: "Formacao Florestal",
    4: "Formacao Savanica",
    11: "Campo Alagado",
    12: "Formacao Campestre",
    15: "Pastagem",
    18: "Agricultura",
    19: "Lavoura Temporaria",
    20: "Cana-de-acucar",
    21: "Mosaico de Usos",
    23: "Praia, Duna e Areal",
    24: "Area Urbanizada",
    25: "Outra Area nao Vegetada",
    26: "Corpo Dagua",
    29: "Afloramento Rochoso",
    30: "Mineracao",
    31: "Aquicultura",
    33: "Rio, Lago e Oceano",
    35: "Dendê",
    36: "Lavoura Perene",
    39: "Soja",
    40: "Arroz",
    41: "Outras Lavouras Temporarias",
    46: "Cafe",
    47: "Citrus",
    48: "Outras Lavouras Perenes",
    9: "Silvicultura",
    49: "Restinga Arborizada",
    50: "Restinga Herbacea",
    62: "Algodao",
    0: "Nao Observado",
}

# Simplified groups for the platform
CLASS_GROUPS = {
    "soja": [39],
    "outras_lavouras": [19, 20, 40, 41, 62],
    "lavoura_perene": [36, 46, 47, 48, 35],
    "pastagem": [15],
    "campo_nativo": [12],
    "floresta": [3, 4, 49],
    "silvicultura": [9],
    "agua": [26, 33, 31],
    "urbano_outros": [24, 25, 30, 23, 29, 0, 21, 11, 50],
    "agricultura_geral": [18],
}


def main():
    print("Inicializando Earth Engine...")
    ee.Initialize(project=PROJECT)
    print("Conectado.")

    point = ee.Geometry.Point([LON, LAT])
    area = point.buffer(RADIUS_M)

    asset = "projects/mapbiomas-public/assets/brazil/lulc/collection9/mapbiomas_collection90_integration_v1"

    print(f"Carregando MapBiomas Collection 9 (integration)...")
    print(f"Area: raio de {RADIUS_M}m ao redor de Cruz Alta ({LAT}, {LON})")

    mapbiomas = ee.Image(asset)
    band_names = mapbiomas.bandNames().getInfo()
    years = sorted([int(b.replace("classification_", "")) for b in band_names if b.startswith("classification_")])
    print(f"Anos disponiveis: {years[0]}-{years[-1]} ({len(years)} anos)")

    # Calculate pixel area in hectares
    pixel_area = ee.Image.pixelArea().divide(10000)  # m2 to ha

    results = []

    for year in years:
        band = f"classification_{year}"
        classified = mapbiomas.select(band)

        # Get area per class within the buffer
        area_by_class = pixel_area.addBands(classified).reduceRegion(
            reducer=ee.Reducer.sum().group(
                groupField=1,
                groupName="class",
            ),
            geometry=area,
            scale=30,
            maxPixels=1e9,
        ).getInfo()

        groups = area_by_class.get("groups", [])

        year_data = {"year": year, "classes": {}}
        for g in groups:
            cls_id = int(g["class"])
            area_ha = round(g["sum"], 2)
            cls_name = CLASS_NAMES.get(cls_id, f"classe_{cls_id}")
            year_data["classes"][cls_name] = {
                "id": cls_id,
                "area_ha": area_ha,
            }

        results.append(year_data)

        if year % 10 == 0 or year == years[-1]:
            print(f"  {year} processado...")

    # Build simplified time series by group
    group_timeseries = {g: [] for g in CLASS_GROUPS}

    for yr_data in results:
        for group_name, class_ids in CLASS_GROUPS.items():
            total = 0
            for cls_info in yr_data["classes"].values():
                if cls_info["id"] in class_ids:
                    total += cls_info["area_ha"]
            group_timeseries[group_name].append({
                "year": yr_data["year"],
                "area_ha": round(total, 2),
            })

    # Calculate total area for percentage
    total_area = sum(
        cls_info["area_ha"]
        for cls_info in results[-1]["classes"].values()
    )

    # Current state (latest year)
    latest = results[-1]
    current_state = {}
    for group_name, class_ids in CLASS_GROUPS.items():
        total = sum(
            cls_info["area_ha"]
            for cls_info in latest["classes"].values()
            if cls_info["id"] in class_ids
        )
        current_state[group_name] = {
            "area_ha": round(total, 2),
            "pct": round(total / total_area * 100, 1) if total_area > 0 else 0,
        }

    # Key transitions
    first = results[0]
    first_groups = {}
    for group_name, class_ids in CLASS_GROUPS.items():
        total = sum(
            cls_info["area_ha"]
            for cls_info in first["classes"].values()
            if cls_info["id"] in class_ids
        )
        first_groups[group_name] = round(total, 2)

    transitions = {}
    for g in CLASS_GROUPS:
        old = first_groups.get(g, 0)
        new = current_state[g]["area_ha"]
        if old > 0:
            change = round((new - old) / old * 100, 1)
        elif new > 0:
            change = 999
        else:
            change = 0
        transitions[g] = {
            "from_ha": old,
            "to_ha": new,
            "change_pct": change,
            "from_year": years[0],
            "to_year": years[-1],
        }

    output = {
        "source": "MapBiomas Collection 9 via Google Earth Engine",
        "resolution": "30m (Landsat)",
        "location": {"name": "Cruz Alta", "state": "RS", "lat": LAT, "lon": LON},
        "buffer_radius_m": RADIUS_M,
        "period": f"{years[0]}-{years[-1]}",
        "total_area_ha": round(total_area, 2),
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "current_state": current_state,
        "transitions": transitions,
        "group_timeseries": group_timeseries,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\nSalvo: {OUTPUT_FILE}")

    # Web version (same — already compact)
    with open(WEB_OUTPUT, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Salvo (web): {WEB_OUTPUT}")

    print(f"\n--- Resumo ({years[-1]}) ---")
    print(f"Area total: {total_area:.0f} ha")
    for g, v in sorted(current_state.items(), key=lambda x: -x[1]["area_ha"]):
        t = transitions[g]
        print(f"  {g}: {v['area_ha']:.0f} ha ({v['pct']}%) | {t['from_ha']:.0f} → {t['to_ha']:.0f} ha ({t['change_pct']:+.1f}%)")
    print("Concluido!")


if __name__ == "__main__":
    main()

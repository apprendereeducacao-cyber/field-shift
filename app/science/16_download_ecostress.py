"""
16_download_ecostress.py
Download Land Surface Temperature (LST) high-resolution data for Cruz Alta-RS
via Google Earth Engine using MODIS MOD11A2 (8-day composite, 1km).

ECOSTRESS (70m) is not available on GEE as a public asset.
MODIS LST is the best alternative: 1km resolution, 2000-2025, 8-day composites.

Usage:
    python3 16_download_ecostress.py
"""

import ee
import json
import warnings
from datetime import datetime

warnings.filterwarnings("ignore")

PROJECT = "apprendere-educacao"
LAT, LON = -28.6033, -53.6733
RADIUS_M = 5000
OUTPUT_FILE = "lst_cruzalta.json"
WEB_OUTPUT = "../web/data/lst.json"

MONTH_NAMES = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]


def main():
    print("Inicializando Earth Engine...")
    ee.Initialize(project=PROJECT)
    print("Conectado.\n")

    point = ee.Geometry.Point([LON, LAT])
    area = point.buffer(RADIUS_M)

    start_year = 2000
    end_year = 2025

    # MODIS MOD11A2 - 8 day LST at 1km
    print("=== MODIS LST (MOD11A2, 1km, 8 dias) ===")
    modis_lst = (
        ee.ImageCollection("MODIS/061/MOD11A2")
        .filterBounds(area)
        .filterDate(f"{start_year}-01-01", f"{end_year + 1}-01-01")
        .select(["LST_Day_1km", "LST_Night_1km"])
    )
    total_imgs = modis_lst.size().getInfo()
    print(f"  Total de imagens: {total_imgs}")

    # Scale factor: MODIS LST is in Kelvin * 0.02
    def scale_lst(img):
        day = img.select("LST_Day_1km").multiply(0.02).subtract(273.15).rename("LST_Day_C")
        night = img.select("LST_Night_1km").multiply(0.02).subtract(273.15).rename("LST_Night_C")
        return img.addBands(day).addBands(night).copyProperties(img, ["system:time_start"])

    scaled = modis_lst.map(scale_lst)

    # Monthly climatology
    print("\n  Climatologia mensal...")
    monthly_clim = []
    for m in range(1, 13):
        filtered = scaled.filter(ee.Filter.calendarRange(m, m, "month"))
        mean_img = filtered.select(["LST_Day_C", "LST_Night_C"]).mean()
        stats = mean_img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=area,
            scale=1000,
            maxPixels=1e8,
        ).getInfo()

        day_c = stats.get("LST_Day_C")
        night_c = stats.get("LST_Night_C")
        if day_c is not None:
            day_c = round(day_c, 1)
        if night_c is not None:
            night_c = round(night_c, 1)

        monthly_clim.append({
            "month": m,
            "name": MONTH_NAMES[m - 1],
            "avg_lst_day_c": day_c,
            "avg_lst_night_c": night_c,
        })
        print(f"    {MONTH_NAMES[m-1]}: dia {day_c} C, noite {night_c} C")

    # Yearly trend
    print("\n  Tendencia anual...")
    yearly_trend = []
    for yr in range(start_year, end_year + 1):
        filtered = scaled.filterDate(f"{yr}-01-01", f"{yr + 1}-01-01")
        n = filtered.size().getInfo()
        if n == 0:
            continue

        mean_img = filtered.select(["LST_Day_C", "LST_Night_C"]).mean()
        stats = mean_img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=area,
            scale=1000,
            maxPixels=1e8,
        ).getInfo()

        day_c = stats.get("LST_Day_C")
        night_c = stats.get("LST_Night_C")
        if day_c is not None and night_c is not None:
            day_c = round(day_c, 1)
            night_c = round(night_c, 1)
            yearly_trend.append({
                "year": yr,
                "avg_lst_day_c": day_c,
                "avg_lst_night_c": night_c,
                "n_images": n,
            })
            print(f"    {yr}: dia {day_c} C, noite {night_c} C ({n} imgs)")

    # Summer vs winter LST
    summer_months = [12, 1, 2]
    winter_months = [6, 7, 8]
    summer_day = [m for m in monthly_clim if m["month"] in summer_months and m["avg_lst_day_c"] is not None]
    winter_day = [m for m in monthly_clim if m["month"] in winter_months and m["avg_lst_day_c"] is not None]

    summer_avg = round(sum(m["avg_lst_day_c"] for m in summer_day) / len(summer_day), 1) if summer_day else None
    winter_avg = round(sum(m["avg_lst_day_c"] for m in winter_day) / len(winter_day), 1) if winter_day else None

    # Trend calculation
    if len(yearly_trend) >= 10:
        first_half = yearly_trend[:len(yearly_trend)//2]
        second_half = yearly_trend[len(yearly_trend)//2:]
        first_avg = round(sum(y["avg_lst_day_c"] for y in first_half) / len(first_half), 1)
        second_avg = round(sum(y["avg_lst_day_c"] for y in second_half) / len(second_half), 1)
        trend_info = {
            "first_half_avg_c": first_avg,
            "second_half_avg_c": second_avg,
            "change_c": round(second_avg - first_avg, 1),
            "direction": "aquecimento" if second_avg > first_avg else "resfriamento",
        }
    else:
        trend_info = None

    output = {
        "source": "MODIS MOD11A2 (Terra) via Google Earth Engine",
        "description": "Temperatura real da superficie (solo/vegetacao) medida por satelite termal, nao do ar. Solo exposto pode ser 15-25C mais quente que o ar.",
        "resolution": "1km (8 dias)",
        "period": f"{start_year}-{end_year}",
        "location": {"name": "Cruz Alta", "state": "RS", "lat": LAT, "lon": LON},
        "buffer_radius_m": RADIUS_M,
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "total_images": total_imgs,
        "unit": "graus Celsius",
        "summary": {
            "summer_avg_day_c": summer_avg,
            "winter_avg_day_c": winter_avg,
            "amplitude_c": round(summer_avg - winter_avg, 1) if summer_avg and winter_avg else None,
        },
        "trend": trend_info,
        "monthly_climatology": monthly_clim,
        "yearly_trend": yearly_trend,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\nSalvo: {OUTPUT_FILE}")

    with open(WEB_OUTPUT, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Salvo (web): {WEB_OUTPUT}")

    print(f"\n--- Resumo ---")
    print(f"  Verao (superficie): {summer_avg} C")
    print(f"  Inverno (superficie): {winter_avg} C")
    if trend_info:
        print(f"  Tendencia: {trend_info['change_c']:+.1f} C ({trend_info['direction']})")
    print(f"  Nota: LST de superficie e diferente da temperatura do ar.")
    print(f"  Solo nu no verao pode atingir 50-60 C vs 35 C no ar.")
    print(f"  Cobertura vegetal reduz a LST em 10-20 C.")
    print("Concluido!")


if __name__ == "__main__":
    main()

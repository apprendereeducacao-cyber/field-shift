# SI-assisted — NASA POWER extended parameters for Cruz Alta-RS
# Downloads: EVPTRNS (evapotranspiration), EVLAND (land evaporation),
#   ALLSKY_SFC_SW_DWN (solar radiation), WS2M (wind 2m), RH2M (relative humidity),
#   PRECTOTCORR (precipitation), T2M (temperature)
# Monthly averages 1981-2025 — covers GPM/IMERG precipitation proxy,
#   ECOSTRESS evapotranspiration proxy, and additional climate variables.
# Source: https://power.larc.nasa.gov/api/temporal/monthly/point

import json
import urllib.request
import os
import time

LAT = -28.6033
LON = -53.6733
COMMUNITY = "AG"
DIR = os.path.dirname(os.path.abspath(__file__))

PARAMS = "EVPTRNS,EVLAND,ALLSKY_SFC_SW_DWN,WS2M,RH2M,PRECTOTCORR,T2M,GWETROOT,GWETPROF"

PERIODS = [
    ("1981", "2002"),
    ("2003", "2025"),
]

all_data = {}

for start, end in PERIODS:
    url = (
        f"https://power.larc.nasa.gov/api/temporal/monthly/point"
        f"?parameters={PARAMS}&community={COMMUNITY}"
        f"&longitude={LON}&latitude={LAT}"
        f"&start={start}&end={end}&format=JSON"
    )
    print(f"Downloading monthly {start}-{end} ...")
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "science-data-client/1.0")
    with urllib.request.urlopen(req, timeout=120) as resp:
        chunk = json.loads(resp.read().decode())

    params = chunk["properties"]["parameter"]
    for pname, months in params.items():
        if pname not in all_data:
            all_data[pname] = {}
        all_data[pname].update(months)
    first_param = list(params.values())[0]
    print(f"  Got {len(first_param)} monthly values")
    if start != PERIODS[-1][0]:
        time.sleep(2)

# Save raw monthly data
raw_path = os.path.join(DIR, "power_extended_monthly.json")
with open(raw_path, "w") as f:
    json.dump(all_data, f)
print(f"Saved raw: {raw_path}")

# Build summary JSONs

FILL = -999.0
MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
               "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


def monthly_climatology(param_data):
    """Compute monthly averages across all years (calendar month 1-12)."""
    sums = [0.0] * 12
    counts = [0] * 12
    for key, val in param_data.items():
        if val == FILL or val is None:
            continue
        # key format: YYYYMM or YYYY13 (annual)
        mm = int(key[-2:])
        if 1 <= mm <= 12:
            sums[mm - 1] += val
            counts[mm - 1] += 1
    result = []
    for i in range(12):
        avg = round(sums[i] / counts[i], 3) if counts[i] > 0 else None
        result.append({"month": i + 1, "name": MONTH_NAMES[i], "value": avg, "n_years": counts[i]})
    return result


def yearly_averages(param_data):
    """Compute yearly averages."""
    sums = {}
    counts = {}
    for key, val in param_data.items():
        if val == FILL or val is None:
            continue
        mm = int(key[-2:])
        if mm == 13:
            continue  # skip annual rows
        year = int(key[:4])
        sums[year] = sums.get(year, 0.0) + val
        counts[year] = counts.get(year, 0) + 1
    result = []
    for year in sorted(sums.keys()):
        if counts[year] >= 10:
            result.append({"year": year, "avg": round(sums[year] / counts[year], 3)})
    return result


# 1. Evapotranspiration summary (ECOSTRESS proxy)
et_summary = {
    "source": "NASA POWER - EVPTRNS (evapotranspiracao), EVLAND (evaporacao terrestre)",
    "unit": "mm/day",
    "period": "1981-2025",
    "note": "Proxy para ECOSTRESS - dados modelados MERRA-2/GEOS",
    "evapotranspiration_monthly": monthly_climatology(all_data["EVPTRNS"]),
    "land_evaporation_monthly": monthly_climatology(all_data["EVLAND"]),
    "et_yearly_trend": yearly_averages(all_data["EVPTRNS"]),
}
et_path = os.path.join(DIR, "evapotranspiration_cruzalta.json")
with open(et_path, "w") as f:
    json.dump(et_summary, f, indent=2, ensure_ascii=False)
print(f"Saved: {et_path}")

# 2. Precipitation monthly summary (GPM IMERG proxy)
precip_monthly = monthly_climatology(all_data["PRECTOTCORR"])
precip_yearly = yearly_averages(all_data["PRECTOTCORR"])
# Total annual from monthly sums
annual_totals = {}
for key, val in all_data["PRECTOTCORR"].items():
    if val == FILL or val is None:
        continue
    mm = int(key[-2:])
    if mm == 13:
        continue
    year = int(key[:4])
    if year not in annual_totals:
        annual_totals[year] = {"total": 0.0, "months": 0}
    # POWER monthly precipitation is mm/day average; we need to scale by ~30 days
    # Actually for monthly temporal, values are already monthly averages in mm/day
    annual_totals[year]["total"] += val
    annual_totals[year]["months"] += 1

precip_summary = {
    "source": "NASA POWER - PRECTOTCORR (precipitacao corrigida por satelite incluindo GPM)",
    "unit": "mm/day (media mensal)",
    "period": "1981-2025",
    "note": "Proxy para GPM IMERG - PRECTOTCORR usa dados GPM/TRMM na correcao",
    "monthly_climatology": precip_monthly,
    "yearly_avg_trend": precip_yearly,
}
precip_path = os.path.join(DIR, "precipitation_satellite_cruzalta.json")
with open(precip_path, "w") as f:
    json.dump(precip_summary, f, indent=2, ensure_ascii=False)
print(f"Saved: {precip_path}")

# 3. Enhanced soil moisture summary (SMAP proxy)
sm_monthly = {
    "source": "NASA POWER - GWETROOT + GWETPROF (umidade do solo modelada MERRA-2)",
    "unit": "fracao 0-1 (0=seco, 1=saturado)",
    "period": "1981-2025",
    "note": "Proxy para SMAP L3 - dados de umidade do solo da reanálise MERRA-2/GEOS",
    "root_zone_monthly": monthly_climatology(all_data["GWETROOT"]),
    "profile_monthly": monthly_climatology(all_data["GWETPROF"]),
    "root_zone_yearly_trend": yearly_averages(all_data["GWETROOT"]),
}
sm_path = os.path.join(DIR, "soil_moisture_enhanced_cruzalta.json")
with open(sm_path, "w") as f:
    json.dump(sm_monthly, f, indent=2, ensure_ascii=False)
print(f"Saved: {sm_path}")

# 4. Climate variables summary (solar, wind, humidity)
climate_extra = {
    "source": "NASA POWER - variaveis climaticas adicionais",
    "period": "1981-2025",
    "parameters": {
        "solar_radiation": {
            "param": "ALLSKY_SFC_SW_DWN",
            "unit": "kW-hr/m2/day",
            "description": "Radiacao solar na superficie",
            "monthly": monthly_climatology(all_data["ALLSKY_SFC_SW_DWN"]),
        },
        "wind_speed_2m": {
            "param": "WS2M",
            "unit": "m/s",
            "description": "Velocidade do vento a 2m",
            "monthly": monthly_climatology(all_data["WS2M"]),
        },
        "relative_humidity": {
            "param": "RH2M",
            "unit": "%",
            "description": "Umidade relativa a 2m",
            "monthly": monthly_climatology(all_data["RH2M"]),
        },
        "temperature": {
            "param": "T2M",
            "unit": "C",
            "description": "Temperatura media a 2m",
            "monthly": monthly_climatology(all_data["T2M"]),
        },
    },
}
climate_path = os.path.join(DIR, "climate_extended_cruzalta.json")
with open(climate_path, "w") as f:
    json.dump(climate_extra, f, indent=2, ensure_ascii=False)
print(f"Saved: {climate_path}")

print("\nDone! All extended NASA POWER data downloaded and summarized.")
print(f"Parameters downloaded: {list(all_data.keys())}")

# SI-assisted — Download SoilGrids v2.0 data for Cruz Alta-RS
# Properties: clay, sand, silt, phh2o, soc, nitrogen, cec, bdod
# Depths: 0-5cm, 5-15cm, 15-30cm

import json
import urllib.request
import os
import time

DIR = os.path.dirname(os.path.abspath(__file__))
LAT = -28.6033
LON = -53.6733

PROPERTIES = ["clay", "sand", "silt", "phh2o", "soc", "nitrogen", "cec", "bdod"]
DEPTHS = ["0-5cm", "5-15cm", "15-30cm"]

BASE = "https://rest.isric.org/soilgrids/v2.0/properties/query"

raw_all = {}

for prop in PROPERTIES:
    url = f"{BASE}?lon={LON}&lat={LAT}&property={prop}&depth={'&depth='.join(DEPTHS)}&value=mean"
    print(f"Fetching {prop}...", end=" ", flush=True)
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "science-data-client/1.0")
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    layers = data.get("properties", {}).get("layers", [])
    if layers:
        layer = layers[0]
        d_factor = layer["unit_measure"]["d_factor"]
        mapped = layer["unit_measure"]["mapped_units"]
        target = layer["unit_measure"]["target_units"]
        for depth_entry in layer["depths"]:
            label = depth_entry["label"]
            raw_val = depth_entry["values"].get("mean")
            if label not in raw_all:
                raw_all[label] = {}
            raw_all[label][prop] = {
                "raw": raw_val,
                "d_factor": d_factor,
                "mapped_units": mapped,
                "target_units": target,
            }
        print(f"OK ({len(layer['depths'])} depths)")
    else:
        print("NO DATA")
    time.sleep(0.5)

raw_path = os.path.join(DIR, "soilgrids_cruzalta.json")
with open(raw_path, "w") as f:
    json.dump(raw_all, f, indent=2)
print(f"\nRaw saved: {raw_path}")

# --- Process into soil.json ---

def convert(raw_val, d_factor):
    if raw_val is None:
        return None
    return round(raw_val / d_factor, 2)

def texture_class(clay, sand, silt):
    if clay is None or sand is None or silt is None:
        return "unknown"
    if clay >= 40:
        if silt >= 40:
            return "Silty Clay"
        return "Clay"
    if clay >= 35 and sand >= 45:
        return "Sandy Clay"
    if clay >= 27 and clay < 40 and sand < 20:
        return "Silty Clay Loam"
    if clay >= 27 and clay < 40 and sand >= 20 and sand < 45:
        return "Clay Loam"
    if clay >= 20 and clay < 35 and sand >= 45:
        return "Sandy Clay Loam"
    if silt >= 50 and clay >= 12 and clay < 27:
        return "Silty Clay Loam"
    if silt >= 50 and clay < 12:
        return "Silt Loam"
    if silt >= 80:
        return "Silt"
    if clay >= 7 and clay < 27 and sand < 52 and silt >= 28:
        return "Loam"
    if clay < 7 and silt < 50 and sand >= 43:
        return "Sandy Loam"
    if sand >= 85:
        return "Sand"
    if sand >= 70:
        return "Loamy Sand"
    return "Loam"

layers = []
for depth in DEPTHS:
    d = raw_all.get(depth, {})

    clay_raw = d.get("clay", {}).get("raw")
    sand_raw = d.get("sand", {}).get("raw")
    silt_raw = d.get("silt", {}).get("raw")

    clay_pct = convert(clay_raw, d.get("clay", {}).get("d_factor", 10))
    sand_pct = convert(sand_raw, d.get("sand", {}).get("d_factor", 10))
    silt_pct = convert(silt_raw, d.get("silt", {}).get("d_factor", 10))
    ph = convert(d.get("phh2o", {}).get("raw"), d.get("phh2o", {}).get("d_factor", 10))
    soc = convert(d.get("soc", {}).get("raw"), d.get("soc", {}).get("d_factor", 10))
    nitrogen = convert(d.get("nitrogen", {}).get("raw"), d.get("nitrogen", {}).get("d_factor", 100))
    cec = convert(d.get("cec", {}).get("raw"), d.get("cec", {}).get("d_factor", 10))
    bdod = convert(d.get("bdod", {}).get("raw"), d.get("bdod", {}).get("d_factor", 100))

    layers.append({
        "depth": depth,
        "clay_pct": clay_pct,
        "sand_pct": sand_pct,
        "silt_pct": silt_pct,
        "ph": ph,
        "organic_carbon_g_kg": soc,
        "nitrogen_g_kg": nitrogen,
        "cec_cmol_kg": cec,
        "bulk_density_kg_dm3": bdod,
    })

top = layers[0]
tex = texture_class(top["clay_pct"], top["sand_pct"], top["silt_pct"])

# Interpretation based on topsoil (0-5cm)
clay = top["clay_pct"] or 0
soc_val = top["organic_carbon_g_kg"] or 0
ph_val = top["ph"] or 0
cec_val = top["cec_cmol_kg"] or 0
bd_val = top["bulk_density_kg_dm3"] or 0

# Fertility
if cec_val > 15 and soc_val > 20 and 5.5 < ph_val < 7.0:
    fertility = "high — good CEC, organic carbon, and pH range"
elif cec_val > 10 and soc_val > 10:
    fertility = "medium — moderate CEC and organic carbon"
else:
    fertility = "low — limited nutrient retention"

# Compaction risk
if bd_val > 1.5 and clay > 35:
    compaction = "high — dense clay soil prone to compaction"
elif bd_val > 1.3:
    compaction = "medium — moderate density"
else:
    compaction = "low — good soil structure"

# Water holding
if clay > 35 and soc_val > 15:
    water = "high — clay content retains moisture well"
elif clay > 20:
    water = "medium — moderate retention capacity"
else:
    water = "low — sandy soils drain quickly"

# Erosion
if clay > 35:
    erosion = "medium — clay resists some erosion but cracks when dry"
elif clay < 15:
    erosion = "high — sandy/silty soils erode easily"
else:
    erosion = "medium — moderate erosion risk"

soil = {
    "source": "SoilGrids v2.0 (ISRIC)",
    "lat": LAT,
    "lon": LON,
    "layers": layers,
    "texture_class": tex,
    "interpretation": {
        "fertility": fertility,
        "compaction_risk": compaction,
        "water_holding": water,
        "erosion_vulnerability": erosion,
    },
}

soil_path = os.path.join(DIR, "..", "web", "data", "soil.json")
with open(soil_path, "w") as f:
    json.dump(soil, f, indent=2, ensure_ascii=False)
print(f"Processed saved: {soil_path}")

for l in layers:
    print(f"  {l['depth']}: clay={l['clay_pct']}% sand={l['sand_pct']}% silt={l['silt_pct']}% pH={l['ph']} SOC={l['organic_carbon_g_kg']}g/kg BD={l['bulk_density_kg_dm3']}kg/dm3")
print(f"  Texture: {tex}")
print(f"  Fertility: {fertility}")

# SI-assisted — NASA POWER daily data download for Cruz Alta-RS
# Parameters: PRECTOTCORR (precipitation mm/day), T2M_MAX, T2M_MIN
# Source: https://power.larc.nasa.gov/api/temporal/daily/point

import json
import urllib.request
import time
import os

LAT = -28.6033
LON = -53.6733
PARAMS = "PRECTOTCORR,T2M_MAX,T2M_MIN"
COMMUNITY = "AG"
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

PERIODS = [
    ("19810101", "20021231"),
    ("20030101", "20251231"),
]

all_data = {}

for start, end in PERIODS:
    url = (
        f"https://power.larc.nasa.gov/api/temporal/daily/point"
        f"?parameters={PARAMS}&community={COMMUNITY}"
        f"&longitude={LON}&latitude={LAT}"
        f"&start={start}&end={end}&format=JSON"
    )
    print(f"Downloading {start}-{end} ...")
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "science-data-client/1.0")
    with urllib.request.urlopen(req, timeout=120) as resp:
        chunk = json.loads(resp.read().decode())

    params = chunk["properties"]["parameter"]
    for pname, dates in params.items():
        if pname not in all_data:
            all_data[pname] = {}
        all_data[pname].update(dates)
    print(f"  Got {len(list(params.values())[0])} days")
    if start != PERIODS[-1][0]:
        time.sleep(2)

out_path = os.path.join(OUT_DIR, "power_cruzalta.json")
with open(out_path, "w") as f:
    json.dump(all_data, f)
print(f"\nSaved {out_path}")
print(f"Total days per param: {len(list(all_data.values())[0])}")

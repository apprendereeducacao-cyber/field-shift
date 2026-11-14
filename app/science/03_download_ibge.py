# SI-assisted — Download soy yield data from IBGE SIDRA API
# Table 1612, municipality 4306106 (Cruz Alta-RS), variable 112 (rendimento medio kg/ha), product 2713 (soja)

import json
import csv
import urllib.request
import os

DIR = os.path.dirname(os.path.abspath(__file__))

url = "https://apisidra.ibge.gov.br/values/t/1612/n6/4306106/v/112/p/all/c81/2713"
print(f"Downloading IBGE SIDRA: {url}")

req = urllib.request.Request(url)
req.add_header("User-Agent", "science-data-client/1.0")
with urllib.request.urlopen(req, timeout=60) as resp:
    raw = json.loads(resp.read().decode())

header_row = raw[0]
data_rows = raw[1:]

print(f"Got {len(data_rows)} rows")
print(f"Municipality: {data_rows[0].get('D1N', '?')}")
print(f"Product: {data_rows[0].get('D4N', '?')}")
print(f"Variable: {data_rows[0].get('D2N', '?')}")
print(f"Unit: {data_rows[0].get('MN', '?')}")

out = os.path.join(DIR, "ibge_soja_cruzalta.csv")
with open(out, "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["ano", "kg_ha"])
    for row in data_rows:
        year = row["D3N"].strip()
        val = row["V"].strip()
        if val and val not in ("-", "...", "X"):
            w.writerow([int(year), int(val)])
        else:
            print(f"  Skipping {year}: value='{val}'")

print(f"Saved {out}")

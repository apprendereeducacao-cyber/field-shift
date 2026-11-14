# SI-assisted — Download INMET station data for Cruz Alta (A853) and aggregate daily rainfall
# Station A853 operational since 2007-05-30
# Handles both old format (DATA YYYY-MM-DD) and new format (Data YYYY/MM/DD)

import urllib.request
import zipfile
import csv
import os
import time
from collections import defaultdict

DIR = os.path.dirname(os.path.abspath(__file__))
SCRATCH = "/private/tmp/claude-501/-Users-kauanagel-Desktop-Beta-Core-shield-shift/3794571f-f137-458e-8b7c-907402c81210/scratchpad/inmet"
STATION = "A853"
STATION_NAME = "CRUZ ALTA"

YEARS = list(range(2007, 2026))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*",
    "Referer": "https://portal.inmet.gov.br/dadoshistoricos",
}

daily_rain = {}
daily_readings = defaultdict(int)

for year in YEARS:
    zip_path = os.path.join(SCRATCH, f"{year}.zip")

    if not os.path.exists(zip_path):
        url = f"https://portal.inmet.gov.br/uploads/dadoshistoricos/{year}.zip"
        print(f"Downloading {year}...", end=" ", flush=True)
        req = urllib.request.Request(url)
        for k, v in HEADERS.items():
            req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=480) as resp:
                data = resp.read()
            with open(zip_path, "wb") as f:
                f.write(data)
            print(f"OK ({len(data)//1024//1024}MB)")
        except Exception as e:
            print(f"FAILED: {e}")
            continue
        time.sleep(1)
    else:
        print(f"{year}: cached")

    try:
        with zipfile.ZipFile(zip_path) as zf:
            target = None
            for name in zf.namelist():
                if STATION in name and "CRUZ" in name.upper() and "ALTA" in name.upper():
                    target = name
                    break
            if not target:
                print(f"  {year}: station not found in zip")
                continue

            with zf.open(target) as csvfile:
                raw = csvfile.read()
                text = None
                for enc in ["latin-1", "utf-8", "cp1252"]:
                    try:
                        text = raw.decode(enc)
                        break
                    except UnicodeDecodeError:
                        continue
                if text is None:
                    print(f"  {year}: decode failed")
                    continue

                lines = text.splitlines()
                header_idx = None
                for i, line in enumerate(lines):
                    low = line.lower()
                    if low.startswith("data") and ("hora" in low):
                        header_idx = i
                        break
                if header_idx is None:
                    print(f"  {year}: header not found, first lines:")
                    for l in lines[:5]:
                        print(f"    {l[:80]}")
                    continue

                year_days = 0
                reader = csv.reader(lines[header_idx + 1:], delimiter=";")
                for row in reader:
                    if len(row) < 3:
                        continue
                    date_str = row[0].strip()
                    precip_str = row[2].strip().replace(",", ".")

                    if not date_str:
                        continue

                    # Normalize date to YYYY-MM-DD
                    norm_date = date_str.replace("/", "-")
                    if len(norm_date) < 8:
                        continue

                    try:
                        p = float(precip_str) if precip_str and precip_str != "-9999" else None
                    except ValueError:
                        p = None

                    daily_readings[norm_date] += 1
                    if p is not None and p >= 0:
                        daily_rain[norm_date] = daily_rain.get(norm_date, 0.0) + p

                year_days = len(set(d for d in daily_readings if d.startswith(str(year))))
                print(f"  {year}: {year_days} days")
    except Exception as e:
        print(f"  {year}: error: {e}")

print(f"\nTotal dates with readings: {len(daily_readings)}")

out_path = os.path.join(DIR, "inmet_daily_cruzalta.csv")
with open(out_path, "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["date", "precip_mm", "hourly_readings"])
    for d in sorted(daily_readings.keys()):
        rain = round(daily_rain.get(d, 0.0), 1)
        w.writerow([d, rain, daily_readings[d]])

print(f"Saved {out_path}")

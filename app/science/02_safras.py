# SI-assisted — Compute soy season metrics from NASA POWER daily data
# Season: Nov 1 to Mar 31, labeled by harvest year (e.g. Nov 1981-Mar 1982 = safra 1982)

import json
import csv
import os
from datetime import date, timedelta

DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(DIR, "power_cruzalta.json")) as f:
    data = json.load(f)

precip = data["PRECTOTCORR"]
tmax = data["T2M_MAX"]

FILL = -999.0

def daterange(start, end):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)

rows = []
for harvest_year in range(1982, 2026):
    start = date(harvest_year - 1, 11, 1)
    end = date(harvest_year, 3, 31)

    rain_total = 0.0
    hot_days = 0
    rain_days_counted = 0
    hot_days_counted = 0

    for d in daterange(start, end):
        key = d.strftime("%Y%m%d")
        p = precip.get(key)
        t = tmax.get(key)
        if p is not None and p != FILL:
            rain_total += p
            rain_days_counted += 1
        if t is not None and t != FILL:
            if t >= 32.0:
                hot_days += 1
            hot_days_counted += 1

    dec_start = date(harvest_year - 1, 12, 1)
    feb_end = date(harvest_year, 2, 28)
    if harvest_year % 4 == 0 and (harvest_year % 100 != 0 or harvest_year % 400 == 0):
        feb_end = date(harvest_year, 2, 29)

    max_dry_streak = 0
    current_streak = 0
    for d in daterange(dec_start, feb_end):
        key = d.strftime("%Y%m%d")
        p = precip.get(key)
        if p is not None and p != FILL:
            if p < 1.0:
                current_streak += 1
                if current_streak > max_dry_streak:
                    max_dry_streak = current_streak
            else:
                current_streak = 0

    rows.append({
        "safra": harvest_year,
        "chuva_nov_mar_mm": round(rain_total, 1),
        "dias_tmax_ge32": hot_days,
        "maior_veranico_dias": max_dry_streak,
    })

out = os.path.join(DIR, "safras_cruzalta.csv")
with open(out, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["safra", "chuva_nov_mar_mm", "dias_tmax_ge32", "maior_veranico_dias"])
    w.writeheader()
    w.writerows(rows)

print(f"Saved {out} — {len(rows)} seasons")
for r in rows[:5]:
    print(r)

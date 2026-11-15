"""
12_expand_topography.py
Download expanded SRTM elevation data for the full Cruz Alta municipality
using the Open-Meteo Elevation API.

Grid: lat -28.85 to -28.35, lon -53.90 to -53.45
Step: 0.01 deg (~1.1 km) => ~2500 points

Usage:
    python3 12_expand_topography.py
"""

import json
import urllib.request
import urllib.error
import time
import math
from datetime import datetime

# Grid boundaries — covers full Cruz Alta municipality
LAT_MIN = -28.85
LAT_MAX = -28.35
LON_MIN = -53.90
LON_MAX = -53.45
GRID_STEP = 0.01  # ~1.1 km between points

OUTPUT_SCIENCE = "topografia_cruzalta_expanded.json"
OUTPUT_WEB = "../web/data/topography.json"

# Open-Meteo Elevation API accepts up to 100 locations per request
BATCH_SIZE = 100
API_URL = "https://api.open-meteo.com/v1/elevation"


def build_grid():
    """Build the lat/lon grid."""
    lats = []
    lat = LAT_MIN
    while lat <= LAT_MAX + 1e-9:
        lats.append(round(lat, 5))
        lat += GRID_STEP
    lons = []
    lon = LON_MIN
    while lon <= LON_MAX + 1e-9:
        lons.append(round(lon, 5))
        lon += GRID_STEP

    points = []
    for la in lats:
        for lo in lons:
            points.append((la, lo))
    return points


def fetch_elevations(coords_batch):
    """Fetch elevations from Open-Meteo for a batch of coordinates."""
    lats_str = ",".join(str(c[0]) for c in coords_batch)
    lons_str = ",".join(str(c[1]) for c in coords_batch)
    url = f"{API_URL}?latitude={lats_str}&longitude={lons_str}"

    for attempt in range(5):
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data.get("elevation", [])
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 5 * (attempt + 1)
                print(f"\n    429 rate limit, aguardando {wait}s...", end=" ", flush=True)
                time.sleep(wait)
            elif attempt < 4:
                wait = 2 ** (attempt + 1)
                print(f"\n    Tentativa {attempt+1} falhou ({e}), aguardando {wait}s...", end=" ", flush=True)
                time.sleep(wait)
            else:
                raise
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < 4:
                wait = 2 ** (attempt + 1)
                print(f"\n    Tentativa {attempt+1} falhou ({e}), aguardando {wait}s...", end=" ", flush=True)
                time.sleep(wait)
            else:
                raise


def main():
    print("=" * 60)
    print("12_expand_topography.py")
    print("Topografia expandida para Cruz Alta-RS")
    print("=" * 60)

    grid = build_grid()
    n_points = len(grid)
    print(f"Grade: lat [{LAT_MIN}, {LAT_MAX}], lon [{LON_MIN}, {LON_MAX}]")
    print(f"Passo: {GRID_STEP} graus (~{GRID_STEP * 111:.1f} km)")
    print(f"Total de pontos: {n_points}")

    n_batches = math.ceil(n_points / BATCH_SIZE)
    print(f"Batches de {BATCH_SIZE} pontos: {n_batches}")
    print()

    all_points = []
    for i in range(0, n_points, BATCH_SIZE):
        batch = grid[i : i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        print(f"  Batch {batch_num}/{n_batches} ({len(batch)} pontos)...", end=" ", flush=True)

        elevations = fetch_elevations(batch)

        for (lat, lon), elev in zip(batch, elevations):
            all_points.append({
                "latitude": lat,
                "longitude": lon,
                "elevation_m": elev,
            })
        print(f"OK (ex: {elevations[0]}m)")

        # Rate-limit: be polite to the free API
        if batch_num < n_batches:
            time.sleep(2.0)

    # Compute summary
    elevs = [p["elevation_m"] for p in all_points if p["elevation_m"] is not None]
    min_elev = min(elevs)
    max_elev = max(elevs)
    mean_elev = round(sum(elevs) / len(elevs), 1)

    science_output = {
        "source": "Open-Meteo Elevation API (SRTM/Copernicus DEM)",
        "center": {
            "lat": round((LAT_MIN + LAT_MAX) / 2, 4),
            "lon": round((LON_MIN + LON_MAX) / 2, 4),
        },
        "grid_step_deg": GRID_STEP,
        "lat_range": [LAT_MIN, LAT_MAX],
        "lon_range": [LON_MIN, LON_MAX],
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "summary": {
            "min_elevation_m": min_elev,
            "max_elevation_m": max_elev,
            "range_m": round(max_elev - min_elev, 1),
            "mean_elevation_m": mean_elev,
            "n_points": len(all_points),
        },
        "points": all_points,
    }

    with open(OUTPUT_SCIENCE, "w") as f:
        json.dump(science_output, f, indent=2, ensure_ascii=False)
    print(f"\nSalvo: {OUTPUT_SCIENCE}")

    # Web version (same structure — the page.tsx reads .points and .summary)
    with open(OUTPUT_WEB, "w") as f:
        json.dump(science_output, f, indent=2, ensure_ascii=False)
    print(f"Salvo (web): {OUTPUT_WEB}")

    print(f"\n--- Resumo ---")
    print(f"Pontos: {len(all_points)}")
    print(f"Elevacao: {min_elev}m — {max_elev}m (desnivel {max_elev - min_elev:.0f}m)")
    print(f"Media: {mean_elev}m")
    print("Concluido!")


if __name__ == "__main__":
    main()

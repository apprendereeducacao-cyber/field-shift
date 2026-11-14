"use client";

import { useEffect, useRef, useState } from "react";
import ndviTiles from "../../../data/ndvi_tiles.json";

type TileEntry = {
  month: number;
  name: string;
  tile_url: string;
  ndvi_mean: number | null;
  period: string;
};

type YearEntry = {
  year: number;
  label: string;
  tile_url: string;
  ndvi_mean: number | null;
  season: string;
};

const tiles = ndviTiles as {
  center: { lat: number; lon: number };
  zoom: number;
  palette: string[];
  palette_labels: string[];
  monthly_tiles: TileEntry[];
  year_comparisons: YearEntry[];
};

export default function MapaNdviPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [mode, setMode] = useState<"monthly" | "compare">("monthly");
  const [selectedYear, setSelectedYear] = useState(0);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const currentTile = tiles.monthly_tiles.find((t) => t.month === selectedMonth);
  const currentYear = tiles.year_comparisons[selectedYear];

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => {
      const L = (window as any).L;
      const map = L.map(mapRef.current, {
        center: [tiles.center.lat, tiles.center.lon],
        zoom: tiles.zoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "CartoDB",
        maxZoom: 18,
      }).addTo(map);

      mapInstance.current = map;
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !leafletLoaded) return;
    const L = (window as any).L;

    if (overlayRef.current) {
      mapInstance.current.removeLayer(overlayRef.current);
    }

    const url = mode === "monthly" ? currentTile?.tile_url : currentYear?.tile_url;
    if (url) {
      overlayRef.current = L.tileLayer(url, {
        opacity: 0.75,
        maxZoom: 15,
      }).addTo(mapInstance.current);
    }
  }, [selectedMonth, selectedYear, mode, leafletLoaded, currentTile, currentYear]);

  const ndviValue = mode === "monthly" ? currentTile?.ndvi_mean : currentYear?.ndvi_mean;
  const ndviColor = ndviValue
    ? tiles.palette[Math.min(Math.floor(ndviValue * 10), 9)]
    : "#666";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Mapa NDVI — Vegetacao por Satelite
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Mapa interativo do indice de vegetacao ao redor de Cruz Alta.
          Verde forte = vegetacao densa. Vermelho/marrom = solo nu.
          Arraste o slider pra ver como a vegetacao muda ao longo do ano.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("monthly")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "monthly"
              ? "bg-primary text-white"
              : "border border-border bg-bg-surface text-text-muted hover:text-text-primary"
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => setMode("compare")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "compare"
              ? "bg-primary text-white"
              : "border border-border bg-bg-surface text-text-muted hover:text-text-primary"
          }`}
        >
          Comparar safras
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div ref={mapRef} className="h-[500px] w-full bg-bg-surface-alt" />
      </div>

      {mode === "monthly" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-text-primary">
              {currentTile?.name}
            </span>
            <span
              className="rounded-full px-3 py-1 text-sm font-bold"
              style={{ backgroundColor: ndviColor, color: "#fff" }}
            >
              NDVI {ndviValue?.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-text-dim">
            {tiles.monthly_tiles.map((t) => (
              <span
                key={t.month}
                className={t.month === selectedMonth ? "font-bold text-primary-light" : ""}
              >
                {t.name.slice(0, 3)}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-dim">
            Media de 5 anos (2020-2024) para cada mes. Resolucao 250m (MODIS).
          </p>
        </div>
      )}

      {mode === "compare" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-text-primary">
              {currentYear?.year} — {currentYear?.label}
            </span>
            <span
              className="rounded-full px-3 py-1 text-sm font-bold"
              style={{ backgroundColor: ndviColor, color: "#fff" }}
            >
              NDVI {ndviValue?.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            {tiles.year_comparisons.map((y, i) => (
              <button
                key={y.year}
                onClick={() => setSelectedYear(i)}
                className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                  i === selectedYear
                    ? "border-primary bg-primary/10 text-primary-light"
                    : "border-border bg-bg-surface text-text-muted hover:text-text-primary"
                }`}
              >
                <p className="text-lg font-bold">{y.year}</p>
                <p className="text-xs">{y.label}</p>
                <p className="mt-1 text-xs font-mono">
                  NDVI {y.ndvi_mean?.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-text-dim">
            Comparativo Jan-Mar (pico da soja). Quanto mais verde, mais biomassa.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <p className="text-xs font-medium text-text-dim uppercase">Legenda NDVI</p>
        <div className="mt-2 flex h-4 overflow-hidden rounded-full">
          {tiles.palette.map((color, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-text-dim">
          <span>0.0 — Solo nu</span>
          <span>0.3 — Ralo</span>
          <span>0.6 — Denso</span>
          <span>0.9 — Maximo</span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-4 text-xs text-text-dim">
        <strong>Fonte:</strong> Google Earth Engine — MODIS MOD13Q1 v061 |
        Resolucao: 250m | Mapa base: CartoDB Dark Matter |
        Validacao: Embrapa SATVeg
      </div>
    </div>
  );
}

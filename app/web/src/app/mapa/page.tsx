"use client";

import { useEffect, useRef, useState } from "react";
import ndviTiles from "../../../data/ndvi_tiles.json";
import topoData from "../../../data/topography.json";
import siteData from "../../../data/site.json";
import mapbiomasData from "../../../data/mapbiomas.json";

type TopoPoint = { latitude: number; longitude: number; elevation_m: number };
type NdviTile = {
  month: number;
  name: string;
  tile_url: string;
  ndvi_mean: number | null;
  period: string;
};

const topo = topoData as {
  points: TopoPoint[];
  summary: {
    min_elevation_m: number;
    max_elevation_m: number;
    range_m: number;
    mean_elevation_m: number;
  };
};

const ndvi = ndviTiles as {
  center: { lat: number; lon: number };
  zoom: number;
  palette: string[];
  palette_labels: string[];
  monthly_tiles: NdviTile[];
};

const avgTmax = (siteData as any).q1?.temperature_c?.avg_tmax ?? 25.4;
const meanElev = topo.summary.mean_elevation_m;

const LAND_USE = Object.entries(
  (mapbiomasData as any).current_state as Record<
    string,
    { area_ha: number; pct: number }
  >
)
  .filter(([, val]) => val.pct > 0)
  .sort((a, b) => b[1].pct - a[1].pct);

const LAND_USE_COLORS: Record<string, string> = {
  soja: "#F9A825",
  urbano_outros: "#9E9E9E",
  floresta: "#1B5E20",
  outras_lavouras: "#8D6E63",
  campo_nativo: "#AED581",
  agua: "#1E88E5",
  silvicultura: "#2E7D32",
  pastagem: "#CDDC39",
};

const LAND_USE_LABELS: Record<string, string> = {
  soja: "Soja",
  urbano_outros: "Urbano/Outros",
  floresta: "Floresta",
  outras_lavouras: "Outras lavouras",
  campo_nativo: "Campo nativo",
  agua: "Água",
  silvicultura: "Silvicultura",
  pastagem: "Pastagem",
  lavoura_perene: "Lavoura perene",
  agricultura_geral: "Agricultura geral",
};

type Layer = "relevo" | "temperatura" | "ndvi" | "uso-do-solo";

const LAYERS: { key: Layer; label: string }[] = [
  { key: "relevo", label: "Relevo" },
  { key: "temperatura", label: "Temperatura" },
  { key: "ndvi", label: "NDVI" },
  { key: "uso-do-solo", label: "Uso do Solo" },
];

function elevColor(elev: number): string {
  const { min_elevation_m: min, max_elevation_m: max } = topo.summary;
  const pct = (elev - min) / (max - min);
  if (pct < 0.25) return "#1B5E20";
  if (pct < 0.5) return "#66BB6A";
  if (pct < 0.75) return "#FDD835";
  return "#E65100";
}

function tempFromElevation(elev: number): number {
  return avgTmax + ((meanElev - elev) * 0.65) / 100;
}

function tempColor(temp: number): string {
  if (temp < 24) return "#1E88E5";
  if (temp < 25) return "#42A5F5";
  if (temp < 25.5) return "#FDD835";
  if (temp < 26) return "#FF9800";
  return "#E65100";
}

export default function MapaPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const ndviOverlayRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const [activeLayer, setActiveLayer] = useState<Layer>("relevo");
  const [leafletReady, setLeafletReady] = useState(false);
  const [ndviMonth, setNdviMonth] = useState(1);

  const currentNdvi = ndvi.monthly_tiles.find((t) => t.month === ndviMonth);

  useEffect(() => {
    mountedRef.current = true;
    if (!mapRef.current) return;

    function initMap() {
      if (!mountedRef.current || !mapRef.current) return;
      if (mapInstance.current) return;

      const L = (window as any).L;
      if (!L) return;

      const container = mapRef.current;
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
        container.innerHTML = "";
      }

      const map = L.map(container, {
        center: [ndvi.center.lat, ndvi.center.lon],
        zoom: ndvi.zoom,
        zoomControl: true,
      });

      const baseTiles = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }
      );
      baseTiles.addTo(map);
      const tilePane = map.getPane("tilePane");
      if (tilePane) {
        tilePane.style.filter =
          "brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.5)";
      }

      mapInstance.current = map;
      setLeafletReady(true);
    }

    if ((window as any).L) {
      initMap();
    } else {
      if (!document.querySelector('link[href*="leaflet.min.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
        document.head.appendChild(link);
      }

      const existing = document.querySelector(
        'script[src*="leaflet.min.js"]'
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", initMap);
      } else {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
        script.onload = initMap;
        document.head.appendChild(script);
      }
    }

    return () => {
      mountedRef.current = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      setLeafletReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !leafletReady || !mountedRef.current) return;
    const L = (window as any).L;
    const map = mapInstance.current;

    markersRef.current.forEach((m) => {
      try { map.removeLayer(m); } catch { /* ok */ }
    });
    markersRef.current = [];
    if (ndviOverlayRef.current) {
      try { map.removeLayer(ndviOverlayRef.current); } catch { /* ok */ }
      ndviOverlayRef.current = null;
    }

    if (activeLayer === "relevo") {
      topo.points.forEach((p) => {
        const marker = L.circleMarker([p.latitude, p.longitude], {
          radius: 12,
          fillColor: elevColor(p.elevation_m),
          fillOpacity: 0.85,
          color: "#fff",
          weight: 1,
        }).addTo(map);
        marker.bindTooltip(`${p.elevation_m}m`, {
          permanent: true,
          direction: "center",
          className: "elev-tooltip",
        });
        markersRef.current.push(marker);
      });

      const style = document.createElement("style");
      style.textContent = `.elev-tooltip{background:transparent!important;border:none!important;box-shadow:none!important;color:#fff!important;font-size:10px!important;font-weight:700!important;text-shadow:0 1px 3px #000}`;
      style.id = "elev-tooltip-style";
      if (!document.getElementById("elev-tooltip-style")) {
        document.head.appendChild(style);
      }
    }

    if (activeLayer === "temperatura") {
      topo.points.forEach((p) => {
        const temp = tempFromElevation(p.elevation_m);
        const marker = L.circleMarker([p.latitude, p.longitude], {
          radius: 18,
          fillColor: tempColor(temp),
          fillOpacity: 0.6,
          color: tempColor(temp),
          weight: 2,
        }).addTo(map);
        marker.bindTooltip(`${temp.toFixed(1)}°C`, {
          permanent: true,
          direction: "center",
          className: "temp-tooltip",
        });
        markersRef.current.push(marker);
      });

      const style = document.createElement("style");
      style.textContent = `.temp-tooltip{background:transparent!important;border:none!important;box-shadow:none!important;color:#fff!important;font-size:10px!important;font-weight:700!important;text-shadow:0 1px 3px #000}`;
      style.id = "temp-tooltip-style";
      if (!document.getElementById("temp-tooltip-style")) {
        document.head.appendChild(style);
      }
    }

    if (activeLayer === "ndvi") {
      const url = currentNdvi?.tile_url;
      if (url) {
        if (!map.getPane("ndviPane")) {
          map.createPane("ndviPane");
          const pane = map.getPane("ndviPane")!;
          pane.style.zIndex = "450";
          pane.style.filter = "none";
        }
        ndviOverlayRef.current = L.tileLayer(url, {
          opacity: 0.75,
          maxZoom: 15,
          pane: "ndviPane",
        }).addTo(map);
      }
    }
  }, [activeLayer, leafletReady, ndviMonth, currentNdvi]);

  const ndviColor = currentNdvi?.ndvi_mean
    ? ndvi.palette[Math.min(Math.floor(currentNdvi.ndvi_mean * 10), 9)]
    : "#666";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Mapa de Cruz Alta
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Visualize o terreno, a temperatura estimada, a vegetação por satélite e
          o uso do solo na região. Alterne entre as camadas abaixo.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            onClick={() => setActiveLayer(l.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeLayer === l.key
                ? "bg-primary text-white"
                : "border border-border bg-bg-surface text-text-muted hover:text-text-primary"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div ref={mapRef} className="h-[600px] w-full bg-bg-surface-alt" />
      </div>

      {activeLayer === "relevo" && (
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <p className="text-xs font-medium tracking-wider text-text-dim uppercase">
            Legenda — Elevação
          </p>
          <div className="mt-3 flex items-center gap-3">
            {[
              { color: "#1B5E20", label: `${topo.summary.min_elevation_m}m (vale)` },
              { color: "#66BB6A", label: "Médio-baixo" },
              { color: "#FDD835", label: "Médio-alto" },
              { color: "#E65100", label: `${topo.summary.max_elevation_m}m (topo)` },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-text-muted">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-dim">
            Grade 5x5 com {topo.points.length} pontos. Desnível de{" "}
            {topo.summary.range_m}m na região. Fonte: SRTM/Copernicus DEM.
          </p>
        </div>
      )}

      {activeLayer === "temperatura" && (
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <p className="text-xs font-medium tracking-wider text-text-dim uppercase">
            Legenda — Temperatura máxima estimada
          </p>
          <div className="mt-3 flex items-center gap-3">
            {[
              { color: "#1E88E5", label: "< 24°C (frio)" },
              { color: "#42A5F5", label: "24-25°C" },
              { color: "#FDD835", label: "25-25.5°C" },
              { color: "#FF9800", label: "25.5-26°C" },
              { color: "#E65100", label: "> 26°C (quente)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-text-muted">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-dim">
            Lapse rate de -0.65°C por 100m de altitude, aplicado sobre a média
            regional de {avgTmax.toFixed(1)}°C (NASA POWER 1981-2025). Vales
            tendem a ser mais quentes, topos mais frios.
          </p>
        </div>
      )}

      {activeLayer === "ndvi" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-text-primary">
              {currentNdvi?.name}
            </span>
            <span
              className="rounded-full px-3 py-1 text-sm font-bold"
              style={{ backgroundColor: ndviColor, color: "#fff" }}
            >
              NDVI {currentNdvi?.ndvi_mean?.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            value={ndviMonth}
            onChange={(e) => setNdviMonth(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-text-dim">
            {ndvi.monthly_tiles.map((t) => (
              <span
                key={t.month}
                className={
                  t.month === ndviMonth ? "font-bold text-primary-light" : ""
                }
              >
                {t.name.slice(0, 3)}
              </span>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-bg-surface p-4">
            <p className="text-xs font-medium tracking-wider text-text-dim uppercase">
              Legenda NDVI
            </p>
            <div className="mt-2 flex h-4 overflow-hidden rounded-full">
              {ndvi.palette.map((color, i) => (
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
          <p className="text-xs text-text-dim">
            Media de 5 anos (2020-2024). MODIS MOD13Q1 250m via Google Earth
            Engine.
          </p>
        </div>
      )}

      {activeLayer === "uso-do-solo" && (
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <p className="text-xs font-medium tracking-wider text-text-dim uppercase">
            Uso do solo atual — MapBiomas 2023
          </p>
          <div className="mt-4 space-y-2">
            {LAND_USE.map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: LAND_USE_COLORS[key] ?? "#666",
                  }}
                />
                <span className="min-w-[120px] text-sm text-text-secondary">
                  {LAND_USE_LABELS[key] ?? key}
                </span>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-bg-surface-alt">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(val.pct, 0.5)}%`,
                        backgroundColor: LAND_USE_COLORS[key] ?? "#666",
                      }}
                    />
                  </div>
                </div>
                <span className="w-16 text-right font-mono text-xs text-text-muted">
                  {val.pct}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-dim">
            Dados de cobertura e uso do solo num raio de 15km ao redor de Cruz
            Alta. Fonte: MapBiomas Collection 9 (Landsat 30m, 1985-2023). A soja
            domina com mais de 80% da área.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-bg-surface p-4 text-xs text-text-dim">
        <strong>Fontes:</strong> SRTM/Copernicus DEM (elevação) | NASA POWER
        1981-2025 (temperatura) | MODIS MOD13Q1 via Google Earth Engine (NDVI) |
        MapBiomas Collection 9 (uso do solo) | Mapa base: OpenStreetMap
      </div>
    </div>
  );
}

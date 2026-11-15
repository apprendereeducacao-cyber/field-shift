"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { NdviTilesData, TopographyData, SiteData, MapBiomasData } from "@/lib/types";

type Props = {
  ndviTiles: NdviTilesData;
  topography: TopographyData;
  site: SiteData;
  mapbiomas: MapBiomasData;
};

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
  agua: "Agua",
  silvicultura: "Silvicultura",
  pastagem: "Pastagem",
  lavoura_perene: "Lavoura perene",
  agricultura_geral: "Agricultura geral",
};

type LayerKey = "relevo" | "temperatura" | "ndvi" | "uso-do-solo";

type LayerConfig = {
  key: LayerKey;
  label: string;
  description: string;
  zIndex: number;
};

const LAYER_CONFIGS: LayerConfig[] = [
  { key: "relevo", label: "Relevo", description: "Elevacao SRTM/Copernicus DEM", zIndex: 400 },
  { key: "temperatura", label: "Temperatura", description: "Tmax estimada por lapse rate", zIndex: 410 },
  { key: "ndvi", label: "NDVI", description: "Vegetacao Sentinel-2 10m", zIndex: 420 },
  { key: "uso-do-solo", label: "Uso do Solo", description: "MapBiomas Collection 9", zIndex: 430 },
];

type LayerState = { visible: boolean; opacity: number };

export default function MapaClient({ ndviTiles, topography, site, mapbiomas }: Props) {
  const avgTmax = site.q1?.temperature_c?.avg_tmax ?? 25.4;
  const meanElev = topography.summary.mean_elevation_m;

  const tempFromElevation = useCallback(
    (elev: number) => avgTmax + ((meanElev - elev) * 0.65) / 100,
    [avgTmax, meanElev]
  );

  const LAND_USE = Object.entries(mapbiomas.current_state)
    .filter(([, val]) => val.pct > 0)
    .sort((a, b) => b[1].pct - a[1].pct);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const mountedRef = useRef(true);

  const relevoLayerRef = useRef<any>(null);
  const tempLayerRef = useRef<any>(null);
  const ndviLayerRef = useRef<any>(null);

  const [layers, setLayers] = useState<Record<LayerKey, LayerState>>({
    relevo: { visible: true, opacity: 0.7 },
    temperatura: { visible: false, opacity: 0.7 },
    ndvi: { visible: false, opacity: 0.75 },
    "uso-do-solo": { visible: false, opacity: 1 },
  });
  const [leafletReady, setLeafletReady] = useState(false);
  const [ndviMonth, setNdviMonth] = useState(1);

  const currentNdvi = ndviTiles.monthly_tiles.find((t) => t.month === ndviMonth);

  function toggleLayer(key: LayerKey) {
    setLayers((prev) => ({
      ...prev,
      [key]: { ...prev[key], visible: !prev[key].visible },
    }));
  }

  function setOpacity(key: LayerKey, opacity: number) {
    setLayers((prev) => ({
      ...prev,
      [key]: { ...prev[key], opacity },
    }));
  }

  useEffect(() => {
    mountedRef.current = true;
    if (!mapRef.current) return;

    function initMap() {
      if (!mountedRef.current || !mapRef.current) return;
      if (mapInstance.current) return;

      const L = (window as any).L;
      if (!L || !L.heatLayer) return;

      const container = mapRef.current;
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
        container.innerHTML = "";
      }

      const map = L.map(container, {
        center: [ndviTiles.center.lat, ndviTiles.center.lon],
        zoom: ndviTiles.zoom,
        zoomControl: true,
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri, Maxar, Earthstar Geographics", maxZoom: 19 }
      ).addTo(map);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, opacity: 0.7 }
      ).addTo(map);

      for (const cfg of LAYER_CONFIGS) {
        if (!map.getPane(cfg.key)) {
          map.createPane(cfg.key);
          map.getPane(cfg.key)!.style.zIndex = String(cfg.zIndex);
        }
      }

      mapInstance.current = map;
      setLeafletReady(true);
    }

    function loadScript(src: string, onLoad: () => void) {
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
      if (existing) {
        if ((window as any).L?.heatLayer || !src.includes("heat")) {
          onLoad();
        } else {
          existing.addEventListener("load", onLoad);
        }
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = onLoad;
      document.head.appendChild(script);
    }

    if (!document.querySelector('link[href*="leaflet.min.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    if ((window as any).L?.heatLayer) {
      initMap();
    } else {
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
        () =>
          loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js",
            initMap
          )
      );
    }

    return () => {
      mountedRef.current = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      relevoLayerRef.current = null;
      tempLayerRef.current = null;
      ndviLayerRef.current = null;
      setLeafletReady(false);
    };
  }, [ndviTiles.center.lat, ndviTiles.center.lon, ndviTiles.zoom]);

  useEffect(() => {
    if (!mapInstance.current || !leafletReady) return;
    const L = (window as any).L;
    const map = mapInstance.current;

    if (layers.relevo.visible && !relevoLayerRef.current) {
      const { min_elevation_m: min, max_elevation_m: max } = topography.summary;
      const range = max - min || 1;
      const heatData = topography.points.map((p) => [
        p.latitude, p.longitude, (p.elevation_m - min) / range,
      ]);
      relevoLayerRef.current = L.heatLayer(heatData, {
        radius: 10, blur: 8, maxZoom: 14, max: 1.0,
        gradient: { 0.0: "#1B5E20", 0.25: "#388E3C", 0.5: "#66BB6A", 0.75: "#FDD835", 1.0: "#E65100" },
        pane: "relevo",
      }).addTo(map);
    } else if (!layers.relevo.visible && relevoLayerRef.current) {
      map.removeLayer(relevoLayerRef.current);
      relevoLayerRef.current = null;
    }

    if (layers.temperatura.visible && !tempLayerRef.current) {
      const temps = topography.points.map((p) => tempFromElevation(p.elevation_m));
      const minT = Math.min(...temps);
      const maxT = Math.max(...temps);
      const rangeT = maxT - minT || 1;
      const heatData = topography.points.map((p, i) => [
        p.latitude, p.longitude, (temps[i] - minT) / rangeT,
      ]);
      tempLayerRef.current = L.heatLayer(heatData, {
        radius: 10, blur: 8, maxZoom: 14, max: 1.0,
        gradient: { 0.0: "#1E88E5", 0.3: "#42A5F5", 0.5: "#FDD835", 0.7: "#FF9800", 1.0: "#E65100" },
        pane: "temperatura",
      }).addTo(map);
    } else if (!layers.temperatura.visible && tempLayerRef.current) {
      map.removeLayer(tempLayerRef.current);
      tempLayerRef.current = null;
    }
  }, [layers.relevo.visible, layers.temperatura.visible, leafletReady, topography, tempFromElevation]);

  useEffect(() => {
    if (!mapInstance.current || !leafletReady) return;
    const L = (window as any).L;
    const map = mapInstance.current;

    if (ndviLayerRef.current) {
      map.removeLayer(ndviLayerRef.current);
      ndviLayerRef.current = null;
    }

    if (layers.ndvi.visible && currentNdvi?.tile_url) {
      ndviLayerRef.current = L.tileLayer(currentNdvi.tile_url, {
        opacity: layers.ndvi.opacity,
        maxZoom: 15,
        pane: "ndvi",
      }).addTo(map);
    }
  }, [layers.ndvi.visible, layers.ndvi.opacity, ndviMonth, currentNdvi, leafletReady]);

  useEffect(() => {
    if (relevoLayerRef.current && layers.relevo.visible) {
      const pane = mapInstance.current?.getPane("relevo");
      if (pane) pane.style.opacity = String(layers.relevo.opacity);
    }
  }, [layers.relevo.opacity, layers.relevo.visible]);

  useEffect(() => {
    if (tempLayerRef.current && layers.temperatura.visible) {
      const pane = mapInstance.current?.getPane("temperatura");
      if (pane) pane.style.opacity = String(layers.temperatura.opacity);
    }
  }, [layers.temperatura.opacity, layers.temperatura.visible]);

  useEffect(() => {
    if (ndviLayerRef.current) {
      ndviLayerRef.current.setOpacity(layers.ndvi.opacity);
    }
  }, [layers.ndvi.opacity]);

  const ndviColor = currentNdvi?.ndvi_mean
    ? ndviTiles.palette[Math.min(Math.floor(currentNdvi.ndvi_mean * 10), 9)]
    : "#666";

  const anyVisible = Object.values(layers).some((l) => l.visible);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          Mapa de Cruz Alta
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Imagem de satelite real da regiao. Empilhe camadas e ajuste a
          opacidade de cada uma independentemente.
        </p>
      </div>

      {/* Layer cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {LAYER_CONFIGS.map((cfg) => {
          const state = layers[cfg.key];
          return (
            <div
              key={cfg.key}
              className={`rounded-xl border p-3 transition-colors ${
                state.visible
                  ? "border-primary/40 bg-primary/[0.03]"
                  : "border-border bg-surface"
              }`}
            >
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={state.visible}
                  onChange={() => toggleLayer(cfg.key)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-text-primary">
                    {cfg.label}
                  </span>
                  <p className="text-xs text-text-muted">{cfg.description}</p>
                </div>
              </label>
              {state.visible && cfg.key !== "uso-do-solo" && (
                <div className="mt-2 flex items-center gap-2 pl-7">
                  <span className="text-[10px] text-text-dim">Opacidade</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(state.opacity * 100)}
                    onChange={(e) =>
                      setOpacity(cfg.key, Number(e.target.value) / 100)
                    }
                    className="flex-1 accent-primary"
                  />
                  <span className="w-8 text-right text-[10px] font-mono text-text-muted">
                    {Math.round(state.opacity * 100)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div ref={mapRef} className="h-[500px] w-full bg-bg-surface-alt" />
      </div>

      {/* NDVI month slider */}
      {layers.ndvi.visible && (
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
            {ndviTiles.monthly_tiles.map((t) => (
              <span
                key={t.month}
                className={t.month === ndviMonth ? "font-bold text-primary-light" : ""}
              >
                {t.name.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Legends for visible layers */}
      {layers.relevo.visible && (
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <p className="text-xs font-medium tracking-wider text-text-dim uppercase">
            Legenda — Elevacao (mapa de calor)
          </p>
          <div className="mt-3 flex items-center gap-1">
            <span className="text-xs text-text-muted">
              {topography.summary.min_elevation_m}m
            </span>
            <div className="flex h-3 flex-1 overflow-hidden rounded-full">
              {["#1B5E20", "#388E3C", "#66BB6A", "#FDD835", "#E65100"].map((c) => (
                <div key={c} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-xs text-text-muted">
              {topography.summary.max_elevation_m}m
            </span>
          </div>
          <p className="mt-3 text-xs text-text-dim">
            Grade de {topography.points.length} pontos reais (SRTM). Desnivel de{" "}
            {topography.summary.range_m}m na regiao.
          </p>
        </div>
      )}

      {layers.temperatura.visible && (
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <p className="text-xs font-medium tracking-wider text-text-dim uppercase">
            Legenda — Temperatura maxima estimada
          </p>
          <div className="mt-3 flex items-center gap-1">
            <span className="text-xs text-text-muted">Frio</span>
            <div className="flex h-3 flex-1 overflow-hidden rounded-full">
              {["#1E88E5", "#42A5F5", "#FDD835", "#FF9800", "#E65100"].map((c) => (
                <div key={c} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-xs text-text-muted">Quente</span>
          </div>
          <p className="mt-3 text-xs text-text-dim">
            Lapse rate de -0.65C por 100m de altitude sobre a media regional de{" "}
            {avgTmax.toFixed(1)}C (NASA POWER 1981-2025).
          </p>
        </div>
      )}

      {layers.ndvi.visible && (
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <p className="text-xs font-medium tracking-wider text-text-dim uppercase">
            Legenda NDVI
          </p>
          <div className="mt-2 flex h-4 overflow-hidden rounded-full">
            {ndviTiles.palette.map((color, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-text-dim">
            <span>0.0 — Solo nu</span>
            <span>0.3 — Ralo</span>
            <span>0.6 — Denso</span>
            <span>0.9 — Maximo</span>
          </div>
          <p className="mt-2 text-xs text-text-dim">
            Historico completo (2015-2026). Sentinel-2 L2A 10m via Google Earth Engine.
          </p>
        </div>
      )}

      {layers["uso-do-solo"].visible && (
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <p className="text-xs font-medium tracking-wider text-text-dim uppercase">
            Uso do solo atual — MapBiomas 2023
          </p>
          <div className="mt-4 space-y-2">
            {LAND_USE.map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: LAND_USE_COLORS[key] ?? "#666" }}
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
            Cobertura num raio de 20km ao redor de Cruz Alta. Fonte: MapBiomas
            Collection 9 (Landsat 30m, 1985-2023).
          </p>
        </div>
      )}

      {!anyVisible && (
        <p className="py-8 text-center text-sm text-text-muted">
          Selecione pelo menos uma camada acima para visualizar no mapa.
        </p>
      )}

      <div className="rounded-lg border border-border bg-bg-surface p-4 text-xs text-text-dim">
        <strong>Fontes:</strong> SRTM/Copernicus DEM (elevacao) | NASA POWER
        1981-2025 (temperatura) | Sentinel-2 L2A via Google Earth Engine (NDVI) |
        MapBiomas Collection 9 (uso do solo) | Imagem: Esri World Imagery
      </div>
    </div>
  );
}

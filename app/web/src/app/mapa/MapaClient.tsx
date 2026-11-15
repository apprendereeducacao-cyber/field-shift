"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  NdviTilesData,
  TopographyData,
  SiteData,
  MapBiomasData,
} from "@/lib/types";

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
  lavoura_perene: "#FF8F00",
  agricultura_geral: "#E65100",
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
  icon: string;
  zIndex: number;
};

const LAYER_CONFIGS: LayerConfig[] = [
  {
    key: "relevo",
    label: "Relevo",
    description: "Elevacao SRTM 30m",
    icon: "M",
    zIndex: 400,
  },
  {
    key: "temperatura",
    label: "Temperatura",
    description: "Tmax estimada",
    icon: "T",
    zIndex: 410,
  },
  {
    key: "ndvi",
    label: "NDVI",
    description: "Sentinel-2 10m",
    icon: "N",
    zIndex: 420,
  },
  {
    key: "uso-do-solo",
    label: "Uso do Solo",
    description: "MapBiomas Col. 9",
    icon: "U",
    zIndex: 430,
  },
];

type LayerState = { visible: boolean; opacity: number };

const MONTH_NAMES_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function elevationColor(ratio: number): string {
  const stops = [
    { at: 0.0, r: 27, g: 94, b: 32 },
    { at: 0.25, r: 56, g: 142, b: 60 },
    { at: 0.5, r: 102, g: 187, b: 106 },
    { at: 0.75, r: 253, g: 216, b: 53 },
    { at: 1.0, r: 230, g: 81, b: 0 },
  ];
  const t = Math.max(0, Math.min(1, ratio));
  let lo = stops[0],
    hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].at && t <= stops[i + 1].at) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const f = hi.at === lo.at ? 0 : (t - lo.at) / (hi.at - lo.at);
  const r = Math.round(lo.r + f * (hi.r - lo.r));
  const g = Math.round(lo.g + f * (hi.g - lo.g));
  const b = Math.round(lo.b + f * (hi.b - lo.b));
  return `rgb(${r},${g},${b})`;
}

function tempColor(ratio: number): string {
  const stops = [
    { at: 0.0, r: 30, g: 136, b: 229 },
    { at: 0.3, r: 66, g: 165, b: 245 },
    { at: 0.5, r: 253, g: 216, b: 53 },
    { at: 0.7, r: 255, g: 152, b: 0 },
    { at: 1.0, r: 230, g: 81, b: 0 },
  ];
  const t = Math.max(0, Math.min(1, ratio));
  let lo = stops[0],
    hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].at && t <= stops[i + 1].at) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const f = hi.at === lo.at ? 0 : (t - lo.at) / (hi.at - lo.at);
  const r = Math.round(lo.r + f * (hi.r - lo.r));
  const g = Math.round(lo.g + f * (hi.g - lo.g));
  const b = Math.round(lo.b + f * (hi.b - lo.b));
  return `rgb(${r},${g},${b})`;
}

export default function MapaClient({
  ndviTiles,
  topography,
  site,
  mapbiomas,
}: Props) {
  const avgTmax = site.q1?.temperature_c?.avg_tmax ?? 25.4;
  const meanElev = topography.summary.mean_elevation_m;

  const tempFromElevation = useCallback(
    (elev: number) => avgTmax + ((meanElev - elev) * 0.65) / 100,
    [avgTmax, meanElev],
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
  const siteMarkerRef = useRef<any>(null);
  const landUseLayerRef = useRef<any>(null);

  const [layers, setLayers] = useState<Record<LayerKey, LayerState>>({
    relevo: { visible: true, opacity: 0.7 },
    temperatura: { visible: false, opacity: 0.7 },
    ndvi: { visible: false, opacity: 0.75 },
    "uso-do-solo": { visible: false, opacity: 1 },
  });
  const [leafletReady, setLeafletReady] = useState(false);
  const [ndviMonth, setNdviMonth] = useState(1);
  const [ndviMode, setNdviMode] = useState<"monthly" | "yearly">("monthly");
  const [ndviYear, setNdviYear] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentNdvi = ndviTiles.monthly_tiles.find(
    (t) => t.month === ndviMonth,
  );
  const yearComparisons = ndviTiles.year_comparisons ?? [];
  const currentYearNdvi =
    ndviMode === "yearly" && yearComparisons.length > 0
      ? yearComparisons[ndviYear]
      : null;

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

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Init Leaflet ──
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
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);
      L.control.scale({ position: "bottomright", metric: true, imperial: false }).addTo(map);
      L.control
        .attribution({ position: "bottomright", prefix: false })
        .addAttribution("Esri, Maxar, Earthstar | NASA | MapBiomas")
        .addTo(map);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 },
      ).addTo(map);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, opacity: 0.6 },
      ).addTo(map);

      for (const cfg of LAYER_CONFIGS) {
        if (!map.getPane(cfg.key)) {
          map.createPane(cfg.key);
          map.getPane(cfg.key)!.style.zIndex = String(cfg.zIndex);
        }
      }

      // Site marker
      const siteIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:#2D6A4F;border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:12px;font-weight:700;
        ">FS</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      siteMarkerRef.current = L.marker(
        [site.point.lat, site.point.lon],
        { icon: siteIcon, zIndexOffset: 1000 },
      ).addTo(map);

      const popupContent = `
        <div style="font-family:system-ui;font-size:13px;line-height:1.5;min-width:180px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${site.point.name}</div>
          <div style="color:#666;font-size:11px;margin-bottom:8px">${site.point.state} | ${site.point.lat.toFixed(4)}, ${site.point.lon.toFixed(4)}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px">
            <span style="color:#888">Elevacao media</span>
            <span style="font-weight:600">${meanElev}m</span>
            <span style="color:#888">Tmax media</span>
            <span style="font-weight:600">${avgTmax.toFixed(1)}°C</span>
            <span style="color:#888">Desnivel</span>
            <span style="font-weight:600">${topography.summary.range_m}m</span>
            <span style="color:#888">Pts topografia</span>
            <span style="font-weight:600">${topography.points.length}</span>
          </div>
        </div>
      `;
      siteMarkerRef.current.bindPopup(popupContent, {
        maxWidth: 280,
        className: "fs-popup",
      });

      // Click handler — show point data
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        const closest = findClosestPoint(lat, lng);
        if (!closest) return;

        const dist = haversine(lat, lng, closest.latitude, closest.longitude);
        if (dist > 2) return;

        const elev = closest.elevation_m;
        const temp = avgTmax + ((meanElev - elev) * 0.65) / 100;
        const elevRange = topography.summary.max_elevation_m - topography.summary.min_elevation_m || 1;
        const elevRatio = (elev - topography.summary.min_elevation_m) / elevRange;

        const popup = L.popup()
          .setLatLng(e.latlng)
          .setContent(
            `<div style="font-family:system-ui;font-size:12px;line-height:1.6;min-width:160px">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px;border-bottom:1px solid #eee;padding-bottom:4px">Dados do ponto</div>
              <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
                <span style="color:#888">Latitude</span><span>${lat.toFixed(5)}</span>
                <span style="color:#888">Longitude</span><span>${lng.toFixed(5)}</span>
                <span style="color:#888">Elevacao</span>
                <span style="font-weight:600">${elev.toFixed(0)}m
                  <span style="display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:middle;margin-left:4px;background:${elevationColor(elevRatio)}"></span>
                </span>
                <span style="color:#888">Temp. max est.</span>
                <span style="font-weight:600">${temp.toFixed(1)}°C</span>
              </div>
            </div>`,
          )
          .openOn(map);

        // auto-close after 6s
        setTimeout(() => map.closePopup(popup), 6000);
      });

      mapInstance.current = map;
      setLeafletReady(true);
    }

    function findClosestPoint(lat: number, lon: number) {
      let best = null;
      let bestDist = Infinity;
      for (const p of topography.points) {
        const d =
          (p.latitude - lat) ** 2 + (p.longitude - lon) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = p;
        }
      }
      return best;
    }

    function haversine(
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
    ) {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function loadScript(src: string, onLoad: () => void) {
      const existing = document.querySelector(
        `script[src="${src}"]`,
      ) as HTMLScriptElement | null;
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
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
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
            initMap,
          ),
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
      siteMarkerRef.current = null;
      landUseLayerRef.current = null;
      setLeafletReady(false);
    };
  }, [ndviTiles.center.lat, ndviTiles.center.lon, ndviTiles.zoom, site.point.lat, site.point.lon, site.point.name, site.point.state, avgTmax, meanElev, topography]);

  // ── Relevo + Temperatura layers (circle markers for visibility) ──
  useEffect(() => {
    if (!mapInstance.current || !leafletReady) return;
    const L = (window as any).L;
    const map = mapInstance.current;

    // Relevo
    if (layers.relevo.visible && !relevoLayerRef.current) {
      const { min_elevation_m: min, max_elevation_m: max } =
        topography.summary;
      const range = max - min || 1;
      const group = L.layerGroup([], { pane: "relevo" });

      for (const p of topography.points) {
        const ratio = (p.elevation_m - min) / range;
        L.circleMarker([p.latitude, p.longitude], {
          radius: 6,
          fillColor: elevationColor(ratio),
          fillOpacity: 0.85,
          stroke: false,
          interactive: false,
          pane: "relevo",
        }).addTo(group);
      }
      group.addTo(map);
      relevoLayerRef.current = group;
    } else if (!layers.relevo.visible && relevoLayerRef.current) {
      map.removeLayer(relevoLayerRef.current);
      relevoLayerRef.current = null;
    }

    // Temperatura
    if (layers.temperatura.visible && !tempLayerRef.current) {
      const temps = topography.points.map((p) =>
        tempFromElevation(p.elevation_m),
      );
      const minT = Math.min(...temps);
      const maxT = Math.max(...temps);
      const rangeT = maxT - minT || 1;
      const group = L.layerGroup([], { pane: "temperatura" });

      topography.points.forEach((p, i) => {
        const ratio = (temps[i] - minT) / rangeT;
        L.circleMarker([p.latitude, p.longitude], {
          radius: 6,
          fillColor: tempColor(ratio),
          fillOpacity: 0.85,
          stroke: false,
          interactive: false,
          pane: "temperatura",
        }).addTo(group);
      });
      group.addTo(map);
      tempLayerRef.current = group;
    } else if (!layers.temperatura.visible && tempLayerRef.current) {
      map.removeLayer(tempLayerRef.current);
      tempLayerRef.current = null;
    }
  }, [
    layers.relevo.visible,
    layers.temperatura.visible,
    leafletReady,
    topography,
    tempFromElevation,
  ]);

  // ── NDVI tile layer ──
  useEffect(() => {
    if (!mapInstance.current || !leafletReady) return;
    const L = (window as any).L;
    const map = mapInstance.current;

    if (ndviLayerRef.current) {
      map.removeLayer(ndviLayerRef.current);
      ndviLayerRef.current = null;
    }

    if (!layers.ndvi.visible) return;

    const tileUrl =
      ndviMode === "yearly" && currentYearNdvi
        ? currentYearNdvi.tile_url
        : currentNdvi?.tile_url;

    if (tileUrl) {
      ndviLayerRef.current = L.tileLayer(tileUrl, {
        opacity: layers.ndvi.opacity,
        maxZoom: 15,
        pane: "ndvi",
      }).addTo(map);
    }
  }, [
    layers.ndvi.visible,
    layers.ndvi.opacity,
    ndviMonth,
    ndviMode,
    ndviYear,
    currentNdvi,
    currentYearNdvi,
    leafletReady,
  ]);

  // ── Land use layer (circle markers from mapbiomas proportions) ──
  useEffect(() => {
    if (!mapInstance.current || !leafletReady) return;
    const L = (window as any).L;
    const map = mapInstance.current;

    if (landUseLayerRef.current) {
      map.removeLayer(landUseLayerRef.current);
      landUseLayerRef.current = null;
    }

    if (!layers["uso-do-solo"].visible) return;

    const group = L.layerGroup([], { pane: "uso-do-solo" });
    const center = { lat: site.point.lat, lon: site.point.lon };
    const radius_km = (mapbiomas.buffer_radius_m || 20000) / 1000;

    // Draw proportional sectors as a ring of colored circles around the site
    const entries = LAND_USE.slice(0, 8);
    const totalPct = entries.reduce((s, [, v]) => s + v.pct, 0);
    let angleOffset = -Math.PI / 2;

    for (const [key, val] of entries) {
      const angleFraction = (val.pct / totalPct) * 2 * Math.PI;
      const midAngle = angleOffset + angleFraction / 2;
      const dist = radius_km * 0.4;

      const lat =
        center.lat + (dist / 111.32) * Math.cos(midAngle);
      const lon =
        center.lon +
        (dist / (111.32 * Math.cos((center.lat * Math.PI) / 180))) *
          Math.sin(midAngle);

      const circleRadius = Math.max(
        300,
        Math.sqrt(val.pct / 100) * radius_km * 400,
      );

      L.circle([lat, lon], {
        radius: circleRadius,
        fillColor: LAND_USE_COLORS[key] ?? "#666",
        fillOpacity: 0.55,
        color: LAND_USE_COLORS[key] ?? "#666",
        weight: 1.5,
        pane: "uso-do-solo",
      })
        .bindTooltip(
          `<strong>${LAND_USE_LABELS[key] ?? key}</strong><br/>${val.pct}% — ${val.area_ha.toLocaleString("pt-BR")} ha`,
          { sticky: true },
        )
        .addTo(group);

      angleOffset += angleFraction;
    }

    // Buffer circle outline
    L.circle([center.lat, center.lon], {
      radius: mapbiomas.buffer_radius_m || 20000,
      fillColor: "transparent",
      fillOpacity: 0,
      color: "#fff",
      weight: 1.5,
      dashArray: "6,4",
      opacity: 0.6,
      interactive: false,
      pane: "uso-do-solo",
    }).addTo(group);

    group.addTo(map);
    landUseLayerRef.current = group;
  }, [layers["uso-do-solo"].visible, leafletReady, LAND_USE, site.point.lat, site.point.lon, mapbiomas.buffer_radius_m]);

  // ── Opacity sync ──
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

  useEffect(() => {
    if (landUseLayerRef.current && layers["uso-do-solo"].visible) {
      const pane = mapInstance.current?.getPane("uso-do-solo");
      if (pane) pane.style.opacity = String(layers["uso-do-solo"].opacity);
    }
  }, [layers["uso-do-solo"].opacity, layers["uso-do-solo"].visible]);

  // ── Derived values ──
  const ndviColor =
    ndviMode === "yearly" && currentYearNdvi
      ? ndviTiles.palette[
          Math.min(Math.floor(currentYearNdvi.ndvi_mean * 10), 9)
        ]
      : currentNdvi?.ndvi_mean
        ? ndviTiles.palette[
            Math.min(Math.floor(currentNdvi.ndvi_mean * 10), 9)
          ]
        : "#666";

  const ndviValue =
    ndviMode === "yearly" && currentYearNdvi
      ? currentYearNdvi.ndvi_mean
      : currentNdvi?.ndvi_mean;

  const ndviLabel =
    ndviMode === "yearly" && currentYearNdvi
      ? currentYearNdvi.label
      : currentNdvi?.name;

  const visibleCount = Object.values(layers).filter((l) => l.visible).length;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col"
      style={{ height: isFullscreen ? "100vh" : "calc(100vh - 120px)", minHeight: "500px" }}
    >
      {/* ── Map container ── */}
      <div ref={mapRef} className="absolute inset-0 z-0 bg-bg-surface-alt" />

      {/* ── Top bar ── */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-[500] flex items-start justify-between p-3">
        {/* Panel toggle */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="pointer-events-auto flex items-center gap-2 rounded-lg bg-bg-surface/95 px-3 py-2 text-sm font-semibold text-text-primary shadow-lg backdrop-blur-sm transition-colors hover:bg-bg-surface"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
          Camadas
          {visibleCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {visibleCount}
            </span>
          )}
        </button>

        {/* Right controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => {
              if (mapInstance.current) {
                mapInstance.current.setView(
                  [ndviTiles.center.lat, ndviTiles.center.lon],
                  ndviTiles.zoom,
                );
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-surface/95 text-text-muted shadow-lg backdrop-blur-sm hover:text-text-primary"
            title="Resetar vista"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="8" cy="8" r="3" />
              <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
            </svg>
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-surface/95 text-text-muted shadow-lg backdrop-blur-sm hover:text-text-primary"
            title={isFullscreen ? "Sair do fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M6 2v4H2M10 14v-4h4M6 14v-4H2M10 2v4h4" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Side panel ── */}
      <div
        className={`absolute left-3 top-14 z-[500] w-72 transition-all duration-300 ${
          panelOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-[calc(100%+12px)] opacity-0"
        }`}
        style={{ maxHeight: "calc(100% - 72px)" }}
      >
        <div className="flex max-h-full flex-col overflow-hidden rounded-xl bg-bg-surface/95 shadow-xl backdrop-blur-sm">
          <div className="overflow-y-auto p-3">
            {/* Layer toggles */}
            <div className="space-y-1.5">
              {LAYER_CONFIGS.map((cfg) => {
                const state = layers[cfg.key];
                return (
                  <div key={cfg.key}>
                    <button
                      onClick={() => toggleLayer(cfg.key)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        state.visible
                          ? "bg-primary/10 text-primary"
                          : "text-text-muted hover:bg-bg-surface-alt hover:text-text-primary"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                          state.visible
                            ? "bg-primary text-white"
                            : "bg-bg-surface-alt text-text-dim"
                        }`}
                      >
                        {cfg.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-tight">
                          {cfg.label}
                        </div>
                        <div className="text-[10px] leading-tight text-text-dim">
                          {cfg.description}
                        </div>
                      </div>
                      <div
                        className={`h-3 w-6 rounded-full transition-colors ${
                          state.visible ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <div
                          className={`h-3 w-3 rounded-full bg-white shadow transition-transform ${
                            state.visible ? "translate-x-3" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </button>

                    {/* Opacity slider */}
                    {state.visible && (
                      <div className="flex items-center gap-2 px-2.5 pb-1 pt-0.5 pl-12">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(state.opacity * 100)}
                          onChange={(e) =>
                            setOpacity(cfg.key, Number(e.target.value) / 100)
                          }
                          className="h-1 flex-1 appearance-none rounded-full bg-border accent-primary [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3"
                        />
                        <span className="w-7 text-right font-mono text-[10px] text-text-dim">
                          {Math.round(state.opacity * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── NDVI timeline ── */}
            {layers.ndvi.visible && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    {ndviLabel}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: ndviColor }}
                  >
                    {ndviValue?.toFixed(2)}
                  </span>
                </div>

                {/* Mode toggle */}
                {yearComparisons.length > 0 && (
                  <div className="mb-2 flex rounded-md bg-bg-surface-alt p-0.5">
                    <button
                      onClick={() => setNdviMode("monthly")}
                      className={`flex-1 rounded px-2 py-1 text-[10px] font-semibold transition-colors ${
                        ndviMode === "monthly"
                          ? "bg-bg-surface text-primary shadow-sm"
                          : "text-text-dim"
                      }`}
                    >
                      Mensal
                    </button>
                    <button
                      onClick={() => {
                        setNdviMode("yearly");
                        if (ndviYear === 0 && yearComparisons.length > 0)
                          setNdviYear(0);
                      }}
                      className={`flex-1 rounded px-2 py-1 text-[10px] font-semibold transition-colors ${
                        ndviMode === "yearly"
                          ? "bg-bg-surface text-primary shadow-sm"
                          : "text-text-dim"
                      }`}
                    >
                      Anual
                    </button>
                  </div>
                )}

                {ndviMode === "monthly" ? (
                  <>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={ndviMonth}
                      onChange={(e) => setNdviMonth(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[9px] text-text-dim">
                      {MONTH_NAMES_SHORT.map((m, i) => (
                        <span
                          key={m}
                          className={
                            i + 1 === ndviMonth
                              ? "font-bold text-primary"
                              : ""
                          }
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  yearComparisons.length > 0 && (
                    <>
                      <input
                        type="range"
                        min={0}
                        max={yearComparisons.length - 1}
                        value={ndviYear}
                        onChange={(e) =>
                          setNdviYear(Number(e.target.value))
                        }
                        className="w-full accent-primary"
                      />
                      <div className="mt-1 flex justify-between text-[9px] text-text-dim">
                        <span>{yearComparisons[0]?.year}</span>
                        <span>
                          {
                            yearComparisons[yearComparisons.length - 1]
                              ?.year
                          }
                        </span>
                      </div>
                    </>
                  )
                )}

                {/* NDVI palette */}
                <div className="mt-2">
                  <div className="flex h-2 overflow-hidden rounded-full">
                    {ndviTiles.palette.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="mt-0.5 flex justify-between text-[8px] text-text-dim">
                    <span>0.0</span>
                    <span>0.5</span>
                    <span>1.0</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Legends ── */}
            {layers.relevo.visible && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                  Elevacao
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-muted">
                    {topography.summary.min_elevation_m}m
                  </span>
                  <div className="flex h-2 flex-1 overflow-hidden rounded-full">
                    {["#1B5E20", "#388E3C", "#66BB6A", "#FDD835", "#E65100"].map(
                      (c) => (
                        <div
                          key={c}
                          className="flex-1"
                          style={{ backgroundColor: c }}
                        />
                      ),
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted">
                    {topography.summary.max_elevation_m}m
                  </span>
                </div>
              </div>
            )}

            {layers.temperatura.visible && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                  Temperatura max.
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-muted">Frio</span>
                  <div className="flex h-2 flex-1 overflow-hidden rounded-full">
                    {["#1E88E5", "#42A5F5", "#FDD835", "#FF9800", "#E65100"].map(
                      (c) => (
                        <div
                          key={c}
                          className="flex-1"
                          style={{ backgroundColor: c }}
                        />
                      ),
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted">Quente</span>
                </div>
              </div>
            )}

            {layers["uso-do-solo"].visible && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                  Uso do solo — 2023
                </p>
                <div className="space-y-1">
                  {LAND_USE.slice(0, 6).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{
                          backgroundColor: LAND_USE_COLORS[key] ?? "#666",
                        }}
                      />
                      <span className="flex-1 text-[11px] text-text-secondary">
                        {LAND_USE_LABELS[key] ?? key}
                      </span>
                      <span className="font-mono text-[10px] text-text-dim">
                        {val.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info footer */}
            <div className="mt-3 border-t border-border pt-2">
              <p className="text-[9px] leading-relaxed text-text-dim">
                Clique no mapa para ver dados do ponto. SRTM (elevacao) | NASA
                POWER (temp) | Sentinel-2 (NDVI) | MapBiomas (uso do solo)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom info bar ── */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[500] flex items-end justify-between p-3">
        <div className="pointer-events-auto rounded-lg bg-bg-surface/90 px-3 py-1.5 text-[11px] text-text-muted shadow-lg backdrop-blur-sm">
          <span className="font-semibold text-text-primary">
            {site.point.name}
          </span>{" "}
          — {site.point.lat.toFixed(4)}, {site.point.lon.toFixed(4)} | Elev.
          media {meanElev}m | {topography.points.length} pontos topograficos
        </div>
      </div>

      {/* ── Custom popup styles ── */}
      <style jsx global>{`
        .fs-popup .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .fs-popup .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .leaflet-control-zoom a {
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
          border-radius: 8px !important;
        }
        .leaflet-control-zoom {
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15) !important;
          border: none !important;
        }
        .leaflet-control-scale-line {
          border-radius: 4px;
          font-size: 10px;
          padding: 2px 8px;
        }
      `}</style>
    </div>
  );
}

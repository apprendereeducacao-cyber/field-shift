import {
  getDefaultSiteId,
  getSite,
  getTimeline,
  getSoilProfile,
  getTopography,
  getSoilMoisture,
  getNdvi,
  getMapbiomas,
  getEvapotranspiration,
  getSmap,
  getGpm,
  getGrace,
  getClimateExtended,
  getLst,
  MONTH_NAMES,
  KEY_FINDINGS,
} from "@/lib/supabase-data";
import DadosClient from "./DadosClient";

export default async function Dados() {
  const siteId = await getDefaultSiteId();
  const [site, timeline, soil, topography, soilMoisture, ndvi, mapbiomas, evapotranspiration, smap, gpm, grace, climateExt, lst] = await Promise.all([
    getSite(siteId),
    getTimeline(siteId),
    getSoilProfile(siteId),
    getTopography(siteId),
    getSoilMoisture(siteId),
    getNdvi(siteId),
    getMapbiomas(siteId),
    getEvapotranspiration(siteId),
    getSmap(siteId),
    getGpm(siteId),
    getGrace(siteId),
    getClimateExtended(siteId),
    getLst(siteId),
  ]);

  return (
    <DadosClient
      site={site}
      timeline={timeline}
      soil={soil}
      topography={topography}
      soilMoisture={soilMoisture}
      ndvi={ndvi}
      mapbiomas={mapbiomas}
      evapotranspiration={evapotranspiration}
      smap={smap}
      gpm={gpm}
      grace={grace}
      climateExt={climateExt}
      lst={lst}
      monthNames={MONTH_NAMES}
      keyFindings={KEY_FINDINGS}
    />
  );
}

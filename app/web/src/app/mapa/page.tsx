import { getDefaultSiteId, getNdviTiles, getTopography, getSite, getMapbiomas } from "@/lib/supabase-data";
import MapaClient from "./MapaClient";

export default async function Mapa() {
  const siteId = await getDefaultSiteId();
  const [ndviTiles, topography, site, mapbiomas] = await Promise.all([
    getNdviTiles(siteId),
    getTopography(siteId),
    getSite(siteId),
    getMapbiomas(siteId),
  ]);

  return (
    <div className="-mx-4 -my-6 sm:-mx-6">
      <MapaClient
        ndviTiles={ndviTiles}
        topography={topography}
        site={site}
        mapbiomas={mapbiomas}
      />
    </div>
  );
}

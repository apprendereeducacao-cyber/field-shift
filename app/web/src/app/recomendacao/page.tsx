import {
  getDefaultSiteId,
  getTimeline,
  getSite,
  getSoilProfile,
  getRotations,
  getCrops,
  KEY_FINDINGS,
} from "@/lib/supabase-data";
import RecomendacaoClient from "./RecomendacaoClient";

export default async function Recomendacao() {
  const siteId = await getDefaultSiteId();
  const [timeline, site, soil, { strategies }, crops] = await Promise.all([
    getTimeline(siteId),
    getSite(siteId),
    getSoilProfile(siteId),
    getRotations(siteId),
    getCrops(),
  ]);

  return (
    <RecomendacaoClient
      timeline={timeline}
      site={site}
      soil={soil}
      rotations={strategies}
      crops={crops}
      keyFindings={KEY_FINDINGS}
    />
  );
}

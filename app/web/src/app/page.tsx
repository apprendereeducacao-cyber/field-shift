import {
  getDefaultSiteId,
  getTimeline,
  getRiskEngine,
  getSite,
  getCoverCrops,
  KEY_FINDINGS,
} from "@/lib/supabase-data";
import HomeClient from "./HomeClient";

export default async function Home() {
  const siteId = await getDefaultSiteId();
  const [timeline, riskEngine, site, coverCrops] = await Promise.all([
    getTimeline(siteId),
    getRiskEngine(siteId),
    getSite(siteId),
    getCoverCrops(),
  ]);

  return (
    <HomeClient
      timeline={timeline}
      riskEngine={riskEngine}
      site={site}
      coverCrops={coverCrops}
      keyFindings={KEY_FINDINGS}
    />
  );
}

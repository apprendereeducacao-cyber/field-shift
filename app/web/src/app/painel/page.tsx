import {
  getDefaultSiteId,
  getTimeline,
  getRiskEngine,
  getRotations,
  KEY_FINDINGS,
} from "@/lib/supabase-data";
import PainelClient from "./PainelClient";

export default async function Painel() {
  const siteId = await getDefaultSiteId();
  const [timeline, riskEngine, { strategies }] = await Promise.all([
    getTimeline(siteId),
    getRiskEngine(siteId),
    getRotations(siteId),
  ]);

  return (
    <PainelClient
      timeline={timeline}
      riskEngine={riskEngine}
      rotations={strategies}
      keyFindings={KEY_FINDINGS}
    />
  );
}

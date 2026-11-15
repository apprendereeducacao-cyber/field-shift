import {
  getDefaultSiteId,
  getTimeline,
  getRiskEngine,
  getRotations,
  KEY_FINDINGS,
} from "@/lib/supabase-data";
import { analyzePatterns } from "@/lib/pattern-engine";
import PainelClient from "./PainelClient";

export default async function Painel() {
  const siteId = await getDefaultSiteId();
  const [timeline, riskEngine, { strategies }] = await Promise.all([
    getTimeline(siteId),
    getRiskEngine(siteId),
    getRotations(siteId),
  ]);

  let patterns = null;
  try {
    patterns = await analyzePatterns(
      siteId,
      timeline.timeline,
      riskEngine.year_classifications,
      riskEngine.historical_averages.yield_sc_ha,
    );
  } catch {
    // Pattern data not available
  }

  return (
    <PainelClient
      timeline={timeline}
      riskEngine={riskEngine}
      rotations={strategies}
      keyFindings={KEY_FINDINGS}
      patterns={patterns}
    />
  );
}

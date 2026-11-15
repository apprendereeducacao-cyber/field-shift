import { NextResponse } from "next/server";
import { getTimeline, getRiskEngine, getDefaultSiteId } from "@/lib/supabase-data";
import { analyzePatterns } from "@/lib/pattern-engine";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get("site") ?? await getDefaultSiteId();
    const yearParam = url.searchParams.get("year");
    const topN = Math.min(Number(url.searchParams.get("top") ?? "5"), 20);

    const [timelineData, riskData] = await Promise.all([
      getTimeline(siteId),
      getRiskEngine(siteId),
    ]);

    const targetYear = yearParam ? Number(yearParam) : undefined;

    const analysis = await analyzePatterns(
      siteId,
      timelineData.timeline,
      riskData.year_classifications,
      riskData.historical_averages.yield_sc_ha,
      targetYear
    );

    if (topN !== 5) {
      analysis.analog_years = analysis.analog_years.slice(0, topN);
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Erro ao processar padroes" },
      { status: 500 }
    );
  }
}

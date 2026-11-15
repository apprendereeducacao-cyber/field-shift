import { NextResponse } from "next/server";
import {
  getDefaultSiteId,
  getTimeline,
  getRiskEngine,
  getCoverCrops,
  getRotations,
  getSite,
} from "@/lib/supabase-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  try {
    const siteId = await getDefaultSiteId();
    const [site, timeline, riskEngine, coverCrops, { strategies }] =
      await Promise.all([
        getSite(siteId),
        getTimeline(siteId),
        getRiskEngine(siteId),
        getCoverCrops(),
        getRotations(siteId),
      ]);

    const years = timeline.timeline.map((y) => y.year).sort((a, b) => b - a);
    const selectedYear = year ? parseInt(year, 10) : years[0];

    const yearData = timeline.timeline.find((y) => y.year === selectedYear);
    const yearRisk = riskEngine.year_risks.find((y) => y.year === selectedYear);

    const monthlyAvgs = site.q1?.monthly_averages ?? [];
    const avgTemp = monthlyAvgs.length > 0
      ? monthlyAvgs.reduce((s: number, m: { avg_tmax_c: number; avg_tmin_c: number }) => s + (m.avg_tmax_c + m.avg_tmin_c) / 2, 0) / monthlyAvgs.length
      : null;
    const avgRain = monthlyAvgs.length > 0
      ? monthlyAvgs.reduce((s: number, m: { avg_rain_mm: number }) => s + m.avg_rain_mm, 0)
      : null;

    const topStrategy = strategies[0] ?? null;

    const cropNames = coverCrops.crops.slice(0, 6).map((c) => c.name);

    return NextResponse.json({
      municipality: site.point.name,
      uf: site.point.state,
      years,
      selectedYear,
      riskScore: yearRisk?.risk_score ?? null,
      riskLabel: yearRisk?.class ?? null,
      avgTemp,
      avgRain,
      yearData: yearData
        ? {
            yield: yearData.yield_sc_ha,
            rain: yearData.annual_rain_mm,
            temp: yearData.avg_temp_c,
            spiDjf: yearData.season_rain_mm,
          }
        : null,
      topCrops: topStrategy
        ? topStrategy.sequence.map((s) => s.crop)
        : ["Soja", "Milho", "Trigo", "Aveia"],
      coverCrops: cropNames,
      rotation: topStrategy
        ? {
            name: topStrategy.name,
            subtitle: topStrategy.subtitle,
            scores: topStrategy.scores,
            totalScore: topStrategy.total_score,
            sequence: topStrategy.sequence,
          }
        : null,
      strategies: strategies.slice(0, 3).map((s) => ({
        name: s.name,
        subtitle: s.subtitle,
        totalScore: s.total_score,
        sequence: s.sequence,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

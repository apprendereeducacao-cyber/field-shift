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

    const totalYears = timeline.timeline.length;
    const bestYear = timeline.timeline.reduce((a, b) => ((b.yield_sc_ha ?? 0) > (a.yield_sc_ha ?? 0) ? b : a), timeline.timeline[0]);
    const worstYear = timeline.timeline.reduce((a, b) => ((b.yield_sc_ha ?? 0) < (a.yield_sc_ha ?? 0) ? b : a), timeline.timeline[0]);
    const avgYield = totalYears > 0 ? timeline.timeline.reduce((s, y) => s + (y.yield_sc_ha ?? 0), 0) / totalYears : 0;

    const riskMonths = site.q2?.months ?? [];
    const frostMonths = riskMonths
      .map((m: any, i: number) => ({ i, v: m.frost ?? 0 }))
      .filter((m: any) => m.v > 0.3)
      .map((m: any) => ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][m.i]);
    const dryMonths = riskMonths
      .map((m: any, i: number) => ({ i, v: m.dry_spell ?? 0 }))
      .filter((m: any) => m.v > 0.3)
      .map((m: any) => ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][m.i]);

    const lines: string[] = [];
    lines.push(`${site.point.name} tem ${totalYears} anos de dados satelitais. Media historica: ${avgYield.toFixed(1)} sc/ha de soja, ${avgRain?.toFixed(0) ?? "—"} mm de chuva/ano, temperatura media de ${avgTemp?.toFixed(1) ?? "—"} C.`);
    if (bestYear && worstYear) {
      const bY = bestYear.yield_sc_ha ?? 0;
      const wY = worstYear.yield_sc_ha ?? 0;
      lines.push(`Melhor safra: ${bestYear.year} com ${bY.toFixed(1)} sc/ha. Pior: ${worstYear.year} com ${wY.toFixed(1)} sc/ha — diferenca de ${(bY - wY).toFixed(0)} sacas.`);
    }
    if (frostMonths.length > 0) {
      lines.push(`Geada e risco real: aparece em mais de 3 a cada 10 anos nos meses de ${frostMonths.join(", ")}.`);
    }
    if (dryMonths.length > 0) {
      lines.push(`Estiagens prolongadas concentram-se em ${dryMonths.join(", ")}.`);
    }
    if (yearData) {
      const yVal = yearData.yield_sc_ha ?? 0;
      const diff = yVal - avgYield;
      const dir = diff > 0 ? "acima" : "abaixo";
      lines.push(`Safra ${selectedYear}: ${yVal.toFixed(1)} sc/ha (${Math.abs(diff).toFixed(1)} ${dir} da media), ${yearData.annual_rain_mm?.toFixed(0) ?? "—"} mm de chuva.`);
    }
    const summary = lines.join(" ");

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
            enso: (yearData as any).enso ?? null,
          }
        : null,
      ensoImpact: timeline.enso_impact ?? null,
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
      riskCalendar: site.q2.months,
      summary,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

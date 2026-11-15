import { NextResponse } from "next/server";
import {
  getDefaultSiteId,
  getTimeline,
  getRiskEngine,
  getCoverCrops,
  getRotations,
  getSite,
} from "@/lib/supabase-data";

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  // Idioma do texto do resumo (padrão: inglês). Os números são os mesmos nos dois.
  const en = searchParams.get("lang") !== "pt";

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
      .map((m: any) => (en ? MONTHS_EN : MONTHS_PT)[m.i]);
    const dryMonths = riskMonths
      .map((m: any, i: number) => ({ i, v: m.dry_spell ?? 0 }))
      .filter((m: any) => m.v > 0.3)
      .map((m: any) => (en ? MONTHS_EN : MONTHS_PT)[m.i]);

    const lines: string[] = [];
    if (en) {
      lines.push(`${site.point.name} has ${totalYears} years of satellite data. Historical average: ${avgYield.toFixed(1)} bags/ha of soybean, ${avgRain?.toFixed(0) ?? "—"} mm of rain/year, mean temperature of ${avgTemp?.toFixed(1) ?? "—"} C.`);
      if (bestYear && worstYear) {
        const bY = bestYear.yield_sc_ha ?? 0;
        const wY = worstYear.yield_sc_ha ?? 0;
        lines.push(`Best season: ${bestYear.year} with ${bY.toFixed(1)} bags/ha. Worst: ${worstYear.year} with ${wY.toFixed(1)} bags/ha — a gap of ${(bY - wY).toFixed(0)} bags.`);
      }
      if (frostMonths.length > 0) {
        lines.push(`Frost is a real risk: it shows up in more than 3 out of 10 years in ${frostMonths.join(", ")}.`);
      }
      if (dryMonths.length > 0) {
        lines.push(`Long dry spells concentrate in ${dryMonths.join(", ")}.`);
      }
      if (yearData) {
        const yVal = yearData.yield_sc_ha ?? 0;
        const diff = yVal - avgYield;
        const dir = diff > 0 ? "above" : "below";
        lines.push(`${selectedYear} season: ${yVal.toFixed(1)} bags/ha (${Math.abs(diff).toFixed(1)} ${dir} average), ${yearData.annual_rain_mm?.toFixed(0) ?? "—"} mm of rain.`);
      }
    } else {
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
          }
        : null,
      topCrops: topStrategy
        ? topStrategy.sequence.map((s) => s.crop)
        : ["Soja", "Milho", "Trigo", "Aveia"],
      coverCrops: cropNames,
      rotation: topStrategy
        ? {
            id: topStrategy.id,
            name: topStrategy.name,
            subtitle: topStrategy.subtitle,
            scores: topStrategy.scores,
            totalScore: topStrategy.total_score,
            sequence: topStrategy.sequence,
          }
        : null,
      strategies: strategies.slice(0, 3).map((s) => ({
        id: s.id,
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

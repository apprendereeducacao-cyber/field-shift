import "server-only";
import {
  getSite,
  getSoilProfile,
  getTimeline,
  getRiskEngine,
  getCrops,
  getCoverCrops,
  getClimateExtended,
} from "./supabase-data";

const TOPIC_PATTERNS: Record<string, RegExp[]> = {
  clima: [
    /clima|chuva|seca|temperatura|geada|precipita|el.?ni[nñ]o|la.?ni[nñ]a|enso|frio|calor|umidade|vento/i,
  ],
  solo: [
    /solo|terra|argila|areia|pH|materia.?organica|nutrient|fertilid|adubo|calcario|compacta|drenag/i,
  ],
  culturas: [
    /soja|milho|trigo|aveia|nabo|ervilha|centeio|azevem|canola|feijao|girassol|sorgo|cevada|planti|colheit|safra|safrinha|rota[cç]/i,
  ],
  tendencias: [
    /tendencia|historico|serie.?temporal|44.?anos|longo.?prazo|mudanca|evolucao|proje[cç]ao/i,
  ],
  vegetacao: [
    /ndvi|vegeta|cobertura|biomassa|mapbiomas|uso.?do.?solo|desmatamento|floresta|pastagem/i,
  ],
};

export function classifyTopic(
  message: string,
  history: string[]
): string[] {
  const text = [message, ...history.slice(-4)].join(" ");
  const topics: string[] = [];

  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
    if (patterns.some((p) => p.test(text))) {
      topics.push(topic);
    }
  }

  return topics.length > 0 ? topics : ["culturas"];
}

export async function assembleContext(
  siteId: string,
  topics: string[]
): Promise<string> {
  const [site, soil, timeline, riskEngine, crops, coverCrops] =
    await Promise.all([
      getSite(siteId),
      getSoilProfile(siteId),
      getTimeline(siteId),
      getRiskEngine(siteId),
      getCrops(),
      getCoverCrops(),
    ]);

  const sections: string[] = [];

  const pt = site.point;
  sections.push(
    `REGIAO: ${pt.name} (${pt.lat}S, ${Math.abs(pt.lon)}W), ${pt.state}`
  );

  const lastYear = timeline.timeline[timeline.timeline.length - 1];
  if (lastYear) {
    sections.push(
      `ANO MAIS RECENTE (${lastYear.year}): Precipitacao ${lastYear.annual_rain_mm}mm, Temp media ${lastYear.avg_temp_c ?? "N/D"}C, ENSO: ${lastYear.enso}`
    );
  }

  const scenario = riskEngine.current_scenario;
  sections.push(
    `RISCO ATUAL: Score ${scenario.risk_score}/100 — ENSO: ${scenario.enso_detail}, Chuva safra: ${scenario.season_rain_mm}mm`
  );

  sections.push(
    `SOLO: ${soil.texture_class}, Fertilidade: ${soil.interpretation.fertility}, Risco compactacao: ${soil.interpretation.compaction_risk}`
  );

  const cropNames = crops.map((c: { name: string }) => c.name).join(", ");
  sections.push(`CULTURAS REGIONAIS: ${cropNames}`);

  const coverNames = coverCrops.crops.map((c) => c.name).join(", ");
  sections.push(`COBERTURAS: ${coverNames}`);

  if (topics.includes("clima")) {
    const climateExt = await getClimateExtended(siteId);
    sections.push(
      `CLIMA DETALHADO: Fonte ${climateExt.source}, Periodo: ${climateExt.period}`
    );
    const avgs = riskEngine.historical_averages;
    sections.push(
      `MEDIAS HISTORICAS: Chuva safra ${avgs.season_rain_mm}mm, Dias quentes ${avgs.hot_days}, Umidade solo ${avgs.avg_soil_moisture}`
    );
  }

  if (topics.includes("tendencias")) {
    const recentYears = timeline.timeline.slice(-10);
    const summary = recentYears
      .map((y) => `${y.year}: ${y.annual_rain_mm}mm, ${y.avg_temp_c ?? "?"}C`)
      .join("; ");
    sections.push(`ULTIMOS 10 ANOS: ${summary}`);
  }

  if (topics.includes("vegetacao")) {
    sections.push(
      `CENARIO VEGETACAO: ENSO ${scenario.enso}, Umidade solo ${scenario.avg_soil_moisture}`
    );
  }

  return sections.join("\n\n");
}

export const SYSTEM_PROMPT = `Voce e um agronomo especialista em rotacao de culturas para o Rio Grande do Sul.
Voce conhece profundamente os dados de satelite da NASA para a regiao de Cruz Alta-RS.

Seu objetivo: ajudar o produtor a escolher a melhor estrategia de rotacao de culturas
e plantas de cobertura para a propriedade dele.

Regras:
- Faca perguntas simples e diretas ao produtor (maximo 2-3 por mensagem)
- Use os dados cientificos para justificar suas recomendacoes
- Fale como agronomo experiente, tom direto e pratico
- Responda em portugues, sem jargao tecnico desnecessario
- Quando tiver dados suficientes do produtor, proponha uma estrategia concreta
- Nao use emojis`;

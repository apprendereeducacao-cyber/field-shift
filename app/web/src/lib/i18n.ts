"use client";

import { createContext, useContext } from "react";

export type Lang = "pt" | "en";

export const LanguageContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({ lang: "pt", setLang: () => {} });

export function useLanguage() {
  return useContext(LanguageContext);
}

export function t(lang: Lang, key: string): string {
  const dict = lang === "pt" ? pt : en;
  return (dict as Record<string, string>)[key] ?? key;
}

const pt: Record<string, string> = {
  // Navigation
  "nav.inicio": "Inicio",
  "nav.mapa": "Mapa",
  "nav.fechar_menu": "Fechar menu",
  "nav.abrir_menu": "Abrir menu",

  // Hero
  "hero.title_line1": "Adapte sua lavoura",
  "hero.title_line2": "com dados da NASA",
  "hero.select_city": "Selecione seu municipio",
  "hero.satellites": "Satélites Parceiros",

  // Producer form
  "form.about_farm": "Sobre sua lavoura",
  "form.tell_about": "Conte sobre",
  "form.instructions": "Informe o que plantou nas 2 últimas safras para recomendações personalizadas.",
  "form.season": "Safra",
  "form.summer": "Verão",
  "form.safrinha": "Safrinha",
  "form.winter": "Inverno",
  "form.summer_result": "Resultado do verão",
  "form.main_problem": "Maior problema",
  "form.soil_compacted": "O solo está compactado?",
  "form.soil_compacted_hint": "Se a água empoça ou a raiz não desce, pode estar compactado. Isso muda a recomendação de cobertura.",
  "form.required": "Obrigatório",
  "form.fill_all": "Preencha todos os campos antes de continuar.",
  "form.view_report": "Ver meu relatório",
  "form.select": "Selecione",

  // Summer crops
  "crop.soja": "Soja",
  "crop.milho": "Milho",
  "crop.feijao": "Feijão",
  "crop.outro": "Outro",
  "crop.nenhum": "Nenhum",

  // Safrinha crops
  "crop.soja_safrinha": "Soja safrinha (ciclo curto)",
  "crop.milho_safrinha": "Milho safrinha",
  "crop.sorgo": "Sorgo",
  "crop.girassol": "Girassol",
  "crop.milheto": "Milheto (cobertura)",
  "crop.brachiaria": "Braquiária (cobertura)",
  "crop.crotalaria": "Crotalária (adubo verde)",
  "crop.pousio_safrinha": "Não plantou safrinha",

  // Winter crops
  "crop.pousio": "Pousio (não plantou nada)",
  "crop.trigo": "Trigo (renda)",
  "crop.aveia_preta": "Aveia-preta (cobertura)",
  "crop.aveia_branca": "Aveia-branca (grão)",
  "crop.centeio": "Centeio",
  "crop.canola": "Canola (renda)",
  "crop.ervilhaca": "Ervilhaca (fixa N)",
  "crop.nabo_forrageiro": "Nabo forrageiro",
  "crop.azevem": "Azevém (pastagem)",
  "crop.aveia_ervilhaca": "Aveia + Ervilhaca (mix)",
  "crop.centeio_nabo": "Centeio + Nabo (mix)",
  "crop.aveia_ervilhaca_nabo": "Triplo mix",

  // Yield results
  "yield.boa": "Boa (acima da média)",
  "yield.normal": "Normal",
  "yield.ruim": "Ruim (abaixo da média)",
  "yield.perda_total": "Perda total",

  // Problems
  "problem.nenhum": "Nenhum problema grave",
  "problem.seca": "Seca / estiagem",
  "problem.chuva_demais": "Excesso de chuva",
  "problem.praga_doenca": "Praga ou doença",
  "problem.nematoides": "Nematóides",
  "problem.solo_compactado": "Solo compactado",
  "problem.geada": "Geada",
  "problem.granizo": "Granizo",

  // Report tabs
  "tab.rotacao": "Rotação",
  "tab.analise": "Análise da Safra",
  "tab.riscos": "Riscos",

  // Report - Clima
  "report.safra": "Safra",
  "report.verdict": "Veredicto da safra",
  "report.temperature": "Temperatura",
  "report.rain": "Chuva",
  "report.productivity": "Produtividade",
  "report.climate_phenomenon": "Fenômeno climático",
  "report.historical_avg": "Média histórica nesse fenômeno",
  "report.seasons_count": "safras",
  "report.risk": "risco",
  "report.analyzing": "Analisando",
  "report.calculating_trend": "Calculando tendência climática...",
  "report.trend_for": "Tendência para",
  "report.estimated": "sc/ha estimado",
  "report.vs_avg": "vs média",
  "report.probable_range": "Faixa provável",
  "report.similar_years": "Anos com clima similar (base do cálculo)",
  "report.trend_based": "Tendência baseada nos últimos 3 anos",
  "report.compared_nasa": "comparados com 44 anos de dados NASA",

  // Report - Rotacao
  "report.your_strategy": "Sua estratégia",
  "report.rotation_for": "Rotação para",
  "report.ai_recommendation": "Recomendação por IA agrônoma baseada em pesquisas da Embrapa",
  "report.data_based": "Baseado em 44 anos de dados climáticos",
  "report.ai_analyzing": "Superinteligência analisando melhores rotações...",
  "report.recommended": "Recomendada",
  "report.years": "anos",
  "report.justification": "Justificativa",
  "report.crops_for_region": "Culturas indicadas para a região:",
  "report.soil_12months": "Ocupação do solo — 12 meses",
  "report.why_each_crop": "Por que cada cultura",

  // Report - AI
  "report.consult_ai": "Consultar agrônomo IA",
  "report.ask_about": "Pergunte sobre manejo, rotação ou clima para",
  "report.placeholder_question": "Ex: Qual a melhor época para plantar aveia-preta?",
  "report.ask": "Perguntar",
  "report.no_answer": "Sem resposta do agrônomo. Tente reformular.",
  "report.error_consult": "Erro ao consultar o agrônomo. Tente novamente.",

  // Report - Riscos
  "report.risk_calendar": "Calendário de riscos detalhado",
  "report.risk_frequency": "Frequência de cada risco por mês nos últimos 44 anos",
  "report.risk_header": "Risco",
  "risk.dry_spell": "Seca longa",
  "risk.heat": "Calor forte",
  "risk.heavy_rain": "Chuvarada",
  "risk.frost": "Geada",
  "risk.rare": "Raro",
  "risk.sometimes": "Às vezes",
  "risk.frequent": "Frequente",
  "risk.almost_every_year": "Quase todo ano",

  // Report - Verdict lines
  "verdict.high_risk": "Safra de risco elevado. Atenção redobrada no manejo.",
  "verdict.moderate_risk": "Risco moderado. Planeje cobertura de inverno e monitore a previsão.",
  "verdict.low_risk": "Risco baixo — boas condições para alta produtividade.",
  "verdict.analyzing": "Dados climáticos em análise para esta safra.",

  // Open map
  "report.open_map": "Abrir mapa",

  // Unavailable city
  "unavailable.not_available": "Ainda não disponível para este município. No momento, apenas",
  "unavailable.is_available": "está liberada com dados completos de satélite.",
  "unavailable.expanding": "Estamos expandindo para mais municípios em breve.",
  "unavailable.search_another": "Buscar outro município",

  // Seasons
  "season.summer": "Verão",
  "season.safrinha": "Safrinha",
  "season.winter": "Inverno",
  "season.winter_late": "Pós-colheita inverno",
  "season.winter_mix": "Inverno consórcio",

  // Footer
  "footer.description": "Inteligência agrícola baseada em 44 anos de dados da NASA para ajudar produtores a tomar decisões melhores sobre rotação de culturas e manejo do solo.",
  "footer.platform": "Plataforma",
  "footer.inicio": "Início",
  "footer.interactive_map": "Mapa interativo",
  "footer.data_sources": "Fontes de dados",
  "footer.about": "Sobre",
  "footer.open_data": "Dados abertos e gratuitos",
  "footer.satellite_data": "Dados de satélites públicos. Uso educacional e agrícola.",
  "footer.tagline": "Stella Root — NASA Space Apps 2026",
  "footer.cruz_alta": "Cruz Alta, Rio Grande do Sul",

  // Map
  "map.layers": "Camadas",
  "map.reset_view": "Resetar vista",
  "map.fullscreen": "Tela cheia",
  "map.exit_fullscreen": "Sair da tela cheia",
  "map.no_data": "Sem dados (rode o script GEE)",
  "map.monthly": "Mensal",
  "map.yearly": "Anual",
  "map.point_data": "Dados do ponto",
  "map.latitude": "Latitude",
  "map.longitude": "Longitude",
  "map.elevation": "Elevação",
  "map.est_max_temp": "Temp. máx est.",
  "map.layer_relevo": "Relevo",
  "map.layer_temp": "Temperatura",
  "map.layer_precip": "Precipitação",
  "map.layer_soil": "Umidade do Solo",
  "map.layer_landuse": "Uso do Solo",
  "map.dry": "Seco",
  "map.rainy": "Chuvoso",
  "map.wet": "Úmido",
  "map.cold": "Frio",
  "map.hot": "Quente",
  "map.surface_temp": "Temperatura de superfície (LST)",
  "map.estimated_temp": "Temperatura máx. estimada",
  "map.images": "imagens",
  "map.resolution": "resolução",
  "map.municipality_of": "Município de",
  "map.avg_elev": "Elev. média",
  "map.topo_points": "pontos topográficos",
  "map.click_info": "Clique no mapa para ver dados do ponto. SRTM (elevação) | MODIS LST (temperatura) | Sentinel-2 (NDVI) | GPM (precipitação) | SMAP (umidade) | MapBiomas (uso do solo) | NASA ECOSTRESS (LST 70m)",

  // Map land use
  "map.lu_soja": "Soja",
  "map.lu_urbano": "Urbano/Outros",
  "map.lu_floresta": "Floresta",
  "map.lu_outras": "Outras lavouras",
  "map.lu_campo": "Campo nativo",
  "map.lu_agua": "Água",
  "map.lu_silvicultura": "Silvicultura",
  "map.lu_pastagem": "Pastagem",
  "map.lu_perene": "Lavoura perene",
  "map.lu_agri_geral": "Agricultura geral",

  // Chat
  "chat.open": "Abrir chat com agrônomo",
  "chat.ai_agronomist": "Agrônomo IA",
  "chat.previous": "Conversas anteriores",
  "chat.new": "Nova conversa",
  "chat.close": "Fechar",
  "chat.recent": "Conversas recentes",
  "chat.no_conversations": "Nenhuma conversa ainda.",
  "chat.no_title": "Sem título",
  "chat.virtual": "Agrônomo virtual",
  "chat.ask_about": "Pergunte sobre rotação de culturas, cobertura de solo, clima ou qualquer decisão agrícola para sua propriedade.",
  "chat.placeholder": "Pergunte ao agrônomo...",
  "chat.send": "Enviar mensagem",
  "chat.error_connect": "Erro ao conectar. Tente novamente.",
  "chat.error_prefix": "Erro: ",

  // ENSO
  "enso.el_nino": "El Niño",
  "enso.la_nina": "La Niña",
  "enso.neutral": "Ano Neutro",
  "enso.strong": "Forte",
  "enso.weak": "Fraco",
  "enso.moderate": "Moderado",
};

const en: Record<string, string> = {
  // Navigation
  "nav.inicio": "Home",
  "nav.mapa": "Map",
  "nav.fechar_menu": "Close menu",
  "nav.abrir_menu": "Open menu",

  // Hero
  "hero.title_line1": "Adapt your farm",
  "hero.title_line2": "with NASA data",
  "hero.select_city": "Select your municipality",
  "hero.satellites": "Satellite Partners",

  // Producer form
  "form.about_farm": "About your farm",
  "form.tell_about": "Tell us about",
  "form.instructions": "Enter what you planted in the last 2 seasons for personalized recommendations.",
  "form.season": "Season",
  "form.summer": "Summer",
  "form.safrinha": "Second crop",
  "form.winter": "Winter",
  "form.summer_result": "Summer result",
  "form.main_problem": "Main problem",
  "form.soil_compacted": "Is the soil compacted?",
  "form.soil_compacted_hint": "If water pools or roots can't grow deep, it may be compacted. This changes cover crop recommendations.",
  "form.required": "Required",
  "form.fill_all": "Fill in all fields before continuing.",
  "form.view_report": "View my report",
  "form.select": "Select",

  // Summer crops
  "crop.soja": "Soybean",
  "crop.milho": "Corn",
  "crop.feijao": "Bean",
  "crop.outro": "Other",
  "crop.nenhum": "None",

  // Safrinha crops
  "crop.soja_safrinha": "Soybean second crop (short cycle)",
  "crop.milho_safrinha": "Corn second crop",
  "crop.sorgo": "Sorghum",
  "crop.girassol": "Sunflower",
  "crop.milheto": "Pearl millet (cover)",
  "crop.brachiaria": "Brachiaria (cover)",
  "crop.crotalaria": "Sunn hemp (green manure)",
  "crop.pousio_safrinha": "No second crop planted",

  // Winter crops
  "crop.pousio": "Fallow (nothing planted)",
  "crop.trigo": "Wheat (cash crop)",
  "crop.aveia_preta": "Black oat (cover crop)",
  "crop.aveia_branca": "White oat (grain)",
  "crop.centeio": "Rye",
  "crop.canola": "Canola (cash crop)",
  "crop.ervilhaca": "Vetch (N-fixing)",
  "crop.nabo_forrageiro": "Forage radish",
  "crop.azevem": "Ryegrass (pasture)",
  "crop.aveia_ervilhaca": "Oat + Vetch (mix)",
  "crop.centeio_nabo": "Rye + Radish (mix)",
  "crop.aveia_ervilhaca_nabo": "Triple mix",

  // Yield results
  "yield.boa": "Good (above average)",
  "yield.normal": "Normal",
  "yield.ruim": "Poor (below average)",
  "yield.perda_total": "Total loss",

  // Problems
  "problem.nenhum": "No major problems",
  "problem.seca": "Drought / dry spell",
  "problem.chuva_demais": "Excess rainfall",
  "problem.praga_doenca": "Pest or disease",
  "problem.nematoides": "Nematodes",
  "problem.solo_compactado": "Compacted soil",
  "problem.geada": "Frost",
  "problem.granizo": "Hail",

  // Report tabs
  "tab.rotacao": "Rotation",
  "tab.analise": "Season Analysis",
  "tab.riscos": "Risks",

  // Report - Clima
  "report.safra": "Season",
  "report.verdict": "Season verdict",
  "report.temperature": "Temperature",
  "report.rain": "Rainfall",
  "report.productivity": "Yield",
  "report.climate_phenomenon": "Climate phenomenon",
  "report.historical_avg": "Historical average for this phenomenon",
  "report.seasons_count": "seasons",
  "report.risk": "risk",
  "report.analyzing": "Analyzing",
  "report.calculating_trend": "Calculating climate trend...",
  "report.trend_for": "Trend for",
  "report.estimated": "bu/ac estimated",
  "report.vs_avg": "vs average",
  "report.probable_range": "Probable range",
  "report.similar_years": "Years with similar climate (calculation basis)",
  "report.trend_based": "Trend based on the last 3 years",
  "report.compared_nasa": "compared with 44 years of NASA data",

  // Report - Rotacao
  "report.your_strategy": "Your strategy",
  "report.rotation_for": "Rotation for",
  "report.ai_recommendation": "AI agronomist recommendation based on Embrapa research",
  "report.data_based": "Based on 44 years of climate data",
  "report.ai_analyzing": "AI analyzing best rotations...",
  "report.recommended": "Recommended",
  "report.years": "years",
  "report.justification": "Justification",
  "report.crops_for_region": "Crops suited for the region:",
  "report.soil_12months": "Soil coverage — 12 months",
  "report.why_each_crop": "Why each crop",

  // Report - AI
  "report.consult_ai": "Consult AI agronomist",
  "report.ask_about": "Ask about management, rotation or climate for",
  "report.placeholder_question": "E.g.: What is the best time to plant black oat?",
  "report.ask": "Ask",
  "report.no_answer": "No response from the agronomist. Try rephrasing.",
  "report.error_consult": "Error consulting the agronomist. Try again.",

  // Report - Riscos
  "report.risk_calendar": "Detailed risk calendar",
  "report.risk_frequency": "Frequency of each risk per month over the last 44 years",
  "report.risk_header": "Risk",
  "risk.dry_spell": "Long drought",
  "risk.heat": "Extreme heat",
  "risk.heavy_rain": "Heavy rain",
  "risk.frost": "Frost",
  "risk.rare": "Rare",
  "risk.sometimes": "Sometimes",
  "risk.frequent": "Frequent",
  "risk.almost_every_year": "Almost every year",

  // Report - Verdict lines
  "verdict.high_risk": "High-risk season. Extra care in crop management required.",
  "verdict.moderate_risk": "Moderate risk. Plan winter cover crops and monitor forecasts.",
  "verdict.low_risk": "Low risk — good conditions for high yield.",
  "verdict.analyzing": "Climate data under analysis for this season.",

  // Open map
  "report.open_map": "Open map",

  // Unavailable city
  "unavailable.not_available": "Not yet available for this municipality. Currently, only",
  "unavailable.is_available": "is available with complete satellite data.",
  "unavailable.expanding": "We are expanding to more municipalities soon.",
  "unavailable.search_another": "Search another municipality",

  // Seasons
  "season.summer": "Summer",
  "season.safrinha": "Second crop",
  "season.winter": "Winter",
  "season.winter_late": "Post-harvest winter",
  "season.winter_mix": "Winter intercrop",

  // Footer
  "footer.description": "Agricultural intelligence based on 44 years of NASA data to help farmers make better decisions on crop rotation and soil management.",
  "footer.platform": "Platform",
  "footer.inicio": "Home",
  "footer.interactive_map": "Interactive map",
  "footer.data_sources": "Data sources",
  "footer.about": "About",
  "footer.open_data": "Open and free data",
  "footer.satellite_data": "Public satellite data. Educational and agricultural use.",
  "footer.tagline": "Stella Root — NASA Space Apps 2026",
  "footer.cruz_alta": "Cruz Alta, Rio Grande do Sul",

  // Map
  "map.layers": "Layers",
  "map.reset_view": "Reset view",
  "map.fullscreen": "Fullscreen",
  "map.exit_fullscreen": "Exit fullscreen",
  "map.no_data": "No data (run the GEE script)",
  "map.monthly": "Monthly",
  "map.yearly": "Yearly",
  "map.point_data": "Point data",
  "map.latitude": "Latitude",
  "map.longitude": "Longitude",
  "map.elevation": "Elevation",
  "map.est_max_temp": "Est. max temp.",
  "map.layer_relevo": "Elevation",
  "map.layer_temp": "Temperature",
  "map.layer_precip": "Precipitation",
  "map.layer_soil": "Soil Moisture",
  "map.layer_landuse": "Land Use",
  "map.dry": "Dry",
  "map.rainy": "Rainy",
  "map.wet": "Wet",
  "map.cold": "Cold",
  "map.hot": "Hot",
  "map.surface_temp": "Surface temperature (LST)",
  "map.estimated_temp": "Estimated max. temperature",
  "map.images": "images",
  "map.resolution": "resolution",
  "map.municipality_of": "Municipality of",
  "map.avg_elev": "Avg. elev.",
  "map.topo_points": "topographic points",
  "map.click_info": "Click on the map to see point data. SRTM (elevation) | MODIS LST (temperature) | Sentinel-2 (NDVI) | GPM (precipitation) | SMAP (moisture) | MapBiomas (land use) | NASA ECOSTRESS (LST 70m)",

  // Map land use
  "map.lu_soja": "Soybean",
  "map.lu_urbano": "Urban/Other",
  "map.lu_floresta": "Forest",
  "map.lu_outras": "Other crops",
  "map.lu_campo": "Native grassland",
  "map.lu_agua": "Water",
  "map.lu_silvicultura": "Forestry",
  "map.lu_pastagem": "Pasture",
  "map.lu_perene": "Perennial crop",
  "map.lu_agri_geral": "General agriculture",

  // Chat
  "chat.open": "Open chat with agronomist",
  "chat.ai_agronomist": "AI Agronomist",
  "chat.previous": "Previous conversations",
  "chat.new": "New conversation",
  "chat.close": "Close",
  "chat.recent": "Recent conversations",
  "chat.no_conversations": "No conversations yet.",
  "chat.no_title": "No title",
  "chat.virtual": "Virtual agronomist",
  "chat.ask_about": "Ask about crop rotation, cover crops, climate or any farming decision for your property.",
  "chat.placeholder": "Ask the agronomist...",
  "chat.send": "Send message",
  "chat.error_connect": "Connection error. Try again.",
  "chat.error_prefix": "Error: ",

  // ENSO
  "enso.el_nino": "El Niño",
  "enso.la_nina": "La Niña",
  "enso.neutral": "Neutral Year",
  "enso.strong": "Strong",
  "enso.weak": "Weak",
  "enso.moderate": "Moderate",
};

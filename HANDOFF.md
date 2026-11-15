# Field Shift — Handoff para proxima sessao

## Projeto
NASA Space Apps Challenge 2026 — "Field Shift: Adapting Farms with NASA Data"
Ferramenta de decisao para rotacao de culturas usando dados NASA.
Foco: Cruz Alta-RS (lat -28.6033, lon -53.6733). Prazo: 36 horas.

## Equipe
- Luis (design), Joao (dados), James (dados), Victor (analise), Otavio (analise), Kaua (dev/agronomo/estrategia)
- JARVIS = motor de dev do Kaua

## Stack
Next.js 15 + TypeScript + Tailwind CSS. Deploy Vercel. Dados pre-processados em JSON (static/SSG).

## Dados prontos em app/web/data/
- `site.json` — perfil climatico Cruz Alta (q2: riscos mensais 12 meses, q6: correlacoes detrended)
- `crops.json` — 10 culturas com atributos agronomicos completos
- `rotations.json` — 3 estrategias comparadas (baseline/conservadora/adaptativa) com scores 6 dimensoes, evidencia NASA, riscos, beneficios
- `soil.json` — perfil de solo SoilGrids (argila franca, pH 5.2, SOC 43g/kg; CEC 23.3 é **estimativa de modelo** a 250 m: o perfil de laboratório do IBGE em Cruz Alta mediu 6,15 em 0–20 cm, e quem decide é a análise de solo)

## Dados cientificos em app/science/
- `power_cruzalta.json` — NASA POWER diario 1981-2025 (PRECTOTCORR, T2M_MAX, T2M_MIN), 16.436 dias
- `safras_cruzalta.csv` — 44 safras (1982-2025): chuva nov-mar, dias quentes, veranicos
- `ibge_soja_cruzalta.csv` — produtividade soja IBGE 1974-2025
- `chuva_x_produtividade.csv` — merge clima x produtividade
- `soilgrids_cruzalta.json` — dados brutos SoilGrids
- `inmet_daily_cruzalta.csv` — PENDENTE (download INMET em background, 8/19 anos concluidos)

## Scripts em app/science/
01-08, todos com header "SI-assisted". 07 precisa rodar de novo quando INMET terminar.

## O que construir (7 telas)
1. **Landing** — pitch, o que e, por que importa
2. **Diagnostico Climatico** — calendario riscos 12 meses, tendencias 40 anos, comparativo decadas
3. **Vulnerabilidades** — meses solo exposto, estresse termico, veranicos crescentes
4. **Perfil do Solo** — tipo, pH, carbono, textura, declividade (SoilGrids + SRTM)
5. **Rotacoes Comparadas** — 3 estrategias lado a lado, radar chart 6 dimensoes, evidencia
6. **Evidencia Cientifica** — correlacoes, validacao POWER vs estacao, metodologia
7. **Sobre** — equipe, fontes NASA, disclaimer

## Dados NASA usados
- NASA POWER (clima 44 anos) — JA TEMOS
- MODIS MOD13Q1 (NDVI/vegetacao) — FALTA (precisa Earth Engine ou download direto)
- SRTM (elevacao) — FALTA
- SMAP (umidade do solo satelite) — OPCIONAL
- GPM (precipitacao satelite) — OPCIONAL (POWER ja cobre)

## Achados cientificos chave (para a narrativa)
> Corrigido em 15/11 pela auditoria da equipe (`FieldShift-SpaceApp/fieldshift-hq`, `docs/research/numeros-app-kaua.md` e `docs/research/cruzamento-fontes/`). Use estes valores; os antigos estão riscados para a IA não repetir.

- Correlação chuva dez–fev × produtividade sem tendência: r = 0,63 (reproduz no POWER; 0,58 no pluviômetro ANA 2853015). Leitura correta: a chuva explica **cerca de 40%** da variação, não "7 em 10".
- Tendência: +38 kg/ha/ano de ganho tecnológico; 28,6 → 44,5 sc/ha (+56%). Confere no IBGE PAM.
- ~~+36% dias quentes~~: **não usar.** O aumento vem só de 2019–2025, quando o POWER se descola da estação INMET; 2006–2018 teve menos dias quentes que 1982–2001.
- 5 piores safras: todas combinam pouca chuva + calor extremo (texto original, não reconferido pela auditoria).
- ~~Solo exposto 5–6 meses (pousio inverno)~~: **errado.** O satélite (NASA HLS, 2020–2025) mostra pousio de no máximo 0,6% da lavoura; o inverno é verde. Solo nu provável no início de novembro caiu de 5,7% (1984–94) para 0,3% hoje (Landsat): é palha, não solo nu.
- ~~Geada em 76–80% dos invernos~~: **dizer a definição.** POWER, Tmin ≤ 2 °C (pelo menos 1 dia no mês): jun 80%, jul 76%, ago 58%. Estação INMET A853, Tmin ≤ 0 °C (2008–2025): jun 50%, jul 61%, ago 39%.
- Chuva forte (≥ 50 mm/dia): o POWER subestima; no pluviômetro ANA 2853015 aparece em 34–63% dos anos de abr a set.
- O que acompanha a quebra do **trigo** é o número de dias com chuva na primavera (set–nov): r ≈ −0,46 na estação INMET e no pluviômetro ANA; El Niño quebra o trigo em 53% das safras municipais, contra 3,5% na La Niña (fase pelo ONI de jun–ago).

## INMET download em background
Task ID: bu8s8sxfa. Concluidos: 2007-2015 + 2020 (10 zips). Faltam ~9 anos.
Quando terminar: rodar `python3 -I 06_download_inmet.py` (se nao terminou) e depois `python3 -I 07_compare_power_inmet.py` para preencher power_vs_station no site.json.

## Proxima acao imediata
Scaffold Next.js no diretorio app/web/ e comecar a construir as paginas usando os JSONs de dados.

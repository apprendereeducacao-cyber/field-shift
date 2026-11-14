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
- `soil.json` — perfil de solo SoilGrids (argila franca, pH 5.2, SOC 43g/kg, CEC 23.3)

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
- Correlacao chuva dez-fev vs produtividade detrended: r=0.63
- Tendencia: +38 kg/ha/ano de ganho tecnologico
- Produtividade subiu 56% (28.6→44.5 sc/ha) apesar de clima pior (+36% dias quentes)
- 5 piores safras: todas combinam pouca chuva + calor extremo
- Solo exposto 5-6 meses no sistema atual (pousio inverno)
- Geada em 76-80% dos invernos — favorece culturas tolerantes

## INMET download em background
Task ID: bu8s8sxfa. Concluidos: 2007-2015 + 2020 (10 zips). Faltam ~9 anos.
Quando terminar: rodar `python3 -I 06_download_inmet.py` (se nao terminou) e depois `python3 -I 07_compare_power_inmet.py` para preencher power_vs_station no site.json.

## Proxima acao imediata
Scaffold Next.js no diretorio app/web/ e comecar a construir as paginas usando os JSONs de dados.

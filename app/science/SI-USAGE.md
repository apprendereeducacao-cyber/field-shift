# SI-USAGE — Shield Shift / Science Module

## 2026-11-14 — Climate x Soy Yield Analysis for Cruz Alta-RS

### What was done
1. **NASA POWER download** — Daily PRECTOTCORR, T2M_MAX, T2M_MIN for lat -28.6033, lon -53.6733 (Cruz Alta-RS), 1981-01-01 to 2025-12-31. Split into two API calls (1981-2002, 2003-2025) due to API range limits. Saved as `power_cruzalta.json` (16,436 days).
2. **Season metrics** — For each soy season (Nov 1 to Mar 31, labeled by harvest year 1982-2025): total rainfall (mm), days with Tmax >= 32C, longest dry streak (< 1mm) Dec-Feb. Saved as `safras_cruzalta.csv` (44 seasons).
3. **IBGE SIDRA download** — Table 1612, municipality 4306106 (Cruz Alta-RS), variable 112 (rendimento medio kg/ha), product 2713 (soja em grao). Confirmed municipality and product in API response. Saved as `ibge_soja_cruzalta.csv` (52 years, 1974-2025).
4. **Merge and analysis** — Matched 44 seasons (1982-2025) by harvest year. Saved as `chuva_x_produtividade.csv`. Computed Pearson correlations, identified worst seasons, compared periods.

### Data sources
- NASA POWER API: https://power.larc.nasa.gov/api/temporal/daily/point
- IBGE SIDRA API: https://apisidra.ibge.gov.br/values/t/1612/n6/4306106/v/112/p/all/c81/2713

### Files created
- `01_download_nasa.py` — NASA POWER download script
- `02_safras.py` — Season metric computation
- `03_download_ibge.py` — IBGE yield download script
- `04_merge_and_analyze.py` — Merge and statistical analysis
- `power_cruzalta.json` — Raw NASA daily data
- `safras_cruzalta.csv` — Season climate metrics
- `ibge_soja_cruzalta.csv` — IBGE soy yield by year
- `chuva_x_produtividade.csv` — Merged dataset

### Key findings
- Pearson r (chuva vs produtividade): 0.401
- Pearson r (veranico vs produtividade): -0.136
- Pearson r (dias quentes vs produtividade): -0.377
- Produtividade media subiu de 28.6 sc/ha (1982-2001) para 44.5 sc/ha (2006-2025) apesar de mais dias quentes

## 2026-11-14 — Q2 Monthly Risk Fractions + Q6 Rainfall Windows

### What was done
5. **Q2 monthly risks** — For each calendar month (1981-2025, 45 years), computed fraction of years with: dry_spell (10+ consecutive days <1mm), heat (5+ days Tmax>=32C), heavy_rain (1+ day >=50mm), frost (1+ day Tmin<=2C). Saved to site.json q2.
6. **INMET station download** — Downloading hourly data from INMET portal (station A853, Cruz Alta, automatic, since 2007). ZIP files per year from https://portal.inmet.gov.br/uploads/dadoshistoricos/. IN PROGRESS.
7. **Q6 detrended yield vs rainfall windows** — Removed linear trend (38.1 kg/ha/year) from IBGE yield. Correlated residuals with POWER rainfall in 5 windows. Saved to site.json q6.windows.
8. **Q6 POWER vs station** — Pending INMET download completion. Will compare season totals and compute bias.

### New files
- `05_q2_monthly_risks.py` — Monthly risk fraction computation
- `06_download_inmet.py` — INMET station data download + daily aggregation
- `07_compare_power_inmet.py` — POWER vs INMET comparison + detrended correlations

### Q6 key findings (B2 — detrended yield vs rainfall)
- nov-mar: r = 0.629 (strongest window)
- dez-fev: r = 0.630 (essentially same as nov-mar)
- jan-fev: r = 0.519
- jan: r = 0.424
- fev: r = 0.325
- Conclusion: Dec-Feb is the critical rainfall window for soy yield in Cruz Alta

### Etapa C — BLOCKED
- Pasta sensoriamento-remoto-gis not found on this machine
- Cannot run Earth Engine analysis (q1, q4) without lib/gee_helpers.py and .secrets/ee-key.json

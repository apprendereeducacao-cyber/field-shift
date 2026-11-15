# Field Shift — Google Earth Engine Tile Scripts

## Scripts disponiveis

| Script | Dataset | Resolucao | O que gera |
|--------|---------|-----------|------------|
| `sentinel2-ndvi-tiles.js` | Sentinel-2 L2A | 10m | 12 tiles NDVI mensais |
| `srtm-elevation-tiles.js` | USGS SRTM | 30m | Elevacao + declividade + hillshade |
| `modis-lst-tiles.js` | MODIS MOD11A2 | 1km | 12 tiles temperatura superficie + anual |
| `gpm-precipitation-tiles.js` | GPM IMERG v07 | 10km | 12 tiles precipitacao mensal |
| `smap-soil-moisture-tiles.js` | SMAP SPL4 | 9km | 12 tiles umidade solo mensal |
| `mapbiomas-landuse-tiles.js` | MapBiomas Col. 9 | 30m | Uso do solo 1990-2023 (7 anos) |

## Como usar

1. Abra https://code.earthengine.google.com
2. Certifique-se de estar no projeto `apprendere-educacao`
3. Cole o conteudo do script `.js` no editor
4. Clique "Run"
5. Copie as tile URLs do console output
6. Cole no `update-map-tiles.mjs` (ou `update-ndvi-tiles.mjs` para NDVI)
7. Execute: `node scripts/gee/update-map-tiles.mjs`

## Area coberta

Todos os scripts usam o mesmo bounding box:
- `[-53.85, -28.75, -53.50, -28.45]`
- Cobre todo o municipio de Cruz Alta-RS (~35km x 33km)

## Tabela Supabase

O `update-map-tiles.mjs` salva na tabela `map_tiles` com campos:
- `site_id`, `dataset`, `type`, `key`, `values` (jsonb com tile_url + stats)

Para o NDVI continua na tabela `ndvi_data` existente via `update-ndvi-tiles.mjs`.

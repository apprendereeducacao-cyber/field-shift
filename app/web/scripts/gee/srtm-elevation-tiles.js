// =============================================================
// Field Shift — SRTM Elevation Tile Generator for Cruz Alta
// =============================================================
// Run this in Google Earth Engine Code Editor:
//   https://code.earthengine.google.com
//
// Project: apprendere-educacao
//
// Generates a colored elevation tile from SRTM 30m
// covering the municipality of Cruz Alta-RS.
//
// After running, copy the tile URL and save to Supabase.
// =============================================================

var cruzAlta = ee.Geometry.Rectangle([-53.85, -28.75, -53.50, -28.45]);

var srtm = ee.Image('USGS/SRTMGL1_003').clip(cruzAlta);
var elevation = srtm.select('elevation');

// Elevation palette: green (low) -> yellow -> orange -> red (high)
var elevPalette = [
  '#1B5E20', '#2E7D32', '#388E3C', '#43A047', '#4CAF50',
  '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9',
  '#FFF9C4', '#FFF176', '#FFEE58', '#FDD835',
  '#FFB300', '#FFA000', '#FF8F00',
  '#F57C00', '#EF6C00', '#E65100', '#BF360C'
];

var visParams = {
  min: 300,
  max: 550,
  palette: elevPalette
};

// Stats
var stats = elevation.reduceRegion({
  reducer: ee.Reducer.minMax().combine(ee.Reducer.mean(), '', true),
  geometry: cruzAlta,
  scale: 30,
  maxPixels: 1e9
});

print('Elevation stats:', stats);

// Generate tile
var mapId = elevation.getMap(visParams);
Map.addLayer(elevation, visParams, 'Elevacao SRTM 30m');
Map.centerObject(cruzAlta, 12);

print('=== SRTM ELEVATION TILE ===');
print('Tile URL:', mapId.urlFormat);
print('Min elevation:', stats.get('elevation_min'));
print('Max elevation:', stats.get('elevation_max'));
print('Mean elevation:', stats.get('elevation_mean'));

// Also generate slope
var slope = ee.Terrain.slope(elevation);
var slopeVis = {
  min: 0,
  max: 30,
  palette: ['#1a9850', '#91cf60', '#d9ef8b', '#fee08b', '#fc8d59', '#d73027']
};

var slopeMapId = slope.getMap(slopeVis);
Map.addLayer(slope, slopeVis, 'Declividade (graus)');

print('');
print('=== SLOPE TILE ===');
print('Slope Tile URL:', slopeMapId.urlFormat);

// Hillshade for visual depth
var hillshade = ee.Terrain.hillshade(elevation);
var hillshadeMapId = hillshade.getMap({min: 0, max: 255});
Map.addLayer(hillshade, {min: 0, max: 255}, 'Hillshade');

print('');
print('=== HILLSHADE TILE ===');
print('Hillshade Tile URL:', hillshadeMapId.urlFormat);

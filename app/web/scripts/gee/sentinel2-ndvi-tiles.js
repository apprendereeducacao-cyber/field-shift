// =============================================================
// Field Shift — Sentinel-2 NDVI Tile Generator for Cruz Alta
// =============================================================
// Run this in Google Earth Engine Code Editor:
//   https://code.earthengine.google.com
//
// Project: apprendere-educacao
//
// This script generates 12 monthly NDVI composites (median)
// from Sentinel-2 L2A (10m resolution) for Cruz Alta-RS,
// and prints tile URLs + NDVI means for each month.
//
// After running, copy the printed JSON output and paste it
// into the update-ndvi-tiles.mjs script.
// =============================================================

var cruzAlta = ee.Geometry.Rectangle([-53.85, -28.75, -53.50, -28.45]);

var palette = [
  '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf',
  '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'
];

var visParams = {
  min: 0,
  max: 1,
  palette: palette
};

var monthNames = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function maskS2clouds(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3)  // cloud shadow
    .and(scl.neq(8))     // cloud medium probability
    .and(scl.neq(9))     // cloud high probability
    .and(scl.neq(10))    // thin cirrus
    .and(scl.neq(11));   // snow/ice
  return image.updateMask(mask);
}

function computeNDVI(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
}

var results = [];

for (var m = 1; m <= 12; m++) {
  var filtered = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(cruzAlta)
    .filter(ee.Filter.calendarRange(m, m, 'month'))
    .filter(ee.Filter.calendarRange(2017, 2024, 'year'))
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
    .map(maskS2clouds)
    .map(computeNDVI);

  var monthlyNDVI = filtered.select('NDVI').median().clip(cruzAlta);

  var stats = monthlyNDVI.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: cruzAlta,
    scale: 10,
    maxPixels: 1e9
  });

  var mapId = monthlyNDVI.getMap(visParams);

  Map.addLayer(monthlyNDVI, visParams, monthNames[m - 1] + ' NDVI');

  print('Month ' + m + ' (' + monthNames[m - 1] + '):');
  print('  Tile URL: ' + mapId.urlFormat);
  print('  NDVI Mean:', stats.get('NDVI'));
}

Map.centerObject(cruzAlta, 12);

print('');
print('=== COPY THE OUTPUT BELOW INTO update-ndvi-tiles.mjs ===');
print('After all 12 months finish computing, copy each tile URL');
print('and NDVI mean value into the TILES array in the update script.');

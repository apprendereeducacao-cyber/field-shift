// =============================================================
// Field Shift — SMAP Soil Moisture Tiles
// =============================================================
// Run in GEE Code Editor: https://code.earthengine.google.com
// Project: apprendere-educacao
//
// Generates 12 monthly soil moisture composites from NASA SMAP
// for Cruz Alta-RS.
// =============================================================

var cruzAlta = ee.Geometry.Rectangle([-53.85, -28.75, -53.50, -28.45]);

var palette = [
  '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3',
  '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'
];

var visParams = {
  min: 0.15,
  max: 0.45,
  palette: palette
};

var monthNames = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

for (var m = 1; m <= 12; m++) {
  var filtered = ee.ImageCollection('NASA/SMAP/SPL4SMGP/007')
    .filterBounds(cruzAlta)
    .filter(ee.Filter.calendarRange(m, m, 'month'))
    .filter(ee.Filter.calendarRange(2015, 2024, 'year'));

  var soilMoisture = filtered.select('sm_rootzone')
    .median()
    .clip(cruzAlta);

  var stats = soilMoisture.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: cruzAlta,
    scale: 9000,
    maxPixels: 1e9
  });

  var mapId = soilMoisture.getMap(visParams);
  Map.addLayer(soilMoisture, visParams, monthNames[m - 1] + ' Umidade Solo');

  print('Month ' + m + ' (' + monthNames[m - 1] + '):');
  print('  Tile URL: ' + mapId.urlFormat);
  print('  Soil Moisture Mean:', stats.get('sm_rootzone'));
}

Map.centerObject(cruzAlta, 12);

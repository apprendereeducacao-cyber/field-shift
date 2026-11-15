// =============================================================
// Field Shift — MODIS Land Surface Temperature Tiles
// =============================================================
// Run in GEE Code Editor: https://code.earthengine.google.com
// Project: apprendere-educacao
//
// Generates 12 monthly LST (day) composites from MODIS MOD11A2
// for Cruz Alta-RS. Resolution: 1km resampled.
// =============================================================

var cruzAlta = ee.Geometry.Rectangle([-53.85, -28.75, -53.50, -28.45]);

var palette = [
  '#313695', '#4575b4', '#74add1', '#abd9e9',
  '#e0f3f8', '#ffffbf', '#fee090', '#fdae61',
  '#f46d43', '#d73027', '#a50026'
];

var visParams = {
  min: 10,
  max: 40,
  palette: palette
};

var monthNames = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

for (var m = 1; m <= 12; m++) {
  var filtered = ee.ImageCollection('MODIS/061/MOD11A2')
    .filterBounds(cruzAlta)
    .filter(ee.Filter.calendarRange(m, m, 'month'))
    .filter(ee.Filter.calendarRange(2010, 2024, 'year'));

  // LST_Day_1km is in Kelvin * 0.02 scale factor
  var lstDay = filtered.select('LST_Day_1km')
    .map(function(img) {
      return img.multiply(0.02).subtract(273.15)
        .copyProperties(img, img.propertyNames());
    })
    .median()
    .clip(cruzAlta);

  var stats = lstDay.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: cruzAlta,
    scale: 1000,
    maxPixels: 1e9
  });

  var mapId = lstDay.getMap(visParams);
  Map.addLayer(lstDay, visParams, monthNames[m - 1] + ' LST');

  print('Month ' + m + ' (' + monthNames[m - 1] + '):');
  print('  Tile URL: ' + mapId.urlFormat);
  print('  LST Mean (C):', stats.get('LST_Day_1km'));
}

// Also generate annual average
var annualLst = ee.ImageCollection('MODIS/061/MOD11A2')
  .filterBounds(cruzAlta)
  .filter(ee.Filter.calendarRange(2020, 2024, 'year'))
  .select('LST_Day_1km')
  .map(function(img) {
    return img.multiply(0.02).subtract(273.15)
      .copyProperties(img, img.propertyNames());
  })
  .median()
  .clip(cruzAlta);

var annualMapId = annualLst.getMap(visParams);
print('');
print('=== ANNUAL LST (2020-2024) ===');
print('Tile URL:', annualMapId.urlFormat);

Map.centerObject(cruzAlta, 12);

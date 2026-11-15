// =============================================================
// Field Shift — GPM IMERG Precipitation Tiles
// =============================================================
// Run in GEE Code Editor: https://code.earthengine.google.com
// Project: apprendere-educacao
//
// Generates 12 monthly precipitation composites from GPM IMERG
// for Cruz Alta-RS.
// =============================================================

var cruzAlta = ee.Geometry.Rectangle([-53.85, -28.75, -53.50, -28.45]);

var palette = [
  '#f7fbff', '#deebf7', '#c6dbef', '#9ecae1',
  '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'
];

var visParams = {
  min: 0,
  max: 250,
  palette: palette
};

var monthNames = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

for (var m = 1; m <= 12; m++) {
  // GPM IMERG monthly
  var filtered = ee.ImageCollection('NASA/GPM_L3/IMERG_MONTHLY_V07')
    .filterBounds(cruzAlta)
    .filter(ee.Filter.calendarRange(m, m, 'month'))
    .filter(ee.Filter.calendarRange(2010, 2024, 'year'));

  // precipitation field is in mm/hr, multiply by hours in month for mm/month
  var precip = filtered.select('precipitation')
    .map(function(img) {
      var daysInMonth = ee.Date(img.get('system:time_start')).advance(1, 'month')
        .difference(ee.Date(img.get('system:time_start')), 'day');
      return img.multiply(daysInMonth).multiply(24)
        .copyProperties(img, img.propertyNames());
    })
    .median()
    .clip(cruzAlta);

  var stats = precip.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: cruzAlta,
    scale: 10000,
    maxPixels: 1e9
  });

  var mapId = precip.getMap(visParams);
  Map.addLayer(precip, visParams, monthNames[m - 1] + ' Precipitacao');

  print('Month ' + m + ' (' + monthNames[m - 1] + '):');
  print('  Tile URL: ' + mapId.urlFormat);
  print('  Precip Mean (mm):', stats.get('precipitation'));
}

Map.centerObject(cruzAlta, 12);

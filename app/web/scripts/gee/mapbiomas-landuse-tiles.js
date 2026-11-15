// =============================================================
// Field Shift — MapBiomas Land Use Tiles
// =============================================================
// Run in GEE Code Editor: https://code.earthengine.google.com
// Project: apprendere-educacao
//
// Generates land use classification tiles from MapBiomas
// Collection 9 for Cruz Alta-RS.
// =============================================================

var cruzAlta = ee.Geometry.Rectangle([-53.85, -28.75, -53.50, -28.45]);

// MapBiomas Collection 9
var mapbiomas = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection_90/mapbiomas_collection90_integration_v1');

// Most recent year available
var years = [2023, 2022, 2020, 2015, 2010, 2000, 1990];

// MapBiomas official palette (simplified for main classes in RS)
// See: https://brasil.mapbiomas.org/wp-content/uploads/sites/4/2024/08/Legenda-Colecao-9-ATBD-PT.pdf
var classColors = {
  3:  '#1f8d49',  // Formacao florestal
  4:  '#7dc975',  // Formacao savanica
  11: '#519799',  // Alagado
  12: '#d6bc74',  // Formacao campestre
  15: '#edde8e',  // Pastagem
  18: '#E974ED',  // Agricultura anual
  19: '#C27BA0',  // Lavoura temporaria
  20: '#db7093',  // Cana-de-acucar
  21: '#ffefc3',  // Mosaico agricultura/pastagem
  24: '#aa0000',  // Area urbana
  25: '#0000FF',  // Outra area nao vegetada
  26: '#d5d5e5',  // Corpo dagua
  33: '#ffffff',  // Rio/lago
  39: '#f5b3c8',  // Soja
  40: '#c71585',  // Arroz
  41: '#f54ca9',  // Outras lavouras temporarias
  46: '#e787f8',  // Cafe
  47: '#cca0d4',  // Citrus
  48: '#d082de',  // Outras lavouras perenes
  9:  '#7a5900',  // Silvicultura
};

for (var i = 0; i < years.length; i++) {
  var year = years[i];
  var band = 'classification_' + year;

  // Check if band exists
  var landuse = mapbiomas.select(band).clip(cruzAlta);

  var visParams = {
    min: 0,
    max: 62,
    palette: [
      '#ffffff', '#129912', '#1f4423', '#006400', '#00ff00',
      '#687537', '#76a5af', '#29eee4', '#77a605', '#ad4413',
      '#bbfcac', '#45c2a5', '#b8af4f', '#f1c232', '#ffffb2',
      '#ffd966', '#f6b26b', '#f99f40', '#e974ed', '#d5a6bd',
      '#c27ba0', '#982c9e', '#e787f8', '#cca0d4', '#e075ad',
      '#a64d79', '#aa0000', '#d5d5e5', '#dd497f', '#b2ae7c',
      '#af2a2a', '#8a2be2', '#968c46', '#0000ff', '#4fd3ff',
      '#645617', '#b3cc33', '#f3b4f1', '#4c0073', '#8b0000',
      '#d082de', '#f54ca9', '#d68d8d', '#9065d0', '#c71585',
      '#db7093', '#ffefc3', '#ffffff', '#f5b3c8', '#9c8e21',
      '#ccc68d', '#ffff99', '#005ce6', '#ffffbe', '#d082de',
      '#f54ca9', '#1f8d49', '#7dc975', '#e787f8', '#cca0d4',
      '#f5b3c8', '#00ff00', '#e075ad'
    ]
  };

  var mapId = landuse.getMap(visParams);
  Map.addLayer(landuse, visParams, 'Uso do Solo ' + year);

  print('Year ' + year + ':');
  print('  Tile URL: ' + mapId.urlFormat);
}

Map.centerObject(cruzAlta, 12);

print('');
print('Legenda principal para Cruz Alta:');
print('  39 = Soja (rosa claro)');
print('  18 = Agricultura anual (rosa)');
print('  15 = Pastagem (amarelo claro)');
print('  3  = Floresta (verde escuro)');
print('  12 = Campo nativo (bege)');
print('  9  = Silvicultura (marrom)');
print('  26 = Corpo dagua (cinza)');
print('  24 = Area urbana (vermelho)');

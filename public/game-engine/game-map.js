// game Map Data - ES6 Module
// compact format: 'tileId' or ['tileId', rotation]

export const COMPACT_MAP = [
  // row 0
  ['waterE', ['waterG',270], ['waterK',90], ['waterF',90], ['waterK',90], ['waterD',270], ['waterH',90], ['waterK',90], ['waterG',270], ['waterK',90], ['waterK',90], ['waterF',90], ['waterF',90], ['waterH',90], ['waterP',180]],
  // row 1
  ['waterF', 'grass2.png', ['grass4.png',270], 'grass3.png', ['grass1.png',90], 'c3V', ['grass5.png',180], ['grass4.png',270], 'grass1.png', 'grass1.png', ['grass5.png',270], 'c3B', ['c3E',180], ['c3W',270], ['waterM',180]],
  // row 2
  ['waterF', 'grass1.png', 'c3B', ['grass3.png',270], 'grass1.png', 'c3V', ['grass1.png',90], ['grass3.png',90], ['c3E',180], ['grass3.png',90], ['grass1.png',90], ['c3E',90], ['c3T',270], ['c3M',90], 'waterJ'],
  // row 3
  ['waterF', ['grass3.png',90], ['grass2.png',270], ['grass5.png',90], ['grass4.png',90], ['c3W',180], 'c3W', ['c3N',90], 'c3S', ['c3I',270], 'grass1.png', ['grass5.png',180], 'c3E', ['c3V',180], 'waterG'],
  // row 4
  ['waterM', ['c3V',90], ['c3V',90], ['c3V',90], ['c3D',180], ['c3V',90], 'c3Y', ['c3U',90], 'c3G', 'c3C', ['c3E',270], ['grass5.png',90], ['grass3.png',270], ['c3W',180], 'waterD'],
  // row 5
  [['waterE',270], ['waterF',270], ['waterO',270], ['c3I',180], 'c3T', ['c3E',270], ['c3W',180], ['c3U',90], ['c3S',180], ['c3N',270], ['grass4.png',90], ['grass1.png',90], ['grass5.png',90], ['grass1.png',90], ['waterK',180]],
  // row 6
  [['waterN',180], ['waterG',270], ['waterA',180], 'c3Q', ['c3W',90], ['grass1.png',90], ['grass4.png',270], 'c3N', 'c3S', ['c3E',270], 'grass1.png', ['grass5.png',90], ['grass2.png',270], 'grass5.png', ['waterH',180]],
  // row 7
  ['waterF', ['grass3.png',90], 'c3J', ['c3Q',180], ['c3E',270], ['grass2.png',90], 'grass2.png', ['c3E',180], ['grass3.png',90], ['grass3.png',270], 'grass2.png', ['grass3.png',180], 'c3B', ['grass3.png',180], ['waterF',180]],
  // row 8
  ['waterF', ['grass5.png',180], 'c3V', 'c3E', 'c3A', ['grass2.png',90], ['c3E',90], 'c3C', ['c3N',180], ['grass3.png',90], ['grass5.png',270], 'grass1.png', ['grass1.png',270], 'grass1.png', ['waterK',180]],
  // row 9
  ['waterM', 'grass3.png', ['c3W',180], ['c3V',270], ['c3W',90], ['grass2.png',270], 'grass1.png', 'c3N', ['c3N',270], ['grass2.png',90], ['c3N',90], ['c3N',180], 'grass1.png', 'grass5.png', ['waterF',180]],
  // row 10
  ['waterK', ['grass4.png',90], ['waterO',180], ['waterO',270], ['grass3.png',90], ['grass1.png',90], ['grass2.png',90], ['grass5.png',270], ['grass2.png',270], 'grass4.png', 'c3O', ['c3S',270], ['grass3.png',180], ['grass3.png',270], ['waterH',180]],
  // row 11
  ['waterF', ['grass5.png',90], ['waterF',180], 'waterH', ['grass1.png',270], 'c3B', ['grass5.png',90], ['grass3.png',90], ['grass3.png',90], ['grass1.png',270], ['c3E',90], ['c3N',270], ['grass1.png',90], ['c3E',90], ['waterI',180]],
  // row 12
  ['waterK', 'c3A', ['waterC',180], 'waterO', ['grass4.png',180], ['grass3.png',90], ['grass2.png',90], ['grass5.png',90], ['grass1.png',90], 'c3B', ['grass4.png',270], ['grass1.png',90], 'grass3.png', ['grass2.png',90], 'waterG'],
  // row 13
  ['waterF', ['c3W',180], ['c3W',90], 'grass1.png', 'grass5.png', ['grass1.png',270], ['grass5.png',180], ['grass3.png',90], ['grass3.png',270], ['grass3.png',270], ['grass3.png',180], ['grass4.png',90], ['grass5.png',270], ['grass3.png',90], ['waterH',180]],
  // row 14
  ['waterP', ['waterF',270], ['waterH',270], ['waterF',270], ['waterK',270], ['waterF',270], ['waterF',270], ['waterH',270], ['waterF',270], ['waterF',270], ['waterK',270], ['waterF',270], ['waterK',270], ['waterH',270], 'waterN']
];

// tile definitions for expansion
export const TILE_DEFS = {
  // grass tiles
  'grass1.png': {tile: "Grass 1", file: "grass1.png", folder: "carcassonne_tiles_c3/"},
  'grass2.png': {tile: "Grass 2", file: "grass2.png", folder: "carcassonne_tiles_c3/"},
  'grass3.png': {tile: "Grass 3", file: "grass3.png", folder: "carcassonne_tiles_c3/"},
  'grass4.png': {tile: "Grass 4", file: "grass4.png", folder: "carcassonne_tiles_c3/"},
  'grass5.png': {tile: "Grass 5", file: "grass5.png", folder: "carcassonne_tiles_c3/"},
  
  // c3 tiles
  c3A: {tile: "C3 Tile A", file: "tile_A.png", folder: "carcassonne_tiles_c3/"},
  c3B: {tile: "C3 Tile B", file: "tile_B.png", folder: "carcassonne_tiles_c3/"},
  c3C: {tile: "C3 Tile C", file: "tile_C.png", folder: "carcassonne_tiles_c3/"},
  c3D: {tile: "C3 Tile D", file: "tile_D.png", folder: "carcassonne_tiles_c3/"},
  c3E: {tile: "C3 Tile E", file: "tile_E.png", folder: "carcassonne_tiles_c3/"},
  c3F: {tile: "C3 Tile F", file: "tile_F.png", folder: "carcassonne_tiles_c3/"},
  c3G: {tile: "C3 Tile G", file: "tile_G.png", folder: "carcassonne_tiles_c3/"},
  c3H: {tile: "C3 Tile H", file: "tile_H.png", folder: "carcassonne_tiles_c3/"},
  c3I: {tile: "C3 Tile I", file: "tile_I.png", folder: "carcassonne_tiles_c3/"},
  c3J: {tile: "C3 Tile J", file: "tile_J.png", folder: "carcassonne_tiles_c3/"},
  c3K: {tile: "C3 Tile K", file: "tile_K.png", folder: "carcassonne_tiles_c3/"},
  c3M: {tile: "C3 Tile M", file: "tile_M.png", folder: "carcassonne_tiles_c3/"},
  c3N: {tile: "C3 Tile N", file: "tile_N.png", folder: "carcassonne_tiles_c3/"},
  c3O: {tile: "C3 Tile O", file: "tile_O.png", folder: "carcassonne_tiles_c3/"},
  c3P: {tile: "C3 Tile P", file: "tile_P.png", folder: "carcassonne_tiles_c3/"},
  c3Q: {tile: "C3 Tile Q", file: "tile_Q.png", folder: "carcassonne_tiles_c3/"},
  c3R: {tile: "C3 Tile R", file: "tile_R.png", folder: "carcassonne_tiles_c3/"},
  c3S: {tile: "C3 Tile S", file: "tile_S.png", folder: "carcassonne_tiles_c3/"},
  c3T: {tile: "C3 Tile T", file: "tile_T.png", folder: "carcassonne_tiles_c3/"},
  c3U: {tile: "C3 Tile U", file: "tile_U.png", folder: "carcassonne_tiles_c3/"},
  c3V: {tile: "C3 Tile V", file: "tile_V.png", folder: "carcassonne_tiles_c3/"},
  c3W: {tile: "C3 Tile W", file: "tile_W.png", folder: "carcassonne_tiles_c3/"},
  c3X: {tile: "C3 Tile X", file: "tile_X.png", folder: "carcassonne_tiles_c3/"},
  c3Y: {tile: "C3 Tile Y", file: "tile_Y.png", folder: "carcassonne_tiles_c3/"},
  
  // water tiles
  waterA: {tile: "Water Tile A", file: "watertile_A.png", folder: "water_tiles/"},
  waterB: {tile: "Water Tile B", file: "watertile_B.png", folder: "water_tiles/"},
  waterC: {tile: "Water Tile C", file: "watertile_C.png", folder: "water_tiles/"},
  waterD: {tile: "Water Tile D", file: "watertile_D.png", folder: "water_tiles/"},
  waterE: {tile: "Water Tile E", file: "watertile_E.png", folder: "water_tiles/"},
  waterF: {tile: "Water Tile F", file: "watertile_F.png", folder: "water_tiles/"},
  waterG: {tile: "Water Tile G", file: "watertile_G.png", folder: "water_tiles/"},
  waterH: {tile: "Water Tile H", file: "watertile_H.png", folder: "water_tiles/"},
  waterI: {tile: "Water Tile I", file: "watertile_I.png", folder: "water_tiles/"},
  waterJ: {tile: "Water Tile J", file: "watertile_J.png", folder: "water_tiles/"},
  waterK: {tile: "Water Tile K", file: "watertile_K.png", folder: "water_tiles/"},
  waterM: {tile: "Water Tile M", file: "watertile_M.png", folder: "water_tiles/"},
  waterN: {tile: "Water Tile N", file: "watertile_N.png", folder: "water_tiles/"},
  waterO: {tile: "Water Tile O", file: "watertile_O.png", folder: "water_tiles/"},
  waterP: {tile: "Water Tile P", file: "watertile_P.png", folder: "water_tiles/"},
};

// alias for backward compatibility
export const MAP = COMPACT_MAP;

// also expose globally for tools that can't use ES6 modules
if (typeof window !== 'undefined') {
  window.COMPACT_MAP = COMPACT_MAP;
  window.TILE_DEFS = TILE_DEFS;
}
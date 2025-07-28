//  map data 
// format: 'tileId' or ['tileId', rotation]

export const COMPACT_MAP = [
  // row 0
  ['g3', 'g1', 'g1', 'g1', 'g1', 'g2', 'g3', 'g3', 'g1', 'g1', ['roadH',90], 'g3', 'g1', 'g3', 'g3'],
  // row 1
  ['monastery', 'g3', 'g3', 'g3', 'g3', 'g1', 'g3', 'g3', 'g2', 'g3', ['roadH',90], 'g3', 'g3', 'g3', 'g3'],
  // row 2
  ['g3', 'g2', 'g3', 'g1', 'g1', 'city3S', 'g3', 'g3', 'g3', ['monasteryW',270], ['roadH',90], 'g2', 'g1', 'g1', 'g1'],
  // row 3
  ['g1', 'g3', 'g3', ['city3N',90], ['cityNE',90], 'city', ['cityN',180], 'g3', ['road7',90], ['roadT2',90], ['roadL',90], 'g3', 'g1', 'g3', 'g3'],
  // row 4
  ['g2', 'g1', 'g3', 'g1', 'g3', 'cityN', 'city', 'cityS', ['roadH',90], 'g3', 'g3', 'g1', 'g3', 'monastery', 'g3'],
  // row 5
  ['g2', 'g1', 'monasteryE', ['roadH',0], 'roadT1', ['roadH',0], 'cityRoadV', ['cityS',90], ['roadH',90], 'g1', 'g3', 'g1', 'g1', 'g3', 'g2'],
  // row 6
  ['g3', 'g2', 'g3', 'g3', 'monasteryN', 'monasteryE', 'road4', ['roadT3',180], ['roadL',90], 'g1', 'g2', 'g3', 'g1', 'city3S', 'g1'],
  // row 7
  ['g3', 'g1', 'g3', 'g1', 'g1', 'g3', ['roadJ',90], 'roadJ', 'g3', 'g1', ['cityAltE',90], 'cityV', ['cityH',90], 'city', ['city3E',180]],
  // row 8
  ['g3', 'monastery', 'g3', ['city3E',90], 'cityE', 'cityS', 'g3', 'g3', 'g3', 'g3', ['cityV',90], 'g1', 'g2', ['city3W',90], 'g3'],
  // row 9
  ['g3', 'city3S', 'g1', ['cityV',90], ['cityH',180], ['cityH',180], 'monastery', 'g1', 'g3', 'g3', ['city3E',270], 'g2', 'g3', 'g1', 'g2'],
  // row 10
  ['g2', ['cityW',90], ['cityH',90], ['cityAltN',0], ['city3W',90], ['cityAltN',90], ['city3E',180], 'monasteryE', ['roadV',90], 'roadL', 'g2', 'g1', 'g3', 'g3', 'g2'],
  // row 11
  [['city3S',270], ['city3S',90], ['road7',90], ['road7',180], ['g1',90], 'monasteryS', 'g2', 'g3', 'g1', ['roadH',90], 'g1', 'monastery', 'g3', 'g1', 'g3'],
  // row 12
  ['g2', 'g3', 'road7', 'roadT3', ['roadH',180], 'roadJ', 'city3S', 'city3S', ['city3N',90], 'cityRoadV', ['roadH',180], ['roadH',180], ['roadH',180], ['roadH',180], ['roadH',180]],
  // row 13
  ['g1', 'g1', 'monastery', ['g3',90], 'g1', ['city3N',90], 'city', 'city', ['citySW',180], ['cityN',270], ['cityAltS',0], ['cityAltS',90], 'g1', 'g1', 'g3'],
  // row 14
  ['g2', 'g1', 'g2', 'g3', 'g3', 'g2', 'city3N', 'city3N', 'g3', 'g2', ['cityAltS',270], 'cityAltN', 'g2', 'g2', 'g1']
];

// tile definitions for expansion
export const TILE_DEFS = {
  // grass tiles
  g1: {tile: "Grass 1", file: "grass1.jpeg"},
  g2: {tile: "Grass 2", file: "grass2.jpeg"},
  g3: {tile: "Grass 3", file: "grass3.jpeg"},
  
  // road tiles
  roadH: {tile: "Road ↔", file: "Road1.png"},
  roadV: {tile: "Road ↕", file: "Road0.png"},
  roadL: {tile: "Road Curve ↓→", file: "RoadCurve0.png"},
  roadJ: {tile: "Road Curve ←↓", file: "RoadCurve1.png"},
  road7: {tile: "Road Curve ↑←", file: "RoadCurve2.png"},
  roadr: {tile: "Road Curve →↑", file: "RoadCurve3.png"},
  roadT1: {tile: "Road T ↑←→", file: "RoadJunctionSmall0.png"},
  roadT2: {tile: "Road T ↑↓→", file: "RoadJunctionSmall1.png"},
  roadT3: {tile: "Road T ←↓→", file: "RoadJunctionSmall2.png"},
  roadT4: {tile: "Road T ↑↓←", file: "RoadJunctionSmall3.png"},
  road4: {tile: "Road Cross +", file: "RoadJunctionLarge0.png"},
  
  // city tiles
  city: {tile: "City Full", file: "CastleCenter0.png"},
  cityN: {tile: "City Edge ↑", file: "CastleEdge0.png"},
  cityE: {tile: "City Edge →", file: "CastleEdge1.png"},
  cityS: {tile: "City Edge ↓", file: "CastleEdge2.png"},
  cityW: {tile: "City Edge ←", file: "CastleEdge3.png"},
  city3N: {tile: "City 3-Way ↑←→", file: "CastleWall0.png"},
  city3E: {tile: "City 3-Way ↑↓→", file: "CastleWall1.png"},
  city3S: {tile: "City 3-Way ←↓→", file: "CastleWall2.png"},
  city3W: {tile: "City 3-Way ↑↓←", file: "CastleWall3.png"},
  cityNE: {tile: "City Corner ↑→", file: "CastleSides0.png"},
  citySW: {tile: "City Corner ↓←", file: "CastleSides1.png"},
  cityH: {tile: "City Opposite ↔", file: "CastleTube1.png"},
  cityV: {tile: "City Opposite ↕", file: "CastleTube0.png"},
  
  // city + Road
  cityRoadV: {tile: "City+Road ↑↓", file: "CastleEdgeRoad0.png"},
  cityRoadH: {tile: "City+Road →←", file: "CastleEdgeRoad1.png"},
  cityRoadV2: {tile: "City+Road ↓↑", file: "CastleEdgeRoad2.png"},
  cityRoadH2: {tile: "City+Road ←→", file: "CastleEdgeRoad3.png"},
  
  // city Edge Alts
  cityAltN: {tile: "City Edge Alt ↑", file: "CastleSidesEdge0.png"},
  cityAltE: {tile: "City Edge Alt →", file: "CastleSidesEdge1.png"},
  cityAltS: {tile: "City Edge Alt ↓", file: "CastleSidesEdge2.png"},
  cityAltW: {tile: "City Edge Alt ←", file: "CastleSidesEdge3.png"},
  
  // monastery
  monastery: {tile: "Monastery", file: "Monastery0.png"},
  monasteryS: {tile: "Monastery + Road ↓", file: "MonasteryRoad0.png"},
  monasteryW: {tile: "Monastery + Road ←", file: "MonasteryRoad1.png"},
  monasteryN: {tile: "Monastery + Road ↑", file: "MonasteryRoad2.png"},
  monasteryE: {tile: "Monastery + Road →", file: "MonasteryRoad3.png"}
};
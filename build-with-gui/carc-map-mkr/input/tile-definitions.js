// Tile definitions for the map maker and game
// This file contains the mapping between tile IDs and their properties

const TILES = {
  // Grass (most common, so short names)
  g1: { name: "Grass 1", file: "grass1.jpeg" },
  g2: { name: "Grass 2", file: "grass2.jpeg" },
  g3: { name: "Grass 3", file: "grass3.jpeg" },
  empty: { name: "Empty (Grey)", file: "Null0.png" },
  
  // Roads
  roadH: { name: "Road ↔", file: "Road1.png" },
  roadV: { name: "Road ↕", file: "Road0.png" },
  roadL: { name: "Road Curve ↓→", file: "RoadCurve0.png" },
  roadJ: { name: "Road Curve ←↓", file: "RoadCurve1.png" },
  road7: { name: "Road Curve ↑←", file: "RoadCurve2.png" },
  roadr: { name: "Road Curve →↑", file: "RoadCurve3.png" },
  roadT1: { name: "Road T ↑←→", file: "RoadJunctionSmall0.png" },
  roadT2: { name: "Road T ↑↓→", file: "RoadJunctionSmall1.png" },
  roadT3: { name: "Road T ←↓→", file: "RoadJunctionSmall2.png" },
  roadT4: { name: "Road T ↑↓←", file: "RoadJunctionSmall3.png" },
  road4: { name: "Road Cross +", file: "RoadJunctionLarge0.png" },
  
  // Cities
  city: { name: "City Full", file: "CastleCenter0.png" },
  cityN: { name: "City Edge ↑", file: "CastleEdge0.png" },
  cityE: { name: "City Edge →", file: "CastleEdge1.png" },
  cityS: { name: "City Edge ↓", file: "CastleEdge2.png" },
  cityW: { name: "City Edge ←", file: "CastleEdge3.png" },
  city3N: { name: "City 3-Way ↑←→", file: "CastleWall0.png" },
  city3E: { name: "City 3-Way ↑↓→", file: "CastleWall1.png" },
  city3S: { name: "City 3-Way ←↓→", file: "CastleWall2.png" },
  city3W: { name: "City 3-Way ↑↓←", file: "CastleWall3.png" },
  cityNE: { name: "City Corner ↑→", file: "CastleSides0.png" },
  citySW: { name: "City Corner ↓←", file: "CastleSides1.png" },
  cityH: { name: "City Opposite ↔", file: "CastleTube1.png" },
  cityV: { name: "City Opposite ↕", file: "CastleTube0.png" },
  
  // City + Road
  cityRoadV: { name: "City+Road ↑↓", file: "CastleEdgeRoad0.png" },
  cityRoadH: { name: "City+Road →←", file: "CastleEdgeRoad1.png" },
  cityRoadV2: { name: "City+Road ↓↑", file: "CastleEdgeRoad2.png" },
  cityRoadH2: { name: "City+Road ←→", file: "CastleEdgeRoad3.png" },
  
  // City Edge Alts
  cityAltN: { name: "City Edge Alt ↑", file: "CastleSidesEdge0.png" },
  cityAltE: { name: "City Edge Alt →", file: "CastleSidesEdge1.png" },
  cityAltS: { name: "City Edge Alt ↓", file: "CastleSidesEdge2.png" },
  cityAltW: { name: "City Edge Alt ←", file: "CastleSidesEdge3.png" },
  
  // Monastery
  monastery: { name: "Monastery", file: "Monastery0.png" },
  monasteryS: { name: "Monastery + Road ↓", file: "MonasteryRoad0.png" },
  monasteryW: { name: "Monastery + Road ←", file: "MonasteryRoad1.png" },
  monasteryN: { name: "Monastery + Road ↑", file: "MonasteryRoad2.png" },
  monasteryE: { name: "Monastery + Road →", file: "MonasteryRoad3.png" }
};
// Tile definitions for Carcassonne map maker
// All available tiles organized by category

const TILE_TYPES = [
    // fields - basic grass and empty tiles
    { name: 'Grass 1', file: 'grass1.jpeg', type: 'field' },
    { name: 'Grass 2', file: 'grass2.jpeg', type: 'field' },
    { name: 'Grass 3', file: 'grass3.jpeg', type: 'field' },
    { name: 'Empty (Grey)', file: 'Null0.png', type: 'field' },
    
    // monasteries - religious buildings with optional roads
    { name: 'Monastery', file: 'Monastery0.png', type: 'monastery' },
    { name: 'Monastery + Road ↓', file: 'MonasteryRoad0.png', type: 'monastery' },
    { name: 'Monastery + Road ←', file: 'MonasteryRoad1.png', type: 'monastery' },
    { name: 'Monastery + Road ↑', file: 'MonasteryRoad2.png', type: 'monastery' },
    { name: 'Monastery + Road →', file: 'MonasteryRoad3.png', type: 'monastery' },
    
    // roads - straight, curved, and junction tiles
    { name: 'Road ↕', file: 'Road0.png', type: 'road' },
    { name: 'Road ↔', file: 'Road1.png', type: 'road' },
    { name: 'Road Curve ↓→', file: 'RoadCurve0.png', type: 'road' },
    { name: 'Road Curve ←↓', file: 'RoadCurve1.png', type: 'road' },
    { name: 'Road Curve ↑←', file: 'RoadCurve2.png', type: 'road' },
    { name: 'Road Curve →↑', file: 'RoadCurve3.png', type: 'road' },
    { name: 'Road T ↑←→', file: 'RoadJunctionSmall0.png', type: 'road' },
    { name: 'Road T ↑↓→', file: 'RoadJunctionSmall1.png', type: 'road' },
    { name: 'Road T ←↓→', file: 'RoadJunctionSmall2.png', type: 'road' },
    { name: 'Road T ↑↓←', file: 'RoadJunctionSmall3.png', type: 'road' },
    { name: 'Road Cross +', file: 'RoadJunctionLarge0.png', type: 'road' },
    
    // cities - castle walls and fortified areas
    { name: 'City Full', file: 'CastleCenter0.png', type: 'city' },
    { name: 'City Edge ↑', file: 'CastleEdge0.png', type: 'city' },
    { name: 'City Edge →', file: 'CastleEdge1.png', type: 'city' },
    { name: 'City Edge ↓', file: 'CastleEdge2.png', type: 'city' },
    { name: 'City Edge ←', file: 'CastleEdge3.png', type: 'city' },
    { name: 'City Corner ↑→', file: 'CastleSides0.png', type: 'city' },
    { name: 'City Corner ↓←', file: 'CastleSides1.png', type: 'city' },
    { name: 'City Opposite ↕', file: 'CastleTube0.png', type: 'city' },
    { name: 'City Opposite ↔', file: 'CastleTube1.png', type: 'city' },
    { name: 'City 3-Way ↑←→', file: 'CastleWall0.png', type: 'city' },
    { name: 'City 3-Way ↑↓→', file: 'CastleWall1.png', type: 'city' },
    { name: 'City 3-Way ←↓→', file: 'CastleWall2.png', type: 'city' },
    { name: 'City 3-Way ↑↓←', file: 'CastleWall3.png', type: 'city' },
    
    // cities with roads - combination tiles
    { name: 'City+Road ↑↓', file: 'CastleEdgeRoad0.png', type: 'city' },
    { name: 'City+Road →←', file: 'CastleEdgeRoad1.png', type: 'city' },
    { name: 'City+Road ↓↑', file: 'CastleEdgeRoad2.png', type: 'city' },
    { name: 'City+Road ←→', file: 'CastleEdgeRoad3.png', type: 'city' },
    
    // city edge alternatives
    { name: 'City Edge Alt ↑', file: 'CastleSidesEdge0.png', type: 'city' },
    { name: 'City Edge Alt →', file: 'CastleSidesEdge1.png', type: 'city' },
    { name: 'City Edge Alt ↓', file: 'CastleSidesEdge2.png', type: 'city' },
    { name: 'City Edge Alt ←', file: 'CastleSidesEdge3.png', type: 'city' }
];

// Tile ID mapping for compact export format
const TILE_ID_MAP = {
    // Grass tiles
    'grass1.jpeg': 'g1',
    'grass2.jpeg': 'g2', 
    'grass3.jpeg': 'g3',
    'Null0.png': 'null',
    
    // Road tiles
    'Road0.png': 'roadV',
    'Road1.png': 'roadH',
    'RoadCurve0.png': 'roadL',
    'RoadCurve1.png': 'roadJ',
    'RoadCurve2.png': 'road7',
    'RoadCurve3.png': 'roadr',
    'RoadJunctionSmall0.png': 'roadT1',
    'RoadJunctionSmall1.png': 'roadT2',
    'RoadJunctionSmall2.png': 'roadT3',
    'RoadJunctionSmall3.png': 'roadT4',
    'RoadJunctionLarge0.png': 'road4',
    
    // City tiles
    'CastleCenter0.png': 'city',
    'CastleEdge0.png': 'cityN',
    'CastleEdge1.png': 'cityE',
    'CastleEdge2.png': 'cityS',
    'CastleEdge3.png': 'cityW',
    'CastleWall0.png': 'city3N',
    'CastleWall1.png': 'city3E',
    'CastleWall2.png': 'city3S',
    'CastleWall3.png': 'city3W',
    'CastleSides0.png': 'cityNE',
    'CastleSides1.png': 'citySW',
    'CastleTube1.png': 'cityH',
    'CastleTube0.png': 'cityV',
    
    // City + Road
    'CastleEdgeRoad0.png': 'cityRoadV',
    'CastleEdgeRoad1.png': 'cityRoadH',
    'CastleEdgeRoad2.png': 'cityRoadV2',
    'CastleEdgeRoad3.png': 'cityRoadH2',
    
    // City Edge Alts
    'CastleSidesEdge0.png': 'cityAltN',
    'CastleSidesEdge1.png': 'cityAltE',
    'CastleSidesEdge2.png': 'cityAltS',
    'CastleSidesEdge3.png': 'cityAltW',
    
    // Monastery
    'Monastery0.png': 'monastery',
    'MonasteryRoad0.png': 'monasteryS',
    'MonasteryRoad1.png': 'monasteryW',
    'MonasteryRoad2.png': 'monasteryN',
    'MonasteryRoad3.png': 'monasteryE'
};
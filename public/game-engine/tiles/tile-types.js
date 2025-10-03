export const TILE_TYPES = {
    CITY_FULL: { edges: ['C', 'C', 'C', 'C'], type: 'city_full', image: 'CastleCenter0.png' },
    CITY_THREE: { edges: ['C', 'C', 'C', 'F'], type: 'city_three', image: 'CastleWall0.png' },
    CITY_TWO_ADJACENT: { edges: ['C', 'C', 'F', 'F'], type: 'city_two_adj', image: 'CastleSides0.png' },
    CITY_TWO_OPPOSITE: { edges: ['C', 'F', 'C', 'F'], type: 'city_two_opp', image: 'CastleTube0.png' },
    CITY_ONE: { edges: ['C', 'F', 'F', 'F'], type: 'city_one', image: 'CastleEdge0.png' },
    CITY_ONE_ROAD: { edges: ['C', 'R', 'R', 'F'], type: 'city_road', image: 'CastleEdge0.png' },
    MONASTERY: { edges: ['F', 'F', 'F', 'F'], type: 'monastery', image: 'Monastery0.png' },
    MONASTERY_ROAD: { edges: ['F', 'F', 'R', 'F'], type: 'monastery_road', image: 'MonasteryRoad0.png' },
    ROAD_STRAIGHT: { edges: ['R', 'F', 'R', 'F'], type: 'road_straight', image: 'Road0.png' },
    ROAD_CURVE: { edges: ['F', 'R', 'R', 'F'], type: 'road_curve', image: 'RoadCurve0.png' },
    ROAD_THREE: { edges: ['R', 'R', 'R', 'F'], type: 'road_three', image: 'RoadJunctionSmall0.png' },
    ROAD_FOUR: { edges: ['R', 'R', 'R', 'R'], type: 'road_four', image: 'RoadJunctionLarge0.png' },
    FIELD: { edges: ['F', 'F', 'F', 'F'], type: 'field', image: 'grass1.jpeg' }
};

export const TILES_TO_LOAD = [
    'grass1.jpeg', 'grass2.jpeg', 'grass3.jpeg', 'CastleCenter0.png', 'CastleEdge0.png', 'CastleEdge1.png', 'CastleEdge2.png', 'CastleEdge3.png',
    'CastleWall0.png', 'CastleWall1.png', 'CastleWall2.png', 'CastleWall3.png',
    'CastleSides0.png', 'CastleSides1.png', 'CastleTube0.png', 'CastleTube1.png',
    'CastleEdgeRoad0.png', 'CastleEdgeRoad1.png', 'CastleEdgeRoad2.png', 'CastleEdgeRoad3.png',
    'CastleSidesEdge0.png', 'CastleSidesEdge1.png', 'CastleSidesEdge2.png', 'CastleSidesEdge3.png',
    'Monastery0.png', 'MonasteryRoad0.png', 'MonasteryRoad1.png', 'MonasteryRoad2.png', 'MonasteryRoad3.png',
    'Road0.png', 'Road1.png', 'RoadCurve0.png', 'RoadCurve1.png', 'RoadCurve2.png', 'RoadCurve3.png',
    'RoadJunctionLarge0.png', 'RoadJunctionSmall0.png', 'RoadJunctionSmall1.png', 'RoadJunctionSmall2.png', 'RoadJunctionSmall3.png',
    'Null0.png'
];
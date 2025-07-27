// Game Engine Configuration
// This file contains all game constants, tile definitions, and project data

// Canvas and tile settings
export const TILE_SIZE = 80;
export const PLAYER_SIZE = 20;
export const GRID_SIZE = 15;

// Tile types with edge connections [top, right, bottom, left]
// C=City, R=Road, F=Field
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

// All tile images to preload
export const TILES_TO_LOAD = [
    'grass1.jpeg', 'grass2.jpeg', 'grass3.jpeg', 
    'CastleCenter0.png', 
    'CastleEdge0.png', 'CastleEdge1.png', 'CastleEdge2.png', 'CastleEdge3.png',
    'CastleWall0.png', 'CastleWall1.png', 'CastleWall2.png', 'CastleWall3.png',
    'CastleSides0.png', 'CastleSides1.png', 
    'CastleTube0.png', 'CastleTube1.png',
    'CastleEdgeRoad0.png', 'CastleEdgeRoad1.png', 'CastleEdgeRoad2.png', 'CastleEdgeRoad3.png',
    'CastleSidesEdge0.png', 'CastleSidesEdge1.png', 'CastleSidesEdge2.png', 'CastleSidesEdge3.png',
    'Monastery0.png', 
    'MonasteryRoad0.png', 'MonasteryRoad1.png', 'MonasteryRoad2.png', 'MonasteryRoad3.png',
    'Road0.png', 'Road1.png', 
    'RoadCurve0.png', 'RoadCurve1.png', 'RoadCurve2.png', 'RoadCurve3.png',
    'RoadJunctionLarge0.png', 
    'RoadJunctionSmall0.png', 'RoadJunctionSmall1.png', 'RoadJunctionSmall2.png', 'RoadJunctionSmall3.png',
    'Null0.png'
];

// Projects/Portfolio items
export const PROJECTS = [
    {
        id: 1,
        name: "MinCoins Calculator",
        desc: "Java Coin Change Algorithm",
        url: "mincoins",
        type: "code",
        x: 2,
        y: 5
    },
    {
        id: 2,
        name: "Pixel Keep",
        desc: "Retro Game Engine",
        url: "https://example.com/project2",
        x: 6,
        y: 4
    },
    {
        id: 3,
        name: "Quantum Monastery",
        desc: "Quantum Computing Simulator",
        url: "https://example.com/project3",
        x: 13,
        y: 7
    },
    {
        id: 4,
        name: "Cyber Citadel",
        desc: "Security Dashboard",
        url: "https://example.com/project4",
        x: 7,
        y: 13
    },
    {
        id: 5,
        name: "AI Abbey",
        desc: "Language Processing Demo",
        url: "https://example.com/project5",
        x: 2,
        y: 13
    },
    {
        id: 6,
        name: "Web3 Fortress",
        desc: "Blockchain Explorer",
        url: "https://example.com/project6",
        x: 1,
        y: 8
    }
];

// Default board layout (using numbers for grass variety)
export const DEFAULT_BOARD_LAYOUT = [
    "123312132113213",
    "231123213221321",
    "312231321332112",
    "123132123113232",
    "231321312221133",
    "132213123312231",
    "321132231123312",
    "213321132231123",
    "132213321132213",
    "321123132321321",
    "213312231132132",
    "132321123213321",
    "321132321321123",
    "123231132213312",
    "231321321132231"
];

// Player starting configuration
export const PLAYER_CONFIG = {
    startX: 7,
    startY: 7,
    speed: 4,
    color: "#ff6b6b"
};
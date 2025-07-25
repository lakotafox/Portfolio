// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game constants
const TILE_SIZE = 80;
const PLAYER_SIZE = 20;
const GRID_SIZE = 15; // 15x15 grid for better layout

// Carcassonne tile types mapped to actual image files
const TILE_TYPES = {
    // Format: [top, right, bottom, left] - C=City, R=Road, F=Field
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
    FIELD: { edges: ['F', 'F', 'F', 'F'], type: 'field', image: 'grass1.jpeg' } // Using grass tile
};

// Preload all tile images
const tileImages = {};
const imageLoadPromises = [];

// Copy more tile images first
const additionalTiles = [
    'CastleEdgeRoad0.png', 'CastleEdgeRoad1.png', 'CastleEdgeRoad2.png', 'CastleEdgeRoad3.png',
    'CastleSidesEdge0.png', 'CastleSidesEdge1.png', 'CastleSidesEdge2.png', 'CastleSidesEdge3.png'
];

// Load all tile images with their rotations
const tilesToLoad = [
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

tilesToLoad.forEach(imageName => {
    const img = new Image();
    const promise = new Promise((resolve) => {
        img.onload = () => {
            tileImages[imageName] = img;
            resolve();
        };
        img.onerror = () => {
            console.error(`Failed to load tile image: ${imageName}`);
            resolve();
        };
    });
    img.src = `tiles/${imageName}`;
    imageLoadPromises.push(promise);
});

// Projects/Cities data - will be placed in predefined city locations
const projects = [
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

// Map grid
const mapGrid = [];
for (let y = 0; y < GRID_SIZE; y++) {
    mapGrid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        mapGrid[y][x] = null;
    }
}

// Default board layout filled with random grass
let BOARD_LAYOUT = [
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

// Custom map data - paste your exported map here
const CUSTOM_MAP_DATA = {
  "grid": [
    [
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 90
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Monastery",
        "file": "Monastery0.png",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 90
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ←↓→",
        "file": "CastleWall2.png",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Monastery + Road ←",
        "file": "MonasteryRoad1.png",
        "rotation": 270
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 90
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ↑←→",
        "file": "CastleWall0.png",
        "rotation": 90
      },
      {
        "tile": "City Corner ↑→",
        "file": "CastleSides0.png",
        "rotation": 90
      },
      {
        "tile": "City Full",
        "file": "CastleCenter0.png",
        "rotation": 0
      },
      {
        "tile": "City Edge ↑",
        "file": "CastleEdge0.png",
        "rotation": 180
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Road Curve ↑←",
        "file": "RoadCurve2.png",
        "rotation": 90
      },
      {
        "tile": "Road T ↑↓→",
        "file": "RoadJunctionSmall1.png",
        "rotation": 90
      },
      {
        "tile": "Road Curve ↓→",
        "file": "RoadCurve0.png",
        "rotation": 90
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "City Edge ↑",
        "file": "CastleEdge0.png",
        "rotation": 0
      },
      {
        "tile": "City Full",
        "file": "CastleCenter0.png",
        "rotation": 0
      },
      {
        "tile": "City Edge ↓",
        "file": "CastleEdge2.png",
        "rotation": 0
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 90
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Monastery",
        "file": "Monastery0.png",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Monastery + Road →",
        "file": "MonasteryRoad3.png",
        "rotation": 0
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 0
      },
      {
        "tile": "Road T ↑←→",
        "file": "RoadJunctionSmall0.png",
        "rotation": 0
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 0
      },
      {
        "tile": "City+Road ↑↓",
        "file": "CastleEdgeRoad0.png",
        "rotation": 0
      },
      {
        "tile": "City Edge ↓",
        "file": "CastleEdge2.png",
        "rotation": 90
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 90
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Monastery + Road ↑",
        "file": "MonasteryRoad2.png",
        "rotation": 0
      },
      {
        "tile": "Monastery + Road →",
        "file": "MonasteryRoad3.png",
        "rotation": 0
      },
      {
        "tile": "Road Cross +",
        "file": "RoadJunctionLarge0.png",
        "rotation": 0
      },
      {
        "tile": "Road T ←↓→",
        "file": "RoadJunctionSmall2.png",
        "rotation": 180
      },
      {
        "tile": "Road Curve ↓→",
        "file": "RoadCurve0.png",
        "rotation": 90
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ←↓→",
        "file": "CastleWall2.png",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Road Curve ←↓",
        "file": "RoadCurve1.png",
        "rotation": 90
      },
      {
        "tile": "Road Curve ←↓",
        "file": "RoadCurve1.png",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "City Edge Alt →",
        "file": "CastleSidesEdge1.png",
        "rotation": 90
      },
      {
        "tile": "City Opposite ↕",
        "file": "CastleTube0.png",
        "rotation": 0
      },
      {
        "tile": "City Opposite ↔",
        "file": "CastleTube1.png",
        "rotation": 90
      },
      {
        "tile": "City Full",
        "file": "CastleCenter0.png",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ↑↓→",
        "file": "CastleWall1.png",
        "rotation": 180
      }
    ],
    [
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Monastery",
        "file": "Monastery0.png",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ↑↓→",
        "file": "CastleWall1.png",
        "rotation": 90
      },
      {
        "tile": "City Edge →",
        "file": "CastleEdge1.png",
        "rotation": 0
      },
      {
        "tile": "City Edge ↓",
        "file": "CastleEdge2.png",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "City Opposite ↕",
        "file": "CastleTube0.png",
        "rotation": 90
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ↑↓→",
        "file": "CastleWall1.png",
        "rotation": 270
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ←↓→",
        "file": "CastleWall2.png",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "City Opposite ↕",
        "file": "CastleTube0.png",
        "rotation": 90
      },
      {
        "tile": "City Opposite ↔",
        "file": "CastleTube1.png",
        "rotation": 180
      },
      {
        "tile": "City Opposite ↔",
        "file": "CastleTube1.png",
        "rotation": 180
      },
      {
        "tile": "Monastery",
        "file": "Monastery0.png",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ↑↓→",
        "file": "CastleWall1.png",
        "rotation": 270
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "City Edge ←",
        "file": "CastleEdge3.png",
        "rotation": 90
      },
      {
        "tile": "City Opposite ↔",
        "file": "CastleTube1.png",
        "rotation": 90
      },
      {
        "tile": "City Edge Alt ↑",
        "file": "CastleSidesEdge0.png",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ↑↓←",
        "file": "CastleWall3.png",
        "rotation": 90
      },
      {
        "tile": "City Edge Alt ↑",
        "file": "CastleSidesEdge0.png",
        "rotation": 90
      },
      {
        "tile": "City 3-Way ↑↓→",
        "file": "CastleWall1.png",
        "rotation": 180
      },
      {
        "tile": "Monastery + Road →",
        "file": "MonasteryRoad3.png",
        "rotation": 0
      },
      {
        "tile": "Road ↕",
        "file": "Road0.png",
        "rotation": 90
      },
      {
        "tile": "Road Curve ↓→",
        "file": "RoadCurve0.png",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "City 3-Way ←↓→",
        "file": "CastleWall2.png",
        "rotation": 270
      },
      {
        "tile": "City 3-Way ←↓→",
        "file": "CastleWall2.png",
        "rotation": 90
      },
      {
        "tile": "Road Curve ↑←",
        "file": "RoadCurve2.png",
        "rotation": 90
      },
      {
        "tile": "Road Curve ↑←",
        "file": "RoadCurve2.png",
        "rotation": 180
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 90
      },
      {
        "tile": "Monastery + Road ↓",
        "file": "MonasteryRoad0.png",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 90
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "City Edge →",
        "file": "CastleEdge1.png",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Road Curve ↑←",
        "file": "RoadCurve2.png",
        "rotation": 0
      },
      {
        "tile": "Road T ←↓→",
        "file": "RoadJunctionSmall2.png",
        "rotation": 0
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 180
      },
      {
        "tile": "Road Curve ←↓",
        "file": "RoadCurve1.png",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ←↓→",
        "file": "CastleWall2.png",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ←↓→",
        "file": "CastleWall2.png",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ↑←→",
        "file": "CastleWall0.png",
        "rotation": 90
      },
      {
        "tile": "City+Road ↑↓",
        "file": "CastleEdgeRoad0.png",
        "rotation": 180
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 180
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 180
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 180
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 180
      },
      {
        "tile": "Road ↔",
        "file": "Road1.png",
        "rotation": 180
      }
    ],
    [
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Monastery",
        "file": "Monastery0.png",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 90
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ↑←→",
        "file": "CastleWall0.png",
        "rotation": 90
      },
      {
        "tile": "City Full",
        "file": "CastleCenter0.png",
        "rotation": 0
      },
      {
        "tile": "City Full",
        "file": "CastleCenter0.png",
        "rotation": 0
      },
      {
        "tile": "City Corner ↓←",
        "file": "CastleSides1.png",
        "rotation": 180
      },
      {
        "tile": "City Edge ↑",
        "file": "CastleEdge0.png",
        "rotation": 270
      },
      {
        "tile": "City Edge Alt ↓",
        "file": "CastleSidesEdge2.png",
        "rotation": 0
      },
      {
        "tile": "City Edge Alt ↓",
        "file": "CastleSidesEdge2.png",
        "rotation": 90
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      }
    ],
    [
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ↑←→",
        "file": "CastleWall0.png",
        "rotation": 0
      },
      {
        "tile": "City 3-Way ↑←→",
        "file": "CastleWall0.png",
        "rotation": 0
      },
      {
        "tile": "Grass 3",
        "file": "grass3.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "City Edge Alt ↓",
        "file": "CastleSidesEdge2.png",
        "rotation": 270
      },
      {
        "tile": "City Edge Alt ↑",
        "file": "CastleSidesEdge0.png",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 2",
        "file": "grass2.jpeg",
        "rotation": 0
      },
      {
        "tile": "Grass 1",
        "file": "grass1.jpeg",
        "rotation": 0
      }
    ]
  ]
}; // Your amazing custom map!

// Map layout characters to tile configurations
function getTileForChar(char, x, y) {
    switch(char) {
        case 'C':
            // Determine city type based on neighbors
            const neighbors = getNeighborChars(x, y);
            const cityCount = neighbors.filter(n => n === 'C' || n === 'X').length;
            
            if (cityCount === 4) {
                return { type: TILE_TYPES.CITY_FULL, rotation: 0, image: 'CastleCenter0.png' };
            } else if (cityCount >= 3) {
                const rotation = getRotationForCityThree(x, y);
                const img = tileImages[`CastleWall${rotation}.png`] ? `CastleWall${rotation}.png` : 'CastleWall0.png';
                return { type: TILE_TYPES.CITY_THREE, rotation: 0, image: img };
            } else if (cityCount === 2) {
                if (isAdjacentCity(x, y)) {
                    const rotation = getRotationForCityTwoAdj(x, y);
                    const img = tileImages[`CastleSides${rotation}.png`] ? `CastleSides${rotation}.png` : 'CastleSides0.png';
                    return { type: TILE_TYPES.CITY_TWO_ADJACENT, rotation: 0, image: img };
                } else {
                    const rotation = getRotationForCityTwoOpp(x, y);
                    const img = tileImages[`CastleTube${rotation}.png`] ? `CastleTube${rotation}.png` : 'CastleTube0.png';
                    return { type: TILE_TYPES.CITY_TWO_OPPOSITE, rotation: 0, image: img };
                }
            } else {
                const rotation = getRotationForCityOne(x, y);
                const img = tileImages[`CastleEdge${rotation}.png`] ? `CastleEdge${rotation}.png` : 'CastleEdge0.png';
                return { type: TILE_TYPES.CITY_ONE, rotation: 0, image: img };
            }
            
        case 'R':
            // Determine road type
            const roadNeighbors = getNeighborChars(x, y);
            const roadCount = roadNeighbors.filter(n => n === 'R' || n === 'X').length;
            
            if (roadCount >= 4) {
                return { type: TILE_TYPES.ROAD_FOUR, rotation: 0, image: 'RoadJunctionLarge0.png' };
            } else if (roadCount >= 3) {
                const rotation = getRotationForRoadThree(x, y);
                const img = tileImages[`RoadJunctionSmall${rotation}.png`] ? `RoadJunctionSmall${rotation}.png` : 'RoadJunctionSmall0.png';
                return { type: TILE_TYPES.ROAD_THREE, rotation: 0, image: img };
            } else if (roadCount === 2) {
                if (isStraightRoad(x, y)) {
                    const rotation = isVerticalRoad(x, y) ? 0 : 1;
                    const img = tileImages[`Road${rotation}.png`] ? `Road${rotation}.png` : 'Road0.png';
                    return { type: TILE_TYPES.ROAD_STRAIGHT, rotation: 0, image: img };
                } else {
                    const rotation = getRotationForRoadCurve(x, y);
                    const img = tileImages[`RoadCurve${rotation}.png`] ? `RoadCurve${rotation}.png` : 'RoadCurve0.png';
                    return { type: TILE_TYPES.ROAD_CURVE, rotation: 0, image: img };
                }
            } else {
                return { type: TILE_TYPES.ROAD_STRAIGHT, rotation: 0, image: 'Road0.png' };
            }
            
        case 'M':
            // Check if monastery has road
            const monasteryNeighbors = getNeighborChars(x, y);
            if (monasteryNeighbors.includes('R')) {
                const rotation = getRotationForMonasteryRoad(x, y);
                const img = tileImages[`MonasteryRoad${rotation}.png`] ? `MonasteryRoad${rotation}.png` : 'MonasteryRoad0.png';
                return { type: TILE_TYPES.MONASTERY_ROAD, rotation: 0, image: img };
            }
            return { type: TILE_TYPES.MONASTERY, rotation: 0, image: 'Monastery0.png' };
            
        case 'X':
            // City with road - not used in new layout
            return { type: TILE_TYPES.FIELD, rotation: 0, image: 'grass1.jpeg' };
            
        case '1':
            return { type: TILE_TYPES.FIELD, rotation: 0, image: 'grass1.jpeg' };
        case '2':
            return { type: TILE_TYPES.FIELD, rotation: 0, image: 'grass2.jpeg' };
        case '3':
            return { type: TILE_TYPES.FIELD, rotation: 0, image: 'grass3.jpeg' };
        default:
            return { type: TILE_TYPES.FIELD, rotation: 0, image: 'grass1.jpeg' };
    }
}

// Helper functions for determining tile orientations
function getNeighborChars(x, y) {
    const chars = [];
    if (y > 0) chars.push(BOARD_LAYOUT[y-1][x]); // top
    if (x < GRID_SIZE-1) chars.push(BOARD_LAYOUT[y][x+1]); // right
    if (y < GRID_SIZE-1) chars.push(BOARD_LAYOUT[y+1][x]); // bottom
    if (x > 0) chars.push(BOARD_LAYOUT[y][x-1]); // left
    return chars;
}

function isAdjacentCity(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'C' || BOARD_LAYOUT[y-1][x] === 'X');
    const right = x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'C' || BOARD_LAYOUT[y][x+1] === 'X');
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'C' || BOARD_LAYOUT[y+1][x] === 'X');
    const left = x > 0 && (BOARD_LAYOUT[y][x-1] === 'C' || BOARD_LAYOUT[y][x-1] === 'X');
    
    return (top && right) || (right && bottom) || (bottom && left) || (left && top);
}

function isStraightRoad(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'R' || BOARD_LAYOUT[y-1][x] === 'X');
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'R' || BOARD_LAYOUT[y+1][x] === 'X');
    const left = x > 0 && (BOARD_LAYOUT[y][x-1] === 'R' || BOARD_LAYOUT[y][x-1] === 'X');
    const right = x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'R' || BOARD_LAYOUT[y][x+1] === 'X');
    
    return (top && bottom) || (left && right);
}

function isVerticalRoad(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'R' || BOARD_LAYOUT[y-1][x] === 'X');
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'R' || BOARD_LAYOUT[y+1][x] === 'X');
    return top || bottom;
}

function getRotationForCityOne(x, y) {
    if (y > 0 && (BOARD_LAYOUT[y-1][x] === 'C' || BOARD_LAYOUT[y-1][x] === 'X')) return 0;
    if (x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'C' || BOARD_LAYOUT[y][x+1] === 'X')) return 1;
    if (y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'C' || BOARD_LAYOUT[y+1][x] === 'X')) return 2;
    if (x > 0 && (BOARD_LAYOUT[y][x-1] === 'C' || BOARD_LAYOUT[y][x-1] === 'X')) return 3;
    return 0;
}

function getRotationForCityTwoAdj(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'C' || BOARD_LAYOUT[y-1][x] === 'X');
    const right = x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'C' || BOARD_LAYOUT[y][x+1] === 'X');
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'C' || BOARD_LAYOUT[y+1][x] === 'X');
    const left = x > 0 && (BOARD_LAYOUT[y][x-1] === 'C' || BOARD_LAYOUT[y][x-1] === 'X');
    
    if (top && right) return 0;
    if (right && bottom) return 1;
    if (bottom && left) return 0;
    if (left && top) return 1;
    return 0;
}

function getRotationForCityTwoOpp(x, y) {
    const vertical = (y > 0 && (BOARD_LAYOUT[y-1][x] === 'C' || BOARD_LAYOUT[y-1][x] === 'X')) && 
                    (y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'C' || BOARD_LAYOUT[y+1][x] === 'X'));
    return vertical ? 0 : 1;
}

function getRotationForCityThree(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'C' || BOARD_LAYOUT[y-1][x] === 'X');
    const right = x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'C' || BOARD_LAYOUT[y][x+1] === 'X');
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'C' || BOARD_LAYOUT[y+1][x] === 'X');
    const left = x > 0 && (BOARD_LAYOUT[y][x-1] === 'C' || BOARD_LAYOUT[y][x-1] === 'X');
    
    if (!bottom) return 0;
    if (!left) return 1;
    if (!top) return 2;
    if (!right) return 3;
    return 0;
}

function getRotationForRoadCurve(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'R' || BOARD_LAYOUT[y-1][x] === 'X');
    const right = x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'R' || BOARD_LAYOUT[y][x+1] === 'X');
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'R' || BOARD_LAYOUT[y+1][x] === 'X');
    const left = x > 0 && (BOARD_LAYOUT[y][x-1] === 'R' || BOARD_LAYOUT[y][x-1] === 'X');
    
    if (bottom && right) return 0;
    if (bottom && left) return 1;
    if (top && left) return 2;
    if (top && right) return 3;
    return 0;
}

function getRotationForRoadThree(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'R' || BOARD_LAYOUT[y-1][x] === 'X');
    const right = x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'R' || BOARD_LAYOUT[y][x+1] === 'X');
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'R' || BOARD_LAYOUT[y+1][x] === 'X');
    const left = x > 0 && (BOARD_LAYOUT[y][x-1] === 'R' || BOARD_LAYOUT[y][x-1] === 'X');
    
    if (!right) return 0;
    if (!bottom) return 1;
    if (!left) return 2;
    if (!top) return 3;
    return 0;
}

function getRotationForMonasteryRoad(x, y) {
    if (y < GRID_SIZE-1 && BOARD_LAYOUT[y+1][x] === 'R') return 0;
    if (x > 0 && BOARD_LAYOUT[y][x-1] === 'R') return 1;
    if (y > 0 && BOARD_LAYOUT[y-1][x] === 'R') return 2;
    if (x < GRID_SIZE-1 && BOARD_LAYOUT[y][x+1] === 'R') return 3;
    return 0;
}

function getRotationForCityRoad(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'C' || BOARD_LAYOUT[y-1][x] === 'X');
    if (top) return 0;
    
    const right = x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'C' || BOARD_LAYOUT[y][x+1] === 'X');
    if (right) return 90;
    
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'C' || BOARD_LAYOUT[y+1][x] === 'X');
    if (bottom) return 180;
    
    return 270;
}

// Generate map with tiles
function generateMap() {
    // Check if we have custom map data
    if (CUSTOM_MAP_DATA && CUSTOM_MAP_DATA.grid) {
        // Load from custom map
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (CUSTOM_MAP_DATA.grid[y] && CUSTOM_MAP_DATA.grid[y][x]) {
                    const cellData = CUSTOM_MAP_DATA.grid[y][x];
                    mapGrid[y][x] = {
                        type: { type: cellData.tile.toLowerCase().replace(/ /g, '_') },
                        rotation: cellData.rotation,
                        image: cellData.file,
                        project: null
                    };
                } else {
                    // Empty cell - use green field
                    mapGrid[y][x] = {
                        type: TILE_TYPES.FIELD,
                        rotation: 0,
                        image: 'grass1.jpeg',
                        project: null
                    };
                }
            }
        }
    } else {
        // Use default layout
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const char = BOARD_LAYOUT[y][x];
                const tileConfig = getTileForChar(char, x, y);
                
                mapGrid[y][x] = {
                    type: tileConfig.type,
                    rotation: tileConfig.rotation,
                    image: tileConfig.image,
                    project: null
                };
            }
        }
    }
    
    // Now assign projects to city tiles
    const cityTiles = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = mapGrid[y][x];
            if (tile && (tile.type.type === 'city_center' || 
                        tile.type.type === 'city_edge' || 
                        tile.type.type === 'city_corner' ||
                        tile.type.type === 'city')) {
                cityTiles.push({ x, y });
            }
        }
    }
    
    // Place projects at their specific coordinates
    projects.forEach(project => {
        if (mapGrid[project.y] && mapGrid[project.y][project.x]) {
            mapGrid[project.y][project.x].project = project;
        }
    });
}

// Player state - start near center
const player = {
    x: 7 * TILE_SIZE + TILE_SIZE / 2,
    y: 7 * TILE_SIZE + TILE_SIZE / 2,
    speed: 4,
    color: "#ff6b6b",
    facing: 'down', // 'up', 'down', 'left', 'right'
    sprites: {
        down: null,
        up: null,
        right: null,
        left: null
    },
    spritesLoaded: 0
};

// Load individual player sprites
function loadPlayerSprites() {
    const spritesToLoad = [
        { direction: 'down', file: 'player-down.png' },
        { direction: 'up', file: 'player-up.png' },
        { direction: 'right', file: 'player-right.png' }
    ];
    
    spritesToLoad.forEach(({ direction, file }) => {
        const img = new Image();
        img.onload = () => {
            player.sprites[direction] = img;
            // Use the same image for left, but it will be flipped
            if (direction === 'right') {
                player.sprites.left = img;
            }
            player.spritesLoaded++;
        };
        img.onerror = () => {
            console.log(`Failed to load ${file}`);
            player.spritesLoaded++;
        };
        img.src = file;
    });
}

// Initialize sprite loading
loadPlayerSprites();

// Game state
let keys = {};
let currentProject = null;
let cameraX = 0;
let cameraY = 0;
let markingMode = false;
let markedLocations = [];

// DOM elements
const cityInfo = document.getElementById('cityInfo');
const cityName = document.getElementById('cityName');
const cityDesc = document.getElementById('cityDesc');
const projectViewer = document.getElementById('projectViewer');
const projectFrame = document.getElementById('projectFrame');

// Initialize map will be done after images load

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Toggle marking mode with 'M' key
    if (e.key.toLowerCase() === 'm') {
        markingMode = !markingMode;
        console.log('Marking mode:', markingMode ? 'ON' : 'OFF');
        if (markingMode) {
            showMarkingInstructions();
        } else {
            hideMarkingInstructions();
        }
    }
    
    // Enter key behavior
    if (e.key === 'Enter') {
        console.log('Enter pressed. Current project:', currentProject, 'Marking mode:', markingMode);
        if (markingMode) {
            // Mark current location
            markProjectLocation();
        } else if (currentProject) {
            // View project normally
            console.log('Opening project:', currentProject);
            openProject(currentProject);
        } else {
            console.log('No project at current location');
        }
    }
    
    // Export marked locations with 'E' key
    if (e.key.toLowerCase() === 'e' && markingMode) {
        exportMarkedLocations();
    }
    
    if (e.key === 'Escape') {
        closeProject();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Update player movement
function updatePlayer() {
    let moved = false;
    let dx = 0;
    let dy = 0;
    
    if (keys['w'] || keys['arrowup']) {
        dy = -player.speed;
        player.facing = 'up';
        moved = true;
    }
    if (keys['s'] || keys['arrowdown']) {
        dy = player.speed;
        player.facing = 'down';
        moved = true;
    }
    if (keys['a'] || keys['arrowleft']) {
        dx = -player.speed;
        player.facing = 'left';
        moved = true;
    }
    if (keys['d'] || keys['arrowright']) {
        dx = player.speed;
        player.facing = 'right';
        moved = true;
    }
    
    // Apply movement
    player.x += dx;
    player.y += dy;
    
    // Keep player in bounds
    player.x = Math.max(PLAYER_SIZE/2, Math.min(GRID_SIZE * TILE_SIZE - PLAYER_SIZE/2, player.x));
    player.y = Math.max(PLAYER_SIZE/2, Math.min(GRID_SIZE * TILE_SIZE - PLAYER_SIZE/2, player.y));
    
    // Check project collision
    if (moved) {
        checkProjectCollision();
    }
}

// Check if player is on a project tile
function checkProjectCollision() {
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);
    
    // Debug: show player tile position when Enter is pressed
    if (keys['enter']) {
        console.log('Player at tile:', tileX, tileY);
        console.log('Looking for project at this tile...');
        if (mapGrid[tileY] && mapGrid[tileY][tileX]) {
            console.log('Tile data:', mapGrid[tileY][tileX]);
        }
    }
    
    if (tileX >= 0 && tileX < GRID_SIZE && tileY >= 0 && tileY < GRID_SIZE) {
        const tile = mapGrid[tileY][tileX];
        if (tile && tile.project) {
            if (currentProject !== tile.project) {
                currentProject = tile.project;
                showCityInfo(currentProject);
            }
        } else if (currentProject) {
            currentProject = null;
            hideCityInfo();
        }
    }
}

// Show city info
function showCityInfo(project) {
    cityName.textContent = project.name;
    cityDesc.textContent = project.desc;
    cityInfo.classList.add('active');
}

// Hide city info
function hideCityInfo() {
    cityInfo.classList.remove('active');
}

// Open project
function openProject(project) {
    console.log('Opening project:', project.name, 'Type:', project.type);
    
    if (project.type === 'code') {
        // Open code viewer for code projects
        openCodeViewer(project);
    } else {
        // Open iframe for regular projects
        projectFrame.src = project.url;
        projectViewer.classList.add('active');
    }
}

// Close project
function closeProject() {
    projectViewer.classList.remove('active');
    projectFrame.src = '';
}
window.closeProject = closeProject;

// Code viewer functions
function openCodeViewer(project) {
    console.log('Opening code viewer for:', project.name);
    
    // Navigate to the code viewer page
    window.location.href = 'mincoins-area.html?project=' + encodeURIComponent(project.name);
}

// Update camera to follow player
function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;
    
    cameraX += (targetX - cameraX) * 0.1;
    cameraY += (targetY - cameraY) * 0.1;
}

// Draw a single Carcassonne tile
function drawTile(tile, x, y) {
    const screenX = x * TILE_SIZE - cameraX;
    const screenY = y * TILE_SIZE - cameraY;
    
    // Skip if off screen
    if (screenX + TILE_SIZE < 0 || screenX > canvas.width || 
        screenY + TILE_SIZE < 0 || screenY > canvas.height) {
        return;
    }
    
    ctx.save();
    ctx.translate(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
    ctx.rotate(tile.rotation * Math.PI / 180);
    ctx.translate(-TILE_SIZE/2, -TILE_SIZE/2);
    
    // Draw the tile image if available
    const tileImage = tileImages[tile.image];
    if (tileImage) {
        ctx.drawImage(tileImage, 0, 0, TILE_SIZE, TILE_SIZE);
    } else {
        // Use a default green field tile if image not loaded
        const defaultImage = tileImages['grass1.jpeg'];
        if (defaultImage) {
            ctx.drawImage(defaultImage, 0, 0, TILE_SIZE, TILE_SIZE);
        } else {
            // Last resort - draw green field
            ctx.fillStyle = "#8ed156";
            ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        }
    }
    
    // Project marker if this is a project tile
    if (tile.project) {
        // Draw a small overlay indicator
        ctx.fillStyle = "rgba(0, 100, 255, 0.5)";
        ctx.beginPath();
        ctx.arc(TILE_SIZE/2, TILE_SIZE/2, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Project initial
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(tile.project.name.charAt(0), TILE_SIZE/2, TILE_SIZE/2);
        ctx.fillText(tile.project.name.charAt(0), TILE_SIZE/2, TILE_SIZE/2);
    }
    
    ctx.restore();
}

// Draw player
function drawPlayer() {
    const x = player.x - cameraX;
    const y = player.y - cameraY;
    
    const sprite = player.sprites[player.facing];
    
    if (sprite) {
        // Draw sprite (scale up 2x for visibility)
        ctx.save();
        
        // Apply horizontal flip for left facing
        if (player.facing === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(
                sprite,
                -x - 16, y - 16,
                32, 32
            );
        } else {
            ctx.drawImage(
                sprite,
                x - 16, y - 16,
                32, 32
            );
        }
        
        ctx.restore();
    } else {
        // Fallback circle
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(x, y, PLAYER_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Main game loop
function gameLoop() {
    // Update
    updatePlayer();
    updateCamera();
    
    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background - dark like empty game table
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw tiles
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = mapGrid[y][x];
            if (tile) {
                drawTile(tile, x, y);
            }
        }
    }
    
    // Draw player
    drawPlayer();
    
    // Draw marking mode UI
    if (markingMode) {
        drawMarkingMode();
    }
    
    requestAnimationFrame(gameLoop);
}

// Marking mode functions
function showMarkingInstructions() {
    const instructions = document.createElement('div');
    instructions.id = 'markingInstructions';
    instructions.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        border: 2px solid #ffd700;
        z-index: 1000;
        text-align: center;
        font-family: Arial, sans-serif;
    `;
    instructions.innerHTML = `
        <h3 style="color: #ffd700; margin: 0 0 10px 0;">PROJECT MARKING MODE</h3>
        <p>Move to locations where projects should be displayed</p>
        <p><strong>ENTER</strong> - Mark current location</p>
        <p><strong>E</strong> - Export all marked locations</p>
        <p><strong>M</strong> - Exit marking mode</p>
    `;
    document.body.appendChild(instructions);
}

function hideMarkingInstructions() {
    const instructions = document.getElementById('markingInstructions');
    if (instructions) {
        instructions.remove();
    }
}

function markProjectLocation() {
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);
    
    // Check if already marked
    const exists = markedLocations.find(loc => loc.x === tileX && loc.y === tileY);
    if (!exists) {
        markedLocations.push({ x: tileX, y: tileY });
        console.log(`Marked location: (${tileX}, ${tileY})`);
        
        // Visual feedback
        showMarkFeedback(tileX, tileY);
    } else {
        console.log('Location already marked!');
    }
}

function showMarkFeedback(tileX, tileY) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
    `;
    feedback.textContent = `Marked tile (${tileX}, ${tileY})`;
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 2000);
}

function drawMarkingMode() {
    // Draw marked locations
    ctx.save();
    
    markedLocations.forEach(loc => {
        const x = loc.x * TILE_SIZE - cameraX;
        const y = loc.y * TILE_SIZE - cameraY;
        
        // Draw marker
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        
        // Draw border
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        
        // Draw "P" for project
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('P', x + TILE_SIZE/2, y + TILE_SIZE/2 + 7);
    });
    
    // Draw current tile highlight
    const currentTileX = Math.floor(player.x / TILE_SIZE);
    const currentTileY = Math.floor(player.y / TILE_SIZE);
    const highlightX = currentTileX * TILE_SIZE - cameraX;
    const highlightY = currentTileY * TILE_SIZE - cameraY;
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(highlightX, highlightY, TILE_SIZE, TILE_SIZE);
    
    ctx.restore();
}

function exportMarkedLocations() {
    const exportData = {
        projectLocations: markedLocations,
        note: "Add these to your projects array in script.js"
    };
    
    const exportText = JSON.stringify(exportData, null, 2);
    
    // Create export dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        color: black;
        padding: 20px;
        border-radius: 10px;
        z-index: 1001;
        max-width: 600px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    `;
    
    dialog.innerHTML = `
        <h3>Marked Project Locations</h3>
        <textarea style="width: 100%; height: 300px; font-family: monospace;" readonly>${exportText}</textarea>
        <br><br>
        <button onclick="this.parentElement.remove()" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        ">Close</button>
    `;
    
    document.body.appendChild(dialog);
    
    // Also log to console
    console.log('Marked locations:', markedLocations);
}

// Start game after images are loaded
Promise.all(imageLoadPromises).then(() => {
    console.log('All tile images loaded');
    // Initialize map after images are loaded
    generateMap();
    gameLoop();
}).catch(err => {
    console.error('Error loading images:', err);
    generateMap();
    gameLoop(); // Start anyway with fallback rendering
});
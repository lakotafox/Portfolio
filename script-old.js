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

// Carcassonne tile types
const TILE_TYPES = {
    // Format: [top, right, bottom, left] - C=City, R=Road, F=Field
    CITY_FULL: { edges: ['C', 'C', 'C', 'C'], type: 'city_full' },
    CITY_THREE: { edges: ['C', 'C', 'C', 'F'], type: 'city_three' },
    CITY_TWO_ADJACENT: { edges: ['C', 'C', 'F', 'F'], type: 'city_two_adj' },
    CITY_TWO_OPPOSITE: { edges: ['C', 'F', 'C', 'F'], type: 'city_two_opp' },
    CITY_ONE: { edges: ['C', 'F', 'F', 'F'], type: 'city_one' },
    CITY_ONE_ROAD: { edges: ['C', 'R', 'R', 'F'], type: 'city_road' },
    MONASTERY: { edges: ['F', 'F', 'F', 'F'], type: 'monastery' },
    MONASTERY_ROAD: { edges: ['F', 'F', 'R', 'F'], type: 'monastery_road' },
    ROAD_STRAIGHT: { edges: ['R', 'F', 'R', 'F'], type: 'road_straight' },
    ROAD_CURVE: { edges: ['F', 'R', 'R', 'F'], type: 'road_curve' },
    ROAD_THREE: { edges: ['R', 'R', 'R', 'F'], type: 'road_three' },
    ROAD_FOUR: { edges: ['R', 'R', 'R', 'R'], type: 'road_four' },
    FIELD: { edges: ['F', 'F', 'F', 'F'], type: 'field' }
};

// Projects/Cities data - will be placed in predefined city locations
const projects = [
    {
        id: 1,
        name: "Neural Network Castle",
        desc: "Machine Learning Visualization",
        url: "https://example.com/project1"
    },
    {
        id: 2,
        name: "Pixel Keep",
        desc: "Retro Game Engine",
        url: "https://example.com/project2"
    },
    {
        id: 3,
        name: "Quantum Monastery",
        desc: "Quantum Computing Simulator",
        url: "https://example.com/project3"
    },
    {
        id: 4,
        name: "Cyber Citadel",
        desc: "Security Dashboard",
        url: "https://example.com/project4"
    },
    {
        id: 5,
        name: "AI Abbey",
        desc: "Language Processing Demo",
        url: "https://example.com/project5"
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

// Predefined Carcassonne board layout - based on real game layouts
// F=Field, C=City, R=Road, M=Monastery, X=CityRoad
const BOARD_LAYOUT = [
    "FFFMFFRFFFFFCFF",
    "FFFRFFRCFFFFCFF",
    "FFFRFFFRCCCCCFF",
    "CCCRFFFFFCFFFFF",
    "FCFFFFMFFCFFFFF",
    "FCFFRRRRRXRRFFF",
    "FCFFFFFFFRFFFFF",
    "FCCCFFMFFRFFFFF",
    "FFFFRRRRRRFFFFF",
    "FFFFFFFCCRFFFFF",
    "FMFFFFFCCRFFFFF",
    "FRRRRRRCCRRMFFF",
    "FFFFFFFCCFFFFFF",
    "FFFFFFFCCFFFFFF",
    "FFFFFFFCCFFFFFF"
];

// Map layout characters to tile configurations
function getTileForChar(char, x, y) {
    switch(char) {
        case 'C':
            // Determine city type based on neighbors
            const neighbors = getNeighborChars(x, y);
            const cityCount = neighbors.filter(n => n === 'C' || n === 'X').length;
            
            if (cityCount >= 3) {
                return { type: TILE_TYPES.CITY_THREE, rotation: getRotationForCityThree(x, y) };
            } else if (cityCount === 2) {
                if (isAdjacentCity(x, y)) {
                    return { type: TILE_TYPES.CITY_TWO_ADJACENT, rotation: getRotationForCityTwoAdj(x, y) };
                } else {
                    return { type: TILE_TYPES.CITY_TWO_OPPOSITE, rotation: getRotationForCityTwoOpp(x, y) };
                }
            } else {
                return { type: TILE_TYPES.CITY_ONE, rotation: getRotationForCityOne(x, y) };
            }
            
        case 'R':
            // Determine road type
            const roadNeighbors = getNeighborChars(x, y);
            const roadCount = roadNeighbors.filter(n => n === 'R' || n === 'X').length;
            
            if (roadCount >= 3) {
                return { type: TILE_TYPES.ROAD_THREE, rotation: 0 };
            } else if (roadCount === 2) {
                if (isStraightRoad(x, y)) {
                    return { type: TILE_TYPES.ROAD_STRAIGHT, rotation: isVerticalRoad(x, y) ? 0 : 90 };
                } else {
                    return { type: TILE_TYPES.ROAD_CURVE, rotation: getRotationForRoadCurve(x, y) };
                }
            } else {
                return { type: TILE_TYPES.ROAD_STRAIGHT, rotation: 0 };
            }
            
        case 'M':
            // Check if monastery has road
            const monasteryNeighbors = getNeighborChars(x, y);
            if (monasteryNeighbors.includes('R')) {
                return { type: TILE_TYPES.MONASTERY_ROAD, rotation: getRotationForMonasteryRoad(x, y) };
            }
            return { type: TILE_TYPES.MONASTERY, rotation: 0 };
            
        case 'X':
            return { type: TILE_TYPES.CITY_ONE_ROAD, rotation: getRotationForCityRoad(x, y) };
            
        default:
            return { type: TILE_TYPES.FIELD, rotation: 0 };
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
    if (x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'C' || BOARD_LAYOUT[y][x+1] === 'X')) return 90;
    if (y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'C' || BOARD_LAYOUT[y+1][x] === 'X')) return 180;
    if (x > 0 && (BOARD_LAYOUT[y][x-1] === 'C' || BOARD_LAYOUT[y][x-1] === 'X')) return 270;
    return 0;
}

function getRotationForCityTwoAdj(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'C' || BOARD_LAYOUT[y-1][x] === 'X');
    const right = x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'C' || BOARD_LAYOUT[y][x+1] === 'X');
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'C' || BOARD_LAYOUT[y+1][x] === 'X');
    const left = x > 0 && (BOARD_LAYOUT[y][x-1] === 'C' || BOARD_LAYOUT[y][x-1] === 'X');
    
    if (top && right) return 0;
    if (right && bottom) return 90;
    if (bottom && left) return 180;
    if (left && top) return 270;
    return 0;
}

function getRotationForCityTwoOpp(x, y) {
    const vertical = (y > 0 && (BOARD_LAYOUT[y-1][x] === 'C' || BOARD_LAYOUT[y-1][x] === 'X')) && 
                    (y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'C' || BOARD_LAYOUT[y+1][x] === 'X'));
    return vertical ? 0 : 90;
}

function getRotationForCityThree(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'C' || BOARD_LAYOUT[y-1][x] === 'X');
    const right = x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'C' || BOARD_LAYOUT[y][x+1] === 'X');
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'C' || BOARD_LAYOUT[y+1][x] === 'X');
    const left = x > 0 && (BOARD_LAYOUT[y][x-1] === 'C' || BOARD_LAYOUT[y][x-1] === 'X');
    
    if (!bottom) return 0;
    if (!left) return 90;
    if (!top) return 180;
    if (!right) return 270;
    return 0;
}

function getRotationForRoadCurve(x, y) {
    const top = y > 0 && (BOARD_LAYOUT[y-1][x] === 'R' || BOARD_LAYOUT[y-1][x] === 'X');
    const right = x < GRID_SIZE-1 && (BOARD_LAYOUT[y][x+1] === 'R' || BOARD_LAYOUT[y][x+1] === 'X');
    const bottom = y < GRID_SIZE-1 && (BOARD_LAYOUT[y+1][x] === 'R' || BOARD_LAYOUT[y+1][x] === 'X');
    const left = x > 0 && (BOARD_LAYOUT[y][x-1] === 'R' || BOARD_LAYOUT[y][x-1] === 'X');
    
    if (bottom && right) return 0;
    if (bottom && left) return 90;
    if (top && left) return 180;
    if (top && right) return 270;
    return 0;
}

function getRotationForMonasteryRoad(x, y) {
    if (y < GRID_SIZE-1 && BOARD_LAYOUT[y+1][x] === 'R') return 0;
    if (x > 0 && BOARD_LAYOUT[y][x-1] === 'R') return 90;
    if (y > 0 && BOARD_LAYOUT[y-1][x] === 'R') return 180;
    if (x < GRID_SIZE-1 && BOARD_LAYOUT[y][x+1] === 'R') return 270;
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
    // First, build the board from the layout
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const char = BOARD_LAYOUT[y][x];
            const tileConfig = getTileForChar(char, x, y);
            
            mapGrid[y][x] = {
                type: tileConfig.type,
                rotation: tileConfig.rotation,
                project: null
            };
        }
    }
    
    // Now assign projects to city tiles
    const cityTiles = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (BOARD_LAYOUT[y][x] === 'C' && mapGrid[y][x].type.type === 'city_full') {
                cityTiles.push({ x, y });
            }
        }
    }
    
    // If not enough full city tiles, use any city tile
    if (cityTiles.length < projects.length) {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (BOARD_LAYOUT[y][x] === 'C' && !cityTiles.some(t => t.x === x && t.y === y)) {
                    cityTiles.push({ x, y });
                }
            }
        }
    }
    
    // Place projects in city tiles
    for (let i = 0; i < Math.min(projects.length, cityTiles.length); i++) {
        const tile = cityTiles[i];
        mapGrid[tile.y][tile.x].project = projects[i];
    }
}

// Road paths are now part of the predefined board layout

// Player state - start near center
const player = {
    x: 7 * TILE_SIZE + TILE_SIZE / 2,
    y: 7 * TILE_SIZE + TILE_SIZE / 2,
    speed: 4,
    color: "#ff6b6b"
};

// Game state
let keys = {};
let currentProject = null;
let cameraX = 0;
let cameraY = 0;

// DOM elements
const cityInfo = document.getElementById('cityInfo');
const cityName = document.getElementById('cityName');
const cityDesc = document.getElementById('cityDesc');
const projectViewer = document.getElementById('projectViewer');
const projectFrame = document.getElementById('projectFrame');

// Initialize map
generateMap();

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (e.key === 'Enter' && currentProject) {
        openProject(currentProject);
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
    
    if (keys['w'] || keys['arrowup']) {
        player.y -= player.speed;
        moved = true;
    }
    if (keys['s'] || keys['arrowdown']) {
        player.y += player.speed;
        moved = true;
    }
    if (keys['a'] || keys['arrowleft']) {
        player.x -= player.speed;
        moved = true;
    }
    if (keys['d'] || keys['arrowright']) {
        player.x += player.speed;
        moved = true;
    }
    
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
    projectFrame.src = project.url;
    projectViewer.classList.add('active');
}

// Close project
function closeProject() {
    projectViewer.classList.remove('active');
    projectFrame.src = '';
}
window.closeProject = closeProject;

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
    
    // Base beige/yellow background like authentic tiles
    ctx.fillStyle = "#f4e4c1";
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    // Add subtle texture
    ctx.fillStyle = "rgba(228, 208, 180, 0.3)";
    for (let i = 0; i < TILE_SIZE; i += 3) {
        for (let j = 0; j < TILE_SIZE; j += 3) {
            if ((i + j) % 6 === 0) {
                ctx.fillRect(i, j, 2, 2);
            }
        }
    }
    
    // Draw tile features based on type
    switch(tile.type.type) {
        case 'city_full':
            drawCityFull(tile.project);
            break;
        case 'city_three':
            drawCityThree();
            break;
        case 'city_two_adj':
            drawCityTwoAdjacent();
            break;
        case 'city_two_opp':
            drawCityTwoOpposite();
            break;
        case 'city_one':
            drawCityOne();
            break;
        case 'city_road':
            drawCityWithRoad();
            break;
        case 'monastery':
            drawMonastery();
            break;
        case 'monastery_road':
            drawMonasteryWithRoad();
            break;
        case 'road_straight':
            drawRoadStraight();
            break;
        case 'road_curve':
            drawRoadCurve();
            break;
        case 'road_three':
            drawRoadThree();
            break;
        case 'road_four':
            drawRoadFour();
            break;
        case 'field':
            drawField();
            break;
    }
    
    // Tile border - darker brown
    ctx.strokeStyle = "#8b7355";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    ctx.restore();
}

// Remove old drawing functions - we're using images now
/*
function drawCityFull(project) {
    // Draw multiple buildings like the authentic tiles
    const buildings = [
        { x: 8, y: 10, w: 15, h: 18 },
        { x: 28, y: 8, w: 12, h: 15 },
        { x: 45, y: 12, w: 18, h: 20 },
        { x: 15, y: 35, w: 20, h: 18 },
        { x: 40, y: 38, w: 15, h: 15 },
        { x: 58, y: 30, w: 12, h: 18 },
        { x: 25, y: 58, w: 18, h: 12 },
        { x: 48, y: 60, w: 15, h: 10 }
    ];
    
    // Draw buildings
    buildings.forEach(b => {
        // Building base - beige/tan
        ctx.fillStyle = "#e8d4b0";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        // Timber frame details
        ctx.strokeStyle = "#654321";
        ctx.lineWidth = 1;
        // Vertical beams
        ctx.beginPath();
        ctx.moveTo(b.x + b.w/3, b.y);
        ctx.lineTo(b.x + b.w/3, b.y + b.h);
        ctx.moveTo(b.x + 2*b.w/3, b.y);
        ctx.lineTo(b.x + 2*b.w/3, b.y + b.h);
        // Horizontal beam
        ctx.moveTo(b.x, b.y + b.h/2);
        ctx.lineTo(b.x + b.w, b.y + b.h/2);
        // Diagonal beams
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + b.w/3, b.y + b.h/2);
        ctx.moveTo(b.x + b.w, b.y);
        ctx.lineTo(b.x + 2*b.w/3, b.y + b.h/2);
        ctx.stroke();
        
        // Orange roof
        ctx.fillStyle = "#d2691e";
        ctx.beginPath();
        ctx.moveTo(b.x - 2, b.y);
        ctx.lineTo(b.x + b.w/2, b.y - b.h/3);
        ctx.lineTo(b.x + b.w + 2, b.y);
        ctx.closePath();
        ctx.fill();
        
        // Roof shading
        ctx.fillStyle = "#b8581c";
        ctx.beginPath();
        ctx.moveTo(b.x + b.w/2, b.y - b.h/3);
        ctx.lineTo(b.x + b.w + 2, b.y);
        ctx.lineTo(b.x + b.w/2, b.y - 2);
        ctx.closePath();
        ctx.fill();
    });
    
    // Add some windows
    ctx.fillStyle = "#2c2416";
    buildings.forEach(b => {
        if (b.h > 15) {
            ctx.fillRect(b.x + b.w/4, b.y + b.h/3, 3, 4);
            ctx.fillRect(b.x + 3*b.w/4 - 3, b.y + b.h/3, 3, 4);
        }
    });
    
    // Project marker if exists
    if (project) {
        // Small shield
        ctx.fillStyle = "#4169e1";
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE/2 - 8, TILE_SIZE/2 - 8);
        ctx.lineTo(TILE_SIZE/2 + 8, TILE_SIZE/2 - 8);
        ctx.lineTo(TILE_SIZE/2 + 8, TILE_SIZE/2 + 2);
        ctx.lineTo(TILE_SIZE/2, TILE_SIZE/2 + 10);
        ctx.lineTo(TILE_SIZE/2 - 8, TILE_SIZE/2 + 2);
        ctx.closePath();
        ctx.fill();
        
        // Initial
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(project.name.charAt(0), TILE_SIZE/2, TILE_SIZE/2 - 2);
    }
}

// Draw city with three sides
function drawCityThree() {
    // Buildings covering three edges
    const buildings = [
        { x: 5, y: 5, w: 15, h: 20 },
        { x: 25, y: 8, w: 18, h: 15 },
        { x: 48, y: 5, w: 22, h: 18 },
        { x: 5, y: 30, w: 12, h: 18 },
        { x: 55, y: 28, w: 15, h: 20 },
        { x: 8, y: 52, w: 18, h: 18 },
        { x: 30, y: 55, w: 20, h: 15 }
    ];
    
    // Green field area at bottom
    ctx.fillStyle = "#a5c882";
    ctx.beginPath();
    ctx.moveTo(TILE_SIZE/3, TILE_SIZE);
    ctx.lineTo(2*TILE_SIZE/3, TILE_SIZE);
    ctx.lineTo(2*TILE_SIZE/3, 3*TILE_SIZE/4);
    ctx.bezierCurveTo(2*TILE_SIZE/3, TILE_SIZE/2, TILE_SIZE/3, TILE_SIZE/2, TILE_SIZE/3, 3*TILE_SIZE/4);
    ctx.closePath();
    ctx.fill();
    
    // Draw buildings
    buildings.forEach(b => {
        // Building base
        ctx.fillStyle = "#e8d4b0";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        // Timber frames
        ctx.strokeStyle = "#654321";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w/2, b.y);
        ctx.lineTo(b.x + b.w/2, b.y + b.h);
        ctx.moveTo(b.x, b.y + b.h/2);
        ctx.lineTo(b.x + b.w, b.y + b.h/2);
        ctx.stroke();
        
        // Orange roof
        ctx.fillStyle = "#d2691e";
        ctx.beginPath();
        ctx.moveTo(b.x - 2, b.y);
        ctx.lineTo(b.x + b.w/2, b.y - b.h/3);
        ctx.lineTo(b.x + b.w + 2, b.y);
        ctx.closePath();
        ctx.fill();
    });
    
    // Add small windows
    ctx.fillStyle = "#2c2416";
    buildings.forEach(b => {
        if (b.h > 15) {
            ctx.fillRect(b.x + 3, b.y + 5, 2, 3);
            ctx.fillRect(b.x + b.w - 5, b.y + 5, 2, 3);
        }
    });
}

// Draw city with two adjacent sides
function drawCityTwoAdjacent() {
    // Green field area (L-shaped)
    ctx.fillStyle = "#a5c882";
    ctx.fillRect(0, TILE_SIZE/2, TILE_SIZE, TILE_SIZE/2);
    ctx.fillRect(TILE_SIZE/2, 0, TILE_SIZE/2, TILE_SIZE/2);
    
    // Buildings along top and left edges
    const buildings = [
        { x: 5, y: 5, w: 18, h: 20 },
        { x: 28, y: 8, w: 15, h: 18 },
        { x: 48, y: 5, w: 20, h: 15 },
        { x: 5, y: 30, w: 15, h: 18 },
        { x: 8, y: 52, w: 12, h: 15 }
    ];
    
    // Draw curved transition
    ctx.fillStyle = "#a5c882";
    ctx.beginPath();
    ctx.moveTo(TILE_SIZE/2, TILE_SIZE/2);
    ctx.bezierCurveTo(TILE_SIZE/2, TILE_SIZE/3, TILE_SIZE/3, TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2);
    ctx.fill();
    
    // Draw buildings
    buildings.forEach(b => {
        // Building base
        ctx.fillStyle = "#e8d4b0";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        // Timber frame
        ctx.strokeStyle = "#654321";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.h/2);
        ctx.lineTo(b.x + b.w, b.y + b.h/2);
        ctx.stroke();
        
        // Orange roof
        ctx.fillStyle = "#d2691e";
        ctx.beginPath();
        ctx.moveTo(b.x - 2, b.y);
        ctx.lineTo(b.x + b.w/2, b.y - b.h/4);
        ctx.lineTo(b.x + b.w + 2, b.y);
        ctx.closePath();
        ctx.fill();
    });
}

// Draw city with two opposite sides
function drawCityTwoOpposite() {
    // Green field in middle
    ctx.fillStyle = "#a5c882";
    ctx.fillRect(0, TILE_SIZE/3, TILE_SIZE, TILE_SIZE/3);
    
    // Buildings on top strip
    const topBuildings = [
        { x: 8, y: 5, w: 15, h: 18 },
        { x: 28, y: 8, w: 18, h: 15 },
        { x: 50, y: 5, w: 18, h: 20 }
    ];
    
    // Buildings on bottom strip
    const bottomBuildings = [
        { x: 10, y: TILE_SIZE - 23, w: 18, h: 18 },
        { x: 35, y: TILE_SIZE - 20, w: 15, h: 15 },
        { x: 55, y: TILE_SIZE - 25, w: 15, h: 20 }
    ];
    
    // Draw all buildings
    [...topBuildings, ...bottomBuildings].forEach(b => {
        // Building base
        ctx.fillStyle = "#e8d4b0";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        // Timber frame details
        ctx.strokeStyle = "#654321";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w/2, b.y);
        ctx.lineTo(b.x + b.w/2, b.y + b.h);
        ctx.stroke();
        
        // Orange roof
        ctx.fillStyle = "#d2691e";
        if (b.y < TILE_SIZE/2) {
            // Top buildings
            ctx.beginPath();
            ctx.moveTo(b.x - 2, b.y);
            ctx.lineTo(b.x + b.w/2, b.y - b.h/3);
            ctx.lineTo(b.x + b.w + 2, b.y);
            ctx.closePath();
            ctx.fill();
        } else {
            // Bottom buildings - roof at bottom
            ctx.fillRect(b.x - 2, b.y + b.h - 5, b.w + 4, 5);
        }
    });
}

// Draw city with one side
function drawCityOne() {
    // Green field covers most of tile
    ctx.fillStyle = "#a5c882";
    ctx.fillRect(0, TILE_SIZE/3, TILE_SIZE, 2*TILE_SIZE/3);
    
    // Buildings along top edge
    const buildings = [
        { x: 10, y: 5, w: 18, h: 20 },
        { x: 35, y: 8, w: 20, h: 18 },
        { x: 60, y: 5, w: 12, h: 15 }
    ];
    
    // Draw curved city-field transition
    ctx.fillStyle = "#a5c882";
    ctx.beginPath();
    ctx.moveTo(0, TILE_SIZE/3);
    ctx.bezierCurveTo(TILE_SIZE/4, TILE_SIZE/4, 3*TILE_SIZE/4, TILE_SIZE/4, TILE_SIZE, TILE_SIZE/3);
    ctx.lineTo(TILE_SIZE, TILE_SIZE/3);
    ctx.lineTo(0, TILE_SIZE/3);
    ctx.closePath();
    ctx.fill();
    
    // Draw buildings
    buildings.forEach(b => {
        // Building base
        ctx.fillStyle = "#e8d4b0";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        // Timber frame
        ctx.strokeStyle = "#654321";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w/2, b.y);
        ctx.lineTo(b.x + b.w/2, b.y + b.h);
        ctx.moveTo(b.x, b.y + b.h*0.6);
        ctx.lineTo(b.x + b.w, b.y + b.h*0.6);
        ctx.stroke();
        
        // Orange roof
        ctx.fillStyle = "#d2691e";
        ctx.beginPath();
        ctx.moveTo(b.x - 2, b.y);
        ctx.lineTo(b.x + b.w/2, b.y - b.h/3);
        ctx.lineTo(b.x + b.w + 2, b.y);
        ctx.closePath();
        ctx.fill();
        
        // Windows
        if (b.w > 15) {
            ctx.fillStyle = "#2c2416";
            ctx.fillRect(b.x + 4, b.y + 8, 3, 3);
            ctx.fillRect(b.x + b.w - 7, b.y + 8, 3, 3);
        }
    });
}

// Draw city with road
function drawCityWithRoad() {
    // Green field on sides
    ctx.fillStyle = "#a5c882";
    ctx.fillRect(0, TILE_SIZE/3, TILE_SIZE/2 - 8, 2*TILE_SIZE/3);
    ctx.fillRect(TILE_SIZE/2 + 8, TILE_SIZE/3, TILE_SIZE/2 - 8, 2*TILE_SIZE/3);
    
    // Buildings along top with gate
    const buildings = [
        { x: 8, y: 5, w: 20, h: 20 },
        { x: 52, y: 5, w: 20, h: 20 }
    ];
    
    // Draw buildings
    buildings.forEach(b => {
        // Building base
        ctx.fillStyle = "#e8d4b0";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        // Timber frame
        ctx.strokeStyle = "#654321";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        
        // Orange roof
        ctx.fillStyle = "#d2691e";
        ctx.beginPath();
        ctx.moveTo(b.x - 2, b.y);
        ctx.lineTo(b.x + b.w/2, b.y - b.h/3);
        ctx.lineTo(b.x + b.w + 2, b.y);
        ctx.closePath();
        ctx.fill();
    });
    
    // City gate in center
    ctx.fillStyle = "#8b6f47";
    ctx.fillRect(TILE_SIZE/2 - 15, 5, 30, 25);
    
    // Gate arch
    ctx.fillStyle = "#2c2416";
    ctx.beginPath();
    ctx.arc(TILE_SIZE/2, 20, 8, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    
    // Road
    ctx.fillStyle = "#d4c4a0";
    ctx.fillRect(TILE_SIZE/2 - 8, 20, 16, TILE_SIZE - 20);
    
    // Road texture - stones
    ctx.strokeStyle = "#c0b090";
    ctx.lineWidth = 0.5;
    for (let y = 25; y < TILE_SIZE; y += 8) {
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE/2 - 8, y);
        ctx.lineTo(TILE_SIZE/2 + 8, y);
        ctx.stroke();
    }
}

// Draw monastery
function drawMonastery() {
    // Green field background already drawn
    
    // Monastery building - simple square with red roof
    ctx.fillStyle = "#e8d4b0";
    ctx.fillRect(TILE_SIZE/2 - 15, TILE_SIZE/2 - 15, 30, 30);
    
    // Building outline
    ctx.strokeStyle = "#a08870";
    ctx.lineWidth = 1;
    ctx.strokeRect(TILE_SIZE/2 - 15, TILE_SIZE/2 - 15, 30, 30);
    
    // Red roof
    ctx.fillStyle = "#b22222";
    ctx.beginPath();
    ctx.moveTo(TILE_SIZE/2 - 18, TILE_SIZE/2 - 15);
    ctx.lineTo(TILE_SIZE/2, TILE_SIZE/2 - 25);
    ctx.lineTo(TILE_SIZE/2 + 18, TILE_SIZE/2 - 15);
    ctx.closePath();
    ctx.fill();
    
    // Tower
    ctx.fillStyle = "#e8d4b0";
    ctx.fillRect(TILE_SIZE/2 - 5, TILE_SIZE/2 - 30, 10, 15);
    
    // Tower roof
    ctx.fillStyle = "#b22222";
    ctx.beginPath();
    ctx.moveTo(TILE_SIZE/2 - 6, TILE_SIZE/2 - 30);
    ctx.lineTo(TILE_SIZE/2, TILE_SIZE/2 - 35);
    ctx.lineTo(TILE_SIZE/2 + 6, TILE_SIZE/2 - 30);
    ctx.closePath();
    ctx.fill();
    
    // Cross
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(TILE_SIZE/2, TILE_SIZE/2 - 38);
    ctx.lineTo(TILE_SIZE/2, TILE_SIZE/2 - 33);
    ctx.moveTo(TILE_SIZE/2 - 2, TILE_SIZE/2 - 36);
    ctx.lineTo(TILE_SIZE/2 + 2, TILE_SIZE/2 - 36);
    ctx.stroke();
    
    // Door
    ctx.fillStyle = "#654321";
    ctx.fillRect(TILE_SIZE/2 - 3, TILE_SIZE/2 + 5, 6, 10);
    
    // Windows
    ctx.fillStyle = "#2c2416";
    ctx.fillRect(TILE_SIZE/2 - 10, TILE_SIZE/2 - 8, 3, 4);
    ctx.fillRect(TILE_SIZE/2 + 7, TILE_SIZE/2 - 8, 3, 4);
}

// Draw monastery with road
function drawMonasteryWithRoad() {
    // Road
    ctx.fillStyle = "#d4c4a0";
    ctx.fillRect(TILE_SIZE/2 - 8, TILE_SIZE/2 + 15, 16, TILE_SIZE/2 - 15);
    
    // Road texture
    ctx.strokeStyle = "#c0b090";
    ctx.lineWidth = 0.5;
    for (let y = TILE_SIZE/2 + 20; y < TILE_SIZE; y += 8) {
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE/2 - 8, y);
        ctx.lineTo(TILE_SIZE/2 + 8, y);
        ctx.stroke();
    }
    
    // Then monastery
    drawMonastery();
}

// Draw straight road
function drawRoadStraight() {
    // Green fields on sides
    ctx.fillStyle = "#a5c882";
    ctx.fillRect(0, 0, TILE_SIZE/2 - 8, TILE_SIZE);
    ctx.fillRect(TILE_SIZE/2 + 8, 0, TILE_SIZE/2 - 8, TILE_SIZE);
    
    // Road
    ctx.fillStyle = "#d4c4a0";
    ctx.fillRect(TILE_SIZE/2 - 8, 0, 16, TILE_SIZE);
    
    // Road texture - stone pattern
    ctx.strokeStyle = "#c0b090";
    ctx.lineWidth = 0.5;
    for (let y = 0; y < TILE_SIZE; y += 8) {
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE/2 - 8, y);
        ctx.lineTo(TILE_SIZE/2 + 8, y);
        ctx.stroke();
        
        // Vertical lines for stones
        if (y % 16 === 0) {
            ctx.beginPath();
            ctx.moveTo(TILE_SIZE/2 - 4, y);
            ctx.lineTo(TILE_SIZE/2 - 4, y + 8);
            ctx.moveTo(TILE_SIZE/2 + 4, y);
            ctx.lineTo(TILE_SIZE/2 + 4, y + 8);
            ctx.stroke();
        }
    }
}

// Draw curved road
function drawRoadCurve() {
    // Green field background already drawn
    
    // Road curve
    ctx.fillStyle = "#d4c4a0";
    ctx.beginPath();
    ctx.moveTo(TILE_SIZE/2 - 8, TILE_SIZE);
    ctx.lineTo(TILE_SIZE/2 - 8, TILE_SIZE/2 + 8);
    ctx.bezierCurveTo(TILE_SIZE/2 - 8, TILE_SIZE/2 - 8, TILE_SIZE/2 - 8, TILE_SIZE/2 - 8, TILE_SIZE/2 + 8, TILE_SIZE/2 - 8);
    ctx.lineTo(TILE_SIZE, TILE_SIZE/2 - 8);
    ctx.lineTo(TILE_SIZE, TILE_SIZE/2 + 8);
    ctx.bezierCurveTo(TILE_SIZE/2 + 8, TILE_SIZE/2 + 8, TILE_SIZE/2 + 8, TILE_SIZE/2 + 8, TILE_SIZE/2 + 8, TILE_SIZE);
    ctx.closePath();
    ctx.fill();
    
    // Road texture
    ctx.strokeStyle = "#c0b090";
    ctx.lineWidth = 0.5;
    
    // Draw curved stone lines
    for (let i = 0; i < 5; i++) {
        const offset = i * 16;
        ctx.beginPath();
        ctx.moveTo(TILE_SIZE/2, TILE_SIZE - offset);
        ctx.quadraticCurveTo(TILE_SIZE/2 + offset/2, TILE_SIZE/2 + offset/2, TILE_SIZE - offset, TILE_SIZE/2);
        ctx.stroke();
    }
}

// Draw three-way road
function drawRoadThree() {
    // Green field background with roads
    ctx.fillStyle = "#a5c882";
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    // Three roads
    ctx.fillStyle = "#d4c4a0";
    
    // Vertical road
    ctx.fillRect(TILE_SIZE/2 - 8, 0, 16, TILE_SIZE);
    
    // Left road  
    ctx.fillRect(0, TILE_SIZE/2 - 8, TILE_SIZE/2 + 8, 16);
    
    // Junction circle
    ctx.beginPath();
    ctx.arc(TILE_SIZE/2, TILE_SIZE/2, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Road texture
    ctx.strokeStyle = "#c0b090";
    ctx.lineWidth = 0.5;
    
    // Vertical road stones
    for (let y = 0; y < TILE_SIZE; y += 8) {
        if (Math.abs(y - TILE_SIZE/2) > 12) {
            ctx.beginPath();
            ctx.moveTo(TILE_SIZE/2 - 8, y);
            ctx.lineTo(TILE_SIZE/2 + 8, y);
            ctx.stroke();
        }
    }
    
    // Horizontal road stones
    for (let x = 0; x < TILE_SIZE/2; x += 8) {
        if (x < TILE_SIZE/2 - 12) {
            ctx.beginPath();
            ctx.moveTo(x, TILE_SIZE/2 - 8);
            ctx.lineTo(x, TILE_SIZE/2 + 8);
            ctx.stroke();
        }
    }
}

// Draw four-way road
function drawRoadFour() {
    // Green field in corners
    ctx.fillStyle = "#a5c882";
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    
    // Roads
    ctx.fillStyle = "#d4c4a0";
    
    // Vertical road
    ctx.fillRect(TILE_SIZE/2 - 8, 0, 16, TILE_SIZE);
    // Horizontal road
    ctx.fillRect(0, TILE_SIZE/2 - 8, TILE_SIZE, 16);
    
    // Junction circle
    ctx.beginPath();
    ctx.arc(TILE_SIZE/2, TILE_SIZE/2, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Road texture
    ctx.strokeStyle = "#c0b090";
    ctx.lineWidth = 0.5;
    
    // Draw stone pattern
    for (let i = 0; i < TILE_SIZE; i += 8) {
        // Vertical stones
        if (Math.abs(i - TILE_SIZE/2) > 12) {
            ctx.beginPath();
            ctx.moveTo(TILE_SIZE/2 - 8, i);
            ctx.lineTo(TILE_SIZE/2 + 8, i);
            ctx.stroke();
        }
        
        // Horizontal stones
        if (Math.abs(i - TILE_SIZE/2) > 12) {
            ctx.beginPath();
            ctx.moveTo(i, TILE_SIZE/2 - 8);
            ctx.lineTo(i, TILE_SIZE/2 + 8);
            ctx.stroke();
        }
    }
    
    // Center well or decoration
    ctx.fillStyle = "#8b7355";
    ctx.beginPath();
    ctx.arc(TILE_SIZE/2, TILE_SIZE/2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawField() {
    // Empty - using images
}
*/

// Draw player
function drawPlayer() {
    const x = player.x - cameraX;
    const y = player.y - cameraY;
    
    // Player circle
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Player outline
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
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
    
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();
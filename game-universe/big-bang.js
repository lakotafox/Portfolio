// Big Bang - World/Map Creation and Game Initialization
import { Camera } from '../game-engine/camera/camera.js';
import { player, updatePlayer, drawPlayer } from './player-birth.js';
import { COMPACT_MAP, TILE_DEFS } from './game-map.js';
// ProjectManager is loaded as a global from projects-global.js

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

console.log('Canvas size:', canvas.width, 'x', canvas.height);

// Game constants
const TILE_SIZE = 80;
const GRID_SIZE = 15; // 15x15 grid

// Camera instance
export const camera = new Camera();

// Keyboard state
const keys = {};

// Tile types definitions
const TILE_TYPES = {
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

// Preload all tile images
const tileImages = {};
const imageLoadPromises = [];
let flagImage = null;

// Map grid
const mapGrid = [];
for (let y = 0; y < GRID_SIZE; y++) {
    mapGrid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        mapGrid[y][x] = null;
    }
}

// Load all tile images
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
    img.src = `../build-with-gui/carc-map-mkr/tiles/${imageName}`;
    imageLoadPromises.push(promise);
});

// Load flag image
const flagImg = new Image();
const flagPromise = new Promise((resolve) => {
    flagImg.onload = () => {
        flagImage = flagImg;
        resolve();
    };
    flagImg.onerror = () => {
        console.error('Failed to load flag image');
        resolve();
    };
});
flagImg.src = '../build-with-gui/carc-map-mkr/tiles/flag.png';
imageLoadPromises.push(flagPromise);

//FUNC Expand compact map to verbose format
function expandCompactMap(compactMap, tileDefs) {
    return {
        grid: compactMap.map(row => 
            row.map(cell => {
                const [tileId, rotation = 0] = Array.isArray(cell) ? cell : [cell, 0];
                const tileDef = tileDefs[tileId];
                
                if (!tileDef) {
                    console.error(`Unknown tile ID: ${tileId}`);
                    return {
                        tile: "Grass 1",
                        file: "grass1.jpeg",
                        rotation: 0
                    };
                }
                
                return {
                    tile: tileDef.tile,
                    file: tileDef.file,
                    rotation: rotation
                };
            })
        )
    };
}

//FUNC Generate map with tiles
function generateMap() {
    console.log('Generating map from compact data...');
    const mapData = expandCompactMap(COMPACT_MAP, TILE_DEFS);
    
    if (mapData && mapData.grid) {
        console.log('Map data found, loading tiles...');
        // Load from map data
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (mapData.grid[y] && mapData.grid[y][x]) {
                    const cellData = mapData.grid[y][x];
                    mapGrid[y][x] = {
                        type: { type: cellData.tile.toLowerCase().replace(/ /g, '_') },
                        rotation: cellData.rotation || 0,
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
        console.log('Map loaded, first tile:', mapGrid[0][0]);
        console.log('Total tiles loaded:', GRID_SIZE * GRID_SIZE);
    } else {
        console.log('No map data found!');
    } 
    
    // Place projects at their specific coordinates
    ProjectManager.projects.forEach(project => {
        if (mapGrid[project.y] && mapGrid[project.y][project.x]) {
            mapGrid[project.y][project.x].project = project;
        }
    });
}

//FUNC Draw a single Carcassonne tile
function drawTile(tile, x, y) {
    const screenX = x * TILE_SIZE - camera.x;
    const screenY = y * TILE_SIZE - camera.y;
    
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
        // Fallback
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    }
    
    // Draw project marker if this tile has a project
    if (tile.project) {
        ctx.save();
        ctx.translate(TILE_SIZE/2, TILE_SIZE/2);
        ctx.rotate(-tile.rotation * Math.PI / 180);
        
        // Draw flag if loaded, otherwise fallback to circle
        if (flagImage) {
            // Draw flag centered on tile (we're already translated to center)
            const flagWidth = 40;
            const flagHeight = 50;
            ctx.drawImage(flagImage, -flagWidth/2, -flagHeight/2 - 5, flagWidth, flagHeight);
        } else {
            // Original circle fallback
            ctx.fillStyle = tile.project.color;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(tile.project.name.charAt(0).toUpperCase(), 0, 0);
        }
        
        ctx.restore();
    }
    
    ctx.restore();
}

// Initialize ProjectManager DOM elements after page loads
window.addEventListener('DOMContentLoaded', () => {
    ProjectManager.initDOM();
});

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Handle ENTER key for interaction
    if (e.key === 'Enter') {
        if (ProjectManager.markingMode) {
            // Mark current location
            ProjectManager.markLocation(player.x, player.y, TILE_SIZE);
        } else if (ProjectManager.currentProject) {
            // View project
            if (ProjectManager.currentProject.url === 'projects/mincoins/mincoins-area.html') {
                window.location.href = ProjectManager.currentProject.url;
            } else {
                // For now, show alert for placeholder projects
                alert(`Project: ${ProjectManager.currentProject.name}\n\n${ProjectManager.currentProject.desc}\n\n(This is a placeholder - actual project coming soon!)`);
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    
    // Exit project view on ESC
    if (e.key === 'Escape' && ProjectManager.currentProject) {
        ProjectManager.exitProject();
    }
});

//FUNC Main game loop
function gameLoop() {
    // Update
    updatePlayer(keys, mapGrid);
    camera.updateToFollowPlayer(player, canvas);
    
    // Draw
    ctx.fillStyle = '#1a1a1a'; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all tiles
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = mapGrid[y][x];
            if (tile) {
                drawTile(tile, x, y);
            }
        }
    }
    
    // Draw player
    drawPlayer(ctx, camera);
    
    // Draw marking mode UI if active
    if (ProjectManager.markingMode) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('MARKING MODE - Press ENTER to mark project location', 10, 30);
    }
    
    requestAnimationFrame(gameLoop);
}

// Start game after images are loaded
Promise.all(imageLoadPromises).then(() => {
    console.log('All tile images loaded, count:', Object.keys(tileImages).length);
    console.log('First few images:', Object.keys(tileImages).slice(0, 5));
    generateMap();
    gameLoop();
}).catch(err => {
    console.error('Error loading images:', err);
    generateMap();
    gameLoop(); // Start anyway with fallback rendering
});

// Exports
export { 
    canvas, 
    ctx, 
    TILE_SIZE, 
    GRID_SIZE, 
    keys, 
    mapGrid, 
    drawTile,
    generateMap,
    imageLoadPromises
};
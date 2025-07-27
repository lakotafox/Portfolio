// Project Marker Tool - Simple player movement version
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game constants
const TILE_SIZE = 80;
const GRID_SIZE = 15;
const PLAYER_SIZE = 20;

// Player state
let playerX = 7; // Start in center
let playerY = 7;

// Camera state
let cameraX = 0;
let cameraY = 0;

// Map data
let mapData = null;
let tileImages = {};

// Marked locations
let markedLocations = [];

// Player sprite
let playerImage = null;
const playerImg = new Image();
playerImg.src = '../../carc-map-mkr/tiles/player-down.png';
playerImg.onload = () => {
    playerImage = playerImg;
    render();
};

// Flag image for markers
let flagImage = null;
const flagImg = new Image();
flagImg.src = '../../carc-map-mkr/tiles/flag.png';
flagImg.onload = () => {
    flagImage = flagImg;
    render();
};

// Load tile images
const tilesToLoad = [
    'grass1.jpeg', 'grass2.jpeg', 'grass3.jpeg',
    'CastleCenter0.png', 'CastleEdge0.png', 'CastleEdge1.png', 'CastleEdge2.png', 'CastleEdge3.png',
    'CastleWall0.png', 'CastleWall1.png', 'CastleWall2.png', 'CastleWall3.png',
    'CastleSides0.png', 'CastleSides1.png', 'CastleTube0.png', 'CastleTube1.png',
    'CastleEdgeRoad0.png', 'CastleEdgeRoad1.png', 'CastleEdgeRoad2.png', 'CastleEdgeRoad3.png',
    'CastleSidesEdge0.png', 'CastleSidesEdge1.png', 'CastleSidesEdge2.png', 'CastleSidesEdge3.png',
    'Monastery0.png', 'MonasteryRoad0.png', 'MonasteryRoad1.png', 'MonasteryRoad2.png', 'MonasteryRoad3.png',
    'Road0.png', 'Road1.png', 'RoadCurve0.png', 'RoadCurve1.png', 'RoadCurve2.png', 'RoadCurve3.png',
    'RoadJunctionSmall0.png', 'RoadJunctionSmall1.png', 'RoadJunctionSmall2.png', 'RoadJunctionSmall3.png',
    'RoadJunctionLarge0.png'
];

// Load all tile images
tilesToLoad.forEach(filename => {
    const img = new Image();
    img.onload = () => {
        tileImages[filename] = img;
        render();
    };
    img.src = `../../carc-map-mkr/tiles/${filename}`;
});

// Load map data
const script = document.createElement('script');
script.src = '../../carc-map-mkr/output/exported-map-compact.js';
script.onload = () => {
    if (typeof COMPACT_MAP !== 'undefined' && typeof TILE_DEFS !== 'undefined') {
        mapData = expandCompactMap(COMPACT_MAP, TILE_DEFS);
        
        // Load existing project markers
        loadExistingProjects();
        
        updateCamera();
        render();
    }
};
document.head.appendChild(script);

// Expand compact map format
function expandCompactMap(compactMap, tileDefs) {
    return {
        grid: compactMap.map(row => 
            row.map(cell => {
                const [tileId, rotation = 0] = Array.isArray(cell) ? cell : [cell, 0];
                const tileDef = tileDefs[tileId];
                
                if (!tileDef) {
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

// Load existing project locations
function loadExistingProjects() {
    // First try to load saved marked locations
    const markedScript = document.createElement('script');
    markedScript.src = '../output/marked-locations.js';
    markedScript.onload = () => {
        if (typeof MARKED_LOCATIONS !== 'undefined' && MARKED_LOCATIONS.length > 0) {
            markedLocations = MARKED_LOCATIONS.map(loc => ({...loc}));
            updateMarkedList();
            render();
            console.log('Loaded saved marked locations:', markedLocations.length);
        } else {
            // If no saved marks, load from projects-global.js
            loadFromProjectsGlobal();
        }
    };
    markedScript.onerror = () => {
        // If file doesn't exist, load from projects-global.js
        loadFromProjectsGlobal();
    };
    document.head.appendChild(markedScript);
}

// Load from projects-global.js as fallback
function loadFromProjectsGlobal() {
    const projectScript = document.createElement('script');
    projectScript.src = '../../../../game-engine/projects/projects-global.js';
    projectScript.onload = () => {
        if (typeof ProjectManager !== 'undefined' && ProjectManager.projects) {
            // Extract just the x,y coordinates
            markedLocations = ProjectManager.projects.map(p => ({
                x: p.x,
                y: p.y
            }));
            updateMarkedList();
            render();
            console.log('Loaded project locations from projects-global.js');
        }
    };
    projectScript.onerror = () => {
        console.log('No existing projects found');
    };
    document.head.appendChild(projectScript);
}

// Update camera to follow player
function updateCamera() {
    cameraX = playerX * TILE_SIZE + TILE_SIZE/2 - canvas.width/2;
    cameraY = playerY * TILE_SIZE + TILE_SIZE/2 - canvas.height/2;
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    let moved = false;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (playerY > 0) {
                playerY--;
                moved = true;
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (playerY < GRID_SIZE - 1) {
                playerY++;
                moved = true;
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (playerX > 0) {
                playerX--;
                moved = true;
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (playerX < GRID_SIZE - 1) {
                playerX++;
                moved = true;
            }
            break;
        case 'Enter':
            toggleMark();
            break;
        case 'e':
        case 'E':
            exportMarkedLocations();
            break;
    }
    
    if (moved) {
        updateCamera();
        updatePosition();
        render();
    }
});

// Toggle mark at current position
function toggleMark() {
    if (!mapData) return;
    
    // Check if already marked
    const index = markedLocations.findIndex(loc => loc.x === playerX && loc.y === playerY);
    
    if (index !== -1) {
        // Remove mark
        markedLocations.splice(index, 1);
    } else {
        // Add mark
        markedLocations.push({ x: playerX, y: playerY });
    }
    
    updateMarkedList();
    render();
}

// Update position display
function updatePosition() {
    document.getElementById('position').textContent = `${playerX}, ${playerY}`;
}

// Update marked list display
function updateMarkedList() {
    document.getElementById('markedCount').textContent = markedLocations.length;
    
    const listDiv = document.getElementById('markedItems');
    if (markedLocations.length === 0) {
        listDiv.innerHTML = '<p>No locations marked</p>';
    } else {
        listDiv.innerHTML = markedLocations.map(loc => 
            `<div>Tile at (${loc.x}, ${loc.y})</div>`
        ).join('');
    }
}

// Render the game
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context
    ctx.save();
    
    // Apply camera transform
    ctx.translate(-cameraX, -cameraY);
    
    // Draw map
    if (mapData && mapData.grid) {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = mapData.grid[y][x];
                if (tile && tileImages[tile.file]) {
                    ctx.save();
                    ctx.translate(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2);
                    ctx.rotate(tile.rotation * Math.PI / 180);
                    ctx.drawImage(
                        tileImages[tile.file],
                        -TILE_SIZE/2, -TILE_SIZE/2,
                        TILE_SIZE, TILE_SIZE
                    );
                    ctx.restore();
                }
            }
        }
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, GRID_SIZE * TILE_SIZE);
        ctx.stroke();
    }
    for (let y = 0; y <= GRID_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(GRID_SIZE * TILE_SIZE, y * TILE_SIZE);
        ctx.stroke();
    }
    
    // Draw marked locations
    markedLocations.forEach(loc => {
        const x = loc.x * TILE_SIZE + TILE_SIZE/2;
        const y = loc.y * TILE_SIZE + TILE_SIZE/2;
        
        if (flagImage) {
            ctx.drawImage(flagImage, x - 20, y - 30, 40, 40);
        } else {
            // Fallback circle
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw X marker
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 10);
        ctx.lineTo(x + 10, y + 10);
        ctx.moveTo(x + 10, y - 10);
        ctx.lineTo(x - 10, y + 10);
        ctx.stroke();
    });
    
    // Draw player
    const px = playerX * TILE_SIZE + TILE_SIZE/2;
    const py = playerY * TILE_SIZE + TILE_SIZE/2;
    
    if (playerImage) {
        ctx.drawImage(playerImage, px - PLAYER_SIZE/2, py - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
    } else {
        // Fallback square
        ctx.fillStyle = '#3498db';
        ctx.fillRect(px - PLAYER_SIZE/2, py - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
    }
    
    // Restore context
    ctx.restore();
}

// Export marked locations
function exportMarkedLocations() {
    if (markedLocations.length === 0) {
        alert('No locations marked!');
        return;
    }
    
    // Create file content
    const fileContent = `// Marked tile locations
// Generated by Project Marker Tool on ${new Date().toLocaleString()}
// Total locations: ${markedLocations.length}

const MARKED_LOCATIONS = ${JSON.stringify(markedLocations, null, 4)};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MARKED_LOCATIONS;
}`;
    
    // Show in window only
    const exportWindow = window.open('', 'Export Locations', 'width=800,height=600');
    exportWindow.document.write(`
        <html>
        <head>
            <title>Marked Locations Export</title>
            <style>
                body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
                pre { background: #2a2a2a; padding: 20px; border-radius: 5px; overflow: auto; }
                button { background: #3498db; color: white; border: none; padding: 10px 20px; margin: 10px; cursor: pointer; border-radius: 5px; }
                button:hover { background: #2980b9; }
                .info { color: #f39c12; margin-bottom: 20px; }
                .success { color: #27ae60; }
            </style>
        </head>
        <body>
            <h2>Marked Tile Locations</h2>
            <div class="info">
                <p>These are the tiles you marked. Copy this code to save your marks.</p>
                <p>Total locations marked: ${markedLocations.length}</p>
                <p class="success">Save this to: build-with-gui/project-marker/output/marked-locations.js</p>
            </div>
            <button onclick="navigator.clipboard.writeText(document.getElementById('code').textContent).then(() => alert('Copied to clipboard!'))">Copy to Clipboard</button>
            <button onclick="window.close()">Close</button>
            <pre id="code">${fileContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </body>
        </html>
    `);
}

// Make export function available globally
window.exportMarkedLocations = exportMarkedLocations;

// Initialize position display
updatePosition();
updateMarkedList();
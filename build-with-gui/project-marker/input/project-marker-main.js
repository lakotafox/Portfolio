// project Marker Tool - Simple player movement version
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// game constants
const TILE_SIZE = 80;
const GRID_SIZE = 15;
const PLAYER_SIZE = 20;

// player state
let playerX = 7; // start in center
let playerY = 7;

// camera state
let cameraX = 0;
let cameraY = 0;

// map data
let mapData = null;
let tileImages = {};

// marked locations
let markedLocations = [];

// player sprite
let playerImage = null;
const playerImg = new Image();
playerImg.src = '../../../game-engine/player/sprites/player-down.png';
playerImg.onload = () => {
    playerImage = playerImg;
    render();
};

// flag image for markers
let flagImage = null;
const flagImg = new Image();
flagImg.src = '../../carc-map-mkr/tiles/flag.png';
flagImg.onload = () => {
    flagImage = flagImg;
    render();
};

// load tile images
const tilesToLoad = [
    // grass tiles
    'grass1.png', 'grass2.png', 'grass3.png', 'grass4.png', 'grass5.png',
    
    // c3 tiles
    'tile_A.png', 'tile_B.png', 'tile_C.png', 'tile_D.png', 'tile_E.png',
    'tile_F.png', 'tile_G.png', 'tile_H.png', 'tile_I.png', 'tile_J.png',
    'tile_K.png', 'tile_M.png', 'tile_N.png', 'tile_O.png', 'tile_P.png',
    'tile_Q.png', 'tile_R.png', 'tile_S.png', 'tile_T.png', 'tile_U.png',
    'tile_V.png', 'tile_W.png', 'tile_X.png', 'tile_Y.png',
    
    // water tiles
    'watertile_A.png', 'watertile_B.png', 'watertile_C.png', 'watertile_D.png',
    'watertile_E.png', 'watertile_F.png', 'watertile_G.png', 'watertile_H.png',
    'watertile_I.png', 'watertile_J.png', 'watertile_K.png', 'watertile_M.png',
    'watertile_N.png', 'watertile_O.png', 'watertile_P.png'
];

// load all tile images
tilesToLoad.forEach(filename => {
    const img = new Image();
    img.onload = () => {
        tileImages[filename] = img;
        console.log(`Loaded tile: ${filename}`);
        render();
    };
    img.onerror = () => {
        console.error(`Failed to load tile: ${filename}`);
    };
    img.src = `../../carc-map-mkr/tiles/${filename}`;
});

// load map data from a script tag that we'll add to HTML
// this avoids CORS issues with ES6 modules
window.addEventListener('mapDataReady', () => {
    console.log('Map data ready event fired');
    console.log('COMPACT_MAP:', window.COMPACT_MAP);
    console.log('TILE_DEFS:', window.TILE_DEFS);
    
    if (window.COMPACT_MAP && window.TILE_DEFS) {
        mapData = expandCompactMap(window.COMPACT_MAP, window.TILE_DEFS);
        console.log('Map data expanded:', mapData);
        
        // load existing project markers
        loadExistingProjects();
        
        updateCamera();
        render();
    } else {
        console.error('Map data not found!');
    }
});

// expand compact map format
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

// load existing project locations
function loadExistingProjects() {
    // first try to load saved marked locations
    const markedScript = document.createElement('script');
    markedScript.src = '../output/marked-locations.js';
    markedScript.onload = () => {
        if (typeof MARKED_LOCATIONS !== 'undefined' && MARKED_LOCATIONS.length > 0) {
            markedLocations = MARKED_LOCATIONS.map(loc => ({...loc}));
            updateMarkedList();
            render();
            console.log('Loaded saved marked locations:', markedLocations.length);
        } else {
            // if no saved marks, load from projects-global.js
            loadFromProjectsGlobal();
        }
    };
    markedScript.onerror = () => {
        // if file doesn't exist, load from projects-global.js
        loadFromProjectsGlobal();
    };
    document.head.appendChild(markedScript);
}

// load from projects-global.js as fallback
function loadFromProjectsGlobal() {
    const projectScript = document.createElement('script');
    projectScript.src = '../../../game-engine/projects/projects-global.js';
    projectScript.onload = () => {
        if (typeof ProjectManager !== 'undefined' && ProjectManager.projects) {
            // extract just the x,y coordinates
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

// update camera to follow player
function updateCamera() {
    cameraX = playerX * TILE_SIZE + TILE_SIZE/2 - canvas.width/2;
    cameraY = playerY * TILE_SIZE + TILE_SIZE/2 - canvas.height/2;
}

// keyboard controls
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

// toggle mark at current position
function toggleMark() {
    if (!mapData) return;
    
    // check if already marked
    const index = markedLocations.findIndex(loc => loc.x === playerX && loc.y === playerY);
    
    if (index !== -1) {
        // remove mark
        markedLocations.splice(index, 1);
    } else {
        // add mark
        markedLocations.push({ x: playerX, y: playerY });
    }
    
    updateMarkedList();
    render();
}

// update position display
function updatePosition() {
    document.getElementById('position').textContent = `${playerX}, ${playerY}`;
}

// update marked list display
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

// render the game
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // save context
    ctx.save();
    
    // apply camera transform
    ctx.translate(-cameraX, -cameraY);
    
    // draw map
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
    
    // draw grid
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
    
    // draw marked locations
    markedLocations.forEach(loc => {
        const x = loc.x * TILE_SIZE + TILE_SIZE/2;
        const y = loc.y * TILE_SIZE + TILE_SIZE/2;
        
        if (flagImage) {
            ctx.drawImage(flagImage, x - 20, y - 30, 40, 40);
        } else {
            // fallback circle
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // draw X marker
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 10);
        ctx.lineTo(x + 10, y + 10);
        ctx.moveTo(x + 10, y - 10);
        ctx.lineTo(x - 10, y + 10);
        ctx.stroke();
    });
    
    // draw player
    const px = playerX * TILE_SIZE + TILE_SIZE/2;
    const py = playerY * TILE_SIZE + TILE_SIZE/2;
    
    if (playerImage) {
        ctx.drawImage(playerImage, px - PLAYER_SIZE/2, py - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
    } else {
        // fallback square
        ctx.fillStyle = '#3498db';
        ctx.fillRect(px - PLAYER_SIZE/2, py - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
    }
    
    // restore context
    ctx.restore();
}

// export marked locations
function exportMarkedLocations() {
    if (markedLocations.length === 0) {
        alert('No locations marked!');
        return;
    }
    
    // create file content
    const fileContent = `// marked tile locations
// generated by Project Marker Tool on ${new Date().toLocaleString()}
// total locations: ${markedLocations.length}

const MARKED_LOCATIONS = ${JSON.stringify(markedLocations, null, 4)};

// export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MARKED_LOCATIONS;
}`;
    
    // show in window only
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

// make export function available globally
window.exportMarkedLocations = exportMarkedLocations;

// initialize position display
updatePosition();
updateMarkedList();

// fallback initialization after 2 seconds if map data hasn't loaded
setTimeout(() => {
    if (!mapData) {
        console.log('Fallback: Trying to load map data...');
        if (window.COMPACT_MAP && window.TILE_DEFS) {
            console.log('Found map data in fallback!');
            mapData = expandCompactMap(window.COMPACT_MAP, window.TILE_DEFS);
            loadExistingProjects();
            updateCamera();
            render();
        } else {
            console.error('No map data available even in fallback!');
        }
    }
}, 2000);
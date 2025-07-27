
/* COMMENTED OUT - TESTING REFACTORED VERSION

// development note: this builder was created through an iterative process
// with ai assistance. it took several attempts to get functionality working smoothly. we had to work

// the result is a functional visual editor that makes map creation much

// easier than editing json by hand!... for me at least.

// canvas setup - main drawing surface for the map editor
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

// constants for tile and grid dimensions
const TILE_SIZE = 80; // size of each tile in pixels
const GRID_SIZE = 15; // 15x15 grid for the map

// editor state variables
let selectedTile = null; // currently selected tile from palette
let selectedRotation = 0; // rotation angle (0, 90, 180, 270)
let mapGrid = []; // 2d array storing the map layout
let tileImages = {}; // cache for loaded tile images
let mouseX = 0; // current mouse x position
let mouseY = 0; // current mouse y position  
let zoom = 1; // zoom level for the map view

// initialize map with random grass tiles for variety
for (let y = 0; y < GRID_SIZE; y++) {
    mapGrid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        // randomly choose between grass1, grass2, grass3
        const grassTypes = [
            { name: 'Grass 1', file: 'grass1.jpeg', type: 'field' },
            { name: 'Grass 2', file: 'grass2.jpeg', type: 'field' },
            { name: 'Grass 3', file: 'grass3.jpeg', type: 'field' }
        ];
        const randomGrass = grassTypes[Math.floor(Math.random() * 3)];
        
        mapGrid[y][x] = {
            tile: randomGrass,
            rotation: 0
        };
    }
}

// all available tiles organized by category
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
    
    // city edges alt - alternative edge designs
    { name: 'City Edge Alt ↑', file: 'CastleSidesEdge0.png', type: 'city' },
    { name: 'City Edge Alt →', file: 'CastleSidesEdge1.png', type: 'city' },
    { name: 'City Edge Alt ↓', file: 'CastleSidesEdge2.png', type: 'city' },
    { name: 'City Edge Alt ←', file: 'CastleSidesEdge3.png', type: 'city' }
];

// set canvas size based on grid and zoom level
//FUNC
function resizeCanvas() {
    canvas.width = (GRID_SIZE * TILE_SIZE * zoom);
    canvas.height = (GRID_SIZE * TILE_SIZE * zoom);
    drawMap(); // redraw after resize
}

// load tile images and create palette ui
//FUNC
function loadTileImages() {
    const tileGrid = document.getElementById('tileGrid'); // palette container
    
    TILE_TYPES.forEach((tileType, index) => {
        // create tile option in palette
        const tileOption = document.createElement('div');
        tileOption.className = 'tile-option';
        tileOption.onclick = () => selectTile(tileType, index); // click to select
        
        const img = document.createElement('img');
        img.src = `../tiles/${tileType.file}`;
        
        const label = document.createElement('div');
        label.className = 'tile-label';
        label.textContent = tileType.name;
        
        tileOption.appendChild(img);
        tileOption.appendChild(label);
        tileGrid.appendChild(tileOption);
        
        // load image for canvas rendering
        const canvasImg = new Image();
        canvasImg.onload = () => {
            tileImages[tileType.file] = canvasImg; // cache the image
            if (Object.keys(tileImages).length === TILE_TYPES.length) {
                drawMap(); // draw map when all images loaded
            }
        };
        canvasImg.src = `../tiles/${tileType.file}`;
    });
}

// select a tile from palette
//FUNC
function selectTile(tileType, index) {
    selectedTile = tileType;
    
    // update ui to show selection
    document.querySelectorAll('.tile-option').forEach((el, i) => {
        el.classList.toggle('selected', i === index);
    });
    
    document.getElementById('selectedTileName').textContent = tileType.name;
    
    // update preview panel with selected tile
    const preview = document.getElementById('previewTile');
    const previewImg = document.getElementById('previewImg');
    previewImg.src = `../tiles/${tileType.file}`;
    preview.style.display = 'block'; // show preview
}

// canvas mouse events - track mouse and show tile preview
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // update preview position to follow mouse
    const preview = document.getElementById('previewTile');
    if (selectedTile && preview.style.display === 'block') {
        preview.style.left = (e.clientX - 40) + 'px';
        preview.style.top = (e.clientY - 40) + 'px';
        preview.style.transform = `rotate(${selectedRotation}deg)`; // apply rotation
    }
});

// left click to place selected tile on map
canvas.addEventListener('click', (e) => {
    if (!selectedTile) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE * zoom));
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE * zoom));
    
    // place tile if within grid bounds
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        mapGrid[y][x] = {
            tile: selectedTile,
            rotation: selectedRotation
        };
        drawMap(); // redraw map with new tile
    }
});

// right click to remove tile from map
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // prevent browser context menu
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE * zoom));
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE * zoom));
    
    // remove tile if within grid bounds
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        mapGrid[y][x] = null;
        drawMap();
    }
});

// rotation controls - rotate selected tile before placing
//FUNC
function rotateSelection(degrees) {
    selectedRotation = (selectedRotation + degrees + 360) % 360; // keep between 0-359
}

// set rotation directly (used by rotation buttons)
//FUNC
function setRotation(degrees) {
    selectedRotation = degrees;
}

// draw the map - renders grid and all placed tiles
//FUNC
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // draw grid background (dark grey)
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // draw grid lines (lighter grey)
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * TILE_SIZE * zoom, 0);
        ctx.lineTo(i * TILE_SIZE * zoom, GRID_SIZE * TILE_SIZE * zoom);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * TILE_SIZE * zoom);
        ctx.lineTo(GRID_SIZE * TILE_SIZE * zoom, i * TILE_SIZE * zoom);
        ctx.stroke();
    }
    
    // draw tiles on the grid
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = mapGrid[y][x];
            if (cell && tileImages[cell.tile.file]) {
                ctx.save();
                // translate to tile center for rotation
                ctx.translate(x * TILE_SIZE * zoom + TILE_SIZE * zoom / 2, y * TILE_SIZE * zoom + TILE_SIZE * zoom / 2);
                ctx.rotate(cell.rotation * Math.PI / 180); // apply rotation
                ctx.drawImage(
                    tileImages[cell.tile.file],
                    -TILE_SIZE * zoom / 2,
                    -TILE_SIZE * zoom / 2,
                    TILE_SIZE * zoom,
                    TILE_SIZE * zoom
                );
                ctx.restore();
            }
        }
    }
}

// map operations - utility functions for map editing
// clear all tiles from the map
//FUNC
function clearMap() {
    if (confirm('Clear the entire map?')) {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                mapGrid[y][x] = null;
            }
        }
        drawMap();
    }
}

// fill empty spaces with random grass tiles
//FUNC
function fillEmpty() {
    const grassTypes = [
        TILE_TYPES.find(t => t.name === 'Grass 1'),
        TILE_TYPES.find(t => t.name === 'Grass 2'),
        TILE_TYPES.find(t => t.name === 'Grass 3')
    ];
    
    // only fill cells that are currently empty
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (!mapGrid[y][x]) {
                const randomGrass = grassTypes[Math.floor(Math.random() * 3)];
                mapGrid[y][x] = {
                    tile: randomGrass,
                    rotation: 0
                };
            }
        }
    }
    drawMap();
}

// Tile name to compact ID mapping
const TILE_ID_MAP = {
    // Grass
    'Grass 1': 'g1',
    'Grass 2': 'g2', 
    'Grass 3': 'g3',
    'Empty (Grey)': 'empty',
    
    // Roads
    'Road ↔': 'roadH',
    'Road ↕': 'roadV',
    'Road Curve ↓→': 'roadL',
    'Road Curve ←↓': 'roadJ',
    'Road Curve ↑←': 'road7',
    'Road Curve →↑': 'roadr',
    'Road T ↑←→': 'roadT1',
    'Road T ↑↓→': 'roadT2',
    'Road T ←↓→': 'roadT3',
    'Road T ↑↓←': 'roadT4',
    'Road Cross +': 'road4',
    
    // Cities
    'City Full': 'city',
    'City Edge ↑': 'cityN',
    'City Edge →': 'cityE',
    'City Edge ↓': 'cityS',
    'City Edge ←': 'cityW',
    'City 3-Way ↑←→': 'city3N',
    'City 3-Way ↑↓→': 'city3E',
    'City 3-Way ←↓→': 'city3S',
    'City 3-Way ↑↓←': 'city3W',
    'City Corner ↑→': 'cityNE',
    'City Corner ↓←': 'citySW',
    'City Opposite ↕': 'cityV',
    'City Opposite ↔': 'cityH',
    
    // City + Road
    'City+Road ↑↓': 'cityRoadV',
    'City+Road →←': 'cityRoadH',
    'City+Road ↓↑': 'cityRoadV2',
    'City+Road ←→': 'cityRoadH2',
    
    // City Edge Alts
    'City Edge Alt ↑': 'cityAltN',
    'City Edge Alt →': 'cityAltE',
    'City Edge Alt ↓': 'cityAltS',
    'City Edge Alt ←': 'cityAltW',
    
    // Monastery
    'Monastery': 'monastery',
    'Monastery + Road ↓': 'monasteryS',
    'Monastery + Road ←': 'monasteryW',
    'Monastery + Road ↑': 'monasteryN',
    'Monastery + Road →': 'monasteryE'
};


// export map as COMPACT format for game-map.js

//FUNC
function exportMap() {
    // Convert to compact format
    const compactMap = mapGrid.map(row => 
        row.map(cell => {
            if (!cell) return 'g1'; // Default to grass1
            
            const tileId = TILE_ID_MAP[cell.tile.name] || 'g1';
            
            // Only include rotation if it's not 0
            if (cell.rotation && cell.rotation !== 0) {
                return [tileId, cell.rotation];
            }
            return tileId;
        })
    );
    
    // Generate the code for game-map.js
    const mapCode = `// Map data exported from Map Maker
const MAP = [
${compactMap.map((row, i) => 
    `  // Row ${i}\n  [${row.map(cell => 
        Array.isArray(cell) ? `['${cell[0]}',${cell[1]}]` : `'${cell}'`
    ).join(', ')}]`
).join(',\n')}
];`;
    
    document.getElementById('mapData').value = mapCode;
    document.getElementById('exportArea').style.display = 'block';
}

// copy exported json to clipboard
//FUNC
function copyToClipboard() {
    const textarea = document.getElementById('mapData');
    textarea.select();
    document.execCommand('copy');
    alert('Map data copied to clipboard!');
}

// save map to browser local storage
//FUNC
function saveToLocal() {
    const mapData = {
        grid: mapGrid.map(row => 
            row.map(cell => cell ? {
                tile: cell.tile.name,
                file: cell.tile.file,
                rotation: cell.rotation
            } : null)
        )
    };
    
    localStorage.setItem('carcassonneMap', JSON.stringify(mapData));
    alert('Map saved to browser storage!');
}

// load map from browser local storage
//FUNC
function loadFromLocal() {
    const saved = localStorage.getItem('carcassonneMap');
    if (saved) {
        try {
            const mapData = JSON.parse(saved);
            
            // rebuild mapGrid from saved data
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (mapData.grid[y] && mapData.grid[y][x]) {
                        const cellData = mapData.grid[y][x];
                        const tileType = TILE_TYPES.find(t => t.name === cellData.tile);
                        if (tileType) {
                            mapGrid[y][x] = {
                                tile: tileType,
                                rotation: cellData.rotation
                            };
                        }
                    } else {
                        mapGrid[y][x] = null;
                    }
                }
            }
            
            drawMap();
            alert('Map loaded from browser storage!');
        } catch (e) {
            alert('Error loading saved map!');
        }
    } else {
        alert('No saved map found!');
    }
}

// Zoom with mouse wheel
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom = Math.max(0.5, Math.min(2, zoom * delta));
    resizeCanvas();
});

// Toggle controls panel
//FUNC
function toggleControls() {
    const panel = document.getElementById('controlsPanel');
    const btn = document.querySelector('.collapse-btn');
    
    panel.classList.toggle('collapsed');
    
    if (panel.classList.contains('collapsed')) {
        btn.textContent = '+';
    } else {
        btn.textContent = '−';
    }
}

// Initialize
loadTileImages();
resizeCanvas();

*/ // END OF COMMENTED OUT CODE
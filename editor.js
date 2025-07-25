// Canvas setup
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 80;
const GRID_SIZE = 15;

// Editor state
let selectedTile = null;
let selectedRotation = 0;
let mapGrid = [];
let tileImages = {};
let mouseX = 0;
let mouseY = 0;
let zoom = 1;

// Initialize map with random grass tiles
for (let y = 0; y < GRID_SIZE; y++) {
    mapGrid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        // Randomly choose between grass1, grass2, grass3
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

// All available tiles
const TILE_TYPES = [
    // Fields
    { name: 'Grass 1', file: 'grass1.jpeg', type: 'field' },
    { name: 'Grass 2', file: 'grass2.jpeg', type: 'field' },
    { name: 'Grass 3', file: 'grass3.jpeg', type: 'field' },
    { name: 'Empty (Grey)', file: 'Null0.png', type: 'field' },
    
    // Monasteries
    { name: 'Monastery', file: 'Monastery0.png', type: 'monastery' },
    { name: 'Monastery + Road ↓', file: 'MonasteryRoad0.png', type: 'monastery' },
    { name: 'Monastery + Road ←', file: 'MonasteryRoad1.png', type: 'monastery' },
    { name: 'Monastery + Road ↑', file: 'MonasteryRoad2.png', type: 'monastery' },
    { name: 'Monastery + Road →', file: 'MonasteryRoad3.png', type: 'monastery' },
    
    // Roads
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
    
    // Cities
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
    
    // Cities with Roads
    { name: 'City+Road ↑↓', file: 'CastleEdgeRoad0.png', type: 'city' },
    { name: 'City+Road →←', file: 'CastleEdgeRoad1.png', type: 'city' },
    { name: 'City+Road ↓↑', file: 'CastleEdgeRoad2.png', type: 'city' },
    { name: 'City+Road ←→', file: 'CastleEdgeRoad3.png', type: 'city' },
    
    // City Edges Alt
    { name: 'City Edge Alt ↑', file: 'CastleSidesEdge0.png', type: 'city' },
    { name: 'City Edge Alt →', file: 'CastleSidesEdge1.png', type: 'city' },
    { name: 'City Edge Alt ↓', file: 'CastleSidesEdge2.png', type: 'city' },
    { name: 'City Edge Alt ←', file: 'CastleSidesEdge3.png', type: 'city' }
];

// Set canvas size
function resizeCanvas() {
    canvas.width = (GRID_SIZE * TILE_SIZE * zoom);
    canvas.height = (GRID_SIZE * TILE_SIZE * zoom);
    drawMap();
}

// Load tile images
function loadTileImages() {
    const tileGrid = document.getElementById('tileGrid');
    
    TILE_TYPES.forEach((tileType, index) => {
        // Create tile option in palette
        const tileOption = document.createElement('div');
        tileOption.className = 'tile-option';
        tileOption.onclick = () => selectTile(tileType, index);
        
        const img = document.createElement('img');
        img.src = `tiles/${tileType.file}`;
        
        const label = document.createElement('div');
        label.className = 'tile-label';
        label.textContent = tileType.name;
        
        tileOption.appendChild(img);
        tileOption.appendChild(label);
        tileGrid.appendChild(tileOption);
        
        // Load image for canvas
        const canvasImg = new Image();
        canvasImg.onload = () => {
            tileImages[tileType.file] = canvasImg;
            if (Object.keys(tileImages).length === TILE_TYPES.length) {
                drawMap();
            }
        };
        canvasImg.src = `tiles/${tileType.file}`;
    });
}

// Select a tile
function selectTile(tileType, index) {
    selectedTile = tileType;
    
    // Update UI
    document.querySelectorAll('.tile-option').forEach((el, i) => {
        el.classList.toggle('selected', i === index);
    });
    
    document.getElementById('selectedTileName').textContent = tileType.name;
    
    // Update preview
    const preview = document.getElementById('previewTile');
    const previewImg = document.getElementById('previewImg');
    previewImg.src = `tiles/${tileType.file}`;
    preview.style.display = 'block';
}

// Canvas mouse events
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // Update preview position
    const preview = document.getElementById('previewTile');
    if (selectedTile && preview.style.display === 'block') {
        preview.style.left = (e.clientX - 40) + 'px';
        preview.style.top = (e.clientY - 40) + 'px';
        preview.style.transform = `rotate(${selectedRotation}deg)`;
    }
});

canvas.addEventListener('click', (e) => {
    if (!selectedTile) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE * zoom));
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE * zoom));
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        mapGrid[y][x] = {
            tile: selectedTile,
            rotation: selectedRotation
        };
        drawMap();
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE * zoom));
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE * zoom));
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        mapGrid[y][x] = null;
        drawMap();
    }
});

// Rotation controls
function rotateSelection(degrees) {
    selectedRotation = (selectedRotation + degrees + 360) % 360;
}

function setRotation(degrees) {
    selectedRotation = degrees;
}

// Draw the map
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
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
    
    // Draw tiles
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = mapGrid[y][x];
            if (cell && tileImages[cell.tile.file]) {
                ctx.save();
                ctx.translate(x * TILE_SIZE * zoom + TILE_SIZE * zoom / 2, y * TILE_SIZE * zoom + TILE_SIZE * zoom / 2);
                ctx.rotate(cell.rotation * Math.PI / 180);
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

// Map operations
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

function fillEmpty() {
    const grassTypes = [
        TILE_TYPES.find(t => t.name === 'Grass 1'),
        TILE_TYPES.find(t => t.name === 'Grass 2'),
        TILE_TYPES.find(t => t.name === 'Grass 3')
    ];
    
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

// Export/Import functions
function exportMap() {
    const mapData = {
        grid: mapGrid.map(row => 
            row.map(cell => cell ? {
                tile: cell.tile.name,
                file: cell.tile.file,
                rotation: cell.rotation
            } : null)
        )
    };
    
    const jsonStr = JSON.stringify(mapData, null, 2);
    document.getElementById('mapData').value = jsonStr;
    document.getElementById('exportArea').style.display = 'block';
}

function copyToClipboard() {
    const textarea = document.getElementById('mapData');
    textarea.select();
    document.execCommand('copy');
    alert('Map data copied to clipboard!');
}

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

function loadFromLocal() {
    const saved = localStorage.getItem('carcassonneMap');
    if (saved) {
        try {
            const mapData = JSON.parse(saved);
            
            // Rebuild mapGrid
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
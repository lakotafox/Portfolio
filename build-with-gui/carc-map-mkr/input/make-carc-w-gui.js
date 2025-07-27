// Carcassonne Map Maker - Main Application
// Refactored to use modular components

// Canvas setup
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 80;
const GRID_SIZE = 15;

// State
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
        const grassTypes = [
            { name: 'Grass 1', file: 'grass1.jpeg', type: 'field', id: 'g1' },
            { name: 'Grass 2', file: 'grass2.jpeg', type: 'field', id: 'g2' },
            { name: 'Grass 3', file: 'grass3.jpeg', type: 'field', id: 'g3' }
        ];
        const randomGrass = grassTypes[Math.floor(Math.random() * 3)];
        
        mapGrid[y][x] = {
            tile: randomGrass,
            rotation: 0
        };
    }
}

// Canvas resize
function resizeCanvas() {
    canvas.width = (GRID_SIZE * TILE_SIZE * zoom);
    canvas.height = (GRID_SIZE * TILE_SIZE * zoom);
    drawMap();
}

// Load tile images and create palette
function loadTileImages() {
    const tileGrid = document.getElementById('tileGrid');
    
    TILE_TYPES.forEach((tileType, index) => {
        // Create tile option in palette
        const tileOption = document.createElement('div');
        tileOption.className = 'tile-option';
        tileOption.onclick = () => selectTile(tileType, index);
        
        const img = document.createElement('img');
        img.src = `../tiles/${tileType.file}`;
        
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
        canvasImg.src = `../tiles/${tileType.file}`;
    });
}

// Select tile (override from palette-ui.js for compatibility)
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
    previewImg.src = `../tiles/${tileType.file}`;
    preview.style.display = 'block';
}

// Draw map
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid lines
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
                ctx.translate(x * TILE_SIZE * zoom + TILE_SIZE * zoom / 2, 
                             y * TILE_SIZE * zoom + TILE_SIZE * zoom / 2);
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

// Clear map
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

// Fill empty spaces with grass
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

// Mouse events
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

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom = Math.max(0.5, Math.min(2, zoom * delta));
    resizeCanvas();
});

// Make functions available globally (for HTML onclick)
window.clearMap = clearMap;
window.fillEmpty = fillEmpty;
window.toggleControls = toggleControls;
window.rotateSelection = rotateSelection;
window.setRotation = setRotation;

// Initialize
loadTileImages();
resizeCanvas();
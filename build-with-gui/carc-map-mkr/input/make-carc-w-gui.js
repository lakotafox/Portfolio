// carcassonne Map Maker 

// canvas setup
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

// constants
const TILE_SIZE = 80;
const GRID_SIZE = 15

// state
let selectedTile = null;
let selectedRotation = 0;
let mapGrid = [];
let tileImages = {};
let mouseX = 0;
let mouseY = 0;
let zoom = 1;

// initialize empty map
for (let y = 0; y < GRID_SIZE; y++) {
    mapGrid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        mapGrid[y][x] = null;
    }
}

// initialize map with random grass tiles
function initializeGrassTiles() {
    // define the 5 grass tiles
    const grassTiles = [
        'grass1.png',
        'grass2.png',
        'grass3.png',
        'grass4.png',
        'grass5.png'
    ];
    
    // get tiles
    const c3Tiles = TILE_TYPES.filter(tile => tile.type === 'c3');
    const availableGrassTiles = c3Tiles.filter(tile => grassTiles.includes(tile.file));
    
    if (availableGrassTiles.length === 0) {
        console.log('No grass tiles found');
        return;
    }
    
    // fill grid with tiles 
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const randomTile = availableGrassTiles[Math.floor(Math.random() * availableGrassTiles.length)];
            const randomRotation = Math.floor(Math.random() * 4) * 90; // 0, 90, 180, or 270
            
            mapGrid[y][x] = {
                tile: randomTile,
                rotation: randomRotation
            };
        }
    }
}

// canvas resize
function resizeCanvas() {
    canvas.width = (GRID_SIZE * TILE_SIZE * zoom);
    canvas.height = (GRID_SIZE * TILE_SIZE * zoom);
    drawMap();
}

// create tile palette aka sidebar
function loadTileImages() {
    const tileGrid = document.getElementById('tileGrid');
    tileGrid.innerHTML = ''; // clear existing tiles
    tileImages = {}; // reset tile images
    
    // get active tiles
    TILE_TYPES = getActiveTiles();
    
    console.log('Loading tiles:', TILE_TYPES.length, 'tiles');
    
    TILE_TYPES.forEach((tileType, index) => {
        // tile options in sidebar
        const tileOption = document.createElement('div');
        tileOption.className = 'tile-option';
        tileOption.onclick = () => selectTile(tileType, index);
        
        const img = document.createElement('img');
        // use tiles folder
        const tilePath = tileType.folder ? `${tileType.folder}${tileType.file}` : `../tiles/${tileType.file}`;
        img.src = tilePath;
        console.log('Loading tile image:', tilePath);
        
        // needed this bc it broke so add error handling
        img.onerror = () => {
            console.error('Failed to load tile:', tilePath);
            img.style.backgroundColor = '#f00'; // red for failed tiles
        };
        
        const label = document.createElement('div');
        label.className = 'tile-label';
        label.textContent = tileType.name;
        
        tileOption.appendChild(img);
        tileOption.appendChild(label);
        tileGrid.appendChild(tileOption);
        
        // load image for canvas
        const canvasImg = new Image();
        canvasImg.onload = () => {
            // store with a unique key that includes the folder path???????? why ???
            const tileKey = tileType.folder ? `${tileType.folder}${tileType.file}` : tileType.file;
            tileImages[tileKey] = canvasImg;
            if (Object.keys(tileImages).length === TILE_TYPES.length) {
                initializeGrassTiles();
                drawMap();
            }
        };
        canvasImg.src = tilePath;
    });
}

// toggle tile set this is dumb tbh 
function toggleTileSet(setName) {
    const checkbox = document.getElementById(`toggle${setName.charAt(0).toUpperCase() + setName.slice(1)}`);
    
    if (checkbox.checked) {
        if (!activeTileSets.includes(setName)) {
            activeTileSets.push(setName);
        }
    } else {
        activeTileSets = activeTileSets.filter(s => s !== setName);
    }
    
    // reload tiles with new set
    loadTileImages();
}

// select tile 
function selectTile(tileType, index) {
    selectedTile = tileType;
    
    // update UI
    document.querySelectorAll('.tile-option').forEach((el, i) => {
        el.classList.toggle('selected', i === index);
    });
    
    document.getElementById('selectedTileName').textContent = tileType.name;
    
    // preview
    const preview = document.getElementById('previewTile');
    const previewImg = document.getElementById('previewImg');
    const tilePath = tileType.folder ? `${tileType.folder}${tileType.file}` : `../tiles/${tileType.file}`;
    previewImg.src = tilePath;
    preview.style.display = 'block';
}

// draw map
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // grid lines
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
    
    // draw tiles
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = mapGrid[y][x];
            if (cell && cell.tile) {
                const tileKey = cell.tile.folder ? `${cell.tile.folder}${cell.tile.file}` : cell.tile.file;
                if (tileImages[tileKey]) {
                    ctx.save();
                    ctx.translate(x * TILE_SIZE * zoom + TILE_SIZE * zoom / 2, 
                                 y * TILE_SIZE * zoom + TILE_SIZE * zoom / 2);
                    ctx.rotate(cell.rotation * Math.PI / 180);
                    ctx.drawImage(
                        tileImages[tileKey],
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
}

// clear map
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

// fill empty spaces with grass tiles
function fillEmpty() {
    // get a random tile from current active tiles
    const availableTiles = TILE_TYPES.filter(t => t.type !== 'c3' && t.type !== 'water');
    
    if (availableTiles.length === 0) {
        alert('No tiles available for filling. Please enable at least one tile set.');
        return;
    }
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (!mapGrid[y][x]) {
                const randomTile = availableTiles[Math.floor(Math.random() * availableTiles.length)];
                mapGrid[y][x] = {
                    tile: randomTile,
                    rotation: 0
                };
            }
        }
    }
    drawMap();
}

// toggle controls panel
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

// mouse events
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // update preview position
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

// make functions available globally (for HTML onclick)
window.clearMap = clearMap;
window.fillEmpty = fillEmpty;
window.toggleControls = toggleControls;
window.rotateSelection = rotateSelection;
window.setRotation = setRotation;
window.toggleTileSet = toggleTileSet;

// initialize
loadTileImages();
resizeCanvas();
// SIDEBAR UI functionality for tile selection

// Create the tile palette interface
function createTilePalette() {
    const paletteDiv = document.getElementById('tilePalette');
    if (!paletteDiv) return;
    
    paletteDiv.innerHTML = '';
    
    // Create category sections
    const categories = {
        'field': 'Fields',
        'monastery': 'Monasteries',
        'road': 'Roads',
        'city': 'Cities'
    };
    
    Object.entries(categories).forEach(([type, label]) => {
        const section = document.createElement('div');
        section.className = 'palette-section';
        
        const header = document.createElement('h3');
        header.textContent = label;
        section.appendChild(header);
        
        const tilesDiv = document.createElement('div');
        tilesDiv.className = 'palette-tiles';
        
        // Add tiles of this type
        TILE_TYPES.filter(tile => tile.type === type).forEach((tile, index) => {
            const tileDiv = document.createElement('div');
            tileDiv.className = 'palette-tile';
            tileDiv.dataset.index = TILE_TYPES.indexOf(tile);
            
            const img = document.createElement('img');
            img.src = `../tiles/${tile.file}`;
            img.alt = tile.name;
            img.title = tile.name;
            
            tileDiv.appendChild(img);
            
            // Click to select
            tileDiv.addEventListener('click', () => {
                selectTile(tile, TILE_TYPES.indexOf(tile));
            });
            
            tilesDiv.appendChild(tileDiv);
        });
        
        section.appendChild(tilesDiv);
        paletteDiv.appendChild(section);
    });
}

// Select a tile from the palette
function selectTile(tileType, index) {
    selectedTile = tileType;
    
    // Update visual selection
    document.querySelectorAll('.palette-tile').forEach(tile => {
        tile.classList.remove('selected');
    });
    
    const selectedDiv = document.querySelector(`.palette-tile[data-index="${index}"]`);
    if (selectedDiv) {
        selectedDiv.classList.add('selected');
    }
    
    // Update selection display
    updateSelectionDisplay();
}

// Update the current selection display
function updateSelectionDisplay() {
    const display = document.getElementById('selectedTileDisplay');
    if (!display) return;
    
    if (selectedTile) {
        display.innerHTML = `
            <img src="../tiles/${selectedTile.file}" 
                 alt="${selectedTile.name}" 
                 style="transform: rotate(${selectedRotation}deg);">
            <div>${selectedTile.name}</div>
            <div>Rotation: ${selectedRotation}°</div>
        `;
    } else {
        display.innerHTML = '<div>No tile selected</div>';
    }
}

// Rotation control functions
function rotateSelection(degrees) {
    selectedRotation = (selectedRotation + degrees + 360) % 360;
    updateSelectionDisplay();
}

function setRotation(degrees) {
    selectedRotation = degrees;
    updateSelectionDisplay();
}
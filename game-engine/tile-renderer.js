// Tile Renderer - Handles drawing tiles to the canvas
import { tileImages, flagImage } from './tiles/tile-loader.js';
import { TILE_SIZE } from './map/map-generator.js';

// Draw a single Carcassonne tile
export function drawTile(ctx, tile, x, y, camera) {
    const screenX = x * TILE_SIZE - camera.x;
    const screenY = y * TILE_SIZE - camera.y;
    
    // Skip if off screen
    if (screenX + TILE_SIZE < 0 || screenX > ctx.canvas.width || 
        screenY + TILE_SIZE < 0 || screenY > ctx.canvas.height) {
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

// Draw all tiles in the grid
export function drawAllTiles(ctx, mapGrid, camera) {
    const GRID_SIZE = mapGrid.length;
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = mapGrid[y][x];
            if (tile) {
                drawTile(ctx, tile, x, y, camera);
            }
        }
    }
}
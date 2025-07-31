// handles drawing tile to the canvas
import { tileImages, flagPurpleImage, flagRedImage } from './tiles/tile-loader.js';
import { TILE_SIZE } from './map/map-generator.js';

// draw a carc tile
export function drawTile(ctx, tile, x, y, camera) {
    // round to nearest pixel prevent gaps
    const screenX = Math.round(x * TILE_SIZE - camera.x);
    const screenY = Math.round(y * TILE_SIZE - camera.y);
    
    
    ctx.save();
    ctx.translate(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
    ctx.rotate(tile.rotation * Math.PI / 180);
    ctx.translate(-TILE_SIZE/2, -TILE_SIZE/2);
    
    // draw the tile image if available
    const tileImage = tileImages[tile.image];
    if (tileImage) {
        ctx.drawImage(tileImage, 0, 0, TILE_SIZE, TILE_SIZE);
    } else {
        // fallback
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    }
    
    // draw flag if tile has project
    if (tile.project) {
        ctx.save();
        ctx.translate(TILE_SIZE/2, TILE_SIZE/2);
        ctx.rotate(-tile.rotation * Math.PI / 180);
        
        // determine which flag to use based on project status
        // finished projects: mincoins, foxbuiltstore.com
        // placeholder projects: all others
        const isFinishedProject = tile.project && (
            tile.project.name === 'MinCoins Calculator' || 
            tile.project.name === 'FOXBUILTSTORE.COM'
        );
        
        const flagToUse = isFinishedProject ? flagPurpleImage : flagRedImage; // purple for done, red for wip
        
        // draw flag if loaded
        if (flagToUse) {
            const flagWidth = 48;
            const flagHeight = 48;
            // where to draw flag
            const cornerX = -TILE_SIZE/1.5 + 1;  
            const cornerY = -TILE_SIZE/1.5 + 1;  
            ctx.drawImage(flagToUse, cornerX, cornerY, flagWidth, flagHeight);
        }
        
        ctx.restore();
    }
    
    ctx.restore();
}

// draw all tiles in the grid
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
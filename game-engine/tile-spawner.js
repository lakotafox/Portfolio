//Spawns in tiles and handles tiles
// store the imagies for the tiles in memory so we dont have to load when universe is created ( the players ;)))
import { TILE_TYPES, TILES_TO_LOAD } from './config.js';

export class TileManager {
    constructor() {
        this.spawnedTiles = {}; // store tile images that have been spawned
        this.spawnPromises = []; // track spawning progress
    }




//Simply the computer is drawing the tiles very fast,(fps) so we need to load them before the game starts
    


async spawnInTiles() {
        console.log('Spawning tiles...');
        
        this.spawnPromises = TILES_TO_LOAD.map(tileName => {
            return this.spawnSingleTile(tileName);
        });

        await Promise.all(this.spawnPromises);
        console.log('All tiles spawned!');
    }

    // Spawn a single tile
    spawnSingleTile(tileName) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                this.spawnedTiles[tileName] = img;
                resolve();
            };
            
            img.onerror = () => {
                console.error(`Failed to spawn tile: ${tileName}`);
                resolve(); // continue even if one fails don't want a crash!
            };
            
            img.src = `build-with-gui/map-maker/tiles/${tileName}`;
        });
    }

    //FUNC Get a spawned tile image
    getTileImage(tileName) {
        return this.spawnedTiles[tileName] || this.spawnedTiles['grass1.jpeg']; // Fallback to grass
    }

    //FUNC Check to see if all tiles are spawned
    areAllTilesSpawned() {
        return Object.keys(this.spawnedTiles).length > 0;
    }
}
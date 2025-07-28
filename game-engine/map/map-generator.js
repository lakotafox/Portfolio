// map generation and grid management
import { COMPACT_MAP, TILE_DEFS } from '../game-map.js';

const GRID_SIZE = 15;
const TILE_SIZE = 80;

// map grid storage
export const mapGrid = [];

// initialize empty grid
for (let y = 0; y < GRID_SIZE; y++) {
    mapGrid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        mapGrid[y][x] = null;
    }
}

// expand compact map to verbose format
export function expandCompactMap(compactMap, tileDefs) {
    return {
        grid: compactMap.map(row => 
            row.map(cell => {
                const [tileId, rotation = 0] = Array.isArray(cell) ? cell : [cell, 0];
                const tileDef = tileDefs[tileId];
                
                if (!tileDef) {
                    console.error(`Unknown tile ID: ${tileId}`);
                    return {
                        tile: "Grass 1",
                        file: "grass1.png",
                        rotation: 0
                    };
                }
                
                return {
                    tile: tileDef.tile,
                    file: tileDef.file,
                    folder: tileDef.folder || '',
                    rotation: rotation
                };
            })
        )
    };
}

// generate map with tiles
export function generateMap() {
    console.log('Generating map from compact data...');
    const mapData = expandCompactMap(COMPACT_MAP, TILE_DEFS);
    
    if (mapData && mapData.grid) {
        console.log('Map data found, loading tiles...');
        // load from map data
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (mapData.grid[y] && mapData.grid[y][x]) {
                    const cellData = mapData.grid[y][x];
                    mapGrid[y][x] = {
                        type: { type: cellData.tile.toLowerCase().replace(/ /g, '_') },
                        rotation: cellData.rotation || 0,
                        image: cellData.file,
                        project: null
                    };
                } else {
                    // empty cell - use green field
                    mapGrid[y][x] = {
                        type: { type: 'field' },
                        rotation: 0,
                        image: 'grass1.png',
                        project: null
                    };
                }
            }
        }
        console.log('Map loaded, first tile:', mapGrid[0][0]);
        console.log('Total tiles loaded:', GRID_SIZE * GRID_SIZE);
    } else {
        console.log('No map data found!');
    } 
    
    // place projects at their specific coordinates
    ProjectManager.projects.forEach(project => {
        if (mapGrid[project.y] && mapGrid[project.y][project.x]) {
            mapGrid[project.y][project.x].project = project;
        }
    });
}

export { GRID_SIZE, TILE_SIZE };
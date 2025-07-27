import { GRID_SIZE, PROJECTS } from '../config.js';

// Map grid storage
export const mapGrid = [];

// Initialize empty grid
export function initializeGrid() {
    for (let y = 0; y < GRID_SIZE; y++) {
        mapGrid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            mapGrid[y][x] = null;
        }
    }
}

// Generate map from map-maker data
export function generateMap(mapData) {
    initializeGrid();
    
    // Check if we have the expected format
    if (!mapData || !mapData.grid) {
        console.error('Invalid map data format');
        return;
    }
    
    // Load each tile from the map data
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (mapData.grid[y] && mapData.grid[y][x]) {
                const cell = mapData.grid[y][x];
                mapGrid[y][x] = {
                    tile: cell.tile,
                    file: cell.file,
                    rotation: cell.rotation,
                    project: null
                };
            }
        }
    }
    
    // Assign projects to their designated tiles
    assignProjects();
}

// Assign projects from config to their map positions
function assignProjects() {
    PROJECTS.forEach(project => {
        if (project.x >= 0 && project.x < GRID_SIZE && 
            project.y >= 0 && project.y < GRID_SIZE &&
            mapGrid[project.y][project.x]) {
            mapGrid[project.y][project.x].project = project;
        }
    });
}

// Get tile at specific coordinates
export function getTileAt(x, y) {
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        return mapGrid[y][x];
    }
    return null;
}

// Check if a project exists at given tile coordinates
export function getProjectAt(tileX, tileY) {
    const tile = getTileAt(tileX, tileY);
    return tile ? tile.project : null;
}
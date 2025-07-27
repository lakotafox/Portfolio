// Tile Connector - Figures out how tiles connect to each other
// This module handles all the logic for determining which tile image to use
// based on what tiles are around it (neighbors)

import { TILE_TYPES, GRID_SIZE } from './config.js';

export class TileConnector {
    constructor(tileSpawner) {
        this.tileSpawner = tileSpawner; // Reference to tile spawner for image checking
    }

    //FUNC Get what type of tile for a given board position
    getTileForChar(char, x, y, boardLayout) {
        switch(char) {
            case 'C':
                // City tile - check neighbors to determine type
                return this.getCityTile(x, y, boardLayout);
            case 'R':
                // Road tile - check neighbors to determine type
                return this.getRoadTile(x, y, boardLayout);
            case 'M':
                // Monastery - check if it has road
                return this.getMonasteryTile(x, y, boardLayout);
            case '1':
                return { type: TILE_TYPES.FIELD, rotation: 0, image: 'grass1.jpeg' };
            case '2':
                return { type: TILE_TYPES.FIELD, rotation: 0, image: 'grass2.jpeg' };
            case '3':
                return { type: TILE_TYPES.FIELD, rotation: 0, image: 'grass3.jpeg' };
            default:
                return { type: TILE_TYPES.FIELD, rotation: 0, image: 'grass1.jpeg' };
        }
    }

    //FUNC Determine which city tile to use
    getCityTile(x, y, boardLayout) {
        const neighbors = this.getNeighborChars(x, y, boardLayout);
        const cityCount = neighbors.filter(n => n === 'C' || n === 'X').length;
        
        if (cityCount === 4) {
            return { type: TILE_TYPES.CITY_FULL, rotation: 0, image: 'CastleCenter0.png' };
        } else if (cityCount >= 3) {
            const rotation = this.getRotationForCityThree(x, y, boardLayout);
            const img = this.tileSpawner.spawnedTiles[`CastleWall${rotation}.png`] ? `CastleWall${rotation}.png` : 'CastleWall0.png';
            return { type: TILE_TYPES.CITY_THREE, rotation: 0, image: img };
        } else if (cityCount === 2) {
            if (this.isAdjacentCity(x, y, boardLayout)) {
                const rotation = this.getRotationForCityTwoAdj(x, y, boardLayout);
                const img = this.tileSpawner.spawnedTiles[`CastleSides${rotation}.png`] ? `CastleSides${rotation}.png` : 'CastleSides0.png';
                return { type: TILE_TYPES.CITY_TWO_ADJACENT, rotation: 0, image: img };
            } else {
                const rotation = this.getRotationForCityTwoOpp(x, y, boardLayout);
                const img = this.tileSpawner.spawnedTiles[`CastleTube${rotation}.png`] ? `CastleTube${rotation}.png` : 'CastleTube0.png';
                return { type: TILE_TYPES.CITY_TWO_OPPOSITE, rotation: 0, image: img };
            }
        } else {
            const rotation = this.getRotationForCityOne(x, y, boardLayout);
            const img = this.tileSpawner.spawnedTiles[`CastleEdge${rotation}.png`] ? `CastleEdge${rotation}.png` : 'CastleEdge0.png';
            return { type: TILE_TYPES.CITY_ONE, rotation: 0, image: img };
        }
    }

    //FUNC Determine which road tile to use
    getRoadTile(x, y, boardLayout) {
        const neighbors = this.getNeighborChars(x, y, boardLayout);
        const roadCount = neighbors.filter(n => n === 'R' || n === 'X').length;
        
        if (roadCount >= 4) {
            return { type: TILE_TYPES.ROAD_FOUR, rotation: 0, image: 'RoadJunctionLarge0.png' };
        } else if (roadCount >= 3) {
            const rotation = this.getRotationForRoadThree(x, y, boardLayout);
            const img = this.tileSpawner.spawnedTiles[`RoadJunctionSmall${rotation}.png`] ? `RoadJunctionSmall${rotation}.png` : 'RoadJunctionSmall0.png';
            return { type: TILE_TYPES.ROAD_THREE, rotation: 0, image: img };
        } else if (roadCount === 2) {
            if (this.isStraightRoad(x, y, boardLayout)) {
                const rotation = this.isVerticalRoad(x, y, boardLayout) ? 0 : 1;
                const img = this.tileSpawner.spawnedTiles[`Road${rotation}.png`] ? `Road${rotation}.png` : 'Road0.png';
                return { type: TILE_TYPES.ROAD_STRAIGHT, rotation: 0, image: img };
            } else {
                const rotation = this.getRotationForRoadCurve(x, y, boardLayout);
                const img = this.tileSpawner.spawnedTiles[`RoadCurve${rotation}.png`] ? `RoadCurve${rotation}.png` : 'RoadCurve0.png';
                return { type: TILE_TYPES.ROAD_CURVE, rotation: 0, image: img };
            }
        } else {
            return { type: TILE_TYPES.ROAD_STRAIGHT, rotation: 0, image: 'Road0.png' };
        }
    }

    //FUNC Determine monastery tile
    getMonasteryTile(x, y, boardLayout) {
        const neighbors = this.getNeighborChars(x, y, boardLayout);
        if (neighbors.includes('R')) {
            const rotation = this.getRotationForMonasteryRoad(x, y, boardLayout);
            const img = this.tileSpawner.spawnedTiles[`MonasteryRoad${rotation}.png`] ? `MonasteryRoad${rotation}.png` : 'MonasteryRoad0.png';
            return { type: TILE_TYPES.MONASTERY_ROAD, rotation: 0, image: img };
        }
        return { type: TILE_TYPES.MONASTERY, rotation: 0, image: 'Monastery0.png' };
    }

    // ===== HELPER FUNCTIONS FOR TILE CONNECTIONS =====

    //FUNC Get neighbor characters (what's around this tile)
    getNeighborChars(x, y, boardLayout) {
        const chars = [];
        if (y > 0) chars.push(boardLayout[y-1][x]); // top
        if (x < GRID_SIZE-1) chars.push(boardLayout[y][x+1]); // right
        if (y < GRID_SIZE-1) chars.push(boardLayout[y+1][x]); // bottom
        if (x > 0) chars.push(boardLayout[y][x-1]); // left
        return chars;
    }

    //FUNC Check if city tiles are adjacent (touching)
    isAdjacentCity(x, y, boardLayout) {
        const top = y > 0 && (boardLayout[y-1][x] === 'C' || boardLayout[y-1][x] === 'X');
        const right = x < GRID_SIZE-1 && (boardLayout[y][x+1] === 'C' || boardLayout[y][x+1] === 'X');
        const bottom = y < GRID_SIZE-1 && (boardLayout[y+1][x] === 'C' || boardLayout[y+1][x] === 'X');
        const left = x > 0 && (boardLayout[y][x-1] === 'C' || boardLayout[y][x-1] === 'X');
        
        return (top && right) || (right && bottom) || (bottom && left) || (left && top);
    }

    //FUNC Check if road goes straight through
    isStraightRoad(x, y, boardLayout) {
        const top = y > 0 && (boardLayout[y-1][x] === 'R' || boardLayout[y-1][x] === 'X');
        const bottom = y < GRID_SIZE-1 && (boardLayout[y+1][x] === 'R' || boardLayout[y+1][x] === 'X');
        const left = x > 0 && (boardLayout[y][x-1] === 'R' || boardLayout[y][x-1] === 'X');
        const right = x < GRID_SIZE-1 && (boardLayout[y][x+1] === 'R' || boardLayout[y][x+1] === 'X');
        
        return (top && bottom) || (left && right);
    }

    //FUNC Check if road is vertical
    isVerticalRoad(x, y, boardLayout) {
        const top = y > 0 && (boardLayout[y-1][x] === 'R' || boardLayout[y-1][x] === 'X');
        const bottom = y < GRID_SIZE-1 && (boardLayout[y+1][x] === 'R' || boardLayout[y+1][x] === 'X');
        return top || bottom;
    }

    // ===== ROTATION CALCULATION FUNCTIONS =====

    //FUNC Get rotation for city with one connection
    getRotationForCityOne(x, y, boardLayout) {
        if (y > 0 && (boardLayout[y-1][x] === 'C' || boardLayout[y-1][x] === 'X')) return 0;
        if (x < GRID_SIZE-1 && (boardLayout[y][x+1] === 'C' || boardLayout[y][x+1] === 'X')) return 1;
        if (y < GRID_SIZE-1 && (boardLayout[y+1][x] === 'C' || boardLayout[y+1][x] === 'X')) return 2;
        if (x > 0 && (boardLayout[y][x-1] === 'C' || boardLayout[y][x-1] === 'X')) return 3;
        return 0;
    }

    //FUNC Get rotation for city with two adjacent connections
    getRotationForCityTwoAdj(x, y, boardLayout) {
        const top = y > 0 && (boardLayout[y-1][x] === 'C' || boardLayout[y-1][x] === 'X');
        const right = x < GRID_SIZE-1 && (boardLayout[y][x+1] === 'C' || boardLayout[y][x+1] === 'X');
        const bottom = y < GRID_SIZE-1 && (boardLayout[y+1][x] === 'C' || boardLayout[y+1][x] === 'X');
        const left = x > 0 && (boardLayout[y][x-1] === 'C' || boardLayout[y][x-1] === 'X');
        
        if (top && right) return 0;
        if (right && bottom) return 1;
        if (bottom && left) return 0;
        if (left && top) return 1;
        return 0;
    }

    //FUNC Get rotation for city with two opposite connections
    getRotationForCityTwoOpp(x, y, boardLayout) {
        const vertical = (y > 0 && (boardLayout[y-1][x] === 'C' || boardLayout[y-1][x] === 'X')) && 
                        (y < GRID_SIZE-1 && (boardLayout[y+1][x] === 'C' || boardLayout[y+1][x] === 'X'));
        return vertical ? 0 : 1;
    }

    //FUNC Get rotation for city with three connections
    getRotationForCityThree(x, y, boardLayout) {
        const top = y > 0 && (boardLayout[y-1][x] === 'C' || boardLayout[y-1][x] === 'X');
        const right = x < GRID_SIZE-1 && (boardLayout[y][x+1] === 'C' || boardLayout[y][x+1] === 'X');
        const bottom = y < GRID_SIZE-1 && (boardLayout[y+1][x] === 'C' || boardLayout[y+1][x] === 'X');
        const left = x > 0 && (boardLayout[y][x-1] === 'C' || boardLayout[y][x-1] === 'X');
        
        if (!bottom) return 0;
        if (!left) return 1;
        if (!top) return 2;
        if (!right) return 3;
        return 0;
    }

    //FUNC Get rotation for curved road
    getRotationForRoadCurve(x, y, boardLayout) {
        const top = y > 0 && (boardLayout[y-1][x] === 'R' || boardLayout[y-1][x] === 'X');
        const right = x < GRID_SIZE-1 && (boardLayout[y][x+1] === 'R' || boardLayout[y][x+1] === 'X');
        const bottom = y < GRID_SIZE-1 && (boardLayout[y+1][x] === 'R' || boardLayout[y+1][x] === 'X');
        const left = x > 0 && (boardLayout[y][x-1] === 'R' || boardLayout[y][x-1] === 'X');
        
        if (bottom && right) return 0;
        if (bottom && left) return 1;
        if (top && left) return 2;
        if (top && right) return 3;
        return 0;
    }

    //FUNC Get rotation for three-way road junction
    getRotationForRoadThree(x, y, boardLayout) {
        const top = y > 0 && (boardLayout[y-1][x] === 'R' || boardLayout[y-1][x] === 'X');
        const right = x < GRID_SIZE-1 && (boardLayout[y][x+1] === 'R' || boardLayout[y][x+1] === 'X');
        const bottom = y < GRID_SIZE-1 && (boardLayout[y+1][x] === 'R' || boardLayout[y+1][x] === 'X');
        const left = x > 0 && (boardLayout[y][x-1] === 'R' || boardLayout[y][x-1] === 'X');
        
        if (!right) return 0;
        if (!bottom) return 1;
        if (!left) return 2;
        if (!top) return 3;
        return 0;
    }

    //FUNC Get rotation for monastery with road
    getRotationForMonasteryRoad(x, y, boardLayout) {
        if (y < GRID_SIZE-1 && boardLayout[y+1][x] === 'R') return 0;
        if (x > 0 && boardLayout[y][x-1] === 'R') return 1;
        if (y > 0 && boardLayout[y-1][x] === 'R') return 2;
        if (x < GRID_SIZE-1 && boardLayout[y][x+1] === 'R') return 3;
        return 0;
    }
}
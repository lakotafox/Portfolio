// player Movement
// handles player movement logic and boundaries

import { TILE_SIZE, PLAYER_SIZE, GRID_SIZE } from '../config.js';

export class PlayerMovement {
    // update player position based on input
    static updatePosition(playerState, input) {
        let dx = 0;
        let dy = 0;
        let moved = false;
        
        // calculate movement deltas
        if (input.up) {
            dy = -playerState.speed;
            playerState.setFacing('up');
            moved = true;
        }
        if (input.down) {
            dy = playerState.speed;
            playerState.setFacing('down');
            moved = true;
        }
        if (input.left) {
            dx = -playerState.speed;
            playerState.setFacing('left');
            moved = true;
        }
        if (input.right) {
            dx = playerState.speed;
            playerState.setFacing('right');
            moved = true;
        }
        
        // apply movement
        playerState.x += dx;
        playerState.y += dy;
        
        // keep player in bounds
        this.enforceBoundaries(playerState);
        
        return moved;
    }

    // keep player within map boundaries
    static enforceBoundaries(playerState) {
        const halfSize = PLAYER_SIZE / 2;
        const maxX = GRID_SIZE * TILE_SIZE - halfSize;
        const maxY = GRID_SIZE * TILE_SIZE - halfSize;
        
        playerState.x = Math.max(halfSize, Math.min(maxX, playerState.x));
        playerState.y = Math.max(halfSize, Math.min(maxY, playerState.y));
    }

    // calculate distance between two points
    static getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
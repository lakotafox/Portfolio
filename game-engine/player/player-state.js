// Player State
// Manages the player's position, direction, and movement properties

import { TILE_SIZE, PLAYER_SIZE, PLAYER_CONFIG } from '../config.js';

export class PlayerState {
    constructor() {
        // Position in pixels
        this.x = PLAYER_CONFIG.startX * TILE_SIZE + TILE_SIZE / 2;
        this.y = PLAYER_CONFIG.startY * TILE_SIZE + TILE_SIZE / 2;
        
        // Movement properties
        this.speed = PLAYER_CONFIG.speed;
        this.facing = 'down'; // 'up', 'down', 'left', 'right'
        
        // Visual properties
        this.color = PLAYER_CONFIG.color;
        this.size = PLAYER_SIZE;
    }

    //FUNC Get current position
    getPosition() {
        return { x: this.x, y: this.y };
    }

    //FUNC Set position
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    //FUNC Get current tile position
    getTilePosition() {
        return {
            x: Math.floor(this.x / TILE_SIZE),
            y: Math.floor(this.y / TILE_SIZE)
        };
    }

    //FUNC Check if at specific tile
    isAtTile(tileX, tileY) {
        const currentTile = this.getTilePosition();
        return currentTile.x === tileX && currentTile.y === tileY;
    }

    //FUNC Set facing direction
    setFacing(direction) {
        this.facing = direction;
    }
}
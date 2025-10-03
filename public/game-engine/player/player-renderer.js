// player Renderer
// handles drawing the player on the canvas

import { PLAYER_SIZE } from '../config.js';

export class PlayerRenderer {
    constructor(playerState, playerSprites) {
        this.playerState = playerState;
        this.playerSprites = playerSprites;
    }

    // main render method
    render(ctx) {
        const sprite = this.playerSprites.getSprite(this.playerState.facing);
        
        if (sprite && this.playerSprites.areSpritesLoaded()) {
            this.drawSprite(ctx, sprite, this.playerState.x, this.playerState.y, this.playerState.facing);
        } else {
            this.drawFallbackCircle(ctx, this.playerState.x, this.playerState.y);
        }
    }

    // draw the player on canvas with camera offset
    draw(ctx, cameraX, cameraY) {
        const screenX = this.playerState.x - cameraX;
        const screenY = this.playerState.y - cameraY;
        
        const sprite = this.playerSprites.getSprite(this.playerState.facing);
        
        if (sprite && this.playerSprites.areSpritesLoaded()) {
            this.drawSprite(ctx, sprite, screenX, screenY, this.playerState.facing);
        } else {
            this.drawFallbackCircle(ctx, screenX, screenY);
        }
    }

    // draw player sprite
    drawSprite(ctx, sprite, x, y, facing) {
        ctx.save();
        
        // flip horizontally for left facing
        if (facing === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -x - 16, y - 16, 32, 32);
        } else {
            ctx.drawImage(sprite, x - 16, y - 16, 32, 32);
        }
        
        ctx.restore();
    }

    // draw fallback circle when sprites not loaded
    drawFallbackCircle(ctx, x, y) {
        // colored circle
        ctx.fillStyle = this.playerState.color;
        ctx.beginPath();
        ctx.arc(x, y, this.playerState.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // white border
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // direction indicator
        this.drawDirectionIndicator(ctx, x, y, this.playerState.facing, this.playerState.size);
    }

    // draw direction indicator on fallback circle
    drawDirectionIndicator(ctx, x, y, facing, size) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        
        const offset = size / 2 - 2;
        switch(facing) {
            case 'up':
                ctx.arc(x, y - offset, 3, 0, Math.PI * 2);
                break;
            case 'down':
                ctx.arc(x, y + offset, 3, 0, Math.PI * 2);
                break;
            case 'left':
                ctx.arc(x - offset, y, 3, 0, Math.PI * 2);
                break;
            case 'right':
                ctx.arc(x + offset, y, 3, 0, Math.PI * 2);
                break;
        }
        
        ctx.fill();
    }
}
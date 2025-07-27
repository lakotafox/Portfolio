// Player Renderer
// Handles drawing the player on the canvas

import { PLAYER_SIZE } from '../config.js';

export class PlayerRenderer {
    constructor(playerState, playerSprites) {
        this.playerState = playerState;
        this.playerSprites = playerSprites;
    }

    //FUNC Main render method
    render(ctx) {
        const sprite = this.playerSprites.getSprite(this.playerState.facing);
        
        if (sprite && this.playerSprites.areSpritesLoaded()) {
            this.drawSprite(ctx, sprite, this.playerState.x, this.playerState.y, this.playerState.facing);
        } else {
            this.drawFallbackCircle(ctx, this.playerState.x, this.playerState.y);
        }
    }

    //FUNC Draw the player on canvas with camera offset
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

    //FUNC Draw player sprite
    drawSprite(ctx, sprite, x, y, facing) {
        ctx.save();
        
        // Flip horizontally for left facing
        if (facing === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -x - 16, y - 16, 32, 32);
        } else {
            ctx.drawImage(sprite, x - 16, y - 16, 32, 32);
        }
        
        ctx.restore();
    }

    //FUNC Draw fallback circle when sprites not loaded
    drawFallbackCircle(ctx, x, y) {
        // Colored circle
        ctx.fillStyle = this.playerState.color;
        ctx.beginPath();
        ctx.arc(x, y, this.playerState.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // White border
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Direction indicator
        this.drawDirectionIndicator(ctx, x, y, this.playerState.facing, this.playerState.size);
    }

    //FUNC Draw direction indicator on fallback circle
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
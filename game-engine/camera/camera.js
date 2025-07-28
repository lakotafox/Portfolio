// camera - Minimal implementation
export class Camera {
    constructor(startX = 0, startY = 0) {
        this.x = startX;
        this.y = startY;
        this.smoothing = 0.1;
    }
    
    // update camera to follow player
    updateToFollowPlayer(player, canvas) {
        const targetX = player.x - canvas.width / 2;
        const targetY = player.y - canvas.height / 2;
        
        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;
    }
    
    // update camera to follow target
    follow(targetX, targetY, canvasWidth, canvasHeight) {
        const desiredX = targetX - canvasWidth / 2;
        const desiredY = targetY - canvasHeight / 2;
        
        this.x += (desiredX - this.x) * this.smoothing;
        this.y += (desiredY - this.y) * this.smoothing;
    }
    
    // convert world position to screen position
    toScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
}
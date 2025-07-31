// camera - Minimal implementation
export class Camera {
    constructor(startX = 0, startY = 0) {
        this.x = startX;
        this.y = startY;
        this.smoothing = 0.1;
        this.zoom = 1.3; // fixed 30% zoom
    }
    
    // update camera to follow player
    updateToFollowPlayer(player, canvas) {
        const targetX = player.x - (canvas.width / 2) / this.zoom;
        const targetY = player.y - (canvas.height / 2) / this.zoom;
        
        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;
        
        // boundary constraints - prevent camera from showing past map edges
        const mapWidth = 15 * 80; // grid_size * tile_size
        const mapHeight = 15 * 80;
        const viewWidth = canvas.width / this.zoom;
        const viewHeight = canvas.height / this.zoom;
        
        // clamp camera position to keep view within map bounds
        this.x = Math.max(0, Math.min(this.x, mapWidth - viewWidth));
        this.y = Math.max(0, Math.min(this.y, mapHeight - viewHeight));
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
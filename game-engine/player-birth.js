// player Birth - Player creation and management

// projectManager is loaded as a global from projects-global.js

// game constants (must match big-bang.js)
const TILE_SIZE = 80;
const GRID_SIZE = 15;
const PLAYER_SIZE = 20;

// player state - start near center
export const player = {
    x: 7 * TILE_SIZE + TILE_SIZE / 2,
    y: 7 * TILE_SIZE + TILE_SIZE / 2,
    speed: 4,
    color: "#ff6b6b",
    facing: 'down',
    sprites: {
        down: null,
        up: null,
        right: null,
        left: null
    },
    spritesLoaded: 0
};

//FUNC Load individual player sprites
export function loadPlayerSprites() {
    console.log('Loading player sprites...');
    const spritesToLoad = [
        { direction: 'down', file: 'game-engine/player/sprites/player-down.png' },
        { direction: 'up', file: 'game-engine/player/sprites/player-up.png' },
        { direction: 'right', file: 'game-engine/player/sprites/player-right.png' }
    ];
    
    spritesToLoad.forEach(({ direction, file }) => {
        const img = new Image();
        img.onload = () => {
            console.log(`Loaded sprite: ${file}`);
            player.sprites[direction] = img;
            // Use the same image for left, but it will be flipped
            if (direction === 'right') {
                player.sprites.left = img;
            }
            player.spritesLoaded++;
        };
        img.onerror = () => {
            console.error(`Failed to load sprite: ${file}`);
            player.spritesLoaded++;
        };
        img.src = file;
    });
}

// Input handling will be in big-bang.js since that's where 'keys' is defined

//FUNC Update player movement
export function updatePlayer(keys, mapGrid) {
    let moved = false;
    let dx = 0;
    let dy = 0;
    
    if (keys['w'] || keys['arrowup']) {
        dy = -player.speed;
        player.facing = 'up';
        moved = true;
    }
    if (keys['s'] || keys['arrowdown']) {
        dy = player.speed;
        player.facing = 'down';
        moved = true;
    }
    if (keys['a'] || keys['arrowleft']) {
        dx = -player.speed;
        player.facing = 'left';
        moved = true;
    }
    if (keys['d'] || keys['arrowright']) {
        dx = player.speed;
        player.facing = 'right';
        moved = true;
    }
    
    // player movement
    player.x += dx;
    player.y += dy;
    
   
    
    // Check project collision
    if (moved) {
        ProjectManager.checkCollision(player.x, player.y, mapGrid, TILE_SIZE, GRID_SIZE);
    }
}

// draw player
export function drawPlayer(ctx, camera) {
    const x = player.x - camera.x;
    const y = player.y - camera.y;
    
    const sprite = player.sprites[player.facing];
    
    if (sprite) {
        // Draw sprite (scale up 2x for visibility)
        ctx.save();
        
        // Apply horizontal flip for left facing
        if (player.facing === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(
                sprite,
                -x - 16, y - 16,
                32, 32
            );
        } else {
            ctx.drawImage(
                sprite,
                x - 16, y - 16,
                32, 32
            );
        }
        
        ctx.restore();
    } else {
        // Fallback circle
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(x, y, PLAYER_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Initialize sprite loading
loadPlayerSprites();
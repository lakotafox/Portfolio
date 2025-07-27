// MinCoins Init Script
// Simple initialization without complex class structure

import { MINCOINS_CONFIG } from './mincoins-config.js';
import { MinCoinsPlayer } from './mincoins-player.js';
import { MinCoinsTerminal } from './mincoins-terminal.js';
import { MinCoinsInteractions } from './mincoins-interactions.js';
import { MinCoinsRenderer } from './mincoins-renderer.js';

// Get canvas and context
const canvas = document.getElementById('codeCanvas');
const ctx = canvas.getContext('2d');

// Initialize camera
const camera = {
    x: MINCOINS_CONFIG.CAMERA_START_X,
    y: MINCOINS_CONFIG.CAMERA_START_Y,
    zoom: 1
};

// Initialize modules
const player = new MinCoinsPlayer();
const terminal = new MinCoinsTerminal();
const renderer = new MinCoinsRenderer(canvas, ctx);
const interactions = new MinCoinsInteractions(player, terminal);

// Canvas resizing
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Mouse wheel zoom
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
        camera.zoom = Math.min(MINCOINS_CONFIG.ZOOM_MAX, camera.zoom + MINCOINS_CONFIG.ZOOM_SPEED);
    } else {
        camera.zoom = Math.max(MINCOINS_CONFIG.ZOOM_MIN, camera.zoom - MINCOINS_CONFIG.ZOOM_SPEED);
    }
});

// Game loop
function gameLoop() {
    // Update player
    player.update();
    
    // Update camera to follow player
    camera.x = player.x;
    camera.y = player.y;
    
    // Render everything
    renderer.render(camera, player, terminal);
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Start the game
async function start() {
    console.log('MinCoins Init - Starting game...');
    console.log('Loading sprites from:', MINCOINS_CONFIG.SPRITE_FILES);
    
    await player.loadSprites();
    
    console.log('Sprite loading complete. Player sprites:', player.sprites);
    console.log('Sprites loaded count:', player.spritesLoaded);
    
    gameLoop();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}

// Make exit function available globally
window.exitCodeViewer = function() {
    window.location.href = '/';  // Go to root
};
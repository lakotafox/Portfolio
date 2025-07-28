// minCoins Init Script
// simple initialization without complex class structure

import { MINCOINS_CONFIG } from './mincoins-config.js';
import { MinCoinsPlayer } from './mincoins-player.js';
import { MinCoinsTerminal } from './mincoins-terminal.js';
import { MinCoinsInteractions } from './mincoins-interactions.js';
import { MinCoinsRenderer } from './mincoins-renderer.js';

// get canvas and context
const canvas = document.getElementById('codeCanvas');
const ctx = canvas.getContext('2d');

// initialize camera
const camera = {
    x: MINCOINS_CONFIG.CAMERA_START_X,
    y: MINCOINS_CONFIG.CAMERA_START_Y,
    zoom: 1
};

// initialize modules
const player = new MinCoinsPlayer();
const terminal = new MinCoinsTerminal();
const renderer = new MinCoinsRenderer(canvas, ctx);
const interactions = new MinCoinsInteractions(player, terminal);

// canvas resizing
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// mouse wheel zoom
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
        camera.zoom = Math.min(MINCOINS_CONFIG.ZOOM_MAX, camera.zoom + MINCOINS_CONFIG.ZOOM_SPEED);
    } else {
        camera.zoom = Math.max(MINCOINS_CONFIG.ZOOM_MIN, camera.zoom - MINCOINS_CONFIG.ZOOM_SPEED);
    }
});

// game loop
function gameLoop() {
    // update player
    player.update();
    
    // update camera to follow player
    camera.x = player.x;
    camera.y = player.y;
    
    // render everything
    renderer.render(camera, player, terminal);
    
    // continue loop
    requestAnimationFrame(gameLoop);
}

// start the game
async function start() {
    console.log('MinCoins Init - Starting game...');
    console.log('Loading sprites from:', MINCOINS_CONFIG.SPRITE_FILES);
    
    await player.loadSprites();
    
    console.log('Sprite loading complete. Player sprites:', player.sprites);
    console.log('Sprites loaded count:', player.spritesLoaded);
    
    gameLoop();
}

// initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}

// make exit function available globally
window.exitCodeViewer = function() {
    window.location.href = '/';  // go to root
};
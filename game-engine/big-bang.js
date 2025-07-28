// big bang - main game init and loop
import { Camera } from './camera/camera.js';
import { player, updatePlayer, drawPlayer } from './player-birth.js';
import { loadAllImages } from './tiles/tile-loader.js';
import { generateMap, mapGrid, GRID_SIZE } from './map/map-generator.js';
import { drawAllTiles } from './tile-renderer.js';
// projectmanager loaded as global from projects-global.js

// canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

console.log('Canvas size:', canvas.width, 'x', canvas.height);

// camera instance
export const camera = new Camera();

// keyboard state
const keys = {};

// music control
let musicToggled = false;
let musicStarted = false;
const bgMusic = document.getElementById('bgMusic');
if (bgMusic) bgMusic.volume = 0.3;

// initialize ProjectManager DOM elements after page loads
window.addEventListener('DOMContentLoaded', () => {
    ProjectManager.initDOM();
});

// input handling
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // start music on first input
    if (!musicStarted && bgMusic) {
        musicStarted = true;
        bgMusic.play().catch(e => console.log('Music error:', e));
    }
    
    // handle ENTER key for interaction
    if (e.key === 'Enter') {
        if (ProjectManager.markingMode) {
            // mark current location
            ProjectManager.markLocation(player.x, player.y, 80); // tILE_SIZE = 80
        } else if (ProjectManager.currentProject) {
            // view project
            if (ProjectManager.currentProject.url === 'projects/mincoins/mincoins-area.html') {
                window.location.href = ProjectManager.currentProject.url;
            } else {
                // for now, show alert for placeholder projects
                alert(`Project: ${ProjectManager.currentProject.name}\n\n${ProjectManager.currentProject.desc}\n\n(This is a placeholder - actual project coming soon!)`);
            }
        }
    }
    
    // handle M key for music toggle
    if (e.key.toLowerCase() === 'm' && !musicToggled) {
        musicToggled = true; // prevent rapid toggling
        if (bgMusic) {
            if (bgMusic.paused) {
                bgMusic.play().catch(e => console.log('Error playing music:', e));
            } else {
                bgMusic.pause();
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    
    // reset music toggle flag
    if (e.key.toLowerCase() === 'm') {
        musicToggled = false;
    }
    
    // exit project view on ESC
    if (e.key === 'Escape' && ProjectManager.currentProject) {
        ProjectManager.exitProject();
    }
});

// main game loop
function gameLoop() {
    // update
    updatePlayer(keys, mapGrid);
    camera.updateToFollowPlayer(player, canvas);
    
    // draw
    ctx.fillStyle = '#1a1a1a'; // dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // draw all tiles
    drawAllTiles(ctx, mapGrid, camera);
    
    // draw player
    drawPlayer(ctx, camera);
    
    // draw marking mode UI if active
    if (ProjectManager.markingMode) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('MARKING MODE - Press ENTER to mark project location', 10, 30);
    }
    
    requestAnimationFrame(gameLoop);
}

// start game after images are loaded
loadAllImages().then(() => {
    console.log('All images loaded');
    generateMap();
    gameLoop();
}).catch(err => {
    console.error('Error loading images:', err);
    generateMap();
    gameLoop(); // start anyway with fallback rendering
});

// exports
export { canvas, ctx, keys, mapGrid };
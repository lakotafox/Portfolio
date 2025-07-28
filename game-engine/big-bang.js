// Big Bang - Main game initialization and loop
import { Camera } from './camera/camera.js';
import { player, updatePlayer, drawPlayer } from './player-birth.js';
import { loadAllImages } from './tiles/tile-loader.js';
import { generateMap, mapGrid, GRID_SIZE } from './map/map-generator.js';
import { drawAllTiles } from './tile-renderer.js';
// ProjectManager is loaded as a global from projects-global.js

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

console.log('Canvas size:', canvas.width, 'x', canvas.height);

// Camera instance
export const camera = new Camera();

// Keyboard state
const keys = {};

// Initialize ProjectManager DOM elements after page loads
window.addEventListener('DOMContentLoaded', () => {
    ProjectManager.initDOM();
});

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Handle ENTER key for interaction
    if (e.key === 'Enter') {
        if (ProjectManager.markingMode) {
            // Mark current location
            ProjectManager.markLocation(player.x, player.y, 80); // TILE_SIZE = 80
        } else if (ProjectManager.currentProject) {
            // View project
            if (ProjectManager.currentProject.url === 'projects/mincoins/mincoins-area.html') {
                window.location.href = ProjectManager.currentProject.url;
            } else {
                // For now, show alert for placeholder projects
                alert(`Project: ${ProjectManager.currentProject.name}\n\n${ProjectManager.currentProject.desc}\n\n(This is a placeholder - actual project coming soon!)`);
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    
    // Exit project view on ESC
    if (e.key === 'Escape' && ProjectManager.currentProject) {
        ProjectManager.exitProject();
    }
});

// Main game loop
function gameLoop() {
    // Update
    updatePlayer(keys, mapGrid);
    camera.updateToFollowPlayer(player, canvas);
    
    // Draw
    ctx.fillStyle = '#1a1a1a'; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all tiles
    drawAllTiles(ctx, mapGrid, camera);
    
    // Draw player
    drawPlayer(ctx, camera);
    
    // Draw marking mode UI if active
    if (ProjectManager.markingMode) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('MARKING MODE - Press ENTER to mark project location', 10, 30);
    }
    
    requestAnimationFrame(gameLoop);
}

// Start game after images are loaded
loadAllImages().then(() => {
    console.log('All images loaded');
    generateMap();
    gameLoop();
}).catch(err => {
    console.error('Error loading images:', err);
    generateMap();
    gameLoop(); // Start anyway with fallback rendering
});

// Exports
export { canvas, ctx, keys, mapGrid };
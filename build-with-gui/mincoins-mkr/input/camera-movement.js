// Camera and movement system

const keys = {};

function setupMovementControls() {
    window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
}

function updateCamera(camera, hammer) {
    const speed = 5;
    if (keys['w'] || keys['arrowup']) {
        hammer.y -= speed;
        camera.y -= speed;
    }
    if (keys['s'] || keys['arrowdown']) {
        hammer.y += speed;
        camera.y += speed;
    }
    if (keys['a'] || keys['arrowleft']) {
        hammer.x -= speed;
        camera.x -= speed;
    }
    if (keys['d'] || keys['arrowright']) {
        hammer.x += speed;
        camera.x += speed;
    }
}

function screenToWorld(screenX, screenY, canvas, camera) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    const worldX = (canvasX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (canvasY - canvas.height / 2) / camera.zoom + camera.y;
    return { x: worldX, y: worldY };
}
// Main MinCoins Builder Script
// This file coordinates all the modules for the MinCoins maker tool

// Canvas setup
const canvas = document.getElementById('builderCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// State
const camera = { x: 400, y: 300, zoom: 1 };
const hammer = { x: 400, y: 300, width: 32, height: 32 };
let hammerImage = new Image();
let hammerLoaded = false;
hammerImage.onload = () => { hammerLoaded = true; };
hammerImage.src = 'hammer.png';

let codeImage = new Image();
let codeImageLoaded = false;
codeImage.onload = () => { codeImageLoaded = true; };
codeImage.src = '../mincoins-netbeans.png';

let signs = [];
let selectedSign = null;
let dragOffset = { x: 0, y: 0 };
let isResizing = false;
let isDragging = false;
let nextId = 1;

// Movement setup
setupMovementControls();

// Drag and drop
document.querySelectorAll('.sign-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
    });
});

canvas.addEventListener('dragover', (e) => e.preventDefault());

canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    const world = screenToWorld(e.clientX, e.clientY, canvas, camera);
    const newSign = addSign(type, world.x, world.y, nextId++);
    signs.push(newSign);
    selectedSign = newSign;
});

// Mouse interaction
let mouseDownTime = 0;
let clickTimer = null;
let hasDragged = false;

canvas.addEventListener('mousedown', (e) => {
    const world = screenToWorld(e.clientX, e.clientY, canvas, camera);
    mouseDownTime = Date.now();
    hasDragged = false;
    selectedSign = null;
    isResizing = false;
    isDragging = false;
    
    // Check resize handle first
    for (let sign of signs) {
        if (world.x >= sign.x + sign.width - 10 && world.x <= sign.x + sign.width + 10 &&
            world.y >= sign.y + sign.height - 10 && world.y <= sign.y + sign.height + 10) {
            selectedSign = sign;
            isResizing = true;
            isDragging = true;
            return;
        }
    }
    
    // Check sign selection
    for (let i = signs.length - 1; i >= 0; i--) {
        const sign = signs[i];
        if (world.x >= sign.x && world.x <= sign.x + sign.width &&
            world.y >= sign.y && world.y <= sign.y + sign.height) {
            selectedSign = sign;
            dragOffset.x = world.x - sign.x;
            dragOffset.y = world.y - sign.y;
            
            clickTimer = setTimeout(() => {
                isDragging = true;
            }, 150);
            break;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (selectedSign && isDragging) {
        hasDragged = true;
        const world = screenToWorld(e.clientX, e.clientY, canvas, camera);
        
        if (isResizing) {
            selectedSign.width = Math.max(50, world.x - selectedSign.x);
            selectedSign.height = Math.max(30, world.y - selectedSign.y);
        } else {
            selectedSign.x = world.x - dragOffset.x;
            selectedSign.y = world.y - dragOffset.y;
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    clearTimeout(clickTimer);
    const clickDuration = Date.now() - mouseDownTime;
    
    if (selectedSign && clickDuration < 150 && !hasDragged && !isResizing) {
        signs = signs.filter(sign => sign !== selectedSign);
        selectedSign = null;
    }
    
    isDragging = false;
    isResizing = false;
});

canvas.addEventListener('dblclick', (e) => {
    const world = screenToWorld(e.clientX, e.clientY, canvas, camera);
    
    for (let i = 0; i < signs.length; i++) {
        const sign = signs[i];
        if (world.x >= sign.x && world.x <= sign.x + sign.width &&
            world.y >= sign.y && world.y <= sign.y + sign.height) {
            const newText = prompt('Edit sign text:', sign.text);
            if (newText !== null && newText.trim() !== '') {
                sign.text = newText;
            }
            break;
        }
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && selectedSign) {
        signs = signs.filter(sign => sign !== selectedSign);
        selectedSign = null;
    }
});

// Render function
function render() {
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    // Draw NetBeans background
    if (codeImageLoaded && codeImage) {
        const imageWidth = 800;
        const imageHeight = (codeImage.height / codeImage.width) * imageWidth;
        ctx.drawImage(codeImage, 50, 50, imageWidth, imageHeight);
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(50, 50, 800, 600);
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', 450, 350);
    }
    
    // Draw signs
    signs.forEach(sign => {
        drawSign(ctx, sign);
        
        // Selection highlight
        if (sign === selectedSign) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(sign.x - 2, sign.y - 2, sign.width + 4, sign.height + 4);
            
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(sign.x + sign.width - 4, sign.y + sign.height - 4, 8, 8);
        }
    });
    
    // Draw hammer
    drawHammer(ctx, hammer, hammerImage, hammerLoaded);
    
    ctx.restore();
}

// Export functions
function clearAll() {
    if (confirm('Clear all signs?')) {
        signs = [];
        selectedSign = null;
    }
}

function exportLayout() {
    const layout = {
        items: signs.map(sign => ({
            type: sign.type,
            x: sign.x,
            y: sign.y,
            width: sign.width,
            height: sign.height,
            text: sign.text,
            arrow: sign.arrow
        })),
        timestamp: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(layout, null, 2);
    const popup = window.open('', 'JSON Layout', 'width=600,height=800,scrollbars=yes,resizable=yes');
    popup.document.write(`
        <html>
        <head><title>Signs Layout JSON</title></head>
        <body style="font-family: monospace; padding: 20px;">
            <h2>Signs Layout JSON - Copy and Paste</h2>
            <textarea style="width: 100%; height: 90%; font-family: monospace;" readonly>${jsonString}</textarea>
        </body>
        </html>
    `);
    popup.document.close();
}

// Game loop
function gameLoop() {
    updateCamera(camera, hammer);
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// Export to window
window.clearAll = clearAll;
window.exportLayout = exportLayout;
const canvas = document.getElementById('builderCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    // Match viewport size like mincoins-area
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Camera system - matches mincoins-area exactly
const camera = { x: 400, y: 300, zoom: 1 };

// Player/hammer for navigation
const hammer = { x: 400, y: 300, width: 32, height: 32 };
let hammerImage = new Image();
let hammerLoaded = false;
hammerImage.onload = () => { hammerLoaded = true; };
hammerImage.src = 'hammer.png';

// Load NetBeans image
const codeImage = new Image();
let codeImageLoaded = false;
codeImage.onload = () => { codeImageLoaded = true; };
codeImage.src = '../mincoins-netbeans.png';

// signs array - start with existing signs from mincoins-area
// this represents the current layout that can be edited
// when you export, this data will be formatted as json
let signs = [];  // Start with empty signs array
let selectedSign = null;
let dragOffset = { x: 0, y: 0 };
let isResizing = false;
let isDragging = false;
let nextId = 1;  // Start ID from 1 since we have no initial signs

// Input for camera movement
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function updateCamera() {
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

// Coordinate conversion - accounts for camera transform
function screenToWorld(screenX, screenY) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    const worldX = (canvasX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (canvasY - canvas.height / 2) / camera.zoom + camera.y;
    return { x: worldX, y: worldY };
}

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
    const world = screenToWorld(e.clientX, e.clientY);
    addSign(type, world.x, world.y);
});

function addSign(type, x, y) {
    const arrows = {
        'sign-down': '↓',
        'sign-up': '↑',
        'sign-left': '←',
        'sign-right': '→'
    };
    
    const texts = {
        'sign-down': 'Walk Down',
        'sign-up': 'Walk Up',
        'sign-left': 'Check out this Code!',
        'sign-right': 'Walk Right'
    };
    
    let sign;
    
    if (type === 'terminal') {
        sign = {
            id: nextId++,
            type: type,
            x: x,
            y: y,
            width: 300,
            height: 200,
            text: 'Terminal',
            arrow: null
        };
    } else if (type === 'run-button') {
        sign = {
            id: nextId++,
            type: type,
            x: x,
            y: y,
            width: 80,
            height: 40,
            text: 'RUN',
            arrow: null
        };
    } else if (type.startsWith('number-')) {
        const number = type.split('-')[1];
        sign = {
            id: nextId++,
            type: type,
            x: x,
            y: y,
            width: 40,
            height: 40,
            text: number,
            arrow: null,
            number: parseInt(number)
        };
    } else if (type === 'enter-key') {
        sign = {
            id: nextId++,
            type: type,
            x: x,
            y: y,
            width: 80,
            height: 40,
            text: 'ENTER',
            arrow: null
        };
    } else {
        sign = {
            id: nextId++,
            type: type,
            x: x,
            y: y,
            width: 120,
            height: 80,
            text: texts[type],
            arrow: arrows[type]
        };
    }
    
    signs.push(sign);
    selectedSign = sign;
}

// Mouse interaction
let mouseDownTime = 0;
let clickTimer = null;
let hasDragged = false;

canvas.addEventListener('mousedown', (e) => {
    const world = screenToWorld(e.clientX, e.clientY);
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
            
            // Start timer for drag vs click
            clickTimer = setTimeout(() => {
                isDragging = true;
            }, 150); // 150ms hold to start dragging
            break;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (selectedSign && isDragging) {
        hasDragged = true;
        const world = screenToWorld(e.clientX, e.clientY);
        
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
    
    // If it was a quick click and no dragging, delete the sign
    if (selectedSign && clickDuration < 150 && !hasDragged && !isResizing) {
        signs = signs.filter(sign => sign !== selectedSign);
        selectedSign = null;
    }
    
    isDragging = false;
    isResizing = false;
});

// Double-click to edit text
canvas.addEventListener('dblclick', (e) => {
    const world = screenToWorld(e.clientX, e.clientY);
    
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

// Drawing
function drawSign(sign) {
    if (sign.type === 'terminal') {
        // Draw terminal background
        ctx.fillStyle = '#000000';
        ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
        
        // Terminal border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
        
        // Terminal header
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Terminal Output', sign.x + 5, sign.y + 15);
        
        // Terminal lines (placeholder)
        ctx.font = '10px monospace';
        ctx.fillText('> MinCoins Program Ready', sign.x + 5, sign.y + 35);
        ctx.fillText('> Walk to RUN button and press ENTER', sign.x + 5, sign.y + 50);
    } else if (sign.type === 'run-button') {
        // Draw run button
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
        
        // Button border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
        
        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RUN', sign.x + sign.width/2, sign.y + sign.height/2 + 5);
    } else if (sign.type.startsWith('number-')) {
        // Draw number key (old-school keyboard style)
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
        
        // Key border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
        
        // Inner shadow effect
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(sign.x + 2, sign.y + 2, sign.width - 4, sign.height - 4);
        
        // Number text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(sign.text, sign.x + sign.width/2, sign.y + sign.height/2 + 6);
    } else if (sign.type === 'enter-key') {
        // Draw enter key (old-school keyboard style)
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
        
        // Key border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
        
        // Inner shadow effect
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(sign.x + 2, sign.y + 2, sign.width - 4, sign.height - 4);
        
        // Enter text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ENTER', sign.x + sign.width/2, sign.y + sign.height/2 + 5);
    } else {
        // Wooden sign background
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
        
        // Frame
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
        
        // Arrow
        if (sign.arrow) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(sign.arrow, sign.x + sign.width/2, sign.y + 30);
        }
        
        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const words = sign.text.split(' ');
        words.forEach((word, index) => {
            ctx.fillText(word, sign.x + sign.width/2, sign.y + 50 + (index * 12));
        });
    }
}

function render() {
    // Clear
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply camera transform - EXACT same as mincoins-area
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    // Draw NetBeans background - EXACT same as mincoins-area
    if (codeImageLoaded && codeImage) {
        const imageWidth = 800; // CODE_WIDTH from config
        const imageHeight = (codeImage.height / codeImage.width) * imageWidth;
        ctx.drawImage(codeImage, 50, 50, imageWidth, imageHeight); // CODE_START_X, CODE_START_Y
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
        drawSign(sign);
        
        // Selection highlight
        if (sign === selectedSign) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(sign.x - 2, sign.y - 2, sign.width + 4, sign.height + 4);
            
            // Resize handle
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(sign.x + sign.width - 4, sign.y + sign.height - 4, 8, 8);
        }
    });
    
    // Draw hammer (always on top)
    if (hammerLoaded && hammerImage) {
        ctx.drawImage(
            hammerImage,
            hammer.x - hammer.width / 2,
            hammer.y - hammer.height / 2,
            hammer.width,
            hammer.height
        );
    } else {
        // Draw placeholder hammer
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(
            hammer.x - hammer.width / 2,
            hammer.y - hammer.height / 2,
            hammer.width,
            hammer.height
        );
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨', hammer.x, hammer.y + 4);
    }
    
    ctx.restore();
}

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

// Delete key to remove selected sign
window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && selectedSign) {
        signs = signs.filter(sign => sign !== selectedSign);
        selectedSign = null;
    }
});

// Game loop
function gameLoop() {
    updateCamera();
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// Export functions to window for button clicks
window.clearAll = clearAll;
window.exportLayout = exportLayout;
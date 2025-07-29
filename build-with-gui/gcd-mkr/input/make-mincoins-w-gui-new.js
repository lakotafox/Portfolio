// main MinCoins builder Script
// this file coordinates all the modules for the MinCoins maker tool

// canvas setup
const canvas = document.getElementById('builderCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// state
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

// load gcd images
let gcd1Image = new Image();
let gcd1Loaded = false;
gcd1Image.onload = () => { gcd1Loaded = true; };
gcd1Image.src = '../GCD1.png';

let gcd2Image = new Image();
let gcd2Loaded = false;
gcd2Image.onload = () => { gcd2Loaded = true; };
gcd2Image.src = '../GCD2.png';

// preload mincoins layout to position gcd items relative to it
const minCoinsLayout = [
    {"type": "sign-down", "x": 589, "y": 179, "width": 120, "height": 80, "text": "Walk Down", "arrow": "↓"},
    {"type": "sign-left", "x": 614, "y": 712, "width": 123, "height": 117, "text": "Check out this Code!", "arrow": "←"},
    {"type": "run-button", "x": 52, "y": 1209, "width": 80, "height": 40, "text": "RUN", "arrow": null},
    {"type": "terminal", "x": 137, "y": 1211, "width": 607, "height": 141, "text": "Terminal", "arrow": null},
    {"type": "number-0", "x": 138, "y": 1361, "width": 40, "height": 40, "text": "0", "arrow": null, "number": 0},
    {"type": "number-1", "x": 206, "y": 1363, "width": 40, "height": 40, "text": "1", "arrow": null, "number": 1},
    {"type": "number-2", "x": 276, "y": 1362, "width": 40, "height": 40, "text": "2", "arrow": null, "number": 2},
    {"type": "number-3", "x": 341, "y": 1361, "width": 40, "height": 40, "text": "3", "arrow": null, "number": 3},
    {"type": "number-4", "x": 406, "y": 1363, "width": 40, "height": 40, "text": "4", "arrow": null, "number": 4},
    {"type": "number-5", "x": 470, "y": 1362, "width": 40, "height": 40, "text": "5", "arrow": null, "number": 5},
    {"type": "number-6", "x": 540, "y": 1363, "width": 40, "height": 40, "text": "6", "arrow": null, "number": 6},
    {"type": "number-7", "x": 605, "y": 1362, "width": 40, "height": 40, "text": "7", "arrow": null, "number": 7},
    {"type": "number-8", "x": 669, "y": 1362, "width": 40, "height": 40, "text": "8", "arrow": null, "number": 8},
    {"type": "enter-key", "x": 421, "y": 1424, "width": 80, "height": 40, "text": "ENTER", "arrow": null},
    {"type": "number-9", "x": 734, "y": 1361, "width": 40, "height": 40, "text": "9", "arrow": null, "number": 9}
];

// start with empty signs array - mincoins items will be drawn separately for reference
let signs = [];
let selectedSign = null;
let dragOffset = { x: 0, y: 0 };
let isResizing = false;
let isDragging = false;
let nextId = 1;

// movement setup
setupMovementControls();

// drag and drop
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
    
    // immediately prompt for text if it's a sign
    if (type.startsWith('sign-')) {
        const customText = prompt('Enter sign text:', newSign.text);
        if (customText !== null && customText.trim() !== '') {
            newSign.text = customText;
        }
    }
    
    signs.push(newSign);
    selectedSign = newSign;
});

// mouse interaction
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
    
    // check resize handle first
    for (let sign of signs) {
        if (world.x >= sign.x + sign.width - 10 && world.x <= sign.x + sign.width + 10 &&
            world.y >= sign.y + sign.height - 10 && world.y <= sign.y + sign.height + 10) {
            selectedSign = sign;
            isResizing = true;
            isDragging = true;
            return;
        }
    }
    
    // check sign selection
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

// render function
function render() {
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    // draw NetBeans background
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
    
    // draw mincoins items as reference (with opacity)
    ctx.globalAlpha = 0.3;
    minCoinsLayout.forEach(item => {
        drawSign(ctx, item, { gcd1Image, gcd1Loaded, gcd2Image, gcd2Loaded });
    });
    ctx.globalAlpha = 1.0;
    
    // draw gcd signs
    signs.forEach(sign => {
        drawSign(ctx, sign, { gcd1Image, gcd1Loaded, gcd2Image, gcd2Loaded });
        
        // selection highlight
        if (sign === selectedSign) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(sign.x - 2, sign.y - 2, sign.width + 4, sign.height + 4);
            
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(sign.x + sign.width - 4, sign.y + sign.height - 4, 8, 8);
        }
    });
    
    // draw hammer
    drawHammer(ctx, hammer, hammerImage, hammerLoaded);
    
    ctx.restore();
}

// export functions
function clearAll() {
    if (confirm('Clear all GCD signs?')) {
        signs = [];
        selectedSign = null;
    }
}

function exportLayout() {
    // export only gcd items
    const gcdItems = signs.map(sign => ({
        type: sign.type,
        x: sign.x,
        y: sign.y,
        width: sign.width,
        height: sign.height,
        text: sign.text,
        arrow: sign.arrow
    }));
    
    // combine mincoins and gcd items for the full layout
    const allItems = [
        ...minCoinsLayout.map(item => ({...item, project: 'mincoins'})),
        ...gcdItems.map(item => ({...item, project: 'gcd'}))
    ];
    
    const layout = {
        minCoinsItems: minCoinsLayout,
        gcdItems: gcdItems,
        allItems: allItems,
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

// game loop
function gameLoop() {
    updateCamera(camera, hammer);
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// export to window
window.clearAll = clearAll;
window.exportLayout = exportLayout;
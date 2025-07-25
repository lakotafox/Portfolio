// Node.js script to generate hero sprite
const fs = require('fs');
const { createCanvas } = require('canvas');

const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Knight colors
const colors = {
    armor: '#c0c0c0',
    helmet: '#a0a0a0',
    plume: '#ff4444',
    tunic: '#4444ff',
    skin: '#ffdbac',
    boots: '#8b4513',
    sword: '#ffd700',
    blade: '#e6e6e6'
};

function drawPixel(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

// Clear with transparency
ctx.clearRect(0, 0, 32, 32);

// Draw simple knight
// Helmet plume
drawPixel(13, 2, colors.plume);
drawPixel(14, 1, colors.plume);
drawPixel(15, 2, colors.plume);

// Helmet
for (let x = 11; x <= 16; x++) {
    for (let y = 4; y <= 7; y++) {
        drawPixel(x, y, colors.helmet);
    }
}

// Face
for (let x = 12; x <= 15; x++) {
    drawPixel(x, 6, colors.skin);
}

// Body armor
for (let y = 8; y <= 11; y++) {
    for (let x = 9; x <= 18; x++) {
        drawPixel(x, y, colors.armor);
    }
}

// Tunic
for (let y = 12; y <= 16; y++) {
    for (let x = 10; x <= 17; x++) {
        drawPixel(x, y, colors.tunic);
    }
}

// Arms
for (let y = 9; y <= 12; y++) {
    drawPixel(7, y, colors.armor);
    drawPixel(20, y, colors.armor);
}

// Legs
for (let y = 17; y <= 21; y++) {
    drawPixel(11, y, colors.armor);
    drawPixel(12, y, colors.armor);
    drawPixel(15, y, colors.armor);
    drawPixel(16, y, colors.armor);
}

// Boots
for (let y = 22; y <= 23; y++) {
    for (let x = 10; x <= 17; x++) {
        drawPixel(x, y, colors.boots);
    }
}

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('hero.png', buffer);
console.log('Hero sprite generated!');
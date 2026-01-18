// Neon Cycle Arena - Browser Light Bike Game
// A TRON-style light bike game in a fake terminal

const SCREEN_WIDTH = 80;
const SCREEN_HEIGHT = 30;
const FPS = 10;

// Audio context for sound effects
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(frequency, duration, type = 'square', volume = 0.3) {
  if (!audioCtx) return;
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.value = volume;

  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

function playMoveSound() {
  playTone(200, 0.05, 'square', 0.1);
}

function playCrashSound() {
  playTone(100, 0.3, 'sawtooth', 0.4);
  setTimeout(() => playTone(80, 0.2, 'sawtooth', 0.3), 100);
  setTimeout(() => playTone(60, 0.3, 'sawtooth', 0.2), 200);
}

function playWinSound() {
  playTone(523, 0.15, 'square', 0.3);
  setTimeout(() => playTone(659, 0.15, 'square', 0.3), 150);
  setTimeout(() => playTone(784, 0.3, 'square', 0.3), 300);
}

function playBootSound() {
  playTone(440, 0.1, 'sine', 0.2);
}

function playStartSound() {
  playTone(330, 0.1, 'square', 0.3);
  setTimeout(() => playTone(440, 0.1, 'square', 0.3), 100);
  setTimeout(() => playTone(550, 0.2, 'square', 0.3), 200);
}

// Direction constants
const DIR = {
  UP: { x: 0, y: -1, sprite: '▲' },
  DOWN: { x: 0, y: 1, sprite: '▼' },
  LEFT: { x: -1, y: 0, sprite: '◄' },
  RIGHT: { x: 1, y: 0, sprite: '►' }
};

// Game state
let gameState = 'boot'; // boot, menu, playing, win, lose
let screen = document.getElementById('game-screen');
let grid = [];
let player = null;
let enemies = [];
let frameCount = 0;
let bootStep = 0;

// Trail characters - using simple block for consistent look
const TRAIL_CHAR = '█';

// Initialize empty grid
function initGrid() {
  grid = [];
  for (let y = 0; y < SCREEN_HEIGHT; y++) {
    grid[y] = [];
    for (let x = 0; x < SCREEN_WIDTH; x++) {
      grid[y][x] = { char: ' ', color: 'white' };
    }
  }
}

// Bike class
class Bike {
  constructor(x, y, direction, color, isPlayer = false) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.color = color;
    this.isPlayer = isPlayer;
    this.alive = true;
    this.trail = [];
  }

  move() {
    if (!this.alive) return;

    // Add current position to trail with direction vector
    this.trail.push({ x: this.x, y: this.y, age: 0, dx: this.direction.x, dy: this.direction.y });

    // Move in current direction
    this.x += this.direction.x;
    this.y += this.direction.y;

    // Wrap around (tunnel)
    if (this.x <= 0) this.x = SCREEN_WIDTH - 2;
    if (this.x >= SCREEN_WIDTH - 1) this.x = 1;
    if (this.y <= 1) this.y = SCREEN_HEIGHT - 2;
    if (this.y >= SCREEN_HEIGHT - 1) this.y = 2;
  }

  setDirection(dir) {
    // Prevent 180-degree turns
    if (this.direction.x + dir.x === 0 && this.direction.y + dir.y === 0) {
      return;
    }
    if (this.isPlayer && (this.direction.x !== dir.x || this.direction.y !== dir.y)) {
      playMoveSound();
    }
    this.direction = dir;
  }

  checkCollision(allBikes) {
    if (!this.alive) return false;

    // Check wall collision (borders)
    if (this.x <= 0 || this.x >= SCREEN_WIDTH - 1 ||
        this.y <= 1 || this.y >= SCREEN_HEIGHT - 1) {
      return true;
    }

    // Check trail collision (self and others)
    for (const bike of allBikes) {
      for (const segment of bike.trail) {
        if (segment.x === this.x && segment.y === this.y) {
          return true;
        }
      }
    }

    return false;
  }
}

// Simple AI for enemy bikes
function updateAI(enemy, player, allBikes) {
  if (!enemy.alive || !player.alive) return;

  // Get possible directions
  const directions = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
  const validDirs = [];

  for (const dir of directions) {
    // Skip reverse direction
    if (enemy.direction.x + dir.x === 0 && enemy.direction.y + dir.y === 0) {
      continue;
    }

    // Check if this direction is safe (look ahead 3 steps)
    let safe = true;
    let testX = enemy.x;
    let testY = enemy.y;

    for (let i = 0; i < 3; i++) {
      testX += dir.x;
      testY += dir.y;

      // Check wall collision
      if (testX <= 0 || testX >= SCREEN_WIDTH - 1 || testY <= 1 || testY >= SCREEN_HEIGHT - 1) {
        safe = false;
        break;
      }

      // Check for trail collision
      for (const bike of allBikes) {
        for (const segment of bike.trail) {
          if (segment.x === testX && segment.y === testY) {
            safe = false;
            break;
          }
        }
        if (!safe) break;
      }
      if (!safe) break;
    }

    if (safe) {
      validDirs.push(dir);
    }
  }

  // Choose a direction
  if (validDirs.length > 0) {
    // 30% chance to chase player
    if (Math.random() < 0.3) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;

      for (const dir of validDirs) {
        if ((dir.x > 0 && dx > 0) || (dir.x < 0 && dx < 0) ||
            (dir.y > 0 && dy > 0) || (dir.y < 0 && dy < 0)) {
          enemy.setDirection(dir);
          return;
        }
      }
    }

    // Random valid direction
    enemy.setDirection(validDirs[Math.floor(Math.random() * validDirs.length)]);
  }
}

// Draw border
function drawBorder() {
  // Top border
  grid[0][0] = { char: '╔', color: 'yellow' };
  for (let x = 1; x < SCREEN_WIDTH - 1; x++) {
    grid[0][x] = { char: '═', color: 'yellow' };
  }
  grid[0][SCREEN_WIDTH - 1] = { char: '╗', color: 'yellow' };

  // Title
  const title = ' NEON CYCLE ARENA ';
  const titleStart = Math.floor((SCREEN_WIDTH - title.length) / 2);
  for (let i = 0; i < title.length; i++) {
    grid[0][titleStart + i] = { char: title[i], color: 'cyan' };
  }

  // Bottom border
  grid[SCREEN_HEIGHT - 1][0] = { char: '╚', color: 'yellow' };
  for (let x = 1; x < SCREEN_WIDTH - 1; x++) {
    grid[SCREEN_HEIGHT - 1][x] = { char: '═', color: 'yellow' };
  }
  grid[SCREEN_HEIGHT - 1][SCREEN_WIDTH - 1] = { char: '╝', color: 'yellow' };

  // Side borders
  for (let y = 1; y < SCREEN_HEIGHT - 1; y++) {
    grid[y][0] = { char: '║', color: 'yellow' };
    grid[y][SCREEN_WIDTH - 1] = { char: '║', color: 'yellow' };
  }

  // Tunnel indicators
  grid[Math.floor(SCREEN_HEIGHT / 2)][0] = { char: '◄', color: 'magenta' };
  grid[Math.floor(SCREEN_HEIGHT / 2)][SCREEN_WIDTH - 1] = { char: '►', color: 'magenta' };
  grid[1][Math.floor(SCREEN_WIDTH / 2)] = { char: '▲', color: 'magenta' };
  grid[SCREEN_HEIGHT - 2][Math.floor(SCREEN_WIDTH / 2)] = { char: '▼', color: 'magenta' };
}

// Draw trails
function drawTrails() {
  const allBikes = [player, ...enemies];

  for (const bike of allBikes) {
    if (!bike) continue;

    for (const segment of bike.trail) {
      // Age the trail
      segment.age++;

      if (segment.y >= 0 && segment.y < SCREEN_HEIGHT &&
          segment.x >= 0 && segment.x < SCREEN_WIDTH) {
        grid[segment.y][segment.x] = { char: TRAIL_CHAR, color: bike.color };
      }
    }
  }
}

// Draw bikes
function drawBikes() {
  const allBikes = [player, ...enemies];

  for (const bike of allBikes) {
    if (!bike || !bike.alive) continue;

    if (bike.y >= 0 && bike.y < SCREEN_HEIGHT &&
        bike.x >= 0 && bike.x < SCREEN_WIDTH) {
      grid[bike.y][bike.x] = {
        char: bike.direction.sprite,
        color: bike.color
      };
    }
  }
}

// Render grid to screen
function render() {
  let html = '';

  for (let y = 0; y < SCREEN_HEIGHT; y++) {
    for (let x = 0; x < SCREEN_WIDTH; x++) {
      const cell = grid[y][x];
      html += `<span class="${cell.color}">${cell.char}</span>`;
    }
    html += '\n';
  }

  screen.innerHTML = html;
}

// Boot sequence
function bootSequence() {
  const bootLines = [
    { text: 'INITIALIZING NEON CYCLE ARENA...', color: 'cyan' },
    { text: 'LOADING GRID MATRIX............', color: 'green' },
    { text: 'CALIBRATING LIGHT TRAILS.......', color: 'magenta' },
    { text: 'SYNCING ENEMY AI PROTOCOLS.....', color: 'red' },
    { text: 'CHARGING NEON CAPACITORS.......', color: 'yellow' },
    { text: '', color: 'white' },
    { text: '████████████████████████████████████████', color: 'cyan' },
    { text: '', color: 'white' },
    { text: 'SYSTEM READY.', color: 'green' },
    { text: '', color: 'white' },
    { text: '+==================================================+', color: 'yellow' },
    { text: '|                                                  |', color: 'yellow' },
    { text: '|', color: 'yellow', append: '        N E O N   C Y C L E   A R E N A          ', appendColor: 'cyan', end: '|' },
    { text: '|', color: 'yellow', append: '             ═══════════════════                 ', appendColor: 'magenta', end: '|' },
    { text: '|                                                  |', color: 'yellow' },
    { text: '|', color: 'yellow', append: '      Crash your enemies into the walls         ', appendColor: 'white', end: '|' },
    { text: '|', color: 'yellow', append: '          or their own light trails!            ', appendColor: 'white', end: '|' },
    { text: '|                                                  |', color: 'yellow' },
    { text: '|', color: 'yellow', append: '          [ PRESS SPACE TO START ]              ', appendColor: 'green', end: '|' },
    { text: '|                                                  |', color: 'yellow' },
    { text: '+==================================================+', color: 'yellow' },
  ];

  if (bootStep < bootLines.length) {
    let html = '';
    for (let i = 0; i <= bootStep; i++) {
      const line = bootLines[i];
      if (line.append) {
        html += `<span class="${line.color}">${line.text}</span><span class="${line.appendColor}">${line.append}</span><span class="${line.color}">${line.end}</span>\n`;
      } else {
        html += `<span class="${line.color}">${line.text}</span>\n`;
      }
    }
    screen.innerHTML = html;
    bootStep++;
    // Play boot sound on some steps
    if (bootStep <= 5) {
      initAudio();
      playBootSound();
    }
    setTimeout(bootSequence, 120);
  } else {
    gameState = 'menu';
  }
}

// Start game
function startGame() {
  initAudio();
  playStartSound();
  gameState = 'playing';
  initGrid();

  // Create player (cyan, left side)
  player = new Bike(10, Math.floor(SCREEN_HEIGHT / 2), DIR.RIGHT, 'cyan', true);

  // Create enemies (red, right side)
  enemies = [
    new Bike(SCREEN_WIDTH - 10, Math.floor(SCREEN_HEIGHT / 2) - 5, DIR.LEFT, 'red'),
    new Bike(SCREEN_WIDTH - 10, Math.floor(SCREEN_HEIGHT / 2) + 5, DIR.LEFT, 'red')
  ];

  frameCount = 0;
}

// Show win screen
function showWinScreen() {
  playWinSound();
  initGrid();
  drawBorder();

  const messages = [
    '+===============================+',
    '|                               |',
    '|          YOU WIN!             |',
    '|    All enemies eliminated!    |',
    '|                               |',
    '|   [ PRESS SPACE TO RETRY ]    |',
    '|                               |',
    '+===============================+',
  ];

  const startY = Math.floor((SCREEN_HEIGHT - messages.length) / 2);
  const startX = Math.floor((SCREEN_WIDTH - messages[0].length) / 2);

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    for (let x = 0; x < msg.length; x++) {
      if (startX + x >= 0 && startX + x < SCREEN_WIDTH) {
        grid[startY + i][startX + x] = { char: msg[x], color: 'green' };
      }
    }
  }

  render();
}

// Show lose screen
function showLoseScreen() {
  playCrashSound();
  initGrid();
  drawBorder();

  const messages = [
    '+===============================+',
    '|                               |',
    '|         GAME OVER             |',
    '|        You crashed!           |',
    '|                               |',
    '|   [ PRESS SPACE TO RETRY ]    |',
    '|                               |',
    '+===============================+',
  ];

  const startY = Math.floor((SCREEN_HEIGHT - messages.length) / 2);
  const startX = Math.floor((SCREEN_WIDTH - messages[0].length) / 2);

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    for (let x = 0; x < msg.length; x++) {
      if (startX + x >= 0 && startX + x < SCREEN_WIDTH) {
        grid[startY + i][startX + x] = { char: msg[x], color: 'red' };
      }
    }
  }

  render();
}

// Main game loop
function gameLoop() {
  if (gameState !== 'playing') return;

  frameCount++;
  initGrid();
  drawBorder();

  // Update AI
  for (const enemy of enemies) {
    if (enemy.alive) {
      updateAI(enemy, player, [player, ...enemies]);
    }
  }

  // Move all bikes
  player.move();
  for (const enemy of enemies) {
    enemy.move();
  }

  // Check collisions
  const allBikes = [player, ...enemies];

  if (player.checkCollision(allBikes)) {
    player.alive = false;
    gameState = 'lose';
    showLoseScreen();
    return;
  }

  for (const enemy of enemies) {
    if (enemy.alive && enemy.checkCollision(allBikes)) {
      enemy.alive = false;
      playTone(150, 0.2, 'sawtooth', 0.2); // Enemy crash sound
    }
  }

  // Check win condition
  const aliveEnemies = enemies.filter(e => e.alive).length;
  if (aliveEnemies === 0) {
    gameState = 'win';
    showWinScreen();
    return;
  }

  // Draw everything
  drawTrails();
  drawBikes();

  // Draw score/status
  const status = `Enemies: ${aliveEnemies}`;
  for (let i = 0; i < status.length; i++) {
    grid[SCREEN_HEIGHT - 1][2 + i] = { char: status[i], color: 'cyan' };
  }

  render();
}

// Input handling
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (gameState === 'menu' || gameState === 'win' || gameState === 'lose') {
      startGame();
    }
    return;
  }

  if (gameState !== 'playing' || !player || !player.alive) return;

  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      e.preventDefault();
      player.setDirection(DIR.UP);
      break;
    case 'ArrowDown':
    case 'KeyS':
      e.preventDefault();
      player.setDirection(DIR.DOWN);
      break;
    case 'ArrowLeft':
    case 'KeyA':
      e.preventDefault();
      player.setDirection(DIR.LEFT);
      break;
    case 'ArrowRight':
    case 'KeyD':
      e.preventDefault();
      player.setDirection(DIR.RIGHT);
      break;
  }
});

// Start the game
bootSequence();
setInterval(gameLoop, 1000 / FPS);

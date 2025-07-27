// MinCoins Player Module
// Handles player state, movement, and sprites

import { MINCOINS_CONFIG } from './mincoins-config.js';

export class MinCoinsPlayer {
    constructor() {
        this.x = MINCOINS_CONFIG.PLAYER_START_X;
        this.y = MINCOINS_CONFIG.PLAYER_START_Y;
        this.speed = MINCOINS_CONFIG.PLAYER_SPEED;
        this.width = MINCOINS_CONFIG.PLAYER_WIDTH;
        this.height = MINCOINS_CONFIG.PLAYER_HEIGHT;
        this.facing = 'down';
        this.sprites = {
            down: null,
            up: null,
            right: null,
            left: null
        };
        this.spritesLoaded = 0;
        this.keys = {};
        
        this.initInput();
    }
    
    //FUNC Initialize keyboard input
    initInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    //FUNC Load player sprites
    async loadSprites() {
        console.log('Starting to load player sprites...');
        const loadPromises = MINCOINS_CONFIG.SPRITE_FILES.map(({ direction, file }) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    console.log(`Successfully loaded sprite: ${file}`);
                    this.sprites[direction] = img;
                    // Use the same image for left, but it will be flipped
                    if (direction === 'right') {
                        this.sprites.left = img;
                    }
                    this.spritesLoaded++;
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load sprite: ${file}`);
                    this.spritesLoaded++;
                    resolve();
                };
                img.src = file;
                console.log(`Attempting to load: ${file}`);
            });
        });
        
        await Promise.all(loadPromises);
        console.log(`Sprites loaded: ${this.spritesLoaded}/3`);
    }
    
    //FUNC Update player position based on input
    update() {
        let moved = false;
        
        if (this.keys['arrowup'] || this.keys['w']) {
            this.y -= this.speed;
            this.facing = 'up';
            moved = true;
        }
        if (this.keys['arrowdown'] || this.keys['s']) {
            this.y += this.speed;
            this.facing = 'down';
            moved = true;
        }
        if (this.keys['arrowleft'] || this.keys['a']) {
            this.x -= this.speed;
            this.facing = 'left';
            moved = true;
        }
        if (this.keys['arrowright'] || this.keys['d']) {
            this.x += this.speed;
            this.facing = 'right';
            moved = true;
        }
        
        return moved;
    }
    
    //FUNC Draw the player
    draw(ctx) {
        if (this.spritesLoaded >= 3 && this.sprites[this.facing]) {
            ctx.save();
            
            // Apply horizontal flip for left facing
            if (this.facing === 'left') {
                ctx.translate(this.x, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    this.sprites[this.facing],
                    -this.width,
                    -this.height,
                    this.width * 2,
                    this.height * 2
                );
            } else {
                ctx.drawImage(
                    this.sprites[this.facing],
                    this.x - this.width,
                    this.y - this.height,
                    this.width * 2,
                    this.height * 2
                );
            }
            ctx.restore();
        } else {
            // Don't draw anything if sprites not loaded
            console.log('Player sprites not loaded yet');
        }
    }
}
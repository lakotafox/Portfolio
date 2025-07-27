// Player Sprites
// Handles loading and managing player sprite images

export class PlayerSprites {
    constructor() {
        this.sprites = {
            down: null,
            up: null,
            right: null,
            left: null
        };
        this.loaded = false;
    }

    //FUNC Load all player sprites
    async loadSprites(basePath = '') {
        const spritesToLoad = [
            { direction: 'down', file: `${basePath}game-engine/player/sprites/player-down.png` },
            { direction: 'up', file: `${basePath}game-engine/player/sprites/player-up.png` },
            { direction: 'right', file: `${basePath}game-engine/player/sprites/player-right.png` }
        ];
        
        const loadPromises = spritesToLoad.map(({ direction, file }) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.sprites[direction] = img;
                    // Use right sprite for left (will be flipped when drawn)
                    if (direction === 'right') {
                        this.sprites.left = img;
                    }
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load player sprite: ${file}`);
                    resolve();
                };
                img.src = file;
            });
        });

        await Promise.all(loadPromises);
        this.loaded = true;
        console.log('Player sprites loaded!');
    }

    //FUNC Get sprite for direction
    getSprite(direction) {
        return this.sprites[direction];
    }

    //FUNC Check if sprites are loaded
    areSpritesLoaded() {
        return this.loaded;
    }
}
// player Input Handler
// manages keyboard input for player movement

export class PlayerInput {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }

    // setup keyboard event listeners
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    // check if a key is currently pressed
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    // get movement input state
    getMovementInput() {
        return {
            up: this.isKeyPressed('w') || this.isKeyPressed('arrowup'),
            down: this.isKeyPressed('s') || this.isKeyPressed('arrowdown'),
            left: this.isKeyPressed('a') || this.isKeyPressed('arrowleft'),
            right: this.isKeyPressed('d') || this.isKeyPressed('arrowright'),
            enter: this.isKeyPressed('enter'),
            escape: this.isKeyPressed('escape'),
            m: this.isKeyPressed('m'),
            e: this.isKeyPressed('e')
        };
    }

    // clear all key states
    clearKeys() {
        this.keys = {};
    }
}
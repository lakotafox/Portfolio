// Player Input Handler
// Manages keyboard input for player movement

export class PlayerInput {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }

    //FUNC Setup keyboard event listeners
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    //FUNC Check if a key is currently pressed
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    //FUNC Get movement input state
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

    //FUNC Clear all key states
    clearKeys() {
        this.keys = {};
    }
}
// minCoins Interactions Module
// handles player interactions with world objects

import { MINCOINS_CONFIG } from './mincoins-config.js';
import { layoutItems } from './mincoins-layout.js';

export class MinCoinsInteractions {
    constructor(player, terminal) {
        this.player = player;
        this.terminal = terminal;
        
        // initialize Enter key handling
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleEnterPress();
            }
        });
    }
    
    // handle Enter key press for interactions
    handleEnterPress() {
        // check if player is near any interactive item
        layoutItems.forEach(item => {
            const distance = Math.sqrt(
                Math.pow(this.player.x - (item.x + item.width/2), 2) + 
                Math.pow(this.player.y - (item.y + item.height/2), 2)
            );
            
            if (distance < MINCOINS_CONFIG.INTERACTION_DISTANCE) {
                this.handleItemInteraction(item);
            }
        });
    }
    
    // handle interaction with a specific item
    handleItemInteraction(item) {
        if (item.type === 'run-button') {
            this.terminal.start();
        } else if (item.type.startsWith('number-')) {
            this.terminal.addDigit(item.number);
        } else if (item.type === 'enter-key') {
            this.terminal.processInput();
        }
    }
}
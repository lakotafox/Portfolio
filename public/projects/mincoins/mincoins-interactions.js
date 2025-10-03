// minCoins Interactions Module
// handles player interactions with world objects

import { MINCOINS_CONFIG } from './mincoins-config.js';
import { layoutItems } from './mincoins-layout.js';

export class MinCoinsInteractions {
    constructor(player, terminals) {
        this.player = player;
        this.terminals = terminals;
        
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
            // only check interactive items
            if (item.type === 'run-button' || item.type.startsWith('number-') || item.type === 'enter-key') {
                const distance = Math.sqrt(
                    Math.pow(this.player.x - (item.x + item.width/2), 2) + 
                    Math.pow(this.player.y - (item.y + item.height/2), 2)
                );
                
                if (distance < MINCOINS_CONFIG.INTERACTION_DISTANCE) {
                    console.log('Interacting with:', item.type, 'project:', item.project);
                    this.handleItemInteraction(item);
                }
            }
        });
    }
    
    // handle interaction with a specific item
    handleItemInteraction(item) {
        // for number keys and enter keys, find which project they belong to
        let projectType = item.project;
        
        // if item doesn't have project, determine by proximity to terminals
        if (!projectType && (item.type.startsWith('number-') || item.type === 'enter-key')) {
            // find nearest terminal
            let nearestTerminal = null;
            let minDistance = Infinity;
            
            layoutItems.forEach(layoutItem => {
                if (layoutItem.type === 'terminal') {
                    const dist = Math.sqrt(
                        Math.pow(item.x - layoutItem.x, 2) + 
                        Math.pow(item.y - layoutItem.y, 2)
                    );
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestTerminal = layoutItem;
                    }
                }
            });
            
            if (nearestTerminal) {
                projectType = nearestTerminal.project;
            }
        }
        
        // determine which terminal to use based on project
        const terminal = projectType === 'gcd' ? this.terminals.gcd : this.terminals.mincoins;
        
        if (!terminal) {
            console.error('No terminal found for project:', projectType);
            return;
        }
        
        if (item.type === 'run-button') {
            // start terminal in mode based on which run button
            const mode = projectType === 'gcd' ? 'gcd' : 'mincoins';
            terminal.start(mode);
        } else if (item.type.startsWith('number-')) {
            terminal.addDigit(item.number);
        } else if (item.type === 'enter-key') {
            terminal.processInput();
        }
    }
}
// MinCoins Renderer Module
// Handles all drawing operations

import { MINCOINS_CONFIG } from './mincoins-config.js';
import { layoutItems } from './mincoins-layout.js';

export class MinCoinsRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.codeImage = new Image();
        this.codeImageLoaded = false;
        
        // Load NetBeans screenshot
        this.codeImage.onload = () => {
            this.codeImageLoaded = true;
        };
        this.codeImage.onerror = () => {
            console.log('Failed to load code image');
        };
        this.codeImage.src = MINCOINS_CONFIG.CODE_IMAGE_PATH;
    }
    
    //FUNC Main render function
    render(camera, player, terminal) {
        // Clear canvas
        this.ctx.fillStyle = '#1e1e1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for camera transform
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(camera.zoom, camera.zoom);
        this.ctx.translate(-camera.x, -camera.y);
        
        // Draw NetBeans screenshot
        this.drawCodeImage();
        
        // Draw all layout items
        layoutItems.forEach(item => {
            this.drawLayoutItem(item, terminal);
        });
        
        // Draw player last so it appears on top
        player.draw(this.ctx);
        
        // Restore context
        this.ctx.restore();
        
        // Draw UI elements (zoom indicator)
        this.drawUI(camera);
    }
    
    //FUNC Draw the NetBeans code image
    drawCodeImage() {
        if (this.codeImageLoaded && this.codeImage) {
            const imageWidth = MINCOINS_CONFIG.CODE_WIDTH;
            const imageHeight = (this.codeImage.height / this.codeImage.width) * imageWidth;
            
            this.ctx.drawImage(
                this.codeImage,
                MINCOINS_CONFIG.CODE_START_X,
                MINCOINS_CONFIG.CODE_START_Y,
                imageWidth,
                imageHeight
            );
        } else {
            // Fallback: Draw placeholder
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.fillRect(
                MINCOINS_CONFIG.CODE_START_X, 
                MINCOINS_CONFIG.CODE_START_Y, 
                800, 
                600
            );
            
            this.ctx.fillStyle = '#666';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                'Loading NetBeans Screenshot...', 
                MINCOINS_CONFIG.CODE_START_X + 400, 
                MINCOINS_CONFIG.CODE_START_Y + 300
            );
            
            this.ctx.font = '16px Arial';
            this.ctx.fillText(
                'Please save your screenshot as "mincoins-netbeans.png"', 
                MINCOINS_CONFIG.CODE_START_X + 400, 
                MINCOINS_CONFIG.CODE_START_Y + 340
            );
            this.ctx.fillText(
                'in the mincoins folder', 
                MINCOINS_CONFIG.CODE_START_X + 400, 
                MINCOINS_CONFIG.CODE_START_Y + 360
            );
        }
    }
    
    //FUNC Draw a layout item
    drawLayoutItem(item, terminal) {
        this.ctx.save();
        
        if (item.type.startsWith('sign-')) {
            this.drawSign(item);
        } else if (item.type === 'terminal') {
            this.drawTerminal(item, terminal);
        } else if (item.type === 'run-button') {
            this.drawRunButton(item, terminal);
        } else if (item.type.startsWith('number-')) {
            this.drawNumberKey(item);
        } else if (item.type === 'enter-key') {
            this.drawEnterKey(item);
        }
        
        this.ctx.restore();
    }
    
    //FUNC Draw a sign
    drawSign(item) {
        // Draw wooden sign background
        this.ctx.fillStyle = '#8b5a2b';
        this.ctx.fillRect(item.x, item.y, item.width, item.height);
        
        // Add wooden frame
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(item.x, item.y, item.width, item.height);
        
        // Draw arrow
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(item.arrow, item.x + item.width/2, item.y + 30);
        
        // Draw text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        const words = item.text.split(' ');
        words.forEach((word, index) => {
            this.ctx.fillText(word, item.x + item.width/2, item.y + 50 + (index * 12));
        });
    }
    
    //FUNC Draw the terminal
    drawTerminal(item, terminal) {
        // Draw terminal background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(item.x, item.y, item.width, item.height);
        
        // Terminal border
        this.ctx.strokeStyle = MINCOINS_CONFIG.TERMINAL_COLOR;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(item.x, item.y, item.width, item.height);
        
        // Draw terminal output
        this.ctx.fillStyle = MINCOINS_CONFIG.TERMINAL_COLOR;
        this.ctx.font = MINCOINS_CONFIG.TERMINAL_FONT;
        this.ctx.textAlign = 'left';
        
        const lineHeight = MINCOINS_CONFIG.TERMINAL_LINE_HEIGHT;
        const maxLines = Math.floor((item.height - 20) / lineHeight);
        const startLine = Math.max(0, terminal.output.length - maxLines + 1);
        
        for (let i = 0; i < Math.min(maxLines - 1, terminal.output.length); i++) {
            const lineIndex = startLine + i;
            if (terminal.output[lineIndex]) {
                this.ctx.fillText(
                    terminal.output[lineIndex], 
                    item.x + 5, 
                    item.y + 15 + (i * lineHeight)
                );
            }
        }
        
        // Draw current input line with cursor
        if (terminal.waitingForInput && terminal.isRunning) {
            const inputY = item.y + 15 + (Math.min(terminal.output.length, maxLines - 1) * lineHeight);
            this.ctx.fillText(terminal.input + '_', item.x + 5, inputY);
        }
    }
    
    //FUNC Draw the run button
    drawRunButton(item, terminal) {
        // Draw run button
        this.ctx.fillStyle = terminal.isRunning ? '#ff6b6b' : '#4CAF50';
        this.ctx.fillRect(item.x, item.y, item.width, item.height);
        
        // Button border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(item.x, item.y, item.width, item.height);
        
        // Button text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            terminal.isRunning ? 'RUNNING' : 'RUN', 
            item.x + item.width/2, 
            item.y + item.height/2 + 5
        );
    }
    
    //FUNC Draw a number key
    drawNumberKey(item) {
        // Draw number key (old-school keyboard style)
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(item.x, item.y, item.width, item.height);
        
        // Key border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(item.x, item.y, item.width, item.height);
        
        // Inner shadow effect
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(item.x + 2, item.y + 2, item.width - 4, item.height - 4);
        
        // Number text
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            item.number.toString(), 
            item.x + item.width/2, 
            item.y + item.height/2 + 6
        );
    }
    
    //FUNC Draw the enter key
    drawEnterKey(item) {
        // Draw enter key (old-school keyboard style)
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(item.x, item.y, item.width, item.height);
        
        // Key border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(item.x, item.y, item.width, item.height);
        
        // Inner shadow effect
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(item.x + 2, item.y + 2, item.width - 4, item.height - 4);
        
        // Enter text
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ENTER', item.x + item.width/2, item.y + item.height/2 + 5);
    }
    
    //FUNC Draw UI elements
    drawUI(camera) {
        // Draw zoom indicator
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(
            `Zoom: ${(camera.zoom * 100).toFixed(0)}%`, 
            this.canvas.width - 100, 
            this.canvas.height - 20
        );
    }
}
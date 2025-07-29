// drawing and rendering functions

function drawSign(ctx, sign, images = {}) {
    // save context for opacity
    ctx.save();
    
    // set opacity for mincoins items
    if (sign.isMinCoins) {
        ctx.globalAlpha = 0.3;
    }
    
    if (sign.type === 'terminal') {
        // draw terminal background
        ctx.fillStyle = '#000000';
        ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
        
        // terminal border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
        
        // terminal header
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Terminal Output', sign.x + 5, sign.y + 15);
        
        // terminal lines (placeholder)
        ctx.font = '10px monospace';
        ctx.fillText('> GCD Calculator Ready', sign.x + 5, sign.y + 35);
        ctx.fillText('> Enter two numbers and press RUN', sign.x + 5, sign.y + 50);
    } else if (sign.type === 'run-button') {
        // draw run button
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
        
        // button border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
        
        // button text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RUN', sign.x + sign.width/2, sign.y + sign.height/2 + 5);
    } else if (sign.type.startsWith('number-')) {
        // draw number key (old-school keyboard style)
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
        
        // key border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
        
        // inner shadow effect
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(sign.x + 2, sign.y + 2, sign.width - 4, sign.height - 4);
        
        // number text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(sign.text, sign.x + sign.width/2, sign.y + sign.height/2 + 6);
    } else if (sign.type === 'enter-key') {
        // draw enter key (old-school keyboard style)
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
        
        // key border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
        
        // inner shadow effect
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(sign.x + 2, sign.y + 2, sign.width - 4, sign.height - 4);
        
        // enter text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ENTER', sign.x + sign.width/2, sign.y + sign.height/2 + 5);
    } else if (sign.type === 'gcd-code-img' || sign.type === 'gcd-img') {
        // draw actual gcd images
        const isGcd1 = sign.type === 'gcd-code-img';
        const image = isGcd1 ? images.gcd1Image : images.gcd2Image;
        const loaded = isGcd1 ? images.gcd1Loaded : images.gcd2Loaded;
        
        if (loaded && image) {
            ctx.drawImage(image, sign.x, sign.y, sign.width, sign.height);
        } else {
            // fallback placeholder
            ctx.fillStyle = '#2b2b2b';
            ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
            
            // border
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
            
            // text
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            const imageName = isGcd1 ? 'GCD1.png' : 'GCD2.png';
            ctx.fillText(imageName, sign.x + sign.width/2, sign.y + sign.height/2);
        }
    } else {
        // wooden sign background
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
        
        // frame
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(sign.x, sign.y, sign.width, sign.height);
        
        // arrow
        if (sign.arrow) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(sign.arrow, sign.x + sign.width/2, sign.y + 30);
        }
        
        // text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const words = sign.text.split(' ');
        words.forEach((word, index) => {
            ctx.fillText(word, sign.x + sign.width/2, sign.y + 50 + (index * 12));
        });
    }
    
    // restore context
    ctx.restore();
}

function drawHammer(ctx, hammer, hammerImage, hammerLoaded) {
    if (hammerLoaded && hammerImage) {
        ctx.drawImage(
            hammerImage,
            hammer.x - hammer.width / 2,
            hammer.y - hammer.height / 2,
            hammer.width,
            hammer.height
        );
    } else {
        // draw placeholder hammer
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(
            hammer.x - hammer.width / 2,
            hammer.y - hammer.height / 2,
            hammer.width,
            hammer.height
        );
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨', hammer.x, hammer.y + 4);
    }
}
// minCoins Terminal Module
// handles terminal state and MinCoins algorithm

export class MinCoinsTerminal {
    constructor() {
        this.output = ['MinCoins Program Ready', 'Walk to RUN button and press ENTER to start'];
        this.input = '';
        this.isRunning = false;
        this.waitingForInput = false;
        this.mode = 'mincoins'; // 'mincoins' or 'gcd'
        this.gcdStage = 0; // for gcd: 0 = first number, 1 = second number
        this.gcdFirstNumber = null;
    }
    
    // start the MinCoins program
    start(mode = 'mincoins') {
        if (!this.isRunning) {
            this.isRunning = true;
            this.waitingForInput = true;
            this.mode = mode;
            
            if (mode === 'gcd') {
                this.output = ['run:', 'Enter First Number or Zero to Exit:'];
                this.gcdStage = 0;
                this.gcdFirstNumber = null;
            } else {
                this.output = ['run:', '', 'Please Enter Amount of Change (1-99) or ZERO TO Exit', ''];
            }
            
            this.input = '';
            return true;
        } else {
            this.output.push('Program already running!');
            return false;
        }
    }
    
    // add digit to input
    addDigit(digit) {
        if (this.isRunning && this.waitingForInput) {
            this.input += digit.toString();
        } else if (!this.isRunning) {
            this.output.push('Start the program first!');
        }
    }
    
    // process the entered input
    processInput() {
        if (!this.isRunning || !this.waitingForInput || !this.input) {
            return;
        }
        
        if (this.mode === 'gcd') {
            this.processGcdInput();
        } else {
            this.processMinCoinsInput();
        }
    }
    
    // process mincoins input
    processMinCoinsInput() {
        const amount = parseInt(this.input);
        
        // show the input that was entered
        this.output.push(this.input);
        
        // play coin sound 3 times for valid amounts
        if (amount > 0 && amount <= 999999999) {
            this.playCoinsSound();
        }
        
        if (amount === 0) {
            this.output.push('');
            this.output.push('BUILD SUCCESSFUL (total time: 2 minutes 21 seconds)');
            this.isRunning = false;
            this.waitingForInput = false;
            this.input = '';
            return;
        }
        
        if (amount < 1 || isNaN(amount)) {
            this.output.push('');
            this.output.push('Please Enter Amount of Change (1-99) or ZERO TO Exit');
            this.input = '';
            return;
        }
        
        // prevent crashes from huge numbers
        if (amount > 999999999) {
            this.output.push('');
            this.output.push('Sorry, that will freeze or crash the game!');
            this.output.push('Please Enter Amount of Change (1-99) or ZERO TO Exit');
            this.input = '';
            return;
        }
        
        // calculate coins using MinCoins algorithm
        const result = this.calculateMinCoins(amount);
        this.output.push('');
        this.output.push(`Quarters:${result.quarters}`);
        this.output.push(`dimes:${result.dimes}`);  
        this.output.push(`nickles:${result.nickels}`);
        this.output.push(`pennies:${result.pennies}`);
        this.output.push('');
        this.output.push('Please Enter Amount of Change (1-99) or ZERO TO Exit');
        
        this.input = '';
    }
    
    // process gcd input
    processGcdInput() {
        const num = parseInt(this.input);
        
        // show the input that was entered
        this.output.push(this.input);
        
        if (this.gcdStage === 0 && num === 0) {
            // exit program
            this.output.push('');
            this.output.push('Program terminated.');
            this.isRunning = false;
            this.waitingForInput = false;
            this.input = '';
            return;
        }
        
        if (isNaN(num) || num < 1) {
            this.output.push('Please enter a positive number');
            this.input = '';
            return;
        }
        
        if (this.gcdStage === 0) {
            // first number entered
            this.gcdFirstNumber = num;
            this.output.push('Enter Second Number:');
            this.gcdStage = 1;
            this.input = '';
        } else {
            // second number entered, calculate gcd
            const result = this.calculateGCD(this.gcdFirstNumber, num);
            this.output.push(`the GCD IS: ${result}`);
            this.output.push('');
            this.output.push('Enter First Number or Zero to Exit:');
            this.gcdStage = 0;
            this.input = '';
            
            // play gcd sound
            this.playGcdSound();
        }
    }
    
    // calculate minimum coins needed for given amount
    calculateMinCoins(amount) {
        let remaining = amount;
        let quarters = 0;
        let dimes = 0; 
        let nickels = 0;
        let pennies = 0;
        
        // calculate quarters (25 cents)
        while (remaining >= 25) {
            quarters++;
            remaining -= 25;
        }
        
        // calculate dimes (10 cents)
        while (remaining >= 10) {
            dimes++;
            remaining -= 10;
        }
        
        // calculate nickels (5 cents)
        if (remaining >= 5) {
            nickels++;
            remaining -= 5;
        }
        
        // remaining are pennies
        pennies = remaining;
        
        return { quarters, dimes, nickels, pennies };
    }
    
    // calculate gcd using subtraction method (matching java code)
    calculateGCD(first, second) {
        while (first !== second) {
            if (first > second) {
                first = first - second;
            } else {
                second = second - first;
            }
        }
        return first;
    }
    
    // play coin sound once
    playCoinsSound() {
        const coinSound = document.getElementById('coinSound');
        if (coinSound) {
            coinSound.currentTime = 0;
            coinSound.play();
        }
    }
    
    // play gcd sound once
    playGcdSound() {
        const gcdSound = document.getElementById('gcdSound');
        if (gcdSound) {
            gcdSound.currentTime = 0;
            gcdSound.play();
        }
    }
}
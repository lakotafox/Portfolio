// MinCoins Terminal Module
// Handles terminal state and MinCoins algorithm

export class MinCoinsTerminal {
    constructor() {
        this.output = ['MinCoins Program Ready', 'Walk to RUN button and press ENTER to start'];
        this.input = '';
        this.isRunning = false;
        this.waitingForInput = false;
    }
    
    //FUNC Start the MinCoins program
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.waitingForInput = true;
            this.output = ['run:', '', 'Please Enter Amount of Change (1-99) or ZERO TO Exit', ''];
            this.input = '';
            return true;
        } else {
            this.output.push('Program already running!');
            return false;
        }
    }
    
    //FUNC Add digit to input
    addDigit(digit) {
        if (this.isRunning && this.waitingForInput) {
            this.input += digit.toString();
        } else if (!this.isRunning) {
            this.output.push('Start the program first!');
        }
    }
    
    //FUNC Process the entered input
    processInput() {
        if (!this.isRunning || !this.waitingForInput || !this.input) {
            return;
        }
        
        const amount = parseInt(this.input);
        
        // Show the input that was entered
        this.output.push(this.input);
        
        if (amount === 0) {
            this.output.push('');
            this.output.push('BUILD SUCCESSFUL (total time: 2 minutes 21 seconds)');
            this.isRunning = false;
            this.waitingForInput = false;
            this.input = '';
            return;
        }
        
        if (amount < 1 || amount > 99 || isNaN(amount)) {
            this.output.push('');
            this.output.push('Please Enter Amount of Change (1-99) or ZERO TO Exit');
            this.input = '';
            return;
        }
        
        // Calculate coins using MinCoins algorithm
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
    
    //FUNC Calculate minimum coins needed for given amount
    calculateMinCoins(amount) {
        let remaining = amount;
        let quarters = 0;
        let dimes = 0; 
        let nickels = 0;
        let pennies = 0;
        
        // Calculate quarters (25 cents)
        while (remaining >= 25) {
            quarters++;
            remaining -= 25;
        }
        
        // Calculate dimes (10 cents)
        while (remaining >= 10) {
            dimes++;
            remaining -= 10;
        }
        
        // Calculate nickels (5 cents)
        if (remaining >= 5) {
            nickels++;
            remaining -= 5;
        }
        
        // Remaining are pennies
        pennies = remaining;
        
        return { quarters, dimes, nickels, pennies };
    }
}
// TicTacToe Modal Game

// Player class
class TicTacToePlayer {
    constructor(name) {
        this.playerName = name;
        this.playerMarker = ' ';
        this.playerBoardTotal = 0;
        this.playerTotalWins = 0;
    }
    
    setPlayerMarker(marker) {
        this.playerMarker = marker;
    }
    
    addPlayerBoardTotal(bitValue) {
        this.playerBoardTotal += bitValue;
    }
    
    addPlayerTotalWins() {
        this.playerTotalWins++;
    }
    
    resetPlayerTotal() {
        this.playerBoardTotal = 0;
    }
}

// Game instances for each type
const games = {
    human: null,
    hammer: null,
    scalpel: null
};

// Initialize game
function initTicTacToeGame(type) {
    const game = {
        player1: new TicTacToePlayer("cob"),
        player2: new TicTacToePlayer("basu"),
        cat: new TicTacToePlayer("CAT"),
        xTurn: true,
        winsArray: [7, 56, 73, 84, 146, 273, 292, 448],
        type: type
    };
    
    game.player1.setPlayerMarker('X');
    game.player2.setPlayerMarker('O');
    
    games[type] = game;
    return game;
}

// Show the modal with game
function showTicTacToeModal(type) {
    if (type === 'hammer' || type === 'scalpel') {
        // Hide any existing modal first
        const existingModal = document.getElementById('tictactoe-modal');
        if (existingModal) {
            existingModal.classList.add('hidden');
        }
        // Show Hammer/Scalpel version with player input dialogs
        showHammerGame();
        return;
    }
    
    // Create or get game instance
    if (!games[type]) {
        initTicTacToeGame(type);
    }
    
    // Get or create modal
    let modal = document.getElementById('tictactoe-modal');
    if (!modal) {
        createTicTacToeModal();
        modal = document.getElementById('tictactoe-modal');
    }
    
    // Update title based on type
    const titleElement = modal.querySelector('.tictactoe-title-bar span');
    if (type === 'human') {
        titleElement.textContent = "lakota's TicTacToe Game";
    } else if (type === 'scalpel') {
        titleElement.textContent = "AI Scalpel TicTacToe - Optimized";
    }
    
    // Set current game type
    modal.dataset.gameType = type;
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Reset game board
    resetTicTacToeGame(type);
}

// Create modal HTML
function createTicTacToeModal() {
    const modalHTML = `
        <div id="tictactoe-modal" class="tictactoe-overlay hidden">
            <div class="tictactoe-window">
                <div class="tictactoe-title-bar">
                    <div class="tictactoe-window-controls">
                        <button class="tictactoe-window-btn tictactoe-close-btn" onclick="closeTicTacToeModal()"></button>
                        <button class="tictactoe-window-btn tictactoe-minimize-btn"></button>
                        <button class="tictactoe-window-btn tictactoe-maximize-btn"></button>
                    </div>
                    <span>lakota's TicTacToe Game</span>
                </div>
                
                <div class="tictactoe-game-container">
                    <div class="tictactoe-game-grid">
                        <button class="tictactoe-game-btn" data-bit="1"></button>
                        <button class="tictactoe-game-btn" data-bit="2"></button>
                        <button class="tictactoe-game-btn" data-bit="4"></button>
                        <button class="tictactoe-game-btn" data-bit="8"></button>
                        <button class="tictactoe-game-btn" data-bit="16"></button>
                        <button class="tictactoe-game-btn" data-bit="32"></button>
                        <button class="tictactoe-game-btn" data-bit="64"></button>
                        <button class="tictactoe-game-btn" data-bit="128"></button>
                        <button class="tictactoe-game-btn" data-bit="256"></button>
                    </div>
                    
                    <div class="tictactoe-scoreboard">
                        <div class="tictactoe-score-label">Player 1</div>
                        <div class="tictactoe-player-name">cob</div>
                        <div class="tictactoe-score-value" id="ttt-player1score">0</div>
                        
                        <div class="tictactoe-score-label">Player 2</div>
                        <div class="tictactoe-player-name">basu</div>
                        <div class="tictactoe-score-value" id="ttt-player2score">0</div>
                        
                        <div class="tictactoe-score-label">Ties</div>
                        <div class="tictactoe-player-name">CAT</div>
                        <div class="tictactoe-score-value" id="ttt-catScore">0</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    const buttons = document.querySelectorAll('.tictactoe-game-btn');
    buttons.forEach(button => {
        button.addEventListener('click', handleTicTacToeClick);
    });
}

// Handle button clicks
function handleTicTacToeClick(event) {
    const modal = document.getElementById('tictactoe-modal');
    const type = modal.dataset.gameType;
    const game = games[type];
    const pressedButton = event.target;
    
    if (pressedButton.textContent === "") {
        // Remove last-move class from all buttons
        const allButtons = document.querySelectorAll('.tictactoe-game-btn');
        allButtons.forEach(btn => btn.classList.remove('last-move'));
        
        // Add last-move class to clicked button
        pressedButton.classList.add('last-move');
        
        if (game.xTurn) {
            pressedButton.textContent = "X";
            game.xTurn = false;
            
            const bitValue = parseInt(pressedButton.getAttribute('data-bit'));
            game.player1.addPlayerBoardTotal(bitValue);
            
            if (checkTicTacToeWinner(game.player1.playerBoardTotal, game)) {
                game.player1.addPlayerTotalWins();
                document.getElementById('ttt-player1score').textContent = game.player1.playerTotalWins;
                setTimeout(() => resetTicTacToeGame(type), 100);
            }
        } else {
            pressedButton.textContent = "O";
            game.xTurn = true;
            
            const bitValue = parseInt(pressedButton.getAttribute('data-bit'));
            game.player2.addPlayerBoardTotal(bitValue);
            
            if (checkTicTacToeWinner(game.player2.playerBoardTotal, game)) {
                game.player2.addPlayerTotalWins();
                document.getElementById('ttt-player2score').textContent = game.player2.playerTotalWins;
                setTimeout(() => resetTicTacToeGame(type), 100);
            }
        }
        
        // Check for tie
        if (game.player1.playerBoardTotal + game.player2.playerBoardTotal === 511) {
            game.cat.addPlayerTotalWins();
            document.getElementById('ttt-catScore').textContent = game.cat.playerTotalWins;
            setTimeout(() => resetTicTacToeGame(type), 100);
        }
    }
}

// Check for winner
function checkTicTacToeWinner(total, game) {
    for (let i = 0; i < game.winsArray.length; i++) {
        if ((game.winsArray[i] & total) === game.winsArray[i]) {
            return true;
        }
    }
    return false;
}

// Reset game
function resetTicTacToeGame(type) {
    const game = games[type];
    const buttons = document.querySelectorAll('.tictactoe-game-btn');
    
    buttons.forEach(button => {
        button.textContent = "";
        button.classList.remove('last-move');
    });
    
    if (game) {
        game.player1.resetPlayerTotal();
        game.player2.resetPlayerTotal();
        game.xTurn = true;
    }
}

// Close modal
function closeTicTacToeModal() {
    const modal = document.getElementById('tictactoe-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}
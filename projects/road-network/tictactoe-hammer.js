// TicTacToe Hammer Version - Championship GUI

let hammerGame = {
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    currentPlayer: 'X',
    board: ['', '', '', '', '', '', '', '', ''],
    player1Score: 0,
    player2Score: 0,
    tiesScore: 0,
    gameActive: true,
    winConditions: [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ]
};

// Show player input dialogs
function showHammerGame() {
    // First get Player 1 name
    showPlayerInputDialog(1);
}

function showPlayerInputDialog(playerNum) {
    const dialogHTML = `
        <div id="player-input-dialog" class="input-dialog-overlay">
            <div class="input-dialog">
                <div class="input-dialog-header">
                    <div class="dialog-controls">
                        <button class="dialog-btn dialog-close"></button>
                        <button class="dialog-btn dialog-minimize"></button>
                        <button class="dialog-btn dialog-maximize"></button>
                    </div>
                    <span class="dialog-title">Input</span>
                </div>
                <div class="dialog-content">
                    <div class="dialog-icon">☕</div>
                    <div class="dialog-form">
                        <label class="dialog-label">Enter Player ${playerNum} Name (${playerNum === 1 ? 'X' : 'O'}):</label>
                        <input type="text" class="dialog-input" id="player-name-input" value="Player ${playerNum}" />
                    </div>
                </div>
                <div class="dialog-buttons">
                    <button class="btn-cancel" onclick="cancelPlayerInput()">Cancel</button>
                    <button class="btn-ok" onclick="confirmPlayerInput(${playerNum})">OK</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing dialog
    const existingDialog = document.getElementById('player-input-dialog');
    if (existingDialog) existingDialog.remove();
    
    // Add new dialog
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    
    // Focus input and select text
    setTimeout(() => {
        const input = document.getElementById('player-name-input');
        if (input) {
            input.focus();
            input.select();
            
            // Add Enter key listener
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    confirmPlayerInput(playerNum);
                }
            });
        }
    }, 100);
}

function confirmPlayerInput(playerNum) {
    const input = document.getElementById('player-name-input');
    const name = input.value || `Player ${playerNum}`;
    
    if (playerNum === 1) {
        hammerGame.player1Name = name;
        document.getElementById('player-input-dialog').remove();
        // Show Player 2 dialog
        showPlayerInputDialog(2);
    } else {
        hammerGame.player2Name = name;
        document.getElementById('player-input-dialog').remove();
        // Show game window
        showChampionshipGame();
    }
}

function cancelPlayerInput() {
    document.getElementById('player-input-dialog').remove();
}

function showChampionshipGame() {
    // Reset game state before showing
    hammerGame.board = ['', '', '', '', '', '', '', '', ''];
    hammerGame.currentPlayer = 'X';
    hammerGame.gameActive = true;
    
    // Create modal container for championship game
    let modal = document.getElementById('tictactoe-modal');
    if (!modal) {
        // Create the modal container
        const modalHTML = `<div id="tictactoe-modal" class="tictactoe-overlay"></div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('tictactoe-modal');
    }
    
    const gameHTML = `
        <div class="championship-window">
            <div class="input-dialog-header">
                <div class="dialog-controls">
                    <button class="dialog-btn dialog-close" onclick="closeTicTacToeModal()"></button>
                    <button class="dialog-btn dialog-minimize"></button>
                    <button class="dialog-btn dialog-maximize"></button>
                </div>
                <span class="dialog-title">TicTacToe Championship</span>
            </div>
            
            <div class="championship-header">
                <div class="championship-title">TicTacToe Championship</div>
                <div class="turn-indicator" id="turn-indicator">${hammerGame.player1Name}'s Turn (X)</div>
            </div>
            
            <div class="game-area">
                <div class="game-board-container">
                    <div class="championship-board" id="championship-board">
                        ${Array(9).fill().map((_, i) => 
                            `<button class="championship-cell" data-index="${i}" onclick="hammerCellClick(${i})"></button>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="scoreboard-container">
                    <div class="scoreboard-title">SCOREBOARD</div>
                    <div class="score-card player1">
                        <div class="score-label">${hammerGame.player1Name} (X)</div>
                        <div class="score-value" id="player1-score">0</div>
                    </div>
                    <div class="score-card player2">
                        <div class="score-label">${hammerGame.player2Name} (O)</div>
                        <div class="score-value" id="player2-score">0</div>
                    </div>
                    <div class="score-card ties">
                        <div class="score-label">Ties</div>
                        <div class="score-value" id="ties-score">0</div>
                    </div>
                </div>
            </div>
            
            <div class="game-controls">
                <button class="control-btn reset-btn" onclick="resetHammerGame()">Reset Game</button>
                <button class="control-btn new-players-btn" onclick="newHammerPlayers()">New Players</button>
                <div id="winner-message" class="winner-message"></div>
            </div>
            
            <div class="wins-display">
                <div class="wins-text">Wins</div>
                <div class="wins-scores">
                    <span id="player1-wins-display">${hammerGame.player1Name}: ${hammerGame.player1Score}</span>
                    <span class="wins-separator">|</span>
                    <span id="player2-wins-display">${hammerGame.player2Name}: ${hammerGame.player2Score}</span>
                    <span class="wins-separator">|</span>
                    <span id="ties-wins-display">Ties: ${hammerGame.tiesScore}</span>
                </div>
            </div>
        </div>
    `;
    
    // Update modal content and show it
    modal.innerHTML = gameHTML;
    modal.classList.remove('hidden');
}

function hammerCellClick(index) {
    if (hammerGame.board[index] !== '' || !hammerGame.gameActive) return;
    
    const cells = document.querySelectorAll('.championship-cell');
    hammerGame.board[index] = hammerGame.currentPlayer;
    cells[index].textContent = hammerGame.currentPlayer;
    cells[index].classList.add(hammerGame.currentPlayer.toLowerCase());
    
    if (checkHammerWinner()) {
        hammerGame.gameActive = false;
        return;
    }
    
    if (!hammerGame.board.includes('')) {
        hammerGame.tiesScore++;
        document.getElementById('ties-score').textContent = hammerGame.tiesScore;
        const tiesWinsDisplay = document.getElementById('ties-wins-display');
        if (tiesWinsDisplay) {
            tiesWinsDisplay.textContent = `Ties: ${hammerGame.tiesScore}`;
        }
        document.getElementById('turn-indicator').textContent = 'Game Over - Tie!';
        hammerGame.gameActive = false;
        
        // Auto-reset after a delay
        setTimeout(() => resetHammerGame(), 2000);
        return;
    }
    
    hammerGame.currentPlayer = hammerGame.currentPlayer === 'X' ? 'O' : 'X';
    const currentName = hammerGame.currentPlayer === 'X' ? hammerGame.player1Name : hammerGame.player2Name;
    document.getElementById('turn-indicator').textContent = `${currentName}'s Turn (${hammerGame.currentPlayer})`;
}

function checkHammerWinner() {
    const cells = document.querySelectorAll('.championship-cell');
    
    for (let condition of hammerGame.winConditions) {
        const [a, b, c] = condition;
        if (hammerGame.board[a] && hammerGame.board[a] === hammerGame.board[b] && hammerGame.board[a] === hammerGame.board[c]) {
            // Highlight winning cells
            cells[a].classList.add('winner');
            cells[b].classList.add('winner');
            cells[c].classList.add('winner');
            
            // Update score
            if (hammerGame.currentPlayer === 'X') {
                hammerGame.player1Score++;
                document.getElementById('player1-score').textContent = hammerGame.player1Score;
                document.getElementById('winner-message').textContent = `${hammerGame.player1Name} Wins!`;
                const player1WinsDisplay = document.getElementById('player1-wins-display');
                if (player1WinsDisplay) {
                    player1WinsDisplay.textContent = `${hammerGame.player1Name}: ${hammerGame.player1Score}`;
                }
            } else {
                hammerGame.player2Score++;
                document.getElementById('player2-score').textContent = hammerGame.player2Score;
                document.getElementById('winner-message').textContent = `${hammerGame.player2Name} Wins!`;
                const player2WinsDisplay = document.getElementById('player2-wins-display');
                if (player2WinsDisplay) {
                    player2WinsDisplay.textContent = `${hammerGame.player2Name}: ${hammerGame.player2Score}`;
                }
            }
            
            document.getElementById('winner-message').style.display = 'flex';
            document.getElementById('turn-indicator').textContent = 'Game Over!';
            
            // Auto-reset after a delay
            setTimeout(() => resetHammerGame(), 2000);
            return true;
        }
    }
    return false;
}

function resetHammerGame() {
    hammerGame.board = ['', '', '', '', '', '', '', '', ''];
    hammerGame.currentPlayer = 'X';
    hammerGame.gameActive = true;
    
    const cells = document.querySelectorAll('.championship-cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner');
    });
    
    document.getElementById('winner-message').textContent = '';
    document.getElementById('winner-message').style.display = 'none';
    document.getElementById('turn-indicator').textContent = `${hammerGame.player1Name}'s Turn (X)`;
}

function newHammerPlayers() {
    // Reset scores
    hammerGame.player1Score = 0;
    hammerGame.player2Score = 0;
    hammerGame.tiesScore = 0;
    
    // Start over with player input
    showHammerGame();
}
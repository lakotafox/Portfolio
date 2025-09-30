// TicTacToe demo button handlers
function openTicTacToe(type) {
    // Show the modal overlay with the game
    showTicTacToeModal(type);
}

// Code viewer handlers
function viewCode(type) {
    if (type === 'human') {
        // Open NetBeans IDE viewer
        window.open('netbeans-viewer.html', 'NetBeansIDE', 'width=1200,height=800');
    } else if (type === 'hammer') {
        // Open Hammer code viewer - bloated AI code
        window.open('hammer-code-viewer.html', 'HammerCode', 'width=1200,height=800');
    } else if (type === 'scalpel') {
        // Open Scalpel code viewer - clean AI-assisted code
        window.open('scalpel-code-viewer.html', 'ScalpelCode', 'width=1200,height=800');
    }
}
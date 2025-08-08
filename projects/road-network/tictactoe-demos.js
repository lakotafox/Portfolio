// TicTacToe demo button handlers
function openTicTacToe(type) {
    if (type === 'messy') {
        // Show the hammer-mode version
        alert(
            'Messy TicTacToe (Hammer Mode)\n\n' +
            'This version demonstrates what happens when you use AI carelessly:\n\n' +
            '• Over 500 lines of tangled code\n' +
            '• 15+ unnecessary imports\n' +
            '• Complex state management for simple game\n' +
            '• Multiple conflicting logic patterns\n' +
            '• Hard to debug or extend\n\n' +
            '[Demo implementation coming soon]'
        );
    } else if (type === 'clean') {
        // Show the scalpel-mode version
        alert(
            'Clean TicTacToe (Scalpel Mode)\n\n' +
            'This version shows thoughtful AI usage:\n\n' +
            '• Under 100 lines of clean code\n' +
            '• No external dependencies\n' +
            '• Simple, clear game logic\n' +
            '• Easy to understand and modify\n' +
            '• Each function has one purpose\n\n' +
            '[Demo implementation coming soon]'
        );
    }
}
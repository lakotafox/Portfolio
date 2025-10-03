function closeModal() {
    document.getElementById('intro-modal').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
}

function startDemo() {
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('desktop-demo').classList.remove('hidden');
}

function openSudokuApp() {
    document.getElementById('python-icon').style.display = 'none';
    document.getElementById('sudoku-app').classList.remove('hidden');
}

function closeSudokuApp() {
    document.getElementById('sudoku-app').classList.add('hidden');
    document.getElementById('python-icon').style.display = 'flex';
}

function generatePuzzle(difficulty) {
    document.getElementById('sudoku-app').classList.add('hidden');
    document.getElementById('pdf-preview').classList.remove('hidden');

    // Set current date
    const now = new Date();
    document.getElementById('pdf-date').textContent = now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

function closePdfPreview() {
    document.getElementById('pdf-preview').classList.add('hidden');
    document.getElementById('desktop-demo').classList.remove('hidden');
    document.getElementById('python-icon').style.display = 'flex';
}

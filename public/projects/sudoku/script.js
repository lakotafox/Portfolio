// Grandma's Sudoku Robot — web demo.
// The puzzles are real: a randomized backtracking generator builds a full
// solution, then digs holes while a counting solver guarantees the puzzle
// keeps exactly one solution (same approach as the Python desktop app).

// --- generator -------------------------------------------------------------

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function firstEmpty(g) {
  for (let i = 0; i < 81; i++) if (!g[i]) return i;
  return -1;
}

function fits(g, i, v) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false;
  }
  const br = r - (r % 3);
  const bc = c - (c % 3);
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      if (g[(br + dr) * 9 + bc + dc] === v) return false;
    }
  }
  return true;
}

function fill(g) {
  const i = firstEmpty(g);
  if (i < 0) return true;
  for (const v of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (fits(g, i, v)) {
      g[i] = v;
      if (fill(g)) return true;
      g[i] = 0;
    }
  }
  return false;
}

function countSolutions(g, limit = 2) {
  let count = 0;
  (function walk() {
    if (count >= limit) return;
    const i = firstEmpty(g);
    if (i < 0) {
      count++;
      return;
    }
    for (let v = 1; v <= 9 && count < limit; v++) {
      if (fits(g, i, v)) {
        g[i] = v;
        walk();
        g[i] = 0;
      }
    }
  })();
  return count;
}

const GIVENS = { easy: 40, medium: 32, hard: 26 };

function makePuzzle(difficulty) {
  const solution = Array(81).fill(0);
  fill(solution);
  const puzzle = [...solution];
  let givens = 81;
  for (const i of shuffled([...Array(81).keys()])) {
    if (givens <= GIVENS[difficulty]) break;
    const kept = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions([...puzzle]) === 1) givens--;
    else puzzle[i] = kept;
  }
  return { puzzle, solution, givens };
}

// --- quotes ----------------------------------------------------------------

const QUOTES = [
  '"Patience is bitter, but its fruit is sweet."',
  '"Little by little, the bird builds its nest."',
  '"A garden is grown one seed at a time."',
  '"Slow and steady wins the race."',
  '"Every day is a good day for a puzzle."',
];

// --- demo flow -------------------------------------------------------------

const $ = (id) => document.getElementById(id);

function show(stateId) {
  for (const el of document.querySelectorAll('.desk-state')) el.hidden = true;
  $(stateId).hidden = false;
}

$('icon-btn').addEventListener('click', () => show('state-app'));
$('app-close').addEventListener('click', () => show('state-icon'));
$('app-minimize').addEventListener('click', () => show('state-icon'));

function renderGrid(puzzle) {
  const grid = $('grid');
  grid.innerHTML = '';
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const r = Math.floor(i / 9);
    const c = i % 9;
    if (r % 3 === 0) cell.classList.add('wall-top');
    if (c % 3 === 0) cell.classList.add('wall-left');
    if (r === 8) cell.classList.add('wall-bottom');
    if (c === 8) cell.classList.add('wall-right');
    if (puzzle[i]) cell.textContent = puzzle[i];
    grid.appendChild(cell);
  }
}

let puzzleNo = Math.floor(Math.random() * 900) + 100;
let lastDifficulty = 'easy';

function generate(difficulty) {
  lastDifficulty = difficulty;
  const { puzzle, givens } = makePuzzle(difficulty);
  renderGrid(puzzle);
  $('sheet-quote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  $('sheet-meta').textContent = `no. ${puzzleNo++} · ${difficulty} · ${givens} clues · ${date}`;
  $('printout').hidden = false;
  $('printout').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

for (const btn of document.querySelectorAll('.choice')) {
  btn.addEventListener('click', () => {
    $('win-note').textContent = 'generating…';
    // let the note paint before the generator blocks the thread
    setTimeout(() => {
      generate(btn.dataset.difficulty);
      $('win-note').textContent = 'sent to the printer';
      setTimeout(() => {
        $('win-note').textContent = 'picking one generates a real puzzle';
      }, 2500);
    }, 30);
  });
}

$('another-btn').addEventListener('click', () => {
  generate(lastDifficulty);
});

$('print-btn').addEventListener('click', () => window.print());

// taskbar clock, because grandma's desktop has one
function tickClock() {
  $('taskbar-clock').textContent = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
tickClock();
setInterval(tickClock, 30000);

// exposed for automated testing
window.__sudoku = { makePuzzle, countSolutions, fits };

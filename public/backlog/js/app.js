import { load, create, update, remove, reset, get, counts, all } from './store.js';
import { render, setFilter } from './board.js';
import { openModal } from './modal.js';
import { initStrands } from './strands.js';
import { enhanceSpecular } from './specular-button.js';

const boardEl = document.getElementById('board');
const bgEl = document.getElementById('bg');
const searchEl = document.getElementById('search');
const newBtn = document.getElementById('new-btn');
const resetBtn = document.getElementById('reset-btn');
const statTotal = document.getElementById('stat-total');
const statDone = document.getElementById('stat-done');
const statPoints = document.getElementById('stat-points');

load();

if (bgEl) initStrands(bgEl);
enhanceSpecular(newBtn, { size: 'md', radius: 12, intensity: 1.1 });

const handlers = {
  onCardClick: (id) => {
    const issue = get(id);
    if (issue) openModal(issue, { onSave: save, onDelete: del });
  },
  onAdd: (status) => openModal(null, { onSave: save, onDelete: del, status }),
};

function draw() {
  render(boardEl, handlers);
  updateStats();
}

function save(id, fields) {
  if (id) update(id, fields);
  else create(fields);
  draw();
}

function del(id) {
  remove(id);
  draw();
}

function updateStats() {
  const issues = all();
  const c = counts();
  statTotal.textContent = String(issues.length);
  statDone.textContent = String(c.done || 0);
  const remaining = issues
    .filter((i) => i.status !== 'done')
    .reduce((sum, i) => sum + (i.points || 0), 0);
  statPoints.textContent = String(remaining);
}

newBtn.addEventListener('click', () => openModal(null, { onSave: save, onDelete: del }));

resetBtn.addEventListener('click', () => {
  if (confirm('Reset the board to the starter backlog? Your changes will be lost.')) {
    reset();
    searchEl.value = '';
    setFilter('');
    draw();
  }
});

let searchTimer = 0;
searchEl.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    setFilter(searchEl.value);
    draw();
  }, 120);
});

// Keyboard: "n" or "c" opens a new issue (unless typing in a field).
document.addEventListener('keydown', (e) => {
  const typing = /^(input|textarea|select)$/i.test(e.target.tagName);
  if (!typing && (e.key === 'n' || e.key === 'c')) {
    e.preventDefault();
    openModal(null, { onSave: save, onDelete: del });
  }
});

draw();

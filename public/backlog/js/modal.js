// Create / edit issue modal. Builds the form via DOM APIs (no innerHTML with user
// data) and returns field values through onSave.

import { COLUMNS, TYPES, PRIORITIES, nextKey } from './store.js';

const modal = document.getElementById('modal');
const form = document.getElementById('issue-form');
const titleEl = document.getElementById('modal-title');
const keyEl = document.getElementById('modal-key');
const deleteBtn = document.getElementById('modal-delete');

const f = {
  title: document.getElementById('f-title'),
  description: document.getElementById('f-description'),
  type: document.getElementById('f-type'),
  priority: document.getElementById('f-priority'),
  status: document.getElementById('f-status'),
  points: document.getElementById('f-points'),
  labels: document.getElementById('f-labels'),
};

let current = null;
let cb = {};

function fillSelect(sel, items) {
  sel.innerHTML = '';
  for (const it of items) {
    const opt = document.createElement('option');
    opt.value = it.id;
    opt.textContent = it.name;
    sel.appendChild(opt);
  }
}

fillSelect(f.type, TYPES);
fillSelect(f.priority, PRIORITIES);
fillSelect(f.status, COLUMNS);

export function openModal(issue, callbacks) {
  cb = callbacks || {};
  current = issue;

  if (issue) {
    titleEl.textContent = 'Edit issue';
    keyEl.textContent = issue.id;
    deleteBtn.hidden = false;
    f.title.value = issue.title;
    f.description.value = issue.description || '';
    f.type.value = issue.type;
    f.priority.value = issue.priority;
    f.status.value = issue.status;
    f.points.value = issue.points ?? '';
    f.labels.value = (issue.labels || []).join(', ');
  } else {
    titleEl.textContent = 'New issue';
    keyEl.textContent = nextKey();
    deleteBtn.hidden = true;
    form.reset();
    f.type.value = 'task';
    f.priority.value = 'medium';
    f.status.value = (callbacks && callbacks.status) || 'backlog';
  }

  modal.hidden = false;
  setTimeout(() => f.title.focus(), 30);
}

export function closeModal() {
  modal.hidden = true;
  current = null;
}

function collect() {
  const pts = f.points.value.trim();
  return {
    title: f.title.value.trim() || 'Untitled',
    description: f.description.value.trim(),
    type: f.type.value,
    priority: f.priority.value,
    status: f.status.value,
    points: pts === '' ? null : Math.max(0, parseInt(pts, 10) || 0),
    labels: f.labels.value.split(',').map((s) => s.trim()).filter(Boolean),
  };
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  cb.onSave?.(current ? current.id : null, collect());
  closeModal();
});

deleteBtn.addEventListener('click', () => {
  if (current) cb.onDelete?.(current.id);
  closeModal();
});

document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-cancel-2').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

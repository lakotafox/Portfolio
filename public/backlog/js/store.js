// Data model + persistence. Everything lives in localStorage under one key, kept
// deliberately isolated so it could later be swapped for a synced backend
// (e.g. Netlify Blobs) without touching the rest of the app.

import { seedIssues } from './seed.js';

const STORAGE_KEY = 'backlog.v1';
export const PROJECT_KEY = 'PORT';

export const COLUMNS = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'To Do' },
  { id: 'inprogress', name: 'In Progress' },
  { id: 'done', name: 'Done' },
];

export const TYPES = [
  { id: 'story', name: 'Story', icon: '▣', color: '#22c55e' },
  { id: 'task', name: 'Task', icon: '☑', color: '#38bdf8' },
  { id: 'bug', name: 'Bug', icon: '◉', color: '#ef4444' },
];

export const PRIORITIES = [
  { id: 'urgent', name: 'Urgent', color: '#ef4444', rank: 4 },
  { id: 'high', name: 'High', color: '#f59e0b', rank: 3 },
  { id: 'medium', name: 'Medium', color: '#a78bfa', rank: 2 },
  { id: 'low', name: 'Low', color: '#64748b', rank: 1 },
];

let state = { issues: [], counter: 0 };

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — the board still works in memory this session */
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      return;
    }
  } catch {
    /* fall through to seed */
  }
  seed();
}

export function seed() {
  const issues = seedIssues(PROJECT_KEY);
  state = { issues, counter: issues.length };
  persist();
}

export function reset() {
  seed();
}

export function all() {
  return state.issues;
}

export function byStatus(status) {
  return state.issues
    .filter((i) => i.status === status)
    .sort((a, b) => a.order - b.order);
}

export function get(id) {
  return state.issues.find((i) => i.id === id) || null;
}

export function counts() {
  const c = {};
  for (const col of COLUMNS) c[col.id] = 0;
  for (const i of state.issues) c[i.status] = (c[i.status] || 0) + 1;
  return c;
}

function nowIso() {
  // Date is available in the browser; the workflow-script restriction does not apply here.
  return new Date().toISOString();
}

export function nextKey() {
  return `${PROJECT_KEY}-${state.counter + 1}`;
}

export function create(fields) {
  state.counter += 1;
  const status = fields.status || 'backlog';
  const order = Math.max(-1, ...byStatus(status).map((i) => i.order)) + 1;
  const issue = {
    id: `${PROJECT_KEY}-${state.counter}`,
    title: fields.title || 'Untitled',
    description: fields.description || '',
    type: fields.type || 'task',
    priority: fields.priority || 'medium',
    status,
    points: fields.points ?? null,
    labels: fields.labels || [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    order,
  };
  state.issues.push(issue);
  persist();
  return issue;
}

export function update(id, fields) {
  const issue = get(id);
  if (!issue) return null;
  Object.assign(issue, fields, { updatedAt: nowIso() });
  persist();
  return issue;
}

export function remove(id) {
  state.issues = state.issues.filter((i) => i.id !== id);
  persist();
}

// Apply a drag result: an ordered list of issue ids now living in `status`.
export function reorder(status, orderedIds) {
  orderedIds.forEach((id, idx) => {
    const issue = get(id);
    if (issue) {
      issue.status = status;
      issue.order = idx;
      issue.updatedAt = nowIso();
    }
  });
  persist();
}

export function typeMeta(id) {
  return TYPES.find((t) => t.id === id) || TYPES[1];
}
export function priorityMeta(id) {
  return PRIORITIES.find((p) => p.id === id) || PRIORITIES[2];
}

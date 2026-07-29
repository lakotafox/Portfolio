// Renders the columns + cards and wires SortableJS drag-and-drop.
// SortableJS is loaded as a UMD global via a <script> tag in index.html.

import { COLUMNS, byStatus, reorder, counts, typeMeta, priorityMeta } from './store.js';

let handlers = {};
let filterText = '';

export function setFilter(text) {
  filterText = text.trim().toLowerCase();
}

function matches(issue) {
  if (!filterText) return true;
  const hay = `${issue.id} ${issue.title} ${issue.description} ${issue.labels.join(' ')}`.toLowerCase();
  return hay.includes(filterText);
}

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

function cardNode(issue) {
  const tm = typeMeta(issue.type);
  const pm = priorityMeta(issue.priority);

  const card = el('div', 'card');
  card.dataset.id = issue.id;
  card.style.setProperty('--pri', pm.color);

  card.appendChild(el('div', 'card-title', issue.title));

  if (issue.labels && issue.labels.length) {
    const labels = el('div', 'card-labels');
    for (const l of issue.labels) labels.appendChild(el('span', 'chip', l));
    card.appendChild(labels);
  }

  const meta = el('div', 'card-meta');
  const type = el('span', 'card-type', tm.icon);
  type.style.color = tm.color;
  type.title = tm.name;
  meta.appendChild(type);
  meta.appendChild(el('span', 'card-key', issue.id));

  const spacer = el('span', 'card-spacer');
  meta.appendChild(spacer);

  if (issue.points != null) meta.appendChild(el('span', 'card-points', String(issue.points)));

  const pri = el('span', 'card-priority', pm.name);
  pri.style.color = pm.color;
  meta.appendChild(pri);

  card.appendChild(meta);

  card.addEventListener('click', () => handlers.onCardClick?.(issue.id));
  return card;
}

export function render(boardEl, h) {
  if (h) handlers = h;
  boardEl.innerHTML = '';
  const c = counts();

  for (const col of COLUMNS) {
    const column = el('div', 'column');
    column.dataset.status = col.id;

    const header = el('div', 'column-header');
    header.appendChild(el('span', 'column-name', col.name));
    header.appendChild(el('span', 'column-count', String(c[col.id] || 0)));
    column.appendChild(header);

    const cards = el('div', 'column-cards');
    cards.dataset.status = col.id;
    for (const issue of byStatus(col.id)) {
      const node = cardNode(issue);
      if (!matches(issue)) node.classList.add('dimmed');
      cards.appendChild(node);
    }
    column.appendChild(cards);

    const add = el('button', 'add-card', '+ Add issue');
    add.addEventListener('click', () => handlers.onAdd?.(col.id));
    column.appendChild(add);

    boardEl.appendChild(column);
  }

  wireDrag(boardEl);
}

function wireDrag(boardEl) {
  const lists = boardEl.querySelectorAll('.column-cards');
  lists.forEach((list) => {
    // eslint-disable-next-line no-undef
    new Sortable(list, {
      group: 'issues',
      animation: 150,
      ghostClass: 'card-ghost',
      dragClass: 'card-drag',
      onEnd: () => {
        // Persist the new arrangement of every column (source + target).
        boardEl.querySelectorAll('.column-cards').forEach((l) => {
          const ids = Array.from(l.children)
            .filter((n) => n.classList.contains('card'))
            .map((n) => n.dataset.id);
          reorder(l.dataset.status, ids);
        });
        refreshCounts(boardEl);
      },
    });
  });
}

function refreshCounts(boardEl) {
  const c = counts();
  boardEl.querySelectorAll('.column').forEach((col) => {
    const countEl = col.querySelector('.column-count');
    if (countEl) countEl.textContent = String(c[col.dataset.status] || 0);
  });
}

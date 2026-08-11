/* The two drag games. Pointer events, no library — SortableJS would be a
   dependency for eight list items. */

import { chime, thud } from './blip.js';

const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  // never hand back the finished puzzle
  return r.every((v, i) => v === a[i]) && a.length > 1 ? shuffle(a) : r;
};

/**
 * A reorderable list that reports when the order is right.
 * @param {HTMLElement} host
 * @param {string[]} correct  labels in their correct order
 * @param {(msg:string, tone:string)=>void} say
 */
function orderGame(host, correct, say, winLine) {
  let order = shuffle(correct);
  let solved = false;

  const draw = () => {
    host.innerHTML = '';
    order.forEach((label, i) => {
      const row = document.createElement('div');
      row.className = 'slot';
      row.dataset.index = String(i);
      row.innerHTML = `<span class="grip">::</span><span class="slot-label"></span>`;
      row.querySelector('.slot-label').textContent = label;
      host.appendChild(row);
    });
  };

  const check = () => {
    if (solved) return;
    if (order.every((v, i) => v === correct[i])) {
      solved = true;
      chime();
      say(winLine, 'pass');
      host.querySelectorAll('.slot').forEach((s) => { s.style.cursor = 'default'; });
    }
  };

  // Pointer drag: pick a row up, and swap it with whatever row you are over.
  let dragging = null;
  host.addEventListener('pointerdown', (e) => {
    if (solved) return;
    const row = e.target.closest('.slot');
    if (!row) return;
    dragging = row;
    row.dataset.dragging = 'true';
    row.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rows = [...host.querySelectorAll('.slot')];
    const over = rows.find((r) => {
      const b = r.getBoundingClientRect();
      return e.clientY >= b.top && e.clientY <= b.bottom;
    });
    if (!over || over === dragging) return;
    const from = Number(dragging.dataset.index);
    const to = Number(over.dataset.index);
    [order[from], order[to]] = [order[to], order[from]];
    draw();
    dragging = host.querySelector(`.slot[data-index="${to}"]`);
    if (dragging) { dragging.dataset.dragging = 'true'; dragging.setPointerCapture(e.pointerId); }
  });
  const drop = () => {
    if (!dragging) return;
    delete dragging.dataset.dragging;
    dragging = null;
    check();
  };
  host.addEventListener('pointerup', drop);
  host.addEventListener('pointercancel', drop);

  draw();
}

export function stackGame(host, say) {
  orderGame(
    host,
    ['Applications — Chrome, Claude Code', 'Shell — zsh, your terminal', 'macOS — Finder, windows, permissions', 'Kernel — the traffic cop', 'Hardware — chip, memory, disk'],
    say,
    'That is the machine. Top to bottom, each layer only speaks to its neighbours.',
  );
}

export function pipeGame(host, say) {
  orderGame(
    host,
    ['fortune', '|', 'cowsay'],
    say,
    'Output of the left, into the right. Now go ask for it out loud.',
  );
}

/** Multiple choice. Wrong answers explain themselves and cost nothing. */
export function quiz(host, spec, say, onPass) {
  let done = false;
  host.innerHTML = '';
  const q = document.createElement('p');
  q.style.fontWeight = 'bold';
  q.textContent = spec.q;
  host.appendChild(q);

  spec.options.forEach((opt) => {
    const b = document.createElement('button');
    b.className = 'w95-btn choice';
    b.type = 'button';
    b.textContent = opt.t;
    b.addEventListener('click', () => {
      if (done) return;
      if (opt.ok) {
        done = true;
        b.dataset.picked = 'right';
        chime();
        say(opt.why, 'pass');
        onPass?.();
      } else {
        b.dataset.picked = 'wrong';
        thud();
        say(opt.why, 'near');
      }
    });
    host.appendChild(b);
  });
}

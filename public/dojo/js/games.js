/* Drag-to-build puzzles.

   Earlier version pre-filled the slots and swapped rows on hover. That was
   wrong twice over: it read as "the answer is already here, jiggle it", and
   swap-on-hover feels awful under a finger. Now there is a palette of loose
   pieces and a column of EMPTY slots, and you actually pick a piece up and put
   it somewhere. Pointer events only — works with a mouse and a thumb, no
   library. */

import { chime, thud } from './blip.js';

const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r.every((v, i) => v === a[i]) && a.length > 1 ? shuffle(r) : r;
};

/**
 * @param {HTMLElement} host
 * @param {{id:string,label:string}[]} pieces   in CORRECT order
 * @param {string[]} slotHints                  one per slot, top to bottom
 * @param {(msg:string)=>void} say
 * @param {string} winLine
 * @param {'column'|'row'} layout
 */
function buildGame(host, pieces, slotHints, say, winLine, layout = 'column') {
  const correct = pieces.map((p) => p.id);
  let solved = false;

  host.innerHTML = '';
  host.className = `build build-${layout}`;

  const slotWrap = document.createElement('div');
  slotWrap.className = 'build-slots';
  slotHints.forEach((hint, i) => {
    const s = document.createElement('div');
    s.className = 'build-slot';
    s.dataset.i = String(i);
    s.innerHTML = `<span class="slot-hint"></span>`;
    s.querySelector('.slot-hint').textContent = hint;
    slotWrap.appendChild(s);
  });

  const palette = document.createElement('div');
  palette.className = 'build-palette';
  const plabel = document.createElement('p');
  plabel.className = 'palette-label';
  plabel.textContent = 'Pieces';
  palette.appendChild(plabel);

  const pieceEls = new Map();
  for (const p of shuffle(pieces)) {
    const d = document.createElement('div');
    d.className = 'piece';
    d.dataset.id = p.id;
    d.textContent = p.label;
    palette.appendChild(d);
    pieceEls.set(p.id, d);
  }

  host.append(slotWrap, palette);

  const check = () => {
    if (solved) return;
    const got = [...slotWrap.querySelectorAll('.build-slot')].map(
      (s) => s.querySelector('.piece')?.dataset.id ?? null,
    );
    if (got.some((g) => g === null)) return;
    if (got.every((g, i) => g === correct[i])) {
      solved = true;
      host.dataset.solved = 'true';
      chime();
      say(winLine);
    } else {
      thud();
      say('Not yet. Look at what has to sit underneath what.');
    }
  };

  /* ---- dragging, plus tap-to-place ----
     Drag is the nice interaction, but on a phone the palette and the slots can
     be far enough apart that a drag needs a scroll halfway through, which is
     miserable. So a tap (pointer that barely moved) selects a piece instead,
     and the next tap on a slot places it. Both paths, same code. */
  let drag = null;      // { el, home, ghost, dx, dy, x0, y0 }
  let picked = null;    // tap-selected piece

  const setPicked = (el) => {
    if (picked) delete picked.dataset.picked;
    picked = el || null;
    if (picked) picked.dataset.picked = 'true';
  };

  const place = (slot, el) => {
    const sitting = slot.querySelector('.piece');
    if (sitting && sitting !== el) palette.appendChild(sitting);   // evicted
    slot.appendChild(el);
    setPicked(null);
    check();
  };

  const homeOf = (el) => (el.parentElement.classList.contains('build-slot') ? el.parentElement : palette);

  /* The piece is reparented to <body> mid-drag so it can travel anywhere on
     screen. Moving an element in the DOM RELEASES its pointer capture, so the
     piece itself stops receiving events — listen on `document`, which sees them
     regardless of where the node currently lives. A placeholder holds the gap
     open so the palette does not collapse under the cursor. */
  const slotUnder = (x, y) => {
    drag.el.style.visibility = 'hidden';
    const under = document.elementFromPoint(x, y);
    drag.el.style.visibility = '';
    return under?.closest('.build-slot') ?? null;
  };

  const onMove = (e) => {
    if (!drag) return;
    e.preventDefault();
    drag.el.style.left = `${e.clientX - drag.dx}px`;
    drag.el.style.top = `${e.clientY - drag.dy}px`;
    const slot = slotUnder(e.clientX, e.clientY);
    slotWrap.querySelectorAll('.build-slot').forEach((s) => {
      s.dataset.over = s === slot ? 'true' : 'false';
    });
  };

  const onUp = (e) => {
    if (!drag) return;
    const { el, home } = drag;
    const moved = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6;
    const slot = moved ? slotUnder(e.clientX, e.clientY) : null;

    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    drag.ghost?.remove();
    el.classList.remove('dragging');
    el.style.cssText = '';
    slotWrap.querySelectorAll('.build-slot').forEach((s) => { s.dataset.over = 'false'; });

    if (slot) {
      place(slot, el);
    } else {
      home.appendChild(el);
      if (!moved) setPicked(picked === el ? null : el);   // it was a tap
    }
    drag = null;
    if (slot) return;
  };

  /* tap a slot while something is selected */
  slotWrap.addEventListener('click', (e) => {
    if (solved || !picked) return;
    const slot = e.target.closest('.build-slot');
    if (slot) place(slot, picked);
  });

  host.addEventListener('pointerdown', (e) => {
    if (solved) return;
    const piece = e.target.closest('.piece');
    if (!piece) return;
    e.preventDefault();

    const r = piece.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'piece-ghost';
    ghost.style.height = `${r.height}px`;
    piece.parentElement.insertBefore(ghost, piece);

    drag = {
      el: piece, home: homeOf(piece), ghost,
      dx: e.clientX - r.left, dy: e.clientY - r.top,
      x0: e.clientX, y0: e.clientY,
    };
    piece.classList.add('dragging');
    piece.style.width = `${r.width}px`;
    piece.style.left = `${r.left}px`;
    piece.style.top = `${r.top}px`;
    document.body.appendChild(piece);

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  });
}

export function stackGame(host, say) {
  buildGame(
    host,
    [
      { id: 'apps',  label: 'Applications — Chrome, Claude Code' },
      { id: 'shell', label: 'Shell — zsh, your terminal' },
      { id: 'os',    label: 'macOS — Finder, windows, permissions' },
      { id: 'kernel',label: 'Kernel — the traffic cop' },
      { id: 'hw',    label: 'Hardware — chip, memory, disk' },
    ],
    ['top', '', '', '', 'bottom'],
    say,
    'That is the machine. Each layer only speaks to the ones it touches.',
    'column',
  );
}

export function pipeGame(host, say) {
  buildGame(
    host,
    [
      { id: 'fortune', label: 'fortune' },
      { id: 'pipe',    label: '|' },
      { id: 'cowsay',  label: 'cowsay' },
    ],
    ['first', 'then', 'then'],
    say,
    'Output of the left, into the right. Now go and ask for it out loud.',
    'row',
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
        say(opt.why);
        onPass?.();
      } else {
        b.dataset.picked = 'wrong';
        thud();
        say(opt.why);
      }
    });
    host.appendChild(b);
  });
}

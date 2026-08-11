/* Entry. Renders the belts, wires the checks, keeps sensei talking. */

import { BELTS, TERMINAL_BELTS } from './belts.js';
import * as store from './store.js';
import { runCheck } from './checks.js';
import { createSensei, preload } from './sensei.js';
import { chime, thud, setMuted, isMuted } from './blip.js';
import { stackGame, pipeGame, quiz } from './games.js';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

store.load();

const sensei = createSensei($('#sensei-img'), $('#sensei-text'));
preload();

/* Tapping the bubble fast-forwards the line — same affordance as Gifsmith. */
$('#sensei-bubble').addEventListener('click', () => sensei.skip());

const say = (line) => sensei.say(line);

/* ------------------------------------------------------------ rendering -- */

function beltState(belt) {
  const done = belt.katas.filter((k) => store.isDone(k.id)).length;
  if (done === belt.katas.length) return 'earned';
  if (done > 0) return 'current';
  return 'locked';
}

function renderRack() {
  const rack = $('#rack');
  rack.innerHTML = '';
  const current = BELTS.find((b) => beltState(b) !== 'earned');

  for (const belt of BELTS) {
    const st = beltState(belt);
    const chip = el('div', 'belt-chip');
    chip.dataset.state = st === 'earned' ? 'earned' : (belt === current ? 'current' : 'locked');
    const sw = el('span', 'belt-swatch');
    sw.style.setProperty('--belt', `var(--belt-${belt.id})`);
    chip.append(sw, el('span', null, belt.name));
    if (st === 'earned') chip.append(el('span', 'tick', '✓'));
    rack.appendChild(chip);
  }
  for (const belt of TERMINAL_BELTS) {
    const chip = el('div', 'belt-chip');
    chip.dataset.state = 'locked';
    const sw = el('span', 'belt-swatch');
    sw.style.setProperty('--belt', `var(--belt-${belt.id})`);
    chip.append(sw, el('span', null, belt.name));
    rack.appendChild(chip);
  }

  const earned = BELTS.filter((b) => beltState(b) === 'earned').length;
  $('#taskbar-rank').textContent = current
    ? `${current.name} — ${current.motto}`
    : 'Ready for the terminal';
  $('#rank-line').textContent =
    `${earned} of ${BELTS.length + TERMINAL_BELTS.length} belts · ` +
    `${store.snapshot().done.length} katas complete`;
}

function renderKata(belt, kata, idx) {
  const win = el('section', 'win w95-raised');
  const done = store.isDone(kata.id);
  if (done) win.classList.add('kata-done');

  const bar = el('header', 'w95-titlebar');
  const name = el('div', 'titlebar-name');
  name.append(el('span', 'titlebar-ico', done ? '✓' : String(idx + 1)), el('span', null, kata.title));
  bar.append(name);
  win.appendChild(bar);

  const body = el('div', 'win-body');

  body.appendChild(el('p', 'concept', kata.concept));
  if (kata.aside) body.appendChild(el('p', null, kata.aside));

  if (kata.link) {
    const p = el('p');
    const a = el('a', null, kata.link.label);
    a.href = kata.link.href;
    a.target = '_blank';
    a.rel = 'noopener';
    p.append('Instructions: ', a);
    body.appendChild(p);
  }

  /* the ask — loudest thing in the kata, because it is the point */
  if (kata.ask) {
    const ask = el('div', 'ask');
    ask.append(el('span', 'ask-label', 'Say this'));
    const col = el('div');
    col.append(el('div', 'ask-say', `“${kata.ask}”`));
    if (kata.askNote) col.append(el('div', 'cmd-note', kata.askNote));
    ask.append(col);
    body.appendChild(ask);
  }

  if (kata.command) {
    body.appendChild(el('pre', 'cmd', kata.command));
    if (kata.cmdNote) body.appendChild(el('p', 'cmd-note', kata.cmdNote));
  }

  if (kata.game) {
    const host = el('div', 'game-slots');
    body.appendChild(host);
    const report = (msg) => { say(msg); complete(); };
    if (kata.game === 'stack') stackGame(host, report);
    if (kata.game === 'pipe') pipeGame(host, report);
  }

  if (kata.quiz) {
    const host = el('div');
    body.appendChild(host);
    quiz(host, kata.quiz, (msg) => say(msg), complete);
  }

  if (kata.check) {
    body.appendChild(el('p', 'check-label', kata.checkPrompt || 'Paste what it printed.'));
    const ta = el('textarea', 'paste w95-sunken');
    ta.placeholder = 'paste the output here';
    ta.spellcheck = false;
    body.appendChild(ta);

    const row = el('div', 'check-row');
    const btn = el('button', 'w95-btn', 'Show sensei');
    btn.type = 'button';
    row.appendChild(btn);
    body.appendChild(row);

    const verdict = el('div', 'verdict');
    verdict.hidden = true;
    body.appendChild(verdict);

    btn.addEventListener('click', () => {
      const r = runCheck(kata.check, ta.value);
      verdict.hidden = false;
      verdict.dataset.tone = r.tone;
      verdict.innerHTML = '';
      verdict.append(
        el('span', 'mark', r.tone === 'pass' ? '✓' : r.tone === 'near' ? '!' : '×'),
        el('span', null, r.line),
      );
      say(r.line);
      if (r.tone === 'pass') { chime(); complete(); } else { thud(); }
    });
  }

  /* katas with nothing to check are marked done by reading them */
  if (!kata.check && !kata.game && !kata.quiz) {
    const row = el('div', 'check-row');
    const btn = el('button', 'w95-btn', done ? 'Done' : 'I have done this');
    btn.type = 'button';
    btn.disabled = done;
    btn.addEventListener('click', () => { chime(); complete(); btn.disabled = true; btn.textContent = 'Done'; });
    row.appendChild(btn);
    body.appendChild(row);
  }

  function complete() {
    const was = beltState(belt);
    store.markDone(kata.id);
    win.classList.add('kata-done');
    name.querySelector('.titlebar-ico').textContent = '✓';
    renderRack();
    if (was !== 'earned' && beltState(belt) === 'earned') {
      sensei.hold('bow');
      say(`${belt.name}. ${belt.motto}`).then(() => setTimeout(() => sensei.hold(null), 1200));
    }
  }

  win.appendChild(body);
  return win;
}

function render() {
  const main = $('#belts');
  main.innerHTML = '';
  for (const belt of BELTS) {
    const head = el('section', 'win w95-raised');
    const bar = el('header', 'w95-titlebar');
    const nm = el('div', 'titlebar-name');
    nm.append(el('span', 'titlebar-ico', '◆'), el('span', null, `${belt.name} — ${belt.motto}`));
    bar.append(nm);
    head.append(bar);
    const b = el('div', 'win-body');
    b.appendChild(el('p', null, belt.intro));
    if (belt.handTyped) {
      b.appendChild(el('p', 'cmd-note', 'You type these yourself. There is nobody to ask yet — that is the only reason.'));
    }
    head.appendChild(b);
    main.appendChild(head);

    belt.katas.forEach((k, i) => main.appendChild(renderKata(belt, k, i)));
  }

  /* what waits in the terminal */
  const next = el('section', 'win w95-raised');
  const nbar = el('header', 'w95-titlebar');
  const nnm = el('div', 'titlebar-name');
  nnm.append(el('span', 'titlebar-ico', '❯'), el('span', null, 'The rest is not on this page'));
  nbar.append(nnm);
  next.append(nbar);
  const nb = el('div', 'win-body');
  nb.appendChild(el('p', null,
    'Three belts are left, and they are taught in your terminal by the same sensei — because by then you can be checked properly, not on your word.'));
  for (const t of TERMINAL_BELTS) {
    const k = el('div', 'kata');
    const h = el('div', 'kata-head');
    h.append(el('span', 'kata-num', '◆'), el('span', null, `${t.name} — ${t.motto}`));
    k.append(h, el('p', 'cmd-note', t.teaser));
    nb.appendChild(k);
  }
  next.appendChild(nb);
  main.appendChild(next);
}

/* ---------------------------------------------------------------- chrome -- */

function clock() {
  const d = new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  $('#clock').textContent = `${h}:${m} ${ap}`;
}
clock();
setInterval(clock, 20000);

$('#mute').addEventListener('click', (e) => {
  setMuted(!isMuted());
  e.currentTarget.textContent = isMuted() ? 'Sound: off' : 'Sound: on';
});

$('#reset').addEventListener('click', () => {
  if (!confirm('Wipe your progress and start over?')) return;
  store.reset();
  render();
  renderRack();
  say('We begin again. No shame in it.');
});

render();
renderRack();

const earnedAny = store.snapshot().done.length > 0;
say(earnedAny
  ? 'Welcome back. Pick up where you left off.'
  : 'Welcome. I am your sensei. We start with what a computer is — not with typing.');

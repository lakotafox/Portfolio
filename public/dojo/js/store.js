/* Progress. One key, one JSON blob, isolated behind load/persist/reset so it
   could be swapped for a synced backend later without touching the rest.
   Pattern copied from public/backlog/js/store.js. */

const STORAGE_KEY = 'dojo.v1';

/* The belt list itself lives in belts.js with the curriculum — there is no
   second copy here to drift out of step with it. */

const EMPTY = { done: [], startedAt: null, lastAt: null };

let state = { ...EMPTY };

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — the dojo still works in memory this session */
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.done)) state = { ...EMPTY, ...parsed };
    }
  } catch {
    state = { ...EMPTY };
  }
  if (!state.startedAt) { state.startedAt = Date.now(); persist(); }
  return state;
}

export function isDone(kataId) { return state.done.includes(kataId); }

export function markDone(kataId) {
  if (!state.done.includes(kataId)) {
    state.done.push(kataId);
    state.lastAt = Date.now();
    persist();
  }
}

export function reset() {
  state = { ...EMPTY, startedAt: Date.now() };
  persist();
}

export function snapshot() { return { ...state, done: [...state.done] }; }

/** A belt is earned once every kata inside it is done. */
export function beltEarned(belt) {
  return belt.katas.length > 0 && belt.katas.every((k) => isDone(k.id));
}

/** The belt he is working on — the first one not yet finished. */
export function currentBelt(belts) {
  return belts.find((b) => !beltEarned(b)) ?? belts[belts.length - 1];
}

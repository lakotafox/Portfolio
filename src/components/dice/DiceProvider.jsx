/* Holds the current look, and owns every way of changing it.
 *
 * Keyboard is a shortcut, not the only way in — every knob here is also a
 * clickable chip in ControlBar, mirroring how EDI's bar works.
 *
 *   0 / space  reroll everything    1  backdrop    2  cursor
 *   3  wordmark FX                  4  button      5  palette
 *   6  density                      7  save look   8  favs vs random
 *   p  backdrop palette (separate from the page palette)
 *
 * Shift + a number steps that knob backwards.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { roll, rerollFrom, unpin, permalink, POOLS, poolStats, CTA_TREATMENTS, DENSITIES, motionFor, FAMILY_KEYS, listForRole } from '../../lib/dice';
import { applyPalette } from '../../lib/palette';
import { quarantined } from './P4rtsSlot';
import REGISTRY from '../../lib/p4rts-registry.json';

const DiceCtx = createContext(null);
export const useDice = () => useContext(DiceCtx);

const ENTRY = new Map(REGISTRY.map((r) => [r.slug, r.entry]));
export const entryFor = (slug) => ENTRY.get(slug);

const PRESETS_KEY = 'p4rts-presets';
const MODE_KEY = 'p4rts-roll-mode';

const loadPresets = () => {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY) ?? '[]'); } catch { return []; }
};
const savePresets = (p) => {
  try { localStorage.setItem(PRESETS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
};

/** Roll, but never hand back anything the user has quarantined. */
function safeRoll(prev) {
  const bad = quarantined();
  for (let i = 0; i < 25; i++) {
    const look = prev ? rerollFrom(prev) : roll();
    const used = [look.background, look.cursor, look.titleFx, look.cta].filter(Boolean);
    if (!used.some((s) => bad.has(s))) return look;
  }
  return prev ?? roll();
}

export function DiceProvider({ children }) {
  const [look, setLook] = useState(() => safeRoll(null));
  /* Every look you have seen, so the left arrow can walk back through them.
   * Without this "back" would just be another random roll, which is not back. */
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [favIndex, setFavIndex] = useState(0);
  const [presets, setPresets] = useState(loadPresets);
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) ?? 'random');
  const [barOpen, setBarOpen] = useState(false);

  // paint the palette onto :root whenever the look changes
  useEffect(() => { applyPalette(look.palette); }, [look.palette]);

  // family chrome: .theme-win95 etc on <html>, one class at a time
  useEffect(() => {
    const el = document.documentElement;
    for (const k of ['win95']) el.classList.toggle(`theme-${k}`, look.theme === k);
  }, [look.theme]);

  /** Replace the current look, remembering the old one so `back` works. */
  const push = useCallback((next) => {
    setLook((cur) => {
      if (!next || next === cur) return cur;
      setPast((h) => [...h.slice(-40), cur]);
      setFuture([]);
      return next;
    });
  }, []);

  const reroll = useCallback(() => {
    unpin();
    setLook((cur) => {
      const next = (mode === 'favs' && presets.length)
        ? { ...presets[Math.floor(Math.random() * presets.length)].look }
        : safeRoll(cur);
      setPast((h) => [...h.slice(-40), cur]);
      setFuture([]);
      return next;
    });
  }, [mode, presets]);

  /** Left arrow: step back through looks you have already seen. */
  const back = useCallback(() => {
    setPast((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setLook((cur) => { setFuture((f) => [cur, ...f].slice(0, 40)); return prev; });
      return h.slice(0, -1);
    });
  }, []);

  /** Right arrow in random mode: forward through history, or roll if at the end. */
  const forward = useCallback(() => {
    setFuture((f) => {
      if (!f.length) { reroll(); return f; }
      const next = f[0];
      setLook((cur) => { setPast((h) => [...h.slice(-40), cur]); return next; });
      return f.slice(1);
    });
  }, [reroll]);

  /** Favs mode: arrows walk the saved list in order rather than at random. */
  const stepFav = useCallback((dir) => {
    if (!presets.length) return;
    setFavIndex((i) => {
      const next = (i + dir + presets.length) % presets.length;
      setLook((cur) => { setPast((h) => [...h.slice(-40), cur]); return { ...presets[next].look }; });
      return next;
    });
  }, [presets]);

  /** Step one knob to its next value, leaving everything else alone. */
  const cycle = useCallback((role, back = false) => {
    setPast((h) => [...h.slice(-40), look]);
    setFuture([]);
    setLook((cur) => {
      // inside a family, a knob only steps through that family's shortlist
      const list = listForRole(role, cur.theme);
      if (!list?.length) return cur;
      const i = list.indexOf(cur[role]);
      const next = list[(i + (back ? -1 : 1) + list.length) % list.length];
      return { ...cur, [role]: next };
    });
  }, [look]);

  /** Jump a knob straight to a value — used by the dropdowns. */
  const setKnob = useCallback((role, value) => {
    setLook((cur) => {
      if (cur[role] === value) return cur;
      setPast((h) => [...h.slice(-40), cur]);
      setFuture([]);
      return { ...cur, [role]: value };
    });
  }, []);

  const rollPaletteOnly = useCallback(() => {
    setLook((cur) => ({ ...cur, palette: roll({ ignoreQuery: true }).palette }));
  }, []);

  /** Reroll ONLY the backdrop's colours, leaving the page palette alone. */
  const rollBgPaletteOnly = useCallback(() => {
    setLook((cur) => ({ ...cur, bgPalette: roll({ ignoreQuery: true }).bgPalette }));
  }, []);

  /* Density drives three things, so all three have to move together: the
   * animation multiplier the backdrop/wordmark read, the wall's drift speed,
   * and the GPU budget. Updating only `density` left `motion` at its roll-time
   * value, so the chip changed but nothing on screen sped up or slowed down. */
  /** Step the family: freestyle -> win95 -> … Each switch is a fresh roll
   *  INSIDE the new family, so every knob lands on-theme together. */
  const cycleTheme = useCallback(() => {
    setLook((cur) => {
      const next = FAMILY_KEYS[(FAMILY_KEYS.indexOf(cur.theme ?? 'freestyle') + 1) % FAMILY_KEYS.length];
      setPast((h) => [...h.slice(-40), cur]);
      setFuture([]);
      return roll({ ignoreQuery: true, theme: next });
    });
  }, []);

  const cycleDensity = useCallback(() => {
    setLook((cur) => {
      const next = DENSITIES[(DENSITIES.indexOf(cur.density) + 1) % DENSITIES.length];
      return { ...cur, density: next, motion: motionFor(next) };
    });
  }, []);

  /* A look is identified by the components + palettes it uses, NOT by its seed
   * — stepping a single knob makes a new look worth saving, but pressing save
   * twice on the same screen should not stack duplicates. */
  const lookKey = (l) => [l.background, l.cursor, l.titleFx, l.cta, l.density,
    l.palette?.name, l.bgPalette?.name].join('|');

  const save = useCallback(() => {
    setPresets((cur) => {
      const key = lookKey(look);
      if (cur.some((p) => lookKey(p.look) === key)) return cur; // already saved
      const next = [...cur, { name: look.palette.name, key, look, at: Date.now() }].slice(-60);
      savePresets(next);
      return next;
    });
  }, [look]);

  const isSaved = presets.some((p) => lookKey(p.look) === lookKey(look));

  const setModePersist = useCallback((m) => {
    setMode(m);
    try { localStorage.setItem(MODE_KEY, m); } catch { /* ignore */ }
  }, []);

  /** A component blew up at runtime — drop it and roll a replacement for that slot. */
  const onSlotFail = useCallback((slug) => {
    setLook((cur) => {
      const role = Object.keys(POOLS).find((r) => cur[r] === slug);
      if (!role) return cur;
      const alt = POOLS[role].filter((s) => s !== slug && !quarantined().has(s));
      return { ...cur, [role]: alt.length ? alt[Math.floor(Math.random() * alt.length)] : null };
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

      // Keyed off e.code, not e.key, so shift+1 still reads as "Digit1"
      // (shift+1 is "!") and going backwards through a knob works.
      const byCode = {
        Digit1: () => cycle('background', e.shiftKey),
        Digit2: () => cycle('cursor', e.shiftKey),
        Digit3: () => cycle('titleFx', e.shiftKey),
        Digit4: () => cycle('cta', e.shiftKey),
        Digit5: rollPaletteOnly,
        KeyP: rollBgPaletteOnly,
        Digit6: cycleDensity,
        Digit7: save,
        Digit8: () => setModePersist(mode === 'favs' ? 'random' : 'favs'),
        Digit0: reroll,
        Space: reroll,
        ArrowLeft: () => (mode === 'favs' ? stepFav(-1) : back()),
        ArrowRight: () => (mode === 'favs' ? stepFav(1) : forward()),
      };
      const fn = byCode[e.code] ?? byCode[`Digit${e.key}`];
      if (fn) { e.preventDefault(); fn(); return; }
      if (e.key === '?') { e.preventDefault(); setBarOpen((v) => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reroll, cycle, rollPaletteOnly, rollBgPaletteOnly, cycleDensity, save, mode, setModePersist, back, forward, stepFav]);

  const value = useMemo(() => ({
    look, reroll, cycle, setKnob, rollPaletteOnly, rollBgPaletteOnly, cycleDensity, cycleTheme, save, presets, isSaved,
    back, forward, stepFav, canBack: past.length > 0, canForward: future.length > 0, favIndex,
    mode, setMode: setModePersist, onSlotFail, barOpen, setBarOpen,
    permalink: () => permalink(look), stats: poolStats(),
  }), [look, reroll, cycle, setKnob, rollPaletteOnly, rollBgPaletteOnly, cycleDensity, cycleTheme, save, presets, isSaved,
       back, forward, stepFav, past.length, future.length, favIndex, mode,
       setModePersist, onSlotFail, barOpen]);

  return <DiceCtx.Provider value={value}>{children}</DiceCtx.Provider>;
}

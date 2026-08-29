/* The look controls.
 *
 * One row of knobs. Each knob is [‹ | name  n/total ▾ | ›] — the arrows step,
 * and the middle opens a dropdown of every option so you can jump straight to
 * one instead of clicking through 83 backdrops.
 *
 * The group on the right navigates whole looks:
 *   random — ‹ back through looks you have already seen, 🎲 roll, › forward
 *            (or roll, if you are at the end of the history)
 *   favs   — ‹ / › walk your saved looks in order. No dice there on purpose:
 *            "random from a short list" is just the next one with extra steps.
 */
import { useEffect, useRef, useState } from 'react';
import { useDice } from './DiceProvider';
import { POOLS, CTA_TREATMENTS } from '../../lib/dice';
import './control-bar.css';

const KNOBS = [
  { key: '1', role: 'background', label: 'backdrop' },
  { key: '2', role: 'cursor', label: 'cursor' },
  { key: '3', role: 'titleFx', label: 'wordmark' },
  { key: '4', role: 'cta', label: 'button' },
];

const pretty = (slug) => (slug ? String(slug).replace(/-/g, ' ') : 'none');
const listFor = (role) => (role === 'cta' ? CTA_TREATMENTS : POOLS[role] ?? []);

/** A knob: prev arrow, dropdown trigger, next arrow. */
function Knob({ hotkey, label, role, value, onStep, onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);
  const list = listFor(role);
  const index = list.indexOf(value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // open onto the current selection rather than the top of a 83-item list
  useEffect(() => {
    if (open) listRef.current?.querySelector('[data-on="1"]')?.scrollIntoView({ block: 'center' });
  }, [open]);

  return (
    <div className={`p4d-group${open ? ' is-open' : ''}`} ref={ref}>
      <button type="button" className="p4d-step" onClick={() => onStep(-1)} aria-label={`previous ${label}`}>‹</button>

      <button
        type="button"
        className="p4d-knob"
        onClick={() => setOpen((v) => !v)}
        title={`${label} — ${hotkey} for next, shift+${hotkey} for previous`}
        aria-expanded={open}
      >
        <kbd>{hotkey}</kbd>
        <span className="p4d-label">{label}</span>
        <span className="p4d-value">{pretty(value)}</span>
        {list.length > 0 && (
          <span className="p4d-pos">{index < 0 ? '–' : index + 1}<i>/</i>{list.length}</span>
        )}
        <span className="p4d-caret" aria-hidden="true">▾</span>
      </button>

      <button type="button" className="p4d-step" onClick={() => onStep(1)} aria-label={`next ${label}`}>›</button>

      {open && (
        <div className="p4d-menu" role="listbox" ref={listRef}>
          {list.length === 0 && <div className="p4d-menu-empty">nothing available</div>}
          {list.map((opt, i) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              data-on={opt === value ? '1' : '0'}
              className={`p4d-menu-item${opt === value ? ' is-on' : ''}`}
              onClick={() => { onPick(role, opt); setOpen(false); }}
            >
              <span className="p4d-menu-dot" aria-hidden="true" />
              <span className="p4d-menu-name">{pretty(opt)}</span>
              <span className="p4d-menu-num">{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A palette chip — nothing to step through, so it just rerolls. */
function PaletteChip({ hotkey, label, palette, onRoll, title }) {
  return (
    <button type="button" className="p4d-knob p4d-knob--solo" onClick={onRoll} title={title}>
      <kbd>{hotkey}</kbd>
      <span className="p4d-label">{label}</span>
      <span className="p4d-value">{palette.mood}</span>
      <span className="p4d-swatches" aria-hidden="true">
        {palette.trio.map((c) => <i key={c} style={{ background: c }} />)}
      </span>
    </button>
  );
}

export default function ControlBar() {
  const d = useDice();
  if (!d) return null;
  const {
    look, cycle, setKnob, reroll, rollPaletteOnly, rollBgPaletteOnly, cycleDensity,
    save, presets, isSaved, mode, setMode, back, forward, stepFav, canBack, favIndex,
  } = d;

  const inFavs = mode === 'favs' && presets.length > 0;

  return (
    <div className="p4d-bar-wrap">
      <div className="p4d-bar">
        {KNOBS.map((k) => (
          <Knob
            key={k.key}
            hotkey={k.key}
            label={k.label}
            role={k.role}
            value={look[k.role]}
            onStep={(dir) => cycle(k.role, dir < 0)}
            onPick={setKnob}
          />
        ))}

        <PaletteChip
          hotkey="5" label="page" palette={look.palette} onRoll={rollPaletteOnly}
          title="reroll the PAGE palette — text, cards, accents. Always contrast-checked."
        />
        <PaletteChip
          hotkey="p" label="bg" palette={look.bgPalette ?? look.palette} onRoll={rollBgPaletteOnly}
          title="reroll ONLY the backdrop's colours — the page palette stays put"
        />

        <button
          type="button"
          className="p4d-knob p4d-knob--solo"
          onClick={cycleDensity}
          title="how busy the page is — animation speed now, GPU budget on the next roll"
        >
          <kbd>6</kbd>
          <span className="p4d-label">density</span>
          <span className="p4d-value">{look.density}</span>
        </button>

        <span className="p4d-sep" aria-hidden="true" />

        <button
          type="button"
          className={`p4d-btn${isSaved ? ' is-saved' : ''}`}
          onClick={save}
          disabled={isSaved}
          title={isSaved ? 'this exact look is already saved' : `save this look (${presets.length} saved)`}
        >
          <kbd>7</kbd>
          {isSaved ? 'saved' : 'save'}
          {presets.length > 0 && <span className="p4d-count">{presets.length}</span>}
        </button>

        <span className="p4d-seg">
          {['favs', 'random'].map((m) => (
            <button
              key={m}
              type="button"
              disabled={m === 'favs' && presets.length === 0}
              onClick={() => setMode(m)}
              className={mode === m ? 'on' : ''}
              title={m === 'favs'
                ? (presets.length ? `walk your ${presets.length} saved looks` : 'save a look first (7)')
                : 'roll anything in the vault'}
            >
              {m}
            </button>
          ))}
        </span>

        {/* whole-look navigation */}
        <span className="p4d-nav">
          <button
            type="button"
            className="p4d-step p4d-step--lg"
            onClick={() => (inFavs ? stepFav(-1) : back())}
            disabled={!inFavs && !canBack}
            title={inFavs ? 'previous saved look (←)' : 'back to the previous look (←)'}
            aria-label="previous look"
          >‹</button>

          {inFavs ? (
            <span className="p4d-favpos" title={`saved look ${favIndex + 1} of ${presets.length}`}>
              {favIndex + 1}<i>/</i>{presets.length}
            </span>
          ) : (
            <button
              type="button"
              className="p4d-dice"
              onClick={reroll}
              title="roll a whole new look (0 or space)"
              aria-label="reroll"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </button>
          )}

          <button
            type="button"
            className="p4d-step p4d-step--lg"
            onClick={() => (inFavs ? stepFav(1) : forward())}
            title={inFavs ? 'next saved look (→)' : 'forward, or roll a new one (→)'}
            aria-label="next look"
          >›</button>
        </span>
      </div>
    </div>
  );
}

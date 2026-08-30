/* The look controls, as one panel in the top-right nav.
 *
 * Replaces the old colour-theme picker, which had stopped doing anything: it
 * set --accent on <html>, but .dark-theme now maps --accent to the rolled
 * palette, so the body-level rule won.
 *
 * One row per category: [key] LABEL  ‹ value n/total ›. The arrows step; the
 * value opens that category's full list, so you can jump straight to a
 * component instead of clicking through 75 backdrops. Underneath, the
 * whole-look controls — save, favs/random, and back / dice / forward.
 */
import { useEffect, useRef, useState } from 'react';
import { useDice } from './DiceProvider';
import { listForRole } from '../../lib/dice';
import './dice-menu.css';

const ROWS = [
  { key: '1', role: 'background', label: 'backdrop' },
  { key: '2', role: 'cursor', label: 'cursor' },
  { key: '3', role: 'titleFx', label: 'title' },
  { key: '4', role: 'cta', label: 'button' },
];

const pretty = (slug) => (slug ? String(slug).replace(/-/g, ' ') : 'none');

/** One category row with steppers, and an expandable list of every option. */
function Row({ hotkey, label, role, value, theme, onStep, onPick }) {
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  const list = listForRole(role, theme);
  const index = list.indexOf(value);

  useEffect(() => {
    if (open) listRef.current?.querySelector('[data-on="1"]')?.scrollIntoView({ block: 'center' });
  }, [open]);

  return (
    <div className={`p4m-row${open ? ' is-open' : ''}`}>
      <div className="p4m-line">
        <kbd className="p4m-key">{hotkey}</kbd>
        <span className="p4m-label">{label}</span>

        <button type="button" className="p4m-arrow p4m-arrow--prev" onClick={() => onStep(-1)} aria-label={`previous ${label}`}>‹</button>

        <button
          type="button"
          className="p4m-value"
          onClick={() => setOpen((v) => !v)}
          title={`${pretty(value)} — click for the full list`}
          aria-expanded={open}
        >
          <span className="p4m-name">{pretty(value)}</span>
          {list.length > 0 && <span className="p4m-num">{index < 0 ? '–' : index + 1}/{list.length}</span>}
        </button>

        <button type="button" className="p4m-arrow p4m-arrow--next" onClick={() => onStep(1)} aria-label={`next ${label}`}>›</button>
      </div>

      {open && (
        <div className="p4m-list" role="listbox" ref={listRef}>
          {list.length === 0 && <div className="p4m-empty">nothing available</div>}
          {list.map((opt, i) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              data-on={opt === value ? '1' : '0'}
              className={`p4m-item${opt === value ? ' is-on' : ''}`}
              onClick={() => { onPick(role, opt); setOpen(false); }}
            >
              <span className="p4m-dot" aria-hidden="true" />
              <span className="p4m-item-name">{pretty(opt)}</span>
              <span className="p4m-item-num">{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A palette row — nothing to step through, so both arrows just reroll it. */
function PaletteRow({ hotkey, label, palette, onRoll }) {
  return (
    <div className="p4m-row">
      <div className="p4m-line">
        <kbd className="p4m-key">{hotkey}</kbd>
        <span className="p4m-label">{label}</span>
        <button type="button" className="p4m-arrow p4m-arrow--prev" onClick={onRoll} aria-label={`reroll ${label}`}>‹</button>
        <button type="button" className="p4m-value" onClick={onRoll} title={`reroll the ${label} palette`}>
          <span className="p4m-name">{palette.mood}</span>
          <span className="p4m-swatches" aria-hidden="true">
            {palette.trio.map((c) => <i key={c} style={{ background: c }} />)}
          </span>
        </button>
        <button type="button" className="p4m-arrow p4m-arrow--next" onClick={onRoll} aria-label={`reroll ${label}`}>›</button>
      </div>
    </div>
  );
}

export default function DiceMenu() {
  const d = useDice();
  if (!d) return null;
  const {
    look, cycle, setKnob, reroll, rollPaletteOnly, rollBgPaletteOnly, cycleDensity, cycleTheme,
    save, presets, isSaved, mode, setMode, back, forward, stepFav, canBack, favIndex,
  } = d;

  const inFavs = mode === 'favs' && presets.length > 0;

  return (
    <div className="p4m">
      <div className="p4m-row">
        <div className="p4m-line">
          <kbd className="p4m-key">t</kbd>
          <span className="p4m-label">theme</span>
          <button type="button" className="p4m-arrow p4m-arrow--prev" onClick={cycleTheme} aria-label="previous theme">‹</button>
          <button type="button" className="p4m-value" onClick={cycleTheme}
            title="a family locks every knob to one aesthetic — no mixing">
            <span className="p4m-name">{look.theme ?? 'freestyle'}</span>
          </button>
          <button type="button" className="p4m-arrow p4m-arrow--next" onClick={cycleTheme} aria-label="next theme">›</button>
        </div>
      </div>

      {ROWS.map((r) => (
        <Row
          key={r.key}
          hotkey={r.key}
          label={r.label}
          role={r.role}
          value={look[r.role]}
          theme={look.theme}
          onStep={(dir) => cycle(r.role, dir < 0)}
          onPick={setKnob}
        />
      ))}

      <PaletteRow hotkey="5" label="page" palette={look.palette} onRoll={rollPaletteOnly} />
      <PaletteRow hotkey="p" label="backdrop" palette={look.bgPalette ?? look.palette} onRoll={rollBgPaletteOnly} />

      <div className="p4m-row">
        <div className="p4m-line">
          <kbd className="p4m-key">6</kbd>
          <span className="p4m-label">density</span>
          <button type="button" className="p4m-arrow p4m-arrow--prev" onClick={cycleDensity} aria-label="previous density">‹</button>
          <button type="button" className="p4m-value" onClick={cycleDensity} title="animation speed, and the GPU budget for the next roll">
            <span className="p4m-name">{look.density}</span>
          </button>
          <button type="button" className="p4m-arrow p4m-arrow--next" onClick={cycleDensity} aria-label="next density">›</button>
        </div>
      </div>

      <div className="p4m-foot">
        <button
          type="button"
          className={`p4m-save${isSaved ? ' is-saved' : ''}`}
          onClick={save}
          disabled={isSaved}
          title={isSaved ? 'this exact look is already saved' : 'save this look'}
        >
          <kbd className="p4m-key">7</kbd>
          {isSaved ? 'saved' : 'save'}
          {presets.length > 0 && <span className="p4m-count">{presets.length}</span>}
        </button>

        <span className="p4m-seg">
          {['favs', 'random'].map((m) => (
            <button
              key={m}
              type="button"
              disabled={m === 'favs' && presets.length === 0}
              onClick={() => setMode(m)}
              className={mode === m ? 'on' : ''}
              title={m === 'favs'
                ? (presets.length ? `walk your ${presets.length} saved looks` : 'save a look first')
                : 'roll anything in the vault'}
            >
              {m}
            </button>
          ))}
        </span>
      </div>

      <div className="p4m-nav">
        <button
          type="button"
          className="p4m-navbtn"
          onClick={() => (inFavs ? stepFav(-1) : back())}
          disabled={!inFavs && !canBack}
          title={inFavs ? 'previous saved look (←)' : 'back to the previous look (←)'}
        >‹</button>

        {inFavs ? (
          <span className="p4m-favpos">{favIndex + 1}/{presets.length}</span>
        ) : (
          <button type="button" className="p4m-dice" onClick={reroll} title="roll a whole new look (0 or space)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            <span>roll</span>
          </button>
        )}

        <button
          type="button"
          className="p4m-navbtn"
          onClick={() => (inFavs ? stepFav(1) : forward())}
          title={inFavs ? 'next saved look (→)' : 'forward, or roll a new one (→)'}
        >›</button>
      </div>
    </div>
  );
}

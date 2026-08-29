/* The "Lakota Fox" wordmark, rendered through whatever text effect got rolled.
 *
 * The plain <h1> is always in the DOM and always the accessible/SEO text — the
 * rolled effect is layered as decoration on top and hidden from screen readers.
 * That way a text component that mangles or drops its input can never cost the
 * portfolio its own name, which is the one string on the page that has to be
 * right no matter what the dice does.
 */
import { useEffect, useRef, useState } from 'react';
import { useDice, entryFor } from './DiceProvider';
import WORDMARK_PROPS from '../../lib/wordmark-props.json';
import P4rtsSlot from './P4rtsSlot';
import './dice-wordmark.css';

/* Effects that draw their own pixels (canvas/WebGL/SVG) do NOT inherit the
 * h1's font-size — they ship a `clamp()` default and render at whatever size
 * that yields, which here meant a wordmark several times too big, clipped by
 * its own box and colliding with the subtitle. So the measured pixel size of
 * the real <h1> is passed down under every name these components use for it. */
/* Every text effect declares its own vocabulary, and passing the wrong shape
 * fails in three distinct ways — all of which were live bugs:
 *
 *   TEXT   blur-relay wants `sentence`, departure-board an array `words`. Send
 *          the wrong name and it renders its DEMO DEFAULT ("True Focus"). Send
 *          BOTH `words` and `text` and it renders the wordmark twice, letter by
 *          letter ("L L a a k k o o t t a a").
 *   SIZE   extruded-type declares `fontSize: 'clamp(3rem, 12vw, 7rem)'` — a CSS
 *          STRING. Handing it the measured pixel number made it invalid, so the
 *          wordmark collapsed small and off to the side. departure-board wants
 *          the same prop as a NUMBER. The declared default tells us which.
 *   COLOUR each names its own (faceColor/depthColor, tileColor/textColor …), so
 *          nothing followed the palette until they were passed by name.
 *
 * wordmark-props.json is generated from the vault's own prop metadata. */
function effectProps(slug, text, size, palette) {
  const meta = WORDMARK_PROPS[slug];
  if (!meta) return { children: text };
  const out = {};

  for (const n of meta.text ?? []) out[n] = n === 'words' ? [text] : text;
  /* Only fall back to children when the component declares no text prop.
   * departure-board takes `words` AND renders children, so sending both drew
   * the wordmark twice — "L L a a k k o o t t a a F F o o x x". */
  if (!(meta.text ?? []).length) out.children = text;

  if (meta.size) out[meta.size.name] = meta.size.css ? `${Math.round(size)}px` : Math.round(size);

  // background-ish colour props take the ground; the rest walk the palette
  const ramp = [palette.ink, palette.acc, palette.b, palette.a];
  let i = 0;
  for (const n of meta.colors ?? []) {
    out[n] = /^(tile|background|bg|back)/i.test(n) ? palette.bgAlt : ramp[i++ % ramp.length];
  }
  return out;
}

/* departure-board sets its first phrase INSTANTLY on mount and only animates
 * between phrases (DepartureBoard.jsx:113, first transition after cycleDelay,
 * min 400ms) — flips are computed per differing character, so identical
 * entries flip nothing. To get both an entrance AND an idle animation it is
 * driven in two phases:
 *   enter — mounts on a BLANK board and flips into the name ~400ms later
 *   idle  — remounted (key change) cycling name <-> NAME every few seconds;
 *           the remount re-renders the name it is already showing, so the
 *           swap is invisible.
 */
function useBoardPhase(fx) {
  const [phase, setPhase] = useState('enter');
  useEffect(() => {
    if (fx !== 'departure-board') return undefined;
    setPhase('enter');
    const t = setTimeout(() => setPhase('idle'), 3400);
    return () => clearTimeout(t);
  }, [fx]);
  return phase;
}

function boardProps(phase, text) {
  return phase === 'enter'
    ? { words: ['', text], cycleDelay: 400, loop: false }
    : { words: [text, text.toUpperCase()], cycleDelay: 3200, loop: true };
}

function useTypeSize(ref) {
  const [size, setSize] = useState(64);
  useEffect(() => {
    if (!ref.current) return;
    const read = () => {
      const cs = getComputedStyle(ref.current);
      const px = parseFloat(cs.fontSize);
      if (px) setSize(px);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export default function DiceWordmark({ text, className = '', as: Tag = 'h1' }) {
  const d = useDice();
  const fx = d?.look?.titleFx;
  const h1Ref = useRef(null);
  const size = useTypeSize(h1Ref);
  const boardPhase = useBoardPhase(fx);

  if (!fx) return <Tag className={className}>{text}</Tag>;
  const hasFx = Boolean(entryFor(fx));
  if (!hasFx) return <Tag className={className}>{text}</Tag>;

  // The typography class goes on the WRAPPER, not the <h1>, so the effect
  // overlay inherits the same font-size/weight/tracking and lands exactly on
  // top of the real title. With it on the <h1>, the effect rendered at body
  // size and read as a second, smaller wordmark floating above the first.
  return (
    <div className={`p4d-wordmark has-fx ${className}`}>
      {/* Real, readable, indexable — kept in the DOM always, but painted
       * transparent while an effect is up. Most text effects re-render the
       * wordmark themselves, so leaving this visible showed "Lakota Fox"
       * twice. Screen readers and crawlers still get it. */}
      <Tag ref={h1Ref} className="p4d-wordmark-text">{text}</Tag>

      {/* decorative overlay — same box, aria-hidden */}
      <div className="p4d-wordmark-fx" data-fx={fx} aria-hidden="true">
        <P4rtsSlot
          key={fx === 'departure-board' ? `${fx}:${boardPhase}` : fx}
          slug={fx}
          entry={entryFor(fx)}
          onFail={d.onSlotFail}
          props={{
            ...effectProps(fx, text, size, d.look.palette),
            ...(fx === 'departure-board' ? boardProps(boardPhase, text) : null),
            speed: d.look.motion,
          }}
        />
      </div>
    </div>
  );
}

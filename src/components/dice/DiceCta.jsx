/* The rolled call-to-action button.
 *
 * Modelled directly on EDI's HeroCta: six treatments, each a DIFFERENT
 * vendored PUDDL3 P4RTS component wrapping the same press target — not one
 * pill with six paint jobs. Every one is imported and configured explicitly,
 * because these components have real APIs and mounting them with a generic
 * prop blob does not work. (That was the "button 4" bug: the dice was rolling
 * the deep-tier `cta-1`…`cta-14` PAGE SECTIONS, which are whole marketing
 * blocks, not buttons.)
 *
 * The <button> inside is identical across all six, so the press target and
 * label never move.
 */
import { lazy, Suspense, useEffect, useRef } from 'react';
import './dice-cta.css';

const RimlightButton = lazy(() => import('../puddl3/rimlight-button/RimlightButton'));
const TwinkleFrame = lazy(() => import('../puddl3/twinkle-frame/TwinkleFrame'));
const VoltageFrame = lazy(() => import('../puddl3/voltage-frame/VoltageFrame'));
const GlossGlide = lazy(() => import('../puddl3/gloss-glide/GlossGlide'));
const TapBurst = lazy(() => import('../puddl3/tap-burst/TapBurst'));
const HaloEdge = lazy(() => import('../puddl3/halo-edge/HaloEdge'));
const BeaconTile = lazy(() => import('../puddl3/beacon-tile/BeaconTile'));

const rgb = (hex) => {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex, a) => `rgba(${rgb(hex).join(', ')}, ${a})`;

const GLOSS_SWEEP = 700;

/* GlossGlide only catches the light on hover. It should also do it on its own,
 * at uneven gaps so it never settles into a predictable loop. React derives
 * onMouseEnter/Leave from delegated mouseover/mouseout, so dispatching those
 * drives the component through its own API instead of reaching in and
 * rewriting styles it owns — a real hover still starts another sweep. */
function useIdleGlare(hostRef, sweepMs) {
  useEffect(() => {
    let next;
    let end;
    const send = (type) => {
      const el = hostRef.current?.firstElementChild;
      if (!el) return;
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, relatedTarget: document.body }));
    };
    const fire = () => {
      if (!document.hidden) {
        send('mouseover');
        end = window.setTimeout(() => send('mouseout'), sweepMs);
      }
      next = window.setTimeout(fire, 4000 + Math.random() * 7000);
    };
    next = window.setTimeout(fire, 1600 + Math.random() * 2500);
    return () => { window.clearTimeout(next); window.clearTimeout(end); };
  }, [hostRef, sweepMs]);
}

/** the press target every treatment shares */
function Press({ label, href, color, className = 'p4d-press' }) {
  return (
    <a href={href} className={className} style={{ color }}>
      {label}
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

export const CTA_TREATMENTS = ['rimlight', 'twinkle', 'voltage', 'gloss', 'spark', 'halo', 'win95'];

export default function DiceCta({ fx = 'rimlight', label = 'See the work', href = '#work', palette }) {
  const glossRef = useRef(null);
  useIdleGlare(glossRef, GLOSS_SWEEP);

  const pal = palette ?? { acc: '#a855f7', a: '#5227FF', b: '#FF9FFC', trio: ['#a855f7', '#5227FF', '#FF9FFC'] };
  const ink = 'var(--p4-ink, #fff)';

  const node = (() => {
    switch (fx) {
      case 'win95':
        // the family button: a real 3D-bevel push button, straight off the
        // desktop. Pure CSS (dice-cta.css) — no vault component needed.
        return (
          <a href={href} className="p4d-press p4d-press--win95">
            {label}
          </a>
        );

      case 'twinkle':
        // the frame IS the button; its own inner shell does the padding
        return (
          <TwinkleFrame as="span" color={pal.acc} speed="4s" thickness={2}>
            <Press label={label} href={href} color={ink} />
          </TwinkleFrame>
        );

      case 'voltage':
        return (
          <VoltageFrame color={pal.acc} borderRadius={999} speed={1.1} chaos={0.14}>
            <Press label={label} href={href} color={ink} />
          </VoltageFrame>
        );

      case 'gloss':
        return (
          <span ref={glossRef} className="p4d-cta-inline">
            <GlossGlide
              width="fit-content"
              height="fit-content"
              borderRadius="999px"
              background={rgba(pal.acc, 0.1)}
              borderColor={rgba(pal.acc, 0.45)}
              glareColor={pal.b}
              glareOpacity={0.4}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={GLOSS_SWEEP}
            >
              <Press label={label} href={href} color={pal.acc} />
            </GlossGlide>
          </span>
        );

      case 'spark':
        return (
          <span className="p4d-cta-rel">
            <TapBurst sparkColor={pal.acc} sparkCount={10} sparkRadius={26} sparkSize={11} duration={420}>
              <BeaconTile spotlightColor={rgba(pal.acc, 0.3)} className="p4d-cta-beacon">
                <Press label={label} href={href} color={ink} />
              </BeaconTile>
            </TapBurst>
          </span>
        );

      case 'halo':
        return (
          <HaloEdge
            borderRadius={999}
            glowColor={rgb(pal.acc).join(' ')}
            backgroundColor="var(--p4-bg, #0b0b10)"
            colors={pal.trio}
            glowRadius={38}
            glowIntensity={1.2}
            animated
          >
            <Press label={label} href={href} color={ink} />
          </HaloEdge>
        );

      default:
        return (
          <RimlightButton
            size="md"
            radius={999}
            textColor={ink}
            lineColor={pal.acc}
            baseColor={pal.a}
            tint={pal.acc}
            tintOpacity={0.1}
          >
            <Press label={label} href={href} color={ink} />
          </RimlightButton>
        );
    }
  })();

  return (
    <div className="p4d-cta">
      <Suspense fallback={<Press label={label} href={href} color={pal.acc} />}>{node}</Suspense>
    </div>
  );
}

/* The cursor registry — a port of EDI's Cursor.tsx, which is the debugged
 * version of everything this file does. Every odd-looking prop below is a
 * documented failure mode from that file; the comments travel with the fix.
 *
 * Layering here differs from EDI on purpose: Lakota chose backdrop → effect →
 * content for the ambient cursors, so those ride at z-1 UNDER the page. Only
 * the thin precise pointers (a reticle, a dot-ring) sit above the content —
 * they mark a point instead of flooding an area, so they never obscure a word.
 */
import { lazy, Suspense, useEffect, useRef } from 'react';

const L = (f) => lazy(f);

const Reticle = L(() => import('../puddl3/reticle/Reticle'));
const GlidePointer = L(() => import('../puddl3/glide-pointer/glide-pointer'));
const GooPointer = L(() => import('../puddl3/goo-pointer/GooPointer'));
const LockOnPointer = L(() => import('../puddl3/lock-on-pointer/LockOnPointer'));
const GlyphTrail = L(() => import('../puddl3/glyph-trail/glyph-trail'));
const GrainTrail = L(() => import('../puddl3/grain-trail/grain-trail'));
const MorphPointer = L(() => import('../puddl3/morph-pointer/morph-pointer'));
const TaggedPointer = L(() => import('../puddl3/tagged-pointer/tagged-pointer'));
const PhantomPointer = L(() => import('../puddl3/phantom-pointer/PhantomPointer'));
const FlockPointer = L(() => import('../puddl3/flock-pointer/FlockPointer'));
const PointerCells = L(() => import('../puddl3/pointer-cells/PointerCells'));
const RipplePointer = L(() => import('../puddl3/ripple-pointer/RipplePointer'));
const PointerRipple = L(() => import('../puddl3/pointer-ripple/pointer-ripple'));
const SquareWake = L(() => import('../puddl3/square-wake/SquareWake'));
const PhotoWake = L(() => import('../puddl3/photo-wake/PhotoWake'));

/** effects that already mark the exact pointer position — no helper dot needed */
const PRECISE = new Set(['reticle', 'lock-on-pointer', 'morph-pointer', 'tagged-pointer']);

/** Thin, transparent pointers — tiny marks, not area effects. These sit ABOVE
 *  the content (a reticle under the text would be invisible), and they don't
 *  screen-blend because they paint no ground of their own. */
const OVERLAY = new Set(['reticle', 'lock-on-pointer', 'goo-pointer', 'glide-pointer', 'morph-pointer', 'tagged-pointer']);

/** Exactly two of these aren't pointers drawn ON a scene — they ARE the scene.
 *  phantom lights its own dark ground, photo-wake ripples photographs. Stacked
 *  over a backdrop they fight it for the same pixels and read as dead, so the
 *  backdrop is skipped while they're up (DiceStage checks this set). */
export const OWNS_BACKDROP = new Set(['phantom-pointer', 'photo-wake']);

/* r3f and prop-based components read the pointer from events delivered TO
 * THEIR CANVAS. The cursor layer is pointer-events:none so clicks reach the
 * app, which means those canvases never hear a thing and freeze on one frame.
 * dispatchEvent skips hit-testing, so the pointer is handed to them directly
 * without the layer swallowing a single click.
 *
 * The copies must bubble (React and r3f bind listeners on ancestors), which
 * means each copy also reaches this listener on window — the guard is what
 * stops it recursing until the stack blows.  Both pointermove AND mousemove
 * are sent: goo-pointer listens via React onMouseMove and a PointerEvent
 * alone leaves it parked in the corner. The fluid sim (#fluid) is excluded:
 * it derives motion from the delta between consecutive events, and a
 * duplicate at identical coordinates zeroes that delta — it never splats
 * again. It already listens on window. */
function PointerBridge() {
  useEffect(() => {
    let bridging = false;
    const forwardAt = (clientX, clientY, alsoDown = false) => {
      if (bridging) return;
      const layer = document.querySelector('.p4d-cursor');
      if (!layer) return;
      bridging = true;
      try {
        /* canvases for WebGL/r3f effects — plus each mounted effect's root
         * element, because goo-pointer draws DOM blobs and listens via React
         * onMouseMove on its own div: no canvas, so a canvas-only bridge left
         * it parked at 0,0. Dispatching at the root bubbles through React's
         * delegation to whichever descendant holds the handler. */
        const targets = new Set(layer.querySelectorAll('canvas:not(#fluid)'));
        for (let el = layer.firstElementChild; el; el = el.firstElementChild) targets.add(el);
        for (const target of targets) {
          const init = {
            clientX, clientY, screenX: clientX, screenY: clientY,
            bubbles: true, cancelable: true,
            pointerId: 1, pointerType: 'mouse', isPrimary: true,
          };
          target.dispatchEvent(new PointerEvent('pointermove', init));
          target.dispatchEvent(new MouseEvent('mousemove', init));
          if (alsoDown) target.dispatchEvent(new PointerEvent('pointerdown', init));
        }
      } finally {
        bridging = false;
      }
    };
    const forward = (e) => forwardAt(e.clientX, e.clientY);

    /* TOUCH: there is no hover on a phone, so a cursor effect would just sit
     * dead. A tap plays a short spiral of synthetic moves out from the finger
     * (~350ms) — trail effects get motion to draw, splat effects get a down —
     * so every cursor "works" on tap without any per-effect code. */
    let rafId = 0;
    const tapBurst = (e) => {
      if (e.pointerType && e.pointerType !== 'touch') return;
      const x = e.clientX, y = e.clientY;
      forwardAt(x, y, true);
      let i = 0;
      cancelAnimationFrame(rafId);
      const spin = () => {
        i += 1;
        if (i > 14) return;
        const a = i * 0.85;
        const r = 4 + i * 4.5;
        forwardAt(x + Math.cos(a) * r, y + Math.sin(a) * r);
        rafId = requestAnimationFrame(spin);
      };
      rafId = requestAnimationFrame(spin);
    };

    window.addEventListener('pointermove', forward, { passive: true });
    window.addEventListener('pointerdown', tapBurst, { passive: true });
    return () => {
      window.removeEventListener('pointermove', forward);
      window.removeEventListener('pointerdown', tapBurst);
      cancelAnimationFrame(rafId);
    };
  }, []);
  return null;
}

/** a 1-frame-accurate dot at the true pointer, so clicking stays precise even
 *  when the themed effect trails behind — this is why the system cursor can be
 *  hidden without leaving the visitor clicking blind */
function PrecisePoint({ color }) {
  const ref = useRef(null);
  useEffect(() => {
    const move = (e) => {
      const el = ref.current;
      if (el) el.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 10001,
        width: 6, height: 6, borderRadius: '50%',
        pointerEvents: 'none',
        background: color, boxShadow: '0 0 0 1px rgba(0,0,0,.55)',
      }}
    />
  );
}

/** PhotoWake renders one tile per `items` entry and defaults to [] — mounted
 *  bare it runs the whole pipeline over an empty list and draws nothing. Fed
 *  the project shots, it doubles as a teaser. Module constant on purpose: the
 *  component's effect deps include `items` and it has no cleanup, so a fresh
 *  array per render would leak a rAF loop every re-render. */
const PHOTO_WAKE_ITEMS = [
  '/project-images/gifsmith.png',
  '/project-images/lennyhouse.png',
  '/project-images/bird-id.png',
  '/project-images/lidar.png',
  '/project-images/myart.png',
  '/project-images/carc.png',
  '/project-images/backlog.png',
  '/project-images/adventurecrafter.png',
];

/** pinned identity — the fluid sim keeps BACK_COLOR in its effect deps with no
 *  cleanup; a fresh literal each render stacks another rAF loop + listeners */
const FLUID_BACK_COLOR = { r: 0, g: 0, b: 0 };

const REGISTRY = {
  reticle: (p) => <Reticle color={p.c} />,
  'glide-pointer': (p) => <GlidePointer color={p.acc} blur={2} trailOpacity={0.5} />,
  'goo-pointer': (p) => (
    <GooPointer
      fillColor={p.acc}
      innerColor={p.b}
      trailCount={3}
      sizes={[20, 32, 24]}
      innerSizes={[7, 11, 8]}
      opacities={[0.9, 0.75, 0.8]}
      fastDuration={0.35}
      slowDuration={1.5}
      filterStdDeviation={5}
    />
  ),
  'lock-on-pointer': (p) => (
    <LockOnPointer
      targetSelector="a, button, .p4m-value, .tile-stream__tile"
      cursorColor={p.c}
      cursorColorOnTarget={p.acc}
      hideDefaultCursor
    />
  ),
  'glyph-trail': (p) => <GlyphTrail color={p.acc} size={38} />,
  'grain-trail': (p) => <GrainTrail color={p.acc} />,
  // Stock springs are far too soft for a POINTER: chained through two of them
  // the ring trailed ~286px behind the hand — and morph is PRECISE, so no
  // helper dot covers for it. Stiffen both so the dot actually marks the spot.
  'morph-pointer': (p) => (
    <MorphPointer
      circleColor={p.acc}
      dotColor={p.b}
      circleSize={38}
      dotSize={7}
      circleBorderWidth={2}
      circleStiffness={900}
      circleDamping={42}
      dotStiffness={2200}
      dotDamping={60}
    />
  ),
  // stock defaults are fullScreen:false + trigger:"hover" — it only tracks
  // pointers that ENTER its own box, which never happens on a
  // pointer-events:none layer. And it ships someone else's name on the label.
  'tagged-pointer': (p) => (
    <TaggedPointer fullScreen trigger="always" name="FOX" color={p.acc} textColor="#12101a" size={30} />
  ),
  'phantom-pointer': (p) => (
    // The wrapper is load-bearing. PhantomPointer force-writes
    // `parent.style.position = "relative"` when the parent has no INLINE
    // position; our layer is positioned by a CLASS, so without this wrapper the
    // inline write wins, the layer collapses to 0 height, the canvas measures
    // 0×0 and the render loop bails forever. Inline style, not a class.
    <div style={{ position: 'absolute', inset: 0 }}>
      <PhantomPointer
        color={p.acc}
        trailLength={8}
        brightness={0.55}
        bloomStrength={0.12}
        bloomRadius={0.8}
        grainIntensity={0.05}
        maxDevicePixelRatio={1.5}
        inertia={0.3}
        fadeDelayMs={200}
        fadeDurationMs={500}
      />
    </div>
  ),
  'flock-pointer': (p) => <FlockPointer color={p.acc} count={14} />,
  'pointer-cells': (p) => <PointerCells color={p.acc} />,
  // A fluid sim. Naming a COLOR themes it instead of random rainbow; stock
  // DENSITY_DISSIPATION of 3.5 wipes the dye in about a second. NB: it has no
  // `color` prop — lazy() makes wrong prop names silently do nothing.
  'ripple-pointer': (p) => (
    <RipplePointer
      RAINBOW_MODE={false}
      COLOR={p.acc}
      BACK_COLOR={FLUID_BACK_COLOR}
      DENSITY_DISSIPATION={1.6}
      VELOCITY_DISSIPATION={1.4}
      SPLAT_RADIUS={0.28}
      SPLAT_FORCE={6500}
      CURL={8}
    />
  ),
  'pointer-ripple': (p) => <PointerRipple backgroundColor="transparent" colors={[p.acc]} opacity={0.7} />,
  'square-wake': (p) => (
    // r3f reads the pointer off its own container, which never hears anything
    // on this layer. eventSource moves the listeners to the page root;
    // eventPrefix:"client" is required with it — offsetX is meaningless once
    // the source isn't the canvas.
    <SquareWake
      color={p.acc}
      gridSize={70}
      trailSize={0.03}
      maxAge={380}
      interpolate={2}
      canvasProps={{ eventSource: document.documentElement, eventPrefix: 'client' }}
    />
  ),
  // variant 1 of 8 — the one that demonstrably paints on a fresh load.
  'photo-wake': () => <PhotoWake items={PHOTO_WAKE_ITEMS} variant={1} />,
};

export const CURSOR_KEYS = Object.keys(REGISTRY);

export default function DiceCursor({ choice, palette }) {
  const render = REGISTRY[choice];

  // EDI's trick, requested here too: hide the system arrow, and PrecisePoint
  // puts an exact dot at the true pointer for anything that trails.
  const touchOnly = typeof matchMedia === 'function' && !matchMedia('(hover: hover)').matches;

  useEffect(() => {
    if (!render || touchOnly) return undefined; // no system cursor to hide on touch
    document.documentElement.classList.add('cursor-none');
    return () => document.documentElement.classList.remove('cursor-none');
  }, [render, touchOnly]);

  if (!render) return null;

  const onTop = OVERLAY.has(choice);
  const owns = OWNS_BACKDROP.has(choice);

  return (
    <Suspense fallback={null}>
      <div
        aria-hidden="true"
        className="p4d-cursor"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          // ambient effects live UNDER the content (Lakota's layering);
          // precise pointers ride above it; scene-owners sit at the very back
          zIndex: owns ? 0 : onTop ? 10000 : 1,
          // full-canvas effects paint a black ground — `screen` makes black
          // invisible so only the bright trail survives. The thin pointers and
          // the scene-owners paint their own ground and must stay plain.
          mixBlendMode: onTop || owns ? undefined : 'screen',
        }}
        data-p4rts={choice}
      >
        {render(palette)}
      </div>
      <PointerBridge />
      {!touchOnly && !PRECISE.has(choice) && <PrecisePoint color={palette.acc} />}
    </Suspense>
  );
}

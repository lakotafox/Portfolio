/* Mounts one rolled PUDDL3 P4RTS component, and refuses to let it break the page.
 *
 * Everything in the pool was verified headlessly before it could be rolled, but
 * a real browser is not a headless one — a driver quirk, a lost WebGL context,
 * or a slow chunk can still take a component down. So each slot:
 *
 *   1. lazy-loads its component (only the rolled chunk is ever fetched)
 *   2. catches any render/import error in a boundary
 *   3. QUARANTINES the offender — it is written to localStorage and excluded
 *      from every future roll on this device, so the same dud never returns
 *   4. renders nothing on failure, so the portfolio just looks plain, never broken
 */
import { Component, Suspense, lazy, useMemo } from 'react';
import P4RTS_PROPS from '../../lib/p4rts-props.json';

const MODULES = import.meta.glob('../puddl3/**/*.{jsx,tsx}');
const REGISTRY = import.meta.glob('../../lib/p4rts-registry.json', { eager: true });

const QUARANTINE_KEY = 'p4rts-quarantine';

export function quarantined() {
  try {
    return new Set(JSON.parse(localStorage.getItem(QUARANTINE_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function quarantine(slug, reason) {
  try {
    const s = quarantined();
    if (s.has(slug)) return;
    s.add(slug);
    localStorage.setItem(QUARANTINE_KEY, JSON.stringify([...s]));
    // eslint-disable-next-line no-console
    console.warn(`[p4rts] quarantined "${slug}" — ${reason}. It will not be rolled again.`);
  } catch {
    /* private mode: just don't quarantine */
  }
}

export function clearQuarantine() {
  try { localStorage.removeItem(QUARANTINE_KEY); } catch { /* ignore */ }
}

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    quarantine(this.props.slug, err?.message ?? String(err));
    this.props.onFail?.(this.props.slug);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * @param {string} slug     which component to mount
 * @param {object} props    forwarded to the component (palette, speed, …)
 * @param {string} entry    registry entry path, e.g. "aura-sphere/AuraSphere.jsx"
 */
/* Roughly half the vault's backgrounds are `composition: wraps-children` —
 * built to wrap a section rather than stand alone. Mounted empty they size
 * themselves to nothing and paint nothing, which reads as a broken component.
 * Giving them a full-size spacer to wrap makes them render exactly as intended
 * without putting real page content inside someone else's DOM. */
const needsChildren = (slug) => P4RTS_PROPS[slug]?.composition === 'wraps-children';

export default function P4rtsSlot({ slug, entry, props = {}, onFail, className = '' }) {
  const Cmp = useMemo(() => {
    if (!slug || !entry) return null;
    const loader = MODULES[`../puddl3/${entry}`];
    if (!loader) {
      quarantine(slug, 'not vendored');
      return null;
    }
    return lazy(async () => {
      const mod = await loader();
      const C = mod.default ?? Object.values(mod).find((v) => typeof v === 'function');
      if (!C) throw new Error('no component export');
      return { default: C };
    });
  }, [slug, entry]);

  if (!Cmp) return null;

  return (
    <Boundary slug={slug} onFail={onFail}>
      <Suspense fallback={null}>
        <div className={`p4rts-slot ${className}`} data-p4rts={slug}>
          {/* The spacer exists so a `wraps-children` component mounted as a
            * standalone backdrop has something to wrap. But JSX children
            * OVERRIDE a `children` prop — so injecting it blindly replaced the
            * wordmark text on every children-based text effect (they rendered
            * empty, or "[object Object]"). Only supply it when the caller
            * hasn't already given the component something to wrap. */}
          {needsChildren(slug) && props.children === undefined
            ? <Cmp {...props}><span className="p4rts-spacer" /></Cmp>
            : <Cmp {...props} />}
        </div>
      </Suspense>
    </Boundary>
  );
}

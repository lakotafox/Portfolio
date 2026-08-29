/* PUDDL3 P4RTS Lab — mounts exactly one vault component at a time.
 *
 * This is the verification harness. Playwright drives it across every
 * component in the vault (?c=<key>), and it reports what actually happened
 * on `window.__P4RTS` so nothing enters the dice pool unproven:
 *
 *   status  "ok" | "error" | "loading"
 *   error   the thrown message, if it failed to import or render
 *
 * It doubles as the interactive triage UI later.
 */
import { StrictMode, Suspense, lazy, Component } from 'react';
import { createRoot } from 'react-dom/client';
import registry from '../lib/p4rts-registry.json';
import '../styles/p4rts.css';
import './lab.css';

// Every vendored P4RTS component, lazily importable by its registry `entry`.
const MODULES = import.meta.glob('../components/puddl3/**/*.{jsx,tsx}');
const REG = registry;
const BY_SLUG = new Map(REG.map((r) => [r.slug, r]));
const KEYS = REG.map((r) => r.slug).sort();

const loaderFor = (entry) => MODULES[`../components/puddl3/${entry}`];

/* The lab must mount components the SAME way the dice does, or verification
 * lies: a component rendered with no props may paint nothing and look broken
 * when it would have been fine in production. This mirrors DiceStage's bundle
 * plus the generic content props the text/card components expect. */
const LAB_PROPS = {
  color: '#a855f7',
  colors: ['#a855f7', '#5227FF', '#FF9FFC'],
  baseColor: '#0b0b0b',
  speed: 1,
  amplitude: 1,
  text: 'Lakota Fox',
  children: 'Lakota Fox',
  title: 'Lakota Fox',
  label: 'Lakota Fox',
  items: ['One', 'Two', 'Three'],
  images: [],
};

const report = (status, error) => {
  window.__P4RTS = { status, error: error ? String(error).slice(0, 500) : null };
};
report('loading');

class Boundary extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err) {
    report('error', err?.message ?? err);
  }
  render() {
    if (this.state.err) {
      return <pre className="lab-err">render threw:{'\n'}{String(this.state.err?.message ?? this.state.err)}</pre>;
    }
    return this.props.children;
  }
}

/** A component is "ok" once it has mounted and painted without throwing. */
function Ready() {
  queueMicrotask(() => {
    if (window.__P4RTS?.status !== 'error') report('ok');
  });
  return null;
}

function Index() {
  return (
    <div className="lab-index">
      <h1>PUDDL3 P4RTS — Lab</h1>
      <p>{KEYS.length} components vendored. Append <code>?c=&lt;key&gt;</code>.</p>
      <ul>
        {KEYS.map((k) => (
          <li key={k}><a href={`?c=${encodeURIComponent(k)}`}>{k}</a></li>
        ))}
      </ul>
    </div>
  );
}

const params = new URLSearchParams(window.location.search);
const key = params.get('c');
const bare = params.has('bare'); // no chrome — just the component, for screenshots

let view;
if (!key) {
  report('ok');
  view = <Index />;
} else {
  const meta = BY_SLUG.get(key);
  const loader = meta && loaderFor(meta.entry);

  if (!loader) {
    report('error', `no such component: ${key}`);
    view = <pre className="lab-err">no such component: {key}</pre>;
  } else {
    const Lazy = lazy(async () => {
      try {
        const mod = await loader();
        const Cmp = mod.default ?? Object.values(mod).find((v) => typeof v === 'function');
        if (!Cmp) throw new Error('module has no component export');
        return { default: Cmp };
      } catch (e) {
        report('error', e?.message ?? e);
        throw e;
      }
    });
    view = (
      <Boundary>
        <Suspense fallback={<div className="lab-loading">loading…</div>}>
          {/* sized parent — many vault components measure their container */}
          <div className="p4rts-slot lab-stage">
            <Lazy {...LAB_PROPS} />
          </div>
          <Ready />
        </Suspense>
      </Boundary>
    );
  }
}

createRoot(document.getElementById('lab-root')).render(
  bare ? view : <StrictMode>{view}</StrictMode>,
);

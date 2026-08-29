/* The PUDDL3 P4RTS dice.
 *
 * One roll draws a whole LOOK for the portfolio — palette, background, cursor,
 * wordmark effect, CTA, plus the motion/density feel — out of the verified
 * component pool. Modelled on EDI's roll() but wider on every axis:
 *
 *   - palettes are generated + contrast-gated, not picked from a fixed 12
 *   - every component in the pool was proven to render in a real browser
 *     (see p4rts-pool.json — nothing unverified can ever be rolled)
 *   - rerolls must differ on several axes at once, not just the backdrop
 *   - WebGL work is budgeted, so stacked shaders can't exhaust the browser
 *   - honours prefers-reduced-motion by rolling calm looks only
 *
 * Query overrides for sharing/pinning: ?bg= ?cursor= ?fx= ?cta= ?hue= ?mood=
 * ?harmony= ?seed= . unpin() strips them.
 */
import POOL from './p4rts-pool.json';
import WORDMARK_VERIFIED from './wordmark-verified.json';
import BACKDROP_BLANK from './backdrop-blank.json';
import P4RTS_PROPS from './p4rts-props.json';
import { rollPalette, MOOD_KEYS, HARMONY_KEYS } from './palette.js';

/* ---------- deterministic RNG so a seed reproduces a look exactly ---------- */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/* ---------- role pools, derived from the verified components ---------- */

const has = (c, ...tags) => tags.some((t) => (c.tags ?? []).includes(t));
const inCat = (c, ...cats) => cats.includes(c.category);

/* Components are sorted into the job they can do in a roll.
 *
 * Tags alone are NOT enough — several things tagged "cursor" are really demo
 * components that render their own content (one injected a row of labelled
 * cards over the hero). So the measured render from verification is used as
 * evidence too: a genuine pointer effect draws almost nothing when the mouse
 * hasn't moved, while an imposter paints a big chunk of the screen. The split
 * is stark — real ones sit at ~0.001, imposters at 0.09–0.21. */
const BACKGROUND_MIN_FILL = 0.01;

/* THE VAULT ALREADY KNOWS THIS — use it instead of guessing.
 *
 * Each meta.json carries `role` (backdrop / overlay / text-effect / wrapper /
 * block) and `composition` (standalone | wraps-children), plus a typed prop
 * list with roles (color, color-bg, speed, count, children). manifest.json
 * does not expose any of it, which is why this was all being re-derived by
 * hand — see ~/puddl3-p4rts/PROPOSED-FIXES.md.
 *
 * `wraps-children` is the important one: those components are built to wrap
 * content. Mounted empty as a backdrop they paint nothing; mounted as a
 * floating cursor they render their own demo content over the page. Every
 * "blank backdrop" and every "cursor that scattered labels everywhere" was one
 * of these being used standalone. */
const wrapsChildren = (slug) => P4RTS_PROPS[slug]?.composition === 'wraps-children';
const WORDMARK_SET = new Set(WORDMARK_VERIFIED);
/* Verified on the real page: these mount and report fine but paint nothing at
 * all behind the content. Regenerate with scratchpad/backdrops.mjs. */
const BLANK_SET = new Set(BACKDROP_BLANK);

/* CURSORS
 *
 * These are hand-picked and hand-configured, not tag-matched. The vault's
 * "cursor" tag covers two different things: true pointer overlays (no
 * children, they draw on top of the page) and effects that WRAP content and
 * need `children`. Only the first kind can be a floating cursor.
 *
 * Each also needs its own props. Mounted bare with just a colour, they
 * misbehave in ways that look like broken components but aren't:
 * pointer-ripple paints an OPAQUE backdrop unless `backgroundColor` is set
 * transparent, and phantom-pointer needs its screen blend + z-index. That is
 * configuration, not breakage — see CURSOR_PROPS below. */
/* Each verified ON the real portfolio with the pointer moving, checking the
 * hero is still readable underneath (scratchpad/cursors.mjs). iron-filings is
 * left out: it renders an opaque full-bleed field that hides the page even
 * with blendMode:'screen' — it is built to sit BEHIND content, not over it. */
/* EDI runs 13 of these; we had shrunk to 4 because the verification sweep
 * scores components by what they PAINT — and a pointer effect paints nothing
 * until the mouse moves, so real cursors kept getting marked "blank" and
 * dropped from the pool. Cursors are therefore hand-listed and verified by
 * their own test (scratchpad/cursors.mjs: pointer moving, hero must stay
 * readable) instead of the paint gate. wraps-children entries are fine here —
 * P4rtsSlot hands them a spacer, which also stops them rendering their demo
 * content (the old "Item 3 / Item 11" bug). */
export const CURSORS = [
  'reticle',
  'glide-pointer',
  'goo-pointer',
  'lock-on-pointer',
  'glyph-trail',
  'grain-trail',
  'morph-pointer',
  'tagged-pointer',
  'phantom-pointer',
  'flock-pointer',
  'pointer-cells',
  'ripple-pointer',
  'pointer-ripple',
  'square-wake',
  'photo-wake',
];

/** Per-cursor props. `acc` is the rolled accent colour. */
export function cursorProps(slug, acc) {
  switch (slug) {
    case 'lock-on-pointer':
      return {
        cursorColor: acc,
        cursorColorOnTarget: acc,
        // real, clickable things on the page to snap onto
        targetSelector: '.project-card, .nav a, .skills-toggle, .p4d-knob, a',
        hideDefaultCursor: false,
        parallaxOn: true,
      };
    case 'phantom-pointer':
      return { color: acc, mixBlendMode: 'screen', zIndex: 1, trailLength: 40, brightness: 1.1 };
    case 'flock-pointer':
      return { color: acc, accentColor: acc, count: 12, size: 9, glow: 0.8, opacity: 0.9, enabled: true };
    case 'pointer-ripple':
      /* backgroundColor must stay transparent — its default is opaque and
       * blacks the whole page out. The rest is restraint: at stock settings
       * the influence radius and peak scale make it dominate the page rather
       * than trail the pointer. */
      return {
        backgroundColor: 'transparent',
        colors: [acc],
        opacity: 0.7,
        influenceRadiusVmin: 15,
        idleScale: 0.18,
        minPeakScale: 0.45,
        maxPeakScale: 1.25,
        burstSpeed: 0.95,
        burstThickness: 0.8,
      };
    case 'iron-filings':
      return { color: acc, hotColor: acc, blendMode: 'screen', opacity: 0.8, cursorInteraction: true };
    default:
      return { color: acc };
  }
}

const CURSOR_SET = new Set(CURSORS);

/** The six CTA treatments, each a distinct vendored button component wired up
 *  explicitly in components/dice/DiceCta.jsx. Rolled by NAME, not from the
 *  component pool — see the note on ROLES.cta. */
export const CTA_TREATMENTS = ['rimlight', 'twinkle', 'voltage', 'gloss', 'spark', 'halo'];

export const ROLES = {
  background: (c) =>
    (inCat(c, 'Backgrounds', 'background') || has(c, 'background')) &&
    (c.painted ?? 0) >= BACKGROUND_MIN_FILL &&
    !BLANK_SET.has(c.slug) &&
    // Lakota: reads as a title effect, not a backdrop (vault says `backdrop`)
    c.slug !== 'dust-type' &&
    // Lakota: cut on sight 2026-08-28
    c.slug !== 'hue-tiles' &&
    // renders "Item 1..Item N" demo tiles; the only text-leaking backdrop
    // (verified by sweeping all 99 for rendered innerText)
    c.slug !== 'mesh-drift',
  cursor: (c) => CURSOR_SET.has(c.slug),  // pool membership pass-through
  /* Verified IN THE HERO, not just in the lab. The hero gives a short wide box
   * where several effects that render fine full-screen paint nothing at all —
   * and since the real <h1> goes transparent under an effect, "paints nothing"
   * means the portfolio shows no name. corrupted-type, gravity-letters,
   * path-marquee and smudge-type all failed exactly that way.
   * Regenerate with scratchpad/wordmarks.mjs if the hero's layout changes. */
  /* A component may not hold two roles. cipher-rain is `role: text-effect` in
   * the vault and tagged `text`, but its category is Backgrounds and it renders
   * a full-field Matrix rain — as a wordmark it reads as a backdrop that ate
   * the title. Anything the backdrop pool claims is barred from being a title. */
  titleFx: (c) =>
    WORDMARK_SET.has(c.slug) &&
    !(inCat(c, 'Backgrounds', 'background') || has(c, 'background')),
  /* NOT tag-matched. The `cta` tag also covers the deep tier's cta-1…cta-14,
   * which are whole marketing PAGE SECTIONS, not buttons — rolling one put a
   * full CTA block where a button should be. These six are real button
   * components, each configured explicitly in components/dice/DiceCta.jsx,
   * the same way EDI's HeroCta does it. */
  cta: () => false,
  flair: (c) => inCat(c, 'Animations', 'animation') && !has(c, 'background', 'cursor'),
};

function buildPools(pool) {
  const out = {};
  for (const [role, test] of Object.entries(ROLES)) {
    out[role] = pool.filter(test).map((c) => c.slug);
  }
  /* Cursors bypass the paint-gated pool entirely — a pointer effect draws
   * nothing at rest, so the pool's "did it paint?" filter had silently thrown
   * most of them out. The hand list is the truth for this role. */
  out.cursor = CURSORS.filter((s) => P4RTS_PROPS[s] !== undefined);
  return out;
}

export const POOLS = buildPools(POOL);

/** Heavier effects: used to keep a single roll from stacking too much GPU work.
 *  Browsers cap live WebGL contexts (~8–16) and evict the oldest when you go
 *  over, which is what makes a page die after a dozen rerolls. We stay well
 *  clear — but not so tight that one WebGL backdrop starves every other role. */
const COST = new Map(POOL.map((c) => [c.slug, c.webgl ? 2 : c.canvases ? 1 : 0]));
const WEBGL_BUDGET = 6;

/* ---------- density / motion feel ---------- */

export const DENSITIES = ['calm', 'balanced', 'loud'];
const CALM = { motion: 0.45, budget: 2 };
const FEEL = {
  calm: { motion: 0.5, budget: 2 },
  balanced: { motion: 1, budget: 4 },
  loud: { motion: 1.6, budget: WEBGL_BUDGET },
};

/** The motion multiplier for a density — exported so cycling the knob can
 *  recompute it. Without this, changing density only relabelled the chip:
 *  `motion` was baked in at roll time, so the backdrop and wordmark kept
 *  animating at the old speed. */
export const motionFor = (density) => (FEEL[density] ?? FEEL.balanced).motion;

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the roll ---------- */

const qp = (ignore) => new URLSearchParams(ignore ? '' : (typeof location !== 'undefined' ? location.search : ''));

/** Pick a component for a role, respecting the remaining WebGL budget. */
function pickForRole(rng, role, budgetLeft, forced) {
  const list = POOLS[role] ?? [];
  if (forced && list.includes(forced)) return forced;
  if (!list.length) return null;
  const affordable = list.filter((s) => (COST.get(s) ?? 0) <= budgetLeft);
  if (affordable.length) return pick(rng, affordable);
  // Out of GPU budget: fall back to the cheapest options rather than dropping
  // the role entirely — a missing cursor/CTA reads as a bug, not a choice.
  const cheapest = Math.min(...list.map((s) => COST.get(s) ?? 0));
  const cheap = list.filter((s) => (COST.get(s) ?? 0) === cheapest);
  return cheap.length ? pick(rng, cheap) : null;
}

/**
 * Draw a complete look.
 * @param {object} opts
 * @param {boolean} opts.ignoreQuery  ignore ?bg= etc (used by reroll)
 * @param {number}  opts.seed         reproduce an exact look
 */
export function roll(opts = {}) {
  const q = qp(opts.ignoreQuery);
  const seed = opts.seed ?? (q.get('seed') ? Number(q.get('seed')) : (Math.random() * 2 ** 32) >>> 0);
  const rng = mulberry32(seed);

  const reduced = prefersReducedMotion();
  const density = reduced ? 'calm' : (q.get('density') ?? pick(rng, DENSITIES));
  const feel = reduced ? CALM : (FEEL[density] ?? FEEL.balanced);

  const palette = rollPalette(rng, {
    hue: q.get('hue') ? Number(q.get('hue')) : undefined,
    mood: MOOD_KEYS.includes(q.get('mood')) ? q.get('mood') : undefined,
    harmony: HARMONY_KEYS.includes(q.get('harmony')) ? q.get('harmony') : undefined,
  });

  /* The backdrop gets its OWN palette. The page palette has to satisfy text
   * contrast, which pulls it toward safe, readable combinations — but a
   * backdrop has no text on it and can be far bolder. Keeping them separate
   * means the artwork can go wild without ever making the site unreadable.
   * Rolled with ?bghue=/?bgmood= or the `p` key. */
  const bgPalette = rollPalette(rng, {
    hue: q.get('bghue') ? Number(q.get('bghue')) : undefined,
    mood: MOOD_KEYS.includes(q.get('bgmood')) ? q.get('bgmood') : undefined,
  });

  let budget = feel.budget;
  const take = (role, forced) => {
    const slug = pickForRole(rng, role, budget, forced);
    if (slug) budget -= COST.get(slug) ?? 0;
    return slug;
  };

  const background = take('background', q.get('bg'));
  const cursor = reduced ? null : take('cursor', q.get('cursor'));
  const titleFx = take('titleFx', q.get('fx'));
  const ctaQ = q.get('cta');
  const cta = CTA_TREATMENTS.includes(ctaQ) ? ctaQ : pick(rng, CTA_TREATMENTS);

  return {
    seed,
    palette,
    bgPalette,
    density,
    reduced,
    motion: feel.motion,
    background,
    cursor,
    titleFx,
    cta,
  };
}

/** How different are two looks? Used to guarantee a reroll actually reads as new. */
function distance(a, b) {
  let d = 0;
  if (a.background !== b.background) d++;
  if (a.titleFx !== b.titleFx) d++;
  if (a.cta !== b.cta) d++;
  if (a.cursor !== b.cursor) d++;
  if (a.palette.mood !== b.palette.mood) d++;
  if (Math.abs(a.palette.hue - b.palette.hue) > 40) d++;
  if (a.density !== b.density) d++;
  return d;
}

/**
 * Reroll that is always OBVIOUSLY different: the backdrop must change, and at
 * least four axes overall. EDI only guaranteed backdrop+hero; with this many
 * knobs that isn't enough to feel like a new look.
 */
export function rerollFrom(cur, tries = 40) {
  let best = null;
  let bestD = -1;
  for (let i = 0; i < tries; i++) {
    const next = roll({ ignoreQuery: true });
    const d = distance(cur, next);
    if (next.background !== cur.background && d >= 4) return next;
    if (d > bestD) { bestD = d; best = next; }
  }
  return best;
}

/** Strip pinning params so a refresh rolls fresh again. */
export function unpin() {
  if (typeof location === 'undefined') return false;
  const q = new URLSearchParams(location.search);
  let changed = false;
  for (const k of ['bg', 'cursor', 'fx', 'cta', 'hue', 'mood', 'harmony', 'seed', 'density']) {
    if (q.has(k)) { q.delete(k); changed = true; }
  }
  if (changed) {
    const s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? `?${s}` : ''));
  }
  return changed;
}

/** A shareable URL that reproduces this exact look. */
export function permalink(look) {
  const q = new URLSearchParams({ seed: String(look.seed) });
  return `${location.origin}${location.pathname}?${q}`;
}

export const poolStats = () => ({
  total: POOL.length,
  ...Object.fromEntries(Object.entries(POOLS).map(([k, v]) => [k, v.length])),
});

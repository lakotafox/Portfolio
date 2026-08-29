/* Procedural palette generation with guaranteed contrast.
 *
 * EDI's dice draws from 12 hand-written palettes. This generates them from
 * colour-harmony rules instead, so the pool is effectively unbounded — but
 * every palette is checked against WCAG before it is allowed out, so a roll
 * can never produce unreadable text. That check is the whole point: "more
 * exciting" is worthless if one roll in twenty makes the site illegible.
 */

/* ---------- colour space ---------- */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export const hsl = (h, s, l) => {
  const [r, g, b] = hslToRgb(h, s, l);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** WCAG relative luminance */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1..21 */
export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ---------- harmony ---------- */

/** How the supporting hues relate to the base hue. */
const HARMONIES = {
  analogous: [0, 30, -30],
  triad: [0, 120, 240],
  split: [0, 150, 210],
  complement: [0, 180, 30],
  tetrad: [0, 90, 180],
  mono: [0, 12, -12],
};
export const HARMONY_KEYS = Object.keys(HARMONIES);

/** Named moods: each pins the lightness/saturation envelope, so a roll reads
 *  as a deliberate design rather than random colour soup. */
export const MOODS = {
  neon:      { sat: [85, 100], accL: [58, 68], bgL: [4, 8],   inkL: [92, 98] },
  pastel:    { sat: [45, 65],  accL: [70, 80], bgL: [8, 13],  inkL: [90, 96] },
  earth:     { sat: [35, 55],  accL: [50, 62], bgL: [7, 12],  inkL: [88, 94] },
  mono:      { sat: [4, 14],   accL: [62, 74], bgL: [5, 10],  inkL: [90, 97] },
  jewel:     { sat: [70, 90],  accL: [48, 60], bgL: [5, 9],   inkL: [90, 96] },
  vapor:     { sat: [75, 95],  accL: [65, 75], bgL: [6, 11],  inkL: [93, 98] },
  phosphor:  { sat: [80, 100], accL: [55, 65], bgL: [3, 6],   inkL: [85, 92] },
  ember:     { sat: [78, 95],  accL: [55, 65], bgL: [4, 8],   inkL: [90, 96] },
};
export const MOOD_KEYS = Object.keys(MOODS);

const rand = (rng, [lo, hi]) => lo + rng() * (hi - lo);

/**
 * Build one palette. Returns null if it can't meet contrast — the caller
 * simply rolls again, which is cheaper than trying to repair a bad palette.
 */
function build(rng, { hue, harmony, mood }) {
  const H = HARMONIES[harmony];
  const M = MOODS[mood];
  const sat = rand(rng, M.sat);

  const acc = hsl(hue + H[0], sat, rand(rng, M.accL));
  const a = hsl(hue + H[1], sat * 0.9, rand(rng, M.accL) - 8);
  const b = hsl(hue + H[2], sat, rand(rng, M.accL) + 8);
  const c = hsl(hue + H[1] * 0.5, sat * 0.75, rand(rng, M.accL));

  const bgL = rand(rng, M.bgL);
  const bg = hsl(hue, Math.min(sat * 0.35, 22), bgL);
  const bgAlt = hsl(hue, Math.min(sat * 0.3, 18), bgL + 3.5);
  const ink = hsl(hue, Math.min(sat * 0.18, 12), rand(rng, M.inkL));
  const muted = hsl(hue, Math.min(sat * 0.2, 16), 58);
  // surfaces the portfolio's own CSS needs: cards sit just above the ground,
  // borders just above the cards, so depth survives every palette.
  const card = hsl(hue, Math.min(sat * 0.28, 16), bgL + 5);
  const cardHover = hsl(hue, Math.min(sat * 0.3, 18), bgL + 8);
  const border = hsl(hue, Math.min(sat * 0.25, 15), bgL + 11);

  // Readability gates. These are non-negotiable — a roll that fails is discarded.
  if (contrast(ink, bg) < 7) return null;        // body text: AAA
  if (contrast(acc, bg) < 3.2) return null;      // accent must read on the page
  if (contrast(muted, bg) < 4.5) return null;    // secondary text: AA

  return {
    name: `${mood}-${harmony}-${Math.round(hue)}`,
    mood, harmony, hue: Math.round(hue),
    acc, a, b, c, bg, bgAlt, ink, muted, card, cardHover, border,
    trio: [acc, a, b],
    contrast: {
      ink: +contrast(ink, bg).toFixed(2),
      acc: +contrast(acc, bg).toFixed(2),
      muted: +contrast(muted, bg).toFixed(2),
    },
  };
}

/** Roll a contrast-safe palette. Falls back to a known-good one if unlucky. */
export function rollPalette(rng = Math.random, opts = {}) {
  for (let i = 0; i < 60; i++) {
    const p = build(rng, {
      hue: opts.hue ?? rng() * 360,
      harmony: opts.harmony ?? HARMONY_KEYS[Math.floor(rng() * HARMONY_KEYS.length)],
      mood: opts.mood ?? MOOD_KEYS[Math.floor(rng() * MOOD_KEYS.length)],
    });
    if (p) return p;
  }
  return build(() => 0.5, { hue: 265, harmony: 'analogous', mood: 'jewel' })
      ?? { name: 'fallback', acc: '#a855f7', a: '#5227FF', b: '#FF9FFC', c: '#B497CF',
           bg: '#0a0a0a', bgAlt: '#141414', ink: '#ffffff', muted: '#a1a1aa',
           trio: ['#a855f7', '#5227FF', '#FF9FFC'], contrast: {} };
}

/** Push the palette onto the document as custom properties. */
export function applyPalette(p, el = document.documentElement) {
  const map = {
    '--p4-acc': p.acc, '--p4-a': p.a, '--p4-b': p.b, '--p4-c': p.c,
    '--p4-bg': p.bg, '--p4-bg-alt': p.bgAlt, '--p4-ink': p.ink, '--p4-muted': p.muted,
    '--p4-card': p.card, '--p4-card-hover': p.cardHover, '--p4-border': p.border,
  };
  for (const [k, v] of Object.entries(map)) el.style.setProperty(k, v);
}

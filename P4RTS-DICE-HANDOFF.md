# PUDDL3 P4RTS Dice — build notes

Goal: the portfolio rolls a whole *look* on load / on demand (theme × background ×
cursor × palette × hero × text-FX × CTA), drawn from the PUDDL3 P4RTS vault —
like EDI's dice at `~/claude/src/lib/theme.ts`, but much wider and with more flare.

## Status

- [x] **Foundation** — deps, Tailwind v4 without Preflight, `.tsx` support, `@` alias
- [x] **Lab harness** — `p4rts-lab.html` + `src/lab/main.jsx`, driven by Playwright
- [x] **Vendor** — 825 of 839 into `src/components/puddl3/<slug>/` (+ `src/lib/p4rts-registry.json`)
- [x] **Palette engine** — `src/lib/palette.js`, generated + WCAG-gated
- [x] **Dice engine** — `src/lib/dice.js`
- [x] **Runtime guards** — `src/components/dice/P4rtsSlot.jsx`
- [x] **Control bar** — `src/components/dice/ControlBar.jsx`
- [ ] **Verify** every component headlessly → `p4rts-pool.json` (sweep running)
- [ ] **Wire into the portfolio** + prove no regression
- [ ] **Ship**

## Files

| Path | What |
|---|---|
| `src/lib/palette.js` | procedural palettes, contrast-gated (0 failures in 4000 rolls) |
| `src/lib/dice.js` | `roll()` / `rerollFrom()` / `unpin()` / `permalink()` |
| `src/lib/p4rts-registry.json` | every vendored component + entry path + deps |
| `src/lib/p4rts-pool.json` | **verified** components only — the dice's whole world |
| `src/components/dice/P4rtsSlot.jsx` | lazy mount + error boundary + quarantine |
| `src/components/dice/DiceProvider.jsx` | look state, hotkeys, presets, favs/random |
| `src/components/dice/DiceStage.jsx` | backdrop + cursor layers |
| `src/components/dice/ControlBar.jsx` | clickable knob chips |
| `p4rts-lab.html` + `src/lab/` | one-component-at-a-time triage + the verifier |

## Why this is more than EDI's dice

- palettes are **generated** from harmony rules and gated at WCAG AAA for body
  text, so no roll can ever be unreadable — EDI picks from 12 hand-written ones
- the pool is **proven**: every component was mounted in a real browser and had
  its pixels measured, so "mounted but painted nothing" is caught too
- a component that fails at runtime is **quarantined to localStorage** and never
  rolled again on that device, and its slot re-rolls instead of going blank
- WebGL work is **budgeted** per roll, and backdrops are keyed so old contexts
  are torn down — leaking them is what kills a page after a dozen rerolls
- rerolls must differ on **four+ axes**, not just the backdrop
- `?seed=` reproduces any look exactly; `permalink()` shares it

## The vault splits into three tiers, not one

| Tier | Count | Format | Needs |
|---|---|---|---|
| `free` etc. | 164 | `.jsx` + plain `.css` | nothing |
| `starter` | 135 | `.tsx` + plain `.css` | `.tsx` (Vite handles it) |
| `deep` | 538 | `.tsx` + **Tailwind v4** | Tailwind utilities present |

## GOTCHAS — these are the things that "clashed" before. Do not undo them.

1. **Tailwind Preflight must stay OFF.** `src/styles/p4rts.css` imports only
   `tailwindcss/theme.css` + `tailwindcss/utilities.css`, never
   `preflight.css`. A plain `@import "tailwindcss"` pulls Preflight back in and
   its global reset flattens the 1200 lines of design in `App.css`.

2. **`App.css`'s universal reset had to move into `@layer base`.** Unlayered CSS
   beats layered CSS, so `* { margin:0; padding:0 }` was silently zeroing out
   *every* Tailwind padding/margin utility — deep components mounted with
   correct markup and no spacing at all, looking broken for no visible reason.
   Everything else in `App.css` stays unlayered and still wins.

3. **Scoped Preflight.** Vault components are authored *expecting* Preflight
   (list markers gone, headings unstyled, `img` block-level, buttons stripped).
   `p4rts.css` re-implements the rules that matter, scoped to `.p4rts-slot`, so
   they never touch portfolio markup. Extend it if a component needs another reset.

4. **Install the versions the vault asks for, not `latest`.** `bun add motion`
   pulled v13 → "Invalid hook call / mismatching versions of React" and every
   `motion` component died. The manifest says `motion ^12.23.12`. Same for
   `lucide-react ^0.542.0` and `three ^0.180.0`.

5. **`@react-three/fiber@9` wants React 19; the portfolio is on React 18.** Not
   upgrading React for ~40 components — let the harness exclude them instead.

6. **Skipped deliberately:** `@chakra-ui/react` + `react-router-dom` (need app-wide
   providers), `next-themes` (Next-only), `face-api.js` (needs model weights).

7. **The lab must not style the component under test.** `lab.css` scopes its
   monospace font to `.lab-index/.lab-err/.lab-loading`, never `body` — otherwise
   it inherits in and misrepresents how the component really looks.

## Regression guard

`scratchpad/shot.mjs` screenshots the portfolio full-page; compare against
`baseline.png`. The **only** legitimate diff is the Threads WebGL band
(y≈395–573) which repaints every frame. Anything else is a real regression.
Verified after every foundation change: identical outside that band.

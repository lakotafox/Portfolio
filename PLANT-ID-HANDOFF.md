# Plant Identifier — Session Handoff

> Context doc for any Claude session picking up this work (written 2026-07-16 by the
> cloud session that built it). Read this before touching `public/plant-id/`.

## What this is

A mobile-first plant-identification web app inside the Portfolio monorepo, plus a
featured card in the portfolio's Projects grid. User snaps/uploads **1–5 photos of one
plant** → Netlify serverless function forwards them to the **Pl@ntNet API** → app shows
a confidence-banded verdict (green ≥85% / amber 50–84% / red <50%) + ranked candidates
with GBIF/Wikipedia/iNaturalist links. Installable as a PWA.

**Live and working:** https://lakotafox.com/plant-id/ — key is set, identification
verified end-to-end against the real API.

## Where everything lives

| Piece | Path |
|---|---|
| Serverless proxy (holds API key) | `netlify/functions/identify.js` |
| Provider abstraction (add 2nd engine later) | `netlify/functions/providers/{index,plantnet}.js` |
| Frontend app (vanilla ES modules, NO build step) | `public/plant-id/` |
| App logic | `public/plant-id/js/{app,camera,downscale,api,render}.js` |
| WebGL background (PUDDL3 P4RTS "Strands" port) | `public/plant-id/js/strands.js` |
| Shiny buttons (PUDDL3 P4RTS "SpecularButton" port) | `public/plant-id/js/specular-button.js` |
| Bird chirp on Identify (Web Audio, no asset) | `public/plant-id/js/birdsong.js` |
| Vendored ogl bundle (esbuild'd from node_modules) | `public/plant-id/js/vendor/ogl.js` |
| Vine/grass border art (hand-drawn tileable SVGs) | `public/plant-id/img/{vine-side,grass-bottom}.svg` |
| PWA | `public/plant-id/{manifest.json,sw.js,icons/}` |
| Project card entry | `src/components/Projects.jsx` (id: `plant-id`) |
| Card image | `public/project-images/plant-id.png` |
| Netlify config (functions dir + redirects) | `netlify.toml` |

## Key facts / gotchas (learned the hard way)

1. **API key**: function reads `process.env.PLANTNET_API_KEY || process.env.Plant_key`.
   The user's Netlify dashboard variable is named **`Plant_key`**. Key must NEVER be
   committed or put in frontend code — repo is public. (The current key appeared in a
   chat transcript; recommend the user regenerates it at my.plantnet.org eventually.)
2. **Frontend calls `/.netlify/functions/identify` directly** — the cosmetic
   `/api/identify` redirect in netlify.toml proved flaky for POST (404s). Don't "fix"
   the frontend back to `/api/identify` without verifying POST works.
3. **CSS painting-order bug (fixed, don't reintroduce)**: the page background must live
   on `html` ONLY. If `body` also gets a background, it stops propagating to the page
   canvas and paints OVER the `z-index:-1` fixed background layers (strands + vines).
4. **Pl@ntNet API**: `POST https://my-api.plantnet.org/v2/identify/all?api-key=KEY`,
   multipart `images` (max **5**) + order-matched `organs`
   (`auto|leaf|flower|fruit|bark`). Non-plant → HTTP 404 → mapped to `NOT_A_PLANT`.
   Free tier 500/day; `remainingIdentificationRequests` surfaces in the quota chip.
5. **Function contract**: frontend POSTs JSON `{images:[{data:<base64 jpeg>,organ}],
   project,lang,noReject,nbResults}`; function rebuilds multipart with Node's global
   `FormData`/`Blob`/`fetch` (no npm deps). Never set Content-Type manually (breaks
   the multipart boundary).
6. **Client downscales to 1280px long edge** (never below 800) before upload; total
   base64 capped ~4MB (Netlify sync function limit is ~6MB).
7. **Service worker caches the shell** — bump `CACHE` version in `sw.js` on ANY
   frontend change. Currently `plant-id-v4`. Since v4, `app.js` listens for
   `controllerchange` and reloads once, so users pick up new deploys on their next
   visit automatically (guarded: no reload on first install, or while photos are
   staged / results are showing). Devices still on v2/v3 need one manual refresh to
   get v4; after that it's hands-off. The "blank background" reports were exactly
   this: the pre-fix CSS being served forever by the stale v2 cache.
8. **Deploys**: pushing `master` auto-deploys via Netlify (site = lakotafox.com,
   `npm run build` → `dist`, `public/` passes through). The feature branch
   `claude/plant-identifier-app-yvpxvh` is kept synced to master after each push.
9. `vite dev` can NOT run the function — use `netlify dev` (reads `.env`, gitignored;
   see `.env.example`).

## Design language (user-approved after iteration)

- NO emojis anywhere in the UI (user explicitly hates them).
- Animated green "Strands" WebGL beams behind everything, tuned subtle
  (see defaults in `strands.js` — don't crank intensity, center band blows out white).
- Glass/transparent cards (`--glass` ~0.42 alpha + backdrop blur) over the beams.
- Big pill-shaped specular-rim buttons (lime/emerald), Inter font, dark forest palette.
- Cartoon ivy vines fixed to left/right edges + grass/flowers strip along the bottom
  (small, `pointer-events:none`, tileable SVGs).
- Bird chirp (synthesized) plays on Identify tap.

## Verification playbook

- `npm run build` — must pass; confirm `dist/plant-id/` and card image pass through.
- `node --check` each `public/plant-id/js/*.js` and `netlify/functions/**/*.js`.
- Live function smoke test (uses 1 quota credit):
  `B64=$(base64 -w0 <leaf.jpg>); curl -s https://lakotafox.com/.netlify/functions/identify -H 'Content-Type: application/json' -d "{\"images\":[{\"data\":\"$B64\",\"organ\":\"leaf\"}]}"`
  → expect `ok:true` + `bestMatch`; a non-plant photo → `code:"NOT_A_PLANT"`.
- Full E2E: the cloud session drove the built app in headless Chromium with a mocked
  function (20 assertions: upload→downscale→POST→verdict/candidates/quota→reset, view
  visibility, no console errors). Those test scripts lived in the cloud scratchpad and
  do NOT travel with the repo — rewrite from this description if needed.

## Open items (what the user wants next)

1. ~~Replace the card image~~ DONE 2026-07-15: card now uses the real seedling photo
   (`public/project-images/plant-id.jpg`, "free photo" per source filename); the old
   placeholder `plant-id.png` was deleted and `Projects.jsx` updated.
2. Possibly swap the SVG vine borders for the user's own cartoon vine image — they
   downloaded `vecteezy_border-design-with-vine-and-butterflies-illustration_431475`
   (JPG/EPS + license PDF) to Downloads, but when asked said "idk what your asking",
   so it's parked. Explain in plain words and ask again before redoing.
3. User should regenerate the Pl@ntNet key at some point (chat exposure) — set the new
   value in Netlify (either var name works) and redeploy.
4. Untested nice-to-haves: real-device PWA install flow; multi-photo (2–5) real-world
   identification quality; `detailed`/genus results; regional flora (deferred by choice).

## Strands settings (user-tuned 2026-07-15, don't "fix" back to defaults)

The user dialed these in on the PUDDL3 P4RTS playground; they live as the defaults in
`strands.js` `initStrands`: count 6, speed **0.03** (they asked for slow motion —
playground had 0.1), amplitude 3, waviness 3, thickness 0.2, glow 1.5, taper 0.5,
spread 0, hueShift 0.78, intensity 0.15, saturation 2, opacity 1, scale 1.35 (kept
from before; the playground screenshot had no scale slider). Look = thin neon lines,
tall slow waves. Verified desktop + mobile emulation (390×844 dpr3), no console errors.

## User preferences (important)

- Ship straight to `master` (they okayed direct pushes; branch kept in sync).
- Don't undo/overwrite existing portfolio content — additive changes only.
- Plain non-jargon explanations; they'll ask "why" — answer straight, no fluff.
- Fun > corporate: they wanted the chirp, the vines, the beams. Keep it playful but
  never AI-slop generic. No emojis in UI.

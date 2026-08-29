# WEBSITEBUILDER-PLAN.md — lakotafox.com/websitebuilder

**Synthesis note:** Skeleton is Design 0 (highest score: content-ownership inversion, SPA route split, single renderer, persistence ladder). Grafted from Design 2: birth roll + lock-and-reroll slot machine, the verified neutral-* CSS-var palette bridge, REMIX/remixOf provenance, "roll me a name", capability-token framing. Grafted from Design 1: shared client/server schema module, pool-as-server-allowlist, magic edit link (fragment, not query), report dedup, category exclusions for phishing-shaped blocks. All judge-verified numbers replace Design 0's fictional catalog counts. Deep-block text editing (Design 2's patch engine, Design 1's slot codemod) is **cut** — both died on their fatal-flaw lists (480 stateful blocks clobber DOM patches; 527/662 blocks build content via `.map()` the codemod can't reach).

---

## Vision

A slot machine that pays out entire websites: land on `/websitebuilder`, a complete animated site materializes instantly, and every interaction is a variation of one verb — *roll* — while your words and pictures live in builder-owned DOM that no roll can ever touch. P4RTS components are the costume (title effects, backdrops, cursors, flair); publishing puts the result at `lakotafox.com/websitebuilder/<name>` with a REMIX die in the footer so strangers fork each other's rolls.

## Architecture

**Non-negotiable constraint:** the vendored blocks are only reachable through `P4rtsSlot.jsx`'s build-time `import.meta.glob` and need Tailwind v4 from the Vite build — so the editor AND the published-site renderer are lazy routes inside the existing SPA, never a `public/` folder. Published sites are schema JSON rendered by a trusted renderer; raw HTML is never stored or served.

**Routing** — a `location.pathname.startsWith('/websitebuilder')` switch in `src/main.jsx` renders `React.lazy(() => import('./builder/BuilderApp.jsx'))` instead of the portfolio (code-split; portfolio visitors pay 0 bytes). The existing `/* /index.html 200` catch-all already serves `/websitebuilder` and `/websitebuilder/<name>` — **zero `_redirects` changes until M3**, when exactly one forced line goes **above** the catch-all in `public/_redirects` (never netlify.toml, per project gotcha; no clean-URL rule — the documented `/x`↔`/x/` loop trap):

```
/websitebuilder-api/*  /.netlify/functions/websitebuilder/:splat  200!
```

**Routes:** `/websitebuilder` → editor · `/websitebuilder/<name>` → viewer (fetches published JSON) · `/websitebuilder#s=<blob>` → viewer (deflate+base64url doc in fragment, text-only share) · `/websitebuilder-api/*` → function (M3).

**Persistence ladder** (each rung additive; renderer/schema/sanitizer shared): M1 localStorage draft → M2 fragment share → M3 Netlify Function + Blobs registry.

### Files to create

| File | Responsibility |
|---|---|
| `src/builder/BuilderApp.jsx` | Lazy entry; routes editor vs viewer by pathname/fragment |
| `src/builder/builderState.js` | Doc reducer + past/future undo (DiceProvider pattern, cap 40), per-section lock set, debounced localStorage autosave, seeded roll helpers on `mulberry32`. Enforces the invariant: rolls never mutate `content`, edits never mutate `fx` |
| `src/builder/pools.js` | **Hand-curated** pools (see Reuse Map for why mechanical filtering fails): `titleFx` (~20 text-prop effects from wordmark-verified.json), `flair` (curated standalone decoratives), `wrappers` (curated few — only 2 of 130 wraps-children are cards; most are full-viewport backdrops), `backgrounds`, `cursors` (only 3 exist — optional garnish, not a variety source). Quarantine-aware via `p4rts-quarantine` + safeRoll exclusion loop |
| `src/builder/SitePage.jsx` | Doc → page. THE single renderer for editor preview, viewer, and fragment share (kills drift by construction; edit affordances via context flag). Chrome layers via DiceStage pattern; `applyPalette` on mount. Sanitizer lives here: schema whitelist, text as textContent never innerHTML, hrefs http/https/mailto + `rel="noopener nofollow ugc"`, image src limited to `data:image/(png|jpeg|webp)` or https |
| `src/builder/Section.jsx` | Per-type renderer (title/text/image/flair). Real DOM underneath, P4RTS effect aria-hidden on top (DiceWordmark/ProjectWall pattern); explicit sized frames (`size` → min-height) because `.p4rts-slot` is 100%×100% and collapses in unsized flow containers |
| `src/builder/EditorChrome.jsx` | Big die + undo/redo + add + publish bar; per-section inspector as DiceMenu bottom sheet (<768px CSS); per-section 🔒 lock / 🎲 reroll rail |
| `src/builder/ImageDrop.jsx` | Drop/pick → canvas downscale (1000px max edge, WebP/JPEG q0.75) → data-URI; rejects >150KB post-compress |
| `src/builder/share.js` | `CompressionStream('deflate-raw')` + base64url for `#s=`; M3 API client + token keychain (`wb-owned`) |
| `src/builder/ViewerPage.jsx` | Resolve doc (fragment or API), `migrate()`, render SitePage + un-removable "user-made · report" footer + **REMIX** button (structuredClone into a new draft, `remixOf` set, locks pre-engaged) |
| `src/builder/MountWhenVisible.jsx` | IntersectionObserver mount/unmount wrapper for flair/backdrop instances (±1 viewport, measured-height placeholder) |
| `src/builder/paletteBridge.js` | M3: scoped stylesheet on the renderer root redefining `--color-neutral-*` to palette-derived, luminance-preserving tints — 532/533 deep blocks use ONLY neutral-\* (judge-verified), so one palette roll re-skins any mounted block. **No `@custom-variant dark` anywhere** — the repo's `dark:` variants are media-query based and a class toggle would change portfolio-wide behavior |
| `src/lib/wb-schema.mjs` | Schema, `validate()`, `migrate()`, caps — **shared verbatim by client and function** so the server rejects exactly what the client can't render; `p4rts-pool.json` doubles as the server's slug allowlist |
| `src/lib/effect-props.js` | `effectProps()` extracted from DiceWordmark — typed text/size/color prop plumbing for title effects |
| `netlify/functions/websitebuilder.js` | M3: **modern v2 function (Request/Response)** — NOT the identify.js v1 lambda pattern, because `@netlify/blobs` `getStore()` throws in v1 handlers without `connectLambda(event)`. Routes: get/check/publish/update/report/admin; guardrails below |

Plus: `@netlify/blobs` in package.json (first datastore in this repo), two lines in `src/main.jsx`, one `_redirects` line.

## Site Document Schema

```json
{
  "v": 1, "id": "uuid", "name": null, "title": "My Site",
  "meta": { "emoji": "🎲", "remixOf": null, "seedOfBirth": 813371337, "updatedAt": 0 },
  "chrome": {
    "palette": { "…resolved rollPalette output…" },
    "bgPalette": { "…" },
    "density": "chill", "motion": true,
    "background": "slug-or-null", "cursor": "slug-or-null"
  },
  "sections": [{
    "id": "uuid",
    "type": "title | text | image | flair",
    "fx": "slug-or-null",
    "locked": false,
    "align": "center | left", "size": "sm | md | lg",
    "content": {
      "heading": "", "body": "",
      "image": { "src": "data:image/webp;base64,… | https:…", "alt": "" },
      "link": { "label": "", "href": "" }
    }
  }]
}
```

Rules in `validate()` (client UX, server law): palettes stored **resolved**, never re-derived from seed (the `permalink()` lesson — seed survives only as `seedOfBirth` lore); `fx` validated against the pool at render, unknown/quarantined slug degrades to plain styled DOM, never a blank; ≤ 20 sections; doc ≤ 1MB serialized; strings length-capped; hrefs protocol-allowlisted; image src mime-whitelisted (`data:image/png|jpeg|webp` or https). Sparse — only user-touched fields.

## Editor UX — first-run flow

1. **Birth roll.** Landing immediately rolls a complete site: contrast-gated palette, backdrop, title effect on "Your Name Here", 4–6 starter sections (title/text/image/flair mix, weighted skips so every roll has different bones), cascading in ~150ms staggered. One coach mark: *"This is your website. Don't like it? Roll again. Like a piece? Lock it."* No blank page, no tour.
2. **Roll & lock — three zoom levels.** Big die rerolls everything *unlocked* (chrome + all `fx`). Each section's hover/tap rail: 🔒 lock, 🎲 reroll this piece's look only, ⋮ (browse pool one-at-a-time full-size — EffectLab pattern, thumbnails lie about animated components — plus align/size/delete), ↑↓ reorder buttons (no drag-and-drop; cut).
3. **Make it yours.** Text edits inline via contentEditable **on builder-owned DOM only** (safe — we own it; stored as plain text, rendered as textContent). Images: drop/tap → downscaled data-URI appears instantly. `+` between sections → four big buttons: Title / Words / Picture / Flair.
4. **Vibe tray** (ControlBar chips): PALETTE 🎲 (`rollPaletteOnly` — **no hex picker, ever**; the WCAG AAA gate is both the taste rail and the accessibility rail), DENSITY (drives motion multiplier + WebGL budget), TITLE FX cycle.
5. **Trust contract, stated in the UI:** *"rolls change the look — never your words · every roll is undoable · nothing gets deleted"* (AuditDeck voice). Undo/redo on every mutation; autosave with "Saved ✓".
6. **Failure UX:** a failed block never renders null (data-loss-shaped) — friendly placeholder ("that piece didn't fit — dealt you a new one") + `onSlotFail` auto-redeal, quarantine per-slug, keys per-instance (`section.id`).
7. **Share / Publish** top-right.

## Publish & Names (M3)

- **Claim sheet:** name field with live `GET /check/:slug`; policy `^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$`, blocklist (reserved: admin/api/edit/view/lakota\*/login + existing portfolio routes + profanity list, no impersonation names). A **"roll me a name"** die generates goofy available slugs (`neon-otter-supply`).
- `POST /publish` → kill-switch check → rate limit → `validate(doc)` → claim with **read-after-write verification** (write `{doc, meta:{editTokenHash, claimNonce}}`, re-read, verify nonce — Blobs is last-write-wins, this makes the race deterministic; loser gets 409 + three rolled alternatives).
- **Ownership = capability token, not identity** (~40 lines of auth, no accounts/email/GDPR): random 128-bit edit token returned once, server stores only SHA-256. Client keeps it in localStorage AND shows a copyable **magic edit link** `/websitebuilder?edit=<name>#t=<token>` — token in the **fragment** (never query: history/referrer leakage). Lost token = orphaned site; admin can delete; acceptable.
- `GET /site/:name` with `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300` — short enough that a post-publish edit is never "lost" for more than a minute (fixes Design 0's 5-minute staleness flaw), CDN still absorbs viral reads.
- Success screen: live URL, QR, magic link with a hard "save this" prompt, confetti in the site's own palette.

## Images

Object URL during the drop interaction → immediate canvas downscale (1000px, q0.75, ~60–120KB) → **data-URI in the doc**. No IndexedDB, no upload endpoint, no asset pipeline — the site is always one self-contained JSON blob. Caps: 150KB/image, soft-warn at 5 images, 1MB doc (client + server). Fragment share (`#s=`) is honestly positioned as **text-only** — one image blows the ~8KB link ceiling ~15×, so oversize docs get "too big for a link — publish instead." Published docs: data-URIs and https URLs only, mime-whitelisted; external hotlinks are an Open Question (below). Deep blocks' baked-in Unsplash hotlinks: acceptable on lakotafox.com.

## Abuse & Moderation (day-one, priority order)

1. **Schema-not-HTML is the load-bearing guardrail** — everything renders through the trusted SitePage; user strings become React text nodes; slugs must exist in the verified pool (server-enforced via shared module); links protocol-allowlisted with `noopener nofollow ugc`. No subdomain isolation means this rule is architecturally non-negotiable.
2. **No phishing-shaped deck:** auth/login/paywall/form/waitlist categories are excluded from any block pool that ever ships — schema-not-HTML stops script injection but not lookalike login pages (grafted from Judge 2's flaw list; moot in the costume model but binding if deep blocks ever return).
3. Slug regex + blocklist; edit tokens (no overwrite vandalism); size caps.
4. Per-ipHash rate limits (Blobs counters: 5 creates/day, 60 updates/hour — known racy/rotatable; acceptable at hobby scale).
5. Un-removable viewer footer: "user-made site · made with websitebuilder · report" → `POST /report/:slug`, **deduped by ipHash**; ≥3 unique reporters flags for admin review (soft-hide is an option, but undeduped auto-unpublish is a 3-request censorship DoS — fixed).
6. `WB_FROZEN=1` env kill-switch on all writes; `ADMIN_TOKEN`-gated list/delete/restore/ban-slug.
7. **Cut for now:** inactivity TTL, automated scanning, link interstitials, `_headers` noindex (→ Open Questions).

## Reuse Map

| Existing file | Builder role |
|---|---|
| `src/components/dice/P4rtsSlot.jsx` | Universal mounter verbatim: glob, error boundary, quarantine, wraps-children spacer guard (children-override bug already fixed). Key by `section.id`, not slug |
| `src/lib/p4rts-pool.json` (752 verified) | Safe-to-offer list AND the server's slug allowlist. Real counts: 533 deep blocks, 20 title effects with text props, 3 cursors, 130 wraps-children (only 2 cards — hence hand curation) |
| `src/lib/p4rts-registry.json` / `p4rts-props.json` | slug→entry resolution; composition/role/prop-name metadata |
| `src/lib/palette.js` | `rollPalette`/`applyPalette` — the AAA contrast gate is the only color mechanism |
| `src/lib/dice.js` | `mulberry32`, distance-guaranteed reroll, reduced-motion. **COST/WEBGL_BUDGET/pickForRole are module-private** — the page-level budget is a reimplementation against a dynamic section list, budgeted as new work, not free reuse |
| `DiceProvider.jsx` | past/future history (cap 40), presets persistence, safeRoll exclusion loop |
| `DiceMenu.jsx` + `dice-menu.css` | Row chips, listbox, <768px bottom-sheet |
| `DiceStage.jsx` | Layered chrome mounting, slug-keyed remount-to-kill-WebGL, `tintFor` (art only, never photos/text) |
| `DiceWordmark.jsx` / ProjectWall | Real-DOM-under-aria-hidden-decoration — THE content pattern; `effectProps` extraction |
| EffectLab | One-at-a-time full-size live triage → the block browser AND the tool for the pools curation pass |
| `netlify/functions/identify.js` | CORS/env conventions only — the new function is **v2** for Blobs |
| `vault/sites/templates` (15) | M3 "loaded dice" named starting decks |

## Milestones

- **M1 — usable (4–6 days, includes a curation session):** route split; birth roll; 4 section types with hand-curated pools (EffectLab triage pass for flair/wrappers is real, budgeted work); lock/reroll at three zoom levels; inline text edit; image drop; add/remove/reorder/delete; undo/redo; vibe tray; localStorage autosave; placeholder-on-fail; page-level WebGL budget + MountWhenVisible. *Exit: build a real page about your dog on your phone.*
- **M2 — shareable (1 day):** `#s=` fragment share (text-only, oversize → "publish instead"), ViewerPage, copy-site-code export/import, REMIX button.
- **M3 — published (2–3 days):** v2 function + Blobs, name claiming with race-safe verify, edit tokens + magic link, guardrails 1–6, `_redirects` line, admin ops, palette bridge (`paletteBridge.js`), templates as loaded dice. *Exit: `lakotafox.com/websitebuilder/tacos` loads on a stranger's phone; report reaches admin; WB_FROZEN stops writes.*

**Cut list:** deep-block content editing (patch engine AND slot codemod — both judge-killed), drag-and-drop, per-section palettes, image hosting/asset endpoints, accounts, hex pickers, TTL cleanup, `/fresh` gallery. Each returns only if users ask.

## Hardest Problems & Solutions

1. **Blocks hardcode ~everything** (only 20 effects take text props; 527/662 build content via `.map()`; 480 are stateful so DOM patches get clobbered). **Don't fight it — invert ownership:** user content in builder DOM, P4RTS as costume. Both editing schemes died in judging; this cut is what makes the product shippable.
2. **WebGL collapse on stacked sections** (dice budgeted ONE hero; Safari evicts past ~8–16 contexts; author's M-series laptop writes checks a visitor's phone can't cash). Page-level cost ledger at deal time (degrade to cheapest, then no-fx) + IntersectionObserver mount/unmount + density-as-global-multiplier + reduced-motion passthrough. Honest cost: reimplementation, since dice.js's budget is module-private and role-hardwired.
3. **Strangers on a trusted personal domain.** The renderer is the sandbox: schema JSON only, pool-allowlisted slugs, text nodes only, allowlisted protocols, phishing-shaped categories banned from the deck, un-removable provenance footer, deduped reports, admin delete, kill-switch. Converts moderation from "review everything" to "30-second response to a report."
4. **Ownership without accounts, including the claim race.** Capability tokens (hash-stored) + read-after-write nonce verification on claim; magic edit link in the URL fragment.
5. **Editor/published drift + palette cohesion.** One SitePage renderer for every surface (drift impossible by construction); cohesion via `applyPalette` vars on builder-owned DOM now, and the verified `--color-neutral-*` scoped bridge for any mounted block later — explicitly WITHOUT `@custom-variant dark`, whose blast radius hits the whole portfolio.

## Open Questions for Lakota

1. **External image URLs on published sites** — allow https hotlinks (strangers can frame arbitrary remote imagery on your domain, report-only recourse) or data-URI-only (safer, 150KB ceiling)?
2. **Deep blocks as a "showcase" section type later?** Requires a stacked-composition verification pass (blocks were verified solo/full-viewport; 32 use h-screen, 19 use fixed positioning) plus the fake-marketing-copy honesty problem. Worth it, or is the costume model the product?
3. **Inactivity TTL** — ship the 90/120-day "free while someone visits it" sweep in M3, or defer until squatting actually happens?
4. **SEO posture** — noindex user pages via `_headers` (protects lakotafox.com's domain reputation from spam) or let them index?
5. **Product name on the page** — "websitebuilder" or something dice-flavored ("ROLL YOUR OWN WEBSITE")? Affects the footer badge and remix framing.
6. **Report destination** — mailto to khabefox@gmail.com (M3-cheap) or the Blobs report queue + admin list from day one?
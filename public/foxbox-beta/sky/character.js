/**
 * character.js — drawn characters (party mode only; the Gaming Couch platform never sends one).
 *
 * A drawn character is a transparent image plus a `hitbox`: the body box as fractions of the
 * image ({ x, y, w, h }, x/y = top-left). One sizing rule, shared by gc.game.js (body height for
 * the sim) and render.js (sprite scale), so what you see is what you can stomp:
 *
 *   k      = min(2·PLAYER_R / (hitbox.w · imgW),  MAX_BODY_H / (hitbox.h · imgH))   world units per image px
 *   body h = hitbox.h · imgH · k                                                      feet → top of head
 *
 * The sprite is drawn scaled by k with the hitbox's bottom-centre on the player's feet point
 * (x, y − PLAYER_R). Parts of the image outside the hitbox (hair, a flag) still draw.
 *
 * Ball mode — hitbox { x, y, w, h, ball: true } (often a photo of a face): the box is the
 * square around a circle. Then
 *
 *   k      = 2·PLAYER_R / (hitbox.w · imgW)        the circle's diameter = the puffball's
 *   body h = 2·PLAYER_R                            plays exactly like a normal ball
 *
 * and the image is clipped to that circle, centred on the ball centre (feet + PLAYER_R).
 */

import { PLAYER_R, MAX_BODY_H } from "./sim.js";

const clamp01 = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : d;
};

/** A sane hitbox: fractions in 0..1, at least 2 % of the image each way, inside the image. */
export function normHitbox(hb) {
  hb = hb && typeof hb === "object" ? hb : {};
  let x = clamp01(hb.x, 0), y = clamp01(hb.y, 0);
  let w = clamp01(hb.w, 1), h = clamp01(hb.h, 1);
  w = Math.max(0.02, Math.min(w, 1 - x));
  h = Math.max(0.02, Math.min(h, 1 - y));
  if (x + w > 1) x = 1 - w;
  if (y + h > 1) y = 1 - h;
  return hb.ball ? { x, y, w, h, ball: true } : { x, y, w, h };
}

/**
 * The sizing rule. Returns { k, h, w, ax, ay, hitbox, ball }: k = world units per image pixel,
 * h / w = body height / width in world units, (ax, ay) = the feet anchor (hitbox bottom-centre)
 * in image pixels. Ball mode adds (cx, cy, rad) = the circle's centre and radius in image px,
 * and the feet anchor is the bottom of that circle.
 */
export function characterFit(hitbox, imgW, imgH) {
  const hb = normHitbox(hitbox);
  if (hb.ball) {
    const rad = Math.max(0.5, (hb.w * imgW) / 2);
    const k = PLAYER_R / rad;
    const cx = (hb.x + hb.w / 2) * imgW, cy = (hb.y + hb.h / 2) * imgH;
    return { k, h: 2 * PLAYER_R, w: 2 * PLAYER_R, ax: cx, ay: cy + rad, cx, cy, rad, ball: true, hitbox: hb };
  }
  const bw = Math.max(1, hb.w * imgW);
  const bh = Math.max(1, hb.h * imgH);
  const k = Math.min((2 * PLAYER_R) / bw, MAX_BODY_H / bh);
  return { k, h: bh * k, w: bw * k, ax: (hb.x + hb.w / 2) * imgW, ay: (hb.y + hb.h) * imgH, ball: false, hitbox: hb };
}

/**
 * Load a character's image. `character` = { src, hitbox, img? } — an already-loaded <img>
 * in `img` is used as-is. Resolves to the decoded image, or null on error / timeout.
 */
export function loadCharacterImage(character, timeoutMs = 6000) {
  const ready = (im) => im && im.complete && (im.naturalWidth || 0) > 0;
  if (character && ready(character.img)) return Promise.resolve(character.img);
  if (!character || typeof character.src !== "string" || !character.src) return Promise.resolve(null);
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(v);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    try {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        if (!ready(im)) return finish(null);
        // decode() so the first drawImage doesn't stall a frame; fine if unsupported.
        Promise.resolve(im.decode ? im.decode().catch(() => {}) : null).then(() => finish(im));
      };
      im.onerror = () => finish(null);
      im.src = character.src;
    } catch {
      finish(null);
    }
  });
}

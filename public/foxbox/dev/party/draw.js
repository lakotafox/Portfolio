/**
 * draw.js — "Draw your own" for the Sky Scramble phone controller (party mode).
 *
 * A square 768×768 canvas (transparent, shown on a light checkerboard) with a faint guide (a
 * feet line near the bottom, "faces right →"), four tools — Pen (smooth round line), Crayon
 * (waxy specks), Fill bucket, Eraser — big colour swatches, S/M/L sizes, Undo (40 steps) and
 * Clear. Only the first finger draws (multi-touch is ignored); pointer moves use coalesced
 * events so fast lines stay smooth.
 *
 * Body: "Whole body" = the hitbox is the bounding box of what was drawn (automatic), or
 * "Ball" = a circle the player drags (inside = move, edge = resize; tapping Ball again refits
 * it around the drawing). The game clips a ball character's picture to that circle.
 *
 * bakeDrawing() makes the upload: the drawing cropped to its content (+ a little padding) with
 * a ~6 px white sticker edge under every drawn pixel (a chamfer distance transform from the
 * opaque pixels → the halo's alpha), so thin lines still read on the TV. The lines themselves
 * are kept exactly as drawn. The hitbox comes back as fractions of the cropped picture.
 */

export const N = 768; // canvas pixels (square)
export const HALO = 6; // white sticker edge, canvas px
const MASK_A = 24; // alpha above this counts as "drawn"
const MIN_BOX = 24; // a whole-body box is at least this many px each way
const MIN_BALL_R = 40;
const TAU = Math.PI * 2;
const FONT = '"Arial Rounded MT Bold", ui-rounded, system-ui, sans-serif';

/** Two rows of seven: black/white, the Gaming Couch player colours (+ orange), three skin tones. */
export const COLORS = [
  ["#1d1b2e", "Black"],
  ["#ffffff", "White"],
  ["#f33f5e", "Red"],
  ["#ff8a3d", "Orange"],
  ["#fabe24", "Yellow"],
  ["#4b8216", "Green"],
  ["#2dd3be", "Cyan"],
  ["#074eea", "Blue"],
  ["#8a5cf5", "Purple"],
  ["#fba4a4", "Pink"],
  ["#9e4823", "Brown"],
  ["#ffdbc0", "Light skin"],
  ["#d9a074", "Skin"],
  ["#8d5a3c", "Dark skin"],
];
/** Brush widths (canvas px) for S / M / L. */
const SIZES = { pen: [7, 16, 34], crayon: [14, 26, 48], eraser: [22, 44, 84] };
const UNDO_STEPS = 40;
const UNDO_MIN = 30; // always keep at least this many, even over the memory budget
const UNDO_BYTES = 96e6;

// ── Pixel helpers ────────────────────────────────────────────────────────────────

/** Distance (px, chamfer 3-4) from every pixel of a W×H grid to the nearest pixel set in `mask`. */
export function distanceField(mask, W, H) {
  const INF = 1e9, d = new Float32Array(W * H);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? 0 : INF;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = d[i];
      if (v === 0) continue;
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) {
        v = Math.min(v, d[i - W] + 3);
        if (x > 0) v = Math.min(v, d[i - W - 1] + 4);
        if (x < W - 1) v = Math.min(v, d[i - W + 1] + 4);
      }
      d[i] = v;
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      let v = d[i];
      if (v === 0) continue;
      if (x < W - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < H - 1) {
        v = Math.min(v, d[i + W] + 3);
        if (x < W - 1) v = Math.min(v, d[i + W + 1] + 4);
        if (x > 0) v = Math.min(v, d[i + W - 1] + 4);
      }
      d[i] = v;
    }
  for (let i = 0; i < d.length; i++) d[i] /= 3;
  return d;
}

/** Bounding box of the drawn pixels of an N×N ImageData, or null when blank. */
function drawnBox(data) {
  let x0 = N, y0 = N, x1 = -1, y1 = -1;
  for (let y = 0; y < N; y++) {
    const row = y * N * 4;
    for (let x = 0; x < N; x++) {
      if (data[row + x * 4 + 3] > MASK_A) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/** The default ball: centred on the drawing, just big enough to hold all of it. */
function fitBallTo(data, box) {
  if (!box) return { cx: N / 2, cy: N / 2, r: Math.round(N * 0.36) };
  const cx = (box.x0 + box.x1 + 1) / 2, cy = (box.y0 + box.y1 + 1) / 2;
  let r2 = 0;
  for (let y = box.y0; y <= box.y1; y++)
    for (let x = box.x0; x <= box.x1; x++) {
      if (data[(y * N + x) * 4 + 3] > MASK_A) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, q = dx * dx + dy * dy;
        if (q > r2) r2 = q;
      }
    }
  return { cx, cy, r: Math.max(MIN_BALL_R, Math.sqrt(r2) + 4) };
}

/**
 * The picture to upload: the drawing cropped to its content (+ padding), every drawn pixel with
 * a white sticker edge under it, and the hitbox as fractions of the cropped picture.
 * `src` = the N×N ImageData, body = "box" | "ball", ball = { cx, cy, r } in canvas px.
 * Returns { canvas, hitbox, width, height } or null for a blank drawing.
 */
export function bakeDrawing(src, body, ball, paper = false) {
  const d = src.data;
  const box = drawnBox(d);
  if (!box) return null;
  // whole-body box: what was drawn, at least MIN_BOX each way (feet stay put, it grows upward)
  let bx0 = box.x0, bx1 = box.x1 + 1, by0 = box.y0, by1 = box.y1 + 1;
  if (bx1 - bx0 < MIN_BOX) {
    const c = (bx0 + bx1) / 2;
    bx0 = Math.floor(c - MIN_BOX / 2);
    bx1 = bx0 + MIN_BOX;
  }
  if (by1 - by0 < MIN_BOX) by0 = by1 - MIN_BOX;
  const isBall = body === "ball" && ball && ball.r > 0;

  const M = HALO + 3; // halo + a couple of px of air
  let ox = Math.min(box.x0 - M, bx0), oy = Math.min(box.y0 - M, by0);
  let ex = Math.max(box.x1 + 1 + M, bx1), ey = Math.max(box.y1 + 1 + M, by1);
  if (isBall) {
    ox = Math.min(ox, Math.floor(ball.cx - ball.r));
    oy = Math.min(oy, Math.floor(ball.cy - ball.r));
    ex = Math.max(ex, Math.ceil(ball.cx + ball.r));
    ey = Math.max(ey, Math.ceil(ball.cy + ball.r));
  }
  const W = ex - ox, H = ey - oy;

  const out = new ImageData(W, H), o = out.data;
  const mask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const sy = y + oy;
    if (sy < 0 || sy >= N) continue;
    for (let x = 0; x < W; x++) {
      const sx = x + ox;
      if (sx < 0 || sx >= N) continue;
      const si = (sy * N + sx) * 4, oi = (y * W + x) * 4;
      o[oi] = d[si];
      o[oi + 1] = d[si + 1];
      o[oi + 2] = d[si + 2];
      o[oi + 3] = d[si + 3];
      if (d[si + 3] > MASK_A) mask[y * W + x] = 1;
    }
  }
  // the sticker edge: white under the drawing, fading out over the last pixel of the band
  const dist = distanceField(mask, W, H);
  for (let i = 0; i < W * H; i++) {
    const halo = mask[i] ? 1 : Math.max(0, Math.min(1, HALO + 0.5 - dist[i]));
    if (halo <= 0) continue;
    const oi = i * 4, a = o[oi + 3] / 255;
    const outA = a + halo * (1 - a);
    for (let c = 0; c < 3; c++) o[oi + c] = Math.round((o[oi + c] * a + 255 * halo * (1 - a)) / outA);
    o[oi + 3] = Math.round(outA * 255);
  }
  // White paper (whole body only): everything the drawing encloses is filled white, so the sky
  // doesn't show through. The sticker edge above already closes small gaps in the outline.
  if (paper && !isBall) {
    const n = W * H, out = new Uint8Array(n), stack = [];
    const open = (i) => o[i * 4 + 3] < 8;
    const push = (i) => { if (!out[i] && open(i)) { out[i] = 1; stack.push(i); } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (stack.length) {
      const i = stack.pop(), x = i % W;
      if (x > 0) push(i - 1);
      if (x < W - 1) push(i + 1);
      if (i >= W) push(i - W);
      if (i < n - W) push(i + W);
    }
    for (let i = 0; i < n; i++) {
      if (out[i]) continue;
      const oi = i * 4, a = o[oi + 3] / 255;
      if (a >= 1) continue;
      for (let c = 0; c < 3; c++) o[oi + c] = Math.round(o[oi + c] * a + 255 * (1 - a));
      o[oi + 3] = 255;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  canvas.getContext("2d").putImageData(out, 0, 0);

  const f = (v) => Math.round(v * 10000) / 10000;
  const hitbox = isBall
    ? { x: f((ball.cx - ball.r - ox) / W), y: f((ball.cy - ball.r - oy) / H), w: f((2 * ball.r) / W), h: f((2 * ball.r) / H), ball: true }
    : { x: f((bx0 - ox) / W), y: f((by0 - oy) / H), w: f((bx1 - bx0) / W), h: f((by1 - by0) / H) };
  return { canvas, hitbox, width: W, height: H };
}

/**
 * Bucket fill at (x, y) with `rgb` ([r, g, b]). Gaps of up to ~4 px in an outline (crayon
 * specks, a pen line that didn't quite meet) count as closed, and the colour is tucked under
 * the soft edges of the lines so there's no see-through seam. Returns the changed rect or null.
 */
function floodFill(img, x, y, rgb) {
  const d = img.data;
  x = Math.max(0, Math.min(N - 1, Math.floor(x)));
  y = Math.max(0, Math.min(N - 1, Math.floor(y)));
  const i0 = (y * N + x) * 4;
  const ta = d[i0 + 3];
  if (ta === 255 && d[i0] === rgb[0] && d[i0 + 1] === rgb[1] && d[i0 + 2] === rgb[2]) return null;
  // compare premultiplied, so every fully see-through pixel is "the same colour"
  const tr = (d[i0] * ta) / 255, tg = (d[i0 + 1] * ta) / 255, tb = (d[i0 + 2] * ta) / 255;
  const same = new Uint8Array(N * N);
  for (let i = 0, p = 0; i < N * N; i++, p += 4) {
    const a = d[p + 3];
    const diff = Math.abs((d[p] * a) / 255 - tr) + Math.abs((d[p + 1] * a) / 255 - tg) + Math.abs((d[p + 2] * a) / 255 - tb) + 2 * Math.abs(a - ta);
    if (diff < 120) same[i] = 1;
  }
  const walls = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) walls[i] = same[i] ? 0 : 1;
  const GAP = 2;
  const dWall = distanceField(walls, N, N);
  const seed = y * N + x;
  // the fill spreads through pixels at least GAP from a wall (so it can't squeeze through small gaps)…
  let open = (i) => same[i] && dWall[i] > GAP;
  if (!open(seed)) open = (i) => same[i]; // tapped right next to a line / in a thin spot: plain fill
  const region = new Uint8Array(N * N);
  const stack = [seed];
  region[seed] = 1;
  while (stack.length) {
    const i = stack.pop(), px = i % N;
    if (px > 0 && !region[i - 1] && open(i - 1)) (region[i - 1] = 1), stack.push(i - 1);
    if (px < N - 1 && !region[i + 1] && open(i + 1)) (region[i + 1] = 1), stack.push(i + 1);
    if (i >= N && !region[i - N] && open(i - N)) (region[i - N] = 1), stack.push(i - N);
    if (i < N * (N - 1) && !region[i + N] && open(i + N)) (region[i + N] = 1), stack.push(i + N);
  }
  // …then grows back up to the lines…
  const dReg = distanceField(region, N, N);
  for (let i = 0; i < N * N; i++) if (!region[i] && same[i] && dReg[i] <= GAP + 1.5) region[i] = 1;
  // …and tucks under their soft edges, so there's no see-through seam
  const dFill = distanceField(region, N, N);
  let x0 = N, y0 = N, x1 = -1, y1 = -1;
  const [r, gC, b] = rgb;
  for (let i = 0, p = 0; i < N * N; i++, p += 4) {
    if (region[i]) {
      d[p] = r;
      d[p + 1] = gC;
      d[p + 2] = b;
      d[p + 3] = 255;
    } else if (dFill[i] <= 1.4 && d[p + 3] < 255) {
      const a = d[p + 3] / 255;
      d[p] = Math.round(d[p] * a + r * (1 - a));
      d[p + 1] = Math.round(d[p + 1] * a + gC * (1 - a));
      d[p + 2] = Math.round(d[p + 2] * a + b * (1 - a));
      d[p + 3] = 255;
    } else continue;
    const px = i % N, py = (i - px) / N;
    if (px < x0) x0 = px;
    if (px > x1) x1 = px;
    if (py < y0) y0 = py;
    if (py > y1) y1 = py;
  }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ── The drawing screen ───────────────────────────────────────────────────────────

/**
 * Wire up the drawing screen. `el` = { screen, stage, board, art, guide, tools, colors, sizes,
 * body, undo, clear, confirm, clearYes, clearNo, done, back, note }. hooks = { onChange(),
 * onDone(), onBack() }. Returns { open(state), state(), bake(), layout(), note(text), busy(on) }.
 */
export function createDrawPad(el, hooks) {
  const { art, guide, board } = el;
  art.width = art.height = guide.width = guide.height = N;
  const g = art.getContext("2d", { willReadFrequently: true });
  const gg = guide.getContext("2d");

  let tool = "pen"; // pen | crayon | fill | eraser | ball (moving / sizing the ball circle)
  let drawTool = "pen"; // the last real drawing tool (to go back to from "ball")
  let color = COLORS[0][0];
  let sizeIdx = 1;
  let body = "box";
  let paper = true; // fill the inside of a whole-body drawing with white (see bakeDrawing)
  let ball = null; // { cx, cy, r } canvas px
  let ballManual = false; // the player moved / sized it: stop refitting it to the drawing
  let box = null; // drawn bounding box, or null when blank
  let active = null; // the one pointer that's drawing / dragging
  let locked = false; // loading or sending: no input
  const undo = [];
  let undoBytes = 0;

  // ── buttons ──
  for (const [c, name] of COLORS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sw";
    b.dataset.color = c;
    b.style.background = c;
    b.setAttribute("aria-label", name);
    b.addEventListener("click", () => setColor(c));
    el.colors.append(b);
  }
  el.tools.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));
  el.sizes.querySelectorAll("[data-size]").forEach((b) => b.addEventListener("click", () => setSize(Number(b.dataset.size))));
  el.body.querySelectorAll("[data-body]").forEach((b) => b.addEventListener("click", () => setBody(b.dataset.body)));
  if (el.paper) el.paper.addEventListener("click", () => {
    paper = !paper;
    renderControls();
    note(paper ? "White paper on: the inside of your drawing is filled white" : "White paper off: you can see through the gaps in your drawing");
    schedulePreview();
    hooks.onChange();
  });
  el.undo.addEventListener("click", () => doUndo());
  let confirmTimer = null;
  const showConfirm = (on) => {
    clearTimeout(confirmTimer);
    el.confirm.hidden = !on;
    el.screen.classList.toggle("confirming", on);
    if (on) confirmTimer = setTimeout(() => showConfirm(false), 5000);
  };
  el.clear.addEventListener("click", () => {
    if (box) showConfirm(true);
  });
  el.clearNo.addEventListener("click", () => showConfirm(false));
  el.clearYes.addEventListener("click", () => {
    showConfirm(false);
    if (locked || !box) return;
    const before = g.getImageData(0, 0, N, N);
    pushUndo(before, { x0: box.x0, y0: box.y0, x1: box.x1 + 1, y1: box.y1 + 1 });
    g.clearRect(0, 0, N, N);
    ballManual = false;
    changed();
  });
  el.done.addEventListener("click", () => {
    if (locked) return;
    if (!box) {
      note("Draw something first! ✏️");
      return;
    }
    hooks.onDone();
  });
  el.back.addEventListener("click", () => {
    if (!locked) hooks.onBack();
  });

  function setTool(t) {
    tool = t;
    if (t !== "ball") drawTool = t;
    renderControls();
    drawOverlay();
    note(t === "ball" ? "Drag the circle to move it · drag its edge to resize" : "");
  }
  function setColor(c) {
    color = c;
    // picking a colour means "paint": leave the eraser / ball circle for the last brush
    if (tool === "ball") tool = drawTool;
    if (tool === "eraser") tool = "pen";
    drawTool = tool;
    renderControls();
    drawOverlay();
    note("");
  }
  function setSize(i) {
    sizeIdx = Math.max(0, Math.min(2, i | 0));
    if (tool === "ball") tool = drawTool;
    renderControls();
    drawOverlay();
  }
  function setBody(b) {
    if (b === "ball") {
      // tapping Ball again refits the circle around the drawing
      if (body === "ball" && tool === "ball") ballManual = false;
      body = "ball";
      if (!ball || !ballManual) ball = fitBallTo(g.getImageData(0, 0, N, N).data, box);
      setTool("ball");
    } else {
      body = "box";
      if (tool === "ball") tool = drawTool;
      renderControls();
      drawOverlay();
      note(box ? "Your player's body is the box around your drawing" : "");
    }
    schedulePreview();
    hooks.onChange();
  }
  function width() {
    const t = tool === "crayon" || tool === "eraser" ? tool : "pen";
    return SIZES[t][sizeIdx];
  }

  function renderControls() {
    el.tools.querySelectorAll("[data-tool]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === tool)));
    el.colors.querySelectorAll(".sw").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.color === color && tool !== "eraser")));
    el.sizes.querySelectorAll("[data-size]").forEach((b) => {
      b.setAttribute("aria-pressed", String(Number(b.dataset.size) === sizeIdx));
      b.style.setProperty("--dot", tool === "eraser" ? "#ffffff" : color);
    });
    el.body.querySelectorAll("[data-body]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.body === body)));
    if (el.paper) {
      el.paper.setAttribute("aria-pressed", String(paper));
      el.paper.disabled = body === "ball"; // a ball is a filled circle anyway
    }
    schedulePreview();
    el.undo.disabled = undo.length === 0;
    el.clear.disabled = !box;
    el.screen.dataset.tool = tool;
  }

  // ── overlay: guide + body ──
  function drawOverlay() {
    gg.clearRect(0, 0, N, N);
    const fy = Math.round(N * 0.9);
    gg.save();
    gg.setLineDash([18, 14]);
    gg.lineWidth = 3;
    gg.strokeStyle = "rgba(40, 90, 200, 0.32)";
    gg.beginPath();
    gg.moveTo(20, fy);
    gg.lineTo(N - 20, fy);
    gg.stroke();
    gg.setLineDash([]);
    gg.fillStyle = "rgba(40, 90, 200, 0.45)";
    gg.font = `28px ${FONT}`;
    gg.textAlign = "left";
    gg.fillText("feet", 24, fy - 12);
    gg.textAlign = "right";
    gg.fillText("faces right →", N - 24, N - 22);
    if (!box) {
      gg.textAlign = "center";
      gg.font = `44px ${FONT}`;
      gg.fillStyle = "rgba(40, 90, 200, 0.28)";
      gg.fillText("Draw your player here!", N / 2, N * 0.45);
    }
    gg.restore();
    if (body === "box" && box) {
      const x = box.x0 - 4, y = box.y0 - 4, w = box.x1 - box.x0 + 9, h = box.y1 - box.y0 + 9;
      gg.save();
      gg.setLineDash([12, 10]);
      gg.lineWidth = 3;
      gg.strokeStyle = "rgba(238, 90, 40, 0.55)";
      gg.strokeRect(x, y, w, h);
      gg.setLineDash([]);
      gg.lineWidth = 6;
      gg.beginPath();
      gg.moveTo(x, y + h);
      gg.lineTo(x + w, y + h);
      gg.stroke();
      gg.restore();
    } else if (body === "ball" && ball) {
      const adjusting = tool === "ball";
      gg.save();
      gg.fillStyle = adjusting ? "rgba(20, 30, 60, 0.42)" : "rgba(20, 30, 60, 0.2)";
      gg.beginPath();
      gg.rect(0, 0, N, N);
      gg.arc(ball.cx, ball.cy, ball.r, 0, TAU, true);
      gg.fill();
      gg.lineWidth = 7;
      gg.strokeStyle = "#ee5a28";
      gg.beginPath();
      gg.arc(ball.cx, ball.cy, ball.r, 0, TAU);
      gg.stroke();
      if (adjusting) {
        // resize handle on the right edge (inside = move)
        const hx = Math.min(N - 26, ball.cx + ball.r), hy = Math.max(26, Math.min(N - 26, ball.cy));
        gg.fillStyle = "#ffffff";
        gg.strokeStyle = "#ee5a28";
        gg.lineWidth = 6;
        gg.beginPath();
        gg.arc(hx, hy, 22, 0, TAU);
        gg.fill();
        gg.stroke();
        gg.fillStyle = "#ee5a28";
        gg.font = `30px ${FONT}`;
        gg.textAlign = "center";
        gg.textBaseline = "middle";
        gg.fillText("↔", hx, hy + 1);
      }
      gg.restore();
    }
  }

  // ── history ──
  function pushUndo(before, r) {
    const x0 = Math.max(0, Math.floor(r.x0)), y0 = Math.max(0, Math.floor(r.y0));
    const x1 = Math.min(N, Math.ceil(r.x1)), y1 = Math.min(N, Math.ceil(r.y1));
    const w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0) return;
    const img = new ImageData(w, h);
    for (let row = 0; row < h; row++) {
      const s = ((y0 + row) * N + x0) * 4;
      img.data.set(before.data.subarray(s, s + w * 4), row * w * 4);
    }
    undo.push({ x: x0, y: y0, img });
    undoBytes += img.data.length;
    while (undo.length > UNDO_STEPS || (undo.length > UNDO_MIN && undoBytes > UNDO_BYTES)) undoBytes -= undo.shift().img.data.length;
  }
  function doUndo() {
    if (locked || active) return;
    const u = undo.pop();
    if (!u) return;
    undoBytes -= u.img.data.length;
    g.putImageData(u.img, u.x, u.y);
    changed();
  }

  /** After every change to the picture: new bounding box, refit the ball, save the draft. */
  function changed() {
    const data = g.getImageData(0, 0, N, N).data;
    box = drawnBox(data);
    if (body === "ball" && !ballManual) ball = fitBallTo(data, box);
    renderControls();
    drawOverlay();
    schedulePreview();
    hooks.onChange();
  }

  // ── input ──
  function pos(e) {
    const r = art.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * N, y: ((e.clientY - r.top) / r.height) * N };
  }
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  function grow(p) {
    const r = active.rect, m = width() / 2 + 3;
    r.x0 = Math.min(r.x0, p.x - m);
    r.y0 = Math.min(r.y0, p.y - m);
    r.x1 = Math.max(r.x1, p.x + m);
    r.y1 = Math.max(r.y1, p.y + m);
  }
  function lineStyle() {
    g.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    g.globalAlpha = 1;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.lineWidth = width();
    g.strokeStyle = g.fillStyle = tool === "eraser" ? "#000" : color;
  }
  function crayonStamp(x, y) {
    const size = width();
    g.fillStyle = color;
    const n = Math.ceil(size * 0.9);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, dd = (Math.sqrt(Math.random()) * size) / 2;
      g.globalAlpha = 0.35 + Math.random() * 0.5;
      const s = 1 + Math.random() * Math.max(1.5, size / 9);
      g.fillRect(x + Math.cos(a) * dd, y + Math.sin(a) * dd, s, s);
    }
    g.globalAlpha = 1;
  }
  function beginStroke(p) {
    if (tool === "crayon") {
      crayonStamp(p.x, p.y);
      active.last = p;
      return;
    }
    lineStyle();
    g.beginPath();
    g.arc(p.x, p.y, width() / 2, 0, TAU);
    g.fill();
    g.globalCompositeOperation = "source-over";
  }
  function extendStroke(q) {
    grow(q);
    const a = active;
    if (tool === "crayon") {
      const dx = q.x - a.last.x, dy = q.y - a.last.y, dist = Math.hypot(dx, dy);
      const step = Math.max(1, width() * 0.22);
      if (dist < step) return;
      let t = step;
      for (; t <= dist; t += step) crayonStamp(a.last.x + (dx * t) / dist, a.last.y + (dy * t) / dist);
      t -= step;
      a.last = { x: a.last.x + (dx * t) / dist, y: a.last.y + (dy * t) / dist };
      return;
    }
    const pts = a.pts, last = pts[pts.length - 1];
    if (Math.hypot(q.x - last.x, q.y - last.y) < 1.5) {
      a.pending = q;
      return;
    }
    a.pending = null;
    pts.push(q);
    // smooth: quadratic curves through the midpoints, each piece stroked as it comes
    lineStyle();
    g.beginPath();
    if (pts.length === 2) {
      const m = mid(pts[0], pts[1]);
      g.moveTo(pts[0].x, pts[0].y);
      g.lineTo(m.x, m.y);
    } else {
      const [p0, p1, p2] = pts.slice(-3);
      const m0 = mid(p0, p1), m1 = mid(p1, p2);
      g.moveTo(m0.x, m0.y);
      g.quadraticCurveTo(p1.x, p1.y, m1.x, m1.y);
    }
    g.stroke();
    g.globalCompositeOperation = "source-over";
    if (pts.length > 3) pts.shift();
  }
  function endStroke() {
    const a = active;
    if (tool !== "crayon") {
      if (a.pending) a.pts.push(a.pending);
      const pts = a.pts;
      if (pts.length >= 2) {
        const p1 = pts[pts.length - 2], p2 = pts[pts.length - 1], m = mid(p1, p2);
        lineStyle();
        g.beginPath();
        g.moveTo(m.x, m.y);
        g.lineTo(p2.x, p2.y);
        g.stroke();
        g.globalCompositeOperation = "source-over";
      }
    }
    pushUndo(a.before, a.rect);
  }

  function ballDrag(p) {
    const a = active;
    if (a.mode === "move") {
      ball.cx = Math.max(0, Math.min(N, p.x - a.dx));
      ball.cy = Math.max(0, Math.min(N, p.y - a.dy));
    } else {
      ball.r = Math.max(MIN_BALL_R, Math.min(N * 0.75, Math.hypot(p.x - ball.cx, p.y - ball.cy)));
    }
    drawOverlay();
  }

  board.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (active || locked) return; // only the first finger draws
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      board.setPointerCapture(e.pointerId);
    } catch {}
    showConfirm(false);
    const p = pos(e);
    if (tool === "ball") {
      if (!ball) ball = fitBallTo(g.getImageData(0, 0, N, N).data, box);
      const dd = Math.hypot(p.x - ball.cx, p.y - ball.cy);
      ballManual = true;
      active = { id: e.pointerId, kind: "ball", mode: dd < ball.r * 0.72 ? "move" : "size", dx: p.x - ball.cx, dy: p.y - ball.cy };
      if (active.mode === "size") ballDrag(p);
      return;
    }
    const before = g.getImageData(0, 0, N, N);
    if (tool === "fill") {
      const img = g.getImageData(0, 0, N, N);
      const r = floodFill(img, p.x, p.y, hexRgb(color));
      if (r) {
        g.putImageData(img, 0, 0);
        pushUndo(before, r);
        changed();
      }
      return;
    }
    active = { id: e.pointerId, kind: "stroke", before, pts: [p], pending: null, last: p, rect: { x0: p.x, y0: p.y, x1: p.x, y1: p.y } };
    grow(p);
    beginStroke(p);
  });
  board.addEventListener("pointermove", (e) => {
    if (!active || e.pointerId !== active.id) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    const list = evs.length ? evs : [e];
    if (active.kind === "ball") {
      ballDrag(pos(list[list.length - 1]));
      return;
    }
    for (const ev of list) extendStroke(pos(ev));
  });
  const up = (e) => {
    if (!active || e.pointerId !== active.id) return;
    const a = active;
    if (a.kind === "stroke") {
      endStroke();
      active = null;
      changed();
    } else {
      active = null;
      drawOverlay();
      schedulePreview();
    hooks.onChange();
    }
  };
  board.addEventListener("pointerup", up);
  board.addEventListener("pointercancel", up);
  board.addEventListener("lostpointercapture", up);
  // iOS: no magnifier / callout / double-tap zoom on the canvas
  for (const type of ["touchstart", "touchmove", "touchend"]) board.addEventListener(type, (e) => e.preventDefault(), { passive: false });

  // ── layout: the biggest square that fits ──
  function layout() {
    const scr = el.screen;
    if (!scr.classList.contains("show")) return;
    const cs = getComputedStyle(scr);
    const availW = scr.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = scr.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const landscape = scr.clientWidth > scr.clientHeight;
    scr.classList.toggle("wide", landscape);
    if (landscape) scr.style.setProperty("--sq", `${Math.floor(Math.min(availH, availW * 0.56))}px`);
    else scr.style.removeProperty("--sq");
    const s = Math.floor(Math.min(el.stage.clientWidth, el.stage.clientHeight));
    if (s > 0) {
      board.style.width = board.style.height = `${s}px`;
    }
    schedulePreview();
  }

  // ── preview: how the player will look in the game (sky, a cloud, the baked drawing) ──
  let previewTimer = null;
  function schedulePreview() {
    if (!el.preview) return;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(drawPreview, 250);
  }
  function drawPreview() {
    const cv = el.preview;
    const r = cv.getBoundingClientRect();
    if (r.width < 4) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext("2d");
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#5b8def");
    sky.addColorStop(1, "#bfe3ff");
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);
    // a cloud to stand on
    const cy = H * 0.86, cw = Math.min(W * 0.7, H * 2.2);
    c.fillStyle = "#ffffff";
    for (const [dx, dy, rr] of [[-0.32, 0.02, 0.2], [-0.1, -0.06, 0.26], [0.14, -0.03, 0.23], [0.34, 0.03, 0.17]]) {
      c.beginPath(); c.arc(W / 2 + dx * cw, cy + dy * cw, rr * cw * 0.55, 0, TAU); c.fill();
    }
    c.fillRect(W / 2 - cw * 0.42, cy, cw * 0.84, H - cy);
    c.fillStyle = "rgba(255,255,255,0.9)";
    c.font = `${Math.round(11 * dpr)}px ${FONT}`;
    c.textAlign = "left";
    c.fillText("In the game", 8 * dpr, 15 * dpr);
    const baked = box ? bakeDrawing(g.getImageData(0, 0, N, N), body, ball, paper) : null;
    if (!baked) {
      c.fillStyle = "rgba(255,255,255,0.85)";
      c.font = `${Math.round(14 * dpr)}px ${FONT}`;
      c.textAlign = "center";
      c.fillText("Your player shows here", W / 2, H * 0.45);
      return;
    }
    const hb = baked.hitbox, bw = baked.width, bh = baked.height;
    const feetY = cy - H * 0.04;
    const maxH = feetY - H * 0.08;
    const k = Math.min(maxH / (hb.h * bh), (W * 0.5) / (hb.w * bw));
    const x0 = W / 2 - (hb.x + hb.w / 2) * bw * k, y0 = feetY - (hb.y + hb.h) * bh * k;
    c.save();
    if (hb.ball) {
      c.beginPath();
      c.arc(x0 + (hb.x + hb.w / 2) * bw * k, y0 + (hb.y + hb.h / 2) * bh * k, (hb.w * bw * k) / 2, 0, TAU);
      c.clip();
    }
    c.imageSmoothingQuality = "high";
    c.drawImage(baked.canvas, x0, y0, bw * k, bh * k);
    c.restore();
  }

  let noteTimer = null;
  function note(text, sticky) {
    clearTimeout(noteTimer);
    el.note.textContent = text || "";
    if (text && !sticky) noteTimer = setTimeout(() => (el.note.textContent = ""), 4000);
  }

  return {
    /** Start the screen from a saved state ({ png?, body, ball, ballManual, tool, color, size }) or an <img> to trace. */
    async open(state = {}, fallbackImg = null) {
      active = null;
      undo.length = 0;
      undoBytes = 0;
      showConfirm(false);
      g.clearRect(0, 0, N, N);
      tool = ["pen", "crayon", "fill", "eraser"].includes(state.tool) ? state.tool : "pen";
      drawTool = tool;
      color = COLORS.some(([c]) => c === state.color) ? state.color : COLORS[0][0];
      sizeIdx = [0, 1, 2].includes(state.size) ? state.size : 1;
      body = state.body === "ball" ? "ball" : "box";
      paper = state.paper !== false;
      const b = state.ball;
      ball = b && [b.cx, b.cy, b.r].every(Number.isFinite) && b.r > 0 ? { cx: b.cx, cy: b.cy, r: b.r } : null;
      ballManual = !!(state.ballManual && ball);
      box = null;
      note("");
      layout();
      renderControls();
      drawOverlay();
      let im = null;
      if (typeof state.png === "string" && state.png.startsWith("data:image/png")) {
        locked = true;
        im = await new Promise((res) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = () => res(null);
          i.src = state.png;
        });
        locked = false;
        if (im) g.drawImage(im, 0, 0, N, N);
      } else if (fallbackImg && fallbackImg.naturalWidth > 0) {
        // no local copy (another browser / storage cleared): start from the uploaded picture,
        // feet on the guide line, centred
        const iw = fallbackImg.naturalWidth, ih = fallbackImg.naturalHeight;
        const k = Math.min(1, (N * 0.86) / ih, (N * 0.9) / iw);
        g.drawImage(fallbackImg, (N - iw * k) / 2, N * 0.9 - ih * k + HALO * k, iw * k, ih * k);
        ball = null;
        ballManual = false;
      }
      const data = g.getImageData(0, 0, N, N).data;
      box = drawnBox(data);
      if (body === "ball" && !ballManual) ball = fitBallTo(data, box);
      renderControls();
      drawOverlay();
    },
    /** Everything needed to pick up where they left off (png = null when blank). */
    state() {
      return {
        png: box ? art.toDataURL("image/png") : null,
        body,
        paper,
        ball: ball && { cx: Math.round(ball.cx * 10) / 10, cy: Math.round(ball.cy * 10) / 10, r: Math.round(ball.r * 10) / 10 },
        ballManual,
        tool: tool === "ball" ? drawTool : tool,
        color,
        size: sizeIdx,
      };
    },
    bake() {
      return bakeDrawing(g.getImageData(0, 0, N, N), body, ball, paper);
    },
    isBlank: () => !box,
    drawing: () => !!active,
    layout,
    note,
    busy(on) {
      locked = !!on;
      el.done.disabled = el.back.disabled = !!on;
    },
  };
}

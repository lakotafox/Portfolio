// Sky Scramble backdrop art: the painters from the "Sky Scramble Backdrops" picker board
// (claude.ai artifact 9CfM2SDdLfzf9M36kzdDeB), unchanged except for the fire truck and the
// pavement strip at the bottom. Everything is drawn with painter calls in local units; the
// "pixel" style is drawn small and blown up by backdrop.js (chunky pixels, limited palette).
// Street scenes stand on y = 0 and span W units; floating things are centred on (0, 0),
// roughly 180 x 110 units. t is time in seconds (blinks, waves, propellers).
// ---------------------------------------------------------------- helpers
const TAU = Math.PI * 2;
const rnd = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
const mixc = (a, b, t) => a[0] !== '#' ? a : '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const light = (c, t) => mixc(c, '#ffffff', t), dark = (c, t) => mixc(c, '#000000', t);
const alpha = (c, a) => { if (c[0] !== '#') return c; const [r, g, b] = rgb(c); return `rgba(${r},${g},${b},${a})`; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (x) => x * x * (3 - 2 * x);

// ---------------------------------------------------------------- the two drawing styles
// Each object below is built only from these painter calls, so it can be drawn in either style.
// Pixel draws at low resolution and is blown up (chunky pixels, a limited palette) like the game's sky;
// Crayon matches the players.
const base = {
  circle(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); },
  ellipse(ctx, x, y, rx, ry, rot = 0) { ctx.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); },
  poly(ctx, pts) { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); },
  rect(ctx, x, y, w, h) { ctx.rect(x, y, w, h); },
  detail(ctx, build, color) { ctx.beginPath(); build(); ctx.fillStyle = color; ctx.fill(); },
  line(ctx, pts, color, w) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); },
  // text is drawn after the pixel pass so it stays readable
  text(ctx, s, x, y, size, color) {
    const m = ctx.getTransform(), font = this.font;
    this.overlays.push((t) => { t.save(); t.setTransform(t.getTransform().multiply(this.base.inverse().multiply(m))); t.font = `400 ${size}px ${font}`; t.textAlign = 'center'; t.textBaseline = 'middle'; t.fillStyle = color; t.fillText(s, x, y); t.restore(); });
  },
};
const STYLES = {
  pixel: {
    id: 'pixel', post: 4, font: '"Press Start 2P", monospace',
    fill(ctx, build, color, o = {}) {
      const bb = o.bb; ctx.save(); ctx.globalAlpha = o.alpha ?? 1;
      ctx.beginPath(); build();
      if (o.lw !== 0) { ctx.lineWidth = o.lw ?? 5; ctx.lineJoin = 'round'; ctx.strokeStyle = o.outline || dark(color, 0.55); ctx.stroke(); }
      ctx.fillStyle = color; ctx.fill();
      if (bb && o.shade !== 'none') {
        ctx.save(); ctx.clip(); ctx.beginPath();
        if (o.shade === 'side') ctx.rect(bb.x + (bb.w || bb.r * 2) * 0.22, bb.y - bb.r * 3, bb.r * 3, bb.r * 6);
        else ctx.ellipse(bb.x + bb.r * 0.45, bb.y + bb.r * 0.8, bb.r * 1.3, bb.r * 0.75, 0, 0, TAU);
        ctx.fillStyle = dark(color, 0.17); ctx.fill(); ctx.restore();
      }
      if (o.gloss && bb) { ctx.fillStyle = light(color, 0.55); ctx.fillRect(bb.x - bb.r * 0.55, bb.y - bb.r * 0.55, bb.r * 0.28, bb.r * 0.2); }
      ctx.restore();
    },
  },
  crayon: {
    id: 'crayon', post: 0, font: '"Gochi Hand", "Comic Sans MS", cursive',
    circle(ctx, x, y, r) { const n = Math.max(14, (r * 0.9) | 0); for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, rr = r * (1 + (this.R() - 0.5) * 0.08); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); },
    ellipse(ctx, x, y, rx, ry, rot = 0) { const n = 18; for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, j = 1 + (this.R() - 0.5) * 0.1; const ex = Math.cos(a) * rx * j, ey = Math.sin(a) * ry * j; const px = x + ex * Math.cos(rot) - ey * Math.sin(rot), py = y + ex * Math.sin(rot) + ey * Math.cos(rot); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); },
    rect(ctx, x, y, w, h) { const j = () => (this.R() - 0.5) * 1.6; ctx.moveTo(x + j(), y + j()); ctx.lineTo(x + w + j(), y + j()); ctx.lineTo(x + w + j(), y + h + j()); ctx.lineTo(x + j(), y + h + j()); ctx.closePath(); },
    fill(ctx, build, color, o = {}) {
      const bb = o.bb || { x: 0, y: 0, r: 10 }; const { x, y, r } = bb; ctx.save(); ctx.globalAlpha = o.alpha ?? 1;
      ctx.strokeStyle = o.outline || dark(color, 0.5); ctx.lineJoin = 'round';
      if (o.lw !== 0) for (let k = 0; k < 2; k++) { ctx.lineWidth = Math.max(2.2, Math.min(4, r * 0.08)) - k * 0.7; ctx.beginPath(); build(); ctx.stroke(); }
      ctx.beginPath(); build(); ctx.fillStyle = light(color, 0.1); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = alpha(dark(color, 0.22), 0.5); ctx.lineWidth = 1.3;
      const span = r * 3 + 20; for (let d = -span; d < span; d += 4.5) { ctx.beginPath(); ctx.moveTo(x + d - span, y + span + (this.R() - 0.5) * 3); ctx.lineTo(x + d + span, y - span); ctx.stroke(); }
      ctx.restore(); ctx.restore();
    },
    detail(ctx, build, color) { ctx.beginPath(); build(); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = alpha('#2b2b38', 0.6); ctx.stroke(); },
    line(ctx, pts, color, w) { for (let k = 0; k < 2; k++) { ctx.beginPath(); pts.forEach(([px, py], i) => { const jx = px + (this.R() - 0.5) * 1.6, jy = py + (this.R() - 0.5) * 1.6; i ? ctx.lineTo(jx, jy) : ctx.moveTo(jx, jy); }); ctx.strokeStyle = color; ctx.lineWidth = w * (k ? 0.6 : 1); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); } },
  },
};
function painter(style, seed) { const P = Object.assign(Object.create(base), style); P.R = rnd(seed); P.overlays = []; return P; }

// shape helpers (all take the context and painter first)
function box(c, P, x, y, w, h, col, o = {}) { P.fill(c, () => P.rect(c, x, y, w, h), col, { bb: { x: x + w / 2, y: y + h / 2, r: Math.max(w, h) / 2, w }, shade: 'side', ...o }); }
function disc(c, P, x, y, r, col, o = {}) { P.fill(c, () => P.circle(c, x, y, r), col, { bb: { x, y, r }, ...o }); }
function oval(c, P, x, y, rx, ry, col, o = {}) { P.fill(c, () => P.ellipse(c, x, y, rx, ry, o.rot || 0), col, { bb: { x, y, r: Math.max(rx, ry) }, ...o }); }
function shape(c, P, pts, col, o = {}) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  P.fill(c, () => P.poly(c, pts), col, { bb: { x: (x0 + x1) / 2, y: (y0 + y1) / 2, r: Math.max(x1 - x0, y1 - y0) / 2, w: x1 - x0 }, ...o });
}
function dot(c, P, x, y, r, col) { P.detail(c, () => P.circle(c, x, y, r), col); }
function sq(c, P, x, y, w, h, col) { P.detail(c, () => base.rect(c, x, y, w, h), col); }
function ln(c, P, pts, col, w) { P.line(c, pts, col, w); }
function at(c, x, y, s, fn, rot = 0) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(s, s); fn(); c.restore(); }
const blink = (t, rate = 1.4, off = 0) => Math.floor(t * rate + off) % 2 === 0;
// a quadratic sag between two points, as a point list
const sag = (x0, y0, x1, y1, d, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * d]; });

// ---------------------------------------------------------------- street level scenes
// Drawn across the full width, standing on y = 0 (the ground line), in local units.
function cityBrick(c, P, W, t) {
  const R = rnd(11), cols = ['#b5533c', '#c96f4a', '#9c4a3a', '#d08a5c'], roofs = [];
  for (let x = -6, i = 0; x < W + 10; i++) {
    const w = (34 + R() * 24) | 0, h = (58 + R() * 58) | 0, col = cols[i % 4];
    box(c, P, x, -h, w, h, col);
    for (let yy = -h + 10; yy < -14; yy += 15) for (let xx = x + 6; xx < x + w - 9; xx += 11) sq(c, P, xx, yy, 6, 8, R() < 0.32 ? '#ffe08a' : '#5b2e2a');
    sq(c, P, x - 2, -h - 4, w + 4, 5, dark(col, 0.35));
    roofs.push({ x, w, h }); x += w + 3;
  }
  // wooden water tower on the second roof
  const a = roofs[1], tx = a.x + a.w / 2, ty = -a.h - 4;
  for (const dx of [-10, 10]) ln(c, P, [[tx + dx, ty], [tx + dx * 0.8, ty - 16]], '#4a3324', 3);
  box(c, P, tx - 13, ty - 34, 26, 19, '#8a5a3a');
  for (const yy of [-29, -21]) ln(c, P, [[tx - 13, ty + yy], [tx + 13, ty + yy]], '#4a3324', 1.5);
  shape(c, P, [[tx - 16, ty - 34], [tx, ty - 46], [tx + 16, ty - 34]], '#6b4530');
  // TV aerial with a pigeon on it
  const b = roofs[3], ax = b.x + b.w * 0.65, ay = -b.h - 4;
  ln(c, P, [[ax, ay], [ax, ay - 30]], '#3b3f4a', 2); for (const k of [0, 7, 14]) ln(c, P, [[ax - 10 + k * 0.3, ay - 28 + k], [ax + 10 - k * 0.3, ay - 28 + k]], '#3b3f4a', 1.6);
  oval(c, P, ax + 1, ay - 35, 6, 4.5, '#9aa3b5', { lw: 2 }); disc(c, P, ax + 6, ay - 39, 3.4, '#7f8899', { lw: 1.5 }); dot(c, P, ax + 7, ay - 40, 0.9, '#111'); sq(c, P, ax + 9, ay - 39.5, 2.5, 1.4, '#e0a040');
  // a washing line between two roofs
  const d = roofs[4], e = roofs[5];
  if (d && e) {
    const x0 = d.x + d.w - 4, y0 = -d.h - 12, x1 = e.x + 4, y1 = -e.h - 12;
    ln(c, P, [[x0, -d.h - 4], [x0, y0]], '#3b3f4a', 1.6); ln(c, P, [[x1, -e.h - 4], [x1, y1]], '#3b3f4a', 1.6);
    const pts = sag(x0, y0, x1, y1, 7); ln(c, P, pts, '#f4f1ea', 1.2);
    [['#5ab0ff', 0.3], ['#ffd34d', 0.55], ['#ff6b8a', 0.78]].forEach(([col, u]) => { const [px, py] = pts[Math.round(u * 8)]; box(c, P, px - 4, py, 8, 9, col, { lw: 1.5, shade: 'none' }); });
  }
}
function cityGlass(c, P, W, t) {
  const R = rnd(23), cols = ['#6f8fb8', '#8fb0d6', '#5a7398', '#7d9cc4'], towers = [];
  for (let x = -6, i = 0; x < W + 10; i++) {
    const w = (40 + R() * 22) | 0, h = (80 + R() * 72) | 0, col = cols[i % 4];
    box(c, P, x, -h, w, h, col);
    for (let yy = -h + 8; yy < -10; yy += 9) sq(c, P, x + 5, yy, w - 10, 2, alpha('#ffffff', 0.35));
    for (let k = 0; k < 4; k++) { const yy = -h + 12 + ((R() * (h - 30)) | 0); sq(c, P, x + 6 + ((R() * (w - 18)) | 0), yy, 6, 5, '#fff2b0'); }
    towers.push({ x, w, h }); x += w + 4;
  }
  const top = towers.reduce((m, v) => (v.h > m.h ? v : m));
  ln(c, P, [[top.x + top.w / 2, -top.h], [top.x + top.w / 2, -top.h - 18]], '#3b3f4a', 2);
  dot(c, P, top.x + top.w / 2, -top.h - 19, 3, blink(t, 1.2) ? '#ff3b3b' : '#6b2a2a');
  // a tower crane with its hook down
  const k = towers[2], cx = k.x + k.w * 0.4, cy = -k.h;
  ln(c, P, [[cx, cy], [cx, cy - 46]], '#f2b51b', 4); for (let yy = 0; yy < 44; yy += 8) ln(c, P, [[cx - 3, cy - yy], [cx + 3, cy - yy - 8]], '#c48f10', 1.4);
  ln(c, P, [[cx - 22, cy - 46], [cx + 60, cy - 46]], '#f2b51b', 4); box(c, P, cx - 26, cy - 50, 9, 9, '#9aa3b5', { lw: 2 });
  ln(c, P, [[cx + 48, cy - 44], [cx + 48, cy - 20]], '#3b3f4a', 1.2); ln(c, P, [[cx + 44, cy - 20], [cx + 48, cy - 16], [cx + 52, cy - 20]], '#3b3f4a', 2);
}
function citySeaside(c, P, W, t) {
  const R = rnd(31), cols = ['#f4a6b8', '#a8e0c8', '#fbe08a', '#a6cdf4', '#f6c39a'];
  let x = -4, i = 0;
  while (x < W - 70) {
    const w = (30 + R() * 10) | 0, h = (38 + R() * 20) | 0, col = cols[i % cols.length];
    box(c, P, x, -h, w, h, col);
    shape(c, P, [[x - 3, -h], [x + w / 2, -h - 18], [x + w + 3, -h]], i % 2 ? '#c4574a' : '#5a6f9a');
    sq(c, P, x + w / 2 - 4, -16, 8, 16, dark(col, 0.45)); sq(c, P, x + 5, -h + 9, 7, 7, '#ffffff'); sq(c, P, x + w - 12, -h + 9, 7, 7, '#ffffff');
    x += w + 3; i++;
  }
  // lighthouse with a sweeping beam
  const lx = W - 34, lh = 110;
  const sweep = Math.sin(t * 0.9) * 0.6;
  c.save(); c.globalAlpha = 0.35; c.beginPath(); c.moveTo(lx, -lh + 8); c.lineTo(lx + Math.cos(Math.PI + sweep) * 160, -lh + 8 + Math.sin(Math.PI + sweep) * 160 - 12); c.lineTo(lx + Math.cos(Math.PI + sweep) * 160, -lh + 8 + Math.sin(Math.PI + sweep) * 160 + 12); c.closePath(); c.fillStyle = '#fff6b0'; c.fill(); c.restore();
  shape(c, P, [[lx - 14, 0], [lx - 9, -lh], [lx + 9, -lh], [lx + 14, 0]], '#ffffff');
  for (let k = 0; k < 3; k++) { const y0 = -18 - k * 32, y1 = y0 - 14, w0 = 14 - (k * 32 + 18) / lh * 5, w1 = 14 - (k * 32 + 32) / lh * 5; shape(c, P, [[lx - w0, y0], [lx - w1, y1], [lx + w1, y1], [lx + w0, y0]], '#e2453c', { lw: 1.5 }); }
  box(c, P, lx - 11, -lh - 14, 22, 14, '#fff3a0', { lw: 3 }); shape(c, P, [[lx - 13, -lh - 14], [lx, -lh - 26], [lx + 13, -lh - 14]], '#3b3f4a');
}
function treesPark(c, P, W, t) {
  const R = rnd(5), xs = []; for (let x = 20; x < W; x += 70 + R() * 40) xs.push(x);
  xs.forEach((x, i) => {
    const h = 34 + R() * 16; box(c, P, x - 4, -h, 8, h, '#7a4a2a', { lw: 3 });
    const g = ['#4caf50', '#43a047', '#5cbf60'][i % 3];
    disc(c, P, x - 14, -h - 6, 17, g); disc(c, P, x + 14, -h - 4, 16, g); disc(c, P, x, -h - 20, 20, g);
  });
  // a kite stuck in the second tree, tail hanging
  const kx = xs[1] + 8, ky = -66;
  at(c, kx, ky, 1, () => {
    shape(c, P, [[0, -14], [10, 0], [0, 0]], '#e8424f', { lw: 2 }); shape(c, P, [[0, -14], [0, 0], [-10, 0]], '#ffd34d', { lw: 2 });
    shape(c, P, [[-10, 0], [0, 0], [0, 18]], '#e8424f', { lw: 2 }); shape(c, P, [[0, 0], [10, 0], [0, 18]], '#ffd34d', { lw: 2 });
    const tail = [[0, 18], [4, 26], [-2, 34], [3, 42], [0, 50]]; ln(c, P, tail, '#3b3f4a', 1.3);
    for (const [bx, by] of tail.slice(1, 4)) { shape(c, P, [[bx - 4, by - 2], [bx, by], [bx - 4, by + 2]], '#5ab0ff', { lw: 1 }); shape(c, P, [[bx + 4, by - 2], [bx, by], [bx + 4, by + 2]], '#5ab0ff', { lw: 1 }); }
  }, 0.3);
}
function treesPines(c, P, W, t) {
  const R = rnd(9);
  for (let x = 10; x < W; x += 34 + R() * 24) {
    if (Math.abs(x - W * 0.42) < 40) continue;
    const h = 40 + R() * 26, g = R() < 0.5 ? '#2f7d4f' : '#3a8f5c';
    box(c, P, x - 3, -10, 6, 10, '#6b4530', { lw: 2 });
    for (let k = 0; k < 3; k++) { const yb = -8 - k * h * 0.27, w = 20 - k * 5; shape(c, P, [[x - w, yb], [x, yb - h * 0.45], [x + w, yb]], g); }
  }
  // the big oak with a treehouse
  const ox = W * 0.42;
  box(c, P, ox - 7, -60, 14, 60, '#7a4a2a'); disc(c, P, ox - 22, -72, 22, '#4f9a45'); disc(c, P, ox + 22, -70, 20, '#4f9a45'); disc(c, P, ox, -92, 26, '#5cae4f');
  box(c, P, ox - 18, -70, 36, 22, '#c08a52', { lw: 3 }); shape(c, P, [[ox - 22, -70], [ox, -86], [ox + 22, -70]], '#b8453a'); sq(c, P, ox - 5, -64, 9, 10, '#4a2e1c'); sq(c, P, ox + 7, -66, 7, 6, '#ffe08a');
  ln(c, P, [[ox - 14, -48], [ox - 14, 0]], '#8a6a3a', 1.4); ln(c, P, [[ox - 6, -48], [ox - 6, 0]], '#8a6a3a', 1.4);
  for (let y = -42; y < 0; y += 8) ln(c, P, [[ox - 14, y], [ox - 6, y]], '#8a6a3a', 1.6);
}
function treesBlossom(c, P, W, t) {
  const R = rnd(14), xs = []; for (let x = 24; x < W; x += 64 + R() * 34) xs.push(x);
  xs.forEach((x, i) => {
    const h = 30 + R() * 12; box(c, P, x - 4, -h, 8, h, '#6b4036', { lw: 3 }); ln(c, P, [[x, -h + 6], [x + 12, -h - 6]], '#6b4036', 3);
    const g = i % 2 ? '#f6a6c1' : '#f28db2';
    disc(c, P, x - 15, -h - 4, 15, g); disc(c, P, x + 15, -h - 2, 14, g); disc(c, P, x, -h - 18, 18, light(g, 0.15));
    for (let k = 0; k < 6; k++) dot(c, P, x - 18 + R() * 36, -h - 26 + R() * 26, 1.6, '#ffffff');
  });
  const bx = (xs[1] + xs[2]) / 2 || W / 2;
  box(c, P, bx - 18, -14, 36, 4, '#8a5a3a', { lw: 2 }); box(c, P, bx - 18, -22, 36, 4, '#8a5a3a', { lw: 2 });
  for (const dx of [-15, 13]) ln(c, P, [[bx + dx, -10], [bx + dx, 0]], '#3b3f4a', 2);
  for (let k = 0; k < 7; k++) { const px = ((k * 97 + t * 14) % (W + 40)) - 20, py = -96 + ((k * 37 + t * 9) % 90); oval(c, P, px, py, 2.6, 1.6, '#f9b6cc', { lw: 0, shade: 'none', rot: k }); }
}
function streetVan(c, P, W, t) {
  const x = W * 0.58;
  box(c, P, x, -40, 70, 32, '#f7f4ee'); box(c, P, x + 52, -32, 26, 24, '#f7f4ee'); sq(c, P, x + 2, -22, 66, 5, '#ff8fb1');
  sq(c, P, x + 58, -28, 15, 10, '#9fd6f2'); box(c, P, x + 10, -36, 30, 14, '#3b3f4a', { lw: 2, shade: 'none' }); sq(c, P, x + 12, -34, 26, 10, '#ffd9a0');
  for (const wx of [x + 14, x + 62]) { disc(c, P, wx, -6, 7, '#2b2b38'); dot(c, P, wx, -6, 2.4, '#b8c0d0'); }
  shape(c, P, [[x + 26, -42], [x + 34, -60], [x + 42, -42]], '#e0a85a', { lw: 2 }); disc(c, P, x + 34, -64, 7, '#ff8fb1', { lw: 2 }); dot(c, P, x + 34, -72, 2.4, '#e8424f');
  for (const [k, col] of [[0, '#5ab0ff'], [1, '#ffd34d']]) { const kx = x - 16 - k * 16; disc(c, P, kx, -20, 5, '#f2c9a0', { lw: 1.5 }); box(c, P, kx - 5, -15, 10, 15, col, { lw: 1.5 }); }
}
function streetBus(c, P, W, t) {
  const x = W * 0.34;
  box(c, P, x, -44, 104, 36, '#d93a3a'); for (let k = 0; k < 6; k++) sq(c, P, x + 6 + k * 16, -38, 12, 11, '#bfe4f7'); sq(c, P, x + 2, -22, 100, 3, '#ffd34d');
  disc(c, P, x + 26, -6, 8, '#2b2b38'); disc(c, P, x + 82, -6, 8, '#2b2b38');
  for (let k = 0; k < 3; k++) dot(c, P, x + 12 + k * 32, -31, 2.6, '#f2c9a0');
  const sx = x + 140; ln(c, P, [[sx, 0], [sx, -54]], '#5a6170', 3); disc(c, P, sx, -58, 9, '#2f7d4f', { lw: 2 }); sq(c, P, sx - 5, -59, 10, 2, '#ffffff');
}
function streetCat(c, P, W, t, catU = 0.52, boxU = 0.82) {
  ln(c, P, [[0, -12], [W, -12]], '#f4f1ea', 4); ln(c, P, [[0, -26], [W, -26]], '#f4f1ea', 4);
  for (let x = 6; x < W; x += 16) shape(c, P, [[x, 0], [x, -32], [x + 4, -38], [x + 8, -32], [x + 8, 0]], '#f7f4ee', { lw: 2, outline: '#9aa3b5' });
  const cx = W * catU, cy = -38, tail = Math.sin(t * 2) * 4;
  ln(c, P, [[cx + 8, cy + 2], [cx + 14, cy + 6], [cx + 16 + tail, cy + 14]], '#e8913a', 3.2);
  oval(c, P, cx, cy - 3, 9, 8, '#e8913a'); disc(c, P, cx - 4, cy - 14, 7, '#e8913a');
  shape(c, P, [[cx - 10, cy - 18], [cx - 9, cy - 25], [cx - 5, cy - 20]], '#e8913a', { lw: 1.5 }); shape(c, P, [[cx - 3, cy - 20], [cx + 1, cy - 25], [cx + 2, cy - 17]], '#e8913a', { lw: 1.5 });
  dot(c, P, cx - 7, cy - 15, 1, '#1b1b2f'); dot(c, P, cx - 2, cy - 15, 1, '#1b1b2f');
  const mx = W * boxU; ln(c, P, [[mx, 0], [mx, -28]], '#6b4530', 3); box(c, P, mx - 10, -40, 20, 13, '#3d6fd8', { lw: 2 }); sq(c, P, mx + 9, -46, 2, 8, '#e8424f');
}

// ---------------------------------------------------------------- things that float by
// Each draws centred on (0, 0), roughly 180 x 110 units, at time t.
function bird(c, P, x, y, s, body, wing, up, extra) {
  at(c, x, y, s, () => {
    shape(c, P, up ? [[-4, -2], [-14, -16], [4, -4]] : [[-4, 0], [-12, 12], [4, 2]], wing, { lw: 2 });
    oval(c, P, 0, 0, 11, 7, body, { lw: 2 }); disc(c, P, 9, -4, 5, body, { lw: 2 });
    shape(c, P, [[13, -5], [18, -3], [13, -2]], '#e0a040', { lw: 1 }); dot(c, P, 10, -6, 1.1, '#111');
    shape(c, P, up ? [[2, -2], [-6, -18], [8, -4]] : [[2, 0], [-4, 14], [8, 2]], light(wing, 0.15), { lw: 2 });
    if (extra) extra();
  });
}
const birdsSparrows = (c, P, t) => { bird(c, P, -46, 6, 1.5, '#9a6b4a', '#7a5238', blink(t, 3)); bird(c, P, 14, -22, 1.3, '#a77856', '#7a5238', !blink(t, 3)); bird(c, P, 52, 18, 1.1, '#9a6b4a', '#6e4a33', blink(t, 3, 0.5)); };
const birdsPigeon = (c, P, t) => bird(c, P, -6, 0, 2.6, '#9aa3b5', '#7f8899', blink(t, 2.4), () => { sq(c, P, 4, -3, 4, 4, '#6fa58f'); box(c, P, 17, -10, 11, 10, '#e2b06a', { lw: 1.5, outline: '#9a6a30' }); });
const birdsGull = (c, P, t) => at(c, 0, 0, 2.2, () => {
  const up = blink(t, 1.8);
  shape(c, P, up ? [[-6, -2], [-34, -16], [-40, -12], [2, 2]] : [[-6, 0], [-34, 8], [-40, 4], [2, 2]], '#c3cad6', { lw: 2 });
  shape(c, P, up ? [[-34, -16], [-40, -12], [-31, -12]] : [[-34, 8], [-40, 4], [-31, 4]], '#2b2b38', { lw: 0 });
  oval(c, P, 0, 0, 14, 7, '#f7f8fb', { lw: 2 }); disc(c, P, 12, -4, 5.5, '#f7f8fb', { lw: 2 }); dot(c, P, 13, -6, 1.1, '#111');
  shape(c, P, [[16, -5], [23, -3], [16, -1]], '#f2c53a', { lw: 1 }); sq(c, P, 20, -6, 11, 2.4, '#ffd84a');
  shape(c, P, up ? [[4, -2], [22, -18], [26, -14], [10, 2]] : [[4, 0], [22, 10], [26, 6], [10, 2]], '#d5dbe6', { lw: 2 });
});
const kiteDiamond = (c, P, t) => {
  const sw = Math.sin(t * 1.3) * 0.12;
  ln(c, P, [[6, 32], [40, 60], [80, 70]], alpha('#3b3f4a', 0.7), 1.2);
  at(c, 0, -10, 1.6, () => {
    shape(c, P, [[0, -24], [16, 0], [0, 0]], '#e8424f', { lw: 2 }); shape(c, P, [[0, -24], [0, 0], [-16, 0]], '#ffd34d', { lw: 2 });
    shape(c, P, [[-16, 0], [0, 0], [0, 28]], '#e8424f', { lw: 2 }); shape(c, P, [[0, 0], [16, 0], [0, 28]], '#ffd34d', { lw: 2 });
    ln(c, P, [[0, -24], [0, 28]], '#6b4530', 1.2); ln(c, P, [[-16, 0], [16, 0]], '#6b4530', 1.2);
    const tail = [[0, 28], [-6 + sw * 30, 36], [4, 44], [-5 - sw * 30, 52], [2, 60]]; ln(c, P, tail, '#3b3f4a', 1.1);
    tail.slice(1, 4).forEach(([bx, by], k) => { const col = ['#5ab0ff', '#8e5cf0', '#2fb36d'][k]; shape(c, P, [[bx - 5, by - 3], [bx, by], [bx - 5, by + 3]], col, { lw: 1 }); shape(c, P, [[bx + 5, by - 3], [bx, by], [bx + 5, by + 3]], col, { lw: 1 }); });
  }, sw);
};
const kiteBox = (c, P, t) => {
  ln(c, P, [[10, 30], [50, 56], [90, 64]], alpha('#3b3f4a', 0.7), 1.2);
  at(c, 0, 0, 1.5, () => {
    for (const yy of [-26, 8]) { box(c, P, -16, yy, 22, 16, '#3d6fd8', { lw: 2 }); shape(c, P, [[6, yy], [16, yy - 5], [16, yy + 11], [6, yy + 16]], '#2a4fa6', { lw: 2 }); }
    ln(c, P, [[-16, -26], [-16, 24]], '#6b4530', 1.6); ln(c, P, [[6, -26], [6, 24]], '#6b4530', 1.6); ln(c, P, [[16, -31], [16, 19]], '#6b4530', 1.4);
  }, -0.15 + Math.sin(t) * 0.05);
};
const kiteKoi = (c, P, t) => {
  ln(c, P, [[-50, 6], [-90, 40], [-110, 70]], alpha('#3b3f4a', 0.7), 1.2);
  const f = Math.sin(t * 4) * 6;
  at(c, 0, 0, 1.6, () => {
    shape(c, P, [[26, 0], [38, -12 + f], [42, 2], [38, 14 - f]], '#f07b3a', { lw: 2 });
    oval(c, P, 0, 0, 30, 13, '#f07b3a'); oval(c, P, 6, -2, 9, 6, '#ffffff', { lw: 0, shade: 'none' }); oval(c, P, -8, 5, 6, 4, '#ffffff', { lw: 0, shade: 'none' });
    for (let k = 0; k < 4; k++) ln(c, P, [[-4 + k * 7, -6], [-1 + k * 7, -2], [-4 + k * 7, 2]], alpha('#9a3a10', 0.6), 1);
    disc(c, P, -24, 0, 6, '#ffffff', { lw: 2, outline: '#9a3a10' }); dot(c, P, -20, -5, 2.2, '#1b1b2f'); dot(c, P, -19.5, -5.6, 0.7, '#ffffff');
  }, 0.1);
};
const drifterPlane = (c, P, t) => {
  const pts = []; for (let k = 0; k < 26; k++) { const a = k / 26 * TAU * 0.9; pts.push([-80 + k * 3.6 + Math.sin(a) * 22, 20 - Math.cos(a) * 18 + 4]); }
  pts.forEach(([x, y], k) => { if (k % 2 === 0) dot(c, P, x, y, 1.6, alpha('#ffffff', 0.9)); });
  at(c, 24, 0, 1.6, () => {
    shape(c, P, [[-26, 6], [22, -4], [-12, -16]], '#f4f6fb', { lw: 2, outline: '#8a94ad' });
    shape(c, P, [[-26, 6], [22, -4], [-10, 12]], '#dfe4ef', { lw: 2, outline: '#8a94ad' });
    ln(c, P, [[-26, 6], [22, -4]], '#8a94ad', 1.2);
  }, -0.08);
};
const drifterBalloon = (c, P, t) => at(c, 0, Math.sin(t * 1.2) * 3, 1.6, () => {
  ln(c, P, [[0, 28], [5, 36], [-4, 44], [4, 52], [-2, 60]], '#3b3f4a', 1.1);
  oval(c, P, 0, 0, 20, 25, '#e8424f', { gloss: true }); shape(c, P, [[-4, 28], [0, 23], [4, 28]], '#c22f3c', { lw: 1.2 });
  oval(c, P, -7, -10, 4, 7, alpha('#ffffff', 0.7), { lw: 0, shade: 'none', rot: 0.3 });
});
const drifterLeaves = (c, P, t) => {
  [[-60, -10, '#e8913a', 0.4], [-10, 18, '#d9472b', -0.6], [40, -18, '#f2c53a', 1.1], [78, 14, '#c9632e', 2.2]].forEach(([x, y, col, r], k) => at(c, x + Math.sin(t + k) * 6, y + Math.cos(t * 0.8 + k) * 4, 1.6, () => {
    shape(c, P, [[-12, 0], [-4, -6], [8, -5], [13, 0], [8, 5], [-4, 6]], col, { lw: 1.6 }); ln(c, P, [[-14, 0], [12, 0]], dark(col, 0.35), 1);
  }, r + Math.sin(t * 1.5 + k) * 0.3));
};
function envelope(c, P, cx, cy, r, paint, outline) {
  const path = () => { c.moveTo(cx - r * 0.34, cy + r * 1.05); c.lineTo(cx - r * 0.98, cy + r * 0.1); c.arc(cx, cy, r, Math.PI * 0.94, Math.PI * 2.06); c.lineTo(cx + r * 0.34, cy + r * 1.05); c.closePath(); };
  c.save(); c.beginPath(); path(); c.clip(); paint(); c.restore();
  c.beginPath(); path(); c.lineWidth = P.id === 'pixel' ? 5 : 3; c.strokeStyle = outline; c.lineJoin = 'round'; c.stroke();
}
function basket(c, P, cx, by, r, t, who) {
  for (const dx of [-0.34, 0.34]) ln(c, P, [[cx + dx * r, by - r * 0.32], [cx + dx * r * 0.7, by]], '#5a4030', 1.5);
  if (who) who();
  box(c, P, cx - r * 0.26, by, r * 0.52, r * 0.34, '#b07a45', { lw: 3 }); for (let k = 1; k < 4; k++) ln(c, P, [[cx - r * 0.26 + k * r * 0.13, by + 2], [cx - r * 0.26 + k * r * 0.13, by + r * 0.32]], '#8a5a30', 1);
}
const balloonStriped = (c, P, t) => {
  const r = 46, cy = -24, bob = Math.sin(t * 0.9) * 3;
  at(c, 0, bob, 1, () => {
    envelope(c, P, 0, cy, r, () => {
      c.fillStyle = '#f7f4ee'; c.fillRect(-60, -80, 120, 140);
      for (const k of [-2, 0, 2]) sq(c, P, k * 15 - 6, -80, 12, 140, '#e8424f');
      c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(r * 0.4, cy + r * 0.5, r * 1.1, r * 0.7, 0, 0, TAU); c.fill();
    }, '#8a2a2a');
    sq(c, P, -r * 0.36, cy + r * 0.92, r * 0.72, 4, '#c22f3c');
    basket(c, P, 0, cy + r * 1.38, r, t, () => {
      disc(c, P, 4, cy + r * 1.3, 4.5, '#f2c9a0', { lw: 1.5 }); sq(c, P, -1, cy + r * 1.3 - 7, 10, 3, '#3d6fd8');
      const wave = Math.sin(t * 6) * 4; ln(c, P, [[8, cy + r * 1.36], [14, cy + r * 1.2], [16 + wave, cy + r * 1.08]], '#f2c9a0', 2.2);
    });
    for (const dx of [-15, 15]) { ln(c, P, [[dx, cy + r * 1.5], [dx, cy + r * 1.62]], '#5a4030', 1); oval(c, P, dx, cy + r * 1.7, 3.6, 4.2, '#c9a873', { lw: 1.4 }); }
  });
};
const balloonPatch = (c, P, t) => {
  const r = 46, cy = -24, bob = Math.sin(t * 0.8 + 1) * 3, cols = ['#f2c53a', '#5ab0ff', '#2fb36d', '#e8424f', '#8e5cf0', '#ff9f43'];
  at(c, 0, bob, 1, () => {
    envelope(c, P, 0, cy, r, () => {
      let k = 0; for (let y = -80; y < 40; y += 22) for (let x = -60 + ((y / 22) % 2 ? 11 : 0); x < 60; x += 22) { sq(c, P, x, y, 22, 22, cols[(k++ * 7) % cols.length]); }
      c.setLineDash([3, 3]); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2;
      for (let y = -80; y < 40; y += 22) { c.beginPath(); c.moveTo(-60, y); c.lineTo(60, y); c.stroke(); } c.setLineDash([]);
      c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(r * 0.4, cy + r * 0.5, r * 1.1, r * 0.7, 0, 0, TAU); c.fill();
    }, '#4a3a5a');
    basket(c, P, 0, cy + r * 1.38, r, t, () => {
      const hx = -3, hy = cy + r * 1.3; oval(c, P, hx - 6, hy, 2.6, 5, '#7a4a2a', { lw: 1.2, rot: 0.4 }); disc(c, P, hx, hy - 1, 5, '#b07a45', { lw: 1.5 }); oval(c, P, hx + 5, hy - 2, 2.6, 5, '#7a4a2a', { lw: 1.2, rot: -0.4 });
      dot(c, P, hx - 2, hy - 2, 0.9, '#111'); dot(c, P, hx + 2, hy - 2, 0.9, '#111'); dot(c, P, hx, hy + 1, 1.2, '#2b2b38'); sq(c, P, hx - 1, hy + 2.5, 2, 3, '#ff7a9a');
    });
  });
};
const balloonPair = (c, P, t) => {
  const one = (x, y, s, a, b, ph) => at(c, x, y + Math.sin(t * 0.9 + ph) * 3, s, () => {
    envelope(c, P, 0, -24, 46, () => { c.fillStyle = a; c.fillRect(-60, -80, 120, 140); sq(c, P, -60, -30, 120, 14, b); c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(18, -2, 50, 32, 0, 0, TAU); c.fill(); }, dark(a, 0.5));
    basket(c, P, 0, -24 + 46 * 1.38, 46, t);
  });
  one(-44, 10, 0.7, '#2ec4b6', '#f2c53a', 0); one(44, -14, 0.8, '#ff9f43', '#3d6fd8', 1.6);
};
const blimpWhale = (c, P, t) => at(c, 0, Math.sin(t * 0.7) * 2, 1, () => {
  shape(c, P, [[-74, 0], [-100, -16], [-96, -2], [-100, 14]], '#5a7aa8');
  oval(c, P, 0, 0, 80, 30, '#6f8fbf'); oval(c, P, 6, 12, 62, 13, '#c9d8ee', { lw: 0, shade: 'none' });
  shape(c, P, [[-10, 24], [4, 38], [12, 24]], '#5a7aa8', { lw: 2 });
  dot(c, P, 56, -6, 3.4, '#1b1b2f'); dot(c, P, 57, -7.4, 1.1, '#ffffff'); ln(c, P, [[62, 8], [70, 6], [76, 0]], '#1b1b2f', 1.8); dot(c, P, 50, 4, 3, alpha('#ff8fb1', 0.6));
  const sp = (Math.sin(t * 2) + 1) * 2; for (const [dx, dy] of [[-6, -6], [0, -9], [6, -6]]) dot(c, P, 30 + dx * 1.4, -34 + dy - sp, 2.6, '#bfe4f7');
  box(c, P, -14, 30, 30, 9, '#3b3f4a', { lw: 2, shade: 'none' }); for (let k = 0; k < 3; k++) sq(c, P, -10 + k * 9, 32, 5, 4, '#ffe08a');
});
const blimpClassic = (c, P, t) => at(c, 0, Math.sin(t * 0.7 + 1) * 2, 1, () => {
  for (const s of [-1, 1]) shape(c, P, [[-62, s * 6], [-90, s * 26], [-84, s * 4]], '#d64545');
  oval(c, P, 0, 0, 80, 28, '#f2c14e'); sq(c, P, 20, -20, 26, 3, '#fbe3a0');
  box(c, P, -40, -10, 62, 20, '#2b2b38', { lw: 2, shade: 'none' });
  const heart = ['01100110', '11111111', '11111111', '01111110', '00111100', '00011000'];
  heart.forEach((row, j) => [...row].forEach((b, i) => { const on = b === '1' && (blink(t, 2) || (i + j) % 2); sq(c, P, -30 + i * 5.6, -8 + j * 3, 4, 2.4, on && b === '1' ? '#ff5d7a' : '#4a4a5a'); }));
  box(c, P, -10, 26, 24, 8, '#d64545', { lw: 2, shade: 'none' });
});
const blimpAirship = (c, P, t) => at(c, 0, Math.sin(t * 0.6) * 2, 1, () => {
  for (const s of [-1, 1]) shape(c, P, [[-66, s * 4], [-92, s * 24], [-80, s * 2]], '#7a5232');
  oval(c, P, 0, 0, 86, 24, '#9b6b43');
  for (let k = -3; k <= 3; k++) ln(c, P, [[k * 22, -22 + Math.abs(k) * 2], [k * 22, 22 - Math.abs(k) * 2]], alpha('#4a2e1c', 0.6), 1.4);
  for (const dx of [-16, 16]) ln(c, P, [[dx, 20], [dx * 0.8, 32]], '#4a2e1c', 1.2);
  box(c, P, -22, 32, 44, 12, '#c9a24a', { lw: 2.5 }); for (let k = 0; k < 4; k++) disc(c, P, -15 + k * 10, 38, 2.6, '#bfe4f7', { lw: 1 });
  const a = t * 9; ln(c, P, [[-26, 38], [-30, 38]], '#4a2e1c', 2); ln(c, P, [[-31, 38 + Math.sin(a) * 9], [-31, 38 - Math.sin(a) * 9]], '#3b3f4a', 2.4);
});
const bannerPlane = (c, P, t, text) => {
  const w = Math.max(80, (text || 'GO GO GO!').length * 11 + 22), wv = Math.sin(t * 5) * 2;
  ln(c, P, [[-30, 2], [-44, 4]], '#3b3f4a', 1);
  const bx = -44 - w;
  P.fill(c, () => P.poly(c, [[bx, -11 + wv], [bx + w * 0.5, -11 - wv], [bx + w, -11], [bx + w, 15], [bx + w * 0.5, 15 - wv], [bx, 15 + wv]]), '#fbf6e6', { bb: { x: bx + w / 2, y: 2, r: w / 2, w }, shade: 'none', lw: 3, outline: '#8a7a5a' });
  P.text(c, (text || 'GO GO GO!').toUpperCase(), bx + w / 2, 3, 11, '#d93a3a');
  at(c, 0, 0, 1.3, () => {
    shape(c, P, [[-24, -2], [16, -6], [24, 0], [16, 6], [-24, 3]], '#e8424f'); shape(c, P, [[-26, 0], [-34, -14], [-26, -12], [-20, -2]], '#c22f3c', { lw: 2 });
    box(c, P, -6, -16, 20, 4, '#f2c53a', { lw: 2, shade: 'none' }); box(c, P, -6, 6, 20, 4, '#f2c53a', { lw: 2, shade: 'none' });
    ln(c, P, [[-2, -12], [-2, 6]], '#5a4030', 1.2); ln(c, P, [[10, -12], [10, 6]], '#5a4030', 1.2);
    disc(c, P, 2, -6, 3.4, '#6b4530', { lw: 1.4 }); oval(c, P, 26, 0, 1.8, 10 * Math.abs(Math.cos(t * 20)) + 2, '#5a5f6a', { lw: 0, shade: 'none' });
    disc(c, P, 8, 10, 2.6, '#2b2b38', { lw: 1 });
  });
};
const bannerSeaplane = (c, P, t) => at(c, 0, 0, 1.6, () => {
  for (const dx of [-10, 6]) { ln(c, P, [[dx, 6], [dx - 2, 14]], '#5a5f6a', 1.2); }
  oval(c, P, -2, 16, 24, 3.6, '#f7f4ee', { lw: 2 });
  shape(c, P, [[-28, 0], [18, -4], [26, 1], [18, 6], [-28, 3]], '#3d6fd8'); shape(c, P, [[-30, 1], [-38, -12], [-30, -10], [-24, -1]], '#2a4fa6', { lw: 2 });
  box(c, P, -12, -9, 30, 4, '#f7f4ee', { lw: 2, shade: 'none' }); sq(c, P, 8, -3, 8, 4, '#bfe4f7'); oval(c, P, 28, 1, 1.6, 9 * Math.abs(Math.cos(t * 18)) + 2, '#5a5f6a', { lw: 0, shade: 'none' });
}, -0.04);
const bannerHeart = (c, P, t) => {
  const n = 34; for (let k = 0; k < n; k++) { const a = k / n * TAU; const x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); dot(c, P, -40 + x * 3.2, y * 3 - 4, 3 + (k % 3) * 0.6, alpha('#ffffff', 0.85)); }
  at(c, 52, 22, 1.2, () => {
    shape(c, P, [[-20, -1], [14, -4], [20, 0], [14, 4], [-20, 2]], '#f2c53a'); shape(c, P, [[-22, 0], [-28, -10], [-21, -8], [-16, -1]], '#d69a20', { lw: 2 });
    box(c, P, -8, -3, 22, 4, '#e8424f', { lw: 2, shade: 'none' }); disc(c, P, 4, -6, 3, '#f2c9a0', { lw: 1 });
  }, -0.5);
};
const copterNews = (c, P, t) => at(c, 0, Math.sin(t * 2) * 2, 1.5, () => {
  ln(c, P, [[-46, -4], [-14, -2]], '#c22f3c', 5); disc(c, P, -48, -4, 5 + Math.abs(Math.sin(t * 25)) * 2, alpha('#5a5f6a', 0.7), { lw: 0, shade: 'none' });
  oval(c, P, 0, 0, 20, 13, '#e8424f'); oval(c, P, 9, -3, 9, 8, '#bfe4f7', { lw: 2 }); sq(c, P, -14, 1, 20, 3, '#ffffff');
  ln(c, P, [[-10, 13], [-12, 18]], '#3b3f4a', 1.4); ln(c, P, [[8, 13], [10, 18]], '#3b3f4a', 1.4); ln(c, P, [[-18, 18], [18, 18]], '#3b3f4a', 2);
  ln(c, P, [[0, -13], [0, -17]], '#3b3f4a', 2); const r = 34 * Math.abs(Math.cos(t * 30)) + 8; ln(c, P, [[-r, -18], [r, -18]], '#3b3f4a', 2.2);
  ln(c, P, [[-6, -12], [-10, -24]], '#3b3f4a', 1); dot(c, P, -10, -25, 1.5, '#ff3b3b');
});
const copterRescue = (c, P, t) => at(c, 0, Math.sin(t * 2 + 1) * 2, 1.4, () => {
  const sw = Math.sin(t * 1.6) * 4;
  ln(c, P, [[-4, 12], [-6 + sw, 46]], '#8a6a3a', 1.2); ln(c, P, [[4, 12], [2 + sw, 46]], '#8a6a3a', 1.2);
  for (let k = 0; k < 4; k++) ln(c, P, [[-4.5 + sw * k / 4, 20 + k * 8], [3.5 + sw * k / 4, 20 + k * 8]], '#8a6a3a', 1.4);
  disc(c, P, sw * 0.8, 38, 3, '#f2c9a0', { lw: 1 }); box(c, P, -3 + sw * 0.8, 41, 6, 7, '#2fb36d', { lw: 1 });
  ln(c, P, [[-46, -4], [-14, -2]], '#e0751a', 5); disc(c, P, -48, -4, 5, alpha('#5a5f6a', 0.7), { lw: 0, shade: 'none' });
  oval(c, P, 0, 0, 20, 13, '#ff8a1f'); oval(c, P, 9, -3, 9, 8, '#bfe4f7', { lw: 2 }); sq(c, P, -10, -2, 3, 8, '#ffffff'); sq(c, P, -13, 1, 9, 3, '#ffffff');
  ln(c, P, [[0, -13], [0, -17]], '#3b3f4a', 2); const r = 34 * Math.abs(Math.cos(t * 30)) + 8; ln(c, P, [[-r, -18], [r, -18]], '#3b3f4a', 2.2);
});
const copterSeeds = (c, P, t) => {
  [[-52, -12, 0], [10, 14, 2], [58, -20, 4]].forEach(([x, y, ph]) => at(c, x, y + Math.sin(t * 1.5 + ph) * 4, 1.6, () => {
    shape(c, P, [[0, 0], [8, -22], [14, -26], [12, -8]], '#d8b46a', { lw: 1.6 }); ln(c, P, [[1, -1], [10, -20]], alpha('#8a6a3a', 0.6), 1);
    oval(c, P, 0, 2, 4.6, 3.6, '#9a6b3a', { lw: 1.4 });
  }, t * 4 + ph));
};
const jetContrail = (c, P, t) => {
  for (const dy of [-3, 3]) for (let k = 0; k < 14; k++) dot(c, P, -100 + k * 7.5, dy + Math.sin(k) * 0.6, 2.2 + k * 0.08, alpha('#ffffff', 0.15 + k / 14 * 0.7));
  at(c, 22, 0, 1.2, () => {
    shape(c, P, [[-18, -2], [16, -3], [22, 0], [16, 3], [-18, 2]], '#eef2f8', { lw: 2 }); shape(c, P, [[-2, 0], [-10, 12], [-4, 12], [6, 1]], '#c9d2e0', { lw: 1.6 });
    shape(c, P, [[-16, -1], [-22, -10], [-17, -10], [-11, -2]], '#c9d2e0', { lw: 1.6 });
  });
};
const jetCross = (c, P, t) => {
  for (const [s, ph] of [[1, 0], [-1, 1]]) {
    for (let k = 0; k < 18; k++) dot(c, P, -80 + k * 8.5, s * (-34 + k * 4), 2 + k * 0.06, alpha('#ffffff', 0.12 + k / 18 * 0.7));
    at(c, 76, s * 38, 0.9, () => { shape(c, P, [[-16, -2], [14, -3], [20, 0], [14, 3], [-16, 2]], '#eef2f8', { lw: 2 }); shape(c, P, [[-2, 0], [-8, 10], [-3, 10], [6, 1]], '#c9d2e0', { lw: 1.6 }); }, s * 0.45);
  }
};
const jetJumbo = (c, P, t) => at(c, 0, 0, 1.25, () => {
  shape(c, P, [[-10, 2], [-34, 26], [-24, 27], [14, 4]], '#c9d2e0', { lw: 2 });
  shape(c, P, [[-58, -4], [-72, -26], [-62, -26], [-48, -6]], '#3d6fd8', { lw: 2 });
  P.fill(c, () => { c.moveTo(-62, -4); c.lineTo(48, -6); c.quadraticCurveTo(66, -4, 66, 2); c.quadraticCurveTo(62, 8, 48, 8); c.lineTo(-62, 6); c.closePath(); }, '#f7f8fb', { bb: { x: 0, y: 1, r: 64, w: 128 }, shade: 'round' });
  shape(c, P, [[-8, 4], [-30, 30], [-20, 31], [16, 6]], '#dfe4ef', { lw: 2 }); oval(c, P, -12, 18, 7, 3.6, '#9aa3b5', { lw: 1.4 });
  sq(c, P, -56, 1, 112, 2, '#3d6fd8');
  for (let k = 0; k < 12; k++) sq(c, P, -46 + k * 8, -3, 3.5, 3.5, k === 7 ? '#f2c9a0' : '#5d6f9c');
  const wv = blink(t, 3) ? -2 : 0; sq(c, P, 12 + 3.4, -6 + wv, 1.4, 3, '#f2c9a0');
  sq(c, P, 54, -3, 6, 2.6, '#2b2b38');
});
const goose = (c, P, x, y, s, up) => at(c, x, y, s, () => {
  shape(c, P, up ? [[-4, -1], [-10, -14], [4, -2]] : [[-4, 0], [-8, 10], [4, 1]], '#5a5048', { lw: 1.6 });
  oval(c, P, 0, 0, 10, 4.6, '#8a7a6a', { lw: 1.6 }); ln(c, P, [[8, -1], [17, -4]], '#1b1b1f', 2.6); dot(c, P, 15, -4, 1.2, '#ffffff'); shape(c, P, [[18, -5], [22, -4], [18, -3]], '#2b2b2f', { lw: 0 });
});
const flockGeese = (c, P, t) => {
  for (let k = -3; k <= 3; k++) goose(c, P, 40 - Math.abs(k) * 22, k * 16, 1.3, blink(t, 2.2, Math.abs(k) * 0.3));
  goose(c, P, -74 + Math.sin(t * 2) * 4, 42, 1.1, blink(t, 3.2));
};
const flockBats = (c, P, t) => {
  [[-50, -10, 1.6, 0], [10, 14, 1.3, 0.4], [52, -22, 1.5, 0.8], [70, 26, 1.1, 1.2]].forEach(([x, y, s, ph]) => at(c, x, y + Math.sin(t * 3 + ph) * 3, s, () => {
    const up = blink(t, 4, ph);
    for (const sd of [-1, 1]) shape(c, P, up ? [[0, 0], [sd * 8, -12], [sd * 14, -10], [sd * 18, -14], [sd * 18, -4], [sd * 10, 2]] : [[0, 0], [sd * 8, 4], [sd * 13, 2], [sd * 18, 6], [sd * 16, -2], [sd * 8, -3]], '#3e3554', { lw: 1.5 });
    disc(c, P, 0, 0, 5.4, '#4a4066', { lw: 1.5 }); shape(c, P, [[-4, -3], [-3, -9], [-1, -4]], '#4a4066', { lw: 1 }); shape(c, P, [[1, -4], [3, -9], [4, -3]], '#4a4066', { lw: 1 });
    dot(c, P, -2, -1, 1.1, '#ffffff'); dot(c, P, 2, -1, 1.1, '#ffffff');
  }));
};
const flockLanterns = (c, P, t) => {
  [[-56, 10, 1.4, 0], [-4, -16, 1.6, 1], [46, 18, 1.2, 2], [76, -24, 1, 3]].forEach(([x, y, s, ph]) => at(c, x, y - ((t * 4 + ph * 9) % 18), s, () => {
    disc(c, P, 0, 0, 16, alpha('#ffcf6a', 0.25), { lw: 0, shade: 'none' });
    shape(c, P, [[-7, -10], [7, -10], [9, 9], [-9, 9]], '#f4a340', { outline: '#9a5a1a', lw: 1.6 });
    dot(c, P, 0, 7, 2 + Math.sin(t * 9 + ph) * 0.6, '#fff3a0');
  }));
};
const rainbowArc = (c, P, t, double) => {
  const cols = ['#e8424f', '#ff9f43', '#f2c53a', '#2fb36d', '#3d8fe0', '#8e5cf0'];
  const arc = (r0, list, a) => list.forEach((col, i) => { c.save(); c.globalAlpha = a; c.beginPath(); c.arc(0, 50, r0 - i * 6, Math.PI * 1.08, Math.PI * 1.92); c.strokeStyle = col; c.lineWidth = 6.5; c.stroke(); c.restore(); });
  arc(86, cols, 0.85); if (double) arc(122, [...cols].reverse(), 0.45);
};
const aurora = (c, P, t) => {
  for (const [y0, ph, col, top] of [[10, 0, '#35e0a8', '#9a6bff'], [26, 2, '#5cf0c8', '#c58bff']]) for (let x = -110; x <= 110; x += 4) {
    const y = y0 + Math.sin(x * 0.028 + t * 0.6 + ph) * 14 + Math.sin(x * 0.07 + ph) * 5, h = 34 + Math.sin(x * 0.05 + t + ph) * 12, a = 0.85 * (1 - Math.pow(Math.abs(x) / 116, 3));
    c.save(); c.globalAlpha = a; c.fillStyle = col; c.fillRect(x, y - h, 4.5, h); c.fillStyle = top; c.fillRect(x, y - h - 12, 4.5, 12); c.restore();
  }
};
const satDish = (c, P, t) => at(c, 0, 0, 1.4, () => {
  ln(c, P, [[-50, 0], [50, 0]], '#9aa3b5', 2);
  for (const dx of [-1, 1]) { box(c, P, dx > 0 ? 18 : -52, -10, 34, 20, '#2f5fb3', { lw: 2 }); for (let k = 1; k < 4; k++) ln(c, P, [[(dx > 0 ? 18 : -52) + k * 8.5, -10], [(dx > 0 ? 18 : -52) + k * 8.5, 10]], '#9ab8ec', 0.8); ln(c, P, [[dx > 0 ? 18 : -52, 0], [dx > 0 ? 52 : -18, 0]], '#9ab8ec', 0.8); }
  box(c, P, -12, -12, 24, 24, '#d9a441', { lw: 2 }); for (let k = 0; k < 3; k++) ln(c, P, [[-10, -6 + k * 6], [10, -4 + k * 6]], alpha('#8a6a1a', 0.6), 0.8);
  ln(c, P, [[0, -12], [0, -18]], '#9aa3b5', 1.6); oval(c, P, 0, -22, 10, 4, '#f7f8fb', { lw: 1.6 }); dot(c, P, 0, -22, 1.2, '#9aa3b5');
  dot(c, P, 10, 10, 2, blink(t, 1.3) ? '#ff3b3b' : '#5a2020');
});
const satBeeper = (c, P, t) => at(c, 0, 0, 1.6, () => {
  for (const [a, l] of [[2.6, 44], [2.85, 40], [3.45, 40], [3.7, 44]]) ln(c, P, [[0, 0], [Math.cos(a) * l, Math.sin(a) * l * 0.6]], '#c9ced8', 1.4);
  disc(c, P, 0, 0, 11, '#c9ced8', { gloss: true });
  if (blink(t, 1.8)) for (let k = 1; k <= 2; k++) { c.save(); c.beginPath(); c.arc(4, -4, 12 + k * 6, -1.2, -0.3); c.strokeStyle = alpha('#ffffff', 0.7); c.lineWidth = 1.4; c.stroke(); c.restore(); }
});
const satCube = (c, P, t) => at(c, 0, 0, 1.8, () => {
  for (const s of [-1, 1]) { box(c, P, s > 0 ? 9 : -33, -6, 24, 12, '#2f5fb3', { lw: 1.6 }); ln(c, P, [[s > 0 ? 21 : -21, -6], [s > 0 ? 21 : -21, 6]], '#9ab8ec', 0.8); }
  box(c, P, -9, -9, 18, 18, '#bfc6d4', { lw: 1.8 }); sq(c, P, -6, -6, 6, 5, '#5d6f9c');
  P.detail(c, () => { c.moveTo(3, 1); c.arc(2, 0.5, 1.6, 0, TAU); c.moveTo(6.2, 1); c.arc(5, 0.5, 1.6, 0, TAU); c.moveTo(0.6, 1.4); c.lineTo(3.5, 5); c.lineTo(6.4, 1.4); }, '#ff5d7a');
  ln(c, P, [[0, -9], [0, -16]], '#9aa3b5', 1); dot(c, P, 0, -17, 1.2, blink(t, 2) ? '#7dff9a' : '#2a5a3a');
});
const stationTruss = (c, P, t) => at(c, 0, 0, 1.3, () => {
  ln(c, P, [[-70, 0], [70, 0]], '#9aa3b5', 2); for (let x = -70; x < 70; x += 8) ln(c, P, [[x, -3], [x + 4, 3], [x + 8, -3]], '#9aa3b5', 0.8);
  for (const x of [-64, -40, 26, 50]) for (const s of [-1, 1]) { box(c, P, x, s > 0 ? 4 : -28, 14, 24, '#2f4f93', { lw: 1.6 }); for (let k = 1; k < 4; k++) ln(c, P, [[x, (s > 0 ? 4 : -28) + k * 6], [x + 14, (s > 0 ? 4 : -28) + k * 6]], '#8aa8e0', 0.6); }
  box(c, P, -18, -6, 36, 12, '#e6e9f0', { lw: 1.8 }); box(c, P, -6, -14, 12, 8, '#e6e9f0', { lw: 1.6 }); box(c, P, -6, 6, 12, 10, '#e6e9f0', { lw: 1.6 });
  for (let k = 0; k < 3; k++) dot(c, P, -10 + k * 10, 0, 1.4, '#ffe08a'); dot(c, P, 18, -6, 1.6, blink(t, 1.1) ? '#ff3b3b' : '#5a2020');
});
const stationRing = (c, P, t) => at(c, 0, 0, 1.2, () => {
  const sp = t * 0.25;
  for (let k = 0; k < 4; k++) { const a = sp + k * Math.PI / 2; ln(c, P, [[Math.cos(a) * 8, Math.sin(a) * 8 * 0.5], [Math.cos(a) * 46, Math.sin(a) * 46 * 0.5]], '#9aa3b5', 2); }
  c.save(); c.beginPath(); c.ellipse(0, 0, 48, 24, 0, 0, TAU); c.lineWidth = 9; c.strokeStyle = '#5a5f6a'; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#e6e9f0'; c.stroke(); c.restore();
  for (let k = 0; k < 12; k++) { const a = sp + k / 12 * TAU; dot(c, P, Math.cos(a) * 48, Math.sin(a) * 24, 1.4, Math.sin(a) > 0 ? '#ffe08a' : '#b8a060'); }
  disc(c, P, 0, 0, 9, '#e6e9f0', { lw: 1.8 }); dot(c, P, 0, 0, 3, '#5d6f9c');
});
const stationTether = (c, P, t) => {
  at(c, -48, -6, 1.3, () => { shape(c, P, [[-14, 10], [-8, -12], [8, -12], [14, 10]], '#e6e9f0', { lw: 1.8 }); disc(c, P, 0, -2, 4, '#5d6f9c', { lw: 1.4 }); box(c, P, -16, 10, 32, 5, '#9aa3b5', { lw: 1.4, shade: 'none' }); });
  const ax = 30 + Math.sin(t * 0.7) * 6, ay = 6 + Math.cos(t * 0.9) * 5;
  const pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push([-34 + (ax + 34) * u, -2 + (ay + 2) * u + Math.sin(u * Math.PI * 2) * 12]); } ln(c, P, pts, '#f2f0e6', 1.3);
  at(c, ax, ay, 1.5, () => {
    box(c, P, -9, -4, 6, 12, '#cfd5e0', { lw: 1.4 }); oval(c, P, 0, 3, 7, 9, '#f7f8fb', { lw: 1.6 }); disc(c, P, 1, -9, 7, '#f7f8fb', { lw: 1.6 }); oval(c, P, 3, -9, 4, 3.4, '#f2c53a', { lw: 1 });
    const w = Math.sin(t * 5) * 0.5; at(c, 6, -1, 1, () => ln(c, P, [[0, 0], [8, -6], [10, -12]], '#f7f8fb', 3.6), w);
    ln(c, P, [[-3, 11], [-5, 18]], '#f7f8fb', 3.6); ln(c, P, [[3, 11], [6, 17]], '#f7f8fb', 3.6);
  }, -0.2);
};
function crescentPath(c, R, d, r) {
  const xi = (R * R - r * r + d * d) / (2 * d), yi = Math.sqrt(Math.max(0, R * R - xi * xi));
  const ao = Math.atan2(yi, xi), ai = Math.atan2(yi, xi - d);
  c.arc(0, 0, R, ao, TAU - ao, false); c.arc(d, 0, r, TAU - ai, ai, true); c.closePath();
}
const moonSleepy = (c, P, t) => at(c, 0, 4, 1.25, () => {
  disc(c, P, -4, 0, 46, alpha('#fff6c8', 0.12), { lw: 0, shade: 'none' });
  P.fill(c, () => crescentPath(c, 36, 16, 32), '#f7e08a', { bb: { x: -12, y: 0, r: 34 }, shade: 'round' });
  ln(c, P, [[-26, -2], [-22, 1], [-18, -2]], '#6a5a2a', 1.6); dot(c, P, -24, 8, 2.6, alpha('#ff8fb1', 0.6));
  shape(c, P, [[-14, -31], [-32, -26], [-6, -48], [8, -60]], '#3d6fd8', { lw: 2 }); ln(c, P, [[-30, -27], [-13, -32]], '#ffffff', 3); disc(c, P, 9, -61, 4.6, '#ffffff', { lw: 1.4 });
  const z = ((t * 0.6) % 1); P.text(c, 'z', 14 + z * 10, -8 - z * 16, 8, alpha('#ffffff', 1 - z)); P.text(c, 'z', 24 + z * 8, -24 - z * 12, 6, alpha('#ffffff', 0.8 * (1 - z)));
});
const moonRinged = (c, P, t) => at(c, 0, 0, 1.3, () => {
  c.save(); c.beginPath(); c.ellipse(0, 0, 56, 14, -0.25, Math.PI, TAU); c.lineWidth = 6; c.strokeStyle = '#d9b98a'; c.stroke(); c.restore();
  disc(c, P, 0, 0, 30, '#f09a5a');
  c.save(); c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.clip(); for (const [y, col] of [[-14, '#e2804a'], [-2, '#f6b47a'], [10, '#d9703c']]) { c.fillStyle = col; c.fillRect(-32, y, 64, 5); } c.restore();
  c.save(); c.beginPath(); c.ellipse(0, 0, 56, 14, -0.25, 0, Math.PI); c.lineWidth = 6; c.strokeStyle = '#ead2a8'; c.stroke(); c.restore();
});
const moonTiny = (c, P, t) => at(c, 0, 10, 1.3, () => {
  disc(c, P, 0, 0, 28, '#5fbf6a'); oval(c, P, 10, 10, 10, 6, '#3d8fe0', { lw: 0, shade: 'none' });
  box(c, P, -22, -36, 14, 12, '#f7f4ee', { lw: 1.6 }); shape(c, P, [[-25, -36], [-15, -45], [-5, -36]], '#c4574a', { lw: 1.6 }); sq(c, P, -17, -32, 4, 5, '#ffe08a');
  ln(c, P, [[8, -26], [10, -48]], '#7a4a2a', 3); disc(c, P, 12, -54, 10, '#3f9a4a'); ln(c, P, [[12, -46], [22, -42]], '#7a4a2a', 2);
  const sw = Math.sin(t * 1.4) * 3; ln(c, P, [[20, -42], [19 + sw, -30]], '#3b3f4a', 0.9); ln(c, P, [[23, -42], [24 + sw, -30]], '#3b3f4a', 0.9); sq(c, P, 18 + sw, -30, 8, 2, '#c4574a');
});
const flame = (c, P, x, y, s, t) => { const f = 1 + Math.sin(t * 22) * 0.18; shape(c, P, [[x - 6 * s, y], [x, y + 20 * s * f], [x + 6 * s, y]], '#ff9f1c', { lw: 0, shade: 'none' }); shape(c, P, [[x - 3 * s, y], [x, y + 11 * s * f], [x + 3 * s, y]], '#fff3a0', { lw: 0, shade: 'none' }); };
const rocketClassic = (c, P, t) => at(c, 0, 0, 1.3, () => {
  flame(c, P, 0, 26, 1.2, t);
  shape(c, P, [[-10, 12], [-20, 28], [-10, 24]], '#e8424f', { lw: 2 }); shape(c, P, [[10, 12], [20, 28], [10, 24]], '#e8424f', { lw: 2 });
  P.fill(c, () => { c.moveTo(-10, 26); c.lineTo(-10, -10); c.quadraticCurveTo(-10, -34, 0, -44); c.quadraticCurveTo(10, -34, 10, -10); c.lineTo(10, 26); c.closePath(); }, '#f7f4ee', { bb: { x: 0, y: -8, r: 34, w: 20 }, shade: 'side' });
  P.fill(c, () => { c.moveTo(-8, -26); c.quadraticCurveTo(-6, -36, 0, -44); c.quadraticCurveTo(6, -36, 8, -26); c.closePath(); }, '#e8424f', { bb: { x: 0, y: -34, r: 10 }, lw: 2 });
  disc(c, P, 0, -6, 5, '#5ab0ff', { lw: 2.4, outline: '#8a94ad' });
}, 0.35);
const rocketBox = (c, P, t) => at(c, 0, 0, 1.3, () => {
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t * 3; ln(c, P, [[0, 30], [Math.cos(a) * 9, 30 + Math.abs(Math.sin(a)) * 12]], k % 2 ? '#fff3a0' : '#ffb84a', 1.6); }
  box(c, P, -14, -16, 28, 44, '#c89a62'); sq(c, P, -14, -2, 28, 5, '#e8d9a8'); sq(c, P, -2, -16, 5, 44, alpha('#e8d9a8', 0.8));
  shape(c, P, [[-16, -16], [0, -38], [16, -16]], '#b8864e');
  P.detail(c, () => c.arc(0, 10, 6, 0, TAU), '#bfe4f7'); c.save(); c.beginPath(); c.arc(0, 10, 6, 0, TAU); c.lineWidth = 1.6; c.strokeStyle = '#2b2b38'; c.stroke(); c.restore();
  disc(c, P, 9, -20, 6, '#f2c9a0', { lw: 1.4 }); oval(c, P, 9, -24, 7, 4, '#e8424f', { lw: 1.2 }); sq(c, P, 6, -21, 7, 2.4, '#3b3f4a');
  for (const s of [-1, 1]) shape(c, P, [[s * 14, 14], [s * 22, 30], [s * 14, 28]], '#b8864e', { lw: 2 });
}, 0.3);
const rocketShuttle = (c, P, t) => at(c, 0, 0, 1.3, () => {
  flame(c, P, -5, 26, 0.9, t); flame(c, P, 5, 26, 0.9, t + 0.3);
  shape(c, P, [[-8, 0], [-26, 24], [26, 24], [8, 0]], '#e6e9f0'); shape(c, P, [[-3, 12], [0, -2], [3, 12]], '#3b3f4a', { lw: 1 });
  P.fill(c, () => { c.moveTo(-9, 26); c.lineTo(-9, -18); c.quadraticCurveTo(-8, -38, 0, -42); c.quadraticCurveTo(8, -38, 9, -18); c.lineTo(9, 26); c.closePath(); }, '#f7f8fb', { bb: { x: 0, y: -8, r: 34, w: 18 }, shade: 'side' });
  P.fill(c, () => { c.moveTo(-8, -28); c.quadraticCurveTo(-6, -38, 0, -42); c.quadraticCurveTo(6, -38, 8, -28); c.closePath(); }, '#2b2b38', { bb: { x: 0, y: -34, r: 10 }, lw: 1.6 });
  sq(c, P, -5, -24, 10, 3, '#5d6f9c');
}, 0.25);
function saucer(c, P, t, inside) {
  disc(c, P, 0, -8, 18, alpha('#9fe8ff', 0.55), { lw: 2, outline: '#6aa8c0', shade: 'none' });
  if (inside) inside();
  oval(c, P, 0, 0, 52, 12, '#b8c0d0'); sq(c, P, -30, -5, 14, 2.4, '#e6eaf2'); oval(c, P, 0, 4, 34, 5, '#8a94ad', { lw: 0, shade: 'none' });
}
const ufoAlien = (c, P, t) => at(c, 0, Math.sin(t * 1.5) * 3, 1.3, () => saucer(c, P, t, () => {
  disc(c, P, 0, -8, 8, '#7ddc5a', { lw: 1.6 }); ln(c, P, [[-4, -15], [-7, -22]], '#5ab040', 1.2); ln(c, P, [[4, -15], [7, -22]], '#5ab040', 1.2); dot(c, P, -7, -22, 1.6, '#ff5d7a'); dot(c, P, 7, -22, 1.6, '#ff5d7a');
  dot(c, P, -3, -9, 1.8, '#111'); dot(c, P, 3, -9, 1.8, '#111'); ln(c, P, [[-2, -5], [0, -4], [2, -5]], '#2b5a20', 1);
  const w = Math.sin(t * 6) * 3; ln(c, P, [[8, -4], [13, -10], [14 + w, -16]], '#7ddc5a', 2.4);
}));
const ufoCow = (c, P, t) => at(c, 0, -14, 1.2, () => {
  c.save(); c.globalAlpha = 0.38; c.beginPath(); c.moveTo(-14, 6); c.lineTo(14, 6); c.lineTo(34, 70); c.lineTo(-34, 70); c.closePath(); c.fillStyle = '#fff6b0'; c.fill(); c.restore();
  const cy = 44 - ((t * 6) % 18), sp = Math.sin(t * 2) * 0.2;
  at(c, 0, cy, 1, () => { box(c, P, -11, -6, 22, 11, '#f7f4ee', { lw: 1.4 }); sq(c, P, -6, -5, 6, 5, '#2b2b38'); sq(c, P, 3, -2, 5, 4, '#2b2b38'); disc(c, P, 13, -6, 5, '#f7f4ee', { lw: 1.2 }); sq(c, P, 15, -5, 3, 2.4, '#ff9fb1'); for (const lx of [-8, -3, 4, 9]) ln(c, P, [[lx, 5], [lx, 10]], '#2b2b38', 1.6); }, sp);
  saucer(c, P, t);
  for (let k = 0; k < 5; k++) dot(c, P, -32 + k * 16, 2, 2.2, '#fff3a0');
});
const ufoDisco = (c, P, t) => at(c, 0, Math.sin(t * 1.7) * 3, 1.3, () => {
  saucer(c, P, t);
  const cols = ['#ff5d7a', '#ffd34d', '#5cf08a', '#5ab0ff', '#c58bff'];
  for (let k = 0; k < 9; k++) { const x = -40 + k * 10; dot(c, P, x, 3 - Math.cos((x / 52) * Math.PI / 2) * 2, 2.6, cols[(k + Math.floor(t * 6)) % cols.length]); }
});
const star5 = (c, x, y, r1, r2) => { for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, rr = i % 2 ? r2 : r1; i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); };
const starsShooting = (c, P, t) => {
  const u = (t * 0.35) % 1, x = -70 + u * 140, y = -30 + u * 50;
  for (let k = 0; k < 12; k++) dot(c, P, x - k * 7, y - k * 2.5, 3 - k * 0.2, alpha('#fff6c8', 0.9 - k * 0.07));
  P.fill(c, () => star5(c, x, y, 11, 5), '#ffe066', { bb: { x, y, r: 10 }, lw: 2 });
};
const starsShower = (c, P, t) => {
  for (let k = 0; k < 7; k++) { const u = (t * 0.5 + k * 0.23) % 1, x = -80 + k * 26 + u * 40, y = -44 + (k % 3) * 24 + u * 30, col = k % 2 ? '#bfe4f7' : '#ffffff';
    ln(c, P, [[x - 30, y - 18], [x, y]], alpha(col, 0.45), 3); ln(c, P, [[x - 14, y - 8.4], [x, y]], col, 3.4); dot(c, P, x, y, 3.2, '#ffffff'); }
};
const starsComet = (c, P, t) => at(c, 30, -6, 1, () => {
  for (let k = 22; k >= 0; k--) { const w = 4 + k * 0.9; c.save(); c.globalAlpha = 0.5 * (1 - k / 23); c.beginPath(); c.ellipse(-k * 5.5, k * 1.6, w, w * 0.7, -0.28, 0, TAU); c.fillStyle = k % 3 ? '#9fe8ff' : '#ffffff'; c.fill(); c.restore(); }
  disc(c, P, 0, 0, 7, '#f7fbff', { lw: 2, outline: '#6aa8c0' });
});

// ---------------------------------------------------------------- added for the game
// A pavement strip along the ground line, under vehicles.
function pavement(c, P, W) { sq(c, P, 0, -5, W, 6, '#9aa0ad'); sq(c, P, 0, -6, W, 1.6, '#d5d9e2'); for (let x = 12; x < W; x += 40) sq(c, P, x, -2.5, 14, 1.2, '#f4f1ea'); }
// Fire truck parked downtown: ladder on top, flashing light bar, a firefighter waving, a dalmatian.
function streetFireTruck(c, P, W, t) {
  const x = W * 0.56;
  box(c, P, x, -38, 74, 30, '#d9312e'); box(c, P, x + 72, -40, 26, 32, '#d9312e');
  sq(c, P, x + 2, -22, 94, 4, '#f4f1ea'); sq(c, P, x + 78, -35, 15, 10, '#9fd6f2');
  for (let k = 0; k < 3; k++) box(c, P, x + 5 + k * 22, -34, 17, 9, '#c9ced8', { lw: 1.5, shade: 'none' });
  disc(c, P, x + 60, -15, 5, '#f2c53a', { lw: 1.5 }); dot(c, P, x + 60, -15, 1.6, '#9a6a10');
  sq(c, P, x + 77, -44, 8, 4, blink(t, 3) ? '#ff3b3b' : '#7a2020'); sq(c, P, x + 86, -44, 8, 4, blink(t, 3, 1) ? '#5ab0ff' : '#203a6a');
  ln(c, P, [[x - 16, -44], [x + 68, -44]], '#c9ced8', 2.4); ln(c, P, [[x - 16, -51], [x + 68, -51]], '#c9ced8', 2.4);
  for (let k = 0; k < 12; k++) ln(c, P, [[x - 13 + k * 7, -44], [x - 13 + k * 7, -51]], '#9aa3b5', 1.4);
  ln(c, P, [[x + 62, -44], [x + 64, -38]], '#5a5f6a', 2.2);
  for (const wx of [x + 16, x + 82]) { disc(c, P, wx, -6, 8, '#2b2b38'); dot(c, P, wx, -6, 2.6, '#b8c0d0'); }
  // firefighter behind the truck, waving
  const fx = x - 18, wave = Math.sin(t * 6) * 4;
  ln(c, P, [[fx - 3, -12], [fx - 3, -2]], '#2b2b38', 3.4); ln(c, P, [[fx + 3, -12], [fx + 3, -2]], '#2b2b38', 3.4);
  box(c, P, fx - 7, -28, 14, 17, '#3b3a34', { lw: 1.5 }); sq(c, P, fx - 7, -17, 14, 2.2, '#ffd34d'); sq(c, P, fx - 7, -24, 14, 2.2, '#ffd34d');
  ln(c, P, [[fx + 6, -25], [fx + 12, -32], [fx + 13 + wave, -39]], '#3b3a34', 3);
  disc(c, P, fx, -33, 5, '#f2c9a0', { lw: 1.4 }); dot(c, P, fx + 2, -34, 0.9, '#111');
  oval(c, P, fx, -37, 8, 2.6, '#f2c53a', { lw: 1.4 }); oval(c, P, fx, -39, 5, 3.4, '#f2c53a', { lw: 1.4 });
  // dalmatian sitting by the firefighter, tail wagging
  const dx = x - 40, wag = Math.sin(t * 9) * 3;
  ln(c, P, [[dx - 7, -4], [dx - 13, -9 + wag]], '#f7f8fb', 2.4);
  oval(c, P, dx, -8, 8, 7, '#f7f8fb', { lw: 1.6 }); disc(c, P, dx + 6, -18, 5.4, '#f7f8fb', { lw: 1.6 });
  oval(c, P, dx + 3, -19, 2, 3.6, '#2b2b38', { lw: 0, shade: 'none', rot: 0.3 });
  for (const [sx, sy] of [[-3, -10], [2, -5], [-5, -5], [4, -11]]) dot(c, P, dx + sx, sy, 1.4, '#2b2b38');
  dot(c, P, dx + 9, -19, 0.9, '#111'); dot(c, P, dx + 11, -17, 1.2, '#111');
  ln(c, P, [[dx + 3, -12], [dx + 9, -12]], '#e8424f', 1.6);
}

export {
  TAU, rnd, alpha, mixc, light, dark, clamp, STYLES, painter, at, pavement,
  cityBrick, cityGlass, citySeaside, treesPark, treesPines, treesBlossom,
  streetVan, streetBus, streetCat, streetFireTruck,
  birdsSparrows, kiteDiamond, kiteBox, kiteKoi, drifterPlane, drifterBalloon, drifterLeaves,
  balloonStriped, balloonPatch, balloonPair, blimpWhale, blimpClassic, blimpAirship,
  bannerPlane, bannerSeaplane, copterNews, copterRescue,
  jetContrail, jetJumbo, flockGeese, flockBats, rainbowArc, aurora,
  satDish, satBeeper, satCube, stationTruss, stationRing, stationTether,
  moonSleepy, moonRinged, moonTiny, rocketClassic, rocketBox, rocketShuttle,
  ufoAlien, ufoCow, ufoDisco, starsShooting, starsShower,
};

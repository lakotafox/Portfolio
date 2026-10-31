/**
 * pixel-art.js — the pixel look's little sprites (crown, trophy, dice, gamepad, puffball, kayak…)
 * as crisp inline SVG strings, drawn from character maps: one <path> per colour, runs merged.
 *
 *   sprite("crown", 3)                       → '<svg …>'  (3 screen px per pixel)
 *   sprite("puff", 4, { color: "#2f6fe8" })  → a puffball in that player's colour
 *   crownedPuff("#e3384f", 4)                → the winner art: their puffball wearing the crown
 *   cryingPuff("#2f6fe8", 4)                 → out of the top three: their puffball in tears
 */
const INK = "#0a1428";
const BASE = { O: INK, E: INK, Y: "#ffd23f", y: "#e3a51a", L: "#fff3b0", R: "#ff5a3c", B: "#4aa3ff", W: "#ffffff", G: "#c9d2e6", P: "#8a5cf5", K: "#ff8c9a" };
const MAPS = {
  crown: [".O...O...O.", "OYO.OYO.OYO", "OYYOYYYOYYO", "OYYYYYYYYYO", "OYRYYBYYRYO", "OYYYYYYYYYO", "OLLLLLLLLLO", "OyyyyyyyyyO", ".OOOOOOOOO."],
  trophy: ["...OOOOOOOO...", "OOOLYYYYYYyOOO", "O.OLYYYYYYyO.O", "O.OLYYYYYYyO.O", "OOOLYYYYYYyOOO", "...OLYYYYyO...", "....OLYYyO....", ".....OYyO.....", ".....OYyO.....", "....OOYyOO....", "...OLYYYYyO...", "...OOOOOOOO..."],
  dice: [".OOOOOOO.", "OWWWWWWWO", "OWOWWWOWO", "OWWWWWWWO", "OWWWOWWWO", "OWWWWWWWO", "OWOWWWOWO", "OGGGGGGGO", ".OOOOOOO."],
  pad: ["..OOOOOOOOO..", ".OPPPPPPPPPO.", "OPPWPPPPPPYPO", "OPWWWPPPPYPRO", "OPPWPPPPPPRPO", "OPPPPOOOPPPPO", ".OPPO...OPPO.", "..OO.....OO.."],
  puff: ["....OOOO....", "..OOHHCCOO..", ".OHHCCCCCCO.", ".OHCCCCCCCO.", "OCCCECCECCCO", "OCCCECCECCCO", "OCKCCCCCCKCO", "OCCCCOOCCCCO", ".OCCCCCCCCO.", ".ODCCCCCCDO.", "..OODDDDOO..", "....OOOO...."],
  // the same puffball having a cry: squeezed > < eyes, a frown (tears are CSS, see cryingPuff)
  puffSad: ["....OOOO....", "..OOHHCCOO..", ".OHHCCCCCCO.", ".OHCCCCCCCO.", "OCCECCCCECCO", "OCCCECCECCCO", "OCKECCCCEKCO", "OCCCCCCCCCCO", ".OCCCOOCCCO.", ".ODCOCCOCDO.", "..OODDDDOO..", "....OOOO...."],
  kayak: ["....OOOO....OOOO......", "...OWHHHO..OWHHHO.....", "...OHEHEO..OHEHEO.....", "...OKHHKO..OKHHKO.....", ".OOOOOOOOOOOOOOOOOOOO.", "OHHHHHHHHHHHHHHHHHHHHO", "OCCCCCCCCCCCCCCCCCCCCO", ".OCCCCCCCCCCCCCCCCCCO.", "..ODDDDDDDDDDDDDDDDO..", "...OOOOOOOOOOOOOOOO..."],
  sparkle: ["..W..", "..W..", "WWYWW", "..W..", "..W.."],
};

/** #rrggbb mixed toward white (amt > 0) or black (amt < 0). */
function mix(hex, amt) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  if (!Number.isFinite(n)) return hex;
  const t = amt > 0 ? 255 : 0, k = Math.abs(amt);
  const ch = (s) => Math.round(((n >> s) & 255) * (1 - k) + t * k);
  return "#" + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("");
}

export function sprite(name, scale = 3, { color = "#ff5a3c" } = {}) {
  const rows = MAPS[name];
  if (!rows) return "";
  const pal = { ...BASE, C: color, D: mix(color, -0.3), H: mix(color, 0.35) };
  const w = rows[0].length, h = rows.length, runs = {};
  rows.forEach((row, y) => {
    for (let x = 0; x < w; ) {
      const c = row[x];
      if (c === ".") { x++; continue; }
      let n = 1;
      while (x + n < w && row[x + n] === c) n++;
      (runs[pal[c]] ||= []).push(`M${x} ${y}h${n}v1h-${n}z`);
      x += n;
    }
  });
  const paths = Object.entries(runs).map(([f, d]) => `<path fill="${f}" d="${d.join("")}"></path>`).join("");
  return `<svg class="px-sprite" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true">${paths}</svg>`;
}

/** Out of the top three: your puffball crying, two tears dropping from the eyes in pixel steps
 *  (the .px-cry / .px-tear animation lives with the results styles in pad.html). */
export function cryingPuff(color, scale = 4) {
  return `<span class="px-cry" style="--px:${scale}px">${sprite("puffSad", scale, { color })}<i class="px-tear"></i><i class="px-tear r"></i></span>`;
}

/** The winner art: a puffball in the winner's colour wearing the crown. */
export function crownedPuff(color, scale = 4) {
  return `<span class="px-crowned">${sprite("crown", Math.max(1, Math.round(scale * 0.7)))}${sprite("puff", scale, { color })}</span>`;
}

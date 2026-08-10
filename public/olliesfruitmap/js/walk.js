// Featured walk: the Columbia Children's Arboretum in N Portland — the
// densest patch of apple trees in the whole inventory (bbox computed by
// scripts/fetch-fruit.mjs at build time). Draws a dotted loop through the
// orchard with a "start here" pin so the walk is a route, not a mystery.
import { goTo } from './map.js';
import { BOOT_KEYS } from './taxa.js';
import { click } from './sounds.js';

const L = window.L;

// Densest orchard cell — printed by the data pipeline; update when re-fetching.
const PATCH = { south: 45.595, north: 45.6, west: -122.665, east: -122.66 };
const FALLBACK_CENTER = [45.5975, -122.6625];

// Cluster the patch's trees into up to n cell centroids, then order them by
// angle around the middle so the loop reads as one clean stroll.
function loopThrough(trees, n = 8) {
  let pts = trees.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]]);
  if (pts.length < 3) return pts;
  // Keep the dense core: drop stragglers more than ~250 m from the median
  // (one lone street tree at the bbox edge would stretch the loop into a spike).
  const med = (arr) => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length / 2)];
  const mlat = med(pts.map((p) => p[0]));
  const mlon = med(pts.map((p) => p[1]));
  const core = pts.filter(
    (p) => Math.abs(p[0] - mlat) < 0.00225 && Math.abs(p[1] - mlon) < 0.0032
  );
  if (core.length >= 3) pts = core;
  const lat0 = Math.min(...pts.map((p) => p[0]));
  const lat1 = Math.max(...pts.map((p) => p[0]));
  const lon0 = Math.min(...pts.map((p) => p[1]));
  const lon1 = Math.max(...pts.map((p) => p[1]));
  const cells = new Map();
  for (const [lat, lon] of pts) {
    const key =
      Math.min(3, Math.floor(((lat - lat0) / (lat1 - lat0 || 1)) * 4)) +
      ':' +
      Math.min(3, Math.floor(((lon - lon0) / (lon1 - lon0 || 1)) * 4));
    const c = cells.get(key) ?? { lat: 0, lon: 0, n: 0 };
    c.lat += lat;
    c.lon += lon;
    c.n++;
    cells.set(key, c);
  }
  const centroids = [...cells.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, n)
    .map((c) => [c.lat / c.n, c.lon / c.n]);
  const mid = [
    centroids.reduce((s, p) => s + p[0], 0) / centroids.length,
    centroids.reduce((s, p) => s + p[1], 0) / centroids.length,
  ];
  centroids.sort(
    (a, b) => Math.atan2(a[0] - mid[0], a[1] - mid[1]) - Math.atan2(b[0] - mid[0], b[1] - mid[1])
  );
  centroids.push(centroids[0]); // close the loop
  return centroids;
}

export function initWalk(map, store, activateTaxon) {
  const btn = document.getElementById('walk-btn');
  const card = document.getElementById('walk-card');
  let route = null;
  let startPin = null;

  function clearRoute() {
    if (route) route.remove();
    if (startPin) startPin.remove();
    route = startPin = null;
  }

  document.getElementById('walk-close').addEventListener('click', () => {
    click();
    card.hidden = true;
    clearRoute();
  });

  btn.addEventListener('click', () => {
    click();
    activateTaxon('apple'); // the orchard is apples; make sure they're visible

    const patchTrees = BOOT_KEYS.flatMap((k) => store.byTaxon[k]).filter((f) => {
      const [lon, lat] = f.geometry.coordinates;
      return lat >= PATCH.south && lat <= PATCH.north && lon >= PATCH.west && lon <= PATCH.east;
    });

    clearRoute();
    if (patchTrees.length >= 3) {
      const loop = loopThrough(patchTrees);
      route = L.polyline(loop, {
        color: '#ff00ff',
        weight: 4,
        dashArray: '2 10',
        lineCap: 'round',
      }).addTo(map);
      // start at the loop point nearest the SW corner (street side)
      const start = loop.reduce((best, p) =>
        Math.hypot(p[0] - PATCH.south, p[1] - PATCH.west) <
        Math.hypot(best[0] - PATCH.south, best[1] - PATCH.west)
          ? p
          : best
      );
      startPin = L.marker(start, {
        icon: L.divIcon({
          className: '',
          html: '<div class="walk-start w95-raised"><img class="px-icon" src="icons/apple.png" alt="" width="13" height="13"> start here</div>',
          iconSize: null,
          iconAnchor: [8, 30],
        }),
      }).addTo(map);
      // bottom padding clears the walk card so the whole loop stays visible
      goTo(map, route.getBounds(), {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [40, Math.min(300, map.getSize().y * 0.38)],
        maxZoom: 18,
      });
    } else {
      goTo(map, FALLBACK_CENTER, 16);
    }
    card.hidden = false;
  });
}

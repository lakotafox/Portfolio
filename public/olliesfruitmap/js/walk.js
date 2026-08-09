// Featured walk: fit the map to the densest patch of orchard-star trees
// in the city (bbox computed by scripts/fetch-fruit.mjs at build time).
import { goTo } from './map.js';
import { BOOT_KEYS } from './taxa.js';
import { click } from './sounds.js';

const L = window.L;

// Densest orchard cell — printed by the data pipeline; update when re-fetching.
const PATCH = { south: 45.559, north: 45.564, west: -122.6, east: -122.595 };
const FALLBACK_CENTER = [45.5615, -122.5975];

export function initWalk(map, store) {
  const btn = document.getElementById('walk-btn');
  const card = document.getElementById('walk-card');

  document.getElementById('walk-close').addEventListener('click', () => {
    click();
    card.hidden = true;
  });

  const patchTrees = BOOT_KEYS.flatMap((k) => store.byTaxon[k]).filter((f) => {
    const [lon, lat] = f.geometry.coordinates;
    return lat >= PATCH.south && lat <= PATCH.north && lon >= PATCH.west && lon <= PATCH.east;
  });

  btn.addEventListener('click', () => {
    click();
    if (patchTrees.length) {
      const bounds = L.latLngBounds(
        patchTrees.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
      );
      goTo(map, bounds, { padding: [40, 40], maxZoom: 17 });
    } else {
      goTo(map, FALLBACK_CENTER, 16);
    }
    card.hidden = false;
  });
}

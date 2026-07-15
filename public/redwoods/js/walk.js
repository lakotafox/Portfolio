// Featured walk: fit the map to the actual Laurelhurst Park cluster —
// the one spot with all three redwood species along a single stroll.
import { goTo } from './map.js';
import { REDWOOD_KEYS } from './taxa.js';

const L = window.L;

// Laurelhurst Park bounding box (SE Portland).
const PARK = { south: 45.5185, north: 45.5235, west: -122.629, east: -122.6215 };
const FALLBACK_CENTER = [45.5209, -122.6255];

export function initWalk(map, store) {
  const btn = document.getElementById('walk-btn');
  const card = document.getElementById('walk-card');

  document.getElementById('walk-close').addEventListener('click', () => {
    card.hidden = true;
  });

  const parkTrees = REDWOOD_KEYS.flatMap((k) => store.byTaxon[k]).filter((f) => {
    const [lon, lat] = f.geometry.coordinates;
    return lat >= PARK.south && lat <= PARK.north && lon >= PARK.west && lon <= PARK.east;
  });

  btn.addEventListener('click', () => {
    if (parkTrees.length) {
      const bounds = L.latLngBounds(
        parkTrees.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
      );
      goTo(map, bounds, { padding: [40, 40], maxZoom: 17 });
    } else {
      goTo(map, FALLBACK_CENTER, 16);
    }
    card.hidden = false;
  });
}

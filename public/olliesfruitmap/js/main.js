// Boot: title screen first (map tiles load behind it), then data, then
// everything else.
import { createMap, createClusterGroups } from './map.js';
import { loadTrees } from './data.js';
import { makeMarker } from './markers.js';
import { initFilters } from './filters.js';
import { initNearMe } from './nearme.js';
import { initWalk } from './walk.js';
import { initTitle } from './title.js';
import { initFullscreen } from './fullscreen.js';
import { initMrApple } from './mrapple.js';
import { initMuteButton } from './sounds.js';

initTitle();
initMuteButton(document.getElementById('mute-btn'));

const map = createMap();
const groups = createClusterGroups();
initFullscreen(map);
initMrApple();
map.on('popupopen', () => document.dispatchEvent(new CustomEvent('ofm:popup')));

try {
  const store = await loadTrees();

  // Markers are built once per feature, on demand (the lazy groups hold
  // ~30k features — only pay for what gets shown).
  const markerByFeature = new Map();
  const markerFor = (feature) => {
    let marker = markerByFeature.get(feature);
    if (!marker) {
      marker = makeMarker(feature);
      markerByFeature.set(feature, marker);
    }
    return marker;
  };

  const filters = initFilters(map, groups, store, markerFor);

  initNearMe(map);
  initWalk(map, store, filters.activate);

  const when = store.generated ? ` · data ${store.generated}` : '';
  document.getElementById('status-note').textContent = `city open data${when}`;
} catch (err) {
  document.getElementById('stats-strip').innerHTML =
    '<span class="stat">Could not load the trees — try a refresh.</span>';
  console.error(err);
}

// Boot: title screen first (map tiles load behind it), then data, then
// everything else.
import { createMap, createClusterGroups, goTo } from './map.js';
import { loadTrees } from './data.js';
import { makeMarker } from './markers.js';
import { initFilters } from './filters.js';
import { initNearMe } from './nearme.js';
import { initWalk } from './walk.js';
import { initTitle } from './title.js';
import { initMuteButton } from './sounds.js';

initTitle();
initMuteButton(document.getElementById('mute-btn'));

const map = createMap();
const groups = createClusterGroups();

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

  const openTree = (feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    goTo(map, [lat, lon], 18);
    const marker = markerFor(feature);
    const group = groups[feature.properties.taxon];
    // Marker may be inside a cluster; zoomToShowLayer expands it first.
    group.zoomToShowLayer(marker, () => marker.openPopup());
  };

  initNearMe(map, filters, openTree);
  initWalk(map, store);

  const when = store.generated ? ` · data ${store.generated}` : '';
  document.getElementById('status-note').textContent = `city open data${when}`;
} catch (err) {
  document.getElementById('stats-strip').innerHTML =
    '<span class="stat">Could not load the trees — try a refresh.</span>';
  console.error(err);
}

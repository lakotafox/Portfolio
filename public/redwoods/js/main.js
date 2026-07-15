// Boot: map first (tiles start loading), then data, then everything else.
import { createMap, createClusterGroups, goTo } from './map.js';
import { loadTrees } from './data.js';
import { makeMarker } from './markers.js';
import { initFilters } from './filters.js';
import { initNearMe } from './nearme.js';
import { initWalk } from './walk.js';
import { initFullscreen } from './fullscreen.js';

const map = createMap();
const groups = createClusterGroups();
initFullscreen(map);

try {
  const store = await loadTrees();

  // Markers are built once per feature, on demand (natives may hold ~11k
  // features — only pay for what gets shown).
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
} catch (err) {
  document.getElementById('stats-strip').innerHTML =
    '<span class="stat">Could not load tree data — try a refresh.</span>';
  console.error(err);
}

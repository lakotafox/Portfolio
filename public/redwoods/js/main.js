// Boot: map first (tiles start loading), then data, then everything else.
import { createMap, createClusterGroups, goTo } from './map.js';
import { loadTrees } from './data.js';
import { makeMarker } from './markers.js';
import { initFilters } from './filters.js';
import { initNearMe } from './nearme.js';
import { initWalk } from './walk.js';

const map = createMap();
const groups = createClusterGroups();

try {
  const data = await loadTrees();

  const markerByFeature = new Map();
  for (const [taxon, features] of Object.entries(data.byTaxon)) {
    for (const feature of features) {
      const marker = makeMarker(feature);
      markerByFeature.set(feature, marker);
      groups[taxon].addLayer(marker);
    }
    map.addLayer(groups[taxon]);
  }

  const filters = initFilters(map, groups, data);

  const openTree = (feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    goTo(map, [lat, lon], 18);
    const marker = markerByFeature.get(feature);
    const group = groups[feature.properties.taxon];
    // Marker may be inside a cluster; zoomToShowLayer expands it first.
    group.zoomToShowLayer(marker, () => marker.openPopup());
  };

  initNearMe(map, data, filters, openTree);
  initWalk(map, data);
} catch (err) {
  document.getElementById('stats-strip').innerHTML =
    '<span class="stat">Could not load tree data — try a refresh.</span>';
  console.error(err);
}

// Leaflet map + tile layer + one cluster group per taxon (so species
// filtering is a cheap addLayer/removeLayer, no marker re-render).
const L = window.L;

export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const PORTLAND = [45.5152, -122.6784];

export function createMap() {
  const map = L.map('map', {
    center: PORTLAND,
    zoom: 12,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map);

  return map;
}

export function createClusterGroups() {
  const groups = {};
  for (const taxon of ['sequoiadendron', 'sequoia', 'metasequoia']) {
    groups[taxon] = L.markerClusterGroup({
      maxClusterRadius: 44,
      showCoverageOnHover: false,
      iconCreateFunction(cluster) {
        const n = cluster.getChildCount();
        const size = n < 10 ? 30 : n < 100 ? 36 : 42;
        return L.divIcon({
          html: `<div class="cluster-icon cluster-${taxon}" style="width:${size}px;height:${size}px">${n}</div>`,
          className: '',
          iconSize: [size, size],
        });
      },
    });
  }
  return groups;
}

// flyTo that respects prefers-reduced-motion.
export function goTo(map, target, zoomOrOptions) {
  if (Array.isArray(target) || target instanceof L.LatLng) {
    if (REDUCED_MOTION) map.setView(target, zoomOrOptions);
    else map.flyTo(target, zoomOrOptions);
  } else {
    if (REDUCED_MOTION) map.fitBounds(target, zoomOrOptions);
    else map.flyToBounds(target, zoomOrOptions);
  }
}

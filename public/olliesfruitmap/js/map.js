// Leaflet map + tile layer + one cluster group per taxon (so species
// filtering is a cheap addLayer/removeLayer, no marker re-render).
// Canvas renderer: with all species on, the map holds ~20k circle
// markers — SVG DOM nodes would crawl, canvas stays smooth.
import { TAXA } from './taxa.js';

const L = window.L;

export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const PORTLAND = [45.5152, -122.6784];

// Basemaps. CARTO's free basemaps started serving "API KEY REQUIRED"
// placeholder tiles in Sep 2026, so: OSM for the street map, Esri World
// Imagery (+ Esri label/road reference tiles) for satellite. Both are
// keyless. maxNativeZoom lets Leaflet upscale the last real zoom so all
// three styles share the same zoom range (walking-distance z19–20).
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ESRI_ATTR = 'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics';
const esri = (svc) => `https://server.arcgisonline.com/ArcGIS/rest/services/${svc}/MapServer/tile/{z}/{y}/{x}`;

export const BASEMAPS = {
  map: () => [
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: OSM_ATTR, maxNativeZoom: 19, maxZoom: 20,
    }),
  ],
  satellite: () => [
    L.tileLayer(esri('World_Imagery'), { attribution: ESRI_ATTR, maxNativeZoom: 19, maxZoom: 20 }),
  ],
  hybrid: () => [
    L.tileLayer(esri('World_Imagery'), { attribution: ESRI_ATTR, maxNativeZoom: 19, maxZoom: 20 }),
    L.tileLayer(esri('Reference/World_Transportation'), { maxNativeZoom: 19, maxZoom: 20, pane: 'basemapLabels' }),
    L.tileLayer(esri('Reference/World_Boundaries_and_Places'), { maxNativeZoom: 19, maxZoom: 20, pane: 'basemapLabels' }),
  ],
};
const BASEMAP_KEY = 'ofm-basemap';
let current = { name: null, layers: [] };

export function setBasemap(map, name) {
  if (!BASEMAPS[name]) name = 'map';
  if (current.name === name) return name;
  for (const l of current.layers) map.removeLayer(l);
  current = { name, layers: BASEMAPS[name]() };
  for (const l of current.layers) l.addTo(map);
  localStorage.setItem(BASEMAP_KEY, name);
  document.body.classList.toggle('basemap-imagery', name !== 'map');
  document.dispatchEvent(new CustomEvent('ofm:basemap', { detail: name }));
  return name;
}

export function createMap() {
  const map = L.map('map', {
    center: PORTLAND,
    zoom: 12,
    zoomControl: true,
    renderer: L.canvas(),
  });
  // Labels/roads sit above imagery but below markers (overlayPane is 400).
  map.createPane('basemapLabels').style.zIndex = 250;

  setBasemap(map, localStorage.getItem(BASEMAP_KEY) || 'map');

  return map;
}

export function createClusterGroups() {
  const groups = {};
  for (const [taxon, t] of Object.entries(TAXA)) {
    groups[taxon] = L.markerClusterGroup({
      maxClusterRadius: 44,
      disableClusteringAtZoom: 18, // walking distance — show every tree
      showCoverageOnHover: false,
      chunkedLoading: true,
      iconCreateFunction(cluster) {
        const n = cluster.getChildCount();
        const size = n < 10 ? 30 : n < 100 ? 36 : 42;
        return L.divIcon({
          html: `<div class="cluster-icon" style="width:${size}px;height:${size}px;background:${t.color}">${n}</div>`,
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

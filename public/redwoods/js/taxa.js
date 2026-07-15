// The species on the map. Redwoods load at boot (data/trees.geojson);
// natives lazy-load from data/native/<key>.geojson on first toggle.
// Keep keys/colors in sync with scripts/fetch-trees.mjs TAXA.
export const TAXA = {
  sequoiadendron: { label: 'Giant sequoia', group: 'redwood', color: '#9c4a26' },
  sequoia: { label: 'Coast redwood', group: 'redwood', color: '#1e5c46' },
  metasequoia: { label: 'Dawn redwood', group: 'redwood', color: '#5f6428' },
  pseudotsuga: { label: 'Douglas-fir', group: 'native', color: '#44603a' },
  thuja: { label: 'Western redcedar', group: 'native', color: '#2e6b62' },
  quercus: { label: 'Oregon white oak', group: 'native', color: '#a8842c' },
  acer: { label: 'Bigleaf maple', group: 'native', color: '#c05f36' },
  pinus: { label: 'Ponderosa pine', group: 'native', color: '#7a5b45' },
};

export const REDWOOD_KEYS = Object.keys(TAXA).filter((k) => TAXA[k].group === 'redwood');
export const NATIVE_KEYS = Object.keys(TAXA).filter((k) => TAXA[k].group === 'native');

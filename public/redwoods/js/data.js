// Data store: redwoods load at boot; native species lazy-load on first
// toggle. Ages are precomputed per feature (properties._age) so the
// size/age sliders filter on plain numbers.
import { TAXA, REDWOOD_KEYS } from './taxa.js';
import { ageInfo } from './age.js';

async function fetchGeo(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
  return res.json();
}

function ingest(store, geojson) {
  for (const feature of geojson.features) {
    const list = store.byTaxon[feature.properties.taxon];
    if (!list) continue;
    feature.properties._age = ageInfo(feature.properties);
    list.push(feature);
  }
}

export async function loadTrees() {
  const store = {
    byTaxon: Object.fromEntries(Object.keys(TAXA).map((k) => [k, []])),
    loaded: new Set(),
    generated: null,
  };
  const geojson = await fetchGeo('data/trees.geojson');
  ingest(store, geojson);
  for (const k of REDWOOD_KEYS) store.loaded.add(k);
  store.generated = geojson.generated ?? null;
  return store;
}

const pending = new Map();

export function loadNativeTaxon(store, taxon) {
  if (store.loaded.has(taxon)) return Promise.resolve(store.byTaxon[taxon]);
  if (!pending.has(taxon)) {
    pending.set(
      taxon,
      fetchGeo(`data/native/${taxon}.geojson`)
        .then((geojson) => {
          ingest(store, geojson);
          store.loaded.add(taxon);
          return store.byTaxon[taxon];
        })
        .catch((err) => {
          pending.delete(taxon); // allow retry on next toggle
          throw err;
        })
    );
  }
  return pending.get(taxon);
}

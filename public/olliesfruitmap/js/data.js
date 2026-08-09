// Data store: orchard stars load at boot; the rest lazy-load on first
// toggle.
import { TAXA, BOOT_KEYS } from './taxa.js';

async function fetchGeo(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
  return res.json();
}

function ingest(store, geojson) {
  for (const feature of geojson.features) {
    const list = store.byTaxon[feature.properties.taxon];
    if (list) list.push(feature);
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
  for (const k of BOOT_KEYS) store.loaded.add(k);
  store.generated = geojson.generated ?? null;
  return store;
}

const pending = new Map();

export function loadMoreTaxon(store, taxon) {
  if (store.loaded.has(taxon)) return Promise.resolve(store.byTaxon[taxon]);
  if (!pending.has(taxon)) {
    pending.set(
      taxon,
      fetchGeo(`data/more/${taxon}.geojson`)
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

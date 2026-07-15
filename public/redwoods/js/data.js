// Loads the committed GeoJSON snapshot and indexes it by taxon.
export async function loadTrees() {
  const res = await fetch('data/trees.geojson');
  if (!res.ok) throw new Error(`Failed to load tree data (HTTP ${res.status})`);
  const geojson = await res.json();

  const byTaxon = { sequoiadendron: [], sequoia: [], metasequoia: [] };
  for (const feature of geojson.features) {
    const list = byTaxon[feature.properties.taxon];
    if (list) list.push(feature);
  }

  return {
    features: geojson.features,
    byTaxon,
    generated: geojson.generated ?? null,
    counts: Object.fromEntries(Object.entries(byTaxon).map(([k, v]) => [k, v.length])),
  };
}

#!/usr/bin/env node
// Build-time data pipeline for Fruit for Ollie (public/fruitforollie/).
//
// Same shape as fetch-trees.mjs (redwoods): queries the three City of
// Portland ArcGIS layers, keeps edible fruit and nut trees, normalizes to
// one schema, dedupes heritage duplicates, and writes
// public/fruitforollie/data/trees.geojson (the boot-loaded orchard stars)
// plus data/more/<taxon>.geojson (lazy-loaded groups).
//
// Deliberately excluded: ornamental cultivars that don't set real fruit —
// callery pear, Japanese flowering cherry, ornamental crabapples, cherry
// laurels, chokecherry. Deliberately INCLUDED: Prunus cerasifera
// ("flowering plum") — its cherry plums are a Portland foraging staple.
//
// Usage:
//   node scripts/fetch-fruit.mjs                     # fetch live, archive raw, build
//   node scripts/fetch-fruit.mjs --offline           # rebuild from latest raw archive
//   node scripts/fetch-fruit.mjs --offline 2026-08-07  # rebuild from a snapshot

import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://www.portlandmaps.com/od/rest/services/COP_OpenData_Environment/MapServer';
const LAYERS = { heritage: 26, street: 1415, parks: 220 };
const PAGE = 1000;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'olliesfruitmap', 'data', 'trees.geojson');
const ARCHIVE_ROOT = join(ROOT, 'data-archive-fruit');

const argv = process.argv.slice(2);
const offlineIdx = argv.indexOf('--offline');
const OFFLINE = offlineIdx !== -1;
const OFFLINE_DATE = OFFLINE ? argv[offlineIdx + 1] ?? null : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJsonWithRetry(url, layerId, tries = 4) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`layer ${layerId}: HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i >= tries - 1) throw e;
      const wait = 2000 * 2 ** i;
      console.log(`  ${e.message} — retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
}

async function queryAll(layerId, where) {
  const features = [];
  let offset = 0;
  for (;;) {
    const params = new URLSearchParams({
      where,
      outFields: '*',
      outSR: '4326',
      f: 'geojson',
      resultOffset: String(offset),
      resultRecordCount: String(PAGE),
    });
    const json = await fetchJsonWithRetry(`${BASE}/${layerId}/query?${params}`, layerId);
    if (json.error) throw new Error(`layer ${layerId}: ${JSON.stringify(json.error)}`);
    const batch = json.features ?? [];
    features.push(...batch);
    const more = json.exceededTransferLimit || json.properties?.exceededTransferLimit || batch.length === PAGE;
    if (!more) return features;
    offset += batch.length;
    await sleep(250);
  }
}

// group 'orchard' ships in the boot-loaded trees.geojson; group 'more'
// each get their own lazily-fetched file under data/more/.
// Keep keys/colors in sync with public/fruitforollie/js/taxa.js.
const TAXA = {
  apple: { common: 'Apple', scientific: 'Malus domestica', group: 'orchard', match: /malus domestica/ },
  fig: { common: 'Fig', scientific: 'Ficus carica', group: 'orchard', match: /ficus carica/ },
  plum: { common: 'Plum & cherry plum', scientific: 'Prunus cerasifera, P. domestica & cvs.', group: 'more', match: /prunus \(plum|prunus cerasifera|prunus domestica/ },
  cherry: { common: 'Cherry', scientific: 'Prunus avium & cvs.', group: 'more', match: /prunus \(cherry|prunus avium/ },
  pear: { common: 'Pear', scientific: 'Pyrus communis & P. pyrifolia', group: 'more', match: /pyrus (?!calleryana)/ },
  stonefruit: { common: 'Peach & apricot', scientific: 'Prunus persica, P. armeniaca, P. dulcis', group: 'more', match: /prunus persica|prunus armeniaca|prunus dulcis/ },
  rare: { common: 'Persimmon & rare finds', scientific: 'Diospyros, Asimina, Cydonia, Mespilus, Eriobotrya', group: 'more', match: /diospyros|asimina|cydonia|mespilus|eriobotrya|persimmon|paw ?paw|quince|medlar|loquat/ },
  nuts: { common: 'Walnut & nuts', scientific: 'Juglans, Castanea, Corylus', group: 'more', match: /juglans|castanea|corylus|walnut|chestnut|hazel|filbert/ },
  berry: { common: 'Mulberry & serviceberry', scientific: 'Morus, Amelanchier', group: 'more', match: /morus|amelanchier|mulberry|serviceberry/ },
};

// Fruitless ornamentals that would otherwise sneak through the wide nets.
const EXCLUDE = /calleryana|serrulata|serrula\b|laurocerasus|lusitanica|virginiana|tschonoskii|ornamental|mume|maackii|padus|sargentii|subhirtella|yedoensis|x yedoensis/;

function classifyTaxon(scientific, common) {
  const s = `${scientific ?? ''} ${common ?? ''}`.toLowerCase();
  if (EXCLUDE.test(s)) return null;
  for (const [key, t] of Object.entries(TAXA)) if (t.match.test(s)) return key;
  return null;
}

const num = (v) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v * 10) / 10 : null;
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

// Keep the inventory's own species wording for the popup ("Malus domestica -
// apple (MADO)" -> "apple"), falling back to the taxon label.
function commonFrom(raw) {
  const m = /-\s*([^(]+?)\s*(\(|$)/.exec(raw ?? '');
  return m ? m[1].trim() : null;
}

function normalizeHeritage(f) {
  const p = f.properties;
  const taxon = classifyTaxon(p.SCIENTIFIC, p.COMMON);
  if (!taxon) return null;
  const heritageNumber = num(p.TREEID);
  const fact = str(p.Tree_fact_short) ?? str(p.Species_fact_short) ?? str(p.NOTES);
  const factAll = [p.Tree_fact_short, p.Tree_fact_long, p.Species_fact_short, p.NOTES]
    .filter(Boolean)
    .join(' ');
  const planted = factAll.match(/planted[^.]*?\b(1[89]\d\d)\b/i);
  return {
    planted: planted ? Number(planted[1]) : null,
    id: `heritage-${heritageNumber ?? `obj${p.OBJECTID}`}`,
    source: 'heritage',
    taxon,
    species: str(p.COMMON) ?? str(p.SCIENTIFIC),
    dbh_in: num(p.DIAMETER) ?? (num(p.CIRCUMF) ? Math.round((p.CIRCUMF * 12) / Math.PI) : null),
    height_ft: num(p.HEIGHT),
    condition: null,
    address: str(p.SITE_ADDRESS),
    heritage_number: heritageNumber,
    heritage_status: str(p.STATUS),
    year_designated: num(p.YEAR_Designated),
    portlandwild_url: heritageNumber ? `https://portlandwild.com/tree/${heritageNumber}` : null,
    notes: fact && fact.length > 220 ? `${fact.slice(0, 217)}...` : fact,
  };
}

function normalizeStreet(f) {
  const p = f.properties;
  const taxon = classifyTaxon(p.SPECIES, null);
  if (!taxon) return null;
  return {
    id: `street-${p.OBJECTID}`,
    source: 'street',
    taxon,
    species: commonFrom(p.SPECIES),
    dbh_in: num(p.DIAMETER),
    height_ft: null,
    condition: str(p.Condition),
    address: str(p.Address),
    notes: null,
  };
}

function normalizeParks(f) {
  const p = f.properties;
  const taxon = classifyTaxon(p.Genus_species, p.Common_name);
  if (!taxon) return null;
  return {
    id: `parks-${p.OBJECTID}`,
    source: 'parks',
    taxon,
    species: str(p.Common_name),
    dbh_in: num(p.DBH),
    height_ft: num(p.TreeHeight),
    condition: str(p.Condition),
    address: null,
    notes: str(p.Species_factoid),
  };
}

function haversineM([lon1, lat1], [lon2, lat2]) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const MERGE_M = 15;
function dedupe(heritage, others) {
  const kept = [];
  for (const o of others) {
    const [olon, olat] = o.geometry.coordinates;
    const match = heritage.find(
      (h) =>
        h.properties.taxon === o.properties.taxon &&
        Math.abs(h.geometry.coordinates[1] - olat) < 0.00027 &&
        Math.abs(h.geometry.coordinates[0] - olon) < 0.0004 &&
        haversineM(h.geometry.coordinates, o.geometry.coordinates) <= MERGE_M
    );
    if (match) {
      for (const k of ['dbh_in', 'height_ft', 'condition', 'address']) {
        if (match.properties[k] == null && o.properties[k] != null) {
          match.properties[k] = o.properties[k];
        }
      }
      const d = haversineM(match.geometry.coordinates, o.geometry.coordinates);
      console.log(`  merge: ${o.properties.id} -> ${match.properties.id} (${d.toFixed(1)}m)`);
    } else {
      kept.push(o);
    }
  }
  return kept;
}

function toFeature(geometry, props) {
  const properties = {};
  for (const [k, v] of Object.entries(props)) if (v != null) properties[k] = v;
  const t = TAXA[props.taxon];
  properties.common = properties.species ?? t.common;
  properties.scientific = t.scientific;
  delete properties.species;
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: geometry.coordinates.slice(0, 2).map((c) => Number(c.toFixed(6))),
    },
    properties,
  };
}

// Precise scientific-name nets per field; classifyTaxon() is the post-filter.
const SCI_TERMS = [
  'MALUS DOMESTICA',
  'FICUS CARICA',
  'PRUNUS (PLUM',
  'PRUNUS (CHERRY',
  'PRUNUS CERASIFERA',
  'PRUNUS DOMESTICA',
  'PRUNUS AVIUM',
  'PRUNUS PERSICA',
  'PRUNUS ARMENIACA',
  'PRUNUS DULCIS',
  'PYRUS SPP',
  'PYRUS COMMUNIS',
  'PYRUS PYRIFOLIA',
  'DIOSPYROS',
  'ASIMINA',
  'CYDONIA',
  'MESPILUS',
  'ERIOBOTRYA',
  'JUGLANS',
  'CASTANEA',
  'CORYLUS',
  'MORUS',
  'AMELANCHIER',
];
// Common-name nets for the layers that carry one (heritage registry uses
// plain-English names; wide is fine, the layers are small).
const COMMON_TERMS = [
  'APPLE', 'FIG', 'PLUM', 'CHERRY', 'PEAR', 'PEACH', 'APRICOT', 'PERSIMMON',
  'PAWPAW', 'PAW PAW', 'QUINCE', 'MEDLAR', 'LOQUAT', 'WALNUT', 'CHESTNUT',
  'HAZEL', 'FILBERT', 'MULBERRY', 'SERVICEBERRY',
];
const likes = (field, terms) => terms.map((t) => `UPPER(${field}) LIKE '%${t}%'`);
const WHERES = {
  heritage: `(${[...likes('SCIENTIFIC', SCI_TERMS), ...likes('COMMON', COMMON_TERMS)].join(' OR ')}) AND STATUS <> 'Removed'`,
  street: likes('SPECIES', SCI_TERMS).join(' OR '),
  parks: [...likes('Genus_species', SCI_TERMS), ...likes('Common_name', COMMON_TERMS)].join(' OR '),
};

async function fetchLive() {
  const raw = {};
  for (const layer of Object.keys(LAYERS)) {
    console.log(`Fetching ${layer} trees (layer ${LAYERS[layer]})...`);
    raw[layer] = await queryAll(LAYERS[layer], WHERES[layer]);
    console.log(`  ${raw[layer].length} raw`);
  }
  return raw;
}

async function writeArchive(date, raw) {
  const dir = join(ARCHIVE_ROOT, date);
  mkdirSync(dir, { recursive: true });
  for (const layer of Object.keys(LAYERS)) {
    writeFileSync(
      join(dir, `${layer}.raw.geojson`),
      JSON.stringify({ type: 'FeatureCollection', features: raw[layer] })
    );
  }
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify(
      {
        date,
        base: BASE,
        layers: LAYERS,
        where: WHERES,
        counts: Object.fromEntries(Object.keys(LAYERS).map((l) => [l, raw[l].length])),
      },
      null,
      2
    )
  );
  console.log(`Archived raw data to data-archive-fruit/${date}/`);
}

function loadArchive(date) {
  const resolved =
    date ??
    readdirSync(ARCHIVE_ROOT)
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort()
      .at(-1);
  if (!resolved || !existsSync(join(ARCHIVE_ROOT, resolved, 'manifest.json'))) {
    throw new Error(`No usable archive found under data-archive-fruit/${date ?? ''}`);
  }
  console.log(`Rebuilding offline from data-archive-fruit/${resolved}/`);
  const raw = {};
  for (const layer of Object.keys(LAYERS)) {
    raw[layer] = JSON.parse(
      readFileSync(join(ARCHIVE_ROOT, resolved, `${layer}.raw.geojson`), 'utf8')
    ).features;
    console.log(`  ${layer}: ${raw[layer].length} raw`);
  }
  return { raw, date: resolved };
}

// Densest square kilometre of orchard-star trees — feeds the featured-walk
// bounding box in js/walk.js (printed, then hand-copied there).
function densestCell(features) {
  const CELL = 0.005; // ~0.5 km
  const cells = new Map();
  for (const f of features) {
    const [lon, lat] = f.geometry.coordinates;
    const key = `${Math.floor(lat / CELL)}:${Math.floor(lon / CELL)}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }
  let best = null;
  for (const [key, n] of cells) if (!best || n > best.n) best = { key, n };
  const [latIdx, lonIdx] = best.key.split(':').map(Number);
  return {
    n: best.n,
    south: (latIdx * CELL).toFixed(4),
    north: ((latIdx + 1) * CELL).toFixed(4),
    west: (lonIdx * CELL).toFixed(4),
    east: ((lonIdx + 1) * CELL).toFixed(4),
  };
}

async function main() {
  let raw;
  let dataDate;
  if (OFFLINE) {
    ({ raw, date: dataDate } = loadArchive(OFFLINE_DATE));
  } else {
    raw = await fetchLive();
    dataDate = new Date().toISOString().slice(0, 10);
    await writeArchive(dataDate, raw);
  }
  const { heritage: rawHeritage, street: rawStreet, parks: rawParks } = raw;

  const lift = (raw, normalize) =>
    raw
      .filter((f) => f.geometry?.coordinates?.length >= 2)
      .map((f) => ({ geometry: f.geometry, properties: normalize(f) }))
      .filter((f) => f.properties);

  const heritage = lift(rawHeritage, normalizeHeritage);
  const street = lift(rawStreet, normalizeStreet);
  const parks = lift(rawParks, normalizeParks);

  console.log('Deduping against heritage points...');
  const others = dedupe(heritage, [...street, ...parks]);

  const all = [...heritage, ...others].map((f) => toFeature(f.geometry, f.properties));

  const counts = {};
  for (const f of all) {
    const { taxon, source } = f.properties;
    counts[taxon] = counts[taxon] ?? { total: 0, heritage: 0, street: 0, parks: 0 };
    counts[taxon].total++;
    counts[taxon][source]++;
  }
  console.log('\nSummary:');
  for (const [taxon, c] of Object.entries(counts)) {
    console.log(
      `  ${TAXA[taxon].common}: ${c.total} (heritage ${c.heritage}, street ${c.street}, parks ${c.parks})`
    );
  }
  console.log(`  TOTAL: ${all.length} (merged away ${street.length + parks.length - others.length})`);

  const orchardKeys = Object.keys(TAXA).filter((k) => TAXA[k].group === 'orchard');
  const stars = all.filter((f) => orchardKeys.includes(f.properties.taxon));
  const cell = densestCell(stars);
  console.log(
    `\nDensest orchard cell (${cell.n} trees) — for js/walk.js:\n` +
      `  { south: ${cell.south}, north: ${cell.north}, west: ${cell.west}, east: ${cell.east} }`
  );

  const fc = (features) =>
    JSON.stringify({
      type: 'FeatureCollection',
      generated: dataDate,
      attribution: 'City of Portland Urban Forestry open data',
      features,
    });
  const kb = (path) => `${Math.round(statSync(path).size / 1024)} KB`;

  const MORE_DIR = join(dirname(OUT), 'more');
  mkdirSync(MORE_DIR, { recursive: true });
  writeFileSync(OUT, fc(stars));
  console.log(`\nWrote ${OUT} (${stars.length} trees, ${kb(OUT)})`);
  for (const [key, t] of Object.entries(TAXA)) {
    if (t.group !== 'more') continue;
    const feats = all.filter((f) => f.properties.taxon === key);
    if (!feats.length) {
      console.log(`  warning: no ${t.common} records — more/${key}.geojson not written`);
      continue;
    }
    const path = join(MORE_DIR, `${key}.geojson`);
    writeFileSync(path, fc(feats));
    console.log(`Wrote ${path} (${feats.length} trees, ${kb(path)})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

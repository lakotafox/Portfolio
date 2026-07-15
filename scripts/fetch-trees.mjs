#!/usr/bin/env node
// Build-time data pipeline for the PDX Redwoods Map (public/redwoods/).
//
// Queries three City of Portland ArcGIS layers (heritage trees, street tree
// inventory, parks tree inventory), keeps only the redwood family
// (giant sequoia, coast redwood, dawn redwood), normalizes to one schema,
// dedupes heritage trees that also appear in the inventories, and writes
// public/redwoods/data/trees.geojson (committed — re-run manually for fresh
// data; the inventories change on a scale of years).
//
// Usage: node scripts/fetch-trees.mjs
// Field semantics documented in docs/schemas.md.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://www.portlandmaps.com/od/rest/services/COP_OpenData_Environment/MapServer';
const LAYERS = { heritage: 26, street: 1415, parks: 220 };
const PAGE = 1000;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'redwoods', 'data', 'trees.geojson');

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
    // ArcGIS puts exceededTransferLimit in different places depending on
    // format; the full-page check covers servers that omit it entirely.
    const more = json.exceededTransferLimit || json.properties?.exceededTransferLimit || batch.length === PAGE;
    if (!more) return features;
    offset += batch.length;
    await sleep(250);
  }
}

const TAXA = {
  sequoiadendron: { common: 'Giant sequoia', scientific: 'Sequoiadendron giganteum' },
  sequoia: { common: 'Coast redwood', scientific: 'Sequoia sempervirens' },
  metasequoia: { common: 'Dawn redwood', scientific: 'Metasequoia glyptostroboides' },
};

function classifyTaxon(scientific, common) {
  const s = `${scientific ?? ''} ${common ?? ''}`.toLowerCase();
  if (/sequoiadendron|giant sequoia/.test(s)) return 'sequoiadendron';
  if (/metasequoia|dawn redwood/.test(s)) return 'metasequoia';
  if (/sempervirens|coast redwood/.test(s)) return 'sequoia';
  if (/\bsequoia\b/.test(s)) {
    console.log(`  ambiguous bare "sequoia", treating as coast redwood: "${scientific}" / "${common}"`);
    return 'sequoia';
  }
  console.log(`  dropped non-target species: "${scientific}" / "${common}"`);
  return null;
}

const num = (v) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v * 10) / 10 : null;
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

function normalizeHeritage(f) {
  const p = f.properties;
  const taxon = classifyTaxon(p.SCIENTIFIC, p.COMMON);
  if (!taxon) return null;
  const heritageNumber = num(p.TREEID);
  const fact = str(p.Tree_fact_short) ?? str(p.Species_fact_short);
  return {
    id: `heritage-${heritageNumber ?? `obj${p.OBJECTID}`}`,
    source: 'heritage',
    taxon,
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

// Heritage trees also exist in the street/parks inventories. Drop the
// inventory copy when it sits within MERGE_M of a same-taxon heritage point,
// backfilling any measurements the heritage record lacks.
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
  properties.common = t.common;
  properties.scientific = t.scientific;
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: geometry.coordinates.slice(0, 2).map((c) => Number(c.toFixed(6))),
    },
    properties,
  };
}

async function main() {
  const wide = "UPPER({F}) LIKE '%SEQUOIA%' OR UPPER({F}) LIKE '%REDWOOD%'";
  console.log('Fetching heritage trees (layer 26)...');
  const rawHeritage = await queryAll(
    LAYERS.heritage,
    `(${wide.replaceAll('{F}', 'SCIENTIFIC')} OR ${wide.replaceAll('{F}', 'COMMON')}) AND STATUS <> 'Removed'`
  );
  console.log(`  ${rawHeritage.length} raw`);
  console.log('Fetching street trees (layer 1415)...');
  const rawStreet = await queryAll(LAYERS.street, wide.replaceAll('{F}', 'SPECIES'));
  console.log(`  ${rawStreet.length} raw`);
  console.log('Fetching parks trees (layer 220)...');
  const rawParks = await queryAll(
    LAYERS.parks,
    `${wide.replaceAll('{F}', 'Genus_species')} OR ${wide.replaceAll('{F}', 'Common_name')}`
  );
  console.log(`  ${rawParks.length} raw`);

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

  // Portland Wild's /tree/{id} pages 500 for unknown heritage numbers; verify
  // each link at build time and drop the dead ones so the UI never dead-ends.
  // Their site 403s non-browser user agents, so a 403 means "couldn't check",
  // not "dead" — only 404/5xx drop the link.
  console.log('Validating Portland Wild links...');
  for (const h of heritage) {
    const url = h.properties.portlandwild_url;
    if (!url) continue;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
      });
      if (res.status === 404 || res.status >= 500) {
        console.log(`  dead link (HTTP ${res.status}), dropping: ${url}`);
        h.properties.portlandwild_url = null;
      } else if (!res.ok) {
        console.log(`  could not verify (HTTP ${res.status}), keeping: ${url}`);
      }
    } catch (e) {
      console.log(`  could not verify (${e.message}), keeping: ${url}`);
    }
    await sleep(200);
  }

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

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify({
      type: 'FeatureCollection',
      generated: new Date().toISOString().slice(0, 10),
      attribution: 'City of Portland Urban Forestry open data',
      features: all,
    })
  );
  console.log(`\nWrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

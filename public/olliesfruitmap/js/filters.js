// Fruit chips (orchard stars on by default, the rest lazy-loaded on first
// toggle) + min-trunk / min-age sliders. Owns which markers are on the
// map; exposes the visibility predicate for the near-me list.
import { TAXA, BOOT_KEYS } from './taxa.js';
import { loadMoreTaxon } from './data.js';
import { click } from './sounds.js';

export function initFilters(map, groups, store, markerFor) {
  const strip = document.getElementById('stats-strip');
  const counter = document.getElementById('tree-counter');
  const active = new Set(BOOT_KEYS);
  let minDbh = 0;
  let minAge = 0;

  const passes = (p) => {
    if (minDbh && !(p.dbh_in >= minDbh)) return false;
    if (minAge && !(p._age && p._age.years >= minAge)) return false;
    return true;
  };

  const shown = {};

  function refreshTaxon(taxon) {
    const group = groups[taxon];
    group.clearLayers();
    if (!active.has(taxon)) {
      shown[taxon] = 0;
      return;
    }
    const markers = [];
    for (const f of store.byTaxon[taxon]) {
      if (passes(f.properties)) markers.push(markerFor(f));
    }
    group.addLayers(markers);
    shown[taxon] = markers.length;
  }

  function renderStats() {
    const total = Object.values(shown).reduce((a, b) => a + b, 0);
    // odometer-style counter, like a 1997 visitor counter
    counter.textContent = String(total).padStart(6, '0');
    const parts = [];
    for (const taxon of active) {
      parts.push(
        `<span class="stat">${TAXA[taxon].emoji} <b>${(shown[taxon] ?? 0).toLocaleString()}</b></span>`
      );
    }
    strip.innerHTML = parts.join('');
  }

  function refreshAll() {
    for (const taxon of Object.keys(groups)) refreshTaxon(taxon);
    renderStats();
  }

  // --- chips, generated from the taxa table into the two group containers
  function makeChip(taxon) {
    const t = TAXA[taxon];
    const chip = document.createElement('button');
    chip.className = 'w95-btn chip';
    chip.dataset.taxon = taxon;
    chip.setAttribute('aria-pressed', String(active.has(taxon)));
    chip.innerHTML = `<span class="chip-emoji">${t.emoji}</span><span class="chip-label">${t.label}</span>`;

    chip.addEventListener('click', async () => {
      if (chip.disabled) return;
      click();
      if (active.has(taxon)) {
        active.delete(taxon);
        map.removeLayer(groups[taxon]);
        chip.setAttribute('aria-pressed', 'false');
        refreshTaxon(taxon);
        renderStats();
        return;
      }
      if (!store.loaded.has(taxon)) {
        chip.disabled = true;
        chip.classList.add('loading');
        try {
          await loadMoreTaxon(store, taxon);
        } catch (err) {
          console.error(err);
          chip.title = 'Could not load this fruit — tap to retry';
          return;
        } finally {
          chip.disabled = false;
          chip.classList.remove('loading');
        }
      }
      active.add(taxon);
      chip.setAttribute('aria-pressed', 'true');
      map.addLayer(groups[taxon]);
      refreshTaxon(taxon);
      renderStats();
    });
    return chip;
  }

  const orchardBox = document.getElementById('chips-orchard');
  const moreBox = document.getElementById('chips-more');
  for (const taxon of Object.keys(TAXA)) {
    (TAXA[taxon].group === 'orchard' ? orchardBox : moreBox).appendChild(makeChip(taxon));
  }

  // --- sliders
  let debounce;
  function bindSlider(inputId, labelId, format, apply) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);
    input.addEventListener('input', () => {
      label.textContent = format(Number(input.value));
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        apply(Number(input.value));
        refreshAll();
      }, 150);
    });
  }
  bindSlider('min-dbh', 'min-dbh-label', (v) => (v ? `≥ ${v}"` : 'any'), (v) => (minDbh = v));
  bindSlider('min-age', 'min-age-label', (v) => (v ? `≥ ${v} yrs` : 'any'), (v) => (minAge = v));

  for (const taxon of active) map.addLayer(groups[taxon]);
  refreshAll();

  return {
    isVisible: (f) => active.has(f.properties.taxon) && passes(f.properties),
    visibleFeatures: () =>
      [...active].flatMap((taxon) => store.byTaxon[taxon].filter((f) => passes(f.properties))),
  };
}

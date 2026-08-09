// Fruit chips: orchard stars on by default, the rest lazy-loaded on first
// toggle. Owns which markers are on the map; exposes the visibility
// predicate for the near-me list and activate() for the orchard walk.
import { TAXA } from './taxa.js';
import { loadMoreTaxon } from './data.js';
import { click } from './sounds.js';

export function initFilters(map, groups, store, markerFor) {
  const strip = document.getElementById('stats-strip');
  const counter = document.getElementById('tree-counter');
  const active = new Set(); // nothing on until they pick a fruit
  const chipByTaxon = {};

  const shown = {};

  function refreshTaxon(taxon) {
    const group = groups[taxon];
    group.clearLayers();
    if (!active.has(taxon)) {
      shown[taxon] = 0;
      return;
    }
    const markers = store.byTaxon[taxon].map(markerFor);
    group.addLayers(markers);
    shown[taxon] = markers.length;
  }

  function renderStats() {
    const total = Object.values(shown).reduce((a, b) => a + b, 0);
    // odometer-style counter, like a 1997 visitor counter
    counter.textContent = String(total).padStart(6, '0');
    if (!active.size) {
      strip.innerHTML = '<span class="stat">no fruit selected — pick one up top!</span>';
      return;
    }
    const parts = [];
    for (const taxon of active) {
      parts.push(
        `<span class="stat">${TAXA[taxon].emoji} <b>${(shown[taxon] ?? 0).toLocaleString()}</b></span>`
      );
    }
    strip.innerHTML = parts.join('');
  }

  async function turnOn(taxon) {
    const chip = chipByTaxon[taxon];
    if (active.has(taxon)) return;
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
    document.getElementById('pick-hint')?.remove(); // they picked — hint done
    document.dispatchEvent(new CustomEvent('ofm:fruit-picked'));
  }

  // --- chips, generated from the taxa table into the two group containers
  function makeChip(taxon) {
    const t = TAXA[taxon];
    const chip = document.createElement('button');
    chip.className = 'w95-btn chip';
    chip.dataset.taxon = taxon;
    chip.setAttribute('aria-pressed', String(active.has(taxon)));
    chip.innerHTML = `<span class="chip-emoji">${t.emoji}</span><span class="chip-label">${t.label}</span>`;
    chipByTaxon[taxon] = chip;

    chip.addEventListener('click', () => {
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
      turnOn(taxon);
    });
    return chip;
  }

  const orchardBox = document.getElementById('chips-orchard');
  const moreBox = document.getElementById('chips-more');
  for (const taxon of Object.keys(TAXA)) {
    (TAXA[taxon].group === 'orchard' ? orchardBox : moreBox).appendChild(makeChip(taxon));
  }

  for (const taxon of active) map.addLayer(groups[taxon]);
  for (const taxon of Object.keys(groups)) refreshTaxon(taxon);
  renderStats();

  return {
    isVisible: (f) => active.has(f.properties.taxon),
    visibleFeatures: () => [...active].flatMap((taxon) => store.byTaxon[taxon]),
    activate: turnOn,
  };
}

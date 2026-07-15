// Species chips toggle cluster groups on/off and keep the stats strip live.
const LABELS = {
  sequoiadendron: 'giant sequoias',
  sequoia: 'coast redwoods',
  metasequoia: 'dawn redwoods',
};

export function initFilters(map, groups, data) {
  const strip = document.getElementById('stats-strip');
  const chips = document.querySelectorAll('.chip');
  const active = new Set(Object.keys(groups));

  function renderStats() {
    strip.innerHTML = Object.entries(LABELS)
      .map(([taxon, label]) => {
        const dim = active.has(taxon) ? '' : ' style="opacity:0.4"';
        return `<span class="stat"${dim}><b>${data.counts[taxon].toLocaleString()}</b> ${label}</span>`;
      })
      .join('');
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const taxon = chip.dataset.taxon;
      if (active.has(taxon)) {
        active.delete(taxon);
        map.removeLayer(groups[taxon]);
        chip.setAttribute('aria-pressed', 'false');
      } else {
        active.add(taxon);
        map.addLayer(groups[taxon]);
        chip.setAttribute('aria-pressed', 'true');
      }
      renderStats();
    });
  });

  renderStats();
  return { isActive: (taxon) => active.has(taxon) };
}

// Renders the verdict card, the ranked candidate list, and the quota chip.

import { attachSources } from './species-info.js';

export function band(score) {
  if (score >= 0.85) return 'high';
  if (score >= 0.5) return 'mid';
  return 'low';
}

const BAND_LABEL = {
  high: 'High confidence',
  mid: 'Likely match',
  low: 'Uncertain',
};

export function renderQuota(el, remaining) {
  if (remaining == null) {
    el.hidden = true;
    return;
  }
  el.textContent = `${remaining} identification${remaining === 1 ? '' : 's'} left today`;
  el.hidden = false;
}

export function renderVerdict(el, result) {
  const top = result.results[0];
  if (!top) {
    el.innerHTML = '<p class="verdict-name">No match found.</p>';
    return;
  }
  const b = band(top.score);
  const pct = Math.round(top.score * 100);
  el.className = `verdict band-${b}`;
  el.innerHTML = '';

  el.appendChild(node('div', 'verdict-label', BAND_LABEL[b]));
  el.appendChild(node('div', 'verdict-pct', `${pct}%`));
  el.appendChild(node('p', 'verdict-name', top.scientificName));
  if (top.commonName) el.appendChild(node('p', 'verdict-common', top.commonName));

  const taxon = [top.genus && `Genus ${top.genus}`, top.family && `Family ${top.family}`]
    .filter(Boolean)
    .join(' · ');
  if (taxon) el.appendChild(node('p', 'verdict-taxon', taxon));

  if (b === 'low') {
    el.appendChild(
      node('p', 'verdict-hint', 'Low confidence — add more photos (a flower or fruit helps most) for a better result.')
    );
  }

  // Expandable GBIF / Wikipedia / iNaturalist detail for the top guess.
  attachSources(el, top);
}

// Renders the candidate list into the <details> body and updates the summary count.
export function renderCandidates(listEl, result, opts = {}) {
  listEl.innerHTML = '';
  const rest = result.results.slice(1);

  if (opts.countEl) {
    opts.countEl.textContent = rest.length ? `(${rest.length})` : '';
  }
  if (opts.detailsEl) {
    opts.detailsEl.hidden = rest.length === 0; // hide the whole section if nothing to show
    opts.detailsEl.open = false; // always start collapsed on a fresh result
  }

  for (const r of rest) {
    listEl.appendChild(candidateRow(r));
  }
}

function candidateRow(r) {
  const li = document.createElement('li');
  li.className = 'candidate';

  const top = document.createElement('div');
  top.className = 'candidate-top';
  top.appendChild(node('span', 'candidate-name', r.scientificName));
  top.appendChild(node('span', 'candidate-score', `${Math.round(r.score * 100)}%`));
  li.appendChild(top);

  if (r.commonName) li.appendChild(node('p', 'candidate-common', r.commonName));

  const bar = document.createElement('div');
  bar.className = 'candidate-bar';
  const fill = document.createElement('span');
  fill.style.width = `${Math.max(2, Math.round(r.score * 100))}%`;
  bar.appendChild(fill);
  li.appendChild(bar);

  const taxon = [r.genus, r.family].filter(Boolean).join(' · ');
  if (taxon) li.appendChild(node('div', 'candidate-taxon', taxon));

  // Same expandable GBIF / Wikipedia / iNaturalist detail as the verdict card.
  attachSources(li, r);

  return li;
}

function node(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

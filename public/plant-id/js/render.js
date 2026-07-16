// Renders the verdict card, the ranked candidate list, and the quota chip.

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
}

export function renderCandidates(el, result) {
  el.innerHTML = '';
  const rest = result.results.slice(1);
  if (rest.length === 0) {
    el.appendChild(node('li', 'candidate-common', 'No other candidates.'));
    return;
  }
  for (const r of rest) {
    el.appendChild(candidateRow(r));
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

  const links = document.createElement('div');
  links.className = 'candidate-links';
  links.appendChild(link(r.links.gbif, 'GBIF'));
  links.appendChild(link(r.links.wikipedia, 'Wikipedia'));
  links.appendChild(link(r.links.inaturalist, 'iNaturalist'));
  li.appendChild(links);

  return li;
}

function link(href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = text;
  return a;
}

function node(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

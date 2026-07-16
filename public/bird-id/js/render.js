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

export function renderVerdict(el, top) {
  if (!top) {
    el.innerHTML = '<p class="verdict-name">No match found.</p>';
    el.className = 'verdict';
    return;
  }
  const b = band(top.score);
  const pct = Math.round(top.score * 100);
  el.className = `verdict band-${b}`;
  el.innerHTML = '';

  el.appendChild(node('div', 'verdict-label', BAND_LABEL[b]));
  el.appendChild(node('div', 'verdict-pct', `${pct}%`));
  el.appendChild(node('p', 'verdict-name', top.scientific));
  if (top.common) el.appendChild(node('p', 'verdict-common', top.common));

  if (b === 'low') {
    el.appendChild(
      node('p', 'verdict-hint', 'Low confidence — try a longer, clearer recording for better results.')
    );
  }

  const links = document.createElement('div');
  links.className = 'verdict-links';
  links.appendChild(extLink(`https://en.wikipedia.org/wiki/${encodeURIComponent(top.scientific)}`, 'Wikipedia'));
  links.appendChild(extLink(`https://ebird.org/species/${ebirdCode(top.scientific, top.common)}`, 'eBird'));
  links.appendChild(extLink(`https://www.inaturalist.org/search?q=${encodeURIComponent(top.scientific)}`, 'iNaturalist'));
  links.appendChild(extLink(`https://xeno-canto.org/explore?query=${encodeURIComponent(top.scientific)}`, 'Xeno-canto'));
  el.appendChild(links);
}

export function renderCandidates(el, countEl, detailsEl, results) {
  el.innerHTML = '';
  const rest = results.slice(1).filter((r) => r.score > 0.01);
  if (rest.length === 0) {
    detailsEl.hidden = true;
    return;
  }
  countEl.textContent = `(${rest.length})`;
  detailsEl.hidden = false;
  for (const r of rest) {
    el.appendChild(candidateRow(r));
  }
}

function candidateRow(r) {
  const li = document.createElement('li');
  li.className = 'candidate';

  const top = document.createElement('div');
  top.className = 'candidate-top';
  top.appendChild(node('span', 'candidate-name', r.scientific));
  top.appendChild(node('span', 'candidate-score', `${Math.round(r.score * 100)}%`));
  li.appendChild(top);

  if (r.common) li.appendChild(node('p', 'candidate-common', r.common));

  const bar = document.createElement('div');
  bar.className = 'candidate-bar';
  const fill = document.createElement('span');
  fill.style.width = `${Math.max(2, Math.round(r.score * 100))}%`;
  bar.appendChild(fill);
  li.appendChild(bar);

  const links = document.createElement('div');
  links.className = 'candidate-links';
  links.appendChild(extLink(`https://en.wikipedia.org/wiki/${encodeURIComponent(r.scientific)}`, 'Wikipedia'));
  links.appendChild(extLink(`https://ebird.org/species/${ebirdCode(r.scientific, r.common)}`, 'eBird'));
  links.appendChild(extLink(`https://www.inaturalist.org/search?q=${encodeURIComponent(r.scientific)}`, 'iNaturalist'));
  li.appendChild(links);

  return li;
}

function ebirdCode(scientific, common) {
  const name = (common || scientific).toLowerCase().replace(/[^a-z0-9]+/g, '');
  return encodeURIComponent(name.slice(0, 6) || scientific.slice(0, 6));
}

function extLink(href, text) {
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

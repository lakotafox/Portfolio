// In-app species info: turns the GBIF / Wikipedia / iNaturalist source pills into
// expandable panels that fetch and show a summary right here, instead of jumping to
// another site. Each external site still has an escape-hatch link inside its panel.
//
// All three public APIs send `Access-Control-Allow-Origin: *`, so the browser can
// call them directly — no serverless proxy needed. Results are cached per species so
// re-opening a panel (or opening it on another card for the same plant) is instant.

const WIKI_UA = 'lakotafox.com Plant Identifier (contact via lakotafox.com)';

// species key -> { wikipedia, gbif, inaturalist } promise cache
const cache = new Map();

function speciesKey(sp) {
  return `${sp.scientificName}|${sp.gbifId || ''}`;
}

const SOURCES = [
  { id: 'wikipedia', label: 'Wikipedia' },
  { id: 'gbif', label: 'GBIF' },
  { id: 'inaturalist', label: 'iNaturalist' },
];

// Public: append a source strip (pills + a shared panel area) to `container`.
export function attachSources(container, species) {
  if (!species || !species.links) return;

  const wrap = document.createElement('div');
  wrap.className = 'sources';

  const tabs = document.createElement('div');
  tabs.className = 'source-tabs';

  const panel = document.createElement('div');
  panel.className = 'source-panel';
  panel.hidden = true;

  let openId = null;

  for (const src of SOURCES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'source-tab';
    btn.dataset.src = src.id;
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = src.label;
    btn.addEventListener('click', () => {
      if (openId === src.id) {
        // second click on the open tab collapses it
        openId = null;
        panel.hidden = true;
        setActive(tabs, null);
        return;
      }
      openId = src.id;
      setActive(tabs, src.id);
      panel.hidden = false;
      renderPanel(panel, src, species);
    });
    tabs.appendChild(btn);
  }

  wrap.appendChild(tabs);
  wrap.appendChild(panel);
  container.appendChild(wrap);
}

function setActive(tabs, id) {
  for (const b of tabs.querySelectorAll('.source-tab')) {
    const on = b.dataset.src === id;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-expanded', String(on));
  }
}

function renderPanel(panel, src, species) {
  panel.innerHTML = '';
  panel.dataset.src = src.id;
  panel.appendChild(spinner(`Loading from ${src.label}…`));

  load(src.id, species).then(
    (data) => {
      // Guard: user may have switched panels before this resolved.
      if (panel.dataset.src !== src.id) return;
      panel.innerHTML = '';
      panel.appendChild(VIEWS[src.id](data, species));
    },
    () => {
      if (panel.dataset.src !== src.id) return;
      panel.innerHTML = '';
      panel.appendChild(errorView(src, species));
    }
  );
}

// ---------- fetching (cached per species) ----------

function load(srcId, species) {
  const key = speciesKey(species);
  let entry = cache.get(key);
  if (!entry) {
    entry = {};
    cache.set(key, entry);
  }
  if (!entry[srcId]) {
    entry[srcId] = FETCHERS[srcId](species);
  }
  return entry[srcId];
}

const FETCHERS = {
  async wikipedia(sp) {
    const title = encodeURIComponent(sp.scientificName.replace(/ /g, '_'));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { 'Api-User-Agent': WIKI_UA },
    });
    if (!res.ok) throw new Error(`wiki ${res.status}`);
    const d = await res.json();
    if (d.type === 'disambiguation' || !d.extract) throw new Error('no summary');
    return {
      title: d.title,
      description: d.description || null,
      extract: d.extract,
      thumb: d.thumbnail ? d.thumbnail.source : null,
      page: (d.content_urls && d.content_urls.desktop && d.content_urls.desktop.page) || sp.links.wikipedia,
    };
  },

  async gbif(sp) {
    // Prefer the exact backbone record Pl@ntNet gave us; fall back to a name match.
    let d;
    if (sp.gbifId) {
      const res = await fetch(`https://api.gbif.org/v1/species/${encodeURIComponent(sp.gbifId)}`);
      if (res.ok) d = await res.json();
    }
    if (!d || !d.key) {
      const res = await fetch(
        `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(sp.scientificName)}`
      );
      if (!res.ok) throw new Error(`gbif ${res.status}`);
      const m = await res.json();
      if (!m.usageKey) throw new Error('no gbif match');
      d = { ...m, key: m.usageKey };
    }
    const key = d.key || d.usageKey;
    let occurrences = null;
    try {
      const oc = await fetch(
        `https://api.gbif.org/v1/occurrence/search?taxonKey=${encodeURIComponent(key)}&limit=0`
      );
      if (oc.ok) occurrences = (await oc.json()).count;
    } catch {
      /* occurrence count is a nice-to-have */
    }
    return {
      status: d.taxonomicStatus || d.status || null,
      classification: [
        ['Kingdom', d.kingdom],
        ['Phylum', d.phylum],
        ['Class', d.class],
        ['Order', d.order],
        ['Family', d.family],
        ['Genus', d.genus],
        ['Species', d.species || d.canonicalName],
      ].filter((row) => row[1]),
      vernacular: d.vernacularName || null,
      occurrences,
      page: key ? `https://www.gbif.org/species/${key}` : sp.links.gbif,
    };
  },

  async inaturalist(sp) {
    const res = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(sp.scientificName)}&per_page=1&rank=species`
    );
    if (!res.ok) throw new Error(`inat ${res.status}`);
    const d = await res.json();
    const t = (d.results || [])[0];
    if (!t) throw new Error('no inat taxon');
    const photo = t.default_photo || null;
    return {
      commonName: t.preferred_common_name || null,
      observations: typeof t.observations_count === 'number' ? t.observations_count : null,
      conservation: t.conservation_status ? t.conservation_status.status_name || t.conservation_status.status : null,
      photo: photo ? photo.medium_url || photo.square_url : null,
      photoCredit: photo ? photo.attribution : null,
      page: `https://www.inaturalist.org/taxa/${t.id}`,
    };
  },
};

// ---------- views ----------

const VIEWS = {
  wikipedia(d) {
    const frag = document.createDocumentFragment();
    if (d.thumb) frag.appendChild(thumb(d.thumb, d.title));
    if (d.description) frag.appendChild(node('p', 'panel-sub', d.description));
    frag.appendChild(node('p', 'panel-text', d.extract));
    frag.appendChild(externalLink(d.page, 'Read full article on Wikipedia'));
    return frag;
  },

  gbif(d) {
    const frag = document.createDocumentFragment();

    if (d.classification.length) {
      const chips = document.createElement('div');
      chips.className = 'taxo-chips';
      for (const [rank, name] of d.classification) {
        const chip = document.createElement('span');
        chip.className = 'taxo-chip';
        chip.appendChild(node('span', 'taxo-rank', rank));
        chip.appendChild(node('span', 'taxo-name', name));
        chips.appendChild(chip);
      }
      frag.appendChild(chips);
    }

    const facts = [];
    if (d.status) facts.push(`Taxonomic status: ${titleCase(d.status)}`);
    if (typeof d.occurrences === 'number') {
      facts.push(`${d.occurrences.toLocaleString()} recorded occurrences worldwide`);
    }
    for (const f of facts) frag.appendChild(node('p', 'panel-fact', f));

    frag.appendChild(externalLink(d.page, 'View record on GBIF'));
    return frag;
  },

  inaturalist(d) {
    const frag = document.createDocumentFragment();
    if (d.photo) frag.appendChild(thumb(d.photo, d.commonName || 'Observation photo', d.photoCredit));
    if (d.commonName) frag.appendChild(node('p', 'panel-sub', titleCase(d.commonName)));
    if (typeof d.observations === 'number') {
      frag.appendChild(node('p', 'panel-fact', `${d.observations.toLocaleString()} observations logged by the iNaturalist community`));
    }
    if (d.conservation) {
      frag.appendChild(node('p', 'panel-fact', `Conservation status: ${titleCase(d.conservation)}`));
    }
    frag.appendChild(externalLink(d.page, 'Explore on iNaturalist'));
    return frag;
  },
};

function errorView(src, species) {
  const frag = document.createDocumentFragment();
  frag.appendChild(node('p', 'panel-text', `Couldn't load details from ${src.label} right now.`));
  frag.appendChild(externalLink(species.links[src.id], `Open ${src.label} in a new tab`));
  return frag;
}

// ---------- small DOM helpers ----------

function spinner(text) {
  const wrap = document.createElement('div');
  wrap.className = 'panel-loading';
  const dot = document.createElement('span');
  dot.className = 'panel-spinner';
  dot.setAttribute('aria-hidden', 'true');
  wrap.appendChild(dot);
  wrap.appendChild(node('span', 'panel-loading-text', text));
  return wrap;
}

function thumb(src, alt, credit) {
  const fig = document.createElement('figure');
  fig.className = 'panel-figure';
  const img = document.createElement('img');
  img.className = 'panel-thumb';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = src;
  img.alt = alt || '';
  fig.appendChild(img);
  if (credit) {
    const cap = node('figcaption', 'panel-credit', credit);
    fig.appendChild(cap);
  }
  return fig;
}

function externalLink(href, text) {
  const a = document.createElement('a');
  a.className = 'panel-external';
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = text;
  const arrow = node('span', 'panel-external-arrow', '↗'); // ↗
  arrow.setAttribute('aria-hidden', 'true');
  a.appendChild(arrow);
  return a;
}

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

function titleCase(s) {
  return String(s).replace(/\b\w/g, (c) => c.toUpperCase());
}

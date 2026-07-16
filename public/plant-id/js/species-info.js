// In-app species info: the GBIF / Wikipedia / iNaturalist pills expand into rich,
// in-page panels that pull the real depth of data from each source and render it
// here, with a "Source" credit + link to the original at the bottom of each panel.
//
// All three public APIs send `Access-Control-Allow-Origin: *`, so the browser calls
// them directly (no serverless proxy). Each source may fan out to several endpoints;
// results are cached per species so re-opening a panel is instant.

const WIKI_UA = 'lakotafox.com Plant Identifier (contact via lakotafox.com)';

// species key -> { wikipedia, gbif, inaturalist } promise cache
const cache = new Map();

function speciesKey(sp) {
  return `${sp.scientificName}|${sp.gbifId || ''}`;
}

const SOURCES = [
  { id: 'wikipedia', label: 'Wikipedia', name: 'Wikipedia' },
  { id: 'gbif', label: 'GBIF', name: 'GBIF (Global Biodiversity Information Facility)' },
  { id: 'inaturalist', label: 'iNaturalist', name: 'iNaturalist' },
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
      if (panel.dataset.src !== src.id) return; // user switched panels mid-fetch
      panel.innerHTML = '';
      panel.appendChild(VIEWS[src.id](data, species, src));
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

const okJson = (res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status))));
const softJson = (url, opts) => fetch(url, opts).then(okJson).catch(() => null);

const FETCHERS = {
  async wikipedia(sp) {
    // MediaWiki Action API: full plain-text article + lead image + short description.
    const api =
      'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1' +
      '&prop=extracts%7Cpageimages%7Cdescription&explaintext=1&piprop=original%7Cthumbnail&pithumbsize=640' +
      `&titles=${encodeURIComponent(sp.scientificName)}`;
    const res = await fetch(api, { headers: { 'Api-User-Agent': WIKI_UA } });
    if (!res.ok) throw new Error(`wiki ${res.status}`);
    const d = await res.json();
    const page = Object.values((d.query && d.query.pages) || {})[0];
    if (!page || page.missing !== undefined || !page.extract) throw new Error('no article');
    const resolved = page.title || sp.scientificName;
    return {
      title: resolved,
      description: page.description || null,
      sections: parseSections(page.extract),
      image: (page.original && page.original.source) || (page.thumbnail && page.thumbnail.source) || null,
      page: `https://en.wikipedia.org/wiki/${encodeURIComponent(resolved.replace(/ /g, '_'))}`,
    };
  },

  async gbif(sp) {
    // Resolve the backbone key (prefer Pl@ntNet's, fall back to a name match).
    let key = sp.gbifId || null;
    let detail = null;
    if (key) detail = await softJson(`https://api.gbif.org/v1/species/${encodeURIComponent(key)}`);
    if (!detail || !detail.key) {
      const m = await softJson(
        `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(sp.scientificName)}`
      );
      if (!m || !m.usageKey) throw new Error('no gbif match');
      key = m.usageKey;
      detail = await softJson(`https://api.gbif.org/v1/species/${key}`);
    }
    key = (detail && detail.key) || key;

    const [descs, verns, dists, profiles, occ] = await Promise.all([
      softJson(`https://api.gbif.org/v1/species/${key}/descriptions?limit=25`),
      softJson(`https://api.gbif.org/v1/species/${key}/vernacularNames?limit=60`),
      softJson(`https://api.gbif.org/v1/species/${key}/distributions?limit=60`),
      softJson(`https://api.gbif.org/v1/species/${key}/speciesProfiles?limit=10`),
      softJson(`https://api.gbif.org/v1/occurrence/search?taxonKey=${key}&limit=0`),
    ]);

    // Merge habitat/extinct flags from the profile records.
    const profile = { marine: null, freshwater: null, terrestrial: null, extinct: null, habitat: null };
    for (const p of (profiles && profiles.results) || []) {
      for (const k of Object.keys(profile)) {
        if (p[k] != null && profile[k] == null) profile[k] = p[k];
      }
    }

    // Dedupe vernacular names case-insensitively, keep first casing + language.
    const seen = new Set();
    const vernacular = [];
    for (const v of (verns && verns.results) || []) {
      const n = v.vernacularName;
      if (!n) continue;
      const k = n.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      vernacular.push({ name: n, lang: v.language || null });
    }

    // Unique distribution regions.
    const regSeen = new Set();
    const regions = [];
    for (const r of (dists && dists.results) || []) {
      const name = r.locality || r.country || r.area;
      if (!name || regSeen.has(name)) continue;
      regSeen.add(name);
      regions.push(name);
    }

    // Keep readable descriptions (skip empty; label by type).
    const descriptions = [];
    for (const r of (descs && descs.results) || []) {
      const text = (r.description || '').trim();
      if (text.length < 3) continue;
      descriptions.push({ type: r.type || null, text: text.length > 600 ? text.slice(0, 600) + '…' : text });
    }

    return {
      classification: [
        ['Kingdom', detail.kingdom],
        ['Phylum', detail.phylum],
        ['Class', detail.class],
        ['Order', detail.order],
        ['Family', detail.family],
        ['Genus', detail.genus],
        ['Species', detail.species || detail.canonicalName],
      ].filter((row) => row[1]),
      authorship: detail.authorship || null,
      status: detail.taxonomicStatus || detail.status || null,
      profile,
      vernacular,
      regions,
      descriptions,
      occurrences: occ && typeof occ.count === 'number' ? occ.count : null,
      page: `https://www.gbif.org/species/${key}`,
    };
  },

  async inaturalist(sp) {
    const search = await softJson(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(sp.scientificName)}&per_page=5&rank=species`
    );
    const results = (search && search.results) || [];
    const match =
      results.find((r) => (r.name || '').toLowerCase() === sp.scientificName.toLowerCase()) || results[0];
    if (!match) throw new Error('no inat taxon');

    const detail = await softJson(`https://api.inaturalist.org/v1/taxa/${match.id}`);
    const t = (detail && detail.results && detail.results[0]) || match;

    const photos = ((t.taxon_photos || []).map((p) => p.photo).filter(Boolean).length
      ? t.taxon_photos.map((p) => p.photo)
      : t.default_photo
      ? [t.default_photo]
      : []
    )
      .filter(Boolean)
      .slice(0, 8)
      .map((ph) => ({ url: ph.medium_url || ph.square_url, attr: ph.attribution || null }));

    return {
      commonName: t.preferred_common_name || null,
      observations: typeof t.observations_count === 'number' ? t.observations_count : null,
      conservation:
        (t.conservation_status && (t.conservation_status.status_name || t.conservation_status.status)) || null,
      extinct: t.extinct || false,
      ancestors: (t.ancestors || [])
        .filter((a) => a.rank !== 'stateofmatter')
        .map((a) => ({ name: a.name, common: a.preferred_common_name || null, rank: a.rank })),
      summary: stripHtml(t.wikipedia_summary),
      photos,
      page: `https://www.inaturalist.org/taxa/${t.id}`,
    };
  },
};

// ---------- views (content first, source credit last) ----------

const VIEWS = {
  wikipedia(d, sp, src) {
    const frag = document.createDocumentFragment();
    if (d.image) frag.appendChild(thumb(d.image, d.title));
    if (d.description) frag.appendChild(node('p', 'panel-sub', titleCase(d.description)));
    for (const sec of d.sections) {
      if (sec.heading) frag.appendChild(node('h4', 'panel-section-title', sec.heading));
      // A section can have several paragraphs.
      for (const para of sec.text.split(/\n{2,}/)) {
        const p = para.trim();
        if (p) frag.appendChild(node('p', 'panel-text', p));
      }
    }
    frag.appendChild(sourceFooter(src.name, d.page, 'Read the full article on Wikipedia'));
    return frag;
  },

  gbif(d, sp, src) {
    const frag = document.createDocumentFragment();

    if (d.classification.length) {
      frag.appendChild(sectionTitle('Classification'));
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
    if (d.authorship) facts.push(`Author: ${d.authorship}`);
    if (d.status) facts.push(`Taxonomic status: ${titleCase(d.status)}`);
    const habitats = [];
    if (d.profile.terrestrial) habitats.push('terrestrial');
    if (d.profile.freshwater) habitats.push('freshwater');
    if (d.profile.marine) habitats.push('marine');
    if (habitats.length) facts.push(`Habitat: ${habitats.join(', ')}`);
    if (d.profile.extinct === true) facts.push('Flagged as extinct');
    if (typeof d.occurrences === 'number') {
      facts.push(`${d.occurrences.toLocaleString()} recorded occurrences worldwide`);
    }
    if (facts.length) {
      frag.appendChild(sectionTitle('Overview'));
      for (const f of facts) frag.appendChild(node('p', 'panel-fact', f));
    }

    if (d.vernacular.length) {
      frag.appendChild(sectionTitle(`Also known as (${d.vernacular.length})`));
      frag.appendChild(chipRow(d.vernacular.map((v) => (v.lang ? `${v.name} · ${v.lang}` : v.name))));
    }

    if (d.regions.length) {
      frag.appendChild(sectionTitle(`Recorded distribution (${d.regions.length})`));
      frag.appendChild(chipRow(d.regions));
    }

    if (d.descriptions.length) {
      frag.appendChild(sectionTitle('Descriptions'));
      for (const desc of d.descriptions.slice(0, 8)) {
        if (desc.type) frag.appendChild(node('p', 'panel-desc-type', titleCase(desc.type)));
        frag.appendChild(node('p', 'panel-text', desc.text));
      }
    }

    frag.appendChild(sourceFooter(src.name, d.page, 'View the full record on GBIF'));
    return frag;
  },

  inaturalist(d, sp, src) {
    const frag = document.createDocumentFragment();

    if (d.photos.length) frag.appendChild(gallery(d.photos));
    if (d.commonName) frag.appendChild(node('p', 'panel-sub', titleCase(d.commonName)));

    const facts = [];
    if (typeof d.observations === 'number') {
      facts.push(`${d.observations.toLocaleString()} observations logged by the community`);
    }
    if (d.conservation) facts.push(`Conservation status: ${titleCase(d.conservation)}`);
    if (d.extinct) facts.push('Flagged as extinct');
    for (const f of facts) frag.appendChild(node('p', 'panel-fact', f));

    if (d.summary) frag.appendChild(node('p', 'panel-text', d.summary));

    if (d.ancestors.length) {
      frag.appendChild(sectionTitle('Lineage'));
      const trail = document.createElement('div');
      trail.className = 'panel-ancestry';
      d.ancestors.forEach((a, i) => {
        if (i) trail.appendChild(node('span', 'ancestry-sep', '›')); // ›
        const label = a.common ? `${a.name} (${a.common})` : a.name;
        trail.appendChild(node('span', 'ancestry-node', label));
      });
      frag.appendChild(trail);
    }

    frag.appendChild(sourceFooter(src.name, d.page, 'Explore this species on iNaturalist'));
    return frag;
  },
};

function errorView(src, species) {
  const frag = document.createDocumentFragment();
  frag.appendChild(node('p', 'panel-text', `Couldn't load details from ${src.label} right now.`));
  frag.appendChild(sourceFooter(src.name, species.links[src.id], `Open ${src.label} in a new tab`));
  return frag;
}

// ---------- content helpers ----------

// Split a Wikipedia plaintext extract into { heading, text } sections, dropping the
// reference/navigation tail sections that carry no readable prose.
const SKIP_SECTIONS = new Set([
  'references', 'external links', 'see also', 'notes', 'further reading',
  'bibliography', 'citations', 'sources', 'footnotes', 'gallery',
]);
function parseSections(extract) {
  const lines = extract.split('\n');
  const sections = [];
  let cur = { heading: null, text: '' };
  const push = () => {
    cur.text = cur.text.trim();
    if (cur.text) sections.push(cur);
  };
  for (const line of lines) {
    const m = line.match(/^\s*(==+)\s*(.+?)\s*==+\s*$/);
    if (m) {
      push();
      cur = { heading: m[2], text: '' };
    } else {
      cur.text += line + '\n';
    }
  }
  push();
  return sections.filter((s) => !s.heading || !SKIP_SECTIONS.has(s.heading.toLowerCase()));
}

function stripHtml(html) {
  if (!html) return null;
  const txt = new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
  return txt.trim() || null;
}

function sectionTitle(text) {
  return node('h4', 'panel-section-title', text);
}

function chipRow(items) {
  const row = document.createElement('div');
  row.className = 'info-chips';
  for (const it of items) row.appendChild(node('span', 'info-chip', it));
  return row;
}

function gallery(photos) {
  const strip = document.createElement('div');
  strip.className = 'panel-gallery';
  for (const p of photos) {
    if (!p.url) continue;
    const fig = document.createElement('figure');
    fig.className = 'gallery-item';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = p.url;
    img.alt = '';
    img.onerror = () => fig.remove();
    fig.appendChild(img);
    if (p.attr) fig.appendChild(node('figcaption', 'gallery-credit', p.attr));
    strip.appendChild(fig);
  }
  return strip;
}

function sourceFooter(name, href, linkText) {
  const foot = document.createElement('div');
  foot.className = 'panel-source';
  foot.appendChild(node('span', 'panel-source-label', `Source: ${name}`));
  foot.appendChild(externalLink(href, linkText));
  return foot;
}

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

function thumb(src, alt) {
  const fig = document.createElement('figure');
  fig.className = 'panel-figure';
  const img = document.createElement('img');
  img.className = 'panel-thumb';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = src;
  img.alt = alt || '';
  img.onerror = () => fig.remove();
  fig.appendChild(img);
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

// Pl@ntNet provider — forwards an image set to the Pl@ntNet v2 identify API and
// normalizes the response into our internal shape.
//
// Uses only Node globals (fetch, FormData, Blob, Buffer), which are available on
// Netlify's Node 18+/20 runtime. No npm dependencies.

const API_HOST = 'https://my-api.plantnet.org';
const VALID_ORGANS = new Set(['auto', 'leaf', 'flower', 'fruit', 'bark']);

// Build the outbound multipart request and call Pl@ntNet.
export async function identify({ images, project, lang, noReject, nbResults, apiKey }) {
  const form = new FormData();
  for (const { data, organ } of images) {
    const buf = Buffer.from(data, 'base64');
    const blob = new Blob([buf], { type: 'image/jpeg' });
    form.append('images', blob, 'photo.jpg');
    form.append('organs', VALID_ORGANS.has(organ) ? organ : 'auto');
  }

  const qs = new URLSearchParams({
    'api-key': apiKey,
    lang: lang || 'en',
    'nb-results': String(nbResults || 10),
    'no-reject': String(!!noReject),
    'include-related-images': 'false',
  });

  const url = `${API_HOST}/v2/identify/${encodeURIComponent(project || 'all')}?${qs}`;

  // Do NOT set Content-Type manually — passing a FormData to fetch generates the
  // correct `multipart/form-data; boundary=...` header automatically.
  let res;
  try {
    res = await fetch(url, { method: 'POST', body: form });
  } catch (e) {
    throw providerError(502, 'UPSTREAM', 'Could not reach the identification service.');
  }

  const remaining = numOrNull(res.headers.get('x-remaining-requests'));

  if (res.status === 404) {
    throw providerError(404, 'NOT_A_PLANT', "That didn't look like a plant.", remaining);
  }
  if (res.status === 401 || res.status === 403) {
    throw providerError(502, 'UNAUTHORIZED', 'The identification service rejected the API key.');
  }
  if (res.status === 429) {
    throw providerError(429, 'RATE_LIMITED', "Today's identification quota is used up.", remaining);
  }
  if (res.status === 413) {
    throw providerError(413, 'PAYLOAD_TOO_LARGE', 'Those photos were too large.');
  }
  if (!res.ok) {
    throw providerError(502, 'UPSTREAM', 'The identification service returned an error.');
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw providerError(502, 'UPSTREAM', 'The identification service returned an unreadable response.');
  }

  return normalize(data);
}

function normalize(d) {
  const results = (d.results || []).map((r) => {
    const sp = r.species || {};
    const scientificName = sp.scientificNameWithoutAuthor || sp.scientificName || 'Unknown';
    const commonNames = Array.isArray(sp.commonNames) ? sp.commonNames : [];
    const gbifId = r.gbif && r.gbif.id != null ? String(r.gbif.id) : null;
    return {
      score: typeof r.score === 'number' ? r.score : 0,
      scientificName,
      commonName: commonNames[0] || null,
      commonNames,
      genus: (sp.genus && sp.genus.scientificNameWithoutAuthor) || null,
      family: (sp.family && sp.family.scientificNameWithoutAuthor) || null,
      gbifId,
      links: buildLinks(scientificName, gbifId),
    };
  });

  return {
    ok: true,
    bestMatch: d.bestMatch || (results[0] && results[0].scientificName) || null,
    remaining: numOrNull(d.remainingIdentificationRequests),
    results,
  };
}

function buildLinks(scientificName, gbifId) {
  const q = encodeURIComponent(scientificName);
  return {
    gbif: gbifId
      ? `https://www.gbif.org/species/${gbifId}`
      : `https://www.gbif.org/species/search?q=${q}`,
    wikipedia: `https://en.wikipedia.org/wiki/${scientificName.replace(/ /g, '_')}`,
    inaturalist: `https://www.inaturalist.org/search?q=${q}`,
  };
}

function numOrNull(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function providerError(status, code, message, remaining) {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  if (remaining != null) e.remaining = remaining;
  return e;
}

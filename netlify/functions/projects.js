// Serverless proxy for Pl@ntNet's flora list ("projects").
//
// The browser can't call Pl@ntNet directly (the API key must stay server-side), so
// this returns the current list of floras — optionally narrowed to a GPS location —
// which the app uses to pick a regional flora for more accurate identification.
//
// Contract
//   Request  (GET):  /projects?lat=<num>&lon=<num>&lang=en   (lat/lon optional)
//   Response (200):  { ok:true, best:{id,title,speciesCount}|null, projects:[...] }
//   Error    (JSON): { ok:false, code, message }

const API_HOST = 'https://my-api.plantnet.org';
const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, code: 'BAD_REQUEST', message: 'Use GET.' });
  }

  const apiKey = process.env.PLANTNET_API_KEY || process.env.Plant_key;
  if (!apiKey) {
    return json(500, { ok: false, code: 'NOT_CONFIGURED', message: 'Missing identification API key.' });
  }

  const q = event.queryStringParameters || {};
  const qs = new URLSearchParams({ 'api-key': apiKey, lang: q.lang || 'en' });
  // Only forward coordinates when both are present and valid numbers.
  const lat = Number(q.lat);
  const lon = Number(q.lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    qs.set('lat', String(lat));
    qs.set('lon', String(lon));
  }

  let res;
  try {
    res = await fetch(`${API_HOST}/v2/projects?${qs}`);
  } catch (e) {
    return json(502, { ok: false, code: 'UPSTREAM', message: 'Could not reach the flora service.' });
  }
  if (res.status === 401 || res.status === 403) {
    return json(502, { ok: false, code: 'UNAUTHORIZED', message: 'The flora service rejected the API key.' });
  }
  if (!res.ok) {
    return json(502, { ok: false, code: 'UPSTREAM', message: 'The flora service returned an error.' });
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    return json(502, { ok: false, code: 'UPSTREAM', message: 'Unreadable flora response.' });
  }

  const projects = (Array.isArray(data) ? data : [])
    .map((p) => ({
      id: p.id || p.name || null,
      title: p.title || p.name || p.id || 'Flora',
      speciesCount: typeof p.speciesCount === 'number' ? p.speciesCount : null,
    }))
    .filter((p) => p.id);

  // Best regional pick: the most relevant flora that isn't the whole-world one.
  // Pl@ntNet returns location-filtered projects in relevance order, so take the
  // first non-"world" entry; fall back to none (caller then uses worldwide).
  const best = projects.find((p) => !/world/i.test(p.id)) || null;

  return json(200, { ok: true, best, projects });
}

function json(statusCode, obj) {
  return { statusCode, headers: CORS, body: JSON.stringify(obj) };
}

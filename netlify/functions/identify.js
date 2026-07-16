// Serverless proxy for plant identification.
//
// Why this exists: the Pl@ntNet API key must never ship in frontend code. The
// browser POSTs JSON (base64 images) here; this function injects the key from the
// PLANTNET_API_KEY environment variable and forwards a multipart request upstream.
//
// Contract
//   Request  (POST JSON): { images:[{data:<base64 jpeg>, organ:"auto"}], project, lang, noReject, nbResults }
//   Response (200 JSON):   { ok:true, bestMatch, remaining, results:[...] }
//   Error    (JSON):       { ok:false, code, message, remaining? }

import { getProvider } from './providers/index.js';

const MAX_IMAGES = 5;
const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, code: 'BAD_REQUEST', message: 'Use POST.' });
  }

  // Accept either the canonical name or the one set in this site's Netlify config.
  const apiKey = process.env.PLANTNET_API_KEY || process.env.Plant_key;
  if (!apiKey) {
    return json(500, {
      ok: false,
      code: 'NOT_CONFIGURED',
      message: 'The server is missing its identification API key.',
    });
  }

  let body;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body || '';
    body = JSON.parse(raw);
  } catch (e) {
    return json(400, { ok: false, code: 'BAD_REQUEST', message: 'Invalid request body.' });
  }

  const images = Array.isArray(body.images) ? body.images.slice(0, MAX_IMAGES) : [];
  const clean = images.filter((im) => im && typeof im.data === 'string' && im.data.length > 0);
  if (clean.length === 0) {
    return json(400, { ok: false, code: 'BAD_REQUEST', message: 'Add at least one photo.' });
  }

  try {
    const provider = getProvider('plantnet');
    const result = await provider.identify({
      images: clean,
      project: body.project || 'all',
      lang: body.lang || 'en',
      noReject: !!body.noReject,
      nbResults: clampInt(body.nbResults, 1, 20, 10),
      apiKey,
    });
    return json(200, result);
  } catch (e) {
    return json(e.status || 502, {
      ok: false,
      code: e.code || 'UPSTREAM',
      message: e.message || 'Identification failed.',
      ...(e.remaining != null ? { remaining: e.remaining } : {}),
    });
  }
}

function clampInt(v, min, max, fallback) {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function json(statusCode, obj) {
  return { statusCode, headers: CORS, body: JSON.stringify(obj) };
}

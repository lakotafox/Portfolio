// Server-side proxy to the Puddl3 backend.
//
// Why this exists: the app is served from this domain but the backend lives
// behind a tunnel on another host. Calling it directly made the browser do a
// cross-origin request, which Firefox and Safari failed at the OPTIONS
// preflight ("CORS Failed" / "Load failed") even though the preflight was fine
// when replayed with curl. Routing through here makes the browser's request
// same-origin, so there is no preflight and no CORS at all.
//
// Netlify's built-in external proxy (a `to = "https://..."` rewrite) was tried
// first and silently didn't match — hence a function, which also lets us add
// the header that skips ngrok's browser interstitial.
//
//   /puddl3-api/<path>  ->  <BACKEND>/<path>

const BACKEND =
  process.env.PUDDL3_API_URL || 'https://agonizing-perm-precinct.ngrok-free.dev';

// Hop-by-hop and host-specific headers must not be forwarded upstream.
const STRIP = new Set([
  'host',
  'connection',
  'content-length',
  'accept-encoding',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
  'x-nf-client-connection-ip',
]);

export async function handler(event) {
  // event.path is /.netlify/functions/puddl3-api/<rest> (or /puddl3-api/<rest>
  // depending on how the rewrite lands) — take everything after our name.
  const marker = '/puddl3-api';
  const idx = event.path.indexOf(marker);
  const subPath = idx === -1 ? '' : event.path.slice(idx + marker.length);
  const query = event.rawQuery ? `?${event.rawQuery}` : '';
  const url = `${BACKEND}${subPath || '/'}${query}`;

  const headers = {};
  for (const [k, v] of Object.entries(event.headers || {})) {
    if (!STRIP.has(k.toLowerCase())) headers[k] = v;
  }
  // ngrok's free tier serves an HTML interstitial to anything that looks like a
  // browser; this opts out. Harmless once the backend is hosted properly.
  headers['ngrok-skip-browser-warning'] = '1';

  const method = event.httpMethod;
  const hasBody = method !== 'GET' && method !== 'HEAD' && event.body != null;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: hasBody
        ? event.isBase64Encoded
          ? Buffer.from(event.body, 'base64')
          : event.body
        : undefined,
    });

    const text = await res.text();
    return {
      statusCode: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
      body: text,
    };
  } catch (e) {
    // The backend is a tunnel to a machine that may be asleep or offline.
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({
        detail:
          'Puddl3 backend is unreachable right now. It runs on a self-hosted machine — try again shortly.',
        error: String(e && e.message ? e.message : e),
      }),
    };
  }
}

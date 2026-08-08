// Serverless proxy for Gifsmith's GifCities search.
//
// Why this exists: gifcities.org has no JSON API and no CORS headers, so the
// browser can't fetch its server-rendered search HTML directly. This function
// forwards whitelisted search params upstream and returns the raw HTML; the
// Gifsmith client does the parsing (src/lib/parseGifcities.ts), keeping
// dev (Vite proxy) and prod behavior identical.
//
// Deploy: copy into carc-portfolio/netlify/functions/ and add the redirect
// from deploy/netlify-toml-snippet.txt ABOVE the SPA catch-all.

const UPSTREAM = 'https://gifcities.org/search';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: 'GET only' };
  }

  const p = event.queryStringParameters ?? {};
  const q = (p.q ?? '').slice(0, 100);
  if (!q) {
    return { statusCode: 400, headers: CORS, body: 'missing q' };
  }
  const offset = Math.max(0, parseInt(p.offset, 10) || 0);
  const pageSize = Math.min(200, Math.max(1, parseInt(p.page_size, 10) || 48));

  const url = `${UPSTREAM}?q=${encodeURIComponent(q)}&offset=${offset}&page_size=${pageSize}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'gifsmith (lakotafox.com/gifsmith)' },
    });
    if (!res.ok) {
      return { statusCode: 502, headers: CORS, body: `upstream ${res.status}` };
    }
    const html = await res.text();
    return {
      statusCode: 200,
      headers: {
        ...CORS,
        'Content-Type': 'text/html; charset=utf-8',
        // let Netlify's CDN absorb repeat queries for a day
        'Cache-Control': 'public, s-maxage=86400',
      },
      body: html,
    };
  } catch {
    return { statusCode: 502, headers: CORS, body: 'upstream unreachable' };
  }
}

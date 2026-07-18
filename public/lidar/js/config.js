// Where the brains live. Lakota's M4 runs lidar-brain (bun server.ts) exposed
// over an HTTPS tunnel — put the stable tunnel URL here and redeploy.
// Empty string = brains not configured → pro mode shows as offline.
//
// Local testing without a deploy: open any /lidar/ page once with
//   ?brain=http://localhost:5177
// and the override sticks for the browser session.
const CONFIGURED_BRAIN_URL = 'https://agonizing-perm-precinct.ngrok-free.dev';

const param = new URLSearchParams(location.search).get('brain');
if (param) sessionStorage.setItem('brain-url', param);
export const BRAIN_URL = sessionStorage.getItem('brain-url') || CONFIGURED_BRAIN_URL;

// ngrok's free tier serves an interstitial warning page to browsers unless this
// header is present. The server allows it in CORS preflight.
const NGROK_HEADER = { 'ngrok-skip-browser-warning': 'true' };

export function brainFetch(path, opts = {}) {
  return fetch(`${BRAIN_URL}${path}`, {
    ...opts,
    headers: { ...NGROK_HEADER, ...(opts.headers || {}) },
  });
}

export async function brainOnline(timeoutMs = 3500) {
  if (!BRAIN_URL) return false;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await brainFetch('/health', { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const j = await res.json();
    return !!j.ok;
  } catch {
    return false;
  }
}

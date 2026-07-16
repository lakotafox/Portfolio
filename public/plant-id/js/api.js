// Talks to the serverless proxy at /api/identify and maps errors to friendly copy.

// Call the Netlify function directly — the canonical path is always available,
// whereas the cosmetic /api/identify rewrite proved flaky for POST.
const ENDPOINT = '/.netlify/functions/identify';

const MESSAGES = {
  NOT_A_PLANT: "That didn't look like a plant. Try a clear, close-up photo of a leaf, flower, or fruit — or tick the box to guess anyway.",
  RATE_LIMITED: "Today's identification quota is used up. Please try again tomorrow.",
  UNAUTHORIZED: 'The identification service rejected the request. The site key may need attention.',
  NOT_CONFIGURED: 'This app is not fully set up yet — the identification API key is missing.',
  PAYLOAD_TOO_LARGE: 'Those photos were too large. Try fewer or smaller photos.',
  BAD_REQUEST: 'Something was off with that request. Add a photo and try again.',
  UPSTREAM: 'The identification service had a problem. Please try again in a moment.',
  NETWORK: 'No connection. Check your internet and try again.',
};

export function friendlyError(code) {
  return MESSAGES[code] || MESSAGES.UPSTREAM;
}

// Sends { images, noReject, project } -> resolves to the normalized success payload,
// or throws an Error with a `.code` matching MESSAGES. `project` is a Pl@ntNet flora
// id ('all' = worldwide, the default).
export async function identify({ images, noReject, project }) {
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images,
        project: project || 'all',
        lang: 'en',
        noReject: !!noReject,
        nbResults: 10,
      }),
    });
  } catch (e) {
    throw withCode(new Error(MESSAGES.NETWORK), 'NETWORK');
  }

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    // fall through to status-based handling below
  }

  if (res.ok && body && body.ok) {
    return body;
  }

  const code = (body && body.code) || (res.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'UPSTREAM');
  const err = withCode(new Error(friendlyError(code)), code);
  if (body && body.remaining != null) err.remaining = body.remaining;
  throw err;
}

function withCode(err, code) {
  err.code = code;
  return err;
}

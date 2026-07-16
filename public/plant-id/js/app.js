// Controller: wires the composer, runs downscale -> size-check -> identify -> render,
// and drives the idle / loading / results / error views.

import { PhotoStore } from './camera.js';
import { downscaleToBase64 } from './downscale.js';
import { identify, friendlyError } from './api.js';
import { renderVerdict, renderCandidates, renderQuota } from './render.js';
import { initStrands } from './strands.js';
import { enhanceSpecular } from './specular-button.js';
import { playChirp } from './birdsong.js';

// Keep the total base64 payload comfortably under Netlify's ~6 MB function limit
// (base64 adds ~33%). 4 MB of base64 across up to 5 images is a safe ceiling.
const MAX_TOTAL_BASE64 = 4 * 1024 * 1024;

const el = {
  bg: document.getElementById('bg'),
  slots: document.getElementById('slots'),
  addPhoto: document.getElementById('add-photo'),
  fileInput: document.getElementById('file-input'),
  noReject: document.getElementById('no-reject'),
  identifyBtn: document.getElementById('identify-btn'),
  composerMsg: document.getElementById('composer-msg'),
  quota: document.getElementById('quota'),
  composer: document.getElementById('composer'),
  loading: document.getElementById('loading'),
  results: document.getElementById('results'),
  verdict: document.getElementById('verdict'),
  candidates: document.getElementById('candidates'),
  resetBtn: document.getElementById('reset-btn'),
  error: document.getElementById('error'),
  errorMsg: document.getElementById('error-msg'),
  errorBack: document.getElementById('error-back'),
};

const store = new PhotoStore({
  slotsEl: el.slots,
  addBtnEl: el.addPhoto,
  onChange: () => {
    el.identifyBtn.disabled = store.count === 0;
  },
});

// Animated green Strands background behind everything.
if (el.bg) initStrands(el.bg);

// Big, shiny green specular buttons on the primary actions.
enhanceSpecular(el.identifyBtn, { size: 'lg', radius: 60, intensity: 1.1, thickness: 1.6 });
enhanceSpecular(el.resetBtn, { size: 'md', radius: 60 });
enhanceSpecular(el.errorBack, { size: 'md', radius: 60 });

function show(view) {
  el.composer.hidden = view !== 'composer';
  el.loading.hidden = view !== 'loading';
  el.results.hidden = view !== 'results';
  el.error.hidden = view !== 'error';
}

function setMsg(text) {
  if (!text) {
    el.composerMsg.hidden = true;
    el.composerMsg.textContent = '';
  } else {
    el.composerMsg.textContent = text;
    el.composerMsg.hidden = false;
  }
}

// --- File selection -> downscale -> add slots ---
el.fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  e.target.value = ''; // allow re-picking the same file
  if (files.length === 0) return;

  setMsg('');
  const room = 5 - store.count;
  if (room <= 0) return;

  const toAdd = files.slice(0, room);
  if (files.length > room) {
    setMsg(`Only 5 photos max — added the first ${room}.`);
  }

  for (const file of toAdd) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const { data, previewUrl } = await downscaleToBase64(file);
      store.add({ data, previewUrl });
    } catch (err) {
      setMsg(err.message || 'Could not process one of the photos.');
    }
  }
});

// --- Identify ---
el.identifyBtn.addEventListener('click', async () => {
  const images = store.payload();
  if (images.length === 0) return;

  playChirp(); // cheerful bird tweet on tap

  const total = images.reduce((sum, im) => sum + im.data.length, 0);
  if (total > MAX_TOTAL_BASE64) {
    setMsg('Those photos are too large to upload together. Remove one, or retake a bit further back.');
    return;
  }

  setMsg('');
  show('loading');

  try {
    const result = await identify({ images, noReject: el.noReject.checked });
    renderQuota(el.quota, result.remaining);
    renderVerdict(el.verdict, result);
    renderCandidates(el.candidates, result);
    show('results');
  } catch (err) {
    if (err.remaining != null) renderQuota(el.quota, err.remaining);
    el.errorMsg.textContent = err.message || friendlyError('UPSTREAM');
    show('error');
  }
});

// --- Reset flows ---
function reset() {
  store.clear();
  setMsg('');
  show('composer');
}
el.resetBtn.addEventListener('click', reset);
el.errorBack.addEventListener('click', () => show('composer'));

// --- Service worker (PWA) ---
if ('serviceWorker' in navigator) {
  // When a deploy ships a new SW (skipWaiting + clients.claim), the page that's
  // already open was built from the OLD cache. Reload once so users see the new
  // version immediately instead of being stuck until a manual second refresh.
  // Guards: skip the first-ever install (no previous controller — nothing is
  // stale), and never reload once the user has photos staged or a result up.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    if (store.count > 0 || el.composer.hidden) return;
    reloaded = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline shell is a nice-to-have; ignore failures */
    });
  });
}

show('composer');

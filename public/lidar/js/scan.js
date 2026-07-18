// Pro-mode desktop page: create a session, show the QR, watch photos arrive,
// then render the finished gaussian splat.
import { BRAIN_URL, brainOnline, brainFetch } from './config.js';
import { initStrands } from './strands.js';
import { enhanceSpecular } from './specular-button.js';

const el = {
  bg: document.getElementById('bg'),
  offline: document.getElementById('offline'),
  pair: document.getElementById('pair'),
  qr: document.getElementById('qr'),
  code: document.getElementById('code'),
  photoCount: document.getElementById('photo-count'),
  stage: document.getElementById('stage'),
  buildBtn: document.getElementById('build-btn'),
  fileInput: document.getElementById('file-input'),
  pairMsg: document.getElementById('pair-msg'),
  building: document.getElementById('building'),
  buildStage: document.getElementById('build-stage'),
  result: document.getElementById('result'),
  viewerCanvas: document.getElementById('viewer-canvas'),
  downloadLink: document.getElementById('download-link'),
  newScan: document.getElementById('new-scan'),
  error: document.getElementById('error'),
  errorMsg: document.getElementById('error-msg'),
  errorBack: document.getElementById('error-back'),
};

const PURPLE_PALETTE = ['#a78bfa', '#8b5cf6', '#c4b5fd', '#6d28d9', '#d946ef', '#b79df0', '#7c3aed', '#9f7aea'];
if (el.bg) initStrands(el.bg, { colors: PURPLE_PALETTE });
enhanceSpecular(el.buildBtn, { size: 'lg', radius: 60, lineColor: '#a78bfa', baseColor: '#8b5cf6' });

let session = null;
let pollTimer = 0;
let viewerStarted = false;

function show(view) {
  el.offline.hidden = view !== 'offline';
  el.pair.hidden = view !== 'pair';
  el.building.hidden = view !== 'building';
  el.result.hidden = view !== 'result';
  el.error.hidden = view !== 'error';
}

function fail(msg) {
  clearInterval(pollTimer);
  el.errorMsg.textContent = msg;
  show('error');
}

async function api(path, opts) {
  const res = await brainFetch(path, opts);
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `Request failed (${res.status})`);
  return j;
}

async function start() {
  if (!(await brainOnline())) {
    show('offline');
    return;
  }
  session = await api('/api/session', { method: 'POST' });
  el.code.textContent = session.id;

  // Relative URL resolution drops the last path segment, so this yields
  // /lidar/capture.html from BOTH /lidar/scan.html and /lidar/scan — Netlify's
  // Pretty URLs serves this page at the extensionless path.
  const captureUrl = new URL(`capture.html?s=${session.id}`, location.href).href;
  const qr = qrcode(0, 'M');
  qr.addData(captureUrl);
  qr.make();
  el.qr.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 4 }); // 4-module quiet zone per QR spec

  show('pair');
  startPolling();
}

// 4s cadence, and stop after 30 min with nothing happening — ngrok's free tier
// has a monthly request budget, and an abandoned tab would chew through it.
let pollStarted = 0;
function startPolling() {
  clearInterval(pollTimer);
  pollStarted = Date.now();
  pollTimer = setInterval(poll, 4000);
}

async function poll() {
  let s;
  try {
    s = await api(`/api/session/${session.id}`);
  } catch {
    return; // transient network blip — keep polling
  }
  // Activity resets the idle clock; a dead-quiet pair screen eventually stops.
  if (s.photos > 0 || s.status !== 'capturing') pollStarted = Date.now();
  if (Date.now() - pollStarted > 30 * 60 * 1000) {
    clearInterval(pollTimer);
    el.stage.textContent = 'Paused after 30 min idle — reload to start a new scan.';
    return;
  }
  el.photoCount.textContent = s.photos;
  el.stage.textContent = s.stage;

  const ready = s.photos >= 10 && s.status === 'capturing';
  el.buildBtn.disabled = !ready;
  el.buildBtn.style.opacity = ready ? '1' : '.5';

  if (s.status === 'queued' || s.status === 'building') {
    el.buildStage.textContent = s.stage;
    show('building');
  } else if (s.status === 'done') {
    clearInterval(pollTimer);
    showModel();
  } else if (s.status === 'error') {
    fail(s.error || 'Reconstruction failed.');
  }
}

async function showModel() {
  if (viewerStarted) return;
  viewerStarted = true;

  // Keep the building spinner up through the (possibly multi-minute) download.
  show('building');
  try {
    // Fetch the model ourselves (ngrok header), streaming so we can show MB progress.
    const res = await brainFetch(`/api/session/${session.id}/model.ply`);
    if (!res.ok) throw new Error(`Model download failed (${res.status})`);
    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      el.buildStage.textContent = `Downloading model… ${(received / 1048576).toFixed(1)} MB`;
    }
    const blob = new Blob(chunks);
    const modelUrl = URL.createObjectURL(blob);
    el.downloadLink.href = modelUrl;
    el.downloadLink.download = 'scan.ply';

    el.buildStage.textContent = 'Opening viewer…';
    const GaussianSplats3D = await import('@mkkellogg/gaussian-splats-3d');
    const viewer = new GaussianSplats3D.Viewer({
      rootElement: el.viewerCanvas,
      sharedMemoryForWorkers: false, // Netlify sends no COOP/COEP headers
      cameraUp: [0, -1, 0],
      initialCameraPosition: [0, 0, -3],
      initialCameraLookAt: [0, 0, 0],
    });
    await viewer.addSplatScene(modelUrl, { format: GaussianSplats3D.SceneFormat.Ply, showLoadingUI: true });
    show('result');
    viewer.start();
  } catch (err) {
    viewerStarted = false;
    retryModel = true; // error button retries the download instead of reloading
    el.errorMsg.textContent = `Couldn't load the model: ${err.message}`;
    el.errorBack.textContent = 'Retry download';
    show('error');
  }
}

el.buildBtn.addEventListener('click', async () => {
  try {
    await api(`/api/session/${session.id}/build`, { method: 'POST' });
  } catch (err) {
    el.pairMsg.textContent = err.message;
    el.pairMsg.hidden = false;
  }
});

// Desktop fallback: upload a folder of photos instead of pairing a phone.
el.fileInput.addEventListener('change', async (e) => {
  const files = [...(e.target.files || [])];
  e.target.value = '';
  if (!files.length) return;
  el.stage.textContent = `Uploading ${files.length} photos…`;
  try {
    for (const f of files) {
      await api(`/api/session/${session.id}/photo`, { method: 'POST', body: f });
    }
  } catch (err) {
    el.pairMsg.textContent = err.message;
    el.pairMsg.hidden = false;
  }
});

let retryModel = false;
el.newScan.addEventListener('click', () => location.reload());
el.errorBack.addEventListener('click', () => {
  if (retryModel) {
    retryModel = false;
    showModel();
  } else {
    location.reload();
  }
});

start();

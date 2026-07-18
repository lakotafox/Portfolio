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

  const captureUrl = `${location.origin}${location.pathname.replace(/scan\.html$/, '')}capture.html?s=${session.id}`;
  const qr = qrcode(0, 'M');
  qr.addData(captureUrl);
  qr.make();
  el.qr.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 0 });

  show('pair');
  pollTimer = setInterval(poll, 1500);
}

async function poll() {
  let s;
  try {
    s = await api(`/api/session/${session.id}`);
  } catch {
    return; // transient network blip — keep polling
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
  show('result');
  if (viewerStarted) return;
  viewerStarted = true;

  // Fetch the model ourselves (ngrok header) and hand everyone a local blob URL.
  const blob = await (await brainFetch(`/api/session/${session.id}/model.ply`)).blob();
  const modelUrl = URL.createObjectURL(blob);
  el.downloadLink.href = modelUrl;
  el.downloadLink.download = 'scan.ply';

  const GaussianSplats3D = await import('@mkkellogg/gaussian-splats-3d');
  const viewer = new GaussianSplats3D.Viewer({
    rootElement: el.viewerCanvas,
    sharedMemoryForWorkers: false, // Netlify sends no COOP/COEP headers
    cameraUp: [0, -1, 0],
    initialCameraPosition: [0, 0, -3],
    initialCameraLookAt: [0, 0, 0],
  });
  await viewer.addSplatScene(modelUrl, { format: GaussianSplats3D.SceneFormat.Ply, showLoadingUI: true });
  viewer.start();
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

el.newScan.addEventListener('click', () => location.reload());
el.errorBack.addEventListener('click', () => location.reload());

start();

import { startCamera, stopCamera, cameraActive, snapFrame, fileToCanvas } from './camera.js';
import { loadModel, estimateDepth, isModelReady, offProgress } from './depth.js';
import { initViewer } from './viewer.js';
import { initStrands } from './strands.js';
import { enhanceSpecular } from './specular-button.js';

const el = {
  bg: document.getElementById('bg'),
  capture: document.getElementById('capture'),
  preview: document.getElementById('preview'),
  camHint: document.getElementById('cam-hint'),
  snapBtn: document.getElementById('snap-btn'),
  fileInput: document.getElementById('file-input'),
  captureMsg: document.getElementById('capture-msg'),
  prepStatus: document.getElementById('prep-status'),
  loading: document.getElementById('loading'),
  loadingMsg: document.getElementById('loading-msg'),
  modelDownload: document.getElementById('model-download'),
  modelProgress: document.getElementById('model-progress'),
  modelMsg: document.getElementById('model-msg'),
  viewer: document.getElementById('viewer'),
  viewerCanvas: document.getElementById('viewer-canvas'),
  depthRange: document.getElementById('depth-range'),
  exportBtn: document.getElementById('export-btn'),
  resetBtn: document.getElementById('reset-btn'),
  error: document.getElementById('error'),
  errorMsg: document.getElementById('error-msg'),
  errorBack: document.getElementById('error-back'),
};

const PURPLE_PALETTE = [
  '#a78bfa',
  '#8b5cf6',
  '#c4b5fd',
  '#6d28d9',
  '#d946ef',
  '#b79df0',
  '#7c3aed',
  '#9f7aea',
];

if (el.bg) initStrands(el.bg, { colors: PURPLE_PALETTE });

enhanceSpecular(el.snapBtn, { size: 'lg', radius: 60, intensity: 1.1, thickness: 1.6, lineColor: '#a78bfa', baseColor: '#8b5cf6' });
enhanceSpecular(el.exportBtn, { size: 'md', radius: 60, lineColor: '#a78bfa', baseColor: '#8b5cf6' });
enhanceSpecular(el.resetBtn, { size: 'md', radius: 60, lineColor: '#a78bfa', baseColor: '#8b5cf6' });
enhanceSpecular(el.errorBack, { size: 'md', radius: 60, lineColor: '#a78bfa', baseColor: '#8b5cf6' });

const viewer = initViewer(el.viewerCanvas);

function show(view) {
  el.capture.hidden = view !== 'capture';
  el.loading.hidden = view !== 'loading';
  el.modelDownload.hidden = view !== 'model-download';
  el.viewer.hidden = view !== 'viewer';
  el.error.hidden = view !== 'error';
}

function setMsg(text) {
  if (!text) {
    el.captureMsg.hidden = true;
    el.captureMsg.textContent = '';
  } else {
    el.captureMsg.textContent = text;
    el.captureMsg.hidden = false;
  }
}

// ---------- Camera ----------
async function openCamera() {
  if (cameraActive()) return;
  el.camHint.textContent = 'Starting camera…';
  el.camHint.hidden = false;
  try {
    await startCamera(el.preview);
    el.camHint.hidden = true;
  } catch {
    el.camHint.textContent = 'No camera — upload a photo instead.';
  }
}

// ---------- Model ----------
async function ensureModel() {
  if (!isModelReady()) {
    show('model-download');
    el.modelMsg.textContent = 'Downloading depth model…';
  }
  const onProgress = (progress) => {
    const pct = Math.round(progress * 100);
    el.modelProgress.style.width = `${pct}%`;
    if (pct >= 100) el.modelMsg.textContent = 'Loading model…';
  };
  try {
    await loadModel(onProgress);
  } finally {
    offProgress(onProgress);
  }
}

// ---------- Scan ----------
async function processPhoto(canvas) {
  show('loading');
  el.loadingMsg.textContent = 'Measuring depth…';

  const depthImage = await estimateDepth(canvas);
  el.loadingMsg.textContent = 'Building point cloud…';
  viewer.setCloud(canvas, depthImage);
  viewer.setDepthScale(el.depthRange.value / 100);
  show('viewer');
  viewer.resize();
}

el.snapBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  setMsg('');
  try {
    const canvas = snapFrame(el.preview);
    stopCamera(el.preview); // free the camera while viewing the scan
    await ensureModel();
    await processPhoto(canvas);
  } catch (err) {
    if (!cameraActive()) {
      el.errorMsg.textContent = err.message || 'Something went wrong. Please try again.';
      show('error');
    } else {
      setMsg(err.message || 'Could not capture a frame — try again.');
    }
  }
});

el.fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  setMsg('');
  try {
    const canvas = await fileToCanvas(file);
    stopCamera(el.preview);
    await ensureModel();
    await processPhoto(canvas);
  } catch (err) {
    el.errorMsg.textContent = err.message || 'Could not process that image.';
    show('error');
  }
});

// ---------- Viewer controls ----------
el.depthRange.addEventListener('input', () => {
  viewer.setDepthScale(el.depthRange.value / 100);
});

el.exportBtn.addEventListener('click', () => {
  const blob = viewer.exportPLY();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scan.ply';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
});

// ---------- Reset ----------
function reset() {
  setMsg('');
  viewer.stop();
  show('capture');
  openCamera();
}
el.resetBtn.addEventListener('click', reset);
el.errorBack.addEventListener('click', reset);

show('capture');

// ---------- Warm up on open ----------
// Start the model download AND the camera the moment the page opens, so both
// are ready before the first scan (mirrors Bird Song ID's warm-up).
function warmProgress(p) {
  const pct = Math.round(p * 100);
  el.prepStatus.hidden = false;
  el.prepStatus.classList.remove('ready');
  el.prepStatus.textContent = pct < 100 ? `Preparing depth model… ${pct}%` : 'Finishing setup…';
}

function warmUp() {
  loadModel(warmProgress)
    .then(() => {
      offProgress(warmProgress);
      el.prepStatus.classList.add('ready');
      el.prepStatus.textContent = 'Ready to scan';
    })
    .catch(() => {
      offProgress(warmProgress);
      el.prepStatus.hidden = true; // fall back to on-demand download at scan time
    });

  openCamera();
}

warmUp();

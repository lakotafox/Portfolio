import { Recorder, decodeFile, segmentAudio } from './recorder.js';
import { loadModel, loadLabels, classify } from './inference.js';
import { renderVerdict, renderCandidates } from './render.js';
import { initStrands } from './strands.js';
import { enhanceSpecular } from './specular-button.js';

const el = {
  bg: document.getElementById('bg'),
  recorder: document.getElementById('recorder'),
  waveform: document.getElementById('waveform'),
  recTimer: document.getElementById('rec-timer'),
  recBtn: document.getElementById('rec-btn'),
  fileInput: document.getElementById('file-input'),
  uploadLabel: document.getElementById('upload-label'),
  useLocation: document.getElementById('use-location'),
  regionStatus: document.getElementById('region-status'),
  recorderMsg: document.getElementById('recorder-msg'),
  loading: document.getElementById('loading'),
  loadingMsg: document.getElementById('loading-msg'),
  modelDownload: document.getElementById('model-download'),
  modelProgress: document.getElementById('model-progress'),
  modelMsg: document.getElementById('model-msg'),
  results: document.getElementById('results'),
  verdict: document.getElementById('verdict'),
  candidatesDetails: document.getElementById('candidates-details'),
  candidatesCount: document.getElementById('candidates-count'),
  candidates: document.getElementById('candidates'),
  resetBtn: document.getElementById('reset-btn'),
  error: document.getElementById('error'),
  errorMsg: document.getElementById('error-msg'),
  errorBack: document.getElementById('error-back'),
};

if (el.bg) initStrands(el.bg);

enhanceSpecular(el.recBtn, { size: 'lg', radius: 60, intensity: 1.1, thickness: 1.6 });
enhanceSpecular(el.resetBtn, { size: 'md', radius: 60 });
enhanceSpecular(el.errorBack, { size: 'md', radius: 60 });

function show(view) {
  el.recorder.hidden = view !== 'recorder';
  el.loading.hidden = view !== 'loading';
  el.modelDownload.hidden = view !== 'model-download';
  el.results.hidden = view !== 'results';
  el.error.hidden = view !== 'error';
}

function setMsg(text) {
  if (!text) {
    el.recorderMsg.hidden = true;
    el.recorderMsg.textContent = '';
  } else {
    el.recorderMsg.textContent = text;
    el.recorderMsg.hidden = false;
  }
}

// ---------- Waveform drawing ----------
const wCtx = el.waveform.getContext('2d');
function drawWaveform(data) {
  const w = el.waveform.width = el.waveform.offsetWidth * (window.devicePixelRatio || 1);
  const h = el.waveform.height = el.waveform.offsetHeight * (window.devicePixelRatio || 1);
  wCtx.clearRect(0, 0, w, h);
  wCtx.lineWidth = 2;
  wCtx.strokeStyle = '#5ba8d4';
  wCtx.beginPath();
  const sliceW = w / data.length;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128.0;
    const y = (v * h) / 2;
    if (i === 0) wCtx.moveTo(0, y);
    else wCtx.lineTo(i * sliceW, y);
  }
  wCtx.stroke();
}

function drawIdleWaveform() {
  const w = el.waveform.width = el.waveform.offsetWidth * (window.devicePixelRatio || 1);
  const h = el.waveform.height = el.waveform.offsetHeight * (window.devicePixelRatio || 1);
  wCtx.clearRect(0, 0, w, h);
  wCtx.lineWidth = 1.5;
  wCtx.strokeStyle = 'rgba(91, 168, 212, 0.3)';
  wCtx.beginPath();
  wCtx.moveTo(0, h / 2);
  wCtx.lineTo(w, h / 2);
  wCtx.stroke();
}
drawIdleWaveform();

// ---------- Location toggle ----------
let userCoords = null;

el.useLocation.addEventListener('change', async () => {
  if (!el.useLocation.checked) {
    userCoords = null;
    el.regionStatus.hidden = true;
    return;
  }
  el.regionStatus.textContent = 'Getting location…';
  el.regionStatus.hidden = false;
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });
    userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    el.regionStatus.textContent = `Location set (${userCoords.lat.toFixed(2)}, ${userCoords.lng.toFixed(2)})`;
  } catch {
    el.useLocation.checked = false;
    userCoords = null;
    el.regionStatus.textContent = 'Could not get location';
  }
});

// ---------- Recording ----------
let recorder = null;

async function ensureModel() {
  show('model-download');
  el.modelMsg.textContent = 'Downloading bird identification model…';
  await loadModel((progress) => {
    const pct = Math.round(progress * 100);
    el.modelProgress.style.width = `${pct}%`;
    if (pct >= 100) el.modelMsg.textContent = 'Loading model…';
  });
  await loadLabels();
}

async function processAudio(samples) {
  show('loading');
  el.loadingMsg.textContent = 'Analyzing bird sounds…';

  const segments = segmentAudio(samples);
  const allResults = new Map();

  for (let i = 0; i < segments.length; i++) {
    el.loadingMsg.textContent = segments.length > 1
      ? `Analyzing segment ${i + 1} of ${segments.length}…`
      : 'Analyzing bird sounds…';
    const top = await classify(segments[i]);
    for (const r of top) {
      const key = r.scientific;
      const existing = allResults.get(key);
      if (!existing || r.score > existing.score) {
        allResults.set(key, r);
      }
    }
  }

  const merged = Array.from(allResults.values()).sort((a, b) => b.score - a.score).slice(0, 10);

  if (merged.length === 0 || merged[0].score < 0.01) {
    el.errorMsg.textContent = 'Could not identify any bird sounds. Try a clearer recording.';
    show('error');
    return;
  }

  renderVerdict(el.verdict, merged[0]);
  renderCandidates(el.candidates, el.candidatesCount, el.candidatesDetails, merged);
  show('results');
}

el.recBtn.addEventListener('pointerdown', async (e) => {
  e.preventDefault();
  if (recorder?.recording) return;
  setMsg('');
  try {
    recorder = new Recorder({
      onWaveform: drawWaveform,
      onTimer: (t) => {
        el.recTimer.textContent = t;
        el.recTimer.hidden = false;
      },
    });
    await recorder.start();
    el.recBtn.textContent = 'Release to stop';
    el.recBtn.classList.add('recording');
  } catch (err) {
    setMsg('Microphone access denied. Please allow microphone access and try again.');
  }
});

async function stopAndProcess() {
  if (!recorder?.recording) return;
  el.recBtn.textContent = 'Hold to record';
  el.recBtn.classList.remove('recording');
  el.recTimer.hidden = true;

  const samples = await recorder.stop();
  recorder = null;
  drawIdleWaveform();

  if (samples.length < 24000) {
    setMsg('Recording too short. Hold for at least 1 second.');
    return;
  }

  try {
    await ensureModel();
    await processAudio(samples);
  } catch (err) {
    el.errorMsg.textContent = err.message || 'Something went wrong. Please try again.';
    show('error');
  }
}

el.recBtn.addEventListener('pointerup', stopAndProcess);
el.recBtn.addEventListener('pointerleave', stopAndProcess);

// ---------- File upload ----------
el.fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  setMsg('');

  try {
    await ensureModel();
    show('loading');
    el.loadingMsg.textContent = 'Decoding audio file…';
    const samples = await decodeFile(file);
    await processAudio(samples);
  } catch (err) {
    el.errorMsg.textContent = err.message || 'Could not process that audio file.';
    show('error');
  }
});

// ---------- Reset ----------
function reset() {
  setMsg('');
  drawIdleWaveform();
  show('recorder');
}
el.resetBtn.addEventListener('click', reset);
el.errorBack.addEventListener('click', reset);

show('recorder');

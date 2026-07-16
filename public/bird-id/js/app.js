import { Recorder, decodeFile, segmentAudio } from './recorder.js';
import { loadModel, loadLabels, classify, isModelReady, offProgress } from './inference.js';
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
  prepStatus: document.getElementById('prep-status'),
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
// Size the backing store once (on load + on resize), NOT every frame — reallocating
// the canvas 60x/second is what made recording lag on phones.
let cw = 0, ch = 0;
function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  cw = el.waveform.width = el.waveform.offsetWidth * dpr;
  ch = el.waveform.height = el.waveform.offsetHeight * dpr;
}

function drawWaveform(data) {
  wCtx.clearRect(0, 0, cw, ch);
  wCtx.lineWidth = 2;
  wCtx.strokeStyle = '#5ba8d4';
  wCtx.beginPath();
  const sliceW = cw / data.length;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128.0;
    const y = (v * ch) / 2;
    if (i === 0) wCtx.moveTo(0, y);
    else wCtx.lineTo(i * sliceW, y);
  }
  wCtx.stroke();
}

function drawIdleWaveform() {
  sizeCanvas();
  wCtx.clearRect(0, 0, cw, ch);
  wCtx.lineWidth = 1.5;
  wCtx.strokeStyle = 'rgba(91, 168, 212, 0.35)';
  wCtx.beginPath();
  wCtx.moveTo(0, ch / 2);
  wCtx.lineTo(cw, ch / 2);
  wCtx.stroke();
}
sizeCanvas();
drawIdleWaveform();
window.addEventListener('resize', () => { if (!recorder?.recording) drawIdleWaveform(); });

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
  // If the background preload (started when recording began) already finished,
  // skip the download screen entirely and go straight to analyzing.
  if (!isModelReady()) {
    show('model-download');
    el.modelMsg.textContent = 'Downloading bird identification model…';
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

let starting = false;

async function startRecording() {
  if (recorder?.recording || starting) return;
  starting = true;
  setMsg('');

  // Instant visual feedback — don't wait for the mic to spin up.
  el.recBtn.textContent = 'Starting…';
  el.recBtn.classList.add('recording');

  // Safety net: the model download normally starts on page open, but if that
  // failed, kick it off again here so it's downloading while they record.
  loadModel().catch(() => {});

  try {
    recorder = new Recorder({
      onWaveform: drawWaveform,
      onTimer: (t, elapsed) => {
        el.recTimer.textContent = t;
        el.recTimer.hidden = false;
        el.recBtn.textContent = elapsed < 3
          ? 'Tap to stop (keep going…)'
          : 'Tap to stop';
      },
    });
    await recorder.start();
    el.recBtn.textContent = 'Tap to stop';
  } catch (err) {
    starting = false;
    recorder = null;
    el.recBtn.textContent = 'Tap to record';
    el.recBtn.classList.remove('recording');
    setMsg('Microphone access denied. Please allow microphone access and try again.');
  } finally {
    starting = false;
  }
}

async function stopAndProcess() {
  if (!recorder?.recording) return;
  el.recBtn.textContent = 'Tap to record';
  el.recBtn.classList.remove('recording');
  el.recTimer.hidden = true;

  const samples = await recorder.stop();
  recorder = null;
  drawIdleWaveform();

  if (samples.length < 24000) {
    setMsg('That was too short — try recording for a few seconds.');
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

// Tap to toggle: first tap starts, next tap stops.
el.recBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (recorder?.recording) stopAndProcess();
  else startRecording();
});

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

// ---------- Warm up on open ----------
// The moment the page opens: start downloading the model AND ask for mic
// permission in parallel, so both are ready before the first recording.
function warmProgress(p) {
  const pct = Math.round(p * 100);
  el.prepStatus.hidden = false;
  el.prepStatus.classList.remove('ready');
  el.prepStatus.textContent = pct < 100 ? `Preparing model… ${pct}%` : 'Finishing setup…';
}

function warmUp() {
  // 1) Kick off the 64 MB model download right now (progress shown subtly).
  loadModel(warmProgress)
    .then(() => loadLabels())
    .then(() => {
      offProgress(warmProgress);
      el.prepStatus.classList.add('ready');
      el.prepStatus.textContent = 'Ready to identify';
    })
    .catch(() => {
      offProgress(warmProgress);
      el.prepStatus.hidden = true; // fall back to on-demand download when they record
    });

  // 2) Ask for mic permission in parallel, while the model downloads. Release
  //    the mic immediately — the grant persists, so tapping record won't prompt
  //    again. If the browser needs a tap first (iOS), we simply ask on record.
  if (navigator.mediaDevices?.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      .then((stream) => stream.getTracks().forEach((t) => t.stop()))
      .catch(() => {});
  }
}

warmUp();

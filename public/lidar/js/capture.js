// Phone capture page. With ?s=<id> it joins a desktop-paired session; opened
// bare it creates its own session (phone-only mode).
import { BRAIN_URL, brainOnline } from './config.js';

const el = {
  capture: document.getElementById('capture'),
  preview: document.getElementById('preview'),
  count: document.getElementById('count'),
  shutter: document.getElementById('shutter'),
  guide: document.getElementById('guide'),
  buildBtn: document.getElementById('build-btn'),
  msg: document.getElementById('msg'),
  building: document.getElementById('building'),
  buildStage: document.getElementById('build-stage'),
  done: document.getElementById('done'),
  viewLink: document.getElementById('view-link'),
  error: document.getElementById('error'),
  errorMsg: document.getElementById('error-msg'),
  errorBack: document.getElementById('error-back'),
};

let sessionId = new URLSearchParams(location.search).get('s');
let photos = 0;
let uploading = 0;

function show(view) {
  el.capture.hidden = view !== 'capture';
  el.building.hidden = view !== 'building';
  el.done.hidden = view !== 'done';
  el.error.hidden = view !== 'error';
}

function fail(msg) {
  el.errorMsg.textContent = msg;
  show('error');
}

async function api(path, opts) {
  const res = await fetch(`${BRAIN_URL}${path}`, opts);
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `Request failed (${res.status})`);
  return j;
}

function updateBuildBtn() {
  const ready = photos >= 10;
  el.buildBtn.disabled = !ready;
  el.buildBtn.style.opacity = ready ? '1' : '.5';
  el.buildBtn.textContent = ready
    ? `Build 3D model (${photos} photos)`
    : `Build 3D model (need 10+)`;
}

async function start() {
  if (!(await brainOnline())) {
    fail("Can't reach the brains (Lakota's M4). Check that it's online.");
    return;
  }
  if (!sessionId) {
    const s = await api('/api/session', { method: 'POST' });
    sessionId = s.id;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 2560 }, height: { ideal: 1920 } },
      audio: false,
    });
    el.preview.srcObject = stream;
    await el.preview.play().catch(() => {});
  } catch {
    fail('Camera access denied — allow the camera and reload.');
    return;
  }
  show('capture');
  updateBuildBtn();
}

el.shutter.addEventListener('click', async () => {
  if (!el.preview.videoWidth) return;
  if (navigator.vibrate) navigator.vibrate(30);

  const c = document.createElement('canvas');
  c.width = el.preview.videoWidth;
  c.height = el.preview.videoHeight;
  c.getContext('2d').drawImage(el.preview, 0, 0);
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
  if (!blob) return;

  uploading++;
  el.count.textContent = `${photos} ⇡`;
  try {
    const res = await api(`/api/session/${sessionId}/photo`, { method: 'POST', body: blob });
    photos = res.photos;
  } catch (err) {
    el.msg.textContent = err.message;
    el.msg.hidden = false;
  } finally {
    uploading--;
    el.count.textContent = uploading > 0 ? `${photos} ⇡` : `${photos}`;
    updateBuildBtn();
    if (photos >= 30) el.guide.textContent = 'Nice — that should be plenty. Build when ready.';
    else if (photos >= 15) el.guide.textContent = 'Good — now get higher and lower angles too.';
  }
});

el.buildBtn.addEventListener('click', async () => {
  try {
    await api(`/api/session/${sessionId}/build`, { method: 'POST' });
    show('building');
    pollBuild();
  } catch (err) {
    el.msg.textContent = err.message;
    el.msg.hidden = false;
  }
});

async function pollBuild() {
  const timer = setInterval(async () => {
    let s;
    try {
      s = await api(`/api/session/${sessionId}`);
    } catch {
      return;
    }
    el.buildStage.textContent = s.stage;
    if (s.status === 'done') {
      clearInterval(timer);
      el.viewLink.href = `./view.html?s=${sessionId}`;
      show('done');
    } else if (s.status === 'error') {
      clearInterval(timer);
      fail(s.error || 'Reconstruction failed.');
    }
  }, 2000);
}

el.errorBack.addEventListener('click', () => location.reload());

show('building');
el.buildStage.textContent = 'Connecting…';
start();

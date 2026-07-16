const MODEL_URL = 'https://huggingface.co/justinchuby/BirdNET-onnx/resolve/main/birdnet.onnx';
const DB_NAME = 'birdnet-cache';
const STORE_NAME = 'models';
const MODEL_KEY = 'birdnet-v2.4-fp32';

let session = null;
let labels = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCached() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(MODEL_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function putCached(buf) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(buf, MODEL_KEY);
  } catch {
    // caching is best-effort
  }
}

export async function loadModel(onProgress) {
  if (session) return;

  let buf = await getCached();
  if (buf) {
    if (onProgress) onProgress(1);
  } else {
    const res = await fetch(MODEL_URL);
    if (!res.ok) throw new Error(`Model download failed: ${res.status}`);
    const total = parseInt(res.headers.get('content-length') || '0', 10);
    const reader = res.body.getReader();
    const chunks = [];
    let loaded = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (onProgress && total) onProgress(loaded / total);
    }
    buf = new Uint8Array(loaded);
    let offset = 0;
    for (const c of chunks) {
      buf.set(c, offset);
      offset += c.length;
    }
    await putCached(buf.buffer);
  }

  ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;

  session = await ort.InferenceSession.create(buf.buffer || buf, {
    executionProviders: ['wasm'],
  });
}

export async function loadLabels() {
  if (labels) return labels;
  const res = await fetch('./labels.txt');
  const text = await res.text();
  labels = text.trim().split('\n').map((line) => {
    const idx = line.indexOf('_');
    if (idx === -1) return { scientific: line.trim(), common: '' };
    return {
      scientific: line.slice(0, idx).trim(),
      common: line.slice(idx + 1).trim(),
    };
  });
  return labels;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export async function classify(samples) {
  if (!session) throw new Error('Model not loaded');

  const tensor = new ort.Tensor('float32', new Float32Array(samples), [1, samples.length]);
  const results = await session.run({ input: tensor });
  const logits = results.output.data;

  const scores = [];
  for (let i = 0; i < logits.length; i++) {
    scores.push({ index: i, score: sigmoid(logits[i]) });
  }
  scores.sort((a, b) => b.score - a.score);

  const labelList = await loadLabels();
  return scores.slice(0, 10).map((s) => ({
    score: s.score,
    scientific: labelList[s.index]?.scientific || `Species ${s.index}`,
    common: labelList[s.index]?.common || '',
  }));
}

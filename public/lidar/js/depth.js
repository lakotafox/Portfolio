// In-browser monocular depth estimation — Depth Anything V2 (small) via
// Transformers.js. Safari never exposes the iPhone's actual LiDAR to web pages,
// so an AI depth model plays the part of the sensor. WebGPU when available,
// WASM otherwise; Transformers.js caches the model in the browser Cache API.
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';

const MODEL_ID = 'onnx-community/depth-anything-v2-small';

let estimator = null;
let loadPromise = null;
let lastProgress = 0;
const progressListeners = new Set();

function emitProgress(p) {
  lastProgress = p;
  for (const fn of progressListeners) fn(p);
}

export function isModelReady() {
  return !!estimator;
}

export function offProgress(fn) {
  progressListeners.delete(fn);
}

export async function loadModel(onProgress) {
  if (onProgress) {
    progressListeners.add(onProgress);
    onProgress(estimator ? 1 : lastProgress);
  }
  if (estimator) return;
  if (loadPromise) return loadPromise;
  loadPromise = _loadModel().catch((err) => {
    loadPromise = null; // allow retry after a failure
    throw err;
  });
  return loadPromise;
}

async function _loadModel() {
  const useWebGPU = !!navigator.gpu;
  const opts = {
    device: useWebGPU ? 'webgpu' : 'wasm',
    dtype: useWebGPU ? 'fp16' : 'q8',
    // Only the .onnx weights are worth a progress bar — everything else is tiny.
    progress_callback: (info) => {
      if (info.status === 'progress' && info.file?.endsWith('.onnx') && info.total) {
        emitProgress(info.loaded / info.total);
      }
    },
  };
  try {
    estimator = await pipeline('depth-estimation', MODEL_ID, opts);
  } catch (err) {
    if (useWebGPU) {
      // Some browsers advertise WebGPU but fail to compile the model — fall back.
      estimator = await pipeline('depth-estimation', MODEL_ID, {
        ...opts, device: 'wasm', dtype: 'q8',
      });
    } else {
      throw err;
    }
  }
  emitProgress(1);
}

// Rescale any numeric array to 0..1 floats. Non-finite values (WebGPU fp16 can
// produce NaNs on some drivers) map to 0 so they can never poison the geometry.
function normalize(data, n) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < n; i++) {
    const v = data[i];
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min;
  const out = new Float32Array(n);
  if (!Number.isFinite(range) || range === 0) return out;
  for (let i = 0; i < n; i++) {
    const v = data[i];
    out[i] = Number.isFinite(v) ? (v - min) / range : 0;
  }
  return out;
}

// Returns { data: Float32Array 0..1, width, height } — 0 = far, 1 = near.
// Handles every output shape the pipeline may produce across versions:
// a RawImage (any channel count / dtype) or the raw predicted_depth tensor.
export async function estimateDepth(canvas) {
  if (!estimator) throw new Error('Model not loaded');
  const out = await estimator(canvas.toDataURL('image/png'));
  const result = Array.isArray(out) ? out[0] : out;

  const img = result?.depth;
  if (img?.data?.length && img.width) {
    const ch = img.channels || 1;
    const n = img.width * img.height;
    let gray = img.data;
    if (ch > 1) {
      gray = new Float32Array(n);
      for (let i = 0; i < n; i++) gray[i] = img.data[i * ch];
    }
    return { data: normalize(gray, n), width: img.width, height: img.height };
  }

  const t = result?.predicted_depth;
  if (t?.data?.length && t.dims?.length >= 2) {
    const [h, w] = t.dims.slice(-2);
    return { data: normalize(t.data, w * h), width: w, height: h };
  }

  throw new Error('Unexpected model output — please try again.');
}

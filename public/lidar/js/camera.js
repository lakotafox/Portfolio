// Live camera preview + frame capture. The photo is downscaled before depth
// estimation — the model resizes to ~518px internally, so anything bigger is
// wasted pixels and slower point clouds on phones.
const MAX_SIDE = 512;

let stream = null;

export async function startCamera(video) {
  if (stream) return;
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play().catch(() => {});
}

export function stopCamera(video) {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  if (video) video.srcObject = null;
}

export function cameraActive() {
  return !!stream;
}

function scaled(w, h) {
  const s = Math.min(1, MAX_SIDE / Math.max(w, h));
  return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))];
}

function drawToCanvas(source, sw, sh) {
  const [w, h] = scaled(sw, sh);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(source, 0, 0, w, h);
  return canvas;
}

export function snapFrame(video) {
  if (!video.videoWidth) throw new Error('Camera is not ready yet.');
  return drawToCanvas(video, video.videoWidth, video.videoHeight);
}

export function fileToCanvas(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(drawToCanvas(img, img.naturalWidth, img.naturalHeight));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

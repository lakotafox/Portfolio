// Client-side image downscaling.
//
// Phone photos are 3-12 MB. Netlify's synchronous function request limit is ~6 MB
// (~4.5 MB once base64-encoded), and Pl@ntNet resizes to 1280px anyway. We scale
// each image to a 1280px long edge (never below 800px, Pl@ntNet's accuracy floor)
// and re-encode as JPEG. EXIF orientation is applied so sideways phone shots upload
// upright.

const LONG_EDGE = 1280;
const MIN_EDGE = 800;
const QUALITY = 0.8;

// Returns { data: <base64 jpeg, no data: prefix>, previewUrl, bytes }.
export async function downscaleToBase64(file) {
  const bitmap = await loadBitmap(file);
  const { width, height } = targetSize(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  if (bitmap.close) bitmap.close();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY)
  );
  if (!blob) throw new Error('Could not process that image.');

  const dataUrl = await blobToDataUrl(blob);
  const base64 = dataUrl.split(',')[1] || '';

  return { data: base64, previewUrl: dataUrl, bytes: blob.size };
}

async function loadBitmap(file) {
  // createImageBitmap with imageOrientation bakes in EXIF rotation where supported.
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (e) {
      // Some browsers reject the options bag; fall through to the <img> path.
    }
  }
  return await loadViaImg(file);
}

function loadViaImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

function targetSize(w, h) {
  const long = Math.max(w, h);
  if (long <= MIN_EDGE) return { width: w, height: h }; // already small — leave it
  if (long <= LONG_EDGE) return { width: w, height: h };
  const scale = LONG_EDGE / long;
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not encode that image.'));
    reader.readAsDataURL(blob);
  });
}

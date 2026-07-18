// Point-cloud viewer (three.js) + binary PLY export.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initViewer(container) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 50);
  camera.position.set(0, 0, 2.6);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.5;
  controls.maxDistance = 8;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  let points = null;
  let baseDepth = null; // per-point depth 0..1, kept for the depth slider
  let depthScale = 1.4;

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  }

  function clearCloud() {
    if (points) {
      scene.remove(points);
      points.geometry.dispose();
      points.material.dispose();
      points = null;
    }
  }

  function applyDepth() {
    if (!points || !baseDepth) return;
    const pos = points.geometry.attributes.position;
    for (let i = 0; i < baseDepth.length; i++) {
      pos.array[i * 3 + 2] = (baseDepth[i] - 0.5) * depthScale;
    }
    pos.needsUpdate = true;
  }

  // depthImage: { data, width, height } single-channel floats 0..1, 1 = near.
  // photoCanvas provides the per-point colors.
  function setCloud(photoCanvas, depthImage) {
    clearCloud();

    const { width: w, height: h, data } = depthImage;
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = w;
    colorCanvas.height = h;
    colorCanvas.getContext('2d').drawImage(photoCanvas, 0, 0, w, h);
    const rgba = colorCanvas.getContext('2d').getImageData(0, 0, w, h).data;

    const n = w * h;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    baseDepth = new Float32Array(n);

    const aspect = h / w;
    let i = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i++) {
        const d = data[i] || 0;
        baseDepth[i] = d;
        positions[i * 3] = (x / (w - 1) - 0.5) * 2;
        positions[i * 3 + 1] = (0.5 - y / (h - 1)) * 2 * aspect;
        positions[i * 3 + 2] = (d - 0.5) * depthScale;
        colors[i * 3] = rgba[i * 4] / 255;
        colors[i * 3 + 1] = rgba[i * 4 + 1] / 255;
        colors[i * 3 + 2] = rgba[i * 4 + 2] / 255;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3.4 / w,
      vertexColors: true,
      sizeAttenuation: true,
    });

    points = new THREE.Points(geometry, material);
    scene.add(points);

    camera.position.set(0, 0, 2.6);
    controls.target.set(0, 0, 0);
    controls.autoRotate = true;
    controls.update();

    resize();
    cancelAnimationFrame(raf);
    loop();
  }

  function setDepthScale(s) {
    depthScale = s;
    applyDepth();
  }

  function exportPLY() {
    if (!points) return null;
    const pos = points.geometry.attributes.position.array;
    const col = points.geometry.attributes.color.array;
    const n = pos.length / 3;

    const header =
      'ply\nformat binary_little_endian 1.0\n' +
      `element vertex ${n}\n` +
      'property float x\nproperty float y\nproperty float z\n' +
      'property uchar red\nproperty uchar green\nproperty uchar blue\n' +
      'end_header\n';
    const headerBytes = new TextEncoder().encode(header);

    const stride = 15; // 3 floats + 3 uchars
    const body = new ArrayBuffer(n * stride);
    const view = new DataView(body);
    for (let i = 0; i < n; i++) {
      const o = i * stride;
      view.setFloat32(o, pos[i * 3], true);
      view.setFloat32(o + 4, pos[i * 3 + 1], true);
      view.setFloat32(o + 8, pos[i * 3 + 2], true);
      view.setUint8(o + 12, Math.round(col[i * 3] * 255));
      view.setUint8(o + 13, Math.round(col[i * 3 + 1] * 255));
      view.setUint8(o + 14, Math.round(col[i * 3 + 2] * 255));
    }

    return new Blob([headerBytes, body], { type: 'application/octet-stream' });
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  return { setCloud, setDepthScale, exportPLY, stop, resize };
}

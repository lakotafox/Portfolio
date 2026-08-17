// Vanilla-JS port of the PUDDL3 P4RTS "Strands" WebGL background (ogl), matching the
// portfolio's animated-background aesthetic. Same shaders as the source component;
// the React wrapper is replaced with a plain init function.
//
// Palette is weighted toward greens (with occasional cyan/lime/gold) so the cascade
// lands on green often, per the site's theme.

import { Renderer, Program, Mesh, Color, Triangle, RenderTarget } from './vendor/ogl.js';

const MAX_STRANDS = 12;
const MAX_COLORS = 8;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;

out vec4 fragColor;

const float PI = 3.14159265;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}

vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}

vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);

  float e = 0.06 + uIntensity * 0.94;
  float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);

  vec3 col = vec3(0.0);

  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;

    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;

    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;

    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;

    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * env;
  }

  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);

  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);

  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;

  fragColor = vec4(col * uOpacity, alpha);
}
`;

// Green-weighted palette: greens dominate the cascade, with cyan/lime/gold accents.
const GREEN_PALETTE = [
  '#5cc98a', // mint
  '#3fae6d', // green
  '#7ede4f', // lime
  '#2e8b57', // sea green
  '#06b6d4', // cyan accent
  '#8bd450', // yellow-green
  '#35c46a', // bright green
  '#eab308', // gold accent
];

function buildPalette(colors) {
  const filled = colors && colors.length ? colors : ['#ffffff'];
  const padded = [];
  for (let i = 0; i < MAX_COLORS; i++) {
    const hex = filled[i] ?? filled[filled.length - 1];
    const c = new Color(hex);
    padded.push([c.r, c.g, c.b]);
  }
  return padded;
}

// Mounts the animated background into `container`. Returns a cleanup function.
export function initStrands(container, opts = {}) {
  // Values tuned by the user on the PUDDL3 P4RTS playground (2026-07-15).
  const o = {
    colors: GREEN_PALETTE,
    count: 6,
    speed: 0.03, // slow-motion drift (user asked for much slower than the playground's 0.1)
    amplitude: 3,
    waviness: 3,
    thickness: 0.2,
    glow: 1.5,
    taper: 0.5,
    spread: 0,
    hueShift: 0.78,
    intensity: 0.15,
    saturation: 2,
    opacity: 1,
    scale: 1.35,
    ...opts,
  };

  let renderer;
  try {
    renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true });
  } catch (e) {
    return () => {}; // WebGL unavailable — background just stays the CSS color
  }
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.canvas.style.backgroundColor = 'transparent';

  const geometry = new Triangle(gl);
  if (geometry.attributes.uv) delete geometry.attributes.uv;

  const program = new Program(gl, {
    vertex: VERT,
    fragment: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [container.offsetWidth, container.offsetHeight] },
      uColors: { value: buildPalette(o.colors) },
      uColorCount: { value: Math.min(o.colors.length, MAX_COLORS) },
      uStrandCount: { value: Math.min(o.count, MAX_STRANDS) },
      uSpeed: { value: o.speed },
      uAmplitude: { value: o.amplitude },
      uWaviness: { value: o.waviness },
      uThickness: { value: o.thickness },
      uGlow: { value: o.glow },
      uTaper: { value: o.taper },
      uSpread: { value: o.spread },
      uHueShift: { value: o.hueShift },
      uIntensity: { value: o.intensity },
      uOpacity: { value: o.opacity },
      uScale: { value: o.scale },
      uSaturation: { value: o.saturation },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });
  container.appendChild(gl.canvas);

  function resize() {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    renderer.setSize(w, h);
    program.uniforms.uResolution.value = [w, h];
  }
  window.addEventListener('resize', resize);
  resize();

  let animateId = 0;
  const update = (t) => {
    animateId = requestAnimationFrame(update);
    program.uniforms.uTime.value = t * 0.001;
    renderer.render({ scene: mesh });
  };
  animateId = requestAnimationFrame(update);

  // Debug hook for automated tests (same-frame pixel readback).
  window.__strands = { gl, renderer, program, mesh };

  return () => {
    cancelAnimationFrame(animateId);
    window.removeEventListener('resize', resize);
    if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}

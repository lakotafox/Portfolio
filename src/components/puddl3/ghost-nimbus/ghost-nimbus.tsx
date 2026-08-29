"use client";

import "./ghost-nimbus.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface GhostNimbusProps {
  /** How fast the cloud bank churns */
  speed?: number;
  /** Volume samples per ray, higher is smoother and slower */
  steps?: number;
  /** Layers of turbulence folded into the volume, 1 to 6 */
  octaves?: number;
  /** Field of view, lower is more telephoto */
  focal?: number;
  /** How fast the core winds and unwinds the cloud */
  swirl?: number;
  /** How quickly the twist fades away from the core */
  swirlFalloff?: number;
  /** Depth of the turbulence folds */
  waveAmp?: number;
  /** Size of the largest fold, higher is finer */
  waveFreq?: number;
  /** How much finer each successive fold gets */
  waveLapse?: number;
  /** How fast the folds travel */
  waveSpeed?: number;
  /** Half height of the cloud slab */
  thickness?: number;
  /** Smallest step a ray may take, lower is sharper and slower */
  softness?: number;
  /** How far rays coast once they leave the slab */
  passthrough?: number;
  /** How sharply brightness falls off toward the edges of the slab */
  sky?: number;
  /** How far a ray travels before it is abandoned */
  reach?: number;
  /** Overall opacity of the cloud */
  density?: number;
  /** How much of the spectral rainbow shows through, 0 to 1 */
  spectrum?: number;
  /** How tightly the spectrum bands wrap the slab */
  colorWave?: number;
  /** How fast the spectrum sways back and forth */
  colorSpeed?: number;
  /** How much depth skews the spectrum */
  colorTwist?: number;
  /** Colour the whole cloud is tinted with */
  color?: string;
  /** Colour of the hot core */
  highlightColor?: string;
  /** Strength of the hot core */
  bloom?: number;
  /** How tightly the hot core clings to the densest cloud */
  bloomPower?: number;
  /** Film grain strength, 0 to 1 */
  grain?: number;
  /** Grain refreshes per second */
  grainRate?: number;
  /** Corner darkening, 0 to 1 */
  vignette?: number;
  /** Backdrop colour, or "transparent" to show the page through */
  backgroundColor?: string;
  /** Master alpha */
  opacity?: number;
  /** Let the pointer lean the view */
  cursorInteraction?: boolean;
  /** How far the pointer leans the view */
  cursorSteer?: number;
  /** Freeze the animation */
  paused?: boolean;
  /** Scale back resolution when the frame budget slips */
  adaptiveQuality?: boolean;
  /** Frame rate the quality meter aims to hold */
  targetFps?: number;
  /** Upper bound on rendered frames per second */
  maxFps?: number;
  /** Upper device pixel ratio bound */
  dpr?: number;
  className?: string;
  children?: ReactNode;
}

const cloudVertex = `
varying vec2 vPlane;

void main() {
  vPlane = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
`;

const buildCloudFragment = (steps: number, octaves: number) => `
precision highp float;

varying vec2 vPlane;

uniform vec2 uCanvas;
uniform float uClock;
uniform float uFocal;
uniform float uSwirl;
uniform float uSwirlFall;
uniform float uWaveAmp;
uniform float uWaveFreq;
uniform float uWaveLapse;
uniform float uWaveSpeed;
uniform float uThickness;
uniform float uSoftness;
uniform float uPass;
uniform float uSky;
uniform float uReach;
uniform float uDensity;
uniform float uSpectrum;
uniform float uColorWave;
uniform float uColorSpeed;
uniform float uColorTwist;
uniform vec3 uTint;
uniform vec3 uHighlight;
uniform float uBloom;
uniform float uBloomPower;
uniform float uGrain;
uniform float uGrainRate;
uniform float uVignette;
uniform vec3 uBackdrop;
uniform float uBackdropAlpha;
uniform float uOpacity;
uniform vec2 uSteer;

float shuffle(vec2 seed) {
  vec3 drift = fract(vec3(seed.xyx) * vec3(0.1031, 0.1030, 0.0973));
  drift += dot(drift, drift.yzx + 33.33);
  return fract((drift.x + drift.y) * drift.z);
}

float softClip(float x) {
  float fall = exp(-2.0 * max(x, 0.0));
  return (1.0 - fall) / (1.0 + fall);
}

void main() {
  vec2 pixel = vPlane * uCanvas;
  vec2 field = (pixel - 0.5 * uCanvas) / max(uCanvas.y, 1.0);

  float t = uClock;

  vec3 dir = normalize(vec3(field + uSteer, -uFocal));

  vec3 flow = vec3(uWaveSpeed) * t;
  float spin = sin(t * uSwirl * 0.4) * 2.6;
  float lapse = max(uWaveLapse, 1.01);
  float unlapse = 1.0 / lapse;
  float soft = max(uSoftness, 0.0004);
  float bandWidth = max(uThickness, 0.001);

  float sway = sin(t * uColorSpeed * 0.5) * 1.4;

  float travel = 0.0;
  float density = 0.0;
  float wave = 0.0;
  float quad = 0.0;

  for (int i = 0; i < ${steps}; i++) {
    vec3 probe = travel * dir;

    float pull = exp(-length(probe.xy) * uSwirlFall);
    if (pull > 0.004) {
      float turn = spin * pull;
      float cs = cos(turn);
      float sn = sin(turn);
      probe.xy = mix(probe.xy, mat2(cs, sn, -sn, cs) * probe.xy, pull);
    }

    float freq = max(uWaveFreq, 0.05);
    float unfreq = 1.0 / freq;
    for (int j = 0; j < ${octaves}; j++) {
      probe += (uWaveAmp * unfreq) * sin(probe * freq - flow).yzx;
      freq *= lapse;
      unfreq *= unlapse;
    }

    float slab = bandWidth - abs(probe.y);
    float stride = soft + max(slab, -slab * uPass) * 0.25;
    float lift = exp(slab * uSky) / stride;

    float phase =
      uColorWave * slab +
      dot(probe, vec3(1.0, -0.5, 0.7)) * uColorTwist +
      sway;

    density += lift;
    wave += cos(phase) * lift;
    quad += sin(phase) * lift;

    travel += stride;
    if (travel > uReach) break;
  }

  vec3 energy =
    0.5 * density +
    0.5 * (wave * vec3(1.0, 0.0707372, -0.9709582) +
           quad * vec3(0.0, 0.9974950, 0.2392493));

  vec3 lit = energy * (soft / ${steps}.0) * uDensity * vec3(1.5, 0.42, 2.05);
  vec3 hot = vec3(
    softClip(lit.r * lit.r),
    softClip(lit.g * lit.g),
    softClip(lit.b * lit.b)
  );

  float mass = max(max(hot.r, hot.g), hot.b);
  vec3 hue = hot / max(mass, 1e-4);
  vec3 tone = mix(vec3(1.0), hue, clamp(uSpectrum, 0.0, 1.0)) * uTint;
  tone += uHighlight * uBloom * pow(mass, max(uBloomPower, 0.1));

  vec3 rgb = tone * mass;
  float rest = uBackdropAlpha * (1.0 - mass);
  rgb += uBackdrop * rest;
  float alpha = mass + rest;

  float vig = smoothstep(1.4, 0.25, length(field));
  float shade = (1.0 - uVignette) + uVignette * vig;
  rgb *= shade;
  alpha *= shade;

  float tick = floor(uClock * max(uGrainRate, 1.0));
  float speck = shuffle(pixel + tick * 17.0) - 0.5;
  rgb += speck * uGrain * (0.25 + 0.75 * alpha);
  rgb = clamp(rgb, vec3(0.0), vec3(alpha));

  gl_FragColor = vec4(rgb, alpha) * uOpacity;
}
`;

const literal = (hex: string, fallback: string) => {
  const shade = new THREE.Color();
  try {
    shade.setStyle(hex, THREE.LinearSRGBColorSpace);
  } catch {
    shade.setStyle(fallback, THREE.LinearSRGBColorSpace);
  }
  return shade;
};

const repaint = (target: THREE.Color, hex: string) => {
  try {
    target.setStyle(hex, THREE.LinearSRGBColorSpace);
  } catch {
    return;
  }
};

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

const subscribeToScreen = (notify: () => void) => {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(min-resolution: 2dppx)");
  media.addEventListener("change", notify);
  window.addEventListener("resize", notify);
  return () => {
    media.removeEventListener("change", notify);
    window.removeEventListener("resize", notify);
  };
};

const readScreenDpr = () =>
  typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

const isClear = (paint: string) =>
  paint === "transparent" || paint === "none" || paint === "";

interface PointerState {
  x: number;
  y: number;
  inside: boolean;
}

interface CloudFieldProps {
  speed: number;
  steps: number;
  octaves: number;
  focal: number;
  swirl: number;
  swirlFalloff: number;
  waveAmp: number;
  waveFreq: number;
  waveLapse: number;
  waveSpeed: number;
  thickness: number;
  softness: number;
  passthrough: number;
  sky: number;
  reach: number;
  density: number;
  spectrum: number;
  colorWave: number;
  colorSpeed: number;
  colorTwist: number;
  color: string;
  highlightColor: string;
  bloom: number;
  bloomPower: number;
  grain: number;
  grainRate: number;
  vignette: number;
  backgroundColor: string;
  opacity: number;
  cursorInteraction: boolean;
  cursorSteer: number;
  paused: boolean;
  adaptiveQuality: boolean;
  targetFps: number;
  maxFps: number;
  ceiling: number;
  readPointer: () => PointerState;
}

const CloudField = ({
  speed,
  steps,
  octaves,
  focal,
  swirl,
  swirlFalloff,
  waveAmp,
  waveFreq,
  waveLapse,
  waveSpeed,
  thickness,
  softness,
  passthrough,
  sky,
  reach,
  density,
  spectrum,
  colorWave,
  colorSpeed,
  colorTwist,
  color,
  highlightColor,
  bloom,
  bloomPower,
  grain,
  grainRate,
  vignette,
  backgroundColor,
  opacity,
  cursorInteraction,
  cursorSteer,
  paused,
  adaptiveQuality,
  targetFps,
  maxFps,
  ceiling,
  readPointer,
}: CloudFieldProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const clock = useRef(0);
  const glide = useRef({ x: 0, y: 0 });
  const budget = useRef({ frames: 0, span: 0, wins: 0, cap: 4 });
  const { gl, size, invalidate } = useThree();

  const marches = Math.round(clamp(steps, 16, 90));
  const folds = Math.round(clamp(octaves, 1, 6));

  const fragment = useMemo(
    () => buildCloudFragment(marches, folds),
    [marches, folds],
  );

  const uniforms = useMemo(
    () => ({
      uCanvas: { value: new THREE.Vector2(1, 1) },
      uClock: { value: 0 },
      uFocal: { value: 1 },
      uSwirl: { value: 0.6 },
      uSwirlFall: { value: 5 },
      uWaveAmp: { value: 0.5 },
      uWaveFreq: { value: 4 },
      uWaveLapse: { value: 1.6 },
      uWaveSpeed: { value: 0.3 },
      uThickness: { value: 0.25 },
      uSoftness: { value: 0.008 },
      uPass: { value: 0.15 },
      uSky: { value: 7 },
      uReach: { value: 3.2 },
      uDensity: { value: 1.2 },
      uSpectrum: { value: 0.85 },
      uColorWave: { value: 12 },
      uColorSpeed: { value: 0.3 },
      uColorTwist: { value: 1 },
      uTint: { value: literal("#e9d5ff", "#e9d5ff") },
      uHighlight: { value: literal("#f5d0fe", "#f5d0fe") },
      uBloom: { value: 0.35 },
      uBloomPower: { value: 3 },
      uGrain: { value: 0.035 },
      uGrainRate: { value: 24 },
      uVignette: { value: 0.25 },
      uBackdrop: { value: literal("#0a0a0a", "#0a0a0a") },
      uBackdropAlpha: { value: 1 },
      uOpacity: { value: 1 },
      uSteer: { value: new THREE.Vector2(0, 0) },
    }),
    [],
  );

  useEffect(() => {
    const gap = 1000 / clamp(paused ? 8 : maxFps, 1, 240);
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < gap) return;
      last = now;
      invalidate();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [invalidate, maxFps, paused]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    material.fragmentShader = fragment;
    material.needsUpdate = true;
  }, [fragment]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    repaint(material.uniforms.uTint.value, color);
    repaint(material.uniforms.uHighlight.value, highlightColor);
    const clear = isClear(backgroundColor);
    material.uniforms.uBackdropAlpha.value = clear ? 0 : 1;
    if (!clear) repaint(material.uniforms.uBackdrop.value, backgroundColor);
  }, [color, highlightColor, backgroundColor]);

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;

    const beat = Math.min(delta, 0.05);
    if (!paused) clock.current += beat * speed;

    const ratio = gl.getPixelRatio();
    const set = material.uniforms;
    set.uCanvas.value.set(size.width * ratio, size.height * ratio);
    set.uClock.value = clock.current;
    set.uFocal.value = Math.max(focal, 0.2);
    set.uSwirl.value = swirl;
    set.uSwirlFall.value = Math.max(swirlFalloff, 0.1);
    set.uWaveAmp.value = waveAmp;
    set.uWaveFreq.value = waveFreq;
    set.uWaveLapse.value = waveLapse;
    set.uWaveSpeed.value = waveSpeed;
    set.uThickness.value = thickness;
    set.uSoftness.value = softness;
    set.uPass.value = passthrough;
    set.uSky.value = sky;
    set.uReach.value = Math.max(reach, 0.3);
    set.uDensity.value = density;
    set.uSpectrum.value = spectrum;
    set.uColorWave.value = colorWave;
    set.uColorSpeed.value = colorSpeed;
    set.uColorTwist.value = colorTwist;
    set.uBloom.value = bloom;
    set.uBloomPower.value = bloomPower;
    set.uGrain.value = grain;
    set.uGrainRate.value = grainRate;
    set.uVignette.value = vignette;
    set.uOpacity.value = opacity;

    const pointer = readPointer();
    const ease = 1 - Math.exp(-beat * 3);
    const range = cursorInteraction && pointer.inside ? cursorSteer : 0;
    const aimX = (pointer.x * 2 - 1) * range;
    const aimY = (pointer.y * 2 - 1) * range;
    glide.current.x += (aimX - glide.current.x) * ease;
    glide.current.y += (aimY - glide.current.y) * ease;
    set.uSteer.value.set(glide.current.x, glide.current.y);

    if (!adaptiveQuality) return;
    const meter = budget.current;
    meter.frames += 1;
    meter.span += delta;
    if (meter.span < 0.75) return;
    const fps = meter.frames / meter.span;
    meter.frames = 0;
    meter.span = 0;
    const goal = Math.min(targetFps, maxFps);
    const roof = Math.min(ceiling, meter.cap);
    if (fps < goal * 0.85 && ratio > 0.6) {
      meter.wins = 0;
      meter.cap = Math.max(0.6, ratio * 0.9);
      gl.setPixelRatio(Math.max(0.6, ratio * 0.75));
    } else if (fps > goal * 0.94 && ratio < roof - 0.01) {
      meter.wins += 1;
      if (meter.wins >= 3) {
        meter.wins = 0;
        gl.setPixelRatio(Math.min(roof, ratio * 1.25));
      }
    } else {
      meter.wins = 0;
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={cloudVertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        premultipliedAlpha
      />
    </mesh>
  );
};

export const GhostNimbus = ({
  speed = 1,
  steps = 40,
  octaves = 4,
  focal = 1,
  swirl = 0.6,
  swirlFalloff = 5,
  waveAmp = 0.5,
  waveFreq = 4,
  waveLapse = 1.6,
  waveSpeed = 0.3,
  thickness = 0.25,
  softness = 0.008,
  passthrough = 0.15,
  sky = 7,
  reach = 3.2,
  density = 1.2,
  spectrum = 0.85,
  colorWave = 12,
  colorSpeed = 0.3,
  colorTwist = 1,
  color = "#e9d5ff",
  highlightColor = "#f5d0fe",
  bloom = 0.35,
  bloomPower = 3,
  grain = 0.035,
  grainRate = 24,
  vignette = 0.25,
  backgroundColor = "#0a0a0a",
  opacity = 1,
  cursorInteraction = true,
  cursorSteer = 0.12,
  paused = false,
  adaptiveQuality = true,
  targetFps = 60,
  maxFps = 40,
  dpr = 1.1,
  className,
  children,
}: GhostNimbusProps) => {
  const shell = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerState>({ x: 0.5, y: 0.5, inside: false });
  const [awake, setAwake] = useState(true);

  const screenDpr = useSyncExternalStore(
    subscribeToScreen,
    readScreenDpr,
    () => 1,
  );
  const ceiling = Math.min(screenDpr, Math.max(dpr, 0.5));

  const readPointer = useCallback(() => pointer.current, []);

  useEffect(() => {
    const node = shell.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const watcher = new IntersectionObserver(
      ([entry]) => setAwake(entry.isIntersecting),
      { threshold: 0 },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  useEffect(() => {
    const node = shell.current;
    if (!node || !cursorInteraction) return;

    const track = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height) return;
      pointer.current.x = clamp((event.clientX - box.left) / box.width, 0, 1);
      pointer.current.y = clamp(
        1 - (event.clientY - box.top) / box.height,
        0,
        1,
      );
      pointer.current.inside = true;
    };

    const reset = () => {
      pointer.current.inside = false;
    };

    node.addEventListener("pointermove", track);
    node.addEventListener("pointerleave", reset);
    return () => {
      node.removeEventListener("pointermove", track);
      node.removeEventListener("pointerleave", reset);
    };
  }, [cursorInteraction]);

  return (
    <div
      ref={shell}
      className={["ghost-nimbus", className].filter(Boolean).join(" ")}
    >
      <div className="ghost-nimbus-canvas">
        <Canvas
          orthographic
          dpr={ceiling}
          frameloop={awake ? "demand" : "never"}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <CloudField
            speed={speed}
            steps={steps}
            octaves={octaves}
            focal={focal}
            swirl={swirl}
            swirlFalloff={swirlFalloff}
            waveAmp={waveAmp}
            waveFreq={waveFreq}
            waveLapse={waveLapse}
            waveSpeed={waveSpeed}
            thickness={thickness}
            softness={softness}
            passthrough={passthrough}
            sky={sky}
            reach={reach}
            density={density}
            spectrum={spectrum}
            colorWave={colorWave}
            colorSpeed={colorSpeed}
            colorTwist={colorTwist}
            color={color}
            highlightColor={highlightColor}
            bloom={bloom}
            bloomPower={bloomPower}
            grain={grain}
            grainRate={grainRate}
            vignette={vignette}
            backgroundColor={backgroundColor}
            opacity={opacity}
            cursorInteraction={cursorInteraction}
            cursorSteer={cursorSteer}
            paused={paused}
            adaptiveQuality={adaptiveQuality}
            targetFps={targetFps}
            maxFps={maxFps}
            ceiling={ceiling}
            readPointer={readPointer}
          />
        </Canvas>
      </div>
      {children ? (
        <div className="ghost-nimbus-content">{children}</div>
      ) : null}
    </div>
  );
};

export default GhostNimbus;

"use client";

import "./tile-swell.css";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export type TileSwellShape = "square" | "dot";

export interface TileSwellProps {
  /** Container width */
  width?: string | number;
  /** Container height */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Content rendered above the effect */
  children?: React.ReactNode;
  /** Distance between tile centres in CSS pixels */
  pitch?: number;
  /** Portion of each cell the tile fills, from 0 to 1 */
  fill?: number;
  /** Tile silhouette */
  shape?: TileSwellShape;
  /** Softness of the tile edge, from 0 to 1 */
  feather?: number;
  /** How fast the field drifts */
  speed?: number;
  /** Strength of the domain warp that folds the field */
  warp?: number;
  /** Scale of the warp field */
  warpScale?: number;
  /** Scale of the finer warp riding inside the first */
  detailScale?: number;
  /** Scale of the wave field being lit */
  waveScale?: number;
  /** Falloff exponent. Higher values tighten the bright ridges */
  falloff?: number;
  /** Overall gain applied to the wave */
  brightness?: number;
  /** Level the darkest tiles settle at */
  ambient?: number;
  /** Colour of the wave */
  color?: string;
  /** Colour the brightest ridges shift toward */
  hotColor?: string;
  /** Background fill colour. Accepts "transparent" */
  backgroundColor?: string;
  /** Contrast curve applied at the end */
  gamma?: number;
  /** Darkening toward the edges, from 0 to 1 */
  vignette?: number;
  /** Master alpha, from 0 to 1 */
  opacity?: number;
  /** Let the pointer bend and light the field */
  cursorInteraction?: boolean;
  /** How far the pointer pulls the field */
  cursorPull?: number;
  /** How much the pointer lights nearby tiles */
  cursorGlow?: number;
  /** Reach of the pointer, from 0 to 1 */
  cursorReach?: number;
  /** Drop resolution when the frame rate falls short */
  adaptiveQuality?: boolean;
  /** Frame rate the adaptive pass aims for */
  targetFps?: number;
  /** Upper bound on device pixel ratio */
  dpr?: number;
  /** Hold the animation still */
  paused?: boolean;
}

const mosaicVertex = `
varying vec2 vPlane;

void main() {
  vPlane = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const mosaicFragment = `
precision highp float;

varying vec2 vPlane;

uniform vec2 uCanvas;
uniform float uClock;
uniform float uPitch;
uniform float uFill;
uniform float uRound;
uniform float uFeather;
uniform float uWarp;
uniform float uWarpScale;
uniform float uDetailScale;
uniform float uWaveScale;
uniform float uFalloff;
uniform float uGain;
uniform float uAmbient;
uniform vec3 uInk;
uniform vec3 uHot;
uniform float uGamma;
uniform float uVignette;
uniform float uOpacity;
uniform vec3 uBackdrop;
uniform float uBackdropAlpha;
uniform vec3 uPointer;
uniform float uCursorPull;
uniform float uCursorGlow;
uniform float uCursorReach;

float chip(vec2 cell) {
  return fract(sin(dot(cell, vec2(12.543, 514.123))) * 4732.12);
}

float swell(vec2 spot) {
  vec2 cell = floor(spot);
  vec2 lean = fract(spot);
  lean = lean * lean * (3.0 - 2.0 * lean);

  float lo = mix(chip(cell), chip(cell + vec2(1.0, 0.0)), lean.x);
  float hi = mix(chip(cell + vec2(0.0, 1.0)), chip(cell + vec2(1.0, 1.0)), lean.x);
  return mix(lo, hi, lean.y);
}

void main() {
  vec2 pixel = vPlane * uCanvas;
  float pitch = max(uPitch, 2.0);

  vec2 grid = pixel / pitch;
  vec2 local = abs(fract(grid) - 0.5) * 2.0;
  float boxy = max(local.x, local.y);
  float orb = length(local);
  float bite = mix(boxy, orb, uRound);

  float aa = 2.0 / pitch;
  float soft = aa + uFeather * uFill;
  float tile = 1.0 - smoothstep(uFill - soft, uFill + soft, bite);

  vec2 field = pixel / max(uCanvas.y, 1.0);

  vec2 toward = uPointer.xy - field;
  float span = max(uCursorReach, 0.001);
  float near = exp(-dot(toward, toward) / (span * span)) * uPointer.z;
  field += toward * near * uCursorPull;

  float t = uClock;
  float inner = swell(field * uDetailScale - t * 0.66);
  vec2 folded = field + uWarp * swell(field * uWarpScale + t + inner * 0.5);
  float wave = swell(folded * uWaveScale - vec2(0.0, t));

  float ridge = pow(max(1.0 - wave, 0.0), uFalloff) * uGain;
  ridge += near * uCursorGlow;

  float level = clamp(uAmbient + ridge, 0.0, 1.0);
  level = pow(level, 1.0 / max(uGamma, 0.05));

  vec2 off = vPlane - 0.5;
  float edge = 1.0 - uVignette * smoothstep(0.2, 0.75, length(off));

  vec3 tint = mix(uInk, uHot, smoothstep(0.6, 1.0, level));
  float cover = clamp(level * tile * edge, 0.0, 1.0);
  float rest = uBackdropAlpha * (1.0 - cover);
  gl_FragColor = vec4(tint * cover + uBackdrop * rest, cover + rest) * uOpacity;
}
`;

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

const subscribeToScreen = () => () => {};

const readScreenDpr = () => window.devicePixelRatio || 1;

const isClear = (paint: string) => {
  const tidy = paint.trim().toLowerCase();
  return tidy === "transparent" || tidy === "none" || tidy === "";
};

interface PointerState {
  x: number;
  y: number;
  reach: number;
  toReach: number;
}

interface MosaicFieldProps {
  ceiling: number;
  readPointer: () => PointerState;
  pitch: number;
  fill: number;
  shape: TileSwellShape;
  feather: number;
  speed: number;
  warp: number;
  warpScale: number;
  detailScale: number;
  waveScale: number;
  falloff: number;
  brightness: number;
  ambient: number;
  color: string;
  hotColor: string;
  backgroundColor: string;
  gamma: number;
  vignette: number;
  opacity: number;
  cursorInteraction: boolean;
  cursorPull: number;
  cursorGlow: number;
  cursorReach: number;
  adaptiveQuality: boolean;
  targetFps: number;
  paused: boolean;
}

const MosaicField = ({
  ceiling,
  readPointer,
  pitch,
  fill,
  shape,
  feather,
  speed,
  warp,
  warpScale,
  detailScale,
  waveScale,
  falloff,
  brightness,
  ambient,
  color,
  hotColor,
  backgroundColor,
  gamma,
  vignette,
  opacity,
  cursorInteraction,
  cursorPull,
  cursorGlow,
  cursorReach,
  adaptiveQuality,
  targetFps,
  paused,
}: MosaicFieldProps) => {
  const { gl, invalidate, setDpr } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const elapsed = useRef(0);
  const clock = useRef(0);
  const budget = useRef({
    scale: ceiling,
    frames: 0,
    span: 0,
    wins: 0,
    roof: Infinity,
  });
  const [calm, setCalm] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCalm(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const meter = budget.current;
    meter.scale = ceiling;
    meter.roof = Infinity;
    meter.wins = 0;
    setDpr(ceiling);
  }, [ceiling, setDpr]);

  const uniforms = useMemo(
    () => ({
      uCanvas: { value: new THREE.Vector2(1, 1) },
      uClock: { value: 0 },
      uPitch: { value: 4 },
      uFill: { value: 0.5 },
      uRound: { value: 0 },
      uFeather: { value: 0.15 },
      uWarp: { value: 0.375 },
      uWarpScale: { value: 3 },
      uDetailScale: { value: 7 },
      uWaveScale: { value: 4 },
      uFalloff: { value: 5 },
      uGain: { value: 5 },
      uAmbient: { value: 0 },
      uInk: { value: new THREE.Color("#3366ff") },
      uHot: { value: new THREE.Color("#bfd4ff") },
      uGamma: { value: 2.2 },
      uVignette: { value: 0 },
      uOpacity: { value: 1 },
      uBackdrop: { value: new THREE.Color("#0a0a0a") },
      uBackdropAlpha: { value: 1 },
      uPointer: { value: new THREE.Vector3(0.5, 0.5, 0) },
      uCursorPull: { value: 0.35 },
      uCursorGlow: { value: 0.25 },
      uCursorReach: { value: 0.28 },
    }),
    [],
  );

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    const u = material.uniforms;

    const beat = Math.min(delta, 0.05);
    elapsed.current += beat;
    if (!paused && !calm) clock.current += beat * speed * 0.5;

    const size = gl.getDrawingBufferSize(new THREE.Vector2());
    const ratio = gl.getPixelRatio();
    u.uCanvas.value.set(size.x, size.y);
    u.uClock.value = clock.current;
    u.uPitch.value = Math.max(pitch, 2) * ratio;
    u.uFill.value = clamp(fill, 0.05, 1);
    u.uRound.value = shape === "dot" ? 1 : 0;
    u.uFeather.value = clamp(feather, 0, 1);
    u.uWarp.value = warp;
    u.uWarpScale.value = warpScale;
    u.uDetailScale.value = detailScale;
    u.uWaveScale.value = waveScale;
    u.uFalloff.value = Math.max(falloff, 0.1);
    u.uGain.value = brightness;
    u.uAmbient.value = ambient;
    u.uInk.value.set(color);
    u.uHot.value.set(hotColor);
    u.uGamma.value = Math.max(gamma, 0.05);
    u.uVignette.value = vignette;
    u.uOpacity.value = opacity;

    if (isClear(backgroundColor)) {
      u.uBackdropAlpha.value = 0;
    } else {
      u.uBackdrop.value.set(backgroundColor);
      u.uBackdropAlpha.value = 1;
    }

    const pointer = readPointer();
    pointer.reach += (pointer.toReach - pointer.reach) * Math.min(beat * 5, 1);
    const aspect = size.x / Math.max(size.y, 1);
    u.uPointer.value.set(
      pointer.x * aspect,
      1 - pointer.y,
      cursorInteraction ? pointer.reach : 0,
    );
    u.uCursorPull.value = cursorPull;
    u.uCursorGlow.value = cursorGlow;
    u.uCursorReach.value = cursorReach;

    const meter = budget.current;
    meter.frames += 1;
    meter.span += delta;
    if (meter.span >= 0.75) {
      const fps = meter.frames / meter.span;
      meter.frames = 0;
      meter.span = 0;
      if (adaptiveQuality && elapsed.current > 0.5) {
        if (fps < targetFps * 0.85 && meter.scale > 0.5) {
          meter.roof = meter.scale;
          meter.scale = Math.max(0.5, meter.scale * 0.75);
          meter.wins = 0;
          setDpr(meter.scale);
        } else if (fps >= targetFps * 0.95 && meter.scale < ceiling) {
          meter.wins += 1;
          const next = Math.min(ceiling, meter.scale * 1.25);
          if (meter.wins >= 3 && next < meter.roof * 0.98) {
            meter.scale = next;
            meter.wins = 0;
            setDpr(next);
          }
        } else {
          meter.wins = 0;
        }
      }
    }

    invalidate();
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={mosaicVertex}
        fragmentShader={mosaicFragment}
        transparent
        premultipliedAlpha
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

const TileSwell = ({
  width = "100%",
  height = "100%",
  className,
  children,
  pitch = 4,
  fill = 0.5,
  shape = "square",
  feather = 0.15,
  speed = 1,
  warp = 0.375,
  warpScale = 3,
  detailScale = 7,
  waveScale = 4,
  falloff = 5,
  brightness = 5,
  ambient = 0,
  color = "#3366ff",
  hotColor = "#bfd4ff",
  backgroundColor = "#0a0a0a",
  gamma = 2.2,
  vignette = 0,
  opacity = 1,
  cursorInteraction = true,
  cursorPull = 0.35,
  cursorGlow = 0.25,
  cursorReach = 0.28,
  adaptiveQuality = true,
  targetFps = 60,
  dpr = 2,
  paused = false,
}: TileSwellProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef<PointerState>({
    x: 0.5,
    y: 0.5,
    reach: 0,
    toReach: 0,
  });
  const [awake, setAwake] = useState(false);
  const screenDpr = useSyncExternalStore(
    subscribeToScreen,
    readScreenDpr,
    () => 1,
  );

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const watcher = new IntersectionObserver(
      ([entry]) => setAwake(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  const readPointer = useCallback(() => pointer.current, []);

  const aimAt = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const node = rootRef.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    if (!box.width || !box.height) return;
    pointer.current.x = (event.clientX - box.left) / box.width;
    pointer.current.y = (event.clientY - box.top) / box.height;
    pointer.current.toReach = 1;
  }, []);

  const release = useCallback(() => {
    pointer.current.toReach = 0;
  }, []);

  const ceiling = useMemo(
    () => clamp(Math.min(screenDpr, dpr), 0.5, 2),
    [screenDpr, dpr],
  );

  return (
    <div
      ref={rootRef}
      className={["tile-swell", className].filter(Boolean).join(" ")}
      style={{
        width,
        height,
        backgroundColor: isClear(backgroundColor) ? undefined : backgroundColor,
      }}
      onPointerMove={cursorInteraction ? aimAt : undefined}
      onPointerLeave={cursorInteraction ? release : undefined}
    >
      <Canvas
        className="tile-swell-canvas"
        dpr={ceiling}
        frameloop={awake ? "always" : "demand"}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        orthographic
      >
        <MosaicField
          ceiling={ceiling}
          readPointer={readPointer}
          pitch={pitch}
          fill={fill}
          shape={shape}
          feather={feather}
          speed={speed}
          warp={warp}
          warpScale={warpScale}
          detailScale={detailScale}
          waveScale={waveScale}
          falloff={falloff}
          brightness={brightness}
          ambient={ambient}
          color={color}
          hotColor={hotColor}
          backgroundColor={backgroundColor}
          gamma={gamma}
          vignette={vignette}
          opacity={opacity}
          cursorInteraction={cursorInteraction}
          cursorPull={cursorPull}
          cursorGlow={cursorGlow}
          cursorReach={cursorReach}
          adaptiveQuality={adaptiveQuality}
          targetFps={targetFps}
          paused={paused}
        />
      </Canvas>
      {children ? <div className="tile-swell-content">{children}</div> : null}
    </div>
  );
};

export default TileSwell;

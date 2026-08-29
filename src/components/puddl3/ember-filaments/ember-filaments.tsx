"use client";

import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import "./ember-filaments.css";

export interface EmberFilamentsProps {
  /** Container width */
  width?: string | number;
  /** Container height */
  height?: string | number;
  /** Additional CSS class on the root */
  className?: string;
  /** Content rendered above the effect */
  children?: React.ReactNode;
  /** Number of horizontal lines stacked across the canvas */
  lineCount?: number;
  /** Vertical sway amplitude applied to every line */
  waveAmplitude?: number;
  /** Spatial frequency of the horizontal sway (higher = more crests) */
  waveFrequency?: number;
  /** Floor of the line distance: controls the visible thickness */
  lineThickness?: number;
  /** Numerator of the inverse-distance glow term */
  lineGlow?: number;
  /** Hex color of the lines themselves */
  lineColor?: string;
  /** Multiplier applied on top of `lineColor` (boost saturation/brightness) */
  lineIntensity?: number;
  /** Hex color of the warm flash that sweeps along the lines */
  pulseColor?: string;
  /** Speed (and frequency) of the sweeping flash */
  pulseSpeed?: number;
  /** Bell width of the flash: larger = wider hot spot */
  pulseWidth?: number;
  /** Brightness multiplier of the flash */
  pulseIntensity?: number;
  /** Pixel-space chromatic aberration applied to the final composite */
  chromaticAberration?: number;
  /** Background fill color in hex */
  backgroundColor?: string;
  /** Master alpha (0–1) */
  opacity?: number;
  /** Maximum device pixel ratio */
  dpr?: number;
  /** Enable cursor-anchored pulse + click burst */
  cursorInteraction?: boolean;
  /** How fast the pulse follows the cursor (0–1, per-frame lerp) */
  cursorLerp?: number;
  /** Multiplier applied to pulseIntensity on click */
  clickBurstStrength?: number;
  /** Per-second decay rate of the click burst */
  clickBurstDecay?: number;
}

const screenVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const linesFragment = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uRes;

uniform float uLineCount;
uniform float uWaveAmp;
uniform float uWaveFreq;
uniform float uLineThickness;
uniform float uLineGlow;
uniform vec3  uLineColor;
uniform float uLineIntensity;

uniform vec3  uPulseColor;
uniform float uPulseSpeed;
uniform float uPulseWidth;
uniform float uPulseIntensity;
uniform float uPulsePhase;
uniform float uPulseWidthScale;
uniform float uPulseBoost;

uniform float uChroma;
uniform vec3  uBg;
uniform float uAlpha;

vec3 sampleField(vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - uRes) / uRes.y;

  float sway = cos(uv.x * uWaveFreq) * uWaveAmp;
  float dist = abs(fract((uv.y + sway) * uLineCount) - 0.5);
  float lineMask = uLineGlow / max(dist, uLineThickness);
  vec3 col = uLineColor * uLineIntensity * lineMask;

  float pulse = abs(fract((uv.x - uPulsePhase) * uPulseSpeed) - 0.5);
  float bell  = exp(-pulse * pulse * uPulseWidth * uPulseWidthScale);
  float hot   = (uLineGlow * 0.5) / max(dist, uLineThickness * 0.1);
  col += uPulseColor * bell * hot * uPulseIntensity * uPulseBoost;

  return col;
}

void main() {
  vec2 fragCoord = vUv * uRes;

  vec2 ndc = vUv - 0.5;
  vec2 offset = ndc * length(ndc) * uChroma * 0.5;

  vec3 r = sampleField(fragCoord + offset * uRes);
  vec3 g = sampleField(fragCoord);
  vec3 b = sampleField(fragCoord - offset * uRes);

  vec3 col = vec3(r.r, g.g, b.b);
  col = clamp(col, 0.0, 1.0);
  col = mix(uBg, col + uBg * (1.0 - clamp(dot(col, vec3(1.0)), 0.0, 1.0)), 1.0);

  gl_FragColor = vec4(col, uAlpha);
}
`;

const HEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

function hexToRgb(hex: string): [number, number, number] {
  const m = HEX.exec(hex);
  if (!m) return [0, 0, 0];
  return [
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
    parseInt(m[3], 16) / 255,
  ];
}

type PipelineProps = Required<
  Omit<
    EmberFilamentsProps,
    "width" | "height" | "className" | "children" | "dpr"
  >
>;

interface PointerState {
  active: boolean;
  nx: number;
  ny: number;
  targetPhase: number;
  smoothedPhase: number;
  timePhase: number;
  click: number;
  wasActive: boolean;
}

const LinesPipeline: React.FC<
  PipelineProps & {
    onPointerReady: (state: PointerState) => void;
  }
> = (props) => {
  const { gl, size } = useThree();

  const refs = useRef<{
    mat: THREE.ShaderMaterial;
    geom: THREE.PlaneGeometry;
    mesh: THREE.Mesh;
    scene: THREE.Scene;
    cam: THREE.OrthographicCamera;
    pointer: PointerState;
  } | null>(null);
  if (refs.current === null) {
    const geom = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: screenVertex,
      fragmentShader: linesFragment,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uLineCount: { value: 1 },
        uWaveAmp: { value: 1 },
        uWaveFreq: { value: 2 },
        uLineThickness: { value: 0.05 },
        uLineGlow: { value: 0.01 },
        uLineColor: { value: new THREE.Vector3(0.3, 0.2, 0.8) },
        uLineIntensity: { value: 2 },
        uPulseColor: { value: new THREE.Vector3(0.8, 0.3, 0.3) },
        uPulseSpeed: { value: 0.5 },
        uPulseWidth: { value: 25 },
        uPulseIntensity: { value: 10 },
        uPulsePhase: { value: 0 },
        uPulseWidthScale: { value: 1 },
        uPulseBoost: { value: 1 },
        uChroma: { value: 0.05 },
        uBg: { value: new THREE.Vector3(0, 0, 0) },
        uAlpha: { value: 1 },
      },
    });
    const mesh = new THREE.Mesh(geom, mat);
    const scene = new THREE.Scene();
    scene.add(mesh);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cam.position.z = 1;
    const pointer: PointerState = {
      active: false,
      nx: 0.5,
      ny: 0.5,
      targetPhase: 0,
      smoothedPhase: 0,
      timePhase: 0,
      click: 0,
      wasActive: false,
    };
    refs.current = { mat, geom, mesh, scene, cam, pointer };
  }

  const onReady = props.onPointerReady;
  useEffect(() => {
    const r = refs.current;
    if (r) onReady(r.pointer);
  }, [onReady]);

  useEffect(() => {
    return () => {
      const r = refs.current;
      if (!r) return;
      r.mat.dispose();
      r.geom.dispose();
    };
  }, []);

  useFrame((state, delta) => {
    const r = refs.current;
    if (!r) return;
    const u = r.mat.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uRes.value.set(size.width, size.height);
    u.uLineCount.value = props.lineCount;
    u.uWaveAmp.value = props.waveAmplitude;
    u.uWaveFreq.value = props.waveFrequency;
    u.uLineThickness.value = props.lineThickness;
    u.uLineGlow.value = props.lineGlow;
    u.uLineIntensity.value = props.lineIntensity;
    u.uPulseSpeed.value = props.pulseSpeed;
    u.uPulseWidth.value = props.pulseWidth;
    u.uPulseIntensity.value = props.pulseIntensity;
    u.uChroma.value = props.chromaticAberration;
    u.uAlpha.value = props.opacity;

    const line = hexToRgb(props.lineColor);
    u.uLineColor.value.set(line[0], line[1], line[2]);
    const pulse = hexToRgb(props.pulseColor);
    u.uPulseColor.value.set(pulse[0], pulse[1], pulse[2]);
    const bg = hexToRgb(props.backgroundColor);
    u.uBg.value.set(bg[0], bg[1], bg[2]);

    const p = r.pointer;
    const aspect = size.width / Math.max(size.height, 1);

    if (props.cursorInteraction && p.active) {
      p.targetPhase = (p.nx * 2 - 1) * aspect;
      const lerp = Math.min(Math.max(props.cursorLerp, 0), 1);
      p.smoothedPhase += (p.targetPhase - p.smoothedPhase) * lerp;
      u.uPulsePhase.value = p.smoothedPhase;

      const yNorm = 1 - p.ny;
      u.uPulseWidthScale.value = 0.5 + yNorm * 1.5;
    } else {
      if (p.wasActive) {
        p.timePhase = p.smoothedPhase;
      }
      p.timePhase += delta;
      p.smoothedPhase += (p.timePhase - p.smoothedPhase) * 0.15;
      u.uPulsePhase.value = p.smoothedPhase;
      u.uPulseWidthScale.value += (1 - u.uPulseWidthScale.value) * 0.1;
    }
    p.wasActive = p.active;

    p.click = Math.max(0, p.click - delta * props.clickBurstDecay);
    u.uPulseBoost.value = 1 + p.click * (props.clickBurstStrength - 1);

    gl.setRenderTarget(null);
    gl.render(r.scene, r.cam);
  }, 1);

  return null;
};

const EmberFilaments: React.FC<EmberFilamentsProps> = ({
  width = "100%",
  height = "100%",
  className = "",
  children,
  lineCount = 2,
  waveAmplitude = 0.5,
  waveFrequency = 1.8,
  lineThickness = 0.05,
  lineGlow = 0.01,
  lineColor = "#4D33CC",
  lineIntensity = 3,
  pulseColor = "#CC4D4D",
  pulseSpeed = 0.25,
  pulseWidth = 35,
  pulseIntensity = 5.5,
  chromaticAberration = 0.05,
  backgroundColor = "#000000",
  opacity = 1,
  dpr = 1.5,
  cursorInteraction = true,
  cursorLerp = 0.12,
  clickBurstStrength = 2.5,
  clickBurstDecay = 2.5,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<PointerState | null>(null);
  const handlePointerReady = (state: PointerState) => {
    pointerRef.current = state;
  };

  const updatePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = wrapperRef.current;
    const p = pointerRef.current;
    if (!el || !p) return;
    const rect = el.getBoundingClientRect();
    p.nx = (e.clientX - rect.left) / Math.max(rect.width, 1);
    p.ny = (e.clientY - rect.top) / Math.max(rect.height, 1);
    p.active = true;
  };

  const handlePointerLeave = () => {
    const p = pointerRef.current;
    if (!p) return;
    p.active = false;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePointer(e);
    const p = pointerRef.current;
    if (!p) return;
    p.click = 1;
  };

  const rootClass = ["ember-filaments-root", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      ref={wrapperRef}
      className={rootClass}
      style={{ width, height }}
      onPointerMove={cursorInteraction ? updatePointer : undefined}
      onPointerEnter={cursorInteraction ? updatePointer : undefined}
      onPointerLeave={cursorInteraction ? handlePointerLeave : undefined}
      onPointerDown={cursorInteraction ? handlePointerDown : undefined}
    >
      <Canvas
        className="ember-filaments-canvas"
        dpr={[1, dpr]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        orthographic
        camera={{
          position: [0, 0, 1],
          zoom: 1,
          left: -1,
          right: 1,
          top: 1,
          bottom: -1,
        }}
      >
        <LinesPipeline
          lineCount={lineCount}
          waveAmplitude={waveAmplitude}
          waveFrequency={waveFrequency}
          lineThickness={lineThickness}
          lineGlow={lineGlow}
          lineColor={lineColor}
          lineIntensity={lineIntensity}
          pulseColor={pulseColor}
          pulseSpeed={pulseSpeed}
          pulseWidth={pulseWidth}
          pulseIntensity={pulseIntensity}
          chromaticAberration={chromaticAberration}
          backgroundColor={backgroundColor}
          opacity={opacity}
          cursorInteraction={cursorInteraction}
          cursorLerp={cursorLerp}
          clickBurstStrength={clickBurstStrength}
          clickBurstDecay={clickBurstDecay}
          onPointerReady={handlePointerReady}
        />
      </Canvas>
      {children && <div className="ember-filaments-content">{children}</div>}
    </div>
  );
};

EmberFilaments.displayName = "EmberFilaments";

export default EmberFilaments;

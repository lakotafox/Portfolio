"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import "./glyph-mosaic.css";

export interface GlyphMosaicProps {
  /** Container width */
  width?: string | number;
  /** Container height */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Content rendered above the effect */
  children?: React.ReactNode;
  /** Animation speed multiplier */
  speed?: number;
  /** ASCII glyph size in CSS pixels (each cell is glyphSize × glyphSize) */
  glyphSize?: number;
  /** Tile grid density across the surface: higher = smaller glass panels */
  tileDensity?: number;
  /** Diagonal shear factor applied to the tile grid (0 = axis-aligned) */
  tileShear?: number;
  /** Width of the bevelled edge between tiles (0–0.5) */
  bevelWidth?: number;
  /** Bevel softness (smoothstep falloff) */
  bevelSoftness?: number;
  /** Refractive offset strength applied across the bevels (px) */
  refractionStrength?: number;
  /** Chromatic dispersion spread between R and B samples */
  chromaticSpread?: number;
  /** Specular highlight exponent (Blinn–Phong) */
  specularExponent?: number;
  /** Specular highlight intensity */
  specularStrength?: number;
  /** Base lit color of the glyphs in hex */
  glyphColor?: string;
  /** Color tucked into the recesses between tiles in hex */
  recessColor?: string;
  /** Background color visible where the glyph mask is empty in hex */
  backgroundColor?: string;
  /** First sinusoid horizontal frequency */
  patternFreqX?: number;
  /** Second sinusoid vertical frequency */
  patternFreqY?: number;
  /** Cross-product frequency for the third sinusoid */
  patternFreqXY?: number;
  /** Master alpha (0–1) */
  opacity?: number;
  /** Maximum device pixel ratio (caps GPU work) */
  dpr?: number;
  /** Enable cursor-based pattern destruction */
  cursorInteraction?: boolean;
  /** Cursor influence radius in CSS pixels */
  cursorRadius?: number;
  /** Cursor effect strength multiplier (0–1; higher = clearer empty zone) */
  cursorIntensity?: number;
}

const tilesVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const tilesFragment = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uRes;

uniform float uSpeed;
uniform float uGlyph;
uniform float uTileDensity;
uniform float uTileShear;
uniform float uBevelWidth;
uniform float uBevelSoftness;
uniform float uRefraction;
uniform float uChroma;
uniform float uSpecExp;
uniform float uSpecStrength;
uniform vec3  uGlyphColor;
uniform vec3  uRecessColor;
uniform vec3  uBg;
uniform float uFreqX;
uniform float uFreqY;
uniform float uFreqXY;
uniform float uAlpha;
uniform vec2  uPointer;
uniform float uPointerActive;
uniform float uPointerRadius;
uniform float uPointerStrength;

int glyphForLevel(int level) {
  if (level <= 0) return 0;
  if (level == 1) return 2;
  if (level == 2) return 34;
  if (level == 3) return 328;
  if (level == 4) return 2976;
  if (level == 5) return 28662;
  if (level == 6) return 63903;
  return 65535;
}

float readGlyphPixel(vec2 cellUv, int mask) {
  vec2 p = floor(cellUv * 4.0);
  if (p.x < 0.0 || p.x > 3.0 || p.y < 0.0 || p.y > 3.0) return 0.0;
  int bit = int(p.x) + int(p.y) * 4;
  return float((mask >> bit) & 1);
}

float samplePatternLuma(vec2 fragPx) {
  vec2 cell = floor(fragPx / uGlyph);
  vec2 cellPx = cell * uGlyph + (uGlyph * 0.5);

  vec2 ndc = (cellPx / uRes) * 2.0 - 1.0;
  ndc.x *= uRes.x / uRes.y;

  float t = uTime * uSpeed * 0.8;
  float a = sin(ndc.x * uFreqX + t);
  float b = sin(ndc.y * uFreqY - t);
  float c = sin(ndc.x * ndc.y * uFreqXY + t * 1.5);
  float field = (a + b + c) / 3.0;
  field = field * 0.5 + 0.5;

  if (uPointerActive > 0.5) {
    float d = distance(cellPx, uPointer);
    float radial = smoothstep(0.0, max(uPointerRadius, 1.0), d);
    field *= mix(1.0, radial, clamp(uPointerStrength, 0.0, 1.0));
  }

  vec2 cellUv = fract(fragPx / uGlyph);
  int level = int(clamp(field, 0.0, 1.0) * 7.0);
  int mask = glyphForLevel(level);
  return readGlyphPixel(cellUv, mask) * field;
}

float tileHeight(vec2 surfaceUv) {
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 st = vec2(surfaceUv.x * aspect, surfaceUv.y);

  mat2 shear = mat2(1.0, uTileShear, -uTileShear, 1.0);
  st = shear * st;
  st *= max(uTileDensity, 0.001);

  vec2 p = fract(st) - 0.5;
  float chebyshev = max(abs(p.x), abs(p.y));
  float bevelInner = clamp(0.5 - uBevelWidth, 0.05, 0.5);
  float bevelOuter = clamp(bevelInner - uBevelSoftness, 0.0, bevelInner - 0.001);
  return smoothstep(bevelInner, bevelOuter, chebyshev);
}

vec3 tileNormal(vec2 surfaceUv) {
  vec2 e = vec2(0.002, 0.0);
  float h  = tileHeight(surfaceUv);
  float hx = tileHeight(surfaceUv + e.xy);
  float hy = tileHeight(surfaceUv + e.yx);
  return normalize(vec3(h - hx, h - hy, 0.02));
}

void main() {
  vec2 fragPx = vUv * uRes;

  float h = tileHeight(vUv);
  vec3  n = tileNormal(vUv);

  vec2 refractOffset = n.xy * uRefraction;
  float spread = max(uChroma, 0.0);

  float lumR = samplePatternLuma(fragPx - refractOffset * 1.0);
  float lumG = samplePatternLuma(fragPx - refractOffset * (1.0 + spread * 0.5));
  float lumB = samplePatternLuma(fragPx - refractOffset * (1.0 + spread * 1.5));

  vec3 col;
  col.r = mix(uRecessColor.r, uGlyphColor.r, lumR);
  col.g = mix(uRecessColor.g, uGlyphColor.g, lumG);
  col.b = mix(uRecessColor.b, uGlyphColor.b, lumB);

  vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
  vec3 halfVec  = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, halfVec), 0.0), max(uSpecExp, 1.0));
  col += spec * uSpecStrength * smoothstep(0.1, 0.9, h);

  col *= mix(0.1, 1.0, smoothstep(0.0, 0.1, h));

  float fieldMix = clamp(max(max(lumR, lumG), lumB), 0.0, 1.0);
  vec3 final = mix(uBg, col, fieldMix);

  gl_FragColor = vec4(final, uAlpha);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  return [
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
    parseInt(m[3], 16) / 255,
  ];
}

type SceneProps = Required<
  Omit<GlyphMosaicProps, "width" | "height" | "className" | "children" | "dpr">
> & {
  pointer: [number, number];
};

const TilesScene: React.FC<SceneProps> = (props) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const smoothPointer = useRef(new THREE.Vector2(-1, -1));

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    const u = mat.uniforms;

    u.uTime.value = state.clock.elapsedTime;
    u.uRes.value.set(size.width, size.height);

    u.uSpeed.value = props.speed;
    u.uGlyph.value = props.glyphSize;
    u.uTileDensity.value = props.tileDensity;
    u.uTileShear.value = props.tileShear;
    u.uBevelWidth.value = props.bevelWidth;
    u.uBevelSoftness.value = props.bevelSoftness;
    u.uRefraction.value = props.refractionStrength;
    u.uChroma.value = props.chromaticSpread;
    u.uSpecExp.value = props.specularExponent;
    u.uSpecStrength.value = props.specularStrength;
    u.uFreqX.value = props.patternFreqX;
    u.uFreqY.value = props.patternFreqY;
    u.uFreqXY.value = props.patternFreqXY;
    u.uAlpha.value = props.opacity;

    const glyph = hexToRgb(props.glyphColor);
    u.uGlyphColor.value.set(glyph[0], glyph[1], glyph[2]);
    const recess = hexToRgb(props.recessColor);
    u.uRecessColor.value.set(recess[0], recess[1], recess[2]);
    const bg = hexToRgb(props.backgroundColor);
    u.uBg.value.set(bg[0], bg[1], bg[2]);

    if (props.cursorInteraction) {
      const targetX = props.pointer[0] * size.width;
      const targetY = (1 - props.pointer[1]) * size.height;
      const ease = 1 - Math.exp(-delta / 0.08);
      smoothPointer.current.x += (targetX - smoothPointer.current.x) * ease;
      smoothPointer.current.y += (targetY - smoothPointer.current.y) * ease;
      u.uPointer.value.copy(smoothPointer.current);
      u.uPointerActive.value = 1;
      u.uPointerRadius.value = props.cursorRadius;
      u.uPointerStrength.value = props.cursorIntensity;
    } else {
      u.uPointerActive.value = 0;
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSpeed: { value: 1 },
      uGlyph: { value: 8 },
      uTileDensity: { value: 4 },
      uTileShear: { value: 0.15 },
      uBevelWidth: { value: 0.1 },
      uBevelSoftness: { value: 0.1 },
      uRefraction: { value: 40 },
      uChroma: { value: 0.15 },
      uSpecExp: { value: 64 },
      uSpecStrength: { value: 1 },
      uGlyphColor: { value: new THREE.Vector3(0.225, 1.275, 0.6) },
      uRecessColor: { value: new THREE.Vector3(0.02, 0.05, 0.02) },
      uBg: { value: new THREE.Vector3(0, 0, 0) },
      uFreqX: { value: 6 },
      uFreqY: { value: 4 },
      uFreqXY: { value: 5 },
      uAlpha: { value: 1 },
      uPointer: { value: new THREE.Vector2(-1, -1) },
      uPointerActive: { value: 0 },
      uPointerRadius: { value: 100 },
      uPointerStrength: { value: 1 },
    }),
    [],
  );

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={tilesVertex}
        fragmentShader={tilesFragment}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
};

const GlyphMosaic: React.FC<GlyphMosaicProps> = ({
  width = "100%",
  height = "100%",
  className = "",
  children,
  speed = 1,
  glyphSize = 8,
  tileDensity = 3.3,
  tileShear = -0.22,
  bevelWidth = 0.02,
  bevelSoftness = 0.1,
  refractionStrength = 100,
  chromaticSpread = 0.2,
  specularExponent = 150,
  specularStrength = 1,
  glyphColor = "#FFFFFF",
  recessColor = "#050D08",
  backgroundColor = "#000000",
  patternFreqX = 6,
  patternFreqY = 4,
  patternFreqXY = 10,
  opacity = 1,
  dpr = 1.5,
  cursorInteraction = false,
  cursorRadius = 129,
  cursorIntensity = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState<[number, number]>([-1, -1]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!cursorInteraction) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      setPointer([nx, ny]);
    },
    [cursorInteraction],
  );

  const handlePointerLeave = useCallback(() => {
    setPointer([-1, -1]);
  }, []);

  const rootClass = `glyph-mosaic-root${className ? ` ${className}` : ""}`;

  return (
    <div
      ref={containerRef}
      className={rootClass}
      style={{ width, height }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        className="glyph-mosaic-canvas"
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
        <TilesScene
          speed={speed}
          glyphSize={glyphSize}
          tileDensity={tileDensity}
          tileShear={tileShear}
          bevelWidth={bevelWidth}
          bevelSoftness={bevelSoftness}
          refractionStrength={refractionStrength}
          chromaticSpread={chromaticSpread}
          specularExponent={specularExponent}
          specularStrength={specularStrength}
          glyphColor={glyphColor}
          recessColor={recessColor}
          backgroundColor={backgroundColor}
          patternFreqX={patternFreqX}
          patternFreqY={patternFreqY}
          patternFreqXY={patternFreqXY}
          opacity={opacity}
          cursorInteraction={cursorInteraction}
          cursorRadius={cursorRadius}
          cursorIntensity={cursorIntensity}
          pointer={pointer}
        />
      </Canvas>
      {children && <div className="glyph-mosaic-content">{children}</div>}
    </div>
  );
};

GlyphMosaic.displayName = "GlyphMosaic";

export default GlyphMosaic;

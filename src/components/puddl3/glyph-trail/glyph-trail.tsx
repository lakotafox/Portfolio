"use client";

import React, { useRef, useMemo, useEffect } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  extend,
  createPortal,
} from "@react-three/fiber";
import { useFBO, shaderMaterial } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from "@react-three/postprocessing";
import * as THREE from "three";

interface AsciiSimulationMaterialUniforms {
  uTime: number;
  uMouse: THREE.Vector2;
  uPreviousState: THREE.Texture | null;
  uResolution: THREE.Vector2;
  uDecay: number;
  uSpeed: number;
  uRadius: number;
}

interface AsciiDisplayMaterialUniforms {
  uSimulationState: THREE.Texture | null;
  uFontTexture: THREE.Texture | null;
  uResolution: THREE.Vector2;
  uColor: THREE.Color;
  uBackgroundColor: THREE.Color;
  uCharCount: number;
  uGridSize: number;
  uEnableFade: boolean;
  uOpacity: number;
}

type AsciiSimulationMaterialType = THREE.ShaderMaterial &
  AsciiSimulationMaterialUniforms;
type AsciiDisplayMaterialType = THREE.ShaderMaterial &
  AsciiDisplayMaterialUniforms;

import "./glyph-trail.css";

const AsciiSimulationMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uPreviousState: null,
    uResolution: new THREE.Vector2(0, 0),
    uDecay: 0.02,
    uSpeed: 0.0,
    uRadius: 0.05,
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform sampler2D uPreviousState;
    uniform vec2 uResolution;
    uniform float uDecay;
    uniform float uSpeed;
    uniform float uRadius;

    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;

      float prev = texture2D(uPreviousState, uv).r;

      float aspect = uResolution.x / uResolution.y;
      vec2 aspectCorrection = vec2(aspect, 1.0);
      vec2 mouseUV = uMouse;

      float dist = length((uv - mouseUV) * aspectCorrection);

      float radius = uRadius;

      float brush = smoothstep(radius, 0.0, dist);

      float speedFactor = smoothstep(0.0, 0.1, uSpeed);
      brush *= speedFactor;

      float value = max(prev, brush);

      value -= uDecay;

      gl_FragColor = vec4(vec3(max(0.0, value)), 1.0);
    }
  `,
);

const AsciiDisplayMaterial = shaderMaterial(
  {
    uSimulationState: null,
    uFontTexture: null,
    uResolution: new THREE.Vector2(0, 0),
    uColor: new THREE.Color(0, 1, 0),
    uBackgroundColor: new THREE.Color(0, 0, 0),
    uCharCount: 10.0,
    uGridSize: 10.0,
    uEnableFade: true,
    uOpacity: 1.0,
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform sampler2D uSimulationState;
    uniform sampler2D uFontTexture;
    uniform vec2 uResolution;
    uniform vec3 uColor;
    uniform vec3 uBackgroundColor;
    uniform float uCharCount;
    uniform float uGridSize;
    uniform bool uEnableFade;
    uniform float uOpacity;

    varying vec2 vUv;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;

      vec2 gridDims = uResolution / uGridSize;
      vec2 cellUV = floor(uv * gridDims) / gridDims;

      float signal = texture2D(uSimulationState, cellUV + (0.5 / gridDims)).r;

      if (signal < 0.01) discard;

      float rnd = random(cellUV);

      float charIndex = floor(rnd * uCharCount);

      vec2 localUV = fract(uv * gridDims);

      vec2 atlasUV = vec2((localUV.x + charIndex) / uCharCount, localUV.y);

      float charMask = texture2D(uFontTexture, atlasUV).a;

      if (random(cellUV + 10.0) > 0.7) {
        charMask = 0.0;
      }

      float opacity = uEnableFade ? signal : 1.0;

      vec3 finalColor = mix(uBackgroundColor, uColor, charMask);

      gl_FragColor = vec4(finalColor, opacity * uOpacity);
    }
  `,
);

extend({ AsciiSimulationMaterial, AsciiDisplayMaterial });

const createFontTexture = (
  chars: string,
  fontSize: number = 64,
): THREE.Texture => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  const charCount = chars.length;
  const width = charCount * fontSize;
  const height = fontSize;

  canvas.width = width;
  canvas.height = height;

  ctx.font = `bold ${fontSize}px monospace`;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < charCount; i++) {
    const char = chars[i];
    const x = i * fontSize + fontSize / 2;
    const y = fontSize / 2;
    ctx.fillText(char, x, y);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
};

const SceneInternal = ({
  simulationScene,
  characters,
  size,
  color,
  backgroundColor,
  enableFade,
  spread,
  persistence,
  opacity,
  enableBloom,
  bloomStrength,
  bloomRadius,
  enableChromaticAberration,
  chromaticAberrationOffset,
}: {
  simulationScene: THREE.Scene;
  characters: string;
  size: number;
  color: string;
  backgroundColor: string;
  enableFade: boolean;
  spread: number;
  persistence: number;
  opacity: number;
  enableBloom: boolean;
  bloomStrength: number;
  bloomRadius: number;
  enableChromaticAberration: boolean;
  chromaticAberrationOffset: number;
}) => {
  const { size: canvasSize, viewport, gl } = useThree();
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const prevMouseRef = useRef(new THREE.Vector2(0, 0));
  const speedRef = useRef(0);

  const fontTexture = useMemo(
    () => createFontTexture(characters),
    [characters],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvasEl = gl.domElement;
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1.0 - (e.clientY - rect.top) / rect.height;
        mouseRef.current.set(x, y);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [gl.domElement]);

  const simTargetA = useFBO({
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });
  const simTargetB = useFBO({
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });

  const simMaterialRef = useRef<AsciiSimulationMaterialType>(null);
  const displayMaterialRef = useRef<AsciiDisplayMaterialType>(null);
  const frameRef = useRef(0);

  useFrame((state) => {
    const { gl, clock } = state;

    const writeBuffer = frameRef.current % 2 === 0 ? simTargetA : simTargetB;
    const readBuffer = frameRef.current % 2 === 0 ? simTargetB : simTargetA;

    if (simMaterialRef.current) {
      simMaterialRef.current.uTime = clock.elapsedTime;
      simMaterialRef.current.uMouse = mouseRef.current;
      simMaterialRef.current.uPreviousState = readBuffer.texture;
      simMaterialRef.current.uResolution = new THREE.Vector2(
        canvasSize.width,
        canvasSize.height,
      );
      simMaterialRef.current.uRadius = spread * 0.01;
      simMaterialRef.current.uDecay = 0.02 * (1.0 / Math.max(0.1, persistence));

      const curMouse = mouseRef.current;
      const prevMouse = prevMouseRef.current;
      const dist = curMouse.distanceTo(prevMouse);

      speedRef.current = THREE.MathUtils.lerp(speedRef.current, dist, 0.1);
      simMaterialRef.current.uSpeed = speedRef.current;

      prevMouseRef.current.copy(curMouse);
    }

    gl.setRenderTarget(writeBuffer);
    gl.render(simulationScene, state.camera);
    gl.setRenderTarget(null);

    if (displayMaterialRef.current) {
      displayMaterialRef.current.uSimulationState = writeBuffer.texture;
      displayMaterialRef.current.uFontTexture = fontTexture;
      displayMaterialRef.current.uResolution = new THREE.Vector2(
        canvasSize.width,
        canvasSize.height,
      );
      displayMaterialRef.current.uColor = new THREE.Color(color);
      displayMaterialRef.current.uBackgroundColor = new THREE.Color(
        backgroundColor,
      );
      displayMaterialRef.current.uCharCount = characters.length;
      displayMaterialRef.current.uGridSize = size;
      displayMaterialRef.current.uEnableFade = enableFade;
      displayMaterialRef.current.uOpacity = opacity;
    }

    frameRef.current++;
  });

  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[viewport.width, viewport.height]} />
          {/* @ts-ignore */}
          <asciiSimulationMaterial ref={simMaterialRef} />
        </mesh>,
        simulationScene,
      )}

      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        {/* @ts-ignore */}
        <asciiDisplayMaterial ref={displayMaterialRef} transparent />
      </mesh>

      {(enableBloom || enableChromaticAberration) && (
        <EffectComposer>
          {enableBloom ? (
            <Bloom
              luminanceThreshold={0}
              mipmapBlur
              intensity={bloomStrength}
              radius={bloomRadius}
            />
          ) : (
            <></>
          )}
          {enableChromaticAberration ? (
            <ChromaticAberration
              offset={
                new THREE.Vector2(
                  chromaticAberrationOffset,
                  chromaticAberrationOffset,
                )
              }
              radialModulation={false}
              modulationOffset={0}
            />
          ) : (
            <></>
          )}
        </EffectComposer>
      )}
    </>
  );
};

export interface GlyphTrailProps {
  characters?: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  enableFade?: boolean;
  spread?: number;
  persistence?: number;
  opacity?: number;
  enableBloom?: boolean;
  bloomStrength?: number;
  bloomRadius?: number;
  enableChromaticAberration?: boolean;
  chromaticAberrationOffset?: number;
  className?: string;
}

const GlyphTrail: React.FC<GlyphTrailProps> = ({
  characters = "✶✤↣⌧✷＄☺☉ϟ▵🝏*.;.",
  size = 40,
  color = "#00ff00",
  backgroundColor = "#000000",
  enableFade = false,
  spread = 20,
  persistence = 2,
  opacity = 1,
  enableBloom = false,
  bloomStrength = 2,
  bloomRadius = 0.4,
  enableChromaticAberration = false,
  chromaticAberrationOffset = 0.005,
  className,
}) => {
  const simulationScene = useMemo(() => new THREE.Scene(), []);

  return (
    <div className={`glyph-trail-container ${className || ""}`}>
      <Canvas
        orthographic
        camera={{ zoom: 1, position: [0, 0, 1], near: 0.1, far: 1000 }}
        gl={{ alpha: true, antialias: false }}
        style={{ width: "100%", height: "100%" }}
      >
        <SceneInternal
          simulationScene={simulationScene}
          characters={characters}
          size={size}
          color={color}
          backgroundColor={backgroundColor}
          enableFade={enableFade}
          spread={spread}
          persistence={persistence}
          opacity={opacity}
          enableBloom={enableBloom}
          bloomStrength={bloomStrength}
          bloomRadius={bloomRadius}
          enableChromaticAberration={enableChromaticAberration}
          chromaticAberrationOffset={chromaticAberrationOffset}
        />
      </Canvas>
    </div>
  );
};

export default GlyphTrail;

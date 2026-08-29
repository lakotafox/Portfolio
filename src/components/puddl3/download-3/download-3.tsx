"use client";

import { useRef, useMemo } from "react";
import { motion } from "motion/react";
import { Download } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(23.43, 54.12))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float satinLines(vec2 uv, float time) {
    float n = 0.0;
    vec2 p = uv;

    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float baseAngle = pow(fi, 2.0) * 1.15;
      float noiseFactor = noise(p * 1.5 + time * 0.3);
      float speed = mix(0.3, 0.6, hash(vec2(fi, 1.0)));
      float amplitude = mix(0.4, 0.8, hash(vec2(fi, 2.0)));
      float angle = baseAngle + mix(-1.0, 1.0, noiseFactor) * amplitude + sin(time * speed + fi * 2.0) * amplitude;

      float cs = cos(angle);
      float sn = sin(angle);
      mat2 rot = mat2(cs, -sn, sn, cs);
      p = rot * p * 0.65;
      n += noise(p) * 2.0;
    }
    return n;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    float warp = satinLines(uv * 2.0, uTime);

    vec3 N = normalize(vec3(
      warp - satinLines(uv * 2.0 + vec2(0.15, 0.0), uTime),
      warp - satinLines(uv * 2.0 + vec2(0.0, 0.15), uTime),
      0.3
    ));

    vec3 L = normalize(vec3(0.4, 0.7, 1.0));
    vec3 V = normalize(vec3(0.6, 0.4, 1.0));
    vec3 H = normalize(L + V);

    float hn = max(dot(H, N), 0.0);
    float sheen = pow(hn, 12.0) * 0.8;
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5) * 0.4;

    float effect = sheen + fres;
    gl_FragColor = vec4(vec3(1.0), effect * 0.35);
  }
`;

function SatinShader() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );

  useFrame(({ clock, size }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = clock.getElapsedTime() * 0.5;
      material.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export function Download3() {
  return (
    <section
      className="w-full py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950"
      aria-label="Download assets"
    >
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-12 mb-8 sm:mb-12"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white">
            Download
          </h1>

          <div className="flex flex-col gap-5 lg:max-w-md">
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Download the app now and start using it right away. Getting
              started is easy and quick - just follow the instructions.
            </p>

            <motion.a
              href="#"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-purple-400 text-purple-500 dark:text-purple-400 dark:border-purple-500 rounded-full text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer self-start"
            >
              <Download className="w-4 h-4" />
              Download
            </motion.a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-h-[300px] aspect-video sm:aspect-2/1 rounded-3xl bg-purple-400 overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full">
            <Canvas
              orthographic
              camera={{
                zoom: 1,
                position: [0, 0, 1],
                left: -1,
                right: 1,
                top: 1,
                bottom: -1,
              }}
              gl={{ antialias: true, alpha: true }}
              style={{
                width: "100%",
                height: "100%",
                background: "transparent",
              }}
            >
              <SatinShader />
            </Canvas>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src="/mock-logos/spherule.svg"
              alt="Spherule wordmark"
              className="w-48 sm:w-64 md:w-80 lg:w-96 h-auto brightness-0 invert"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Download3;

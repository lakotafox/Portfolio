"use client";

import { ArrowUpRight, Home } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const staticVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const staticFragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uTheme;
  uniform float uStatic;

  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float burst(float t, float seed) {
    float cell = floor(t * 0.42 + seed);
    float local = fract(t * 0.42 + seed);
    float gate = step(0.78, hash(cell * 7.13 + seed));
    return gate * smoothstep(0.0, 0.06, local) * (1.0 - smoothstep(0.12, 0.32, local));
  }

  float band(vec2 uv, float t, float seed) {
    float y = hash(floor(t * 0.84 + seed) * 3.7 + seed) * 0.8 + 0.1;
    float h = 0.014 + hash2(vec2(seed, y)) * 0.05;
    return 1.0 - smoothstep(h, h + 0.02, abs(uv.y - y));
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 p = (uv - 0.5) * aspect;
    float t = uTime;
    float live = 1.0 - uStatic;

    float burstA = burst(t, 1.0) * live;
    float burstB = burst(t + 3.4, 5.0) * live;
    float bandA = band(uv, t, 2.0) * burstA;
    float bandB = band(uv, t + 7.0, 6.0) * burstB;

    vec2 warped = uv;
    warped.x += (bandA - bandB) * 0.045;
    warped.x += sin(uv.y * 90.0 + t * 2.2) * 0.001 * live;

    float scan = sin(warped.y * uResolution.y * 1.15) * 0.5 + 0.5;
    float grain = hash2(gl_FragCoord.xy * 0.7 + floor(t * 22.0));
    float vignette = smoothstep(1.3, 0.32, length(p * vec2(0.85, 1.12)));
    float calm = smoothstep(0.14, 0.66, length(p));
    float streak = (bandA + bandB) * calm;

    vec3 darkColor = vec3(0.014, 0.015, 0.019);
    darkColor += vec3(0.32, 0.62, 0.70) * (bandA * 0.15 * calm + exp(-abs(p.y) * 4.6) * 0.045);
    darkColor += vec3(0.58, 0.17, 0.42) * bandB * 0.11 * calm;
    darkColor *= 0.8 + scan * 0.09;
    darkColor *= 0.56 + vignette * 0.58;
    darkColor += (grain - 0.5) * 0.028;

    vec3 lightColor = vec3(1.0, 1.0, 1.0);
    lightColor -= vec3(0.03, 0.028, 0.024) * streak * 0.55;
    lightColor -= vec3(0.008) * (1.0 - scan) * 0.5;
    lightColor -= vec3(1.0 - vignette) * 0.022;
    lightColor += (grain - 0.5) * 0.012;

    vec3 color = mix(lightColor, darkColor, uTheme);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const glitchBands = [
  {
    clip: "[clip-path:inset(10%_0_66%_0)]",
    color: "text-cyan-600/60 dark:text-cyan-400/70",
    x: -16,
  },
  {
    clip: "[clip-path:inset(56%_0_20%_0)]",
    color: "text-cyan-600/60 dark:text-cyan-400/70",
    x: -9,
  },
  {
    clip: "[clip-path:inset(30%_0_46%_0)]",
    color: "text-fuchsia-600/60 dark:text-fuchsia-400/70",
    x: 14,
  },
  {
    clip: "[clip-path:inset(76%_0_4%_0)]",
    color: "text-fuchsia-600/60 dark:text-fuchsia-400/70",
    x: 8,
  },
];

const glitchTimes = [0, 0.62, 0.68, 0.75, 0.82, 1];

const numeralClass =
  "text-[6.5rem] sm:text-[10rem] md:text-[13rem] lg:text-[15rem] font-black tracking-[-0.06em] leading-none";

function StaticFieldCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: staticVertexShader,
      fragmentShader: staticFragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 8 },
        uTheme: { value: 1 },
        uStatic: { value: reduceMotion ? 1 : 0 },
      },
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
    } catch {
      geometry.dispose();
      material.dispose();
      return;
    }

    renderer.domElement.className = "absolute inset-0 h-full w-full";
    container.appendChild(renderer.domElement);

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const readTheme = () => {
      const classes = document.documentElement.classList;
      if (classes.contains("dark")) return 1;
      if (classes.contains("light")) return 0;
      return query.matches ? 1 : 0;
    };

    let themeTarget = readTheme();
    material.uniforms.uTheme.value = themeTarget;

    const clock = new THREE.Clock();
    let frame = 0;

    const renderFrame = () => {
      material.uniforms.uTime.value = reduceMotion ? 8 : clock.getElapsedTime();
      const current = material.uniforms.uTheme.value as number;
      material.uniforms.uTheme.value = reduceMotion
        ? themeTarget
        : current + (themeTarget - current) * 0.07;
      renderer.render(scene, camera);
    };

    const loop = () => {
      renderFrame();
      frame = requestAnimationFrame(loop);
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      material.uniforms.uResolution.value.set(width, height);
      renderFrame();
    };

    const handleThemeChange = () => {
      themeTarget = readTheme();
      if (reduceMotion) renderFrame();
    };

    const mutationObserver = new MutationObserver(handleThemeChange);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    query.addEventListener("change", handleThemeChange);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    if (!reduceMotion) {
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      query.removeEventListener("change", handleThemeChange);
      resizeObserver.disconnect();
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [reduceMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}

export default function NotFound6() {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <StaticFieldCanvas />
      <div className="relative z-10 max-w-[1400px] mx-auto w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <motion.div
            variants={item}
            aria-hidden="true"
            className="relative select-none"
          >
            <span
              className={`absolute inset-0 flex items-center justify-center -translate-x-1.5 -translate-y-1.5 sm:-translate-x-2 sm:-translate-y-2 text-transparent [-webkit-text-stroke:1.5px_rgba(23,23,23,0.22)] dark:[-webkit-text-stroke:1.5px_rgba(255,255,255,0.28)] ${numeralClass}`}
            >
              404
            </span>
            {!reduceMotion &&
              glitchBands.map((band) => (
                <motion.span
                  key={band.clip}
                  animate={{
                    x: [0, 0, band.x, band.x * -0.45, 0, 0],
                    opacity: [0, 0, 1, 1, 0, 0],
                  }}
                  transition={{
                    duration: 4.4,
                    times: glitchTimes,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute inset-0 flex items-center justify-center ${band.clip} ${band.color} ${numeralClass}`}
                >
                  404
                </motion.span>
              ))}
            <motion.span
              animate={reduceMotion ? undefined : { x: [0, 0, 2.5, -2, 0, 0] }}
              transition={{
                duration: 4.4,
                times: glitchTimes,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`relative flex items-center justify-center text-neutral-900 dark:text-white ${numeralClass}`}
            >
              404
            </motion.span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-8 sm:mt-10 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white text-balance"
          >
            This channel went dark.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-4 max-w-md text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 text-pretty"
          >
            The page you dialed no longer broadcasts. Head back while we trace
            the signal.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
          >
            <motion.a
              href="/"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-black dark:bg-white px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-white dark:text-black cursor-pointer hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
            >
              <Home className="size-4" />
              Back home
            </motion.a>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-neutral-900 dark:hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
            >
              Contact support
              <ArrowUpRight className="size-4" />
            </a>
          </motion.div>

          <motion.p
            variants={item}
            aria-hidden="true"
            className="mt-14 text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-600"
          >
            No carrier · CH 404 · Retry /
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

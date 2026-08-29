"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Radar } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import * as THREE from "three";

const rippleVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const rippleFragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uTheme;

  float ring(vec2 p, float radius, float width) {
    float d = abs(length(p) - radius);
    return 1.0 - smoothstep(0.0, width, d);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 p = (vUv - 0.5) * aspect;
    float dist = length(p);

    float waves = 0.0;
    for (int i = 0; i < 6; i++) {
      float phase = fract(uTime * 0.05 + float(i) / 6.0);
      float radius = phase * 1.35;
      float fade = smoothstep(0.02, 0.2, radius) * (1.0 - smoothstep(0.5, 1.3, radius));
      float width = 0.014 + radius * 0.055;
      waves += ring(p, radius, width) * fade;
    }
    waves = min(waves, 1.0);

    float glow = exp(-dist * 3.2);
    float grain = hash(gl_FragCoord.xy) - 0.5;

    vec3 lightColor = vec3(1.0)
      - vec3(0.085, 0.083, 0.075) * waves
      - vec3(0.030, 0.028, 0.020) * glow;
    vec3 darkColor = vec3(0.039, 0.039, 0.043)
      + vec3(0.62, 0.66, 0.74) * waves * 0.17
      + vec3(0.25, 0.36, 0.52) * waves * 0.09
      + vec3(0.10, 0.12, 0.18) * glow * 0.4;

    vec3 color = mix(lightColor, darkColor, clamp(uTheme, 0.0, 1.0));
    color += grain * 0.012;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const queueAvatars = [
  "https://i.pravatar.cc/80?img=14",
  "https://i.pravatar.cc/80?img=28",
  "https://i.pravatar.cc/80?img=41",
  "https://i.pravatar.cc/80?img=53",
  "https://i.pravatar.cc/80?img=64",
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const isDarkTheme = () => {
  const classes = document.documentElement.classList;
  if (classes.contains("dark")) return true;
  if (classes.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

function RippleField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: rippleVertexShader,
      fragmentShader: rippleFragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uTheme: { value: isDarkTheme() ? 1 : 0 },
      },
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      geometry.dispose();
      material.dispose();
      return;
    }

    Object.assign(renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
    });
    host.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    let themeTarget = material.uniforms.uTheme.value as number;
    let frame = 0;

    const renderScene = () => renderer.render(scene, camera);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      material.uniforms.uResolution.value.set(width, height);
      renderScene();
    };

    const tick = () => {
      material.uniforms.uTime.value = clock.getElapsedTime();
      const current = material.uniforms.uTheme.value as number;
      material.uniforms.uTheme.value = current + (themeTarget - current) * 0.08;
      renderScene();
      frame = requestAnimationFrame(tick);
    };

    const syncTheme = () => {
      themeTarget = isDarkTheme() ? 1 : 0;
      if (reduceMotion) {
        material.uniforms.uTheme.value = themeTarget;
        renderScene();
      }
    };

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", syncTheme);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    if (reduceMotion) {
      material.uniforms.uTime.value = 5.2;
      renderScene();
    } else {
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      media.removeEventListener("change", syncTheme);
      resizeObserver.disconnect();
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
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

export default function Waitlist6() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 900));
    console.log("Waitlist signup:", email);
    setStatus("success");
  };

  return (
    <section className="relative flex w-full min-h-[var(--rb-section-min-h,100vh)] items-center overflow-hidden bg-white px-4 py-16 dark:bg-neutral-950 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <RippleField />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_50%,rgba(255,255,255,0.85),transparent_72%)] dark:bg-[radial-gradient(ellipse_65%_55%_at_50%_50%,rgba(10,10,10,0.85),transparent_72%)]" />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="relative z-10 mx-auto w-full max-w-[1400px]"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-neutral-600 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-neutral-300"
          >
            <Radar className="h-3.5 w-3.5" />
            Private beta · Wave three
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            When we go live, you&apos;ll feel it first.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg"
          >
            Beacon opens in small waves. Leave your email and you&apos;ll get a
            single ping the moment your invite unlocks: nothing else, ever.
          </motion.p>

          <motion.form
            variants={item}
            onSubmit={handleSubmit}
            className="mt-10 w-full max-w-md rounded-[1.875rem] border border-neutral-200/80 bg-white/70 p-1.5 shadow-sm backdrop-blur-md transition-[border-color,box-shadow] duration-200 focus-within:border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-900/10 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-white/25 dark:focus-within:ring-white/15 sm:rounded-full"
          >
            <AnimatePresence mode="wait" initial={false}>
              {status === "success" ? (
                <motion.div
                  key="success"
                  role="status"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex min-h-12 items-center justify-center gap-2.5 px-4 py-2 text-center text-sm font-medium text-neutral-900 dark:text-white sm:text-base"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  You&apos;re in the queue: watch for the ping.
                </motion.div>
              ) : (
                <motion.div
                  key="fields"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col gap-1.5 sm:flex-row sm:items-center"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    disabled={status === "loading"}
                    aria-label="Email address"
                    className="h-12 w-full rounded-full bg-transparent px-5 text-base text-neutral-900 outline-none placeholder:text-neutral-500 disabled:opacity-50 dark:text-white dark:placeholder:text-neutral-400 sm:flex-1"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex h-12 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-black px-6 text-base font-medium text-white transition-colors duration-200 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950 sm:w-auto"
                  >
                    {status === "loading" ? "Sending…" : "Request invite"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          <motion.div
            variants={item}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <div className="flex -space-x-2.5">
              {queueAvatars.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-white object-cover dark:border-neutral-950"
                />
              ))}
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold tabular-nums text-neutral-900 dark:text-white">
                11,204
              </span>{" "}
              already in the queue · next wave this month
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

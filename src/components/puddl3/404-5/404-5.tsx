"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import Matter from "matter-js";
import {
  Star,
  Heart,
  Cloud,
  Sparkles,
  Rocket,
  Music,
  Camera,
  Flame,
} from "lucide-react";

const cards = [
  { bg: "#1e2844", color: "#ffffff", Icon: Star, w: 150, h: 190 },
  { bg: "#6cc7e0", color: "#0a3a4a", Icon: Cloud, w: 165, h: 210 },
  { bg: "#f3cf3a", color: "#4a3a00", Icon: Sparkles, w: 155, h: 195 },
  { bg: "#6a2a56", color: "#f5d0e5", Icon: Heart, w: 160, h: 200 },
  { bg: "#d6642b", color: "#ffe4d0", Icon: Flame, w: 150, h: 195 },
  { bg: "#b7e04a", color: "#2a4200", Icon: Rocket, w: 170, h: 185 },
  { bg: "#e08534", color: "#ffe8d4", Icon: Music, w: 160, h: 195 },
  { bg: "#bcaee0", color: "#2a1a4a", Icon: Camera, w: 160, h: 200 },
];

export default function NotFound5() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const Engine = Matter.Engine;
    const Runner = Matter.Runner;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;
    const Events = Matter.Events;

    const engine = Engine.create();
    engine.gravity.y = 1;
    engine.positionIterations = 10;
    engine.velocityIterations = 8;

    const getSize = () => ({
      w: scene.clientWidth,
      h: scene.clientHeight,
    });

    let { w: width, h: height } = getSize();

    const wallThickness = 400;
    const ground = Bodies.rectangle(
      width / 2,
      height + wallThickness / 2,
      width * 3,
      wallThickness,
      { isStatic: true },
    );
    const ceiling = Bodies.rectangle(
      width / 2,
      -wallThickness / 2 - 800,
      width * 3,
      wallThickness,
      { isStatic: true },
    );
    const leftWall = Bodies.rectangle(
      -wallThickness / 2,
      height / 2,
      wallThickness,
      height * 6,
      { isStatic: true },
    );
    const rightWall = Bodies.rectangle(
      width + wallThickness / 2,
      height / 2,
      wallThickness,
      height * 6,
      { isStatic: true },
    );
    Composite.add(engine.world, [ground, ceiling, leftWall, rightWall]);

    const getScaleFor = (w: number) => (w < 640 ? 0.55 : w < 1024 ? 0.75 : 1);

    const bodies = cards.map((card, i) => {
      const scale = getScaleFor(width);
      const w = card.w * scale;
      const h = card.h * scale;
      const x = Math.random() * (width - w - 40) + w / 2 + 20;
      const y = -200 - i * 80 - Math.random() * 100;
      const body = Bodies.rectangle(x, y, w, h, {
        restitution: 0.15,
        friction: 0.4,
        frictionStatic: 0.8,
        frictionAir: 0.02,
        density: 0.002,
        angle: (Math.random() - 0.5) * 0.6,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08);
      return { body, w, h, base: card };
    });
    Composite.add(
      engine.world,
      bodies.map((b) => b.body),
    );

    const runner = Runner.create();
    Runner.run(runner, engine);

    const mouse = Mouse.create(scene);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.12,
        damping: 0.2,
        render: { visible: false },
      },
    });
    Composite.add(engine.world, mouseConstraint);

    type MouseInternals = {
      mousedown: EventListener;
      mousemove: EventListener;
      mouseup: EventListener;
      position: { x: number; y: number };
      absolute: { x: number; y: number };
      mousedownPosition: { x: number; y: number };
      mouseupPosition: { x: number; y: number };
      button: number;
      pixelRatio: number;
      sourceEvents: {
        mousedown: MouseEvent | TouchEvent | null;
        mousemove: MouseEvent | TouchEvent | null;
        mouseup: MouseEvent | TouchEvent | null;
      };
    };
    const m = mouse as unknown as MouseInternals;

    const updatePositionFromEvent = (event: MouseEvent | TouchEvent) => {
      const rect = scene.getBoundingClientRect();
      const isTouch = "touches" in event;
      const touchPoint = isTouch
        ? (event as TouchEvent).changedTouches[0]
        : null;
      const clientX = touchPoint
        ? touchPoint.clientX
        : (event as MouseEvent).clientX;
      const clientY = touchPoint
        ? touchPoint.clientY
        : (event as MouseEvent).clientY;
      const scaleX = rect.width !== 0 ? scene.clientWidth / rect.width : 1;
      const scaleY = rect.height !== 0 ? scene.clientHeight / rect.height : 1;
      m.absolute.x = (clientX - rect.left) * scaleX;
      m.absolute.y = (clientY - rect.top) * scaleY;
      m.position.x = m.absolute.x;
      m.position.y = m.absolute.y;
      m.sourceEvents.mousemove = event;
    };

    scene.removeEventListener("mousedown", m.mousedown);
    scene.removeEventListener("mousemove", m.mousemove);
    scene.removeEventListener("mouseup", m.mouseup);
    scene.removeEventListener("touchstart", m.mousedown);
    scene.removeEventListener("touchmove", m.mousemove);
    scene.removeEventListener("touchend", m.mouseup);

    const onDown = (event: MouseEvent | TouchEvent) => {
      if ("touches" in event) event.preventDefault();
      updatePositionFromEvent(event);
      m.mousedownPosition.x = m.position.x;
      m.mousedownPosition.y = m.position.y;
      m.button = "button" in event ? (event as MouseEvent).button : 0;
      m.sourceEvents.mousedown = event;
    };
    const onMove = (event: MouseEvent | TouchEvent) => {
      if ("touches" in event) event.preventDefault();
      updatePositionFromEvent(event);
    };
    const onUp = (event: MouseEvent | TouchEvent) => {
      updatePositionFromEvent(event);
      m.mouseupPosition.x = m.position.x;
      m.mouseupPosition.y = m.position.y;
      m.button = -1;
      m.sourceEvents.mouseup = event;
    };

    scene.addEventListener("mousedown", onDown as EventListener);
    scene.addEventListener("mousemove", onMove as EventListener);
    scene.addEventListener("mouseup", onUp as EventListener);
    scene.addEventListener("touchstart", onDown as EventListener, {
      passive: false,
    });
    scene.addEventListener("touchmove", onMove as EventListener, {
      passive: false,
    });
    scene.addEventListener("touchend", onUp as EventListener);

    const MAX_SPEED = 40;
    Events.on(engine, "beforeUpdate", () => {
      const dragged = mouseConstraint.body;
      bodies.forEach(({ body, w, h }) => {
        if (body === dragged) return;
        const v = body.velocity;
        const speed = Math.hypot(v.x, v.y);
        if (speed > MAX_SPEED) {
          const k = MAX_SPEED / speed;
          Matter.Body.setVelocity(body, { x: v.x * k, y: v.y * k });
        }
        const minX = w / 2;
        const maxX = width - w / 2;
        const maxY = height - h / 2;
        let { x, y } = body.position;
        let corrected = false;
        if (x < minX) {
          x = minX;
          corrected = true;
        } else if (x > maxX) {
          x = maxX;
          corrected = true;
        }
        if (y > maxY) {
          y = maxY;
          corrected = true;
        }
        if (corrected) {
          Matter.Body.setPosition(body, { x, y });
          Matter.Body.setVelocity(body, {
            x: body.velocity.x * 0.4,
            y: body.velocity.y * 0.4,
          });
        }
      });
    });

    const wheelHandler = (mouse as unknown as { mousewheel?: EventListener })
      .mousewheel;
    if (wheelHandler) {
      scene.removeEventListener("wheel", wheelHandler);
      scene.removeEventListener("DOMMouseScroll", wheelHandler);
    }

    let raf = 0;
    const update = () => {
      bodies.forEach(({ body, w, h }, i) => {
        const el = cardRefs.current[i];
        if (!el) return;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
      });
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);

    const applyBounds = () => {
      const next = getSize();
      if (next.w === width && next.h === height) return;
      const prevWidth = width;
      width = next.w;
      height = next.h;
      Matter.Body.setPosition(ground, {
        x: width / 2,
        y: height + wallThickness / 2,
      });
      Matter.Body.setPosition(ceiling, {
        x: width / 2,
        y: -wallThickness / 2 - 800,
      });
      Matter.Body.setPosition(rightWall, {
        x: width + wallThickness / 2,
        y: height / 2,
      });
      Matter.Body.setPosition(leftWall, {
        x: -wallThickness / 2,
        y: height / 2,
      });

      const prevScale = getScaleFor(prevWidth);
      const nextScale = getScaleFor(width);
      if (prevScale !== nextScale) {
        const ratio = nextScale / prevScale;
        bodies.forEach((entry) => {
          Matter.Body.scale(entry.body, ratio, ratio);
          entry.w = entry.base.w * nextScale;
          entry.h = entry.base.h * nextScale;
        });
      }
    };

    const ro = new ResizeObserver(applyBounds);
    ro.observe(scene);
    window.addEventListener("resize", applyBounds);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", applyBounds);
      scene.removeEventListener("mousedown", onDown as EventListener);
      scene.removeEventListener("mousemove", onMove as EventListener);
      scene.removeEventListener("mouseup", onUp as EventListener);
      scene.removeEventListener("touchstart", onDown as EventListener);
      scene.removeEventListener("touchmove", onMove as EventListener);
      scene.removeEventListener("touchend", onUp as EventListener);
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, []);

  return (
    <section className="relative w-full h-screen flex flex-col items-center pt-12 sm:pt-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950 overflow-hidden">
      <div
        ref={sceneRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
      >
        {cards.map((card, i) => {
          const Icon = card.Icon;
          return (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute top-0 left-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg will-change-transform"
              style={{
                backgroundColor: card.bg,
                transform: "translate(-9999px, -9999px)",
              }}
            >
              <Icon
                className="absolute bottom-4 left-4"
                style={{ color: card.color }}
                size={56}
                strokeWidth={1.75}
              />
            </div>
          );
        })}
      </div>

      <div className="relative z-20 w-full max-w-[1400px] mx-auto flex flex-col items-center pointer-events-none">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center select-none text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-neutral-900 dark:text-white leading-[1.1] tracking-tight max-w-4xl"
        >
          We can&apos;t find the page
          <br />
          you&apos;re looking for.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 sm:mt-8 pointer-events-auto"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium cursor-pointer shadow-lg transition-colors duration-200"
          >
            Take Me Home
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

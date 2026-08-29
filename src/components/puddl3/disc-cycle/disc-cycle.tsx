"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion } from "motion/react";

import "./disc-cycle.css";

export interface DiscCycleItem {
  /** Stable id for React keys: defaults to the index if omitted. */
  id?: string;
  /** Image URL rendered inside the disc when it becomes active. */
  image: string;
  /** Alt text for the image. */
  alt?: string;
  /** Optional caption rendered beneath the disc when active. */
  caption?: string;
}

export interface DiscCycleClassNames {
  root?: string;
  disc?: string;
  rim?: string;
  surface?: string;
  image?: string;
  caption?: string;
}

export interface DiscCycleProps {
  /** Discs in the stack. Defaults to 3 sample images. */
  items?: DiscCycleItem[];
  /** Diameter of the disc in pixels. */
  size?: number;
  /** Tilt of the discs in degrees. 0 = flat circle, 90 = edge-on. */
  tilt?: number;
  /** Vertical separation between adjacent discs at rest, in px. */
  stackGap?: number;
  /** Seconds the active disc stays before it lifts away. */
  interval?: number;
  /** Seconds for the lift / settle transition. */
  transitionDuration?: number;
  /** Pause the auto-cycle. */
  paused?: boolean;
  /** Color of the disc surface (top face). */
  surfaceColor?: string;
  /** Color of the disc rim (side / edge). */
  rimColor?: string;
  /** Color of the disc border ring & edge dots. */
  borderColor?: string;
  /** Show the soft floor reflection beneath the stack. */
  showReflection?: boolean;
  /** Granular className overrides. */
  classNames?: DiscCycleClassNames;
  /** Optional className applied to the root. */
  className?: string;
  /** Optional inline style applied to the root. */
  style?: CSSProperties;
  /** Fired when the active disc changes. Receives the new active index. */
  onActiveChange?: (index: number) => void;
}

const DEFAULT_ITEMS: DiscCycleItem[] = [
  {
    id: "disc-cycle-1",
    image:
      "https://images.unsplash.com/photo-1635776062360-af423602aff3?q=80&w=900&auto=format&fit=crop",
    alt: "Lavender gradient",
    caption: "Reasoning",
  },
  {
    id: "disc-cycle-2",
    image:
      "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=900&auto=format&fit=crop",
    alt: "Peach gradient",
    caption: "Vision",
  },
  {
    id: "disc-cycle-3",
    image:
      "https://images.unsplash.com/photo-1635776062764-e025521e3df3?q=80&w=900&auto=format&fit=crop",
    alt: "Mint gradient",
    caption: "Memory",
  },
];

type Phase = "idle" | "lifting" | "settling";

interface DiscPlacement {
  y: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

const restingPlacement = (
  slot: number,
  total: number,
  stackGap: number,
): DiscPlacement => ({
  y: slot * stackGap,
  scale: 1 - slot * 0.012,
  opacity: 1,
  zIndex: total - slot,
});

const liftedPlacement = (size: number, total: number): DiscPlacement => ({
  y: -size * 0.55,
  scale: 1,
  opacity: 0,
  zIndex: total + 5,
});

const joinClassNames = (...parts: Array<string | undefined | false>): string =>
  parts.filter(Boolean).join(" ");

interface DiscProps {
  item: DiscCycleItem;
  active: boolean;
  placement: DiscPlacement;
  positionTransitionDuration: number;
  size: number;
  tilt: number;
  transitionDuration: number;
  surfaceColor: string;
  rimColor: string;
  borderColor: string;
  classNames?: DiscCycleClassNames;
  patternId: string;
}

const Disc = ({
  item,
  active,
  placement,
  positionTransitionDuration,
  size,
  tilt,
  transitionDuration,
  surfaceColor,
  rimColor,
  borderColor,
  classNames,
  patternId,
}: DiscProps) => {
  const tiltRad = (tilt * Math.PI) / 180;
  const rimHeight = Math.max(2, Math.round(size * 0.06 * Math.sin(tiltRad)));

  const ringDots = useMemo(() => {
    const count = 28;
    const r = size / 2 - size * 0.06;
    return Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * Math.PI * 2;
      return {
        x: size / 2 + Math.cos(a) * r,
        y: size / 2 + Math.sin(a) * r,
      };
    });
  }, [size]);

  return (
    <motion.div
      className={joinClassNames("disc-cycle-disc", classNames?.disc)}
      style={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        zIndex: placement.zIndex,
      }}
      initial={false}
      animate={{
        y: placement.y,
        scale: placement.scale,
        opacity: placement.opacity,
      }}
      transition={{
        y: {
          duration: positionTransitionDuration,
          ease: [0.22, 1, 0.36, 1],
        },
        scale: {
          duration: positionTransitionDuration,
          ease: [0.22, 1, 0.36, 1],
        },
        opacity: {
          duration: transitionDuration,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
    >
      <div
        className="disc-cycle-tilt"
        style={{ transform: `rotateX(${tilt}deg)` }}
      >
        <div
          className={joinClassNames("disc-cycle-rim", classNames?.rim)}
          style={{
            background: rimColor,
            boxShadow: `inset 0 -${rimHeight}px 0 0 ${rimColor}`,
            transform: `translateZ(-${rimHeight}px)`,
          }}
          aria-hidden
        />

        <div
          className={joinClassNames(
            "disc-cycle-surface",
            classNames?.surface,
          )}
          style={{
            background: surfaceColor,
            borderColor,
          }}
        >
          <div className="disc-cycle-sheen" aria-hidden />

          <svg className="disc-cycle-grid" aria-hidden>
            <defs>
              <pattern
                id={patternId}
                width="14"
                height="14"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <path
                  d="M 14 0 L 0 0 0 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.6"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>

          <AnimatePresence>
            {active && (
              <motion.div
                key={`image-${item.id ?? "active"}`}
                className="disc-cycle-image-wrap"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{
                  duration: Math.min(0.45, transitionDuration * 0.9),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.alt ?? ""}
                  draggable={false}
                  className={joinClassNames(
                    "disc-cycle-image",
                    classNames?.image,
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <svg className="disc-cycle-dots" aria-hidden>
            {ringDots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={Math.max(1.2, size * 0.005)}
                fill={borderColor}
                opacity={active ? 0.95 : 0.35}
              />
            ))}
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

const DiscCycle = ({
  items = DEFAULT_ITEMS,
  size = 360,
  tilt = 62,
  stackGap = 22,
  interval = 5,
  transitionDuration = 0.9,
  paused = false,
  surfaceColor = "rgba(245, 240, 255, 0.95)",
  rimColor = "rgba(255, 255, 255, 0.85)",
  borderColor = "rgba(180, 160, 220, 0.55)",
  showReflection = true,
  classNames,
  className,
  style,
  onActiveChange,
}: DiscCycleProps) => {
  const total = Math.max(1, items.length);

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");

  const onActiveChangeRef = useRef(onActiveChange);
  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  }, [onActiveChange]);

  useEffect(() => {
    if (paused || total <= 1) return;

    const intervalMs = Math.max(0.6, interval) * 1000;
    const liftMs = Math.min(transitionDuration * 0.6, interval * 0.4) * 1000;
    const restMs = Math.max(0, intervalMs - liftMs);

    let liftTimer: ReturnType<typeof setTimeout> | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let restTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const runCycle = () => {
      if (cancelled) return;
      restTimer = setTimeout(() => {
        if (cancelled) return;
        setPhase("lifting");
        liftTimer = setTimeout(() => {
          if (cancelled) return;
          setStep((s) => {
            const next = s + 1;
            onActiveChangeRef.current?.(next % total);
            return next;
          });
          setPhase("settling");
          settleTimer = setTimeout(() => {
            if (cancelled) return;
            setPhase("idle");
            runCycle();
          }, 16);
        }, liftMs);
      }, restMs);
    };

    runCycle();

    return () => {
      cancelled = true;
      if (liftTimer) clearTimeout(liftTimer);
      if (settleTimer) clearTimeout(settleTimer);
      if (restTimer) clearTimeout(restTimer);
    };
  }, [paused, total, interval, transitionDuration]);

  const reactId = useId();
  const patternId = `cs-grid-${reactId.replace(/[:]/g, "")}`;

  const stackHeight = size + (total - 1) * stackGap;
  const reflectionHeight = Math.round(size * 0.42);

  const rootStyle: CSSProperties = {
    width: size + 80,
    height: stackHeight + (showReflection ? reflectionHeight + 40 : 40),
    perspective: size * 3,
    ...style,
  };

  const activeIndex = step % total;
  const activeItem = items[activeIndex];

  return (
    <div
      className={joinClassNames(
        "disc-cycle-root",
        classNames?.root,
        className,
      )}
      style={rootStyle}
      role="group"
      aria-label="Stacked discs carousel"
    >
      <div
        className="disc-cycle-stack"
        style={{ width: size, height: stackHeight }}
      >
        {items.map((item, i) => {
          const slot = (i - step + total * 1000) % total;

          let placement: DiscPlacement;
          let positionTransitionDuration = transitionDuration;
          let active = false;

          if (phase === "lifting") {
            if (slot === 0) {
              placement = liftedPlacement(size, total);
            } else {
              placement = restingPlacement(slot, total, stackGap);
            }
            active = false;
          } else if (phase === "settling") {
            if (slot === total - 1) {
              placement = restingPlacement(slot, total, stackGap);
              placement = { ...placement, opacity: 0 };
              positionTransitionDuration = 0;
            } else {
              placement = restingPlacement(slot, total, stackGap);
            }
            active = slot === 0;
          } else {
            placement = restingPlacement(slot, total, stackGap);
            active = slot === 0;
          }

          return (
            <Disc
              key={item.id ?? i}
              item={item}
              active={active}
              placement={placement}
              positionTransitionDuration={positionTransitionDuration}
              size={size}
              tilt={tilt}
              transitionDuration={transitionDuration}
              surfaceColor={surfaceColor}
              rimColor={rimColor}
              borderColor={borderColor}
              classNames={classNames}
              patternId={patternId}
            />
          );
        })}
      </div>

      {showReflection && (
        <div
          className="disc-cycle-reflection"
          style={{
            top: stackHeight + 8,
            width: size * 1.1,
            height: reflectionHeight,
          }}
          aria-hidden
        />
      )}

      <AnimatePresence mode="wait">
        {phase === "idle" && activeItem?.caption && (
          <motion.div
            key={`caption-${activeIndex}`}
            className={joinClassNames(
              "disc-cycle-caption",
              classNames?.caption,
            )}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeItem.caption}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiscCycle;

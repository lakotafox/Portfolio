"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { curveMonotoneX, line } from "d3-shape";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const PAD = { top: 10, right: 1, bottom: 20, left: 34 };
const PLOT_H = 288;
const POINTS = 60;
const Y_TOP = 1500;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const compact = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(Math.abs(n) >= 10_000_000 ? 0 : 1)}M`
    : Math.abs(n) >= 1_000
      ? `${(n / 1_000).toFixed(Math.abs(n) >= 10_000 ? 0 : 1)}k`
      : `${n}`;

const grouped = (n: number) => n.toLocaleString("en-US");

function niceTicks(max: number, count = 4) {
  if (!(max > 0)) return { top: 1, ticks: [0, 1] };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step =
    (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) *
    mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 1000; v += step) ticks.push(v);
  return { top, ticks };
}

const wave = (seed: number, i: number) =>
  Math.sin(i * 0.7 + seed) * 0.5 +
  Math.sin(i * 0.23 + seed * 2.1) * 0.34 +
  Math.sin(i * 1.9 + seed * 0.6) * 0.12;

const BASE = 980;
const AMP = 340;
const SEED = 3.7;

const sampleAt = (k: number, stride: number) =>
  Math.round(
    BASE + AMP * wave(SEED, k * 0.11 * stride) + 40 * Math.sin(k * 0.5),
  );

function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view?.ResizeObserver) return;
    const observer = new view.ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize({ width: box.width, height: box.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

const WINDOWS = [
  { label: "60s", seconds: 60 },
  { label: "5m", seconds: 300 },
  { label: "15m", seconds: 900 },
] as const;

const fmtSpan = (sec: number) =>
  sec < 60
    ? `${sec}s`
    : Number.isInteger(sec / 60)
      ? `${sec / 60}m`
      : `${(sec / 60).toFixed(1)}m`;

export default function Analytics16() {
  const uid = useId();
  const clipId = `${uid}-clip`;
  const [ref, size] = useMeasure<HTMLDivElement>();

  const [count, setCount] = useState(POINTS);
  const [paused, setPaused] = useState(false);
  const [windowSec, setWindowSec] = useState<number>(60);
  const [active, setActive] = useState<number | null>(null);
  const [held, setHeld] = useState(POINTS - 1);
  const [mounted, setMounted] = useState(false);

  const pausedRef = useRef(false);
  const scrubRef = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current && !scrubRef.current) setCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const stride = windowSec / POINTS;

  const data = useMemo(
    () =>
      Array.from({ length: POINTS }, (_, j) =>
        sampleAt(count - (POINTS - 1) + j, stride),
      ),
    [count, stride],
  );

  const width = size.width;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = PLOT_H - PAD.top - PAD.bottom;

  const { top, ticks } = useMemo(() => niceTicks(Y_TOP), []);

  const x = useCallback(
    (i: number) => PAD.left + (i / (POINTS - 1)) * innerW,
    [innerW],
  );
  const y = useCallback(
    (v: number) => PAD.top + innerH - (v / top) * innerH,
    [innerH, top],
  );

  const linePath =
    line<number>()
      .x((_, i) => x(i))
      .y((v) => y(v))
      .curve(curveMonotoneX)(data) ?? "";

  const current = data[POINTS - 1];
  const shown = active === null ? current : data[active];
  const peak = Math.max(...data);
  const mean = Math.round(data.reduce((a, b) => a + b, 0) / data.length);

  const togglePaused = () =>
    setPaused((p) => {
      pausedRef.current = !p;
      return !p;
    });

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    scrubRef.current = true;
    const rect = el.getBoundingClientRect();
    const step = innerW / (POINTS - 1);
    const index = clamp(
      Math.round((clientX - rect.left - PAD.left) / step),
      0,
      POINTS - 1,
    );
    setActive(index);
    setHeld(index);
  };

  const endScrub = () => {
    scrubRef.current = false;
    setActive(null);
  };

  const heldAgo = Math.round((POINTS - 1 - held) * stride);

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className={cx(frame, "mx-auto w-full max-w-[880px] space-y-1")}>
        <div className={cx(panel, "px-5 py-4")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] text-neutral-500">
                  Requests per second
                </p>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
                  <span
                    className={cx(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      paused
                        ? "bg-neutral-300 dark:bg-neutral-600"
                        : "bg-neutral-400 animate-pulse motion-reduce:animate-none dark:bg-neutral-500",
                    )}
                  />
                  {paused ? "Paused" : "Live"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                <p className="text-3xl font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                  <span
                    className="inline-block tabular-nums"
                    style={{ minWidth: "5ch" }}
                  >
                    {grouped(shown)}
                  </span>
                  <span className="ml-1 text-lg text-neutral-400">rps</span>
                </p>
                {active !== null && (
                  <p className="text-[13px] tabular-nums text-neutral-500">
                    {heldAgo === 0 ? "now" : `${heldAgo}s ago`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={togglePaused}
                aria-pressed={paused}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                {paused ? "Resume" : "Pause"}
              </button>

              <div
                role="tablist"
                aria-label="Window"
                className="flex items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
              >
                {WINDOWS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    role="tab"
                    aria-selected={option.seconds === windowSec}
                    onClick={() => setWindowSec(option.seconds)}
                    className={cx(
                      "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] tabular-nums",
                      option.seconds === windowSec
                        ? "bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                      transition,
                      focus,
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={ref}
            role="img"
            tabIndex={0}
            aria-label={`Live requests per second over the last ${fmtSpan(windowSec)}. Currently ${grouped(current)} requests per second.`}
            onPointerMove={(e) => move(e.clientX)}
            onPointerLeave={endScrub}
            onBlur={endScrub}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                scrubRef.current = true;
                const from = active ?? POINTS - 1;
                const index = clamp(
                  from + (e.key === "ArrowLeft" ? -1 : 1),
                  0,
                  POINTS - 1,
                );
                setActive(index);
                setHeld(index);
              }
              if (e.key === "Home") {
                scrubRef.current = true;
                setActive(0);
                setHeld(0);
              }
              if (e.key === "End") {
                scrubRef.current = true;
                setActive(POINTS - 1);
                setHeld(POINTS - 1);
              }
              if (e.key === "Escape") endScrub();
            }}
            style={{ height: PLOT_H, touchAction: "pan-y" }}
            className={cx(
              "relative mt-4 cursor-crosshair rounded-[var(--rb-r-md,8px)]",
              focus,
            )}
          >
            {width > 0 && (
              <svg
                width={width}
                height={PLOT_H}
                className="overflow-visible text-neutral-900 dark:text-white"
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect
                      x={0}
                      y={0}
                      width={width}
                      height={PLOT_H}
                      style={{
                        transform: mounted ? "scaleX(1)" : "scaleX(0)",
                        transformBox: "fill-box",
                        transformOrigin: "left",
                      }}
                      className="transition-transform duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    />
                  </clipPath>
                </defs>

                {ticks.map((tick) => (
                  <g key={tick}>
                    <line
                      x1={PAD.left}
                      x2={width - PAD.right}
                      y1={y(tick)}
                      y2={y(tick)}
                      shapeRendering="crispEdges"
                      className="stroke-neutral-200/70 dark:stroke-neutral-800"
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={y(tick)}
                      dy={-4}
                      className="fill-neutral-400 text-[11px] tabular-nums"
                    >
                      {compact(tick)}
                    </text>
                  </g>
                ))}

                {[0, 30, POINTS - 1].map((i) => (
                  <text
                    key={i}
                    x={x(i)}
                    y={PLOT_H - 4}
                    textAnchor={
                      i === 0 ? "start" : i === POINTS - 1 ? "end" : "middle"
                    }
                    className="fill-neutral-400 text-[11px] tabular-nums"
                  >
                    {i === POINTS - 1
                      ? "now"
                      : fmtSpan(Math.round((POINTS - 1 - i) * stride))}
                  </text>
                ))}

                <g clipPath={`url(#${clipId})`}>
                  <path
                    d={linePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {active !== null && (
                  <line
                    x1={x(active)}
                    x2={x(active)}
                    y1={PAD.top}
                    y2={PAD.top + innerH}
                    className="stroke-neutral-300 dark:stroke-neutral-700"
                    strokeWidth={1}
                    shapeRendering="crispEdges"
                  />
                )}

                <circle
                  cx={x(POINTS - 1)}
                  cy={y(current)}
                  r={3.5}
                  strokeWidth={2}
                  className="fill-neutral-900 stroke-white dark:fill-white dark:stroke-neutral-900"
                />

                {active !== null && active !== POINTS - 1 && (
                  <circle
                    cx={x(active)}
                    cy={y(data[active])}
                    r={3.5}
                    strokeWidth={2}
                    className="fill-neutral-900 stroke-white dark:fill-white dark:stroke-neutral-900"
                  />
                )}
              </svg>
            )}

            {width > 0 && (
              <div
                aria-hidden="true"
                style={{
                  left: clamp(x(held), 64, Math.max(width - 64, 64)),
                  top: 4,
                }}
                className={cx(
                  "pointer-events-none absolute -translate-x-1/2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-2.5 py-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] transition-opacity duration-[125ms] ease-out dark:border-neutral-800 dark:bg-neutral-900",
                  active === null ? "opacity-0" : "opacity-100",
                )}
              >
                <p className="whitespace-nowrap text-[11px] text-neutral-500">
                  {heldAgo === 0 ? "now" : `${heldAgo}s ago`}
                </p>
                <p className="whitespace-nowrap text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                  {grouped(data[held])} rps
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {[
            { label: "Current", value: grouped(current) },
            { label: "Window peak", value: grouped(peak) },
            { label: "Window mean", value: grouped(mean) },
          ].map((stat) => (
            <div key={stat.label} className={cx(panel, "px-4 py-3")}>
              <p className="truncate text-xs text-neutral-500">{stat.label}</p>
              <p className="mt-0.5 text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                <span
                  className="inline-block tabular-nums"
                  style={{ minWidth: "4ch" }}
                >
                  {stat.value}
                </span>
                <span className="ml-1 text-xs text-neutral-400">rps</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

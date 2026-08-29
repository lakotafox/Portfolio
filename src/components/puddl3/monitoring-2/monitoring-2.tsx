"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { area, curveMonotoneX, line } from "d3-shape";
import { Pause, Play } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const WINDOW = 60;

const METRICS = [
  {
    id: "rps",
    label: "Requests",
    unit: "/s",
    base: 4200,
    spread: 480,
    seed: 1.1,
    threshold: 5200,
    thresholdLabel: "Autoscale at 5,200/s",
    decimals: 0,
  },
  {
    id: "p99",
    label: "p99 latency",
    unit: "ms",
    base: 340,
    spread: 90,
    seed: 4.6,
    threshold: 500,
    thresholdLabel: "SLO ceiling 500ms",
    decimals: 0,
  },
  {
    id: "err",
    label: "Errors",
    unit: "%",
    base: 0.42,
    spread: 0.26,
    seed: 8.3,
    threshold: 1,
    thresholdLabel: "Page on-call above 1%",
    decimals: 2,
  },
] as const;

type Metric = (typeof METRICS)[number];

const sample = (m: Metric, t: number) =>
  Math.max(
    0,
    m.base +
      m.spread *
        (Math.sin(t * 0.21 + m.seed) * 0.52 +
          Math.sin(t * 0.071 + m.seed * 3.1) * 0.33 +
          Math.sin(t * 0.53 + m.seed * 1.7) * 0.15),
  );

const buildSeries = (m: Metric, offset: number) =>
  Array.from({ length: WINDOW }, (_, i) => sample(m, offset + i));

const fmt = (m: Metric, v: number) =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: m.decimals,
    maximumFractionDigits: m.decimals,
  });

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

export default function Monitoring2() {
  const [metricId, setMetricId] = useState<Metric["id"]>("rps");
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);

  const metric = METRICS.find((m) => m.id === metricId) ?? METRICS[0];

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const data = useMemo(() => buildSeries(metric, tick), [metric, tick]);

  const latest = data[data.length - 1];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const avg = data.reduce((s, v) => s + v, 0) / data.length;
  const breaching = latest > metric.threshold;

  const uid = useId();
  const fillId = `${uid}-fill`;
  const [ref, size] = useMeasure<HTMLDivElement>();

  const height = 220;
  const lo = Math.min(min, metric.threshold) * 0.94;
  const hi = Math.max(max, metric.threshold) * 1.06;

  const x = useCallback(
    (i: number) => (i / (WINDOW - 1)) * Math.max(size.width - 2, 1) + 1,
    [size.width],
  );
  const y = useCallback(
    (v: number) => height - 4 - ((v - lo) / (hi - lo || 1)) * (height - 12),
    [hi, lo],
  );

  const linePath =
    line<number>()
      .x((_, i) => x(i))
      .y((v) => y(v))
      .curve(curveMonotoneX)(data) ?? "";

  const areaPath =
    area<number>()
      .x((_, i) => x(i))
      .y0(height)
      .y1((v) => y(v))
      .curve(curveMonotoneX)(data) ?? "";

  const stats = [
    { label: "Now", value: fmt(metric, latest) },
    { label: "Average", value: fmt(metric, avg) },
    { label: "Peak", value: fmt(metric, max) },
    { label: "Floor", value: fmt(metric, min) },
  ];

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col gap-1",
        )}
      >
        <div
          className={cx(
            panel,
            "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Live stream
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500">
                <span
                  aria-hidden
                  className={cx(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    running
                      ? "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500"
                      : "bg-neutral-300 dark:bg-neutral-600",
                  )}
                />
                {running ? "Streaming" : "Paused"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[12px] text-neutral-500">
              api-gateway · eu-west-1 · 1s resolution
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div
              role="tablist"
              aria-label="Metric"
              className="flex items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800/60"
            >
              {METRICS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={m.id === metricId}
                  onClick={() => setMetricId(m.id)}
                  className={cx(
                    "inline-flex h-6 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[12px] font-medium",
                    transition,
                    focus,
                    m.id === metricId
                      ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className={cx(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              {running ? (
                <Pause className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden />
              )}
              {running ? "Pause" : "Resume"}
            </button>
          </div>
        </div>

        <div className={cx(panel, "flex min-h-0 flex-1 flex-col p-4")}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <p className="text-[32px] leading-none font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                {fmt(metric, latest)}
              </p>
              <span className="text-[13px] text-neutral-500">
                {metric.unit}
              </span>
            </div>
            <p
              className={cx(
                "inline-flex items-center gap-1.5 text-[12px] tabular-nums",
                breaching
                  ? "text-red-600 dark:text-red-400"
                  : "text-neutral-500",
              )}
            >
              <span
                aria-hidden
                className={cx(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  breaching
                    ? "bg-red-500"
                    : "bg-neutral-300 dark:bg-neutral-600",
                )}
              />
              {metric.thresholdLabel}
            </p>
          </div>

          <div
            ref={ref}
            role="img"
            aria-label={`${metric.label} over the last ${WINDOW} seconds, currently ${fmt(metric, latest)}${metric.unit}`}
            style={{ height }}
            className="mt-4 min-h-0 flex-1"
          >
            {size.width > 0 && (
              <svg
                width={size.width}
                height={height}
                className="overflow-visible text-neutral-900 dark:text-white"
              >
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity={0.12}
                    />
                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                {[0.25, 0.5, 0.75].map((f) => (
                  <line
                    key={f}
                    x1={0}
                    x2={size.width}
                    y1={height * f}
                    y2={height * f}
                    className="stroke-neutral-200 dark:stroke-neutral-800"
                    strokeWidth={1}
                    strokeDasharray="3 4"
                  />
                ))}

                <line
                  x1={0}
                  x2={size.width}
                  y1={y(metric.threshold)}
                  y2={y(metric.threshold)}
                  className="stroke-red-400/70"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />

                <path d={areaPath} fill={`url(#${fillId})`} />
                <path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle
                  cx={x(WINDOW - 1)}
                  cy={y(latest)}
                  r={3.5}
                  className={cx(
                    "stroke-white dark:stroke-neutral-900",
                    breaching
                      ? "fill-red-500"
                      : "fill-neutral-900 dark:fill-white",
                  )}
                  strokeWidth={2}
                />
              </svg>
            )}
          </div>

          <div className="mt-2 flex justify-between text-[11px] text-neutral-400 tabular-nums">
            <span>−60s</span>
            <span>−45s</span>
            <span>−30s</span>
            <span>−15s</span>
            <span>now</span>
          </div>
        </div>

        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={cx(panel, "px-4 py-3")}>
              <p className="text-[12px] text-neutral-500">{s.label}</p>
              <p className="mt-1 text-[18px] leading-none font-medium tracking-[-0.01em] text-neutral-900 tabular-nums dark:text-neutral-100">
                {s.value}
                <span className="ml-1 text-[12px] font-normal text-neutral-500">
                  {metric.unit}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

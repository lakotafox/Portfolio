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

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const compact = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(Math.abs(n) >= 10_000_000 ? 0 : 1)}M`
    : Math.abs(n) >= 1_000
      ? `${(n / 1_000).toFixed(Math.abs(n) >= 10_000 ? 0 : 1)}k`
      : `${n}`;

const wave = (seed: number, i: number) =>
  Math.sin(i * 0.7 + seed) * 0.5 +
  Math.sin(i * 0.23 + seed * 2.1) * 0.34 +
  Math.sin(i * 1.9 + seed * 0.6) * 0.12;

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

const RANGES = ["1h", "24h", "7d"] as const;
type Range = (typeof RANGES)[number];
const COUNT: Record<Range, number> = { "1h": 12, "24h": 24, "7d": 28 };

type Metric = {
  id: string;
  label: string;
  unit: string;
  good: "up" | "down";
  base: number;
  seed: number;
  amp: number;
  delta: number;
  decimals: number;
};

const METRICS: Metric[] = [
  {
    id: "req",
    label: "Request rate",
    unit: "req/s",
    good: "up",
    base: 4820,
    seed: 1.4,
    amp: 0.1,
    delta: 6.4,
    decimals: 0,
  },
  {
    id: "p95",
    label: "p95 latency",
    unit: "ms",
    good: "down",
    base: 182,
    seed: 3.1,
    amp: 0.16,
    delta: 8.1,
    decimals: 0,
  },
  {
    id: "err",
    label: "Error rate",
    unit: "%",
    good: "down",
    base: 0.42,
    seed: 5.2,
    amp: 0.34,
    delta: 14.3,
    decimals: 2,
  },
  {
    id: "cpu",
    label: "CPU saturation",
    unit: "%",
    good: "down",
    base: 63,
    seed: 7.7,
    amp: 0.12,
    delta: -4.2,
    decimals: 0,
  },
];

function build(metric: Metric, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const raw = metric.base * (1 + metric.amp * wave(metric.seed, i));
    const p = 10 ** metric.decimals;
    return Math.max(metric.decimals ? 0.01 : 1, Math.round(raw * p) / p);
  });
}

function fmt(metric: Metric, v: number) {
  if (metric.unit === "req/s") return compact(Math.round(v));
  return metric.decimals ? v.toFixed(metric.decimals) : `${Math.round(v)}`;
}

function deltaTone(metric: Metric) {
  const good = metric.good === "up" ? metric.delta >= 0 : metric.delta <= 0;
  return good
    ? "text-emerald-600 dark:text-emerald-500"
    : "text-red-600 dark:text-red-500";
}

const SPARK_PAD = { top: 6, bottom: 2 };

type AreaProps = {
  data: number[];
  width: number;
  height: number;
  active: number | null;
  mounted: boolean;
};

function AreaChart({ data, width, height, active, mounted }: AreaProps) {
  const uid = useId();
  const fillId = `${uid}-fill`;
  const clipId = `${uid}-clip`;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min || 1) * 0.18;
  const top = SPARK_PAD.top;
  const bottom = height - SPARK_PAD.bottom;

  const x = useCallback(
    (i: number) => (i / (data.length - 1)) * Math.max(width - 2, 1) + 1,
    [data.length, width],
  );
  const y = useCallback(
    (v: number) =>
      bottom - ((v - min + pad) / (max - min + pad * 2)) * (bottom - top),
    [bottom, top, max, min, pad],
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

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible text-neutral-900 dark:text-white"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.1} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            style={{
              transform: mounted ? "scaleX(1)" : "scaleX(0)",
              transformBox: "fill-box",
              transformOrigin: "left",
            }}
            className="transition-transform duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
          />
        </clipPath>
      </defs>

      {active !== null && (
        <line
          x1={x(active)}
          x2={x(active)}
          y1={top - 4}
          y2={height}
          className="stroke-neutral-200 dark:stroke-neutral-800"
          strokeWidth={1}
          shapeRendering="crispEdges"
        />
      )}

      <g clipPath={`url(#${clipId})`}>
        <path d={areaPath} fill={`url(#${fillId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {active !== null && (
        <circle
          cx={x(active)}
          cy={y(data[active])}
          r={3.5}
          strokeWidth={2}
          className="fill-neutral-900 stroke-white dark:fill-white dark:stroke-neutral-900"
        />
      )}
    </svg>
  );
}

function useScrub(length: number) {
  const [ref, size] = useMeasure<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const step = rect.width / (length - 1);
    setActive(clamp(Math.round((clientX - rect.left) / step), 0, length - 1));
  };

  const onKey = (e: { key: string; preventDefault: () => void }) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      setActive((prev) =>
        clamp(
          (prev ?? length - 1) + (e.key === "ArrowLeft" ? -1 : 1),
          0,
          length - 1,
        ),
      );
    }
    if (e.key === "Home") setActive(0);
    if (e.key === "End") setActive(length - 1);
    if (e.key === "Escape") setActive(null);
  };

  return { ref, size, active, setActive, move, onKey };
}

function MetricCard({
  metric,
  data,
  selected,
  onToggle,
  mounted,
}: {
  metric: Metric;
  data: number[];
  selected: boolean;
  onToggle: () => void;
  mounted: boolean;
}) {
  const { ref, size, active, setActive, move, onKey } = useScrub(data.length);
  const latest = data[data.length - 1];
  const shown = active === null ? latest : data[active];

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${metric.label}, latest ${fmt(metric, latest)} ${metric.unit}. ${
        selected ? "Selected" : "Select to expand"
      }.`}
      onClick={onToggle}
      onPointerMove={(e) => move(e.clientX)}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKey}
      style={{ touchAction: "pan-y" }}
      className={cx(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-4 text-left dark:border-neutral-800 dark:bg-neutral-900",
        selected && "ring-1 ring-neutral-900 dark:ring-white",
        transition,
        focus,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[13px] text-neutral-500">
          {metric.label}
        </span>
        <span
          className={cx("shrink-0 text-xs tabular-nums", deltaTone(metric))}
        >
          {metric.delta >= 0 ? "+" : "−"}
          {Math.abs(metric.delta).toFixed(1)}%
        </span>
      </div>

      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-medium tabular-nums tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
          {fmt(metric, shown)}
        </span>
        <span className="text-xs text-neutral-400">{metric.unit}</span>
      </div>

      <div ref={ref} className="-mx-4 -mb-4 mt-3 h-11">
        {size.width > 0 && (
          <AreaChart
            data={data}
            width={size.width}
            height={44}
            active={active}
            mounted={mounted}
          />
        )}
      </div>
    </button>
  );
}

function PromotedPanel({
  metric,
  data,
  range,
  mounted,
}: {
  metric: Metric;
  data: number[];
  range: Range;
  mounted: boolean;
}) {
  const { ref, size, active, setActive, move, onKey } = useScrub(data.length);
  const latest = data[data.length - 1];
  const shown = active === null ? latest : data[active];

  const peak = Math.max(...data);
  const low = Math.min(...data);
  const mean = data.reduce((a, b) => a + b, 0) / data.length;

  const stats = [
    { label: "Peak", value: peak },
    { label: "Average", value: mean },
    { label: "Low", value: low },
  ];

  return (
    <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {metric.label}
          </h3>
          <span className="text-xs text-neutral-500">last {range}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-medium tabular-nums tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
            {fmt(metric, shown)}
          </span>
          <span className="text-xs text-neutral-400">{metric.unit}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_170px]">
        <div
          ref={ref}
          role="img"
          tabIndex={0}
          aria-label={`${metric.label} over the last ${range}. Latest ${fmt(
            metric,
            latest,
          )} ${metric.unit}.`}
          onPointerMove={(e) => move(e.clientX)}
          onPointerLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={onKey}
          style={{ touchAction: "pan-y" }}
          className={cx(
            "relative h-[88px] cursor-crosshair rounded-[var(--rb-r-md,8px)]",
            focus,
          )}
        >
          {size.width > 0 && (
            <AreaChart
              data={data}
              width={size.width}
              height={88}
              active={active}
              mounted={mounted}
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-1 lg:grid-cols-1">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--rb-r-md,8px)] bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50"
            >
              <p className="truncate text-xs text-neutral-500">{stat.label}</p>
              <p className="mt-0.5 text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                {fmt(metric, stat.value)}
                <span className="ml-1 text-xs font-normal text-neutral-400">
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

export default function Analytics7() {
  const [range, setRange] = useState<Range>("24h");
  const [selected, setSelected] = useState<string | null>("req");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const count = COUNT[range];
  const series = useMemo(() => METRICS.map((m) => build(m, count)), [count]);

  const selectedIndex = METRICS.findIndex((m) => m.id === selected);
  const open = selectedIndex >= 0;

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Service health
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              Live signals from the ingest tier. Select a card for detail.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Range"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            {RANGES.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={option === range}
                onClick={() => setRange(option)}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] tabular-nums",
                  option === range
                    ? "bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {METRICS.map((metric, i) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              data={series[i]}
              selected={metric.id === selected}
              onToggle={() =>
                setSelected((prev) => (prev === metric.id ? null : metric.id))
              }
              mounted={mounted}
            />
          ))}
        </div>

        <div
          className={cx(
            "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="pt-3">
              {open && (
                <PromotedPanel
                  metric={METRICS[selectedIndex]}
                  data={series[selectedIndex]}
                  range={range}
                  mounted={mounted}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

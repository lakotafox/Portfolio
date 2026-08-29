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
import { Activity, ArrowRight, Timer, UserPlus, Users } from "lucide-react";

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

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const grouped = (n: number) => n.toLocaleString("en-US");

const wave = (seed: number, i: number) =>
  Math.sin(i * 0.9 + seed) * 0.5 + Math.sin(i * 0.31 + seed * 1.7) * 0.32;

function series(seed: number, base: number, drift: number, count: number) {
  return Array.from({ length: count }, (_, i) =>
    Math.round(base * (1 + drift * (i / (count - 1)) + wave(seed, i) * 0.06)),
  );
}

const RANGES = ["Week", "Month", "Quarter"] as const;
type Range = (typeof RANGES)[number];

const POINTS: Record<Range, number> = { Week: 7, Month: 30, Quarter: 13 };
const UNIT: Record<Range, string> = {
  Week: "day",
  Month: "day",
  Quarter: "week",
};

const METRICS = [
  {
    id: "active",
    label: "Active teams",
    icon: Users,
    base: 8420,
    drift: 0.041,
    seed: 1.2,
  },
  {
    id: "invited",
    label: "Seats invited",
    icon: UserPlus,
    base: 1245,
    drift: -0.018,
    seed: 3.4,
  },
  {
    id: "sessions",
    label: "Sessions",
    icon: Activity,
    base: 64_800,
    drift: 0.027,
    seed: 5.1,
  },
  {
    id: "duration",
    label: "Median session",
    icon: Timer,
    base: 412,
    drift: 0.004,
    seed: 7.9,
  },
] as const;

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

function formatValue(id: string, value: number) {
  if (id === "duration") {
    const minutes = Math.floor(value / 60);
    return `${minutes}m ${String(value % 60).padStart(2, "0")}s`;
  }
  return grouped(value);
}

type SparkProps = {
  data: number[];
  active: number | null;
  onActiveChange: (index: number | null) => void;
  label: string;
};

function Spark({ data, active, onActiveChange, label }: SparkProps) {
  const uid = useId();
  const fillId = `${uid}-fill`;
  const [ref, size] = useMeasure<HTMLDivElement>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const height = 44;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min || 1) * 0.18;

  const x = useCallback(
    (i: number) => (i / (data.length - 1)) * Math.max(size.width - 2, 1) + 1,
    [data.length, size.width],
  );
  const y = useCallback(
    (v: number) =>
      height - 3 - ((v - min + pad) / (max - min + pad * 2)) * (height - 6),
    [max, min, pad],
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

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const step = rect.width / (data.length - 1);
    onActiveChange(
      clamp(Math.round((clientX - rect.left) / step), 0, data.length - 1),
    );
  };

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`${label} trend, ${data.length} points`}
      tabIndex={0}
      onPointerMove={(e) => move(e.clientX)}
      onPointerLeave={() => onActiveChange(null)}
      onBlur={() => onActiveChange(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const from = active ?? data.length - 1;
          onActiveChange(
            clamp(from + (e.key === "ArrowLeft" ? -1 : 1), 0, data.length - 1),
          );
        }
        if (e.key === "Escape") onActiveChange(null);
      }}
      style={{ touchAction: "pan-y" }}
      className={cx(
        "relative -mx-1 mt-3 h-11 cursor-crosshair rounded-[var(--rb-r-sm,6px)] px-1",
        focus,
      )}
    >
      {size.width > 0 && (
        <svg
          width={size.width}
          height={height}
          className="overflow-visible text-neutral-900 dark:text-white"
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.1} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>

          <g
            style={{
              transform: mounted ? "scaleX(1)" : "scaleX(0)",
              transformBox: "fill-box",
              transformOrigin: "left",
            }}
            className="transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
          >
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
              r={3}
              className="fill-neutral-900 stroke-white dark:fill-white dark:stroke-neutral-900"
              strokeWidth={2}
            />
          )}
        </svg>
      )}
    </div>
  );
}

export default function Analytics1() {
  const [range, setRange] = useState<Range>("Week");
  const [active, setActive] = useState<Record<string, number | null>>({});

  const data = useMemo(() => {
    const count = POINTS[range];
    return METRICS.map((metric) => ({
      ...metric,
      values: series(metric.seed, metric.base, metric.drift, count),
    }));
  }, [range]);

  return (
    <div className="flex h-full min-h-[480px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className={cx(frame, "mx-auto w-full max-w-[1100px] space-y-1")}>
        <div
          className={cx(
            panel,
            "flex flex-wrap items-start justify-between gap-3 px-4 py-3.5",
          )}
        >
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Workspace pulse
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              Adoption, invitations and time spent across every workspace.
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
                onClick={() => {
                  setRange(option);
                  setActive({});
                }}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
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

        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((metric) => {
            const Icon = metric.icon;
            const cursor = active[metric.id] ?? null;
            const latest = metric.values[metric.values.length - 1];
            const first = metric.values[0];
            const shown = cursor === null ? latest : metric.values[cursor];
            const delta = ((latest - first) / first) * 100;
            const positive = delta >= 0;

            return (
              <div key={metric.id} className={cx(panel, "px-4 py-3.5")}>
                <div className="flex items-center gap-2">
                  <Icon
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                  />
                  <span className="min-w-0 truncate text-[13px] text-neutral-500">
                    {metric.label}
                  </span>
                </div>

                <p className="mt-2 text-2xl font-medium tabular-nums tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                  {formatValue(metric.id, shown)}
                </p>

                <p className="mt-1 truncate text-xs tabular-nums">
                  {cursor === null ? (
                    <>
                      <span
                        className={
                          positive
                            ? "text-emerald-600 dark:text-emerald-500"
                            : "text-red-600 dark:text-red-500"
                        }
                      >
                        {positive ? "+" : "−"}
                        {Math.abs(delta).toFixed(1)}%
                      </span>{" "}
                      <span className="text-neutral-500">
                        vs start of {range.toLowerCase()}
                      </span>
                    </>
                  ) : (
                    <span className="text-neutral-500">
                      {UNIT[range]} {cursor + 1} of {metric.values.length}
                    </span>
                  )}
                </p>

                <Spark
                  data={metric.values}
                  label={metric.label}
                  active={cursor}
                  onActiveChange={(index) =>
                    setActive((prev) => ({ ...prev, [metric.id]: index }))
                  }
                />
              </div>
            );
          })}
        </div>

        <div
          className={cx(
            panel,
            "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
          )}
        >
          <p className="min-w-0 truncate text-xs text-neutral-500">
            12,845 workspaces tracked · 76% active in the last 30 days
          </p>
          <a
            href="#"
            className={cx(
              "inline-flex shrink-0 items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] text-[13px] font-medium text-neutral-900 hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-400",
              transition,
              focus,
            )}
          >
            Open report
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

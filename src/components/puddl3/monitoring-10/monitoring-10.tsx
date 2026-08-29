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
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const WINDOWS = ["7d", "30d", "90d"] as const;
type Window = (typeof WINDOWS)[number];

const POINTS: Record<Window, number> = { "7d": 7, "30d": 30, "90d": 26 };

type Slo = {
  id: string;
  name: string;
  indicator: string;
  target: number;
  current: number;
  remaining: number;
  burn: number;
  seed: number;
};

const SLOS: Slo[] = [
  {
    id: "s1",
    name: "Checkout availability",
    indicator: "Successful charges / attempted charges",
    target: 99.9,
    current: 99.62,
    remaining: 12,
    burn: 4.2,
    seed: 1.7,
  },
  {
    id: "s2",
    name: "API latency",
    indicator: "Requests served under 500ms",
    target: 99.0,
    current: 99.24,
    remaining: 64,
    burn: 1.1,
    seed: 4.3,
  },
  {
    id: "s3",
    name: "Search freshness",
    indicator: "Documents indexed within 60s",
    target: 99.5,
    current: 99.44,
    remaining: 38,
    burn: 1.9,
    seed: 6.9,
  },
  {
    id: "s4",
    name: "Webhook delivery",
    indicator: "Events delivered within 5 minutes",
    target: 99.9,
    current: 99.97,
    remaining: 88,
    burn: 0.4,
    seed: 9.5,
  },
  {
    id: "s5",
    name: "Dashboard uptime",
    indicator: "Successful page loads",
    target: 99.95,
    current: 99.99,
    remaining: 92,
    burn: 0.2,
    seed: 12.1,
  },
];

const burnDown = (slo: Slo, count: number) =>
  Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const drift = 100 - (100 - slo.remaining) * t;
    const wobble =
      Math.sin(i * 0.8 + slo.seed) * 2.2 +
      Math.sin(i * 0.27 + slo.seed * 2) * 1.4;
    return Math.max(0, Math.min(100, drift + wobble * (1 - t * 0.4)));
  });

const tone = (remaining: number) =>
  remaining < 20 ? "danger" : remaining < 45 ? "warning" : "ok";

const BAR = {
  danger: "bg-red-500",
  warning: "bg-amber-500",
  ok: "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
};

const DOT = {
  danger: "bg-red-500",
  warning: "bg-amber-500",
  ok: "bg-neutral-300 dark:bg-neutral-600",
};

const LABEL = {
  danger: "Budget critical",
  warning: "Burning fast",
  ok: "Healthy",
};

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

export default function Monitoring10() {
  const [win, setWin] = useState<Window>("30d");
  const [activeId, setActiveId] = useState("s1");

  const slo = SLOS.find((s) => s.id === activeId) ?? SLOS[0];
  const data = useMemo(() => burnDown(slo, POINTS[win]), [slo, win]);
  const t = tone(slo.remaining);

  const uid = useId();
  const fillId = `${uid}-fill`;
  const [ref, size] = useMeasure<HTMLDivElement>();
  const height = 150;

  const x = useCallback(
    (i: number) => (i / (data.length - 1)) * Math.max(size.width - 2, 1) + 1,
    [data.length, size.width],
  );
  const y = useCallback(
    (v: number) => height - 4 - (v / 100) * (height - 12),
    [],
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

  const idealPath = `M ${x(0)} ${y(100)} L ${x(data.length - 1)} ${y(0)}`;

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto flex min-h-0 w-full max-w-[1000px] flex-1 flex-col gap-1",
        )}
      >
        <div
          className={cx(
            panel,
            "flex flex-wrap items-start justify-between gap-3 px-4 py-3.5",
          )}
        >
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Service level objectives
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-neutral-500 tabular-nums">
              {SLOS.length} objectives ·{" "}
              {SLOS.filter((s) => tone(s.remaining) !== "ok").length} spending
              budget faster than planned
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Compliance window"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800/60"
          >
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                role="tab"
                aria-selected={w === win}
                onClick={() => setWin(w)}
                className={cx(
                  "inline-flex h-6 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[12px] font-medium tabular-nums",
                  transition,
                  focus,
                  w === win
                    ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className={cx(panel, "p-4")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                {slo.name} · error budget
              </h3>
              <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                {slo.indicator}
              </p>
            </div>
            <div className="flex shrink-0 items-baseline gap-4">
              <p className="text-right">
                <span className="block text-[11px] text-neutral-500">
                  Remaining
                </span>
                <span
                  className={cx(
                    "block text-[22px] leading-none font-medium tracking-[-0.02em] tabular-nums",
                    t === "danger"
                      ? "text-red-600 dark:text-red-400"
                      : "text-neutral-900 dark:text-neutral-100",
                  )}
                >
                  {slo.remaining}%
                </span>
              </p>
              <p className="text-right">
                <span className="block text-[11px] text-neutral-500">
                  Burn rate
                </span>
                <span className="block text-[22px] leading-none font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                  {slo.burn.toFixed(1)}×
                </span>
              </p>
            </div>
          </div>

          <div
            ref={ref}
            role="img"
            aria-label={`Error budget burn-down for ${slo.name}, ${slo.remaining}% remaining`}
            style={{ height }}
            className="mt-3"
          >
            {size.width > 0 && (
              <svg
                width={size.width}
                height={height}
                className={cx(
                  "overflow-visible",
                  t === "danger"
                    ? "text-red-500"
                    : "text-neutral-900 dark:text-white",
                )}
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

                <path
                  d={idealPath}
                  fill="none"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="stroke-neutral-300 dark:stroke-neutral-700"
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
              </svg>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Window start</span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-px w-4 border-t border-dashed border-neutral-300 dark:border-neutral-700"
              />
              Planned burn
            </span>
            <span>Today</span>
          </div>
        </div>

        <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto p-2")}>
          <ul className="space-y-1">
            {SLOS.map((s) => {
              const st = tone(s.remaining);
              const isActive = s.id === activeId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveId(s.id)}
                    className={cx(
                      "flex w-full cursor-pointer items-center gap-3 rounded-[var(--rb-r-md,8px)] px-3 py-2.5 text-left",
                      transition,
                      focus,
                      isActive
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        {s.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-neutral-500 tabular-nums">
                        Target {s.target}% · current {s.current}%
                      </span>
                    </span>

                    <span className="hidden w-[140px] shrink-0 sm:block">
                      <span
                        role="progressbar"
                        aria-valuenow={s.remaining}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${s.name} budget remaining`}
                        className="block h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
                      >
                        <span
                          style={{ width: `${s.remaining}%` }}
                          className={cx("block h-full rounded-full", BAR[st])}
                        />
                      </span>
                      <span className="mt-1 block text-[11px] text-neutral-400 tabular-nums">
                        {s.remaining}% budget left
                      </span>
                    </span>

                    <span className="w-[52px] shrink-0 text-right text-[13px] text-neutral-700 tabular-nums dark:text-neutral-300">
                      {s.burn.toFixed(1)}×
                    </span>

                    <span
                      className={cx(
                        "hidden w-[112px] shrink-0 items-center justify-end gap-1.5 text-[12px] md:inline-flex",
                        st === "danger"
                          ? "text-red-600 dark:text-red-400"
                          : "text-neutral-500",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cx(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          DOT[st],
                        )}
                      />
                      {LABEL[st]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

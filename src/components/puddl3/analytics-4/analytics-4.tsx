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
const PLOT_H = 236;
const SLO = 250;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const compact = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(Math.abs(n) >= 10_000_000 ? 0 : 1)}M`
    : Math.abs(n) >= 1_000
      ? `${(n / 1_000).toFixed(Math.abs(n) >= 10_000 ? 0 : 1)}k`
      : `${n}`;

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

const P50 = [
  60, 54, 49, 50, 51, 53, 61, 67, 66, 66, 64, 58, 55, 58, 60, 62, 68, 68, 62,
  58, 54, 48, 48, 53, 56, 58, 61, 59, 52, 50,
];
const P90 = [
  147, 137, 143, 153, 155, 159, 162, 149, 134, 130, 127, 126, 140, 154, 155,
  157, 157, 144, 136, 142, 147, 153, 169, 178, 171, 165, 158, 144, 139, 147,
];
const P99 = [
  257, 273, 283, 261, 237, 227, 211, 203, 223, 241, 240, 243, 237, 208, 189,
  192, 194, 204, 236, 254, 249, 248, 241, 218, 213, 232, 243, 257, 280, 280,
];

const LABELS = Array.from({ length: 30 }, (_, i) => `Apr ${i + 1}`);

const SERIES = [
  {
    id: "p50",
    label: "p50",
    values: P50,
    stroke: "stroke-neutral-900 dark:stroke-white",
    dot: "fill-neutral-900 dark:fill-white",
    dash: undefined as string | undefined,
    swatch:
      "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
    dashed: false,
  },
  {
    id: "p90",
    label: "p90",
    values: P90,
    stroke: "stroke-neutral-400 dark:stroke-neutral-500",
    dot: "fill-neutral-400 dark:fill-neutral-500",
    dash: undefined as string | undefined,
    swatch: "bg-neutral-400 dark:bg-neutral-500",
    dashed: false,
  },
  {
    id: "p99",
    label: "p99",
    values: P99,
    stroke: "stroke-neutral-300 dark:stroke-neutral-600",
    dot: "fill-neutral-300 dark:fill-neutral-600",
    dash: "3 3",
    swatch: "bg-neutral-300 dark:bg-neutral-600",
    dashed: true,
  },
] as const;

export default function Analytics4() {
  const uid = useId();
  const clipId = `${uid}-clip`;
  const [ref, size] = useMeasure<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [held, setHeld] = useState(P99.length - 1);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({
    p50: true,
    p90: true,
    p99: true,
  });

  useEffect(() => setMounted(true), []);

  const width = size.width;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = PLOT_H - PAD.top - PAD.bottom;
  const n = P50.length;

  const visibleSeries = SERIES.filter((s) => visible[s.id]);

  const { top, ticks } = useMemo(() => {
    const max = Math.max(SLO, ...visibleSeries.flatMap((s) => s.values));
    return niceTicks(max);
  }, [visibleSeries]);

  const x = useCallback(
    (i: number) => PAD.left + (i / (n - 1)) * innerW,
    [innerW, n],
  );
  const y = useCallback(
    (v: number) => PAD.top + innerH - (v / top) * innerH,
    [innerH, top],
  );

  const labelStep = Math.ceil(n / 7);

  const latestP99 = P99[n - 1];
  const shownP99 = active === null ? latestP99 : P99[active];
  const sloDelta = ((shownP99 - SLO) / SLO) * 100;
  const overSlo = shownP99 > SLO;

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const step = innerW / (n - 1);
    const index = clamp(
      Math.round((clientX - rect.left - PAD.left) / step),
      0,
      n - 1,
    );
    setActive(index);
    setHeld(index);
  };

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className={cx(frame, "mx-auto w-full max-w-[880px] space-y-1")}>
        <div className={cx(panel, "px-5 py-4")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-neutral-500">
                p99 latency · {active === null ? "latest" : LABELS[active]}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                <p className="text-3xl font-medium tabular-nums tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                  {shownP99}
                  <span className="ml-1 text-lg text-neutral-400">ms</span>
                </p>
                <p className="text-[13px] tabular-nums">
                  <span
                    className={
                      overSlo
                        ? "text-red-600 dark:text-red-500"
                        : "text-emerald-600 dark:text-emerald-500"
                    }
                  >
                    {sloDelta >= 0 ? "+" : "−"}
                    {Math.abs(sloDelta).toFixed(1)}%
                  </span>{" "}
                  <span className="text-neutral-500">vs SLO</span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {SERIES.map((s) => {
                const on = visible[s.id];
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setVisible((prev) => {
                        const next = { ...prev, [s.id]: !prev[s.id] };
                        if (!next.p50 && !next.p90 && !next.p99) return prev;
                        return next;
                      })
                    }
                    className={cx(
                      "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] px-2 text-[11px] tabular-nums",
                      on
                        ? "text-neutral-600 dark:text-neutral-300"
                        : "text-neutral-400 dark:text-neutral-600",
                      "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      transition,
                      focus,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        "h-0.5 w-3 shrink-0 rounded-full",
                        on ? s.swatch : "bg-neutral-200 dark:bg-neutral-800",
                        s.dashed && "opacity-70",
                      )}
                    />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            ref={ref}
            role="img"
            tabIndex={0}
            aria-label={`API latency percentiles over 30 days. Latest p99 ${latestP99} milliseconds against a ${SLO} millisecond SLO.`}
            onPointerMove={(e) => move(e.clientX)}
            onPointerLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                const from = active ?? n - 1;
                const index = clamp(
                  from + (e.key === "ArrowLeft" ? -1 : 1),
                  0,
                  n - 1,
                );
                setActive(index);
                setHeld(index);
              }
              if (e.key === "Home") {
                setActive(0);
                setHeld(0);
              }
              if (e.key === "End") {
                setActive(n - 1);
                setHeld(n - 1);
              }
              if (e.key === "Escape") setActive(null);
            }}
            style={{ height: PLOT_H, touchAction: "pan-y" }}
            className={cx(
              "relative mt-4 cursor-crosshair rounded-[var(--rb-r-md,8px)]",
              focus,
            )}
          >
            {width > 0 && (
              <svg width={width} height={PLOT_H} className="overflow-visible">
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

                {LABELS.map((labelText, i) =>
                  i % labelStep === 0 ? (
                    <text
                      key={labelText}
                      x={x(i)}
                      y={PLOT_H - 4}
                      textAnchor={i === 0 ? "start" : "middle"}
                      className="fill-neutral-400 text-[11px] tabular-nums"
                    >
                      {labelText}
                    </text>
                  ) : null,
                )}

                {top >= SLO && (
                  <g>
                    <line
                      x1={PAD.left}
                      x2={width - PAD.right}
                      y1={y(SLO)}
                      y2={y(SLO)}
                      strokeDasharray="4 4"
                      className="stroke-neutral-300 dark:stroke-neutral-600"
                      strokeWidth={1}
                    />
                    <text
                      x={width - PAD.right}
                      y={y(SLO)}
                      dy={-4}
                      textAnchor="end"
                      className="fill-neutral-400 text-[11px] tabular-nums"
                    >
                      SLO {SLO}ms
                    </text>
                  </g>
                )}

                <g clipPath={`url(#${clipId})`}>
                  {visibleSeries.map((s) => {
                    const d =
                      line<number>()
                        .x((_, i) => x(i))
                        .y((v) => y(v))
                        .curve(curveMonotoneX)(s.values) ?? "";
                    return (
                      <path
                        key={s.id}
                        d={d}
                        fill="none"
                        className={s.stroke}
                        stroke="currentColor"
                        strokeWidth={1.75}
                        strokeDasharray={s.dash}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </g>

                {visible.p99 &&
                  P99.map((v, i) =>
                    v > SLO ? (
                      <circle
                        key={i}
                        cx={x(i)}
                        cy={y(v)}
                        r={2.5}
                        className="fill-red-500 stroke-white dark:stroke-neutral-900"
                        strokeWidth={1.5}
                      />
                    ) : null,
                  )}

                {active !== null && (
                  <g>
                    <line
                      x1={x(active)}
                      x2={x(active)}
                      y1={PAD.top}
                      y2={PAD.top + innerH}
                      className="stroke-neutral-300 dark:stroke-neutral-700"
                      strokeWidth={1}
                      shapeRendering="crispEdges"
                    />
                    {visibleSeries.map((s) => {
                      const v = s.values[active];
                      const breach = s.id === "p99" && v > SLO;
                      return (
                        <circle
                          key={s.id}
                          cx={x(active)}
                          cy={y(v)}
                          r={3.5}
                          strokeWidth={2}
                          className={cx(
                            breach ? "fill-red-500" : s.dot,
                            "stroke-white dark:stroke-neutral-900",
                          )}
                        />
                      );
                    })}
                  </g>
                )}
              </svg>
            )}

            {width > 0 && (
              <div
                aria-hidden="true"
                style={{
                  left: clamp(x(held), 78, Math.max(width - 78, 78)),
                  top: 4,
                }}
                className={cx(
                  "pointer-events-none absolute -translate-x-1/2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-2.5 py-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] transition-opacity duration-[125ms] ease-out dark:border-neutral-800 dark:bg-neutral-900",
                  active === null ? "opacity-0" : "opacity-100",
                )}
              >
                <p className="mb-1 whitespace-nowrap text-[11px] text-neutral-500">
                  {LABELS[held]}
                </p>
                <div className="space-y-0.5">
                  {SERIES.map((s) => {
                    const v = s.values[held];
                    const breach = s.id === "p99" && v > SLO;
                    return (
                      <div
                        key={s.id}
                        className={cx(
                          "flex items-center justify-between gap-4",
                          !visible[s.id] && "opacity-40",
                        )}
                      >
                        <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-neutral-500">
                          <span
                            className={cx(
                              "h-0.5 w-3 rounded-full",
                              s.swatch,
                              s.dashed && "opacity-70",
                            )}
                          />
                          {s.label}
                        </span>
                        <span
                          className={cx(
                            "whitespace-nowrap text-[13px] font-medium tabular-nums",
                            breach
                              ? "text-red-600 dark:text-red-500"
                              : "text-neutral-900 dark:text-neutral-100",
                          )}
                        >
                          {v}ms
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {SERIES.map((s) => (
            <div key={s.id} className={cx(panel, "px-4 py-3")}>
              <p className="flex items-center gap-1.5 truncate text-xs text-neutral-500">
                <span
                  className={cx(
                    "h-0.5 w-3 shrink-0 rounded-full",
                    s.swatch,
                    s.dashed && "opacity-70",
                  )}
                />
                {s.label} latency
              </p>
              <p className="mt-0.5 text-base font-medium tabular-nums tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                {s.values[n - 1]}
                <span className="ml-0.5 text-xs text-neutral-400">ms</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

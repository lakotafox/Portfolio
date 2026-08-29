"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  area,
  curveMonotoneX,
  stack,
  stackOffsetExpand,
  stackOffsetNone,
  stackOrderNone,
} from "d3-shape";

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
const PLOT_H = 260;

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

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type TierKey = "hot" | "warm" | "cold" | "archive";

const RAW: Record<TierKey, number[]> = {
  hot: [42, 44, 47, 45, 48, 52, 55, 53, 58, 61, 64, 68],
  warm: [88, 92, 90, 96, 101, 99, 104, 110, 108, 115, 119, 124],
  cold: [210, 218, 225, 232, 240, 251, 248, 260, 272, 281, 290, 305],
  archive: [340, 352, 368, 375, 390, 405, 418, 432, 445, 461, 478, 496],
};

const DATA = MONTHS.map((month, i) => ({
  month,
  hot: RAW.hot[i],
  warm: RAW.warm[i],
  cold: RAW.cold[i],
  archive: RAW.archive[i],
}));

const STACK_ORDER: TierKey[] = ["archive", "cold", "warm", "hot"];

const TIERS: Record<
  TierKey,
  { label: string; fill: string; stroke: string; swatch: string }
> = {
  hot: {
    label: "Hot",
    fill: "fill-neutral-900 dark:fill-neutral-100",
    stroke: "stroke-neutral-950 dark:stroke-white",
    swatch: "bg-neutral-900 dark:bg-neutral-100",
  },
  warm: {
    label: "Warm",
    fill: "fill-neutral-600 dark:fill-neutral-400",
    stroke: "stroke-neutral-700 dark:stroke-neutral-300",
    swatch: "bg-neutral-600 dark:bg-neutral-400",
  },
  cold: {
    label: "Cold",
    fill: "fill-neutral-400 dark:fill-neutral-600",
    stroke: "stroke-neutral-500 dark:stroke-neutral-500",
    swatch: "bg-neutral-400 dark:bg-neutral-600",
  },
  archive: {
    label: "Archive",
    fill: "fill-neutral-200 dark:fill-neutral-800",
    stroke: "stroke-neutral-300 dark:stroke-neutral-700",
    swatch: "bg-neutral-200 dark:bg-neutral-800",
  },
};

const MODES = ["Stacked", "100%"] as const;
type Mode = (typeof MODES)[number];

export default function Analytics12() {
  const uid = useId();
  const clipId = `${uid}-clip`;
  const [ref, size] = useMeasure<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [held, setHeld] = useState(MONTHS.length - 1);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("Stacked");
  const [visible, setVisible] = useState<Record<TierKey, boolean>>({
    hot: true,
    warm: true,
    cold: true,
    archive: true,
  });

  useEffect(() => setMounted(true), []);

  const width = size.width;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = PLOT_H - PAD.top - PAD.bottom;
  const n = MONTHS.length;
  const expand = mode === "100%";

  const visKeys = STACK_ORDER.filter((k) => visible[k]);

  const stacked = useMemo(() => {
    const gen = stack<(typeof DATA)[number], TierKey>()
      .keys(visKeys)
      .order(stackOrderNone)
      .offset(expand ? stackOffsetExpand : stackOffsetNone);
    return gen(DATA);
  }, [visKeys, expand]);

  const yMax = useMemo(() => {
    if (expand) return 1;
    let max = 0;
    for (const layer of stacked)
      for (const point of layer) max = Math.max(max, point[1]);
    return max;
  }, [stacked, expand]);

  const { top, ticks } = useMemo(() => {
    if (expand) return { top: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
    return niceTicks(yMax);
  }, [expand, yMax]);

  const x = useCallback(
    (i: number) => PAD.left + (i / (n - 1)) * innerW,
    [innerW, n],
  );
  const y = useCallback(
    (v: number) => PAD.top + innerH - (v / top) * innerH,
    [innerH, top],
  );

  const labelStep = Math.ceil(n / 7);

  const monthTotals = useMemo(
    () => DATA.map((d) => d.hot + d.warm + d.cold + d.archive),
    [],
  );
  const visibleTotals = useMemo(
    () => DATA.map((d) => visKeys.reduce((sum, k) => sum + d[k], 0)),
    [visKeys],
  );

  const latestTotal = monthTotals[n - 1];
  const growth =
    ((monthTotals[n - 1] - monthTotals[n - 2]) / monthTotals[n - 2]) * 100;
  const hotShare = (RAW.hot[n - 1] / latestTotal) * 100;

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

  const heldTotal = visibleTotals[held];

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className={cx(frame, "mx-auto w-full max-w-[880px] space-y-1")}>
        <div className={cx(panel, "px-5 py-4")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Storage by tier
              </h2>
              <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                {grouped(latestTotal)} TB stored across four tiers
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Chart mode"
              className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
            >
              {MODES.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={option === mode}
                  onClick={() => setMode(option)}
                  className={cx(
                    "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] tabular-nums",
                    option === mode
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

          <div
            ref={ref}
            role="img"
            tabIndex={0}
            aria-label={`Storage composition by tier across 12 months. Latest total ${grouped(latestTotal)} terabytes.`}
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
                      {expand ? `${Math.round(tick * 100)}%` : compact(tick)}
                    </text>
                  </g>
                ))}

                {MONTHS.map((labelText, i) =>
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

                <g clipPath={`url(#${clipId})`}>
                  {stacked.map((layer) => {
                    const key = layer.key as TierKey;
                    const tier = TIERS[key];
                    const areaPath =
                      area<(typeof layer)[number]>()
                        .x((_, i) => x(i))
                        .y0((d) => y(d[0]))
                        .y1((d) => y(d[1]))
                        .curve(curveMonotoneX)(layer) ?? "";
                    const topLine =
                      area<(typeof layer)[number]>()
                        .x((_, i) => x(i))
                        .y0((d) => y(d[1]))
                        .y1((d) => y(d[1]))
                        .curve(curveMonotoneX)(layer) ?? "";
                    return (
                      <g key={key}>
                        <path d={areaPath} className={tier.fill} />
                        <path
                          d={topLine}
                          fill="none"
                          className={tier.stroke}
                          strokeWidth={1}
                        />
                      </g>
                    );
                  })}
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
              </svg>
            )}

            {width > 0 && (
              <div
                aria-hidden="true"
                style={{
                  left: clamp(x(held), 96, Math.max(width - 96, 96)),
                  top: 4,
                }}
                className={cx(
                  "pointer-events-none absolute -translate-x-1/2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-2.5 py-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] transition-opacity duration-[125ms] ease-out dark:border-neutral-800 dark:bg-neutral-900",
                  active === null ? "opacity-0" : "opacity-100",
                )}
              >
                <p className="mb-1 whitespace-nowrap text-[11px] text-neutral-500">
                  {MONTHS[held]}
                </p>
                <div className="space-y-0.5">
                  {[...STACK_ORDER]
                    .reverse()
                    .filter((k) => visible[k])
                    .map((k) => {
                      const v = DATA[held][k];
                      const share = heldTotal > 0 ? (v / heldTotal) * 100 : 0;
                      return (
                        <div
                          key={k}
                          className="flex items-center justify-between gap-4"
                        >
                          <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-neutral-500">
                            <span
                              className={cx(
                                "h-2 w-2 rounded-[2px]",
                                TIERS[k].swatch,
                              )}
                            />
                            {TIERS[k].label}
                          </span>
                          <span className="whitespace-nowrap text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                            {grouped(v)} TB
                            <span className="ml-1 text-[11px] font-normal text-neutral-400">
                              {share.toFixed(1)}%
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-1 dark:border-neutral-800">
                    <span className="whitespace-nowrap text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                      Total
                    </span>
                    <span className="whitespace-nowrap text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                      {grouped(heldTotal)} TB
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1">
            {[...STACK_ORDER].reverse().map((k) => {
              const on = visible[k];
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setVisible((prev) => {
                      const next = { ...prev, [k]: !prev[k] };
                      if (!Object.values(next).some(Boolean)) return prev;
                      return next;
                    })
                  }
                  className={cx(
                    "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] px-2 text-[11px]",
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
                      "h-2 w-2 shrink-0 rounded-[2px]",
                      on
                        ? TIERS[k].swatch
                        : "bg-neutral-200 dark:bg-neutral-800",
                    )}
                  />
                  {TIERS[k].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {[
            { label: "Total stored", value: `${grouped(latestTotal)} TB` },
            {
              label: "Growth this month",
              value: `${growth >= 0 ? "+" : "−"}${Math.abs(growth).toFixed(1)}%`,
            },
            { label: "Hot tier share", value: `${hotShare.toFixed(1)}%` },
          ].map((stat) => (
            <div key={stat.label} className={cx(panel, "px-4 py-3")}>
              <p className="truncate text-xs text-neutral-500">{stat.label}</p>
              <p className="mt-0.5 text-base font-medium tabular-nums tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

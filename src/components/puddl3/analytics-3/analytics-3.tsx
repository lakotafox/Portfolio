"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
const PLOT_H = 280;

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

function roundedTopRect(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0 || w <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
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

const CURRENT = [
  3120, 2980, 3340, 3610, 3180, 2890, 2760, 3050, 3480, 3720, 3910, 3540,
];
const PRIOR = [
  2740, 2610, 2880, 3020, 2950, 2680, 2510, 2790, 3010, 3180, 3260, 3040,
];

const SERIES = [
  {
    id: "current",
    label: "This year",
    values: CURRENT,
    barClass: "fill-neutral-900 dark:fill-white",
    swatch:
      "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
  },
  {
    id: "prior",
    label: "Last year",
    values: PRIOR,
    barClass: "fill-neutral-200 dark:fill-neutral-800",
    swatch: "bg-neutral-200 dark:bg-neutral-800",
  },
] as const;

export default function Analytics3() {
  const [ref, size] = useMeasure<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [held, setHeld] = useState(11);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({
    current: true,
    prior: true,
  });

  useEffect(() => setMounted(true), []);

  const width = size.width;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = PLOT_H - PAD.top - PAD.bottom;
  const n = MONTHS.length;

  const currentTotal = useMemo(() => CURRENT.reduce((a, b) => a + b, 0), []);
  const priorTotal = useMemo(() => PRIOR.reduce((a, b) => a + b, 0), []);
  const totalDelta = ((currentTotal - priorTotal) / priorTotal) * 100;

  const busiest = useMemo(() => Math.max(...CURRENT), []);
  const average = Math.round(currentTotal / n);

  const { top, ticks } = useMemo(
    () => niceTicks(Math.max(...CURRENT, ...PRIOR)),
    [],
  );

  const groupW = innerW / n;
  const bandW = groupW * 0.62;
  const barGap = 3;
  const barW = Math.max((bandW - barGap) / 2, 1);

  const x = useCallback((i: number) => PAD.left + i * groupW, [groupW]);
  const y = useCallback(
    (v: number) => PAD.top + innerH - (v / top) * innerH,
    [innerH, top],
  );

  const labelStep = Math.ceil(n / 7);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const index = clamp(
      Math.floor((clientX - rect.left - PAD.left) / groupW),
      0,
      n - 1,
    );
    setActive(index);
    setHeld(index);
  };

  const shownCurrent = active === null ? currentTotal : CURRENT[active];
  const shownDelta =
    active === null
      ? totalDelta
      : ((CURRENT[active] - PRIOR[active]) / PRIOR[active]) * 100;
  const positive = shownDelta >= 0;

  const tooltipYoY = ((CURRENT[held] - PRIOR[held]) / PRIOR[held]) * 100;

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className={cx(frame, "mx-auto w-full max-w-[880px] space-y-1")}>
        <div className={cx(panel, "px-5 py-4")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-neutral-500">
                Ticket volume · {active === null ? "this year" : MONTHS[active]}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                <p
                  className="text-3xl font-medium tabular-nums tracking-[-0.02em] text-neutral-900 dark:text-neutral-100"
                  style={{ minWidth: "6ch" }}
                >
                  {grouped(shownCurrent)}
                </p>
                <p className="text-[13px] tabular-nums">
                  <span
                    className={
                      positive
                        ? "text-emerald-600 dark:text-emerald-500"
                        : "text-red-600 dark:text-red-500"
                    }
                  >
                    {positive ? "+" : "−"}
                    {Math.abs(shownDelta).toFixed(1)}%
                  </span>{" "}
                  <span className="text-neutral-500">
                    {active === null ? "vs last year" : "YoY"}
                  </span>
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
                        if (!next.current && !next.prior) return prev;
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
                        on ? s.swatch : "bg-neutral-200 dark:bg-neutral-800",
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
            aria-label={`Ticket volume by month, this year versus last year. This year total ${grouped(currentTotal)} tickets.`}
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
              <svg
                width={width}
                height={PLOT_H}
                className="overflow-visible text-neutral-900 dark:text-white"
              >
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

                {active !== null && (
                  <rect
                    x={x(active)}
                    y={PAD.top}
                    width={groupW}
                    height={innerH}
                    className="fill-neutral-100/60 dark:fill-neutral-800/40"
                  />
                )}

                {MONTHS.map((month, i) =>
                  i % labelStep === 0 ? (
                    <text
                      key={month}
                      x={x(i) + groupW / 2}
                      y={PLOT_H - 4}
                      textAnchor="middle"
                      className="fill-neutral-400 text-[11px] tabular-nums"
                    >
                      {month}
                    </text>
                  ) : null,
                )}

                {MONTHS.map((_, i) => {
                  const start = x(i) + (groupW - bandW) / 2;
                  const dim = active !== null && active !== i;
                  const delay = Math.min(i * 20, 180);
                  return (
                    <g key={i}>
                      {SERIES.map((s, si) => {
                        const v = s.values[i];
                        const bh = (v / top) * innerH;
                        const bx = start + si * (barW + barGap);
                        const on = visible[s.id];
                        const opacity = !on ? 0.28 : dim ? 0.4 : 1;
                        return (
                          <path
                            key={s.id}
                            d={roundedTopRect(
                              bx,
                              PAD.top + innerH - bh,
                              barW,
                              bh,
                              4,
                            )}
                            className={cx(
                              s.barClass,
                              "motion-reduce:transition-none",
                            )}
                            style={{
                              opacity,
                              transform: mounted ? "scaleY(1)" : "scaleY(0)",
                              transformBox: "fill-box",
                              transformOrigin: "bottom",
                              transition: `transform 320ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, opacity 150ms ease-out`,
                            }}
                          />
                        );
                      })}
                    </g>
                  );
                })}

                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={PAD.top + innerH}
                  y2={PAD.top + innerH}
                  shapeRendering="crispEdges"
                  className="stroke-neutral-300 dark:stroke-neutral-700"
                  strokeWidth={1}
                />
              </svg>
            )}

            {width > 0 && (
              <div
                aria-hidden="true"
                style={{
                  left: clamp(
                    x(held) + groupW / 2,
                    72,
                    Math.max(width - 72, 72),
                  ),
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
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-neutral-500">
                      <span className="h-2 w-2 rounded-[2px] bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]" />
                      This year
                    </span>
                    <span className="whitespace-nowrap text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                      {grouped(CURRENT[held])}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-neutral-500">
                      <span className="h-2 w-2 rounded-[2px] bg-neutral-200 dark:bg-neutral-700" />
                      Last year
                    </span>
                    <span className="whitespace-nowrap text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                      {grouped(PRIOR[held])}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-0.5">
                    <span className="whitespace-nowrap text-[11px] text-neutral-500">
                      YoY
                    </span>
                    <span
                      className={cx(
                        "whitespace-nowrap text-[11px] tabular-nums",
                        tooltipYoY >= 0
                          ? "text-emerald-600 dark:text-emerald-500"
                          : "text-red-600 dark:text-red-500",
                      )}
                    >
                      {tooltipYoY >= 0 ? "+" : "−"}
                      {Math.abs(tooltipYoY).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {[
            { label: "This year total", value: grouped(currentTotal) },
            { label: "Monthly average", value: grouped(average) },
            { label: "Busiest month", value: `${grouped(busiest)} · Nov` },
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

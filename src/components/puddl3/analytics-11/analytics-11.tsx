"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

const compact = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(Math.abs(n) >= 10_000_000 ? 0 : 1)}M`
    : Math.abs(n) >= 1_000
      ? `${(n / 1_000).toFixed(Math.abs(n) >= 10_000 ? 0 : 1)}k`
      : `${n}`;

const grouped = (n: number) => n.toLocaleString("en-US");

const wave = (seed: number, i: number) =>
  Math.sin(i * 0.9 + seed) * 0.5 + Math.sin(i * 0.31 + seed * 1.7) * 0.32;

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setEdges({
      start: scrollLeft > 1,
      end: Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view?.ResizeObserver) return;
    const observer = new view.ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  return { ref, edges, onScroll: update };
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

const COHORTS = 8;
const OFFSETS = 9;
const ARPU = 20;

const BASE_MONTH = 2025 * 12 + 5;
function cohortLabel(i: number) {
  const total = BASE_MONTH + i;
  return `${MONTHS[total % 12]} ${Math.floor(total / 12)}`;
}
const available = (i: number) => OFFSETS - i;

const SIZES = Array.from({ length: COHORTS }, (_, i) =>
  Math.round(1500 + i * 265 + wave(2, i) * 170),
);

const BASE_U = [100, 62, 50, 43, 38, 35, 33, 32, 31];
const BASE_R = [100, 99, 101, 104, 107, 110, 113, 116, 118];

const METRICS = [
  { id: "users", label: "User retention", lo: 0, hi: 100 },
  { id: "revenue", label: "Revenue retention", lo: 85, hi: 125 },
] as const;
type MetricId = (typeof METRICS)[number]["id"];

function retention(metric: MetricId, cohort: number, offset: number) {
  if (offset === 0) return 100;
  const base = metric === "users" ? BASE_U[offset] : BASE_R[offset];
  const lift = cohort * (metric === "users" ? 0.6 : 0.5);
  const v = Math.round(base + lift + wave(cohort + offset, offset) * 3);
  return metric === "users" ? clamp(v, 5, 99) : clamp(v, 80, 135);
}

function absolute(metric: MetricId, cohort: number, pct: number) {
  const size = SIZES[cohort];
  return metric === "users"
    ? Math.round((size * pct) / 100)
    : Math.round((size * ARPU * pct) / 100);
}

const SHADES = [
  { bg: "bg-neutral-100 dark:bg-neutral-800/60", text: "text-neutral-400" },
  {
    bg: "bg-neutral-200 dark:bg-neutral-700",
    text: "text-neutral-600 dark:text-neutral-300",
  },
  {
    bg: "bg-neutral-300 dark:bg-neutral-500",
    text: "text-neutral-800 dark:text-neutral-900",
  },
  {
    bg: "bg-neutral-600 dark:bg-neutral-300",
    text: "text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
  },
  {
    bg: "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
    text: "text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
  },
];

function shade(pct: number, lo: number, hi: number) {
  const norm = clamp((pct - lo) / (hi - lo || 1), 0, 1);
  return SHADES[clamp(Math.round(norm * 4), 0, 4)];
}

export default function Analytics11() {
  const [metricId, setMetricId] = useState<MetricId>("users");
  const [absMode, setAbsMode] = useState(false);
  const [active, setActive] = useState<{ row: number; col: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; max: number } | null>(
    null,
  );

  const wrapRef = useRef<HTMLDivElement>(null);
  const {
    ref: scrollRef,
    edges: fadeEdges,
    onScroll: onFadeScroll,
  } = useScrollFade<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  const metric = METRICS.find((m) => m.id === metricId)!;

  const columnAverage = useMemo(() => {
    return Array.from({ length: OFFSETS }, (_, off) => {
      const rows = Array.from({ length: COHORTS }, (_, i) => i).filter(
        (i) => off < available(i),
      );
      const pct =
        rows.reduce((a, i) => a + retention(metricId, i, off), 0) / rows.length;
      const abs =
        rows.reduce(
          (a, i) => a + absolute(metricId, i, retention(metricId, i, off)),
          0,
        ) / rows.length;
      return { pct: Math.round(pct), abs: Math.round(abs) };
    });
  }, [metricId]);

  const bestCohort = useMemo(() => {
    let best = 0;
    for (let i = 1; i < COHORTS; i++) {
      if (available(i) <= 3) continue;
      if (retention(metricId, i, 3) > retention(metricId, best, 3)) best = i;
    }
    return best;
  }, [metricId]);

  useEffect(() => {
    if (!active) {
      setTip(null);
      return;
    }
    const wrap = wrapRef.current;
    const scroller = scrollRef.current;
    if (!wrap || !scroller) return;
    const cell = scroller.querySelector<HTMLElement>(
      `[data-cell="${active.row}-${active.col}"]`,
    );
    if (!cell) return;
    const cr = cell.getBoundingClientRect();
    const wr = wrap.getBoundingClientRect();
    setTip({
      x: cr.left - wr.left + cr.width / 2,
      y: cr.top - wr.top,
      max: Math.max(wr.width - 92, 92),
    });
  }, [active, metricId, absMode, scrollRef]);

  const formatCell = (pct: number, abs: number) =>
    absMode
      ? metricId === "revenue"
        ? `$${compact(abs)}`
        : compact(abs)
      : `${pct}%`;

  const moveActive = (row: number, col: number) => {
    const r = clamp(row, 0, COHORTS - 1);
    const c = clamp(col, 0, available(r) - 1);
    setActive({ row: r, col: c });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const base = active ?? { row: 0, col: 0 };
    if (e.key === "Escape") {
      setActive(null);
      return;
    }
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(e.key)
    )
      return;
    e.preventDefault();
    if (e.key === "ArrowLeft") moveActive(base.row, base.col - 1);
    else if (e.key === "ArrowRight") moveActive(base.row, base.col + 1);
    else if (e.key === "ArrowUp") moveActive(base.row - 1, base.col);
    else if (e.key === "ArrowDown") moveActive(base.row + 1, base.col);
    else if (e.key === "Home") moveActive(base.row, 0);
    else if (e.key === "End") moveActive(base.row, available(base.row) - 1);
  };

  const stickyCell = "sticky left-0 z-10 bg-white dark:bg-neutral-900";

  const activeInfo =
    active !== null
      ? {
          cohort: cohortLabel(active.row),
          offset: active.col,
          pct: retention(metricId, active.row, active.col),
          abs: absolute(
            metricId,
            active.row,
            retention(metricId, active.row, active.col),
          ),
        }
      : null;

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className={cx(frame, "mx-auto w-full max-w-[1100px] space-y-1")}>
        <div className={cx(panel, "px-5 py-4")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Cohort retention
              </h2>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <div
                role="tablist"
                aria-label="Metric"
                className="flex items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
              >
                {METRICS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={m.id === metricId}
                    onClick={() => {
                      setMetricId(m.id);
                      setActive(null);
                    }}
                    className={cx(
                      "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                      m.id === metricId
                        ? "bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                      transition,
                      focus,
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div
                role="tablist"
                aria-label="Values"
                className="flex items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
              >
                {[
                  { id: false, label: "Percent" },
                  { id: true, label: "Absolute" },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    role="tab"
                    aria-selected={opt.id === absMode}
                    onClick={() => setAbsMode(opt.id)}
                    className={cx(
                      "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                      opt.id === absMode
                        ? "bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                      transition,
                      focus,
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-neutral-500">
            <span>
              Month 3 average{" "}
              <span className="font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                {columnAverage[3].pct}%
              </span>
            </span>
            <span>
              Best cohort{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {cohortLabel(bestCohort)}
              </span>{" "}
              <span className="tabular-nums">
                ({retention(metricId, bestCohort, 3)}% at month 3)
              </span>
            </span>
          </div>
        </div>

        <div className={cx(panel, "p-1")}>
          <div
            ref={wrapRef}
            className="relative overflow-hidden rounded-[var(--rb-r-sm,6px)]"
          >
            <div
              ref={scrollRef}
              role="img"
              tabIndex={0}
              aria-label={
                activeInfo
                  ? `${activeInfo.cohort}, month ${activeInfo.offset}: ${activeInfo.pct}% retained, ${grouped(activeInfo.abs)} ${metricId === "revenue" ? "dollars" : "users"}`
                  : `${metric.label} matrix, ${COHORTS} cohorts by ${OFFSETS} monthly offsets. Arrow keys inspect a cell.`
              }
              onScroll={onFadeScroll}
              onPointerLeave={() => setActive(null)}
              onKeyDown={onKeyDown}
              style={{ touchAction: "pan-y" }}
              className={cx(
                "overflow-x-auto rounded-[var(--rb-r-sm,6px)]",
                focus,
              )}
            >
              <div
                className="grid gap-1 pt-1 transition-opacity duration-500 ease-out motion-reduce:transition-none"
                style={{
                  gridTemplateColumns: `148px repeat(${OFFSETS}, minmax(62px, 1fr))`,
                  minWidth: 148 + OFFSETS * 62 + OFFSETS * 4,
                  opacity: mounted ? 1 : 0,
                }}
              >
                <div
                  className={cx(
                    stickyCell,
                    "flex items-end px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-neutral-500",
                  )}
                >
                  Cohort
                </div>
                {Array.from({ length: OFFSETS }, (_, off) => (
                  <div
                    key={off}
                    className="flex items-end justify-center pb-1 text-[11px] tabular-nums text-neutral-500"
                  >
                    Month {off}
                  </div>
                ))}

                {Array.from({ length: COHORTS }, (_, ri) => (
                  <Fragment key={ri}>
                    <div
                      className={cx(
                        stickyCell,
                        "flex h-9 flex-col justify-center rounded-[var(--rb-r-sm,6px)] px-2",
                      )}
                    >
                      <span className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                        {cohortLabel(ri)}
                      </span>
                      <span className="truncate text-xs tabular-nums text-neutral-500">
                        {grouped(SIZES[ri])} signups
                      </span>
                    </div>

                    {Array.from({ length: OFFSETS }, (_, oi) => {
                      if (oi >= available(ri))
                        return <div key={oi} className="h-9" />;
                      const pct = retention(metricId, ri, oi);
                      const abs = absolute(metricId, ri, pct);
                      const sh = shade(pct, metric.lo, metric.hi);
                      const inCross =
                        active !== null &&
                        (active.row === ri || active.col === oi);
                      const isActive =
                        active !== null &&
                        active.row === ri &&
                        active.col === oi;
                      return (
                        <div
                          key={oi}
                          data-cell={`${ri}-${oi}`}
                          onPointerEnter={() => setActive({ row: ri, col: oi })}
                          className={cx(
                            "relative flex h-9 items-center justify-center rounded-[var(--rb-r-sm,6px)] text-[13px] tabular-nums",
                            sh.bg,
                            sh.text,
                            transition,
                          )}
                        >
                          {formatCell(pct, abs)}
                          {inCross && !isActive && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-0 rounded-[var(--rb-r-sm,6px)] bg-neutral-900/[0.08] dark:bg-white/[0.10]"
                            />
                          )}
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-0 rounded-[var(--rb-r-sm,6px)] outline outline-1 -outline-offset-1 outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:outline-[var(--rb-accent,oklch(100%_0_0))]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}

                <div
                  className={cx(
                    stickyCell,
                    "flex h-8 items-center rounded-[var(--rb-r-sm,6px)] px-2 text-[13px] font-medium text-neutral-900 dark:text-neutral-100",
                  )}
                >
                  Average
                </div>
                {columnAverage.map((avg, oi) => {
                  const sh = shade(avg.pct, metric.lo, metric.hi);
                  return (
                    <div
                      key={oi}
                      className={cx(
                        "flex h-8 items-center justify-center rounded-[var(--rb-r-sm,6px)] text-[13px] tabular-nums",
                        sh.bg,
                        sh.text,
                      )}
                    >
                      {formatCell(avg.pct, avg.abs)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                fadeEdges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                fadeEdges.end ? "opacity-100" : "opacity-0",
              )}
            />

            {activeInfo && tip && (
              <div
                aria-hidden="true"
                style={{
                  left: clamp(tip.x, 92, tip.max),
                  top: Math.max(tip.y - 62, 4),
                }}
                className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-2.5 py-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] dark:border-neutral-800 dark:bg-neutral-900"
              >
                <p className="whitespace-nowrap text-[11px] text-neutral-500">
                  {activeInfo.cohort} · Month {activeInfo.offset}
                </p>
                <p className="whitespace-nowrap text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                  {activeInfo.pct}% retained
                </p>
                <p className="whitespace-nowrap text-[11px] tabular-nums text-neutral-500">
                  {metricId === "revenue"
                    ? `≈ $${grouped(activeInfo.abs)} retained`
                    : `≈ ${grouped(activeInfo.abs)} users`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  ChevronRight,
  CircleDot,
  Flag,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { area, curveMonotoneX, line } from "d3-shape";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const panel =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

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

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      start: scrollTop > 1,
      end: Math.ceil(scrollTop + clientHeight) < scrollHeight - 1,
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

const scale = (v: number, d0: number, d1: number, r0: number, r1: number) =>
  r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const pct = (n: number) => `${Math.round(n)}%`;

const wave = (seed: number, i: number) =>
  Math.sin(i * 0.42 + seed) * 0.5 + Math.sin(i * 0.17 + seed * 1.6) * 0.3;

type Result = {
  id: string;
  name: string;
  owner: string;
  unit: "count" | "percent" | "money";
  start: number;
  target: number;
  current: number;
};

type Objective = {
  id: string;
  name: string;
  lead: string;
  meta: string;
  results: Result[];
};

const OBJECTIVES: Objective[] = [
  {
    id: "o1",
    name: "Make the first hour obvious",
    lead: "Ines Halvorsen",
    meta: "Activation",
    results: [
      {
        id: "o1r1",
        name: "Reach first saved project in under 6 minutes",
        owner: "IH",
        unit: "percent",
        start: 34,
        target: 70,
        current: 61,
      },
      {
        id: "o1r2",
        name: "Cut setup steps from nine to four",
        owner: "TM",
        unit: "count",
        start: 9,
        target: 4,
        current: 5,
      },
      {
        id: "o1r3",
        name: "Lift week-one return visits",
        owner: "IH",
        unit: "percent",
        start: 41,
        target: 58,
        current: 47,
      },
    ],
  },
  {
    id: "o2",
    name: "Earn the second seat",
    lead: "Dovid Aranyi",
    meta: "Expansion",
    results: [
      {
        id: "o2r1",
        name: "Workspaces with two or more editors",
        owner: "DA",
        unit: "count",
        start: 820,
        target: 1600,
        current: 1418,
      },
      {
        id: "o2r2",
        name: "Net revenue retention",
        owner: "PS",
        unit: "percent",
        start: 104,
        target: 118,
        current: 113,
      },
      {
        id: "o2r3",
        name: "Invites accepted within a day",
        owner: "DA",
        unit: "percent",
        start: 52,
        target: 75,
        current: 58,
      },
    ],
  },
  {
    id: "o3",
    name: "Answer before people ask",
    lead: "Runa Petit",
    meta: "Support",
    results: [
      {
        id: "o3r1",
        name: "Median first reply",
        owner: "RP",
        unit: "count",
        start: 240,
        target: 45,
        current: 68,
      },
      {
        id: "o3r2",
        name: "Tickets closed without a handoff",
        owner: "KO",
        unit: "percent",
        start: 62,
        target: 85,
        current: 81,
      },
      {
        id: "o3r3",
        name: "Docs deflection rate",
        owner: "RP",
        unit: "percent",
        start: 18,
        target: 40,
        current: 22,
      },
    ],
  },
  {
    id: "o4",
    name: "Ship on a predictable cadence",
    lead: "Marta Løken",
    meta: "Platform",
    results: [
      {
        id: "o4r1",
        name: "Releases per week",
        owner: "ML",
        unit: "count",
        start: 2,
        target: 6,
        current: 5,
      },
      {
        id: "o4r2",
        name: "Change failure rate",
        owner: "JB",
        unit: "percent",
        start: 21,
        target: 8,
        current: 11,
      },
      {
        id: "o4r3",
        name: "Build minutes per merge",
        owner: "ML",
        unit: "count",
        start: 34,
        target: 15,
        current: 26,
      },
    ],
  },
  {
    id: "o5",
    name: "Make pricing legible",
    lead: "Priya Sundar",
    meta: "Revenue",
    results: [
      {
        id: "o5r1",
        name: "Plan page visits that reach checkout",
        owner: "PS",
        unit: "percent",
        start: 12,
        target: 24,
        current: 19,
      },
      {
        id: "o5r2",
        name: "Support threads asking what a seat costs",
        owner: "RP",
        unit: "count",
        start: 180,
        target: 40,
        current: 74,
      },
      {
        id: "o5r3",
        name: "Annual plans as a share of new revenue",
        owner: "PS",
        unit: "percent",
        start: 28,
        target: 45,
        current: 39,
      },
    ],
  },
  {
    id: "o6",
    name: "Keep the editor fast under load",
    lead: "Jonas Brekke",
    meta: "Performance",
    results: [
      {
        id: "o6r1",
        name: "p95 interaction latency",
        owner: "JB",
        unit: "count",
        start: 310,
        target: 120,
        current: 168,
      },
      {
        id: "o6r2",
        name: "Documents over 5MB that open cleanly",
        owner: "ML",
        unit: "percent",
        start: 71,
        target: 96,
        current: 92,
      },
      {
        id: "o6r3",
        name: "Client bundle size",
        owner: "JB",
        unit: "count",
        start: 1_240,
        target: 700,
        current: 918,
      },
    ],
  },
  {
    id: "o7",
    name: "Hire the team we planned for",
    lead: "Tomás Miralles",
    meta: "People",
    results: [
      {
        id: "o7r1",
        name: "Open roles closed this quarter",
        owner: "TM",
        unit: "count",
        start: 0,
        target: 9,
        current: 6,
      },
      {
        id: "o7r2",
        name: "Offer acceptance rate",
        owner: "TM",
        unit: "percent",
        start: 64,
        target: 85,
        current: 78,
      },
      {
        id: "o7r3",
        name: "Days from screen to offer",
        owner: "KO",
        unit: "count",
        start: 31,
        target: 14,
        current: 21,
      },
    ],
  },
];

const WEEKS = 13;
const ELAPSED = 9;

const WEEK_LABELS = Array.from({ length: WEEKS }, (_, i) => `W${i + 1}`);

const progressOf = (r: Result) => {
  const span = r.target - r.start;
  if (span === 0) return 100;
  return clamp(((r.current - r.start) / span) * 100, 0, 100);
};

const formatValue = (r: Result, v: number) => {
  const n = Math.round(v);
  if (r.unit === "percent") return `${n}%`;
  if (r.unit === "money") return `$${n.toLocaleString("en-US")}`;
  return n.toLocaleString("en-US");
};

const objectiveProgress = (o: Objective) =>
  o.results.reduce((s, r) => s + progressOf(r), 0) / o.results.length;

const PACE = (ELAPSED / WEEKS) * 100;

type Pace = "ahead" | "on" | "behind";

const paceOf = (p: number): Pace =>
  p >= PACE + 10 ? "ahead" : p >= PACE - 10 ? "on" : "behind";

const PACE_META: Record<
  Pace,
  { label: string; Icon: typeof TrendingUp; tone: string }
> = {
  ahead: {
    label: "Ahead",
    Icon: TrendingUp,
    tone: "text-neutral-900 dark:text-neutral-100",
  },
  on: { label: "On pace", Icon: Minus, tone: "text-neutral-500" },
  behind: { label: "Behind", Icon: TrendingDown, tone: "text-neutral-500" },
};

const PAD = { top: 12, right: 4, bottom: 22, left: 40 };

export default function Dashboard13() {
  const uid = useId();
  const fillId = `${uid}-fill`;
  const clipId = `${uid}-clip`;

  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState(OBJECTIVES[0].id);
  const [cursor, setCursor] = useState<number | null>(null);
  const [plotRef, plotSize] = useMeasure<HTMLDivElement>();
  const {
    ref: listRef,
    edges: listEdges,
    onScroll: onListScroll,
  } = useScrollFade<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  const objective = OBJECTIVES.find((o) => o.id === selected) ?? OBJECTIVES[0];

  const overall = useMemo(
    () =>
      OBJECTIVES.reduce((s, o) => s + objectiveProgress(o), 0) /
      OBJECTIVES.length,
    [],
  );

  const atRisk = useMemo(
    () =>
      OBJECTIVES.flatMap((o) => o.results).filter(
        (r) => paceOf(progressOf(r)) === "behind",
      ).length,
    [],
  );

  const series = useMemo(() => {
    const end = objectiveProgress(objective);
    const seed = objective.id.charCodeAt(1);
    const actual = Array.from({ length: ELAPSED }, (_, i) => {
      const t = i / (ELAPSED - 1);
      const base = end * (0.16 + 0.84 * t);
      return clamp(base + wave(seed, i) * 11 * (1 - t * 0.35), 0, 100);
    });
    actual[ELAPSED - 1] = end;
    const plan = Array.from(
      { length: WEEKS },
      (_, i) => (i / (WEEKS - 1)) * 100,
    );
    return { actual, plan, end };
  }, [objective]);

  const width = plotSize.width;
  const height = plotSize.height;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = Math.max(height - PAD.top - PAD.bottom, 1);

  const geom = useMemo(() => {
    if (width === 0) return null;
    const x = (i: number) => PAD.left + scale(i, 0, WEEKS - 1, 0, innerW);
    const y = (v: number) => PAD.top + innerH - scale(v, 0, 100, 0, innerH);

    const l = line<number>()
      .x((_, i) => x(i))
      .y((v) => y(v))
      .curve(curveMonotoneX);
    const a = area<number>()
      .x((_, i) => x(i))
      .y0(PAD.top + innerH)
      .y1((v) => y(v))
      .curve(curveMonotoneX);

    return {
      x,
      y,
      actualLine: l(series.actual) ?? "",
      actualArea: a(series.actual) ?? "",
      planLine: l(series.plan) ?? "",
    };
  }, [width, innerW, innerH, series]);

  const onPlotMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = plotRef.current;
    if (!el || innerW <= 0) return;
    const rect = el.getBoundingClientRect();
    const t = (e.clientX - rect.left - PAD.left) / innerW;
    setCursor(clamp(Math.round(t * (WEEKS - 1)), 0, WEEKS - 1));
  };

  const onPlotKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setCursor((c) => {
      const next = (c ?? ELAPSED - 1) + (e.key === "ArrowRight" ? 1 : -1);
      return clamp(next, 0, WEEKS - 1);
    });
  };

  const readout =
    cursor === null
      ? {
          label: `Week ${ELAPSED}`,
          actual: series.end,
          plan: series.plan[ELAPSED - 1],
        }
      : {
          label: `Week ${cursor + 1}`,
          actual: cursor < ELAPSED ? series.actual[cursor] : NaN,
          plan: series.plan[cursor],
        };

  const overallPace = paceOf(overall);
  const OverallIcon = PACE_META[overallPace].Icon;

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 px-4 pt-5 pb-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Target
              aria-hidden="true"
              className="h-4 w-4 text-neutral-400 dark:text-neutral-500"
            />
            <span className="text-[13px] text-neutral-500">
              Q2 scorecard · week {ELAPSED} of {WEEKS}
            </span>
          </div>
          <h1 className="mt-1.5 text-lg font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Company goals
          </h1>
        </div>

        <dl className="flex items-end gap-5">
          <div className="text-right">
            <dt className="text-[11px] text-neutral-500">Overall</dt>
            <dd className="mt-0.5 text-2xl font-medium tracking-[-0.02em] tabular-nums text-neutral-900 dark:text-neutral-100">
              {pct(overall)}
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-[11px] text-neutral-500">Quarter elapsed</dt>
            <dd className="mt-0.5 text-2xl font-medium tracking-[-0.02em] tabular-nums text-neutral-500">
              {pct(PACE)}
            </dd>
          </div>
          <div className="pb-1 text-right">
            <dt className="text-[11px] text-neutral-500">
              Key results at risk
            </dt>
            <dd
              className={cx(
                "mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium tabular-nums",
                atRisk > 0
                  ? "text-amber-600 dark:text-amber-500"
                  : "text-neutral-500",
              )}
            >
              <span
                aria-hidden="true"
                className={cx(
                  "h-1.5 w-1.5 rounded-full",
                  atRisk > 0
                    ? "bg-amber-500"
                    : "bg-neutral-300 dark:bg-neutral-600",
                )}
              />
              {atRisk}
            </dd>
          </div>
        </dl>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-[340px_minmax(0,1fr)] sm:px-6 sm:pb-6">
        <div className={cx(panel, "flex min-h-0 flex-col overflow-hidden")}>
          <div className="flex shrink-0 items-center justify-between gap-2 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Objectives
            </h2>
            <span className="text-[11px] tabular-nums text-neutral-500">
              {OBJECTIVES.length}
            </span>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              ref={listRef}
              onScroll={onListScroll}
              className="h-full overflow-y-auto p-1.5"
            >
              <ul className="flex flex-col gap-1">
                {OBJECTIVES.map((o) => {
                  const p = objectiveProgress(o);
                  const pace = paceOf(p);
                  const Icon = PACE_META[pace].Icon;
                  const active = o.id === selected;
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        aria-current={active ? "true" : undefined}
                        onClick={() => {
                          setSelected(o.id);
                          setCursor(null);
                        }}
                        className={cx(
                          "w-full cursor-pointer rounded-[var(--rb-r-lg,10px)] px-2.5 py-2.5 text-left",
                          transition,
                          focus,
                          active
                            ? "bg-neutral-100 dark:bg-neutral-800"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <Flag
                            aria-hidden="true"
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500"
                          />
                          <span className="min-w-0 flex-1 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                            {o.name}
                          </span>
                          <ChevronRight
                            aria-hidden="true"
                            className={cx(
                              "mt-0.5 h-3.5 w-3.5 shrink-0",
                              transition,
                              active
                                ? "text-neutral-500"
                                : "text-neutral-300 dark:text-neutral-700",
                            )}
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-2 pl-5.5 text-[11px] text-neutral-500">
                          <span className="truncate">{o.meta}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{o.lead}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 pl-5.5">
                          <span
                            aria-hidden="true"
                            className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-700"
                          >
                            <span
                              className={cx(
                                "block h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
                                pace === "behind"
                                  ? "bg-amber-500"
                                  : "bg-neutral-900 dark:bg-neutral-100",
                              )}
                              style={{ width: mounted ? `${p}%` : "0%" }}
                            />
                          </span>
                          <span className="w-8 shrink-0 text-right text-[11px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                            {pct(p)}
                          </span>
                          <Icon
                            aria-hidden="true"
                            className={cx(
                              "h-3.5 w-3.5 shrink-0",
                              PACE_META[pace].tone,
                            )}
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                listEdges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                listEdges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
              <OverallIcon
                aria-hidden="true"
                className={cx("h-3.5 w-3.5", PACE_META[overallPace].tone)}
              />
              {PACE_META[overallPace].label} against the quarter
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div
            className={cx(
              panel,
              "flex min-h-0 flex-1 flex-col overflow-hidden",
            )}
          >
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {objective.name}
                </h2>
                <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                  {readout.label} ·{" "}
                  {Number.isNaN(readout.actual)
                    ? "not reached yet"
                    : `${pct(readout.actual)} done`}{" "}
                  · plan {pct(readout.plan)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-neutral-500">
                  <span className="h-1 w-4 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                  Actual
                </span>
                <span className="inline-flex items-center gap-1.5 text-neutral-500">
                  <span
                    aria-hidden="true"
                    className="h-0 w-4 border-t border-dashed border-neutral-400 dark:border-neutral-500"
                  />
                  Plan
                </span>
              </div>
            </div>

            <div
              ref={plotRef}
              role="application"
              tabIndex={0}
              aria-label={`Burn-up of ${objective.name} across ${WEEKS} weeks`}
              onPointerMove={onPlotMove}
              onPointerLeave={() => setCursor(null)}
              onKeyDown={onPlotKey}
              onBlur={() => setCursor(null)}
              className={cx("relative min-h-[172px] flex-1 p-3", focus)}
            >
              {geom && (
                <svg
                  width={width}
                  height={height}
                  className="overflow-visible"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        className="text-neutral-900 dark:text-neutral-100"
                        stopColor="currentColor"
                        stopOpacity="0.1"
                      />
                      <stop
                        offset="100%"
                        className="text-neutral-900 dark:text-neutral-100"
                        stopColor="currentColor"
                        stopOpacity="0"
                      />
                    </linearGradient>
                    <clipPath id={clipId}>
                      <rect
                        x={PAD.left}
                        y={PAD.top}
                        width={mounted ? innerW : 0}
                        height={innerH}
                        className="transition-[width] duration-700 ease-out motion-reduce:transition-none"
                      />
                    </clipPath>
                  </defs>

                  {[0, 25, 50, 75, 100].map((t) => (
                    <g key={t}>
                      <line
                        x1={PAD.left}
                        x2={width - PAD.right}
                        y1={geom.y(t)}
                        y2={geom.y(t)}
                        strokeWidth={1}
                        shapeRendering="crispEdges"
                        className="stroke-neutral-200/70 dark:stroke-neutral-800"
                      />
                      <text
                        x={PAD.left - 8}
                        y={geom.y(t)}
                        dy={3.5}
                        textAnchor="end"
                        className="fill-neutral-400 text-[11px] tabular-nums"
                      >
                        {t}%
                      </text>
                    </g>
                  ))}

                  <rect
                    x={geom.x(ELAPSED - 1)}
                    y={PAD.top}
                    width={Math.max(geom.x(WEEKS - 1) - geom.x(ELAPSED - 1), 0)}
                    height={innerH}
                    className="fill-neutral-100/60 dark:fill-neutral-800/40"
                  />

                  <path
                    d={geom.planLine}
                    fill="none"
                    strokeWidth={1.25}
                    strokeDasharray="4 4"
                    className="stroke-neutral-400 dark:stroke-neutral-500"
                  />

                  <g clipPath={`url(#${clipId})`}>
                    <path d={geom.actualArea} fill={`url(#${fillId})`} />
                    <path
                      d={geom.actualLine}
                      fill="none"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="stroke-neutral-900 dark:stroke-neutral-100"
                    />
                  </g>

                  <circle
                    cx={geom.x(ELAPSED - 1)}
                    cy={geom.y(series.end)}
                    r={3.5}
                    strokeWidth={2}
                    className="fill-white stroke-neutral-900 dark:fill-neutral-900 dark:stroke-neutral-100"
                  />

                  {WEEK_LABELS.map((w, i) =>
                    i % 2 === 0 ? (
                      <text
                        key={w}
                        x={geom.x(i)}
                        y={height - 2}
                        textAnchor={
                          i === 0 ? "start" : i === WEEKS - 1 ? "end" : "middle"
                        }
                        className="fill-neutral-400 text-[11px] tabular-nums"
                      >
                        {w}
                      </text>
                    ) : null,
                  )}

                  {cursor !== null && (
                    <line
                      x1={geom.x(cursor)}
                      x2={geom.x(cursor)}
                      y1={PAD.top}
                      y2={PAD.top + innerH}
                      strokeWidth={1}
                      shapeRendering="crispEdges"
                      className="stroke-neutral-300 dark:stroke-neutral-700"
                    />
                  )}
                </svg>
              )}
            </div>
          </div>

          <div className={cx(panel, "shrink-0 overflow-hidden")}>
            <div className="flex items-center justify-between gap-2 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
              <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Key results
              </h2>
              <span className="text-[11px] text-neutral-500">
                Start → target, current in bold
              </span>
            </div>
            <ul className="p-1.5">
              {objective.results.map((r) => {
                const p = progressOf(r);
                const pace = paceOf(p);
                const Icon = PACE_META[pace].Icon;
                return (
                  <li
                    key={r.id}
                    className={cx(
                      "flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] px-2.5 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                      transition,
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {r.owner}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                        {r.name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-1 max-w-[220px] flex-1 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-700"
                        >
                          <span
                            className={cx(
                              "block h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
                              pace === "behind"
                                ? "bg-amber-500"
                                : "bg-neutral-900 dark:bg-neutral-100",
                            )}
                            style={{ width: mounted ? `${p}%` : "0%" }}
                          />
                        </span>
                        <span className="text-[11px] tabular-nums text-neutral-500">
                          {formatValue(r, r.start)} →{" "}
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {formatValue(r, r.current)}
                          </span>{" "}
                          → {formatValue(r, r.target)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cx(
                        "inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium tabular-nums",
                        PACE_META[pace].tone,
                      )}
                    >
                      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                      {pct(p)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-2 bg-neutral-50 px-4 py-2.5 text-[11px] text-neutral-500 dark:bg-neutral-900/60">
              <CircleDot aria-hidden="true" className="h-3.5 w-3.5" />
              Pace compares progress with {pct(PACE)} of the quarter spent.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  ArrowRight,
  Boxes,
  ExternalLink,
  MessageSquare,
  Plug,
  Radio,
  Workflow,
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

const scale = (v: number, d0: number, d1: number, r0: number, r1: number) =>
  r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const compact = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(Math.abs(n) >= 10_000_000 ? 0 : 1)}M`
    : Math.abs(n) >= 1_000
      ? `${(n / 1_000).toFixed(Math.abs(n) >= 10_000 ? 0 : 1)}k`
      : `${n}`;

const grouped = (n: number) => n.toLocaleString("en-US");

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

const wave = (seed: number, i: number) =>
  Math.sin(i * 0.44 + seed) * 0.5 + Math.sin(i * 0.17 + seed * 1.6) * 0.36;

const DAYS = 28;

const DATES = Array.from({ length: DAYS }, (_, i) => {
  const day = 28 + i;
  return day > 31 ? `${day - 31} Sep` : `${day} Aug`;
});

type MetricKey =
  "calls" | "duration" | "credits" | "perCall" | "llm" | "avgLlm";

type MetricDef = {
  key: MetricKey;
  label: string;
  unit?: string;
  format: (n: number) => string;
  headline: (n: number) => string;
  series: number[];
};

const build = (seed: number, base: number, spread: number) =>
  Array.from({ length: DAYS }, (_, i) =>
    Math.round(base + wave(seed, i) * spread),
  );

const secondsText = (n: number) =>
  `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, "0")}`;

const METRICS: MetricDef[] = [
  {
    key: "calls",
    label: "Calls",
    format: grouped,
    headline: grouped,
    series: build(1.2, 77_000, 6_400),
  },
  {
    key: "duration",
    label: "Avg. duration",
    format: secondsText,
    headline: secondsText,
    series: build(3.4, 171, 22),
  },
  {
    key: "credits",
    label: "Total credits",
    unit: "credits",
    format: grouped,
    headline: grouped,
    series: build(5.1, 33_400, 4_800),
  },
  {
    key: "perCall",
    label: "Credits per call",
    unit: "credits",
    format: (n) => n.toFixed(2),
    headline: (n) => n.toFixed(2),
    series: build(7.6, 43, 7).map((n) => n / 10),
  },
  {
    key: "llm",
    label: "Total LLM cost",
    format: (n) => `$${grouped(n)}`,
    headline: (n) => `$${grouped(n)}`,
    series: build(9.3, 7_258, 980),
  },
  {
    key: "avgLlm",
    label: "Avg. LLM cost",
    format: (n) => `$${n.toFixed(2)}`,
    headline: (n) => `$${n.toFixed(2)}`,
    series: build(11.8, 258, 34).map((n) => n / 1),
  },
];

type Agent = { name: string; scope: string; calls: number };

const AGENTS: Agent[] = [
  { name: "Docs support", scope: "help.center", calls: 6424 },
  { name: "Website concierge", scope: "www", calls: 3942 },
  { name: "Billing triage", scope: "billing", calls: 1820 },
  { name: "Onboarding guide", scope: "app.setup", calls: 1194 },
  { name: "Store assistant", scope: "shop", calls: 1094 },
  { name: "Returns desk", scope: "shop.returns", calls: 812 },
  { name: "Outage responder", scope: "status", calls: 604 },
  { name: "Renewal outreach", scope: "crm", calls: 421 },
];

type Integration = {
  name: string;
  detail: string;
  Icon: typeof Plug;
  live: boolean;
};

const INTEGRATIONS: Integration[] = [
  {
    name: "Transcript store",
    detail: "Response traces and grading",
    Icon: MessageSquare,
    live: true,
  },
  {
    name: "Escalation channel",
    detail: "Handoff alerts to on-call",
    Icon: Radio,
    live: true,
  },
  {
    name: "Voice gateway",
    detail: "SIP routing and failover",
    Icon: Plug,
    live: true,
  },
  {
    name: "Workflow runner",
    detail: "Post-call actions and tickets",
    Icon: Workflow,
    live: false,
  },
  {
    name: "Knowledge index",
    detail: "Retrieval corpus sync",
    Icon: Boxes,
    live: false,
  },
];

const PAD = { top: 14, right: 1, bottom: 22, left: 40 };

export default function Dashboard10() {
  const uid = useId();
  const fillId = `${uid}-fill`;
  const clipId = `${uid}-clip`;

  const [metricKey, setMetricKey] = useState<MetricKey>("calls");
  const [cursor, setCursor] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [plotRef, plotSize] = useMeasure<HTMLDivElement>();
  const {
    ref: agentsRef,
    edges: agentEdges,
    onScroll: onAgentsScroll,
  } = useScrollFade<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];

  const width = plotSize.width;
  const height = plotSize.height;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = Math.max(height - PAD.top - PAD.bottom, 1);

  const stats = useMemo(() => {
    const s = metric.series;
    return {
      min: Math.min(...s),
      max: Math.max(...s),
      last: s[s.length - 1],
    };
  }, [metric]);

  const { base, top, ticks } = useMemo(() => {
    const span = stats.max - stats.min || stats.max || 1;
    const rough = Math.max(stats.max - stats.min, stats.max * 0.08);
    const mag = 10 ** Math.floor(Math.log10(rough / 4 || 1));
    const norm = rough / 4 / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
    const lo = Math.max(Math.floor((stats.min - span * 0.35) / step) * step, 0);
    const hi = Math.ceil((stats.max + span * 0.25) / step) * step;
    const out: number[] = [];
    for (let v = lo; v <= hi + step / 1000; v += step) out.push(v);
    return {
      base: lo,
      top: hi,
      ticks: out.length > 6 ? out.filter((_, i) => i % 2 === 0) : out,
    };
  }, [stats.max, stats.min]);

  const geom = useMemo(() => {
    if (width === 0) return null;
    const x = (i: number) =>
      PAD.left + scale(i, 0, metric.series.length - 1, 0, innerW);
    const y = (v: number) => PAD.top + innerH - scale(v, base, top, 0, innerH);

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
      stroke: l(metric.series) ?? "",
      fill: a(metric.series) ?? "",
    };
  }, [width, innerW, innerH, base, top, metric]);

  const xLabelStep = Math.ceil(DAYS / 7);

  const onPlotMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = plotRef.current;
    if (!el || innerW <= 0) return;
    const rect = el.getBoundingClientRect();
    const t = (e.clientX - rect.left - PAD.left) / innerW;
    setCursor(clamp(Math.round(t * (DAYS - 1)), 0, DAYS - 1));
  };

  const onPlotKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setCursor((c) => {
      const next = (c ?? DAYS - 1) + (e.key === "ArrowRight" ? 1 : -1);
      return clamp(next, 0, DAYS - 1);
    });
  };

  const maxCalls = Math.max(...AGENTS.map((a) => a.calls));
  const totalCalls = AGENTS.reduce((s, a) => s + a.calls, 0);
  const readout = cursor === null ? stats.last : metric.series[cursor];

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className={cx(panel, "flex shrink-0 flex-col overflow-hidden")}>
        <div
          role="tablist"
          aria-label="Metric"
          className="grid shrink-0 grid-cols-3 bg-neutral-50 md:grid-cols-6 dark:bg-neutral-900/60"
        >
          {METRICS.map((m) => {
            const selected = m.key === metricKey;
            const last = m.series[m.series.length - 1];
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setMetricKey(m.key);
                  setCursor(null);
                }}
                className={cx(
                  "relative cursor-pointer px-3.5 py-3 text-left",
                  selected
                    ? "bg-white dark:bg-neutral-900"
                    : "hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40",
                  transition,
                  focus,
                )}
              >
                <span
                  className={cx(
                    "block truncate text-[13px]",
                    selected
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-500",
                  )}
                >
                  {m.label}
                </span>
                <span className="mt-1 flex items-baseline gap-1">
                  <span
                    className={cx(
                      "truncate text-base font-medium tabular-nums",
                      selected
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-600 dark:text-neutral-400",
                    )}
                  >
                    {m.headline(last)}
                  </span>
                  {m.unit && (
                    <span className="shrink-0 text-[11px] text-neutral-500">
                      {m.unit}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute inset-x-0 bottom-0 h-[2px] bg-[var(--rb-accent,oklch(20.5%_0_0))] transition-opacity duration-150 ease-out motion-reduce:transition-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div className="flex shrink-0 items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] text-neutral-500">
                {cursor === null
                  ? `${metric.label} · last ${DAYS} days`
                  : `${metric.label} · ${DATES[cursor]}`}
              </p>
              <p className="mt-0.5 text-2xl font-medium tracking-[-0.02em] tabular-nums text-neutral-900 dark:text-neutral-100">
                {metric.format(readout)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <p className="text-[11px] tabular-nums text-neutral-500">
                Min{" "}
                <span className="text-neutral-900 dark:text-neutral-100">
                  {metric.format(stats.min)}
                </span>
                <span aria-hidden="true" className="mx-1.5">
                  ·
                </span>
                Max{" "}
                <span className="text-neutral-900 dark:text-neutral-100">
                  {metric.format(stats.max)}
                </span>
              </p>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                  transition,
                  focus,
                )}
              >
                Open report
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={plotRef}
            role="application"
            tabIndex={0}
            aria-label={`${metric.label} over the last ${DAYS} days`}
            onPointerMove={onPlotMove}
            onPointerLeave={() => setCursor(null)}
            onKeyDown={onPlotKey}
            onBlur={() => setCursor(null)}
            className={cx(
              "relative mt-3 h-[224px] shrink-0 rounded-[var(--rb-r-lg,10px)]",
              focus,
            )}
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

                {ticks.map((t) => (
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
                      x={0}
                      y={geom.y(t)}
                      dy={-4}
                      textAnchor="start"
                      className="fill-neutral-400 text-[11px] tabular-nums"
                    >
                      {metric.key === "duration"
                        ? secondsText(t)
                        : compact(Math.round(t * 100) / 100)}
                    </text>
                  </g>
                ))}

                <g clipPath={`url(#${clipId})`}>
                  <path d={geom.fill} fill={`url(#${fillId})`} />
                  <path
                    d={geom.stroke}
                    fill="none"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-neutral-900 dark:stroke-neutral-100"
                  />
                </g>

                {DATES.map((d, i) =>
                  i % xLabelStep === 0 ? (
                    <text
                      key={d}
                      x={geom.x(i)}
                      y={height - 4}
                      textAnchor={i === 0 ? "start" : "middle"}
                      className="fill-neutral-400 text-[11px] tabular-nums"
                    >
                      {d}
                    </text>
                  ) : null,
                )}

                {cursor !== null && (
                  <g>
                    <line
                      x1={geom.x(cursor)}
                      x2={geom.x(cursor)}
                      y1={PAD.top}
                      y2={PAD.top + innerH}
                      strokeWidth={1}
                      shapeRendering="crispEdges"
                      className="stroke-neutral-300 dark:stroke-neutral-700"
                    />
                    <circle
                      cx={geom.x(cursor)}
                      cy={geom.y(metric.series[cursor])}
                      r={4}
                      strokeWidth={2}
                      className="fill-white stroke-neutral-900 dark:fill-neutral-900 dark:stroke-neutral-100"
                    />
                  </g>
                )}
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={cx(panel, "flex min-h-0 flex-col overflow-hidden")}>
          <div className="flex shrink-0 items-center justify-between gap-3 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Busiest agents
              </h3>
              <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                Call volume · {grouped(totalCalls)} total
              </p>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              ref={agentsRef}
              onScroll={onAgentsScroll}
              className="h-full overflow-y-auto p-1.5"
            >
              <ul className="flex flex-col gap-1">
                {AGENTS.map((a, i) => (
                  <li
                    key={a.name}
                    className={cx(
                      "flex h-10 items-center gap-3 rounded-[var(--rb-r-lg,10px)] px-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                      transition,
                    )}
                  >
                    <span className="w-4 shrink-0 text-[11px] tabular-nums text-neutral-400 dark:text-neutral-600">
                      {i + 1}
                    </span>
                    <div className="relative min-w-0 flex-1">
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 transition-[width] duration-700 ease-out motion-reduce:transition-none dark:bg-neutral-800"
                        style={{
                          width: mounted
                            ? `${(a.calls / maxCalls) * 100}%`
                            : "0%",
                          transitionDelay: `${i * 30}ms`,
                        }}
                      />
                      <span className="relative flex items-baseline gap-1.5 px-2 py-1">
                        <span className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                          {a.name}
                        </span>
                        <span className="shrink-0 truncate font-mono text-[10px] text-neutral-400 dark:text-neutral-600">
                          {a.scope}
                        </span>
                      </span>
                    </div>
                    <span className="w-12 shrink-0 text-right text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                      {grouped(a.calls)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                agentEdges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                agentEdges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </div>

        <div className={cx(panel, "flex min-h-0 flex-col overflow-hidden")}>
          <div className="flex shrink-0 items-center justify-between gap-3 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Integrations
              </h3>
              <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                {INTEGRATIONS.filter((i) => i.live).length} of{" "}
                {INTEGRATIONS.length} connected
              </p>
            </div>
            <button
              type="button"
              className={cx(
                "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                transition,
                focus,
              )}
            >
              Manage
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            <ul className="flex flex-col gap-1">
              {INTEGRATIONS.map((it) => (
                <li
                  key={it.name}
                  className="flex h-[52px] items-center gap-3 rounded-[var(--rb-r-lg,10px)] px-2.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-neutral-100 dark:bg-neutral-800">
                    <it.Icon
                      aria-hidden="true"
                      className="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {it.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                      {it.detail}
                    </p>
                  </div>
                  {it.live ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={cx(
                        "inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                        transition,
                        focus,
                      )}
                    >
                      Connect
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

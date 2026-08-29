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
  ArrowUpRight,
  CircleCheck,
  CircleSlash,
  ExternalLink,
  GitBranch,
  RotateCcw,
  Search,
  Server,
  TriangleAlert,
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

const wave = (seed: number, i: number) =>
  Math.sin(i * 0.38 + seed) * 0.5 + Math.sin(i * 0.15 + seed * 1.7) * 0.32;

const POINTS = 40;

type Health = "healthy" | "watch" | "down";

type Service = {
  id: string;
  name: string;
  repo: string;
  region: string;
  health: Health;
  rps: number;
  p95: number;
  errorRate: number;
  saturation: number;
  version: string;
  deployedBy: string;
  deployedAt: string;
};

const SERVICES: Service[] = [
  {
    id: "s1",
    name: "Checkout API",
    repo: "core/checkout",
    region: "eu-west-1",
    health: "healthy",
    rps: 4820,
    p95: 118,
    errorRate: 0.14,
    saturation: 61,
    version: "v4.18.2",
    deployedBy: "Ines Halvorsen",
    deployedAt: "2h ago",
  },
  {
    id: "s2",
    name: "Ledger writer",
    repo: "core/ledger",
    region: "eu-west-1",
    health: "watch",
    rps: 1290,
    p95: 402,
    errorRate: 1.9,
    saturation: 88,
    version: "v2.7.0",
    deployedBy: "Dovid Aranyi",
    deployedAt: "26m ago",
  },
  {
    id: "s3",
    name: "Media pipeline",
    repo: "media/encode",
    region: "us-east-2",
    health: "healthy",
    rps: 640,
    p95: 1_140,
    errorRate: 0.32,
    saturation: 44,
    version: "v9.3.1",
    deployedBy: "Runa Petit",
    deployedAt: "1d ago",
  },
  {
    id: "s4",
    name: "Search index",
    repo: "search/index",
    region: "us-east-2",
    health: "healthy",
    rps: 3410,
    p95: 74,
    errorRate: 0.08,
    saturation: 52,
    version: "v1.22.9",
    deployedBy: "Marta Løken",
    deployedAt: "5h ago",
  },
  {
    id: "s5",
    name: "Webhook relay",
    repo: "core/relay",
    region: "ap-south-1",
    health: "down",
    rps: 210,
    p95: 2_960,
    errorRate: 14.6,
    saturation: 97,
    version: "v3.0.4",
    deployedBy: "Kwame Osei",
    deployedAt: "12m ago",
  },
  {
    id: "s6",
    name: "Identity gateway",
    repo: "core/identity",
    region: "eu-west-1",
    health: "healthy",
    rps: 5960,
    p95: 61,
    errorRate: 0.05,
    saturation: 39,
    version: "v6.11.0",
    deployedBy: "Ines Halvorsen",
    deployedAt: "3d ago",
  },
  {
    id: "s7",
    name: "Notification fan-out",
    repo: "growth/notify",
    region: "us-east-2",
    health: "watch",
    rps: 880,
    p95: 318,
    errorRate: 2.4,
    saturation: 79,
    version: "v5.2.3",
    deployedBy: "Priya Sundar",
    deployedAt: "8h ago",
  },
  {
    id: "s8",
    name: "Billing sync",
    repo: "core/billing",
    region: "eu-west-1",
    health: "healthy",
    rps: 430,
    p95: 205,
    errorRate: 0.21,
    saturation: 33,
    version: "v2.14.6",
    deployedBy: "Dovid Aranyi",
    deployedAt: "2d ago",
  },
  {
    id: "s9",
    name: "Asset CDN edge",
    repo: "media/edge",
    region: "global",
    health: "healthy",
    rps: 9_120,
    p95: 28,
    errorRate: 0.02,
    saturation: 47,
    version: "v11.0.1",
    deployedBy: "Marta Løken",
    deployedAt: "6d ago",
  },
];

const HEALTH_META: Record<
  Health,
  { label: string; dot: string; Icon: typeof CircleCheck; tone: string }
> = {
  healthy: {
    label: "Healthy",
    dot: "bg-neutral-300 dark:bg-neutral-600",
    Icon: CircleCheck,
    tone: "text-neutral-500",
  },
  watch: {
    label: "Degraded",
    dot: "bg-amber-500",
    Icon: TriangleAlert,
    tone: "text-amber-600 dark:text-amber-500",
  },
  down: {
    label: "Failing",
    dot: "bg-red-500",
    Icon: CircleSlash,
    tone: "text-red-600 dark:text-red-500",
  },
};

type Event = { id: string; text: string; meta: string; kind: Health };

const EVENTS: Record<string, Event[]> = {
  s1: [
    {
      id: "e1",
      text: "Rolled v4.18.2 to 100% of eu-west-1",
      meta: "2h ago · deploy",
      kind: "healthy",
    },
    {
      id: "e2",
      text: "Canary held for 14 minutes, no regression",
      meta: "2h ago · canary",
      kind: "healthy",
    },
    {
      id: "e3",
      text: "Card token cache warmed after restart",
      meta: "5h ago · runtime",
      kind: "healthy",
    },
    {
      id: "e4",
      text: "p95 crossed 200ms for 3 minutes",
      meta: "9h ago · latency",
      kind: "watch",
    },
  ],
  s2: [
    {
      id: "e1",
      text: "Write queue depth above threshold",
      meta: "26m ago · saturation",
      kind: "watch",
    },
    {
      id: "e2",
      text: "Shipped v2.7.0 with batched commits",
      meta: "26m ago · deploy",
      kind: "healthy",
    },
    {
      id: "e3",
      text: "Replica lag peaked at 4.2s",
      meta: "1h ago · database",
      kind: "watch",
    },
    {
      id: "e4",
      text: "Nightly reconciliation finished clean",
      meta: "7h ago · job",
      kind: "healthy",
    },
  ],
  s3: [
    {
      id: "e1",
      text: "Encoder pool scaled to 24 workers",
      meta: "40m ago · autoscale",
      kind: "healthy",
    },
    {
      id: "e2",
      text: "Long-form transcode backlog cleared",
      meta: "3h ago · queue",
      kind: "healthy",
    },
    {
      id: "e3",
      text: "Two jobs retried after codec timeout",
      meta: "6h ago · retry",
      kind: "watch",
    },
  ],
  s4: [
    {
      id: "e1",
      text: "Reindexed 1.4M documents",
      meta: "5h ago · job",
      kind: "healthy",
    },
    {
      id: "e2",
      text: "Query cache hit rate settled at 94%",
      meta: "5h ago · runtime",
      kind: "healthy",
    },
    {
      id: "e3",
      text: "Shard rebalance completed",
      meta: "1d ago · cluster",
      kind: "healthy",
    },
  ],
  s5: [
    {
      id: "e1",
      text: "Outbound deliveries failing at the edge",
      meta: "12m ago · incident",
      kind: "down",
    },
    {
      id: "e2",
      text: "Retry budget exhausted for 3 tenants",
      meta: "18m ago · retry",
      kind: "down",
    },
    {
      id: "e3",
      text: "Deployed v3.0.4 with new signing key",
      meta: "22m ago · deploy",
      kind: "watch",
    },
    {
      id: "e4",
      text: "Paged the on-call responder",
      meta: "24m ago · alert",
      kind: "down",
    },
  ],
  s6: [
    {
      id: "e1",
      text: "Token issuance steady across regions",
      meta: "1h ago · runtime",
      kind: "healthy",
    },
    {
      id: "e2",
      text: "Rotated signing keys without downtime",
      meta: "3d ago · security",
      kind: "healthy",
    },
    {
      id: "e3",
      text: "Session store compacted",
      meta: "3d ago · job",
      kind: "healthy",
    },
  ],
  s7: [
    {
      id: "e1",
      text: "Provider throttled push delivery",
      meta: "35m ago · upstream",
      kind: "watch",
    },
    {
      id: "e2",
      text: "Digest batch delayed by 6 minutes",
      meta: "2h ago · queue",
      kind: "watch",
    },
    {
      id: "e3",
      text: "Template cache invalidated",
      meta: "8h ago · deploy",
      kind: "healthy",
    },
  ],
  s8: [
    {
      id: "e1",
      text: "Invoice sync matched 4,182 records",
      meta: "1h ago · job",
      kind: "healthy",
    },
    {
      id: "e2",
      text: "Dunning retries paused for review",
      meta: "1d ago · policy",
      kind: "healthy",
    },
    {
      id: "e3",
      text: "Currency table refreshed",
      meta: "2d ago · job",
      kind: "healthy",
    },
  ],
  s9: [
    {
      id: "e1",
      text: "Purged 82GB of stale objects",
      meta: "4h ago · cache",
      kind: "healthy",
    },
    {
      id: "e2",
      text: "Origin shield hit rate at 99.1%",
      meta: "4h ago · runtime",
      kind: "healthy",
    },
    {
      id: "e3",
      text: "Added two edge locations",
      meta: "6d ago · network",
      kind: "healthy",
    },
  ],
};

const seriesFor = (s: Service) => {
  const seed = s.id.charCodeAt(1) * 0.9;
  const spread = s.health === "down" ? 0.55 : s.health === "watch" ? 0.3 : 0.16;
  return Array.from({ length: POINTS }, (_, i) =>
    Math.max(s.rps * (1 + wave(seed, i) * spread), s.rps * 0.25),
  );
};

const compact = (n: number) =>
  n >= 1_000
    ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`
    : `${Math.round(n)}`;

function Sparkline({ values, tone }: { values: number[]; tone: string }) {
  const w = 60;
  const h = 20;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const d = useMemo(
    () =>
      line<number>()
        .x((_, i) => scale(i, 0, values.length - 1, 0.75, w - 0.75))
        .y((v) => scale(v, min, max, h - 1.5, 1.5))
        .curve(curveMonotoneX)(values) ?? "",
    [values, min, max],
  );

  return (
    <svg width={w} height={h} aria-hidden="true" className="shrink-0">
      <path
        d={d}
        fill="none"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={tone}
      />
    </svg>
  );
}

const PAD = { top: 12, right: 8, bottom: 20, left: 36 };

export default function Dashboard14() {
  const uid = useId();
  const fillId = `${uid}-fill`;
  const clipId = `${uid}-clip`;

  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(SERVICES[1].id);
  const [cursor, setCursor] = useState<number | null>(null);
  const [plotRef, plotSize] = useMeasure<HTMLDivElement>();
  const {
    ref: listRef,
    edges: listEdges,
    onScroll: onListScroll,
  } = useScrollFade<HTMLDivElement>();
  const {
    ref: eventRef,
    edges: eventEdges,
    onScroll: onEventScroll,
  } = useScrollFade<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SERVICES;
    return SERVICES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.repo.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q),
    );
  }, [query]);

  const service = SERVICES.find((s) => s.id === selected) ?? SERVICES[0];
  const values = useMemo(() => seriesFor(service), [service]);
  const events = EVENTS[service.id] ?? [];

  const width = plotSize.width;
  const height = plotSize.height;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = Math.max(height - PAD.top - PAD.bottom, 1);
  const top = useMemo(() => {
    const raw = (Math.max(...values) * 1.12) / 2;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const norm = raw / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
    return Math.ceil((Math.max(...values) * 1.12) / step) * step;
  }, [values]);

  const geom = useMemo(() => {
    if (width === 0) return null;
    const x = (i: number) => PAD.left + scale(i, 0, POINTS - 1, 0, innerW);
    const y = (v: number) => PAD.top + innerH - scale(v, 0, top, 0, innerH);

    return {
      x,
      y,
      linePath:
        line<number>()
          .x((_, i) => x(i))
          .y((v) => y(v))
          .curve(curveMonotoneX)(values) ?? "",
      areaPath:
        area<number>()
          .x((_, i) => x(i))
          .y0(PAD.top + innerH)
          .y1((v) => y(v))
          .curve(curveMonotoneX)(values) ?? "",
    };
  }, [width, innerW, innerH, top, values]);

  const onPlotMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = plotRef.current;
    if (!el || innerW <= 0) return;
    const rect = el.getBoundingClientRect();
    const t = (e.clientX - rect.left - PAD.left) / innerW;
    setCursor(clamp(Math.round(t * (POINTS - 1)), 0, POINTS - 1));
  };

  const onPlotKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setCursor((c) => {
      const next = (c ?? POINTS - 1) + (e.key === "ArrowRight" ? 1 : -1);
      return clamp(next, 0, POINTS - 1);
    });
  };

  const shown = cursor === null ? values[POINTS - 1] : values[cursor];
  const meta = HEALTH_META[service.health];
  const MetaIcon = meta.Icon;

  const stats = [
    { label: "Requests", value: `${compact(service.rps)}/s` },
    { label: "p95 latency", value: `${service.p95.toLocaleString("en-US")}ms` },
    {
      label: "Error rate",
      value: `${service.errorRate}%`,
      tone:
        service.errorRate >= 5
          ? "text-red-600 dark:text-red-500"
          : service.errorRate >= 1
            ? "text-amber-600 dark:text-amber-500"
            : undefined,
    },
    { label: "Saturation", value: `${service.saturation}%` },
  ];

  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Server
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
          />
          <h1 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Service health
          </h1>
          <span className="shrink-0 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 py-0.5 text-[11px] tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {SERVICES.length}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 text-[11px] text-neutral-500 sm:inline-flex">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400"
            />
            Live · 5s
          </span>
          <button
            type="button"
            className={cx(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
              transition,
              focus,
            )}
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-[320px_minmax(0,1fr)] sm:px-6 sm:pb-6">
        <div className={cx(panel, "flex min-h-0 flex-col overflow-hidden")}>
          <div className="shrink-0 p-2">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter services"
                aria-label="Filter services"
                className={cx(
                  "h-9 w-full rounded-[var(--rb-r-lg,10px)] bg-neutral-100 pr-2.5 pl-8 text-[13px] text-neutral-900 placeholder:text-neutral-500 dark:bg-neutral-800 dark:text-neutral-100",
                  focus,
                )}
              />
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              ref={listRef}
              onScroll={onListScroll}
              className="h-full overflow-y-auto px-1.5 pb-1.5"
            >
              {filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <Search
                    aria-hidden="true"
                    className="h-5 w-5 text-neutral-300 dark:text-neutral-600"
                  />
                  <p className="mt-2 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    No services match
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    Try a repo path or a region.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {filtered.map((s) => {
                    const active = s.id === selected;
                    const m = HEALTH_META[s.health];
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          aria-current={active ? "true" : undefined}
                          onClick={() => {
                            setSelected(s.id);
                            setCursor(null);
                          }}
                          className={cx(
                            "flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-lg,10px)] px-2.5 py-2.5 text-left",
                            transition,
                            focus,
                            active
                              ? "bg-neutral-100 dark:bg-neutral-800"
                              : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cx(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              m.dot,
                              s.health === "down" && "animate-pulse",
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                              {s.name}
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[10px] text-neutral-500">
                              {s.repo} · {s.region}
                            </span>
                          </span>
                          <Sparkline
                            values={seriesFor(s)}
                            tone={
                              s.health === "down"
                                ? "stroke-red-500"
                                : s.health === "watch"
                                  ? "stroke-amber-500"
                                  : "stroke-neutral-400 dark:stroke-neutral-500"
                            }
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
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
        </div>

        <div className={cx(panel, "flex min-h-0 flex-col overflow-hidden")}>
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {service.name}
                </h2>
                <span
                  className={cx(
                    "inline-flex shrink-0 items-center gap-1 text-[11px] font-medium",
                    meta.tone,
                  )}
                >
                  <MetaIcon aria-hidden="true" className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-500">
                <span className="inline-flex items-center gap-1 font-mono">
                  <GitBranch aria-hidden="true" className="h-3 w-3" />
                  {service.repo}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{service.version}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {service.deployedBy}, {service.deployedAt}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                  transition,
                  focus,
                )}
              >
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                Logs
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-2.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                  transition,
                  focus,
                )}
              >
                Roll back
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-1.5 p-1.5 md:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/50"
              >
                <dt className="truncate text-[11px] text-neutral-500">
                  {s.label}
                </dt>
                <dd
                  className={cx(
                    "mt-1 text-base font-medium tracking-[-0.01em] tabular-nums text-neutral-900 dark:text-neutral-100",
                    s.tone,
                  )}
                >
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex min-h-0 flex-1 flex-col px-1.5">
            <div className="flex shrink-0 items-baseline justify-between gap-2 px-2.5 pt-1 pb-1.5">
              <h3 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                Throughput
              </h3>
              <span className="text-[11px] tabular-nums text-neutral-500">
                {cursor === null
                  ? "last 40 min"
                  : `t−${POINTS - 1 - cursor} min`}{" "}
                ·{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {compact(shown)}/s
                </span>
              </span>
            </div>
            <div
              ref={plotRef}
              role="application"
              tabIndex={0}
              aria-label={`Throughput for ${service.name} over the last 40 minutes`}
              onPointerMove={onPlotMove}
              onPointerLeave={() => setCursor(null)}
              onKeyDown={onPlotKey}
              onBlur={() => setCursor(null)}
              className={cx(
                "relative min-h-[130px] flex-1 rounded-[var(--rb-r-lg,10px)] px-1 pb-1",
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

                  {[0, 0.5, 1].map((f) => (
                    <g key={f}>
                      <line
                        x1={PAD.left}
                        x2={width - PAD.right}
                        y1={geom.y(top * f)}
                        y2={geom.y(top * f)}
                        strokeWidth={1}
                        shapeRendering="crispEdges"
                        className="stroke-neutral-200/70 dark:stroke-neutral-800"
                      />
                      <text
                        x={0}
                        y={geom.y(top * f)}
                        dy={-4}
                        textAnchor="start"
                        className="fill-neutral-400 text-[11px] tabular-nums"
                      >
                        {compact(top * f)}
                      </text>
                    </g>
                  ))}

                  <g clipPath={`url(#${clipId})`}>
                    <path d={geom.areaPath} fill={`url(#${fillId})`} />
                    <path
                      d={geom.linePath}
                      fill="none"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="stroke-neutral-900 dark:stroke-neutral-100"
                    />
                  </g>

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
                        cy={geom.y(values[cursor])}
                        r={3.5}
                        strokeWidth={2}
                        className="fill-white stroke-neutral-900 dark:fill-neutral-900 dark:stroke-neutral-100"
                      />
                    </g>
                  )}
                </svg>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <h3 className="shrink-0 px-4 pt-2.5 pb-1.5 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Recent activity
            </h3>
            <div className="relative min-h-0 flex-1">
              <div
                ref={eventRef}
                onScroll={onEventScroll}
                className="h-full overflow-y-auto px-1.5 pb-1.5"
              >
                <ul className="flex flex-col">
                  {events.map((e) => (
                    <li
                      key={e.id}
                      className={cx(
                        "flex items-start gap-2.5 rounded-[var(--rb-r-lg,10px)] px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                        transition,
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx(
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          HEALTH_META[e.kind].dot,
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                          {e.text}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-neutral-500">
                          {e.meta}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                  eventEdges.start ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                  eventEdges.end ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  ArrowUpDown,
  ChevronDown,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
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

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

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
  Math.sin(i * 0.82 + seed) * 0.5 + Math.sin(i * 0.29 + seed * 1.9) * 0.34;

type Metric = {
  label: string;
  scope: string;
  value: string;
  delta: number;
  series: number[];
};

const METRICS: Metric[] = [
  {
    label: "Net revenue",
    scope: "atlas.dev · 28 days",
    value: "$6.2k",
    delta: 12.4,
    series: Array.from({ length: 28 }, (_, i) =>
      clamp(58 + wave(1.4, i) * 34, 8, 100),
    ),
  },
  {
    label: "Signups",
    scope: "All channels · 28 days",
    value: grouped(4238),
    delta: 6.1,
    series: Array.from({ length: 28 }, (_, i) =>
      clamp(54 + wave(4.1, i) * 38, 8, 100),
    ),
  },
  {
    label: "Active licenses",
    scope: "Atlas Cloud · 28 days",
    value: grouped(1907),
    delta: -2.3,
    series: Array.from({ length: 28 }, (_, i) =>
      clamp(62 + wave(7.7, i) * 30, 8, 100),
    ),
  },
];

type Stage = "progress" | "planned" | "backlog" | "blocked";

const STAGE_WORD: Record<Stage, string> = {
  progress: "In progress",
  planned: "Planned",
  backlog: "Backlog",
  blocked: "Blocked",
};

const STAGE_DOT: Record<Stage, string> = {
  progress: "bg-neutral-400 dark:bg-neutral-500",
  planned: "bg-neutral-300 dark:bg-neutral-600",
  backlog: "bg-neutral-300 dark:bg-neutral-600",
  blocked: "bg-amber-500",
};

type Module = {
  id: string;
  name: string;
  kind: "System" | "Feature" | "Area";
  owner: string;
  host: string;
  done: number;
  total: number;
  start: string;
  end: string;
  window: number;
  stage: Stage;
  starred: boolean;
};

const MODULES: Module[] = [
  {
    id: "m1",
    name: "Access Matrix",
    kind: "System",
    owner: "Nora Vale",
    host: "admin.atlas.dev",
    done: 11,
    total: 26,
    start: "Apr 22",
    end: "May 06",
    window: 14,
    stage: "progress",
    starred: true,
  },
  {
    id: "m2",
    name: "API Console",
    kind: "Feature",
    owner: "Lena Wade",
    host: "api.atlas.dev",
    done: 29,
    total: 32,
    start: "Apr 12",
    end: "Apr 26",
    window: 14,
    stage: "progress",
    starred: true,
  },
  {
    id: "m3",
    name: "Block Library",
    kind: "Feature",
    owner: "Sofia Romero",
    host: "blocks.atlas.dev",
    done: 10,
    total: 30,
    start: "Apr 24",
    end: "May 10",
    window: 16,
    stage: "planned",
    starred: false,
  },
  {
    id: "m4",
    name: "Data Retention",
    kind: "System",
    owner: "Kenji Tan",
    host: "privacy.atlas.dev",
    done: 7,
    total: 32,
    start: "Apr 27",
    end: "May 14",
    window: 17,
    stage: "backlog",
    starred: false,
  },
  {
    id: "m5",
    name: "Docs Portal",
    kind: "Area",
    owner: "Nina Santos",
    host: "docs.atlas.dev",
    done: 2,
    total: 14,
    start: "Apr 21",
    end: "May 05",
    window: 14,
    stage: "blocked",
    starred: false,
  },
  {
    id: "m6",
    name: "Help Center",
    kind: "Area",
    owner: "Sofia Romero",
    host: "help.atlas.dev",
    done: 9,
    total: 23,
    start: "Apr 23",
    end: "May 11",
    window: 18,
    stage: "planned",
    starred: false,
  },
  {
    id: "m7",
    name: "Identity Broker",
    kind: "System",
    owner: "Kenji Tan",
    host: "id.atlas.dev",
    done: 24,
    total: 27,
    start: "Apr 08",
    end: "Apr 25",
    window: 17,
    stage: "progress",
    starred: false,
  },
  {
    id: "m8",
    name: "Ledger Export",
    kind: "Feature",
    owner: "Marco Bianchi",
    host: "billing.atlas.dev",
    done: 5,
    total: 21,
    start: "Apr 29",
    end: "May 19",
    window: 20,
    stage: "backlog",
    starred: false,
  },
  {
    id: "m9",
    name: "Notification Hub",
    kind: "Feature",
    owner: "Lena Wade",
    host: "notify.atlas.dev",
    done: 18,
    total: 24,
    start: "Apr 15",
    end: "Apr 30",
    window: 15,
    stage: "progress",
    starred: true,
  },
  {
    id: "m10",
    name: "Search Index",
    kind: "System",
    owner: "Nora Vale",
    host: "search.atlas.dev",
    done: 13,
    total: 19,
    start: "Apr 18",
    end: "May 02",
    window: 14,
    stage: "progress",
    starred: false,
  },
  {
    id: "m11",
    name: "Usage Meter",
    kind: "Feature",
    owner: "Marco Bianchi",
    host: "meter.atlas.dev",
    done: 3,
    total: 18,
    start: "May 02",
    end: "May 22",
    window: 20,
    stage: "planned",
    starred: false,
  },
  {
    id: "m12",
    name: "Webhook Relay",
    kind: "System",
    owner: "Nina Santos",
    host: "hooks.atlas.dev",
    done: 16,
    total: 20,
    start: "Apr 11",
    end: "Apr 28",
    window: 17,
    stage: "progress",
    starred: false,
  },
];

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

type SortKey = "progress" | "name" | "window" | "stage";

const STAGE_ORDER: Record<Stage, number> = {
  blocked: 0,
  progress: 1,
  planned: 2,
  backlog: 3,
};

const SPARK_W = 132;
const SPARK_H = 40;

function Sparkline({ series }: { series: number[] }) {
  const uid = useId();
  const fillId = `${uid}-fill`;

  const { stroke, fill } = useMemo(() => {
    const max = Math.max(...series);
    const min = Math.min(...series);
    const x = (i: number) => (i / (series.length - 1)) * (SPARK_W - 2) + 1;
    const y = (v: number) =>
      SPARK_H - 3 - ((v - min) / (max - min || 1)) * (SPARK_H - 8);

    const l = line<number>()
      .x((_, i) => x(i))
      .y((v) => y(v))
      .curve(curveMonotoneX);
    const a = area<number>()
      .x((_, i) => x(i))
      .y0(SPARK_H)
      .y1((v) => y(v))
      .curve(curveMonotoneX);

    return { stroke: l(series) ?? "", fill: a(series) ?? "" };
  }, [series]);

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      className="h-10 w-full overflow-visible"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            className="text-neutral-900 dark:text-neutral-100"
            stopColor="currentColor"
            stopOpacity="0.12"
          />
          <stop
            offset="100%"
            className="text-neutral-900 dark:text-neutral-100"
            stopColor="currentColor"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${fillId})`} />
      <path
        d={stroke}
        fill="none"
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-neutral-900 dark:stroke-neutral-100"
      />
    </svg>
  );
}

const RING = 34;
const RING_R = 14;
const RING_C = 2 * Math.PI * RING_R;

function ProgressRing({ pct, mounted }: { pct: number; mounted: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width={RING}
      height={RING}
      viewBox={`0 0 ${RING} ${RING}`}
      className="shrink-0 -rotate-90"
    >
      <circle
        cx={RING / 2}
        cy={RING / 2}
        r={RING_R}
        fill="none"
        strokeWidth={3}
        className="stroke-neutral-200 dark:stroke-neutral-800"
      />
      <circle
        cx={RING / 2}
        cy={RING / 2}
        r={RING_R}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={RING_C}
        strokeDashoffset={
          mounted ? RING_C - (clamp(pct, 0, 100) / 100) * RING_C : RING_C
        }
        className="stroke-neutral-900 transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none dark:stroke-neutral-100"
      />
    </svg>
  );
}

export default function Dashboard8() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [asc, setAsc] = useState(true);
  const [starred, setStarred] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MODULES.map((m) => [m.id, m.starred])),
  );
  const [menu, setMenu] = useState<string | null>(null);
  const { ref: bodyRef, edges, onScroll } = useScrollFade<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!menu) return;
    const doc = rootRef.current?.ownerDocument;
    if (!doc) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest("[data-row-menu]")) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    doc.addEventListener("pointerdown", onDown);
    doc.addEventListener("keydown", onKey);
    return () => {
      doc.removeEventListener("pointerdown", onDown);
      doc.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = MODULES.filter(
      (m) =>
        q === "" ||
        m.name.toLowerCase().includes(q) ||
        m.owner.toLowerCase().includes(q) ||
        m.host.toLowerCase().includes(q),
    );
    const dir = asc ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort === "progress")
        return (a.done / a.total - b.done / b.total) * dir;
      if (sort === "window") return (a.window - b.window) * dir;
      if (sort === "stage")
        return (STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
  }, [query, sort, asc]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) setAsc((v) => !v);
    else {
      setSort(key);
      setAsc(true);
    }
  };

  const headCell = (key: SortKey, label: string, className?: string) => (
    <th
      scope="col"
      className={cx("px-3 py-0 text-left font-normal", className)}
    >
      <button
        type="button"
        onClick={() => toggleSort(key)}
        aria-label={`Sort by ${label.toLowerCase()}`}
        className={cx(
          "-mx-1.5 inline-flex h-7 cursor-pointer items-center gap-1 rounded-[var(--rb-r-sm,6px)] px-1.5 text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
          sort === key && "text-neutral-900 dark:text-neutral-100",
          transition,
          focus,
        )}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={cx(
            "h-3.5 w-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none",
            sort === key
              ? asc
                ? "rotate-180 opacity-100"
                : "opacity-100"
              : "opacity-0",
          )}
        />
      </button>
    </th>
  );

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li>
              <a
                href="#"
                className={cx(
                  "rounded-[var(--rb-r-sm,6px)] px-1 py-0.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                Home
              </a>
            </li>
            <li
              aria-hidden="true"
              className="text-neutral-300 dark:text-neutral-700"
            >
              /
            </li>
            <li className="truncate font-medium text-neutral-900 dark:text-neutral-100">
              Atlas
            </li>
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center sm:flex">
            {["Nora Vale", "Lena Wade", "Kenji Tan"].map((name, i) => (
              <span
                key={name}
                title={name}
                className={cx(
                  "flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 ring-2 ring-white dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-950",
                  i > 0 && "-ml-1.5",
                )}
              >
                {initials(name)}
              </span>
            ))}
            <span className="-ml-1 flex h-7 items-center rounded-full bg-neutral-100 px-2 text-[10px] font-medium tabular-nums text-neutral-600 ring-2 ring-white dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-950">
              +8
            </span>
          </div>

          <button
            type="button"
            className={cx(
              "hidden h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 sm:inline-flex dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
              transition,
              focus,
            )}
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Invite
          </button>
          <button
            type="button"
            className={cx(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-2.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
              transition,
              focus,
            )}
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Add module
          </button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-1 gap-3 px-4 pb-5 sm:grid-cols-3 sm:px-6">
        {METRICS.map((m) => (
          <div key={m.label} className={cx(panel, "p-4")}>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                {m.label}
              </h3>
              <span
                className={cx(
                  "shrink-0 text-[11px] tabular-nums",
                  m.delta >= 0
                    ? "text-neutral-500"
                    : "text-red-600 dark:text-red-500",
                )}
              >
                {m.delta >= 0 ? "+" : "−"}
                {Math.abs(m.delta).toFixed(1)}%
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-[11px] text-neutral-500">
                  {m.scope}
                </p>
                <p className="mt-1 text-2xl font-medium tracking-[-0.02em] tabular-nums text-neutral-900 dark:text-neutral-100">
                  {m.value}
                </p>
              </div>
              <div className="w-[132px] shrink-0">
                <Sparkline series={m.series} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6">
        <div
          className={cx(panel, "flex min-h-0 flex-1 flex-col overflow-hidden")}
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-neutral-50 px-3 py-3 dark:bg-neutral-900/60">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Modules
              </h2>
              <span className="shrink-0 rounded-[var(--rb-r-sm,6px)] bg-neutral-200/70 px-1.5 py-0.5 text-[11px] tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {rows.length}
              </span>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              <div className="relative w-full max-w-[260px] min-w-[140px]">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search modules"
                  aria-label="Search modules"
                  className={cx(
                    "h-8 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pr-2.5 pl-8 text-[13px] text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white",
                    transition,
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => setAsc((v) => !v)}
                className={cx(
                  "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                  transition,
                  focus,
                )}
              >
                <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {asc ? "Ascending" : "Descending"}
                </span>
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                  transition,
                  focus,
                )}
              >
                <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              ref={bodyRef}
              onScroll={onScroll}
              className="h-full overflow-y-auto"
            >
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-white dark:bg-neutral-900">
                  <tr className="h-9">
                    {headCell("progress", "Progress", "w-[190px]")}
                    {headCell("name", "Module")}
                    {headCell(
                      "window",
                      "Window",
                      "hidden md:table-cell w-[190px]",
                    )}
                    {headCell(
                      "stage",
                      "Status",
                      "hidden sm:table-cell w-[150px]",
                    )}
                    <th
                      scope="col"
                      className="w-[112px] px-3 py-0 text-right text-[13px] font-normal text-neutral-500"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => {
                    const pct = Math.round((m.done / m.total) * 100);
                    return (
                      <tr
                        key={m.id}
                        className={cx(
                          "group h-[68px] hover:bg-neutral-50 dark:hover:bg-neutral-800/40",
                          transition,
                        )}
                      >
                        <td className="px-3 align-middle">
                          <div className="flex items-center gap-2.5">
                            <ProgressRing pct={pct} mounted={mounted} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                                {pct}% ready
                              </p>
                              <p className="mt-0.5 text-[11px] tabular-nums text-neutral-500">
                                {m.done}/{m.total} tasks
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 align-middle">
                          <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                            {m.name}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                            <span className="shrink-0">{m.kind}</span>
                            <span
                              aria-hidden="true"
                              className="text-neutral-300 dark:text-neutral-700"
                            >
                              ·
                            </span>
                            <span
                              aria-hidden="true"
                              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[8px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                            >
                              {initials(m.owner)}
                            </span>
                            <span className="truncate">{m.owner}</span>
                            <span
                              aria-hidden="true"
                              className="hidden shrink-0 text-neutral-300 lg:inline dark:text-neutral-700"
                            >
                              ·
                            </span>
                            <span className="hidden truncate font-mono text-[10px] lg:inline">
                              {m.host}
                            </span>
                          </div>
                        </td>

                        <td className="hidden px-3 align-middle md:table-cell">
                          <p className="text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                            {m.start} – {m.end}
                          </p>
                          <p className="mt-0.5 text-[11px] tabular-nums text-neutral-500">
                            {m.window}-day window
                          </p>
                        </td>

                        <td className="hidden px-3 align-middle sm:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                            <span
                              className={cx(
                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                STAGE_DOT[m.stage],
                                m.stage === "progress" &&
                                  "animate-pulse motion-reduce:animate-none",
                              )}
                            />
                            {STAGE_WORD[m.stage]}
                          </span>
                        </td>

                        <td className="px-3 align-middle">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              aria-label={`Open ${m.name} spec`}
                              className={cx(
                                "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                                transition,
                                focus,
                              )}
                            >
                              <FileText
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                            </button>
                            <button
                              type="button"
                              aria-label={`${starred[m.id] ? "Unstar" : "Star"} ${m.name}`}
                              aria-pressed={starred[m.id]}
                              onClick={() =>
                                setStarred((s) => ({ ...s, [m.id]: !s[m.id] }))
                              }
                              className={cx(
                                "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] hover:bg-neutral-100 dark:hover:bg-neutral-800",
                                starred[m.id]
                                  ? "text-neutral-600 dark:text-neutral-300"
                                  : "text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100",
                                transition,
                                focus,
                              )}
                            >
                              <Star
                                aria-hidden="true"
                                className={cx(
                                  "h-3.5 w-3.5",
                                  starred[m.id] && "fill-current",
                                )}
                              />
                            </button>
                            <div className="relative" data-row-menu>
                              <button
                                type="button"
                                aria-label={`More actions for ${m.name}`}
                                aria-haspopup="menu"
                                aria-expanded={menu === m.id}
                                onClick={() =>
                                  setMenu((v) => (v === m.id ? null : m.id))
                                }
                                className={cx(
                                  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                                  menu === m.id &&
                                    "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
                                  transition,
                                  focus,
                                )}
                              >
                                <MoreHorizontal
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5"
                                />
                              </button>
                              {menu === m.id && (
                                <div
                                  role="menu"
                                  aria-label={`${m.name} actions`}
                                  className="absolute top-full right-0 z-30 mt-1 w-[168px] rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                  {[
                                    "Rename module",
                                    "Duplicate",
                                    "Move to area",
                                    "Archive",
                                  ].map((item) => (
                                    <button
                                      key={item}
                                      type="button"
                                      role="menuitem"
                                      onClick={() => setMenu(null)}
                                      className={cx(
                                        "flex h-8 w-full cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2 text-left text-[13px] text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                                        transition,
                                        focus,
                                      )}
                                    >
                                      {item}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {rows.length === 0 && (
                <div className="flex h-[280px] flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    No modules match “{query}”
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    Try a module name, an owner, or a hostname.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className={cx(
                      "mt-4 inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                      transition,
                      focus,
                    )}
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 top-9 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                edges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                edges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

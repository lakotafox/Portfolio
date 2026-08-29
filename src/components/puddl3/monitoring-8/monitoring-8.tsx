"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

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

const BUCKETS = [
  "0–50",
  "50–100",
  "100–200",
  "200–300",
  "300–500",
  "500–800",
  "0.8–1.2s",
  "1.2–2s",
  "2–4s",
  "4s+",
];

type Endpoint = {
  id: string;
  route: string;
  method: "GET" | "POST" | "PUT";
  rps: number;
  p50: number;
  p90: number;
  p99: number;
  errorRate: number;
  budget: number;
  shape: number[];
};

const ENDPOINTS: Endpoint[] = [
  {
    id: "e1",
    route: "/v2/checkout",
    method: "POST",
    rps: 184,
    p50: 412,
    p90: 1180,
    p99: 8420,
    errorRate: 2.4,
    budget: 2000,
    shape: [2, 6, 14, 22, 26, 18, 12, 9, 7, 6],
  },
  {
    id: "e2",
    route: "/v2/orders",
    method: "GET",
    rps: 942,
    p50: 42,
    p90: 96,
    p99: 214,
    errorRate: 0.1,
    budget: 500,
    shape: [48, 32, 18, 9, 5, 3, 1, 1, 0, 0],
  },
  {
    id: "e3",
    route: "/v2/search",
    method: "GET",
    rps: 618,
    p50: 128,
    p90: 384,
    p99: 1240,
    errorRate: 0.4,
    budget: 1000,
    shape: [12, 26, 34, 22, 14, 9, 6, 4, 2, 1],
  },
  {
    id: "e4",
    route: "/v2/invoices",
    method: "POST",
    rps: 76,
    p50: 288,
    p90: 640,
    p99: 1810,
    errorRate: 0.9,
    budget: 1500,
    shape: [6, 14, 24, 26, 20, 13, 8, 5, 3, 2],
  },
  {
    id: "e5",
    route: "/v2/profile",
    method: "PUT",
    rps: 31,
    p50: 66,
    p90: 148,
    p99: 322,
    errorRate: 0.2,
    budget: 800,
    shape: [30, 34, 22, 11, 6, 3, 2, 1, 0, 0],
  },
  {
    id: "e6",
    route: "/v2/webhooks",
    method: "POST",
    rps: 208,
    p50: 74,
    p90: 190,
    p99: 486,
    errorRate: 0.3,
    budget: 900,
    shape: [26, 30, 24, 13, 7, 4, 2, 1, 1, 0],
  },
];

type SortKey = "rps" | "p50" | "p90" | "p99" | "errorRate";

const COLUMNS: { key: SortKey; label: string; cls: string }[] = [
  { key: "rps", label: "Req/s", cls: "hidden sm:table-cell" },
  { key: "p50", label: "p50", cls: "" },
  { key: "p90", label: "p90", cls: "hidden md:table-cell" },
  { key: "p99", label: "p99", cls: "" },
  { key: "errorRate", label: "Errors", cls: "hidden lg:table-cell" },
];

const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${v}ms`);

export default function Monitoring8() {
  const [activeId, setActiveId] = useState("e1");
  const [bucket, setBucket] = useState<number | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: "p99",
    asc: false,
  });

  const active = ENDPOINTS.find((e) => e.id === activeId) ?? ENDPOINTS[0];
  const peak = Math.max(...active.shape);
  const totalShape = active.shape.reduce((s, v) => s + v, 0);

  const rows = useMemo(() => {
    const dir = sort.asc ? 1 : -1;
    return [...ENDPOINTS].sort((a, b) => (a[sort.key] - b[sort.key]) * dir);
  }, [sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, asc: !s.asc } : { key, asc: false },
    );

  const percentiles = [
    { label: "p50", value: active.p50, delta: -3.1 },
    { label: "p90", value: active.p90, delta: 6.4 },
    { label: "p99", value: active.p99, delta: 21.8 },
  ];

  const overBudget = active.p99 > active.budget;

  return (
    <div className="flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col gap-1",
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
              Response times
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-neutral-500 tabular-nums">
              Last 24 hours · 2.06M requests · {ENDPOINTS.length} routes
            </p>
          </div>
          <p
            className={cx(
              "inline-flex shrink-0 items-center gap-1.5 text-[12px]",
              overBudget
                ? "text-red-600 dark:text-red-400"
                : "text-neutral-500",
            )}
          >
            <span
              aria-hidden
              className={cx(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                overBudget
                  ? "bg-red-500"
                  : "bg-neutral-300 dark:bg-neutral-600",
              )}
            />
            {overBudget
              ? `p99 over the ${ms(active.budget)} budget`
              : `Within the ${ms(active.budget)} budget`}
          </p>
        </div>

        <div className="grid gap-1 sm:grid-cols-3">
          {percentiles.map((p) => (
            <div key={p.label} className={cx(panel, "px-4 py-3.5")}>
              <p className="text-[13px] text-neutral-500">
                {p.label} · {active.route}
              </p>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                <p className="text-[26px] leading-none font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                  {ms(p.value)}
                </p>
                <span
                  className={cx(
                    "inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums",
                    p.delta <= 0
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-red-600 dark:text-red-500",
                  )}
                >
                  {p.delta <= 0 ? (
                    <ArrowDown className="h-3 w-3" aria-hidden />
                  ) : (
                    <ArrowUp className="h-3 w-3" aria-hidden />
                  )}
                  {Math.abs(p.delta).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={cx(panel, "p-4")}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Latency distribution
            </h3>
            <p className="text-[12px] text-neutral-500 tabular-nums">
              {bucket === null
                ? `${totalShape}% of requests plotted`
                : `${BUCKETS[bucket]}ms · ${active.shape[bucket]}% of requests`}
            </p>
          </div>

          <div
            role="img"
            aria-label={`Latency histogram for ${active.route}`}
            onPointerLeave={() => setBucket(null)}
            className="mt-3 flex h-[120px] items-end gap-1.5"
          >
            {active.shape.map((v, i) => (
              <button
                key={BUCKETS[i]}
                type="button"
                aria-label={`${BUCKETS[i]}ms, ${v}% of requests`}
                onPointerEnter={() => setBucket(i)}
                onFocus={() => setBucket(i)}
                onBlur={() => setBucket(null)}
                className={cx(
                  "flex h-full min-w-0 flex-1 cursor-pointer items-end rounded-[var(--rb-r-xs,4px)]",
                  focus,
                )}
              >
                <span
                  style={{ height: `${Math.max(3, (v / peak) * 100)}%` }}
                  className={cx(
                    "w-full rounded-[var(--rb-r-xs,4px)] transition-[background-color,height] duration-200 ease-out motion-reduce:transition-none",
                    i >= 7
                      ? "bg-red-400"
                      : bucket === i
                        ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                        : "bg-neutral-200 dark:bg-neutral-700",
                  )}
                />
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            {BUCKETS.map((b, i) => (
              <span
                key={b}
                className={cx(
                  "min-w-0 flex-1 truncate text-center text-[10px] tabular-nums",
                  bucket === i
                    ? "text-neutral-700 dark:text-neutral-300"
                    : "text-neutral-400",
                )}
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto")}>
          <table className="w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="text-[12px] text-neutral-500">
                <th scope="col" className="py-2 pr-3 pl-3 font-normal">
                  Route
                </th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={
                      sort.key === c.key
                        ? sort.asc
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={cx(
                      "w-[88px] py-2 pr-3 text-right font-normal",
                      c.cls,
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cx(
                        "inline-flex h-6 cursor-pointer items-center gap-1 rounded-[var(--rb-r-sm,6px)] px-1 hover:text-neutral-900 dark:hover:text-neutral-100",
                        transition,
                        focus,
                        sort.key === c.key &&
                          "text-neutral-900 dark:text-neutral-100",
                      )}
                    >
                      {c.label}
                      {sort.key === c.key &&
                        (sort.asc ? (
                          <ArrowUp className="h-3 w-3" aria-hidden />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden />
                        ))}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const isActive = e.id === activeId;
                return (
                  <tr
                    key={e.id}
                    onClick={() => {
                      setActiveId(e.id);
                      setBucket(null);
                    }}
                    className={cx(
                      "cursor-pointer",
                      transition,
                      isActive
                        ? "bg-neutral-50 dark:bg-neutral-800/50"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40",
                    )}
                  >
                    <td className="py-2.5 pr-3 pl-3">
                      <button
                        type="button"
                        aria-pressed={isActive}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setActiveId(e.id);
                          setBucket(null);
                        }}
                        className={cx(
                          "flex min-w-0 cursor-pointer items-center gap-2 rounded-[var(--rb-r-sm,6px)] text-left",
                          focus,
                        )}
                      >
                        <span className="w-[38px] shrink-0 text-[11px] text-neutral-400">
                          {e.method}
                        </span>
                        <span className="truncate font-mono text-[13px] text-neutral-900 dark:text-neutral-100">
                          {e.route}
                        </span>
                      </button>
                    </td>
                    <td className="hidden py-2.5 pr-3 text-right text-[13px] text-neutral-600 tabular-nums sm:table-cell dark:text-neutral-300">
                      {e.rps}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-[13px] text-neutral-600 tabular-nums dark:text-neutral-300">
                      {ms(e.p50)}
                    </td>
                    <td className="hidden py-2.5 pr-3 text-right text-[13px] text-neutral-600 tabular-nums md:table-cell dark:text-neutral-300">
                      {ms(e.p90)}
                    </td>
                    <td
                      className={cx(
                        "py-2.5 pr-3 text-right text-[13px] tabular-nums",
                        e.p99 > e.budget
                          ? "text-red-600 dark:text-red-400"
                          : "text-neutral-600 dark:text-neutral-300",
                      )}
                    >
                      {ms(e.p99)}
                    </td>
                    <td className="hidden py-2.5 pr-3 text-right text-[13px] text-neutral-600 tabular-nums lg:table-cell dark:text-neutral-300">
                      {e.errorRate.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

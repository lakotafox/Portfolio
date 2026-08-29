"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, Eraser, Pause, Play, Search } from "lucide-react";

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

type Level = "error" | "warn" | "info" | "debug";

type Line = {
  id: number;
  at: string;
  level: Level;
  service: string;
  message: string;
  context: string;
};

const LEVELS: { id: Level | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "error", label: "Error" },
  { id: "warn", label: "Warn" },
  { id: "info", label: "Info" },
  { id: "debug", label: "Debug" },
];

const DOT: Record<Level, string> = {
  error: "bg-red-500",
  warn: "bg-amber-500",
  info: "bg-neutral-300 dark:bg-neutral-600",
  debug: "bg-neutral-200 dark:bg-neutral-700",
};

const POOL: Omit<Line, "id" | "at">[] = [
  {
    level: "info",
    service: "api-gateway",
    message: "GET /v2/orders 200 in 42ms",
    context: '{ "route": "/v2/orders", "region": "eu-west-1", "cache": "hit" }',
  },
  {
    level: "debug",
    service: "catalog-api",
    message: "cache warm complete for tenant 4821",
    context: '{ "keys": 1284, "took_ms": 612 }',
  },
  {
    level: "warn",
    service: "invoice-worker",
    message: "vendor responded 503, scheduling retry 2 of 5",
    context: '{ "vendor": "northwind-billing", "backoff_ms": 4000 }',
  },
  {
    level: "info",
    service: "payments-edge",
    message: "charge authorised for ORD-99214",
    context: '{ "amount": "1240.00", "currency": "EUR", "took_ms": 388 }',
  },
  {
    level: "error",
    service: "payments-edge",
    message: "charge timed out after 8s, releasing the hold",
    context: '{ "order": "ORD-99187", "attempt": 3, "pool": "exhausted" }',
  },
  {
    level: "info",
    service: "search-api",
    message: "reindex batch 18/64 committed",
    context: '{ "docs": 4200, "lag_s": 1.2 }',
  },
  {
    level: "debug",
    service: "edge-proxy",
    message: "upstream health probe ok",
    context: '{ "upstream": "orders-db", "rtt_ms": 3 }',
  },
  {
    level: "warn",
    service: "search-api",
    message: "embeddings index read latency 1.9s",
    context: '{ "shard": 7, "threshold_ms": 1200 }',
  },
];

const stamp = (i: number) => {
  const total = 9 * 3600 + 4 * 60 + i * 7;
  const h = Math.floor(total / 3600) % 24;
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const makeLine = (i: number): Line => ({
  ...POOL[i % POOL.length],
  id: i,
  at: stamp(i),
});

const INITIAL = Array.from({ length: 22 }, (_, i) => makeLine(i));

export default function Monitoring5() {
  const [lines, setLines] = useState<Line[]>(INITIAL);
  const [running, setRunning] = useState(true);
  const [follow, setFollow] = useState(true);
  const [level, setLevel] = useState<Level | "all">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const next = useRef(INITIAL.length);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLines((l) => {
        const line = makeLine(next.current);
        next.current += 1;
        return [...l.slice(-140), line];
      });
    }, 1200);
    return () => window.clearInterval(id);
  }, [running]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lines.filter(
      (l) =>
        (level === "all" || l.level === level) &&
        (!q ||
          l.message.toLowerCase().includes(q) ||
          l.service.toLowerCase().includes(q)),
    );
  }, [lines, level, query]);

  useEffect(() => {
    const el = streamRef.current;
    if (!el || !follow) return;
    el.scrollTop = el.scrollHeight;
  }, [visible, follow]);

  const errors = lines.filter((l) => l.level === "error").length;

  return (
    <div className="flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col gap-1",
        )}
      >
        <div className={cx(panel, "px-4 py-3")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                  Live tail
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500">
                  <span
                    aria-hidden
                    className={cx(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      running
                        ? "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500"
                        : "bg-neutral-300 dark:bg-neutral-600",
                    )}
                  />
                  {running ? "Streaming" : "Paused"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-neutral-500 tabular-nums">
                production · all services · {errors} errors in view
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setFollow((f) => !f)}
                aria-pressed={follow}
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border px-2.5 text-[13px] font-medium",
                  transition,
                  focus,
                  follow
                    ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                )}
              >
                <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden />
                Follow
              </button>
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                {running ? (
                  <Pause className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden />
                )}
                {running ? "Pause" : "Resume"}
              </button>
              <button
                type="button"
                aria-label="Clear the buffer"
                onClick={() => {
                  setLines([]);
                  setOpen(null);
                }}
                className={cx(
                  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                <Eraser className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Log level"
              className="flex items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800/60"
            >
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={l.id === level}
                  onClick={() => setLevel(l.id)}
                  className={cx(
                    "inline-flex h-6 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[12px] font-medium",
                    transition,
                    focus,
                    l.id === level
                      ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="relative min-w-0 flex-1 sm:max-w-[280px]">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <label htmlFor="monitoring-5-search" className="sr-only">
                Filter log lines
              </label>
              <input
                id="monitoring-5-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by message or service"
                className={cx(
                  "h-8 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pr-2.5 pl-8 text-[13px] text-neutral-900 placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
                  transition,
                  focus,
                )}
              />
            </div>
          </div>
        </div>

        <div
          ref={streamRef}
          className={cx(panel, "min-h-0 flex-1 overflow-y-auto p-1.5")}
        >
          {visible.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                No lines in view
              </p>
              <p className="mt-1 max-w-[300px] text-[12px] text-neutral-500">
                {lines.length === 0
                  ? "The buffer is empty. Resume the stream to start collecting again."
                  : "Nothing matches the current level and filter."}
              </p>
            </div>
          ) : (
            <ul>
              {visible.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    aria-expanded={open === l.id}
                    onClick={() => setOpen(open === l.id ? null : l.id)}
                    className={cx(
                      "flex w-full cursor-pointer items-baseline gap-3 rounded-[var(--rb-r-sm,6px)] px-2 py-[5px] text-left font-mono text-[12px] hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                      transition,
                      focus,
                    )}
                  >
                    <span className="shrink-0 text-neutral-400 tabular-nums">
                      {l.at}
                    </span>
                    <span className="inline-flex w-[64px] shrink-0 items-center gap-1.5 text-neutral-500">
                      <span
                        aria-hidden
                        className={cx(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          DOT[l.level],
                        )}
                      />
                      {l.level}
                    </span>
                    <span className="hidden w-[120px] shrink-0 truncate text-neutral-500 sm:block">
                      {l.service}
                    </span>
                    <span
                      className={cx(
                        "min-w-0 flex-1 truncate",
                        l.level === "error"
                          ? "text-red-600 dark:text-red-400"
                          : "text-neutral-700 dark:text-neutral-300",
                      )}
                    >
                      {l.message}
                    </span>
                  </button>
                  {open === l.id && (
                    <pre className="mx-2 mb-1 overflow-x-auto rounded-[var(--rb-r-sm,6px)] bg-neutral-50 px-3 py-2 font-mono text-[11px] leading-relaxed text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400">
                      {l.context}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className={cx(
            panel,
            "flex flex-wrap items-center justify-between gap-2 px-3 py-2",
          )}
        >
          <p className="text-[12px] text-neutral-500 tabular-nums">
            {visible.length} of {lines.length} lines · buffer capped at 140
          </p>
          <p className="text-[12px] text-neutral-500 tabular-nums">
            ~50 lines/min
          </p>
        </div>
      </div>
    </div>
  );
}

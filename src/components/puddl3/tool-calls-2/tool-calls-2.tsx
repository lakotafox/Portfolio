"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Square } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Status =
  | "streaming"
  | "running"
  | "awaiting"
  | "approved"
  | "done"
  | "failed"
  | "stopped"
  | "skipped";

type ToolCall = {
  id: string;
  name: string;
  target: string;
  duration?: string;
  status: Status;
};

const INITIAL: ToolCall[] = [
  {
    id: "call_01",
    name: "read_file",
    target: "app/api/checkout/route.ts",
    duration: "38ms",
    status: "done",
  },
  {
    id: "call_02",
    name: "codebase_search",
    target: "where is the retry backoff configured",
    duration: "1.24s",
    status: "done",
  },
  {
    id: "call_03",
    name: "grep",
    target: "RETRY_BACKOFF_MS across the services directory",
    duration: "112ms",
    status: "done",
  },
  {
    id: "call_04",
    name: "edit_file",
    target: "services/payments/retry.ts",
    duration: "0.94s",
    status: "running",
  },
  {
    id: "call_05",
    name: "run_terminal",
    target: "pnpm test payments --runInBand",
    status: "streaming",
  },
  {
    id: "call_06",
    name: "web_search",
    target: "Halcyon Pay idempotency key best practices",
    duration: "2.10s",
    status: "done",
  },
  {
    id: "call_07",
    name: "fetch_url",
    target: "https://docs.halcyonpay.com/api/idempotent_requests",
    status: "failed",
  },
  {
    id: "call_08",
    name: "apply_patch",
    target: "services/payments/idempotency.ts",
    duration: "0.61s",
    status: "approved",
  },
  {
    id: "call_09",
    name: "read_file",
    target: "services/payments/__tests__/retry.test.ts",
    duration: "41ms",
    status: "done",
  },
  {
    id: "call_10",
    name: "run_terminal",
    target: "pnpm lint --filter payments",
    duration: "3.40s",
    status: "failed",
  },
  {
    id: "call_11",
    name: "send_email",
    target: "Q3 renewal summary to 4 recipients",
    status: "awaiting",
  },
  {
    id: "call_12",
    name: "delete_file",
    target: "services/payments/legacy/backoff.ts",
    status: "skipped",
  },
];

const STATUS_WORD: Record<Status, string> = {
  streaming: "Streaming",
  running: "Running",
  awaiting: "Needs approval",
  approved: "Approved",
  done: "Done",
  failed: "Failed",
  stopped: "Stopped",
  skipped: "Skipped",
};

const isRunning = (s: Status) => s === "streaming" || s === "running";

function Dot({ status }: { status: Status }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        isRunning(status) &&
          "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500",
        status === "failed" && "bg-red-500",
        status === "awaiting" && "bg-amber-500",
        (status === "done" ||
          status === "skipped" ||
          status === "stopped" ||
          status === "approved") &&
          "bg-neutral-300 dark:bg-neutral-600",
      )}
    />
  );
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "failed", label: "Failed" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

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

export default function ToolCalls2() {
  const [calls, setCalls] = useState<ToolCall[]>(INITIAL);
  const [filter, setFilter] = useState<Filter>("all");
  const body = useScrollFade<HTMLDivElement>();

  const streaming = calls.some((p) => isRunning(p.status));

  const rows = useMemo(() => {
    if (filter === "all") return calls;
    if (filter === "running") return calls.filter((p) => isRunning(p.status));
    return calls.filter((p) => p.status === "failed");
  }, [calls, filter]);

  const stop = useCallback(() => {
    setCalls((prev) =>
      prev.map((p) => (isRunning(p.status) ? { ...p, status: "stopped" } : p)),
    );
  }, []);

  const timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
    },
    [],
  );

  const retry = useCallback((id: string) => {
    setCalls((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "running", duration: undefined } : p,
      ),
    );
    timers.current.push(
      window.setTimeout(() => {
        setCalls((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "done", duration: "0.80s" } : p,
          ),
        );
      }, 900),
    );
  }, []);

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <header className="mb-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Tool activity
          </h2>
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <Square aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              Stop
            </button>
          ) : (
            <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
              {calls.length} calls
            </span>
          )}
        </div>

        <div className="mt-3 inline-flex h-8 items-center gap-0.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 p-0.5 dark:bg-neutral-800">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                  active
                    ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
              No {filter === "running" ? "running" : "failed"} calls.
            </p>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              Show all calls
            </button>
          </div>
        ) : (
          <div
            ref={body.ref}
            onScroll={body.onScroll}
            className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain [overflow-anchor:none]"
          >
            {rows.map((p) => (
              <div
                key={p.id}
                className="flex h-10 items-center gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-950"
              >
                <Dot status={p.status} />
                <span className="shrink-0 truncate font-mono text-xs text-neutral-900 sm:w-32 dark:text-neutral-100">
                  {p.name}
                </span>
                <span className="hidden min-w-0 flex-1 truncate text-xs text-neutral-500 sm:block dark:text-neutral-500">
                  {p.target}
                </span>
                <span className="hidden w-12 shrink-0 text-right text-xs tabular-nums text-neutral-500 sm:block dark:text-neutral-500">
                  {p.duration ?? (
                    <span className="text-neutral-400 dark:text-neutral-600">
                      &mdash;
                    </span>
                  )}
                </span>
                <span
                  className={cx(
                    "ml-auto w-28 shrink-0 whitespace-nowrap text-right text-[13px]",
                    p.status === "failed"
                      ? "text-red-600 dark:text-red-400"
                      : "text-neutral-600 dark:text-neutral-400",
                  )}
                >
                  {STATUS_WORD[p.status]}
                </span>
                <div className="flex w-7 shrink-0 justify-end">
                  {p.status === "failed" && (
                    <button
                      type="button"
                      onClick={() => retry(p.id)}
                      title="Retry"
                      aria-label={`Retry ${p.name}`}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-600 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                    >
                      <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-1 top-1 h-8 rounded-t-[var(--rb-r-lg,10px)] bg-gradient-to-b from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
            body.edges.start ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-1 bottom-1 h-8 rounded-b-[var(--rb-r-lg,10px)] bg-gradient-to-t from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
            body.edges.end ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
}

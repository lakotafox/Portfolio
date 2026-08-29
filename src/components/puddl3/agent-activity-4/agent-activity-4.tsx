"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

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

type Status = "succeeded" | "failed" | "cancelled";

type Run = {
  name: string;
  status: Status;
  duration: string;
  cost: string | null;
  started: string;
};

const RUNS: Run[] = [
  {
    name: "Reconcile October invoices",
    status: "succeeded",
    duration: "24.1s",
    cost: "$0.42",
    started: "12m ago",
  },
  {
    name: "Sync Northwind CRM accounts",
    status: "succeeded",
    duration: "1m 18s",
    cost: "$1.85",
    started: "46m ago",
  },
  {
    name: "Refresh churn model features",
    status: "failed",
    duration: "8.3s",
    cost: "$0.11",
    started: "1h ago",
  },
  {
    name: "Export weekly board metrics",
    status: "succeeded",
    duration: "42.7s",
    cost: "$0.63",
    started: "2h ago",
  },
  {
    name: "Deduplicate contact records",
    status: "cancelled",
    duration: "5.0s",
    cost: null,
    started: "3h ago",
  },
  {
    name: "Backfill subscription events",
    status: "succeeded",
    duration: "3m 04s",
    cost: "$2.40",
    started: "5h ago",
  },
  {
    name: "Retag support conversations",
    status: "succeeded",
    duration: "58.9s",
    cost: "$0.71",
    started: "6h ago",
  },
  {
    name: "Generate quarterly revenue summary for the finance leadership review",
    status: "succeeded",
    duration: "1m 02s",
    cost: "$0.94",
    started: "9h ago",
  },
  {
    name: "Rotate warehouse credentials",
    status: "failed",
    duration: "2.1s",
    cost: "$0.03",
    started: "11h ago",
  },
  {
    name: "Import marketing leads",
    status: "cancelled",
    duration: "14.6s",
    cost: null,
    started: "14h ago",
  },
  {
    name: "Reindex the product catalogue",
    status: "succeeded",
    duration: "2m 41s",
    cost: "$1.12",
    started: "18h ago",
  },
  {
    name: "Recompute account health scores",
    status: "succeeded",
    duration: "47.5s",
    cost: "$0.55",
    started: "1d ago",
  },
  {
    name: "Summarise overnight support volume",
    status: "succeeded",
    duration: "31.2s",
    cost: "$0.38",
    started: "1d ago",
  },
  {
    name: "Prune stale vector embeddings",
    status: "cancelled",
    duration: "9.4s",
    cost: null,
    started: "2d ago",
  },
];

const LABEL: Record<Status, string> = {
  succeeded: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
};

function StatusCell({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]">
      <span
        aria-hidden="true"
        className={cx(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          status === "failed"
            ? "bg-red-500"
            : "bg-neutral-300 dark:bg-neutral-600",
        )}
      />
      <span
        className={cx(
          status === "failed"
            ? "text-neutral-700 dark:text-neutral-300"
            : "text-neutral-600 dark:text-neutral-400",
        )}
      >
        {LABEL[status]}
      </span>
    </span>
  );
}

export default function AgentActivity4() {
  const feed = useScrollFade<HTMLDivElement>();
  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col gap-3 overflow-hidden bg-white p-4 sm:gap-4 sm:p-6 dark:bg-neutral-950">
      <div className="flex shrink-0 items-center gap-2">
        <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Run history
        </h2>
        <span className="text-[13px] tabular-nums text-neutral-500 dark:text-neutral-400">
          {RUNS.length} runs
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div
            ref={feed.ref}
            onScroll={feed.onScroll}
            className="h-full overflow-y-auto overscroll-contain"
          >
            <ul className="flex flex-col gap-1.5 p-1.5 md:hidden">
              {RUNS.map((run, i) => (
                <li
                  key={i}
                  className="rounded-[var(--rb-r-md,8px)] bg-neutral-50 p-3 dark:bg-neutral-900"
                >
                  <div className="flex items-start gap-3">
                    <span className="min-w-0 flex-1 text-[13px] text-neutral-900 dark:text-neutral-100">
                      {run.name}
                    </span>
                    <button
                      type="button"
                      aria-label={`Re-run ${run.name}`}
                      className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-600 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                    >
                      <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <dl className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">Status</dt>
                      <dd>
                        <StatusCell status={run.status} />
                      </dd>
                    </div>
                    <div className="flex items-center gap-1">
                      <dt>Duration</dt>
                      <dd className="tabular-nums text-neutral-600 dark:text-neutral-400">
                        {run.duration}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1">
                      <dt>Cost</dt>
                      <dd className="tabular-nums text-neutral-600 dark:text-neutral-400">
                        {run.cost ?? (
                          <span className="text-neutral-400 dark:text-neutral-600">
                            -
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1">
                      <dt>Started</dt>
                      <dd className="tabular-nums">{run.started}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <table className="hidden w-full table-fixed border-collapse md:table">
              <caption className="sr-only">
                Run history, newest first. Fourteen agent runs with status,
                duration, cost and start time.
              </caption>
              <thead>
                <tr className="sticky top-0 z-20 h-9 bg-white text-left text-xs text-neutral-500 dark:bg-neutral-950 dark:text-neutral-500">
                  <th scope="col" className="w-[36%] px-4 font-medium">
                    Run
                  </th>
                  <th scope="col" className="w-[15%] px-3 font-medium">
                    Status
                  </th>
                  <th
                    scope="col"
                    className="w-[13%] px-3 text-right font-medium"
                  >
                    Duration
                  </th>
                  <th
                    scope="col"
                    className="w-[12%] px-3 text-right font-medium"
                  >
                    Cost
                  </th>
                  <th
                    scope="col"
                    className="w-[16%] px-3 text-right font-medium"
                  >
                    Started
                  </th>
                  <th scope="col" className="w-[8%] px-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                {RUNS.map((run, i) => (
                  <tr
                    key={i}
                    className="group h-11 transition-colors duration-150 ease-out hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <td className="px-4">
                      <span className="block truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                        {run.name}
                      </span>
                    </td>
                    <td className="px-3">
                      <StatusCell status={run.status} />
                    </td>
                    <td className="px-3 text-right text-[13px] tabular-nums text-neutral-600 dark:text-neutral-400">
                      {run.duration}
                    </td>
                    <td className="px-3 text-right text-[13px] tabular-nums">
                      {run.cost ? (
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {run.cost}
                        </span>
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-600">
                          -
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
                      {run.started}
                    </td>
                    <td className="px-4 text-right">
                      <button
                        type="button"
                        aria-label={`Re-run ${run.name}`}
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-600 opacity-0 transition-[opacity,transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 group-hover:opacity-100 active:scale-[0.97] focus-visible:opacity-100 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                      >
                        <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-[var(--rb-r-lg,10px)] bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              feed.edges.end ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      </div>
    </div>
  );
}

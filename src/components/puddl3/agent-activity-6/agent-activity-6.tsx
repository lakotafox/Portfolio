"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type LaneState = "running" | "approval" | "queued";

type Lane = {
  worker: string;
  action: string;
  state: LaneState;
  /** Items per minute for running lanes. */
  rate: number | null;
  /** Completion of the current task, 0–1, for running lanes. */
  progress: number | null;
};

const LANES: Lane[] = [
  {
    worker: "Invoices",
    action: "Reconciling batch 3 of 5",
    state: "running",
    rate: 42,
    progress: 0.62,
  },
  {
    worker: "Contacts",
    action: "Merging duplicate records",
    state: "running",
    rate: 18,
    progress: 0.34,
  },
  {
    worker: "Documents",
    action: "Waiting to delete 240 archived files",
    state: "approval",
    rate: null,
    progress: null,
  },
  {
    worker: "Embeddings",
    action: "Indexing 318 support tickets",
    state: "running",
    rate: 96,
    progress: 0.81,
  },
  {
    worker: "Metrics",
    action: "Aggregating daily revenue",
    state: "running",
    rate: 63,
    progress: 0.47,
  },
  {
    worker: "Exports",
    action: "Waiting for a free slot",
    state: "queued",
    rate: null,
    progress: null,
  },
];

const STATE_LABEL: Record<LaneState, string> = {
  running: "Running",
  approval: "Needs approval",
  queued: "Queued",
};

function LaneDot({ state }: { state: LaneState }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        state === "running" &&
          "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500",
        state === "approval" && "bg-amber-500",
        state === "queued" && "bg-neutral-300 dark:bg-neutral-600",
      )}
    />
  );
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

export default function AgentActivity6() {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  const feed = useScrollFade<HTMLUListElement>();

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setTick((t) => t + 1), 900);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const runningCount = LANES.filter((l) => l.state === "running").length;

  return (
    <div className="relative flex h-full min-h-[560px] w-full flex-col gap-3 overflow-hidden bg-white p-4 sm:gap-4 sm:p-6 dark:bg-neutral-950">
      <header className="flex shrink-0 items-center gap-3">
        <h2 className="min-w-0 flex-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Import workers
        </h2>
        <div className="flex shrink-0 items-center gap-4 text-[13px] text-neutral-500 dark:text-neutral-400">
          <span>
            <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
              {runningCount}
            </span>{" "}
            active
          </span>
          <span>
            <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
              18
            </span>{" "}
            queued
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <ul
            ref={feed.ref}
            onScroll={feed.onScroll}
            className="flex h-full flex-col gap-1 overflow-y-auto overscroll-contain p-1"
          >
            {LANES.map((lane, i) => {
              const live =
                lane.state === "running" && lane.progress != null
                  ? Math.min(
                      0.98,
                      lane.progress + (reduceMotion ? 0 : tick * 0.004),
                    )
                  : lane.progress;
              return (
                <li
                  key={i}
                  className="shrink-0 rounded-[var(--rb-r-sm,6px)] px-2.5 py-3 transition-colors duration-150 ease-out hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <div className="flex items-center gap-3">
                    <LaneDot state={lane.state} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {lane.worker}
                    </span>
                    <span className="shrink-0 text-right text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                      {lane.rate != null ? (
                        <>
                          {lane.rate}
                          <span className="text-neutral-500 dark:text-neutral-500">
                            /min
                          </span>
                        </>
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-600">
                          -
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2 pl-[18px]">
                    <span
                      className={cx(
                        "min-w-0 flex-1 truncate text-xs",
                        lane.state === "approval"
                          ? "text-neutral-700 dark:text-neutral-300"
                          : "text-neutral-500 dark:text-neutral-500",
                      )}
                    >
                      {lane.action}
                    </span>
                    <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-500">
                      {STATE_LABEL[lane.state]}
                    </span>
                  </div>

                  {live != null && (
                    <div
                      aria-hidden="true"
                      className="mt-2 ml-[18px] h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
                    >
                      <div
                        className="h-full rounded-full bg-neutral-400 transition-[width] duration-700 ease-out motion-reduce:transition-none dark:bg-neutral-500"
                        style={{ width: `${live * 100}%` }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 top-0 h-8 rounded-t-[var(--rb-r-lg,10px)] bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              feed.edges.start ? "opacity-100" : "opacity-0",
            )}
          />
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

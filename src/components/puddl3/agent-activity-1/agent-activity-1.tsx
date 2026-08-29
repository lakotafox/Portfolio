"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Square } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type StepState = "done" | "running" | "queued";

type Step = {
  label: string;
  state: StepState;
  /** Fixed duration in seconds for completed steps. */
  seconds?: number;
};

const STEPS: Step[] = [
  { label: "Loaded October general ledger", state: "done", seconds: 0.4 },
  { label: "Pulled bank statement export", state: "done", seconds: 1.3 },
  { label: "Normalised 1,284 transactions", state: "done", seconds: 2.1 },
  { label: "Split multi-currency lines", state: "done", seconds: 1.7 },
  { label: "Matched transactions to ledger", state: "done", seconds: 3.6 },
  { label: "Flagged 12 unmatched entries", state: "done", seconds: 0.8 },
  { label: "Grouped duplicates by reference", state: "done", seconds: 0.5 },
  { label: "Reconciling flagged entries", state: "running" },
  { label: "Resolve foreign-exchange rounding", state: "queued" },
  { label: "Post adjustments to the ledger", state: "queued" },
  { label: "Generate the reconciliation report", state: "queued" },
  { label: "Archive the reconciliation run", state: "queued" },
  { label: "Notify the finance team", state: "queued" },
];

const DONE_SECONDS = STEPS.reduce((sum, s) => sum + (s.seconds ?? 0), 0);

function fmt(seconds: number) {
  return `${seconds.toFixed(1)}s`;
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

export default function AgentActivity1() {
  const feed = useScrollFade<HTMLDivElement>();
  const [stepElapsed, setStepElapsed] = useState(0);
  const [stopped, setStopped] = useState(false);
  const startedRef = useRef<number | null>(null);

  useEffect(() => {
    if (stopped) return;
    const started = startedRef.current ?? performance.now();
    startedRef.current = started;
    const id = setInterval(() => {
      setStepElapsed((performance.now() - started) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [stopped]);

  const totalElapsed = DONE_SECONDS + stepElapsed;

  return (
    <div className="relative flex h-full min-h-[560px] w-full flex-col gap-3 overflow-hidden bg-white p-4 sm:gap-4 sm:p-6 dark:bg-neutral-950">
      <header className="flex shrink-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Reconcile October invoices
          </h2>
          <div
            aria-live="polite"
            className="mt-0.5 flex items-center gap-1.5 text-[13px] text-neutral-500 dark:text-neutral-400"
          >
            <span
              aria-hidden="true"
              className={cx(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                stopped
                  ? "bg-neutral-300 dark:bg-neutral-600"
                  : "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500",
              )}
            />
            <span>{stopped ? "Stopped" : "Running"}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{fmt(totalElapsed)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStopped(true)}
          disabled={stopped}
          className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
        >
          <Square aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          Stop
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div
            ref={feed.ref}
            onScroll={feed.onScroll}
            className="h-full overflow-y-auto overscroll-contain p-2"
          >
            <ol className="relative pl-2">
              <div
                aria-hidden="true"
                className="absolute bottom-4 left-[5px] top-4 w-px bg-neutral-200 dark:bg-neutral-800"
              />
              {STEPS.map((step, i) => {
                const running = step.state === "running" && !stopped;
                const cancelled = step.state === "running" && stopped;
                return (
                  <li
                    key={i}
                    className="relative flex h-9 items-center gap-3 pl-4"
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        "absolute left-0 h-1.5 w-1.5 rounded-full ring-4 ring-white dark:ring-neutral-950",
                        running
                          ? "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500"
                          : "bg-neutral-300 dark:bg-neutral-600",
                      )}
                    />
                    <span
                      className={cx(
                        "min-w-0 flex-1 truncate text-[13px]",
                        step.state === "done" &&
                          "text-neutral-600 dark:text-neutral-400",
                        running &&
                          "font-medium text-neutral-900 dark:text-neutral-100",
                        (cancelled || step.state === "queued") &&
                          "text-neutral-500 dark:text-neutral-500",
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
                      {step.state === "done" ? (
                        fmt(step.seconds ?? 0)
                      ) : running ? (
                        fmt(stepElapsed)
                      ) : cancelled ? (
                        "Stopped"
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-600">
                          -
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

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

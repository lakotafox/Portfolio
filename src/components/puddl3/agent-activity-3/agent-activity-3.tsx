"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Square } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const STEPS: { label: string; seconds: number }[] = [
  { label: "Build the container image", seconds: 6 },
  { label: "Run the test suite", seconds: 9 },
  { label: "Push image to the registry", seconds: 4 },
  { label: "Apply database migrations", seconds: 5 },
  { label: "Roll out to production", seconds: 7 },
  { label: "Run smoke checks", seconds: 3 },
  { label: "Notify the release channel", seconds: 2 },
];

const TOTAL = STEPS.reduce((sum, s) => sum + s.seconds, 0);

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
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

export default function AgentActivity3() {
  const feed = useScrollFade<HTMLDivElement>();
  const [elapsed, setElapsed] = useState(0);
  const [stopped, setStopped] = useState(false);
  const startedRef = useRef<number | null>(null);

  const done = elapsed >= TOTAL;
  const settled = stopped || done;

  useEffect(() => {
    if (settled) return;
    const started = performance.now() - elapsed * 1000;
    startedRef.current = started;
    const id = setInterval(() => {
      setElapsed(Math.min(TOTAL, (performance.now() - started) / 1000));
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

  let acc = 0;
  let activeIndex = STEPS.length;
  for (let i = 0; i < STEPS.length; i++) {
    if (elapsed < acc + STEPS[i].seconds) {
      activeIndex = i;
      break;
    }
    acc += STEPS[i].seconds;
  }

  const restart = () => {
    setElapsed(0);
    setStopped(false);
    startedRef.current = null;
  };

  const statusWord = stopped ? "Stopped" : done ? "Succeeded" : "Running";

  return (
    <div className="relative flex h-full min-h-[480px] w-full flex-col gap-3 overflow-hidden bg-white p-4 sm:gap-4 sm:p-6 dark:bg-neutral-950">
      <header className="flex shrink-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Deploy checkout-api
          </h2>
          <div
            aria-live="polite"
            className="mt-0.5 flex items-center gap-1.5 text-[13px] text-neutral-500 dark:text-neutral-400"
          >
            <span
              aria-hidden="true"
              className={cx(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                settled
                  ? "bg-neutral-300 dark:bg-neutral-600"
                  : "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500",
              )}
            />
            <span className="w-20">{statusWord}</span>
          </div>
        </div>
        <span className="shrink-0 text-[13px] tabular-nums text-neutral-500 dark:text-neutral-400">
          {activeIndex >= STEPS.length ? STEPS.length : activeIndex + 1} of{" "}
          {STEPS.length}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
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
                const isDone = i < activeIndex;
                const isActive = i === activeIndex && !settled;
                const isStopped = i === activeIndex && stopped;
                const word = isDone
                  ? "Done"
                  : isActive
                    ? "Running"
                    : isStopped
                      ? "Stopped"
                      : "Queued";
                return (
                  <li
                    key={i}
                    className="relative flex h-9 items-center gap-3 pl-4"
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        "absolute left-0 h-1.5 w-1.5 rounded-full ring-4 ring-white dark:ring-neutral-950",
                        isActive
                          ? "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500"
                          : "bg-neutral-300 dark:bg-neutral-600",
                      )}
                    />
                    <span
                      className={cx(
                        "min-w-0 flex-1 truncate text-[13px]",
                        isActive
                          ? "font-medium text-neutral-900 dark:text-neutral-100"
                          : isDone
                            ? "text-neutral-600 dark:text-neutral-400"
                            : "text-neutral-500 dark:text-neutral-500",
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="w-20 shrink-0 text-right text-[13px] text-neutral-500 dark:text-neutral-500">
                      {word}
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

        <div className="shrink-0 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950">
          <div
            aria-hidden="true"
            className="h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
          >
            <div
              className="h-full rounded-full bg-neutral-900 transition-[width] duration-200 ease-out motion-reduce:transition-none dark:bg-neutral-100"
              style={{ width: `${Math.round((elapsed / TOTAL) * 100)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-xs text-neutral-500 dark:text-neutral-500">
              <span className="tabular-nums">{fmt(elapsed)}</span>
              <span aria-hidden="true"> / </span>
              <span className="tabular-nums">{fmt(TOTAL)}</span>
            </span>
            {settled ? (
              <button
                type="button"
                onClick={restart}
                className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <RotateCcw
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0"
                />
                Run again
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStopped(true)}
                className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <Square aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

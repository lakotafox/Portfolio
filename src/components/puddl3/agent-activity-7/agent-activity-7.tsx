"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RotateCcw, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Input = { label: string; value: string; mono?: boolean };

const INPUTS: Input[] = [
  { label: "Trigger", value: "Scheduled" },
  { label: "Dataset", value: "reporting.ledger", mono: true },
  { label: "Model", value: "Atlas Pro" },
  { label: "Started", value: "Today at 06:00" },
  { label: "Requested by", value: "Automation" },
];

type Attempt = {
  n: number;
  outcome: string;
  duration: string;
};

const ATTEMPTS: Attempt[] = [
  { n: 1, outcome: "Timed out writing 2,244 rows", duration: "12.0s" },
  { n: 2, outcome: "Timed out writing 1,536 rows", duration: "30.0s" },
];

function Fade({ children }: { children: React.ReactNode }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cx(
        "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 px-0.5 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
      {children}
    </h3>
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

export default function AgentActivity7() {
  const feed = useScrollFade<HTMLDivElement>();
  const [retryQueued, setRetryQueued] = useState(false);

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col gap-3 overflow-hidden bg-white p-4 sm:gap-4 sm:p-6 dark:bg-neutral-950">
      <header className="flex shrink-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Export October ledger
          </h2>
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
            />
            <span className="text-neutral-600 dark:text-neutral-400">
              Failed
            </span>
            <span aria-hidden="true" className="text-neutral-500">
              ·
            </span>
            <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
              42.1s
            </span>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,border-color,color] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
        >
          View log
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={feed.ref}
          onScroll={feed.onScroll}
          className="h-full overflow-y-auto overscroll-contain"
        >
          <div className="space-y-4 pb-2">
            <Fade key={retryQueued ? "queued" : "failed"}>
              <div
                role={retryQueued ? undefined : "alert"}
                aria-live={retryQueued ? "polite" : undefined}
                className="space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={cx(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        retryQueued
                          ? "bg-neutral-400 dark:bg-neutral-500"
                          : "bg-red-500",
                      )}
                    />
                    <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {retryQueued
                        ? "Retry queued"
                        : "Warehouse write timed out"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {retryQueued
                      ? "Attempt 3 starts off-peak at 22:00 with a 512-row batch size."
                      : "Two attempts exceeded the 30s write limit. Retry off-peak or lower the batch size before running again."}
                  </p>
                </div>
                <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="flex items-center justify-end">
                    {retryQueued ? (
                      <button
                        type="button"
                        onClick={() => setRetryQueued(false)}
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                      >
                        <X
                          aria-hidden="true"
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        Cancel retry
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRetryQueued(true)}
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-2.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color,color] duration-150 ease-out hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                      >
                        <RotateCcw
                          aria-hidden="true"
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        Retry run
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Fade>

            <section>
              <SectionLabel>Inputs</SectionLabel>
              <dl className="divide-y divide-neutral-200/70 overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
                {INPUTS.map((input) => (
                  <div
                    key={input.label}
                    className="flex items-baseline gap-4 px-3 py-2.5"
                  >
                    <dt className="w-28 shrink-0 text-[13px] text-neutral-500 dark:text-neutral-500">
                      {input.label}
                    </dt>
                    <dd
                      className={cx(
                        "min-w-0 flex-1 truncate text-[13px] text-neutral-900 dark:text-neutral-100",
                        input.mono && "font-mono text-xs",
                      )}
                    >
                      {input.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <SectionLabel>Attempts</SectionLabel>
              <div className="divide-y divide-neutral-200/70 overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
                {ATTEMPTS.map((attempt) => (
                  <div
                    key={attempt.n}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <span className="shrink-0 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      Attempt {attempt.n}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-600 dark:text-neutral-400">
                      {attempt.outcome}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
                      {attempt.duration}
                    </span>
                  </div>
                ))}
                <p className="px-3 py-2.5 text-[13px] text-neutral-500 dark:text-neutral-500">
                  Reduced the batch size after the first timeout, then stopped
                  to avoid partial writes.
                </p>
              </div>
            </section>

            <section>
              <SectionLabel>Output</SectionLabel>
              <ul className="divide-y divide-neutral-200/70 overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
                {[
                  {
                    name: "ledger-partial.csv",
                    meta: "1,024 of 2,244 rows · 84 KB",
                  },
                  { name: "run.log", meta: "Full trace · 12 KB" },
                ].map((file) => (
                  <li
                    key={file.name}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-neutral-900 dark:text-neutral-100">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
                        {file.meta}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Download ${file.name}`}
                      className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                    >
                      <Download
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            feed.edges.start ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            feed.edges.end ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
}

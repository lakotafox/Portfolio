"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type StepState = "done" | "running" | "queued";

type Step = {
  title: string;
  state: StepState;
  duration: string;
};

type Phase = {
  title: string;
  steps: Step[];
};

const PHASES: Phase[] = [
  {
    title: "Investigate",
    steps: [
      {
        title: "Read the billing contract notes",
        state: "done",
        duration: "3m",
      },
      { title: "Map the entitlement resolver", state: "done", duration: "2m" },
      {
        title: "Trace an expired key end to end",
        state: "done",
        duration: "4m",
      },
      {
        title: "Collect the failing support tickets",
        state: "done",
        duration: "2m",
      },
      { title: "Diff the two tier tables", state: "done", duration: "1m" },
      { title: "Check the renewal webhook log", state: "done", duration: "3m" },
      { title: "Write up the root cause", state: "done", duration: "2m" },
    ],
  },
  {
    title: "Implement",
    steps: [
      {
        title: "Patch the tier lookup fallback",
        state: "done",
        duration: "11m",
      },
      { title: "Add the grace-window constant", state: "done", duration: "1m" },
      { title: "Add a renewal-grace test", state: "running", duration: "4m" },
      {
        title: "Cover the expired-key branch",
        state: "queued",
        duration: "3m",
      },
      {
        title: "Run the license branch checks",
        state: "queued",
        duration: "5m",
      },
      {
        title: "Regenerate the registry payloads",
        state: "queued",
        duration: "2m",
      },
      {
        title: "Update the installation docs",
        state: "queued",
        duration: "3m",
      },
    ],
  },
  {
    title: "Verify",
    steps: [
      {
        title: "Deploy to the staging project",
        state: "queued",
        duration: "4m",
      },
      { title: "Run the smoke tests", state: "queued", duration: "6m" },
      { title: "Check the billing dashboard", state: "queued", duration: "2m" },
      {
        title: "Compare the entitlement counts",
        state: "queued",
        duration: "2m",
      },
      { title: "Replay the failing tickets", state: "queued", duration: "3m" },
      { title: "Notify the reviewer channel", state: "queued", duration: "1m" },
      { title: "Summarize the handoff", state: "queued", duration: "2m" },
    ],
  },
];

const STATE_LABEL: Record<StepState, string> = {
  done: "Done",
  running: "Running",
  queued: "Queued",
};

const DOT_TONE: Record<StepState, string> = {
  done: "bg-neutral-300 dark:bg-neutral-600",
  running:
    "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500",
  queued: "bg-neutral-300 dark:bg-neutral-600",
};

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

function PhaseColumn({ phase }: { phase: Phase }) {
  const list = useScrollFade<HTMLOListElement>();
  const done = phase.steps.filter((s) => s.state === "done").length;

  return (
    <section className="flex shrink-0 flex-col gap-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 lg:min-h-0 lg:shrink dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="flex h-10 shrink-0 items-center gap-2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-950">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-500 dark:text-neutral-500">
          {phase.title}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
          {done}/{phase.steps.length}
        </span>
      </h3>

      <div className="relative overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white lg:min-h-0 lg:flex-1 dark:border-neutral-800 dark:bg-neutral-950">
        <ol
          ref={list.ref}
          onScroll={list.onScroll}
          className="space-y-1 overscroll-contain p-1.5 lg:h-full lg:overflow-y-auto"
        >
          {phase.steps.map((step) => (
            <li
              key={step.title}
              className="rounded-[var(--rb-r-md,8px)] px-2.5 py-2"
            >
              <p
                className={cx(
                  "truncate text-[13px]",
                  step.state === "running"
                    ? "font-medium text-neutral-900 dark:text-neutral-100"
                    : step.state === "done"
                      ? "text-neutral-600 dark:text-neutral-400"
                      : "text-neutral-500 dark:text-neutral-500",
                )}
              >
                {step.title}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-500">
                <span
                  aria-hidden="true"
                  className={cx(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    DOT_TONE[step.state],
                  )}
                />
                <span className="truncate">{STATE_LABEL[step.state]}</span>
                <span aria-hidden="true">·</span>
                <span className="shrink-0 tabular-nums">{step.duration}</span>
              </p>
            </li>
          ))}
        </ol>

        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            list.edges.start ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            list.edges.end ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </section>
  );
}

export default function AgentPlan5() {
  const all = PHASES.flatMap((p) => p.steps);
  const doneCount = all.filter((s) => s.state === "done").length;
  const cols = useScrollFade<HTMLDivElement>();

  return (
    <div className="relative flex h-full min-h-[560px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <header className="mb-3 flex shrink-0 items-center gap-3">
        <h2 className="min-w-0 flex-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Fix billing entitlements
        </h2>
        <span className="shrink-0 text-[13px] tabular-nums text-neutral-500 dark:text-neutral-400">
          {doneCount} of {all.length} done
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={cols.ref}
          onScroll={cols.onScroll}
          className="flex h-full flex-col gap-3 overflow-y-auto overscroll-contain lg:grid lg:grid-cols-3 lg:overflow-hidden"
        >
          {PHASES.map((phase) => (
            <PhaseColumn key={phase.title} phase={phase} />
          ))}
        </div>

        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            cols.edges.start ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            cols.edges.end ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
}

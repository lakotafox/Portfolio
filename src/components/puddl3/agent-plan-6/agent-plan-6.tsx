"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Play, Square } from "lucide-react";

const TOOLS = [
  "Read files",
  "Search code",
  "Edit files",
  "Run tests",
  "Shell commands",
];

const PHASES = [
  { name: "Prepare the data", steps: 2, time: "5m" },
  { name: "Apply the migration", steps: 3, time: "11m" },
  { name: "Ship the change", steps: 2, time: "4m" },
  { name: "Verify in staging", steps: 3, time: "6m" },
];

const totalSteps = PHASES.reduce((sum, p) => sum + p.steps, 0);

const DEFAULT_GOAL =
  "Repairs the tier lookup so expired keys fall back to the renewal grace period before access is revoked.";

const TERTIARY_BUTTON =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-3 text-sm font-medium text-neutral-700 transition-[transform,background-color,color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

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

export default function AgentPlan6() {
  const body = useScrollFade<HTMLElement>();
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_GOAL);
  const [running, setRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) textareaRef.current?.focus({ preventScroll: true });
  }, [editing]);

  const startEditing = () => {
    setDraft(goal);
    setEditing(true);
  };

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <header className="mb-3 flex shrink-0 items-center gap-3">
        <h2 className="min-w-0 flex-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Fix billing entitlements
        </h2>
        <span className="shrink-0 text-[13px] tabular-nums text-neutral-500 dark:text-neutral-400">
          {totalSteps} steps
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <main
          ref={body.ref}
          onScroll={body.onScroll}
          className="h-full space-y-4 overflow-y-auto overscroll-contain"
        >
          <section>
            <h3 className="mb-2 px-1 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Goal
            </h3>
            <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              {editing ? (
                <>
                  <textarea
                    ref={textareaRef}
                    rows={3}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    aria-label="Plan goal"
                    className="w-full resize-none rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-neutral-900 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGoal(draft.trim() || DEFAULT_GOAL);
                        setEditing(false);
                      }}
                      className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className={TERTIARY_BUTTON}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {goal}
                </p>
              )}
            </div>
          </section>

          <dl className="grid grid-cols-3 gap-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="min-w-0 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
              <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                Steps
              </dt>
              <dd className="mt-1 text-lg font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                {totalSteps}
              </dd>
            </div>
            <div className="min-w-0 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
              <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                Est. time
              </dt>
              <dd className="mt-1 text-lg font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                26m
              </dd>
            </div>
            <div className="min-w-0 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
              <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                Est. cost
              </dt>
              <dd className="mt-1 text-lg font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                $0.54
              </dd>
            </div>
          </dl>

          <section>
            <h3 className="mb-2 px-1 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Tools
            </h3>
            <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <ul className="flex flex-wrap gap-1.5">
                {TOOLS.map((tool) => (
                  <li
                    key={tool}
                    className="inline-flex h-7 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h3 className="mb-2 px-1 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Breakdown
            </h3>
            <ul className="space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
              {PHASES.map((phase, index) => (
                <li
                  key={phase.name}
                  className="flex h-11 items-center gap-2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-xs tabular-nums text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {phase.name}
                  </span>
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
                    {phase.steps} steps
                  </span>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
                    {phase.time}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950 ${
            body.edges.start ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950 ${
            body.edges.end ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <footer className="mt-3 flex shrink-0 items-center justify-end gap-2">
        <p className="hidden min-w-0 flex-1 truncate text-xs text-neutral-500 sm:block dark:text-neutral-500">
          {running ? (
            <>
              Running{" "}
              <span className="tabular-nums">step 1 of {totalSteps}</span>
            </>
          ) : (
            "Review the plan before it runs."
          )}
        </p>
        {running ? (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className={TERTIARY_BUTTON}
          >
            <Square
              aria-hidden="true"
              className="h-4 w-4 shrink-0 fill-current"
            />
            Stop
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={startEditing}
              disabled={editing}
              className={TERTIARY_BUTTON}
            >
              <Pencil aria-hidden="true" className="h-4 w-4 shrink-0" />
              Edit plan
            </button>
            <button
              type="button"
              onClick={() => setRunning(true)}
              disabled={editing}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <Play aria-hidden="true" className="h-4 w-4 shrink-0" />
              Run plan
            </button>
          </>
        )}
      </footer>
    </div>
  );
}

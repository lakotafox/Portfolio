"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type StepState = "done" | "running" | "queued" | "failed";

type Sub = {
  id: string;
  title: string;
  state: StepState;
};

type Group = {
  id: string;
  title: string;
  subs: Sub[];
};

const GROUPS: Group[] = [
  {
    id: "prepare",
    title: "Prepare the data",
    subs: [
      { id: "p1", title: "Load the source files", state: "done" },
      { id: "p2", title: "Validate the schema", state: "done" },
      { id: "p3", title: "Snapshot the current rows", state: "done" },
    ],
  },
  {
    id: "migrate",
    title: "Apply the migration",
    subs: [
      { id: "m1", title: "Write the migration file", state: "done" },
      { id: "m2", title: "Backfill the user rows", state: "done" },
      { id: "m3", title: "Verify the row counts", state: "failed" },
      { id: "m4", title: "Drop the legacy tier column", state: "queued" },
    ],
  },
  {
    id: "ship",
    title: "Ship the change",
    subs: [
      { id: "s1", title: "Update the changelog", state: "queued" },
      { id: "s2", title: "Tag the release", state: "queued" },
      { id: "s3", title: "Publish the registry payloads", state: "queued" },
    ],
  },
  {
    id: "verify",
    title: "Verify in staging",
    subs: [
      { id: "v1", title: "Run the smoke tests", state: "queued" },
      { id: "v2", title: "Check the billing dashboard", state: "queued" },
      { id: "v3", title: "Compare the entitlement counts", state: "queued" },
    ],
  },
];

const STATE_LABEL: Record<StepState, string> = {
  done: "Done",
  running: "Running",
  queued: "Queued",
  failed: "Failed",
};

const DOT_TONE: Record<StepState, string> = {
  done: "bg-neutral-300 dark:bg-neutral-600",
  running:
    "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500",
  queued: "bg-neutral-300 dark:bg-neutral-600",
  failed: "bg-red-500",
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

export default function AgentPlan3() {
  const list = useScrollFade<HTMLUListElement>();
  const [open, setOpen] = useState<Record<string, boolean>>({
    prepare: true,
    migrate: true,
    ship: false,
    verify: false,
  });
  const [retried, setRetried] = useState<Record<string, boolean>>({});

  const stateOf = (sub: Sub): StepState =>
    retried[sub.id] ? "running" : sub.state;

  const all = GROUPS.flatMap((g) => g.subs);
  const doneCount = all.filter((s) => stateOf(s) === "done").length;

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <header className="mb-3 flex shrink-0 items-center gap-3">
        <h2 className="min-w-0 flex-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Migrate the entitlement tables
        </h2>
        <span className="shrink-0 text-[13px] tabular-nums text-neutral-500 dark:text-neutral-400">
          {doneCount} of {all.length} done
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <ul
            ref={list.ref}
            onScroll={list.onScroll}
            className="h-full space-y-1 overflow-y-auto overscroll-contain p-2"
          >
            {GROUPS.map((group) => {
              const isOpen = open[group.id];
              const done = group.subs.filter(
                (s) => stateOf(s) === "done",
              ).length;

              return (
                <li key={group.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${group.id}-steps`}
                    onClick={() =>
                      setOpen((prev) => ({
                        ...prev,
                        [group.id]: !prev[group.id],
                      }))
                    }
                    className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] p-2 text-left transition-colors duration-150 ease-out hover:bg-neutral-50 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:hover:bg-neutral-900 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 dark:bg-neutral-800">
                      <ChevronRight
                        aria-hidden="true"
                        className={cx(
                          "h-3.5 w-3.5 text-neutral-500 transition-transform duration-200 ease-out motion-reduce:transition-none dark:text-neutral-500",
                          isOpen && "rotate-90",
                        )}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {group.title}
                    </span>
                    <span className="w-20 shrink-0 text-right text-[13px] tabular-nums text-neutral-600 dark:text-neutral-400">
                      {done} of {group.subs.length}
                    </span>
                  </button>

                  {isOpen && (
                    <ul
                      id={`${group.id}-steps`}
                      className="mt-1 space-y-1 pl-6"
                    >
                      {group.subs.map((sub, subIndex) => {
                        const state = stateOf(sub);
                        return (
                          <li
                            key={sub.id}
                            className="flex h-11 items-center gap-2 rounded-[var(--rb-r-md,8px)] p-2 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                          >
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-xs tabular-nums text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500">
                              {subIndex + 1}
                            </span>
                            <span
                              className={cx(
                                "min-w-0 flex-1 truncate text-[13px]",
                                state === "done" &&
                                  "text-neutral-600 dark:text-neutral-400",
                                state === "queued" &&
                                  "text-neutral-500 dark:text-neutral-500",
                                (state === "failed" || state === "running") &&
                                  "font-medium text-neutral-900 dark:text-neutral-100",
                              )}
                            >
                              {sub.title}
                            </span>

                            {state === "failed" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRetried((prev) => ({
                                    ...prev,
                                    [sub.id]: true,
                                  }))
                                }
                                className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2 text-xs font-medium text-neutral-700 transition-[transform,background-color,color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                              >
                                <RotateCcw
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5"
                                />
                                Retry
                              </button>
                            )}

                            <span className="flex w-20 shrink-0 items-center justify-end gap-1.5">
                              <span
                                aria-hidden="true"
                                className={cx(
                                  "h-1.5 w-1.5 shrink-0 rounded-full",
                                  DOT_TONE[state],
                                )}
                              />
                              <span
                                className={cx(
                                  "text-[13px]",
                                  state === "failed"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-neutral-600 dark:text-neutral-400",
                                )}
                              >
                                {STATE_LABEL[state]}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

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
      </div>
    </div>
  );
}

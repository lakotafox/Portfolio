"use client";

import { useEffect, useState } from "react";
import { Check, TriangleAlert } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

type TaskState = "done" | "running" | "pending" | "warning";

const TASKS: { id: string; title: string; meta: string; state: TaskState }[] = [
  {
    id: "snapshot",
    title: "Snapshot source database",
    meta: "4.2 GB · 38s",
    state: "done",
  },
  {
    id: "schema",
    title: "Rebuild schema and indexes",
    meta: "126 tables · 1m 04s",
    state: "done",
  },
  {
    id: "rows",
    title: "Copy rows",
    meta: "8.4M of 12.1M rows",
    state: "running",
  },
  {
    id: "attachments",
    title: "Transfer attachments",
    meta: "Queued · 61,208 files",
    state: "pending",
  },
  {
    id: "search",
    title: "Rebuild search index",
    meta: "Two entries need review",
    state: "warning",
  },
  {
    id: "cutover",
    title: "Switch traffic to the new cluster",
    meta: "Waiting for approval",
    state: "pending",
  },
];

export default function Wizard6() {
  const [percent, setPercent] = useState(64);

  useEffect(() => {
    const id = setInterval(() => {
      setPercent((p) => (p >= 92 ? 64 : p + 2));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full min-h-[640px] w-full overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <section className="mx-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Migrating workspace
            </h2>
            <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
              Step 3 of 4. You can leave this running and come back.
            </p>
          </div>
          <p className="shrink-0 text-xs tabular-nums text-neutral-500">
            ~6 min left
          </p>
        </div>

        <div className="min-h-0 flex-1 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Migration progress"
              className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
            >
              <div
                style={{ width: `${percent}%` }}
                className="h-full rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] transition-[width] duration-500 ease-out motion-reduce:transition-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
              />
            </div>
            <p className="shrink-0 text-xs tabular-nums text-neutral-500">
              {percent}%
            </p>
          </div>

          <ul className="mt-5 divide-y divide-neutral-200 dark:divide-neutral-800">
            {TASKS.map((task) => (
              <li key={task.id} className="flex items-center gap-3 py-3">
                <span
                  aria-hidden="true"
                  className={cx(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    task.state === "done" &&
                      "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                    task.state === "running" &&
                      "border border-dashed border-neutral-400 bg-neutral-100 dark:border-neutral-500 dark:bg-neutral-800",
                    task.state === "pending" &&
                      "border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
                    task.state === "warning" &&
                      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
                  )}
                >
                  {task.state === "done" && (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  )}
                  {task.state === "running" && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] motion-reduce:animate-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]" />
                  )}
                  {task.state === "pending" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  )}
                  {task.state === "warning" && (
                    <TriangleAlert className="h-3 w-3" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={cx(
                      "truncate text-[13px]",
                      task.state === "pending"
                        ? "text-neutral-500"
                        : "font-medium text-neutral-900 dark:text-neutral-100",
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {task.meta}
                  </p>
                </div>

                {task.state === "warning" && (
                  <button
                    type="button"
                    className={cx(
                      "inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                      transition,
                      focus,
                    )}
                  >
                    Review
                  </button>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs leading-relaxed text-neutral-500">
            The source workspace stays read-only until cutover. Nothing is
            deleted, so a failed step can be retried without starting over.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            className={cx(
              "inline-flex h-9 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
              transition,
              focus,
            )}
          >
            Cancel migration
          </button>

          <button
            type="button"
            className={cx(
              "inline-flex h-9 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-4 text-[13px] font-medium text-neutral-900 hover:bg-neutral-50 active:scale-[0.97] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900",
              transition,
              focus,
            )}
          >
            Run in background
          </button>
        </div>
      </section>
    </div>
  );
}

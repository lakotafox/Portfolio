"use client";

import { CreditCard } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const KEPT = [
  ["Workspaces", "4 kept, read-only"],
  ["Saved views", "26 kept"],
  ["Scheduled exports", "Paused"],
  ["Team members", "7 signed out"],
];

export default function Paywall5() {
  return (
    <div className="flex h-full min-h-[560px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[560px]">
        <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-[12px] tracking-[0.08em] text-neutral-500 uppercase">
            Trial ended
          </p>
          <h2 className="mt-1.5 text-lg font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Your 14 days with Pro are up
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
            Northwind Analytics is in read-only mode. Reactivate and everything
            picks up exactly where it stopped, including the exports that were
            mid-schedule.
          </p>

          <div className={cx(frame, "mt-4 space-y-1")}>
            {KEPT.map(([label, value]) => (
              <div
                key={label}
                className={cx(
                  panel,
                  "flex items-center justify-between gap-3 px-3.5 py-2.5",
                )}
              >
                <p className="truncate text-[13px] text-neutral-600 dark:text-neutral-400">
                  {label}
                </p>
                <p className="shrink-0 text-[13px] text-neutral-900 dark:text-neutral-100">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 px-3.5 py-3 dark:border-neutral-800">
            <CreditCard
              className="h-4 w-4 shrink-0 text-neutral-500"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                Card ending 4471
              </p>
              <p className="text-[12px] text-neutral-500">
                Expires 08/28 · billed to Northwind Ltd
              </p>
            </div>
            <button
              type="button"
              className={cx(
                "shrink-0 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-1.5 py-1 text-[12px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              Change
            </button>
          </div>

          <button
            type="button"
            className={cx(
              "mt-4 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
              transition,
              focus,
            )}
          >
            Reactivate Pro: $168 / yr
          </button>

          <p className="mt-2.5 text-center text-[12px] text-neutral-500">
            Renews yearly. Cancel any time before the renewal date.
          </p>
        </div>
      </div>
    </div>
  );
}

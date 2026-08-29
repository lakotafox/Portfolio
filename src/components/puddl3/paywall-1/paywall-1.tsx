"use client";

import { Check, Lock } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const INCLUDED = [
  "Every issue in the archive, going back to 2019",
  "The weekly teardown, two days before it goes public",
  "Source files and spreadsheets for each analysis",
];

export default function Paywall1() {
  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[680px]">
        <p className="text-[12px] tracking-[0.08em] text-neutral-500 uppercase">
          Issue 84 · Infrastructure
        </p>
        <h2 className="mt-1.5 text-xl font-medium tracking-[-0.01em] text-neutral-900 sm:text-2xl dark:text-neutral-100">
          What a database migration actually costs
        </h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Marcus Bell · 14 min read
        </p>

        <div className="relative mt-4 max-h-[92px] overflow-hidden sm:mt-5 sm:max-h-none">
          <div
            aria-hidden
            className="space-y-3 text-[14px] leading-[1.75] text-neutral-700 dark:text-neutral-300"
          >
            <p>
              Northwind moved 11 terabytes between two managed Postgres clusters
              last spring. The plan called for four hours of degraded writes on
              a Saturday night. What the team got instead was nine days of
              partial availability, an unplanned index rebuild, and a bill
              roughly three times the estimate.
            </p>
            <p>
              None of that came from the migration itself. The copy finished
              more or less on schedule. The cost showed up in everything the
              copy touched: connection pools sized for the old topology, a
              backfill job competing with production reads, and a rollback path
              that quietly stopped working once the first schema change landed.
            </p>
            <p>
              This teardown walks through the three decisions that turned a
              maintenance window into a quarter of remediation work, using the
              team&apos;s own incident timeline and the invoices either side of
              the cutover.
            </p>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b sm:h-40 from-transparent to-white dark:to-neutral-950"
          />
        </div>

        <div className="relative -mt-6 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200 dark:border-neutral-800"
          >
            <Lock className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
          </span>

          <h3 className="mt-3 text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
            Keep reading with a membership
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
            The rest of this teardown is for members. Cancel whenever, and keep
            everything you have downloaded.
          </p>

          <ul className="mt-3 space-y-2 sm:mt-4">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-[13px] text-neutral-700 dark:text-neutral-300"
              >
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center">
            <button
              type="button"
              className={cx(
                "inline-flex h-9 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              Become a member: $9/mo
            </button>
            <button
              type="button"
              className={cx(
                "inline-flex h-9 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-4 text-[13px] font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              I already have an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

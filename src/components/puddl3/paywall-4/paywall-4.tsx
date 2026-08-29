"use client";

import { AlertCircle } from "lucide-react";

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

type Meter = { label: string; used: number; limit: number; unit: string };

const METERS: Meter[] = [
  { label: "API requests", used: 50_000, limit: 50_000, unit: "" },
  { label: "Rows processed", used: 1_840_000, limit: 2_000_000, unit: "" },
  { label: "Connected sources", used: 3, limit: 3, unit: "" },
];

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 2)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}k`
      : `${n}`;

export default function Paywall4() {
  return (
    <div className="flex h-full min-h-[560px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[620px]">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200 dark:border-neutral-800"
          >
            <AlertCircle className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              You have hit the Starter limit
            </h2>
            <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-500">
              Ingestion is paused until 1 April, or until you raise the limit.
              Nothing has been deleted, and queries on existing data still work.
            </p>
          </div>
        </div>

        <div className={cx(frame, "mt-4 space-y-1")}>
          {METERS.map((m) => {
            const pct = Math.min(100, Math.round((m.used / m.limit) * 100));
            const maxed = pct >= 100;
            return (
              <div key={m.label} className={cx(panel, "p-3.5")}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                    {m.label}
                  </p>
                  <p className="shrink-0 text-[12px] text-neutral-500 tabular-nums">
                    <span
                      className={cx(
                        maxed &&
                          "font-medium text-neutral-900 dark:text-neutral-100",
                      )}
                    >
                      {fmt(m.used)}
                    </span>{" "}
                    / {fmt(m.limit)}
                    {m.unit}
                  </p>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className={cx(
                      "h-full rounded-full",
                      maxed
                        ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                        : "bg-neutral-400 dark:bg-neutral-500",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                Pro raises every limit tenfold
              </p>
              <p className="mt-0.5 text-[12px] text-neutral-500">
                500k requests, 20M rows, unlimited sources. $24 per seat / mo.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                className={cx(
                  "inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-3 sm:w-auto text-[13px] font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                Buy a one-off top-up
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 sm:w-auto text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                  transition,
                  focus,
                )}
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

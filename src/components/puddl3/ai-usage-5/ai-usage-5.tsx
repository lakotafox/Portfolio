"use client";

import { useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950";

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const SPENT = 1840;

const THRESHOLDS = [50, 75, 90] as const;

export default function AiUsage5() {
  const [budget, setBudget] = useState(2500);
  const [alerts, setAlerts] = useState<number[]>([75, 90]);
  const [hardStop, setHardStop] = useState(true);
  const [digest, setDigest] = useState(false);

  const pct = Math.min(100, (SPENT / budget) * 100);
  const projected = Math.round(SPENT * 1.42);
  const willBreach = projected > budget;

  const toggleAlert = (value: number) =>
    setAlerts((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value].sort((a, b) => a - b),
    );

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-3">
          <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Budget and alerts
          </h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Cap monthly model spend and decide who hears about it.
          </p>
        </div>

        <div className={cx(frame, "space-y-1")}>
          <div className={cx(panel, "p-4")}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13px] text-neutral-500">This month</p>
              <p className="text-[13px] text-neutral-500 tabular-nums">
                <span className="text-xl font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                  {money(SPENT)}
                </span>{" "}
                of {money(budget)}
              </p>
            </div>

            <div
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Budget consumed"
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900"
            >
              <div
                className={cx(
                  "h-full rounded-full bg-neutral-900 dark:bg-neutral-100",
                  transition,
                )}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mt-3 flex items-center gap-2 text-[13px] text-neutral-500">
              <span
                className={cx(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  willBreach
                    ? "bg-neutral-900 dark:bg-neutral-100"
                    : "bg-neutral-300 dark:bg-neutral-600",
                )}
              />
              <span className="truncate">
                Projected {money(projected)} at current pace
                {willBreach ? ", over budget on the 26th" : ", within budget"}.
              </span>
            </div>
          </div>

          <div className={cx(panel, "p-4")}>
            <label
              htmlFor="ai-usage-5-budget"
              className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
            >
              Monthly cap
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="ai-usage-5-budget"
                type="range"
                min={500}
                max={10_000}
                step={250}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className={cx(
                  "h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-neutral-900 dark:bg-neutral-800 dark:accent-neutral-100",
                  focus,
                )}
              />
              <span className="w-16 shrink-0 text-right text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                {money(budget)}
              </span>
            </div>

            <p className="mt-4 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Notify at
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {THRESHOLDS.map((threshold) => {
                const on = alerts.includes(threshold);
                return (
                  <button
                    key={threshold}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleAlert(threshold)}
                    className={cx(
                      "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border px-3 text-[13px] tabular-nums",
                      on
                        ? "border-neutral-900 bg-neutral-900 font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-neutral-100 dark:bg-neutral-100 dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                        : "border-neutral-200 text-neutral-500 hover:text-neutral-900 dark:border-neutral-800 dark:hover:text-neutral-100",
                      transition,
                      focus,
                    )}
                  >
                    {threshold}% of cap
                  </button>
                );
              })}
            </div>
          </div>

          <div className={panel}>
            {(
              [
                [
                  "Pause requests at 100%",
                  "New calls return a quota error until the next cycle.",
                  hardStop,
                  setHardStop,
                ],
                [
                  "Weekly spend digest",
                  "Sent to workspace admins every Monday.",
                  digest,
                  setDigest,
                ],
              ] as const
            ).map(([label, hint, on, set]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {label}
                  </p>
                  <p className="truncate text-[12px] text-neutral-500">
                    {hint}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={label}
                  onClick={() => set(!on)}
                  className={cx(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full",
                    on
                      ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                      : "bg-neutral-200 dark:bg-neutral-700",
                    transition,
                    focus,
                  )}
                >
                  <span
                    className={cx(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-neutral-900",
                      on ? "translate-x-[18px]" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";

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

const num = (n: number) => n.toLocaleString("en-US");

type Limit = {
  id: string;
  label: string;
  hint: string;
  used: number;
  cap: number;
  unit: string;
};

const LIMITS: Limit[] = [
  {
    id: "rpm",
    label: "Requests per minute",
    hint: "Rolling 60 second window",
    used: 412,
    cap: 500,
    unit: "req",
  },
  {
    id: "tpm",
    label: "Tokens per minute",
    hint: "Input and output combined",
    used: 148_000,
    cap: 400_000,
    unit: "tok",
  },
  {
    id: "concurrent",
    label: "Concurrent requests",
    hint: "In flight right now",
    used: 18,
    cap: 40,
    unit: "req",
  },
  {
    id: "batch",
    label: "Queued batch jobs",
    hint: "Waiting for a worker",
    used: 3,
    cap: 25,
    unit: "jobs",
  },
];

const TIERS = ["Tier 1", "Tier 2", "Tier 3"] as const;
type Tier = (typeof TIERS)[number];

const SCALE: Record<Tier, number> = {
  "Tier 1": 1,
  "Tier 2": 4,
  "Tier 3": 10,
};

export default function AiUsage3() {
  const [tier, setTier] = useState<Tier>("Tier 1");
  const scale = SCALE[tier];

  const rows = LIMITS.map((limit) => {
    const cap = limit.cap * scale;
    const pct = Math.min(100, (limit.used / cap) * 100);
    return { ...limit, cap, pct };
  });

  const strained = rows.filter((row) => row.pct >= 75).length;

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[620px]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Rate limits
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-neutral-500">
              <span
                className={cx(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  strained
                    ? "bg-neutral-900 dark:bg-neutral-100"
                    : "bg-neutral-300 dark:bg-neutral-600",
                )}
              />
              {strained
                ? `${strained} limit${strained > 1 ? "s" : ""} near capacity`
                : "All limits within range"}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Usage tier"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            {TIERS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={option === tier}
                onClick={() => setTier(option)}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                  option === tier
                    ? "bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className={cx(frame, "space-y-1")}>
          <div className={cx(panel, "divide-y divide-transparent")}>
            {rows.map((row) => (
              <div key={row.id} className="px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {row.label}
                    </p>
                    <p className="truncate text-[12px] text-neutral-500">
                      {row.hint}
                    </p>
                  </div>
                  <p className="shrink-0 text-[13px] text-neutral-500 tabular-nums">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {num(row.used)}
                    </span>{" "}
                    / {num(row.cap)} {row.unit}
                  </p>
                </div>

                <div
                  role="progressbar"
                  aria-valuenow={Math.round(row.pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${row.label} utilisation`}
                  className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900"
                >
                  <div
                    className={cx(
                      "h-full rounded-full",
                      transition,
                      row.pct >= 75
                        ? "bg-neutral-900 dark:bg-neutral-100"
                        : "bg-neutral-400 dark:bg-neutral-500",
                    )}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className={cx(
              panel,
              "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
            )}
          >
            <p className="flex min-w-0 items-center gap-2 text-[13px] text-neutral-500">
              {tier === "Tier 3" ? (
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              <span className="truncate">
                {tier === "Tier 3"
                  ? "Highest tier. Contact us for a bespoke ceiling."
                  : "Limits rise automatically once spend clears the next threshold."}
              </span>
            </p>
            <button
              type="button"
              className={cx(
                "inline-flex h-8 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-3 text-[13px] font-medium text-neutral-900 dark:border-neutral-800 dark:text-neutral-100",
                "hover:bg-neutral-50 dark:hover:bg-neutral-900",
                transition,
                focus,
              )}
            >
              Request an increase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

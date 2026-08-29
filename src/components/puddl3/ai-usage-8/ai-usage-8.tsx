"use client";

import { useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

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

type Meter = {
  id: string;
  label: string;
  used: number;
  cap: number;
  note: string;
};

const METERS: Meter[] = [
  {
    id: "messages",
    label: "Assistant messages",
    used: 1_842,
    cap: 2_000,
    note: "Resets 1 Jul",
  },
  {
    id: "runs",
    label: "Agent runs",
    used: 96,
    cap: 250,
    note: "Resets 1 Jul",
  },
  {
    id: "storage",
    label: "Indexed documents",
    used: 4_310,
    cap: 10_000,
    note: "Does not reset",
  },
  {
    id: "seats",
    label: "Member seats",
    used: 12,
    cap: 20,
    note: "Billed monthly",
  },
];

const SPARK = [18, 24, 21, 33, 29, 41, 38, 52, 47, 61, 58, 74];

export default function AiUsage8() {
  const [hover, setHover] = useState<number | null>(null);

  const top = METERS[0];
  const topPct = Math.round((top.used / top.cap) * 100);
  const max = Math.max(...SPARK);

  return (
    <div className="flex h-full min-h-[480px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Plan usage
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              Northwind · Team plan
            </p>
          </div>
          <button
            type="button"
            className={cx(
              "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            Details
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        <div className={cx(frame, "space-y-1")}>
          <div className={cx(panel, "p-4")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] text-neutral-500">{top.label}</p>
                <p className="mt-0.5 text-2xl font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                  {num(top.used)}
                  <span className="ml-1.5 text-[13px] font-normal text-neutral-500">
                    / {num(top.cap)}
                  </span>
                </p>
              </div>

              <div
                className="flex h-10 shrink-0 items-end gap-[3px]"
                onMouseLeave={() => setHover(null)}
                aria-hidden
              >
                {SPARK.map((v, i) => (
                  <span
                    key={i}
                    onMouseEnter={() => setHover(i)}
                    className={cx(
                      "w-[5px] rounded-[2px]",
                      transition,
                      hover === i
                        ? "bg-neutral-900 dark:bg-neutral-100"
                        : "bg-neutral-200 dark:bg-neutral-800",
                    )}
                    style={{ height: `${(v / max) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            <div
              role="progressbar"
              aria-valuenow={topPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${top.label} used`}
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900"
            >
              <div
                className={cx(
                  "h-full rounded-full bg-neutral-900 dark:bg-neutral-100",
                  transition,
                )}
                style={{ width: `${topPct}%` }}
              />
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-neutral-500">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900 dark:bg-neutral-100" />
              {topPct}% used · {top.note}
            </p>
          </div>

          <div className={panel}>
            {METERS.slice(1).map((meter) => {
              const pct = Math.round((meter.used / meter.cap) * 100);
              return (
                <div key={meter.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                      {meter.label}
                    </p>
                    <p className="shrink-0 text-[13px] text-neutral-500 tabular-nums">
                      {num(meter.used)} / {num(meter.cap)}
                    </p>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900">
                    <div
                      className="h-full rounded-full bg-neutral-400 dark:bg-neutral-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={cx(panel, "flex items-center justify-between gap-3 p-3")}
          >
            <p className="flex min-w-0 items-center gap-2 text-[13px] text-neutral-500">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">Unlimited messages on Scale.</span>
            </p>
            <button
              type="button"
              className={cx(
                "inline-flex h-8 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-neutral-900 px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-neutral-100 dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                "hover:bg-neutral-800 dark:hover:bg-white",
                transition,
                focus,
              )}
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

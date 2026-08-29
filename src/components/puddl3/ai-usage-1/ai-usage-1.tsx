"use client";

import { useMemo, useState } from "react";

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

const compact = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(Math.abs(n) >= 10_000_000 ? 0 : 1)}M`
    : Math.abs(n) >= 1_000
      ? `${(n / 1_000).toFixed(Math.abs(n) >= 10_000 ? 0 : 1)}k`
      : `${n}`;

const money = (n: number) =>
  n >= 100
    ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : `$${n.toFixed(2)}`;

const RANGES = ["7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];

type Day = { label: string; input: number; output: number };

const SERIES: Record<Range, Day[]> = {
  "7d": [
    { label: "Mon", input: 4.1, output: 1.6 },
    { label: "Tue", input: 5.3, output: 2.2 },
    { label: "Wed", input: 6.8, output: 2.6 },
    { label: "Thu", input: 5.9, output: 2.4 },
    { label: "Fri", input: 8.2, output: 3.4 },
    { label: "Sat", input: 2.4, output: 0.9 },
    { label: "Sun", input: 1.9, output: 0.7 },
  ],
  "30d": [
    { label: "W1", input: 22.4, output: 8.8 },
    { label: "W2", input: 26.1, output: 10.4 },
    { label: "W3", input: 31.7, output: 12.9 },
    { label: "W4", input: 34.6, output: 13.8 },
  ],
  "90d": [
    { label: "Apr", input: 71.2, output: 27.9 },
    { label: "May", input: 88.4, output: 35.1 },
    { label: "Jun", input: 96.8, output: 39.4 },
  ],
};

const RATE_IN = 3 / 1_000_000;
const RATE_OUT = 15 / 1_000_000;

export default function AiUsage1() {
  const [range, setRange] = useState<Range>("7d");
  const [active, setActive] = useState<number | null>(null);

  const days = SERIES[range];

  const totals = useMemo(() => {
    const input = days.reduce((sum, d) => sum + d.input, 0) * 1_000_000;
    const output = days.reduce((sum, d) => sum + d.output, 0) * 1_000_000;
    return {
      input,
      output,
      tokens: input + output,
      cost: input * RATE_IN + output * RATE_OUT,
    };
  }, [days]);

  const max = Math.max(...days.map((d) => d.input + d.output));

  const shown = active === null ? null : days[active];
  const shownCost = shown
    ? shown.input * 1_000_000 * RATE_IN + shown.output * 1_000_000 * RATE_OUT
    : null;

  return (
    <div className="flex h-full min-h-[480px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[840px]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Token usage
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              Input and output tokens billed to this workspace.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Range"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            {RANGES.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={option === range}
                onClick={() => {
                  setRange(option);
                  setActive(null);
                }}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] tabular-nums",
                  option === range
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
          <div className={cx(panel, "grid grid-cols-2 sm:grid-cols-4")}>
            {(
              [
                ["Total tokens", compact(totals.tokens)],
                ["Input", compact(totals.input)],
                ["Output", compact(totals.output)],
                ["Spend", money(totals.cost)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="px-4 py-3">
                <p className="text-[13px] text-neutral-500">{label}</p>
                <p className="mt-0.5 text-xl font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className={cx(panel, "p-4")}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500">
                  <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                  Input
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500">
                  <span className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  Output
                </span>
              </div>
              <p className="truncate text-[13px] text-neutral-500 tabular-nums">
                {shown
                  ? `${shown.label} · ${compact(
                      (shown.input + shown.output) * 1_000_000,
                    )} · ${money(shownCost ?? 0)}`
                  : "Hover a bar for detail"}
              </p>
            </div>

            <div
              className="mt-4 flex h-44 items-end gap-2"
              onMouseLeave={() => setActive(null)}
            >
              {days.map((day, i) => {
                const total = day.input + day.output;
                const isActive = active === i;
                return (
                  <button
                    key={day.label}
                    type="button"
                    aria-label={`${day.label}: ${compact(
                      total * 1_000_000,
                    )} tokens`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className={cx(
                      "group flex h-full flex-1 cursor-pointer flex-col justify-end gap-1 rounded-[var(--rb-r-sm,6px)]",
                      focus,
                    )}
                  >
                    <div
                      className="mx-auto flex w-full max-w-[36px] flex-col justify-end"
                      style={{ height: `${(total / max) * 100}%` }}
                    >
                      <div
                        className={cx(
                          "w-full rounded-t-[var(--rb-r-sm,6px)]",
                          transition,
                          isActive
                            ? "bg-neutral-400 dark:bg-neutral-500"
                            : "bg-neutral-300 dark:bg-neutral-600",
                        )}
                        style={{ height: `${(day.output / total) * 100}%` }}
                      />
                      <div
                        className={cx(
                          "w-full rounded-b-[var(--rb-r-sm,6px)]",
                          transition,
                          isActive
                            ? "bg-neutral-700 dark:bg-white"
                            : "bg-neutral-900 dark:bg-neutral-100",
                        )}
                        style={{ height: `${(day.input / total) * 100}%` }}
                      />
                    </div>
                    <span
                      className={cx(
                        "text-[11px] tabular-nums",
                        transition,
                        isActive
                          ? "text-neutral-900 dark:text-neutral-100"
                          : "text-neutral-500",
                      )}
                    >
                      {day.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

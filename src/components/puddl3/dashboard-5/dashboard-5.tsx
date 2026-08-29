"use client";

import { ArrowUpRight } from "lucide-react";

type Meter = { label: string; used: string; limit: string; pct: number };

const METERS: Meter[] = [
  { label: "API requests", used: "1.24M", limit: "2M", pct: 62 },
  { label: "Seats", used: "18", limit: "20", pct: 90 },
  { label: "Storage", used: "41.2 GB", limit: "50 GB", pct: 82 },
  { label: "Build minutes", used: "4,820", limit: "5,000", pct: 96 },
  { label: "Bandwidth", used: "320 GB", limit: "1 TB", pct: 31 },
];

const Y_MAX = 9000;
const Y_TICKS = [9000, 6000, 3000, 0];
const ALLOWANCE = 5000;

const ACTUAL: [number, number][] = [
  [1, 0],
  [4, 900],
  [7, 1750],
  [10, 2600],
  [13, 3450],
  [16, 4300],
  [18, 4820],
];

const PROJECTED: [number, number][] = [
  [18, 4820],
  [22, 5900],
  [26, 6980],
  [31, 8330],
];

const X_LABELS = ["Mar 1", "Mar 11", "Mar 21", "Mar 31"];

function meterFill(pct: number) {
  if (pct >= 95) return "bg-red-500";
  if (pct >= 90) return "bg-amber-500";
  return "bg-neutral-900 dark:bg-neutral-100";
}

function path(points: [number, number][]) {
  return points
    .map(([day, val], i) => {
      const x = ((day - 1) / 30) * 100;
      const y = 100 - (val / Y_MAX) * 100;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function Dashboard5() {
  const allowanceY = 100 - (ALLOWANCE / Y_MAX) * 100;

  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 sm:px-6 dark:border-neutral-800">
        <h1 className="truncate text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
          Usage
        </h1>
        <span className="shrink-0 text-[13px] tabular-nums text-neutral-500">
          Mar 1 – Mar 31
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Team plan
            </p>
            <p className="mt-0.5 text-[13px] tabular-nums text-neutral-600 dark:text-neutral-400">
              $99 / month · renews Mar 31
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
          >
            Upgrade plan
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>

        <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Included this month
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {METERS.map((m) => (
              <li key={m.label}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {m.label}
                  </span>
                  <span className="tabular-nums text-neutral-500">
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {m.used}
                    </span>{" "}
                    / {m.limit}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className={`h-full rounded-full ${meterFill(m.pct)}`}
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Build minutes burn-down
              </h2>
              <p className="mt-1 flex items-start gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>
                  Projected to exceed the 5,000 minute allowance on Mar 19
                </span>
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-4 pt-1 text-xs text-neutral-500 sm:flex">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                Used
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0 w-4 border-t border-dashed border-neutral-400 dark:border-neutral-500" />
                Projected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0 w-4 border-t border-dashed border-neutral-300 dark:border-neutral-600" />
                Allowance
              </span>
            </div>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 gap-3">
            <div className="-my-2 flex w-10 shrink-0 flex-col justify-between text-right text-[11px] leading-4 tabular-nums text-neutral-500">
              {Y_TICKS.map((t) => (
                <span key={t}>{t === 0 ? "0" : `${t / 1000}k`}</span>
              ))}
            </div>
            <div className="relative min-h-0 flex-1">
              <svg
                aria-hidden
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full"
              >
                {Y_TICKS.map((t) => {
                  const y = 100 - (t / Y_MAX) * 100;
                  return (
                    <line
                      key={t}
                      x1="0"
                      x2="100"
                      y1={y}
                      y2={y}
                      vectorEffect="non-scaling-stroke"
                      className="stroke-neutral-200/60 dark:stroke-neutral-800/60"
                      strokeWidth={1}
                    />
                  );
                })}
                <line
                  x1="0"
                  x2="100"
                  y1={allowanceY}
                  y2={allowanceY}
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-neutral-300 dark:stroke-neutral-600"
                  strokeWidth={1}
                />
                <path
                  d={path(PROJECTED)}
                  fill="none"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-neutral-400 dark:stroke-neutral-500"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                />
                <path
                  d={path(ACTUAL)}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-neutral-900 dark:stroke-neutral-100"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex gap-3">
            <div className="w-10 shrink-0" aria-hidden />
            <div className="flex min-w-0 flex-1 justify-between text-[11px] tabular-nums text-neutral-500">
              {X_LABELS.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

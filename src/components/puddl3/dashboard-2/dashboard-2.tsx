"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type RangeKey = "7 days" | "30 days" | "90 days";

type RangeData = {
  total: number;
  delta: string;
  positive: boolean;
  series: number[];
  xLabels: string[];
};

const Y_MAX = 700;
const Y_TICKS = [700, 525, 350, 175, 0];
const TARGET = 500;

const RANGES: Record<RangeKey, RangeData> = {
  "7 days": {
    total: 3102,
    delta: "+8.2%",
    positive: true,
    series: [412, 388, 455, 470, 521, 498, 543],
    xLabels: ["Mar 3", "Mar 5", "Mar 7", "Mar 9"],
  },
  "30 days": {
    total: 12847,
    delta: "+12.4%",
    positive: true,
    series: [
      360, 402, 388, 430, 455, 470, 442, 498, 512, 505, 548, 560, 595, 610, 640,
    ],
    xLabels: ["Feb 8", "Feb 15", "Feb 22", "Mar 1", "Mar 8"],
  },
  "90 days": {
    total: 41530,
    delta: "−1.6%",
    positive: false,
    series: [
      520, 505, 540, 560, 548, 590, 575, 610, 600, 585, 560, 540, 505, 480, 455,
    ],
    xLabels: ["Dec 8", "Jan 7", "Feb 6", "Mar 8"],
  },
};

const SOURCES = [
  {
    source: "Organic search",
    pct: 0.4,
    conv: "3.9%",
    trend: [30, 34, 33, 38, 42, 46, 51],
  },
  {
    source: "Direct",
    pct: 0.24,
    conv: "5.1%",
    trend: [40, 41, 39, 43, 42, 45, 47],
  },
  {
    source: "Referral",
    pct: 0.17,
    conv: "2.8%",
    trend: [22, 24, 23, 21, 25, 24, 26],
  },
  {
    source: "Social",
    pct: 0.112,
    conv: "1.6%",
    trend: [18, 20, 24, 22, 19, 17, 15],
  },
  {
    source: "Email",
    pct: 0.078,
    conv: "6.4%",
    trend: [12, 13, 12, 14, 15, 16, 18],
  },
];

const RANGE_KEYS = Object.keys(RANGES) as RangeKey[];

function allocate(total: number, pcts: number[]) {
  const raw = pcts.map((p) => total * p);
  const out = raw.map(Math.floor);
  const used = out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < total - used; k++) out[order[k].i]++;
  return out;
}

function linePath(values: number[]) {
  const step = 100 / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = 100 - (v / Y_MAX) * 100;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function areaPath(values: number[]) {
  return `${linePath(values)} L100 100 L0 100 Z`;
}

function sparkPoints(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function RangeTabs({
  value,
  onChange,
  baseId,
  panelId,
}: {
  value: RangeKey;
  onChange: (next: RangeKey) => void;
  baseId: string;
  panelId: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (next: number) => {
    const index = (next + RANGE_KEYS.length) % RANGE_KEYS.length;
    onChange(RANGE_KEYS[index]);
    refs.current[index]?.focus({ preventScroll: true });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = RANGE_KEYS.indexOf(value);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(current + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      move(0);
    } else if (event.key === "End") {
      event.preventDefault();
      move(RANGE_KEYS.length - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Date range"
      onKeyDown={onKeyDown}
      className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 p-0.5 dark:bg-neutral-800"
    >
      {RANGE_KEYS.map((k, i) => {
        const selected = k === value;
        return (
          <button
            key={k}
            ref={(node) => {
              refs.current[i] = node;
            }}
            type="button"
            role="tab"
            id={`${baseId}-${i}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(k)}
            className={cx(
              "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] font-medium transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
              selected
                ? "bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
            )}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

export default function Dashboard2() {
  const [range, setRange] = useState<RangeKey>("30 days");
  const data = RANGES[range];
  const baseId = useId();
  const panelId = `${baseId}-panel`;

  const rows = useMemo(() => {
    const counts = allocate(
      data.total,
      SOURCES.map((s) => s.pct),
    );
    return SOURCES.map((s, i) => ({
      ...s,
      count: counts[i],
      share: (s.pct * 100).toFixed(1),
    }));
  }, [data.total]);

  const targetY = 100 - (TARGET / Y_MAX) * 100;

  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 sm:px-6 dark:border-neutral-800">
        <h1 className="text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
          Signups
        </h1>
        <RangeTabs
          value={range}
          onChange={setRange}
          baseId={baseId}
          panelId={panelId}
        />
      </header>

      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={`${baseId}-${RANGE_KEYS.indexOf(range)}`}
        tabIndex={0}
        className="flex min-h-0 flex-1 flex-col gap-4 p-4 outline-none sm:p-6"
      >
        <div className="flex min-h-0 flex-1 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-3xl font-medium tracking-[-0.02em] tabular-nums text-neutral-900 dark:text-neutral-100">
                {data.total.toLocaleString("en-US")}
              </p>
              <p className="mt-1 text-[13px] tabular-nums">
                <span
                  className={
                    data.positive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {data.delta}
                </span>
                <span className="text-neutral-500"> vs. previous {range}</span>
              </p>
            </div>
            <div className="flex items-center gap-4 pt-1 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                Signups
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0 w-4 border-t border-dashed border-neutral-400 dark:border-neutral-500" />
                Target
              </span>
            </div>
          </div>

          <div className="mt-5 flex min-h-0 flex-1 gap-3">
            <div className="-my-2 flex w-10 shrink-0 flex-col justify-between text-right text-[11px] leading-4 tabular-nums text-neutral-500">
              {Y_TICKS.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="relative min-h-0 flex-1">
              <svg
                aria-hidden
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full overflow-visible"
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
                  y1={targetY}
                  y2={targetY}
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-neutral-300 dark:stroke-neutral-600"
                  strokeWidth={1}
                />
                <path
                  d={areaPath(data.series)}
                  className="fill-neutral-900/5 dark:fill-neutral-100/5"
                />
                <path
                  d={linePath(data.series)}
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
              {data.xLabels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Signups by source</caption>
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900/60">
                <th
                  scope="col"
                  className="h-9 px-3 text-xs font-medium text-neutral-500 first:pl-4 sm:first:pl-5"
                >
                  Source
                </th>
                <th
                  scope="col"
                  className="h-9 px-3 text-right text-xs font-medium text-neutral-500"
                >
                  Signups
                </th>
                <th
                  scope="col"
                  className="hidden h-9 px-3 text-right text-xs font-medium text-neutral-500 sm:table-cell"
                >
                  Share
                </th>
                <th
                  scope="col"
                  className="h-9 px-3 text-right text-xs font-medium text-neutral-500"
                >
                  Conv. rate
                </th>
                <th
                  scope="col"
                  className="hidden h-9 px-3 text-right text-xs font-medium text-neutral-500 last:pr-4 sm:table-cell sm:last:pr-5"
                >
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
              {rows.map((r) => (
                <tr
                  key={r.source}
                  className="h-11 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-3 text-[13px] text-neutral-900 first:pl-4 sm:first:pl-5 dark:text-neutral-100">
                    {r.source}
                  </td>
                  <td className="px-3 text-right text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                    {r.count.toLocaleString("en-US")}
                  </td>
                  <td className="hidden px-3 text-right text-[13px] tabular-nums text-neutral-600 sm:table-cell dark:text-neutral-400">
                    {r.share}%
                  </td>
                  <td className="px-3 text-right text-[13px] tabular-nums text-neutral-600 dark:text-neutral-400">
                    {r.conv}
                  </td>
                  <td className="hidden px-3 text-right last:pr-4 sm:table-cell sm:last:pr-5">
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden
                      className="ml-auto h-5 w-16"
                    >
                      <polyline
                        points={sparkPoints(r.trend)}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        className="stroke-neutral-400 dark:stroke-neutral-500"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

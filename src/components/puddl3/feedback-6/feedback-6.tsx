"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

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

const RANGES = ["30 days", "90 days", "12 months"] as const;
type Range = (typeof RANGES)[number];

const SUMMARY: Record<
  Range,
  { responses: number; csat: string; delta: number; split: number[] }
> = {
  "30 days": { responses: 412, csat: "4.4", delta: 0.2, split: [64, 24, 12] },
  "90 days": { responses: 1187, csat: "4.2", delta: -0.1, split: [58, 26, 16] },
  "12 months": {
    responses: 4630,
    csat: "4.1",
    delta: 0.4,
    split: [55, 27, 18],
  },
};

const SPLIT_LABELS = ["Positive", "Neutral", "Negative"];
const SPLIT_FILL = [
  "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
  "bg-neutral-400 dark:bg-neutral-500",
  "bg-neutral-200 dark:bg-neutral-700",
];

const THEMES = [
  { name: "Export reliability", count: 84, trend: 22, share: 100 },
  { name: "Pricing and plans", count: 61, trend: -8, share: 73 },
  { name: "Onboarding clarity", count: 47, trend: 4, share: 56 },
  { name: "Filter persistence", count: 39, trend: 31, share: 46 },
  { name: "Mobile layout", count: 22, trend: 0, share: 26 },
  { name: "Webhook retries", count: 18, trend: 12, share: 21 },
  { name: "Search relevance", count: 14, trend: -3, share: 17 },
  { name: "Audit log gaps", count: 9, trend: 6, share: 11 },
];

const VOLUME = [
  18, 24, 21, 30, 27, 35, 31, 29, 38, 34, 41, 37, 44, 39, 47, 52, 45, 50, 58,
  54,
];

export default function Feedback6() {
  const [range, setRange] = useState<Range>("30 days");
  const s = SUMMARY[range];
  const peak = useMemo(() => Math.max(...VOLUME), []);

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Feedback insights
          </h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Every survey, widget and email reply, grouped by theme.
          </p>
        </div>
        <div className="flex w-fit items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800">
          {RANGES.map((r) => {
            const active = range === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={active}
                onClick={() => setRange(r)}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] font-medium whitespace-nowrap",
                  active
                    ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div className={cx(frame, "mt-3 grid gap-1 sm:grid-cols-3")}>
        <div className={cx(panel, "p-4")}>
          <p className="text-[12px] text-neutral-500">Responses</p>
          <p className="mt-1.5 text-2xl font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
            {s.responses.toLocaleString()}
          </p>
          <p className="mt-1 text-[12px] text-neutral-500">
            {Math.round((s.responses / 9800) * 100)}% response rate from 9,800
            prompts
          </p>
        </div>
        <div className={cx(panel, "p-4")}>
          <p className="text-[12px] text-neutral-500">Average rating</p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <p className="text-2xl font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
              {s.csat}
            </p>
            <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-neutral-600 tabular-nums dark:text-neutral-400">
              {s.delta > 0 ? (
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              ) : s.delta < 0 ? (
                <ArrowDownRight className="h-3 w-3" aria-hidden />
              ) : (
                <Minus className="h-3 w-3" aria-hidden />
              )}
              {Math.abs(s.delta).toFixed(1)}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-neutral-500">
            Out of 5, against previous period
          </p>
        </div>
        <div className={cx(panel, "p-4")}>
          <p className="text-[12px] text-neutral-500">Sentiment</p>
          <div
            className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full"
            role="img"
            aria-label={SPLIT_LABELS.map(
              (l, i) => `${l} ${s.split[i]} percent`,
            ).join(", ")}
          >
            {s.split.map((v, i) => (
              <span
                key={SPLIT_LABELS[i]}
                className={cx(SPLIT_FILL[i], transition)}
                style={{ width: `${v}%` }}
              />
            ))}
          </div>
          <ul className="mt-2.5 flex items-center justify-between gap-2">
            {SPLIT_LABELS.map((l, i) => (
              <li key={l} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={cx("h-1.5 w-1.5 rounded-full", SPLIT_FILL[i])}
                />
                <span className="text-[12px] text-neutral-500">{l}</span>
                <span className="text-[12px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                  {s.split[i]}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className={cx(
          frame,
          "mt-1 grid min-h-0 flex-1 gap-1 lg:grid-cols-[1fr_320px]",
        )}
      >
        <div className={cx(panel, "flex min-h-0 flex-col p-4")}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Top themes
            </p>
            <span className="text-[12px] text-neutral-500">
              Mentions this period
            </span>
          </div>
          <ul className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto">
            {THEMES.map((t) => (
              <li key={t.name}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[13px] text-neutral-700 dark:text-neutral-300">
                    {t.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                      {t.count}
                    </span>
                    <span
                      className={cx(
                        "inline-flex w-11 items-center justify-end gap-0.5 text-[12px] tabular-nums",
                        t.trend === 0
                          ? "text-neutral-400"
                          : "text-neutral-600 dark:text-neutral-400",
                      )}
                    >
                      {t.trend > 0 ? (
                        <ArrowUpRight className="h-3 w-3" aria-hidden />
                      ) : t.trend < 0 ? (
                        <ArrowDownRight className="h-3 w-3" aria-hidden />
                      ) : (
                        <Minus className="h-3 w-3" aria-hidden />
                      )}
                      {Math.abs(t.trend)}%
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <span
                    className={cx(
                      "block h-full rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
                      transition,
                    )}
                    style={{ width: `${t.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={cx(panel, "flex min-h-0 flex-col p-4")}>
          <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
            Weekly volume
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            Responses per day, last 20 days
          </p>
          <div
            className="mt-4 flex min-h-[96px] flex-1 items-end gap-[3px]"
            role="img"
            aria-label={`Daily responses rising from ${VOLUME[0]} to ${VOLUME[VOLUME.length - 1]}`}
          >
            {VOLUME.map((v, i) => (
              <span
                key={i}
                className={cx(
                  "flex-1 rounded-t-[2px]",
                  i === VOLUME.length - 1
                    ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                    : "bg-neutral-200 dark:bg-neutral-700",
                )}
                style={{ height: `${Math.round((v / peak) * 100)}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px] text-neutral-500">
            <span>20 days ago</span>
            <span className="text-neutral-700 dark:text-neutral-300">
              {VOLUME[VOLUME.length - 1]} today
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const grouped = (n: number) => n.toLocaleString("en-US");

const STAGES = [
  "Visited pricing",
  "Started trial",
  "Invited a teammate",
  "Connected a repo",
  "Converted to paid",
] as const;

const COHORTS = ["All traffic", "Organic", "Paid"] as const;
type Cohort = (typeof COHORTS)[number];

const DATA: Record<Cohort, number[]> = {
  "All traffic": [24_000, 8_400, 5_100, 3_600, 2_050],
  Organic: [9_800, 4_900, 1_850, 1_300, 880],
  Paid: [14_200, 5_400, 3_500, 2_600, 900],
};

export default function Analytics8() {
  const [cohort, setCohort] = useState<Cohort>("All traffic");
  const [active, setActive] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });

  useEffect(() => setMounted(true), []);

  const counts = DATA[cohort];

  const rows = useMemo(() => {
    const top = counts[0];
    return counts.map((count, i) => ({
      stage: STAGES[i],
      count,
      ratio: count / top,
      fromTop: (count / top) * 100,
      fromPrev: i === 0 ? 100 : (count / counts[i - 1]) * 100,
      lost: i === 0 ? 0 : counts[i - 1] - count,
      dropPct: i === 0 ? 0 : ((counts[i - 1] - count) / counts[i - 1]) * 100,
    }));
  }, [counts]);

  const worst = useMemo(() => {
    let idx = 1;
    for (let i = 2; i < rows.length; i++) {
      if (rows[i].dropPct > rows[idx].dropPct) idx = i;
    }
    return idx;
  }, [rows]);

  const overall = rows[rows.length - 1].fromTop;

  const moveTip = (e: React.PointerEvent, i: number) => {
    const el = bodyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setActive(i);
    setTip({
      x: clamp(e.clientX - rect.left, 96, rect.width - 96),
      y: clamp(e.clientY - rect.top - 12, 8, rect.height - 8),
    });
  };

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className={cx(frame, "mx-auto w-full max-w-[880px] space-y-1")}>
        <div
          className={cx(
            panel,
            "flex flex-wrap items-start justify-between gap-3 px-5 py-4",
          )}
        >
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Signup funnel
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              Self-serve activation, pricing page to paid.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Cohort"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            {COHORTS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={option === cohort}
                onClick={() => {
                  setCohort(option);
                  setActive(null);
                }}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                  option === cohort
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

        <div className={cx(panel, "px-5 py-4")}>
          <div ref={bodyRef} className="relative">
            {rows.map((row, i) => (
              <div key={row.stage}>
                {i > 0 && (
                  <div className="flex h-4 items-center gap-1.5 pl-0.5">
                    {i === worst && (
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                      />
                    )}
                    <span className="text-[11px] tabular-nums text-neutral-500">
                      −{grouped(row.lost)} lost · {row.dropPct.toFixed(1)}% drop
                      {i === worst ? " · steepest fall" : ""}
                    </span>
                  </div>
                )}

                <div
                  tabIndex={0}
                  role="button"
                  aria-label={`${row.stage}: ${grouped(row.count)} users, ${row.fromTop.toFixed(
                    1,
                  )} percent of visitors.`}
                  onPointerMove={(e) => moveTip(e, i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  style={{ touchAction: "pan-y" }}
                  className={cx(
                    "cursor-default rounded-[var(--rb-r-md,8px)] px-2 py-1.5",
                    active === i
                      ? "bg-neutral-50 dark:bg-neutral-800/50"
                      : "bg-transparent",
                    transition,
                    focus,
                  )}
                >
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {row.stage}
                    </span>
                    <span className="shrink-0 text-[13px] tabular-nums text-neutral-500">
                      <span className="text-neutral-900 dark:text-neutral-100">
                        {grouped(row.count)}
                      </span>{" "}
                      · {row.fromTop.toFixed(1)}%
                    </span>
                  </div>

                  <div className="h-7 w-full overflow-hidden rounded-[var(--rb-r-sm,6px)] bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-[var(--rb-r-sm,6px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                      style={{
                        width: `${row.ratio * 100}%`,
                        transform: mounted ? "scaleX(1)" : "scaleX(0)",
                        transformOrigin: "left",
                        transitionDelay: `${i * 20}ms`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div
              aria-hidden="true"
              style={{ left: tip.x, top: tip.y }}
              className={cx(
                "pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-2.5 py-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] transition-opacity duration-[125ms] ease-out dark:border-neutral-800 dark:bg-neutral-900",
                active === null ? "opacity-0" : "opacity-100",
              )}
            >
              <p className="whitespace-nowrap text-[11px] text-neutral-500">
                {active === null ? "" : rows[active].stage}
              </p>
              <p className="whitespace-nowrap text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                {active === null ? "" : grouped(rows[active].count)} users
              </p>
              <p className="mt-0.5 whitespace-nowrap text-[11px] tabular-nums text-neutral-500">
                {active === null
                  ? ""
                  : `${rows[active].fromPrev.toFixed(1)}% from previous · ${rows[
                      active
                    ].fromTop.toFixed(1)}% from top`}
              </p>
            </div>
          </div>
        </div>

        <div
          className={cx(
            panel,
            "flex items-center justify-between gap-3 px-5 py-3",
          )}
        >
          <span className="text-[13px] text-neutral-500">
            Visitor to paid conversion
          </span>
          <span className="text-base font-medium tabular-nums tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            {overall.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

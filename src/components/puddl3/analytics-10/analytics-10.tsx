"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { arc } from "d3-shape";

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

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
type Quarter = (typeof QUARTERS)[number];

type Kind = "money" | "percent";
type Goal = { label: string; kind: Kind; actual: number; target: number };

const GOALS: Record<Quarter, Goal[]> = {
  Q1: [
    { label: "Net new ARR", kind: "money", actual: 4.2, target: 5.0 },
    { label: "Expansion revenue", kind: "money", actual: 1.3, target: 1.2 },
    { label: "Logo retention", kind: "percent", actual: 91, target: 93 },
  ],
  Q2: [
    { label: "Net new ARR", kind: "money", actual: 4.6, target: 5.0 },
    { label: "Expansion revenue", kind: "money", actual: 0.9, target: 1.2 },
    { label: "Logo retention", kind: "percent", actual: 94, target: 93 },
  ],
  Q3: [
    { label: "Net new ARR", kind: "money", actual: 5.3, target: 5.0 },
    { label: "Expansion revenue", kind: "money", actual: 1.1, target: 1.4 },
    { label: "Logo retention", kind: "percent", actual: 89, target: 93 },
  ],
  Q4: [
    { label: "Net new ARR", kind: "money", actual: 3.9, target: 6.0 },
    { label: "Expansion revenue", kind: "money", actual: 1.5, target: 1.4 },
    { label: "Logo retention", kind: "percent", actual: 92, target: 93 },
  ],
};

const DAYS_LEFT: Record<Quarter, number> = { Q1: 8, Q2: 14, Q3: 11, Q4: 5 };

const fmt = (kind: Kind, v: number) =>
  kind === "money" ? `$${v.toFixed(1)}M` : `${v.toFixed(0)}%`;

const remainingLabel = (goal: Goal) => {
  const gap = goal.target - goal.actual;
  if (gap <= 0)
    return goal.kind === "money"
      ? `$${Math.abs(gap).toFixed(1)}M over target`
      : `${Math.abs(gap).toFixed(1)} pts over target`;
  return goal.kind === "money"
    ? `$${gap.toFixed(1)}M to target`
    : `${gap.toFixed(1)} pts to target`;
};

const SIZE = 168;
const OUTER = SIZE / 2 - 2;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function Analytics10() {
  const [quarter, setQuarter] = useState<Quarter>("Q1");
  const [active, setActive] = useState<number | null>(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const [sweep, setSweep] = useState([0, 0, 0]);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const view = rootRef.current?.ownerDocument.defaultView ?? window;
    const reduce = view.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setSweep([1, 1, 1]);
      return;
    }
    let raf = 0;
    let start = 0;
    const DURATION = 420;
    const STAGGER = 60;
    const total = DURATION + STAGGER * 2;
    const tick = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      setSweep(
        [0, 1, 2].map((i) =>
          easeOut(clamp((elapsed - i * STAGGER) / DURATION, 0, 1)),
        ),
      );
      if (elapsed < total) raf = view.requestAnimationFrame(tick);
    };
    raf = view.requestAnimationFrame(tick);
    return () => view.cancelAnimationFrame(raf);
  }, []);

  const goals = GOALS[quarter];

  const rings = useMemo(
    () =>
      goals.map((goal) => ({
        goal,
        pct: goal.actual / goal.target,
      })),
    [goals],
  );

  const blended =
    (rings.reduce((sum, r) => sum + r.pct, 0) / rings.length) * 100;

  const moveTip = (e: React.PointerEvent, i: number) => {
    const el = bodyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setActive(i);
    setTip({
      x: clamp(e.clientX - rect.left, 108, rect.width - 108),
      y: clamp(e.clientY - rect.top - 12, 8, rect.height - 8),
    });
  };

  return (
    <div
      ref={rootRef}
      className="flex h-full min-h-[560px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950"
    >
      <div className={cx(frame, "mx-auto w-full max-w-[880px] space-y-1")}>
        <div
          className={cx(
            panel,
            "flex flex-wrap items-start justify-between gap-3 px-5 py-4",
          )}
        >
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Quarterly goals
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              Attainment against plan, {DAYS_LEFT[quarter]} days left in{" "}
              {quarter}.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Quarter"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            {QUARTERS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={option === quarter}
                onClick={() => {
                  setQuarter(option);
                  setActive(null);
                }}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] tabular-nums",
                  option === quarter
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

        <div className={cx(panel, "px-5 py-8")}>
          <div
            ref={bodyRef}
            className="relative grid grid-cols-1 gap-6 sm:grid-cols-3"
          >
            {rings.map((ring, i) => {
              const isActive = active === i;
              const thick = isActive ? 13 : 10;
              const inner = OUTER - thick;
              const displayed = ring.pct * sweep[i];

              const bg =
                arc()
                  .innerRadius(inner)
                  .outerRadius(OUTER)
                  .startAngle(0)
                  .endAngle(Math.PI * 2)({} as never) ?? "";
              const fg =
                arc()
                  .innerRadius(inner)
                  .outerRadius(OUTER)
                  .cornerRadius(thick / 2)
                  .startAngle(0)
                  .endAngle(Math.PI * 2 * displayed)({} as never) ?? "";

              return (
                <div
                  key={ring.goal.label}
                  tabIndex={0}
                  role="button"
                  aria-label={`${ring.goal.label}: ${(ring.pct * 100).toFixed(
                    1,
                  )} percent of target. ${fmt(
                    ring.goal.kind,
                    ring.goal.actual,
                  )} of ${fmt(ring.goal.kind, ring.goal.target)}.`}
                  onPointerMove={(e) => moveTip(e, i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className={cx(
                    "flex flex-col items-center rounded-[var(--rb-r-lg,10px)] px-2 py-2",
                    isActive
                      ? "bg-neutral-50 dark:bg-neutral-800/50"
                      : "bg-transparent",
                    transition,
                    focus,
                  )}
                >
                  <div
                    className="relative"
                    style={{ width: SIZE, height: SIZE }}
                  >
                    <svg
                      width={SIZE}
                      height={SIZE}
                      viewBox={`0 0 ${SIZE} ${SIZE}`}
                      className="overflow-visible"
                      aria-hidden="true"
                    >
                      <g transform={`translate(${SIZE / 2} ${SIZE / 2})`}>
                        <path
                          d={bg}
                          className="fill-neutral-200 dark:fill-neutral-800"
                        />
                        <path
                          d={fg}
                          className="fill-neutral-900 transition-[fill] duration-150 dark:fill-white"
                        />
                      </g>
                    </svg>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-medium tabular-nums tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                        {(ring.pct * 100).toFixed(0)}%
                      </span>
                      <span className="mt-0.5 max-w-[6.5rem] truncate text-center text-[11px] text-neutral-500">
                        of target
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {ring.goal.label}
                  </p>
                  <p className="mt-0.5 text-[13px] tabular-nums text-neutral-500">
                    {fmt(ring.goal.kind, ring.goal.actual)} of{" "}
                    {fmt(ring.goal.kind, ring.goal.target)}
                  </p>
                </div>
              );
            })}

            <div
              aria-hidden="true"
              style={{ left: tip.x, top: tip.y }}
              className={cx(
                "pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-2.5 py-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] transition-opacity duration-[125ms] ease-out dark:border-neutral-800 dark:bg-neutral-900",
                active === null ? "opacity-0" : "opacity-100",
              )}
            >
              <p className="whitespace-nowrap text-[11px] text-neutral-500">
                {active === null ? "" : rings[active].goal.label}
              </p>
              <p className="whitespace-nowrap text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                {active === null ? "" : remainingLabel(rings[active].goal)}
              </p>
              <p className="mt-0.5 whitespace-nowrap text-[11px] tabular-nums text-neutral-500">
                {DAYS_LEFT[quarter]} days left in {quarter}
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
            Blended attainment
          </span>
          <span className="text-base font-medium tabular-nums tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            {blended.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

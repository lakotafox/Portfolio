"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const compact = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(Math.abs(n) >= 10_000_000 ? 0 : 1)}M`
    : Math.abs(n) >= 1_000
      ? `${(n / 1_000).toFixed(Math.abs(n) >= 10_000 ? 0 : 1)}k`
      : `${n}`;

const money = (n: number) => `$${compact(n)}`;

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

type Rep = { name: string; quota: number; actual: number };

const REPS: Rep[] = [
  { name: "Priya Nandakumar", quota: 420_000, actual: 487_000 },
  { name: "Marcus Bell", quota: 380_000, actual: 312_000 },
  { name: "Sofia Alvarez", quota: 450_000, actual: 441_000 },
  { name: "Tomás Guerrero", quota: 400_000, actual: 268_000 },
  { name: "Wei Chen", quota: 360_000, actual: 402_000 },
  { name: "Amelia Whitfield-Osei", quota: 500_000, actual: 475_000 },
];

const AXIS_MAX = 125;
const BANDS = [
  { to: 70, cls: "bg-neutral-200 dark:bg-neutral-800" },
  { to: 90, cls: "bg-neutral-100 dark:bg-neutral-800/60" },
  { to: AXIS_MAX, cls: "bg-neutral-50 dark:bg-neutral-900" },
];

const SORTS = ["By attainment", "By quota", "Alphabetical"] as const;
type Sort = (typeof SORTS)[number];

const ROW = 60;
const GAP = 4;

export default function Analytics15() {
  const [sort, setSort] = useState<Sort>("By attainment");
  const [active, setActive] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const reps = useMemo(
    () =>
      REPS.map((r, id) => ({
        ...r,
        id,
        pct: (r.actual / r.quota) * 100,
        delta: r.actual - r.quota,
      })),
    [],
  );

  const rank = useMemo(() => {
    const order = [...reps].sort((a, b) => {
      if (sort === "By attainment") return b.pct - a.pct;
      if (sort === "By quota") return b.quota - a.quota;
      return a.name.localeCompare(b.name);
    });
    const map = new Map<number, number>();
    order.forEach((r, i) => map.set(r.id, i));
    return map;
  }, [reps, sort]);

  const teamActual = reps.reduce((s, r) => s + r.actual, 0);
  const teamQuota = reps.reduce((s, r) => s + r.quota, 0);
  const teamPct = (teamActual / teamQuota) * 100;

  const listHeight = reps.length * (ROW + GAP) - GAP;

  const moveTip = (e: React.PointerEvent, id: number) => {
    const el = listRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setActive(id);
    setTip({
      x: clamp(e.clientX - rect.left, 120, rect.width - 120),
      y: clamp(e.clientY - rect.top - 12, 8, rect.height - 8),
    });
  };

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Quota attainment by rep
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              Closed revenue against quota this quarter. Tick marks 100%.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Sort"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            {SORTS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={option === sort}
                onClick={() => setSort(option)}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                  option === sort
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

        <div className={frame}>
          <div
            ref={listRef}
            className="relative"
            style={{ height: listHeight }}
          >
            {reps.map((rep, i) => {
              const isActive = active === rep.id;
              const over = rep.delta >= 0;
              const barW = clamp(rep.pct / AXIS_MAX, 0, 1) * 100;
              const tickL = (100 / AXIS_MAX) * 100;

              return (
                <div
                  key={rep.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${rep.name}: ${rep.pct.toFixed(
                    1,
                  )} percent of quota, ${money(rep.actual)} of ${money(
                    rep.quota,
                  )}.`}
                  onPointerMove={(e) => moveTip(e, rep.id)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(rep.id)}
                  onBlur={() => setActive(null)}
                  style={{
                    transform: `translateY(${(rank.get(rep.id) ?? 0) * (ROW + GAP)}px)`,
                    height: ROW,
                  }}
                  className={cx(
                    panel,
                    "absolute inset-x-0 top-0 flex items-center gap-3 px-3 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none sm:gap-4",
                    isActive && "bg-neutral-50 dark:bg-neutral-800/50",
                    focus,
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5 sm:w-52">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {initials(rep.name)}
                    </span>
                    <span className="min-w-0 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {rep.name}
                    </span>
                  </div>

                  <div className="relative h-6 min-w-0 flex-1">
                    {
                      BANDS.reduce<{ from: number; nodes: React.ReactNode[] }>(
                        (acc, band, bi) => {
                          const left = (acc.from / AXIS_MAX) * 100;
                          const width = ((band.to - acc.from) / AXIS_MAX) * 100;
                          acc.nodes.push(
                            <div
                              key={bi}
                              aria-hidden="true"
                              className={cx("absolute inset-y-0", band.cls)}
                              style={{ left: `${left}%`, width: `${width}%` }}
                            />,
                          );
                          acc.from = band.to;
                          return acc;
                        },
                        { from: 0, nodes: [] },
                      ).nodes
                    }

                    <div
                      className="absolute inset-y-0 left-0 overflow-hidden rounded-[3px]"
                      aria-hidden="true"
                    >
                      <div
                        className="absolute top-1/2 left-0 h-2.5 -translate-y-1/2 rounded-[3px] bg-[var(--rb-accent,oklch(20.5%_0_0))] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                        style={{
                          width: `${barW}%`,
                          transform: mounted
                            ? "translateY(-50%) scaleX(1)"
                            : "translateY(-50%) scaleX(0)",
                          transformOrigin: "left",
                          transitionDelay: `${i * 20}ms`,
                        }}
                      />
                    </div>

                    <div
                      aria-hidden="true"
                      className="absolute inset-y-0 w-[2px] bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                      style={{ left: `${tickL}%` }}
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-4 sm:gap-5">
                    <div className="w-16 text-right">
                      <p className="text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                        {money(rep.actual)}
                      </p>
                      <p className="text-[11px] tabular-nums text-neutral-500">
                        of {money(rep.quota)}
                      </p>
                    </div>
                    <span
                      className={cx(
                        "w-14 text-right text-[13px] tabular-nums",
                        over
                          ? "text-emerald-600 dark:text-emerald-500"
                          : "text-red-600 dark:text-red-500",
                      )}
                    >
                      {over ? "+" : "−"}
                      {money(Math.abs(rep.delta))}
                    </span>
                  </div>
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
                {active === null ? "" : reps[active].name}
              </p>
              <p className="whitespace-nowrap text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                {active === null
                  ? ""
                  : `${reps[active].pct.toFixed(1)}% of quota`}
              </p>
              <p className="mt-0.5 whitespace-nowrap text-[11px] tabular-nums text-neutral-500">
                {active === null
                  ? ""
                  : reps[active].delta >= 0
                    ? `${money(reps[active].delta)} over target`
                    : `${money(Math.abs(reps[active].delta))} to target`}
              </p>
            </div>
          </div>

          <div
            className={cx(
              panel,
              "mt-1 flex items-center gap-3 px-3 py-2.5 sm:gap-4",
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5 sm:w-52">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[11px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
              >
                T
              </span>
              <span className="min-w-0 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                Team
              </span>
            </div>
            <div className="hidden min-w-0 flex-1 sm:block">
              <span className="text-[13px] tabular-nums text-neutral-500">
                {teamPct.toFixed(1)}% of blended quota
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-4 sm:gap-5">
              <div className="w-16 text-right">
                <p className="text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                  {money(teamActual)}
                </p>
                <p className="text-[11px] tabular-nums text-neutral-500">
                  of {money(teamQuota)}
                </p>
              </div>
              <span
                className={cx(
                  "w-14 text-right text-[13px] tabular-nums",
                  teamActual - teamQuota >= 0
                    ? "text-emerald-600 dark:text-emerald-500"
                    : "text-red-600 dark:text-red-500",
                )}
              >
                {teamActual - teamQuota >= 0 ? "+" : "−"}
                {money(Math.abs(teamActual - teamQuota))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

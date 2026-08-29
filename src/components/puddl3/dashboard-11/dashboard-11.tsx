"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CalendarClock,
  CalendarX2,
  Check,
  Download,
  Link2,
  Mail,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const panel =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      start: scrollTop > 1,
      end: Math.ceil(scrollTop + clientHeight) < scrollHeight - 1,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view?.ResizeObserver) return;
    const observer = new view.ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  return { ref, edges, onScroll: update };
}

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

type Kpi = {
  label: string;
  Icon: typeof Users;
  value: string;
  meta: string;
  delta: string;
  positive: boolean;
};

const KPIS: Kpi[] = [
  {
    label: "Open gaps",
    Icon: CalendarX2,
    value: "11",
    meta: "before kickoff",
    delta: "−4",
    positive: true,
  },
  {
    label: "Standby pool",
    Icon: Users,
    value: "24",
    meta: "ready workers",
    delta: "+7",
    positive: true,
  },
  {
    label: "Swap risk",
    Icon: TriangleAlert,
    value: "8%",
    meta: "of open requests",
    delta: "−2 pp",
    positive: true,
  },
  {
    label: "Check score",
    Icon: ShieldCheck,
    value: "4.8",
    meta: "site average",
    delta: "+0.3",
    positive: true,
  },
  {
    label: "Crew tenure",
    Icon: Activity,
    value: "146d",
    meta: "rolling median",
    delta: "+6d",
    positive: true,
  },
];

type Health = "stable" | "watch" | "critical" | "pending";

const HEALTH_WORD: Record<Health, string> = {
  stable: "Stable",
  watch: "Watch",
  critical: "Critical",
  pending: "Pending",
};

const HEALTH_DOT: Record<Health, string> = {
  stable: "bg-neutral-300 dark:bg-neutral-600",
  pending: "bg-neutral-400 dark:bg-neutral-500",
  watch: "bg-amber-500",
  critical: "bg-red-500",
};

type Crew = {
  id: string;
  lead: string;
  role: string;
  coverage: number;
  note: string;
  relief: number;
  handoffs: number;
  health: Health;
};

const CREWS: Crew[] = [
  {
    id: "c1",
    lead: "Mira Stone",
    role: "Harbor lead",
    coverage: 94,
    note: "Adds two closers",
    relief: 6,
    handoffs: 2,
    health: "stable",
  },
  {
    id: "c2",
    lead: "Leo Grant",
    role: "Dispatch owner",
    coverage: 81,
    note: "Driver window tight",
    relief: 3,
    handoffs: 5,
    health: "watch",
  },
  {
    id: "c3",
    lead: "Nora Vale",
    role: "Inventory coach",
    coverage: 72,
    note: "Cycle count open",
    relief: 2,
    handoffs: 6,
    health: "critical",
  },
  {
    id: "c4",
    lead: "Theo Park",
    role: "Ramp lead",
    coverage: 89,
    note: "Training overlap",
    relief: 5,
    handoffs: 3,
    health: "stable",
  },
  {
    id: "c5",
    lead: "Sana Qureshi",
    role: "Uptown floater",
    coverage: 78,
    note: "Awaiting confirm",
    relief: 4,
    handoffs: 4,
    health: "pending",
  },
  {
    id: "c6",
    lead: "Alex Johnson",
    role: "Harbor stock",
    coverage: 91,
    note: "Backfill locked",
    relief: 7,
    handoffs: 1,
    health: "stable",
  },
  {
    id: "c7",
    lead: "Priya Raman",
    role: "Night dispatch",
    coverage: 86,
    note: "Two shifts merged",
    relief: 5,
    handoffs: 2,
    health: "stable",
  },
  {
    id: "c8",
    lead: "Dominic Hale",
    role: "Airport close",
    coverage: 68,
    note: "Lead unassigned",
    relief: 1,
    handoffs: 8,
    health: "critical",
  },
];

type Action = {
  id: string;
  Icon: typeof RefreshCw;
  title: string;
  detail: string;
  cta: string;
};

const ACTIONS: Action[] = [
  {
    id: "a1",
    Icon: RefreshCw,
    title: "3 swap approvals",
    detail: "Before 2 PM",
    cta: "Review",
  },
  {
    id: "a2",
    Icon: Mail,
    title: "6 standby invites",
    detail: "North route",
    cta: "Invite",
  },
  {
    id: "a3",
    Icon: MapPin,
    title: "1 lead missing",
    detail: "Uptown close",
    cta: "Assign",
  },
  {
    id: "a4",
    Icon: Link2,
    title: "Timecard sync",
    detail: "After approvals",
    cta: "Sync",
  },
  {
    id: "a5",
    Icon: CalendarClock,
    title: "2 route gaps",
    detail: "Airport, noon",
    cta: "Fill",
  },
  {
    id: "a6",
    Icon: ShieldCheck,
    title: "Break audit",
    detail: "Two sites",
    cta: "Check",
  },
  {
    id: "a7",
    Icon: Users,
    title: "4 onboarding checks",
    detail: "New harbor crew",
    cta: "Open",
  },
];

const wave = (seed: number, i: number) =>
  Math.sin(i * 0.58 + seed) * 0.5 + Math.sin(i * 0.21 + seed * 1.4) * 0.33;

const DEMAND_DAYS = 21;

const SUPPLY = Array.from({ length: DEMAND_DAYS }, (_, i) =>
  Math.round(148 + wave(2.2, i) * 78),
);
const FORECAST = Array.from({ length: DEMAND_DAYS }, (_, i) =>
  Math.round(141 + wave(5.9, i) * 62),
);

const DEMAND_MAX = Math.max(...SUPPLY, ...FORECAST) * 1.06;

export default function Dashboard11() {
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [activeCrew, setActiveCrew] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const {
    ref: crewRef,
    edges: crewEdges,
    onScroll: onCrewScroll,
  } = useScrollFade<HTMLDivElement>();
  const {
    ref: queueRef,
    edges: queueEdges,
    onScroll: onQueueScroll,
  } = useScrollFade<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  const open = ACTIONS.filter((a) => !done[a.id]);

  const totals = useMemo(() => {
    const supply = SUPPLY.reduce((s, v) => s + v, 0);
    const forecast = FORECAST.reduce((s, v) => s + v, 0);
    return { supply, forecast, gap: supply - forecast };
  }, []);

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li className="text-neutral-500">Workforce</li>
            <li
              aria-hidden="true"
              className="text-neutral-300 dark:text-neutral-700"
            >
              /
            </li>
            <li className="truncate font-medium text-neutral-900 dark:text-neutral-100">
              Coverage
            </li>
          </ol>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden h-8 items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] tabular-nums text-neutral-600 sm:inline-flex dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
            Jun 22 – Jul 12
          </span>
          <button
            type="button"
            className={cx(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-2.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
              transition,
              focus,
            )}
          >
            <Download aria-hidden="true" className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-2 gap-3 px-4 pb-4 md:grid-cols-5 sm:px-6">
        {KPIS.map((k) => (
          <div key={k.label} className={cx(panel, "p-3.5")}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-neutral-100 dark:bg-neutral-800">
                <k.Icon
                  aria-hidden="true"
                  className="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                />
              </span>
              <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                {k.label}
              </span>
            </div>
            <p className="mt-4 text-2xl font-medium tracking-[-0.02em] tabular-nums text-neutral-900 dark:text-neutral-100">
              {k.value}
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-[11px] text-neutral-500">
                {k.meta}
              </span>
              <span
                className={cx(
                  "shrink-0 text-[11px] tabular-nums",
                  k.positive
                    ? "text-neutral-500"
                    : "text-red-600 dark:text-red-500",
                )}
              >
                {k.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-[minmax(0,1fr)_320px] sm:px-6 sm:pb-6">
        <div className="flex min-h-0 flex-col gap-4">
          <div
            className={cx(
              panel,
              "flex min-h-0 flex-1 flex-col overflow-hidden",
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Coverage review
                </h2>
                <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                  Crew health by district
                </p>
              </div>
              <span className="shrink-0 rounded-[var(--rb-r-sm,6px)] bg-neutral-200/70 px-1.5 py-0.5 text-[11px] tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {CREWS.length} crews
              </span>
            </div>

            <div className="relative min-h-0 flex-1">
              <div
                ref={crewRef}
                onScroll={onCrewScroll}
                className="h-full overflow-y-auto"
              >
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-white dark:bg-neutral-900">
                    <tr className="h-9 text-[13px] text-neutral-500">
                      <th scope="col" className="px-4 text-left font-normal">
                        Crew lead
                      </th>
                      <th scope="col" className="px-3 text-left font-normal">
                        Coverage
                      </th>
                      <th
                        scope="col"
                        className="hidden w-[76px] px-3 text-right font-normal sm:table-cell"
                      >
                        Relief
                      </th>
                      <th
                        scope="col"
                        className="hidden w-[88px] px-3 text-right font-normal sm:table-cell"
                      >
                        Handoffs
                      </th>
                      <th
                        scope="col"
                        className="w-[112px] px-4 text-left font-normal"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CREWS.map((c, i) => (
                      <tr
                        key={c.id}
                        onPointerEnter={() => setActiveCrew(c.id)}
                        onPointerLeave={() => setActiveCrew(null)}
                        className={cx(
                          "h-[62px]",
                          activeCrew === c.id &&
                            "bg-neutral-50 dark:bg-neutral-800/40",
                          transition,
                        )}
                      >
                        <td className="px-4 align-middle">
                          <div className="flex items-center gap-2.5">
                            <span
                              aria-hidden="true"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                            >
                              {initials(c.lead)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                                {c.lead}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                {c.role}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 align-middle">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                              {c.coverage}%
                            </span>
                            <span className="truncate text-[11px] text-neutral-500">
                              {c.note}
                            </span>
                          </div>
                          <span
                            aria-hidden="true"
                            className="mt-1.5 block h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                          >
                            <span
                              className={cx(
                                "block h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
                                c.health === "critical"
                                  ? "bg-red-500"
                                  : c.health === "watch"
                                    ? "bg-amber-500"
                                    : "bg-neutral-900 dark:bg-neutral-100",
                              )}
                              style={{
                                width: mounted
                                  ? `${clamp(c.coverage, 0, 100)}%`
                                  : "0%",
                                transitionDelay: `${i * 40}ms`,
                              }}
                            />
                          </span>
                        </td>

                        <td className="hidden px-3 text-right align-middle text-[13px] tabular-nums text-neutral-600 sm:table-cell dark:text-neutral-400">
                          {c.relief}h
                        </td>
                        <td className="hidden px-3 text-right align-middle text-[13px] tabular-nums text-neutral-600 sm:table-cell dark:text-neutral-400">
                          {c.handoffs}
                        </td>

                        <td className="px-4 align-middle">
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                            <span
                              className={cx(
                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                HEALTH_DOT[c.health],
                                c.health === "pending" &&
                                  "animate-pulse motion-reduce:animate-none",
                              )}
                            />
                            {HEALTH_WORD[c.health]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 top-9 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                  crewEdges.start ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                  crewEdges.end ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          </div>

          <div className={cx(panel, "shrink-0 p-4")}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Demand mix
                </h2>
                <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                  Scheduled supply against forecast · 21 days
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-[11px] tabular-nums">
                <span className="inline-flex items-center gap-1.5 text-neutral-500">
                  <span className="h-1 w-4 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                  Supply{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {totals.supply.toLocaleString("en-US")}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-neutral-500">
                  <span className="h-1 w-4 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  Forecast{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {totals.forecast.toLocaleString("en-US")}
                  </span>
                </span>
                <span className="text-neutral-900 dark:text-neutral-100">
                  +{totals.gap.toLocaleString("en-US")}
                </span>
              </div>
            </div>

            <div
              className="mt-3 flex h-[108px] items-end gap-[3px]"
              onPointerLeave={() => setActiveDay(null)}
            >
              {SUPPLY.map((s, i) => {
                const f = FORECAST[i];
                const isActive = activeDay === i;
                return (
                  <div
                    key={i}
                    onPointerEnter={() => setActiveDay(i)}
                    title={`Day ${i + 1}: ${s} scheduled, ${f} forecast`}
                    className="relative flex h-full flex-1 cursor-default flex-col justify-end"
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        "absolute inset-x-0 h-[2px] rounded-full bg-neutral-500 dark:bg-neutral-400",
                        isActive &&
                          "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
                      )}
                      style={{ bottom: `${(f / DEMAND_MAX) * 100}%` }}
                    />
                    <span
                      aria-hidden="true"
                      className={cx(
                        "w-full rounded-[3px] transition-[height,background-color] duration-700 ease-out motion-reduce:transition-none",
                        isActive
                          ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                          : "bg-neutral-300 dark:bg-neutral-600",
                      )}
                      style={{
                        height: mounted ? `${(s / DEMAND_MAX) * 100}%` : "0%",
                        transitionDelay: `${i * 18}ms`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <p
              aria-live="polite"
              className="mt-2 text-[11px] tabular-nums text-neutral-500"
            >
              {`Day ${(activeDay ?? DEMAND_DAYS - 1) + 1} · ${
                SUPPLY[activeDay ?? DEMAND_DAYS - 1]
              } scheduled vs ${
                FORECAST[activeDay ?? DEMAND_DAYS - 1]
              } forecast`}
            </p>
          </div>
        </div>

        <div className={cx(panel, "flex min-h-0 flex-col overflow-hidden")}>
          <div className="flex shrink-0 items-center justify-between gap-3 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Action queue
              </h2>
              <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                {open.length === 0
                  ? "Nothing left before cutoff"
                  : `${open.length} before cutoff`}
              </p>
            </div>
            <button
              type="button"
              aria-label="Queue options"
              className={cx(
                "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              ref={queueRef}
              onScroll={onQueueScroll}
              className="h-full overflow-y-auto p-1.5"
            >
              {open.length === 0 ? (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-xl,12px)] bg-neutral-100 dark:bg-neutral-800">
                    <Check
                      aria-hidden="true"
                      className="h-5 w-5 text-neutral-500"
                    />
                  </span>
                  <p className="mt-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Queue is clear
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    Every item was handled before the cutoff.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDone({})}
                    className={cx(
                      "mt-4 inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                      transition,
                      focus,
                    )}
                  >
                    Restore queue
                  </button>
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {open.map((a) => (
                    <li
                      key={a.id}
                      className={cx(
                        "flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] px-2.5 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                        transition,
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-neutral-100 dark:bg-neutral-800">
                        <a.Icon
                          aria-hidden="true"
                          className="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                          {a.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                          {a.detail}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDone((d) => ({ ...d, [a.id]: true }))}
                        aria-label={`${a.cta}: ${a.title}`}
                        className={cx(
                          "inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                          transition,
                          focus,
                        )}
                      >
                        {a.cta}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                queueEdges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                queueEdges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>

          <div className="shrink-0 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <p className="text-[11px] tabular-nums text-neutral-500">
              Cutoff 2:00 PM · {ACTIONS.length - open.length} of{" "}
              {ACTIONS.length} cleared
            </p>
            <span
              aria-hidden="true"
              className="mt-2 block h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
            >
              <span
                className="block h-full rounded-full bg-neutral-900 transition-[width] duration-300 ease-out motion-reduce:transition-none dark:bg-neutral-100"
                style={{
                  width: `${((ACTIONS.length - open.length) / ACTIONS.length) * 100}%`,
                }}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

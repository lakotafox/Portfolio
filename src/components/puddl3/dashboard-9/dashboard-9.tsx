"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Globe,
  Plus,
  Star,
  User,
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

const wave = (seed: number, i: number) =>
  Math.sin(i * 1.13 + seed) * 0.5 + Math.sin(i * 0.41 + seed * 2.3) * 0.31;

const TABS = ["Overview", "Worklog", "Files", "Reports"] as const;
type Tab = (typeof TABS)[number];

type Kind = "client" | "internal" | "off";

type Person = {
  id: string;
  name: string;
  role: string;
  target: number;
};

const PEOPLE: Person[] = [
  { id: "p1", name: "Amara Ortiz", role: "Client delivery lead", target: 32 },
  { id: "p2", name: "Theo Mercer", role: "Platform engineer", target: 40 },
  {
    id: "p3",
    name: "Lena Hoffman",
    role: "Content systems editor",
    target: 30,
  },
  { id: "p4", name: "Idris Bello", role: "Integration engineer", target: 38 },
  { id: "p5", name: "Marta Kovac", role: "QA analyst", target: 34 },
  { id: "p6", name: "Rhys Calloway", role: "Solutions architect", target: 24 },
  { id: "p7", name: "Junia Alves", role: "Data migration lead", target: 36 },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTHS = ["Mar", "Apr"];

type Cell = { hours: number; kind: Kind };

function buildWeek(weekIndex: number) {
  const cells: Record<string, Cell[]> = {};
  for (const [pi, person] of PEOPLE.entries()) {
    const row: Cell[] = [];
    for (let d = 0; d < 7; d += 1) {
      if (d >= 5) {
        row.push({ hours: 0, kind: "off" });
        continue;
      }
      const n = wave(pi * 1.7 + weekIndex * 3.1, d);
      const raw = person.target / 5 + n * 2.6;
      const hours = clamp(Math.round(raw * 2) / 2, 0, 9);
      row.push({
        hours,
        kind: n > 0.42 ? "internal" : "client",
      });
    }
    cells[person.id] = row;
  }
  return cells;
}

const WEEKS = Array.from({ length: 4 }, (_, i) => {
  const startDay = 9 + i * 7;
  const month = startDay + 6 > 31 ? 1 : 0;
  const s = startDay > 31 ? startDay - 31 : startDay;
  const e = startDay + 6 > 31 ? startDay + 6 - 31 : startDay + 6;
  return {
    label: `${MONTHS[startDay > 31 ? 1 : 0]} ${s} – ${MONTHS[month]} ${e}`,
    dates: Array.from({ length: 7 }, (_, d) => {
      const day = startDay + d;
      return day > 31 ? `${MONTHS[1]} ${day - 31}` : `${MONTHS[0]} ${day}`;
    }),
    cells: buildWeek(i),
  };
});

const hoursText = (h: number) => {
  if (h === 0) return "–";
  const whole = Math.floor(h);
  const half = h - whole >= 0.5;
  if (whole === 0) return "30m";
  return half ? `${whole}h 30m` : `${whole}h`;
};

const totalText = (h: number) => {
  const whole = Math.floor(h);
  const half = h - whole >= 0.5;
  return half ? `${whole}h 30m` : `${whole}h`;
};

type Property = {
  label: string;
  Icon: typeof Building2;
  title: string;
  meta: string;
  trailing: "badge" | "avatars" | "avatar" | "flag";
  badge?: string;
};

const PROPERTIES: Property[] = [
  {
    label: "Account",
    Icon: Copy,
    title: "Northstar Commerce",
    meta: "Enterprise rollout",
    trailing: "flag",
  },
  {
    label: "Workspace",
    Icon: Globe,
    title: "portal.northstar.io",
    meta: "124k requests / day",
    trailing: "badge",
    badge: "Running",
  },
  {
    label: "Next review",
    Icon: CalendarDays,
    title: "Apr 3, 2026",
    meta: "Client steering",
    trailing: "avatars",
  },
  {
    label: "Owner",
    Icon: User,
    title: "Amara Ortiz",
    meta: "Delivery lead",
    trailing: "avatar",
  },
];

export default function Dashboard9() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [week, setWeek] = useState(1);
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const { ref: bodyRef, edges, onScroll } = useScrollFade<HTMLDivElement>();

  const current = WEEKS[week];

  const totals = useMemo(() => {
    const map: Record<string, { hours: number; pct: number }> = {};
    for (const person of PEOPLE) {
      const hours = current.cells[person.id].reduce((s, c) => s + c.hours, 0);
      map[person.id] = {
        hours,
        pct: Math.round((hours / person.target) * 100),
      };
    }
    return map;
  }, [current]);

  const weekTotal = PEOPLE.reduce((s, p) => s + totals[p.id].hours, 0);
  const clientHours = PEOPLE.reduce(
    (s, p) =>
      s +
      current.cells[p.id]
        .filter((c) => c.kind === "client")
        .reduce((a, c) => a + c.hours, 0),
    0,
  );
  const billablePct = Math.round((clientHours / (weekTotal || 1)) * 100);

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="shrink-0 px-4 pt-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
              Delivery board
            </h1>
            <nav aria-label="Breadcrumb" className="mt-1">
              <ol className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                <li>Accounts</li>
                <li
                  aria-hidden="true"
                  className="text-neutral-300 dark:text-neutral-700"
                >
                  /
                </li>
                <li>Delivery</li>
                <li
                  aria-hidden="true"
                  className="text-neutral-300 dark:text-neutral-700"
                >
                  /
                </li>
                <li className="truncate text-neutral-900 dark:text-neutral-100">
                  Northstar rollout
                </li>
              </ol>
            </nav>
          </div>

          <button
            type="button"
            aria-label={pinned ? "Unpin board" : "Pin board"}
            aria-pressed={pinned}
            onClick={() => setPinned((v) => !v)}
            className={cx(
              "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] hover:bg-neutral-100 dark:hover:bg-neutral-800",
              pinned
                ? "text-neutral-900 dark:text-neutral-100"
                : "text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            <Star
              aria-hidden="true"
              className={cx("h-4 w-4", pinned && "fill-current")}
            />
          </button>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div
            role="tablist"
            aria-label="Board sections"
            className="flex gap-4"
          >
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={t === tab}
                onClick={() => setTab(t)}
                className={cx(
                  "relative -mb-px cursor-pointer pb-2.5 text-[13px]",
                  t === tab
                    ? "font-medium text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {t}
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute inset-x-0 -bottom-px h-px bg-[var(--rb-accent,oklch(20.5%_0_0))] transition-opacity duration-150 ease-out motion-reduce:transition-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
                    t === tab ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="hidden shrink-0 items-center gap-2 pb-2.5 sm:flex">
            <button
              type="button"
              aria-label="Add member"
              className={cx(
                "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center">
              {PEOPLE.slice(0, 3).map((p, i) => (
                <span
                  key={p.id}
                  title={p.name}
                  className={cx(
                    "flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 ring-2 ring-white dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-950",
                    i > 0 && "-ml-1.5",
                  )}
                >
                  {initials(p.name)}
                </span>
              ))}
              <span className="-ml-1 flex h-7 items-center rounded-full bg-neutral-100 px-2 text-[10px] font-medium tabular-nums text-neutral-600 ring-2 ring-white dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-950">
                +6
              </span>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="h-px bg-neutral-200 dark:bg-neutral-800"
        />
      </header>

      <div className="grid shrink-0 grid-cols-2 gap-3 px-4 py-5 md:grid-cols-4 sm:px-6">
        {PROPERTIES.map((p) => (
          <div key={p.label} className={cx(panel, "p-3.5")}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[13px] text-neutral-500">
                {p.label}
              </span>
              <p.Icon
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
              />
            </div>
            <div className="mt-5 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {p.title}
                </p>
                <p className="mt-0.5 truncate text-[11px] tabular-nums text-neutral-500">
                  {p.meta}
                </p>
              </div>

              {p.trailing === "badge" && (
                <span className="inline-flex h-5 shrink-0 items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse motion-reduce:animate-none dark:bg-neutral-500" />
                  {p.badge}
                </span>
              )}
              {p.trailing === "flag" && (
                <span className="inline-flex h-5 shrink-0 items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  At risk
                </span>
              )}
              {p.trailing === "avatars" && (
                <div className="flex shrink-0 items-center">
                  {PEOPLE.slice(0, 2).map((x, i) => (
                    <span
                      key={x.id}
                      className={cx(
                        "flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 ring-2 ring-white dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-900",
                        i > 0 && "-ml-1.5",
                      )}
                    >
                      {initials(x.name)}
                    </span>
                  ))}
                  <span className="-ml-1 flex h-7 items-center rounded-full bg-neutral-100 px-2 text-[10px] font-medium tabular-nums text-neutral-600 ring-2 ring-white dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-900">
                    +1
                  </span>
                </div>
              )}
              {p.trailing === "avatar" && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {initials(p.title)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6">
        <div
          className={cx(panel, "flex min-h-0 flex-1 flex-col overflow-hidden")}
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Worklogs
              </h2>
              <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                {totalText(weekTotal)} logged · {billablePct}% client billable
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Previous week"
                disabled={week === 0}
                onClick={() => setWeek((w) => Math.max(0, w - 1))}
                className={cx(
                  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900",
                  transition,
                  focus,
                )}
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </button>
              <span
                aria-live="polite"
                className="inline-flex h-8 min-w-[132px] items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] tabular-nums text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              >
                {current.label}
              </span>
              <button
                type="button"
                aria-label="Next week"
                disabled={week === WEEKS.length - 1}
                onClick={() =>
                  setWeek((w) => Math.min(WEEKS.length - 1, w + 1))
                }
                className={cx(
                  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900",
                  transition,
                  focus,
                )}
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              ref={bodyRef}
              onScroll={onScroll}
              className="h-full overflow-x-auto overflow-y-auto"
            >
              <table className="w-full min-w-[860px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white dark:bg-neutral-900">
                  <tr className="h-9">
                    <th
                      scope="col"
                      className="sticky left-0 z-10 w-[212px] bg-white px-4 text-left text-[13px] font-normal text-neutral-500 dark:bg-neutral-900"
                    >
                      People
                    </th>
                    {current.dates.map((d, i) => (
                      <th
                        key={d}
                        scope="col"
                        className={cx(
                          "px-2 text-center text-[13px] font-normal tabular-nums",
                          i >= 5
                            ? "text-neutral-400 dark:text-neutral-600"
                            : "text-neutral-500",
                        )}
                      >
                        {DAY_LABELS[i]}, {d}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="w-[120px] px-4 text-right text-[13px] font-normal text-neutral-500"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PEOPLE.map((person) => {
                    const row = current.cells[person.id];
                    const t = totals[person.id];
                    const isHover = hover === person.id;
                    return (
                      <tr
                        key={person.id}
                        onPointerEnter={() => setHover(person.id)}
                        onPointerLeave={() => setHover(null)}
                        className={cx(
                          "h-[78px]",
                          isHover && "bg-neutral-50 dark:bg-neutral-800/40",
                          transition,
                        )}
                      >
                        <th
                          scope="row"
                          className={cx(
                            "sticky left-0 z-10 px-4 text-left font-normal",
                            isHover
                              ? "bg-neutral-50 dark:bg-neutral-800/40"
                              : "bg-white dark:bg-neutral-900",
                            transition,
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              aria-hidden="true"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                            >
                              {initials(person.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                                {person.name}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                {person.role}
                              </p>
                            </div>
                          </div>
                        </th>

                        {row.map((cell, i) => (
                          <td key={i} className="px-2 align-middle">
                            <div className="flex flex-col items-center gap-1.5">
                              <span
                                className={cx(
                                  "text-[13px] font-medium tabular-nums",
                                  cell.kind === "off"
                                    ? "text-neutral-300 dark:text-neutral-700"
                                    : "text-neutral-900 dark:text-neutral-100",
                                )}
                              >
                                {hoursText(cell.hours)}
                              </span>
                              <span
                                aria-hidden="true"
                                className="h-1 w-full max-w-[76px] overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                              >
                                <span
                                  className={cx(
                                    "block h-full rounded-full",
                                    cell.kind === "client"
                                      ? "bg-neutral-900 dark:bg-neutral-100"
                                      : cell.kind === "internal"
                                        ? "bg-neutral-400 dark:bg-neutral-500"
                                        : "bg-transparent",
                                  )}
                                  style={{
                                    width: `${clamp((cell.hours / 9) * 100, 0, 100)}%`,
                                  }}
                                />
                              </span>
                              <span
                                className={cx(
                                  "text-[11px]",
                                  cell.kind === "off"
                                    ? "text-neutral-300 dark:text-neutral-700"
                                    : "text-neutral-500",
                                )}
                              >
                                {cell.kind === "off"
                                  ? "Off"
                                  : cell.kind === "client"
                                    ? "Client"
                                    : "Internal"}
                              </span>
                            </div>
                          </td>
                        ))}

                        <td className="px-4 text-right align-middle">
                          <p className="text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                            {totalText(t.hours)}
                          </p>
                          <p
                            className={cx(
                              "mt-0.5 text-[11px] tabular-nums",
                              t.pct >= 90
                                ? "text-neutral-500"
                                : t.pct >= 75
                                  ? "text-neutral-500"
                                  : "text-red-600 dark:text-red-500",
                            )}
                          >
                            {t.pct}% of {person.target}h
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 top-9 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                edges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                edges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <div className="flex items-center gap-4 text-[11px] text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-4 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                Client
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-4 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                Internal
              </span>
            </div>
            <p className="text-[13px] tabular-nums text-neutral-500">
              {PEOPLE.length} people ·{" "}
              <span className="text-neutral-900 dark:text-neutral-100">
                {totalText(weekTotal)}
              </span>{" "}
              this week
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, Search, SearchX } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Site = {
  site: string;
  dock: string;
  days: number[];
  peak: number;
  risk: "Clear" | "Watch" | "High";
};

const sites: Site[] = [
  {
    site: "Atlanta Fulfillment",
    dock: "Bay 14",
    days: [86, 91, 77, 83, 94, 61, 40],
    peak: 94,
    risk: "Watch",
  },
  {
    site: "Reno Crossdock",
    dock: "Bay 03",
    days: [72, 70, 69, 74, 81, 58, 35],
    peak: 81,
    risk: "Clear",
  },
  {
    site: "Long Beach Import Annex With Extended Customs Queue",
    dock: "Yard 9",
    days: [97, 98, 95, 92, 89, 84, 70],
    peak: 98,
    risk: "High",
  },
  {
    site: "Columbus Returns Hub",
    dock: "Bay 21",
    days: [64, 68, 71, 73, 76, 52, 30],
    peak: 76,
    risk: "Clear",
  },
  {
    site: "Dallas Regional Depot",
    dock: "Bay 07",
    days: [88, 84, 90, 92, 96, 66, 44],
    peak: 96,
    risk: "Watch",
  },
  {
    site: "Newark Gateway",
    dock: "Bay 12",
    days: [79, 82, 85, 88, 91, 60, 38],
    peak: 91,
    risk: "Watch",
  },
  {
    site: "Phoenix Sortation",
    dock: "Bay 05",
    days: [61, 63, 66, 70, 74, 49, 28],
    peak: 74,
    risk: "Clear",
  },
  {
    site: "Chicago Inbound",
    dock: "Bay 18",
    days: [93, 95, 97, 96, 98, 78, 55],
    peak: 98,
    risk: "High",
  },
  {
    site: "Denver Cold Storage",
    dock: "Bay 02",
    days: [70, 72, 74, 71, 80, 57, 33],
    peak: 80,
    risk: "Clear",
  },
  {
    site: "Seattle Import Yard",
    dock: "Yard 4",
    days: [83, 85, 81, 87, 90, 62, 41],
    peak: 90,
    risk: "Watch",
  },
  {
    site: "Miami Cross-Border",
    dock: "Bay 09",
    days: [76, 78, 80, 82, 85, 55, 36],
    peak: 85,
    risk: "Clear",
  },
];

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function RiskCell({ risk }: { risk: Site["risk"] }) {
  const dot =
    risk === "High"
      ? "bg-red-500"
      : risk === "Watch"
        ? "bg-amber-500"
        : "bg-neutral-300 dark:bg-neutral-600";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-neutral-600 dark:text-neutral-400">
      <span
        aria-hidden
        className={cx("h-1.5 w-1.5 shrink-0 rounded-full", dot)}
      />
      {risk}
    </span>
  );
}

type SortKey = "site" | "peak";

function SortLabel({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cx(
        "inline-flex h-9 max-w-full cursor-pointer items-center gap-1 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
        align === "right" && "flex-row-reverse",
        active
          ? "text-neutral-900 dark:text-neutral-100"
          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
      )}
    >
      <span className="truncate">{label}</span>
      <ChevronUp
        aria-hidden
        className={cx(
          "h-3 w-3 shrink-0 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
          active ? "opacity-100" : "opacity-0",
          active && sort.dir === "desc" && "rotate-180",
        )}
      />
    </button>
  );
}

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

export default function DataTable8() {
  const body = useScrollFade<HTMLDivElement>();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "peak",
    dir: "desc",
  });

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "site" ? "asc" : "desc" },
    );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? sites.filter(
          (s) =>
            s.site.toLowerCase().includes(q) ||
            s.dock.toLowerCase().includes(q),
        )
      : sites;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) =>
      sort.key === "peak"
        ? (a.peak - b.peak) * factor
        : a.site.localeCompare(b.site) * factor,
    );
  }, [query, sort]);

  const atRisk = sites.filter((s) => s.peak >= 95).length;

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 bg-neutral-50 px-4 sm:px-6 dark:bg-neutral-900">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Dock capacity
            </h2>
            <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">
              Utilization by site, this week
            </p>
          </div>
          <label className="relative hidden w-48 sm:block">
            <span className="sr-only">Search sites</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sites"
              className="h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            />
          </label>
        </header>

        <div className="relative min-h-0 flex-1">
          <div
            ref={body.ref}
            onScroll={body.onScroll}
            className="h-full overflow-auto"
          >
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Weekly dock utilization by site
              </caption>
              <thead className="sticky top-0 z-20">
                <tr className="bg-neutral-50 dark:bg-neutral-900">
                  <th
                    scope="col"
                    aria-sort={
                      sort.key === "site"
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="sticky left-0 z-10 h-9 border-r border-neutral-200/70 bg-neutral-50 px-3 pl-4 text-xs font-medium text-neutral-500 sm:pl-6 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <SortLabel
                      label="Site"
                      sortKey="site"
                      sort={sort}
                      onSort={toggleSort}
                    />
                  </th>
                  {dayLabels.map((d) => (
                    <th
                      key={d}
                      scope="col"
                      className="h-9 min-w-[64px] bg-neutral-50 px-3 text-right text-xs font-medium text-neutral-500 dark:bg-neutral-900"
                    >
                      {d}
                    </th>
                  ))}
                  <th
                    scope="col"
                    aria-sort={
                      sort.key === "peak"
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="h-9 min-w-[72px] bg-neutral-50 px-3 text-right text-xs font-medium text-neutral-500 dark:bg-neutral-900"
                  >
                    <SortLabel
                      label="Peak"
                      sortKey="peak"
                      sort={sort}
                      onSort={toggleSort}
                      align="right"
                    />
                  </th>
                  <th
                    scope="col"
                    className="h-9 w-[120px] bg-neutral-50 px-3 text-xs font-medium text-neutral-500 dark:bg-neutral-900"
                  >
                    Risk
                  </th>
                  <th
                    scope="col"
                    className="h-9 w-[100px] bg-neutral-50 px-3 pr-4 text-right text-xs font-medium text-neutral-500 sm:pr-6 dark:bg-neutral-900"
                  >
                    Dock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                {rows.map((s) => (
                  <tr
                    key={s.site}
                    className="group h-11 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-900/60"
                  >
                    <th
                      scope="row"
                      className="sticky left-0 z-10 max-w-[220px] border-r border-neutral-200/70 bg-white px-3 pl-4 text-left text-[13px] font-medium text-neutral-900 transition-colors duration-150 group-hover:bg-neutral-50 sm:pl-6 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:group-hover:bg-neutral-900"
                    >
                      <span className="block truncate">{s.site}</span>
                    </th>
                    {s.days.map((v, i) => (
                      <td
                        key={i}
                        className={cx(
                          "px-3 text-right text-[13px] tabular-nums",
                          v >= 95
                            ? "font-medium text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-600 dark:text-neutral-400",
                        )}
                      >
                        {v}%
                      </td>
                    ))}
                    <td className="px-3 text-right text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                      {s.peak}%
                    </td>
                    <td className="px-3">
                      <RiskCell risk={s.risk} />
                    </td>
                    <td className="whitespace-nowrap px-3 pr-4 text-right text-[13px] tabular-nums text-neutral-600 sm:pr-6 dark:text-neutral-400">
                      {s.dock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length === 0 && (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center">
                <span
                  aria-hidden
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                >
                  <SearchX className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  No sites match that search
                </p>
                <p className="mt-1 max-w-xs text-xs text-neutral-600 dark:text-neutral-400">
                  Try a site name or a dock number.
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-4 inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              body.edges.end ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <footer className="flex h-12 shrink-0 items-center bg-neutral-50 px-4 text-xs tabular-nums text-neutral-600 sm:px-6 dark:bg-neutral-900 dark:text-neutral-400">
          {rows.length} of {sites.length} sites · {atRisk} above 95% peak
        </footer>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search, Server } from "lucide-react";

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

type Host = {
  id: string;
  name: string;
  role: string;
  region: string;
  cpu: number;
  mem: number;
  disk: number;
  uptime: string;
  state: "healthy" | "warning" | "critical";
  note: string;
};

const HOSTS: Host[] = [
  {
    id: "h1",
    name: "api-eu-01",
    role: "API",
    region: "eu-west-1",
    cpu: 44,
    mem: 62,
    disk: 38,
    uptime: "34d",
    state: "healthy",
    note: "Serving 1.2k req/s with headroom on every dimension.",
  },
  {
    id: "h2",
    name: "api-eu-02",
    role: "API",
    region: "eu-west-1",
    cpu: 91,
    mem: 78,
    disk: 41,
    uptime: "34d",
    state: "critical",
    note: "CPU has been pinned above 88% for 22 minutes. Shed traffic or add a node.",
  },
  {
    id: "h3",
    name: "worker-eu-01",
    role: "Worker",
    region: "eu-west-1",
    cpu: 58,
    mem: 71,
    disk: 55,
    uptime: "12d",
    state: "healthy",
    note: "Draining the invoice backlog at 340 jobs per minute.",
  },
  {
    id: "h4",
    name: "worker-us-01",
    role: "Worker",
    region: "us-east-1",
    cpu: 36,
    mem: 49,
    disk: 87,
    uptime: "61d",
    state: "warning",
    note: "Disk at 87%. Rotate the job archive older than 30 days.",
  },
  {
    id: "h5",
    name: "db-primary",
    role: "Database",
    region: "eu-west-1",
    cpu: 52,
    mem: 84,
    disk: 66,
    uptime: "128d",
    state: "warning",
    note: "Buffer cache is under pressure during the nightly vacuum window.",
  },
  {
    id: "h6",
    name: "db-replica-01",
    role: "Database",
    region: "us-east-1",
    cpu: 21,
    mem: 47,
    disk: 64,
    uptime: "128d",
    state: "healthy",
    note: "Replication lag steady at 0.4s.",
  },
  {
    id: "h7",
    name: "cache-eu-01",
    role: "Cache",
    region: "eu-west-1",
    cpu: 18,
    mem: 33,
    disk: 12,
    uptime: "77d",
    state: "healthy",
    note: "Hit ratio 97.4% across the catalog keyspace.",
  },
  {
    id: "h8",
    name: "edge-ap-01",
    role: "Edge",
    region: "ap-south-1",
    cpu: 29,
    mem: 41,
    disk: 22,
    uptime: "9d",
    state: "healthy",
    note: "Newest node in the fleet, added during the Mumbai rollout.",
  },
];

const REGIONS = ["All regions", "eu-west-1", "us-east-1", "ap-south-1"];

const DOT: Record<Host["state"], string> = {
  healthy: "bg-neutral-300 dark:bg-neutral-600",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

const STATE_LABEL: Record<Host["state"], string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
};

type SortKey = "name" | "cpu" | "mem" | "disk";

function Meter({ label, value }: { label: string; value: number }) {
  const hot = value >= 85;
  const warm = value >= 70;
  return (
    <div className="min-w-[64px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-neutral-400">{label}</span>
        <span
          className={cx(
            "text-[12px] tabular-nums",
            hot
              ? "text-red-600 dark:text-red-400"
              : "text-neutral-700 dark:text-neutral-300",
          )}
        >
          {value}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
      >
        <div
          style={{ width: `${value}%` }}
          className={cx(
            "h-full rounded-full",
            hot
              ? "bg-red-500"
              : warm
                ? "bg-amber-500"
                : "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
          )}
        />
      </div>
    </div>
  );
}

export default function Monitoring7() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: "cpu",
    asc: false,
  });
  const [open, setOpen] = useState<string | null>("h2");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = HOSTS.filter(
      (h) =>
        (region === REGIONS[0] || h.region === region) &&
        (!q ||
          h.name.toLowerCase().includes(q) ||
          h.role.toLowerCase().includes(q)),
    );
    const dir = sort.asc ? 1 : -1;
    return [...list].sort((a, b) =>
      sort.key === "name"
        ? a.name.localeCompare(b.name) * dir
        : (a[sort.key] - b[sort.key]) * dir,
    );
  }, [query, region, sort]);

  const attention = HOSTS.filter((h) => h.state !== "healthy").length;

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, asc: !s.asc } : { key, asc: false },
    );

  const columns: { key: SortKey; label: string; cls: string }[] = [
    { key: "cpu", label: "CPU", cls: "hidden md:table-cell" },
    { key: "mem", label: "Memory", cls: "hidden md:table-cell" },
    { key: "disk", label: "Disk", cls: "hidden lg:table-cell" },
  ];

  return (
    <div className="flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col gap-1",
        )}
      >
        <div className={cx(panel, "px-4 py-3.5")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Fleet
              </h2>
              <p className="mt-0.5 truncate text-[12px] text-neutral-500 tabular-nums">
                {HOSTS.length} nodes · {attention} need attention · sampled 30s
                ago
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <label htmlFor="monitoring-7-region" className="sr-only">
                Region
              </label>
              <select
                id="monitoring-7-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={cx(
                  "h-8 cursor-pointer rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200",
                  transition,
                  focus,
                )}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="relative w-[200px]">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
                <label htmlFor="monitoring-7-search" className="sr-only">
                  Search hosts
                </label>
                <input
                  id="monitoring-7-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search host or role"
                  className={cx(
                    "h-8 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pr-2.5 pl-8 text-[13px] text-neutral-900 placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
                    transition,
                    focus,
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto")}>
          {rows.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <Server className="h-6 w-6 text-neutral-300 dark:text-neutral-700" />
              <p className="mt-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                No matching nodes
              </p>
              <p className="mt-1 max-w-[280px] text-[12px] text-neutral-500">
                Adjust the region filter or clear the search.
              </p>
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr className="text-[12px] text-neutral-500">
                  <th
                    scope="col"
                    aria-sort={
                      sort.key === "name"
                        ? sort.asc
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="py-2 pr-3 pl-3 font-normal"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className={cx(
                        "inline-flex h-6 cursor-pointer items-center gap-1 rounded-[var(--rb-r-sm,6px)] px-1 hover:text-neutral-900 dark:hover:text-neutral-100",
                        transition,
                        focus,
                        sort.key === "name" &&
                          "text-neutral-900 dark:text-neutral-100",
                      )}
                    >
                      Node
                      {sort.key === "name" &&
                        (sort.asc ? (
                          <ArrowUp className="h-3 w-3" aria-hidden />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden />
                        ))}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="hidden py-2 pr-3 font-normal sm:table-cell"
                  >
                    Status
                  </th>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={
                        sort.key === c.key
                          ? sort.asc
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className={cx("w-[120px] py-2 pr-3 font-normal", c.cls)}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cx(
                          "inline-flex h-6 cursor-pointer items-center gap-1 rounded-[var(--rb-r-sm,6px)] px-1 hover:text-neutral-900 dark:hover:text-neutral-100",
                          transition,
                          focus,
                          sort.key === c.key &&
                            "text-neutral-900 dark:text-neutral-100",
                        )}
                      >
                        {c.label}
                        {sort.key === c.key &&
                          (sort.asc ? (
                            <ArrowUp className="h-3 w-3" aria-hidden />
                          ) : (
                            <ArrowDown className="h-3 w-3" aria-hidden />
                          ))}
                      </button>
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="hidden w-[72px] py-2 pr-3 text-right font-normal xl:table-cell"
                  >
                    Uptime
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.id}>
                    <td colSpan={6} className="p-0">
                      <button
                        type="button"
                        aria-expanded={open === h.id}
                        onClick={() => setOpen(open === h.id ? null : h.id)}
                        className={cx(
                          "block w-full cursor-pointer text-left",
                          focus,
                        )}
                      >
                        <span
                          className={cx(
                            "flex items-center gap-3 px-3 py-2.5",
                            transition,
                            open === h.id
                              ? "bg-neutral-50 dark:bg-neutral-800/50"
                              : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                              {h.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[12px] text-neutral-500">
                              {h.role} · {h.region}
                            </span>
                          </span>
                          <span className="hidden w-[92px] shrink-0 items-center gap-1.5 text-[12px] text-neutral-500 sm:inline-flex">
                            <span
                              aria-hidden
                              className={cx(
                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                DOT[h.state],
                              )}
                            />
                            {STATE_LABEL[h.state]}
                          </span>
                          <span className="hidden w-[120px] shrink-0 md:block">
                            <Meter label="CPU" value={h.cpu} />
                          </span>
                          <span className="hidden w-[120px] shrink-0 md:block">
                            <Meter label="Memory" value={h.mem} />
                          </span>
                          <span className="hidden w-[120px] shrink-0 lg:block">
                            <Meter label="Disk" value={h.disk} />
                          </span>
                          <span className="hidden w-[72px] shrink-0 text-right text-[12px] text-neutral-500 tabular-nums xl:block">
                            {h.uptime}
                          </span>
                        </span>
                      </button>
                      {open === h.id && (
                        <p className="bg-neutral-50 px-3 pb-3 text-[12px] leading-relaxed text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400">
                          {h.note}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div
          className={cx(
            panel,
            "flex flex-wrap items-center justify-between gap-2 px-3 py-2",
          )}
        >
          <p className="text-[12px] text-neutral-500 tabular-nums">
            Showing {rows.length} of {HOSTS.length} nodes
          </p>
          <p className="text-[12px] text-neutral-500">
            Metrics refresh every 30 seconds
          </p>
        </div>
      </div>
    </div>
  );
}

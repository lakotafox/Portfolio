"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronRight, Search, SearchX } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Run = {
  id: string;
  job: string;
  owner: string;
  status: "Passed" | "Needs review" | "Failed";
  duration: string;
  checked: string;
  summary: string;
  sources: string[];
};

const runs: Run[] = [
  {
    id: "RUN-8041",
    job: "Nightly claims ledger reconciliation",
    owner: "Asha Malik",
    status: "Passed",
    duration: "14m 22s",
    checked: "39,420 rows",
    summary:
      "Matched carrier claims against the posted warehouse ledger. Two rounding adjustments were carried forward for manager review.",
    sources: [
      "ledger.carrier_claims",
      "warehouse.reconciliations",
      "s3://ops-ledger/aug-03",
    ],
  },
  {
    id: "RUN-8042",
    job: "Cold-chain incident attachment scan",
    owner: "Theo Grant",
    status: "Needs review",
    duration: "6m 09s",
    checked: "812 incidents",
    summary:
      "Temperature excursions clustered by lane. The Atlanta to Tampa route is missing three signed exception forms.",
    sources: ["forms.temperature_exception", "drive://regional-quality"],
  },
  {
    id: "RUN-8043",
    job: "Vendor master duplicate detection",
    owner: "Camille Hart",
    status: "Passed",
    duration: "3m 58s",
    checked: "1,204 vendors",
    summary:
      "No active duplicates found. Four legacy supplier aliases remain archived and do not block payment release.",
    sources: ["postgres.vendor_master", "policy://supplier-aliases"],
  },
  {
    id: "RUN-8044",
    job: "Freight invoice variance audit for Q3 European lanes",
    owner: "Jun Park",
    status: "Failed",
    duration: "1m 12s",
    checked: "0 rows",
    summary:
      "The rate card connector returned an authentication error, so no invoices could be compared. Reconnect the source and rerun.",
    sources: ["connector.rate_card", "audit://2026-q3"],
  },
  {
    id: "RUN-8045",
    job: "Returns disposition rule check",
    owner: "Ivy Zhang",
    status: "Passed",
    duration: "8m 41s",
    checked: "5,109 returns",
    summary:
      "All dispositions matched the current policy. Twelve items were routed to refurbishment as expected.",
    sources: ["returns.dispositions", "policy://returns-2026"],
  },
  {
    id: "RUN-8046",
    job: "Dock appointment overlap detection",
    owner: "Marcus Lund",
    status: "Passed",
    duration: "2m 33s",
    checked: "684 appointments",
    summary:
      "No double-booked dock windows. Two back-to-back slots flagged for a 10-minute buffer.",
    sources: ["scheduling.dock_windows"],
  },
  {
    id: "RUN-8047",
    job: "Customs paperwork completeness sweep",
    owner: "Sofia Martins",
    status: "Needs review",
    duration: "11m 04s",
    checked: "2,940 shipments",
    summary:
      "Nine cross-border shipments are missing a commercial invoice attachment.",
    sources: ["customs.shipments", "mailbox://broker-intake"],
  },
  {
    id: "RUN-8048",
    job: "Inventory shrink threshold review",
    owner: "Rhea Flores",
    status: "Passed",
    duration: "5m 27s",
    checked: "18,006 SKUs",
    summary:
      "Shrink stayed under target across every site. Columbus returns hub is trending up week over week.",
    sources: ["inventory.counts"],
  },
  {
    id: "RUN-8049",
    job: "Carrier SLA breach detection",
    owner: "Devon Okafor",
    status: "Passed",
    duration: "4m 15s",
    checked: "3,377 loads",
    summary:
      "Two carriers breached transit SLA on the west lanes. Both are already within the penalty grace window.",
    sources: ["carriers.sla", "loads.transit"],
  },
];

const headBase =
  "h-9 px-3 text-xs font-medium text-neutral-500 first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6";
const cellBase =
  "px-3 text-[13px] first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6";

function StatusCell({ status }: { status: Run["status"] }) {
  const dot =
    status === "Failed"
      ? "bg-red-500"
      : status === "Needs review"
        ? "bg-amber-500"
        : "bg-neutral-300 dark:bg-neutral-600";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-neutral-600 dark:text-neutral-400">
      <span
        aria-hidden
        className={cx("h-1.5 w-1.5 shrink-0 rounded-full", dot)}
      />
      {status}
    </span>
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

export default function DataTable4() {
  const body = useScrollFade<HTMLDivElement>();
  const [open, setOpen] = useState<Set<string>>(new Set(["RUN-8041"]));
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return runs;
    return runs.filter(
      (r) =>
        r.job.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [query]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 bg-neutral-50 px-4 sm:px-6 dark:bg-neutral-900">
          <h2 className="min-w-0 flex-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Overnight checks
          </h2>
          <label className="relative hidden w-56 sm:block">
            <span className="sr-only">Search checks</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search checks"
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
            <table className="w-full min-w-[760px] border-collapse text-left">
              <caption className="sr-only">
                Overnight automation checks, expandable
              </caption>
              <thead className="sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th scope="col" className={cx(headBase, "w-[52px]")}>
                    <span className="sr-only">Expand</span>
                  </th>
                  <th scope="col" className={headBase}>
                    Check
                  </th>
                  <th scope="col" className={cx(headBase, "w-[150px]")}>
                    Owner
                  </th>
                  <th scope="col" className={cx(headBase, "w-[150px]")}>
                    Result
                  </th>
                  <th
                    scope="col"
                    className={cx(headBase, "w-[110px] text-right")}
                  >
                    Duration
                  </th>
                  <th
                    scope="col"
                    className={cx(headBase, "w-[150px] text-right")}
                  >
                    Checked
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                {rows.map((run) => {
                  const isOpen = open.has(run.id);
                  return (
                    <Fragment key={run.id}>
                      <tr
                        onClick={() => toggle(run.id)}
                        className={cx(
                          "group h-11 cursor-pointer transition-colors duration-150",
                          isOpen
                            ? "bg-neutral-50 dark:bg-neutral-900/60"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
                        )}
                      >
                        <td className={cx(cellBase, "w-[52px] pr-0")}>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-label={`${isOpen ? "Collapse" : "Expand"} ${run.job}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(run.id);
                            }}
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-500 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                          >
                            <ChevronRight
                              aria-hidden
                              className={cx(
                                "h-4 w-4 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                                isOpen && "rotate-90",
                              )}
                            />
                          </button>
                        </td>
                        <td
                          className={cx(
                            cellBase,
                            "max-w-[300px] font-medium text-neutral-900 dark:text-neutral-100",
                          )}
                        >
                          <span className="block truncate">{run.job}</span>
                          <span className="block font-mono text-xs text-neutral-500">
                            {run.id}
                          </span>
                        </td>
                        <td
                          className={cx(
                            cellBase,
                            "truncate text-neutral-600 dark:text-neutral-400",
                          )}
                        >
                          {run.owner}
                        </td>
                        <td className={cellBase}>
                          <StatusCell status={run.status} />
                        </td>
                        <td
                          className={cx(
                            cellBase,
                            "whitespace-nowrap text-right tabular-nums text-neutral-600 dark:text-neutral-400",
                          )}
                        >
                          {run.duration}
                        </td>
                        <td
                          className={cx(
                            cellBase,
                            "whitespace-nowrap text-right tabular-nums text-neutral-600 dark:text-neutral-400",
                          )}
                        >
                          {run.checked}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-neutral-50 dark:bg-neutral-900/60">
                          <td className="w-[52px]" />
                          <td
                            colSpan={5}
                            className="px-3 pb-4 pt-1 pr-4 sm:pr-6"
                          >
                            <p className="max-w-2xl text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                              {run.summary}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              {run.sources.map((s) => (
                                <span
                                  key={s}
                                  className="inline-flex h-7 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
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
                  No checks match that search
                </p>
                <p className="mt-1 max-w-xs text-xs text-neutral-600 dark:text-neutral-400">
                  Try a job name, an owner, or a run ID.
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
          Showing {rows.length} of {runs.length} overnight checks
        </footer>
      </div>
    </div>
  );
}

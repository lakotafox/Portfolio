"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  X,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Payment = {
  id: string;
  vendor: string;
  owner: string;
  status: "Scheduled" | "Needs approval" | "Paid" | "On hold";
  amount: number;
  due: string;
};

const payments: Payment[] = [
  {
    id: "PAY-0182",
    vendor: "Pilot Fiber Transit",
    owner: "Iris Woods",
    status: "Needs approval",
    amount: 6420,
    due: "Aug 6",
  },
  {
    id: "PAY-0183",
    vendor: "Granite Switchgear Supply",
    owner: "Niko Bryant",
    status: "Scheduled",
    amount: 18200,
    due: "Aug 7",
  },
  {
    id: "PAY-0184",
    vendor: "Beacon Yard Services",
    owner: "Marisol Vale",
    status: "Paid",
    amount: 3140,
    due: "Aug 9",
  },
  {
    id: "PAY-0185",
    vendor: "Atlas Thermal Controls",
    owner: "Jun Park",
    status: "Scheduled",
    amount: 9880,
    due: "Aug 11",
  },
  {
    id: "PAY-0186",
    vendor: "Silverline Security Review Partners",
    owner: "Mara Singh",
    status: "Needs approval",
    amount: 2760,
    due: "Aug 15",
  },
  {
    id: "PAY-0187",
    vendor: "Lowland Metering Group",
    owner: "Theo Grant",
    status: "Paid",
    amount: 14050,
    due: "Aug 18",
  },
  {
    id: "PAY-0188",
    vendor: "Cedarworks Freight",
    owner: "Asha Malik",
    status: "Scheduled",
    amount: 5310,
    due: "Aug 20",
  },
  {
    id: "PAY-0189",
    vendor: "Halden Instrument Rental",
    owner: "Camille Hart",
    status: "Paid",
    amount: 1980,
    due: "Aug 22",
  },
  {
    id: "PAY-0190",
    vendor: "Northwind Facilities",
    owner: "Iris Woods",
    status: "Needs approval",
    amount: 22400,
    due: "Aug 25",
  },
  {
    id: "PAY-0191",
    vendor: "Riverbend Testing Lab",
    owner: "Niko Bryant",
    status: "Scheduled",
    amount: 7640,
    due: "Aug 27",
  },
  {
    id: "PAY-0192",
    vendor: "Cascade Pallet Works",
    owner: "Marisol Vale",
    status: "Paid",
    amount: 4380,
    due: "Aug 28",
  },
  {
    id: "PAY-0193",
    vendor: "Ironvale Coatings",
    owner: "Theo Grant",
    status: "Scheduled",
    amount: 12740,
    due: "Sep 1",
  },
  {
    id: "PAY-0194",
    vendor: "Dockside Calibration Services",
    owner: "Mara Singh",
    status: "Needs approval",
    amount: 8150,
    due: "Sep 2",
  },
  {
    id: "PAY-0195",
    vendor: "Alder Route Analytics",
    owner: "Jun Park",
    status: "Scheduled",
    amount: 3290,
    due: "Sep 4",
  },
  {
    id: "PAY-0196",
    vendor: "Fenwick Packaging",
    owner: "Camille Hart",
    status: "Paid",
    amount: 6710,
    due: "Sep 5",
  },
  {
    id: "PAY-0197",
    vendor: "Harborlight Cold Chain",
    owner: "Iris Woods",
    status: "Scheduled",
    amount: 19430,
    due: "Sep 8",
  },
  {
    id: "PAY-0198",
    vendor: "Quarry Bend Materials",
    owner: "Niko Bryant",
    status: "Needs approval",
    amount: 5040,
    due: "Sep 9",
  },
  {
    id: "PAY-0199",
    vendor: "Westline Fleet Care",
    owner: "Asha Malik",
    status: "Paid",
    amount: 2260,
    due: "Sep 11",
  },
  {
    id: "PAY-0200",
    vendor: "Stonecrest Utility Partners",
    owner: "Marisol Vale",
    status: "Scheduled",
    amount: 15870,
    due: "Sep 12",
  },
  {
    id: "PAY-0201",
    vendor: "Meridian Trade Compliance",
    owner: "Jun Park",
    status: "Needs approval",
    amount: 9320,
    due: "Sep 15",
  },
  {
    id: "PAY-0202",
    vendor: "Blackpine Yard Equipment",
    owner: "Theo Grant",
    status: "Scheduled",
    amount: 7180,
    due: "Sep 16",
  },
  {
    id: "PAY-0203",
    vendor: "Verity Audit Group",
    owner: "Mara Singh",
    status: "Paid",
    amount: 11600,
    due: "Sep 18",
  },
  {
    id: "PAY-0204",
    vendor: "Copperfield Signage",
    owner: "Camille Hart",
    status: "Scheduled",
    amount: 1840,
    due: "Sep 19",
  },
  {
    id: "PAY-0205",
    vendor: "Northgate Waste Services",
    owner: "Niko Bryant",
    status: "Needs approval",
    amount: 4960,
    due: "Sep 22",
  },
  {
    id: "PAY-0206",
    vendor: "Trellis Facility Software",
    owner: "Iris Woods",
    status: "Paid",
    amount: 20510,
    due: "Sep 23",
  },
  {
    id: "PAY-0207",
    vendor: "Sunfield Grounds Care",
    owner: "Asha Malik",
    status: "Scheduled",
    amount: 3470,
    due: "Sep 25",
  },
  {
    id: "PAY-0208",
    vendor: "Larkspur Legal Retainer",
    owner: "Jun Park",
    status: "Needs approval",
    amount: 13250,
    due: "Sep 26",
  },
  {
    id: "PAY-0209",
    vendor: "Beacon Ridge Insurance",
    owner: "Marisol Vale",
    status: "Scheduled",
    amount: 27890,
    due: "Sep 29",
  },
];
const currency = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const headBase =
  "h-9 px-3 text-xs font-medium text-neutral-500 first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6";
const cellBase =
  "px-3 text-[13px] first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6";

function StatusCell({ status }: { status: Payment["status"] }) {
  const dot =
    status === "Needs approval" || status === "On hold"
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

function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const mixed = !!indeterminate && !checked;
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <span className="relative inline-flex h-4 w-4 shrink-0">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className={cx(
          "h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border transition-colors duration-150 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
          checked || mixed
            ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
            : "border-neutral-300 bg-white hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-neutral-600",
        )}
      />
      {(checked || mixed) && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
        >
          {mixed ? (
            <Minus className="h-2.5 w-2.5" strokeWidth={3} />
          ) : (
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          )}
        </span>
      )}
    </span>
  );
}

const pageSizes = [10, 25] as const;

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

export default function DataTable2() {
  const body = useScrollFade<HTMLDivElement>();
  const [held, setHeld] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["PAY-0182", "PAY-0185"]),
  );
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(payments.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const pageRows = payments.slice(start, start + pageSize);

  const pageIds = pageRows.map((p) => p.id);
  const pageSelectedCount = pageIds.filter((id) => selected.has(id)).length;
  const allChecked = pageSelectedCount === pageIds.length && pageIds.length > 0;
  const someChecked = pageSelectedCount > 0 && !allChecked;

  const selectedTotal = useMemo(
    () =>
      payments
        .filter((p) => selected.has(p.id))
        .reduce((sum, p) => sum + p.amount, 0),
    [selected],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  const clear = () => setSelected(new Set());

  const holdSelected = () => {
    setHeld((prev) => new Set([...prev, ...selected]));
    clear();
  };

  const statusOf = (p: Payment): Payment["status"] =>
    held.has(p.id) ? "On hold" : p.status;

  const goTo = (next: number) =>
    setPage(Math.min(Math.max(next, 1), pageCount));

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 bg-neutral-50 px-4 sm:px-6 dark:bg-neutral-900">
          <h2 className="min-w-0 flex-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Outgoing payments
          </h2>
          <span className="shrink-0 text-xs tabular-nums text-neutral-500">
            {payments.length} pending
          </span>
        </header>

        {selected.size > 0 ? (
          <div className="flex h-12 shrink-0 items-center gap-3 bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[var(--rb-accent-fg,oklch(100%_0_0))] sm:px-6 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
            <span
              aria-live="polite"
              className="text-[13px] font-medium tabular-nums"
            >
              {selected.size} selected
            </span>
            <span className="text-xs tabular-nums text-white/60 dark:text-neutral-500">
              {currency(selectedTotal)}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={holdSelected}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-white/10 px-2.5 text-[13px] font-medium text-white/90 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/15 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-neutral-900/10 dark:text-neutral-700 dark:hover:bg-neutral-900/15 dark:focus-visible:outline-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
              >
                <Archive aria-hidden className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Hold</span>
              </button>
              <button
                type="button"
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-white/10 px-2.5 text-[13px] font-medium text-white/90 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/15 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-neutral-900/10 dark:text-neutral-700 dark:hover:bg-neutral-900/15 dark:focus-visible:outline-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
              >
                <Download aria-hidden className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                type="button"
                onClick={clear}
                aria-label="Clear selection"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-white/10 text-white/90 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/15 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-neutral-900/10 dark:text-neutral-700 dark:hover:bg-neutral-900/15 dark:focus-visible:outline-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-12 shrink-0 items-center bg-neutral-50 px-4 text-[13px] text-neutral-600 sm:px-6 dark:bg-neutral-900 dark:text-neutral-400">
            Select rows to approve, hold, or export a batch.
          </div>
        )}

        <div className="relative min-h-0 flex-1">
          <div
            ref={body.ref}
            onScroll={body.onScroll}
            className="h-full overflow-auto"
          >
            <table className="w-full min-w-[720px] border-collapse text-left">
              <caption className="sr-only">Outgoing vendor payments</caption>
              <thead className="sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th scope="col" className={cx(headBase, "w-12")}>
                    <Checkbox
                      checked={allChecked}
                      indeterminate={someChecked}
                      onChange={toggleAll}
                      label="Select all payments on this page"
                    />
                  </th>
                  <th scope="col" className={headBase}>
                    Vendor
                  </th>
                  <th scope="col" className={cx(headBase, "w-[160px]")}>
                    Owner
                  </th>
                  <th scope="col" className={cx(headBase, "w-[150px]")}>
                    Status
                  </th>
                  <th
                    scope="col"
                    className={cx(headBase, "w-[120px] text-right")}
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className={cx(headBase, "w-[90px] text-right")}
                  >
                    Due
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                {pageRows.map((p) => {
                  const isSel = selected.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      aria-selected={isSel}
                      className={cx(
                        "h-11 transition-colors duration-150",
                        isSel
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
                      )}
                    >
                      <td className={cx(cellBase, "w-12")}>
                        <Checkbox
                          checked={isSel}
                          onChange={() => toggle(p.id)}
                          label={`Select ${p.vendor}`}
                        />
                      </td>
                      <td className={cx(cellBase, "max-w-[260px]")}>
                        <span className="block truncate font-medium text-neutral-900 dark:text-neutral-100">
                          {p.vendor}
                        </span>
                        <span className="block font-mono text-xs text-neutral-500">
                          {p.id}
                        </span>
                      </td>
                      <td
                        className={cx(
                          cellBase,
                          "truncate text-neutral-600 dark:text-neutral-400",
                        )}
                      >
                        {p.owner}
                      </td>
                      <td className={cellBase}>
                        <StatusCell status={statusOf(p)} />
                      </td>
                      <td
                        className={cx(
                          cellBase,
                          "text-right tabular-nums text-neutral-900 dark:text-neutral-100",
                        )}
                      >
                        {currency(p.amount)}
                      </td>
                      <td
                        className={cx(
                          cellBase,
                          "whitespace-nowrap text-right tabular-nums text-neutral-600 dark:text-neutral-400",
                        )}
                      >
                        {p.due}
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
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              body.edges.end ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <footer className="flex h-12 shrink-0 items-center gap-3 bg-neutral-50 px-4 sm:px-6 dark:bg-neutral-900">
          <label className="hidden items-center gap-2 text-xs text-neutral-600 sm:flex dark:text-neutral-400">
            Rows per page
            <span className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 cursor-pointer appearance-none rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pl-2.5 pr-8 text-[13px] text-neutral-900 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                {pageSizes.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
              />
            </span>
          </label>
          <span className="text-xs tabular-nums text-neutral-600 dark:text-neutral-400">
            {start + 1}&ndash;{start + pageRows.length} of {payments.length}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => goTo(safePage - 1)}
              aria-label="Previous page"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-700 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => goTo(n)}
                aria-current={n === safePage ? "page" : undefined}
                className={cx(
                  "hidden h-8 min-w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] px-2 text-xs tabular-nums transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] sm:inline-flex dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                  n === safePage
                    ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                )}
              >
                {n}
              </button>
            ))}
            <span className="text-xs tabular-nums text-neutral-600 sm:hidden dark:text-neutral-400">
              {safePage} / {pageCount}
            </span>
            <button
              type="button"
              disabled={safePage === pageCount}
              onClick={() => goTo(safePage + 1)}
              aria-label="Next page"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-700 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

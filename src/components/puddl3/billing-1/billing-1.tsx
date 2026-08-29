"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";

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

type Status = "Open" | "Past due" | "Paid";

const INVOICES = [
  {
    id: "INV-20418",
    customer: "Halcyon Pay",
    account: "ACC-3092",
    detail: "May usage · seats",
    plan: "Scale",
    amount: 890,
    method: "Visa ending 4242",
    due: "May 28",
    relative: "18d overdue",
    status: "Past due" as Status,
  },
  {
    id: "INV-20402",
    customer: "Lumendesk",
    account: "ACC-3088",
    detail: "May usage overage",
    plan: "Growth",
    amount: 640,
    method: "Mastercard ending 8829",
    due: "Jun 10",
    relative: "6d overdue",
    status: "Past due" as Status,
  },
  {
    id: "INV-20425",
    customer: "Meridian Labs",
    account: "ACC-3090",
    detail: "June seats",
    plan: "Growth",
    amount: 2480,
    method: "Mastercard ending 4417",
    due: "Jun 19",
    relative: "Due in 3d",
    status: "Open" as Status,
  },
  {
    id: "INV-20429",
    customer: "Orbital Systems",
    account: "ACC-3101",
    detail: "June seats",
    plan: "Scale",
    amount: 4800,
    method: "Visa ending 1190",
    due: "Jun 22",
    relative: "Due in 6d",
    status: "Open" as Status,
  },
  {
    id: "INV-20419",
    customer: "Northwind Retail",
    account: "ACC-3072",
    detail: "June seats",
    plan: "Growth",
    amount: 2980,
    method: "ACH transfer",
    due: "Jun 25",
    relative: "Due in 9d",
    status: "Open" as Status,
  },
  {
    id: "INV-20423",
    customer: "Cedar Labs",
    account: "ACC-3085",
    detail: "June usage",
    plan: "Growth",
    amount: 1950,
    method: "Visa ending 7732",
    due: "Jun 28",
    relative: "Due in 12d",
    status: "Open" as Status,
  },
  {
    id: "INV-20431",
    customer: "Atlas Freight",
    account: "ACC-3110",
    detail: "June seats",
    plan: "Starter",
    amount: 430,
    method: "Visa ending 6604",
    due: "Jun 30",
    relative: "Due in 14d",
    status: "Open" as Status,
  },
  {
    id: "INV-20396",
    customer: "Wexler Group",
    account: "ACC-3061",
    detail: "May seats",
    plan: "Scale",
    amount: 5240,
    method: "ACH transfer",
    due: "Jun 2",
    relative: "Paid Jun 1",
    status: "Paid" as Status,
  },
];

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

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

export default function Billing1() {
  const [query, setQuery] = useState("");
  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INVOICES;
    return INVOICES.filter(
      (i) =>
        i.customer.toLowerCase().includes(q) || i.id.toLowerCase().includes(q),
    );
  }, [query]);

  const outstanding = INVOICES.filter((i) => i.status !== "Paid").reduce(
    (sum, i) => sum + i.amount,
    0,
  );
  const overdue = INVOICES.filter((i) => i.status === "Past due");
  const overdueTotal = overdue.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className="mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[17px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Billing
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              June statement · {INVOICES.length - 1} invoices outstanding
            </p>
          </div>
          <button
            type="button"
            className={cx(
              "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
              transition,
              focus,
            )}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Export
          </button>
        </div>

        <div className={cx(frame, "mt-3 space-y-1")}>
          <div className={cx(panel, "grid gap-5 p-5 lg:grid-cols-[1fr_auto]")}>
            <div className="min-w-0">
              <p className="text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
                Outstanding balance
              </p>
              <p className="mt-1 text-[34px] leading-none font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                {usd(outstanding)}
              </p>
              <p className="mt-2.5 text-[13px] text-neutral-500">
                16 invoices this cycle. Oldest past due 18 days.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-10 gap-y-3 lg:border-l lg:border-neutral-200/70 lg:pl-8 dark:lg:border-neutral-800">
              {[
                { label: "Current", value: usd(outstanding - overdueTotal) },
                { label: "Overdue", value: usd(overdueTotal) },
                { label: "Collected", value: usd(48480) },
                { label: "Next payout", value: "Jun 30" },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
                    {s.label}
                  </dt>
                  <dd className="mt-0.5 text-[15px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div
            className={cx(
              panel,
              "flex flex-col gap-3 p-3 pl-4 sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            <p className="text-[13px] text-neutral-500">
              <span className="text-red-600 dark:text-red-400">
                {usd(overdueTotal)} overdue
              </span>{" "}
              across {overdue.length} invoices. Auto-collection is on.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                View statement
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                  transition,
                  focus,
                )}
              >
                Start recovery
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className={cx(frame, "mt-1 flex min-h-0 flex-1 flex-col")}>
          <div
            className={cx(
              panel,
              "flex flex-col gap-3 p-3 pl-4 sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            <div className="min-w-0">
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                Invoice ledger
              </h3>
              <p className="mt-0.5 text-[12px] text-neutral-500">
                {rows.length} shown · {overdue.length} past due
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
                <label htmlFor="billing-1-search" className="sr-only">
                  Search invoices
                </label>
                <input
                  id="billing-1-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customers"
                  className={cx(
                    "h-8 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pr-7 pl-8 text-[13px] text-neutral-900 placeholder:text-neutral-400 sm:w-[200px] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
                    transition,
                    focus,
                  )}
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                    className={cx(
                      "absolute top-1/2 right-1.5 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--rb-r-xs,4px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                      transition,
                      focus,
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                New invoice
              </button>
            </div>
          </div>

          <div
            className={cx(
              panel,
              "relative mt-1 flex min-h-0 flex-1 flex-col overflow-hidden",
            )}
          >
            <div
              ref={ref}
              onScroll={onScroll}
              className="min-h-0 flex-1 overflow-x-auto overflow-y-auto"
            >
              <table className="w-full min-w-[720px] border-collapse text-left">
                <caption className="sr-only">Outstanding invoices</caption>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-neutral-50 dark:bg-neutral-900/60">
                    {[
                      "Customer",
                      "Invoice",
                      "Plan",
                      "Amount",
                      "Due",
                      "Status",
                      "",
                    ].map((h, i) => (
                      <th
                        key={h || i}
                        scope="col"
                        className={cx(
                          "h-9 px-3 text-xs font-medium text-neutral-500 first:pl-4 last:pr-4",
                          h === "Amount" && "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="group h-14 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <td className="px-3 pl-4">
                        <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                          {row.customer}
                        </p>
                        <p className="mt-0.5 text-[12px] text-neutral-500">
                          {row.account}
                        </p>
                      </td>
                      <td className="px-3">
                        <p className="text-[13px] text-neutral-900 tabular-nums dark:text-neutral-100">
                          {row.id}
                        </p>
                        <p className="mt-0.5 text-[12px] text-neutral-500">
                          {row.detail}
                        </p>
                      </td>
                      <td className="px-3 text-[13px] text-neutral-600 dark:text-neutral-300">
                        {row.plan}
                      </td>
                      <td className="px-3 text-right">
                        <p className="text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                          {usd(row.amount)}
                        </p>
                        <p className="mt-0.5 text-[12px] text-neutral-500">
                          {row.method}
                        </p>
                      </td>
                      <td className="px-3">
                        <p className="text-[13px] text-neutral-900 tabular-nums dark:text-neutral-100">
                          {row.due}
                        </p>
                        <p
                          className={cx(
                            "mt-0.5 text-[12px]",
                            row.status === "Past due"
                              ? "text-red-600 dark:text-red-400"
                              : "text-neutral-500",
                          )}
                        >
                          {row.relative}
                        </p>
                      </td>
                      <td className="px-3">
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                          <span
                            className={cx(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              row.status === "Past due"
                                ? "bg-red-500"
                                : "bg-neutral-300 dark:bg-neutral-600",
                            )}
                          />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 pr-4 text-right">
                        <button
                          type="button"
                          aria-label={`Actions for ${row.id}`}
                          className={cx(
                            "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-500 opacity-0 group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-900 focus-within:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                            transition,
                            focus,
                          )}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <p className="px-4 py-10 text-center text-[13px] text-neutral-500">
                  No invoices match that search.
                </p>
              )}
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                edges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

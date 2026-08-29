"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ChevronRight,
  Download,
  MoreHorizontal,
  RefreshCw,
  SlidersHorizontal,
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

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

type RowStatus = "Failed" | "Retrying" | "Exhausted";

const ROWS = [
  {
    id: "SUB-4712",
    customer: "Halcyon Pay",
    product: "Payments Cloud",
    status: "Failed" as RowStatus,
    plan: "Enterprise",
    basis: "Platform fee",
    owner: "Priya Nandakumar",
    amount: 6200,
    method: "PM-7741",
    next: "Jun 18",
    attempt: "Attempt 3 of 4",
    urgent: false,
    invoice: "INV-20418",
    card: "Visa ending 4242",
    attempts: [
      {
        n: 1,
        reason: "Insufficient funds",
        code: "insufficient_funds",
        note: "Retried at the customer's usual top-up hour.",
        date: "May 29",
      },
      {
        n: 2,
        reason: "Issuer declined",
        code: "do_not_honor",
        note: "Issuer blocked a repeat attempt inside 72 hours.",
        date: "Jun 3",
      },
      {
        n: 3,
        reason: "Card declined",
        code: "generic_decline",
        note: "Hosted card update requested by email.",
        date: "Jun 10",
      },
    ],
  },
  {
    id: "SUB-4794",
    customer: "Lumendesk",
    product: "Database Cloud",
    status: "Exhausted" as RowStatus,
    plan: "Scale",
    basis: "Usage based",
    owner: "Marcus Bell",
    amount: 4800,
    method: "PM-7743",
    next: "Retries exhausted",
    attempt: "Attempt 4 of 4",
    urgent: true,
    invoice: "INV-20401",
    card: "Mastercard ending 8829",
    attempts: [],
  },
  {
    id: "SUB-4806",
    customer: "Meridian Labs",
    product: "Enterprise Grid",
    status: "Retrying" as RowStatus,
    plan: "Scale",
    basis: "Seat based",
    owner: "Sofia Alvarez",
    amount: 5400,
    method: "PM-7742",
    next: "Today",
    attempt: "Attempt 3 of 4",
    urgent: false,
    invoice: "INV-20409",
    card: "Visa ending 1190",
    attempts: [],
  },
  {
    id: "SUB-4820",
    customer: "Cedar Labs",
    product: "Insights",
    status: "Retrying" as RowStatus,
    plan: "Growth",
    basis: "Usage based",
    owner: "Wei Chen",
    amount: 3150,
    method: "PM-7748",
    next: "Jun 19",
    attempt: "Attempt 2 of 4",
    urgent: false,
    invoice: "INV-20422",
    card: "ACH transfer",
    attempts: [],
  },
  {
    id: "SUB-4833",
    customer: "Orbital Systems",
    product: "Edge Delivery",
    status: "Failed" as RowStatus,
    plan: "Growth",
    basis: "Seat based",
    owner: "Tomás Guerrero",
    amount: 2400,
    method: "PM-7751",
    next: "Jun 20",
    attempt: "Attempt 1 of 4",
    urgent: false,
    invoice: "INV-20427",
    card: "Visa ending 6604",
    attempts: [],
  },
  {
    id: "SUB-4841",
    customer: "Atlas Freight",
    product: "Logistics API",
    status: "Retrying" as RowStatus,
    plan: "Starter",
    basis: "Usage based",
    owner: "Amelia Whitfield",
    amount: 2000,
    method: "PM-7756",
    next: "Jun 21",
    attempt: "Attempt 2 of 4",
    urgent: false,
    invoice: "INV-20430",
    card: "Mastercard ending 4417",
    attempts: [],
  },
];

const STATS = [
  {
    label: "Amount at risk",
    hint: "Open failed charges",
    value: usd(23950),
    delta: "−8%",
    deltaTone: "down" as const,
    fill: 72,
    bar: "bg-amber-500",
    cells: [
      { n: "2", l: "Failed" },
      { n: "3", l: "Retrying" },
      { n: "1", l: "Exhausted" },
    ],
  },
  {
    label: "Recovered",
    hint: "Charges settled this month",
    value: usd(16500),
    delta: "+12%",
    deltaTone: "up" as const,
    fill: 58,
    bar: "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
    cells: [
      { n: "9", l: "Invoices" },
      { n: usd(8900), l: "Largest" },
      { n: "2", l: "Playbooks" },
    ],
  },
  {
    label: "Recovery rate",
    hint: "Smart retries across accounts",
    value: "25%",
    delta: "+3%",
    deltaTone: "up" as const,
    fill: 25,
    bar: "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
    cells: [
      { n: "19", l: "Attempts" },
      { n: "32", l: "Capacity" },
      { n: "4", l: "Max tries" },
    ],
  },
];

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

export default function Billing4() {
  const [expanded, setExpanded] = useState<string | null>("SUB-4712");
  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  const atRisk = useMemo(() => ROWS.reduce((s, r) => s + r.amount, 0), []);

  return (
    <div className="flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className="mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[17px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Recovery queue
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              {ROWS.length} subscriptions with live retry paths ·{" "}
              <span className="text-red-600 dark:text-red-400">
                {usd(atRisk)} at risk
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className={cx(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              Rules
            </button>
            <button
              type="button"
              className={cx(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Export
            </button>
            <button
              type="button"
              className={cx(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Retry due
            </button>
          </div>
        </div>

        <div className={cx(frame, "mt-3 grid gap-1 sm:grid-cols-3")}>
          {STATS.map((s) => (
            <div key={s.label} className={cx(panel, "p-4")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {s.label}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                    {s.hint}
                  </p>
                </div>
                <span
                  className={cx(
                    "shrink-0 text-[12px] tabular-nums",
                    s.deltaTone === "up"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-neutral-500",
                  )}
                >
                  {s.delta}
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                {s.value}
              </p>
              <div
                className="mt-3 h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                role="presentation"
              >
                <div
                  className={cx("h-full rounded-full", s.bar)}
                  style={{ width: `${s.fill}%` }}
                />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2">
                {s.cells.map((c) => (
                  <div key={c.l} className="min-w-0">
                    <dt className="truncate text-[11px] text-neutral-500">
                      {c.l}
                    </dt>
                    <dd className="mt-0.5 truncate text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                      {c.n}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className={cx(frame, "mt-1 flex min-h-0 flex-1 flex-col")}>
          <div
            className={cx(
              panel,
              "flex items-center justify-between gap-3 px-4 py-3",
            )}
          >
            <div className="min-w-0">
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                Past due subscriptions
              </h3>
              <p className="mt-0.5 text-[12px] text-neutral-500">
                Retry schedule, payment method, and account owner.
              </p>
            </div>
            <button
              type="button"
              className={cx(
                "hidden h-8 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 sm:inline-flex dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              Manage playbooks
            </button>
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
              <table className="w-full min-w-[820px] border-collapse text-left">
                <caption className="sr-only">Past due subscriptions</caption>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-neutral-50 dark:bg-neutral-900/60">
                    {[
                      "Customer",
                      "Status",
                      "Billing",
                      "Owner",
                      "Amount",
                      "Next retry",
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
                  {ROWS.map((row) => {
                    const open = expanded === row.id;
                    return (
                      <Fragment key={row.id}>
                        <tr className="group h-14 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="px-3 pl-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-expanded={open}
                                aria-label={`Retry attempts for ${row.customer}`}
                                onClick={() =>
                                  setExpanded(open ? null : row.id)
                                }
                                className={cx(
                                  "inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                                  transition,
                                  focus,
                                )}
                              >
                                <ChevronRight
                                  className={cx(
                                    "h-3.5 w-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none",
                                    open && "rotate-90",
                                  )}
                                />
                              </button>
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                                  {row.customer}
                                </p>
                                <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                                  {row.id} · {row.product}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3">
                            <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                              <span
                                aria-hidden
                                className={cx(
                                  "h-1.5 w-1.5 shrink-0 rounded-full",
                                  row.status === "Failed" && "bg-red-500",
                                  row.status === "Exhausted" && "bg-red-500",
                                  row.status === "Retrying" &&
                                    "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500",
                                )}
                              />
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3">
                            <p className="text-[13px] text-neutral-900 dark:text-neutral-100">
                              {row.plan}
                            </p>
                            <p className="mt-0.5 text-[12px] text-neutral-500">
                              {row.basis}
                            </p>
                          </td>
                          <td className="px-3 text-[13px] text-neutral-600 dark:text-neutral-300">
                            {row.owner}
                          </td>
                          <td className="px-3 text-right">
                            <p className="text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                              {usd(row.amount)}
                            </p>
                            <p className="mt-0.5 text-[12px] text-neutral-500 tabular-nums">
                              {row.method}
                            </p>
                          </td>
                          <td className="px-3">
                            <p
                              className={cx(
                                "text-[13px] tabular-nums",
                                row.urgent
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-neutral-900 dark:text-neutral-100",
                              )}
                            >
                              {row.next}
                            </p>
                            <p className="mt-0.5 text-[12px] text-neutral-500 tabular-nums">
                              {row.attempt}
                            </p>
                          </td>
                          <td className="px-3 pr-4 text-right">
                            <button
                              type="button"
                              aria-label={`Actions for ${row.customer}`}
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
                        {open && row.attempts.length > 0 && (
                          <tr>
                            <td colSpan={7} className="p-3">
                              <div className="rounded-[var(--rb-r-xl,12px)] bg-neutral-50 p-1 dark:bg-neutral-800/40">
                                <div className="flex items-center justify-between gap-3 px-2.5 py-2">
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                                      Retry attempts
                                    </p>
                                    <p className="mt-0.5 text-[12px] text-neutral-500">
                                      Card update requested for {row.card}.
                                    </p>
                                  </div>
                                  <p className="shrink-0 text-[12px] text-neutral-500 tabular-nums">
                                    {row.invoice}
                                  </p>
                                </div>
                                <ul className="space-y-1">
                                  {row.attempts.map((a) => (
                                    <li
                                      key={a.n}
                                      className="flex flex-col gap-2 rounded-[var(--rb-r-md,8px)] bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900"
                                    >
                                      <div className="flex min-w-0 items-start gap-2.5">
                                        <AlertTriangle
                                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
                                          aria-hidden
                                        />
                                        <div className="min-w-0">
                                          <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                                            Attempt {a.n} ·{" "}
                                            <span className="font-normal text-neutral-600 dark:text-neutral-300">
                                              {a.reason}
                                            </span>
                                          </p>
                                          <p className="mt-0.5 text-[12px] text-neutral-500">
                                            {a.note}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex shrink-0 items-center gap-4 pl-6 sm:pl-0">
                                        <span className="font-mono text-[12px] text-neutral-500">
                                          {a.code}
                                        </span>
                                        <span className="text-[12px] text-neutral-500 tabular-nums">
                                          {a.date}
                                        </span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
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

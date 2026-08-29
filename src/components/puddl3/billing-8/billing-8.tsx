"use client";

import { useMemo } from "react";
import { Download, Printer, Send } from "lucide-react";

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

const LINES = [
  {
    id: "l1",
    name: "Growth plan",
    detail: "20 seats · Jun 1 to Jun 30",
    qty: 20,
    rate: 89,
  },
  {
    id: "l2",
    name: "Additional seats",
    detail: "4 seats added Jun 12, prorated 18 days",
    qty: 4,
    rate: 53.4,
  },
  {
    id: "l3",
    name: "API overage",
    detail: "48,000 calls beyond the included 500k",
    qty: 48,
    rate: 1.2,
  },
  {
    id: "l4",
    name: "Usage insights add-on",
    detail: "Monthly add-on · Jun 1 to Jun 30",
    qty: 1,
    rate: 19,
  },
];

const TIMELINE = [
  {
    label: "Invoice issued",
    detail: "Emailed to ap@cedarlabs.com",
    at: "Jun 16, 09:04",
    done: true,
  },
  {
    label: "Viewed by customer",
    detail: "Opened twice from New York",
    at: "Jun 16, 14:22",
    done: true,
  },
  {
    label: "Reminder sent",
    detail: "Automatic reminder, 3 days before due",
    at: "Jun 27, 08:00",
    done: true,
  },
  {
    label: "Payment due",
    detail: "ACH transfer from Northwind Trust 1190",
    at: "Jun 30",
    done: false,
  },
];

const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Billing8() {
  const totals = useMemo(() => {
    const subtotal = LINES.reduce((s, l) => s + l.qty * l.rate, 0);
    const discount = subtotal * 0.05;
    const tax = (subtotal - discount) * 0.0888;
    return { subtotal, discount, tax, total: subtotal - discount + tax };
  }, []);

  return (
    <div className="flex h-full min-h-[800px] w-full flex-col overflow-y-auto bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-medium tracking-[-0.01em] text-neutral-900 tabular-nums dark:text-neutral-100">
                INV-20437
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"
                />
                Awaiting payment
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Cedar Labs · issued Jun 16 · due Jun 30 · Net 14
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Print invoice"
              className={cx(
                "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              <Printer className="h-3.5 w-3.5" />
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
              PDF
            </button>
            <button
              type="button"
              className={cx(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              Send reminder
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className={cx(frame, "min-w-0 space-y-1")}>
            <div className={cx(panel, "grid gap-5 p-5 sm:grid-cols-2")}>
              <div className="min-w-0">
                <p className="text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
                  Billed to
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-900 dark:text-neutral-100">
                  Cedar Labs Inc.
                  <br />
                  14 Warren Street, Suite 620
                  <br />
                  New York, NY 10007
                  <br />
                  <span className="text-neutral-500 tabular-nums">
                    US-88-2947135
                  </span>
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 self-start">
                {[
                  { k: "Issued", v: "Jun 16, 2026" },
                  { k: "Due", v: "Jun 30, 2026" },
                  { k: "Terms", v: "Net 14" },
                  { k: "PO", v: "PO-4471" },
                ].map((r) => (
                  <div key={r.k}>
                    <dt className="text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
                      {r.k}
                    </dt>
                    <dd className="mt-0.5 text-[13px] text-neutral-900 tabular-nums dark:text-neutral-100">
                      {r.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className={cx(panel, "overflow-hidden")}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <caption className="sr-only">Invoice line items</caption>
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-900/60">
                      {["Description", "Qty", "Rate", "Amount"].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className={cx(
                            "h-9 px-3 text-xs font-medium text-neutral-500 first:pl-5 last:pr-5",
                            h !== "Description" && "text-right",
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                    {LINES.map((l) => (
                      <tr key={l.id} className="h-14">
                        <td className="px-3 pl-5">
                          <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                            {l.name}
                          </p>
                          <p className="mt-0.5 text-[12px] text-neutral-500">
                            {l.detail}
                          </p>
                        </td>
                        <td className="px-3 text-right text-[13px] text-neutral-600 tabular-nums dark:text-neutral-300">
                          {l.qty}
                        </td>
                        <td className="px-3 text-right text-[13px] text-neutral-600 tabular-nums dark:text-neutral-300">
                          {usd(l.rate)}
                        </td>
                        <td className="px-3 pr-5 text-right text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                          {usd(l.qty * l.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={cx(panel, "flex justify-end p-5")}>
              <dl className="w-full max-w-[280px] space-y-2.5">
                {[
                  { k: "Subtotal", v: usd(totals.subtotal) },
                  { k: "Volume discount (5%)", v: `−${usd(totals.discount)}` },
                  { k: "Sales tax (8.88%)", v: usd(totals.tax) },
                ].map((r) => (
                  <div key={r.k} className="flex justify-between gap-3">
                    <dt className="text-[13px] text-neutral-500">{r.k}</dt>
                    <dd className="text-[13px] text-neutral-900 tabular-nums dark:text-neutral-100">
                      {r.v}
                    </dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-3 pt-1">
                  <dt className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    Amount due
                  </dt>
                  <dd className="text-[22px] leading-none font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                    {usd(totals.total)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <aside className={cx(frame, "min-w-0 space-y-1 self-start")}>
            <div className={cx(panel, "p-4")}>
              <p className="text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
                Activity
              </p>
              <ol className="mt-3 space-y-3.5">
                {TIMELINE.map((t, i) => (
                  <li key={t.label} className="flex gap-3">
                    <span className="relative flex flex-col items-center">
                      <span
                        aria-hidden
                        className={cx(
                          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                          t.done
                            ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                            : "bg-neutral-300 dark:bg-neutral-600",
                        )}
                      />
                      {i < TIMELINE.length - 1 && (
                        <span
                          aria-hidden
                          className="mt-1 w-px flex-1 bg-neutral-200 dark:bg-neutral-800"
                        />
                      )}
                    </span>
                    <div className="min-w-0 pb-0.5">
                      <p
                        className={cx(
                          "text-[13px] font-medium",
                          t.done
                            ? "text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-500",
                        )}
                      >
                        {t.label}
                      </p>
                      <p className="mt-0.5 text-[12px] text-neutral-500">
                        {t.detail}
                      </p>
                      <p className="mt-0.5 text-[12px] text-neutral-400 tabular-nums">
                        {t.at}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className={cx(panel, "p-4")}>
              <p className="text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
                Collection
              </p>
              <dl className="mt-2.5 space-y-2">
                {[
                  { k: "Method", v: "ACH transfer" },
                  { k: "Account", v: "Northwind 1190" },
                  { k: "Attempt", v: "Jun 30" },
                ].map((r) => (
                  <div key={r.k} className="flex justify-between gap-3">
                    <dt className="text-[13px] text-neutral-500">{r.k}</dt>
                    <dd className="text-[13px] text-neutral-900 tabular-nums dark:text-neutral-100">
                      {r.v}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                className={cx(
                  "mt-3 inline-flex h-8 w-full cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                Charge now
              </button>
            </div>

            <div className={cx(panel, "p-4")}>
              <p className="text-[13px] leading-relaxed text-neutral-500">
                Questions about this invoice? Reply to the billing email and it
                opens a ticket with the account owner attached.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  Calendar,
  ChevronDown,
  Hash,
  Info,
  X,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      start: scrollTop > 1,
      end: scrollTop + clientHeight < scrollHeight - 1,
    });
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const RO = el.ownerDocument.defaultView?.ResizeObserver;
    const ro = RO ? new RO(update) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [update]);
  return { ref, edges, onScroll: update };
}

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const labelClass =
  "flex items-center gap-1.5 text-[13px] font-medium text-neutral-900 dark:text-neutral-100";

const fieldShell =
  "flex h-9 w-full items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 transition-colors duration-150 hover:border-neutral-300 focus-within:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:focus-within:border-white";

const inputClass =
  "h-full w-full min-w-0 bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500";

const selectClass =
  "h-9 w-full cursor-pointer appearance-none rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 pr-9 text-[13px] text-neutral-900 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white";

const badgeClass =
  "inline-flex h-5 shrink-0 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";

const TOTAL = 4;

const CURRENCIES = ["USD", "EUR", "GBP"];
const TERMS = ["Net 14", "Net 30", "Due on receipt"];
const COLLECTION = ["ACH transfer", "Card", "Wire"];

export default function Wizard2() {
  const body = useScrollFade<HTMLDivElement>();
  const [step, setStep] = useState(1);

  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800">
        <button
          type="button"
          aria-label="Close"
          className={cx(
            "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
            transition,
            focus,
          )}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>

        <span
          aria-hidden="true"
          className="h-5 w-px shrink-0 bg-neutral-200 dark:bg-neutral-800"
        />

        <h1 className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
          Send invoice
        </h1>

        <div className="hidden min-w-0 flex-1 justify-center sm:flex">
          <div
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={TOTAL}
            aria-label="Invoice progress"
            className="h-1 w-full max-w-[240px] overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
          >
            <div
              style={{ width: `${(step / TOTAL) * 100}%` }}
              className="h-full rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] transition-[width] duration-300 ease-out motion-reduce:transition-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
            />
          </div>
        </div>

        <p className="ml-auto shrink-0 text-xs tabular-nums text-neutral-500 sm:ml-0">
          {step} / {TOTAL}
        </p>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={body.ref}
          onScroll={body.onScroll}
          className="h-full overflow-y-auto px-4 py-6 sm:px-6"
        >
          <section className="mx-auto w-full max-w-[820px] overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
              <div className="min-w-0">
                <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                  Customer details
                </h2>
                <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                  Customer, invoice references, and billing terms.
                </p>
              </div>
              <span className={badgeClass}>USD</span>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  Customer
                </h3>
                <span className={badgeClass}>Required</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Billable account and invoice reference.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="wz2-customer" className={labelClass}>
                    Customer
                    <Info
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-neutral-400"
                    />
                  </label>
                  <div className={cx(fieldShell, "mt-1.5")}>
                    <input
                      id="wz2-customer"
                      defaultValue="Orchid Ledger Group"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      aria-label="Clear customer"
                      className={cx(
                        "-mr-1 inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                        transition,
                        focus,
                      )}
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="wz2-tax" className={labelClass}>
                    Tax ID
                    <Info
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-neutral-400"
                    />
                  </label>
                  <div className={cx(fieldShell, "mt-1.5 gap-2")}>
                    <Building2
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                    />
                    <input
                      id="wz2-tax"
                      defaultValue="US-88-2947135"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="wz2-number" className={labelClass}>
                    Invoice number
                  </label>
                  <div className={cx(fieldShell, "mt-1.5 gap-2")}>
                    <Hash
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                    />
                    <input
                      id="wz2-number"
                      defaultValue="INV-2048"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="wz2-po" className={labelClass}>
                    PO reference
                  </label>
                  <div className={cx(fieldShell, "mt-1.5")}>
                    <input
                      id="wz2-po"
                      defaultValue="PO-7418"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="my-6 h-px bg-neutral-200 dark:bg-neutral-800"
              />

              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  Terms
                </h3>
                <span className={badgeClass}>Net 14</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Dates, currency, and collection method.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="wz2-issue" className={labelClass}>
                    Issue date
                  </label>
                  <div className={cx(fieldShell, "mt-1.5")}>
                    <input
                      id="wz2-issue"
                      defaultValue="Apr 24, 2026"
                      className={inputClass}
                    />
                    <Calendar
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="wz2-due" className={labelClass}>
                    Due date
                  </label>
                  <div className={cx(fieldShell, "mt-1.5")}>
                    <input
                      id="wz2-due"
                      defaultValue="May 08, 2026"
                      className={inputClass}
                    />
                    <Calendar
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="wz2-currency" className={labelClass}>
                    Currency
                  </label>
                  <div className="relative mt-1.5">
                    <select id="wz2-currency" className={selectClass}>
                      {CURRENCIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="wz2-terms" className={labelClass}>
                    Payment terms
                  </label>
                  <div className="relative mt-1.5">
                    <select id="wz2-terms" className={selectClass}>
                      {TERMS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="wz2-collection" className={labelClass}>
                    Collection
                  </label>
                  <div className="relative mt-1.5">
                    <select id="wz2-collection" className={selectClass}>
                      {COLLECTION.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="wz2-address" className={labelClass}>
                    Billing address
                  </label>
                  <div className={cx(fieldShell, "mt-1.5")}>
                    <input
                      id="wz2-address"
                      defaultValue="14 Warren Street, Suite 620, New York, NY"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            body.edges.start ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            body.edges.end ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <button
          type="button"
          className={cx(
            "inline-flex h-9 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-900 hover:bg-neutral-50 active:scale-[0.97] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900",
            transition,
            focus,
          )}
        >
          Save draft
        </button>

        <button
          type="button"
          onClick={() => setStep((s) => (s === TOTAL ? 1 : s + 1))}
          className={cx(
            "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
            transition,
            focus,
          )}
        >
          Next step
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

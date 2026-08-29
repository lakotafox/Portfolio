"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const badgeClass =
  "inline-flex h-5 shrink-0 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";

const frame =
  "flex flex-col gap-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900";

const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950";

const caption =
  "text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-400";

const STEPS = ["Plan", "Seats", "Payment", "Review"];

const PLANS = [
  {
    id: "team",
    name: "Team",
    blurb: "Workspace controls for growing product teams.",
    price: "$49",
  },
  {
    id: "business",
    name: "Business",
    blurb: "SAML, audit exports, and priority support.",
    price: "$72",
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "Procurement review and account governance.",
    price: "$96",
  },
];

const BREAKDOWN = [
  { label: "Seats", sub: "42 seats, annual", value: "$36,288" },
  { label: "Term credit", sub: "15% on annual", value: "−$5,443" },
  { label: "Support", sub: "Priority response", value: "$390" },
];

const ROUTING = [
  { label: "Renewal", value: "May 31, 2026" },
  { label: "Purchase order", value: "PO-2026-184" },
];

export default function Wizard3() {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState("business");

  return (
    <div className="relative h-full min-h-[720px] w-full overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <section className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <header className="shrink-0 border-b border-neutral-200 px-6 pb-4 pt-5 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Billing upgrade
              </h2>
              <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                Change plan, seats, and payment terms before renewal.
              </p>
            </div>
            <span className={cx(badgeClass, "gap-1.5")}>
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-amber-500"
              />
              Draft
            </span>
          </div>

          <ol className="mt-4 flex items-center gap-3">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;

              return (
                <li
                  key={label}
                  className={cx(
                    "flex min-w-0 items-center gap-3",
                    i < STEPS.length - 1 && "flex-1",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={active ? "step" : undefined}
                    className={cx(
                      "flex min-w-0 cursor-pointer items-center gap-2 rounded-[var(--rb-r-sm,6px)]",
                      focus,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums",
                        done &&
                          "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                        active &&
                          "border border-dashed border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100",
                        !done &&
                          !active &&
                          "border border-neutral-200 bg-white text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-600",
                        transition,
                      )}
                    >
                      {done ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={cx(
                        "hidden truncate text-[13px] sm:block",
                        done || active
                          ? "font-medium text-neutral-900 dark:text-neutral-100"
                          : "text-neutral-500",
                      )}
                    >
                      {label}
                    </span>
                  </button>

                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={cx(
                        "h-px min-w-4 flex-1",
                        done
                          ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                          : "bg-neutral-200 dark:bg-neutral-800",
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 px-6 py-5 lg:grid-cols-5">
          <div
            role="radiogroup"
            aria-label="Plan"
            className="min-w-0 lg:col-span-3"
          >
            <h3 className={caption}>Plan</h3>

            <div className="mt-3 space-y-2">
              {PLANS.map((option) => {
                const selected = option.id === plan;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPlan(option.id)}
                    className={cx(
                      "flex w-full cursor-pointer items-center gap-3 rounded-[var(--rb-r-xl,12px)] border p-4 text-left active:scale-[0.99]",
                      selected
                        ? "border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
                        : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900",
                      transition,
                      focus,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-neutral-900 dark:border-white"
                          : "border-neutral-300 dark:border-neutral-600",
                      )}
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                          {option.name}
                        </span>
                        {option.recommended && (
                          <span className={badgeClass}>Recommended</span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500">
                        {option.blurb}
                      </span>
                    </span>

                    <span className="shrink-0 text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                      {option.price}
                      <span className="font-normal text-neutral-500">
                        /seat/mo
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-neutral-500">
              Seat count carries over from the current term. You can adjust it
              on the next step before anything is charged.
            </p>
          </div>

          <aside className="min-w-0 lg:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className={caption}>Invoice preview</h3>
              <span className={badgeClass}>Annual</span>
            </div>

            <div className={cx(frame, "mt-3")}>
              <div className={cx(panel, "px-4 py-3.5")}>
                <p className="truncate text-xs text-neutral-500">Due today</p>
                <p className="mt-1 text-xl font-medium tabular-nums tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
                  $31,235
                </p>
                <p className="mt-1 truncate text-xs text-neutral-500">
                  Business · 42 seats · billed once
                </p>
              </div>

              <dl className={cx(panel, "px-4 py-1")}>
                {BREAKDOWN.map((row, i) => (
                  <div
                    key={row.label}
                    className={cx(
                      "flex items-center justify-between gap-3 py-2.5",
                      i > 0 &&
                        "border-t border-neutral-200/70 dark:border-neutral-800",
                    )}
                  >
                    <div className="min-w-0">
                      <dt className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                        {row.label}
                      </dt>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {row.sub}
                      </p>
                    </div>
                    <dd className="shrink-0 text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <dl className={cx(panel, "space-y-2 px-4 py-3")}>
                {ROUTING.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <dt className="truncate text-[13px] text-neutral-500">
                      {row.label}
                    </dt>
                    <dd className="shrink-0 text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="truncate text-xs text-neutral-500">
            Nothing is charged until the review step.
          </p>

          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className={cx(
              "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
              transition,
              focus,
            )}
          >
            Next
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

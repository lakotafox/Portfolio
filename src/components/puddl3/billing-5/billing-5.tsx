"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

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

const STEPS = [
  { label: "New plan", hint: "Pick a tier" },
  { label: "Timing", hint: "When it applies" },
  { label: "Confirm", hint: "Review the change" },
];

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Core billing for small teams getting started.",
    price: 29,
  },
  {
    id: "growth",
    name: "Growth",
    blurb: "Usage analytics and seat management.",
    price: 89,
    current: true,
  },
  {
    id: "scale",
    name: "Scale",
    blurb: "SSO, audit exports, and priority support.",
    price: 249,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "Procurement review and account governance.",
    price: 399,
  },
];

const SEATS = 20;
const REMAINING = 18;
const CYCLE = 30;

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

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

export default function Billing5() {
  const [selected, setSelected] = useState("scale");
  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  const currentPlan = PLANS.find((p) => p.current)!;
  const nextPlan = PLANS.find((p) => p.id === selected)!;

  const proration = useMemo(() => {
    const ratio = REMAINING / CYCLE;
    const credit = currentPlan.price * SEATS * ratio;
    const charge = nextPlan.price * SEATS * ratio;
    return { credit, charge, due: charge - credit };
  }, [currentPlan.price, nextPlan.price]);

  const direction =
    nextPlan.price > currentPlan.price
      ? "Upgrade"
      : nextPlan.price < currentPlan.price
        ? "Downgrade"
        : "No change";

  return (
    <div className="flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto flex min-h-0 w-full max-w-[980px] flex-1 flex-col",
        )}
      >
        <div
          className={cx(
            panel,
            "flex items-start justify-between gap-3 px-4 py-3",
          )}
        >
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Change plan
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-neutral-500">
              Cedar Labs on {currentPlan.name} · {SEATS} seats
            </p>
          </div>
          <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] border border-neutral-200 px-2 text-[12px] text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-amber-500"
            />
            Draft
          </span>
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
            className="min-h-0 flex-1 overflow-y-auto p-5"
          >
            <ol className="flex items-start gap-2">
              {STEPS.map((step, i) => (
                <li
                  key={step.label}
                  className="flex min-w-0 flex-1 items-start gap-2"
                >
                  <div className="flex min-w-0 flex-col items-start gap-1.5">
                    <span
                      aria-current={i === 0 ? "step" : undefined}
                      className={cx(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums",
                        i === 0
                          ? "border border-dashed border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100"
                          : "border border-neutral-200 bg-white text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-600",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="hidden min-w-0 sm:block">
                      <p
                        className={cx(
                          "truncate text-[13px] font-medium",
                          i === 0
                            ? "text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-500",
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="truncate text-xs text-neutral-400">
                        {step.hint}
                      </p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="mt-3 h-px min-w-4 flex-1 bg-neutral-200 dark:bg-neutral-800"
                    />
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
              <fieldset className="min-w-0">
                <legend className="sr-only">New plan</legend>
                <div className="space-y-1 rounded-[var(--rb-r-xl,12px)] bg-neutral-50 p-1 dark:bg-neutral-800/40">
                  {PLANS.map((plan) => {
                    const active = plan.id === selected;
                    return (
                      <label
                        key={plan.id}
                        className={cx(
                          "flex cursor-pointer items-center gap-3 rounded-[var(--rb-r-md,8px)] px-3 py-2.5",
                          transition,
                          active
                            ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900"
                            : "hover:bg-white/60 dark:hover:bg-neutral-900/50",
                        )}
                      >
                        <input
                          type="radio"
                          name="billing-5-plan"
                          value={plan.id}
                          checked={active}
                          onChange={() => setSelected(plan.id)}
                          className="h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border border-neutral-300 bg-white transition-colors duration-150 checked:border-[5px] checked:border-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                              {plan.name}
                            </span>
                            {plan.current && (
                              <span className="text-[11px] text-neutral-500">
                                Current
                              </span>
                            )}
                            {plan.popular && (
                              <span className="text-[11px] text-neutral-500">
                                Most picked
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-neutral-500">
                            {plan.blurb}
                          </span>
                        </span>
                        <span className="shrink-0 text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                          ${plan.price}
                          <span className="font-normal text-neutral-500">
                            /seat
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <aside className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                    Proration
                  </h3>
                  <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {direction === "Upgrade" && (
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    )}
                    {direction}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  Recalculated as you change the tier.
                </p>

                <div className="mt-3 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 p-4 dark:bg-neutral-800/40">
                  <p className="text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
                    Due today
                  </p>
                  <p className="mt-1 text-[28px] leading-none font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                    {usd(Math.max(proration.due, 0))}
                  </p>
                  <p className="mt-2 text-[12px] text-neutral-500">
                    {nextPlan.name}, {SEATS} seats, prorated {REMAINING} days.
                  </p>
                </div>

                <dl className="mt-4 space-y-2.5">
                  {[
                    {
                      label: "Current plan credit",
                      hint: `${currentPlan.name}, unused ${REMAINING} days`,
                      value: `−${usd(proration.credit)}`,
                    },
                    {
                      label: "New plan charge",
                      hint: `${nextPlan.name}, ${REMAINING} days`,
                      value: usd(proration.charge),
                    },
                    {
                      label: "Next full invoice",
                      hint: "Renews Jul 1",
                      value: usd(nextPlan.price * SEATS),
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-start justify-between gap-3"
                    >
                      <dt className="min-w-0">
                        <span className="block text-[13px] text-neutral-900 dark:text-neutral-100">
                          {row.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-neutral-500">
                          {row.hint}
                        </span>
                      </dt>
                      <dd className="shrink-0 text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <ul className="mt-4 space-y-1.5">
                  {[
                    "Seat count carries over unchanged.",
                    "Effective immediately once confirmed.",
                    "Invoices already issued are unaffected.",
                  ].map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2 text-[12px] text-neutral-500"
                    >
                      <Check
                        className="mt-0.5 h-3 w-3 shrink-0 text-neutral-400"
                        aria-hidden
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
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

        <div
          className={cx(
            panel,
            "mt-1 flex items-center justify-between gap-3 px-4 py-3",
          )}
        >
          <p className="hidden text-[12px] text-neutral-500 sm:block">
            Nothing is charged until you confirm on step 3.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cx(
                "inline-flex h-9 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-3 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cx(
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              Continue
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

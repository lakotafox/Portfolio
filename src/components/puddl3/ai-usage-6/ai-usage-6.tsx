"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Circle } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950";

const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`
      : `${n}`;

type Plan = {
  id: string;
  name: string;
  price: number;
  included: number;
  overage: number;
  perks: string[];
};

const PLANS: Plan[] = [
  {
    id: "scale",
    name: "Scale",
    price: 400,
    included: 250_000_000,
    overage: 1.8,
    perks: [
      "250M tokens included",
      "Tier 2 rate limits",
      "Priority routing on Atlas Pro",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 1400,
    included: 1_000_000_000,
    overage: 1.2,
    perks: [
      "1B tokens included",
      "Tier 3 rate limits",
      "Dedicated capacity and a support channel",
    ],
  },
];

const USED = 128_400_000;
const INCLUDED = 100_000_000;
const OVERAGE_RATE = 2.4;

export default function AiUsage6() {
  const [selected, setSelected] = useState("scale");

  const over = USED - INCLUDED;
  const pct = Math.min(100, (INCLUDED / USED) * 100);

  const overageCost = useMemo(
    () => Math.round((over / 1_000_000) * OVERAGE_RATE),
    [over],
  );

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-3">
          <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            You are over your included tokens
          </h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Requests keep working. Anything past the allowance bills at $
            {OVERAGE_RATE.toFixed(2)} per million.
          </p>
        </div>

        <div className={cx(frame, "space-y-1")}>
          <div className={cx(panel, "p-4")}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13px] text-neutral-500">Tokens used</p>
              <p className="text-[13px] text-neutral-500 tabular-nums">
                <span className="text-xl font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                  {compact(USED)}
                </span>{" "}
                of {compact(INCLUDED)} included
              </p>
            </div>

            <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900">
              <div
                className="h-full bg-neutral-900 dark:bg-neutral-100"
                style={{ width: `${pct}%` }}
              />
              <div
                className="h-full bg-neutral-300 dark:bg-neutral-600"
                style={{ width: `${100 - pct}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                Included
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                Overage {compact(over)} · ${overageCost} so far
              </span>
            </div>
          </div>

          <div className={cx(panel, "p-4")}>
            <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Move to a larger allowance
            </p>

            <div
              role="radiogroup"
              aria-label="Plan"
              className="mt-3 grid gap-2 sm:grid-cols-2"
            >
              {PLANS.map((plan) => {
                const on = plan.id === selected;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setSelected(plan.id)}
                    className={cx(
                      "cursor-pointer rounded-[var(--rb-r-lg,10px)] border p-3 text-left",
                      on
                        ? "border-neutral-900 dark:border-neutral-100"
                        : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
                      transition,
                      focus,
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        {plan.name}
                      </span>
                      {on ? (
                        <Check
                          className="h-3.5 w-3.5 text-neutral-900 dark:text-neutral-100"
                          aria-hidden
                        />
                      ) : (
                        <Circle
                          className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-700"
                          aria-hidden
                        />
                      )}
                    </div>

                    <p className="mt-1 text-[13px] text-neutral-500 tabular-nums">
                      ${plan.price}/mo · ${plan.overage.toFixed(2)} per M over
                    </p>

                    <ul className="mt-2.5 space-y-1">
                      {plan.perks.map((perk) => (
                        <li
                          key={perk}
                          className="flex items-start gap-1.5 text-[12px] text-neutral-500"
                        >
                          <Check
                            className="mt-0.5 h-3 w-3 shrink-0"
                            aria-hidden
                          />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={cx(
              panel,
              "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
            )}
          >
            <p className="truncate text-[13px] text-neutral-500">
              Changes apply immediately and prorate against this cycle.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-3 text-[13px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                Stay on overage
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1 rounded-[var(--rb-r-md,8px)] bg-neutral-900 pr-2.5 pl-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-neutral-100 dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                  "hover:bg-neutral-800 dark:hover:bg-white",
                  transition,
                  focus,
                )}
              >
                Upgrade
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

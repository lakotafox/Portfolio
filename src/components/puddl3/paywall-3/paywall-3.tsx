"use client";

import { useState } from "react";
import { Check } from "lucide-react";

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

type Plan = {
  name: string;
  monthly: number;
  blurb: string;
  features: string[];
  current?: boolean;
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    monthly: 0,
    blurb: "For a single project and a short history window.",
    features: ["1 workspace", "30 days of history", "Community support"],
    current: true,
  },
  {
    name: "Pro",
    monthly: 24,
    blurb: "For teams that need exports, roles and full history.",
    features: [
      "Unlimited workspaces",
      "Full history, no sampling",
      "Scheduled exports",
      "Role-based access",
    ],
    featured: true,
  },
  {
    name: "Scale",
    monthly: 68,
    blurb: "For organisations with review and residency requirements.",
    features: [
      "Everything in Pro",
      "Audit log and SSO",
      "Region pinning",
      "Named support contact",
    ],
  },
];

export default function Paywall3() {
  const [yearly, setYearly] = useState(true);

  const price = (monthly: number) =>
    monthly === 0 ? "$0" : `$${yearly ? Math.round(monthly * 0.8) : monthly}`;

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[900px]">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Choose a plan to continue
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Your trial ended on 3 March. Pick a plan to restore access to your
              workspaces.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Billing period"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            {[
              { label: "Monthly", value: false },
              { label: "Yearly", value: true },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                role="tab"
                aria-selected={yearly === opt.value}
                onClick={() => setYearly(opt.value)}
                className={cx(
                  "h-7 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                  yearly === opt.value
                    ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-2 text-[12px] text-neutral-500">
          {yearly
            ? "Yearly billing saves 20 percent and is charged once per year."
            : "Monthly billing, cancel before the next renewal."}
        </p>

        <div
          className={cx(
            frame,
            "mt-3 grid max-h-[300px] gap-1 overflow-y-auto md:max-h-none md:grid-cols-3 md:overflow-visible",
          )}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cx(
                panel,
                "flex flex-col p-4",
                plan.featured && "border-neutral-900 dark:border-neutral-100",
              )}
            >
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {plan.name}
                </p>
                {plan.current && (
                  <span className="inline-flex h-5 items-center rounded-[var(--rb-r-xs,4px)] border border-neutral-200 px-1.5 text-[11px] text-neutral-500 dark:border-neutral-800">
                    Current
                  </span>
                )}
                {plan.featured && (
                  <span className="inline-flex h-5 items-center rounded-[var(--rb-r-xs,4px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-1.5 text-[11px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
                    Recommended
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                  {price(plan.monthly)}
                </span>
                <span className="text-[12px] text-neutral-500">
                  {plan.monthly === 0 ? "forever" : "per seat / mo"}
                </span>
              </div>

              <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
                {plan.blurb}
              </p>

              <ul className="mt-3 flex-1 space-y-1.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex gap-2 text-[12px] text-neutral-700 dark:text-neutral-300"
                  >
                    <Check
                      className="mt-0.5 h-3 w-3 shrink-0 text-neutral-400"
                      aria-hidden
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={plan.current}
                className={cx(
                  "mt-4 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-[13px] font-medium",
                  plan.featured
                    ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]"
                    : "border border-neutral-200 text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-800",
                  "disabled:pointer-events-none disabled:opacity-40",
                  transition,
                  focus,
                )}
              >
                {plan.current ? "Your current plan" : `Choose ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-neutral-500">
            Prices in USD. Seats can be added or removed at any time.
          </p>
          <button
            type="button"
            className={cx(
              "inline-flex h-8 cursor-pointer items-center self-start rounded-[var(--rb-r-md,8px)] px-2.5 text-[12px] font-medium text-neutral-700 hover:bg-neutral-100 sm:self-auto dark:text-neutral-300 dark:hover:bg-neutral-800",
              transition,
              focus,
            )}
          >
            Compare every feature
          </button>
        </div>
      </div>
    </div>
  );
}

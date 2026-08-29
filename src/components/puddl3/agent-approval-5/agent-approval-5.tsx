"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const ESTIMATE = [
  { label: "Runtime", value: "~40 min", note: "Runs in the background" },
  { label: "Model usage", value: "up to $18.40", note: "Capped at $25.00" },
  { label: "Warehouse queries", value: "9,600", note: "Read-only snapshots" },
];

const SPENT = 18.4;
const BUDGET = 25;

const FORECAST_REQUEST = `run_forecast({
  horizon: "Q4",
  maxSpendUsd: 25
})`;

type Decision = "pending" | "approved" | "rejected";

const focusRing =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";
const press =
  "transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]";

export default function AgentApproval5() {
  const reduceMotion = useReducedMotion();
  const [decision, setDecision] = useState<Decision>("pending");
  const [showRequest, setShowRequest] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!announcement) return;
    const id = setTimeout(() => setAnnouncement(""), 2400);
    return () => clearTimeout(id);
  }, [announcement]);

  const enter = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] as const },
      };

  const pct = Math.round((SPENT / BUDGET) * 100);

  return (
    <div className="flex h-full min-h-[560px] w-full items-center justify-center overflow-y-auto bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <motion.section
        {...enter}
        aria-labelledby="aa5-title"
        className="w-full max-w-lg space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-4 py-5 dark:border-neutral-800 dark:bg-neutral-950 sm:px-5 sm:py-7">
          <div className="flex items-center gap-1.5">
            <span
              className={cx(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                decision === "pending"
                  ? "bg-amber-500"
                  : "bg-neutral-300 dark:bg-neutral-600",
              )}
            />
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {decision === "pending"
                ? "High-cost operation"
                : decision === "approved"
                  ? "Approved"
                  : "Skipped"}
            </span>
            <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
              Demand forecast agent
            </span>
          </div>

          <h2
            id="aa5-title"
            className="mt-3 text-lg font-medium leading-snug tracking-[-0.015em] text-neutral-900 dark:text-neutral-100"
          >
            Run the Q4 demand forecast: about 40 minutes and up to $18 in model
            usage
          </h2>
        </div>

        <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-4 py-5 dark:border-neutral-800 dark:bg-neutral-950 sm:px-5 sm:py-7">
          <dl className="flex flex-col">
            {ESTIMATE.map((row) => (
              <div
                key={row.label}
                className="py-3.5 sm:grid sm:grid-cols-[9rem_1fr_auto] sm:items-baseline sm:gap-3"
              >
                <dt className="text-[13px] text-neutral-600 dark:text-neutral-400">
                  {row.label}
                </dt>
                <dd className="text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100 sm:min-w-0">
                  {row.value}
                </dd>
                <dd className="text-xs text-neutral-500 dark:text-neutral-500">
                  {row.note}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-600 dark:text-neutral-400">
                Projected spend for this run
              </span>
              <span className="tabular-nums text-neutral-500 dark:text-neutral-500">
                ${SPENT.toFixed(2)} of a ${BUDGET.toFixed(2)} cap
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
          {decision === "pending" ? (
            <>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowRequest((v) => !v)}
                  aria-expanded={showRequest}
                  className={cx(
                    "inline-flex h-8 cursor-pointer items-center gap-1 rounded-[var(--rb-r-sm,6px)] px-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    press,
                    focusRing,
                  )}
                >
                  <ChevronRight
                    aria-hidden="true"
                    className={cx(
                      "h-3.5 w-3.5 shrink-0 transition-transform duration-150 ease-out",
                      showRequest && "rotate-90",
                    )}
                  />
                  {showRequest ? "Hide request" : "Show request"}
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDecision("rejected");
                      setAnnouncement("Skipped, not approved.");
                    }}
                    className={cx(
                      "inline-flex h-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
                      press,
                      focusRing,
                    )}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDecision("approved");
                      setAnnouncement("Approved. The forecast is running.");
                    }}
                    className={cx(
                      "inline-flex h-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-2.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                      press,
                      focusRing,
                    )}
                  >
                    Approve
                  </button>
                </div>
              </div>
              {showRequest && (
                <pre
                  tabIndex={0}
                  className={cx(
                    "mt-1 max-h-40 overflow-auto rounded-[var(--rb-r-sm,6px)] bg-neutral-50 px-3 py-2.5 font-mono text-xs leading-relaxed text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400",
                    focusRing,
                  )}
                >
                  {FORECAST_REQUEST}
                </pre>
              )}
            </>
          ) : (
            <div className="flex min-h-8 items-center gap-2 px-2 py-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <p className="min-w-0 flex-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                {decision === "approved"
                  ? "Running in the background. You can stop it any time"
                  : "Skipped, not approved"}
              </p>
            </div>
          )}
        </div>
      </motion.section>

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

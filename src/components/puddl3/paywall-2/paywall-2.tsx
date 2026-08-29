"use client";

import { Check, Sparkles, X } from "lucide-react";

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

const UNLOCKS = [
  {
    title: "Scheduled exports",
    body: "Send any saved view to S3 or a warehouse on a cron you control.",
  },
  {
    title: "Unlimited history",
    body: "Query beyond the 30 days Starter keeps, with no sampling.",
  },
  {
    title: "Shared workspaces",
    body: "Invite the whole team and manage access by role.",
  },
];

export default function Paywall2() {
  return (
    <div className="relative flex h-full min-h-[560px] w-full items-center justify-center overflow-y-auto bg-neutral-100 p-6 sm:p-8 dark:bg-neutral-900">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:28px_28px] text-neutral-900 dark:text-neutral-100"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-2-title"
        className="relative w-full max-w-[440px] rounded-[var(--rb-r-3xl,16px)] border border-neutral-200 bg-white p-2 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.28)] dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div className="flex items-start gap-3 px-3 pt-3 pb-4">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
          >
            <Sparkles className="h-4 w-4 text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]" />
          </span>

          <div className="min-w-0 flex-1">
            <h2
              id="paywall-2-title"
              className="text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100"
            >
              Scheduled exports are a Pro feature
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
              Your workspace is on Starter. Upgrading applies immediately and is
              prorated.
            </p>
          </div>

          <button
            type="button"
            aria-label="Dismiss"
            className={cx(
              "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div
          className={cx(
            frame,
            "max-h-[264px] space-y-1 overflow-y-auto sm:max-h-none sm:overflow-visible",
          )}
        >
          {UNLOCKS.map((item) => (
            <div key={item.title} className={cx(panel, "flex gap-2.5 p-3")}>
              <Check
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 px-1 pt-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-neutral-500">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              $24
            </span>{" "}
            per seat, per month
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cx(
                "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] px-3 text-[13px] font-medium whitespace-nowrap text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              Not now
            </button>
            <button
              type="button"
              className={cx(
                "inline-flex h-9 flex-1 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 whitespace-nowrap sm:flex-none text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              Upgrade workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

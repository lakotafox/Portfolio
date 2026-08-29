"use client";

import { useState } from "react";
import { Building2, Check, Lock } from "lucide-react";

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

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const ADMINS = [
  { name: "Priya Nandakumar", role: "Workspace owner" },
  { name: "Marcus Bell", role: "Billing admin" },
];

export default function Paywall7() {
  const [requested, setRequested] = useState(false);
  const [note, setNote] = useState(
    "I need audit log access to close out the SOC 2 evidence request.",
  );

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[560px]">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200 dark:border-neutral-800"
          >
            <Lock className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Audit log needs a Scale plan
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-neutral-500">
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Northwind is on Pro · you do not manage billing
            </p>
          </div>
        </div>

        <div className={cx(frame, "mt-4 space-y-1")}>
          <div className={cx(panel, "p-4")}>
            <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Ask an admin to upgrade
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
              We will send your note to the people below. They can approve the
              change without you doing anything else.
            </p>

            <div className="mt-3 space-y-2">
              {ADMINS.map((a) => (
                <div key={a.name} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {initials(a.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                      {a.name}
                    </p>
                    <p className="truncate text-[12px] text-neutral-500">
                      {a.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cx(panel, "p-4")}>
            <label
              htmlFor="paywall-7-note"
              className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
            >
              Why do you need it?
            </label>
            <textarea
              id="paywall-7-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2 w-full resize-none rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            className="text-[12px] text-neutral-500 sm:order-1"
          >
            {requested
              ? "Request sent to 2 admins."
              : "Scale adds audit log, SSO and region pinning."}
          </p>

          <div className="flex gap-2 sm:order-2">
            <button
              type="button"
              className={cx(
                "inline-flex h-9 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-3 text-[13px] font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              Compare plans
            </button>
            <button
              type="button"
              disabled={requested}
              onClick={() => setRequested(true)}
              className={cx(
                "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                "disabled:pointer-events-none disabled:opacity-50",
                transition,
                focus,
              )}
            >
              {requested && <Check className="h-3.5 w-3.5" aria-hidden />}
              {requested ? "Request sent" : "Send request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

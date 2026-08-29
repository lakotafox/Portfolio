"use client";

import { useState } from "react";
import { Check, Laptop, MapPin, ShieldAlert, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const btnPrimary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]";

const btnSecondary =
  "inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-900 hover:bg-neutral-50 active:scale-[0.97] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

const REQUEST = [
  { label: "Device", value: "Windows 11 · Edge 126" },
  { label: "Location", value: "Rotterdam, Netherlands" },
  { label: "IP address", value: "84.29.117.4" },
  { label: "Requested", value: "Just now · 14:06 CET" },
];

const HISTORY = [
  {
    device: "MacBook Pro · Chrome",
    place: "Lisbon",
    when: "2 hours ago",
    flagged: false,
  },
  {
    device: "iPhone 15 · Safari",
    place: "Lisbon",
    when: "Yesterday",
    flagged: false,
  },
  {
    device: "Unknown · Firefox",
    place: "Sofia",
    when: "3 days ago",
    flagged: true,
  },
];

type Phase = "pending" | "approved" | "denied";

export default function Authentication14() {
  const [phase, setPhase] = useState<Phase>("pending");

  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <div className="rounded-[var(--rb-r-4xl,18px)] border border-neutral-200/70 bg-white p-6 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
          {phase === "pending" && (
            <div className="animate-[fade_200ms_ease-out] motion-reduce:animate-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                <Laptop
                  aria-hidden="true"
                  className="h-[18px] w-[18px] text-neutral-700 dark:text-neutral-300"
                />
              </div>

              <h1 className="mt-4 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                Approve this sign-in
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                A device we have not seen before is trying to open Northwind as{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  dana.whitfield@northwind.com
                </span>
                .
              </p>

              <div className="mt-5 space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950">
                {REQUEST.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
                      {row.label}
                    </span>
                    <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                The request expires in 4 minutes.
              </p>

              <button
                type="button"
                onClick={() => setPhase("approved")}
                className={cx(btnPrimary, transition, focus, "mt-4")}
              >
                Yes, that was me
              </button>
              <button
                type="button"
                onClick={() => setPhase("denied")}
                className={cx(btnSecondary, transition, focus, "mt-2")}
              >
                No, secure my account
              </button>
            </div>
          )}

          {phase === "approved" && (
            <div className="animate-[fade_200ms_ease-out] motion-reduce:animate-none">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]">
                <Check
                  aria-hidden="true"
                  strokeWidth={2.5}
                  className="h-6 w-6 text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                />
              </span>
              <h1 className="mt-5 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                Sign-in approved
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                Edge on Windows 11 is now signed in and has been added to your
                trusted devices for 30 days.
              </p>
              <button
                type="button"
                onClick={() => setPhase("pending")}
                className={cx(btnSecondary, transition, focus, "mt-6")}
              >
                Back to the request
              </button>
            </div>
          )}

          {phase === "denied" && (
            <div className="animate-[fade_200ms_ease-out] motion-reduce:animate-none">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
                <ShieldAlert
                  aria-hidden="true"
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                />
              </span>
              <h1 className="mt-5 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                Request blocked
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                We turned that device away. Finish securing the account with the
                two steps below.
              </p>
              <ol className="mt-5 space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950">
                {["Change your password", "End every other active session"].map(
                  (step, i) => (
                    <li
                      key={step}
                      className="flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {i + 1}
                      </span>
                      <span className="text-[13px] text-neutral-900 dark:text-neutral-100">
                        {step}
                      </span>
                    </li>
                  ),
                )}
              </ol>
              <button
                type="button"
                className={cx(btnPrimary, transition, focus, "mt-4")}
              >
                Change password
              </button>
              <button
                type="button"
                onClick={() => setPhase("pending")}
                className={cx(btnSecondary, transition, focus, "mt-2")}
              >
                Back to the request
              </button>
            </div>
          )}
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
            Recent sign-ins
          </p>
          <ul className="mt-2 space-y-1">
            {HISTORY.map((entry) => (
              <li
                key={entry.device}
                className="flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] px-3 py-2"
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    entry.flagged
                      ? "bg-amber-500"
                      : "bg-neutral-300 dark:bg-neutral-700",
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                  {entry.device}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {entry.flagged ? (
                    <X aria-hidden="true" className="h-3 w-3" />
                  ) : (
                    <MapPin aria-hidden="true" className="h-3 w-3" />
                  )}
                  {entry.place}
                </span>
                <span className="w-20 shrink-0 text-right text-xs text-neutral-500 dark:text-neutral-400">
                  {entry.when}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

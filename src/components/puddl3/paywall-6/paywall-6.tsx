"use client";

import { useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const READ = 3;
const ALLOWANCE = 3;

const REASSURANCE = [
  "No card required",
  "One email each Thursday",
  "Unsubscribe in a click",
];

export default function Paywall6() {
  const [email, setEmail] = useState("");

  return (
    <div className="flex h-full min-h-[400px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[520px] text-center">
        <div
          className="mx-auto flex w-fit items-center gap-1.5"
          role="img"
          aria-label={`${READ} of ${ALLOWANCE} free articles read this month`}
        >
          {Array.from({ length: ALLOWANCE }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={cx(
                "h-1.5 w-8 rounded-full",
                i < READ
                  ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                  : "bg-neutral-200 dark:bg-neutral-800",
              )}
            />
          ))}
        </div>

        <p className="mt-3 text-[12px] tracking-[0.08em] text-neutral-500 uppercase">
          {READ} of {ALLOWANCE} free reads used
        </p>

        <h2 className="mt-2 text-xl font-medium tracking-[-0.01em] text-neutral-900 sm:text-2xl dark:text-neutral-100">
          That was your last free article this month
        </h2>
        <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-neutral-500">
          Your counter resets on 1 April. Leave an address and we will send the
          rest of this piece, plus one long read each Thursday.
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto mt-5 flex w-full max-w-[400px] flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="paywall-6-email" className="sr-only">
            Email address
          </label>
          <input
            id="paywall-6-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="h-9 min-w-0 flex-1 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white"
          />
          <button
            type="submit"
            className={cx(
              "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
              transition,
              focus,
            )}
          >
            Keep reading
          </button>
        </form>

        <p className="mt-3 text-[12px] text-neutral-500">
          Already subscribed?{" "}
          <button
            type="button"
            className={cx(
              "cursor-pointer rounded-[var(--rb-r-xs,4px)] text-neutral-900 underline decoration-neutral-300 underline-offset-[3px] hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-white",
              transition,
              focus,
            )}
          >
            Sign in
          </button>
        </p>

        <ul className="mx-auto mt-6 flex w-fit flex-col gap-x-5 gap-y-1.5 text-[12px] text-neutral-500 sm:flex-row">
          {REASSURANCE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

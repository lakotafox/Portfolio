"use client";

import { useState } from "react";
import { ArrowRight, Check, Plus, RotateCcw } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const btnPrimary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]";

const linkClass =
  "cursor-pointer rounded-[var(--rb-r-xs,4px)] underline decoration-neutral-300 underline-offset-[3px] transition-colors duration-150 hover:decoration-neutral-900 dark:decoration-neutral-600 dark:hover:decoration-white";

type Account = {
  id: string;
  name: string;
  email: string;
  workspace: string;
  state: "active" | "expired";
  detail: string;
};

const ACCOUNTS: Account[] = [
  {
    id: "dana",
    name: "Dana Whitfield",
    email: "dana.whitfield@northwind.com",
    workspace: "Northwind Operations",
    state: "active",
    detail: "Signed in 4 hours ago",
  },
  {
    id: "mina",
    name: "Mina Park",
    email: "mina.park@northwind.com",
    workspace: "Northwind Design",
    state: "active",
    detail: "Signed in yesterday",
  },
  {
    id: "ardent",
    name: "D. Whitfield (contractor)",
    email: "d.whitfield@ardentfreight.co",
    workspace: "Ardent Freight",
    state: "expired",
    detail: "Session expired, sign in again",
  },
];

const initials = (name: string) =>
  name
    .replace(/\(.*\)/, "")
    .trim()
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export default function Authentication10() {
  const [selected, setSelected] = useState("dana");

  const account = ACCOUNTS.find((a) => a.id === selected) ?? ACCOUNTS[0];
  const expired = account.state === "expired";

  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <div className="rounded-[var(--rb-r-4xl,18px)] border border-neutral-200/70 bg-white p-6 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              N
            </span>
          </div>

          <h1 className="mt-4 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
            Choose an account
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            This browser remembers three Northwind accounts.
          </p>

          <div className="mt-5 space-y-1.5">
            {ACCOUNTS.map((item) => {
              const active = item.id === selected;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(item.id)}
                  className={cx(
                    "flex w-full cursor-pointer items-center gap-3 rounded-[var(--rb-r-lg,10px)] border px-3 py-2.5 text-left active:scale-[0.99]",
                    transition,
                    focus,
                    active
                      ? "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
                      : "border-neutral-200/70 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[13px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    {initials(item.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {item.name}
                    </span>
                    <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {item.email}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      <span
                        className={cx(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          item.state === "expired"
                            ? "bg-amber-500"
                            : "bg-neutral-300 dark:bg-neutral-600",
                        )}
                      />
                      <span className="truncate">{item.detail}</span>
                    </span>
                  </span>
                  {active && (
                    <Check
                      aria-hidden="true"
                      strokeWidth={2.5}
                      className="h-4 w-4 shrink-0 text-neutral-900 dark:text-white"
                    />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              className={cx(
                "flex w-full cursor-pointer items-center gap-3 rounded-[var(--rb-r-lg,10px)] border border-dashed border-neutral-300 bg-white px-3 py-2.5 text-left hover:bg-neutral-50 active:scale-[0.99] dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                <Plus
                  aria-hidden="true"
                  className="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  Use another account
                </span>
                <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                  Sign in with a different email or provider
                </span>
              </span>
            </button>
          </div>

          <button
            type="button"
            className={cx(btnPrimary, transition, focus, "group mt-5")}
          >
            {expired ? (
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
            ) : null}
            {expired
              ? `Sign in again as ${account.name.split(" ")[0]}`
              : `Continue to ${account.workspace}`}
            {!expired && (
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            )}
          </button>

          <p
            aria-live="polite"
            className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400"
          >
            {expired
              ? "Sessions for contractor accounts end after 12 hours."
              : `Signing in as ${account.email}`}
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Finished on this device?{" "}
          <button
            type="button"
            className={cx(
              "font-medium text-neutral-900 dark:text-neutral-100",
              linkClass,
              focus,
            )}
          >
            Sign out of all accounts
          </button>
        </p>
      </div>
    </div>
  );
}

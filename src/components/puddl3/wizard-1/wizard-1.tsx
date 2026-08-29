"use client";

import { useState } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const labelClass =
  "block text-[13px] font-medium text-neutral-900 dark:text-neutral-100";

const fieldShell =
  "flex h-9 w-full items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white transition-colors duration-150 hover:border-neutral-300 focus-within:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:focus-within:border-white";

const inputClass =
  "h-full w-full min-w-0 rounded-[var(--rb-r-md,8px)] bg-transparent px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500";

const selectClass =
  "h-9 w-full cursor-pointer appearance-none rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 pr-9 text-[13px] text-neutral-900 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white";

const STEPS = ["Information", "Payment", "Completed"];

const ROLES = ["Procurement owner", "Finance", "Engineering", "Founder"];
const COUNTRIES = ["United States", "Portugal", "Germany", "Japan"];

function Required() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-neutral-400">
      *
    </span>
  );
}

export default function Wizard1() {
  const [step, setStep] = useState(0);

  return (
    <div className="relative h-full min-h-[640px] w-full overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
      >
        <ol className="flex shrink-0 items-center gap-3 border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
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
                    "flex min-w-0 cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-sm,6px)] py-0.5",
                    focus,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums transition-[background-color,border-color,color] duration-150 ease-out",
                      done
                        ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                        : active
                          ? "border border-dashed border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100"
                          : "border border-neutral-200 bg-white text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-600",
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
                      "hidden truncate text-[13px] font-medium sm:block",
                      done || active
                        ? "text-neutral-900 dark:text-neutral-100"
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
                      "h-px min-w-4 flex-1 transition-colors duration-200 ease-out",
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

        <div className="min-h-0 flex-1 px-6 py-5">
          <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Your information
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
            Billing owner details. These appear on every receipt.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wz1-first" className={labelClass}>
                First name
                <Required />
              </label>
              <div className={cx(fieldShell, "mt-1.5")}>
                <input
                  id="wz1-first"
                  defaultValue="Mara"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wz1-last" className={labelClass}>
                Last name
                <Required />
              </label>
              <div className={cx(fieldShell, "mt-1.5")}>
                <input
                  id="wz1-last"
                  defaultValue="Chen"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wz1-company" className={labelClass}>
                Company
                <Required />
              </label>
              <div className={cx(fieldShell, "mt-1.5")}>
                <input
                  id="wz1-company"
                  defaultValue="Kepler Works"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wz1-handle" className={labelClass}>
                Public handle
              </label>
              <div className={cx(fieldShell, "mt-1.5 pl-3")}>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[13px] text-neutral-400"
                >
                  @
                </span>
                <input
                  id="wz1-handle"
                  defaultValue="kepler-works"
                  className={cx(inputClass, "px-2")}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wz1-role" className={labelClass}>
                Role
              </label>
              <div className="relative mt-1.5">
                <select
                  id="wz1-role"
                  defaultValue={ROLES[0]}
                  className={selectClass}
                >
                  {ROLES.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="wz1-country" className={labelClass}>
                Country
              </label>
              <div className="relative mt-1.5">
                <select
                  id="wz1-country"
                  defaultValue={COUNTRIES[0]}
                  className={selectClass}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="wz1-email" className={labelClass}>
                Email address
                <Required />
              </label>
              <div className={cx(fieldShell, "mt-1.5")}>
                <input
                  id="wz1-email"
                  type="email"
                  defaultValue="mara@kepler.works"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wz1-mobile" className={labelClass}>
                Mobile
              </label>
              <div className={cx(fieldShell, "mt-1.5 pl-3")}>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[13px] text-neutral-400"
                >
                  US
                </span>
                <input
                  id="wz1-mobile"
                  defaultValue="+1 415 5151"
                  className={cx(inputClass, "px-2")}
                />
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-neutral-500">
            Receipts and payment failures go to this address.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className={cx(
              "inline-flex h-9 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
              transition,
              focus,
            )}
          >
            Back
          </button>

          <button
            type="submit"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className={cx(
              "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
              transition,
              focus,
            )}
          >
            Next step
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

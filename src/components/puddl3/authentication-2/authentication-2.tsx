"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowRight, Apple, Github, KeyRound } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const field =
  "h-10 w-full rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white";

const btnPrimary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]";

const btnProvider =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-50 active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

const linkClass =
  "cursor-pointer rounded-[var(--rb-r-xs,4px)] underline decoration-neutral-300 underline-offset-[3px] transition-colors duration-150 hover:decoration-neutral-900 dark:decoration-neutral-600 dark:hover:decoration-white";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M21.35 11.1H12v2.98h5.35c-.24 1.4-1.75 4.1-5.35 4.1a5.95 5.95 0 0 1 0-11.9c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.62 14.53 2.7 12 2.7a9.3 9.3 0 1 0 0 18.6c5.25 0 8.73-3.69 8.73-8.88 0-.6-.06-1.05-.14-1.52Z" />
    </svg>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Authentication2() {
  const emailId = useId();
  const domainId = useId();

  const [mode, setMode] = useState<"email" | "sso">("email");
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [touched, setTouched] = useState(false);

  const value = mode === "email" ? email : domain;
  const valid =
    mode === "email" ? EMAIL.test(email.trim()) : domain.trim().length >= 2;
  const showError = touched && value.length > 0 && !valid;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
  };

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center justify-between px-6 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
            N
          </span>
          <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
            Northwind
          </span>
        </div>
        <button
          type="button"
          className={cx(
            "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
            transition,
            focus,
          )}
        >
          Create account
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-6 sm:px-8">
        <div className="w-full max-w-[420px]">
          <h1 className="text-center text-2xl font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
            Welcome back
          </h1>
          <p className="mx-auto mt-2 max-w-[340px] text-center text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            Sign in to pick up your tasks, timelines, and reviews exactly where
            you left them.
          </p>

          <div className="mt-7 space-y-2">
            <button
              type="button"
              className={cx(btnProvider, transition, focus)}
            >
              <GoogleMark className="h-4 w-4" />
              Continue with Google
            </button>
            <button
              type="button"
              className={cx(btnProvider, transition, focus)}
            >
              <Github aria-hidden="true" className="h-4 w-4" />
              Continue with GitHub
            </button>
            <button
              type="button"
              className={cx(btnProvider, transition, focus)}
            >
              <Apple aria-hidden="true" className="h-4 w-4" />
              Continue with Apple
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              or
            </span>
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </div>

          <form onSubmit={submit} noValidate className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor={mode === "email" ? emailId : domainId}
                className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
              >
                {mode === "email" ? "Work email" : "Company domain"}
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode((m) => (m === "email" ? "sso" : "email"));
                  setTouched(false);
                }}
                className={cx(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-xs,4px)] text-xs text-neutral-500 transition-colors duration-150 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                  focus,
                )}
              >
                <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
                {mode === "email" ? "Use single sign-on" : "Use email instead"}
              </button>
            </div>

            {mode === "email" ? (
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-invalid={showError}
                className={cx(
                  field,
                  focus,
                  "mt-1.5",
                  showError && "border-red-500 dark:border-red-500",
                )}
              />
            ) : (
              <div
                className={cx(
                  field,
                  "mt-1.5 flex items-center gap-0 p-0 focus-within:border-neutral-900 dark:focus-within:border-white",
                )}
              >
                <input
                  id={domainId}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="northwind"
                  aria-invalid={showError}
                  className={cx(
                    "h-full min-w-0 flex-1 rounded-[var(--rb-r-lg,10px)] border-0 bg-transparent px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500",
                    focus,
                  )}
                />
                <span className="pr-3.5 text-sm text-neutral-400 dark:text-neutral-500">
                  .northwind.app
                </span>
              </div>
            )}

            <p
              className={cx(
                "mt-1.5 text-xs",
                showError
                  ? "text-red-600 dark:text-red-400"
                  : "text-neutral-500 dark:text-neutral-400",
              )}
            >
              {showError
                ? mode === "email"
                  ? "Enter a valid work email address."
                  : "Domains are at least 2 characters."
                : mode === "email"
                  ? "We match your email to an existing workspace."
                  : "Your admin set this when the workspace was created."}
            </p>

            <button
              type="submit"
              disabled={!valid}
              className={cx(btnPrimary, transition, focus, "mt-4 group")}
            >
              Continue
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            By continuing you agree to the{" "}
            <button
              type="button"
              className={cx(
                linkClass,
                focus,
                "text-neutral-700 dark:text-neutral-300",
              )}
            >
              terms of service
            </button>{" "}
            and{" "}
            <button
              type="button"
              className={cx(
                linkClass,
                focus,
                "text-neutral-700 dark:text-neutral-300",
              )}
            >
              privacy policy
            </button>
            .
          </p>
        </div>
      </div>

      <footer className="flex h-12 shrink-0 items-center justify-between px-6 text-xs text-neutral-500 sm:px-8 dark:text-neutral-400">
        <span>Trouble signing in? Reach the workspace admin.</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          All systems normal
        </span>
      </footer>
    </div>
  );
}

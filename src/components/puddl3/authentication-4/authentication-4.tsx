"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Mail,
} from "lucide-react";

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

const btnSecondary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-50 active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

const linkClass =
  "cursor-pointer rounded-[var(--rb-r-xs,4px)] text-neutral-900 underline decoration-neutral-300 underline-offset-[3px] transition-colors duration-150 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-white";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const KNOWN: Record<string, { name: string; workspace: string }> = {
  "dana.whitfield@northwind.com": {
    name: "Dana Whitfield",
    workspace: "Northwind Operations",
  },
};

export default function Authentication4() {
  const emailId = useId();
  const passwordId = useId();

  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("dana.whitfield@northwind.com");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (step === "password")
      passwordRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const account = KNOWN[email.trim().toLowerCase()];
  const initials = account
    ? account.name
        .split(" ")
        .map((w) => w[0])
        .join("")
    : email.trim().slice(0, 2).toUpperCase();

  const continueToPassword = (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError(true);
      return;
    }
    setError(false);
    setPending(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPending(false);
      setStep("password");
    }, 550);
  };

  const signIn = (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPending(false), 1200);
  };

  return (
    <div className="relative flex h-full min-h-[560px] w-full flex-col overflow-hidden bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center">
        <div className="rounded-[var(--rb-r-4xl,18px)] border border-neutral-200/70 bg-white p-6 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
              N
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
              Step {step === "email" ? 1 : 2} of 2
            </span>
          </div>

          <div className="mt-5 min-h-[268px]">
            {step === "email" ? (
              <div
                key="email"
                className="animate-[stepIn_200ms_ease-out] motion-reduce:animate-none"
              >
                <h1 className="text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                  Sign in to Northwind
                </h1>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Start with the email your workspace was created with.
                </p>

                <form onSubmit={continueToPassword} noValidate className="mt-6">
                  <label
                    htmlFor={emailId}
                    className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                  >
                    Work email
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(false);
                    }}
                    placeholder="name@company.com"
                    aria-invalid={error}
                    className={cx(
                      field,
                      focus,
                      "mt-1.5",
                      error && "border-red-500 dark:border-red-500",
                    )}
                  />
                  {error && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                      Enter a valid email address.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={pending}
                    className={cx(btnPrimary, transition, focus, "group mt-4")}
                  >
                    {pending ? (
                      <Loader2
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      />
                    ) : null}
                    Continue
                    {!pending && (
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                      />
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  className={cx(btnSecondary, transition, focus, "mt-2")}
                >
                  <Mail aria-hidden="true" className="h-4 w-4" />
                  Email me a sign-in link
                </button>
              </div>
            ) : (
              <div
                key="password"
                className="animate-[stepIn_200ms_ease-out] motion-reduce:animate-none"
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setPassword("");
                  }}
                  className={cx(
                    "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                    transition,
                    focus,
                  )}
                >
                  <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                  Back
                </button>

                <div className="mt-4 flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {account?.name ?? email}
                    </p>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {account ? account.workspace : "New to Northwind"}
                    </p>
                  </div>
                </div>

                <form onSubmit={signIn} className="mt-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <label
                      htmlFor={passwordId}
                      className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className={cx("text-xs", linkClass, focus)}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      ref={passwordRef}
                      id={passwordId}
                      type={reveal ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={cx(field, focus, "pr-11")}
                    />
                    <button
                      type="button"
                      onClick={() => setReveal((v) => !v)}
                      aria-label={reveal ? "Hide password" : "Show password"}
                      className={cx(
                        "absolute top-1 right-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                        transition,
                        focus,
                      )}
                    >
                      {reveal ? (
                        <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
                      ) : (
                        <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={pending}
                    className={cx(btnPrimary, transition, focus, "mt-4")}
                  >
                    {pending && (
                      <Loader2
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      />
                    )}
                    {pending ? "Signing in" : "Sign in"}
                  </button>
                </form>

                <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  Signing in from a new device adds a one-time code step.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Need an account?{" "}
          <button type="button" className={cx("font-medium", linkClass, focus)}>
            Create one
          </button>
        </p>
      </div>

      <style>{`@keyframes stepIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, Minus } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const field =
  "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white";

const btnPrimary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]";

const linkClass =
  "cursor-pointer rounded-[var(--rb-r-xs,4px)] text-neutral-900 underline decoration-neutral-300 underline-offset-[3px] transition-colors duration-150 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-white";

const checkboxClass =
  "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border border-neutral-300 bg-white transition-colors duration-150 checked:border-neutral-900 checked:bg-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:checked:bg-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxMark =
  "pointer-events-none absolute h-3 w-3 text-[var(--rb-accent-fg,oklch(100%_0_0))] opacity-0 transition-opacity duration-150 peer-checked:opacity-100 motion-reduce:transition-none dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RULES = [
  { label: "At least 10 characters", test: (v: string) => v.length >= 10 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
  {
    label: "One symbol",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
];

const STRENGTH = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;

export default function Authentication7() {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const rulesId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passed = useMemo(
    () => RULES.map((rule) => rule.test(password)),
    [password],
  );
  const score = passed.filter(Boolean).length;

  const emailValid = EMAIL.test(email.trim());
  const ready =
    name.trim().length > 1 && emailValid && score === RULES.length && accepted;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Free for 14 days. No card, no seat minimum.
          </p>

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor={nameId}
                className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
              >
                Full name
              </label>
              <input
                id={nameId}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dana Whitfield"
                className={cx(field, focus)}
              />
            </div>

            <div className="space-y-1.5">
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-invalid={submitted && !emailValid}
                className={cx(
                  field,
                  focus,
                  submitted &&
                    !emailValid &&
                    "border-red-500 dark:border-red-500",
                )}
              />
              <p
                className={cx(
                  "text-xs",
                  submitted && !emailValid
                    ? "text-red-600 dark:text-red-400"
                    : "text-neutral-500 dark:text-neutral-400",
                )}
              >
                {submitted && !emailValid
                  ? "Enter a valid work email address."
                  : "We use this to match you to an existing workspace."}
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={passwordId}
                className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id={passwordId}
                  type={reveal ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  aria-describedby={rulesId}
                  className={cx(field, focus, "pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? "Hide password" : "Show password"}
                  className={cx(
                    "absolute top-1 right-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
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

              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex flex-1 gap-1">
                  {RULES.map((rule, i) => (
                    <span
                      key={rule.label}
                      className={cx(
                        "h-1 flex-1 rounded-full transition-colors duration-200",
                        i < score
                          ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                          : "bg-neutral-200 dark:bg-neutral-800",
                      )}
                    />
                  ))}
                </div>
                <span
                  aria-live="polite"
                  className="w-16 shrink-0 text-right text-xs text-neutral-500 dark:text-neutral-400"
                >
                  {password ? STRENGTH[score] : ""}
                </span>
              </div>

              <ul
                id={rulesId}
                className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1"
              >
                {RULES.map((rule, i) => (
                  <li
                    key={rule.label}
                    className={cx(
                      "flex items-center gap-1.5 text-xs transition-colors duration-150",
                      passed[i]
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-500 dark:text-neutral-400",
                    )}
                  >
                    {passed[i] ? (
                      <Check
                        aria-hidden="true"
                        strokeWidth={2.5}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                    ) : (
                      <Minus
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-700"
                      />
                    )}
                    {rule.label}
                  </li>
                ))}
              </ul>
            </div>

            <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-5 text-neutral-600 dark:text-neutral-400">
              <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className={checkboxClass}
                />
                <Check
                  aria-hidden="true"
                  strokeWidth={3}
                  className={checkboxMark}
                />
              </span>
              <span>
                I agree to the{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  terms of service
                </span>{" "}
                and the{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  privacy policy
                </span>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={!ready}
              className={cx(btnPrimary, transition, focus)}
            >
              Create account
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?{" "}
          <button type="button" className={cx("font-medium", linkClass, focus)}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

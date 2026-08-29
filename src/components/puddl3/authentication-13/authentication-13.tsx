"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Minus,
  Smartphone,
  X,
} from "lucide-react";

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

const checkboxClass =
  "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border border-neutral-300 bg-white transition-colors duration-150 checked:border-neutral-900 checked:bg-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:checked:bg-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxMark =
  "pointer-events-none absolute h-3 w-3 text-[var(--rb-accent-fg,oklch(100%_0_0))] opacity-0 transition-opacity duration-150 peer-checked:opacity-100 motion-reduce:transition-none dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]";

const RULES = [
  { label: "10 characters or more", test: (v: string) => v.length >= 10 },
  {
    label: "Upper and lower case",
    test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  { label: "A number", test: (v: string) => /\d/.test(v) },
  { label: "A symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const STRENGTH = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;

const SESSIONS = [
  { icon: Laptop, name: "MacBook Pro · Chrome", meta: "Lisbon · active now" },
  {
    icon: Smartphone,
    name: "iPhone 15 · Safari",
    meta: "Lisbon · 2 hours ago",
  },
  { icon: Laptop, name: "Windows 11 · Edge", meta: "Porto · 6 days ago" },
];

export default function Authentication13() {
  const passwordId = useId();
  const confirmId = useId();
  const rulesId = useId();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [done, setDone] = useState(false);

  const passed = useMemo(() => RULES.map((r) => r.test(password)), [password]);
  const score = passed.filter(Boolean).length;
  const matches = confirm.length > 0 && confirm === password;
  const ready = score === RULES.length && matches;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) setDone(true);
  };

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <div className="rounded-[var(--rb-r-4xl,18px)] border border-neutral-200/70 bg-white p-6 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
          {done ? (
            <div className="animate-[fade_200ms_ease-out] motion-reduce:animate-none">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]">
                <Check
                  aria-hidden="true"
                  strokeWidth={2.5}
                  className="h-6 w-6 text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                />
              </span>
              <h1 className="mt-5 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                Password updated
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                {signOutOthers
                  ? "Two other devices were signed out. Use the new password next time you open Northwind there."
                  : "Your other devices stay signed in. You can end those sessions from account settings."}
              </p>
              <button
                type="button"
                className={cx(btnPrimary, transition, focus, "mt-6")}
              >
                Continue to Northwind
              </button>
              <button
                type="button"
                onClick={() => {
                  setDone(false);
                  setPassword("");
                  setConfirm("");
                }}
                className={cx(
                  "mt-3 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                  transition,
                  focus,
                )}
              >
                Set a different password
              </button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="animate-[fade_200ms_ease-out] motion-reduce:animate-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                <KeyRound
                  aria-hidden="true"
                  className="h-[18px] w-[18px] text-neutral-700 dark:text-neutral-300"
                />
              </div>

              <h1 className="mt-4 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                Set a new password
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                For{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  dana.whitfield@northwind.com
                </span>
                . The reset link stays valid for 30 minutes.
              </p>

              <div className="mt-5 space-y-1.5">
                <label
                  htmlFor={passwordId}
                  className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  New password
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
                  className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5"
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
                      {rule.label}{" "}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 space-y-1.5">
                <label
                  htmlFor={confirmId}
                  className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id={confirmId}
                    type={reveal ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat the password"
                    aria-invalid={confirm.length > 0 && !matches}
                    className={cx(
                      field,
                      focus,
                      "pr-10",
                      confirm.length > 0 &&
                        !matches &&
                        "border-red-500 dark:border-red-500",
                    )}
                  />
                  {confirm.length > 0 && (
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                      {matches ? (
                        <Check
                          aria-hidden="true"
                          strokeWidth={2.5}
                          className="h-4 w-4 text-neutral-900 dark:text-white"
                        />
                      ) : (
                        <X
                          aria-hidden="true"
                          strokeWidth={2.5}
                          className="h-4 w-4 text-red-500"
                        />
                      )}
                    </span>
                  )}
                </div>
                <p
                  className={cx(
                    "text-xs",
                    confirm.length > 0 && !matches
                      ? "text-red-600 dark:text-red-400"
                      : "text-neutral-500 dark:text-neutral-400",
                  )}
                >
                  {confirm.length > 0 && !matches
                    ? "Both fields must match."
                    : "Type it a second time so a typo cannot lock you out."}
                </p>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-400">
                <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={signOutOthers}
                    onChange={(e) => setSignOutOthers(e.target.checked)}
                    className={checkboxClass}
                  />
                  <Check
                    aria-hidden="true"
                    strokeWidth={3}
                    className={checkboxMark}
                  />
                </span>
                Sign out of my other devices
              </label>

              <div
                className={cx(
                  "mt-3 space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950",
                  !signOutOthers && "opacity-50",
                )}
              >
                {SESSIONS.map((session, i) => {
                  const Icon = session.icon;
                  const current = i === 0;
                  return (
                    <div
                      key={session.name}
                      className="flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <Icon
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                          {session.name}
                        </span>
                        <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {session.meta}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                        {current
                          ? "This device"
                          : signOutOthers
                            ? "Ends"
                            : "Stays"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={!ready}
                className={cx(btnPrimary, transition, focus, "mt-4")}
              >
                Update password
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ExternalLink, MailCheck, RotateCcw } from "lucide-react";

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
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-50 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

const linkClass =
  "cursor-pointer rounded-[var(--rb-r-xs,4px)] text-neutral-900 underline decoration-neutral-300 underline-offset-[3px] transition-colors duration-150 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-white";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COOLDOWN = 45;

const clock = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Authentication5() {
  const emailId = useId();

  const [sent, setSent] = useState(true);
  const [email, setEmail] = useState("dana.whitfield@northwind.com");
  const [draft, setDraft] = useState("dana.whitfield@northwind.com");
  const [error, setError] = useState(false);
  const [left, setLeft] = useState(COOLDOWN);
  const [resends, setResends] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sent || left <= 0) return;
    const id = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [sent, left]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL.test(draft.trim())) {
      setError(true);
      return;
    }
    setError(false);
    setEmail(draft.trim());
    setLeft(COOLDOWN);
    setSent(true);
  };

  const resend = () => {
    if (left > 0) return;
    setLeft(COOLDOWN);
    setResends((n) => n + 1);
  };

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center">
        <div className="rounded-[var(--rb-r-4xl,18px)] border border-neutral-200/70 bg-white p-6 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
          {sent ? (
            <div className="animate-[fade_200ms_ease-out] motion-reduce:animate-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                <MailCheck
                  aria-hidden="true"
                  className="h-[18px] w-[18px] text-neutral-700 dark:text-neutral-300"
                />
              </div>

              <h1 className="mt-4 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                Check your inbox
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                A sign-in link is on its way to{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {email}
                </span>
                . It works once and expires in 15 minutes.
              </p>

              <div className="mt-5 space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950">
                {[
                  { label: "Sent to", value: email },
                  { label: "Expires", value: "15 minutes" },
                  {
                    label: "Requested from",
                    value: "Chrome on macOS, Lisbon",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <span className="shrink-0 text-[13px] text-neutral-500 dark:text-neutral-400">
                      {row.label}
                    </span>
                    <span className="min-w-0 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  className={cx(btnPrimary, transition, focus)}
                >
                  Open mail app
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={left > 0}
                  className={cx(btnSecondary, transition, focus)}
                >
                  <RotateCcw aria-hidden="true" className="h-4 w-4" />
                  {left > 0 ? (
                    <span className="tabular-nums">
                      Resend link in {clock(left)}
                    </span>
                  ) : (
                    "Resend link"
                  )}
                </button>
              </div>

              <p
                aria-live="polite"
                className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400"
              >
                {resends > 0
                  ? `Link sent again. ${resends === 1 ? "1 resend" : `${resends} resends`} used.`
                  : "No email yet? Check spam, then try a different address."}
              </p>

              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setDraft(email);
                  setTimeout(
                    () => inputRef.current?.focus({ preventScroll: true }),
                    0,
                  );
                }}
                className={cx(
                  "mt-4 inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                  transition,
                  focus,
                )}
              >
                <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                Use a different email
              </button>
            </div>
          ) : (
            <form
              onSubmit={send}
              noValidate
              className="animate-[fade_200ms_ease-out] motion-reduce:animate-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  N
                </span>
              </div>

              <h1 className="mt-4 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                Sign in with a link
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                No password needed. We send a one-time link to your work
                address.
              </p>

              <label
                htmlFor={emailId}
                className="mt-6 block text-sm font-medium text-neutral-900 dark:text-neutral-100"
              >
                Work email
              </label>
              <input
                ref={inputRef}
                id={emailId}
                type="email"
                autoComplete="email"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
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
              <p
                className={cx(
                  "mt-1.5 text-xs",
                  error
                    ? "text-red-600 dark:text-red-400"
                    : "text-neutral-500 dark:text-neutral-400",
                )}
              >
                {error
                  ? "Enter a valid email address."
                  : "Links expire after 15 minutes and can be used once."}
              </p>

              <button
                type="submit"
                className={cx(btnPrimary, transition, focus, "mt-4")}
              >
                Send sign-in link
              </button>

              <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Prefer a password?{" "}
                <button
                  type="button"
                  className={cx("font-medium", linkClass, focus)}
                >
                  Sign in the usual way
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Requests are rate limited to protect your account.
        </p>
      </div>

      <style>{`@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

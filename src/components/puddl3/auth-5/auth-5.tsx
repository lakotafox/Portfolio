"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const GoogleMark = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GitHubMark = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18.92-.26 1.9-.38 2.88-.39.98.01 1.96.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.42-2.69 5.39-5.25 5.67.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const oauthClasses =
  "flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-neutral-300 bg-white text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900";

export function Auth5() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!sent || cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [sent, cooldown]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    setCooldown(30);
  };

  const handleResend = () => {
    setCooldown(30);
  };

  const handleReset = () => {
    setSent(false);
    setCooldown(0);
  };

  const swapVariants = {
    initial: { opacity: 0, y: reduce ? 0 : 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
    exit: {
      opacity: 0,
      y: reduce ? 0 : -10,
      transition: { duration: 0.25, ease: EASE },
    },
  };

  return (
    <section className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-16 dark:bg-neutral-950 sm:px-6 lg:items-center">
      <div className="w-full max-w-[400px]">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-8"
        >
          <div className="flex min-h-[480px] flex-col">
            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div
                  key="sent"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  role="status"
                  className="flex flex-1 flex-col justify-center"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                    <MailCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h1 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                    Check your inbox
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    We sent a sign-in link to{" "}
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {email}
                    </span>
                    . It expires in 15 minutes.
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="mt-8 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-neutral-300 text-sm font-medium text-neutral-900 transition-colors enabled:hover:bg-neutral-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:text-white dark:enabled:hover:bg-neutral-800 dark:disabled:border-neutral-800 dark:disabled:text-neutral-600 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900"
                  >
                    {cooldown > 0
                      ? `Resend link in ${cooldown}s`
                      : "Resend link"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-3 h-11 w-full cursor-pointer rounded-xl text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900"
                  >
                    Use a different email
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex flex-1 flex-col justify-center"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2l10 10-10 10L2 12z" />
                    </svg>
                  </span>
                  <h1 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                    Sign in to Lumen
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    We&apos;ll email you a magic link. No password needed.
                  </p>
                  <form onSubmit={handleSubmit} className="mt-7">
                    <label
                      htmlFor="auth5-email"
                      className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      Email address
                    </label>
                    <input
                      id="auth5-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                      className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-500 dark:hover:border-neutral-600 dark:focus:border-white dark:focus:ring-white/10 sm:text-sm"
                    />
                    <button
                      type="submit"
                      className="mt-4 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900"
                    >
                      Send magic link
                    </button>
                  </form>
                  <div
                    className="my-6 flex items-center gap-3"
                    aria-hidden="true"
                  >
                    <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                      or
                    </span>
                    <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                  <div className="space-y-3">
                    <button type="button" className={oauthClasses}>
                      <GoogleMark />
                      Continue with Google
                    </button>
                    <button type="button" className={oauthClasses}>
                      <GitHubMark />
                      Continue with GitHub
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            New to Lumen?{" "}
            <a
              href="#"
              className="rounded-lg font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:text-white dark:hover:text-neutral-300 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950"
            >
              Create an account
            </a>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="rounded underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 dark:decoration-neutral-700 dark:hover:text-neutral-300"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="rounded underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 dark:decoration-neutral-700 dark:hover:text-neutral-300"
            >
              Privacy Policy
            </a>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default Auth5;

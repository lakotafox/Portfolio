"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";

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

const rings = [
  "h-40 w-40",
  "h-[280px] w-[280px]",
  "h-[400px] w-[400px]",
  "h-[520px] w-[520px]",
];

const trustChips = [
  { label: "Device trusted", position: "left-1/2 top-[calc(50%-140px)]" },
  {
    label: "SSO enforced",
    position: "left-[calc(50%+142px)] top-[calc(50%+44px)]",
  },
  {
    label: "SOC 2 Type II",
    position: "left-[calc(50%-124px)] top-[calc(50%+112px)]",
  },
];

const inputClasses =
  "h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-500 dark:hover:border-neutral-600 dark:focus:border-white dark:focus:ring-white/10 sm:text-sm";

const oauthClasses =
  "flex h-11 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900";

export function Auth4() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Sign in:", { email, password });
  };

  return (
    <section className="flex min-h-screen w-full items-start bg-white px-4 py-6 dark:bg-neutral-950 sm:px-6 lg:items-center lg:px-8">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:min-h-[720px] lg:grid-cols-2">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={container}
          className="flex flex-col gap-12 px-6 py-8 sm:px-10 lg:px-14 lg:py-10"
        >
          <motion.header
            variants={item}
            className="flex items-center justify-between"
          >
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8z" />
                </svg>
              </span>
              <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                Northstar
              </span>
            </a>
            <a
              href="#"
              className="rounded-lg text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900"
            >
              Need help?
            </a>
          </motion.header>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
            <motion.div variants={item} className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                Sign in to Northstar
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                One account for deploys, approvals, and audit trails.
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <button type="button" className={oauthClasses}>
                <GoogleMark />
                Google
              </button>
              <button type="button" className={oauthClasses}>
                <GitHubMark />
                GitHub
              </button>
            </motion.div>

            <motion.div
              variants={item}
              className="my-6 flex items-center gap-3"
              aria-hidden="true"
            >
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                or
              </span>
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            </motion.div>

            <motion.form
              variants={item}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="auth4-email"
                  className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Work email
                </label>
                <input
                  id="auth4-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label
                    htmlFor="auth4-password"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="rounded-lg text-sm text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="auth4-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className={`${inputClasses} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-neutral-400 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:text-neutral-500 dark:hover:text-white dark:focus-visible:ring-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <motion.button
                type="submit"
                whileHover="hover"
                className="group flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900"
              >
                Sign in
                <motion.span
                  variants={{ hover: { x: reduce ? 0 : 3 } }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="flex"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </motion.span>
              </motion.button>
            </motion.form>

            <motion.p
              variants={item}
              className="mt-6 text-sm text-neutral-600 dark:text-neutral-400"
            >
              New to Northstar?{" "}
              <a
                href="#"
                className="rounded-lg font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white dark:hover:text-neutral-300 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900"
              >
                Create an account
              </a>
            </motion.p>
          </div>

          <motion.p
            variants={item}
            className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-500"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Protected by workspace SSO policy and device checks.
          </motion.p>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="relative hidden flex-col overflow-hidden border-l border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/50 lg:flex"
        >
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <div className="relative h-[520px] w-[520px] shrink-0">
              {rings.map((size) => (
                <div
                  key={size}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-200 dark:border-neutral-800 ${size}`}
                />
              ))}
              <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  animate={reduce ? undefined : { rotate: 360 }}
                  transition={{
                    duration: 90,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="h-full w-full rounded-full border border-dashed border-neutral-300 dark:border-neutral-700"
                />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-lg dark:bg-white dark:text-neutral-900">
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8z" />
                  </svg>
                </span>
              </div>
              {trustChips.map((chip, index) => (
                <div
                  key={chip.label}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${chip.position}`}
                >
                  <motion.span
                    animate={reduce ? undefined : { y: [0, -5, 0] }}
                    transition={{
                      duration: 5.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 1.4,
                    }}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    <ShieldCheck
                      className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400"
                      aria-hidden="true"
                    />
                    {chip.label}
                  </motion.span>
                </div>
              ))}
            </div>
          </div>

          <figure className="px-8 py-8 xl:px-10">
            <blockquote className="max-w-md text-lg font-medium leading-relaxed text-neutral-900 dark:text-neutral-100">
              &ldquo;Access reviews used to eat a week every quarter. Now policy
              enforces itself at sign-in and the audit trail writes
              itself.&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <img
                  src="/svg/placeholder.svg"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
              <span>
                <span className="block text-sm font-medium text-neutral-900 dark:text-white">
                  Maya Okafor
                </span>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                  Head of Platform, Arcline
                </span>
              </span>
            </figcaption>
          </figure>
        </motion.aside>
      </div>
    </section>
  );
}

export default Auth4;

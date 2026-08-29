"use client";

import { Sparkles, Star } from "lucide-react";
import { motion, type Variants } from "motion/react";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const phoneCenter: Variants = {
  hidden: { opacity: 0, y: 90 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const phoneSide: Variants = {
  hidden: { opacity: 0, y: 70 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

function AppleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-6 w-6"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-6 w-6"
    >
      <path d="M5.1 2.7c-.36.25-.6.72-.6 1.35v15.9c0 .63.24 1.1.6 1.35L13.8 12 5.1 2.7Z" />
      <path d="m15.05 10.66 2.39-2.55L7.34 2.7l7.71 7.96Z" />
      <path d="m15.05 13.34-7.71 7.96 10.1-5.41-2.39-2.55Z" />
      <path d="m16.19 12 2.79 2.98 1.01-.54c.68-.37 1.01-.9 1.01-1.44s-.33-1.07-1.01-1.44l-1.01-.54L16.19 12Z" />
    </svg>
  );
}

function QrGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="11"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="5.5"
        y="5.5"
        width="4"
        height="4"
        rx="1.25"
        fill="currentColor"
      />
      <rect
        x="27"
        y="2"
        width="11"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="30.5"
        y="5.5"
        width="4"
        height="4"
        rx="1.25"
        fill="currentColor"
      />
      <rect
        x="2"
        y="27"
        width="11"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="5.5"
        y="30.5"
        width="4"
        height="4"
        rx="1.25"
        fill="currentColor"
      />
      <rect x="17" y="4" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="22" y="8" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="17" y="13" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="16" y="17" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="22" y="17" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="28" y="17" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="34" y="17" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="17" y="22" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="25" y="22" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="31" y="25" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="17" y="28" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="22" y="27" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="27" y="31" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="34" y="30" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="22" y="34" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="31" y="35" width="3" height="3" rx="0.75" fill="currentColor" />
    </svg>
  );
}

const chartBars = [
  { height: "h-[32%]", accent: false },
  { height: "h-[58%]", accent: false },
  { height: "h-[42%]", accent: false },
  { height: "h-[78%]", accent: false },
  { height: "h-[52%]", accent: false },
  { height: "h-full", accent: true },
  { height: "h-[64%]", accent: false },
];

function PhoneFrame({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <div className="h-full w-full rounded-[2.8rem] border border-neutral-800 bg-neutral-900 p-2 shadow-2xl shadow-neutral-900/25 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/60">
      <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-white dark:bg-neutral-950">
        <div className="absolute left-1/2 top-3 h-[22px] w-[76px] -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-800" />
        <div className="flex h-full flex-col gap-4 px-4 pb-6 pt-14">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <span className="flex flex-col gap-1.5">
              <span className="h-2 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <span className="h-2 w-12 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70" />
            </span>
          </div>
          <div className="rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900">
            <span className="block h-2 w-14 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <span className="mt-3 block h-7 w-28 rounded-lg bg-neutral-900 dark:bg-white" />
            <span className="mt-2.5 block h-2 w-20 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </div>
          <div className="flex min-h-24 flex-1 items-end gap-1.5 rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900">
            {chartBars.map((bar, index) => (
              <span
                key={index}
                className={`w-full rounded-full ${bar.height} ${
                  bar.accent
                    ? "bg-neutral-900 dark:bg-white"
                    : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              />
            ))}
          </div>
          <div className="space-y-2">
            {[0, 1].map((row) => (
              <span
                key={row}
                className="flex items-center gap-2.5 rounded-xl bg-neutral-100 px-3 py-3 dark:bg-neutral-900"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span
                  className={`h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 ${
                    row === 0 ? "w-3/4" : "w-1/2"
                  }`}
                />
              </span>
            ))}
          </div>
        </div>
        {dimmed && (
          <div className="absolute inset-0 bg-white/60 dark:bg-neutral-950/60" />
        )}
      </div>
    </div>
  );
}

function StoreBadge({ kind }: { kind: "apple" | "play" }) {
  const isApple = kind === "apple";

  return (
    <motion.a
      href="#"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-neutral-900 px-5 py-3 text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950 sm:w-auto"
    >
      {isApple ? <AppleMark /> : <PlayMark />}
      <span className="flex flex-col items-start">
        <span className="text-[10px] font-medium uppercase leading-none tracking-wide opacity-75">
          {isApple ? "Download on the" : "Get it on"}
        </span>
        <span className="mt-1 text-[15px] font-semibold leading-none">
          {isApple ? "App Store" : "Google Play"}
        </span>
      </span>
    </motion.a>
  );
}

export function Download7() {
  return (
    <section className="relative w-full overflow-hidden bg-white px-4 pb-0 pt-16 dark:bg-neutral-950 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto flex w-full max-w-[1400px] flex-col items-center"
      >
        <motion.div variants={item} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
            Luma
          </span>
        </motion.div>

        <motion.h2
          variants={item}
          className="mt-8 max-w-3xl text-center text-4xl font-semibold tracking-tight text-neutral-900 text-balance dark:text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Deep work, in your pocket.
        </motion.h2>

        <motion.p
          variants={item}
          className="mt-6 max-w-2xl text-center text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg"
        >
          Members reclaim{" "}
          <span className="font-medium text-neutral-900 underline decoration-neutral-300 decoration-2 underline-offset-4 dark:text-white dark:decoration-neutral-600">
            12 focused hours
          </span>{" "}
          every week with gentle nudges, offline notes, and a daily plan that
          fits in one glance.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
        >
          <StoreBadge kind="apple" />
          <StoreBadge kind="play" />
          <span
            aria-hidden="true"
            className="hidden h-9 w-px bg-neutral-200 dark:bg-neutral-800 md:block"
          />
          <div className="hidden items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900 md:flex">
            <QrGlyph className="h-9 w-9 text-neutral-900 dark:text-white" />
            <span className="flex flex-col">
              <span className="text-xs font-medium text-neutral-900 dark:text-white">
                Scan to install
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                iOS &amp; Android
              </span>
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:gap-3"
        >
          <span
            className="flex items-center gap-1 text-neutral-900 dark:text-white"
            aria-label="Rated 4.9 out of 5"
          >
            {[0, 1, 2, 3, 4].map((star) => (
              <Star
                key={star}
                className="h-4 w-4 fill-current"
                aria-hidden="true"
              />
            ))}
          </span>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            4.9 · 40,000+ ratings across both stores
          </span>
        </motion.div>

        <div
          aria-hidden="true"
          className="relative mt-14 h-[440px] w-full max-w-3xl sm:mt-16 sm:h-[540px]"
        >
          <div className="pointer-events-none absolute -bottom-32 left-1/2 h-[420px] w-[720px] max-w-none -translate-x-1/2 rounded-full bg-neutral-200/60 blur-3xl dark:bg-neutral-800/50" />

          <motion.div
            variants={phoneSide}
            style={{ rotate: -7 }}
            className="absolute left-[3%] top-16 z-0 hidden h-[520px] w-[240px] sm:top-20 sm:block md:left-[7%]"
          >
            <PhoneFrame dimmed />
          </motion.div>

          <motion.div
            variants={phoneSide}
            style={{ rotate: 7 }}
            className="absolute right-[3%] top-16 z-0 hidden h-[520px] w-[240px] sm:top-20 sm:block md:right-[7%]"
          >
            <PhoneFrame dimmed />
          </motion.div>

          <motion.div
            variants={phoneCenter}
            style={{ x: "-50%" }}
            className="absolute left-1/2 top-0 z-10 h-[560px] w-[270px] sm:h-[640px] sm:w-[300px]"
          >
            <PhoneFrame />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export default Download7;

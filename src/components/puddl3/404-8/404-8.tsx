"use client";

import { Home, LifeBuoy } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const headerLines = [
  { text: "content-type: text/html; charset=utf-8" },
  { text: "x-request-id: 01J9ZK4W7QD8" },
];

const routes = [
  { path: "/", label: "home" },
  { path: "/docs", label: "documentation" },
  { path: "/support", label: "support" },
];

export default function NotFound8() {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const printout: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.11,
        delayChildren: reduceMotion ? 0 : 0.5,
      },
    },
  };

  const line: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, ease: "linear" } },
  };

  return (
    <section className="w-full min-h-screen flex items-start lg:items-center bg-white dark:bg-neutral-950 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-16 items-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-xl"
        >
          <motion.h1
            variants={item}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.05] text-neutral-900 dark:text-white text-balance"
          >
            Confirmed: this page is gone.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-lg text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 text-pretty"
          >
            We ran the request ourselves: no redirect, no cache, no luck. Pick a
            live route from the printout, or head back home.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <motion.a
              href="/"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-black dark:bg-white px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-white dark:text-black cursor-pointer hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
            >
              <Home className="size-4" />
              Back home
            </motion.a>
            <a
              href="/support"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
            >
              <LifeBuoy className="size-4" />
              Contact support
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl sm:rounded-3xl border border-neutral-800/90 dark:border-neutral-800 bg-neutral-950 shadow-2xl shadow-neutral-900/15 dark:shadow-black/40 overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 sm:px-5 py-3.5">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-xs text-neutral-500">
              nimbus: check-route
            </span>
            <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600">
              bash
            </span>
          </div>

          <motion.div
            variants={printout}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-1.5 p-5 sm:p-7 md:p-8 font-mono text-[12.5px] sm:text-[13px] md:text-sm leading-relaxed"
          >
            <motion.div variants={line} className="flex gap-3">
              <span className="shrink-0 text-neutral-500">$</span>
              <span className="text-neutral-200">
                curl -I https://nimbus.app/workspaces/atlas
              </span>
            </motion.div>

            <motion.div
              variants={line}
              className="mt-3 font-semibold text-white"
            >
              HTTP/2 404
            </motion.div>
            {headerLines.map((header) => (
              <motion.div
                key={header.text}
                variants={line}
                className="text-neutral-500"
              >
                {header.text}
              </motion.div>
            ))}

            <motion.div
              variants={line}
              aria-hidden="true"
              className="my-5 select-none font-semibold leading-none tracking-tight text-white [text-shadow:0_0_28px_rgba(255,255,255,0.25)] text-6xl sm:text-7xl md:text-8xl"
            >
              404
            </motion.div>

            <motion.div variants={line} className="text-neutral-500">
              route not found, nearest live routes:
            </motion.div>
            {routes.map((route) => (
              <motion.div key={route.path} variants={line}>
                <a
                  href={route.path}
                  className="group inline-flex items-center gap-3 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  <span aria-hidden="true" className="text-neutral-600">
                    →
                  </span>
                  <span className="text-neutral-300 underline-offset-4 group-hover:text-white group-hover:underline transition-colors duration-200">
                    {route.path}
                  </span>
                  <span className="text-neutral-600">{route.label}</span>
                </a>
              </motion.div>
            ))}

            <motion.div
              variants={line}
              className="mt-4 flex items-center gap-3"
            >
              <span className="text-neutral-500">$</span>
              <motion.span
                aria-hidden="true"
                animate={reduceMotion ? undefined : { opacity: [1, 1, 0, 0] }}
                transition={{
                  duration: 1.1,
                  times: [0, 0.5, 0.5, 1],
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="h-4 w-2 bg-white"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

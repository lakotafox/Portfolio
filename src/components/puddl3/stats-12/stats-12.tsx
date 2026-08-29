"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useReducedMotion, type Variants } from "motion/react";
import { ShieldCheck, TrendingUp } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const rates = [
  { label: "Meridian Treasury", value: 4.9, width: 100, featured: true },
  { label: "Fintech average", value: 3.1, width: 58, featured: false },
  { label: "National banks", value: 0.4, width: 9, featured: false },
];

const coverage = [
  {
    label: "Meridian Vault",
    value: 3,
    suffix: "M",
    barClass: "h-52 sm:h-60",
    featured: true,
  },
  {
    label: "Industry standard",
    value: 250,
    suffix: "K",
    barClass: "h-16 sm:h-20",
    featured: false,
  },
];

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cellVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: EASE,
      when: "beforeChildren",
      staggerChildren: 0.12,
    },
  },
};

const growX: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.9, ease: EASE } },
};

const growY: Variants = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: { duration: 0.9, ease: EASE } },
};

const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
};

function CountUp({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shouldReduceMotion) {
      el.textContent = value.toFixed(decimals);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.2,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = v.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [value, decimals, shouldReduceMotion]);

  return <span ref={ref}>{(0).toFixed(decimals)}</span>;
}

export default function Stats12() {
  const shouldReduceMotion = useReducedMotion();
  const growXVariants = shouldReduceMotion ? undefined : growX;
  const growYVariants = shouldReduceMotion ? undefined : growY;

  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
        >
          <motion.div
            variants={cellVariants}
            className="flex min-h-[340px] flex-col rounded-3xl bg-neutral-50 dark:bg-neutral-900 p-8 sm:p-10 lg:p-12"
          >
            <div className="flex items-center gap-2.5">
              <TrendingUp
                className="h-4 w-4 text-neutral-500 dark:text-neutral-400"
                aria-hidden="true"
              />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                Grow reserves
              </span>
            </div>
            <h2 className="mt-8 max-w-md text-3xl sm:text-4xl font-medium tracking-tight leading-[1.15] text-neutral-900 dark:text-white">
              Yield that outpaces the market.
            </h2>
            <p className="mt-8 max-w-md text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              Up to 12× the return of a traditional business checking account,
              with same-day liquidity whenever you need it.
            </p>
          </motion.div>

          <motion.div
            variants={cellVariants}
            className="flex min-h-[340px] flex-col rounded-3xl bg-neutral-50 dark:bg-neutral-900 p-8 sm:p-10 lg:p-12"
          >
            <div className="flex flex-1 flex-col justify-center gap-8 sm:gap-9">
              {rates.map((rate) => (
                <div key={rate.label}>
                  <div className="flex items-baseline justify-between gap-6">
                    <span
                      className={
                        rate.featured
                          ? "text-sm sm:text-base font-semibold text-neutral-900 dark:text-white"
                          : "text-sm sm:text-base font-medium text-neutral-500 dark:text-neutral-400"
                      }
                    >
                      {rate.label}
                    </span>
                    <span
                      className={`shrink-0 tabular-nums tracking-tight ${
                        rate.featured
                          ? "text-4xl sm:text-5xl font-semibold text-neutral-900 dark:text-white"
                          : "text-2xl sm:text-3xl font-medium text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      <CountUp value={rate.value} decimals={2} />
                      <span
                        className={
                          rate.featured
                            ? "ml-1 text-xl sm:text-2xl font-medium text-neutral-400 dark:text-neutral-500"
                            : "ml-1 text-base sm:text-lg text-neutral-400 dark:text-neutral-600"
                        }
                      >
                        %
                      </span>
                    </span>
                  </div>
                  <div className="mt-3">
                    <motion.div
                      variants={growXVariants}
                      style={{
                        transformOrigin: "left",
                        width: `${rate.width}%`,
                      }}
                      className={`h-2.5 rounded-full ${
                        rate.featured
                          ? "bg-neutral-900 dark:bg-white"
                          : "bg-neutral-300 dark:bg-neutral-700"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={cellVariants}
            className="flex min-h-[340px] items-center rounded-3xl bg-neutral-50 dark:bg-neutral-900 p-8 sm:p-10 lg:p-12"
          >
            <div className="flex w-full items-end justify-center gap-10 sm:gap-14">
              {coverage.map((col) => (
                <div
                  key={col.label}
                  className="flex w-full max-w-[8.5rem] flex-col items-center"
                >
                  <motion.span
                    variants={fade}
                    className={`mb-4 text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums ${
                      col.featured
                        ? "text-neutral-900 dark:text-white"
                        : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    $<CountUp value={col.value} />
                    {col.suffix}
                  </motion.span>
                  <div className={`w-full ${col.barClass}`}>
                    <motion.div
                      variants={growYVariants}
                      style={{ transformOrigin: "bottom" }}
                      className={`h-full w-full rounded-2xl ${
                        col.featured
                          ? "bg-neutral-900 dark:bg-white"
                          : "bg-neutral-300 dark:bg-neutral-700"
                      }`}
                    />
                  </div>
                  <span className="mt-4 text-center text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {col.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={cellVariants}
            className="flex min-h-[340px] flex-col rounded-3xl bg-neutral-50 dark:bg-neutral-900 p-8 sm:p-10 lg:p-12"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck
                className="h-4 w-4 text-neutral-500 dark:text-neutral-400"
                aria-hidden="true"
              />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                Balance protection
              </span>
            </div>
            <h3 className="mt-8 max-w-md text-3xl sm:text-4xl font-medium tracking-tight leading-[1.15] text-neutral-900 dark:text-white">
              Your balance. Guarded.
            </h3>
            <p className="mt-8 max-w-md text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              Deposits are held bankruptcy-remote across our partner bank
              network, protected up to $3,000,000 per business.
            </p>
            <p className="mt-auto max-w-md pt-10 text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">
              Coverage is provided through program banks and is subject to
              eligibility, policy limits, and the conditions shared at account
              opening.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

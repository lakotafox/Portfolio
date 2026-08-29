"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useReducedMotion, type Variants } from "motion/react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const workflows = [
  {
    label: "Access reviews",
    sub: "Quarterly SOC 2 evidence, collected automatically",
    value: 94,
  },
  {
    label: "Vendor onboarding",
    sub: "Risk scoring, DPAs, and security questionnaires",
    value: 78,
  },
  {
    label: "Policy attestations",
    sub: "Company-wide sign-off with automatic reminders",
    value: 63,
  },
];

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shouldReduceMotion) {
      el.textContent = String(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.2,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value, shouldReduceMotion]);

  return <span ref={ref}>0</span>;
}

function Ring({
  value,
  strokeWidth,
  progressClass,
  className,
  track = true,
  delay = 0,
}: {
  value: number;
  strokeWidth: number;
  progressClass: string;
  className?: string;
  track?: boolean;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const radius = 50 - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <svg
      viewBox="0 0 100 100"
      className={`-rotate-90 ${className ?? ""}`}
      aria-hidden="true"
    >
      {track && (
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-200 dark:text-neutral-800"
        />
      )}
      <motion.circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{
          strokeDashoffset: shouldReduceMotion ? offset : circumference,
        }}
        whileInView={{ strokeDashoffset: offset }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.2, ease: EASE, delay }}
        className={progressClass}
      />
    </svg>
  );
}

export default function Stats15() {
  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight text-neutral-900 dark:text-white">
                The busywork now runs itself.
              </h2>
              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                Sable agents pick up the recurring controls work: reviews,
                onboarding, attestations, and leave an audit trail your team can
                replay.
              </p>
            </motion.div>

            <motion.ul
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-10 border-y border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800"
            >
              {workflows.map((workflow) => (
                <motion.li
                  key={workflow.label}
                  variants={rowVariants}
                  className="flex items-center gap-5 py-6"
                >
                  <div className="h-12 w-12 shrink-0">
                    <Ring
                      value={workflow.value}
                      strokeWidth={9}
                      className="h-full w-full"
                      progressClass="text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                      {workflow.label}
                    </h3>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                      {workflow.sub}
                    </p>
                  </div>
                  <div className="shrink-0 text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-neutral-900 dark:text-white">
                    <CountUp value={workflow.value} />
                    <span className="ml-0.5 text-base font-medium text-neutral-400 dark:text-neutral-500">
                      %
                    </span>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="relative mx-auto w-full max-w-[20rem] sm:max-w-[24rem]">
              <Ring
                value={82}
                strokeWidth={5}
                className="h-auto w-full"
                progressClass="text-neutral-900 dark:text-white"
              />
              <Ring
                value={54}
                strokeWidth={2.5}
                track={false}
                delay={0.2}
                className="absolute left-1/2 top-1/2 w-[76%] -translate-x-1/2 -translate-y-1/2"
                progressClass="text-neutral-400 dark:text-neutral-600"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl sm:text-7xl font-semibold tracking-tight tabular-nums text-neutral-900 dark:text-white">
                  <CountUp value={82} />
                  <span className="text-3xl sm:text-4xl font-medium text-neutral-400 dark:text-neutral-500">
                    %
                  </span>
                </div>
                <p className="mt-2 max-w-[11rem] text-center text-sm text-neutral-500 dark:text-neutral-400">
                  of routine controls run unattended
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white" />
                <span className="text-sm font-medium tabular-nums text-neutral-600 dark:text-neutral-400">
                  2025 · 82%
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                <span className="text-sm font-medium tabular-nums text-neutral-600 dark:text-neutral-400">
                  2024 · 54%
                </span>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-500">
              Measured across 1,842 active workspaces
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

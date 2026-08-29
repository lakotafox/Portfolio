"use client";

import { motion } from "motion/react";

const steps = [
  { n: 1, label: "Create your account" },
  { n: 2, label: "Invite your team" },
  { n: 3, label: "Start shipping" },
];

export default function Pricing11() {
  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-center py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="relative max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 items-stretch">
          <motion.article
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl bg-neutral-100 dark:bg-neutral-900 p-6 sm:p-8 md:p-10 lg:p-14 md:pr-40 lg:pr-48 xl:pr-56 h-[380px] md:h-[440px] lg:h-[480px] flex flex-col justify-center"
          >
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-neutral-900 dark:text-white leading-[1.1] tracking-tight">
              Up and running
              <br />
              in minutes
            </h3>

            <div className="mt-6 sm:mt-8 space-y-3 max-w-sm">
              {steps.map((s) => (
                <div
                  key={s.n}
                  className="flex items-center gap-4 rounded-xl bg-white dark:bg-neutral-800 px-4 py-3"
                >
                  <span className="text-sm text-neutral-500 dark:text-neutral-500 w-4 tabular-nums">
                    {s.n}
                  </span>
                  <span className="text-sm text-neutral-900 dark:text-white">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl bg-neutral-900 dark:bg-neutral-900 p-6 sm:p-8 md:p-10 lg:p-14 md:pl-40 lg:pl-48 xl:pl-56 h-[380px] md:h-[440px] lg:h-[480px] flex flex-col justify-center"
          >
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white leading-[1.1] tracking-tight">
              Simple, flat
              <br />
              pricing.
            </h3>

            <div className="mt-6">
              <p className="text-6xl sm:text-7xl font-serif text-white leading-none">
                $49
              </p>
              <p className="mt-2 text-sm text-neutral-400">
                Per month, per seat
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-8 w-fit px-6 py-2.5 rounded-full bg-white text-neutral-900 text-sm font-medium cursor-pointer"
            >
              Start free trial
            </motion.button>
          </motion.article>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] md:w-[220px] lg:w-[270px] xl:w-[300px] aspect-9/19 rounded-[2.5rem] lg:rounded-[3rem] bg-neutral-200 dark:bg-neutral-800 border-8 lg:border-10 border-neutral-900 dark:border-neutral-950 overflow-hidden z-10 shadow-2xl"
        >
          <img
            src="/svg/placeholder.svg"
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}

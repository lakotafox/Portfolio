"use client";

import { motion } from "motion/react";

export default function Download5() {
  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start sm:items-center py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col items-center text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 dark:text-white tracking-tight leading-[1.05] max-w-4xl"
        >
          Your whole studio,
          <br />
          one quiet app.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 max-w-xl text-base sm:text-lg text-neutral-600 dark:text-neutral-400"
        >
          Haven is a native desktop workspace for focused work. Notes, tasks,
          and canvases in one place: no tabs, no clutter, no distractions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-stretch gap-4 w-full sm:w-auto"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-3 px-7 sm:px-9 py-4 sm:py-5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-base sm:text-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Download Haven for Mac
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-3 px-7 sm:px-9 py-4 sm:py-5 rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 text-base sm:text-lg font-medium hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 5.479 11.049 4.37v8.03H3zM3 19.521 11.049 20.63v-7.962H3zM12.039 4.229 22.751 2.75v9.65H12.039zM12.039 12.668h10.712v9.65L12.039 20.771z" />
            </svg>
            Download Haven for Windows
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-xs sm:text-sm tracking-[0.15em] uppercase text-neutral-500 dark:text-neutral-500"
        >
          Also on{" "}
          <a
            href="#"
            className="text-neutral-700 dark:text-neutral-300 underline decoration-dashed underline-offset-4"
          >
            iOS
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="text-neutral-700 dark:text-neutral-300 underline decoration-dashed underline-offset-4"
          >
            Android
          </a>
          . Free for 30 days, no card required.
        </motion.p>
      </div>
    </section>
  );
}

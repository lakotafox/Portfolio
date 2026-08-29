"use client";

import { motion, type Variants } from "motion/react";
import { ArrowRight, Ban, Check } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const tradeoffs = [
  {
    old: "Status compiled by hand every Friday afternoon",
    next: "Narrative updates drafted from live work",
  },
  {
    old: "Decisions buried across chat threads and slide decks",
    next: "Every decision logged with an owner and a date",
  },
  {
    old: "Forecasts rebuilt for each leadership review",
    next: "Rolling forecasts that move with scope",
  },
  {
    old: "Blockers surfacing after the date is public",
    next: "Dependency warnings weeks ahead of the slip",
  },
  {
    old: "Approvals living in private messages",
    next: "Auditable sign-offs with full context attached",
  },
  {
    old: "A separate tool for every team",
    next: "One operating layer, permissioned by team",
  },
];

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function Comparison6() {
  return (
    <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mb-12 max-w-3xl text-center sm:mb-16"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            The switch, itemized
          </p>
          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            <span className="text-neutral-500 dark:text-neutral-500">
              Stop settling for
            </span>{" "}
            <span className="text-neutral-950 dark:text-white">
              the usual stack.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-400">
            Ledgerlane replaces stitched-together rituals with one live
            operating record. Here is the trade, line by line.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: EASE }}
          className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl shadow-neutral-950/5 dark:border-white/10 dark:bg-neutral-900 dark:shadow-black/40"
        >
          <div className="hidden border-b border-neutral-200 md:grid md:grid-cols-2 dark:border-white/10">
            <div className="flex items-center gap-2.5 border-r border-neutral-200 bg-neutral-50 px-6 py-5 lg:px-8 dark:border-white/10 dark:bg-neutral-950/40">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                <Ban className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                The usual stack
              </span>
            </div>
            <div className="flex items-center gap-2.5 px-6 py-5 lg:px-8">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-neutral-950 dark:bg-white" />
              <span className="text-sm font-semibold text-neutral-950 dark:text-white">
                Ledgerlane
              </span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-white/10 dark:text-neutral-400">
                Live system
              </span>
            </div>
          </div>

          <motion.div
            variants={listVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="divide-y divide-neutral-200 dark:divide-white/10"
          >
            {tradeoffs.map((item) => (
              <motion.div
                key={item.next}
                variants={rowVariants}
                className="grid md:grid-cols-2"
              >
                <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-5 md:border-b-0 md:border-r md:py-6 lg:px-8 dark:border-white/10 dark:bg-neutral-950/40">
                  <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500 md:hidden dark:text-neutral-400">
                    The usual stack
                  </span>
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                      <Ban className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-sm leading-relaxed text-neutral-500 sm:text-base dark:text-neutral-400">
                      {item.old}
                    </p>
                  </div>
                </div>
                <div className="px-6 py-5 md:py-6 lg:px-8">
                  <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500 md:hidden dark:text-neutral-400">
                    Ledgerlane
                  </span>
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <p className="text-sm font-medium leading-relaxed text-neutral-900 sm:text-base dark:text-white">
                      {item.next}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="flex flex-col gap-3 border-t border-neutral-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8 dark:border-white/10">
            <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              Median results from 40-person rollouts, 2025–26 cohort.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-950 transition-colors hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white dark:hover:text-neutral-300 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900"
            >
              Read the migration guide
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowUpRight } from "lucide-react";

interface Chapter {
  year: string;
  title: string;
  detail: string;
  imageAspect?: string;
  imageAlt?: string;
  chips?: string[];
}

const chapters: Chapter[] = [
  {
    year: "2021",
    title: "Field notes before a name",
    detail:
      "We spent a year embedded with operations teams in climate, logistics, and care: nine hundred pages of notes before we wrote a single line of product.",
    imageAspect: "aspect-[16/9]",
    imageAlt: "Early research sessions with operations teams",
  },
  {
    year: "2022",
    title: "The studio takes shape",
    detail:
      "Six senior practitioners, one room in Rotterdam, and a rule we still keep: every method gets tested inside a real team before it earns a name.",
  },
  {
    year: "2024",
    title: "Programs go global",
    detail:
      "Embedded engagements across five time zones and three operating models: proof that deliberate practice travels better than process ever did.",
    imageAspect: "aspect-[21/9]",
    imageAlt: "Distributed program teams working across regions",
  },
  {
    year: "2026",
    title: "The practice library",
    detail:
      "Our strongest methods, versioned like software and handed to every customer team, so the work keeps improving long after we leave the room.",
    chips: ["Decision journals", "Ritual kits", "Operating memos"],
  },
];

const meta = [
  { value: "05", label: "Years in practice" },
  { value: "40+", label: "Embedded programs" },
];

export default function About11() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const timeline: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.14 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const rail: Variants = {
    hidden: { scaleY: reduce ? 1 : 0 },
    visible: {
      scaleY: 1,
      transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20 items-start">
          <div className="lg:sticky lg:top-24">
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.p
                variants={item}
                className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-500"
              >
                Our story so far
              </motion.p>
              <motion.h2
                variants={item}
                className="mt-5 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-[-0.03em] leading-[1.08] text-neutral-950 dark:text-white [text-wrap:balance]"
              >
                Progress came from staying with the problem.
              </motion.h2>
              <motion.p
                variants={item}
                className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 [text-wrap:pretty]"
              >
                We grew slowly on purpose. Every capability we ship stays tied
                to a real team, a real ritual, and a measurable shift in how
                decisions get made.
              </motion.p>
              <motion.div variants={item} className="mt-8">
                <motion.a
                  href="#"
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
                >
                  Read the operating memo
                  <ArrowUpRight className="h-4 w-4" />
                </motion.a>
              </motion.div>
              <motion.div
                variants={item}
                className="mt-10 flex gap-10 border-t border-neutral-200 pt-6 dark:border-neutral-800"
              >
                {meta.map((entry) => (
                  <div key={entry.label}>
                    <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                      {entry.value}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {entry.label}
                    </p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            variants={timeline}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="relative"
          >
            <motion.div
              variants={rail}
              className="absolute left-[5px] top-1.5 bottom-1.5 w-px origin-top bg-neutral-200 dark:bg-neutral-800"
            />
            <div className="space-y-14 sm:space-y-16">
              {chapters.map((chapter) => (
                <motion.article
                  key={chapter.year}
                  variants={item}
                  className="relative pl-10 sm:pl-14"
                >
                  <span className="absolute left-0 top-0.5 h-[11px] w-[11px] rounded-full bg-neutral-950 ring-4 ring-white dark:bg-white dark:ring-neutral-950" />
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-500">
                    {chapter.year}
                  </p>
                  <h3 className="mt-3 text-xl sm:text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                    {chapter.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 [text-wrap:pretty]">
                    {chapter.detail}
                  </p>
                  {chapter.imageAspect && (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                      <img
                        src="/svg/placeholder.svg"
                        alt={chapter.imageAlt ?? chapter.title}
                        className={`${chapter.imageAspect} w-full object-cover`}
                      />
                    </div>
                  )}
                  {chapter.chips && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {chapter.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.article>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

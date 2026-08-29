"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Story = {
  label: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
};

const stories: Story[] = [
  {
    label: "Craft",
    title: "Rebuilding our motion system, one easing curve at a time",
    excerpt:
      "Why we retired every spring in the product and replaced them with a single, calmer easing language.",
    date: "Jul 02, 2026",
    readTime: "6 min read",
  },
  {
    label: "Process",
    title: "Inside the review room where templates earn a release",
    excerpt:
      "The four passes we run for spacing, responsiveness, accessibility, and motion before anything ships.",
    date: "Jun 20, 2026",
    readTime: "4 min read",
  },
  {
    label: "Field notes",
    title: "Why our sharpest prototypes start with fewer options",
    excerpt:
      "Reducing choices early makes the final interface feel more considered, not smaller. A note on constraints.",
    date: "Jun 09, 2026",
    readTime: "5 min read",
  },
];

export function Blog9() {
  const reduce = useReducedMotion();

  const stagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };

  const zoom: Variants = {
    hover: { scale: reduce ? 1 : 1.05 },
  };

  const nudge: Variants = {
    hover: { x: reduce ? 0 : 2, y: reduce ? 0 : -2 },
  };

  return (
    <section className="w-full bg-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div
            variants={fadeUp}
            className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10"
          >
            <div className="max-w-2xl">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white text-balance">
                New from the studio
              </h2>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 text-pretty">
                Three recent essays on the decisions behind the interface: what
                shipped, what stalled, and what we&apos;d do differently.
              </p>
            </div>

            <a
              href="#"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900 dark:focus-visible:ring-white/30 sm:w-auto"
            >
              All posts
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.div
            variants={stagger}
            className="mt-12 grid grid-cols-1 gap-10 sm:mt-16 md:grid-cols-3 md:gap-8 lg:gap-10"
          >
            {stories.map((story) => (
              <motion.a
                key={story.title}
                href="#"
                variants={fadeUp}
                whileHover="hover"
                className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 dark:focus-visible:ring-white/30"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-900">
                  <motion.img
                    src="/svg/placeholder.svg"
                    alt=""
                    loading="lazy"
                    variants={zoom}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/70 bg-white/90 p-3.5 backdrop-blur dark:border-white/10 dark:bg-neutral-950/85">
                    <span className="min-w-0 truncate text-sm font-medium text-neutral-900 dark:text-white">
                      {story.label}
                    </span>
                    <motion.span
                      variants={nudge}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </motion.span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2.5 text-xs text-neutral-500 dark:text-neutral-500">
                  <span>{story.date}</span>
                  <span className="h-1 w-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  <span>{story.readTime}</span>
                </div>
                <h3 className="mt-3 text-xl lg:text-2xl font-medium leading-snug tracking-tight text-neutral-900 transition-colors duration-200 group-hover:text-neutral-600 dark:text-white dark:group-hover:text-neutral-300 text-balance">
                  {story.title}
                </h3>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {story.excerpt}
                </p>
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Blog9;

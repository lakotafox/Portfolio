"use client";

import { useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { Search, SearchX } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Category = "New feature" | "Improvements" | "Security" | "Company";

type Update = {
  category: Category;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
};

const filters: ("All" | Category)[] = [
  "All",
  "New feature",
  "Improvements",
  "Security",
  "Company",
];

const updates: Update[] = [
  {
    category: "New feature",
    title: "Meridian cards now ship across the European Union",
    excerpt:
      "Order a physical card from 27 countries, or add a virtual one to Apple Pay in seconds: no branch, no paperwork.",
    date: "Jul 02, 2026",
    readTime: "4 min read",
  },
  {
    category: "Improvements",
    title: "A faster, quieter dashboard for high-volume teams",
    excerpt:
      "We rebuilt the ledger view from the ground up. Balances, transfers, and reconciliations now load in under a second.",
    date: "Jun 24, 2026",
    readTime: "5 min read",
  },
  {
    category: "Security",
    title: "Meridian is now SOC 2 Type II certified",
    excerpt:
      "Independently audited controls across every plan, so your finance and security teams can move without second-guessing.",
    date: "Jun 12, 2026",
    readTime: "3 min read",
  },
  {
    category: "New feature",
    title: "Scoped virtual cards for every vendor on your list",
    excerpt:
      "Set per-merchant limits, freeze in one tap, and expire automatically. Spend controls that finally match how teams work.",
    date: "May 30, 2026",
    readTime: "6 min read",
  },
  {
    category: "Improvements",
    title: "Smarter alerts that only surface what matters",
    excerpt:
      "Fewer notifications, sharper signal. Meridian now groups routine activity and escalates the handful that need you.",
    date: "May 18, 2026",
    readTime: "4 min read",
  },
  {
    category: "Company",
    title: "Welcoming Priya Raman as our Head of Payments",
    excerpt:
      "A note on the next chapter of Meridian, and the person we've asked to lead how money moves across the platform.",
    date: "May 06, 2026",
    readTime: "2 min read",
  },
];

export function Blog8() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return updates.filter((u) => {
      const byCategory = active === "All" || u.category === active;
      const byQuery =
        q.length === 0 ||
        `${u.title} ${u.excerpt} ${u.category}`.toLowerCase().includes(q);
      return byCategory && byQuery;
    });
  }, [active, query]);

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

  return (
    <section className="w-full bg-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div variants={fadeUp} className="max-w-2xl">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white text-balance">
              Latest updates
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 text-pretty">
              Everything we ship at Meridian, written for the people who move
              money every day.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div
              role="group"
              aria-label="Filter updates by category"
              className="flex w-full items-center gap-1 overflow-x-auto rounded-full bg-neutral-100 p-1 dark:bg-neutral-900 sm:w-fit"
            >
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActive(filter)}
                  aria-pressed={active === filter}
                  className="relative shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 dark:focus-visible:ring-white/30"
                >
                  {active === filter && (
                    <motion.span
                      layoutId="blog8-active-filter"
                      transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
                      className="absolute inset-0 rounded-full bg-neutral-900 dark:bg-white"
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors duration-200 ${
                      active === filter
                        ? "text-white dark:text-neutral-900"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    }`}
                  >
                    {filter}
                  </span>
                </button>
              ))}
            </div>

            <label className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 dark:text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search updates"
                aria-label="Search updates"
                className="h-11 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-11 pr-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-500 focus:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white dark:focus-visible:ring-white/10"
              />
            </label>
          </motion.div>

          <motion.div variants={fadeUp}>
            <p
              aria-live="polite"
              className="mt-10 text-sm text-neutral-500 dark:text-neutral-500"
            >
              Showing{" "}
              <span className="font-medium text-neutral-900 dark:text-white">
                {visible.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-neutral-900 dark:text-white">
                {updates.length}
              </span>{" "}
              updates
            </p>

            {visible.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 py-20 text-center dark:border-neutral-800"
              >
                <SearchX className="h-8 w-8 text-neutral-400 dark:text-neutral-600" />
                <p className="mt-4 text-base font-medium text-neutral-900 dark:text-white">
                  Nothing matches that yet
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
                  Try a different keyword or reset your view.
                </p>
                <button
                  onClick={() => {
                    setActive("All");
                    setQuery("");
                  }}
                  className="mt-6 cursor-pointer rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900 dark:focus-visible:ring-white/30"
                >
                  Reset filters
                </button>
              </motion.div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {visible.map((update) => (
                    <motion.article
                      key={update.title}
                      layout
                      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                      transition={{
                        layout: { duration: reduce ? 0 : 0.4, ease: EASE },
                        opacity: { duration: 0.25 },
                        y: { duration: 0.35, ease: EASE },
                      }}
                    >
                      <motion.a
                        href="#"
                        whileHover="hover"
                        className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 dark:focus-visible:ring-white/30"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
                          <motion.img
                            src="/svg/placeholder.svg"
                            alt=""
                            loading="lazy"
                            variants={zoom}
                            transition={{ duration: 0.45, ease: EASE }}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-900 shadow-sm backdrop-blur dark:bg-neutral-950/80 dark:text-white">
                            {update.category}
                          </span>
                        </div>

                        <div className="mt-5 flex items-center gap-2.5 text-xs text-neutral-500 dark:text-neutral-500">
                          <span>{update.date}</span>
                          <span className="h-1 w-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                          <span>{update.readTime}</span>
                        </div>
                        <h3 className="mt-2.5 text-lg sm:text-xl font-semibold leading-snug tracking-tight text-neutral-900 transition-colors duration-200 group-hover:text-neutral-600 dark:text-white dark:group-hover:text-neutral-300 text-balance">
                          {update.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {update.excerpt}
                        </p>
                      </motion.a>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Blog8;

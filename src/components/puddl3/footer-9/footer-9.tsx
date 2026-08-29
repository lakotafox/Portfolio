"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { Github, Instagram, Linkedin, Youtube } from "lucide-react";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950";

const columns: { title: string; links: { label: string; badge?: string }[] }[] =
  [
    {
      title: "Company",
      links: [
        { label: "About" },
        { label: "Journal" },
        { label: "Careers" },
        { label: "Newsroom" },
        { label: "Contact" },
      ],
    },
    {
      title: "Platform",
      links: [
        { label: "Pricing" },
        { label: "Prototype tests" },
        { label: "Live interviews", badge: "New" },
        { label: "Session replay" },
        { label: "Surveys" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Field guides" },
        { label: "Research library" },
        { label: "Events" },
        { label: "Templates" },
        { label: "Help center" },
      ],
    },
    {
      title: "Use cases",
      links: [
        { label: "Validate concepts" },
        { label: "Test navigation" },
        { label: "Measure sentiment" },
        { label: "Benchmark journeys" },
      ],
    },
  ];

const socials = [
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Instagram, label: "Instagram" },
  { icon: Youtube, label: "YouTube" },
  { icon: Github, label: "GitHub" },
];

const legal = ["Privacy", "Terms", "Security", "Cookies"];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Footer9() {
  const reduce = useReducedMotion();

  return (
    <footer className="w-full overflow-hidden bg-white px-4 py-16 dark:bg-neutral-950 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <motion.div
        variants={container}
        initial={reduce ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto w-full max-w-[1400px]"
      >
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20">
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
            {columns.map((column) => (
              <motion.nav
                key={column.title}
                variants={item}
                aria-label={column.title}
                className="min-w-0"
              >
                <h3 className="mb-6 inline-flex rounded-md bg-neutral-200/70 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-400">
                  {column.title}
                </h3>
                <ul className="space-y-3.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href="#"
                        className={`inline-flex items-center gap-2 rounded-sm text-[15px] text-neutral-700 transition-colors duration-200 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white ${focusRing}`}
                      >
                        {link.label}
                        {link.badge && (
                          <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-white dark:bg-white dark:text-neutral-900">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.nav>
            ))}
          </div>

          <motion.div variants={item} className="flex flex-col gap-4">
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
              <div className="h-40 overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <img
                  src="/svg/placeholder.svg"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                Sign up for the field guide
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Research patterns and testing rituals from real product teams.
                Two issues a month, no noise.
              </p>
              <form
                className="mt-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => e.preventDefault()}
              >
                <label htmlFor="footer-9-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-9-email"
                  type="email"
                  placeholder="Enter your email"
                  className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus-visible:ring-white"
                />
                <button
                  type="submit"
                  className="cursor-pointer rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-900"
                >
                  Subscribe
                </button>
              </form>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-3xl border border-transparent bg-neutral-900 px-6 py-4 dark:border-neutral-800">
              <span className="text-sm font-medium text-white">Follow us</span>
              <div className="flex items-center gap-1">
                {socials.map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={item}
          aria-hidden="true"
          className="mt-14 select-none sm:mt-20"
        >
          <svg
            viewBox="0 0 720 170"
            className="h-auto w-full"
            focusable="false"
          >
            <text
              x="360"
              y="164"
              textAnchor="middle"
              textLength="712"
              lengthAdjust="spacingAndGlyphs"
              className="fill-neutral-900 font-sans dark:fill-white"
              style={{
                fontSize: "214px",
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              fathom
            </text>
          </svg>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-8 flex flex-col gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-500">
            © 2026 Fathom Research
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            {legal.map((link) => (
              <a
                key={link}
                href="#"
                className={`rounded-sm text-xs font-medium uppercase tracking-[0.08em] text-neutral-500 transition-colors duration-200 hover:text-neutral-950 dark:text-neutral-500 dark:hover:text-white ${focusRing}`}
              >
                {link}
              </a>
            ))}
          </nav>
        </motion.div>
      </motion.div>
    </footer>
  );
}

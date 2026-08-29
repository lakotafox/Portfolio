"use client";

import { ArrowDown, ArrowUpRight, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

function AppleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function WindowsMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 5.479 11.049 4.37v8.03H3zM3 19.521 11.049 20.63v-7.962H3zM12.039 4.229 22.751 2.75v9.65H12.039zM12.039 12.668h10.712v9.65L12.039 20.771z" />
    </svg>
  );
}

function LinuxMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.2 2.25c-2.28 0-3.56 1.42-3.56 3.88 0 1.31-.25 2.3-.78 3.16-.32.51-.71 1.03-1.12 1.58-1.03 1.38-2.18 2.92-2.45 5.34-.11.98.28 1.84 1.06 2.37.2.14.42.25.65.34-.19.36-.27.75-.2 1.15.15.85.93 1.43 1.82 1.43.73 0 1.41-.36 1.92-.91.6.2 1.42.31 2.46.31.95 0 1.77-.09 2.41-.27.51.53 1.18.87 1.9.87.89 0 1.67-.58 1.82-1.43.07-.39 0-.78-.19-1.13.3-.1.58-.24.84-.43.76-.56 1.11-1.43.97-2.39-.35-2.42-1.5-3.91-2.52-5.23-.42-.55-.82-1.06-1.14-1.59-.53-.87-.78-1.88-.78-3.16 0-2.42-1.22-3.89-3.11-3.89Zm-.1 1.65c.93 0 1.54.69 1.54 2.25 0 1.58.32 2.9 1.02 4.05.39.64.84 1.23 1.28 1.81.93 1.22 1.81 2.38 2.08 4.36.06.38-.05.61-.27.77-.31.23-.88.31-1.44.14l-.8-.24-.22.81c-.18.66-.67 1.15-1.2 1.36-.49.2-1.19.29-2.09.29-1.01 0-1.75-.11-2.2-.33-.52-.25-.98-.72-1.15-1.32l-.22-.79-.78.23c-.51.15-.99.08-1.27-.11-.22-.15-.33-.37-.29-.76.22-1.99 1.1-3.18 2.04-4.45.44-.59.9-1.21 1.29-1.84.69-1.12 1.01-2.42 1.01-3.99 0-1.6.61-2.25 1.87-2.25Z" />
    </svg>
  );
}

const builds = [
  {
    name: "macOS",
    detail: "Universal · Apple silicon + Intel",
    requirement: "macOS 13+",
    size: "148 MB",
    mark: AppleMark,
  },
  {
    name: "Windows",
    detail: "MSI installer · x64 + ARM64",
    requirement: "Windows 11+",
    size: "172 MB",
    mark: WindowsMark,
  },
  {
    name: "Linux",
    detail: "AppImage · deb · rpm",
    requirement: "glibc 2.31+",
    size: "154 MB",
    mark: LinuxMark,
  },
];

const changelog = [
  {
    tag: "Perf",
    note: "Cold launch is 2.4× faster on multi-window workspaces",
  },
  {
    tag: "Sync",
    note: "Offline patch queue survives strict enterprise proxies",
  },
  {
    tag: "Safety",
    note: "Signed rollbacks protect against interrupted updates",
  },
];

export function Download6() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative w-full overflow-hidden bg-white px-4 py-16 dark:bg-neutral-950 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 xl:gap-20"
      >
        <div>
          <motion.p
            variants={item}
            className="flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400"
          >
            <span className="relative flex h-1.5 w-1.5">
              {!reduceMotion && (
                <motion.span
                  aria-hidden="true"
                  className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                  animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              )}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            </span>
            Northstar Desktop · Stable channel
          </motion.p>

          <motion.h2
            variants={item}
            className="mt-6 max-w-xl text-3xl font-medium tracking-tight text-neutral-900 text-balance dark:text-white sm:text-4xl lg:text-5xl xl:text-6xl"
          >
            A desktop release your whole fleet can trust.
          </motion.h2>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg"
          >
            Northstar ships notarized, reproducible builds for every platform:
            silent updates, signed rollbacks, and release notes written for the
            operators who deploy them.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <a
              href="#"
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950 sm:w-auto"
            >
              <AppleMark className="h-5 w-5" />
              Download for macOS
            </a>
            <a
              href="#"
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-900 dark:focus-visible:ring-white/30 sm:w-auto"
            >
              Release notes
            </a>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-6 font-mono text-xs text-neutral-500 dark:text-neutral-500"
          >
            v4.8.2 · universal binary · 148 MB · requires macOS 13+
          </motion.p>

          <motion.div
            variants={item}
            className="mt-10 flex items-center gap-2.5 border-t border-neutral-200 pt-6 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
          >
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-neutral-900 dark:text-white"
              aria-hidden="true"
            />
            Signed with the Northstar release key: rotated quarterly, published
            openly.
          </motion.div>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-8 -inset-y-10 bg-[radial-gradient(circle_at_1px_1px,rgba(23,23,23,0.07)_1px,transparent_0)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_65%_65%_at_50%_50%,black,transparent)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(245,245,245,0.08)_1px,transparent_0)]"
          />

          <motion.div
            variants={item}
            className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 px-6 py-5 dark:border-neutral-800 sm:px-7">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Latest release
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
                    Northstar 4.8.2
                  </h3>
                </div>
                <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-medium leading-none text-white dark:bg-white dark:text-neutral-900">
                  Latest
                </span>
              </div>
              <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 font-mono text-[11px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400">
                2026-06-24
              </span>
            </div>

            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {builds.map((build) => (
                <li key={build.name}>
                  <a
                    href="#"
                    className="group flex cursor-pointer items-center gap-4 px-6 py-5 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-900/20 dark:hover:bg-neutral-800/40 dark:focus-visible:ring-white/30 sm:px-7"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white">
                      <build.mark className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-neutral-900 dark:text-white">
                        {build.name}
                      </span>
                      <span className="mt-0.5 block text-sm text-neutral-500 dark:text-neutral-400">
                        {build.detail}
                      </span>
                    </span>
                    <span className="hidden text-right sm:block">
                      <span className="block font-mono text-[13px] text-neutral-900 dark:text-white">
                        {build.size}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-neutral-500 dark:text-neutral-500">
                        {build.requirement}
                      </span>
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 transition-colors group-hover:border-neutral-900 group-hover:bg-neutral-900 group-hover:text-white dark:border-neutral-600 dark:text-white dark:group-hover:border-white dark:group-hover:bg-white dark:group-hover:text-neutral-900">
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-white/60 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-950/40 sm:px-7">
              <p className="truncate font-mono text-[11px] text-neutral-500 dark:text-neutral-500">
                sha256 · 9f2c 71ee 03af b8d4 … 6e81
              </p>
              <a
                href="#"
                className="inline-flex cursor-pointer items-center gap-1 rounded-sm text-xs font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 dark:text-white dark:hover:text-neutral-300 dark:focus-visible:ring-white/30"
              >
                Verify checksums
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            className="relative mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                What&apos;s new
              </p>
              <a
                href="#"
                className="inline-flex cursor-pointer items-center gap-1 rounded-sm text-xs font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 dark:text-white dark:hover:text-neutral-300 dark:focus-visible:ring-white/30"
              >
                Full changelog
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
            <ul className="mt-4 space-y-3">
              {changelog.map((entry) => (
                <li
                  key={entry.tag}
                  className="flex items-baseline gap-3 text-sm"
                >
                  <span className="w-14 shrink-0 font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                    {entry.tag}
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {entry.note}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export default Download6;

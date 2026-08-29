"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Menu, Sparkle, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const SPRING = { type: "spring" as const, bounce: 0, duration: 0.35 };
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];

const LINKS = ["Product", "Customers", "Pricing", "Docs"];

const SECTIONS = [
  {
    id: "Product",
    heading: "One workspace for the whole release",
    body: "Plan, review and ship from a single timeline. Every change carries its own context, so nobody has to reconstruct the story later.",
  },
  {
    id: "Customers",
    heading: "Teams that ship weekly",
    body: "Harbor Coffee, Cedar Labs and Northwind run their release process here. Median cycle time dropped by a third in the first quarter.",
  },
  {
    id: "Pricing",
    heading: "Priced per released change",
    body: "No seat minimums and no upgrade gate on collaborators. You pay for what actually reaches production.",
  },
  {
    id: "Docs",
    heading: "Start in under five minutes",
    body: "Install the CLI, point it at a repository, and the first release timeline builds itself from your existing history.",
  },
];

export default function Navbar12() {
  const reduce = useReducedMotion();
  const uid = useId();
  const [active, setActive] = useState("Product");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const doc = rootRef.current?.ownerDocument;
    if (!doc) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
    };
    doc.addEventListener("keydown", onKeyDown);
    return () => doc.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[480px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
        <header
          className={cx(
            "pointer-events-auto flex h-12 w-full max-w-[680px] items-center gap-2 rounded-[var(--rb-r-2xl,14px)] border px-2 backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
            scrolled
              ? "border-neutral-200 bg-white/80 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-950/80"
              : "border-transparent bg-white/60 dark:bg-neutral-950/60",
          )}
        >
          <a
            href="#"
            className={cx(
              "inline-flex shrink-0 items-center gap-2 rounded-[var(--rb-r-md,8px)] pr-1 pl-1.5",
              focus,
            )}
          >
            <span
              aria-hidden
              className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
            >
              <Sparkle className="h-3.5 w-3.5" />
            </span>
            <span className="text-[14px] font-semibold tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
              Halcyon
            </span>
          </a>

          <nav
            aria-label="Primary"
            className="mx-auto hidden items-center gap-0.5 sm:flex"
          >
            {LINKS.map((l) => (
              <button
                key={l}
                type="button"
                aria-current={l === active ? "page" : undefined}
                onClick={() => setActive(l)}
                className={cx(
                  "relative inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium",
                  transition,
                  focus,
                  l === active
                    ? "text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                )}
              >
                {l === active && (
                  <motion.span
                    aria-hidden
                    layoutId={`${uid}-nav`}
                    transition={reduce ? { duration: 0 } : SPRING}
                    className="absolute inset-0 rounded-[var(--rb-r-md,8px)] bg-neutral-900/[0.06] dark:bg-white/10"
                  />
                )}
                <span className="relative">{l}</span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            className={cx(
              "ml-auto hidden h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] sm:inline-flex dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
              transition,
              focus,
            )}
          >
            Get started
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={cx(
              "ml-auto inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-600 hover:bg-neutral-900/[0.06] hover:text-neutral-900 sm:hidden dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            <Menu className="h-4 w-4" />
          </button>
        </header>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[680px] px-5 pt-24 pb-10">
          <p className="text-[12px] tracking-[0.08em] text-neutral-400 uppercase">
            {section.id}
          </p>
          <h1 className="mt-2 text-[28px] leading-[1.15] font-medium tracking-[-0.03em] text-neutral-900 sm:text-[34px] dark:text-neutral-100">
            {section.heading}
          </h1>
          <p className="mt-3 max-w-[52ch] text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            {section.body}
          </p>
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[110px] rounded-[var(--rb-r-2xl,14px)] bg-neutral-50 dark:bg-neutral-900/60"
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              aria-hidden
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0.16, ease: EASE_OUT },
              }}
              transition={{ duration: 0.24, ease: EASE_OUT }}
              className="absolute inset-0 z-30 bg-neutral-950/40 sm:hidden"
            />
            <motion.div
              initial={
                reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduce
                  ? { opacity: 0, transition: { duration: 0.14 } }
                  : {
                      opacity: 0,
                      y: -8,
                      scale: 0.98,
                      transition: { duration: 0.16, ease: EASE_OUT },
                    }
              }
              transition={{ duration: 0.26, ease: EASE_DRAWER }}
              className="absolute inset-x-3 top-3 z-40 origin-top rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white p-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] sm:hidden dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex h-8 items-center justify-between pr-1 pl-1.5">
                <span className="text-[14px] font-semibold tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
                  Halcyon
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => {
                    setOpen(false);
                  }}
                  className={cx(
                    "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    transition,
                    focus,
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav aria-label="Primary" className="mt-1">
                {LINKS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      setActive(l);
                      setOpen(false);
                    }}
                    className={cx(
                      "flex h-10 w-full cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-left text-[13px] font-medium text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800",
                      transition,
                      focus,
                    )}
                  >
                    {l}
                  </button>
                ))}
              </nav>
              <button
                type="button"
                className={cx(
                  "mt-1 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                  transition,
                  focus,
                )}
              >
                Get started
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

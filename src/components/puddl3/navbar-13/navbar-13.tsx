"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const LEFT = ["Work", "Studio", "Journal"];
const RIGHT = ["Services", "Careers", "Contact"];

const OVERLAY = [
  { label: "Work", note: "24 selected projects" },
  { label: "Studio", note: "How we operate" },
  { label: "Journal", note: "Notes and process" },
  { label: "Services", note: "Brand, product, motion" },
  { label: "Careers", note: "Three open roles" },
  { label: "Contact", note: "Start a project" },
];

const PROJECTS = [
  { name: "Harbor Coffee", kind: "Brand identity", year: "2024" },
  { name: "Meridian", kind: "Product design", year: "2024" },
  { name: "Cedar Labs", kind: "Site and motion", year: "2023" },
  { name: "Northwind", kind: "Design system", year: "2023" },
];

export default function Navbar13() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Work");
  const rootRef = useRef<HTMLDivElement>(null);

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

  const link = (l: string) =>
    cx(
      "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium",
      transition,
      focus,
      l === active
        ? "text-neutral-900 dark:text-neutral-100"
        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
    );

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[560px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      <header className="relative z-20 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-neutral-200 px-3 sm:px-5 dark:border-neutral-800">
        <nav
          aria-label="Primary left"
          className="hidden items-center gap-1 md:flex"
        >
          {LEFT.map((l) => (
            <button
              key={l}
              type="button"
              aria-current={l === active ? "page" : undefined}
              onClick={() => setActive(l)}
              className={link(l)}
            >
              {l}
            </button>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={cx(
            "inline-flex h-9 w-9 cursor-pointer items-center justify-center justify-self-start rounded-[var(--rb-r-md,8px)] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 md:hidden dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100",
            transition,
            focus,
          )}
        >
          <Menu className="h-4 w-4" />
        </button>

        <a
          href="#"
          className={cx(
            "justify-self-center rounded-[var(--rb-r-md,8px)] px-2 text-[15px] font-medium tracking-[0.16em] text-neutral-900 uppercase dark:text-neutral-100",
            focus,
          )}
        >
          Alder
        </a>

        <div className="flex items-center justify-end gap-1">
          <nav
            aria-label="Primary right"
            className="hidden items-center gap-1 md:flex"
          >
            {RIGHT.map((l) => (
              <button
                key={l}
                type="button"
                aria-current={l === active ? "page" : undefined}
                onClick={() => setActive(l)}
                className={link(l)}
              >
                {l}
              </button>
            ))}
          </nav>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={cx(
              "hidden h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 md:inline-flex dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-5 py-10">
          <p className="text-[12px] tracking-[0.08em] text-neutral-400 uppercase">
            {active}
          </p>
          <h1 className="mt-2 max-w-[18ch] text-[30px] leading-[1.1] font-medium tracking-[-0.03em] text-neutral-900 dark:text-neutral-100">
            A studio for careful, long-lived work.
          </h1>
          <ul className="mt-8 space-y-1">
            {PROJECTS.map((p) => (
              <li key={p.name}>
                <a
                  href="#"
                  className={cx(
                    "group flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] px-3 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900",
                    transition,
                    focus,
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-[15px] text-neutral-900 dark:text-neutral-100">
                    {p.name}
                  </span>
                  <span className="hidden shrink-0 text-[13px] text-neutral-500 sm:inline">
                    {p.kind}
                  </span>
                  <span className="shrink-0 text-[13px] text-neutral-400 tabular-nums">
                    {p.year}
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-neutral-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:text-neutral-600"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.16, ease: EASE_OUT },
            }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
            className="absolute inset-0 z-40 flex flex-col bg-white dark:bg-neutral-950"
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-3 sm:px-5">
              <span className="px-2 text-[15px] font-medium tracking-[0.16em] text-neutral-900 uppercase dark:text-neutral-100">
                Alder
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => {
                  setOpen(false);
                }}
                className={cx(
                  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav
              aria-label="Site"
              className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 sm:px-5"
            >
              {OVERLAY.map((item, i) => (
                <motion.button
                  key={item.label}
                  type="button"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    ease: EASE_OUT,
                    delay: reduce ? 0 : 0.04 + i * 0.035,
                  }}
                  onClick={() => {
                    setActive(item.label);
                    setOpen(false);
                  }}
                  className={cx(
                    "group flex w-full cursor-pointer items-baseline gap-3 rounded-[var(--rb-r-lg,10px)] px-3 py-3 text-left transition-colors duration-150 ease-out hover:bg-neutral-50 dark:hover:bg-neutral-900",
                    focus,
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-[24px] leading-tight font-medium tracking-[-0.02em] text-neutral-900 sm:text-[28px] dark:text-neutral-100">
                    {item.label}
                  </span>
                  <span className="hidden shrink-0 text-[13px] text-neutral-500 sm:inline">
                    {item.note}
                  </span>
                </motion.button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

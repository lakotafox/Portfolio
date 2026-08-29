"use client";

import { useId, useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  MessageSquare,
  Search,
  Settings,
  Squircle,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.35 };

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const iconButton =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

const SECTIONS = [
  { id: "overview", label: "Overview", sub: ["Summary", "Activity", "Goals"] },
  { id: "revenue", label: "Revenue", sub: ["MRR", "Expansion", "Churn"] },
  {
    id: "customers",
    label: "Customers",
    sub: ["Accounts", "Segments", "Health"],
  },
  { id: "usage", label: "Usage", sub: ["Requests", "Storage", "Seats"] },
  { id: "reports", label: "Reports", sub: ["Saved", "Scheduled", "Exports"] },
];

const FIGURES: Record<
  string,
  { label: string; value: string; note: string }[]
> = {
  overview: [
    { label: "Active accounts", value: "1,284", note: "+38 this week" },
    { label: "Open tasks", value: "62", note: "9 overdue" },
    { label: "Weekly sessions", value: "18.4k", note: "+6.1%" },
  ],
  revenue: [
    { label: "MRR", value: "$248k", note: "+4.2% MoM" },
    { label: "Expansion", value: "$31k", note: "22 upgrades" },
    { label: "Net churn", value: "-1.1%", note: "Best this year" },
  ],
  customers: [
    { label: "Accounts", value: "1,284", note: "412 on Scale" },
    { label: "At risk", value: "17", note: "Health below 40" },
    { label: "Renewals", value: "38", note: "Next 30 days" },
  ],
  usage: [
    { label: "Requests", value: "94.2M", note: "Rolling 30 days" },
    { label: "Storage", value: "8.1 TB", note: "+240 GB" },
    { label: "Seats used", value: "3,910", note: "of 4,500" },
  ],
  reports: [
    { label: "Saved reports", value: "46", note: "12 shared" },
    { label: "Scheduled", value: "9", note: "Next run 06:00" },
    { label: "Exports", value: "214", note: "Last 90 days" },
  ],
};

export default function Navbar7() {
  const reduce = useReducedMotion();
  const uid = useId();
  const [section, setSection] = useState("revenue");
  const [sub, setSub] = useState("MRR");

  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const figures = FIGURES[section];

  const onKeyDown = (event: React.KeyboardEvent) => {
    const i = SECTIONS.findIndex((s) => s.id === section);
    let next = i;
    if (event.key === "ArrowRight") next = (i + 1) % SECTIONS.length;
    else if (event.key === "ArrowLeft")
      next = (i - 1 + SECTIONS.length) % SECTIONS.length;
    else return;
    event.preventDefault();
    setSection(SECTIONS[next].id);
    setSub(SECTIONS[next].sub[0]);
  };

  return (
    <div className="relative flex h-full min-h-[480px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="sticky top-0 z-20 shrink-0 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-950/80 dark:supports-[backdrop-filter]:bg-neutral-950/60">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <a
            href="#"
            className={cx(
              "inline-flex shrink-0 items-center gap-2 rounded-[var(--rb-r-md,8px)]",
              focus,
            )}
          >
            <span
              aria-hidden
              className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
            >
              <Squircle className="h-3.5 w-3.5" />
            </span>
            <span className="text-[14px] font-semibold tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
              Cedar Labs
            </span>
          </a>

          <button
            type="button"
            className={cx(
              "ml-1 hidden h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-2 text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 sm:inline-flex dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            Growth workspace
            <ChevronDown aria-hidden className="h-3.5 w-3.5" />
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Search"
              className={cx(iconButton, transition, focus)}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Help"
              className={cx(iconButton, transition, focus)}
            >
              <CircleHelp className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Settings"
              className={cx(iconButton, transition, focus)}
            >
              <Settings className="h-4 w-4" />
            </button>
            <span
              aria-hidden
              className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-800"
            />
            <button
              type="button"
              aria-label="Account menu"
              className={cx(
                "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700",
                transition,
                focus,
              )}
            >
              RK
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-3 sm:px-4 dark:border-neutral-800">
          <div
            role="tablist"
            aria-label="Workspace sections"
            onKeyDown={onKeyDown}
            className="relative -mb-px flex min-w-0 items-center gap-1 overflow-x-auto"
          >
            {SECTIONS.map((s) => {
              const isActive = s.id === section;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  data-section={s.id}
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => {
                    setSection(s.id);
                    setSub(s.sub[0]);
                  }}
                  className={cx(
                    "relative inline-flex h-10 shrink-0 cursor-pointer items-center rounded-t-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium",
                    transition,
                    focus,
                    isActive
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  )}
                >
                  {s.label}
                  {isActive && (
                    <motion.span
                      aria-hidden
                      layoutId={`${uid}-tab`}
                      transition={reduce ? { duration: 0 } : SPRING}
                      className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={cx(
              "mb-1.5 hidden h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 md:inline-flex dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
              transition,
              focus,
            )}
          >
            <MessageSquare aria-hidden className="h-3.5 w-3.5" />
            Feedback
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-neutral-50/70 px-3 py-1.5 sm:px-4 dark:border-neutral-800 dark:bg-neutral-900/40">
          {current.sub.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={s === sub}
              onClick={() => setSub(s)}
              className={cx(
                "relative inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[12px] font-medium",
                transition,
                focus,
                s === sub
                  ? "text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                  : "text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
              )}
            >
              {s === sub && (
                <motion.span
                  aria-hidden
                  layoutId={`${uid}-${section}-sub`}
                  transition={reduce ? { duration: 0 } : SPRING}
                  className="absolute inset-0 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                />
              )}
              <span className="relative">{s}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <h2 className="text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          {current.label} · {sub}
        </h2>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.12, ease: EASE_OUT },
            }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="mt-3 grid gap-3 sm:grid-cols-3"
          >
            {figures.map((f, i) => (
              <motion.div
                key={f.label}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  ease: EASE_OUT,
                  delay: reduce ? 0 : i * 0.04,
                }}
                className="rounded-[var(--rb-r-xl,12px)] border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <p className="text-[12px] text-neutral-500">{f.label}</p>
                <p className="mt-1 text-[22px] leading-none font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                  {f.value}
                </p>
                <p className="mt-1.5 text-[12px] text-neutral-500">{f.note}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 h-[140px] rounded-[var(--rb-r-xl,12px)] border border-dashed border-neutral-200 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/40" />
      </div>
    </div>
  );
}

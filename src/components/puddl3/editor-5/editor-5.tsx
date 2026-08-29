"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Focus, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

type Section = { id: string; level: 1 | 2; title: string; body: string[] };

const DOC: Section[] = [
  {
    id: "overview",
    level: 1,
    title: "Access ledger",
    body: [
      "Every permission change in Halcyon is written to an append-only ledger. Each entry records the actor, the resource, the previous value and the reason supplied at the time of the change.",
    ],
  },
  {
    id: "immutability",
    level: 2,
    title: "Immutability",
    body: [
      "Entries are never edited. A correction is a new entry that supersedes the old one, so the history of a resource can always be replayed exactly as it happened.",
      "This is why the ledger is the only source support quotes from during an incident review.",
    ],
  },
  {
    id: "retention",
    level: 2,
    title: "Retention",
    body: [
      "Retention follows the workspace plan: ninety days on Team, one year on Scale and seven years on Enterprise. Expired entries are removed by a nightly sweep that itself writes a summary entry.",
    ],
  },
  {
    id: "export",
    level: 2,
    title: "Export",
    body: [
      "Workspace owners can export the ledger as newline-delimited JSON. Exports are generated asynchronously and expire after 24 hours.",
      "Large workspaces are chunked at one million entries per file so the download survives a flaky connection.",
    ],
  },
  {
    id: "api",
    level: 1,
    title: "Reading the ledger",
    body: [
      "The read API is cursor paginated and ordered by sequence, not timestamp, because two entries can share a millisecond.",
    ],
  },
  {
    id: "filters",
    level: 2,
    title: "Filters",
    body: [
      "Filters compose with AND. Filtering by actor and resource together is the common case for support, and both are indexed.",
    ],
  },
  {
    id: "limits",
    level: 2,
    title: "Rate limits",
    body: [
      "Reads are limited to sixty requests per minute per token. A 429 carries a Retry-After header, and clients should honour it rather than backing off on their own schedule.",
    ],
  },
];

export default function Editor5() {
  const uid = useId();
  const reduce = useReducedMotion();
  const [outline, setOutline] = useState(true);
  const [focusMode, setFocusMode] = useState(true);
  const [current, setCurrent] = useState("immutability");

  return (
    <div className="relative flex h-full min-h-[680px] w-full overflow-hidden bg-white dark:bg-neutral-950">
      <motion.aside
        initial={false}
        animate={{ width: outline ? 232 : 0 }}
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 420, damping: 38 }
        }
        className="hidden shrink-0 overflow-hidden border-r border-neutral-200 md:block dark:border-neutral-800"
      >
        <div className="flex h-full w-[232px] flex-col">
          <div className="flex h-[52px] shrink-0 items-center px-4 text-[11px] tracking-[0.06em] text-neutral-400 uppercase dark:text-neutral-500">
            Outline
          </div>
          <nav
            aria-label="Document outline"
            className="min-h-0 flex-1 overflow-y-auto px-2 pb-3"
          >
            {DOC.map((s) => {
              const on = s.id === current;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrent(s.id)}
                  aria-current={on ? "true" : undefined}
                  className={cx(
                    "relative flex h-8 w-full cursor-pointer items-center truncate rounded-[var(--rb-r-md,8px)] text-left text-[13px]",
                    s.level === 1 ? "pl-3" : "pl-6",
                    "pr-2",
                    on
                      ? "text-neutral-900 dark:text-white"
                      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white",
                    transition,
                    focus,
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId={`${uid}-outline`}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 480, damping: 38 }
                      }
                      className="absolute inset-0 rounded-[var(--rb-r-md,8px)] bg-neutral-100 dark:bg-neutral-900"
                    />
                  )}
                  <span className="relative truncate">{s.title}</span>
                </button>
              );
            })}
          </nav>
          <div className="shrink-0 px-4 py-3 text-[12px] text-neutral-400 dark:text-neutral-500">
            <span className="tabular-nums">{DOC.length}</span> sections
          </div>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-neutral-200 px-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setOutline((v) => !v)}
            aria-pressed={outline}
            className={cx(
              "hidden h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-transparent text-neutral-500 md:inline-flex dark:text-neutral-400",
              "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-white",
              transition,
              focus,
            )}
          >
            {outline ? (
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
            )}
            <span className="sr-only">Toggle outline</span>
          </button>

          <p className="min-w-0 flex-1 truncate text-[13px] text-neutral-500 dark:text-neutral-400">
            Halcyon handbook{" "}
            <span className="mx-1 text-neutral-300 dark:text-neutral-700">
              /
            </span>
            <span className="text-neutral-900 dark:text-white">
              Access ledger
            </span>
          </p>

          <button
            type="button"
            onClick={() => setFocusMode((v) => !v)}
            aria-pressed={focusMode}
            className={cx(
              "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border px-2.5 text-[13px]",
              focusMode
                ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                : "border-neutral-200 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900",
              transition,
              focus,
            )}
          >
            <Focus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Focus
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-10">
          <article className="mx-auto max-w-[620px] space-y-6">
            {DOC.map((s) => {
              const dim = focusMode && s.id !== current;
              return (
                <motion.section
                  key={s.id}
                  animate={{ opacity: dim ? 0.32 : 1 }}
                  transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
                  onClick={() => setCurrent(s.id)}
                  className="cursor-default space-y-2.5"
                >
                  {s.level === 1 ? (
                    <h2 className="text-[22px] leading-tight font-medium tracking-[-0.02em] text-neutral-900 dark:text-white">
                      {s.title}
                    </h2>
                  ) : (
                    <h3 className="text-[16px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-white">
                      {s.title}
                    </h3>
                  )}
                  {s.body.map((p, i) => (
                    <p
                      key={i}
                      className="text-[15px] leading-7 text-neutral-600 dark:text-neutral-400"
                    >
                      {p}
                    </p>
                  ))}
                </motion.section>
              );
            })}
          </article>
        </div>
      </div>
    </div>
  );
}

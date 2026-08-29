"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, MessageSquare, Sparkles, Undo2, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

type Suggestion = {
  id: string;
  author: string;
  kind: "edit" | "comment";
  before: string;
  after?: string;
  note: string;
  time: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    author: "Priya Nandakumar",
    kind: "edit",
    before: "should probably be rolled out slowly",
    after: "rolls out in three stages",
    note: "Hedging. State the plan.",
    time: "2h ago",
  },
  {
    id: "s2",
    author: "Marco Silva",
    kind: "comment",
    before: "a drift of under 0.5%",
    note: "Where does 0.5% come from? Link the comparison run so support can quote it.",
    time: "3h ago",
  },
  {
    id: "s3",
    author: "Wei Chen",
    kind: "edit",
    before: "customers on the bigger plans",
    after: "Scale and Enterprise workspaces",
    note: "Use the plan names we sell.",
    time: "yesterday",
  },
];

type Para = { text: string; mark?: string };

const PARAS: Para[] = [
  {
    text: "The nightly aggregation job is being replaced by a streaming counter. Usage updates within about ten seconds instead of once per night.",
  },
  {
    text: "The change {{s1}}, starting with internal workspaces and ending with everyone on a paid plan.",
    mark: "s1",
  },
  {
    text: "During the overlap window both systems run side by side. {{s2}} between them is expected and does not need a ticket.",
    mark: "s2",
  },
  {
    text: "We move {{s3}} first, because their invoices are generated from the same rollup table.",
    mark: "s3",
  },
];

export default function Editor4() {
  const uid = useId();
  const reduce = useReducedMotion();
  const [items, setItems] = useState(SUGGESTIONS);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<string | null>("s1");

  const resolve = (id: string, accept: boolean) => {
    if (accept) setApplied((p) => ({ ...p, [id]: true }));
    setItems((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setActive(next[0]?.id ?? null);
      return next;
    });
  };

  const renderPara = (p: Para, i: number) => {
    if (!p.mark) return <span key={`t${i}`}>{p.text}</span>;
    const s = SUGGESTIONS.find((x) => x.id === p.mark)!;
    const open = items.some((x) => x.id === s.id);
    const [head, tail] = p.text.split(`{{${p.mark}}}`);
    const label = applied[s.id] && s.after ? s.after : s.before;

    return (
      <span key={`t${i}`}>
        {head}
        <button
          type="button"
          onClick={() => open && setActive(s.id)}
          className={cx(
            "cursor-pointer rounded-[var(--rb-r-xs,4px)] px-0.5 text-left",
            open
              ? active === s.id
                ? "bg-amber-100 text-neutral-900 dark:bg-amber-500/25 dark:text-white"
                : "bg-amber-50 text-neutral-800 dark:bg-amber-500/10 dark:text-neutral-200"
              : applied[s.id]
                ? "bg-emerald-50 text-neutral-800 dark:bg-emerald-500/10 dark:text-neutral-200"
                : "cursor-default",
            transition,
            focus,
          )}
        >
          {label}
        </button>
        {tail}
      </span>
    );
  };

  return (
    <div className="relative flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white lg:flex-row dark:bg-neutral-950">
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-medium text-neutral-900 dark:text-white">
              Streaming meter rollout
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500 dark:text-neutral-400">
              Reviewing · 3 contributors
            </p>
          </div>
          <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200/70 bg-neutral-50 px-2.5 text-[12px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="tabular-nums">{items.length}</span> open
          </span>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="mx-auto max-w-[620px] space-y-4">
            {PARAS.map((p, i) => (
              <p
                key={i}
                className="text-[15px] leading-7 text-neutral-700 dark:text-neutral-300"
              >
                {renderPara(p, i)}
              </p>
            ))}
          </div>
        </div>
      </div>

      <aside className="flex min-h-0 shrink-0 flex-col border-t border-neutral-200 lg:w-[336px] lg:border-t-0 lg:border-l dark:border-neutral-800">
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <span className="text-[13px] font-medium text-neutral-900 dark:text-white">
            Suggestions
          </span>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setApplied(
                  Object.fromEntries(
                    items.filter((s) => s.after).map((s) => [s.id, true]),
                  ),
                );
                setItems([]);
                setActive(null);
              }}
              className={cx(
                "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2 text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white",
                transition,
                focus,
              )}
            >
              Accept all
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((s) => {
              const on = s.id === active;
              return (
                <motion.article
                  key={s.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reduce ? undefined : { opacity: 0, scale: 0.97, height: 0 }
                  }
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onMouseEnter={() => setActive(s.id)}
                  className={cx(
                    "mb-2 overflow-hidden rounded-[var(--rb-r-xl,12px)] border p-3",
                    on
                      ? "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                      : "border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950",
                    transition,
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {s.author
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-900 dark:text-white">
                      {s.author}
                    </span>
                    <span className="shrink-0 text-[12px] text-neutral-400 dark:text-neutral-500">
                      {s.time}
                    </span>
                  </div>

                  {s.kind === "edit" && s.after ? (
                    <div className="mt-2.5 space-y-1 rounded-[var(--rb-r-md,8px)] bg-neutral-100/70 p-2 text-[13px] leading-5 dark:bg-neutral-800/60">
                      <p className="text-neutral-500 line-through dark:text-neutral-500">
                        {s.before}
                      </p>
                      <p className="text-neutral-900 dark:text-white">
                        {s.after}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100/70 p-2 text-[13px] leading-5 text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
                      “{s.before}”
                    </p>
                  )}

                  <p className="mt-2 text-[13px] leading-5 text-neutral-600 dark:text-neutral-400">
                    {s.note}
                  </p>

                  <div className="mt-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => resolve(s.id, true)}
                      className={cx(
                        "inline-flex h-7 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-2.5 text-[13px] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                        "hover:bg-neutral-800 dark:hover:bg-neutral-200",
                        transition,
                        focus,
                      )}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2} />
                      {s.kind === "edit" ? "Accept" : "Resolve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => resolve(s.id, false)}
                      className={cx(
                        "inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-2.5 text-[13px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
                        "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                        transition,
                        focus,
                      )}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                      Dismiss
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>

          {items.length === 0 && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center px-6 py-14 text-center"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-xl,12px)] border border-neutral-200/70 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500">
                <Sparkles className="h-4.5 w-4.5" strokeWidth={1.5} />
              </span>
              <p className="mt-3 text-[14px] font-medium text-neutral-900 dark:text-white">
                Review complete
              </p>
              <p className="mt-1 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
                Every suggestion on this draft has been handled.
              </p>
              <button
                type="button"
                onClick={() => {
                  setItems(SUGGESTIONS);
                  setApplied({});
                  setActive("s1");
                }}
                className={cx(
                  "mt-4 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-3 text-[13px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                  transition,
                  focus,
                )}
              >
                <Undo2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Restore
              </button>
            </motion.div>
          )}
        </div>
        <span className="sr-only" aria-live="polite" id={`${uid}-live`}>
          {items.length} suggestions remaining
        </span>
      </aside>
    </div>
  );
}

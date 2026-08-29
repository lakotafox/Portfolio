"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Copy,
  History,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const surface =
  "rounded-[var(--rb-r-xl,12px)] border border-neutral-200 bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-900";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const pop = (reduce: boolean | null) => ({
  initial: reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 },
  animate: reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 },
  exit: reduce
    ? { opacity: 0, transition: { duration: 0.12 } }
    : {
        opacity: 0,
        scale: 0.97,
        y: -4,
        transition: { duration: 0.12, ease: EASE_OUT },
      },
  transition: { duration: 0.18, ease: EASE_OUT },
});

const menuItem =
  "flex w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2.5 py-1.5 text-left text-[13px] text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800";

const iconButton =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

const PRESENCE = [
  { initials: "NV", name: "Nadia V." },
  { initials: "MS", name: "Marcus S." },
  { initials: "PR", name: "Priya R." },
];

export default function Navbar11() {
  const reduce = useReducedMotion();
  const [title, setTitle] = useState("Q3 pricing experiment");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [state, setState] = useState<"saved" | "saving">("saved");
  const [menu, setMenu] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menu) return;
    const doc = rootRef.current?.ownerDocument;
    if (!doc) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[data-menu-root]")) setMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    doc.addEventListener("pointerdown", onPointerDown);
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("pointerdown", onPointerDown);
      doc.removeEventListener("keydown", onKeyDown);
    };
  }, [menu]);

  useEffect(() => {
    if (!editing) return;
    const view = inputRef.current?.ownerDocument.defaultView;
    const frame = view?.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => {
      if (frame !== undefined) view?.cancelAnimationFrame(frame);
    };
  }, [editing]);

  useEffect(() => {
    if (state !== "saving") return;
    const view = rootRef.current?.ownerDocument.defaultView;
    const timer = view?.setTimeout(() => setState("saved"), 900);
    return () => {
      if (timer !== undefined) view?.clearTimeout(timer);
    };
  }, [state]);

  useEffect(() => {
    if (!copied) return;
    const view = rootRef.current?.ownerDocument.defaultView;
    const timer = view?.setTimeout(() => setCopied(false), 1600);
    return () => {
      if (timer !== undefined) view?.clearTimeout(timer);
    };
  }, [copied]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === title) {
      setDraft(title);
      return;
    }
    setTitle(next);
    setState("saving");
  };

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[480px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200 px-2 sm:px-3 dark:border-neutral-800">
        <button
          type="button"
          aria-label="Back to documents"
          className={cx(iconButton, transition, focus)}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {editing ? (
            <>
              <label htmlFor="navbar-11-title" className="sr-only">
                Document title
              </label>
              <input
                id="navbar-11-title"
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") {
                    setDraft(title);
                    setEditing(false);
                  }
                }}
                className={cx(
                  "h-8 w-full max-w-[320px] min-w-0 rounded-[var(--rb-r-md,8px)] border border-neutral-900 bg-white px-2 text-[14px] font-medium text-neutral-900 dark:border-white dark:bg-neutral-950 dark:text-neutral-100",
                  focus,
                )}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(title);
                setEditing(true);
              }}
              className={cx(
                "group inline-flex h-8 min-w-0 cursor-text items-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              <span className="min-w-0 truncate text-[14px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                {title}
              </span>
              <Pencil
                aria-hidden
                className="h-3.5 w-3.5 shrink-0 text-neutral-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              />
            </button>
          )}

          <span className="hidden shrink-0 items-center gap-1.5 sm:inline-flex">
            <span
              aria-hidden
              className={cx(
                "h-1.5 w-1.5 rounded-full",
                state === "saving"
                  ? "animate-pulse bg-neutral-400 dark:bg-neutral-500"
                  : "bg-neutral-300 dark:bg-neutral-600",
              )}
            />
            <span className="text-[12px] text-neutral-500">
              {state === "saving" ? "Saving" : "Saved"}
            </span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden items-center sm:flex">
            {PRESENCE.map((p, i) => (
              <span
                key={p.initials}
                title={p.name}
                className={cx(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-700 ring-2 ring-white dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-950",
                  i > 0 && "-ml-2",
                )}
              >
                {p.initials}
              </span>
            ))}
          </div>

          <button
            type="button"
            aria-label="Version history"
            className={cx(
              iconButton,
              "hidden md:inline-flex",
              transition,
              focus,
            )}
          >
            <History className="h-4 w-4" />
          </button>

          <div className="relative" data-menu-root>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={menu === "share"}
              onClick={() => {
                setMenu((m) => (m === "share" ? null : "share"));
              }}
              className={cx(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-2.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              <Share2 aria-hidden className="h-3.5 w-3.5" />
              Share
            </button>
            <AnimatePresence>
              {menu === "share" && (
                <motion.div
                  {...pop(reduce)}
                  className={cx(
                    surface,
                    "absolute top-full right-0 z-30 mt-1.5 w-[280px] origin-top-right p-3",
                  )}
                >
                  <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    Share document
                  </p>
                  <p className="mt-0.5 text-[12px] text-neutral-500">
                    Anyone at Cedar Labs with the link can comment.
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <input
                      readOnly
                      aria-label="Share link"
                      value="cedarlabs.app/d/q3-pricing"
                      className={cx(
                        "h-8 min-w-0 flex-1 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-neutral-50 px-2 text-[12px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400",
                        focus,
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setCopied(true)}
                      className={cx(
                        "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-2.5 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800",
                        transition,
                        focus,
                      )}
                    >
                      <Copy aria-hidden className="h-3.5 w-3.5" />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" data-menu-root>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menu === "more"}
              aria-label="Document actions"
              onClick={() => {
                setMenu((m) => (m === "more" ? null : "more"));
              }}
              className={cx(iconButton, transition, focus)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {menu === "more" && (
                <motion.div
                  {...pop(reduce)}
                  role="menu"
                  className={cx(
                    surface,
                    "absolute top-full right-0 z-30 mt-1.5 w-[180px] origin-top-right p-1",
                  )}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className={cx(menuItem, transition, focus)}
                  >
                    <Copy aria-hidden className="h-3.5 w-3.5" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={cx(menuItem, transition, focus)}
                  >
                    <History aria-hidden className="h-3.5 w-3.5" />
                    Version history
                  </button>
                  <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                  <button
                    type="button"
                    role="menuitem"
                    className={cx(
                      "flex w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2.5 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40",
                      transition,
                      focus,
                    )}
                  >
                    <Trash2 aria-hidden className="h-3.5 w-3.5" />
                    Move to trash
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[600px] px-5 py-8">
          <h1 className="text-[24px] font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
            {title}
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            We are testing a usage-weighted tier against the current seat price
            for accounts above 40 seats. The goal is to hold net revenue flat
            while removing the seat ceiling that blocks expansion in the
            mid-market segment.
          </p>
          <div className="mt-5 space-y-2">
            {[
              "Hypothesis and success metric",
              "Segment definition",
              "Rollout plan",
            ].map((h) => (
              <div
                key={h}
                className="rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 py-2.5 text-[13px] text-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300"
              >
                {h}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

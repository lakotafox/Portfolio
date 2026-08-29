"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Bookmark, Check, Link2, List, Share2 } from "lucide-react";

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

const iconButton =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

const SECTIONS = [
  {
    id: "budgets",
    title: "Error budgets are a scheduling tool",
    body: "A budget only changes behaviour if it is allowed to run out. When it does, the team stops shipping features and spends the week on reliability instead. That trade has to be agreed before the incident, not during it.",
  },
  {
    id: "windows",
    title: "Pick the window before the target",
    body: "A thirty-day rolling window forgives a bad Tuesday by the end of the month. A calendar quarter does not. Choose the window that matches how the team plans, then set a target you are willing to defend in a review.",
  },
  {
    id: "alerts",
    title: "Alert on burn rate, not on breach",
    body: "By the time the objective is breached the conversation is already about blame. Multi-window burn-rate alerts fire while there is still budget left to spend, which keeps the response technical.",
  },
  {
    id: "review",
    title: "Review the objective, not just the misses",
    body: "If an objective has never been close to breaching in a year, it is measuring something nobody depends on. Retire it and write one that would actually change a decision.",
  },
];

export default function Navbar14() {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(SECTIONS[0].id);
  const [menu, setMenu] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
      const marker = el.scrollTop + el.clientHeight * 0.3;
      let seen = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const node = el.querySelector<HTMLElement>(`[data-section="${s.id}"]`);
        if (node && node.offsetTop <= marker) seen = s.id;
      }
      setCurrent(seen);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const doc = rootRef.current?.ownerDocument;
    if (!doc) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[data-menu-root]")) setMenu(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    doc.addEventListener("pointerdown", onPointerDown);
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("pointerdown", onPointerDown);
      doc.removeEventListener("keydown", onKeyDown);
    };
  }, [menu]);

  useEffect(() => {
    if (!copied) return;
    const view = rootRef.current?.ownerDocument.defaultView;
    const timer = view?.setTimeout(() => setCopied(false), 1600);
    return () => {
      if (timer !== undefined) view?.clearTimeout(timer);
    };
  }, [copied]);

  const goTo = (id: string) => {
    const el = scrollRef.current;
    const node = el?.querySelector<HTMLElement>(`[data-section="${id}"]`);
    if (el && node)
      el.scrollTo({ top: node.offsetTop - 16, behavior: "smooth" });
    setMenu(false);
  };

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[480px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      <header className="relative z-20 shrink-0 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex h-14 items-center gap-2 px-2 sm:px-3">
          <button
            type="button"
            aria-label="Back to journal"
            className={cx(iconButton, transition, focus)}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Error budgets that actually change behaviour
            </p>
            <p className="truncate text-[12px] text-neutral-500">
              Priya Raman · 9 min read
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <div className="relative" data-menu-root>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menu}
                onClick={() => {
                  setMenu((m) => !m);
                }}
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                <List aria-hidden className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Contents</span>
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    {...pop(reduce)}
                    role="menu"
                    className={cx(
                      surface,
                      "absolute top-full right-0 z-30 mt-1.5 w-[260px] origin-top-right p-1",
                    )}
                  >
                    {SECTIONS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        role="menuitem"
                        onClick={() => goTo(s.id)}
                        className={cx(
                          "flex w-full cursor-pointer items-start gap-2 rounded-[var(--rb-r-md,8px)] px-2.5 py-1.5 text-left text-[13px] hover:bg-neutral-100 dark:hover:bg-neutral-800",
                          transition,
                          focus,
                          s.id === current
                            ? "text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-500",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cx(
                            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                            s.id === current
                              ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                              : "bg-neutral-300 dark:bg-neutral-600",
                          )}
                        />
                        <span className="min-w-0 flex-1">{s.title}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              aria-label={saved ? "Remove bookmark" : "Bookmark article"}
              aria-pressed={saved}
              onClick={() => setSaved((s) => !s)}
              className={cx(
                iconButton,
                transition,
                focus,
                saved && "text-neutral-900 dark:text-neutral-100",
              )}
            >
              <Bookmark className={cx("h-4 w-4", saved && "fill-current")} />
            </button>

            <button
              type="button"
              aria-label="Copy link"
              onClick={() => setCopied(true)}
              className={cx(iconButton, transition, focus)}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              aria-label="Share article"
              className={cx(
                iconButton,
                "hidden sm:inline-flex",
                transition,
                focus,
              )}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[2px] bg-transparent"
        >
          <div
            style={{ transform: `scaleX(${progress})` }}
            className="h-full origin-left bg-[var(--rb-accent,oklch(20.5%_0_0))] transition-transform duration-100 ease-out motion-reduce:transition-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
          />
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[600px] px-5 py-7">
          <h1 className="text-[26px] leading-[1.15] font-medium tracking-[-0.03em] text-neutral-900 dark:text-neutral-100">
            Error budgets that actually change behaviour
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            Most teams publish an objective, watch the number, and change
            nothing when it slips. A budget is only useful if spending it is
            expensive.
          </p>
          {SECTIONS.map((s) => (
            <section key={s.id} data-section={s.id} className="mt-7">
              <h2 className="text-[16px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                {s.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                {s.body}
              </p>
              <div className="mt-3 h-[90px] rounded-[var(--rb-r-lg,10px)] bg-neutral-50 dark:bg-neutral-900/60" />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Github,
  Menu,
  Moon,
  Search,
  Sun,
  X,
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
const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];

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

const VERSIONS = ["v4.2 (latest)", "v4.1", "v3.8 (LTS)", "Canary"];

const NAV = ["Docs", "Reference", "Guides", "Changelog"];

const TREE = [
  {
    title: "Getting started",
    items: ["Installation", "Project structure", "First request"],
  },
  {
    title: "Core concepts",
    items: ["Routing", "Data loading", "Caching", "Streaming"],
  },
  { title: "Deployment", items: ["Runtimes", "Edge regions", "Observability"] },
];

export default function Navbar10() {
  const reduce = useReducedMotion();
  const [menu, setMenu] = useState<string | null>(null);
  const [version, setVersion] = useState(VERSIONS[0]);
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("Docs");
  const [drawer, setDrawer] = useState(false);
  const [section, setSection] = useState<string | null>("Core concepts");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu && !drawer) return;
    const doc = rootRef.current?.ownerDocument;
    if (!doc) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[data-menu-root]")) setMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenu(null);
      setDrawer(false);
    };
    doc.addEventListener("pointerdown", onPointerDown);
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("pointerdown", onPointerDown);
      doc.removeEventListener("keydown", onKeyDown);
    };
  }, [menu, drawer]);

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[480px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      <header className="relative z-20 shrink-0 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
            className={cx(iconButton, "lg:hidden", transition, focus)}
          >
            <Menu className="h-4 w-4" />
          </button>

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
              <BookOpen className="h-3.5 w-3.5" />
            </span>
            <span className="hidden text-[14px] font-semibold tracking-[-0.015em] text-neutral-900 sm:block dark:text-neutral-100">
              Meridian
            </span>
          </a>

          <div className="relative shrink-0" data-menu-root>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menu === "version"}
              onClick={() => {
                setMenu((m) => (m === "version" ? null : "version"));
              }}
              className={cx(
                "inline-flex h-7 cursor-pointer items-center gap-1 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-2 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900",
                transition,
                focus,
              )}
            >
              {version.split(" ")[0]}
              <ChevronDown aria-hidden className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {menu === "version" && (
                <motion.div
                  {...pop(reduce)}
                  role="menu"
                  className={cx(
                    surface,
                    "absolute top-full left-0 z-30 mt-1.5 w-[170px] origin-top-left p-1",
                  )}
                >
                  {VERSIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="menuitemradio"
                      aria-checked={v === version}
                      onClick={() => {
                        setVersion(v);
                        setMenu(null);
                      }}
                      className={cx(
                        "flex w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2.5 py-1.5 text-left text-[13px] text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                        transition,
                        focus,
                      )}
                    >
                      <Check
                        aria-hidden
                        className={cx(
                          "h-3.5 w-3.5",
                          v === version ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{v}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <nav
            aria-label="Documentation"
            className="ml-2 hidden items-center gap-0.5 md:flex"
          >
            {NAV.map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === tab ? "page" : undefined}
                onClick={() => setTab(n)}
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium",
                  transition,
                  focus,
                  n === tab
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                )}
              >
                {n}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              className={cx(
                "hidden h-8 w-[190px] cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-neutral-50 px-2.5 text-[13px] text-neutral-500 hover:border-neutral-300 sm:inline-flex dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700",
                transition,
                focus,
              )}
            >
              <Search aria-hidden className="h-3.5 w-3.5" />
              <span className="min-w-0 flex-1 text-left">Search docs</span>
              <kbd className="rounded-[var(--rb-r-sm,6px)] border border-neutral-200 bg-white px-1 text-[11px] dark:border-neutral-700 dark:bg-neutral-950">
                /
              </kbd>
            </button>
            <button
              type="button"
              aria-label="Search docs"
              className={cx(iconButton, "sm:hidden", transition, focus)}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={
                dark ? "Switch to light theme" : "Switch to dark theme"
              }
              aria-pressed={dark}
              onClick={() => setDark((d) => !d)}
              className={cx(iconButton, transition, focus)}
            >
              {dark ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
            <a
              href="#"
              aria-label="Source repository"
              className={cx(iconButton, transition, focus)}
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[880px] gap-8 px-4 py-5 sm:px-6">
          <nav
            aria-label="Section"
            className="hidden w-[190px] shrink-0 lg:block"
          >
            {TREE.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="px-2 text-[11px] font-medium tracking-[0.08em] text-neutral-400 uppercase">
                  {group.title}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className={cx(
                          "block rounded-[var(--rb-r-md,8px)] px-2 py-1.5 text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100",
                          transition,
                          focus,
                        )}
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <article className="min-w-0 flex-1">
            <p className="text-[12px] text-neutral-500">
              {tab} · {version}
            </p>
            <h1 className="mt-1 text-[22px] font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
              Data loading
            </h1>
            <p className="mt-2 max-w-[54ch] text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              Loaders run on the server before a route renders. They can stream
              partial results, revalidate on a schedule, and share a cache with
              every nested segment on the same request.
            </p>
            <div className="mt-4 space-y-2">
              {["Reading from a loader", "Revalidation", "Streaming"].map(
                (h) => (
                  <a
                    key={h}
                    href="#"
                    className={cx(
                      "flex items-center justify-between gap-3 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 py-2.5 text-[13px] text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:bg-neutral-900",
                      transition,
                      focus,
                    )}
                  >
                    {h}
                    <ChevronRight
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                    />
                  </a>
                ),
              )}
            </div>
          </article>
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              aria-hidden
              onClick={() => setDrawer(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0.16, ease: EASE_OUT },
              }}
              transition={{ duration: 0.24, ease: EASE_OUT }}
              className="absolute inset-0 z-30 bg-neutral-950/40 lg:hidden"
            />
            <motion.aside
              aria-label="Documentation navigation"
              initial={reduce ? { opacity: 0 } : { x: "-100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={
                reduce
                  ? { opacity: 0, transition: { duration: 0.16 } }
                  : {
                      x: "-100%",
                      transition: { duration: 0.22, ease: EASE_DRAWER },
                    }
              }
              transition={{ duration: 0.32, ease: EASE_DRAWER }}
              className="absolute inset-y-0 left-0 z-40 flex w-[280px] max-w-[85%] flex-col border-r border-neutral-200 bg-white lg:hidden dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-3 dark:border-neutral-800">
                <span className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                  {tab}
                </span>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => {
                    setDrawer(false);
                  }}
                  className={cx(iconButton, transition, focus)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <div className="mb-2 flex flex-wrap gap-1">
                  {NAV.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTab(n)}
                      className={cx(
                        "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[12px] font-medium",
                        transition,
                        focus,
                        n === tab
                          ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                          : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {TREE.map((group) => (
                  <div key={group.title}>
                    <button
                      type="button"
                      aria-expanded={section === group.title}
                      onClick={() =>
                        setSection((s) =>
                          s === group.title ? null : group.title,
                        )
                      }
                      className={cx(
                        "flex h-9 w-full cursor-pointer items-center justify-between rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-900",
                        transition,
                        focus,
                      )}
                    >
                      {group.title}
                      <ChevronDown
                        aria-hidden
                        className={cx(
                          "h-3.5 w-3.5 text-neutral-400 transition-transform duration-150",
                          section === group.title && "rotate-180",
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {section === group.title && (
                        <motion.ul
                          initial={
                            reduce ? { opacity: 0 } : { height: 0, opacity: 0 }
                          }
                          animate={
                            reduce
                              ? { opacity: 1 }
                              : { height: "auto", opacity: 1 }
                          }
                          exit={
                            reduce
                              ? { opacity: 0, transition: { duration: 0.12 } }
                              : {
                                  height: 0,
                                  opacity: 0,
                                  transition: {
                                    duration: 0.16,
                                    ease: EASE_OUT,
                                  },
                                }
                          }
                          transition={{ duration: 0.2, ease: EASE_OUT }}
                          className="mb-1 space-y-0.5 pl-2.5 overflow-hidden"
                        >
                          {group.items.map((item) => (
                            <li key={item}>
                              <a
                                href="#"
                                className={cx(
                                  "block rounded-[var(--rb-r-md,8px)] px-2.5 py-1.5 text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100",
                                  transition,
                                  focus,
                                )}
                              >
                                {item}
                              </a>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

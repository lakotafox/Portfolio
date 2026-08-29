"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Link2,
  Pencil,
  Archive,
  Trash2,
} from "lucide-react";

const EXPORTS = ["CSV", "Excel", "PDF"];

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Item = {
  id: string;
  label: string;
  shortcut?: string;
  icon: typeof Copy;
  submenu?: boolean;
  danger?: boolean;
};

const ITEMS: Item[] = [
  { id: "rename", label: "Rename report", shortcut: "⌘R", icon: Pencil },
  { id: "duplicate", label: "Duplicate", shortcut: "⌘D", icon: Copy },
  { id: "export", label: "Export as", icon: FileText, submenu: true },
  { id: "share", label: "Copy link", shortcut: "⌘⇧C", icon: Link2 },
  { id: "archive", label: "Move to archive", icon: Archive },
  { id: "delete", label: "Delete report", icon: Trash2, danger: true },
];

const SEPARATOR_AFTER = new Set(["duplicate", "share"]);

export default function AppDialog7() {
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(0);
  const [subOpen, setSubOpen] = useState(false);
  const [subActive, setSubActive] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const keyboardOpenRef = useRef(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const subItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const exportIndex = ITEMS.findIndex((item) => item.submenu);

  const closeMenu = (restoreFocus = true) => {
    setOpen(false);
    setSubOpen(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  };

  const openMenu = () => {
    setKeyboardOpen(keyboardOpenRef.current);
    setActive(0);
    setSubOpen(false);
    setChosen(null);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    if (subOpen) subItemRefs.current[subActive]?.focus({ preventScroll: true });
    else itemRefs.current[active]?.focus({ preventScroll: true });
  }, [open, active, subOpen, subActive]);

  const onMenuKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Tab") {
      const focusable = Array.from(
        surfaceRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const doc = surfaceRef.current?.ownerDocument ?? document;

      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
      return;
    }

    if (subOpen) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSubActive((index) => (index + 1) % EXPORTS.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSubActive((index) => (index - 1 + EXPORTS.length) % EXPORTS.length);
      } else if (event.key === "ArrowLeft" || event.key === "Escape") {
        event.preventDefault();
        setSubOpen(false);
      } else if (event.key === "Home") {
        event.preventDefault();
        setSubActive(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setSubActive(EXPORTS.length - 1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setChosen(`Exported as ${EXPORTS[subActive]}`);
        closeMenu();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % ITEMS.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + ITEMS.length) % ITEMS.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(ITEMS.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    } else if (
      (event.key === "ArrowRight" ||
        event.key === "Enter" ||
        event.key === " ") &&
      ITEMS[active].submenu
    ) {
      event.preventDefault();
      setSubActive(0);
      setSubOpen(true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setChosen(`${ITEMS[active].label} selected`);
      closeMenu();
    }
  };

  useEffect(() => {
    if (!chosen) return;
    const id = setTimeout(() => setChosen(null), 2000);
    return () => clearTimeout(id);
  }, [chosen]);

  const animate = !prefersReducedMotion && !keyboardOpen;

  return (
    <div className="relative flex h-full min-h-[560px] w-full items-center justify-center overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerDown={() => {
          keyboardOpenRef.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ")
            keyboardOpenRef.current = true;
        }}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-50 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
      >
        Report actions
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="absolute inset-0 z-40 bg-neutral-950/40 backdrop-blur-[2px] dark:bg-neutral-950/60"
              onClick={() => closeMenu()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              ref={surfaceRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="app-dialog-7-title"
              onKeyDown={onMenuKeyDown}
              className="absolute left-1/2 top-[calc(50%+28px)] z-50 w-60 origin-top -translate-x-1/2 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-1.5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] focus-visible:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
              initial={animate ? { opacity: 0, scale: 0.97 } : { opacity: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.97,
                transition: { duration: 0.11, ease: [0.23, 1, 0.32, 1] },
              }}
              transition={{
                duration: animate ? 0.18 : 0,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              <h2 id="app-dialog-7-title" className="sr-only">
                Report actions
              </h2>
              <div role="menu" aria-label="Report actions">
                {ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = index === active && !subOpen;
                  return (
                    <div key={item.id} className="relative">
                      <button
                        ref={(el) => {
                          itemRefs.current[index] = el;
                        }}
                        type="button"
                        role="menuitem"
                        aria-haspopup={item.submenu ? "menu" : undefined}
                        aria-expanded={item.submenu ? subOpen : undefined}
                        tabIndex={isActive ? 0 : -1}
                        onMouseEnter={() => {
                          setActive(index);
                          setSubOpen(Boolean(item.submenu));
                        }}
                        onClick={() => {
                          if (item.submenu) {
                            setSubActive(0);
                            setSubOpen(true);
                            return;
                          }
                          setChosen(`${item.label} selected`);
                          closeMenu();
                        }}
                        className={`flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] px-2 text-[13px] transition-colors duration-150 focus-visible:outline-none ${
                          item.danger
                            ? isActive
                              ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                              : "text-red-600 dark:text-red-400"
                            : isActive
                              ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                              : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        <Icon
                          aria-hidden="true"
                          className={`h-4 w-4 shrink-0 ${
                            item.danger
                              ? "text-red-600 dark:text-red-400"
                              : "text-neutral-500 dark:text-neutral-500"
                          }`}
                        />
                        <span className="min-w-0 flex-1 truncate text-left">
                          {item.label}
                        </span>
                        {item.shortcut && (
                          <span className="shrink-0 text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
                            {item.shortcut}
                          </span>
                        )}
                        {item.submenu && (
                          <ChevronRight
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-500"
                          />
                        )}
                      </button>

                      <AnimatePresence>
                        {item.submenu && subOpen && index === exportIndex && (
                          <motion.div
                            role="menu"
                            aria-label="Export as"
                            className="absolute left-1.5 right-1.5 top-full z-50 mt-1 origin-top rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-1.5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] sm:left-full sm:right-auto sm:top-0 sm:ml-3 sm:mt-0 sm:w-40 sm:origin-top-left dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
                            initial={
                              animate
                                ? { opacity: 0, scale: 0.97 }
                                : { opacity: 0 }
                            }
                            animate={{ opacity: 1, scale: 1 }}
                            exit={
                              animate
                                ? {
                                    opacity: 0,
                                    scale: 0.97,
                                    transition: {
                                      duration: 0.11,
                                      ease: [0.23, 1, 0.32, 1],
                                    },
                                  }
                                : { opacity: 0 }
                            }
                            transition={{
                              duration: animate ? 0.18 : 0,
                              ease: [0.23, 1, 0.32, 1],
                            }}
                          >
                            {EXPORTS.map((option, subIndex) => (
                              <button
                                key={option}
                                ref={(el) => {
                                  subItemRefs.current[subIndex] = el;
                                }}
                                type="button"
                                role="menuitem"
                                tabIndex={subIndex === subActive ? 0 : -1}
                                onMouseEnter={() => setSubActive(subIndex)}
                                onClick={() => {
                                  setChosen(`Exported as ${option}`);
                                  closeMenu();
                                }}
                                className={`flex h-8 w-full cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2 text-[13px] transition-colors duration-150 focus-visible:outline-none ${
                                  subIndex === subActive
                                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                                    : "text-neutral-700 dark:text-neutral-300"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {SEPARATOR_AFTER.has(item.id) && (
                        <div role="separator" className="h-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div
        aria-live="polite"
        className="pointer-events-none absolute bottom-4 left-4 right-4 z-[60] flex flex-col gap-2 sm:left-auto sm:w-full sm:max-w-sm"
      >
        {chosen && (
          <div className="pointer-events-auto rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-3 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
            <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              {chosen}
            </p>
            <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              Applied to Weekly active users.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

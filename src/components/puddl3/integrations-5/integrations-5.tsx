"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Lock, ShieldCheck } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const SCOPES = [
  {
    id: "profile",
    label: "Read your profile",
    detail: "Name, email address and avatar.",
  },
  {
    id: "projects",
    label: "Read your projects",
    detail: "Names, settings and member lists for 6 projects.",
  },
  {
    id: "deploys",
    label: "Trigger deploys",
    detail: "Start a deploy on your behalf and read its result.",
  },
];

const WORKSPACES = [
  { id: "w1", name: "Halcyon", role: "Owner", seats: 24 },
  { id: "w2", name: "Halcyon Labs", role: "Admin", seats: 6 },
  { id: "w3", name: "Personal", role: "Owner", seats: 1 },
];

export default function Integrations5() {
  const reduce = useReducedMotion();
  const [ws, setWs] = useState(WORKSPACES[0]);
  const [menu, setMenu] = useState(false);
  const [state, setState] = useState<"idle" | "working" | "done">("idle");

  useEffect(() => {
    if (state !== "working") return;
    const t = window.setTimeout(() => setState("done"), 1100);
    return () => window.clearTimeout(t);
  }, [state]);

  return (
    <div className="relative flex h-full min-h-[680px] w-full items-center justify-center overflow-y-auto bg-neutral-50 py-8 dark:bg-neutral-950">
      <div className="w-full max-w-[452px] px-4">
        <AnimatePresence mode="wait" initial={false}>
          {state === "done" ? (
            <motion.div
              key="done"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-[var(--rb-r-4xl,18px)] border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900"
            >
              <motion.span
                initial={reduce ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
              >
                <Check className="h-5 w-5" strokeWidth={2} />
              </motion.span>
              <h2 className="mt-3.5 text-[17px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-white">
                Northwind is connected
              </h2>
              <p className="mt-1.5 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
                You can close this window. Access can be revoked at any time
                from workspace settings.
              </p>
              <button
                type="button"
                onClick={() => setState("idle")}
                className={cx(
                  "mt-5 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200 text-[13px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                Back to review
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="consent"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-[var(--rb-r-4xl,18px)] border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center justify-center gap-2">
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-xl,12px)] border border-neutral-200/70 bg-neutral-50 text-[12px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                >
                  NW
                </span>
                <span
                  aria-hidden
                  className="flex items-center gap-1 px-1 text-neutral-300 dark:text-neutral-600"
                >
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span className="h-1 w-1 rounded-full bg-current" />
                </span>
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-xl,12px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[12px] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                >
                  HL
                </span>
              </div>

              <h2 className="mt-4 text-center text-[17px] leading-snug font-medium tracking-[-0.01em] text-neutral-900 dark:text-white">
                Northwind wants access to your Halcyon workspace
              </h2>
              <p className="mt-1.5 text-center text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
                Review what Northwind will be able to do before you continue.
              </p>

              <div className="relative mt-5">
                <label
                  htmlFor="consent-workspace"
                  className="text-[12px] text-neutral-500 dark:text-neutral-400"
                >
                  Workspace
                </label>
                <button
                  id="consent-workspace"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={menu}
                  onClick={() => setMenu((v) => !v)}
                  className={cx(
                    "mt-1.5 flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-3 text-left dark:border-neutral-800 dark:bg-neutral-950",
                    "hover:bg-neutral-50 dark:hover:bg-neutral-900",
                    transition,
                    focus,
                  )}
                >
                  <span
                    aria-hidden
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-200 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {ws.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-neutral-900 dark:text-white">
                      {ws.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-[12px] text-neutral-500 dark:text-neutral-400">
                    {ws.role}
                  </span>
                  <ChevronDown
                    className={cx(
                      "h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-150",
                      menu && "rotate-180",
                    )}
                    strokeWidth={1.75}
                  />
                </button>

                <AnimatePresence>
                  {menu && (
                    <motion.ul
                      role="listbox"
                      initial={
                        reduce ? false : { opacity: 0, y: -4, scale: 0.98 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        reduce ? undefined : { opacity: 0, y: -4, scale: 0.98 }
                      }
                      transition={{ duration: 0.14, ease: "easeOut" }}
                      className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 origin-top rounded-[var(--rb-r-xl,12px)] border border-neutral-200 bg-white p-1 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.3)] dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      {WORKSPACES.map((w) => {
                        const on = w.id === ws.id;
                        return (
                          <li key={w.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={on}
                              onClick={() => {
                                setWs(w);
                                setMenu(false);
                              }}
                              className={cx(
                                "flex h-9 w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2.5 text-left text-[13px]",
                                on
                                  ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                                transition,
                                focus,
                              )}
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {w.name}
                              </span>
                              <span className="shrink-0 text-[12px] text-neutral-500 tabular-nums dark:text-neutral-400">
                                {w.seats} seats
                              </span>
                              {on && (
                                <Check
                                  className="h-3.5 w-3.5"
                                  strokeWidth={2}
                                />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              <ul className="mt-4 space-y-2.5 rounded-[var(--rb-r-xl,12px)] bg-neutral-50 p-3.5 dark:bg-neutral-950">
                {SCOPES.map((s) => (
                  <li key={s.id} className="flex gap-2.5">
                    <Check
                      aria-hidden
                      className="mt-[3px] h-3.5 w-3.5 shrink-0 text-neutral-400"
                      strokeWidth={2}
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] text-neutral-900 dark:text-white">
                        {s.label}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
                        {s.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-3 flex items-start gap-2 text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
                <ShieldCheck
                  aria-hidden
                  className="mt-[2px] h-3.5 w-3.5 shrink-0"
                  strokeWidth={1.75}
                />
                Northwind never receives your password, and cannot read billing
                details or delete projects.
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  className={cx(
                    "inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200 text-[13px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    transition,
                    focus,
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setState("working")}
                  disabled={state === "working"}
                  className={cx(
                    "inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[13px] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                    "hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 dark:hover:bg-neutral-200",
                    transition,
                    focus,
                  )}
                >
                  {state === "working" ? (
                    <>
                      <span
                        aria-hidden
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                      />
                      Authorizing
                    </>
                  ) : (
                    "Authorize"
                  )}
                </button>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-neutral-400 dark:text-neutral-500">
                <Lock className="h-3 w-3" strokeWidth={1.75} />
                Redirects to northwind.dev
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

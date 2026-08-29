"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ArrowUpRight, RefreshCw, Unplug } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const SCOPES = [
  {
    id: "read",
    label: "Read repositories",
    detail: "Metadata, branches and commit status for 12 repositories.",
    required: true,
  },
  {
    id: "issues",
    label: "Write issues",
    detail: "Create and comment on issues when a deploy check fails.",
    required: false,
  },
  {
    id: "checks",
    label: "Write checks",
    detail: "Report build and policy results back onto pull requests.",
    required: false,
  },
  {
    id: "members",
    label: "Read organization members",
    detail: "Match commit authors to workspace seats.",
    required: false,
  },
];

const EVENTS = [
  { at: "Today 09:41", text: "Scopes updated by Ana Reyes", tone: "neutral" },
  { at: "Yesterday 18:02", text: "Token refreshed automatically", tone: "ok" },
  { at: "Mar 12", text: "Rate limit reached, retried after 40s", tone: "warn" },
  { at: "Mar 04", text: "Connected by Marco Silva", tone: "neutral" },
];

export default function Integrations2() {
  const uid = useId();
  const reduce = useReducedMotion();
  const [scopes, setScopes] = useState<Record<string, boolean>>({
    read: true,
    issues: true,
    checks: true,
    members: false,
  });
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState<"connected" | "disconnected">(
    "connected",
  );
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!syncing) return;
    const t = window.setTimeout(() => setSyncing(false), 1400);
    return () => window.clearTimeout(t);
  }, [syncing]);

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirm(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirm]);

  return (
    <div className="relative flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex shrink-0 flex-wrap items-start gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <span
          aria-hidden
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--rb-r-xl,12px)] border border-neutral-200/70 bg-neutral-50 text-[13px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
        >
          CL
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-white">
              Cedar Labs
            </h2>
            <span
              className={cx(
                "inline-flex h-5 items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] px-1.5 text-[12px]",
                status === "connected"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
              )}
            >
              <span
                aria-hidden
                className={cx(
                  "h-1.5 w-1.5 rounded-full",
                  status === "connected"
                    ? "bg-emerald-500"
                    : "bg-neutral-400 dark:bg-neutral-500",
                )}
              />
              {status === "connected" ? "Connected" : "Disconnected"}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
            Opens an issue whenever a deploy check fails, and reports build
            results back onto pull requests.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setSyncing(true)}
            disabled={status !== "connected" || syncing}
            className={cx(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-2.5 text-[13px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
              "hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-900",
              transition,
              focus,
            )}
          >
            <RefreshCw
              className={cx("h-3.5 w-3.5", syncing && "animate-spin")}
              strokeWidth={1.75}
            />
            {syncing ? "Syncing" : "Sync now"}
          </button>
          <button
            type="button"
            onClick={() =>
              status === "connected" ? setConfirm(true) : setStatus("connected")
            }
            className={cx(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-3 text-[13px]",
              status === "connected"
                ? "border border-neutral-200 text-red-600 hover:bg-red-50 dark:border-neutral-800 dark:text-red-400 dark:hover:bg-red-500/10"
                : "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
              transition,
              focus,
            )}
          >
            {status === "connected" ? (
              <>
                <Unplug className="h-3.5 w-3.5" strokeWidth={1.75} />
                Disconnect
              </>
            ) : (
              "Reconnect"
            )}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <section className={frame}>
            <div className={cx(panel, "p-4")}>
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white">
                Permissions
              </h3>
              <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                Cedar Labs only uses the scopes you leave enabled.
              </p>

              <ul className="mt-3.5 space-y-1">
                {SCOPES.map((s) => {
                  const on = s.required || scopes[s.id];
                  return (
                    <li
                      key={s.id}
                      className="flex items-start gap-3 rounded-[var(--rb-r-md,8px)] px-2 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] text-neutral-900 dark:text-white">
                            {s.label}
                          </span>
                          {s.required && (
                            <span className="inline-flex h-4.5 items-center rounded-[var(--rb-r-xs,4px)] bg-neutral-100 px-1.5 text-[11px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
                          {s.detail}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={s.label}
                        disabled={s.required}
                        onClick={() =>
                          setScopes((p) => ({ ...p, [s.id]: !p[s.id] }))
                        }
                        className={cx(
                          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border",
                          on
                            ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                            : "border-neutral-300 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700",
                          s.required && "cursor-not-allowed opacity-50",
                          transition,
                          focus,
                        )}
                      >
                        <motion.span
                          aria-hidden
                          animate={{ x: on ? 18 : 2 }}
                          transition={
                            reduce
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 520, damping: 34 }
                          }
                          className="h-4 w-4 rounded-full bg-white dark:bg-neutral-900"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section className={frame}>
            <div className={cx(panel, "p-4")}>
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white">
                Activity
              </h3>
              <ol className="mt-3 space-y-3">
                {EVENTS.map((e) => (
                  <li key={e.at} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className={cx(
                        "mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full",
                        e.tone === "ok"
                          ? "bg-emerald-500"
                          : e.tone === "warn"
                            ? "bg-amber-500"
                            : "bg-neutral-300 dark:bg-neutral-600",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] leading-5 text-neutral-700 dark:text-neutral-300">
                        {e.text}
                      </p>
                      <p className="mt-0.5 text-[12px] text-neutral-400 dark:text-neutral-500">
                        {e.at}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <a
                href="#"
                className={cx(
                  "mt-4 inline-flex h-8 items-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-2 text-[13px] text-neutral-700 dark:text-neutral-300",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                Full audit log
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {confirm && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center p-5"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.14 }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setConfirm(false)}
              className="absolute inset-0 cursor-default bg-neutral-950/20 dark:bg-neutral-950/60"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${uid}-title`}
              initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-[380px] rounded-[var(--rb-r-3xl,16px)] border border-neutral-200 bg-white p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)] dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <h3
                id={`${uid}-title`}
                className="mt-3 text-[15px] font-medium text-neutral-900 dark:text-white"
              >
                Disconnect Cedar Labs?
              </h3>
              <p className="mt-1.5 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
                Deploy checks stop reporting and the stored token is revoked.
                Existing issues stay where they are.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirm(false)}
                  className={cx(
                    "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-3 text-[13px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    transition,
                    focus,
                  )}
                >
                  Keep connected
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("disconnected");
                    setConfirm(false);
                  }}
                  className={cx(
                    "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-red-600 px-3 text-[13px] text-white hover:bg-red-700",
                    transition,
                    focus,
                  )}
                >
                  Disconnect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="sr-only" aria-live="polite">
        {status === "connected"
          ? "Cedar Labs is connected"
          : "Cedar Labs is disconnected"}
      </p>
    </div>
  );
}

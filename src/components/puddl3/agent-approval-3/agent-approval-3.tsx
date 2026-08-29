"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      start: scrollTop > 1,
      end: Math.ceil(scrollTop + clientHeight) < scrollHeight - 1,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view?.ResizeObserver) return;
    const observer = new view.ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  return { ref, edges, onScroll: update };
}

type Status = "pending" | "queued" | "auto" | "approved" | "denied" | "expired";

type Request = {
  id: string;
  title: string;
  detail: string;
  args: string;
  status: Status;
  time: string;
};

const INITIAL: Request[] = [
  {
    id: "req-901",
    title: "Refund 3 duplicate charges to Acme Logistics",
    detail: "$1,240.00 total · West billing account",
    args: `refund_charges({\n  account: "acme-logistics",\n  chargeIds: ["ch_71a", "ch_802", "ch_9c4"],\n  reason: "duplicate"\n})`,
    status: "pending",
    time: "now",
  },
  {
    id: "req-902",
    title: "Email the Q3 renewal summary to 4 recipients",
    detail: "Attaches renewal-risk.pdf",
    args: `send_email({\n  template: "q3-renewal-summary",\n  recipients: 4,\n  attachment: "renewal-risk.pdf"\n})`,
    status: "queued",
    time: "now",
  },
  {
    id: "req-903",
    title: "Archive 312 paused campaigns older than 18 months",
    detail: "EU and NA marketing workspaces",
    args: `archive_campaigns({\n  status: "paused",\n  olderThanMonths: 18,\n  workspaces: ["EU", "NA"]\n})`,
    status: "queued",
    time: "now",
  },
  {
    id: "req-904",
    title: "Add a private note to ticket #4821",
    detail: "Matched the auto-approve policy for internal notes",
    args: "",
    status: "auto",
    time: "9:41",
  },
  {
    id: "req-905",
    title: "Grant read access to analytics for 30 minutes",
    detail: "Meridian service account",
    args: "",
    status: "approved",
    time: "9:12",
  },
  {
    id: "req-906",
    title: "Rotate the production API token",
    detail: "Payments service",
    args: "",
    status: "denied",
    time: "Yesterday",
  },
  {
    id: "req-907",
    title: "Merge the staging config branch",
    detail: "No response within the 2-hour window",
    args: "",
    status: "expired",
    time: "Yesterday",
  },
  {
    id: "req-908",
    title: "Change the invoice retention window to 45 days",
    detail: "billing-retention-policy.ts",
    args: "",
    status: "denied",
    time: "Yesterday",
  },
  {
    id: "req-909",
    title: "Reset QA seed data before the nightly replay",
    detail: "Matched the auto-approve policy for QA-only tasks",
    args: "",
    status: "auto",
    time: "Mon",
  },
  {
    id: "req-911",
    title: "Delete the abandoned import job queue",
    detail: "No response within the 2-hour window",
    args: "",
    status: "expired",
    time: "Mon",
  },
];

const DOT: Record<Status, string> = {
  pending: "bg-neutral-400 dark:bg-neutral-500",
  queued: "bg-neutral-300 dark:bg-neutral-600",
  auto: "bg-neutral-300 dark:bg-neutral-600",
  approved: "bg-neutral-300 dark:bg-neutral-600",
  denied: "bg-neutral-300 dark:bg-neutral-600",
  expired: "bg-neutral-300 dark:bg-neutral-600",
};

const WORD: Record<Status, string> = {
  pending: "Waiting",
  queued: "Queued",
  auto: "Auto-approved",
  approved: "Approved",
  denied: "Skipped",
  expired: "Expired",
};

const focusRing =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";
const press =
  "transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]";

export default function AgentApproval3() {
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<Request[]>(INITIAL);
  const [showArgs, setShowArgs] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const body = useScrollFade<HTMLDivElement>();

  const activeId = useMemo(
    () => items.find((i) => i.status === "pending")?.id ?? null,
    [items],
  );
  const waiting = items.filter(
    (i) => i.status === "pending" || i.status === "queued",
  ).length;

  useEffect(() => {
    if (!announcement) return;
    const id = setTimeout(() => setAnnouncement(""), 2400);
    return () => clearTimeout(id);
  }, [announcement]);

  const decide = (id: string, next: "approved" | "denied") => {
    setShowArgs(false);
    setItems((current) => {
      const updated = current.map((i) =>
        i.id === id ? { ...i, status: next, time: "now" } : i,
      );
      const nextQueued = updated.find((i) => i.status === "queued");
      return nextQueued
        ? updated.map((i) =>
            i.id === nextQueued.id ? { ...i, status: "pending" } : i,
          )
        : updated;
    });
    setAnnouncement(
      next === "approved"
        ? "Approved. Next request is ready."
        : "Skipped, not approved.",
    );
  };

  const enter = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const },
      };

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4 sm:px-6">
        <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Approvals
        </h2>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] text-neutral-500 dark:text-neutral-400">
          <span
            className={cx(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              waiting > 0
                ? "bg-amber-500"
                : "bg-neutral-300 dark:bg-neutral-600",
            )}
          />
          <span className="tabular-nums">{waiting} waiting</span>
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={body.ref}
          onScroll={body.onScroll}
          className="h-full overflow-y-auto overscroll-contain"
        >
          <ul className="flex flex-col gap-1.5 px-4 py-2 sm:px-6">
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li key={item.id}>
                  {isActive ? (
                    <motion.div
                      {...enter}
                      className="space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                            Needs approval
                          </span>
                        </div>
                        <p className="mt-2 text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                          {item.detail}
                        </p>
                      </div>

                      <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowArgs((v) => !v)}
                            aria-expanded={showArgs}
                            className={cx(
                              "inline-flex h-8 cursor-pointer items-center gap-1 rounded-[var(--rb-r-sm,6px)] px-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                              press,
                              focusRing,
                            )}
                          >
                            <ChevronRight
                              aria-hidden="true"
                              className={cx(
                                "h-3.5 w-3.5 shrink-0 transition-transform duration-150 ease-out",
                                showArgs && "rotate-90",
                              )}
                            />
                            {showArgs ? "Hide request" : "Show request"}
                          </button>
                          <div className="ml-auto flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => decide(item.id, "denied")}
                              className={cx(
                                "inline-flex h-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
                                press,
                                focusRing,
                              )}
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => decide(item.id, "approved")}
                              className={cx(
                                "inline-flex h-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-2.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                                press,
                                focusRing,
                              )}
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                        {showArgs && item.args && (
                          <pre
                            tabIndex={0}
                            className={cx(
                              "mt-1 max-h-40 overflow-auto rounded-[var(--rb-r-sm,6px)] bg-neutral-50 px-3 py-2.5 font-mono text-xs leading-relaxed text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400",
                              focusRing,
                            )}
                          >
                            {item.args}
                          </pre>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex min-h-10 items-center gap-3 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 py-2 dark:bg-neutral-900">
                      <span
                        className={cx(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          DOT[item.status],
                        )}
                      />
                      <p className="min-w-0 flex-1 truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                        {item.title}
                      </p>
                      <span className="w-24 shrink-0 whitespace-nowrap text-right text-[13px] text-neutral-600 dark:text-neutral-400 sm:w-28">
                        {WORD[item.status]}
                      </span>
                      <span className="hidden w-16 shrink-0 text-right text-xs tabular-nums text-neutral-500 sm:block dark:text-neutral-500">
                        {item.time}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            body.edges.start ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            body.edges.end ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

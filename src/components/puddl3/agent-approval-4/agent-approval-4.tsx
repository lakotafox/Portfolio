"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChevronRight } from "lucide-react";

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

const SCOPES = [
  {
    id: "customers.read",
    label: "Read customer records",
    detail: "Names, emails, plan tier, and invoice status.",
  },
  {
    id: "tickets.read",
    label: "Read recent tickets",
    detail: "Open and pending tickets from the last 30 days.",
  },
  {
    id: "exports.create",
    label: "Create one export",
    detail: "A CSV of renewal-risk accounts in the West workspace.",
  },
];

const RAW_REQUEST = `grant_access({
  service: "api.lumendesk.com",
  mode: "read",
  scopes: ["customers.read", "tickets.read", "exports.create"],
  ttlSeconds: 2700
})`;

const START_SECONDS = 2700;

type Decision = "pending" | "granted" | "denied" | "expired";

const focusRing =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";
const press =
  "transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]";

function clock(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AgentApproval4() {
  const reduceMotion = useReducedMotion();
  const [decision, setDecision] = useState<Decision>("pending");
  const [selected, setSelected] = useState(SCOPES.map((s) => s.id));
  const [remaining, setRemaining] = useState(START_SECONDS);
  const [showRequest, setShowRequest] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const body = useScrollFade<HTMLElement>();

  const [deadline] = useState(() => Date.now() + START_SECONDS * 1000);

  useEffect(() => {
    if (decision !== "pending") return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setDecision("expired");
        setAnnouncement("The request expired before a decision was made.");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [decision, deadline]);

  useEffect(() => {
    if (!announcement) return;
    const id = setTimeout(() => setAnnouncement(""), 2400);
    return () => clearTimeout(id);
  }, [announcement]);

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id],
    );

  const enter = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] as const },
      };

  const settled = decision !== "pending";
  const settledLine =
    decision === "granted"
      ? `Access granted for ${selected.length} of ${SCOPES.length} scopes · expires in 45 min`
      : decision === "denied"
        ? "Skipped, not approved"
        : "Skipped, request expired";

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4 sm:px-6">
        <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Permission request
        </h2>
        <span className="ml-auto text-[13px] text-neutral-500 dark:text-neutral-400">
          Support agent
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <main
          ref={body.ref}
          onScroll={body.onScroll}
          className="h-full overflow-y-auto p-4 sm:p-5"
        >
          <motion.section
            {...enter}
            aria-labelledby="aa4-title"
            className="mx-auto w-full max-w-2xl space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950 sm:px-5 sm:py-5">
              <div className="flex items-center gap-1.5">
                <span
                  className={cx(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    decision === "pending"
                      ? "bg-amber-500"
                      : "bg-neutral-300 dark:bg-neutral-600",
                  )}
                />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {decision === "pending"
                    ? "Needs approval"
                    : decision === "granted"
                      ? "Granted"
                      : decision === "denied"
                        ? "Skipped"
                        : "Expired"}
                </span>
              </div>
              <h3
                id="aa4-title"
                className="mt-2 text-lg font-medium leading-snug tracking-[-0.015em] text-neutral-900 dark:text-neutral-100 sm:text-xl"
              >
                Grant read access to customer records for 45 minutes
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                The support agent wants to connect to api.lumendesk.com.
                Read-only, no billing changes, and access ends automatically
                when the timer runs out.
              </p>
            </div>

            <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950 sm:px-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                Scopes requested
              </p>
              <div className="mt-2 flex flex-col">
                {SCOPES.map((scope) => {
                  const on = selected.includes(scope.id);
                  return (
                    <label
                      key={scope.id}
                      className={cx(
                        "flex items-start gap-3 py-2",
                        settled ? "cursor-default" : "cursor-pointer",
                      )}
                    >
                      <span
                        className={cx(
                          "relative mt-0.5 inline-flex h-4 w-4 shrink-0",
                          settled && "opacity-50",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={settled}
                          onChange={() => toggle(scope.id)}
                          className={cx(
                            "peer h-4 w-4 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border border-neutral-300 bg-white transition-colors duration-150 checked:border-neutral-900 checked:bg-neutral-900 hover:border-neutral-400 disabled:pointer-events-none dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:checked:bg-white dark:hover:border-neutral-600",
                            focusRing,
                          )}
                        />
                        <Check
                          aria-hidden="true"
                          strokeWidth={3}
                          className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 text-[var(--rb-accent-fg,oklch(100%_0_0))] opacity-0 peer-checked:opacity-100 dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cx(
                            "block text-[13px] font-medium text-neutral-900 dark:text-neutral-100",
                            !on &&
                              "line-through text-neutral-400 dark:text-neutral-600",
                          )}
                        >
                          {scope.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">
                          {scope.detail}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
              {decision === "pending" ? (
                <>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowRequest((v) => !v)}
                      aria-expanded={showRequest}
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
                          showRequest && "rotate-90",
                        )}
                      />
                      {showRequest ? "Hide request" : "Show request"}
                    </button>
                    <span className="ml-2 inline-flex items-center gap-1.5 text-[13px] text-neutral-500 dark:text-neutral-400">
                      <span>Expires in</span>
                      <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                        {clock(remaining)}
                      </span>
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDecision("denied");
                          setAnnouncement("Skipped, not approved.");
                        }}
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
                        disabled={selected.length === 0}
                        onClick={() => {
                          setDecision("granted");
                          setAnnouncement(
                            `Granted access for ${selected.length} scopes.`,
                          );
                        }}
                        className={cx(
                          "inline-flex h-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-2.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                          press,
                          focusRing,
                        )}
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                  {showRequest && (
                    <pre
                      tabIndex={0}
                      className={cx(
                        "mt-1 max-h-40 overflow-auto rounded-[var(--rb-r-sm,6px)] bg-neutral-50 px-3 py-2.5 font-mono text-xs leading-relaxed text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400",
                        focusRing,
                      )}
                    >
                      {RAW_REQUEST}
                    </pre>
                  )}
                </>
              ) : (
                <div className="flex min-h-8 items-center gap-2 px-2 py-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  <p className="min-w-0 flex-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                    {settledLine}
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        </main>

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

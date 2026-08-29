"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CircleDot,
  Clock,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

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

const STATUSES = [
  "Investigating",
  "Identified",
  "Monitoring",
  "Resolved",
] as const;
type Status = (typeof STATUSES)[number];

type Entry = {
  id: string;
  status: Status;
  who: string;
  initials: string;
  at: string;
  body: string;
};

const INITIAL: Entry[] = [
  {
    id: "e1",
    status: "Monitoring",
    who: "Priya Patel",
    initials: "PP",
    at: "09:41",
    body: "Connection pool raised to 240 and the failing region drained. Error rate is back under 0.2% and holding. Watching for one more cycle before we call it.",
  },
  {
    id: "e2",
    status: "Identified",
    who: "Theo Park",
    initials: "TP",
    at: "09:18",
    body: "The charge worker exhausted its database pool after a migration left an index rebuild running against the orders table.",
  },
  {
    id: "e3",
    status: "Investigating",
    who: "On-call rotation",
    initials: "OC",
    at: "09:04",
    body: "Automated alert fired on p99 checkout latency crossing 8s. Paging the payments team.",
  },
];

const FACTS = [
  { label: "Detected", value: "09:04", icon: Clock },
  { label: "Acknowledged", value: "09:06", icon: Users },
  { label: "Mitigated", value: "09:38", icon: ShieldCheck },
  { label: "Duration", value: "37m", icon: CircleDot },
];

const COMPONENTS = [
  { name: "Checkout API", state: "Degraded", tone: "danger" as const },
  { name: "Payments worker", state: "Recovering", tone: "warning" as const },
  { name: "Order history", state: "Operational", tone: "ok" as const },
  { name: "Webhooks", state: "Operational", tone: "ok" as const },
];

const DOT = {
  danger: "bg-red-500",
  warning: "bg-amber-500",
  ok: "bg-neutral-300 dark:bg-neutral-600",
};

export default function Monitoring3() {
  const [status, setStatus] = useState<Status>("Monitoring");
  const [draft, setDraft] = useState("");
  const [entries, setEntries] = useState<Entry[]>(INITIAL);

  const post = () => {
    const body = draft.trim();
    if (!body) return;
    setEntries((e) => [
      {
        id: `n${e.length + 1}`,
        status,
        who: "You",
        initials: "YO",
        at: "Just now",
        body,
      },
      ...e,
    ]);
    setDraft("");
  };

  return (
    <div className="flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto flex min-h-0 w-full max-w-[1000px] flex-1 flex-col gap-1",
        )}
      >
        <div className={cx(panel, "px-4 py-3.5")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className="h-4 w-4 shrink-0 text-amber-500"
                  aria-hidden
                />
                <h2 className="truncate text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                  Elevated checkout latency
                </h2>
              </div>
              <p className="mt-1 truncate text-[12px] text-neutral-500 tabular-nums">
                INC-2841 · opened 09:04 · payments team
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label htmlFor="monitoring-3-status" className="sr-only">
                Incident status
              </label>
              <select
                id="monitoring-3-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className={cx(
                  "h-8 cursor-pointer rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200",
                  transition,
                  focus,
                )}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                  transition,
                  focus,
                )}
              >
                Resolve
              </button>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FACTS.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-[var(--rb-r-md,8px)] bg-neutral-50 px-3 py-2 dark:bg-neutral-800/40"
              >
                <dt className="flex items-center gap-1.5 text-[12px] text-neutral-500">
                  <Icon
                    className="h-3 w-3 shrink-0 text-neutral-400"
                    aria-hidden
                  />
                  {label}
                </dt>
                <dd className="mt-1 text-[15px] leading-none font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid min-h-0 flex-1 gap-1 lg:grid-cols-[1fr_280px]">
          <div className="flex min-h-[280px] min-w-0 flex-col gap-1 lg:min-h-0">
            <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto p-4")}>
              <h3 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                Updates
              </h3>
              <ol className="mt-3 space-y-4">
                {entries.map((e, i) => (
                  <li key={e.id} className="relative flex gap-3">
                    {i < entries.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute top-8 bottom-[-1.25rem] left-[13px] w-px bg-neutral-200 dark:bg-neutral-800"
                      />
                    )}
                    <span
                      aria-hidden
                      className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {e.initials}
                    </span>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                          {e.who}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500">
                          <span
                            aria-hidden
                            className={cx(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              e.status === "Investigating"
                                ? "bg-red-500"
                                : e.status === "Identified"
                                  ? "bg-amber-500"
                                  : "bg-neutral-300 dark:bg-neutral-600",
                            )}
                          />
                          {e.status}
                        </span>
                        <span className="text-[12px] text-neutral-400 tabular-nums">
                          {e.at}
                        </span>
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {e.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className={cx(panel, "p-2")}>
              <label htmlFor="monitoring-3-update" className="sr-only">
                Post an update
              </label>
              <textarea
                id="monitoring-3-update"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                placeholder="Post an update for subscribers…"
                className={cx(
                  "w-full resize-none rounded-[var(--rb-r-md,8px)] bg-transparent px-2 py-1.5 text-[13px] text-neutral-900 placeholder:text-neutral-500 dark:text-neutral-100",
                  focus,
                )}
              />
              <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
                <p className="truncate text-[12px] text-neutral-500">
                  Sends to 1,204 status page subscribers
                </p>
                <button
                  type="button"
                  onClick={post}
                  disabled={!draft.trim()}
                  className={cx(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] enabled:cursor-pointer enabled:hover:bg-neutral-800 enabled:active:scale-[0.98] disabled:opacity-40 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:enabled:hover:bg-neutral-200",
                    transition,
                    focus,
                  )}
                >
                  <Send className="h-3.5 w-3.5" aria-hidden />
                  Post
                </button>
              </div>
            </div>
          </div>

          <aside className={cx(panel, "min-h-0 overflow-y-auto p-4")}>
            <h3 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Affected components
            </h3>
            <ul className="mt-2.5 space-y-2">
              {COMPONENTS.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="min-w-0 truncate text-[13px] text-neutral-700 dark:text-neutral-300">
                    {c.name}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-neutral-500">
                    <span
                      aria-hidden
                      className={cx(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        DOT[c.tone],
                      )}
                    />
                    {c.state}
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Responders
            </h3>
            <ul className="mt-2.5 space-y-2">
              {[
                { name: "Priya Patel", initials: "PP", role: "Incident lead" },
                { name: "Theo Park", initials: "TP", role: "Payments" },
                { name: "Nora Vale", initials: "NV", role: "Comms" },
              ].map((p) => (
                <li key={p.name} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {p.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-neutral-800 dark:text-neutral-200">
                      {p.name}
                    </span>
                    <span className="block truncate text-[12px] text-neutral-500">
                      {p.role}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-[var(--rb-r-md,8px)] bg-neutral-50 p-3 dark:bg-neutral-800/40">
              <p className="text-[12px] font-medium text-neutral-900 dark:text-neutral-100">
                Error budget
              </p>
              <div
                role="progressbar"
                aria-valuenow={38}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Error budget consumed"
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
              >
                <div
                  style={{ width: "38%" }}
                  className="h-full rounded-full bg-amber-500"
                />
              </div>
              <p className="mt-2 text-[12px] text-neutral-500 tabular-nums">
                38% of the monthly budget spent by this incident.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

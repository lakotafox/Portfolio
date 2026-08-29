"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronRight, Plus, RotateCw, Webhook } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

type Endpoint = {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  rate: number;
};

type Delivery = {
  id: string;
  event: string;
  status: number;
  at: string;
  ms: number;
  attempts: number;
  body: string;
};

const ENDPOINTS: Endpoint[] = [
  {
    id: "e1",
    url: "https://hooks.northwind.dev/halcyon/usage",
    events: ["usage.rollup", "usage.threshold"],
    enabled: true,
    rate: 99.8,
  },
  {
    id: "e2",
    url: "https://api.cedarlabs.io/v2/events",
    events: ["deploy.failed", "deploy.succeeded", "check.completed"],
    enabled: true,
    rate: 97.1,
  },
  {
    id: "e3",
    url: "https://harbor.internal/ingest/audit",
    events: ["member.invited", "member.removed", "role.changed"],
    enabled: false,
    rate: 100,
  },
];

const DELIVERIES: Record<string, Delivery[]> = {
  e1: [
    {
      id: "d1",
      event: "usage.rollup",
      status: 200,
      at: "09:41:02",
      ms: 128,
      attempts: 1,
      body: '{ "workspace": "wrk_2f81", "units": 41822, "window": 10000 }',
    },
    {
      id: "d2",
      event: "usage.threshold",
      status: 200,
      at: "09:40:11",
      ms: 96,
      attempts: 1,
      body: '{ "workspace": "wrk_2f81", "threshold": 0.8, "plan": "scale" }',
    },
    {
      id: "d3",
      event: "usage.rollup",
      status: 500,
      at: "09:38:44",
      ms: 4021,
      attempts: 3,
      body: '{ "workspace": "wrk_71ab", "units": 1204, "window": 10000 }',
    },
  ],
  e2: [
    {
      id: "d4",
      event: "deploy.failed",
      status: 202,
      at: "09:33:19",
      ms: 211,
      attempts: 1,
      body: '{ "env": "production", "sha": "8fc2a41", "check": "migrations" }',
    },
    {
      id: "d5",
      event: "check.completed",
      status: 429,
      at: "09:31:07",
      ms: 88,
      attempts: 2,
      body: '{ "env": "staging", "sha": "2ad7f60", "result": "pass" }',
    },
  ],
  e3: [],
};

export default function Integrations4() {
  const uid = useId();
  const reduce = useReducedMotion();
  const [items, setItems] = useState(ENDPOINTS);
  const [active, setActive] = useState("e1");
  const [open, setOpen] = useState<string | null>("d1");

  const endpoint = items.find((e) => e.id === active) ?? items[0];
  const log = DELIVERIES[endpoint.id] ?? [];

  const tone = (s: number) =>
    s < 300
      ? "text-emerald-600 dark:text-emerald-500"
      : s < 400
        ? "text-neutral-600 dark:text-neutral-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="relative flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white lg:flex-row dark:bg-neutral-950">
      <aside className="flex shrink-0 flex-col border-b border-neutral-200 lg:w-[320px] lg:border-r lg:border-b-0 dark:border-neutral-800">
        <div className="flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-4 dark:border-neutral-800">
          <span className="text-[13px] font-medium text-neutral-900 dark:text-white">
            Endpoints
          </span>
          <button
            type="button"
            aria-label="Add endpoint"
            className={cx(
              "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300",
              "hover:bg-neutral-100 dark:hover:bg-neutral-900",
              transition,
              focus,
            )}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {items.map((e) => {
            const on = e.id === active;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  setActive(e.id);
                  setOpen(DELIVERIES[e.id]?.[0]?.id ?? null);
                }}
                aria-current={on ? "true" : undefined}
                className={cx(
                  "relative mb-1 w-full cursor-pointer rounded-[var(--rb-r-lg,10px)] px-3 py-2.5 text-left",
                  on
                    ? "bg-neutral-100 dark:bg-neutral-900"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
                  transition,
                  focus,
                )}
              >
                <div className="flex items-center gap-2">
                  <Webhook
                    className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-neutral-900 dark:text-white">
                    {e.url.replace(/^https:\/\//, "")}
                  </span>
                  <span
                    aria-hidden
                    className={cx(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      e.enabled
                        ? "bg-emerald-500"
                        : "bg-neutral-300 dark:bg-neutral-600",
                    )}
                  />
                </div>
                <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                  {e.events.length} events ·{" "}
                  <span className="tabular-nums">{e.rate}%</span> delivered
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-800">
          <div className="min-w-0">
            <p className="truncate font-mono text-[13px] text-neutral-900 dark:text-white">
              {endpoint.url}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {endpoint.events.map((ev) => (
                <span
                  key={ev}
                  className="inline-flex h-5 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 font-mono text-[11.5px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {ev}
                </span>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className={cx(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-2.5 text-[13px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
                "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                transition,
                focus,
              )}
            >
              <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} />
              Send test
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={endpoint.enabled}
              aria-label="Endpoint enabled"
              onClick={() =>
                setItems((p) =>
                  p.map((x) =>
                    x.id === endpoint.id ? { ...x, enabled: !x.enabled } : x,
                  ),
                )
              }
              className={cx(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border",
                endpoint.enabled
                  ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                  : "border-neutral-300 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700",
                transition,
                focus,
              )}
            >
              <motion.span
                aria-hidden
                animate={{ x: endpoint.enabled ? 18 : 2 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 520, damping: 34 }
                }
                className="h-4 w-4 rounded-full bg-white dark:bg-neutral-900"
              />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {log.length > 0 ? (
            <ul>
              {log.map((d) => {
                const isOpen = d.id === open;
                return (
                  <li
                    key={d.id}
                    className="border-b border-neutral-200/70 last:border-0 dark:border-neutral-800/70"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : d.id)}
                      className={cx(
                        "flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
                        transition,
                        focus,
                      )}
                    >
                      <ChevronRight
                        aria-hidden
                        className={cx(
                          "h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-150",
                          isOpen && "rotate-90",
                        )}
                        strokeWidth={1.75}
                      />
                      <span
                        className={cx(
                          "w-9 shrink-0 text-[13px] tabular-nums",
                          tone(d.status),
                        )}
                      >
                        {d.status}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-neutral-900 dark:text-white">
                        {d.event}
                      </span>
                      <span className="hidden shrink-0 text-[12px] text-neutral-500 tabular-nums sm:inline dark:text-neutral-400">
                        {d.attempts} {d.attempts === 1 ? "attempt" : "attempts"}
                      </span>
                      <span className="shrink-0 text-[12px] text-neutral-500 tabular-nums dark:text-neutral-400">
                        {d.ms} ms
                      </span>
                      <span className="shrink-0 text-[12px] text-neutral-400 tabular-nums dark:text-neutral-500">
                        {d.at}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduce ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pt-1 pb-4">
                            <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950">
                              <pre className="overflow-x-auto rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-3 font-mono text-[12px] leading-5 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                                {d.body}
                              </pre>
                            </div>
                            {d.status >= 400 && (
                              <button
                                type="button"
                                className={cx(
                                  "mt-2.5 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-2.5 text-[13px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
                                  "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                                  transition,
                                  focus,
                                )}
                              >
                                <RotateCw
                                  className="h-3.5 w-3.5"
                                  strokeWidth={1.75}
                                />
                                Replay delivery
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-20 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-xl,12px)] border border-neutral-200/70 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500">
                <Webhook className="h-4.5 w-4.5" strokeWidth={1.5} />
              </span>
              <p className="mt-3 text-[14px] font-medium text-neutral-900 dark:text-white">
                No deliveries yet
              </p>
              <p className="mt-1 max-w-[300px] text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
                This endpoint is paused. Enable it, or send a test event to
                confirm the receiver responds.
              </p>
            </div>
          )}
        </div>
        <p className="sr-only" aria-live="polite" id={`${uid}-live`}>
          {log.length} deliveries shown
        </p>
      </section>
    </div>
  );
}

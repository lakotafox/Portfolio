"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

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

const RANGES = [30, 60, 90] as const;
type Range = (typeof RANGES)[number];

type Day = "up" | "partial" | "down";

const SERVICES = [
  { id: "api", name: "API", seed: 3 },
  { id: "dash", name: "Dashboard", seed: 11 },
  { id: "pay", name: "Payments", seed: 5 },
  { id: "web", name: "Webhooks", seed: 17 },
  { id: "search", name: "Search", seed: 23 },
  { id: "cdn", name: "Asset CDN", seed: 29 },
] as const;

function days(seed: number, count: number): Day[] {
  return Array.from({ length: count }, (_, i) => {
    const n = (i * 37 + seed * 53) % 101;
    if (n === 0 || n === 13) return "down";
    if (n < 6) return "partial";
    return "up";
  });
}

const BAR: Record<Day, string> = {
  up: "bg-neutral-200 dark:bg-neutral-700",
  partial: "bg-amber-500",
  down: "bg-red-500",
};

const LABEL: Record<Day, string> = {
  up: "Operational",
  partial: "Degraded",
  down: "Outage",
};

const INCIDENTS: Record<string, { at: string; text: string }[]> = {
  api: [
    { at: "Jun 02", text: "Elevated 5xx for 18 minutes after a bad deploy." },
  ],
  pay: [
    { at: "Jun 09", text: "Checkout latency above budget for 37 minutes." },
    { at: "May 21", text: "Vendor 503s caused a retry storm for 12 minutes." },
  ],
  search: [
    {
      at: "May 28",
      text: "Embeddings index read latency degraded for 11 minutes.",
    },
  ],
};

export default function Monitoring6() {
  const [range, setRange] = useState<Range>(90);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hover, setHover] = useState<{ id: string; i: number } | null>(null);

  const rows = useMemo(
    () =>
      SERVICES.map((s) => {
        const list = days(s.seed, range);
        const bad = list.filter((d) => d !== "up").length;
        const uptime = 100 - (bad / range) * 0.9;
        return { ...s, list, uptime, incidents: INCIDENTS[s.id] ?? [] };
      }),
    [range],
  );

  const degraded = rows.filter((r) =>
    r.list.slice(-1).some((d) => d !== "up"),
  ).length;

  const overall = rows.reduce((s, r) => s + r.uptime, 0) / rows.length;

  return (
    <div className="flex h-full min-h-[600px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto flex min-h-0 w-full max-w-[1000px] flex-1 flex-col gap-1",
        )}
      >
        <div
          className={cx(
            panel,
            "flex flex-wrap items-center justify-between gap-3 px-4 py-3.5",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={cx(
                  "h-2 w-2 shrink-0 rounded-full",
                  degraded > 0
                    ? "bg-amber-500"
                    : "bg-neutral-300 dark:bg-neutral-600",
                )}
              />
              <h2 className="truncate text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                {degraded > 0
                  ? `${degraded} service${degraded > 1 ? "s" : ""} degraded`
                  : "All systems operational"}
              </h2>
            </div>
            <p className="mt-0.5 truncate text-[12px] text-neutral-500 tabular-nums">
              {overall.toFixed(3)}% average uptime over {range} days
            </p>
          </div>

          <div
            role="tablist"
            aria-label="History window"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800/60"
          >
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={r === range}
                onClick={() => {
                  setRange(r);
                  setHover(null);
                }}
                className={cx(
                  "inline-flex h-6 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[12px] font-medium tabular-nums",
                  transition,
                  focus,
                  r === range
                    ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto p-2")}>
          <ul className="space-y-1">
            {rows.map((r) => {
              const isOpen = expanded === r.id;
              const cursor = hover?.id === r.id ? hover.i : null;
              return (
                <li
                  key={r.id}
                  className="rounded-[var(--rb-r-md,8px)] bg-neutral-50 p-3 dark:bg-neutral-800/40"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      className={cx(
                        "inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] text-[13px] font-medium text-neutral-900 dark:text-neutral-100",
                        focus,
                      )}
                    >
                      <ChevronRight
                        aria-hidden
                        className={cx(
                          "h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-150 ease-out motion-reduce:transition-none",
                          isOpen && "rotate-90",
                        )}
                      />
                      <span className="truncate">{r.name}</span>
                    </button>
                    <p className="grid shrink-0 justify-items-end text-right text-[12px] whitespace-nowrap tabular-nums">
                      <span
                        aria-hidden={cursor !== null}
                        className={cx(
                          "col-start-1 row-start-1 justify-self-end text-neutral-500",
                          cursor !== null && "invisible",
                        )}
                      >
                        {r.uptime.toFixed(2)}% uptime
                      </span>
                      <span
                        aria-hidden={cursor === null}
                        className={cx(
                          "col-start-1 row-start-1 inline-flex items-center justify-end gap-1.5 justify-self-end text-neutral-600 dark:text-neutral-300",
                          cursor === null && "invisible",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cx(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            cursor !== null && r.list[cursor] === "up"
                              ? "bg-neutral-300 dark:bg-neutral-600"
                              : cursor !== null
                                ? BAR[r.list[cursor]]
                                : "",
                          )}
                        />
                        {cursor === null
                          ? `Operational · ${range}d ago`
                          : `${LABEL[r.list[cursor]]} · ${range - cursor}d ago`}
                      </span>
                    </p>
                  </div>

                  <div
                    role="img"
                    aria-label={`${r.name} daily status for the last ${range} days, ${r.uptime.toFixed(2)}% uptime`}
                    onPointerLeave={() => setHover(null)}
                    className="mt-2 flex h-7 items-stretch gap-[2px]"
                  >
                    {r.list.map((d, i) => (
                      <span
                        key={i}
                        onPointerEnter={() => setHover({ id: r.id, i })}
                        className={cx(
                          "min-w-0 flex-1 rounded-[2px]",
                          BAR[d],
                          cursor === i &&
                            "outline-2 outline-offset-1 outline-neutral-400 dark:outline-neutral-500",
                        )}
                      />
                    ))}
                  </div>

                  {isOpen && (
                    <div className="mt-3">
                      {r.incidents.length === 0 ? (
                        <p className="text-[12px] text-neutral-500">
                          No incidents recorded in this window.
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {r.incidents.map((inc) => (
                            <li
                              key={inc.at}
                              className="flex gap-2.5 text-[12px] leading-relaxed"
                            >
                              <span className="w-[52px] shrink-0 text-neutral-400 tabular-nums">
                                {inc.at}
                              </span>
                              <span className="min-w-0 flex-1 text-neutral-600 dark:text-neutral-400">
                                {inc.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className={cx(
            panel,
            "flex flex-wrap items-center justify-between gap-3 px-3 py-2",
          )}
        >
          <p className="text-[12px] text-neutral-500 tabular-nums">
            {range} days ago
          </p>
          <ul className="flex flex-wrap items-center gap-3">
            {(["up", "partial", "down"] as Day[]).map((d) => (
              <li
                key={d}
                className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500"
              >
                <span
                  aria-hidden
                  className={cx("h-1.5 w-1.5 shrink-0 rounded-full", BAR[d])}
                />
                {LABEL[d]}
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-neutral-500">Today</p>
        </div>
      </div>
    </div>
  );
}

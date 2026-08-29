"use client";

import { useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Plus, Search, Sparkles } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

type App = {
  name: string;
  mark: string;
  group: string;
  blurb: string;
  connected?: boolean;
};

const APPS: App[] = [
  {
    name: "Northwind",
    mark: "NW",
    group: "Analytics",
    blurb: "Stream product events into Northwind dashboards.",
    connected: true,
  },
  {
    name: "Cedar Labs",
    mark: "CL",
    group: "Developer",
    blurb: "Open an issue whenever a deploy check fails.",
    connected: true,
  },
  {
    name: "Harbor",
    mark: "HB",
    group: "Messaging",
    blurb: "Post alerts and approvals into a shared channel.",
  },
  {
    name: "Meridian",
    mark: "MD",
    group: "Storage",
    blurb: "Archive exports to a bucket you control.",
  },
  {
    name: "Alder",
    mark: "AL",
    group: "Analytics",
    blurb: "Warehouse sync for usage and billing tables.",
  },
  {
    name: "Fernrock",
    mark: "FR",
    group: "Developer",
    blurb: "Run a workflow when an environment is promoted.",
  },
  {
    name: "Tidepool",
    mark: "TP",
    group: "Messaging",
    blurb: "Route incidents to the on-call rotation.",
  },
  {
    name: "Quarry",
    mark: "QR",
    group: "Storage",
    blurb: "Mirror audit logs to cold storage nightly.",
  },
  {
    name: "Lantern",
    mark: "LN",
    group: "Security",
    blurb: "Send sign-in anomalies to your SIEM.",
  },
];

const GROUPS = [
  "All",
  "Analytics",
  "Developer",
  "Messaging",
  "Storage",
  "Security",
];

export default function Integrations1() {
  const uid = useId();
  const reduce = useReducedMotion();
  const [group, setGroup] = useState("All");
  const [q, setQ] = useState("");
  const [connected, setConnected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      APPS.filter((a) => a.connected).map((a) => [a.name, true]),
    ),
  );

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return APPS.filter(
      (a) =>
        (group === "All" || a.group === group) &&
        (!needle ||
          a.name.toLowerCase().includes(needle) ||
          a.blurb.toLowerCase().includes(needle)),
    );
  }, [group, q]);

  const count = Object.values(connected).filter(Boolean).length;

  return (
    <div className="relative flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="shrink-0 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-white">
              Integrations
            </h2>
            <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
              <span className="tabular-nums">{count}</span> connected ·{" "}
              <span className="tabular-nums">{APPS.length}</span> available
            </p>
          </div>

          <div className="relative w-full sm:w-[248px]">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
              strokeWidth={1.75}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search integrations"
              aria-label="Search integrations"
              className={cx(
                "h-8 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pr-2.5 pl-8 text-[13px] text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white",
                transition,
                focus,
              )}
            />
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Category"
          className="mt-3.5 -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5"
        >
          {GROUPS.map((g) => {
            const on = g === group;
            return (
              <button
                key={g}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setGroup(g)}
                className={cx(
                  "relative inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px]",
                  on
                    ? "text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white",
                  transition,
                  focus,
                )}
              >
                {on && (
                  <motion.span
                    layoutId={`${uid}-group`}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 460, damping: 36 }
                    }
                    className="absolute inset-0 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                  />
                )}
                <span className="relative">{g}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {list.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((a) => {
              const on = !!connected[a.name];
              return (
                <motion.article
                  key={a.name}
                  layout={!reduce}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="flex flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white text-[12px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
                    >
                      {a.mark}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[14px] font-medium text-neutral-900 dark:text-white">
                        {a.name}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
                        {a.group}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 flex-1 text-[13px] leading-5 text-neutral-600 dark:text-neutral-400">
                    {a.blurb}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setConnected((p) => ({ ...p, [a.name]: !p[a.name] }))
                    }
                    className={cx(
                      "mt-4 inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-3 text-[13px]",
                      on
                        ? "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        : "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                      transition,
                      focus,
                    )}
                  >
                    {on ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                        Connected
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        Connect
                      </>
                    )}
                  </button>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-xl,12px)] border border-neutral-200/70 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500">
              <Sparkles className="h-4.5 w-4.5" strokeWidth={1.5} />
            </span>
            <p className="mt-3 text-[14px] font-medium text-neutral-900 dark:text-white">
              No integrations match
            </p>
            <p className="mt-1 max-w-[280px] text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
              Try a different category, or clear the search to see everything
              available.
            </p>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setGroup("All");
              }}
              className={cx(
                "mt-4 inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-3 text-[13px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
                "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                transition,
                focus,
              )}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

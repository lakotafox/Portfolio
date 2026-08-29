"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  Database,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
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

type Group = "running" | "waiting" | "failed";
type Flag = "on-track" | "needs-approval" | "retrying" | "escalated";

type Run = {
  id: string;
  group: Group;
  icon: typeof CreditCard;
  title: string;
  sub: string;
  initials: string;
  env: "Production" | "Staging" | "Development";
  at: string;
  progress: number | null;
  flag: Flag;
};

const RUNS: Run[] = [
  {
    id: "r1",
    group: "running",
    icon: CreditCard,
    title: "Refund duplicate charge on ORD-99214",
    sub: "Step 4 of 6 · Matching the second transaction in the payout file",
    initials: "PP",
    env: "Production",
    at: "2m ago",
    progress: 62,
    flag: "on-track",
  },
  {
    id: "r2",
    group: "running",
    icon: Send,
    title: "Draft renewal outreach for 38 Q3 accounts",
    sub: "Step 2 of 5 · Pulling usage summaries for segment B",
    initials: "TP",
    env: "Production",
    at: "8m ago",
    progress: 35,
    flag: "on-track",
  },
  {
    id: "r3",
    group: "running",
    icon: Database,
    title: "Dedupe 412 contacts imported from the spring list",
    sub: "Step 3 of 4 · Merging 57 confirmed duplicate pairs",
    initials: "NV",
    env: "Staging",
    at: "14m ago",
    progress: 70,
    flag: "on-track",
  },
  {
    id: "r4",
    group: "running",
    icon: CreditCard,
    title: "Refund damaged item claim on ORD-99187",
    sub: "Step 5 of 6 · Waiting on finance approval for the €1,240 credit",
    initials: "MS",
    env: "Production",
    at: "22m ago",
    progress: 81,
    flag: "needs-approval",
  },
  {
    id: "r5",
    group: "running",
    icon: FileText,
    title: "Summarise the Meridian master services agreement",
    sub: "Step 1 of 3 · Splitting 84 pages into clause sections",
    initials: "KT",
    env: "Development",
    at: "31m ago",
    progress: 15,
    flag: "on-track",
  },
  {
    id: "r6",
    group: "waiting",
    icon: FileText,
    title: "Reconcile 23 June freight invoices",
    sub: "Queued 18 min · Position 2 in the finance lane",
    initials: "LG",
    env: "Production",
    at: "18m ago",
    progress: null,
    flag: "on-track",
  },
  {
    id: "r7",
    group: "waiting",
    icon: Send,
    title: "Send onboarding nudges to 112 trial signups",
    sub: "Step 1 of 4 · Rate limited by the email provider, retry at 13:40",
    initials: "PP",
    env: "Production",
    at: "26m ago",
    progress: 10,
    flag: "retrying",
  },
  {
    id: "r8",
    group: "waiting",
    icon: Sparkles,
    title: "Enrich 64 new leads from the partner webinar",
    sub: "Queued 32 min · Waiting for the enrichment API window",
    initials: "TP",
    env: "Staging",
    at: "32m ago",
    progress: null,
    flag: "on-track",
  },
  {
    id: "r9",
    group: "waiting",
    icon: Database,
    title: "Archive conversations older than 180 days",
    sub: "Queued 1 h · Scheduled for the low traffic window at 02:00",
    initials: "NV",
    env: "Production",
    at: "1h ago",
    progress: null,
    flag: "on-track",
  },
  {
    id: "r10",
    group: "failed",
    icon: CreditCard,
    title: "Refund partial return on ORD-99102 for Cedar Labs",
    sub: "Failed at step 3 of 6 · The processor declined the partial capture",
    initials: "MS",
    env: "Production",
    at: "1h ago",
    progress: 48,
    flag: "escalated",
  },
  {
    id: "r11",
    group: "failed",
    icon: FileText,
    title: "Match 9 supplier invoices to June purchase orders",
    sub: "Failed at step 2 of 5 · Two invoices reference a closed PO",
    initials: "LG",
    env: "Production",
    at: "2h ago",
    progress: 32,
    flag: "escalated",
  },
  {
    id: "r12",
    group: "failed",
    icon: Sparkles,
    title: "Classify 240 support threads for the quarterly review",
    sub: "Failed at step 1 of 2 · The label schema no longer matches",
    initials: "KT",
    env: "Staging",
    at: "3h ago",
    progress: 12,
    flag: "retrying",
  },
];

const GROUPS: { id: Group; label: string; dot: string; hint: string }[] = [
  {
    id: "running",
    label: "Running",
    dot: "bg-neutral-400 dark:bg-neutral-500",
    hint: "Live executions streaming steps right now",
  },
  {
    id: "waiting",
    label: "Waiting",
    dot: "bg-neutral-300 dark:bg-neutral-600",
    hint: "Queued behind approvals, rate limits or schedules",
  },
  {
    id: "failed",
    label: "Failed",
    dot: "bg-red-500",
    hint: "Stopped runs awaiting retry or escalation",
  },
];

const FLAG_LABEL: Record<Flag, string> = {
  "on-track": "On track",
  "needs-approval": "Needs approval",
  retrying: "Retrying",
  escalated: "Escalated",
};

const ENV_DOT: Record<Run["env"], string> = {
  Production: "bg-neutral-400 dark:bg-neutral-500",
  Staging: "bg-neutral-300 dark:bg-neutral-600",
  Development: "bg-neutral-200 dark:bg-neutral-700",
};

function Ring({ value }: { value: number }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden>
      <circle
        cx={10}
        cy={10}
        r={r}
        fill="none"
        strokeWidth={2.5}
        className="stroke-neutral-200 dark:stroke-neutral-700"
      />
      <circle
        cx={10}
        cy={10}
        r={r}
        fill="none"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 10 10)"
        className="stroke-neutral-900 transition-[stroke-dasharray] duration-500 ease-out motion-reduce:transition-none dark:stroke-white"
      />
    </svg>
  );
}

export default function Monitoring9() {
  const [query, setQuery] = useState("");
  const [attention, setAttention] = useState(false);
  const [collapsed, setCollapsed] = useState<Group[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      RUNS.filter((r) => r.progress !== null).map((r) => [r.id, r.progress!]),
    ),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = { ...p };
        RUNS.filter(
          (r) => r.group === "running" && r.progress !== null,
        ).forEach((r) => {
          next[r.id] = next[r.id] >= 97 ? r.progress! : next[r.id] + 1;
        });
        return next;
      });
    }, 1400);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RUNS.filter((r) => {
      if (attention && r.flag !== "escalated" && r.flag !== "needs-approval")
        return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)
      );
    });
  }, [query, attention]);

  const counters = [
    { label: "Runs", value: filtered.length, tone: "neutral" as const },
    {
      label: "Escalated",
      value: filtered.filter((r) => r.flag === "escalated").length,
      tone: "danger" as const,
    },
    {
      label: "Needs approval",
      value: filtered.filter((r) => r.flag === "needs-approval").length,
      tone: "warning" as const,
    },
    {
      label: "Retrying",
      value: filtered.filter((r) => r.flag === "retrying").length,
      tone: "neutral" as const,
    },
  ];

  const allCollapsed = collapsed.length === GROUPS.length;

  return (
    <div className="flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className={cx(frame, "flex min-h-0 flex-1 flex-col gap-1")}>
        <div className={cx(panel, "px-4 py-3.5")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                  Run queue
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500"
                  />
                  Live
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                Triage the live agent run backlog.
              </p>
            </div>

            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {counters.map((c) => (
                <li key={c.label} className="flex items-baseline gap-1.5">
                  <span className="text-[12px] text-neutral-500">
                    {c.label}
                  </span>
                  <span
                    className={cx(
                      "text-[13px] font-medium tabular-nums",
                      c.value === 0
                        ? "text-neutral-400"
                        : c.tone === "danger"
                          ? "text-red-600 dark:text-red-400"
                          : c.tone === "warning"
                            ? "text-amber-600 dark:text-amber-500"
                            : "text-neutral-900 dark:text-neutral-100",
                    )}
                  >
                    {c.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-[300px]">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <label htmlFor="monitoring-9-search" className="sr-only">
                Search runs
              </label>
              <input
                id="monitoring-9-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search runs…"
                className={cx(
                  "h-8 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pr-2.5 pl-8 text-[13px] text-neutral-900 placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
                  transition,
                  focus,
                )}
              />
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                aria-pressed={attention}
                onClick={() => setAttention((a) => !a)}
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border px-2.5 text-[13px] font-medium",
                  transition,
                  focus,
                  attention
                    ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                )}
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
                Attention
              </button>
              <button
                type="button"
                onClick={() =>
                  setCollapsed(allCollapsed ? [] : GROUPS.map((g) => g.id))
                }
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                {allCollapsed ? "Expand groups" : "Collapse groups"}
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                  transition,
                  focus,
                )}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                New run
              </button>
            </div>
          </div>
        </div>

        <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto p-2")}>
          {filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                Queue is clear
              </p>
              <p className="mt-1 max-w-[300px] text-[12px] text-neutral-500">
                No runs match this view. Everything else is progressing on its
                own.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {GROUPS.map((g) => {
                const items = filtered.filter((r) => r.group === g.id);
                if (items.length === 0) return null;
                const isOpen = !collapsed.includes(g.id);
                return (
                  <section key={g.id}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setCollapsed((c) =>
                          c.includes(g.id)
                            ? c.filter((x) => x !== g.id)
                            : [...c, g.id],
                        )
                      }
                      className={cx(
                        "flex w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-neutral-50 px-3 py-2 text-left dark:bg-neutral-800/40",
                        transition,
                        focus,
                      )}
                    >
                      <ChevronDown
                        aria-hidden
                        className={cx(
                          "h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-150 ease-out motion-reduce:transition-none",
                          !isOpen && "-rotate-90",
                        )}
                      />
                      <span
                        aria-hidden
                        className={cx(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          g.dot,
                        )}
                      />
                      <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        {g.label}
                      </span>
                      <span className="text-[12px] text-neutral-500 tabular-nums">
                        {items.length}
                      </span>
                      <span className="ml-auto hidden truncate text-[12px] text-neutral-500 md:block">
                        {g.hint}
                      </span>
                    </button>

                    {isOpen && (
                      <ul className="mt-1">
                        {items.map((r) => {
                          const Icon = r.icon;
                          const pct = progress[r.id];
                          return (
                            <li key={r.id}>
                              <div
                                className={cx(
                                  "flex items-center gap-3 rounded-[var(--rb-r-md,8px)] px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40",
                                  transition,
                                )}
                              >
                                <Icon
                                  className="h-4 w-4 shrink-0 text-neutral-400"
                                  aria-hidden
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                                    {r.title}
                                  </p>
                                  <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                                    {r.sub}
                                  </p>
                                </div>
                                <span
                                  aria-hidden
                                  className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 sm:flex dark:bg-neutral-800 dark:text-neutral-300"
                                >
                                  {r.initials}
                                </span>
                                <span className="hidden w-[104px] shrink-0 items-center gap-1.5 text-[12px] text-neutral-500 lg:inline-flex">
                                  <span
                                    aria-hidden
                                    className={cx(
                                      "h-1.5 w-1.5 shrink-0 rounded-full",
                                      ENV_DOT[r.env],
                                    )}
                                  />
                                  {r.env}
                                </span>
                                <span className="hidden w-[64px] shrink-0 text-[12px] text-neutral-500 tabular-nums xl:block">
                                  {r.at}
                                </span>
                                <span className="flex w-[62px] shrink-0 items-center justify-end gap-1.5">
                                  {pct === undefined ? (
                                    <span className="text-[12px] text-neutral-400">
                                      -
                                    </span>
                                  ) : (
                                    <>
                                      <Ring value={pct} />
                                      <span className="text-[12px] text-neutral-600 tabular-nums dark:text-neutral-300">
                                        {Math.round(pct)}%
                                      </span>
                                    </>
                                  )}
                                </span>
                                <span
                                  className={cx(
                                    "hidden w-[104px] shrink-0 text-right text-[12px] sm:block",
                                    r.flag === "escalated"
                                      ? "text-red-600 dark:text-red-400"
                                      : r.flag === "needs-approval"
                                        ? "text-amber-600 dark:text-amber-500"
                                        : "text-neutral-500",
                                  )}
                                >
                                  {FLAG_LABEL[r.flag]}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Actions for ${r.title}`}
                                  className={cx(
                                    "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                                    transition,
                                    focus,
                                  )}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Bell, Database, Mail, Users, Zap } from "lucide-react";

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

const METERS = [
  {
    id: "seats",
    icon: Users,
    name: "Seats",
    unit: "seats",
    used: 24,
    included: 20,
    rate: 12,
  },
  {
    id: "api",
    icon: Zap,
    name: "API calls",
    unit: "calls",
    used: 468_000,
    included: 500_000,
    rate: 0.00012,
  },
  {
    id: "storage",
    icon: Database,
    name: "Storage",
    unit: "GB",
    used: 96,
    included: 100,
    rate: 0.4,
  },
  {
    id: "email",
    icon: Mail,
    name: "Transactional email",
    unit: "sends",
    used: 118_400,
    included: 250_000,
    rate: 0.0004,
  },
];

const CYCLES = ["This cycle", "Last cycle", "Cycle to date"] as const;

const num = (n: number) => n.toLocaleString("en-US");
const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Billing7() {
  const [cycle, setCycle] = useState<(typeof CYCLES)[number]>("This cycle");

  const rows = useMemo(
    () =>
      METERS.map((m) => {
        const over = Math.max(m.used - m.included, 0);
        return {
          ...m,
          over,
          pct: Math.min((m.used / m.included) * 100, 100),
          cost: over * m.rate,
          nearing: !over && m.used / m.included >= 0.9,
        };
      }),
    [],
  );

  const base = 89 * 20;
  const overage = rows.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="flex h-full min-h-[800px] w-full flex-col overflow-y-auto bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[900px] flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[17px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Usage and overages
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Growth plan · Jun 1 to Jun 30 · 12 days remaining
            </p>
          </div>
          <div
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
            role="tablist"
            aria-label="Billing cycle"
          >
            {CYCLES.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={c === cycle}
                onClick={() => setCycle(c)}
                className={cx(
                  "h-7 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                  transition,
                  focus,
                  c === cycle
                    ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className={cx(frame, "mt-4 grid gap-1 sm:grid-cols-3")}>
          {[
            {
              label: "Estimated total",
              value: usd(base + overage),
              hint: "Billed Jul 1",
            },
            {
              label: "Plan subscription",
              value: usd(base),
              hint: "20 seats included",
            },
            {
              label: "Metered overage",
              value: usd(overage),
              hint: `${rows.filter((r) => r.over > 0).length} meter${rows.filter((r) => r.over > 0).length === 1 ? "" : "s"} over`,
            },
          ].map((s, i) => (
            <div key={s.label} className={cx(panel, "p-4")}>
              <p className="text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
                {s.label}
              </p>
              <p
                className={cx(
                  "mt-1.5 leading-none font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100",
                  i === 0 ? "text-[28px]" : "text-[20px]",
                )}
              >
                {s.value}
              </p>
              <p className="mt-2 text-[12px] text-neutral-500">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
              Metered entitlements
            </h3>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Anything beyond the included allowance bills at the listed rate.
            </p>
          </div>
          <button
            type="button"
            className={cx(
              "hidden h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 sm:inline-flex dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
              transition,
              focus,
            )}
          >
            <Bell className="h-3.5 w-3.5" aria-hidden />
            Set an alert
          </button>
        </div>

        <div className={cx(frame, "mt-3 space-y-1")}>
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.id} className={cx(panel, "px-4 py-3")}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    <Icon
                      className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                      aria-hidden
                    />
                    <span className="truncate">{r.name}</span>
                    {r.over > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-normal text-neutral-500">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full bg-red-500"
                        />
                        Over allowance
                      </span>
                    )}
                    {r.nearing && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-normal text-neutral-500">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full bg-amber-500"
                        />
                        Nearing limit
                      </span>
                    )}
                  </p>
                  <p className="shrink-0 text-[13px] text-neutral-500 tabular-nums">
                    {num(r.used)} of {num(r.included)} {r.unit}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                    role="presentation"
                  >
                    <div
                      className={cx(
                        "h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
                        r.over > 0
                          ? "bg-red-500"
                          : r.nearing
                            ? "bg-amber-500"
                            : "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
                      )}
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-[12px] text-neutral-500 tabular-nums">
                    {Math.round((r.used / r.included) * 100)}%
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <p className="text-[12px] text-neutral-500">
                    {r.over > 0
                      ? `${num(r.over)} ${r.unit} over at ${usd(r.rate)} each`
                      : `${num(r.included - r.used)} ${r.unit} left this cycle`}
                  </p>
                  <p
                    className={cx(
                      "text-[13px] font-medium tabular-nums",
                      r.over > 0
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-400",
                    )}
                  >
                    {r.over > 0 ? usd(r.cost) : usd(0)}
                  </p>
                </div>
              </div>
            );
          })}

          <div
            className={cx(
              panel,
              "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            <p className="text-[13px] text-neutral-500">
              {cycle} closes Jun 30. Overage is invoiced with the next
              subscription charge.
            </p>
            <p className="shrink-0 text-[15px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
              {usd(overage)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

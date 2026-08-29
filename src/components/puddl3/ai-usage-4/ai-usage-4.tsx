"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950";

const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`
      : `${n}`;

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

type Seat = {
  name: string;
  email: string;
  team: string;
  tokens: number;
  cost: number;
  seatCap: number;
};

const SEATS: Seat[] = [
  {
    name: "Priya Nandakumar",
    email: "priya@northwind.io",
    team: "Platform",
    tokens: 41_800_000,
    cost: 384,
    seatCap: 500,
  },
  {
    name: "Marcus Bell",
    email: "marcus@northwind.io",
    team: "Support",
    tokens: 28_400_000,
    cost: 261,
    seatCap: 300,
  },
  {
    name: "Sofia Alvarez",
    email: "sofia@northwind.io",
    team: "Platform",
    tokens: 22_100_000,
    cost: 203,
    seatCap: 500,
  },
  {
    name: "Tomás Guerrero",
    email: "tomas@northwind.io",
    team: "Research",
    tokens: 19_600_000,
    cost: 180,
    seatCap: 200,
  },
  {
    name: "Wei Chen",
    email: "wei@northwind.io",
    team: "Support",
    tokens: 11_200_000,
    cost: 103,
    seatCap: 300,
  },
  {
    name: "Amelia Whitfield",
    email: "amelia@northwind.io",
    team: "Research",
    tokens: 6_400_000,
    cost: 59,
    seatCap: 200,
  },
  {
    name: "Jonas Vikander",
    email: "jonas@northwind.io",
    team: "Platform",
    tokens: 2_900_000,
    cost: 27,
    seatCap: 500,
  },
];

const TEAMS = ["All teams", "Platform", "Support", "Research"] as const;
type Team = (typeof TEAMS)[number];

export default function AiUsage4() {
  const [team, setTeam] = useState<Team>("All teams");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEATS.filter(
      (seat) =>
        (team === "All teams" || seat.team === team) &&
        (!q ||
          seat.name.toLowerCase().includes(q) ||
          seat.email.toLowerCase().includes(q)),
    );
  }, [team, query]);

  const spend = rows.reduce((sum, seat) => sum + seat.cost, 0);

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[720px]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Usage by member
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              {money(spend)} across {rows.length} seat
              {rows.length === 1 ? "" : "s"} this month.
            </p>
          </div>

          <div className="relative shrink-0">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members"
              aria-label="Search members"
              className={cx(
                "h-8 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pr-3 pl-8 text-[13px] text-neutral-900 placeholder:text-neutral-400 sm:w-56 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
                transition,
                focus,
              )}
            />
          </div>
        </div>

        <div className={cx(frame, "space-y-1")}>
          <div
            className={cx(panel, "flex items-center gap-0.5 p-1")}
            role="tablist"
            aria-label="Team"
          >
            {TEAMS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={option === team}
                onClick={() => setTeam(option)}
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-3 text-[13px]",
                  option === team
                    ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <div className={cx(panel, "min-h-[320px]")}>
            {rows.length === 0 ? (
              <div className="flex h-[320px] flex-col items-center justify-center gap-1 px-6 text-center">
                <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  No members match
                </p>
                <p className="text-[13px] text-neutral-500">
                  Try a different name or clear the team filter.
                </p>
              </div>
            ) : (
              rows.map((seat) => {
                const pct = Math.min(100, (seat.cost / seat.seatCap) * 100);
                return (
                  <div
                    key={seat.email}
                    className={cx(
                      "flex items-center gap-3 px-4 py-3",
                      transition,
                      "hover:bg-neutral-50 dark:hover:bg-neutral-900",
                    )}
                  >
                    <span
                      aria-hidden
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {initials(seat.name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        {seat.name}
                      </p>
                      <p className="truncate text-[12px] text-neutral-500">
                        {seat.team} · {compact(seat.tokens)} tokens
                      </p>
                    </div>

                    <div className="hidden w-32 shrink-0 sm:block">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900">
                        <div
                          className={cx(
                            "h-full rounded-full",
                            pct >= 75
                              ? "bg-neutral-900 dark:bg-neutral-100"
                              : "bg-neutral-400 dark:bg-neutral-500",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-500 tabular-nums">
                        {Math.round(pct)}% of {money(seat.seatCap)} cap
                      </p>
                    </div>

                    <p className="w-16 shrink-0 text-right text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                      {money(seat.cost)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

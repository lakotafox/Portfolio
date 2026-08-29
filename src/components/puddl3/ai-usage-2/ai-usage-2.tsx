"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

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
  `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type Model = {
  name: string;
  provider: string;
  requests: number;
  input: number;
  output: number;
  cost: number;
  delta: number;
};

const MODELS: Model[] = [
  {
    name: "Atlas Pro",
    provider: "Meridian Labs",
    requests: 48_210,
    input: 214_800_000,
    output: 61_400_000,
    cost: 1565.4,
    delta: 12.4,
  },
  {
    name: "Atlas",
    provider: "Meridian Labs",
    requests: 126_940,
    input: 388_200_000,
    output: 94_700_000,
    cost: 812.06,
    delta: -4.1,
  },
  {
    name: "Atlas Long",
    provider: "Meridian Labs",
    requests: 6_480,
    input: 512_600_000,
    output: 18_900_000,
    cost: 704.28,
    delta: 31.7,
  },
  {
    name: "Quill",
    provider: "Northwind AI",
    requests: 71_360,
    input: 142_100_000,
    output: 40_300_000,
    cost: 356.72,
    delta: 2.8,
  },
  {
    name: "Ember",
    provider: "Orbital",
    requests: 213_780,
    input: 96_400_000,
    output: 22_100_000,
    cost: 118.94,
    delta: -18.3,
  },
  {
    name: "Ember Mini",
    provider: "Orbital",
    requests: 402_150,
    input: 61_700_000,
    output: 14_800_000,
    cost: 42.6,
    delta: 46.2,
  },
];

const COLUMNS = [
  { key: "cost", label: "Cost" },
  { key: "requests", label: "Requests" },
  { key: "tokens", label: "Tokens" },
] as const;
type SortKey = (typeof COLUMNS)[number]["key"];

const value = (m: Model, key: SortKey) =>
  key === "cost"
    ? m.cost
    : key === "requests"
      ? m.requests
      : m.input + m.output;

export default function AiUsage2() {
  const [sort, setSort] = useState<SortKey>("cost");

  const rows = useMemo(
    () => [...MODELS].sort((a, b) => value(b, sort) - value(a, sort)),
    [sort],
  );

  const total = rows.reduce((sum, m) => sum + m.cost, 0);
  const max = value(rows[0], sort);

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[940px]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Spend by model
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              {money(total)} across {rows.length} models this billing period.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Sort by"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            {COLUMNS.map((column) => (
              <button
                key={column.key}
                type="button"
                role="tab"
                aria-selected={column.key === sort}
                onClick={() => setSort(column.key)}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                  column.key === sort
                    ? "bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {column.label}
              </button>
            ))}
          </div>
        </div>

        <div className={frame}>
          <div className={cx(panel, "overflow-hidden")}>
            <div className="hidden grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.8fr))_72px_minmax(0,1.1fr)] items-center gap-4 px-4 py-2.5 text-[12px] text-neutral-500 sm:grid">
              <span>Model</span>
              <span className="text-right">Requests</span>
              <span className="text-right">Input</span>
              <span className="text-right">Output</span>
              <span>Share</span>
              <span className="text-right">Cost</span>
            </div>

            {rows.map((model) => {
              const share = value(model, sort) / max;
              const up = model.delta >= 0;
              return (
                <div
                  key={model.name}
                  className={cx(
                    "flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.8fr))_72px_minmax(0,1.1fr)] sm:items-center sm:gap-x-4 sm:gap-y-0 sm:py-2.5",
                    transition,
                    "hover:bg-neutral-50 dark:hover:bg-neutral-900",
                  )}
                >
                  <div className="flex items-center justify-between gap-3 sm:block">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        {model.name}
                      </p>
                      <p className="truncate text-[12px] text-neutral-500">
                        {model.provider}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:hidden">
                      <span className="text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                        {money(model.cost)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[12px] text-neutral-500 tabular-nums">
                        {up ? (
                          <ArrowUp className="h-3 w-3" aria-hidden />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden />
                        )}
                        {Math.abs(model.delta).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[12px] text-neutral-500 tabular-nums sm:hidden">
                    {compact(model.requests)} req · {compact(model.input)} in ·{" "}
                    {compact(model.output)} out
                  </p>

                  <p className="hidden text-right text-[13px] text-neutral-500 tabular-nums sm:block">
                    {compact(model.requests)}
                  </p>
                  <p className="hidden text-right text-[13px] text-neutral-500 tabular-nums sm:block">
                    {compact(model.input)}
                  </p>
                  <p className="hidden text-right text-[13px] text-neutral-500 tabular-nums sm:block">
                    {compact(model.output)}
                  </p>

                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900"
                    role="presentation"
                  >
                    <div
                      className={cx(
                        "h-full rounded-full",
                        transition,
                        share >= 0.5
                          ? "bg-neutral-900 dark:bg-neutral-100"
                          : "bg-neutral-400 dark:bg-neutral-500",
                      )}
                      style={{ width: `${share * 100}%` }}
                    />
                  </div>

                  <div className="hidden items-center justify-end gap-2 sm:flex">
                    <span className="text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                      {money(model.cost)}
                    </span>
                    <span className="inline-flex w-12 items-center justify-end gap-0.5 text-[12px] text-neutral-500 tabular-nums">
                      {up ? (
                        <ArrowUp className="h-3 w-3" aria-hidden />
                      ) : (
                        <ArrowDown className="h-3 w-3" aria-hidden />
                      )}
                      {Math.abs(model.delta).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

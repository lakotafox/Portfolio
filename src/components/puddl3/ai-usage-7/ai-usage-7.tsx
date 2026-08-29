"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

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
  n >= 1_000 ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k` : `${n}`;

type Call = {
  id: string;
  time: string;
  endpoint: string;
  model: string;
  input: number;
  output: number;
  ms: number;
  cost: number;
  status: "ok" | "capped" | "error";
};

const CALLS: Call[] = [
  {
    id: "req_8f21c4",
    time: "14:32:08",
    endpoint: "/v1/messages",
    model: "Atlas Pro",
    input: 12_480,
    output: 1_940,
    ms: 4180,
    cost: 0.0666,
    status: "ok",
  },
  {
    id: "req_8f21b0",
    time: "14:31:54",
    endpoint: "/v1/messages",
    model: "Atlas",
    input: 3_120,
    output: 806,
    ms: 1240,
    cost: 0.0142,
    status: "ok",
  },
  {
    id: "req_8f2196",
    time: "14:31:41",
    endpoint: "/v1/embeddings",
    model: "Ember",
    input: 48_200,
    output: 0,
    ms: 610,
    cost: 0.0048,
    status: "ok",
  },
  {
    id: "req_8f2183",
    time: "14:31:22",
    endpoint: "/v1/messages",
    model: "Atlas Long",
    input: 184_600,
    output: 2_310,
    ms: 12_940,
    cost: 0.5884,
    status: "capped",
  },
  {
    id: "req_8f2170",
    time: "14:30:58",
    endpoint: "/v1/messages",
    model: "Atlas Pro",
    input: 9_040,
    output: 1_120,
    ms: 3210,
    cost: 0.0439,
    status: "ok",
  },
  {
    id: "req_8f215d",
    time: "14:30:31",
    endpoint: "/v1/rerank",
    model: "Ember Mini",
    input: 22_800,
    output: 0,
    ms: 380,
    cost: 0.0011,
    status: "error",
  },
  {
    id: "req_8f214a",
    time: "14:30:12",
    endpoint: "/v1/messages",
    model: "Quill",
    input: 5_640,
    output: 1_408,
    ms: 1980,
    cost: 0.0225,
    status: "ok",
  },
  {
    id: "req_8f2137",
    time: "14:29:47",
    endpoint: "/v1/embeddings",
    model: "Ember",
    input: 31_400,
    output: 0,
    ms: 520,
    cost: 0.0031,
    status: "ok",
  },
];

const FILTERS = ["All", "Capped", "Errors"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_LABEL: Record<Call["status"], string> = {
  ok: "Completed",
  capped: "Truncated at max tokens",
  error: "Upstream timeout",
};

export default function AiUsage7() {
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState<string | null>("req_8f2183");

  const rows = useMemo(
    () =>
      CALLS.filter((call) =>
        filter === "All"
          ? true
          : filter === "Capped"
            ? call.status === "capped"
            : call.status === "error",
      ),
    [filter],
  );

  const spend = rows.reduce((sum, call) => sum + call.cost, 0);

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[820px]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Request log
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              Last {rows.length} calls · ${spend.toFixed(4)} billed
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter"
            className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={option === filter}
                onClick={() => setFilter(option)}
                className={cx(
                  "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                  option === filter
                    ? "bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className={frame}>
          <div className={cx(panel, "min-h-[340px] overflow-hidden")}>
            <div className="hidden grid-cols-[68px_minmax(0,1.4fr)_minmax(0,1fr)_72px_72px_76px_20px] items-center gap-3 px-4 py-2.5 text-[12px] text-neutral-500 sm:grid">
              <span>Time</span>
              <span>Request</span>
              <span>Model</span>
              <span className="text-right">Tokens</span>
              <span className="text-right">Latency</span>
              <span className="text-right">Cost</span>
              <span />
            </div>

            {rows.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-1 px-6 text-center">
                <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  Nothing to show
                </p>
                <p className="text-[13px] text-neutral-500">
                  No calls matched this filter in the current window.
                </p>
              </div>
            ) : (
              rows.map((call) => {
                const expanded = open === call.id;
                return (
                  <div key={call.id}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : call.id)}
                      className={cx(
                        "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-x-3 gap-y-1 px-4 py-3 text-left sm:grid-cols-[68px_minmax(0,1.4fr)_minmax(0,1fr)_72px_72px_76px_20px] sm:py-2.5",
                        transition,
                        "hover:bg-neutral-50 dark:hover:bg-neutral-900",
                        focus,
                      )}
                    >
                      <span className="hidden text-[13px] text-neutral-500 tabular-nums sm:block">
                        {call.time}
                      </span>

                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className={cx(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            call.status === "ok"
                              ? "bg-neutral-300 dark:bg-neutral-600"
                              : "bg-neutral-900 dark:bg-neutral-100",
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[12px] text-neutral-900 dark:text-neutral-100">
                            {call.endpoint}
                          </span>
                          <span className="block truncate text-[12px] text-neutral-500 tabular-nums sm:hidden">
                            {call.time} · {call.model}
                          </span>
                        </span>
                      </span>

                      <span className="hidden truncate text-[13px] text-neutral-500 sm:block">
                        {call.model}
                      </span>
                      <span className="hidden text-right text-[13px] text-neutral-500 tabular-nums sm:block">
                        {compact(call.input + call.output)}
                      </span>
                      <span className="hidden text-right text-[13px] text-neutral-500 tabular-nums sm:block">
                        {(call.ms / 1000).toFixed(1)}s
                      </span>
                      <span className="text-right text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                        ${call.cost.toFixed(4)}
                      </span>

                      <ChevronDown
                        aria-hidden
                        className={cx(
                          "h-4 w-4 shrink-0 justify-self-end text-neutral-400 transition-transform duration-150 ease-out",
                          expanded && "rotate-180",
                        )}
                      />
                    </button>

                    {expanded && (
                      <div className="grid gap-x-6 gap-y-2 px-4 pb-3.5 sm:grid-cols-3">
                        {(
                          [
                            ["Request ID", call.id],
                            ["Model", call.model],
                            ["Status", STATUS_LABEL[call.status]],
                            ["Input tokens", compact(call.input)],
                            ["Output tokens", compact(call.output)],
                            ["Latency", `${(call.ms / 1000).toFixed(2)}s`],
                          ] as const
                        ).map(([label, detail]) => (
                          <div key={label} className="min-w-0">
                            <p className="text-[12px] text-neutral-500">
                              {label}
                            </p>
                            <p className="truncate text-[13px] text-neutral-900 tabular-nums dark:text-neutral-100">
                              {detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
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

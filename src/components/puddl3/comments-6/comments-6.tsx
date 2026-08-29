"use client";

import { useState } from "react";
import { Check, MessageSquare } from "lucide-react";

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

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

type Pin = {
  id: number;
  author: string;
  time: string;
  body: string;
  top: string;
  left: string;
};

const PINS: Pin[] = [
  {
    id: 1,
    author: "Sofia Alvarez",
    time: "9m",
    body: "The headline and the sub both sit at the same weight, so nothing leads. Drop the sub to secondary.",
    top: "22%",
    left: "26%",
  },
  {
    id: 2,
    author: "Amelia Whitfield",
    time: "44m",
    body: "This card is 4px off the column it belongs to. Snap it back before we hand off.",
    top: "44%",
    left: "74%",
  },
  {
    id: 3,
    author: "Jonas Vikander",
    time: "2h",
    body: "Can the footer link row stay above the fold on a 13 inch screen? It disappears at that size today.",
    top: "88%",
    left: "30%",
  },
];

export default function Comments6() {
  const [active, setActive] = useState(1);
  const [resolved, setResolved] = useState<number[]>([]);

  const toggle = (id: number) =>
    setResolved((r) =>
      r.includes(id) ? r.filter((x) => x !== id) : [...r, id],
    );

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[1040px]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Pricing page · v7
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              {PINS.length - resolved.length} open pins · 3 reviewers
            </p>
          </div>

          <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-2.5 text-[13px] text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            Comment mode
          </span>
        </div>

        <div className={cx(frame, "flex flex-col gap-1 lg:flex-row")}>
          <div
            className={cx(
              panel,
              "relative min-h-[300px] flex-1 overflow-hidden lg:min-h-[420px]",
            )}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:32px_32px] text-neutral-900 dark:text-neutral-100"
            />

            <div
              aria-hidden
              className="absolute inset-x-[14%] top-[14%] space-y-3"
            >
              <div className="h-5 w-1/2 rounded-[var(--rb-r-xs,4px)] bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-3 w-2/3 rounded-[var(--rb-r-xs,4px)] bg-neutral-100 dark:bg-neutral-800/60" />
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="h-24 rounded-[var(--rb-r-md,8px)] border border-neutral-200 dark:border-neutral-800" />
                <div className="h-24 rounded-[var(--rb-r-md,8px)] border border-neutral-200 dark:border-neutral-800" />
                <div className="h-24 rounded-[var(--rb-r-md,8px)] border border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="h-3 w-1/3 rounded-[var(--rb-r-xs,4px)] bg-neutral-100 dark:bg-neutral-800/60" />
            </div>

            <div
              aria-hidden
              className="absolute inset-x-[14%] bottom-[10%] flex items-center gap-4"
            >
              <div className="h-2 w-16 rounded-[var(--rb-r-xs,4px)] bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-2 w-12 rounded-[var(--rb-r-xs,4px)] bg-neutral-100 dark:bg-neutral-800/60" />
              <div className="h-2 w-14 rounded-[var(--rb-r-xs,4px)] bg-neutral-100 dark:bg-neutral-800/60" />
              <div className="h-2 w-10 rounded-[var(--rb-r-xs,4px)] bg-neutral-100 dark:bg-neutral-800/60" />
            </div>

            {PINS.map((pin) => {
              const isActive = active === pin.id;
              const isDone = resolved.includes(pin.id);
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => setActive(pin.id)}
                  aria-label={`Pin ${pin.id} by ${pin.author}`}
                  aria-pressed={isActive}
                  style={{ top: pin.top, left: pin.left }}
                  className={cx(
                    "absolute inline-flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full rounded-bl-[var(--rb-r-xs,4px)] border text-[12px] font-medium",
                    isDone
                      ? "border-neutral-200 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500"
                      : isActive
                        ? "border-neutral-900 bg-neutral-900 text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-neutral-100 dark:bg-neutral-100 dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                        : "border-neutral-300 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
                    transition,
                    focus,
                  )}
                >
                  {pin.id}
                </button>
              );
            })}
          </div>

          <div
            className={cx(
              panel,
              "flex w-full shrink-0 flex-col overflow-hidden lg:w-[300px]",
            )}
          >
            <div className="px-3 pt-3 pb-2">
              <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                Comments
              </p>
            </div>

            <div className="max-h-[220px] flex-1 space-y-1 overflow-y-auto px-1.5 pb-1.5 lg:max-h-none">
              {PINS.map((pin) => {
                const isActive = active === pin.id;
                const isDone = resolved.includes(pin.id);
                return (
                  <div
                    key={pin.id}
                    className={cx(
                      "rounded-[var(--rb-r-md,8px)] border p-2.5",
                      isActive
                        ? "border-neutral-900 dark:border-neutral-100"
                        : "border-transparent",
                      transition,
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        {initials(pin.author)}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        {pin.author}
                      </p>
                      <span className="shrink-0 text-[12px] text-neutral-500">
                        {pin.time}
                      </span>
                    </div>

                    <p
                      className={cx(
                        "mt-1.5 text-[13px] leading-relaxed",
                        isDone
                          ? "text-neutral-500 line-through decoration-neutral-300 dark:decoration-neutral-700"
                          : "text-neutral-700 dark:text-neutral-300",
                      )}
                    >
                      {pin.body}
                    </p>

                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        aria-pressed={isDone}
                        onClick={() => toggle(pin.id)}
                        className={cx(
                          "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border px-2 text-[12px]",
                          isDone
                            ? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
                            : "border-neutral-200 text-neutral-500 hover:text-neutral-900 dark:border-neutral-800 dark:hover:text-neutral-100",
                          transition,
                          focus,
                        )}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        {isDone ? "Resolved" : "Resolve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActive(pin.id)}
                        className={cx(
                          "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2 text-[12px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                          transition,
                          focus,
                        )}
                      >
                        Locate pin
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-1.5">
              <div className="flex items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
                <label htmlFor="comments-6-draft" className="sr-only">
                  Reply to pin {active}
                </label>
                <input
                  id="comments-6-draft"
                  placeholder={`Reply to pin ${active}`}
                  className="h-7 min-w-0 flex-1 bg-transparent px-1.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
                />
                <button
                  type="button"
                  className={cx(
                    "inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-900 px-2.5 text-[12px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-neutral-800 dark:bg-neutral-100 dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-white",
                    transition,
                    focus,
                  )}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

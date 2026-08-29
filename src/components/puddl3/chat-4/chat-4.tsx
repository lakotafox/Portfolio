"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Paperclip,
  SendHorizontal,
  Star,
  ThumbsDown,
  ThumbsUp,
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

const TRANSCRIPT = [
  {
    id: "t1",
    from: "agent" as const,
    name: "Halcyon Support",
    text: "Hi Cedar Labs. I can see invoice INV-20418 failed twice this week. Want me to walk through it?",
    at: "10:02",
  },
  {
    id: "t2",
    from: "user" as const,
    name: "You",
    text: "Yes. Our card is fine, so I do not understand why it keeps declining.",
    at: "10:03",
  },
  {
    id: "t3",
    from: "agent" as const,
    name: "Halcyon Support",
    text: "The issuer returned do_not_honor on the second attempt, which usually means a block on repeat charges inside 72 hours rather than a funding problem.",
    at: "10:05",
  },
  {
    id: "t4",
    from: "agent" as const,
    name: "Halcyon Support",
    text: "I have queued a retry for tomorrow morning and attached the decline log so your bank can lift the block.",
    at: "10:05",
    attachment: "decline-log-INV-20418.pdf",
  },
];

const SUGGESTIONS = [
  "Change the card on file",
  "Send the log to my bank",
  "Pause retries for now",
];

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      start: scrollTop > 1,
      end: Math.ceil(scrollTop + clientHeight) < scrollHeight - 1,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view?.ResizeObserver) return;
    const observer = new view.ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  return { ref, edges, onScroll: update };
}

export default function Chat4() {
  const [draft, setDraft] = useState("");
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ref]);

  return (
    <div className="flex h-full min-h-[640px] w-full items-center justify-center overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "flex h-full max-h-[560px] w-full max-w-[400px] flex-col gap-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)]",
        )}
      >
        <div
          className={cx(
            panel,
            "flex items-center justify-between gap-3 px-3.5 py-3",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[11px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
            >
              HS
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                Halcyon Support
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-neutral-500">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                />
                Replies in about 2 minutes
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Minimize chat"
            className={cx(
              "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div
          className={cx(
            panel,
            "relative flex min-h-0 flex-1 flex-col overflow-hidden",
          )}
        >
          <div
            ref={ref}
            onScroll={onScroll}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5"
          >
            <p className="text-center text-[11px] text-neutral-400">
              Conversation started 10:02
            </p>
            {TRANSCRIPT.map((m) => (
              <div
                key={m.id}
                className={cx(
                  "flex",
                  m.from === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div className="max-w-[85%]">
                  <div
                    className={cx(
                      "rounded-[var(--rb-r-xl,12px)] px-3 py-2.5",
                      m.from === "user"
                        ? "rounded-br-[var(--rb-r-sm,6px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                        : "rounded-bl-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
                    )}
                  >
                    <p className="text-[13px] leading-relaxed">{m.text}</p>
                    {m.attachment && (
                      <p className="mt-2 flex items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-white px-2 py-1.5 text-[12px] text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                        <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
                        <span className="truncate">{m.attachment}</span>
                      </p>
                    )}
                  </div>
                  <p
                    className={cx(
                      "mt-1 text-[11px] text-neutral-400 tabular-nums",
                      m.from === "user" ? "text-right" : "text-left",
                    )}
                  >
                    {m.name} · {m.at}
                  </p>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={cx(
                    "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[12px] text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                    transition,
                    focus,
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <p className="text-[12px] text-neutral-500">Was this helpful?</p>
              {[
                { key: "up" as const, icon: ThumbsUp, label: "Helpful" },
                {
                  key: "down" as const,
                  icon: ThumbsDown,
                  label: "Not helpful",
                },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  aria-label={label}
                  aria-pressed={rating === key}
                  onClick={() => setRating(rating === key ? null : key)}
                  className={cx(
                    "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)]",
                    transition,
                    focus,
                    rating === key
                      ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
              edges.start ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDraft("");
          }}
          className={cx(panel, "flex items-center gap-2 p-2 pl-3")}
        >
          <label htmlFor="chat-4-composer" className="sr-only">
            Message support
          </label>
          <input
            id="chat-4-composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your reply"
            className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
          />
          <button
            type="button"
            aria-label="Attach file"
            className={cx(
              "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="submit"
            aria-label="Send message"
            disabled={!draft.trim()}
            className={cx(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
              draft.trim() &&
                "cursor-pointer hover:bg-neutral-800 active:scale-[0.98] dark:hover:bg-neutral-200",
              transition,
              focus,
            )}
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </form>

        <p className="flex items-center justify-center gap-1.5 py-1 text-[11px] text-neutral-400">
          <Star className="h-3 w-3" aria-hidden />
          Rated 4.8 by 2,140 customers this month
        </p>
      </div>
    </div>
  );
}

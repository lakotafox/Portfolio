"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Hash,
  Paperclip,
  Pin,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  Users,
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

const CHANNELS = [
  { id: "general", name: "general", unread: 0 },
  { id: "launch", name: "launch-room", unread: 4 },
  { id: "design", name: "design-review", unread: 0 },
  { id: "support", name: "support-escalations", unread: 2 },
  { id: "random", name: "random", unread: 0 },
];

const MESSAGES = [
  {
    id: "m1",
    author: "Amelia Whitfield",
    initials: "AW",
    at: "09:12",
    lines: [
      "Pushed the checkout revision to staging. The prorated line item now renders before tax.",
    ],
  },
  {
    id: "m2",
    author: "Marcus Bell",
    initials: "MB",
    at: "09:18",
    lines: [
      "Confirmed on my side. One thing: the empty state still says “no invoices yet” after a filter clears everything.",
      "It should read as a filter result, not an onboarding state.",
    ],
  },
  {
    id: "m3",
    author: "Sofia Alvarez",
    initials: "SA",
    at: "09:24",
    lines: [
      "Taking that one. I will split the copy so the filtered case has its own message and a reset action.",
    ],
  },
  {
    id: "m4",
    author: "Amelia Whitfield",
    initials: "AW",
    at: "09:31",
    lines: [
      "Perfect. I will hold the release note until that lands so we ship one changelog entry instead of two.",
    ],
  },
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

export default function Chat1() {
  const [active, setActive] = useState("launch");
  const [draft, setDraft] = useState("");
  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  return (
    <div className="flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto grid min-h-0 w-full max-w-[1100px] flex-1 gap-1 lg:grid-cols-[240px_1fr]",
        )}
      >
        <aside className={cx(panel, "hidden min-h-0 flex-col lg:flex")}>
          <div className="p-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <label htmlFor="chat-1-search" className="sr-only">
                Search channels
              </label>
              <input
                id="chat-1-search"
                placeholder="Search"
                className={cx(
                  "h-8 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pr-2.5 pl-8 text-[13px] text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
                  transition,
                  focus,
                )}
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            <p className="px-1.5 pb-1.5 text-[11px] tracking-[0.06em] text-neutral-400 uppercase">
              Channels
            </p>
            <ul className="space-y-0.5">
              {CHANNELS.map((c) => {
                const isActive = c.id === active;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-current={isActive ? "true" : undefined}
                      onClick={() => setActive(c.id)}
                      className={cx(
                        "flex h-8 w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2 text-[13px]",
                        transition,
                        focus,
                        isActive
                          ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100",
                      )}
                    >
                      <Hash
                        className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-left">
                        {c.name}
                      </span>
                      {c.unread > 0 && (
                        <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] px-1 text-[10px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] tabular-nums dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
                          {c.unread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              className={cx(
                "mt-1 flex h-8 w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2 text-[13px] text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Add channel
            </button>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col gap-1">
          <div
            className={cx(
              panel,
              "flex items-center justify-between gap-3 px-4 py-3",
            )}
          >
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                <Hash className="h-4 w-4 text-neutral-400" aria-hidden />
                launch-room
              </h2>
              <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                Release coordination for the June billing update
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Pinned messages"
                className={cx(
                  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                <Pin className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                <Users className="h-3.5 w-3.5" aria-hidden />
                <span className="tabular-nums">18</span>
              </button>
            </div>
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
              className="flex min-h-0 flex-1 flex-col space-y-5 overflow-y-auto p-4 [&>*:first-child]:mt-auto"
            >
              <p className="text-center text-[11px] text-neutral-400">Today</p>
              {MESSAGES.map((m) => (
                <article key={m.id} className="flex gap-3">
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {m.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2">
                      <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        {m.author}
                      </span>
                      <span className="text-[11px] text-neutral-400 tabular-nums">
                        {m.at}
                      </span>
                    </p>
                    <div className="mt-1 space-y-1.5">
                      {m.lines.map((line) => (
                        <p
                          key={line}
                          className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
              <p className="flex items-center gap-2 text-[12px] text-neutral-500">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500"
                />
                Sofia Alvarez is typing
              </p>
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
            <label htmlFor="chat-1-composer" className="sr-only">
              Message launch-room
            </label>
            <input
              id="chat-1-composer"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message #launch-room"
              className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
            />
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Attach file"
                className={cx(
                  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Add emoji"
                className={cx(
                  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                <Smile className="h-4 w-4" />
              </button>
              <button
                type="submit"
                aria-label="Send message"
                disabled={!draft.trim()}
                className={cx(
                  "inline-flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                  draft.trim() &&
                    "cursor-pointer hover:bg-neutral-800 active:scale-[0.98] dark:hover:bg-neutral-200",
                  transition,
                  focus,
                )}
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  FileText,
  ImageIcon,
  Plus,
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

type Reaction = { emoji: string; count: number; mine?: boolean };

type Message = {
  id: string;
  author: string;
  initials: string;
  at: string;
  body?: string;
  image?: { name: string; meta: string };
  file?: { name: string; meta: string };
  reactions?: Reaction[];
  replies?: number;
};

const MESSAGES: Message[] = [
  {
    id: "m1",
    author: "Priya Raghavan",
    initials: "PR",
    at: "09:41",
    body: "Dropping the second pass on the onboarding flow. The step counter moves to the top so the primary action never shifts.",
    reactions: [
      { emoji: "🔥", count: 5 },
      { emoji: "👏", count: 2, mine: true },
    ],
  },
  {
    id: "m2",
    author: "Priya Raghavan",
    initials: "PR",
    at: "09:41",
    image: { name: "onboarding-pass-2.png", meta: "PNG · 1.8 MB · 2400×1350" },
    replies: 6,
  },
  {
    id: "m3",
    author: "Tomas Lindqvist",
    initials: "TL",
    at: "09:58",
    body: "Much calmer. One thing: the skip link reads as a primary action at 375px because it is the only thing on that row.",
    reactions: [{ emoji: "💯", count: 3 }],
  },
  {
    id: "m4",
    author: "Naomi Okafor",
    initials: "NO",
    at: "10:12",
    body: "Attaching the copy deck so nobody has to guess the microcopy this round.",
    file: { name: "onboarding-copy-deck.pdf", meta: "PDF · 640 KB · 12 pages" },
    reactions: [{ emoji: "🙏", count: 4, mine: true }],
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

export default function Chat5() {
  const [draft, setDraft] = useState("");
  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ref]);

  return (
    <div className="flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className={cx(frame, "flex min-h-0 flex-1 flex-col gap-1")}>
        <div
          className={cx(
            panel,
            "flex items-center justify-between gap-3 px-4 py-3",
          )}
        >
          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
              Onboarding redesign
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-neutral-500">
              9 members · 3 online
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center sm:flex">
              {["PR", "TL", "NO", "+6"].map((a, i) => (
                <span
                  key={a}
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:border-neutral-900 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {a}
                </span>
              ))}
            </div>
            <button
              type="button"
              className={cx(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              <Users className="h-3.5 w-3.5" aria-hidden />
              Members
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
            className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto p-4 [&>*:first-child]:mt-auto"
          >
            <p className="text-center text-[11px] text-neutral-400">Today</p>
            {MESSAGES.map((m) => (
              <div key={m.id} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {m.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {m.author}
                    </span>
                    <span className="text-[11px] text-neutral-400 tabular-nums">
                      {m.at}
                    </span>
                  </p>

                  {m.body && (
                    <p className="mt-1 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {m.body}
                    </p>
                  )}

                  {m.image && (
                    <div className="mt-2 max-w-[300px] overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200 dark:border-neutral-800">
                      <div className="flex aspect-[16/10] items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                        <ImageIcon
                          className="h-6 w-6 text-neutral-400"
                          aria-hidden
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] text-neutral-700 dark:text-neutral-200">
                            {m.image.name}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                            {m.image.meta}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Download ${m.image.name}`}
                          className={cx(
                            "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                            transition,
                            focus,
                          )}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {m.file && (
                    <div className="mt-2 flex max-w-[380px] items-center gap-2.5 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 px-3 py-2.5 dark:border-neutral-800">
                      <FileText
                        className="h-4 w-4 shrink-0 text-neutral-400"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] text-neutral-700 dark:text-neutral-200">
                          {m.file.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                          {m.file.meta}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Download ${m.file.name}`}
                        className={cx(
                          "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                          transition,
                          focus,
                        )}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {(m.reactions || m.replies) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {m.reactions?.map((r) => (
                        <button
                          key={r.emoji}
                          type="button"
                          aria-pressed={r.mine}
                          className={cx(
                            "inline-flex h-7 cursor-pointer items-center gap-1 rounded-[var(--rb-r-md,8px)] border px-2 text-[12px] tabular-nums",
                            transition,
                            focus,
                            r.mine
                              ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-neutral-100"
                              : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800",
                          )}
                        >
                          <span aria-hidden>{r.emoji}</span>
                          {r.count}
                        </button>
                      ))}
                      {m.reactions && (
                        <button
                          type="button"
                          aria-label="Add reaction"
                          className={cx(
                            "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800",
                            transition,
                            focus,
                          )}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {m.replies && (
                        <button
                          type="button"
                          className={cx(
                            "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2 text-[12px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                            transition,
                            focus,
                          )}
                        >
                          {m.replies} replies
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <p className="text-[12px] text-neutral-400">
              Tomas Lindqvist is typing…
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
          <label htmlFor="chat-5-composer" className="sr-only">
            Message Onboarding redesign
          </label>
          <input
            id="chat-5-composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message #onboarding-redesign"
            className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
          />
          {[
            { icon: Plus, label: "Attach file" },
            { icon: Smile, label: "Add emoji" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className={cx(
                "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
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
      </div>
    </div>
  );
}

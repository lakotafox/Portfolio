"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pin, Radio, SendHorizontal, Shield, Smile } from "lucide-react";

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

type Line = {
  id: string;
  name: string;
  initials: string;
  role?: "host" | "mod";
  text: string;
};

const LINES: Line[] = [
  {
    id: "l1",
    name: "Rowan Diaz",
    initials: "RD",
    role: "host",
    text: "Welcome in. We are starting with the layout pass, then taking questions in the last twenty minutes.",
  },
  {
    id: "l2",
    name: "kestrel",
    initials: "KE",
    text: "the grid overlay is doing a lot of work here",
  },
  {
    id: "l3",
    name: "Junie Park",
    initials: "JP",
    role: "mod",
    text: "Reminder: drop questions with a leading Q so we can find them later.",
  },
  {
    id: "l4",
    name: "mattlives",
    initials: "ML",
    text: "Q: how do you decide when a section deserves its own surface vs just spacing?",
  },
  {
    id: "l5",
    name: "aurelia",
    initials: "AU",
    text: "second that question, we argue about it every sprint",
  },
  {
    id: "l6",
    name: "Rowan Diaz",
    initials: "RD",
    role: "host",
    text: "Good one. Short answer: a surface is for a different kind of content, not a different amount of it.",
  },
  {
    id: "l7",
    name: "tinyhaus",
    initials: "TH",
    text: "that line is going straight into our team doc",
  },
  {
    id: "l8",
    name: "devon.b",
    initials: "DB",
    text: "is the recording going out to everyone or subscribers only?",
  },
];

const VIEWERS = [
  { group: "Hosts", people: ["Rowan Diaz"] },
  { group: "Moderators", people: ["Junie Park", "Sam Ottoline"] },
  {
    group: "Viewers",
    people: ["kestrel", "mattlives", "aurelia", "tinyhaus", "devon.b"],
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

export default function Chat6() {
  const [draft, setDraft] = useState("");
  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  return (
    <div className="flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "grid min-h-0 flex-1 gap-1 lg:grid-cols-[1fr_220px]",
        )}
      >
        <div className="flex min-h-[440px] min-w-0 flex-col gap-1 lg:min-h-0">
          <div
            className={cx(
              panel,
              "flex items-center justify-between gap-3 px-4 py-3",
            )}
          >
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                <Radio
                  className="h-3.5 w-3.5 shrink-0 text-red-500"
                  aria-hidden
                />
                <span className="truncate">
                  Live: designing dense interfaces
                </span>
              </h2>
              <p className="mt-0.5 truncate text-[12px] text-neutral-500 tabular-nums">
                1,284 watching · 41 min in
              </p>
            </div>
            <button
              type="button"
              className={cx(
                "inline-flex h-8 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              Follow
            </button>
          </div>

          <div className={cx(panel, "flex items-start gap-2.5 px-4 py-2.5")}>
            <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              Pinned by Junie Park: slides and the sample file are in the
              description. The recording goes out to everyone tomorrow.
            </p>
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
              className="flex min-h-0 flex-1 flex-col space-y-2.5 overflow-y-auto p-3.5 [&>*:first-child]:mt-auto"
            >
              {LINES.map((l) => (
                <p
                  key={l.id}
                  className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300"
                >
                  <span
                    aria-hidden
                    className="mr-2 inline-flex h-5 w-5 shrink-0 translate-y-[3px] items-center justify-center rounded-full bg-neutral-100 text-[9px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {l.initials}
                  </span>
                  {l.role && (
                    <span
                      className={cx(
                        "mr-1.5 inline-flex h-5 translate-y-[1px] items-center gap-1 rounded-[var(--rb-r-sm,6px)] px-1.5 text-[11px] font-medium",
                        l.role === "host"
                          ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
                      )}
                    >
                      {l.role === "mod" && (
                        <Shield className="h-2.5 w-2.5" aria-hidden />
                      )}
                      {l.role === "host" ? "Host" : "Mod"}
                    </span>
                  )}
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {l.name}
                  </span>
                  <span className="text-neutral-400"> · </span>
                  {l.text}
                </p>
              ))}
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
            <label htmlFor="chat-6-composer" className="sr-only">
              Send a message to the stream
            </label>
            <input
              id="chat-6-composer"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Say something"
              className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
            />
            <button
              type="button"
              aria-label="Add emoji"
              className={cx(
                "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
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

        <aside
          className={cx(
            panel,
            "hidden min-h-0 flex-col overflow-hidden lg:flex",
          )}
        >
          <div className="px-3.5 py-3">
            <h3 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              In the room
            </h3>
            <p className="mt-0.5 text-[12px] text-neutral-500 tabular-nums">
              8 of 1,284 shown
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3.5 pb-3.5">
            {VIEWERS.map((g) => (
              <div key={g.group}>
                <p className="text-[11px] tracking-wide text-neutral-400 uppercase">
                  {g.group}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {g.people.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        className={cx(
                          "flex h-8 w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2 text-left text-[13px] text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                          transition,
                          focus,
                        )}
                      >
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                        />
                        <span className="truncate">{p}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

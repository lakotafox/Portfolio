"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bold,
  Check,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

type Mark = "bold" | "italic" | "strike" | "code" | "link";

const BLOCKS = [
  { id: "p", label: "Paragraph", icon: null },
  { id: "h1", label: "Heading 1", icon: Heading1 },
  { id: "h2", label: "Heading 2", icon: Heading2 },
  { id: "quote", label: "Quote", icon: Quote },
  { id: "ul", label: "Bulleted list", icon: List },
  { id: "ol", label: "Numbered list", icon: ListOrdered },
] as const;
type BlockId = (typeof BLOCKS)[number]["id"];

const MARKS: { id: Mark; label: string; icon: typeof Bold; keys: string }[] = [
  { id: "bold", label: "Bold", icon: Bold, keys: "Ctrl B" },
  { id: "italic", label: "Italic", icon: Italic, keys: "Ctrl I" },
  { id: "strike", label: "Strikethrough", icon: Strikethrough, keys: "Ctrl S" },
  { id: "code", label: "Inline code", icon: Code, keys: "Ctrl E" },
  { id: "link", label: "Link", icon: Link2, keys: "Ctrl K" },
];

const SEED = `Halcyon writes every permission change to an append-only ledger. Each entry records the actor, the resource, the previous value and the reason supplied at the time of the change.

Entries are immutable. A correction is a new entry that supersedes the old one, which means the history of a resource can always be replayed exactly as it happened.

Retention follows the workspace plan: ninety days on Team, one year on Scale, and seven years on Enterprise.`;

export default function Editor1() {
  const reduce = useReducedMotion();
  const [text, setText] = useState(SEED);
  const [block, setBlock] = useState<BlockId>("p");
  const [marks, setMarks] = useState<Mark[]>(["bold"]);
  const [menu, setMenu] = useState(false);
  const [saved, setSaved] = useState<"saved" | "saving">("saved");
  const menuRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return {
      words,
      chars: text.length,
      read: Math.max(1, Math.round(words / 220)),
    };
  }, [text]);

  useEffect(() => {
    if (!menu) return;
    const node = menuRef.current;
    const doc = node?.ownerDocument ?? document;
    const onDown = (e: MouseEvent) => {
      if (node && !node.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    doc.addEventListener("mousedown", onDown);
    doc.addEventListener("keydown", onKey);
    return () => {
      doc.removeEventListener("mousedown", onDown);
      doc.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  useEffect(() => {
    if (saved !== "saving") return;
    const t = window.setTimeout(() => setSaved("saved"), 900);
    return () => window.clearTimeout(t);
  }, [saved, text]);

  const toggleMark = (m: Mark) =>
    setMarks((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );

  const current = BLOCKS.find((b) => b.id === block)!;

  return (
    <div className="relative flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
            className={cx(
              "inline-flex h-8 min-w-[132px] cursor-pointer items-center justify-between gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300",
              "hover:bg-neutral-50 dark:hover:bg-neutral-900",
              transition,
              focus,
            )}
          >
            {current.label}
            <ChevronDown
              className={cx(
                "h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-150",
                menu && "rotate-180",
              )}
              strokeWidth={1.75}
            />
          </button>
          <AnimatePresence>
            {menu && (
              <motion.div
                role="menu"
                initial={reduce ? false : { opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="absolute top-[calc(100%+6px)] left-0 z-30 w-[180px] origin-top-left rounded-[var(--rb-r-xl,12px)] border border-neutral-200 bg-white p-1 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.3)] dark:border-neutral-800 dark:bg-neutral-900"
              >
                {BLOCKS.map((b) => {
                  const on = b.id === block;
                  const Icon = b.icon;
                  return (
                    <button
                      key={b.id}
                      role="menuitemradio"
                      aria-checked={on}
                      type="button"
                      onClick={() => {
                        setBlock(b.id);
                        setMenu(false);
                      }}
                      className={cx(
                        "flex h-8 w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2.5 text-left text-[13px]",
                        on
                          ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                        transition,
                        focus,
                      )}
                    >
                      {Icon ? (
                        <Icon
                          className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                          strokeWidth={1.75}
                        />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="flex-1">{b.label}</span>
                      {on && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span
          aria-hidden
          className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-800"
        />

        {MARKS.map((m) => {
          const on = marks.includes(m.id);
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              title={`${m.label} · ${m.keys}`}
              onClick={() => toggleMark(m.id)}
              className={cx(
                "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border",
                on
                  ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                  : "border-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white",
                transition,
                focus,
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span className="sr-only">{m.label}</span>
            </button>
          );
        })}

        <span
          aria-hidden
          className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-800"
        />

        {[
          { label: "Undo", icon: Undo2 },
          { label: "Redo", icon: Redo2 },
        ].map((a) => (
          <button
            key={a.label}
            type="button"
            aria-label={a.label}
            className={cx(
              "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-transparent text-neutral-600 dark:text-neutral-300",
              "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-white",
              transition,
              focus,
            )}
          >
            <a.icon className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ))}

        <span className="ml-auto flex items-center gap-1.5 pr-1 text-[12px] text-neutral-500 dark:text-neutral-400">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={saved}
              initial={reduce ? false : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -3 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            >
              {saved === "saved" ? "Saved" : "Saving…"}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-6 py-8 sm:px-8">
          <input
            aria-label="Document title"
            defaultValue="Audit ledger design notes"
            onChange={() => setSaved("saving")}
            className={cx(
              "w-full rounded-[var(--rb-r-md,8px)] bg-transparent text-[26px] leading-tight font-medium tracking-[-0.02em] text-neutral-900 placeholder:text-neutral-300 dark:text-white dark:placeholder:text-neutral-700",
              focus,
            )}
            placeholder="Untitled"
          />
          <p className="mt-1.5 text-[13px] text-neutral-500 dark:text-neutral-400">
            Draft by Ana Reyes · last edited 4 minutes ago
          </p>

          <textarea
            ref={areaRef}
            aria-label="Document body"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSaved("saving");
            }}
            spellCheck={false}
            className={cx(
              "mt-6 min-h-[320px] w-full resize-none rounded-[var(--rb-r-lg,10px)] bg-transparent text-[15px] leading-7 text-neutral-700 placeholder:text-neutral-400 dark:text-neutral-300",
              focus,
            )}
            placeholder="Start writing…"
          />
        </div>
      </div>

      <footer className="flex shrink-0 items-center gap-4 border-t border-neutral-200 px-5 py-2.5 text-[12px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <span className="tabular-nums">{stats.words} words</span>
        <span className="tabular-nums">{stats.chars} characters</span>
        <span className="tabular-nums">{stats.read} min read</span>
        <span className="ml-auto hidden sm:inline">
          Markdown shortcuts are on
        </span>
      </footer>
    </div>
  );
}

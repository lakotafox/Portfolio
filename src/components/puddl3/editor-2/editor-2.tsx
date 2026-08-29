"use client";

import { useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Columns2, Eye, PencilLine } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const VIEWS = [
  { id: "write", label: "Write", icon: PencilLine },
  { id: "split", label: "Split", icon: Columns2 },
  { id: "preview", label: "Preview", icon: Eye },
] as const;
type ViewId = (typeof VIEWS)[number]["id"];

const SEED = `# Migrating to the streaming meter

The nightly aggregation job is being replaced by a streaming counter. This note covers what changes for existing workspaces and what to do if a number looks wrong.

## What changes

- Usage updates within about **ten seconds** instead of once per night.
- Historical rows are *unchanged*; only new events take the new path.
- The \`v1/usage\` endpoint keeps its shape and stays supported until March.

## Rollout

1. Enable the flag for internal workspaces.
2. Backfill the previous 30 days and compare against the old totals.
3. Move Scale customers, then everyone else.

> A drift of under 0.5% between the two systems is expected during the overlap window.

Reach out to Wei Chen if a workspace shows a larger gap.`;

type Token =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function parse(src: string): Token[] {
  const out: Token[] = [];
  for (const raw of src.split(/\n{2,}/)) {
    const block = raw.trim();
    if (!block) continue;
    const lines = block.split("\n");
    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      out.push({
        kind: "ul",
        items: lines.map((l) => l.replace(/^[-*]\s+/, "")),
      });
    } else if (lines.every((l) => /^\d+\.\s+/.test(l))) {
      out.push({
        kind: "ol",
        items: lines.map((l) => l.replace(/^\d+\.\s+/, "")),
      });
    } else if (block.startsWith("## ")) {
      out.push({ kind: "h2", text: block.slice(3) });
    } else if (block.startsWith("# ")) {
      out.push({ kind: "h1", text: block.slice(2) });
    } else if (block.startsWith("> ")) {
      out.push({ kind: "quote", text: block.slice(2) });
    } else {
      out.push({ kind: "p", text: block.replace(/\n/g, " ") });
    }
  }
  return out;
}

function Inline({ text }: { text: string }) {
  const parts = text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    .filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return (
            <strong
              key={i}
              className="font-medium text-neutral-900 dark:text-white"
            >
              {p.slice(2, -2)}
            </strong>
          );
        if (p.startsWith("*") && p.endsWith("*"))
          return (
            <em key={i} className="italic">
              {p.slice(1, -1)}
            </em>
          );
        if (p.startsWith("`") && p.endsWith("`"))
          return (
            <code
              key={i}
              className="rounded-[var(--rb-r-xs,4px)] bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
            >
              {p.slice(1, -1)}
            </code>
          );
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export default function Editor2() {
  const uid = useId();
  const reduce = useReducedMotion();
  const [view, setView] = useState<ViewId>("split");
  const [src, setSrc] = useState(SEED);

  const tokens = useMemo(() => parse(src), [src]);
  const words = src.trim() ? src.trim().split(/\s+/).length : 0;

  const showEditor = view !== "preview";
  const showPreview = view !== "write";

  return (
    <div className="relative flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-medium text-neutral-900 dark:text-white">
            streaming-meter.md
          </h2>
          <p className="mt-0.5 text-[13px] text-neutral-500 dark:text-neutral-400">
            {words} words · Markdown
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Editor view"
          className="inline-flex rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950"
        >
          {VIEWS.map((v) => {
            const on = v.id === view;
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setView(v.id)}
                className={cx(
                  "relative inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                  on
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white",
                  transition,
                  focus,
                )}
              >
                {on && (
                  <motion.span
                    layoutId={`${uid}-view`}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 34 }
                    }
                    className="absolute inset-0 rounded-[var(--rb-r-sm,6px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                  />
                )}
                <Icon className="relative h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="relative">{v.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 md:grid-cols-2">
        {showEditor && (
          <div
            className={cx(
              "flex min-h-0 flex-col border-neutral-200 dark:border-neutral-800",
              showPreview && "md:border-r",
              view === "write" && "md:col-span-2",
            )}
          >
            <div className="flex h-8 shrink-0 items-center px-4 text-[11px] tracking-[0.06em] text-neutral-400 uppercase dark:text-neutral-500">
              Source
            </div>
            <textarea
              aria-label="Markdown source"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              spellCheck={false}
              className={cx(
                "min-h-0 flex-1 resize-none bg-transparent px-4 pb-4 font-mono text-[13px] leading-6 text-neutral-700 dark:text-neutral-300",
                focus,
              )}
            />
          </div>
        )}

        {showPreview && (
          <div
            className={cx(
              "flex min-h-0 flex-col",
              view === "preview" && "md:col-span-2",
              showEditor && view === "split" && "hidden md:flex",
            )}
          >
            <div className="flex h-8 shrink-0 items-center px-4 text-[11px] tracking-[0.06em] text-neutral-400 uppercase dark:text-neutral-500">
              Preview
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
              <div className="mx-auto max-w-[640px] space-y-4">
                {tokens.map((t, i) => {
                  if (t.kind === "h1")
                    return (
                      <h3
                        key={i}
                        className="text-[22px] leading-tight font-medium tracking-[-0.02em] text-neutral-900 dark:text-white"
                      >
                        <Inline text={t.text} />
                      </h3>
                    );
                  if (t.kind === "h2")
                    return (
                      <h4
                        key={i}
                        className="pt-2 text-[16px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-white"
                      >
                        <Inline text={t.text} />
                      </h4>
                    );
                  if (t.kind === "quote")
                    return (
                      <p
                        key={i}
                        className="rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-4 py-3 text-[14px] leading-6 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
                      >
                        <Inline text={t.text} />
                      </p>
                    );
                  if (t.kind === "ul")
                    return (
                      <ul key={i} className="space-y-1.5">
                        {t.items.map((it, j) => (
                          <li
                            key={j}
                            className="flex gap-2.5 text-[14px] leading-6 text-neutral-600 dark:text-neutral-400"
                          >
                            <span
                              aria-hidden
                              className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-600"
                            />
                            <span>
                              <Inline text={it} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  if (t.kind === "ol")
                    return (
                      <ol key={i} className="space-y-1.5">
                        {t.items.map((it, j) => (
                          <li
                            key={j}
                            className="flex gap-2.5 text-[14px] leading-6 text-neutral-600 dark:text-neutral-400"
                          >
                            <span className="w-4 shrink-0 text-right tabular-nums text-neutral-400 dark:text-neutral-600">
                              {j + 1}.
                            </span>
                            <span>
                              <Inline text={it} />
                            </span>
                          </li>
                        ))}
                      </ol>
                    );
                  return (
                    <p
                      key={i}
                      className="text-[14px] leading-6 text-neutral-600 dark:text-neutral-400"
                    >
                      <Inline text={t.text} />
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GripVertical, MessageSquare, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,box-shadow] duration-150 ease-out";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.32 };

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const COLUMNS = [
  { id: "todo", name: "To do" },
  { id: "progress", name: "In progress" },
  { id: "review", name: "In review" },
  { id: "done", name: "Done" },
] as const;
type ColumnId = (typeof COLUMNS)[number]["id"];

type Card = {
  id: string;
  ref: string;
  title: string;
  summary: string;
  assignee: string;
  priority: "Urgent" | "High" | "Normal";
  points: number;
  comments: { who: string; when: string; text: string }[];
};

const CARDS: Record<string, Card> = {
  k1: {
    id: "k1",
    ref: "CDR-118",
    title: "Recover partial uploads after a dropped connection",
    summary:
      "Large uploads restart from zero when the socket drops. Store the chunk offset so the client can resume where it left off.",
    assignee: "Ana Reyes",
    priority: "Urgent",
    points: 8,
    comments: [
      {
        who: "Marco Silva",
        when: "2 days ago",
        text: "Reproduced on a 400 MB file over a throttled connection.",
      },
      {
        who: "Ana Reyes",
        when: "yesterday",
        text: "Chunk offsets are already stored. The client just never reads them back.",
      },
    ],
  },
  k2: {
    id: "k2",
    ref: "CDR-114",
    title: "Trash keeps deleted folders for 30 days",
    summary:
      "Restoring a folder should bring its children back with the original hierarchy intact.",
    assignee: "Priya Nandakumar",
    priority: "High",
    points: 5,
    comments: [
      {
        who: "Priya Nandakumar",
        when: "3 days ago",
        text: "Retention job is written. Restore path still flattens nested folders.",
      },
    ],
  },
  k3: {
    id: "k3",
    ref: "CDR-109",
    title: "Bulk share links expire on a schedule",
    summary:
      "Owners want an expiry they can set once and apply to every link in a folder.",
    assignee: "Wei Chen",
    priority: "Normal",
    points: 3,
    comments: [],
  },
  k4: {
    id: "k4",
    ref: "CDR-104",
    title: "Preview HEIC images without downloading",
    summary:
      "Convert on the fly at request time and cache the result for a week.",
    assignee: "Marco Silva",
    priority: "Normal",
    points: 5,
    comments: [
      {
        who: "Wei Chen",
        when: "last week",
        text: "Conversion adds about 180 ms on a cold cache. Acceptable.",
      },
    ],
  },
  k5: {
    id: "k5",
    ref: "CDR-98",
    title: "Audit trail for permission changes",
    summary:
      "Every grant and revoke needs an immutable entry with the actor and the reason.",
    assignee: "Ana Reyes",
    priority: "High",
    points: 8,
    comments: [],
  },
  k6: {
    id: "k6",
    ref: "CDR-91",
    title: "Drag files straight onto a folder row",
    summary:
      "The row should accept a drop and show a clear target state while hovering.",
    assignee: "Priya Nandakumar",
    priority: "Normal",
    points: 2,
    comments: [
      {
        who: "Ana Reyes",
        when: "4 days ago",
        text: "Shipped behind a flag. Waiting on copy for the empty folder case.",
      },
    ],
  },
  k7: {
    id: "k7",
    ref: "CDR-87",
    title: "Storage meter in the sidebar footer",
    summary: "Show used against plan, and link to the upgrade page past 80%.",
    assignee: "Wei Chen",
    priority: "Normal",
    points: 2,
    comments: [],
  },
};

const INITIAL: Record<ColumnId, string[]> = {
  todo: ["k3", "k5"],
  progress: ["k1", "k2"],
  review: ["k4"],
  done: ["k6", "k7"],
};

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const PRIORITY_DOT: Record<Card["priority"], string> = {
  Urgent:
    "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
  High: "bg-neutral-400 dark:bg-neutral-500",
  Normal: "bg-neutral-200 dark:bg-neutral-700",
};

export default function Kanban4() {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<Record<ColumnId, string[]>>(INITIAL);
  const [selected, setSelected] = useState<string | null>("k1");
  const [dragId, setDragId] = useState<string | null>(null);
  const [ghost, setGhost] = useState({ x: 0, y: 0, w: 0 });
  const [announce, setAnnounce] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef(new Map<ColumnId, HTMLElement>());
  const dragRef = useRef<{
    id: string;
    dx: number;
    dy: number;
    w: number;
    active: boolean;
    startX: number;
    startY: number;
    pointerId: number;
  } | null>(null);

  const columnOf = useCallback(
    (id: string) =>
      (Object.keys(items) as ColumnId[]).find((c) => items[c].includes(id)) ??
      "todo",
    [items],
  );

  const move = useCallback((id: string, toCol: ColumnId, toIndex: number) => {
    setItems((prev) => {
      const next = { ...prev } as Record<ColumnId, string[]>;
      let from: ColumnId | null = null;
      for (const c of Object.keys(next) as ColumnId[])
        if (next[c].includes(id)) from = c;
      if (!from) return prev;
      if (from === toCol && next[from].indexOf(id) === toIndex) return prev;
      next[from] = next[from].filter((x) => x !== id);
      const list = from === toCol ? next[from] : [...next[toCol]];
      list.splice(Math.max(0, Math.min(toIndex, list.length)), 0, id);
      next[toCol] = list;
      return next;
    });
  }, []);

  const targetFromPoint = useCallback(
    (clientX: number, clientY: number, id: string) => {
      for (const [colId, el] of colRefs.current) {
        const r = el.getBoundingClientRect();
        if (clientX < r.left || clientX > r.right) continue;
        const others = Array.from(
          el.querySelectorAll<HTMLElement>("[data-card]"),
        ).filter((c) => c.dataset.card !== id);
        let index = others.length;
        for (let i = 0; i < others.length; i++) {
          const cr = others[i].getBoundingClientRect();
          if (clientY < cr.top + cr.height / 2) {
            index = i;
            break;
          }
        }
        return { col: colId, index };
      }
      return null;
    },
    [],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLElement>, id: string) => {
    if (e.button !== 0) return;
    const el = e.currentTarget.closest<HTMLElement>("[data-card]");
    const root = rootRef.current;
    if (!el || !root) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    dragRef.current = {
      id,
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      w: r.width,
      active: false,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
    };
    root.setPointerCapture(e.pointerId);
    el.querySelector<HTMLElement>(
      '[aria-roledescription="Draggable card"]',
    )?.focus();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    const root = rootRef.current;
    if (!d || !root) return;
    if (!d.active) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 4) return;
      d.active = true;
      setDragId(d.id);
    }
    const rr = root.getBoundingClientRect();
    setGhost({
      x: e.clientX - rr.left - d.dx,
      y: e.clientY - rr.top - d.dy,
      w: d.w,
    });
    const t = targetFromPoint(e.clientX, e.clientY, d.id);
    if (t) move(d.id, t.col as ColumnId, t.index);
  };

  const endDrag = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    const root = rootRef.current;
    if (root?.hasPointerCapture?.(d.pointerId))
      root.releasePointerCapture(d.pointerId);
    if (d.active)
      setAnnounce(
        `${CARDS[d.id].ref} moved to ${
          COLUMNS.find((c) => c.id === columnOf(d.id))?.name
        }.`,
      );
    else setSelected(d.id);
    setDragId(null);
  };

  const card = selected ? CARDS[selected] : null;
  const status = selected ? columnOf(selected) : "todo";
  const total = useMemo(
    () => Object.values(items).reduce((s, l) => s + l.length, 0),
    [items],
  );

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      className={cx(
        "relative flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950",
        dragId && "touch-none select-none",
      )}
    >
      <header className="shrink-0 px-6 pt-6 pb-4 sm:px-8">
        <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Cedar Labs delivery
        </h2>
        <p className="mt-0.5 truncate text-[13px] text-neutral-500">
          {total} items. Click a card to open it, or drag it to another column.
        </p>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <motion.div
          layout={reduce ? false : true}
          transition={SPRING}
          className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 sm:px-8"
        >
          <div className="flex h-full min-w-max gap-2.5">
            {COLUMNS.map((col) => {
              const list = items[col.id];
              return (
                <section
                  key={col.id}
                  aria-label={col.name}
                  className="flex h-full w-[236px] shrink-0 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <div className="flex h-8 shrink-0 items-center gap-2 px-2">
                    <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {col.name}
                    </span>
                    <span className="text-[11px] tabular-nums text-neutral-500">
                      {list.length}
                    </span>
                  </div>
                  <div
                    ref={(el) => {
                      if (el) colRefs.current.set(col.id, el);
                      else colRefs.current.delete(col.id);
                    }}
                    className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1 pt-0"
                  >
                    {list.map((id) => {
                      const c = CARDS[id];
                      const isDragging = dragId === id;
                      const isSelected = selected === id;
                      return (
                        <motion.div
                          key={id}
                          layout={reduce ? false : "position"}
                          transition={SPRING}
                          data-card={id}
                          className={cx(
                            "rounded-[var(--rb-r-lg,10px)]",
                            isDragging &&
                              "border border-dashed border-neutral-300 bg-neutral-100/60 dark:border-neutral-700 dark:bg-neutral-900/60",
                          )}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            aria-roledescription="Draggable card"
                            aria-label={`${c.ref}: ${c.title}`}
                            onPointerDown={(e) => {
                              if (e.pointerType === "mouse")
                                onPointerDown(e, id);
                            }}
                            onClick={() => setSelected(id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelected(id);
                              }
                            }}
                            className={cx(
                              "group flex cursor-pointer flex-col gap-2 rounded-[var(--rb-r-lg,10px)] border bg-white p-2.5 text-left dark:bg-neutral-900",
                              isSelected
                                ? "border-neutral-900 dark:border-white"
                                : "border-neutral-200/70 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
                              isDragging && "invisible",
                              transition,
                              focus,
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                aria-hidden
                                className={cx(
                                  "h-1.5 w-1.5 shrink-0 rounded-full",
                                  PRIORITY_DOT[c.priority],
                                )}
                              />
                              <span className="text-[11px] tabular-nums text-neutral-500">
                                {c.ref}
                              </span>
                              <span
                                onPointerDown={(e) => onPointerDown(e, id)}
                                style={{ touchAction: "none" }}
                                aria-hidden
                                className="ml-auto -mr-0.5 cursor-grab text-neutral-300 group-hover:text-neutral-400 dark:text-neutral-700 dark:group-hover:text-neutral-600"
                              >
                                <GripVertical
                                  className="h-3.5 w-3.5"
                                  strokeWidth={2}
                                />
                              </span>
                            </div>
                            <p className="text-[13px] leading-snug text-neutral-900 dark:text-neutral-100">
                              {c.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-5 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                {c.points} pts
                              </span>
                              {c.comments.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-neutral-500">
                                  <MessageSquare
                                    className="h-3 w-3"
                                    strokeWidth={2}
                                  />
                                  {c.comments.length}
                                </span>
                              )}
                              <span
                                title={c.assignee}
                                className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                              >
                                {initials(c.assignee)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </motion.div>

        <AnimatePresence>
          {card && (
            <motion.button
              key="scrim"
              type="button"
              aria-label="Close details"
              onClick={() => setSelected(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="absolute inset-0 z-30 cursor-pointer bg-neutral-950/20 lg:hidden dark:bg-neutral-950/50"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {card && (
            <motion.aside
              key="detail"
              aria-label={`${card.ref} details`}
              initial={reduce ? { opacity: 0 } : { x: 24, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { x: 0, opacity: 1 }}
              exit={
                reduce
                  ? { opacity: 0, transition: { duration: 0.14 } }
                  : {
                      x: 24,
                      opacity: 0,
                      transition: { duration: 0.22, ease: EASE_DRAWER },
                    }
              }
              transition={{ duration: 0.32, ease: EASE_DRAWER }}
              className="absolute inset-y-0 right-0 z-40 flex w-[min(100%,360px)] flex-col border-l border-neutral-200/70 bg-white lg:relative lg:z-auto lg:w-[320px] lg:shrink-0 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex h-12 shrink-0 items-center gap-2 px-4">
                <span className="text-[11px] tabular-nums text-neutral-500">
                  {card.ref}
                </span>
                <span className="inline-flex h-5 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {COLUMNS.find((c) => c.id === status)?.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close details"
                  className={cx(
                    "ml-auto inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    transition,
                    focus,
                  )}
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
                <h3 className="text-[15px] leading-snug font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                  {card.title}
                </h3>

                <div className={cx(frame, "space-y-1")}>
                  {[
                    { k: "Assignee", v: card.assignee },
                    { k: "Priority", v: card.priority },
                    { k: "Estimate", v: `${card.points} points` },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className={cx(
                        panel,
                        "flex h-9 items-center justify-between px-2.5",
                      )}
                    >
                      <span className="text-[12px] text-neutral-500">
                        {row.k}
                      </span>
                      <span className="text-[13px] text-neutral-900 dark:text-neutral-100">
                        {row.v}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-1.5 text-[12px] font-medium text-neutral-500">
                    Move to
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {COLUMNS.map((c) => {
                      const active = c.id === status;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            move(card.id, c.id, items[c.id].length);
                            setAnnounce(`${card.ref} moved to ${c.name}.`);
                          }}
                          className={cx(
                            "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border px-2.5 text-[12px]",
                            active
                              ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                              : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800",
                            transition,
                            focus,
                          )}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {card.summary}
                </p>

                <div>
                  <p className="mb-1.5 text-[12px] font-medium text-neutral-500">
                    Activity
                  </p>
                  {card.comments.length === 0 ? (
                    <p className="rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 py-4 text-center text-[12px] text-neutral-400 dark:bg-neutral-900 dark:text-neutral-600">
                      No comments yet
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {card.comments.map((cm, i) => (
                        <li
                          key={i}
                          className="rounded-[var(--rb-r-lg,10px)] bg-neutral-50 p-2.5 dark:bg-neutral-900"
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200/70 text-[9px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                              {initials(cm.who)}
                            </span>
                            <span className="text-[12px] font-medium text-neutral-900 dark:text-neutral-100">
                              {cm.who}
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              {cm.when}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {cm.text}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {dragId && (
          <motion.div
            key="ghost"
            initial={{ opacity: 0.9 }}
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, scale: 1.02, rotate: -1.5 }
            }
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            style={{ left: ghost.x, top: ghost.y, width: ghost.w }}
            className="pointer-events-none absolute z-50 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-2.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)] dark:border-neutral-700 dark:bg-neutral-900"
          >
            <span className="text-[11px] tabular-nums text-neutral-500">
              {CARDS[dragId].ref}
            </span>
            <p className="mt-2 text-[13px] leading-snug text-neutral-900 dark:text-neutral-100">
              {CARDS[dragId].title}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}

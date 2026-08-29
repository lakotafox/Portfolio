"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,box-shadow] duration-150 ease-out";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.32 };

const COLUMNS = [
  { id: "inbox", name: "Inbox" },
  { id: "today", name: "Today" },
  { id: "doing", name: "Doing" },
  { id: "done", name: "Done" },
] as const;
type ColumnId = (typeof COLUMNS)[number]["id"];

type Card = {
  id: string;
  title: string;
  list: string;
  done: number;
  total: number;
  assignee: string;
};

const CARDS: Record<string, Card> = {
  t1: {
    id: "t1",
    title: "Rewrite the welcome email",
    list: "Lifecycle",
    done: 3,
    total: 4,
    assignee: "Ana Reyes",
  },
  t2: {
    id: "t2",
    title: "Cut the trial banner on paid plans",
    list: "Billing",
    done: 0,
    total: 2,
    assignee: "Wei Chen",
  },
  t3: {
    id: "t3",
    title: "Reconcile refund webhooks",
    list: "Billing",
    done: 1,
    total: 5,
    assignee: "Marco Silva",
  },
  t4: {
    id: "t4",
    title: "Ship the changelog RSS feed",
    list: "Growth",
    done: 2,
    total: 2,
    assignee: "Priya Nandakumar",
  },
  t5: {
    id: "t5",
    title: "Prune stale invite tokens",
    list: "Platform",
    done: 0,
    total: 3,
    assignee: "Wei Chen",
  },
  t6: {
    id: "t6",
    title: "Add a keyboard hint to search",
    list: "Craft",
    done: 1,
    total: 1,
    assignee: "Ana Reyes",
  },
  t7: {
    id: "t7",
    title: "Document the export limits",
    list: "Docs",
    done: 0,
    total: 4,
    assignee: "Priya Nandakumar",
  },
  t8: {
    id: "t8",
    title: "Move avatars to the CDN",
    list: "Platform",
    done: 4,
    total: 4,
    assignee: "Marco Silva",
  },
  t9: {
    id: "t9",
    title: "Retire the old status widget",
    list: "Craft",
    done: 2,
    total: 3,
    assignee: "Ana Reyes",
  },
  t10: {
    id: "t10",
    title: "Weekly digest opt-out",
    list: "Lifecycle",
    done: 1,
    total: 2,
    assignee: "Wei Chen",
  },
};

const INITIAL: Record<ColumnId, string[]> = {
  inbox: ["t5", "t7", "t2"],
  today: ["t3", "t9"],
  doing: ["t1", "t10"],
  done: ["t4", "t6", "t8"],
};

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export default function Kanban6() {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<Record<ColumnId, string[]>>(INITIAL);
  const [page, setPage] = useState<ColumnId>("inbox");
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
      "inbox",
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

  const shift = (id: string, dir: -1 | 1) => {
    const ci = COLUMNS.findIndex((c) => c.id === columnOf(id));
    const to = COLUMNS[ci + dir];
    if (!to) return;
    move(id, to.id, items[to.id].length);
    setAnnounce(`${CARDS[id].title} moved to ${to.name}.`);
  };

  const targetFromPoint = useCallback(
    (clientX: number, clientY: number, id: string) => {
      for (const [colId, el] of colRefs.current) {
        const r = el.getBoundingClientRect();
        if (
          clientX < r.left ||
          clientX > r.right ||
          r.width === 0 ||
          r.height === 0
        )
          continue;
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
        `${CARDS[d.id].title} moved to ${
          COLUMNS.find((c) => c.id === columnOf(d.id))?.name
        }.`,
      );
    setDragId(null);
  };

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
      <header className="shrink-0 px-6 pt-6 pb-3 sm:px-8">
        <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Harbor tasks
        </h2>
        <p className="mt-0.5 truncate text-[13px] text-neutral-500">
          {total} tasks. Drag on a wide screen, or use the arrows on a card to
          move it one column at a time.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Column"
        className="mx-6 mb-3 flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 sm:mx-8 md:hidden dark:bg-neutral-800"
      >
        {COLUMNS.map((c) => {
          const active = c.id === page;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPage(c.id)}
              className={cx(
                "relative inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-sm,6px)] px-2 text-[13px] whitespace-nowrap",
                active
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              {active && (
                <motion.span
                  layoutId="kanban6-page"
                  transition={reduce ? { duration: 0 } : SPRING}
                  className="absolute inset-0 rounded-[var(--rb-r-sm,6px)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950"
                />
              )}
              <span className={cx("relative", active && "font-medium")}>
                {c.name}
              </span>
              <span className="relative text-[11px] tabular-nums text-neutral-500">
                {items[c.id].length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 sm:px-8">
        <div className="flex h-full gap-2.5 md:min-w-max">
          {COLUMNS.map((col) => {
            const list = items[col.id];
            const ci = COLUMNS.findIndex((c) => c.id === col.id);
            const isPage = col.id === page;
            return (
              <section
                key={col.id}
                aria-label={col.name}
                className={cx(
                  "h-full flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 md:flex md:w-[248px] md:shrink-0 dark:border-neutral-800 dark:bg-neutral-950",
                  isPage ? "flex w-full" : "hidden",
                )}
              >
                <div className="hidden h-8 shrink-0 items-center gap-2 px-2 md:flex">
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
                  className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1 md:pt-0"
                >
                  {list.map((id) => {
                    const card = CARDS[id];
                    const isDragging = dragId === id;
                    const complete = card.done === card.total;
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
                          className={cx(
                            "group flex flex-col gap-2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-2.5 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700",
                            isDragging && "invisible",
                            transition,
                          )}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            aria-roledescription="Draggable card"
                            aria-label={`${card.title}. ${card.done} of ${card.total} subtasks done.`}
                            onPointerDown={(e) => {
                              if (e.pointerType === "mouse")
                                onPointerDown(e, id);
                            }}
                            className={cx(
                              "flex cursor-grab flex-col gap-1.5 rounded-[var(--rb-r-sm,6px)] text-left",
                              focus,
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-[11px] text-neutral-500">
                                {card.list}
                              </span>
                              <span
                                onPointerDown={(e) => onPointerDown(e, id)}
                                style={{ touchAction: "none" }}
                                aria-hidden
                                className="ml-auto -mr-0.5 hidden cursor-grab text-neutral-300 group-hover:text-neutral-400 md:inline dark:text-neutral-700 dark:group-hover:text-neutral-600"
                              >
                                <GripVertical
                                  className="h-3.5 w-3.5"
                                  strokeWidth={2}
                                />
                              </span>
                            </div>
                            <p className="text-[13px] leading-snug text-neutral-900 dark:text-neutral-100">
                              {card.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={cx(
                                "inline-flex h-5 items-center rounded-[var(--rb-r-sm,6px)] px-1.5 text-[11px] tabular-nums",
                                complete
                                  ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
                              )}
                            >
                              {card.done}/{card.total}
                            </span>
                            <span
                              title={card.assignee}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                            >
                              {initials(card.assignee)}
                            </span>

                            <div className="ml-auto flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={ci === 0}
                                onClick={() => shift(id, -1)}
                                aria-label={`Move ${card.title} to ${
                                  COLUMNS[ci - 1]?.name ?? "previous column"
                                }`}
                                className={cx(
                                  "inline-flex h-7 w-7 items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-500",
                                  ci === 0
                                    ? "cursor-not-allowed opacity-40"
                                    : "cursor-pointer hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                                  transition,
                                  focus,
                                )}
                              >
                                <ChevronLeft
                                  className="h-4 w-4"
                                  strokeWidth={2}
                                />
                              </button>
                              <button
                                type="button"
                                disabled={ci === COLUMNS.length - 1}
                                onClick={() => shift(id, 1)}
                                aria-label={`Move ${card.title} to ${
                                  COLUMNS[ci + 1]?.name ?? "next column"
                                }`}
                                className={cx(
                                  "inline-flex h-7 w-7 items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-500",
                                  ci === COLUMNS.length - 1
                                    ? "cursor-not-allowed opacity-40"
                                    : "cursor-pointer hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                                  transition,
                                  focus,
                                )}
                              >
                                <ChevronRight
                                  className="h-4 w-4"
                                  strokeWidth={2}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {list.length === 0 && (
                    <p className="px-2 py-6 text-center text-[12px] text-neutral-400 dark:text-neutral-600">
                      Nothing here yet
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
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
            <span className="text-[11px] text-neutral-500">
              {CARDS[dragId].list}
            </span>
            <p className="mt-1.5 text-[13px] leading-snug text-neutral-900 dark:text-neutral-100">
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

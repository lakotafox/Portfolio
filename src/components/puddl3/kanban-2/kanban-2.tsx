"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronRight, GripVertical } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,box-shadow] duration-150 ease-out";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.32 };

const COLUMNS = [
  { id: "todo", name: "To do" },
  { id: "progress", name: "In progress" },
  { id: "review", name: "In review" },
  { id: "shipped", name: "Shipped" },
] as const;
type ColumnId = (typeof COLUMNS)[number]["id"];

const LANES = [
  { id: "billing", name: "Billing & invoicing", owner: "Ana Reyes" },
  { id: "identity", name: "Identity", owner: "Wei Chen" },
  { id: "platform", name: "Platform reliability", owner: "Marco Silva" },
] as const;
type LaneId = (typeof LANES)[number]["id"];

type Card = { id: string; ref: string; title: string; points: number };

const CARDS: Record<string, Card> = {
  b1: {
    id: "b1",
    ref: "HAL-241",
    title: "Retry webhooks on timeout",
    points: 3,
  },
  b2: {
    id: "b2",
    ref: "HAL-238",
    title: "Seat drift after downgrade",
    points: 5,
  },
  b3: {
    id: "b3",
    ref: "HAL-231",
    title: "Proration preview in checkout",
    points: 2,
  },
  b4: { id: "b4", ref: "HAL-217", title: "Invoice PDF redesign", points: 8 },
  i1: { id: "i1", ref: "HAL-233", title: "SCIM group mapping", points: 5 },
  i2: {
    id: "i2",
    ref: "HAL-228",
    title: "Session revocation on role change",
    points: 3,
  },
  i3: {
    id: "i3",
    ref: "HAL-208",
    title: "Rotate signing keys live",
    points: 8,
  },
  p1: {
    id: "p1",
    ref: "HAL-236",
    title: "Audit export past 90 days",
    points: 5,
  },
  p2: {
    id: "p2",
    ref: "HAL-221",
    title: "Cache invalidation latency",
    points: 3,
  },
  p3: {
    id: "p3",
    ref: "HAL-214",
    title: "Backfill EU tenant regions",
    points: 2,
  },
  p4: { id: "p4", ref: "HAL-203", title: "Shard the events table", points: 13 },
};

type Board = Record<LaneId, Record<ColumnId, string[]>>;

const INITIAL: Board = {
  billing: {
    todo: ["b3"],
    progress: ["b1", "b2"],
    review: [],
    shipped: ["b4"],
  },
  identity: { todo: ["i3"], progress: ["i1"], review: ["i2"], shipped: [] },
  platform: { todo: ["p4"], progress: ["p2"], review: ["p1"], shipped: ["p3"] },
};

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const key = (lane: LaneId, col: ColumnId) => `${lane}|${col}`;

export default function Kanban2() {
  const reduce = useReducedMotion();
  const [board, setBoard] = useState<Board>(INITIAL);
  const [collapsed, setCollapsed] = useState<LaneId[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const [ghost, setGhost] = useState({ x: 0, y: 0, w: 0 });
  const [announce, setAnnounce] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<string, HTMLElement>());
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

  const locate = useCallback(
    (id: string) => {
      for (const lane of LANES) {
        for (const col of COLUMNS) {
          const i = board[lane.id][col.id].indexOf(id);
          if (i !== -1)
            return {
              lane: lane.id as LaneId,
              col: col.id as ColumnId,
              index: i,
            };
        }
      }
      return null;
    },
    [board],
  );

  const move = useCallback(
    (id: string, lane: LaneId, col: ColumnId, index: number) => {
      setBoard((prev) => {
        const next: Board = {
          billing: { ...prev.billing },
          identity: { ...prev.identity },
          platform: { ...prev.platform },
        };
        let fl: LaneId | null = null;
        let fc: ColumnId | null = null;
        for (const l of LANES)
          for (const c of COLUMNS)
            if (next[l.id][c.id].includes(id)) {
              fl = l.id;
              fc = c.id;
            }
        if (!fl || !fc) return prev;
        if (fl === lane && fc === col && next[fl][fc].indexOf(id) === index)
          return prev;
        next[fl][fc] = next[fl][fc].filter((x) => x !== id);
        const list = [...next[lane][col]];
        list.splice(Math.max(0, Math.min(index, list.length)), 0, id);
        next[lane][col] = list;
        return next;
      });
    },
    [],
  );

  const targetFromPoint = useCallback(
    (clientX: number, clientY: number, id: string) => {
      for (const [k, el] of cellRefs.current) {
        const r = el.getBoundingClientRect();
        if (
          clientX < r.left ||
          clientX > r.right ||
          clientY < r.top ||
          clientY > r.bottom
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
        const [lane, col] = k.split("|");
        return { lane: lane as LaneId, col: col as ColumnId, index };
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
      setGrabbed(null);
      setDragId(d.id);
    }
    const rr = root.getBoundingClientRect();
    setGhost({
      x: e.clientX - rr.left - d.dx,
      y: e.clientY - rr.top - d.dy,
      w: d.w,
    });
    const t = targetFromPoint(e.clientX, e.clientY, d.id);
    if (t) move(d.id, t.lane, t.col, t.index);
  };

  const endDrag = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    const root = rootRef.current;
    if (root?.hasPointerCapture?.(d.pointerId))
      root.releasePointerCapture(d.pointerId);
    if (d.active) {
      const at = locate(d.id);
      if (at)
        setAnnounce(
          `${CARDS[d.id].ref} moved to ${
            COLUMNS.find((c) => c.id === at.col)?.name
          } in ${LANES.find((l) => l.id === at.lane)?.name}.`,
        );
    }
    setDragId(null);
  };

  const onCardKeyDown = (e: React.KeyboardEvent<HTMLElement>, id: string) => {
    const at = locate(id);
    if (!at) return;
    const li = LANES.findIndex((l) => l.id === at.lane);
    const ci = COLUMNS.findIndex((c) => c.id === at.col);

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const next = grabbed === id ? null : id;
      setGrabbed(next);
      setAnnounce(
        next
          ? `${CARDS[id].ref} grabbed. Arrow keys move it between columns and lanes.`
          : `${CARDS[id].ref} dropped.`,
      );
      return;
    }
    if (e.key === "Escape" && grabbed === id) {
      e.preventDefault();
      setGrabbed(null);
      setAnnounce("Move cancelled.");
      return;
    }
    if (grabbed !== id) return;

    let handled = true;
    if (e.key === "ArrowLeft" && ci > 0)
      move(
        id,
        at.lane,
        COLUMNS[ci - 1].id,
        board[at.lane][COLUMNS[ci - 1].id].length,
      );
    else if (e.key === "ArrowRight" && ci < COLUMNS.length - 1)
      move(
        id,
        at.lane,
        COLUMNS[ci + 1].id,
        board[at.lane][COLUMNS[ci + 1].id].length,
      );
    else if (e.key === "ArrowUp") {
      if (at.index > 0) move(id, at.lane, at.col, at.index - 1);
      else if (li > 0)
        move(
          id,
          LANES[li - 1].id,
          at.col,
          board[LANES[li - 1].id][at.col].length,
        );
      else handled = false;
    } else if (e.key === "ArrowDown") {
      if (at.index < board[at.lane][at.col].length - 1)
        move(id, at.lane, at.col, at.index + 1);
      else if (li < LANES.length - 1) move(id, LANES[li + 1].id, at.col, 0);
      else handled = false;
    } else handled = false;

    if (handled) {
      e.preventDefault();
      e.currentTarget.focus();
    }
  };

  const totals = useMemo(() => {
    const t = {} as Record<ColumnId, number>;
    for (const c of COLUMNS)
      t[c.id] = LANES.reduce((s, l) => s + board[l.id][c.id].length, 0);
    return t;
  }, [board]);

  const toggleLane = (id: LaneId) =>
    setCollapsed((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
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
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 px-6 pt-6 pb-4 sm:px-8">
        <div className="min-w-0">
          <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Workstreams
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-neutral-500">
            Three lanes across four stages. Drag between any cell, or press
            space on a card to move it with the arrow keys.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setCollapsed((p) =>
              p.length === LANES.length ? [] : LANES.map((l) => l.id),
            )
          }
          className={cx(
            "inline-flex h-8 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800",
            transition,
            focus,
          )}
        >
          {collapsed.length === LANES.length ? "Expand all" : "Collapse all"}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6 sm:px-8">
        <div className="min-w-max">
          <div className="sticky top-0 z-20 grid grid-cols-[repeat(4,240px)] gap-2.5 bg-white pb-2 dark:bg-neutral-950">
            {COLUMNS.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-1">
                <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {c.name}
                </span>
                <span className="text-[11px] tabular-nums text-neutral-500">
                  {totals[c.id]}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {LANES.map((lane) => {
              const isOpen = !collapsed.includes(lane.id);
              const count = COLUMNS.reduce(
                (s, c) => s + board[lane.id][c.id].length,
                0,
              );
              const done = board[lane.id].shipped.length;
              return (
                <section
                  key={lane.id}
                  aria-label={lane.name}
                  className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <div className="flex h-9 items-center gap-2 px-1.5">
                    <button
                      type="button"
                      onClick={() => toggleLane(lane.id)}
                      aria-expanded={isOpen}
                      className={cx(
                        "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] pr-2 pl-1 text-[13px] font-medium text-neutral-900 hover:bg-neutral-200/60 dark:text-neutral-100 dark:hover:bg-neutral-800",
                        transition,
                        focus,
                      )}
                    >
                      <motion.span
                        aria-hidden
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { duration: 0.2, ease: EASE_OUT }
                        }
                        className="inline-flex"
                      >
                        <ChevronRight
                          className="h-3.5 w-3.5 text-neutral-500"
                          strokeWidth={2}
                        />
                      </motion.span>
                      {lane.name}
                    </button>
                    <span className="text-[11px] tabular-nums text-neutral-500">
                      {done}/{count} shipped
                    </span>
                    <span
                      title={lane.owner}
                      className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200/70 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {initials(lane.owner)}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={
                          reduce ? { opacity: 0 } : { height: 0, opacity: 0 }
                        }
                        animate={
                          reduce
                            ? { opacity: 1 }
                            : { height: "auto", opacity: 1 }
                        }
                        exit={
                          reduce
                            ? { opacity: 0, transition: { duration: 0.12 } }
                            : {
                                height: 0,
                                opacity: 0,
                                transition: { duration: 0.16, ease: EASE_OUT },
                              }
                        }
                        transition={{ duration: 0.2, ease: EASE_OUT }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-[repeat(4,240px)] gap-2.5">
                          {COLUMNS.map((col) => {
                            const list = board[lane.id][col.id];
                            return (
                              <div
                                key={col.id}
                                ref={(el) => {
                                  const k = key(lane.id, col.id);
                                  if (el) cellRefs.current.set(k, el);
                                  else cellRefs.current.delete(k);
                                }}
                                aria-label={`${lane.name}, ${col.name}`}
                                className="min-h-[92px] space-y-1 rounded-[var(--rb-r-lg,10px)] p-1"
                              >
                                {list.map((id) => {
                                  const card = CARDS[id];
                                  const isDragging = dragId === id;
                                  const isGrabbed = grabbed === id;
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
                                        aria-roledescription="Draggable card"
                                        aria-label={`${card.ref}: ${card.title}, ${card.points} points, ${col.name} in ${lane.name}.`}
                                        onPointerDown={(e) => {
                                          if (e.pointerType === "mouse")
                                            onPointerDown(e, id);
                                        }}
                                        onKeyDown={(e) => onCardKeyDown(e, id)}
                                        className={cx(
                                          "group flex cursor-grab flex-col gap-2 rounded-[var(--rb-r-lg,10px)] border bg-white p-2.5 text-left dark:bg-neutral-900",
                                          isGrabbed
                                            ? "border-neutral-900 dark:border-white"
                                            : "border-neutral-200/70 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
                                          isDragging && "invisible",
                                          transition,
                                          focus,
                                        )}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[11px] tabular-nums text-neutral-500">
                                            {card.ref}
                                          </span>
                                          <span
                                            onPointerDown={(e) =>
                                              onPointerDown(e, id)
                                            }
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
                                          {card.title}
                                        </p>
                                        <span className="inline-flex h-5 w-fit items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                          {card.points} pts
                                        </span>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              );
            })}
          </div>
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

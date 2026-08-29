"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GripVertical } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,box-shadow] duration-150 ease-out";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.32 };

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const COLUMNS = [
  { id: "committed", name: "Committed", capacity: 21 },
  { id: "building", name: "Building", capacity: 13 },
  { id: "verifying", name: "Verifying", capacity: 8 },
  { id: "accepted", name: "Accepted", capacity: 0 },
] as const;
type ColumnId = (typeof COLUMNS)[number]["id"];

type Card = {
  id: string;
  ref: string;
  title: string;
  points: number;
  assignee: string;
  blocked?: boolean;
};

const CARDS: Record<string, Card> = {
  s1: {
    id: "s1",
    ref: "MER-52",
    title: "Split the ingest queue by tenant",
    points: 8,
    assignee: "Marco Silva",
  },
  s2: {
    id: "s2",
    ref: "MER-49",
    title: "Retry policy for failed exports",
    points: 5,
    assignee: "Ana Reyes",
  },
  s3: {
    id: "s3",
    ref: "MER-47",
    title: "Surface sync errors in the header",
    points: 3,
    assignee: "Priya Nandakumar",
  },
  s4: {
    id: "s4",
    ref: "MER-45",
    title: "Warm the report cache nightly",
    points: 5,
    assignee: "Wei Chen",
    blocked: true,
  },
  s5: {
    id: "s5",
    ref: "MER-43",
    title: "Per-workspace rate limits",
    points: 8,
    assignee: "Marco Silva",
  },
  s6: {
    id: "s6",
    ref: "MER-40",
    title: "Trim the onboarding checklist",
    points: 2,
    assignee: "Ana Reyes",
  },
  s7: {
    id: "s7",
    ref: "MER-38",
    title: "Signed URLs for shared exports",
    points: 3,
    assignee: "Priya Nandakumar",
  },
  s8: {
    id: "s8",
    ref: "MER-35",
    title: "Collapse duplicate alert emails",
    points: 5,
    assignee: "Wei Chen",
  },
  s9: {
    id: "s9",
    ref: "MER-31",
    title: "Timezone picker on scheduled reports",
    points: 2,
    assignee: "Ana Reyes",
  },
  s10: {
    id: "s10",
    ref: "MER-28",
    title: "Backfill missing usage rows",
    points: 3,
    assignee: "Marco Silva",
  },
};

const INITIAL: Record<ColumnId, string[]> = {
  committed: ["s1", "s5", "s9"],
  building: ["s2", "s4"],
  verifying: ["s3", "s7"],
  accepted: ["s6", "s8", "s10"],
};

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export default function Kanban5() {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<Record<ColumnId, string[]>>(INITIAL);
  const [dragId, setDragId] = useState<string | null>(null);
  const [grabbed, setGrabbed] = useState<string | null>(null);
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
      "committed",
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
    setDragId(null);
  };

  const onCardKeyDown = (e: React.KeyboardEvent<HTMLElement>, id: string) => {
    const col = columnOf(id);
    const index = items[col].indexOf(id);
    const ci = COLUMNS.findIndex((c) => c.id === col);

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const next = grabbed === id ? null : id;
      setGrabbed(next);
      setAnnounce(
        next
          ? `${CARDS[id].ref} grabbed. Arrow keys move it.`
          : `${CARDS[id].ref} dropped in ${COLUMNS[ci].name}.`,
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
    if (e.key === "ArrowUp") move(id, col, Math.max(0, index - 1));
    else if (e.key === "ArrowDown") move(id, col, index + 1);
    else if (e.key === "ArrowLeft" && ci > 0)
      move(id, COLUMNS[ci - 1].id, items[COLUMNS[ci - 1].id].length);
    else if (e.key === "ArrowRight" && ci < COLUMNS.length - 1)
      move(id, COLUMNS[ci + 1].id, items[COLUMNS[ci + 1].id].length);
    else handled = false;

    if (handled) {
      e.preventDefault();
      e.currentTarget.focus();
    }
  };

  const points = useMemo(() => {
    const p = {} as Record<ColumnId, number>;
    for (const c of COLUMNS)
      p[c.id] = items[c.id].reduce((s, id) => s + CARDS[id].points, 0);
    return p;
  }, [items]);

  const committed = Object.values(points).reduce((s, n) => s + n, 0);
  const accepted = points.accepted;
  const pct = committed ? Math.round((accepted / committed) * 100) : 0;

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
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Sprint 34&nbsp;&middot;&nbsp;Meridian
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-neutral-500">
              4 June to 18 June. Six days left. Columns show points against
              capacity.
            </p>
          </div>
        </div>

        <div className={cx(frame, "grid grid-cols-3 gap-1")}>
          {[
            { k: "Committed", v: `${committed} pts` },
            { k: "Accepted", v: `${accepted} pts` },
            { k: "Burned", v: `${pct}%` },
          ].map((s) => (
            <div key={s.k} className={cx(panel, "px-3 py-2")}>
              <p className="text-[11px] text-neutral-500">{s.k}</p>
              <p className="mt-0.5 text-[15px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                {s.v}
              </p>
            </div>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 sm:px-8">
        <div className="flex h-full min-w-max gap-2.5">
          {COLUMNS.map((col) => {
            const list = items[col.id];
            const pts = points[col.id];
            const over = col.capacity > 0 && pts > col.capacity;
            const fill = col.capacity
              ? Math.min(100, (pts / col.capacity) * 100)
              : 0;
            return (
              <section
                key={col.id}
                aria-label={col.name}
                className="flex h-full w-[244px] shrink-0 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div className="shrink-0 px-2 pt-1 pb-2">
                  <div className="flex h-6 items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {col.name}
                    </span>
                    <span
                      className={cx(
                        "ml-auto text-[11px] tabular-nums",
                        over
                          ? "font-medium text-neutral-900 dark:text-white"
                          : "text-neutral-500",
                      )}
                    >
                      {pts}
                      {col.capacity > 0 ? ` / ${col.capacity} pts` : " pts"}
                    </span>
                  </div>
                  {col.capacity > 0 && (
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={col.capacity}
                      aria-valuenow={pts}
                      aria-label={`${col.name} capacity`}
                      className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
                    >
                      <motion.div
                        animate={{ width: `${fill}%` }}
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { duration: 0.35, ease: EASE_OUT }
                        }
                        className={cx(
                          "h-full rounded-full",
                          over
                            ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                            : "bg-neutral-400 dark:bg-neutral-600",
                        )}
                      />
                    </div>
                  )}
                </div>

                <div
                  ref={(el) => {
                    if (el) colRefs.current.set(col.id, el);
                    else colRefs.current.delete(col.id);
                  }}
                  className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1 pt-0"
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
                          aria-label={`${card.ref}: ${card.title}, ${card.points} points${
                            card.blocked ? ", blocked" : ""
                          }.`}
                          onPointerDown={(e) => {
                            if (e.pointerType === "mouse") onPointerDown(e, id);
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
                            {card.blocked && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-900 dark:text-white">
                                <span
                                  aria-hidden
                                  className="h-1.5 w-1.5 rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                                />
                                Blocked
                              </span>
                            )}
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
                            {card.title}
                          </p>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-5 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] font-medium tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                              {card.points}
                            </span>
                            <span
                              title={card.assignee}
                              className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                            >
                              {initials(card.assignee)}
                            </span>
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

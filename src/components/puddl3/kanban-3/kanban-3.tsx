"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GripVertical } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,box-shadow] duration-150 ease-out";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.34 };

const STATUS = ["Triage", "Building", "Review", "Live"] as const;
const PEOPLE = ["Ana Reyes", "Priya Nandakumar", "Marco Silva"] as const;
const PRIORITY = ["Urgent", "High", "Normal"] as const;

type Status = (typeof STATUS)[number];
type Person = (typeof PEOPLE)[number];
type Priority = (typeof PRIORITY)[number];

type Fields = { status: Status; assignee: Person; priority: Priority };

type Card = { id: string; ref: string; title: string; tag: string };

const CARDS: Card[] = [
  {
    id: "c1",
    ref: "NW-412",
    title: "Rate-limit the public search API",
    tag: "API",
  },
  {
    id: "c2",
    ref: "NW-408",
    title: "Draft the Q3 reliability review",
    tag: "Docs",
  },
  {
    id: "c3",
    ref: "NW-401",
    title: "Fix flaky checkout integration test",
    tag: "Quality",
  },
  { id: "c4", ref: "NW-397", title: "Region failover runbook", tag: "Infra" },
  {
    id: "c5",
    ref: "NW-392",
    title: "Compress asset uploads on ingest",
    tag: "Media",
  },
  {
    id: "c6",
    ref: "NW-388",
    title: "Warn before destructive bulk edits",
    tag: "Safety",
  },
  { id: "c7", ref: "NW-380", title: "Import contacts from CSV", tag: "Growth" },
  {
    id: "c8",
    ref: "NW-374",
    title: "Retire the legacy search index",
    tag: "Infra",
  },
  {
    id: "c9",
    ref: "NW-369",
    title: "Keyboard shortcuts help sheet",
    tag: "Craft",
  },
];

const FIELDS: Record<string, Fields> = {
  c1: { status: "Building", assignee: "Marco Silva", priority: "Urgent" },
  c2: { status: "Triage", assignee: "Ana Reyes", priority: "Normal" },
  c3: { status: "Review", assignee: "Priya Nandakumar", priority: "High" },
  c4: { status: "Building", assignee: "Marco Silva", priority: "High" },
  c5: { status: "Triage", assignee: "Priya Nandakumar", priority: "Normal" },
  c6: { status: "Live", assignee: "Ana Reyes", priority: "High" },
  c7: { status: "Review", assignee: "Ana Reyes", priority: "Normal" },
  c8: { status: "Building", assignee: "Priya Nandakumar", priority: "Urgent" },
  c9: { status: "Live", assignee: "Marco Silva", priority: "Normal" },
};

const GROUPS = [
  { id: "status", label: "Status", values: STATUS },
  { id: "assignee", label: "Assignee", values: PEOPLE },
  { id: "priority", label: "Priority", values: PRIORITY },
] as const;
type GroupBy = (typeof GROUPS)[number]["id"];

const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const PRIORITY_DOT: Record<Priority, string> = {
  Urgent:
    "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
  High: "bg-neutral-400 dark:bg-neutral-500",
  Normal: "bg-neutral-200 dark:bg-neutral-700",
};

export default function Kanban3() {
  const uid = useId();
  const reduce = useReducedMotion();

  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [fields, setFields] = useState<Record<string, Fields>>(FIELDS);
  const [order, setOrder] = useState<string[]>(CARDS.map((c) => c.id));
  const [dragId, setDragId] = useState<string | null>(null);
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const [ghost, setGhost] = useState({ x: 0, y: 0, w: 0 });
  const [announce, setAnnounce] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef(new Map<string, HTMLElement>());
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

  const group = GROUPS.find((g) => g.id === groupBy)!;

  const columns = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const v of group.values) map.set(v, []);
    for (const id of order) {
      const v = fields[id][groupBy] as string;
      map.get(v)?.push(id);
    }
    return map;
  }, [group.values, groupBy, fields, order]);

  const place = useCallback(
    (id: string, value: string, index: number) => {
      setFields((prev) =>
        prev[id][groupBy] === value
          ? prev
          : { ...prev, [id]: { ...prev[id], [groupBy]: value } },
      );
      setOrder((prev) => {
        const without = prev.filter((x) => x !== id);
        const members = without.filter(
          (x) => (x === id ? value : fields[x][groupBy]) === value,
        );
        const anchor = members[index];
        const at = anchor ? without.indexOf(anchor) : -1;
        const next = [...without];
        if (at === -1) {
          const last = members[members.length - 1];
          next.splice(last ? without.indexOf(last) + 1 : next.length, 0, id);
        } else next.splice(at, 0, id);
        return next;
      });
    },
    [fields, groupBy],
  );

  const targetFromPoint = useCallback(
    (clientX: number, clientY: number, id: string) => {
      for (const [value, el] of colRefs.current) {
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
        return { value, index };
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
    if (t) place(d.id, t.value, t.index);
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
        `${CARD_BY_ID[d.id].ref} ${group.label.toLowerCase()} set to ${
          fields[d.id][groupBy]
        }.`,
      );
    setDragId(null);
  };

  const onCardKeyDown = (e: React.KeyboardEvent<HTMLElement>, id: string) => {
    const value = fields[id][groupBy] as string;
    const list = columns.get(value) ?? [];
    const index = list.indexOf(id);
    const vi = (group.values as readonly string[]).indexOf(value);

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const next = grabbed === id ? null : id;
      setGrabbed(next);
      setAnnounce(
        next
          ? `${CARD_BY_ID[id].ref} grabbed. Left and right change ${group.label.toLowerCase()}.`
          : `${CARD_BY_ID[id].ref} dropped in ${value}.`,
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
    if (e.key === "ArrowLeft" && vi > 0)
      place(
        id,
        group.values[vi - 1],
        (columns.get(group.values[vi - 1]) ?? []).length,
      );
    else if (e.key === "ArrowRight" && vi < group.values.length - 1)
      place(
        id,
        group.values[vi + 1],
        (columns.get(group.values[vi + 1]) ?? []).length,
      );
    else if (e.key === "ArrowUp" && index > 0) place(id, value, index - 1);
    else if (e.key === "ArrowDown" && index < list.length - 1)
      place(id, value, index + 1);
    else handled = false;

    if (handled) {
      e.preventDefault();
      e.currentTarget.focus();
    }
  };

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
            Northwind roadmap
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-neutral-500">
            Regroup the board on any field. Dropping a card into a column sets
            that field on it.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Group by"
          className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
        >
          {GROUPS.map((g) => {
            const active = g.id === groupBy;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setGroupBy(g.id)}
                className={cx(
                  "relative inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                  active
                    ? "text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {active && (
                  <motion.span
                    layoutId={`${uid}-group`}
                    transition={reduce ? { duration: 0 } : SPRING}
                    className="absolute inset-0 rounded-[var(--rb-r-sm,6px)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950"
                  />
                )}
                <span className={cx("relative", active && "font-medium")}>
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 sm:px-8">
        <div className="flex h-full min-w-max gap-2.5">
          {group.values.map((value) => {
            const list = columns.get(value) ?? [];
            return (
              <section
                key={`${groupBy}-${value}`}
                aria-label={value}
                className="flex h-full w-[260px] shrink-0 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div className="flex h-8 shrink-0 items-center gap-2 px-2">
                  {groupBy === "assignee" && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200/70 text-[9px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {initials(value)}
                    </span>
                  )}
                  {groupBy === "priority" && (
                    <span
                      aria-hidden
                      className={cx(
                        "h-1.5 w-1.5 rounded-full",
                        PRIORITY_DOT[value as Priority],
                      )}
                    />
                  )}
                  <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {value}
                  </span>
                  <span className="ml-auto text-[11px] tabular-nums text-neutral-500">
                    {list.length}
                  </span>
                </div>

                <div
                  ref={(el) => {
                    if (el) colRefs.current.set(value, el);
                    else colRefs.current.delete(value);
                  }}
                  className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1 pt-0"
                >
                  {list.map((id) => {
                    const card = CARD_BY_ID[id];
                    const isDragging = dragId === id;
                    const isGrabbed = grabbed === id;
                    return (
                      <motion.div
                        key={id}
                        layoutId={reduce ? undefined : `${uid}-${id}`}
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
                          aria-label={`${card.ref}: ${card.title}. ${group.label} ${value}.`}
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
                            <span
                              aria-hidden
                              className={cx(
                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                PRIORITY_DOT[fields[id].priority],
                              )}
                            />
                            <span className="text-[11px] tabular-nums text-neutral-500">
                              {card.ref}
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
                            {card.title}
                          </p>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-5 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                              {card.tag}
                            </span>
                            {groupBy !== "assignee" && (
                              <span
                                title={fields[id].assignee}
                                className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                              >
                                {initials(fields[id].assignee)}
                              </span>
                            )}
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
              {CARD_BY_ID[dragId].ref}
            </span>
            <p className="mt-2 text-[13px] leading-snug text-neutral-900 dark:text-neutral-100">
              {CARD_BY_ID[dragId].title}
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

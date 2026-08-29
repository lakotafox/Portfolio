"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { GitBranch } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const grouped = (n: number) => n.toLocaleString("en-US");

const wave = (seed: number, i: number) =>
  Math.sin(i * 0.9 + seed) * 0.5 + Math.sin(i * 0.31 + seed * 1.7) * 0.32;

function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view?.ResizeObserver) return;
    const observer = new view.ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize({ width: box.width, height: box.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

const COLS = 26;
const ROWS = 7;
const DAYS = COLS * ROWS;
const GAP = 3;
const WEEK_LABEL_W = 30;
const MONTH_H = 18;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const START = Date.UTC(2024, 10, 4);
const DAY_MS = 86_400_000;
function dateFor(day: number) {
  return new Date(START + day * DAY_MS);
}

type Mode = {
  id: string;
  label: string;
  noun: string;
  build: (day: number) => number;
};

const MODES: Mode[] = [
  {
    id: "deploys",
    label: "Deployments",
    noun: "deployments",
    build: (d) => {
      const weekend = d % 7 >= 5;
      const v = Math.max(0, (wave(1.3, d) + 0.62) * 7);
      return Math.round(weekend ? v * 0.24 : v);
    },
  },
  {
    id: "incidents",
    label: "Incidents",
    noun: "incidents",
    build: (d) => Math.max(0, Math.round((wave(4.7, d) - 0.46) * 13)),
  },
  {
    id: "reviews",
    label: "Reviews",
    noun: "reviews",
    build: (d) => {
      const weekend = d % 7 >= 5;
      const v = Math.max(0, (wave(6.1, d) + 0.7) * 9);
      return Math.round(weekend ? v * 0.42 : v);
    },
  },
];

const STEP_FILL = [
  "fill-neutral-100 dark:fill-neutral-800/60",
  "fill-neutral-300 dark:fill-neutral-600",
  "fill-neutral-400 dark:fill-neutral-500",
  "fill-neutral-600 dark:fill-neutral-300",
  "fill-neutral-900 dark:fill-white",
];
const STEP_BG = [
  "bg-neutral-100 dark:bg-neutral-800/60",
  "bg-neutral-300 dark:bg-neutral-600",
  "bg-neutral-400 dark:bg-neutral-500",
  "bg-neutral-600 dark:bg-neutral-300",
  "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
];

function levelFor(value: number, max: number) {
  if (value <= 0) return 0;
  return clamp(1 + Math.round((value / (max || 1)) * 3), 1, 4);
}

export default function Analytics9() {
  const uid = useId();
  const clipId = `${uid}-clip`;

  const [mode, setMode] = useState<Mode>(MODES[0]);
  const [cursor, setCursor] = useState<{ col: number; row: number } | null>(
    null,
  );
  const [held, setHeld] = useState({ col: COLS - 1, row: ROWS - 1 });
  const [mounted, setMounted] = useState(false);
  const [ref, size] = useMeasure<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  const values = useMemo(
    () => Array.from({ length: DAYS }, (_, d) => mode.build(d)),
    [mode],
  );

  const stats = useMemo(() => {
    const max = Math.max(...values, 1);
    const total = values.reduce((a, b) => a + b, 0);
    let peakDay = 0;
    for (let d = 1; d < DAYS; d++) if (values[d] > values[peakDay]) peakDay = d;

    let streak = 0;
    const incidentMode = mode.id === "incidents";
    for (let d = DAYS - 1; d >= 0; d--) {
      const active = values[d] > 0;
      if (incidentMode ? active : !active) break;
      streak++;
    }
    return { max, total, peakDay, streak, incidentMode };
  }, [values, mode]);

  const monthMarks = useMemo(() => {
    const marks: { col: number; name: string }[] = [];
    let last = -1;
    let lastCol = -3;
    for (let c = 0; c < COLS; c++) {
      const m = dateFor(c * 7).getUTCMonth();
      if (m !== last && c - lastCol >= 3) {
        marks.push({ col: c, name: MONTHS[m] });
        lastCol = c;
      }
      last = m;
    }
    return marks;
  }, []);

  const width = size.width;
  const cell =
    width > 0
      ? Math.floor((width - WEEK_LABEL_W - (COLS - 1) * GAP) / COLS)
      : 0;
  const cellStep = cell + GAP;
  const svgHeight = MONTH_H + ROWS * cell + (ROWS - 1) * GAP;

  const cellX = (col: number) => WEEK_LABEL_W + col * cellStep;
  const cellY = (row: number) => MONTH_H + row * cellStep;

  const dayLabel = (col: number, row: number) => {
    const date = dateFor(col * 7 + row);
    return `${WEEKDAYS[row]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  };

  const activeValue = cursor === null ? 0 : values[cursor.col * 7 + cursor.row];

  const move = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el || cell <= 0) return;
    const rect = el.getBoundingClientRect();
    const col = clamp(
      Math.floor((clientX - rect.left - WEEK_LABEL_W) / cellStep),
      0,
      COLS - 1,
    );
    const row = clamp(
      Math.floor((clientY - rect.top - MONTH_H) / cellStep),
      0,
      ROWS - 1,
    );
    setCursor({ col, row });
    setHeld({ col, row });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const base = cursor ?? { col: COLS - 1, row: ROWS - 1 };
    let next: { col: number; row: number } | null = null;
    if (e.key === "ArrowLeft") next = { ...base, col: base.col - 1 };
    else if (e.key === "ArrowRight") next = { ...base, col: base.col + 1 };
    else if (e.key === "ArrowUp") next = { ...base, row: base.row - 1 };
    else if (e.key === "ArrowDown") next = { ...base, row: base.row + 1 };
    else if (e.key === "Home") next = { col: 0, row: base.row };
    else if (e.key === "End") next = { col: COLS - 1, row: base.row };
    else if (e.key === "Escape") {
      setCursor(null);
      return;
    }
    if (!next) return;
    e.preventDefault();
    const clamped = {
      col: clamp(next.col, 0, COLS - 1),
      row: clamp(next.row, 0, ROWS - 1),
    };
    setCursor(clamped);
    setHeld(clamped);
  };

  const peakLabel = dayLabel(Math.floor(stats.peakDay / 7), stats.peakDay % 7);

  const ariaLabel =
    cursor === null
      ? `${mode.label} heatmap, ${grouped(stats.total)} ${mode.noun} over the last 26 weeks. Use arrow keys to inspect a day.`
      : `${activeValue === 0 ? `No ${mode.noun}` : `${activeValue} ${activeValue === 1 ? mode.noun.replace(/s$/, "") : mode.noun}`} on ${dayLabel(cursor.col, cursor.row)}`;

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className={cx(frame, "mx-auto w-full max-w-[880px] space-y-1")}>
        <div className={cx(panel, "px-5 py-4")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                <GitBranch
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0"
                />
                {mode.label}
              </div>
              <p className="mt-1 text-3xl font-medium tabular-nums tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                {grouped(stats.total)}
              </p>
              <p className="mt-1 truncate text-[13px] text-neutral-500">
                Busiest {peakLabel} ({grouped(values[stats.peakDay])}) ·{" "}
                <span className="tabular-nums">{stats.streak}</span>
                {stats.incidentMode
                  ? "-day incident-free streak"
                  : "-day active streak"}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Metric"
              className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
            >
              {MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={option.id === mode.id}
                  onClick={() => {
                    setMode(option);
                    setCursor(null);
                  }}
                  className={cx(
                    "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                    option.id === mode.id
                      ? "bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                    transition,
                    focus,
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={ref}
            role="img"
            tabIndex={0}
            aria-label={ariaLabel}
            onPointerMove={(e) => move(e.clientX, e.clientY)}
            onPointerLeave={() => setCursor(null)}
            onBlur={() => setCursor(null)}
            onKeyDown={onKeyDown}
            style={{ height: svgHeight, touchAction: "pan-y" }}
            className={cx(
              "relative mt-4 cursor-pointer rounded-[var(--rb-r-md,8px)]",
              focus,
            )}
          >
            {width > 0 && cell > 0 && (
              <svg
                width={width}
                height={svgHeight}
                className="overflow-visible text-neutral-900 dark:text-white"
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect
                      x={0}
                      y={0}
                      width={width}
                      height={svgHeight}
                      style={{
                        transform: mounted ? "scaleX(1)" : "scaleX(0)",
                        transformBox: "fill-box",
                        transformOrigin: "left",
                      }}
                      className="transition-transform duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    />
                  </clipPath>
                </defs>

                {monthMarks.map((mark) => (
                  <text
                    key={mark.name + mark.col}
                    x={cellX(mark.col)}
                    y={MONTH_H - 8}
                    className="fill-neutral-400 text-[11px]"
                  >
                    {mark.name}
                  </text>
                ))}

                {[0, 2, 4].map((row) => (
                  <text
                    key={row}
                    x={0}
                    y={cellY(row) + cell / 2}
                    dy={3}
                    className="fill-neutral-400 text-[11px]"
                  >
                    {WEEKDAYS[row]}
                  </text>
                ))}

                <g clipPath={`url(#${clipId})`}>
                  {values.map((value, d) => {
                    const col = Math.floor(d / 7);
                    const row = d % 7;
                    const level = levelFor(value, stats.max);
                    const breach = stats.incidentMode && level === 4;
                    return (
                      <rect
                        key={d}
                        x={cellX(col)}
                        y={cellY(row)}
                        width={cell}
                        height={cell}
                        rx={2}
                        className={cx(
                          breach ? "fill-red-500" : STEP_FILL[level],
                        )}
                      />
                    );
                  })}
                </g>

                {cursor !== null && (
                  <rect
                    x={cellX(cursor.col) - 0.5}
                    y={cellY(cursor.row) - 0.5}
                    width={cell + 1}
                    height={cell + 1}
                    rx={2.5}
                    fill="none"
                    strokeWidth={1}
                    className="stroke-neutral-900 dark:stroke-white"
                  />
                )}
              </svg>
            )}

            {width > 0 && cell > 0 && (
              <div
                aria-hidden="true"
                style={{
                  left: clamp(
                    cellX(held.col) + cell / 2,
                    72,
                    Math.max(width - 72, 72),
                  ),
                  top: clamp(cellY(held.row) - 46, 0, svgHeight - 44),
                }}
                className={cx(
                  "pointer-events-none absolute -translate-x-1/2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-2.5 py-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] transition-opacity duration-[125ms] ease-out dark:border-neutral-800 dark:bg-neutral-900",
                  cursor === null ? "opacity-0" : "opacity-100",
                )}
              >
                <p className="whitespace-nowrap text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                  {values[held.col * 7 + held.row] === 0
                    ? `No ${mode.noun}`
                    : `${grouped(values[held.col * 7 + held.row])} ${
                        values[held.col * 7 + held.row] === 1
                          ? mode.noun.replace(/s$/, "")
                          : mode.noun
                      }`}
                </p>
                <p className="whitespace-nowrap text-[11px] text-neutral-500">
                  {dayLabel(held.col, held.row)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-neutral-400">
            <span>Less</span>
            {STEP_BG.map((bg, i) => (
              <span
                key={i}
                className={cx(
                  "h-2.5 w-2.5 rounded-[2px]",
                  stats.incidentMode && i === STEP_BG.length - 1
                    ? "bg-red-500"
                    : bg,
                )}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Banknote,
  CreditCard,
  Download,
  Landmark,
  ListChecks,
  RefreshCw,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { area, curveMonotoneX, line } from "d3-shape";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const panel =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

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

const scale = (v: number, d0: number, d1: number, r0: number, r1: number) =>
  r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function niceTicks(max: number, count = 4) {
  if (!(max > 0)) return { top: 1, ticks: [0, 1] };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step =
    (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) *
    mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 1000; v += step) ticks.push(v);
  return { top, ticks };
}

const compact = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(Math.abs(n) >= 10_000_000 ? 0 : 1)}M`
    : Math.abs(n) >= 1_000
      ? `${(n / 1_000).toFixed(Math.abs(n) >= 10_000 ? 0 : 1)}k`
      : `${n}`;

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const wave = (seed: number, i: number) =>
  Math.sin(i * 0.36 + seed) * 0.5 + Math.sin(i * 0.14 + seed * 1.8) * 0.34;

const DAYS = 30;

const DATES = Array.from({ length: DAYS }, (_, i) => {
  const day = 12 + i;
  return day > 30 ? `Jun ${day - 30}` : `May ${day}`;
});

const RECEIPTS = Array.from({ length: DAYS }, (_, i) =>
  Math.round(41_000 + wave(2.6, i) * 12_500),
);
const BUFFER = Array.from({ length: DAYS }, (_, i) =>
  Math.round(9_400 + wave(6.4, i) * 3_100),
);

const CLEAR_TO_RELEASE = 505_870;
const SETTLING = 49_300;
const BUFFER_HELD = 96_370;
const BUFFER_LIMIT = 225_000;

type Tile = {
  label: string;
  meta: string;
  value: string;
  Icon: typeof Banknote;
};

const TILES: Tile[] = [
  {
    label: "Released today",
    meta: "17 payouts",
    value: money(212_480),
    Icon: Banknote,
  },
  {
    label: "Buffer",
    meta: "Under review",
    value: money(83_040),
    Icon: ShieldCheck,
  },
  {
    label: "Sweep lanes",
    meta: "Funds moving",
    value: "3",
    Icon: Landmark,
  },
  {
    label: "Moves",
    meta: "Ledger depth",
    value: "11",
    Icon: ListChecks,
  },
];

type Lane = {
  id: string;
  name: string;
  meta: string;
  amount: number;
  mask: string;
  Icon: typeof CreditCard;
};

const LANES: Lane[] = [
  {
    id: "l1",
    name: "Studio card",
    meta: "Daily clear · today",
    amount: 284_650,
    mask: "•••• 4576",
    Icon: CreditCard,
  },
  {
    id: "l2",
    name: "Royalty vault",
    meta: "Weekly sweep · Friday",
    amount: 153_980,
    mask: "•••• 9132",
    Icon: Landmark,
  },
  {
    id: "l3",
    name: "Collab wallet",
    meta: "Creator split · queued",
    amount: 67_240,
    mask: "•••• 2841",
    Icon: Wallet,
  },
  {
    id: "l4",
    name: "Reserve account",
    meta: "Month end · holding",
    amount: 41_500,
    mask: "•••• 7710",
    Icon: ShieldCheck,
  },
];

type Move = {
  id: string;
  ref: string;
  party: string;
  channel: string;
  amount: number;
  state: "settled" | "clearing" | "held";
  when: string;
};

const MOVES: Move[] = [
  {
    id: "m1",
    ref: "MV-40812",
    party: "Halvorsen Studio",
    channel: "Bank transfer",
    amount: 84_200,
    state: "settled",
    when: "09:41",
  },
  {
    id: "m2",
    ref: "MV-40811",
    party: "Petit Sound Co.",
    channel: "Instant card",
    amount: 12_640,
    state: "settled",
    when: "09:12",
  },
  {
    id: "m3",
    ref: "MV-40809",
    party: "Aranyi Collective",
    channel: "Bank transfer",
    amount: 46_900,
    state: "clearing",
    when: "08:55",
  },
  {
    id: "m4",
    ref: "MV-40806",
    party: "Løken Media",
    channel: "Wallet split",
    amount: 9_180,
    state: "settled",
    when: "08:30",
  },
  {
    id: "m5",
    ref: "MV-40804",
    party: "Osei & Partners",
    channel: "Bank transfer",
    amount: 31_450,
    state: "held",
    when: "08:04",
  },
  {
    id: "m6",
    ref: "MV-40801",
    party: "Sundar Archive",
    channel: "Instant card",
    amount: 5_720,
    state: "settled",
    when: "07:48",
  },
  {
    id: "m7",
    ref: "MV-40799",
    party: "Miralles Press",
    channel: "Wallet split",
    amount: 18_330,
    state: "clearing",
    when: "07:22",
  },
  {
    id: "m8",
    ref: "MV-40795",
    party: "Brekke Audio",
    channel: "Bank transfer",
    amount: 24_060,
    state: "settled",
    when: "06:59",
  },
  {
    id: "m9",
    ref: "MV-40792",
    party: "Northlight Rooms",
    channel: "Instant card",
    amount: 7_410,
    state: "settled",
    when: "06:31",
  },
  {
    id: "m10",
    ref: "MV-40788",
    party: "Fern & Object",
    channel: "Wallet split",
    amount: 15_880,
    state: "held",
    when: "06:05",
  },
  {
    id: "m11",
    ref: "MV-40784",
    party: "Quiet Harbour Ltd",
    channel: "Bank transfer",
    amount: 39_720,
    state: "settled",
    when: "05:44",
  },
];

const MOVE_STATE: Record<Move["state"], { label: string; dot: string }> = {
  settled: { label: "Settled", dot: "bg-neutral-300 dark:bg-neutral-600" },
  clearing: { label: "Clearing", dot: "bg-neutral-400 animate-pulse" },
  held: { label: "Held", dot: "bg-amber-500" },
};

const PAD = { top: 12, right: 6, bottom: 22, left: 46 };

export default function Dashboard12() {
  const uid = useId();
  const receiptsFill = `${uid}-receipts`;
  const bufferFill = `${uid}-buffer`;
  const clipId = `${uid}-clip`;

  const [mounted, setMounted] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [synced, setSynced] = useState(false);
  const [plotRef, plotSize] = useMeasure<HTMLDivElement>();
  const {
    ref: moveRef,
    edges: moveEdges,
    onScroll: onMoveScroll,
  } = useScrollFade<HTMLDivElement>();
  const {
    ref: laneRef,
    edges: laneEdges,
    onScroll: onLaneScroll,
  } = useScrollFade<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  const width = plotSize.width;
  const height = plotSize.height;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = Math.max(height - PAD.top - PAD.bottom, 1);

  const { top, ticks } = useMemo(
    () => niceTicks(Math.max(...RECEIPTS) * 1.1, 4),
    [],
  );

  const geom = useMemo(() => {
    if (width === 0) return null;
    const x = (i: number) => PAD.left + scale(i, 0, DAYS - 1, 0, innerW);
    const y = (v: number) => PAD.top + innerH - scale(v, 0, top, 0, innerH);

    const l = line<number>()
      .x((_, i) => x(i))
      .y((v) => y(v))
      .curve(curveMonotoneX);
    const a = area<number>()
      .x((_, i) => x(i))
      .y0(PAD.top + innerH)
      .y1((v) => y(v))
      .curve(curveMonotoneX);

    return {
      x,
      y,
      receiptsLine: l(RECEIPTS) ?? "",
      receiptsArea: a(RECEIPTS) ?? "",
      bufferLine: l(BUFFER) ?? "",
      bufferArea: a(BUFFER) ?? "",
    };
  }, [width, innerW, innerH, top]);

  const onPlotMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = plotRef.current;
    if (!el || innerW <= 0) return;
    const rect = el.getBoundingClientRect();
    const t = (e.clientX - rect.left - PAD.left) / innerW;
    setCursor(clamp(Math.round(t * (DAYS - 1)), 0, DAYS - 1));
  };

  const onPlotKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setCursor((c) => {
      const next = (c ?? DAYS - 1) + (e.key === "ArrowRight" ? 1 : -1);
      return clamp(next, 0, DAYS - 1);
    });
  };

  const drawn = Math.round((BUFFER_HELD / BUFFER_LIMIT) * 100);
  const laneTotal = LANES.reduce((s, l) => s + l.amount, 0);
  const xStep = 7;

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li className="text-neutral-500">Finance</li>
            <li
              aria-hidden="true"
              className="text-neutral-300 dark:text-neutral-700"
            >
              /
            </li>
            <li className="truncate font-medium text-neutral-900 dark:text-neutral-100">
              Payout studio
            </li>
          </ol>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden h-8 items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] tabular-nums text-neutral-600 sm:inline-flex dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
            May 12 – Jun 10
          </span>
          <button
            type="button"
            className={cx(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
              transition,
              focus,
            )}
          >
            <Download aria-hidden="true" className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </header>

      <div className="shrink-0 px-4 pb-4 sm:px-6">
        <div className="rounded-[var(--rb-r-4xl,18px)] border border-neutral-200/70 bg-neutral-50 p-1.5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-wrap items-start justify-between gap-4 px-3 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-200/70 px-1.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  Creator finance
                </span>
                <span className="truncate text-[13px] text-neutral-500">
                  Thursday, Jun 25
                </span>
              </div>
              <h1 className="mt-2 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
                Royalty desk
              </h1>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                Next payout closes at 4:00 PM.
              </p>
            </div>

            <div className="flex min-w-0 items-end gap-4">
              <div className="min-w-0 text-right">
                <p className="text-[13px] text-neutral-500">Clear to release</p>
                <p className="mt-0.5 text-3xl font-medium tracking-[-0.02em] tabular-nums text-neutral-900 dark:text-neutral-100">
                  {money(CLEAR_TO_RELEASE)}
                </p>
                <p className="mt-0.5 text-[11px] tabular-nums text-neutral-500">
                  {money(SETTLING)} still settling
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 pb-1">
                <button
                  type="button"
                  className={cx(
                    "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                    transition,
                    focus,
                  )}
                >
                  <Send aria-hidden="true" className="h-4 w-4" />
                  Split
                </button>
                <button
                  type="button"
                  onClick={() => setSynced(true)}
                  className={cx(
                    "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
                    transition,
                    focus,
                  )}
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={cx("h-4 w-4", synced && "text-neutral-500")}
                  />
                  {synced ? "Synced" : "Sync"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
            {TILES.map((t) => (
              <div
                key={t.label}
                className="rounded-[var(--rb-r-xl,12px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-center gap-2">
                  <t.Icon
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
                  />
                  <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {t.label}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] text-neutral-500">
                    {t.meta}
                  </span>
                  <span className="shrink-0 text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                    {t.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-[minmax(0,1fr)_336px] sm:px-6 sm:pb-6">
        <div className={cx(panel, "flex min-h-0 flex-col overflow-hidden")}>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Royalty pace
              </h2>
              <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                {cursor === null
                  ? "Daily receipts against buffer draw"
                  : DATES[cursor]}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-[11px] tabular-nums">
              <span className="inline-flex items-center gap-1.5 text-neutral-500">
                <span className="h-1 w-4 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                Receipts{" "}
                <span className="text-neutral-900 dark:text-neutral-100">
                  {cursor === null
                    ? `$${compact(RECEIPTS[DAYS - 1])}`
                    : `$${compact(RECEIPTS[cursor])}`}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-neutral-500">
                <span className="h-1 w-4 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                Buffer{" "}
                <span className="text-neutral-900 dark:text-neutral-100">
                  {cursor === null
                    ? `$${compact(BUFFER[DAYS - 1])}`
                    : `$${compact(BUFFER[cursor])}`}
                </span>
              </span>
            </div>
          </div>

          <div
            ref={plotRef}
            role="application"
            tabIndex={0}
            aria-label="Daily receipts against buffer draw over 30 days"
            onPointerMove={onPlotMove}
            onPointerLeave={() => setCursor(null)}
            onKeyDown={onPlotKey}
            onBlur={() => setCursor(null)}
            className={cx("relative h-[244px] shrink-0 px-3 pt-3 pb-1", focus)}
          >
            {geom && (
              <svg
                width={width}
                height={height}
                className="overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={receiptsFill} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      className="text-neutral-900 dark:text-neutral-100"
                      stopColor="currentColor"
                      stopOpacity="0.1"
                    />
                    <stop
                      offset="100%"
                      className="text-neutral-900 dark:text-neutral-100"
                      stopColor="currentColor"
                      stopOpacity="0"
                    />
                  </linearGradient>
                  <linearGradient id={bufferFill} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      className="text-neutral-500"
                      stopColor="currentColor"
                      stopOpacity="0.14"
                    />
                    <stop
                      offset="100%"
                      className="text-neutral-500"
                      stopColor="currentColor"
                      stopOpacity="0"
                    />
                  </linearGradient>
                  <clipPath id={clipId}>
                    <rect
                      x={PAD.left}
                      y={PAD.top}
                      width={mounted ? innerW : 0}
                      height={innerH}
                      className="transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    />
                  </clipPath>
                </defs>

                {ticks.map((t) => (
                  <g key={t}>
                    <line
                      x1={PAD.left}
                      x2={width - PAD.right}
                      y1={geom.y(t)}
                      y2={geom.y(t)}
                      strokeWidth={1}
                      shapeRendering="crispEdges"
                      className="stroke-neutral-200/70 dark:stroke-neutral-800"
                    />
                    <text
                      x={PAD.left - 8}
                      y={geom.y(t)}
                      dy={3.5}
                      textAnchor="end"
                      className="fill-neutral-400 text-[11px] tabular-nums"
                    >
                      ${compact(t)}
                    </text>
                  </g>
                ))}

                <g clipPath={`url(#${clipId})`}>
                  <path d={geom.receiptsArea} fill={`url(#${receiptsFill})`} />
                  <path d={geom.bufferArea} fill={`url(#${bufferFill})`} />
                  <path
                    d={geom.bufferLine}
                    fill="none"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-neutral-400 dark:stroke-neutral-500"
                  />
                  <path
                    d={geom.receiptsLine}
                    fill="none"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-neutral-900 dark:stroke-neutral-100"
                  />
                </g>

                {DATES.map((d, i) =>
                  (i % xStep === 0 && i < DAYS - 3) || i === DAYS - 1 ? (
                    <text
                      key={d}
                      x={geom.x(i)}
                      y={height - 2}
                      textAnchor={
                        i === 0 ? "start" : i === DAYS - 1 ? "end" : "middle"
                      }
                      className="fill-neutral-400 text-[11px] tabular-nums"
                    >
                      {d}
                    </text>
                  ) : null,
                )}

                {cursor !== null && (
                  <g>
                    <line
                      x1={geom.x(cursor)}
                      x2={geom.x(cursor)}
                      y1={PAD.top}
                      y2={PAD.top + innerH}
                      strokeWidth={1}
                      shapeRendering="crispEdges"
                      className="stroke-neutral-300 dark:stroke-neutral-700"
                    />
                    <circle
                      cx={geom.x(cursor)}
                      cy={geom.y(BUFFER[cursor])}
                      r={3.5}
                      strokeWidth={2}
                      className="fill-white stroke-neutral-400 dark:fill-neutral-900 dark:stroke-neutral-500"
                    />
                    <circle
                      cx={geom.x(cursor)}
                      cy={geom.y(RECEIPTS[cursor])}
                      r={4}
                      strokeWidth={2}
                      className="fill-white stroke-neutral-900 dark:fill-neutral-900 dark:stroke-neutral-100"
                    />
                  </g>
                )}
              </svg>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-2">
              <h3 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                Recent moves
              </h3>
              <span className="text-[11px] tabular-nums text-neutral-500">
                {MOVES.length} today
              </span>
            </div>
            <div className="relative min-h-0 flex-1">
              <div
                ref={moveRef}
                onScroll={onMoveScroll}
                className="h-full overflow-y-auto"
              >
                <table className="w-full border-separate border-spacing-0 text-left">
                  <thead className="sticky top-0 z-10 bg-white dark:bg-neutral-900">
                    <tr>
                      {[
                        "Reference",
                        "Recipient",
                        "Route",
                        "State",
                        "Amount",
                      ].map((h, i) => (
                        <th
                          key={h}
                          scope="col"
                          className={cx(
                            "h-8 px-4 text-[11px] font-medium text-neutral-500",
                            i === 4 && "text-right",
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOVES.map((m) => (
                      <tr
                        key={m.id}
                        className={cx(
                          "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                          transition,
                        )}
                      >
                        <td className="h-11 px-4 font-mono text-[11px] text-neutral-500">
                          {m.ref}
                        </td>
                        <td className="h-11 px-4">
                          <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                            {m.party}
                          </span>
                          <span className="mt-0.5 block text-[11px] tabular-nums text-neutral-500">
                            {m.when}
                          </span>
                        </td>
                        <td className="h-11 px-4 text-[13px] text-neutral-600 dark:text-neutral-400">
                          {m.channel}
                        </td>
                        <td className="h-11 px-4">
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                            <span
                              aria-hidden="true"
                              className={cx(
                                "h-1.5 w-1.5 rounded-full",
                                MOVE_STATE[m.state].dot,
                              )}
                            />
                            {MOVE_STATE[m.state].label}
                          </span>
                        </td>
                        <td className="h-11 px-4 text-right text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                          {money(m.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 top-8 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                  moveEdges.start ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                  moveEdges.end ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          </div>
        </div>

        <div className={cx(panel, "flex min-h-0 flex-col overflow-hidden")}>
          <div className="flex shrink-0 items-center justify-between gap-3 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Release room
              </h2>
              <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                Buffer and sweep lanes
              </p>
            </div>
            <span className="shrink-0 rounded-[var(--rb-r-sm,6px)] bg-neutral-200/70 px-1.5 py-0.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              Vault sweep
            </span>
          </div>

          <div className="shrink-0 px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] text-neutral-600 dark:text-neutral-400">
                Buffer drawn
              </span>
              <span className="text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                {drawn}%
              </span>
            </div>
            <span
              aria-hidden="true"
              className="mt-2 block h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <span
                className="block h-full rounded-full bg-neutral-900 transition-[width] duration-700 ease-out motion-reduce:transition-none dark:bg-neutral-100"
                style={{ width: mounted ? `${drawn}%` : "0%" }}
              />
            </span>
            <div className="mt-2 flex items-baseline justify-between gap-2 text-[11px] tabular-nums text-neutral-500">
              <span>{money(BUFFER_HELD)} held</span>
              <span>{money(BUFFER_LIMIT)} limit</span>
            </div>

            <button
              type="button"
              className={cx(
                "mt-3.5 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                transition,
                focus,
              )}
            >
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Tune buffer
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              ref={laneRef}
              onScroll={onLaneScroll}
              className="h-full overflow-y-auto px-1.5 pb-1.5"
            >
              <ul className="flex flex-col gap-1">
                {LANES.map((l) => (
                  <li
                    key={l.id}
                    className={cx(
                      "flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] px-2.5 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                      transition,
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-neutral-100 dark:bg-neutral-800">
                      <l.Icon
                        aria-hidden="true"
                        className="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        {l.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                        {l.meta}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                        {money(l.amount)}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] tabular-nums text-neutral-500">
                        {l.mask}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                laneEdges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                laneEdges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>

          <div className="flex shrink-0 items-baseline justify-between gap-2 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <span className="text-[11px] text-neutral-500">
              {LANES.length} lanes queued
            </span>
            <span className="text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
              {money(laneTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

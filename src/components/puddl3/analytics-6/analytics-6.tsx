"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { area, curveMonotoneX, line } from "d3-shape";

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

function spark(seed: number, base: number) {
  return Array.from({ length: 14 }, (_, i) =>
    Math.max(1, Math.round(base * (1 + 0.44 * wave(seed, i)))),
  );
}

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

const RANGES = ["7 days", "28 days", "90 days"] as const;
type Range = (typeof RANGES)[number];

type Source = {
  id: string;
  name: string;
  initials: string;
  seed: number;
  sparkBase: number;
  /** 0-2 map to their own composition segment; 3 folds into "Everything else". */
  seg: 0 | 1 | 2 | 3;
};

const SOURCES: Source[] = [
  {
    id: "ph",
    name: "Product Hunt",
    initials: "PH",
    seed: 1.2,
    sparkBase: 240,
    seg: 0,
  },
  {
    id: "hn",
    name: "Hacker News",
    initials: "HN",
    seed: 2.7,
    sparkBase: 190,
    seg: 1,
  },
  {
    id: "gh",
    name: "GitHub",
    initials: "GH",
    seed: 4.1,
    sparkBase: 150,
    seg: 2,
  },
  {
    id: "dt",
    name: "Dev.to",
    initials: "DT",
    seed: 5.6,
    sparkBase: 92,
    seg: 3,
  },
  {
    id: "rd",
    name: "Reddit",
    initials: "RD",
    seed: 7.3,
    sparkBase: 70,
    seg: 3,
  },
  {
    id: "li",
    name: "LinkedIn",
    initials: "LI",
    seed: 9.0,
    sparkBase: 52,
    seg: 3,
  },
];

const DATA: Record<
  Range,
  { total: number; delta: number; counts: number[]; deltas: number[] }
> = {
  "7 days": {
    total: 3180,
    delta: 14.2,
    counts: [940, 610, 505, 300, 210, 165],
    deltas: [24.0, 5.2, -2.0, 31.0, -9.0, 6.0],
  },
  "28 days": {
    total: 12480,
    delta: 11.6,
    counts: [3240, 2610, 1980, 1120, 880, 640],
    deltas: [18.2, 9.4, -4.1, 22.5, -6.8, 3.3],
  },
  "90 days": {
    total: 41600,
    delta: 9.7,
    counts: [10850, 9240, 6700, 3610, 3020, 2140],
    deltas: [12.5, 7.8, -5.5, 16.4, -3.2, 1.9],
  },
};

const SEG_INK = [
  "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
  "bg-neutral-500 dark:bg-neutral-400",
  "bg-neutral-300 dark:bg-neutral-600",
  "bg-neutral-200 dark:bg-neutral-800",
];

function Delta({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={cx(
        "tabular-nums",
        positive
          ? "text-emerald-600 dark:text-emerald-500"
          : "text-red-600 dark:text-red-500",
      )}
    >
      {positive ? "+" : "−"}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function RowSpark({
  data,
  active,
  onActive,
}: {
  data: number[];
  active: number | null;
  onActive: (i: number | null) => void;
}) {
  const uid = useId();
  const fillId = `${uid}-fill`;
  const [ref, size] = useMeasure<HTMLDivElement>();
  const height = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min || 1) * 0.2;

  const x = useCallback(
    (i: number) => (i / (data.length - 1)) * Math.max(size.width - 2, 1) + 1,
    [data.length, size.width],
  );
  const y = useCallback(
    (v: number) =>
      height - 2 - ((v - min + pad) / (max - min + pad * 2)) * (height - 4),
    [max, min, pad],
  );

  const linePath =
    line<number>()
      .x((_, i) => x(i))
      .y((v) => y(v))
      .curve(curveMonotoneX)(data) ?? "";

  const areaPath =
    area<number>()
      .x((_, i) => x(i))
      .y0(height)
      .y1((v) => y(v))
      .curve(curveMonotoneX)(data) ?? "";

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const step = rect.width / (data.length - 1);
    onActive(
      clamp(Math.round((clientX - rect.left) / step), 0, data.length - 1),
    );
  };

  return (
    <div
      ref={ref}
      role="img"
      aria-label="14-day signup trend"
      tabIndex={0}
      onPointerMove={(e) => move(e.clientX)}
      onPointerLeave={() => onActive(null)}
      onBlur={() => onActive(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const from = active ?? data.length - 1;
          onActive(
            clamp(from + (e.key === "ArrowLeft" ? -1 : 1), 0, data.length - 1),
          );
        }
        if (e.key === "Escape") onActive(null);
      }}
      style={{ touchAction: "pan-y" }}
      className={cx(
        "relative h-7 w-full cursor-crosshair rounded-[var(--rb-r-sm,6px)]",
        focus,
      )}
    >
      {size.width > 0 && (
        <svg
          width={size.width}
          height={height}
          className="overflow-visible text-neutral-900 dark:text-white"
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.1} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${fillId})`} />
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {active !== null && (
            <circle
              cx={x(active)}
              cy={y(data[active])}
              r={3}
              strokeWidth={2}
              className="fill-neutral-900 stroke-white dark:fill-white dark:stroke-neutral-900"
            />
          )}
        </svg>
      )}
    </div>
  );
}

export default function Analytics6() {
  const [range, setRange] = useState<Range>("28 days");
  const [activeSeg, setActiveSeg] = useState<number | null>(null);
  const [scrub, setScrub] = useState<Record<string, number | null>>({});

  const model = DATA[range];
  const sparks = useMemo(
    () => SOURCES.map((s) => spark(s.seed, s.sparkBase)),
    [],
  );

  const top3 = model.counts[0] + model.counts[1] + model.counts[2];
  const everythingElse = model.total - top3;
  const segments = [
    { name: SOURCES[0].name, value: model.counts[0] },
    { name: SOURCES[1].name, value: model.counts[1] },
    { name: SOURCES[2].name, value: model.counts[2] },
    { name: "Everything else", value: everythingElse },
  ];
  const pct = (v: number) => (v / model.total) * 100;
  const activeCaption = activeSeg === null ? null : segments[activeSeg];

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className={cx(frame, "mx-auto w-full max-w-[880px] space-y-1")}>
        <div className={cx(panel, "px-5 py-4")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-neutral-500">Referral signups</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                <p className="text-3xl font-medium tabular-nums tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                  {grouped(model.total)}
                </p>
                <p className="text-[13px]">
                  <Delta value={model.delta} />{" "}
                  <span className="text-neutral-500">vs previous {range}</span>
                </p>
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Range"
              className="flex shrink-0 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800"
            >
              {RANGES.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={option === range}
                  onClick={() => {
                    setRange(option);
                    setActiveSeg(null);
                  }}
                  className={cx(
                    "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] tabular-nums",
                    option === range
                      ? "bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                    transition,
                    focus,
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div
            role="img"
            aria-label="Signup share across the top three sources and everything else"
            className="mt-4 flex h-2.5 w-full gap-0.5"
          >
            {segments.map((seg, i) => (
              <button
                key={seg.name}
                type="button"
                aria-label={`${seg.name}, ${grouped(seg.value)} signups`}
                onPointerEnter={() => setActiveSeg(i)}
                onPointerLeave={() => setActiveSeg(null)}
                onFocus={() => setActiveSeg(i)}
                onBlur={() => setActiveSeg(null)}
                style={{ flexGrow: seg.value }}
                className={cx(
                  "h-full min-w-1.5 cursor-pointer",
                  i === 0 && "rounded-l-full",
                  i === segments.length - 1 && "rounded-r-full",
                  SEG_INK[i],
                  activeSeg !== null && activeSeg !== i && "opacity-40",
                  transition,
                  focus,
                )}
              />
            ))}
          </div>

          <p className="mt-2 truncate text-xs tabular-nums text-neutral-500">
            {activeCaption ? (
              <>
                <span className="text-neutral-900 dark:text-neutral-100">
                  {activeCaption.name}
                </span>{" "}
                · {grouped(activeCaption.value)} signups ·{" "}
                {pct(activeCaption.value).toFixed(1)}% of total
              </>
            ) : (
              <>
                Top 3 sources drive {pct(top3).toFixed(0)}% of all signups this{" "}
                {range}
              </>
            )}
          </p>
        </div>

        {SOURCES.map((source, i) => {
          const highlighted = activeSeg === source.seg;
          const cursor = scrub[source.id] ?? null;
          const count = model.counts[i];
          const shown =
            cursor === null ? grouped(count) : grouped(sparks[i][cursor]);
          return (
            <div
              key={source.id}
              onPointerEnter={() => setActiveSeg(source.seg)}
              onPointerLeave={() => setActiveSeg(null)}
              className={cx(
                panel,
                "flex items-center gap-3 px-3 py-2.5",
                highlighted && "bg-neutral-50 dark:bg-neutral-800/60",
                transition,
              )}
            >
              <span className="w-4 shrink-0 text-right text-[13px] tabular-nums text-neutral-400">
                {i + 1}
              </span>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-[11px] font-medium tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {source.initials}
              </span>

              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="w-24 shrink-0 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {source.name}
                </span>
                <div className="hidden min-w-0 flex-1 sm:block">
                  <RowSpark
                    data={sparks[i]}
                    active={cursor}
                    onActive={(idx) =>
                      setScrub((prev) => ({ ...prev, [source.id]: idx }))
                    }
                  />
                </div>
              </div>

              <span className="w-16 shrink-0 text-right text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                {shown}
              </span>
              <span className="w-14 shrink-0 text-right text-xs tabular-nums">
                <Delta value={model.deltas[i]} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

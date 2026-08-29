"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

type MetricKey = "views" | "signups" | "revenue";

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "views", label: "Views" },
  { key: "signups", label: "Signups" },
  { key: "revenue", label: "Revenue" },
];

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const UP = [30, 33, 32, 38, 42, 47, 52];
const DOWN = [52, 50, 51, 47, 44, 40, 37];
const FLAT = [40, 42, 41, 43, 42, 44, 43];

type Cell = { v: string; d: string; s: number[] };
type Channel = { name: string; views: Cell; signups: Cell; revenue: Cell };

const up = (v: string, d: string): Cell => ({ v, d, s: UP });
const down = (v: string, d: string): Cell => ({ v, d, s: DOWN });
const flat = (v: string, d: string): Cell => ({ v, d, s: FLAT });

const CHANNELS: Channel[] = [
  {
    name: "Organic search",
    views: up("182,400", "+9.2%"),
    signups: up("5,140", "+7.4%"),
    revenue: up("$128,900", "+11.1%"),
  },
  {
    name: "Paid search",
    views: up("96,200", "+3.1%"),
    signups: up("3,082", "+2.4%"),
    revenue: up("$77,400", "+5.0%"),
  },
  {
    name: "Direct",
    views: down("71,300", "−1.8%"),
    signups: down("2,190", "−2.2%"),
    revenue: down("$58,600", "−0.9%"),
  },
  {
    name: "Email",
    views: up("33,900", "+6.7%"),
    signups: up("1,000", "+8.1%"),
    revenue: up("$41,200", "+9.4%"),
  },
  {
    name: "Referral",
    views: up("22,800", "+4.3%"),
    signups: up("690", "+3.0%"),
    revenue: up("$18,400", "+2.6%"),
  },
  {
    name: "Social organic",
    views: down("18,400", "−5.1%"),
    signups: down("420", "−6.8%"),
    revenue: down("$9,800", "−4.2%"),
  },
  {
    name: "Social paid",
    views: up("14,600", "+12.9%"),
    signups: up("315", "+10.4%"),
    revenue: up("$12,600", "+14.2%"),
  },
  {
    name: "Affiliates",
    views: flat("9,200", "+0.4%"),
    signups: flat("240", "−0.2%"),
    revenue: flat("$14,900", "+0.6%"),
  },
  {
    name: "Marketplace",
    views: up("6,400", "+18.3%"),
    signups: up("180", "+16.0%"),
    revenue: up("$22,300", "+21.5%"),
  },
  {
    name: "Podcast ads",
    views: up("12,800", "+7.7%"),
    signups: up("300", "+5.9%"),
    revenue: up("$19,400", "+8.8%"),
  },
  {
    name: "Webinars",
    views: up("8,600", "+2.0%"),
    signups: up("260", "+3.6%"),
    revenue: up("$16,800", "+4.9%"),
  },
  {
    name: "Partnerships",
    views: flat("5,900", "+0.9%"),
    signups: flat("150", "+0.0%"),
    revenue: flat("$11,200", "+1.3%"),
  },
  {
    name: "Community",
    views: down("4,100", "−3.4%"),
    signups: down("120", "−4.1%"),
    revenue: down("$3,600", "−2.8%"),
  },
  {
    name: "Press mentions",
    views: down("3,200", "−8.9%"),
    signups: down("95", "−7.2%"),
    revenue: down("$2,100", "−6.0%"),
  },
  {
    name: "Newsletter sponsorships",
    views: up("7,300", "+6.2%"),
    signups: up("205", "+4.8%"),
    revenue: up("$13,700", "+7.9%"),
  },
  {
    name: "Conferences",
    views: down("2,600", "−2.5%"),
    signups: down("88", "−3.3%"),
    revenue: down("$8,400", "−1.7%"),
  },
];

function sparkPoints(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 92 - ((v - min) / span) * 84;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function MetricTabs({
  value,
  onChange,
  baseId,
  panelId,
}: {
  value: MetricKey;
  onChange: (next: MetricKey) => void;
  baseId: string;
  panelId: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (next: number) => {
    const index = (next + METRICS.length) % METRICS.length;
    onChange(METRICS[index].key);
    refs.current[index]?.focus({ preventScroll: true });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = METRICS.findIndex((m) => m.key === value);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(current + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      move(0);
    } else if (event.key === "End") {
      event.preventDefault();
      move(METRICS.length - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Metric"
      onKeyDown={onKeyDown}
      className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 p-0.5 dark:bg-neutral-800"
    >
      {METRICS.map((m, i) => {
        const selected = m.key === value;
        return (
          <button
            key={m.key}
            ref={(node) => {
              refs.current[i] = node;
            }}
            type="button"
            role="tab"
            id={`${baseId}-${i}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(m.key)}
            className={cx(
              "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] font-medium transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
              selected
                ? "bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
            )}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
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

export default function Dashboard6() {
  const body = useScrollFade<HTMLDivElement>();
  const [metric, setMetric] = useState<MetricKey>("signups");
  const [compare, setCompare] = useState(true);
  const label = METRICS.find((m) => m.key === metric)!.label;
  const baseId = useId();
  const panelId = `${baseId}-panel`;

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 sm:px-6 dark:border-neutral-800">
        <h1 className="truncate text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
          Channels
        </h1>
        <MetricTabs
          value={metric}
          onChange={setMetric}
          baseId={baseId}
          panelId={panelId}
        />
      </header>

      <div className="flex h-12 shrink-0 items-center justify-between gap-2 px-4 sm:px-6">
        <span className="truncate text-[13px] tabular-nums text-neutral-500">
          {CHANNELS.length} channels · Mar 1 – Mar 31
        </span>
        <div className="inline-flex items-center gap-2">
          <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
            Compare to previous
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={compare}
            aria-label="Compare to previous"
            onClick={() => setCompare((c) => !c)}
            className={cx(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-out",
              "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
              "disabled:pointer-events-none disabled:opacity-50",
              compare
                ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                : "bg-neutral-200 dark:bg-neutral-700",
            )}
          >
            <span
              className={cx(
                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-neutral-900",
                compare ? "translate-x-[18px]" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={body.ref}
          onScroll={body.onScroll}
          role="tabpanel"
          id={panelId}
          aria-labelledby={`${baseId}-${METRICS.findIndex((m) => m.key === metric)}`}
          tabIndex={0}
          className="h-full overflow-y-auto outline-none"
        >
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{label} by channel</caption>
            <thead className="sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-900/60">
              <tr>
                <th
                  scope="col"
                  className="h-9 w-full px-3 text-xs font-medium text-neutral-500 first:pl-4 sm:first:pl-6"
                >
                  Channel
                </th>
                <th
                  scope="col"
                  className="h-9 w-28 px-3 text-right text-xs font-medium text-neutral-500"
                >
                  {label}
                </th>
                {compare && (
                  <th
                    scope="col"
                    className="h-9 w-24 px-3 text-right text-xs font-medium text-neutral-500"
                  >
                    Change
                  </th>
                )}
                <th
                  scope="col"
                  className="hidden h-9 w-28 px-3 text-right text-xs font-medium text-neutral-500 last:pr-4 sm:table-cell sm:last:pr-6"
                >
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
              {CHANNELS.map((c) => {
                const cell = c[metric];
                return (
                  <tr
                    key={c.name}
                    className="h-11 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="truncate px-3 text-[13px] text-neutral-900 first:pl-4 sm:first:pl-6 dark:text-neutral-100">
                      {c.name}
                    </td>
                    <td className="px-3 text-right text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                      {cell.v}
                    </td>
                    {compare && (
                      <td className="px-3 text-right text-[13px] tabular-nums text-neutral-600 dark:text-neutral-400">
                        {cell.d}
                      </td>
                    )}
                    <td className="hidden px-3 text-right last:pr-4 sm:table-cell sm:last:pr-6">
                      <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        aria-hidden
                        className="ml-auto h-5 w-16"
                      >
                        <polyline
                          points={sparkPoints(cell.s)}
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                          className="stroke-neutral-400 dark:stroke-neutral-500"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            body.edges.end ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
}

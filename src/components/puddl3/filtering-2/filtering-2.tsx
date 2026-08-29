"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Bike, Check, SlidersHorizontal, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const checkboxBox =
  "relative inline-flex h-4 w-4 shrink-0 items-center justify-center";

const checkboxClass =
  "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border border-neutral-300 bg-white transition-colors duration-150 checked:border-neutral-900 checked:bg-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:checked:bg-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxMark =
  "pointer-events-none absolute h-3 w-3 text-[var(--rb-accent-fg,oklch(100%_0_0))] opacity-0 transition-opacity duration-150 peer-checked:opacity-100 motion-reduce:transition-none dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]";

function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
  labels,
}: {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  format: (n: number) => string;
  labels: [string, string];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<0 | 1 | null>(null);

  const snap = (n: number) =>
    Math.min(max, Math.max(min, Math.round(n / step) * step));

  const pct = (n: number) => ((n - min) / (max - min)) * 100;

  const fromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return min;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return min;
    return snap(min + ((clientX - r.left) / r.width) * (max - min));
  };

  const move = (index: 0 | 1, next: number) => {
    const [lo, hi] = value;
    if (index === 0) onChange([Math.min(next, hi), hi]);
    else onChange([lo, Math.max(next, lo)]);
  };

  const thumbProps = (index: 0 | 1) => ({
    role: "slider" as const,
    tabIndex: 0,
    "aria-label": labels[index],
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuenow": value[index],
    "aria-valuetext": format(value[index]),
    style: { left: `${pct(value[index])}%`, touchAction: "none" as const },
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDrag(index);
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (drag !== index) return;
      move(index, fromClientX(e.clientX));
    },
    onLostPointerCapture: () => setDrag(null),
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDrag(null);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      const page = Math.max(step, Math.round((max - min) / 10));
      const current = value[index];
      let next: number | null = null;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - step;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp")
        next = current + step;
      else if (e.key === "PageDown") next = current - page;
      else if (e.key === "PageUp") next = current + page;
      else if (e.key === "Home") next = min;
      else if (e.key === "End") next = max;
      if (next === null) return;
      e.preventDefault();
      move(index, snap(next));
    },
    className: cx(
      "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-neutral-900 bg-white",
      "transition-[box-shadow] duration-150 ease-out motion-reduce:transition-none",
      focus,
      drag === index && "cursor-grabbing",
      "dark:border-white dark:bg-neutral-950",
    ),
  });

  return (
    <div
      ref={trackRef}
      onPointerDown={(e) => {
        const next = fromClientX(e.clientX);
        move(
          Math.abs(next - value[0]) <= Math.abs(next - value[1]) ? 0 : 1,
          next,
        );
      }}
      className="relative h-4 w-full cursor-pointer touch-none select-none"
    >
      <span className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      <span
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
        style={{
          left: `${pct(value[0])}%`,
          width: `${pct(value[1]) - pct(value[0])}%`,
        }}
      />
      <div {...thumbProps(0)} />
      <div {...thumbProps(1)} />
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

type Bicycle = {
  id: string;
  name: string;
  discipline: string;
  size: string;
  price: number;
  condition: string;
  groupset: string;
};

const DISCIPLINES = [
  { value: "all", label: "All" },
  { value: "road", label: "Road" },
  { value: "gravel", label: "Gravel" },
  { value: "mountain", label: "Mountain" },
  { value: "city", label: "City" },
];

const SIZES = [
  { value: "xs", label: "48 cm" },
  { value: "s", label: "51 cm" },
  { value: "m", label: "54 cm" },
  { value: "l", label: "56 cm" },
  { value: "xl", label: "58 cm" },
];

const CONDITIONS = [
  { value: "likenew", label: "Like new" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const GROUPSETS = [
  { value: "105", label: "Shimano 105" },
  { value: "grx", label: "Shimano GRX" },
  { value: "deore", label: "Shimano Deore" },
  { value: "rival", label: "SRAM Rival" },
  { value: "gx", label: "SRAM GX" },
];

const BIKES: Bicycle[] = [
  {
    id: "b1",
    name: "Canyon Endurace 7",
    discipline: "road",
    size: "m",
    price: 1450,
    condition: "excellent",
    groupset: "105",
  },
  {
    id: "b2",
    name: "Specialized Allez",
    discipline: "road",
    size: "s",
    price: 780,
    condition: "good",
    groupset: "105",
  },
  {
    id: "b3",
    name: "Trek Émonda SL",
    discipline: "road",
    size: "l",
    price: 2100,
    condition: "likenew",
    groupset: "105",
  },
  {
    id: "b4",
    name: "Giant TCR Advanced",
    discipline: "road",
    size: "m",
    price: 1650,
    condition: "excellent",
    groupset: "rival",
  },
  {
    id: "b5",
    name: "Cannondale CAAD13",
    discipline: "road",
    size: "s",
    price: 1200,
    condition: "good",
    groupset: "rival",
  },
  {
    id: "b6",
    name: "Bianchi Via Nirone",
    discipline: "road",
    size: "xl",
    price: 690,
    condition: "fair",
    groupset: "105",
  },
  {
    id: "b7",
    name: "Cervélo Áspero",
    discipline: "gravel",
    size: "l",
    price: 2600,
    condition: "likenew",
    groupset: "grx",
  },
  {
    id: "b8",
    name: "Salsa Warbird",
    discipline: "gravel",
    size: "m",
    price: 1900,
    condition: "excellent",
    groupset: "grx",
  },
  {
    id: "b9",
    name: "Cannondale Topstone",
    discipline: "gravel",
    size: "s",
    price: 1350,
    condition: "good",
    groupset: "rival",
  },
  {
    id: "b10",
    name: "Kona Rove AL",
    discipline: "gravel",
    size: "l",
    price: 850,
    condition: "fair",
    groupset: "grx",
  },
  {
    id: "b11",
    name: "Santa Cruz Tallboy",
    discipline: "mountain",
    size: "l",
    price: 3200,
    condition: "excellent",
    groupset: "gx",
  },
  {
    id: "b12",
    name: "Trek Fuel EX 8",
    discipline: "mountain",
    size: "m",
    price: 2400,
    condition: "good",
    groupset: "deore",
  },
  {
    id: "b13",
    name: "Specialized Rockhopper",
    discipline: "mountain",
    size: "s",
    price: 620,
    condition: "good",
    groupset: "deore",
  },
  {
    id: "b14",
    name: "Giant Trance X",
    discipline: "mountain",
    size: "xl",
    price: 2850,
    condition: "likenew",
    groupset: "gx",
  },
  {
    id: "b15",
    name: "Kona Process 134",
    discipline: "mountain",
    size: "m",
    price: 1750,
    condition: "fair",
    groupset: "deore",
  },
  {
    id: "b16",
    name: "Brompton C Line",
    discipline: "city",
    size: "m",
    price: 1100,
    condition: "excellent",
    groupset: "deore",
  },
  {
    id: "b17",
    name: "Trek FX 3 Disc",
    discipline: "city",
    size: "s",
    price: 480,
    condition: "good",
    groupset: "deore",
  },
  {
    id: "b18",
    name: "Priority Continuum",
    discipline: "city",
    size: "l",
    price: 720,
    condition: "likenew",
    groupset: "deore",
  },
];

const PRICE_MIN = 400;
const PRICE_MAX = 3500;

const grouped = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const money = (n: number) => `$${grouped(n)}`;

type Facets = {
  size: string[];
  condition: string[];
  groupset: string[];
  price: [number, number];
};

const EMPTY: Facets = {
  size: [],
  condition: [],
  groupset: [],
  price: [PRICE_MIN, PRICE_MAX],
};

const matches = (
  b: Bicycle,
  discipline: string,
  f: Facets,
  exclude?: keyof Facets,
) => {
  if (discipline !== "all" && b.discipline !== discipline) return false;
  if (exclude !== "size" && f.size.length && !f.size.includes(b.size))
    return false;
  if (
    exclude !== "condition" &&
    f.condition.length &&
    !f.condition.includes(b.condition)
  )
    return false;
  if (
    exclude !== "groupset" &&
    f.groupset.length &&
    !f.groupset.includes(b.groupset)
  )
    return false;
  if (exclude !== "price" && (b.price < f.price[0] || b.price > f.price[1]))
    return false;
  return true;
};

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="py-5">
      <h3 className="mb-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
        {label}
      </h3>
      {children}
    </section>
  );
}

export default function Filtering2() {
  const [open, setOpen] = useState(true);
  const [discipline, setDiscipline] = useState("all");
  const [facets, setFacets] = useState<Facets>(EMPTY);
  const {
    ref: bodyRef,
    edges: bodyEdges,
    onScroll: onBodyScroll,
  } = useScrollFade<HTMLDivElement>();

  const toggle = (key: "size" | "condition" | "groupset", value: string) =>
    setFacets((f) => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter((v) => v !== value)
        : [...f[key], value],
    }));

  const results = useMemo(
    () => BIKES.filter((b) => matches(b, discipline, facets)),
    [discipline, facets],
  );

  const countFor = (key: "size" | "condition" | "groupset", value: string) =>
    BIKES.filter((b) => matches(b, discipline, facets, key) && b[key] === value)
      .length;

  const priceNarrowed =
    facets.price[0] !== PRICE_MIN || facets.price[1] !== PRICE_MAX;

  const activeCount =
    facets.size.length +
    facets.condition.length +
    facets.groupset.length +
    (discipline !== "all" ? 1 : 0) +
    (priceNarrowed ? 1 : 0);

  const clearAll = () => {
    setDiscipline("all");
    setFacets(EMPTY);
  };

  if (!open) {
    return (
      <div className="relative flex h-full min-h-[760px] w-full flex-col items-center justify-center overflow-hidden bg-white p-8 sm:p-10 dark:bg-neutral-950">
        <div className="flex w-full max-w-[420px] flex-col items-center rounded-[var(--rb-r-4xl,18px)] border border-neutral-200 bg-white px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            <Bike
              aria-hidden="true"
              className="h-5 w-5 text-neutral-500 dark:text-neutral-400"
            />
          </div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Filters hidden
          </p>
          <p className="mt-1 max-w-xs text-xs text-neutral-600 dark:text-neutral-400">
            <span className="tabular-nums">{results.length}</span> of{" "}
            <span className="tabular-nums">{BIKES.length}</span> bikes match
            your current filters.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cx(
              "mt-5 inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3.5 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] active:scale-[0.97] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
              transition,
              focus,
            )}
          >
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            Show filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[760px] w-full flex-col items-center overflow-hidden bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className="flex w-full max-w-[420px] flex-1 flex-col overflow-hidden rounded-[var(--rb-r-4xl,18px)] border border-neutral-200 bg-white shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-950">
        <header className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base tracking-[-0.01em] text-neutral-900 dark:text-white">
              Filters
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Second-hand bikes
              {activeCount > 0 && (
                <>
                  {" · "}
                  <span className="tabular-nums">{activeCount}</span> active
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={clearAll}
              disabled={activeCount === 0}
              className={cx(
                "h-8 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] text-neutral-500 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40 dark:hover:text-white",
                transition,
                focus,
              )}
            >
              Clear all
            </button>
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setOpen(false)}
              className={cx(
                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                transition,
                focus,
              )}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 border-t border-neutral-200/80 dark:border-neutral-800/80">
          <div
            ref={bodyRef}
            onScroll={onBodyScroll}
            className="h-full overflow-y-auto px-5"
          >
            <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
              <Group label="Discipline">
                <div
                  role="group"
                  aria-label="Discipline"
                  className="flex flex-wrap gap-1 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800/60"
                >
                  {DISCIPLINES.map((d) => {
                    const on = discipline === d.value;
                    return (
                      <button
                        key={d.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setDiscipline(d.value)}
                        className={cx(
                          "h-8 flex-1 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-2 text-[13px] whitespace-nowrap active:scale-[0.97]",
                          transition,
                          focus,
                          on
                            ? "bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white"
                            : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white",
                        )}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </Group>

              <Group label="Frame size">
                <ul className="space-y-0.5">
                  {SIZES.map((s) => {
                    const n = countFor("size", s.value);
                    const on = facets.size.includes(s.value);
                    return (
                      <li key={s.value}>
                        <label
                          className={cx(
                            "flex h-9 cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] px-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900",
                            transition,
                            n === 0 && !on && "opacity-40",
                          )}
                        >
                          <span className={checkboxBox}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle("size", s.value)}
                              className={checkboxClass}
                            />
                            <Check
                              aria-hidden="true"
                              strokeWidth={3}
                              className={checkboxMark}
                            />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {s.label}
                          </span>
                          <span className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                            {n}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </Group>

              <Group label="Price">
                <div className="mb-4 flex items-baseline justify-between">
                  <span className="text-sm text-neutral-900 tabular-nums dark:text-neutral-100">
                    {money(facets.price[0])} – {money(facets.price[1])}
                  </span>
                  {priceNarrowed && (
                    <button
                      type="button"
                      onClick={() =>
                        setFacets((f) => ({
                          ...f,
                          price: [PRICE_MIN, PRICE_MAX],
                        }))
                      }
                      className={cx(
                        "cursor-pointer rounded-[var(--rb-r-sm,6px)] px-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                        focus,
                      )}
                    >
                      Reset
                    </button>
                  )}
                </div>
                <RangeSlider
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={50}
                  value={facets.price}
                  onChange={(price) => setFacets((f) => ({ ...f, price }))}
                  format={money}
                  labels={["Minimum price", "Maximum price"]}
                />
              </Group>

              <Group label="Condition">
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => {
                    const on = facets.condition.includes(c.value);
                    const n = countFor("condition", c.value);
                    return (
                      <button
                        key={c.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle("condition", c.value)}
                        className={cx(
                          "h-8 cursor-pointer rounded-[var(--rb-r-md,8px)] border px-3 text-[13px] active:scale-[0.97]",
                          transition,
                          focus,
                          on
                            ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                            : "border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700",
                          n === 0 && !on && "opacity-40",
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </Group>

              <Group label="Groupset">
                <ul className="space-y-0.5">
                  {GROUPSETS.map((g) => {
                    const n = countFor("groupset", g.value);
                    const on = facets.groupset.includes(g.value);
                    return (
                      <li key={g.value}>
                        <label
                          className={cx(
                            "flex h-9 cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] px-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900",
                            transition,
                            n === 0 && !on && "opacity-40",
                          )}
                        >
                          <span className={checkboxBox}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle("groupset", g.value)}
                              className={checkboxClass}
                            />
                            <Check
                              aria-hidden="true"
                              strokeWidth={3}
                              className={checkboxMark}
                            />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {g.label}
                          </span>
                          <span className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                            {n}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </Group>
            </div>
          </div>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              bodyEdges.start ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              bodyEdges.end ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <div className="flex items-center gap-3 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <button
            type="button"
            onClick={clearAll}
            disabled={activeCount === 0}
            className={cx(
              "h-9 cursor-pointer rounded-[var(--rb-r-md,8px)] px-2 text-sm text-neutral-500 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40 dark:hover:text-white",
              transition,
              focus,
            )}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={results.length === 0}
            className={cx(
              "inline-flex h-9 flex-1 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
              transition,
              focus,
            )}
          >
            {results.length === 0 ? (
              "No bikes match"
            ) : (
              <>
                Show <span className="mx-1 tabular-nums">{results.length}</span>{" "}
                {results.length === 1 ? "result" : "results"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

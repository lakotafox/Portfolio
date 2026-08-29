"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Plane, SlidersHorizontal, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const field =
  "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white";

const checkboxBox =
  "relative inline-flex h-4 w-4 shrink-0 items-center justify-center";

const checkboxClass =
  "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border border-neutral-300 bg-white transition-colors duration-150 checked:border-neutral-900 checked:bg-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:checked:bg-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxMark =
  "pointer-events-none absolute h-3 w-3 text-[var(--rb-accent-fg,oklch(100%_0_0))] opacity-0 transition-opacity duration-150 peer-checked:opacity-100 motion-reduce:transition-none dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]";

const radioClass =
  "h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border border-neutral-300 bg-white transition-colors duration-150 checked:border-[5px] checked:border-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

type SelectOption = { value: string; label: string; hint?: string };

function Select({
  id,
  value,
  onChange,
  options,
  disabled,
  placeholder = "Select…",
  className,
  triggerClassName,
  leading,
  ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  leading?: ReactNode;
  ariaLabel?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [flip, setFlip] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ buffer: "", at: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const openList = (index?: number) => {
    if (disabled) return;
    const node = rootRef.current;
    const win = node?.ownerDocument.defaultView;
    if (node && win) {
      const r = node.getBoundingClientRect();
      const room = win.innerHeight - r.bottom;
      const needed = Math.min(options.length * 32 + 8, 264);
      setFlip(room < needed + 8 && r.top > room);
    }
    setActive(index ?? (selectedIndex >= 0 ? selectedIndex : 0));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const node = rootRef.current;
    const doc = node?.ownerDocument;
    if (!doc) return;
    const onPointer = (e: Event) => {
      if (!node.contains(e.target as Node)) setOpen(false);
    };
    doc.addEventListener("mousedown", onPointer);
    doc.addEventListener("touchstart", onPointer);
    return () => {
      doc.removeEventListener("mousedown", onPointer);
      doc.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = bottom - list.clientHeight;
  }, [open, active]);

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    rootRef.current?.querySelector("button")?.focus({ preventScroll: true });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(active);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = Date.now();
      const t = typeahead.current;
      t.buffer = now - t.at > 700 ? e.key : t.buffer + e.key;
      t.at = now;
      const hit = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(t.buffer.toLowerCase()),
      );
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <div ref={rootRef} className={cx("relative", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        className={cx(
          field,
          "flex cursor-pointer items-center justify-between gap-2 pr-2.5 text-left",
          focus,
          "focus-visible:outline-offset-[-2px]",
          open && "border-neutral-900 dark:border-white",
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {leading}
          <span
            className={cx(
              "truncate",
              !selected && "text-neutral-400 dark:text-neutral-500",
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cx(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-150 ease-out motion-reduce:transition-none dark:text-neutral-600",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className={cx(
            "absolute z-30 max-h-[264px] w-full overflow-y-auto rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-900",
            flip ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                data-index={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(i)}
                className={cx(
                  "flex h-8 cursor-pointer items-center justify-between gap-2 rounded-[var(--rb-r-sm,6px)] px-2.5 text-sm text-neutral-900 dark:text-neutral-100",
                  i === active && "bg-neutral-100 dark:bg-neutral-800",
                )}
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate">{o.label}</span>
                  {o.hint && (
                    <span className="shrink-0 text-xs text-neutral-500">
                      {o.hint}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <Check
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-neutral-900 dark:text-white"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

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

type Flight = {
  id: string;
  airline: string;
  depart: number;
  duration: number;
  stops: number;
  price: number;
  carryOn: boolean;
};

const AIRLINES = [
  { value: "NW", label: "Northwind" },
  { value: "SV", label: "Silverline" },
  { value: "AP", label: "Apex Air" },
  { value: "CN", label: "Cascade" },
  { value: "MR", label: "Meridian" },
];

const STOP_OPTIONS = [
  { value: "any", label: "Any number of stops" },
  { value: "0", label: "Nonstop only" },
  { value: "1", label: "1 stop or fewer" },
  { value: "2", label: "2 stops or fewer" },
];

const FLIGHTS: Flight[] = [
  {
    id: "f1",
    airline: "NW",
    depart: 360,
    duration: 330,
    stops: 0,
    price: 289,
    carryOn: true,
  },
  {
    id: "f2",
    airline: "SV",
    depart: 465,
    duration: 335,
    stops: 0,
    price: 312,
    carryOn: true,
  },
  {
    id: "f3",
    airline: "AP",
    depart: 420,
    duration: 470,
    stops: 1,
    price: 214,
    carryOn: false,
  },
  {
    id: "f4",
    airline: "CN",
    depart: 540,
    duration: 505,
    stops: 1,
    price: 198,
    carryOn: true,
  },
  {
    id: "f5",
    airline: "MR",
    depart: 600,
    duration: 340,
    stops: 0,
    price: 358,
    carryOn: true,
  },
  {
    id: "f6",
    airline: "NW",
    depart: 690,
    duration: 455,
    stops: 1,
    price: 231,
    carryOn: false,
  },
  {
    id: "f7",
    airline: "SV",
    depart: 300,
    duration: 620,
    stops: 2,
    price: 176,
    carryOn: false,
  },
  {
    id: "f8",
    airline: "AP",
    depart: 780,
    duration: 345,
    stops: 0,
    price: 334,
    carryOn: true,
  },
  {
    id: "f9",
    airline: "CN",
    depart: 855,
    duration: 590,
    stops: 2,
    price: 189,
    carryOn: false,
  },
  {
    id: "f10",
    airline: "MR",
    depart: 930,
    duration: 480,
    stops: 1,
    price: 256,
    carryOn: true,
  },
  {
    id: "f11",
    airline: "NW",
    depart: 1020,
    duration: 335,
    stops: 0,
    price: 372,
    carryOn: true,
  },
  {
    id: "f12",
    airline: "SV",
    depart: 1080,
    duration: 500,
    stops: 1,
    price: 243,
    carryOn: false,
  },
  {
    id: "f13",
    airline: "AP",
    depart: 1170,
    duration: 350,
    stops: 0,
    price: 298,
    carryOn: true,
  },
  {
    id: "f14",
    airline: "CN",
    depart: 1260,
    duration: 610,
    stops: 2,
    price: 167,
    carryOn: false,
  },
  {
    id: "f15",
    airline: "MR",
    depart: 1320,
    duration: 355,
    stops: 0,
    price: 405,
    carryOn: true,
  },
];

const DEP_MIN = 0;
const DEP_MAX = 1440;
const DUR_MIN = 300;
const DUR_MAX = 660;

const SORTS = [
  { value: "cheapest", label: "Cheapest" },
  { value: "fastest", label: "Fastest" },
  { value: "earliest", label: "Earliest departure" },
];

const pad = (n: number) => n.toString().padStart(2, "0");

const clock = (min: number) => {
  const wrapped = ((min % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
};

const clockBound = (min: number) => (min === 1440 ? "24:00" : clock(min));

const durationText = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const stopsText = (stops: number) =>
  stops === 0 ? "Nonstop" : stops === 1 ? "1 stop" : `${stops} stops`;

const matchesStop = (flight: Flight, value: string) => {
  if (value === "any") return true;
  const cap = Number(value);
  return cap === 0 ? flight.stops === 0 : flight.stops <= cap;
};

const money = (n: number) => `$${n}`;

type Facets = {
  stops: string;
  depart: [number, number];
  duration: [number, number];
  airlines: string[];
  carryOn: boolean;
};

const EMPTY: Facets = {
  stops: "any",
  depart: [DEP_MIN, DEP_MAX],
  duration: [DUR_MIN, DUR_MAX],
  airlines: [],
  carryOn: false,
};

const matches = (flight: Flight, f: Facets, exclude?: keyof Facets) => {
  if (exclude !== "stops" && f.stops !== "any") {
    const cap = Number(f.stops);
    if (cap === 0 ? flight.stops !== 0 : flight.stops > cap) return false;
  }
  if (
    exclude !== "depart" &&
    (flight.depart < f.depart[0] || flight.depart > f.depart[1])
  )
    return false;
  if (
    exclude !== "duration" &&
    (flight.duration < f.duration[0] || flight.duration > f.duration[1])
  )
    return false;
  if (
    exclude !== "airlines" &&
    f.airlines.length &&
    !f.airlines.includes(flight.airline)
  )
    return false;
  if (exclude !== "carryOn" && f.carryOn && !flight.carryOn) return false;
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

export default function Filtering8() {
  const [facets, setFacets] = useState<Facets>(EMPTY);
  const [sort, setSort] = useState("cheapest");
  const [selected, setSelected] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);

  const results = useMemo(() => {
    const list = FLIGHTS.filter((fl) => matches(fl, facets));
    if (sort === "fastest")
      return [...list].sort((a, b) => a.duration - b.duration);
    if (sort === "earliest")
      return [...list].sort((a, b) => a.depart - b.depart);
    return [...list].sort((a, b) => a.price - b.price);
  }, [facets, sort]);

  const stopCount = (value: string) =>
    FLIGHTS.filter(
      (fl) => matches(fl, facets, "stops") && matchesStop(fl, value),
    ).length;

  const airlineCount = (code: string) =>
    FLIGHTS.filter(
      (fl) => matches(fl, facets, "airlines") && fl.airline === code,
    ).length;

  const airlineFrom = (code: string) => {
    const prices = FLIGHTS.filter(
      (fl) => matches(fl, facets, "airlines") && fl.airline === code,
    ).map((fl) => fl.price);
    return prices.length ? Math.min(...prices) : null;
  };

  const carryOnCount = FLIGHTS.filter(
    (fl) => matches(fl, facets, "carryOn") && fl.carryOn,
  ).length;

  const toggleAirline = (code: string) =>
    setFacets((f) => ({
      ...f,
      airlines: f.airlines.includes(code)
        ? f.airlines.filter((v) => v !== code)
        : [...f.airlines, code],
    }));

  const depNarrowed =
    facets.depart[0] !== DEP_MIN || facets.depart[1] !== DEP_MAX;
  const durNarrowed =
    facets.duration[0] !== DUR_MIN || facets.duration[1] !== DUR_MAX;

  const chips = [
    ...(facets.stops !== "any"
      ? [
          {
            key: "stops",
            label:
              STOP_OPTIONS.find((s) => s.value === facets.stops)?.label ??
              facets.stops,
            clear: () => setFacets((f) => ({ ...f, stops: "any" })),
          },
        ]
      : []),
    ...(depNarrowed
      ? [
          {
            key: "depart",
            label: `Depart ${clockBound(facets.depart[0])} – ${clockBound(
              facets.depart[1],
            )}`,
            clear: () =>
              setFacets((f) => ({ ...f, depart: [DEP_MIN, DEP_MAX] })),
          },
        ]
      : []),
    ...(durNarrowed
      ? [
          {
            key: "duration",
            label: `Under ${durationText(facets.duration[1])}`,
            clear: () =>
              setFacets((f) => ({ ...f, duration: [DUR_MIN, DUR_MAX] })),
          },
        ]
      : []),
    ...facets.airlines.map((v) => ({
      key: `airline:${v}`,
      label: AIRLINES.find((a) => a.value === v)?.label ?? v,
      clear: () => toggleAirline(v),
    })),
    ...(facets.carryOn
      ? [
          {
            key: "carryOn",
            label: "Carry-on included",
            clear: () => setFacets((f) => ({ ...f, carryOn: false })),
          },
        ]
      : []),
  ];

  const rail = (
    <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
      <Group label="Stops">
        <div
          role="radiogroup"
          aria-label="Number of stops"
          className="space-y-0.5"
        >
          {STOP_OPTIONS.map((s) => {
            const n = stopCount(s.value);
            const on = facets.stops === s.value;
            return (
              <label
                key={s.value}
                className={cx(
                  "flex h-8 cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] px-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900",
                  transition,
                  n === 0 && !on && "opacity-40",
                )}
              >
                <input
                  type="radio"
                  name="stops"
                  checked={on}
                  onChange={() => setFacets((f) => ({ ...f, stops: s.value }))}
                  className={radioClass}
                />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                <span className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                  {n}
                </span>
              </label>
            );
          })}
        </div>
      </Group>

      <Group label="Departure time">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-sm text-neutral-900 tabular-nums dark:text-neutral-100">
            {clockBound(facets.depart[0])} – {clockBound(facets.depart[1])}
          </span>
          {depNarrowed && (
            <button
              type="button"
              onClick={() =>
                setFacets((f) => ({ ...f, depart: [DEP_MIN, DEP_MAX] }))
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
          min={DEP_MIN}
          max={DEP_MAX}
          step={15}
          value={facets.depart}
          onChange={(depart) => setFacets((f) => ({ ...f, depart }))}
          format={clockBound}
          labels={["Earliest departure", "Latest departure"]}
        />
      </Group>

      <Group label="Duration">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-sm text-neutral-900 tabular-nums dark:text-neutral-100">
            {durationText(facets.duration[0])} –{" "}
            {durationText(facets.duration[1])}
          </span>
          {durNarrowed && (
            <button
              type="button"
              onClick={() =>
                setFacets((f) => ({ ...f, duration: [DUR_MIN, DUR_MAX] }))
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
          min={DUR_MIN}
          max={DUR_MAX}
          step={5}
          value={facets.duration}
          onChange={(duration) => setFacets((f) => ({ ...f, duration }))}
          format={durationText}
          labels={["Shortest duration", "Longest duration"]}
        />
      </Group>

      <Group label="Airlines">
        <ul className="space-y-0.5">
          {AIRLINES.map((a) => {
            const n = airlineCount(a.value);
            const from = airlineFrom(a.value);
            const on = facets.airlines.includes(a.value);
            return (
              <li key={a.value}>
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
                      onChange={() => toggleAirline(a.value)}
                      className={checkboxClass}
                    />
                    <Check
                      aria-hidden="true"
                      strokeWidth={3}
                      className={checkboxMark}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{a.label}</span>
                  <span className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                    {from !== null ? `from ${money(from)}` : "-"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group label="Baggage">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-sm text-neutral-900 dark:text-neutral-100">
              Carry-on included
            </span>
            <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
              <span className="tabular-nums">{carryOnCount}</span> fares with a
              free cabin bag
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={facets.carryOn}
            aria-label="Carry-on included"
            onClick={() => setFacets((f) => ({ ...f, carryOn: !f.carryOn }))}
            className={cx(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-out",
              focus,
              "disabled:pointer-events-none disabled:opacity-50",
              facets.carryOn
                ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                : "bg-neutral-200 dark:bg-neutral-700",
            )}
          >
            <span
              className={cx(
                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-neutral-900",
                facets.carryOn ? "translate-x-[18px]" : "translate-x-0.5",
              )}
            />
          </button>
        </label>
      </Group>
    </div>
  );

  return (
    <div className="flex h-full min-h-[960px] w-full flex-col overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl tracking-[-0.015em] text-neutral-900 dark:text-white">
              San Francisco to New York
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="tabular-nums">{results.length}</span> of{" "}
              <span className="tabular-nums">{FLIGHTS.length}</span> flights ·
              Thu, Jun 12 · SFO → JFK
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-expanded={railOpen}
              onClick={() => setRailOpen((v) => !v)}
              className={cx(
                "inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-3 text-sm text-neutral-900 hover:bg-neutral-50 md:hidden dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-900",
                transition,
                focus,
              )}
            >
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              Filters
              {chips.length > 0 && (
                <span className="tabular-nums">({chips.length})</span>
              )}
            </button>
            <Select
              value={sort}
              onChange={setSort}
              options={SORTS}
              ariaLabel="Sort flights"
              className="w-[200px]"
            />
          </div>
        </header>

        <div className="mt-6 flex flex-1 flex-col gap-6 md:flex-row md:gap-8">
          <aside
            className={cx(
              "w-full shrink-0 md:block md:w-[260px]",
              railOpen ? "block" : "hidden",
            )}
          >
            {rail}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {chips.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {chips.map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex h-7 items-center gap-1.5 rounded-full border border-neutral-200 pr-1 pl-2.5 text-[13px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300"
                  >
                    {c.label}
                    <button
                      type="button"
                      aria-label={`Remove ${c.label} filter`}
                      onClick={c.clear}
                      className={cx(
                        "flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white",
                        transition,
                        focus,
                      )}
                    >
                      <X aria-hidden="true" className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setFacets(EMPTY)}
                  className={cx(
                    "h-7 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-2 text-[13px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                    transition,
                    focus,
                  )}
                >
                  Clear all
                </button>
              </div>
            )}

            {results.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-[var(--rb-r-2xl,14px)] border border-dashed border-neutral-200 px-6 py-16 text-center dark:border-neutral-800">
                <p className="text-sm text-neutral-900 dark:text-neutral-100">
                  No flights match these filters
                </p>
                <p className="mt-1 max-w-[300px] text-[13px] text-neutral-500 dark:text-neutral-400">
                  Allow more stops or widen the departure window to see more of
                  the day.
                </p>
                <button
                  type="button"
                  onClick={() => setFacets(EMPTY)}
                  className={cx(
                    "mt-5 inline-flex h-9 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3.5 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] active:scale-[0.97] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                    transition,
                    focus,
                  )}
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {results.map((fl) => {
                  const airline = AIRLINES.find((a) => a.value === fl.airline);
                  const arrive = fl.depart + fl.duration;
                  const dayOffset = Math.floor(arrive / 1440);
                  const isSelected = selected === fl.id;
                  return (
                    <li key={fl.id}>
                      <article
                        className={cx(
                          "flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[var(--rb-r-2xl,14px)] border p-4",
                          transition,
                          isSelected
                            ? "border-neutral-900 dark:border-white"
                            : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
                        )}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white text-[13px] text-neutral-700 tabular-nums dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                          {fl.airline}
                        </span>

                        <div className="min-w-0 grow basis-40">
                          <div className="flex items-baseline gap-1.5 text-base tracking-[-0.01em] text-neutral-900 tabular-nums dark:text-white">
                            <span>{clock(fl.depart)}</span>
                            <span className="text-neutral-400 dark:text-neutral-600">
                              –
                            </span>
                            <span>{clock(arrive)}</span>
                            {dayOffset > 0 && (
                              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                +{dayOffset}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                            {airline?.label}
                          </p>
                        </div>

                        <div className="basis-24 text-right sm:text-left">
                          <p className="text-[13px] text-neutral-900 dark:text-neutral-100">
                            {stopsText(fl.stops)}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                            {durationText(fl.duration)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-base tracking-[-0.01em] text-neutral-900 tabular-nums dark:text-white">
                              {money(fl.price)}
                            </p>
                            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                              {fl.carryOn ? "Carry-on" : "Fare only"}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() =>
                              setSelected((v) => (v === fl.id ? null : fl.id))
                            }
                            className={cx(
                              "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-3.5 text-sm font-medium active:scale-[0.97]",
                              transition,
                              focus,
                              isSelected
                                ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                                : "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
                            )}
                          >
                            {isSelected ? (
                              <>
                                <Check aria-hidden="true" className="h-4 w-4" />
                                Selected
                              </>
                            ) : (
                              <>
                                <Plane aria-hidden="true" className="h-4 w-4" />
                                Select
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

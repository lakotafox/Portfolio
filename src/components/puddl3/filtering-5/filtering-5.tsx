"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Bath,
  BedDouble,
  Check,
  ChevronDown,
  Minus,
  Plus,
  Ruler,
  SlidersHorizontal,
  X,
} from "lucide-react";

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

type Listing = {
  id: string;
  title: string;
  neighbourhood: string;
  type: string;
  beds: number;
  baths: number;
  sqft: number;
  price: number;
  availableInDays: number;
  amenities: string[];
};

const TYPES = [
  { value: "all", label: "All" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "studio", label: "Studio" },
  { value: "townhouse", label: "Townhouse" },
];

const TYPE_LABEL: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  condo: "Condo",
  studio: "Studio",
  townhouse: "Townhouse",
};

const AMENITIES = [
  { value: "laundry", label: "Laundry" },
  { value: "parking", label: "Parking" },
  { value: "pets", label: "Pets OK" },
  { value: "dishwasher", label: "Dishwasher" },
  { value: "ac", label: "Central air" },
  { value: "balcony", label: "Balcony" },
  { value: "gym", label: "Gym" },
  { value: "doorman", label: "Doorman" },
  { value: "elevator", label: "Elevator" },
  { value: "hardwood", label: "Hardwood" },
];

const AMENITY_LABEL: Record<string, string> = Object.fromEntries(
  AMENITIES.map((a) => [a.value, a.label]),
);

const AVAILABILITY = [
  { value: "any", label: "Any time" },
  { value: "30", label: "Within 30 days" },
  { value: "60", label: "Within 60 days" },
  { value: "90", label: "Within 90 days" },
];

const PRICE_MIN = 1000;
const PRICE_MAX = 6000;
const BEDS_MAX = 4;
const BATHS_MAX = 3;

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const LISTINGS: Listing[] = [
  {
    id: "r01",
    title: "Sunlit corner one-bed",
    neighbourhood: "Mission District",
    type: "apartment",
    beds: 1,
    baths: 1,
    sqft: 720,
    price: 2650,
    availableInDays: 12,
    amenities: ["laundry", "dishwasher", "hardwood", "elevator"],
  },
  {
    id: "r02",
    title: "Renovated garden flat",
    neighbourhood: "Noe Valley",
    type: "apartment",
    beds: 2,
    baths: 1,
    sqft: 940,
    price: 3450,
    availableInDays: 45,
    amenities: ["parking", "pets", "dishwasher", "balcony"],
  },
  {
    id: "r03",
    title: "Compact studio near transit",
    neighbourhood: "SoMa",
    type: "studio",
    beds: 0,
    baths: 1,
    sqft: 460,
    price: 1950,
    availableInDays: 7,
    amenities: ["laundry", "gym", "elevator", "doorman"],
  },
  {
    id: "r04",
    title: "Craftsman three-bed house",
    neighbourhood: "Bernal Heights",
    type: "house",
    beds: 3,
    baths: 2,
    sqft: 1680,
    price: 5200,
    availableInDays: 60,
    amenities: ["parking", "pets", "ac", "hardwood", "dishwasher"],
  },
  {
    id: "r05",
    title: "Bright top-floor condo",
    neighbourhood: "Hayes Valley",
    type: "condo",
    beds: 2,
    baths: 2,
    sqft: 1120,
    price: 4100,
    availableInDays: 21,
    amenities: ["gym", "elevator", "doorman", "balcony", "ac"],
  },
  {
    id: "r06",
    title: "Quiet studio with alcove",
    neighbourhood: "Inner Richmond",
    type: "studio",
    beds: 0,
    baths: 1,
    sqft: 500,
    price: 2100,
    availableInDays: 30,
    amenities: ["hardwood", "elevator"],
  },
  {
    id: "r07",
    title: "Modern townhouse end unit",
    neighbourhood: "Dogpatch",
    type: "townhouse",
    beds: 3,
    baths: 3,
    sqft: 1740,
    price: 5650,
    availableInDays: 75,
    amenities: ["parking", "laundry", "ac", "balcony", "dishwasher"],
  },
  {
    id: "r08",
    title: "Classic Edwardian one-bed",
    neighbourhood: "Pacific Heights",
    type: "apartment",
    beds: 1,
    baths: 1,
    sqft: 780,
    price: 3100,
    availableInDays: 18,
    amenities: ["hardwood", "pets", "dishwasher"],
  },
  {
    id: "r09",
    title: "Family four-bed with yard",
    neighbourhood: "Outer Sunset",
    type: "house",
    beds: 4,
    baths: 3,
    sqft: 2200,
    price: 6000,
    availableInDays: 90,
    amenities: ["parking", "pets", "laundry", "ac", "dishwasher", "hardwood"],
  },
  {
    id: "r10",
    title: "Loft-style two-bed",
    neighbourhood: "Potrero Hill",
    type: "condo",
    beds: 2,
    baths: 2,
    sqft: 1180,
    price: 4300,
    availableInDays: 40,
    amenities: ["gym", "elevator", "parking", "balcony"],
  },
  {
    id: "r11",
    title: "Cozy junior studio",
    neighbourhood: "Nob Hill",
    type: "studio",
    beds: 0,
    baths: 1,
    sqft: 420,
    price: 1850,
    availableInDays: 9,
    amenities: ["laundry", "elevator", "doorman"],
  },
  {
    id: "r12",
    title: "Updated two-bed apartment",
    neighbourhood: "Cole Valley",
    type: "apartment",
    beds: 2,
    baths: 1,
    sqft: 900,
    price: 3300,
    availableInDays: 33,
    amenities: ["dishwasher", "hardwood", "pets", "laundry"],
  },
  {
    id: "r13",
    title: "Split-level townhouse",
    neighbourhood: "Glen Park",
    type: "townhouse",
    beds: 2,
    baths: 2,
    sqft: 1360,
    price: 4650,
    availableInDays: 55,
    amenities: ["parking", "ac", "balcony", "dishwasher"],
  },
  {
    id: "r14",
    title: "Penthouse-floor condo",
    neighbourhood: "Rincon Hill",
    type: "condo",
    beds: 1,
    baths: 1,
    sqft: 820,
    price: 3800,
    availableInDays: 15,
    amenities: ["gym", "doorman", "elevator", "ac", "balcony"],
  },
  {
    id: "r15",
    title: "Bungalow with home office",
    neighbourhood: "Excelsior",
    type: "house",
    beds: 3,
    baths: 2,
    sqft: 1560,
    price: 4400,
    availableInDays: 48,
    amenities: ["parking", "pets", "hardwood", "laundry"],
  },
  {
    id: "r16",
    title: "Airy one-bed near park",
    neighbourhood: "Duboce Triangle",
    type: "apartment",
    beds: 1,
    baths: 1,
    sqft: 690,
    price: 2850,
    availableInDays: 24,
    amenities: ["hardwood", "dishwasher", "elevator"],
  },
  {
    id: "r17",
    title: "Roomy studio conversion",
    neighbourhood: "Tenderloin",
    type: "studio",
    beds: 0,
    baths: 1,
    sqft: 540,
    price: 1700,
    availableInDays: 5,
    amenities: ["laundry", "elevator"],
  },
  {
    id: "r18",
    title: "Two-bed with private deck",
    neighbourhood: "Bernal Heights",
    type: "apartment",
    beds: 2,
    baths: 2,
    sqft: 1050,
    price: 3900,
    availableInDays: 36,
    amenities: ["balcony", "pets", "dishwasher", "hardwood", "parking"],
  },
  {
    id: "r19",
    title: "Detached three-bed home",
    neighbourhood: "West Portal",
    type: "house",
    beds: 3,
    baths: 2,
    sqft: 1820,
    price: 5100,
    availableInDays: 70,
    amenities: ["parking", "ac", "laundry", "dishwasher"],
  },
  {
    id: "r20",
    title: "Corner townhouse with garage",
    neighbourhood: "Mission Bay",
    type: "townhouse",
    beds: 4,
    baths: 3,
    sqft: 2050,
    price: 5900,
    availableInDays: 82,
    amenities: ["parking", "gym", "elevator", "ac", "balcony", "dishwasher"],
  },
  {
    id: "r21",
    title: "Light-filled loft condo",
    neighbourhood: "SoMa",
    type: "condo",
    beds: 1,
    baths: 1,
    sqft: 760,
    price: 3550,
    availableInDays: 20,
    amenities: ["gym", "doorman", "elevator", "hardwood"],
  },
  {
    id: "r22",
    title: "Two-bed garden apartment",
    neighbourhood: "Inner Sunset",
    type: "apartment",
    beds: 2,
    baths: 1,
    sqft: 970,
    price: 3600,
    availableInDays: 52,
    amenities: ["pets", "laundry", "dishwasher", "balcony"],
  },
];

type Filters = {
  type: string;
  minBeds: number;
  minBaths: number;
  price: [number, number];
  amenities: string[];
  availability: string;
};

const EMPTY: Filters = {
  type: "all",
  minBeds: 0,
  minBaths: 0,
  price: [PRICE_MIN, PRICE_MAX],
  amenities: [],
  availability: "any",
};

const matches = (l: Listing, f: Filters, exclude?: keyof Filters) => {
  if (exclude !== "type" && f.type !== "all" && l.type !== f.type) return false;
  if (exclude !== "minBeds" && l.beds < f.minBeds) return false;
  if (exclude !== "minBaths" && l.baths < f.minBaths) return false;
  if (exclude !== "price" && (l.price < f.price[0] || l.price > f.price[1]))
    return false;
  if (
    exclude !== "availability" &&
    f.availability !== "any" &&
    l.availableInDays > Number(f.availability)
  )
    return false;
  if (
    exclude !== "amenities" &&
    f.amenities.length &&
    !f.amenities.every((a) => l.amenities.includes(a))
  )
    return false;
  return true;
};

function Stepper({
  label,
  value,
  max,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
  icon: ReactNode;
}) {
  const display = value === 0 ? "Any" : `${value}+`;
  const btn =
    "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-[13px] text-neutral-700 dark:text-neutral-300">
        <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease minimum ${label.toLowerCase()}`}
          disabled={value === 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          className={cx(btn, transition, focus)}
        >
          <Minus aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <span className="w-10 text-center text-[13px] text-neutral-900 tabular-nums dark:text-neutral-100">
          {display}
        </span>
        <button
          type="button"
          aria-label={`Increase minimum ${label.toLowerCase()}`}
          disabled={value === max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={cx(btn, transition, focus)}
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

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

export default function Filtering5() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [railOpen, setRailOpen] = useState(false);

  const toggleAmenity = (value: string) =>
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(value)
        ? f.amenities.filter((v) => v !== value)
        : [...f.amenities, value],
    }));

  const results = useMemo(
    () =>
      LISTINGS.filter((l) => matches(l, filters)).sort(
        (a, b) => a.price - b.price,
      ),
    [filters],
  );

  const amenityCount = (value: string) =>
    LISTINGS.filter(
      (l) => matches(l, filters, "amenities") && l.amenities.includes(value),
    ).length;

  const priceNarrowed =
    filters.price[0] !== PRICE_MIN || filters.price[1] !== PRICE_MAX;

  const chips = [
    ...(filters.type !== "all"
      ? [
          {
            key: "type",
            label: TYPE_LABEL[filters.type] ?? filters.type,
            clear: () => setFilters((f) => ({ ...f, type: "all" })),
          },
        ]
      : []),
    ...(filters.minBeds > 0
      ? [
          {
            key: "beds",
            label: `${filters.minBeds}+ beds`,
            clear: () => setFilters((f) => ({ ...f, minBeds: 0 })),
          },
        ]
      : []),
    ...(filters.minBaths > 0
      ? [
          {
            key: "baths",
            label: `${filters.minBaths}+ baths`,
            clear: () => setFilters((f) => ({ ...f, minBaths: 0 })),
          },
        ]
      : []),
    ...(priceNarrowed
      ? [
          {
            key: "price",
            label: `${money(filters.price[0])} – ${money(filters.price[1])}`,
            clear: () =>
              setFilters((f) => ({ ...f, price: [PRICE_MIN, PRICE_MAX] })),
          },
        ]
      : []),
    ...(filters.availability !== "any"
      ? [
          {
            key: "availability",
            label:
              AVAILABILITY.find((a) => a.value === filters.availability)
                ?.label ?? filters.availability,
            clear: () => setFilters((f) => ({ ...f, availability: "any" })),
          },
        ]
      : []),
    ...filters.amenities.map((v) => ({
      key: `amenity:${v}`,
      label: AMENITY_LABEL[v] ?? v,
      clear: () => toggleAmenity(v),
    })),
  ];

  const rail = (
    <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
      <Group label="Property type">
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => {
            const on = filters.type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={on}
                onClick={() => setFilters((f) => ({ ...f, type: t.value }))}
                className={cx(
                  "h-8 cursor-pointer rounded-[var(--rb-r-md,8px)] border px-3 text-[13px]",
                  transition,
                  focus,
                  on
                    ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                    : "border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </Group>

      <Group label="Rooms">
        <div className="space-y-3">
          <Stepper
            label="Beds"
            value={filters.minBeds}
            max={BEDS_MAX}
            onChange={(minBeds) => setFilters((f) => ({ ...f, minBeds }))}
            icon={<BedDouble aria-hidden="true" className="h-4 w-4" />}
          />
          <Stepper
            label="Baths"
            value={filters.minBaths}
            max={BATHS_MAX}
            onChange={(minBaths) => setFilters((f) => ({ ...f, minBaths }))}
            icon={<Bath aria-hidden="true" className="h-4 w-4" />}
          />
        </div>
      </Group>

      <Group label="Monthly rent">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-sm text-neutral-900 tabular-nums dark:text-neutral-100">
            {money(filters.price[0])} – {money(filters.price[1])}
            {filters.price[1] === PRICE_MAX ? "+" : ""}
          </span>
          {priceNarrowed && (
            <button
              type="button"
              onClick={() =>
                setFilters((f) => ({ ...f, price: [PRICE_MIN, PRICE_MAX] }))
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
          value={filters.price}
          onChange={(price) => setFilters((f) => ({ ...f, price }))}
          format={money}
          labels={["Minimum rent", "Maximum rent"]}
        />
      </Group>

      <Group label="Amenities">
        <ul className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
          {AMENITIES.map((a) => {
            const on = filters.amenities.includes(a.value);
            const n = amenityCount(a.value);
            return (
              <li key={a.value}>
                <label
                  className={cx(
                    "flex h-8 cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] px-2 text-[13px] text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900",
                    transition,
                    n === 0 && !on && "opacity-40",
                  )}
                >
                  <span className={checkboxBox}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleAmenity(a.value)}
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
                    {n}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group label="Available from">
        <Select
          value={filters.availability}
          onChange={(availability) =>
            setFilters((f) => ({ ...f, availability }))
          }
          options={AVAILABILITY}
          ariaLabel="Available from"
        />
      </Group>
    </div>
  );

  return (
    <div className="flex h-full min-h-[920px] w-full flex-col overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl tracking-[-0.015em] text-neutral-900 dark:text-white">
              Rentals in San Francisco
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="tabular-nums">{results.length}</span> of{" "}
              <span className="tabular-nums">{LISTINGS.length}</span> homes
              match
            </p>
          </div>
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
        </header>

        <div className="mt-6 flex flex-1 flex-col gap-6 md:flex-row md:gap-8">
          <aside
            className={cx(
              "w-full shrink-0 md:block md:w-[300px]",
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
                  onClick={() => setFilters(EMPTY)}
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
                  No rentals match these filters
                </p>
                <p className="mt-1 max-w-[300px] text-[13px] text-neutral-500 dark:text-neutral-400">
                  Try fewer amenities, lower the bed or bath minimum, or widen
                  the rent range.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY)}
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
              <ul className="space-y-2">
                {results.map((l) => (
                  <li key={l.id}>
                    <article
                      className={cx(
                        "flex cursor-pointer items-center gap-4 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 px-4 py-3 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/50",
                        transition,
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                          {l.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {l.neighbourhood} · {TYPE_LABEL[l.type]}
                        </p>
                      </div>
                      <div className="hidden shrink-0 items-center gap-4 text-xs text-neutral-500 tabular-nums sm:flex dark:text-neutral-400">
                        <span className="inline-flex items-center gap-1.5">
                          <BedDouble
                            aria-hidden="true"
                            className="h-3.5 w-3.5 text-neutral-400"
                          />
                          {l.beds === 0 ? "Studio" : l.beds}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Bath
                            aria-hidden="true"
                            className="h-3.5 w-3.5 text-neutral-400"
                          />
                          {l.baths}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Ruler
                            aria-hidden="true"
                            className="h-3.5 w-3.5 text-neutral-400"
                          />
                          {l.sqft.toLocaleString("en-US")} sqft
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13px] text-neutral-900 tabular-nums dark:text-neutral-100">
                          {money(l.price)}
                          <span className="text-neutral-400 dark:text-neutral-500">
                            /mo
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                          {l.availableInDays <= 14
                            ? "Available now"
                            : `In ${l.availableInDays} days`}
                        </p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

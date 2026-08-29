"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
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

function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setEdges({
      start: scrollLeft > 1,
      end: Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1,
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

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviews: number;
  price: number;
  etaLow: number;
  etaHigh: number;
  fee: number;
  diets: string[];
};

const CUISINES = [
  { value: "all", label: "All" },
  { value: "pizza", label: "Pizza" },
  { value: "sushi", label: "Sushi" },
  { value: "burgers", label: "Burgers" },
  { value: "thai", label: "Thai" },
  { value: "mexican", label: "Mexican" },
  { value: "indian", label: "Indian" },
  { value: "ramen", label: "Ramen" },
  { value: "salads", label: "Salads" },
  { value: "korean", label: "Korean" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "bbq", label: "BBQ" },
  { value: "vietnamese", label: "Vietnamese" },
  { value: "dessert", label: "Dessert" },
];

const RATINGS = [
  { value: 0, label: "Any" },
  { value: 3.5, label: "3.5+" },
  { value: 4.0, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
];

const DIETS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "halal", label: "Halal" },
];

const ETA_OPTIONS = [
  { value: "any", label: "Any delivery time" },
  { value: "30", label: "Under 30 min" },
  { value: "45", label: "Under 45 min" },
  { value: "60", label: "Under 60 min" },
];

const RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    name: "Crust & Coal",
    cuisine: "pizza",
    rating: 4.7,
    reviews: 1820,
    price: 2,
    etaLow: 20,
    etaHigh: 30,
    fee: 0,
    diets: ["vegetarian"],
  },
  {
    id: "r2",
    name: "Blue Fin Bar",
    cuisine: "sushi",
    rating: 4.8,
    reviews: 940,
    price: 3,
    etaLow: 30,
    etaHigh: 45,
    fee: 3.49,
    diets: ["gluten-free"],
  },
  {
    id: "r3",
    name: "Ember Patty Co.",
    cuisine: "burgers",
    rating: 4.4,
    reviews: 2640,
    price: 2,
    etaLow: 15,
    etaHigh: 25,
    fee: 1.99,
    diets: ["halal"],
  },
  {
    id: "r4",
    name: "Lemongrass Lane",
    cuisine: "thai",
    rating: 4.6,
    reviews: 1310,
    price: 2,
    etaLow: 25,
    etaHigh: 40,
    fee: 0,
    diets: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    id: "r5",
    name: "Casa Verde",
    cuisine: "mexican",
    rating: 4.3,
    reviews: 2020,
    price: 1,
    etaLow: 20,
    etaHigh: 30,
    fee: 0.99,
    diets: ["vegetarian"],
  },
  {
    id: "r6",
    name: "Saffron Room",
    cuisine: "indian",
    rating: 4.7,
    reviews: 1580,
    price: 2,
    etaLow: 30,
    etaHigh: 45,
    fee: 2.49,
    diets: ["vegetarian", "vegan", "halal"],
  },
  {
    id: "r7",
    name: "Bowl & Broth",
    cuisine: "ramen",
    rating: 4.5,
    reviews: 870,
    price: 2,
    etaLow: 25,
    etaHigh: 40,
    fee: 1.49,
    diets: [],
  },
  {
    id: "r8",
    name: "Field Greens",
    cuisine: "salads",
    rating: 4.2,
    reviews: 640,
    price: 2,
    etaLow: 15,
    etaHigh: 25,
    fee: 0,
    diets: ["vegetarian", "vegan", "gluten-free"],
  },
  {
    id: "r9",
    name: "Seoul Fire",
    cuisine: "korean",
    rating: 4.6,
    reviews: 1190,
    price: 3,
    etaLow: 35,
    etaHigh: 50,
    fee: 2.99,
    diets: ["halal"],
  },
  {
    id: "r10",
    name: "Olive & Za'atar",
    cuisine: "mediterranean",
    rating: 4.8,
    reviews: 1450,
    price: 2,
    etaLow: 25,
    etaHigh: 40,
    fee: 0,
    diets: ["vegetarian", "vegan", "halal"],
  },
  {
    id: "r11",
    name: "Low & Slow",
    cuisine: "bbq",
    rating: 4.5,
    reviews: 2210,
    price: 3,
    etaLow: 40,
    etaHigh: 55,
    fee: 3.99,
    diets: ["gluten-free"],
  },
  {
    id: "r12",
    name: "Phở District",
    cuisine: "vietnamese",
    rating: 4.7,
    reviews: 980,
    price: 1,
    etaLow: 20,
    etaHigh: 35,
    fee: 0.99,
    diets: ["gluten-free"],
  },
  {
    id: "r13",
    name: "Sugar & Ash",
    cuisine: "dessert",
    rating: 4.9,
    reviews: 760,
    price: 2,
    etaLow: 15,
    etaHigh: 25,
    fee: 1.99,
    diets: ["vegetarian"],
  },
  {
    id: "r14",
    name: "Stonefire Pies",
    cuisine: "pizza",
    rating: 4.3,
    reviews: 1120,
    price: 3,
    etaLow: 30,
    etaHigh: 45,
    fee: 2.49,
    diets: ["vegetarian", "vegan"],
  },
  {
    id: "r15",
    name: "Nori & Rice",
    cuisine: "sushi",
    rating: 4.4,
    reviews: 520,
    price: 2,
    etaLow: 25,
    etaHigh: 40,
    fee: 1.49,
    diets: ["gluten-free"],
  },
  {
    id: "r16",
    name: "Smash District",
    cuisine: "burgers",
    rating: 4.6,
    reviews: 3140,
    price: 2,
    etaLow: 20,
    etaHigh: 30,
    fee: 0,
    diets: ["halal"],
  },
  {
    id: "r17",
    name: "Basil & Chili",
    cuisine: "thai",
    rating: 4.5,
    reviews: 690,
    price: 2,
    etaLow: 35,
    etaHigh: 50,
    fee: 2.99,
    diets: ["vegetarian", "vegan"],
  },
  {
    id: "r18",
    name: "Agave Street",
    cuisine: "mexican",
    rating: 4.7,
    reviews: 1760,
    price: 2,
    etaLow: 25,
    etaHigh: 35,
    fee: 0,
    diets: ["vegetarian", "gluten-free"],
  },
];

type Facets = {
  cuisine: string;
  rating: number;
  prices: number[];
  eta: string;
  diets: string[];
};

const EMPTY: Facets = {
  cuisine: "all",
  rating: 0,
  prices: [],
  eta: "any",
  diets: [],
};

const matches = (r: Restaurant, f: Facets, exclude?: keyof Facets) => {
  if (exclude !== "cuisine" && f.cuisine !== "all" && r.cuisine !== f.cuisine)
    return false;
  if (exclude !== "rating" && f.rating > 0 && r.rating < f.rating) return false;
  if (exclude !== "prices" && f.prices.length && !f.prices.includes(r.price))
    return false;
  if (exclude !== "eta" && f.eta !== "any" && r.etaHigh > Number(f.eta))
    return false;
  if (
    exclude !== "diets" &&
    f.diets.length &&
    !f.diets.every((d) => r.diets.includes(d))
  )
    return false;
  return true;
};

const priceText = (level: number) => "$".repeat(level);

const initials = (name: string) =>
  name
    .replace(/[^A-Za-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export default function Filtering9() {
  const [facets, setFacets] = useState<Facets>(EMPTY);
  const {
    ref: pillsRef,
    edges: pillEdges,
    onScroll: onPillsScroll,
  } = useScrollEdges<HTMLDivElement>();

  const results = useMemo(
    () => RESTAURANTS.filter((r) => matches(r, facets)),
    [facets],
  );

  const cuisineCount = (value: string) =>
    value === "all"
      ? RESTAURANTS.filter((r) => matches(r, facets, "cuisine")).length
      : RESTAURANTS.filter(
          (r) => matches(r, facets, "cuisine") && r.cuisine === value,
        ).length;

  const priceCount = (level: number) =>
    RESTAURANTS.filter((r) => matches(r, facets, "prices") && r.price === level)
      .length;

  const dietCount = (value: string) =>
    RESTAURANTS.filter(
      (r) =>
        matches(r, facets, "diets") &&
        [...facets.diets, value].every((d) => r.diets.includes(d)),
    ).length;

  const togglePrice = (level: number) =>
    setFacets((f) => ({
      ...f,
      prices: f.prices.includes(level)
        ? f.prices.filter((v) => v !== level)
        : [...f.prices, level],
    }));

  const toggleDiet = (value: string) =>
    setFacets((f) => ({
      ...f,
      diets: f.diets.includes(value)
        ? f.diets.filter((v) => v !== value)
        : [...f.diets, value],
    }));

  const scrollPills = (dir: -1 | 1) =>
    pillsRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  const activeCount =
    (facets.cuisine !== "all" ? 1 : 0) +
    (facets.rating > 0 ? 1 : 0) +
    facets.prices.length +
    (facets.eta !== "any" ? 1 : 0) +
    facets.diets.length;

  return (
    <div className="flex h-full min-h-[880px] w-full flex-col overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-xl tracking-[-0.015em] text-neutral-900 dark:text-white">
            Order in tonight
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <span className="tabular-nums">{results.length}</span> places
            deliver to Mission St · 94110
          </p>
        </header>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            aria-label="Scroll cuisines left"
            disabled={!pillEdges.start}
            onClick={() => scrollPills(-1)}
            className={cx(
              "hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 sm:inline-flex dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
              transition,
              focus,
            )}
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>

          <div className="relative min-w-0 flex-1">
            <div
              ref={pillsRef}
              onScroll={onPillsScroll}
              className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {CUISINES.map((c) => {
                const on = facets.cuisine === c.value;
                const n = cuisineCount(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setFacets((f) => ({ ...f, cuisine: c.value }))
                    }
                    className={cx(
                      "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px]",
                      transition,
                      focus,
                      on
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                        : "border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700",
                      n === 0 && !on && "opacity-40",
                    )}
                  >
                    {c.label}
                    <span
                      className={cx(
                        "text-xs tabular-nums",
                        on
                          ? "text-white/70 dark:text-neutral-900/60"
                          : "text-neutral-400 dark:text-neutral-500",
                      )}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                pillEdges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                pillEdges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>

          <button
            type="button"
            aria-label="Scroll cuisines right"
            disabled={!pillEdges.end}
            onClick={() => scrollPills(1)}
            className={cx(
              "hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 sm:inline-flex dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
              transition,
              focus,
            )}
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-3">
          <div
            role="group"
            aria-label="Minimum rating"
            className="inline-flex h-9 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900"
          >
            {RATINGS.map((r) => {
              const on = facets.rating === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFacets((f) => ({ ...f, rating: r.value }))}
                  className={cx(
                    "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] tabular-nums",
                    transition,
                    focus,
                    on
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                  )}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label="Price level"
            className="inline-flex h-9 items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900"
          >
            {[1, 2, 3, 4].map((level) => {
              const on = facets.prices.includes(level);
              const n = priceCount(level);
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={on}
                  aria-label={`Price ${priceText(level)}, ${n} places`}
                  onClick={() => togglePrice(level)}
                  className={cx(
                    "inline-flex h-7 min-w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] px-2 text-[13px] tabular-nums",
                    transition,
                    focus,
                    on
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                    n === 0 && !on && "opacity-40",
                  )}
                >
                  {priceText(level)}
                </button>
              );
            })}
          </div>

          <Select
            value={facets.eta}
            onChange={(eta) => setFacets((f) => ({ ...f, eta }))}
            options={ETA_OPTIONS}
            ariaLabel="Delivery time"
            className="w-[180px]"
          />

          <div className="flex flex-wrap items-center gap-2">
            {DIETS.map((d) => {
              const on = facets.diets.includes(d.value);
              const n = dietCount(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDiet(d.value)}
                  className={cx(
                    "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px]",
                    transition,
                    focus,
                    on
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700",
                    n === 0 && !on && "opacity-40",
                  )}
                >
                  {on && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                  {d.label}
                </button>
              );
            })}
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => setFacets(EMPTY)}
                className={cx(
                  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[13px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                  transition,
                  focus,
                )}
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-[var(--rb-r-2xl,14px)] border border-dashed border-neutral-200 px-6 py-16 text-center dark:border-neutral-800">
            <p className="text-sm text-neutral-900 dark:text-neutral-100">
              No places match right now
            </p>
            <p className="mt-1 max-w-[300px] text-[13px] text-neutral-500 dark:text-neutral-400">
              Try a longer delivery window or clear a filter to see more
              kitchens nearby.
            </p>
            <button
              type="button"
              onClick={() => setFacets(EMPTY)}
              className={cx(
                "mt-5 inline-flex h-9 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-neutral-900 px-3.5 text-sm font-medium text-white active:scale-[0.97] dark:bg-white dark:text-neutral-900",
                transition,
                focus,
              )}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((r) => {
              const cuisine = CUISINES.find((c) => c.value === r.cuisine);
              return (
                <li key={r.id}>
                  <article
                    className={cx(
                      "cursor-pointer rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 p-1 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
                      transition,
                    )}
                  >
                    <div className="relative flex aspect-[3/2] items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-neutral-100 dark:bg-neutral-900">
                      <span className="text-lg text-neutral-400 tabular-nums dark:text-neutral-500">
                        {initials(r.name)}
                      </span>
                      <span className="absolute top-2 left-2 inline-flex h-6 items-center gap-1 rounded-full bg-white/90 px-2 text-[11px] text-neutral-900 tabular-nums backdrop-blur-sm dark:bg-neutral-950/85 dark:text-neutral-100">
                        <Star
                          aria-hidden="true"
                          className="h-3 w-3 fill-current text-neutral-900 dark:text-white"
                        />
                        {r.rating.toFixed(1)}
                      </span>
                      <span className="absolute right-2 bottom-2 inline-flex h-6 items-center rounded-full bg-white/90 px-2 text-[11px] font-medium text-neutral-700 backdrop-blur-sm dark:bg-neutral-950/85 dark:text-neutral-300">
                        {r.fee === 0 ? "Free delivery" : `$${r.fee.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="px-2 pt-2.5 pb-1.5">
                      <p className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                        {r.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="truncate">{cuisine?.label}</span>
                        <span
                          aria-hidden="true"
                          className="text-neutral-300 dark:text-neutral-700"
                        >
                          ·
                        </span>
                        <span className="tabular-nums">
                          {priceText(r.price)}
                        </span>
                        <span
                          aria-hidden="true"
                          className="text-neutral-300 dark:text-neutral-700"
                        >
                          ·
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {r.etaLow}–{r.etaHigh} min
                        </span>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

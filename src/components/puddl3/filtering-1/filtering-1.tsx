"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";

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

type Piece = {
  id: string;
  name: string;
  category: string;
  price: number;
  glaze: string;
  size: string;
  maker: string;
};

const CATEGORIES = [
  { value: "dinnerware", label: "Dinnerware" },
  { value: "drinkware", label: "Drinkware" },
  { value: "vases", label: "Vases" },
  { value: "planters", label: "Planters" },
  { value: "serveware", label: "Serveware" },
];

const GLAZES = [
  { value: "chalk", label: "Chalk", hex: "#ece5d8", light: true },
  { value: "sand", label: "Sand", hex: "#c9b193", light: true },
  { value: "moss", label: "Moss", hex: "#5a6647", light: false },
  { value: "slate", label: "Slate", hex: "#3b4b5a", light: false },
  { value: "clay", label: "Clay", hex: "#a05a41", light: false },
  { value: "ink", label: "Ink", hex: "#2a2724", light: false },
];

const SIZES = [
  { value: "s", label: "Small" },
  { value: "m", label: "Medium" },
  { value: "l", label: "Large" },
];

const MAKERS = [
  { value: "kilnhouse", label: "Kilnhouse" },
  { value: "muro", label: "Muro Studio" },
  { value: "terra", label: "Terra & Ash" },
  { value: "nine", label: "Nine Fields" },
];

const PIECES: Piece[] = [
  {
    id: "p1",
    name: "Ridge dinner plate",
    category: "dinnerware",
    price: 38,
    glaze: "chalk",
    size: "l",
    maker: "kilnhouse",
  },
  {
    id: "p2",
    name: "Ridge side plate",
    category: "dinnerware",
    price: 26,
    glaze: "chalk",
    size: "m",
    maker: "kilnhouse",
  },
  {
    id: "p3",
    name: "Coil cereal bowl",
    category: "dinnerware",
    price: 32,
    glaze: "sand",
    size: "m",
    maker: "muro",
  },
  {
    id: "p4",
    name: "Ember pasta bowl",
    category: "dinnerware",
    price: 44,
    glaze: "clay",
    size: "l",
    maker: "terra",
  },
  {
    id: "p5",
    name: "Halo charger plate",
    category: "dinnerware",
    price: 52,
    glaze: "ink",
    size: "l",
    maker: "nine",
  },
  {
    id: "p6",
    name: "Tuck mug",
    category: "drinkware",
    price: 28,
    glaze: "moss",
    size: "s",
    maker: "kilnhouse",
  },
  {
    id: "p7",
    name: "Stack tumbler",
    category: "drinkware",
    price: 22,
    glaze: "slate",
    size: "s",
    maker: "muro",
  },
  {
    id: "p8",
    name: "Pour carafe",
    category: "drinkware",
    price: 68,
    glaze: "chalk",
    size: "l",
    maker: "terra",
  },
  {
    id: "p9",
    name: "Field cup",
    category: "drinkware",
    price: 19,
    glaze: "sand",
    size: "s",
    maker: "nine",
  },
  {
    id: "p10",
    name: "Bell teapot",
    category: "drinkware",
    price: 94,
    glaze: "ink",
    size: "l",
    maker: "kilnhouse",
  },
  {
    id: "p11",
    name: "Column vase",
    category: "vases",
    price: 76,
    glaze: "slate",
    size: "l",
    maker: "muro",
  },
  {
    id: "p12",
    name: "Pebble bud vase",
    category: "vases",
    price: 34,
    glaze: "chalk",
    size: "s",
    maker: "terra",
  },
  {
    id: "p13",
    name: "Fold vase",
    category: "vases",
    price: 58,
    glaze: "clay",
    size: "m",
    maker: "nine",
  },
  {
    id: "p14",
    name: "Basin planter",
    category: "planters",
    price: 62,
    glaze: "sand",
    size: "l",
    maker: "kilnhouse",
  },
  {
    id: "p15",
    name: "Rim planter",
    category: "planters",
    price: 41,
    glaze: "moss",
    size: "m",
    maker: "muro",
  },
  {
    id: "p16",
    name: "Trace wall planter",
    category: "planters",
    price: 29,
    glaze: "ink",
    size: "s",
    maker: "terra",
  },
  {
    id: "p17",
    name: "Crest platter",
    category: "serveware",
    price: 88,
    glaze: "chalk",
    size: "l",
    maker: "nine",
  },
  {
    id: "p18",
    name: "Ladle serving bowl",
    category: "serveware",
    price: 54,
    glaze: "moss",
    size: "m",
    maker: "kilnhouse",
  },
];

const PRICE_MIN = 0;
const PRICE_MAX: number = 100;
const money = (n: number) => `$${n}`;

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
  { value: "name", label: "Alphabetical" },
];

type Facets = {
  category: string[];
  glaze: string[];
  size: string[];
  maker: string[];
  price: [number, number];
};

const EMPTY: Facets = {
  category: [],
  glaze: [],
  size: [],
  maker: [],
  price: [PRICE_MIN, PRICE_MAX],
};

const matches = (piece: Piece, f: Facets, exclude?: keyof Facets) => {
  if (
    exclude !== "category" &&
    f.category.length &&
    !f.category.includes(piece.category)
  )
    return false;
  if (exclude !== "glaze" && f.glaze.length && !f.glaze.includes(piece.glaze))
    return false;
  if (exclude !== "size" && f.size.length && !f.size.includes(piece.size))
    return false;
  if (exclude !== "maker" && f.maker.length && !f.maker.includes(piece.maker))
    return false;
  if (
    exclude !== "price" &&
    (piece.price < f.price[0] || piece.price > f.price[1])
  )
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

export default function Filtering1() {
  const [facets, setFacets] = useState<Facets>(EMPTY);
  const [sort, setSort] = useState("featured");
  const [railOpen, setRailOpen] = useState(false);

  const toggle = (
    key: "category" | "glaze" | "size" | "maker",
    value: string,
  ) =>
    setFacets((f) => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter((v) => v !== value)
        : [...f[key], value],
    }));

  const results = useMemo(() => {
    const list = PIECES.filter((p) => matches(p, facets));
    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "name")
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [facets, sort]);

  const countFor = (
    key: "category" | "glaze" | "size" | "maker",
    value: string,
  ) => PIECES.filter((p) => matches(p, facets, key) && p[key] === value).length;

  const priceNarrowed =
    facets.price[0] !== PRICE_MIN || facets.price[1] !== PRICE_MAX;

  const chips = [
    ...facets.category.map((v) => ({
      key: `category:${v}`,
      label: CATEGORIES.find((c) => c.value === v)?.label ?? v,
      swatch: undefined as string | undefined,
      clear: () => toggle("category", v),
    })),
    ...facets.glaze.map((v) => ({
      key: `glaze:${v}`,
      label: GLAZES.find((g) => g.value === v)?.label ?? v,
      swatch: GLAZES.find((g) => g.value === v)?.hex,
      clear: () => toggle("glaze", v),
    })),
    ...facets.size.map((v) => ({
      key: `size:${v}`,
      label: SIZES.find((s) => s.value === v)?.label ?? v,
      swatch: undefined,
      clear: () => toggle("size", v),
    })),
    ...facets.maker.map((v) => ({
      key: `maker:${v}`,
      label: MAKERS.find((m) => m.value === v)?.label ?? v,
      swatch: undefined,
      clear: () => toggle("maker", v),
    })),
    ...(priceNarrowed
      ? [
          {
            key: "price",
            label: `${money(facets.price[0])} – ${money(facets.price[1])}`,
            swatch: undefined,
            clear: () =>
              setFacets((f) => ({ ...f, price: [PRICE_MIN, PRICE_MAX] })),
          },
        ]
      : []),
  ];

  const rail = (
    <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
      <Group label="Category">
        <ul className="space-y-0.5">
          {CATEGORIES.map((c) => {
            const n = countFor("category", c.value);
            const on = facets.category.includes(c.value);
            return (
              <li key={c.value}>
                <label
                  className={cx(
                    "flex h-8 cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] px-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900",
                    transition,
                    n === 0 && !on && "opacity-40",
                  )}
                >
                  <span className={checkboxBox}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle("category", c.value)}
                      className={checkboxClass}
                    />
                    <Check
                      aria-hidden="true"
                      strokeWidth={3}
                      className={checkboxMark}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
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
                setFacets((f) => ({ ...f, price: [PRICE_MIN, PRICE_MAX] }))
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
          step={5}
          value={facets.price}
          onChange={(price) => setFacets((f) => ({ ...f, price }))}
          format={money}
          labels={["Minimum price", "Maximum price"]}
        />
      </Group>

      <Group label="Glaze">
        <div className="flex flex-wrap gap-2">
          {GLAZES.map((g) => {
            const on = facets.glaze.includes(g.value);
            const n = countFor("glaze", g.value);
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={on}
                aria-label={`${g.label}, ${n} pieces`}
                onClick={() => toggle("glaze", g.value)}
                className={cx(
                  "relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full",
                  transition,
                  focus,
                  on
                    ? "ring-2 ring-neutral-900 dark:ring-white"
                    : "hover:ring-2 hover:ring-neutral-200 dark:hover:ring-neutral-700",
                  n === 0 && !on && "opacity-40",
                )}
              >
                <span
                  className="h-6 w-6 rounded-full ring-1 ring-black/10 ring-inset dark:ring-white/15"
                  style={{ backgroundColor: g.hex }}
                />
                {on && (
                  <Check
                    aria-hidden="true"
                    strokeWidth={3}
                    className={cx(
                      "absolute h-3.5 w-3.5",
                      g.light ? "text-neutral-900" : "text-white",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </Group>

      <Group label="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const on = facets.size.includes(s.value);
            const n = countFor("size", s.value);
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle("size", s.value)}
                className={cx(
                  "h-8 cursor-pointer rounded-[var(--rb-r-md,8px)] border px-3 text-[13px]",
                  transition,
                  focus,
                  on
                    ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                    : "border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700",
                  n === 0 && !on && "opacity-40",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </Group>

      <Group label="Maker">
        <ul className="space-y-0.5">
          {MAKERS.map((m) => {
            const n = countFor("maker", m.value);
            const on = facets.maker.includes(m.value);
            return (
              <li key={m.value}>
                <label
                  className={cx(
                    "flex h-8 cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] px-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900",
                    transition,
                    n === 0 && !on && "opacity-40",
                  )}
                >
                  <span className={checkboxBox}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle("maker", m.value)}
                      className={checkboxClass}
                    />
                    <Check
                      aria-hidden="true"
                      strokeWidth={3}
                      className={checkboxMark}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{m.label}</span>
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
  );

  return (
    <div className="flex h-full min-h-[940px] w-full flex-col overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl tracking-[-0.015em] text-neutral-900 dark:text-white">
              Stoneware
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="tabular-nums">{results.length}</span> of{" "}
              <span className="tabular-nums">{PIECES.length}</span> pieces
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
              ariaLabel="Sort pieces"
              className="w-[190px]"
            />
          </div>
        </header>

        <div className="mt-6 flex flex-1 flex-col gap-6 md:flex-row md:gap-8">
          <aside
            className={cx(
              "w-full shrink-0 md:block md:w-[240px]",
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
                    {c.swatch && (
                      <span
                        className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10 ring-inset dark:ring-white/15"
                        style={{ backgroundColor: c.swatch }}
                      />
                    )}
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
                  Nothing matches these filters
                </p>
                <p className="mt-1 max-w-[280px] text-[13px] text-neutral-500 dark:text-neutral-400">
                  Widen the price range or clear a facet to see more of the
                  collection.
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
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {results.map((p) => {
                  const glaze = GLAZES.find((g) => g.value === p.glaze);
                  return (
                    <li key={p.id}>
                      <article
                        className={cx(
                          "cursor-pointer rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 p-1 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
                          transition,
                        )}
                      >
                        <div
                          className="aspect-square rounded-[var(--rb-r-lg,10px)] ring-1 ring-black/10 ring-inset dark:ring-white/20"
                          style={{ backgroundColor: glaze?.hex }}
                        />
                        <div className="px-2 pt-2.5 pb-1.5">
                          <p className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                            {p.name}
                          </p>
                          <div className="mt-0.5 flex items-baseline justify-between gap-2">
                            <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                              {MAKERS.find((m) => m.value === p.maker)?.label}
                            </span>
                            <span className="shrink-0 text-[13px] text-neutral-900 tabular-nums dark:text-neutral-100">
                              {money(p.price)}
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
      </div>
    </div>
  );
}

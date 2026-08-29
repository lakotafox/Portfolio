"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  Brush,
  Check,
  ChevronDown,
  Grid2x2,
  Hexagon,
  Image as ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  Search,
  Shapes,
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

type FacetKey = "type" | "orientation" | "tag" | "updated";

type Asset = {
  id: string;
  name: string;
  ext: string;
  type: string;
  orientation: "landscape" | "square" | "portrait";
  tags: string[];
  updatedDays: number;
  width: number;
  height: number;
  sizeKb: number;
};

const TYPES = [
  { value: "logo", label: "Logo" },
  { value: "photo", label: "Photography" },
  { value: "illustration", label: "Illustration" },
  { value: "icon", label: "Icon" },
  { value: "template", label: "Template" },
];

const ORIENTATIONS = [
  { value: "landscape", label: "Landscape" },
  { value: "square", label: "Square" },
  { value: "portrait", label: "Portrait" },
];

const TAGS = [
  { value: "brand", label: "Brand" },
  { value: "campaign", label: "Campaign" },
  { value: "product", label: "Product" },
  { value: "social", label: "Social" },
  { value: "web", label: "Web" },
];

const UPDATED = [
  { value: "24h", label: "Today" },
  { value: "7d", label: "This week" },
  { value: "30d", label: "This month" },
  { value: "older", label: "Older" },
];

const TYPE_ICON: Record<string, ComponentType<{ className?: string }>> = {
  logo: Hexagon,
  photo: ImageIcon,
  illustration: Brush,
  icon: Shapes,
  template: LayoutTemplate,
};

const ASPECT: Record<Asset["orientation"], string> = {
  landscape: "aspect-[4/3]",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

const ASSETS: Asset[] = [
  {
    id: "a1",
    name: "Primary wordmark",
    ext: "svg",
    type: "logo",
    orientation: "square",
    tags: ["brand"],
    updatedDays: 2,
    width: 512,
    height: 512,
    sizeKb: 28,
  },
  {
    id: "a2",
    name: "Monogram mark",
    ext: "svg",
    type: "logo",
    orientation: "square",
    tags: ["brand"],
    updatedDays: 9,
    width: 512,
    height: 512,
    sizeKb: 22,
  },
  {
    id: "a3",
    name: "App icon rounded",
    ext: "png",
    type: "icon",
    orientation: "square",
    tags: ["product", "brand"],
    updatedDays: 1,
    width: 1024,
    height: 1024,
    sizeKb: 84,
  },
  {
    id: "a4",
    name: "Hero banner autumn",
    ext: "jpg",
    type: "photo",
    orientation: "landscape",
    tags: ["campaign", "web"],
    updatedDays: 3,
    width: 2400,
    height: 1600,
    sizeKb: 3820,
  },
  {
    id: "a5",
    name: "Team offsite group",
    ext: "jpg",
    type: "photo",
    orientation: "landscape",
    tags: ["social"],
    updatedDays: 14,
    width: 2400,
    height: 1600,
    sizeKb: 4120,
  },
  {
    id: "a6",
    name: "Founder portrait",
    ext: "jpg",
    type: "photo",
    orientation: "portrait",
    tags: ["social", "web"],
    updatedDays: 6,
    width: 1600,
    height: 2400,
    sizeKb: 2960,
  },
  {
    id: "a7",
    name: "Product on desk",
    ext: "jpg",
    type: "photo",
    orientation: "square",
    tags: ["product"],
    updatedDays: 4,
    width: 2000,
    height: 2000,
    sizeKb: 3510,
  },
  {
    id: "a8",
    name: "Empty-state spot",
    ext: "png",
    type: "illustration",
    orientation: "landscape",
    tags: ["web", "product"],
    updatedDays: 5,
    width: 1800,
    height: 1350,
    sizeKb: 640,
  },
  {
    id: "a9",
    name: "Onboarding scene",
    ext: "png",
    type: "illustration",
    orientation: "portrait",
    tags: ["product"],
    updatedDays: 20,
    width: 1350,
    height: 1800,
    sizeKb: 720,
  },
  {
    id: "a10",
    name: "Mesh pattern tile",
    ext: "png",
    type: "illustration",
    orientation: "square",
    tags: ["brand"],
    updatedDays: 45,
    width: 1600,
    height: 1600,
    sizeKb: 540,
  },
  {
    id: "a11",
    name: "Social card layout",
    ext: "fig",
    type: "template",
    orientation: "landscape",
    tags: ["social", "campaign"],
    updatedDays: 2,
    width: 1200,
    height: 630,
    sizeKb: 1180,
  },
  {
    id: "a12",
    name: "Pitch deck cover",
    ext: "fig",
    type: "template",
    orientation: "landscape",
    tags: ["brand"],
    updatedDays: 30,
    width: 1920,
    height: 1080,
    sizeKb: 1620,
  },
  {
    id: "a13",
    name: "Story frame layout",
    ext: "fig",
    type: "template",
    orientation: "portrait",
    tags: ["social"],
    updatedDays: 8,
    width: 1080,
    height: 1920,
    sizeKb: 1440,
  },
  {
    id: "a14",
    name: "Favicon set",
    ext: "svg",
    type: "icon",
    orientation: "square",
    tags: ["web"],
    updatedDays: 12,
    width: 256,
    height: 256,
    sizeKb: 16,
  },
  {
    id: "a15",
    name: "Nav glyph sheet",
    ext: "svg",
    type: "icon",
    orientation: "square",
    tags: ["web", "product"],
    updatedDays: 7,
    width: 512,
    height: 512,
    sizeKb: 34,
  },
  {
    id: "a16",
    name: "Campaign key visual",
    ext: "jpg",
    type: "photo",
    orientation: "portrait",
    tags: ["campaign"],
    updatedDays: 1,
    width: 1600,
    height: 2400,
    sizeKb: 3240,
  },
  {
    id: "a17",
    name: "Blog header abstract",
    ext: "png",
    type: "illustration",
    orientation: "landscape",
    tags: ["web"],
    updatedDays: 22,
    width: 2000,
    height: 1000,
    sizeKb: 480,
  },
  {
    id: "a18",
    name: "Secondary logo dark",
    ext: "svg",
    type: "logo",
    orientation: "landscape",
    tags: ["brand", "web"],
    updatedDays: 40,
    width: 800,
    height: 300,
    sizeKb: 30,
  },
  {
    id: "a19",
    name: "Accent star icon",
    ext: "svg",
    type: "icon",
    orientation: "square",
    tags: ["product"],
    updatedDays: 60,
    width: 128,
    height: 128,
    sizeKb: 8,
  },
  {
    id: "a20",
    name: "Lifestyle wide shot",
    ext: "jpg",
    type: "photo",
    orientation: "landscape",
    tags: ["campaign", "social"],
    updatedDays: 5,
    width: 2400,
    height: 1350,
    sizeKb: 3980,
  },
];

const bucketOf = (days: number) =>
  days <= 1 ? "24h" : days <= 7 ? "7d" : days <= 30 ? "30d" : "older";

const SORTS = [
  { value: "recent", label: "Recently updated" },
  { value: "name", label: "Name A–Z" },
  { value: "large", label: "File size: large to small" },
  { value: "small", label: "File size: small to large" },
];

type Facets = Record<FacetKey, string[]>;

const EMPTY: Facets = { type: [], orientation: [], tag: [], updated: [] };

const assetHas = (a: Asset, key: FacetKey, value: string) => {
  if (key === "type") return a.type === value;
  if (key === "orientation") return a.orientation === value;
  if (key === "tag") return a.tags.includes(value);
  return bucketOf(a.updatedDays) === value;
};

const matches = (a: Asset, f: Facets, exclude?: FacetKey) => {
  for (const key of ["type", "orientation", "tag", "updated"] as FacetKey[]) {
    if (key === exclude) continue;
    const active = f[key];
    if (active.length && !active.some((v) => assetHas(a, key, v))) return false;
  }
  return true;
};

const fileSize = (kb: number) =>
  kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;

const LABEL_OF: Record<FacetKey, (value: string) => string> = {
  type: (v) => TYPES.find((t) => t.value === v)?.label ?? v,
  orientation: (v) => ORIENTATIONS.find((o) => o.value === v)?.label ?? v,
  tag: (v) => TAGS.find((t) => t.value === v)?.label ?? v,
  updated: (v) => UPDATED.find((u) => u.value === v)?.label ?? v,
};

function FacetDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
  counts,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  counts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = selected.length;

  const close = () => {
    setOpen(false);
    setShown(false);
  };

  useEffect(() => {
    if (!open) return;
    const node = rootRef.current;
    const doc = node?.ownerDocument;
    if (!doc) return;
    const onPointer = (e: Event) => {
      if (!node.contains(e.target as Node)) close();
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
    const win = rootRef.current?.ownerDocument.defaultView;
    if (!win) return;
    const id = win.requestAnimationFrame(() => setShown(true));
    return () => win.cancelAnimationFrame(id);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => (open ? close() : setOpen(true))}
        className={cx(
          "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border px-3 text-sm text-neutral-900 dark:text-neutral-100",
          transition,
          focus,
          active > 0
            ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900"
            : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900",
        )}
      >
        {label}
        {active > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] px-1 text-[11px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] tabular-nums dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
            {active}
          </span>
        )}
        <ChevronDown
          aria-hidden="true"
          className={cx(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-150 ease-out motion-reduce:transition-none dark:text-neutral-600",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-30 mt-1.5 w-[240px] rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white p-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none dark:border-neutral-800 dark:bg-neutral-900"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? undefined : "translateY(4px)",
          }}
        >
          <ul className="space-y-0.5">
            {options.map((o) => {
              const n = counts[o.value] ?? 0;
              const on = selected.includes(o.value);
              return (
                <li key={o.value}>
                  <label
                    className={cx(
                      "flex h-8 cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-lg,10px)] px-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/70",
                      transition,
                      n === 0 && !on && "opacity-40",
                    )}
                  >
                    <span className={checkboxBox}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => onToggle(o.value)}
                        className={checkboxClass}
                      />
                      <Check
                        aria-hidden="true"
                        strokeWidth={3}
                        className={checkboxMark}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    <span className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                      {n}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {active > 0 && (
            <div className="mt-1 px-1 pt-1">
              <button
                type="button"
                onClick={onClear}
                className={cx(
                  "h-7 w-full cursor-pointer rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                  transition,
                  focus,
                )}
              >
                Clear {label.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const FACETS: { key: FacetKey; label: string; options: SelectOption[] }[] = [
  { key: "type", label: "Type", options: TYPES },
  { key: "orientation", label: "Orientation", options: ORIENTATIONS },
  { key: "tag", label: "Tag", options: TAGS },
  { key: "updated", label: "Updated", options: UPDATED },
];

export default function Filtering7() {
  const [facets, setFacets] = useState<Facets>(EMPTY);
  const [sort, setSort] = useState("recent");
  const [dense, setDense] = useState(false);

  const toggle = (key: FacetKey, value: string) =>
    setFacets((f) => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter((v) => v !== value)
        : [...f[key], value],
    }));

  const clearFacet = (key: FacetKey) => setFacets((f) => ({ ...f, [key]: [] }));

  const results = useMemo(() => {
    const list = ASSETS.filter((a) => matches(a, facets));
    if (sort === "name")
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "large") return [...list].sort((a, b) => b.sizeKb - a.sizeKb);
    if (sort === "small") return [...list].sort((a, b) => a.sizeKb - b.sizeKb);
    return [...list].sort((a, b) => a.updatedDays - b.updatedDays);
  }, [facets, sort]);

  const countsFor = (key: FacetKey) => {
    const map: Record<string, number> = {};
    for (const o of FACETS.find((f) => f.key === key)!.options) {
      map[o.value] = ASSETS.filter(
        (a) => matches(a, facets, key) && assetHas(a, key, o.value),
      ).length;
    }
    return map;
  };

  const chips = (
    ["type", "orientation", "tag", "updated"] as FacetKey[]
  ).flatMap((key) =>
    facets[key].map((v) => ({
      key: `${key}:${v}`,
      label: LABEL_OF[key](v),
      clear: () => toggle(key, v),
    })),
  );

  return (
    <div className="flex h-full min-h-[840px] w-full flex-col overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <header className="mb-5">
          <h2 className="text-xl tracking-[-0.015em] text-neutral-900 dark:text-white">
            Brand asset library
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="tabular-nums">{results.length}</span> of{" "}
            <span className="tabular-nums">{ASSETS.length}</span> assets
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          {FACETS.map((f) => (
            <FacetDropdown
              key={f.key}
              label={f.label}
              options={f.options}
              selected={facets[f.key]}
              onToggle={(v) => toggle(f.key, v)}
              onClear={() => clearFacet(f.key)}
              counts={countsFor(f.key)}
            />
          ))}

          <div className="ml-auto flex items-center gap-2">
            <div
              role="group"
              aria-label="Grid density"
              className="flex items-center gap-0.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 p-0.5 dark:border-neutral-800"
            >
              <button
                type="button"
                aria-label="Comfortable grid"
                aria-pressed={!dense}
                onClick={() => setDense(false)}
                className={cx(
                  "flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)]",
                  transition,
                  focus,
                  !dense
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                <LayoutGrid aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Compact grid"
                aria-pressed={dense}
                onClick={() => setDense(true)}
                className={cx(
                  "flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)]",
                  transition,
                  focus,
                  dense
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                <Grid2x2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <Select
              value={sort}
              onChange={setSort}
              options={SORTS}
              ariaLabel="Sort assets"
              className="w-[210px]"
            />
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
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
          <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-[var(--rb-r-2xl,14px)] border border-dashed border-neutral-200 px-6 py-16 text-center dark:border-neutral-800">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
              <Search aria-hidden="true" className="h-5 w-5 text-neutral-500" />
            </div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              No assets match these filters
            </p>
            <p className="mt-1 max-w-[300px] text-[13px] text-neutral-500 dark:text-neutral-400">
              Try a different type or clear a facet to see more of the library.
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
          <ul
            className={cx(
              "mt-5 grid items-start",
              dense
                ? "grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6"
                : "grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
            )}
          >
            {results.map((a) => {
              const Icon = TYPE_ICON[a.type] ?? ImageIcon;
              return (
                <li key={a.id}>
                  <article
                    className={cx(
                      "cursor-pointer rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 p-1 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
                      transition,
                    )}
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--rb-r-lg,10px)] bg-white p-1.5 ring-1 ring-black/5 ring-inset dark:bg-neutral-950 dark:ring-white/10">
                      <div
                        className={cx(
                          "flex h-full max-w-full items-center justify-center rounded-[var(--rb-r-xs,4px)] bg-neutral-100 dark:bg-neutral-800/70",
                          ASPECT[a.orientation],
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cx(
                            "text-neutral-300 dark:text-neutral-600",
                            dense ? "h-5 w-5" : "h-7 w-7",
                          )}
                        />
                      </div>
                      <span className="absolute top-2 left-2 inline-flex h-5 items-center rounded-[var(--rb-r-sm,6px)] bg-white/85 px-1.5 text-[11px] font-medium text-neutral-600 uppercase backdrop-blur-sm dark:bg-neutral-950/70 dark:text-neutral-400">
                        {a.ext}
                      </span>
                    </div>
                    <div
                      className={cx("px-1.5 pt-2", dense ? "pb-1" : "pb-1.5")}
                    >
                      <p className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                        {a.name}
                      </p>
                      {!dense && (
                        <div className="mt-0.5 flex items-baseline justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="tabular-nums">
                            {a.width} × {a.height}
                          </span>
                          <span className="shrink-0 tabular-nums">
                            {fileSize(a.sizeKb)}
                          </span>
                        </div>
                      )}
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

"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, MapPin, SlidersHorizontal, X } from "lucide-react";

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
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-900 dark:bg-white"
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

type Candidate = {
  id: string;
  name: string;
  title: string;
  seniority: string;
  location: string;
  comp: number;
  remote: boolean;
  skills: string[];
};

const ALL_SKILLS = [
  "TypeScript",
  "React",
  "GraphQL",
  "Node.js",
  "Go",
  "Kubernetes",
  "PostgreSQL",
  "gRPC",
  "Terraform",
  "AWS",
  "Python",
  "Redis",
  "Kafka",
  "Rust",
];

const SENIORITY = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "staff", label: "Staff / Principal" },
];

const LOCATIONS = [
  { value: "lisbon", label: "Lisbon" },
  { value: "berlin", label: "Berlin" },
  { value: "london", label: "London" },
  { value: "toronto", label: "Toronto" },
  { value: "austin", label: "Austin" },
];

const CANDIDATES: Candidate[] = [
  {
    id: "c1",
    name: "Ana Ferreira",
    title: "Senior Frontend Engineer",
    seniority: "senior",
    location: "lisbon",
    comp: 165,
    remote: true,
    skills: ["TypeScript", "React", "GraphQL", "Node.js"],
  },
  {
    id: "c2",
    name: "Marcus Lindqvist",
    title: "Staff Backend Engineer",
    seniority: "staff",
    location: "berlin",
    comp: 235,
    remote: false,
    skills: ["Go", "Kubernetes", "PostgreSQL", "gRPC"],
  },
  {
    id: "c3",
    name: "Priya Nair",
    title: "Senior Platform Engineer",
    seniority: "senior",
    location: "london",
    comp: 210,
    remote: true,
    skills: ["Go", "Terraform", "AWS", "Kubernetes"],
  },
  {
    id: "c4",
    name: "Diego Santos",
    title: "Fullstack Engineer",
    seniority: "mid",
    location: "lisbon",
    comp: 140,
    remote: true,
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
  },
  {
    id: "c5",
    name: "Hannah Weber",
    title: "Senior Backend Engineer",
    seniority: "senior",
    location: "berlin",
    comp: 195,
    remote: false,
    skills: ["Python", "PostgreSQL", "Redis", "Kafka"],
  },
  {
    id: "c6",
    name: "Yuki Tanaka",
    title: "Staff Frontend Engineer",
    seniority: "staff",
    location: "toronto",
    comp: 225,
    remote: true,
    skills: ["TypeScript", "React", "GraphQL", "Rust"],
  },
  {
    id: "c7",
    name: "Omar Haddad",
    title: "Backend Engineer",
    seniority: "mid",
    location: "london",
    comp: 150,
    remote: false,
    skills: ["Node.js", "PostgreSQL", "Redis", "AWS"],
  },
  {
    id: "c8",
    name: "Sofia Rossi",
    title: "Senior Infrastructure Engineer",
    seniority: "senior",
    location: "berlin",
    comp: 205,
    remote: true,
    skills: ["Terraform", "AWS", "Kubernetes", "Go"],
  },
  {
    id: "c9",
    name: "Liam O'Brien",
    title: "Junior Frontend Engineer",
    seniority: "junior",
    location: "london",
    comp: 125,
    remote: false,
    skills: ["TypeScript", "React", "Node.js"],
  },
  {
    id: "c10",
    name: "Chen Wei",
    title: "Staff Data Engineer",
    seniority: "staff",
    location: "toronto",
    comp: 240,
    remote: true,
    skills: ["Python", "Kafka", "PostgreSQL", "AWS"],
  },
  {
    id: "c11",
    name: "Nadia Petrova",
    title: "Senior Backend Engineer",
    seniority: "senior",
    location: "austin",
    comp: 190,
    remote: true,
    skills: ["Rust", "gRPC", "Redis", "Kubernetes"],
  },
  {
    id: "c12",
    name: "Tomás Alves",
    title: "Platform Engineer",
    seniority: "mid",
    location: "lisbon",
    comp: 145,
    remote: true,
    skills: ["Go", "Terraform", "AWS", "PostgreSQL"],
  },
  {
    id: "c13",
    name: "Grace Kim",
    title: "Senior Fullstack Engineer",
    seniority: "senior",
    location: "toronto",
    comp: 185,
    remote: false,
    skills: ["TypeScript", "React", "Node.js", "GraphQL"],
  },
  {
    id: "c14",
    name: "Felix Braun",
    title: "Junior Backend Engineer",
    seniority: "junior",
    location: "berlin",
    comp: 130,
    remote: false,
    skills: ["Python", "PostgreSQL", "Redis"],
  },
  {
    id: "c15",
    name: "Isabel Moreno",
    title: "Staff Frontend Engineer",
    seniority: "staff",
    location: "austin",
    comp: 230,
    remote: true,
    skills: ["TypeScript", "React", "Rust", "GraphQL"],
  },
  {
    id: "c16",
    name: "Raj Mehta",
    title: "Infrastructure Engineer",
    seniority: "mid",
    location: "london",
    comp: 155,
    remote: true,
    skills: ["Kubernetes", "Terraform", "AWS", "Go"],
  },
];

const COMP_MIN = 120;
const COMP_MAX: number = 260;
const comp = (n: number) => `$${n}k`;

const SORTS = [
  { value: "relevance", label: "Best match" },
  { value: "comp-high", label: "Compensation: high to low" },
  { value: "comp-low", label: "Compensation: low to high" },
  { value: "name", label: "Name" },
];

type Facets = {
  skills: string[];
  seniority: string[];
  comp: [number, number];
  remote: boolean;
  location: string;
};

const EMPTY: Facets = {
  skills: [],
  seniority: [],
  comp: [COMP_MIN, COMP_MAX],
  remote: false,
  location: "any",
};

const matches = (c: Candidate, f: Facets, exclude?: keyof Facets) => {
  if (
    exclude !== "skills" &&
    f.skills.length &&
    !f.skills.every((s) => c.skills.includes(s))
  )
    return false;
  if (
    exclude !== "seniority" &&
    f.seniority.length &&
    !f.seniority.includes(c.seniority)
  )
    return false;
  if (exclude !== "comp" && (c.comp < f.comp[0] || c.comp > f.comp[1]))
    return false;
  if (exclude !== "remote" && f.remote && !c.remote) return false;
  if (
    exclude !== "location" &&
    f.location !== "any" &&
    c.location !== f.location
  )
    return false;
  return true;
};

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

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

export default function Filtering6() {
  const [facets, setFacets] = useState<Facets>(EMPTY);
  const [sort, setSort] = useState("relevance");
  const [railOpen, setRailOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [tokenOpen, setTokenOpen] = useState(false);
  const [activeSug, setActiveSug] = useState(0);
  const tokenRootRef = useRef<HTMLDivElement>(null);
  const tokenInputRef = useRef<HTMLInputElement>(null);

  const toggleSeniority = (value: string) =>
    setFacets((f) => ({
      ...f,
      seniority: f.seniority.includes(value)
        ? f.seniority.filter((v) => v !== value)
        : [...f.seniority, value],
    }));

  const addSkill = (skill: string) => {
    setFacets((f) =>
      f.skills.includes(skill) ? f : { ...f, skills: [...f.skills, skill] },
    );
    setQuery("");
    setActiveSug(0);
    tokenInputRef.current?.focus({ preventScroll: true });
  };

  const removeSkill = (skill: string) =>
    setFacets((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_SKILLS.filter(
      (s) =>
        !facets.skills.includes(s) && (q === "" || s.toLowerCase().includes(q)),
    ).slice(0, 6);
  }, [query, facets.skills]);

  const sugIndex = Math.min(activeSug, Math.max(0, suggestions.length - 1));

  useEffect(() => {
    if (!tokenOpen) return;
    const node = tokenRootRef.current;
    const doc = node?.ownerDocument;
    if (!doc) return;
    const onPointer = (e: Event) => {
      if (!node.contains(e.target as Node)) setTokenOpen(false);
    };
    doc.addEventListener("mousedown", onPointer);
    doc.addEventListener("touchstart", onPointer);
    return () => {
      doc.removeEventListener("mousedown", onPointer);
      doc.removeEventListener("touchstart", onPointer);
    };
  }, [tokenOpen]);

  const onTokenKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (suggestions.length) {
        e.preventDefault();
        addSkill(suggestions[sugIndex]);
      }
    } else if (e.key === "Backspace" && query === "" && facets.skills.length) {
      e.preventDefault();
      removeSkill(facets.skills[facets.skills.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setTokenOpen(true);
      setActiveSug((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSug((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setTokenOpen(false);
    }
  };

  const results = useMemo(() => {
    const list = CANDIDATES.filter((c) => matches(c, facets));
    if (sort === "comp-high") return [...list].sort((a, b) => b.comp - a.comp);
    if (sort === "comp-low") return [...list].sort((a, b) => a.comp - b.comp);
    if (sort === "name")
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return [...list].sort((a, b) => {
      const am = a.skills.filter((s) => facets.skills.includes(s)).length;
      const bm = b.skills.filter((s) => facets.skills.includes(s)).length;
      if (bm !== am) return bm - am;
      return b.comp - a.comp;
    });
  }, [facets, sort]);

  const countSeniority = (value: string) =>
    CANDIDATES.filter(
      (c) => matches(c, facets, "seniority") && c.seniority === value,
    ).length;

  const locationOptions: SelectOption[] = useMemo(
    () => [
      { value: "any", label: "Any location" },
      ...LOCATIONS.map((l) => ({
        value: l.value,
        label: l.label,
        hint: String(
          CANDIDATES.filter(
            (c) => matches(c, facets, "location") && c.location === l.value,
          ).length,
        ),
      })),
    ],
    [facets],
  );

  const compNarrowed =
    facets.comp[0] !== COMP_MIN || facets.comp[1] !== COMP_MAX;

  const chips = [
    ...facets.skills.map((v) => ({
      key: `skill:${v}`,
      label: v,
      clear: () => removeSkill(v),
    })),
    ...facets.seniority.map((v) => ({
      key: `seniority:${v}`,
      label: SENIORITY.find((s) => s.value === v)?.label ?? v,
      clear: () => toggleSeniority(v),
    })),
    ...(compNarrowed
      ? [
          {
            key: "comp",
            label: `${comp(facets.comp[0])} – ${comp(facets.comp[1])}`,
            clear: () =>
              setFacets((f) => ({ ...f, comp: [COMP_MIN, COMP_MAX] })),
          },
        ]
      : []),
    ...(facets.remote
      ? [
          {
            key: "remote",
            label: "Remote only",
            clear: () => setFacets((f) => ({ ...f, remote: false })),
          },
        ]
      : []),
    ...(facets.location !== "any"
      ? [
          {
            key: "location",
            label:
              LOCATIONS.find((l) => l.value === facets.location)?.label ?? "",
            clear: () => setFacets((f) => ({ ...f, location: "any" })),
          },
        ]
      : []),
  ];

  const rail = (
    <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
      <Group label="Skills">
        <div ref={tokenRootRef} className="relative">
          <div
            className={cx(
              "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white p-1.5 transition-colors duration-150 focus-within:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-within:border-white",
              tokenOpen && "border-neutral-900 dark:border-white",
            )}
            onClick={() => {
              setTokenOpen(true);
              tokenInputRef.current?.focus({ preventScroll: true });
            }}
          >
            {facets.skills.map((s) => (
              <span
                key={s}
                className="inline-flex h-6 items-center gap-1 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 pr-1 pl-2 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {s}
                <button
                  type="button"
                  aria-label={`Remove ${s} filter`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSkill(s);
                  }}
                  className={cx(
                    "flex h-4 w-4 cursor-pointer items-center justify-center rounded-[var(--rb-r-xs,4px)] text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-white",
                    transition,
                    focus,
                  )}
                >
                  <X aria-hidden="true" className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              ref={tokenInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setTokenOpen(true);
                setActiveSug(0);
              }}
              onFocus={() => setTokenOpen(true)}
              onKeyDown={onTokenKeyDown}
              placeholder={
                facets.skills.length ? "Add skill…" : "e.g. TypeScript"
              }
              aria-label="Add a required skill"
              className="h-6 min-w-[80px] flex-1 bg-transparent px-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
          </div>

          {tokenOpen && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-30 mt-1.5 max-h-[220px] w-full overflow-y-auto rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-900"
            >
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  role="option"
                  aria-selected={i === sugIndex}
                  onMouseEnter={() => setActiveSug(i)}
                  onClick={() => addSkill(s)}
                  className={cx(
                    "flex h-8 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-sm text-neutral-900 dark:text-neutral-100",
                    i === sugIndex && "bg-neutral-100 dark:bg-neutral-800",
                  )}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Candidates must have every skill. Press Enter to add.
        </p>
      </Group>

      <Group label="Seniority">
        <ul className="space-y-0.5">
          {SENIORITY.map((s) => {
            const n = countSeniority(s.value);
            const on = facets.seniority.includes(s.value);
            return (
              <li key={s.value}>
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
                      onChange={() => toggleSeniority(s.value)}
                      className={checkboxClass}
                    />
                    <Check
                      aria-hidden="true"
                      strokeWidth={3}
                      className={checkboxMark}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{s.label}</span>
                  <span className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                    {n}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group label="Compensation">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-sm text-neutral-900 tabular-nums dark:text-neutral-100">
            {comp(facets.comp[0])} – {comp(facets.comp[1])}
          </span>
          {compNarrowed && (
            <button
              type="button"
              onClick={() =>
                setFacets((f) => ({ ...f, comp: [COMP_MIN, COMP_MAX] }))
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
          min={COMP_MIN}
          max={COMP_MAX}
          step={5}
          value={facets.comp}
          onChange={(next) => setFacets((f) => ({ ...f, comp: next }))}
          format={comp}
          labels={["Minimum compensation", "Maximum compensation"]}
        />
      </Group>

      <Group label="Location & remote">
        <div className="space-y-3">
          <Select
            value={facets.location}
            onChange={(v) => setFacets((f) => ({ ...f, location: v }))}
            options={locationOptions}
            ariaLabel="Filter by location"
            leading={
              <MapPin
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
              />
            }
          />
          <label className="flex h-8 cursor-pointer items-center justify-between gap-2 rounded-[var(--rb-r-md,8px)] px-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900">
            <span>Remote only</span>
            <button
              type="button"
              role="switch"
              aria-checked={facets.remote}
              aria-label="Remote only"
              onClick={() => setFacets((f) => ({ ...f, remote: !f.remote }))}
              className={cx(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-out",
                "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                facets.remote
                  ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                  : "bg-neutral-200 dark:bg-neutral-700",
              )}
            >
              <span
                className={cx(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-neutral-900",
                  facets.remote ? "translate-x-[18px]" : "translate-x-0.5",
                )}
              />
            </button>
          </label>
        </div>
      </Group>
    </div>
  );

  return (
    <div className="flex h-full min-h-[920px] w-full flex-col overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl tracking-[-0.015em] text-neutral-900 dark:text-white">
              Candidate pool
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="tabular-nums">{results.length}</span> of{" "}
              <span className="tabular-nums">{CANDIDATES.length}</span>{" "}
              engineers
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
              ariaLabel="Sort candidates"
              className="w-[220px]"
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
                  onClick={() => {
                    setFacets(EMPTY);
                    setQuery("");
                  }}
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
                  No candidates match these filters
                </p>
                <p className="mt-1 max-w-[300px] text-[13px] text-neutral-500 dark:text-neutral-400">
                  Remove a required skill or widen the compensation range to
                  grow the shortlist.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFacets(EMPTY);
                    setQuery("");
                  }}
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
              <ul className="flex flex-col gap-2.5">
                {results.map((c) => {
                  const location = LOCATIONS.find(
                    (l) => l.value === c.location,
                  )?.label;
                  return (
                    <li key={c.id}>
                      <article
                        className={cx(
                          "flex items-start gap-3.5 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 p-4 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
                          transition,
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                        >
                          {initials(c.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <p className="truncate text-sm text-neutral-900 dark:text-neutral-100">
                              {c.name}
                            </p>
                            <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
                              {c.title}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {c.skills.map((s) => {
                              const on = facets.skills.includes(s);
                              return (
                                <span
                                  key={s}
                                  className={cx(
                                    "inline-flex h-6 items-center rounded-[var(--rb-r-sm,6px)] px-2 text-xs",
                                    on
                                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
                                  )}
                                >
                                  {s}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1 pl-1">
                          <span className="text-sm text-neutral-900 tabular-nums dark:text-neutral-100">
                            {comp(c.comp)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                            <MapPin aria-hidden="true" className="h-3 w-3" />
                            {location}
                            {c.remote && (
                              <span className="text-neutral-400 dark:text-neutral-500">
                                · Remote
                              </span>
                            )}
                          </span>
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

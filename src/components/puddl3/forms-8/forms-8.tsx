"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Boxes, Check, ChevronDown, Plus, Trash2 } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const inputClass =
  "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const primaryButton =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const secondaryButton =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

type FieldType = "text" | "number" | "enum" | "boolean";

type FieldDef = {
  id: string;
  label: string;
  type: FieldType;
  unit?: string;
  options?: string[];
};

const FIELDS: FieldDef[] = [
  { id: "weight", label: "Pallet weight", type: "number", unit: "kg" },
  { id: "height", label: "Pallet height", type: "number", unit: "cm" },
  {
    id: "category",
    label: "SKU category",
    type: "enum",
    options: ["Ambient", "Chilled", "Frozen", "Hazardous", "Fragile"],
  },
  {
    id: "zone",
    label: "Destination zone",
    type: "enum",
    options: ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Cold store", "Overflow"],
  },
  { id: "carrier", label: "Carrier name", type: "text" },
  { id: "reference", label: "Reference code", type: "text" },
  { id: "hazard", label: "Hazardous flag", type: "boolean" },
];

const fieldById = (id: string) => FIELDS.find((f) => f.id === id) ?? FIELDS[0];

type Operator = { id: string; label: string };

const OPERATORS: Record<FieldType, Operator[]> = {
  text: [
    { id: "is", label: "is" },
    { id: "is_not", label: "is not" },
    { id: "contains", label: "contains" },
  ],
  number: [
    { id: "equals", label: "equals" },
    { id: "greater", label: "greater than" },
    { id: "between", label: "between" },
  ],
  enum: [
    { id: "is", label: "is" },
    { id: "is_not", label: "is not" },
    { id: "any_of", label: "is any of" },
  ],
  boolean: [{ id: "is", label: "is" }],
};

type Condition = {
  id: string;
  field: string;
  operator: string;
  value: string;
  value2: string;
  values: string[];
  bool: boolean;
};

type ParamKind = "none" | "select" | "text";

type ActionDef = {
  id: string;
  label: string;
  param: ParamKind;
  options?: string[];
  placeholder?: string;
  phrase: (v: string) => string;
  emptyPhrase: string;
};

const ACTIONS: ActionDef[] = [
  {
    id: "route",
    label: "Route to zone",
    param: "select",
    options: ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Cold store", "Overflow"],
    phrase: (v) => `route it to ${v}`,
    emptyPhrase: "route it to a zone",
  },
  {
    id: "notify",
    label: "Notify",
    param: "select",
    options: [
      "the floor lead",
      "the receiving team",
      "the shift manager",
      "the cold-chain lead",
    ],
    phrase: (v) => `notify ${v}`,
    emptyPhrase: "notify someone",
  },
  {
    id: "priority",
    label: "Set priority",
    param: "select",
    options: ["Standard", "High", "Urgent"],
    phrase: (v) => `set priority to ${v.toLowerCase()}`,
    emptyPhrase: "set a priority",
  },
  {
    id: "hold",
    label: "Place on hold",
    param: "none",
    phrase: () => "place it on hold",
    emptyPhrase: "place it on hold",
  },
  {
    id: "note",
    label: "Add a note",
    param: "text",
    placeholder: "Note text",
    phrase: (v) => `add the note "${v}"`,
    emptyPhrase: "add a note",
  },
];

const actionById = (id: string) =>
  ACTIONS.find((a) => a.id === id) ?? ACTIONS[0];

type ActionRow = { id: string; action: string; value: string };

function newCondition(id: string): Condition {
  const f = FIELDS[0];
  return {
    id,
    field: f.id,
    operator: OPERATORS[f.type][0].id,
    value: "",
    value2: "",
    values: [],
    bool: true,
  };
}

function conditionEmpty(c: Condition): boolean {
  const type = fieldById(c.field).type;
  if (type === "text") return c.value.trim() === "";
  if (type === "number")
    return c.operator === "between"
      ? c.value.trim() === "" || c.value2.trim() === ""
      : c.value.trim() === "";
  if (type === "enum")
    return c.operator === "any_of" ? c.values.length === 0 : c.value === "";
  return false;
}

type Pallet = {
  id: string;
  weight: number;
  height: number;
  category: string;
  zone: string;
  carrier: string;
  reference: string;
  hazard: boolean;
};

const SAMPLE_PALLETS: Pallet[] = [
  {
    id: "PLT-1042",
    weight: 620,
    height: 142,
    category: "Frozen",
    zone: "Cold store",
    carrier: "Nordic Freight",
    reference: "INB-77201",
    hazard: false,
  },
  {
    id: "PLT-1043",
    weight: 480,
    height: 118,
    category: "Frozen",
    zone: "Bay 3",
    carrier: "Harbor Logistics",
    reference: "INB-77202",
    hazard: false,
  },
  {
    id: "PLT-1044",
    weight: 905,
    height: 168,
    category: "Frozen",
    zone: "Overflow",
    carrier: "Nordic Freight",
    reference: "INB-77203",
    hazard: true,
  },
  {
    id: "PLT-1045",
    weight: 750,
    height: 150,
    category: "Frozen",
    zone: "Cold store",
    carrier: "Meridian Cargo",
    reference: "INB-77204",
    hazard: false,
  },
  {
    id: "PLT-1046",
    weight: 300,
    height: 96,
    category: "Ambient",
    zone: "Bay 1",
    carrier: "Harbor Logistics",
    reference: "INB-77205",
    hazard: false,
  },
  {
    id: "PLT-1047",
    weight: 1200,
    height: 184,
    category: "Frozen",
    zone: "Cold store",
    carrier: "Nordic Freight",
    reference: "INB-77206",
    hazard: false,
  },
  {
    id: "PLT-1048",
    weight: 540,
    height: 128,
    category: "Chilled",
    zone: "Bay 2",
    carrier: "Meridian Cargo",
    reference: "INB-77207",
    hazard: false,
  },
  {
    id: "PLT-1049",
    weight: 610,
    height: 134,
    category: "Frozen",
    zone: "Bay 4",
    carrier: "Harbor Logistics",
    reference: "INB-77208",
    hazard: false,
  },
];

function conditionMatches(c: Condition, p: Pallet): boolean {
  const field = fieldById(c.field);
  const raw = (p as unknown as Record<string, unknown>)[field.id];

  if (field.type === "text") {
    const target = String(raw ?? "").toLowerCase();
    const v = c.value.trim().toLowerCase();
    if (v === "") return false;
    if (c.operator === "is_not") return target !== v;
    if (c.operator === "contains") return target.includes(v);
    return target === v;
  }

  if (field.type === "number") {
    const target = Number(raw);
    const a = parseFloat(c.value);
    if (Number.isNaN(a)) return false;
    if (c.operator === "greater") return target > a;
    if (c.operator === "between") {
      const b = parseFloat(c.value2);
      if (Number.isNaN(b)) return false;
      return target >= Math.min(a, b) && target <= Math.max(a, b);
    }
    return target === a;
  }

  if (field.type === "enum") {
    const target = String(raw ?? "");
    if (c.operator === "any_of") return c.values.includes(target);
    if (c.value === "") return false;
    if (c.operator === "is_not") return target !== c.value;
    return target === c.value;
  }

  return Boolean(raw) === c.bool;
}

function joinAnd(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

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
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cx(
          inputClass,
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

const SEED_CONDITIONS: Condition[] = [
  {
    id: "c1",
    field: "weight",
    operator: "greater",
    value: "500",
    value2: "",
    values: [],
    bool: true,
  },
  {
    id: "c2",
    field: "category",
    operator: "is",
    value: "Frozen",
    value2: "",
    values: [],
    bool: true,
  },
  {
    id: "c3",
    field: "hazard",
    operator: "is",
    value: "",
    value2: "",
    values: [],
    bool: false,
  },
];

const SEED_ACTIONS: ActionRow[] = [
  { id: "a1", action: "route", value: "Cold store" },
  { id: "a2", action: "notify", value: "the cold-chain lead" },
];

export default function Forms8() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [conditions, setConditions] = useState<Condition[]>(SEED_CONDITIONS);
  const [matchMode, setMatchMode] = useState<"all" | "any">("all");
  const [actions, setActions] = useState<ActionRow[]>(SEED_ACTIONS);
  const [testResult, setTestResult] = useState<{
    count: number;
    ids: string[];
  } | null>(null);
  const counter = useRef(4);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(t);
  }, [saved]);

  const updateCondition = (id: string, patch: Partial<Condition>) => {
    setTestResult(null);
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  };

  const changeField = (id: string, fieldId: string) => {
    const type = fieldById(fieldId).type;
    updateCondition(id, {
      field: fieldId,
      operator: OPERATORS[type][0].id,
      value: "",
      value2: "",
      values: [],
      bool: true,
    });
  };

  const changeOperator = (id: string, op: string) =>
    updateCondition(id, { operator: op, value: "", value2: "", values: [] });

  const addCondition = () => {
    setTestResult(null);
    const id = `c${counter.current++}`;
    setConditions((prev) => [...prev, newCondition(id)]);
  };

  const removeCondition = (id: string) => {
    setTestResult(null);
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const changeMatchMode = (mode: "all" | "any") => {
    setTestResult(null);
    setMatchMode(mode);
  };

  const handleTest = () => {
    const matched = SAMPLE_PALLETS.filter((p) =>
      matchMode === "all"
        ? conditions.every((c) => conditionMatches(c, p))
        : conditions.some((c) => conditionMatches(c, p)),
    );
    setTestResult({ count: matched.length, ids: matched.map((p) => p.id) });
  };

  const updateAction = (id: string, patch: Partial<ActionRow>) =>
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );

  const changeAction = (id: string, actionId: string) =>
    updateAction(id, { action: actionId, value: "" });

  const summary = useMemo(() => {
    const count = conditions.length;
    if (count === 0) return "";
    const lead =
      count === 1
        ? "When the condition matches"
        : matchMode === "all"
          ? `When all ${count} conditions match`
          : `When any of the ${count} conditions match`;
    const actionPhrases = actions.map((a) => {
      const def = actionById(a.action);
      if (def.param === "none") return def.phrase("");
      return a.value.trim() !== "" ? def.phrase(a.value) : def.emptyPhrase;
    });
    return `${lead}, ${joinAnd(actionPhrases)}.`;
  }, [conditions.length, matchMode, actions]);

  const saveDisabled =
    conditions.length === 0 || conditions.some(conditionEmpty);
  const singleCondition = conditions.length < 2;

  const rowStyle = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? undefined : "translateY(4px)",
    transition: "opacity 200ms ease-out, transform 200ms ease-out",
    transitionDelay: `${Math.min(i, 8) * 20}ms`,
  });

  const renderValueControl = (c: Condition) => {
    const field = fieldById(c.field);
    if (field.type === "text") {
      return (
        <input
          value={c.value}
          onChange={(e) => updateCondition(c.id, { value: e.target.value })}
          aria-label={`${field.label} value`}
          placeholder="Enter a value"
          className={inputClass}
        />
      );
    }
    if (field.type === "number") {
      if (c.operator === "between") {
        return (
          <div className="flex items-center gap-2">
            <input
              value={c.value}
              onChange={(e) =>
                updateCondition(c.id, {
                  value: e.target.value.replace(/[^\d.]/g, ""),
                })
              }
              inputMode="decimal"
              aria-label={`${field.label} lower bound`}
              placeholder="Min"
              className={cx(inputClass, "tabular-nums")}
            />
            <span className="shrink-0 text-[13px] text-neutral-500">and</span>
            <input
              value={c.value2}
              onChange={(e) =>
                updateCondition(c.id, {
                  value2: e.target.value.replace(/[^\d.]/g, ""),
                })
              }
              inputMode="decimal"
              aria-label={`${field.label} upper bound`}
              placeholder="Max"
              className={cx(inputClass, "tabular-nums")}
            />
            {field.unit && (
              <span className="shrink-0 text-[13px] text-neutral-500">
                {field.unit}
              </span>
            )}
          </div>
        );
      }
      return (
        <div className="relative">
          <input
            value={c.value}
            onChange={(e) =>
              updateCondition(c.id, {
                value: e.target.value.replace(/[^\d.]/g, ""),
              })
            }
            inputMode="decimal"
            aria-label={`${field.label} value`}
            placeholder="0"
            className={cx(inputClass, "tabular-nums", field.unit && "pr-10")}
          />
          {field.unit && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-neutral-500">
              {field.unit}
            </span>
          )}
        </div>
      );
    }
    if (field.type === "enum") {
      if (c.operator === "any_of") {
        return (
          <div className="flex flex-wrap gap-1.5">
            {field.options?.map((opt) => {
              const on = c.values.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    updateCondition(c.id, {
                      values: on
                        ? c.values.filter((v) => v !== opt)
                        : [...c.values, opt],
                    })
                  }
                  className={cx(
                    "h-7 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px]",
                    transition,
                    focus,
                    on
                      ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      }
      return (
        <Select
          value={c.value}
          onChange={(v) => updateCondition(c.id, { value: v })}
          options={(field.options ?? []).map((opt) => ({
            value: opt,
            label: opt,
          }))}
          placeholder="Select a value"
        />
      );
    }
    return (
      <div
        role="group"
        aria-label={`${field.label} value`}
        className="inline-flex h-9 items-center gap-1 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900"
      >
        {[
          { on: true, label: "Yes" },
          { on: false, label: "No" },
        ].map((opt) => {
          const active = c.bool === opt.on;
          return (
            <button
              key={opt.label}
              type="button"
              aria-pressed={active}
              onClick={() => updateCondition(c.id, { bool: opt.on })}
              className={cx(
                "h-7 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-3 text-[13px] font-medium",
                transition,
                focus,
                active
                  ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:bg-neutral-950 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
            <div className="min-w-0">
              <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Inbound pallet routing rule
              </h2>
              <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                Match arriving pallets, then decide where they go.
              </p>
            </div>
          </div>

          <div className="space-y-5 p-4 sm:p-5">
            <section style={rowStyle(0)}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  When
                </h3>
                <div
                  role="group"
                  aria-label="Match mode"
                  title={
                    singleCondition
                      ? "Add a second condition to choose how they combine"
                      : undefined
                  }
                  className={cx(
                    "inline-flex h-8 items-center gap-1 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900",
                    singleCondition && "pointer-events-none opacity-50",
                  )}
                >
                  {[
                    { id: "all", label: "Match all" },
                    { id: "any", label: "Match any" },
                  ].map((m) => {
                    const active = matchMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={active}
                        disabled={singleCondition}
                        onClick={() => changeMatchMode(m.id as "all" | "any")}
                        className={cx(
                          "h-6 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] font-medium",
                          transition,
                          focus,
                          active
                            ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:bg-neutral-950 dark:text-neutral-100"
                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200",
                        )}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {conditions.length === 0 ? (
                <div className="flex flex-col items-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 px-6 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900/60">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-white dark:bg-neutral-950">
                    <Boxes
                      aria-hidden="true"
                      className="h-5 w-5 text-neutral-500"
                    />
                  </span>
                  <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
                    This rule has no conditions, so it never runs.
                  </p>
                  <button
                    type="button"
                    onClick={addCondition}
                    className={cx(secondaryButton, "mt-4")}
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Add the first condition
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1.5 dark:border-neutral-800 dark:bg-neutral-900">
                  {conditions.map((c, i) => {
                    const field = fieldById(c.field);
                    return (
                      <div
                        key={c.id}
                        style={rowStyle(i + 1)}
                        className="flex flex-col gap-1.5 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-2 sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-950"
                      >
                        <Select
                          value={c.field}
                          onChange={(v) => changeField(c.id, v)}
                          options={FIELDS.map((f) => ({
                            value: f.id,
                            label: f.label,
                          }))}
                          className="sm:w-[168px] sm:shrink-0"
                        />

                        <Select
                          value={c.operator}
                          onChange={(v) => changeOperator(c.id, v)}
                          options={OPERATORS[field.type].map((op) => ({
                            value: op.id,
                            label: op.label,
                          }))}
                          className="sm:w-[150px] sm:shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          {renderValueControl(c)}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeCondition(c.id)}
                          className={cx(
                            "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center self-end rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 sm:self-auto dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-200",
                            transition,
                            focus,
                          )}
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                          <span className="sr-only">Remove condition</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {conditions.length > 0 && (
                <button
                  type="button"
                  onClick={addCondition}
                  className={cx(secondaryButton, "mt-2 h-8 px-2.5 text-[13px]")}
                >
                  <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                  Add condition
                </button>
              )}

              {testResult && (
                <div
                  role="status"
                  className="mt-3 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-4 py-3 dark:bg-neutral-950"
                >
                  <p className="text-[13px] font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                    {testResult.count} of {SAMPLE_PALLETS.length} sample pallets
                    match
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {testResult.count === 0
                      ? "No sample pallets satisfy the current rule."
                      : testResult.ids.join(", ")}
                  </p>
                </div>
              )}
            </section>

            <section style={rowStyle(2)}>
              <div className="mb-2">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Then
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Actions run in order when the conditions match.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1.5 dark:border-neutral-800 dark:bg-neutral-900">
                {actions.map((a) => {
                  const def = actionById(a.action);
                  return (
                    <div
                      key={a.id}
                      className="flex flex-col gap-1.5 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-2 sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <Select
                        value={a.action}
                        onChange={(v) => changeAction(a.id, v)}
                        options={ACTIONS.map((opt) => ({
                          value: opt.id,
                          label: opt.label,
                        }))}
                        className="sm:w-[200px] sm:shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        {def.param === "select" && (
                          <Select
                            value={a.value}
                            onChange={(v) => updateAction(a.id, { value: v })}
                            options={(def.options ?? []).map((opt) => ({
                              value: opt,
                              label: opt,
                            }))}
                            placeholder="Choose"
                          />
                        )}
                        {def.param === "text" && (
                          <input
                            value={a.value}
                            onChange={(e) =>
                              updateAction(a.id, { value: e.target.value })
                            }
                            aria-label="Action parameter"
                            placeholder={def.placeholder}
                            className={inputClass}
                          />
                        )}
                        {def.param === "none" && (
                          <p className="px-1 text-[13px] text-neutral-500">
                            No parameters for this action.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={rowStyle(3)}>
              <div className="rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-4 py-3 dark:bg-neutral-800/40">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Summary
                </p>
                <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                  {conditions.length === 0
                    ? "Add a condition to describe when this rule runs."
                    : summary}
                </p>
              </div>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-2 bg-neutral-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900/60">
            <button
              type="button"
              onClick={handleTest}
              disabled={saveDisabled}
              className={secondaryButton}
            >
              Test rule
            </button>
            <div className="flex items-center gap-3">
              {saveDisabled && (
                <span className="hidden text-xs text-neutral-500 sm:inline">
                  {conditions.length === 0
                    ? "Add at least one condition"
                    : "Fill in every condition value"}
                </span>
              )}
              <button
                type="button"
                onClick={() => setSaved(true)}
                disabled={saveDisabled}
                className={cx(primaryButton, "flex-1 sm:flex-none")}
              >
                {saved ? "Rule saved" : "Save rule"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Pencil, ShieldCheck } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const inputClass =
  "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxClass =
  "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border border-neutral-300 bg-white transition-colors duration-150 checked:border-neutral-900 checked:bg-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:checked:bg-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxBox =
  "relative inline-flex h-4 w-4 shrink-0 items-center justify-center";

const checkboxMark =
  "pointer-events-none absolute h-3 w-3 text-[var(--rb-accent-fg,oklch(100%_0_0))] opacity-0 transition-opacity duration-150 peer-checked:opacity-100 motion-reduce:transition-none dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]";

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

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

const primaryButton =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const secondaryButton =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const secondarySmall =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-900 transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const STEPS = ["Business", "Coverage", "Property", "Review"];

const INDUSTRIES = [
  { value: "retail", label: "Retail", base: 1200 },
  { value: "hospitality", label: "Hospitality", base: 1600 },
  { value: "professional-services", label: "Professional services", base: 900 },
  { value: "manufacturing", label: "Manufacturing", base: 2100 },
  { value: "construction", label: "Construction", base: 2600 },
];

const COVERAGES = [
  { value: "public-liability", label: "Public liability", cost: 240 },
  { value: "employers-liability", label: "Employers liability", cost: 180 },
  {
    value: "professional-indemnity",
    label: "Professional indemnity",
    cost: 320,
  },
  { value: "product-liability", label: "Product liability", cost: 150 },
  { value: "business-interruption", label: "Business interruption", cost: 410 },
];

const LIMITS = [
  { value: "1m", label: "1,000,000", uplift: 0 },
  { value: "2m", label: "2,000,000", uplift: 180 },
  { value: "5m", label: "5,000,000", uplift: 520 },
];

const TERRITORIES = [
  { value: "uk", label: "United Kingdom" },
  { value: "uk-eu", label: "UK and EU" },
  { value: "worldwide-ex-us", label: "Worldwide excluding US and Canada" },
  { value: "worldwide", label: "Worldwide" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PER_EMPLOYEE = 45;
const DISCOUNT_RATE = 0.075;
const DISCOUNT_MIN_COVERS = 3;

type Data = {
  businessName: string;
  industry: string;
  employees: number;
  coverages: string[];
  limit: string;
  address: string;
  territory: string;
  startDate: string;
  contactName: string;
  email: string;
  phone: string;
};

const INITIAL: Data = {
  businessName: "Copperline Joinery Ltd",
  industry: "construction",
  employees: 18,
  coverages: [
    "public-liability",
    "employers-liability",
    "business-interruption",
  ],
  limit: "2m",
  address: "14 Wharf Road, Manchester M1 2AB",
  territory: "uk",
  startDate: "2026-09-01",
  contactName: "Rebecca Nolan",
  email: "rebecca@copperline.co.uk",
  phone: "+44 161 496 0208",
};

function money(n: number): string {
  const neg = n < 0;
  const [int, frac] = Math.abs(n).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}£${grouped}.${frac}`;
}

function formatDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return "Not set";
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function computePremium(data: Data) {
  const industry = INDUSTRIES.find((i) => i.value === data.industry);
  const base = (industry?.base ?? 0) + data.employees * PER_EMPLOYEE;
  const coverageCost = data.coverages.reduce((sum, v) => {
    const c = COVERAGES.find((cv) => cv.value === v);
    return sum + (c?.cost ?? 0);
  }, 0);
  const uplift = LIMITS.find((l) => l.value === data.limit)?.uplift ?? 0;
  const adjustments = coverageCost + uplift;
  const subtotal = base + adjustments;
  const discountApplies = data.coverages.length >= DISCOUNT_MIN_COVERS;
  const discount = discountApplies
    ? Math.round(subtotal * DISCOUNT_RATE * 100) / 100
    : 0;
  const total = subtotal - discount;
  return { base, adjustments, discount, discountApplies, total };
}

function ReadRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="text-[13px] text-neutral-500">{label}</span>
      <span className="text-[13px] text-neutral-900 dark:text-neutral-100">
        {value}
      </span>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label}>
      <Select id={id} value={value} onChange={onChange} options={options} />
    </Field>
  );
}

function Section({
  id,
  title,
  read,
  edit,
  openId,
  submitted,
  onEdit,
  onCancel,
  onSave,
}: {
  id: string;
  title: string;
  read: ReactNode;
  edit: ReactNode;
  openId: string | null;
  submitted: boolean;
  onEdit: (id: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const open = openId === id;
  const canEdit = openId === null && !submitted;
  return (
    <div className="overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-4 bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        {!open && (
          <button
            type="button"
            onClick={() => onEdit(id)}
            disabled={!canEdit}
            title={
              canEdit ? undefined : "Finish editing the open section first."
            }
            className={secondarySmall}
          >
            <Pencil
              aria-hidden="true"
              className="h-3.5 w-3.5 text-neutral-500"
            />
            Edit
          </button>
        )}
      </div>

      {!open && <div className="px-4 py-2">{read}</div>}

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {open && (
            <div className="space-y-4 px-4 py-4">
              {edit}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className={secondarySmall}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  className={cx(primaryButton, "h-8 px-2.5 text-[13px]")}
                >
                  Save section
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Forms12() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<Data>(INITIAL);
  const [draft, setDraft] = useState<Data | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [accurate, setAccurate] = useState(false);
  const [terms, setTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => setMounted(true), []);

  const premium = computePremium(data);

  const openEdit = (id: string) => {
    setDraft({ ...data, coverages: [...data.coverages] });
    setOpenId(id);
  };
  const saveEdit = () => {
    if (draft) setData(draft);
    setOpenId(null);
    setDraft(null);
  };
  const cancelEdit = () => {
    setOpenId(null);
    setDraft(null);
  };
  const setField = <K extends keyof Data>(key: K, value: Data[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  const toggleCoverage = (value: string) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            coverages: d.coverages.includes(value)
              ? d.coverages.filter((v) => v !== value)
              : [...d.coverages, value],
          }
        : d,
    );

  const industryLabel =
    INDUSTRIES.find((i) => i.value === data.industry)?.label ?? "Not set";
  const limitLabel = LIMITS.find((l) => l.value === data.limit)?.label ?? "";
  const territoryLabel =
    TERRITORIES.find((t) => t.value === data.territory)?.label ?? "Not set";
  const coverageLabels =
    data.coverages
      .map((v) => COVERAGES.find((c) => c.value === v)?.label)
      .filter(Boolean)
      .join(", ") || "None selected";

  const canSubmit = accurate && terms && openId === null;

  const sectionWrap = (index: number, node: ReactNode) => (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? undefined : "translateY(4px)",
        transition: "opacity 200ms ease-out, transform 200ms ease-out",
        transitionDelay: `${Math.min(index, 8) * 20}ms`,
      }}
    >
      {node}
    </div>
  );

  return (
    <div className="flex h-full min-h-[880px] w-full flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[1100px]">
        {submitted ? (
          <div className="mx-auto max-w-[560px] overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--rb-r-2xl,14px)] bg-neutral-100 dark:bg-neutral-800">
                <ShieldCheck
                  aria-hidden="true"
                  className="h-6 w-6 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <h2 className="text-lg font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Quote submitted for binding
              </h2>
              <p className="mt-1.5 max-w-sm text-[13px] text-neutral-500">
                Your reference is{" "}
                <span className="font-mono text-neutral-900 dark:text-neutral-100">
                  BQ-4471-CL
                </span>
                . An underwriter will confirm cover for{" "}
                <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                  {money(premium.total)}
                </span>{" "}
                per year within one business day.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className={cx(secondaryButton, "mt-5")}
              >
                Back to review
              </button>
            </div>
          </div>
        ) : (
          <>
            <ol className="mb-6 flex items-center gap-3">
              {STEPS.map((label, i) => {
                const done = i < STEPS.length - 1;
                const active = i === STEPS.length - 1;
                return (
                  <li
                    key={label}
                    className={cx(
                      "flex min-w-0 items-center gap-3",
                      i < STEPS.length - 1 && "flex-1",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cx(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums transition-[background-color,border-color,color] duration-150 ease-out",
                          done &&
                            "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                          active &&
                            "border border-dashed border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100",
                        )}
                      >
                        {done ? (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span
                        aria-current={active ? "step" : undefined}
                        className={cx(
                          "hidden truncate text-[13px] sm:block",
                          active
                            ? "font-medium text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-500",
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="h-px min-w-4 flex-1 bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                      />
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                {sectionWrap(
                  0,
                  <Section
                    openId={openId}
                    submitted={submitted}
                    onEdit={openEdit}
                    onCancel={cancelEdit}
                    onSave={saveEdit}
                    id="business"
                    title="Business details"
                    read={
                      <>
                        <ReadRow label="Legal name" value={data.businessName} />
                        <ReadRow label="Industry" value={industryLabel} />
                        <ReadRow
                          label="Employees"
                          value={
                            <span className="tabular-nums">
                              {data.employees}
                            </span>
                          }
                        />
                      </>
                    }
                    edit={
                      draft && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Field id="ins-name" label="Legal business name">
                              <input
                                id="ins-name"
                                value={draft.businessName}
                                onChange={(e) =>
                                  setField("businessName", e.target.value)
                                }
                                className={inputClass}
                              />
                            </Field>
                          </div>
                          <SelectField
                            id="ins-industry"
                            label="Industry"
                            value={draft.industry}
                            options={INDUSTRIES}
                            onChange={(v) => setField("industry", v)}
                          />
                          <Field id="ins-employees" label="Number of employees">
                            <input
                              id="ins-employees"
                              type="number"
                              min={1}
                              value={draft.employees}
                              onChange={(e) =>
                                setField(
                                  "employees",
                                  Math.max(0, Number(e.target.value) || 0),
                                )
                              }
                              className={cx(inputClass, "tabular-nums")}
                            />
                          </Field>
                        </div>
                      )
                    }
                  />,
                )}

                {sectionWrap(
                  1,
                  <Section
                    openId={openId}
                    submitted={submitted}
                    onEdit={openEdit}
                    onCancel={cancelEdit}
                    onSave={saveEdit}
                    id="coverage"
                    title="Coverage"
                    read={
                      <>
                        <ReadRow label="Covers" value={coverageLabels} />
                        <ReadRow
                          label="Aggregate limit"
                          value={
                            <span className="tabular-nums">£{limitLabel}</span>
                          }
                        />
                      </>
                    }
                    edit={
                      draft && (
                        <div className="space-y-4">
                          <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Covers to include
                            </legend>
                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                              {COVERAGES.map((c) => (
                                <label
                                  key={c.value}
                                  className="flex cursor-pointer items-center justify-between gap-2.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200/70 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950"
                                >
                                  <span className="flex items-center gap-2.5 text-[13px] text-neutral-900 dark:text-neutral-100">
                                    <span className={checkboxBox}>
                                      <input
                                        type="checkbox"
                                        checked={draft.coverages.includes(
                                          c.value,
                                        )}
                                        onChange={() => toggleCoverage(c.value)}
                                        className={checkboxClass}
                                      />
                                      <Check
                                        aria-hidden="true"
                                        strokeWidth={3}
                                        className={checkboxMark}
                                      />
                                    </span>
                                    {c.label}
                                  </span>
                                  <span className="tabular-nums text-[13px] text-neutral-500">
                                    {money(c.cost)}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                          <SelectField
                            id="ins-limit"
                            label="Aggregate limit"
                            value={draft.limit}
                            options={LIMITS.map((l) => ({
                              value: l.value,
                              label: `£${l.label}`,
                            }))}
                            onChange={(v) => setField("limit", v)}
                          />
                        </div>
                      )
                    }
                  />,
                )}

                {sectionWrap(
                  2,
                  <Section
                    openId={openId}
                    submitted={submitted}
                    onEdit={openEdit}
                    onCancel={cancelEdit}
                    onSave={saveEdit}
                    id="property"
                    title="Property and location"
                    read={
                      <>
                        <ReadRow label="Primary address" value={data.address} />
                        <ReadRow label="Territory" value={territoryLabel} />
                        <ReadRow
                          label="Cover start date"
                          value={
                            <span className="tabular-nums">
                              {formatDate(data.startDate)}
                            </span>
                          }
                        />
                      </>
                    }
                    edit={
                      draft && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Field id="ins-address" label="Primary address">
                              <input
                                id="ins-address"
                                value={draft.address}
                                onChange={(e) =>
                                  setField("address", e.target.value)
                                }
                                className={inputClass}
                              />
                            </Field>
                          </div>
                          <SelectField
                            id="ins-territory"
                            label="Territory"
                            value={draft.territory}
                            options={TERRITORIES}
                            onChange={(v) => setField("territory", v)}
                          />
                          <Field id="ins-start" label="Cover start date">
                            <input
                              id="ins-start"
                              type="date"
                              value={draft.startDate}
                              onChange={(e) =>
                                setField("startDate", e.target.value)
                              }
                              className={cx(inputClass, "tabular-nums")}
                            />
                          </Field>
                        </div>
                      )
                    }
                  />,
                )}

                {sectionWrap(
                  3,
                  <Section
                    openId={openId}
                    submitted={submitted}
                    onEdit={openEdit}
                    onCancel={cancelEdit}
                    onSave={saveEdit}
                    id="contact"
                    title="Contact"
                    read={
                      <>
                        <ReadRow
                          label="Named contact"
                          value={data.contactName}
                        />
                        <ReadRow label="Email" value={data.email} />
                        <ReadRow label="Phone" value={data.phone} />
                      </>
                    }
                    edit={
                      draft && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Field id="ins-contact" label="Named contact">
                              <input
                                id="ins-contact"
                                value={draft.contactName}
                                onChange={(e) =>
                                  setField("contactName", e.target.value)
                                }
                                className={inputClass}
                              />
                            </Field>
                          </div>
                          <Field id="ins-email" label="Email">
                            <input
                              id="ins-email"
                              type="email"
                              value={draft.email}
                              onChange={(e) =>
                                setField("email", e.target.value)
                              }
                              className={inputClass}
                            />
                          </Field>
                          <Field id="ins-phone" label="Phone">
                            <input
                              id="ins-phone"
                              type="tel"
                              value={draft.phone}
                              onChange={(e) =>
                                setField("phone", e.target.value)
                              }
                              className={inputClass}
                            />
                          </Field>
                        </div>
                      )
                    }
                  />,
                )}
              </div>

              <div className="lg:sticky lg:top-6 lg:self-start">
                <div className="overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Premium
                    </h3>
                    <p className="mt-0.5 text-[13px] text-neutral-500">
                      Recalculated from your selections.
                    </p>
                  </div>
                  <div className="space-y-2.5 px-4 py-4">
                    <div className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="text-neutral-500">Base premium</span>
                      <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                        {money(premium.base)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="text-neutral-500">
                        Coverage adjustments
                      </span>
                      <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                        {money(premium.adjustments)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="text-neutral-500">
                        {premium.discountApplies
                          ? "Multi-cover discount (7.5%)"
                          : "Multi-cover discount"}
                      </span>
                      <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                        {premium.discountApplies
                          ? money(-premium.discount)
                          : "Not applied"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-4 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/40">
                      <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        Annual total
                      </span>
                      <span className="text-base font-medium tabular-nums tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                        {money(premium.total)}
                      </span>
                    </div>
                    {!premium.discountApplies && (
                      <p className="text-xs text-neutral-500">
                        Add {DISCOUNT_MIN_COVERS} or more covers to qualify for
                        the multi-cover discount.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <span className={cx(checkboxBox, "mt-0.5")}>
                      <input
                        type="checkbox"
                        checked={accurate}
                        onChange={(e) => setAccurate(e.target.checked)}
                        className={checkboxClass}
                      />
                      <Check
                        aria-hidden="true"
                        strokeWidth={3}
                        className={checkboxMark}
                      />
                    </span>
                    <span className="text-[13px] text-neutral-900 dark:text-neutral-100">
                      I confirm the information above is accurate to the best of
                      my knowledge.
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <span className={cx(checkboxBox, "mt-0.5")}>
                      <input
                        type="checkbox"
                        checked={terms}
                        onChange={(e) => setTerms(e.target.checked)}
                        className={checkboxClass}
                      />
                      <Check
                        aria-hidden="true"
                        strokeWidth={3}
                        className={checkboxMark}
                      />
                    </span>
                    <span className="text-[13px] text-neutral-900 dark:text-neutral-100">
                      I accept the policy terms and the statement of fact.
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => canSubmit && setSubmitted(true)}
                  disabled={!canSubmit}
                  title={
                    openId !== null
                      ? "Save or cancel the open section first."
                      : !canSubmit
                        ? "Confirm both statements to continue."
                        : undefined
                  }
                  className={cx(primaryButton, "mt-4 w-full")}
                >
                  Request bound quote
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

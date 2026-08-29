"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Hash,
  X,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const dateField =
  "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

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

const STEPS = [
  { label: "Customer", hint: "Who is billed" },
  { label: "Line items", hint: "What they owe" },
  { label: "Tax and discount", hint: "Adjustments" },
  { label: "Review and send", hint: "Confirm" },
];

const CURRENCIES: SelectOption[] = [
  { value: "usd", label: "USD", hint: "US dollar" },
  { value: "eur", label: "EUR", hint: "Euro" },
  { value: "gbp", label: "GBP", hint: "Pound sterling" },
  { value: "cad", label: "CAD", hint: "Canadian dollar" },
];

const TERMS: SelectOption[] = [
  { value: "due", label: "Due on receipt" },
  { value: "net14", label: "Net 14" },
  { value: "net30", label: "Net 30" },
  { value: "net60", label: "Net 60" },
];

const COLLECTION: SelectOption[] = [
  { value: "ach", label: "ACH transfer" },
  { value: "card", label: "Charge card on file" },
  { value: "wire", label: "Wire transfer" },
  { value: "manual", label: "Send invoice only" },
];

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

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
      >
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export default function Billing3() {
  const [customer, setCustomer] = useState("Northwind Retail");
  const [taxId, setTaxId] = useState("US-88-2947135");
  const [number, setNumber] = useState("INV-20437");
  const [po, setPo] = useState("PO-4471");
  const [issue, setIssue] = useState("2026-06-16");
  const [due, setDue] = useState("2026-06-30");
  const [currency, setCurrency] = useState("usd");
  const [terms, setTerms] = useState("net14");
  const [collection, setCollection] = useState("ach");
  const [address, setAddress] = useState("14 Warren Street, Suite 620");
  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  const current = 0;

  return (
    <div className="flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto flex min-h-0 w-full max-w-[900px] flex-1 flex-col",
        )}
      >
        <div
          className={cx(
            panel,
            "flex items-start justify-between gap-3 px-4 py-3",
          )}
        >
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              New invoice
            </h2>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              Step {current + 1} of {STEPS.length} · {STEPS[current].label}
            </p>
          </div>
          <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] border border-neutral-200 px-2 text-[12px] text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-amber-500"
            />
            Draft {number}
          </span>
        </div>

        <div
          className={cx(
            panel,
            "relative mt-1 flex min-h-0 flex-1 flex-col overflow-hidden",
          )}
        >
          <div
            ref={ref}
            onScroll={onScroll}
            className="min-h-0 flex-1 overflow-y-auto p-5"
          >
            <ol className="flex items-start gap-2">
              {STEPS.map((step, i) => (
                <li
                  key={step.label}
                  className="flex min-w-0 flex-1 items-start gap-2"
                >
                  <div className="flex min-w-0 flex-col items-start gap-1.5">
                    <span
                      aria-current={i === current ? "step" : undefined}
                      className={cx(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums",
                        transition,
                        i < current &&
                          "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                        i === current &&
                          "border border-dashed border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100",
                        i > current &&
                          "border border-neutral-200 bg-white text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-600",
                      )}
                    >
                      {i < current ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="hidden min-w-0 sm:block">
                      <p
                        className={cx(
                          "truncate text-[13px] font-medium",
                          i === current
                            ? "text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-500",
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="truncate text-xs text-neutral-400">
                        {step.hint}
                      </p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className={cx(
                        "mt-3 h-px min-w-4 flex-1",
                        i < current
                          ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                          : "bg-neutral-200 dark:bg-neutral-800",
                      )}
                    />
                  )}
                </li>
              ))}
            </ol>

            <section className="mt-7">
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                Customer
              </h3>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                Billable account and invoice reference.
              </p>
              <div className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <Field label="Customer" htmlFor="billing-3-customer">
                  <div className="relative">
                    <input
                      id="billing-3-customer"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className={cx(field, "pr-8", focus)}
                    />
                    {customer && (
                      <button
                        type="button"
                        aria-label="Clear customer"
                        onClick={() => setCustomer("")}
                        className={cx(
                          "absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--rb-r-xs,4px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                          transition,
                          focus,
                        )}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </Field>
                <Field label="Tax ID" htmlFor="billing-3-tax">
                  <div className="relative">
                    <Building2
                      className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                      aria-hidden
                    />
                    <input
                      id="billing-3-tax"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className={cx(field, "pl-8 tabular-nums", focus)}
                    />
                  </div>
                </Field>
                <Field label="Invoice number" htmlFor="billing-3-number">
                  <div className="relative">
                    <Hash
                      className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                      aria-hidden
                    />
                    <input
                      id="billing-3-number"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className={cx(field, "pl-8 tabular-nums", focus)}
                    />
                  </div>
                </Field>
                <Field
                  label="PO reference"
                  htmlFor="billing-3-po"
                  hint="Optional. Printed on the invoice header."
                >
                  <input
                    id="billing-3-po"
                    value={po}
                    onChange={(e) => setPo(e.target.value)}
                    className={cx(field, "tabular-nums", focus)}
                  />
                </Field>
              </div>
            </section>

            <section className="mt-7">
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                Terms
              </h3>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                Dates, currency, and how the balance is collected.
              </p>
              <div className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <Field label="Issue date" htmlFor="billing-3-issue">
                  <div className="relative">
                    <Calendar
                      className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                      aria-hidden
                    />
                    <input
                      id="billing-3-issue"
                      type="date"
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      className={cx(
                        field,
                        dateField,
                        "pl-8 tabular-nums",
                        focus,
                      )}
                    />
                  </div>
                </Field>
                <Field label="Due date" htmlFor="billing-3-due">
                  <div className="relative">
                    <Calendar
                      className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                      aria-hidden
                    />
                    <input
                      id="billing-3-due"
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                      className={cx(
                        field,
                        dateField,
                        "pl-8 tabular-nums",
                        focus,
                      )}
                    />
                  </div>
                </Field>
                <Field label="Currency" htmlFor="billing-3-currency">
                  <Select
                    id="billing-3-currency"
                    value={currency}
                    onChange={setCurrency}
                    options={CURRENCIES}
                  />
                </Field>
                <Field label="Payment terms" htmlFor="billing-3-terms">
                  <Select
                    id="billing-3-terms"
                    value={terms}
                    onChange={setTerms}
                    options={TERMS}
                  />
                </Field>
                <Field label="Collection" htmlFor="billing-3-collection">
                  <Select
                    id="billing-3-collection"
                    value={collection}
                    onChange={setCollection}
                    options={COLLECTION}
                  />
                </Field>
                <Field label="Billing address" htmlFor="billing-3-address">
                  <input
                    id="billing-3-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={cx(field, focus)}
                  />
                </Field>
              </div>
            </section>
          </div>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
              edges.start ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
              edges.end ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <div
          className={cx(
            panel,
            "mt-1 flex items-center justify-between gap-3 px-4 py-3",
          )}
        >
          <p className="hidden text-[12px] text-neutral-500 sm:block">
            Saved automatically as a draft.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cx(
                "inline-flex h-9 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              Save draft
            </button>
            <button
              type="button"
              className={cx(
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              Next step
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

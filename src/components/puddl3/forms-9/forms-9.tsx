"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const checkboxClass =
  "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border border-neutral-300 bg-white transition-colors duration-150 checked:border-neutral-900 checked:bg-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:checked:bg-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxBox =
  "relative inline-flex h-4 w-4 shrink-0 items-center justify-center";

const checkboxMark =
  "pointer-events-none absolute h-3 w-3 text-[var(--rb-accent-fg,oklch(100%_0_0))] opacity-0 transition-opacity duration-150 peer-checked:opacity-100 motion-reduce:transition-none dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]";

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

const selectError =
  "border-red-500 hover:border-red-500 focus:border-red-500 focus-visible:outline-red-500 dark:border-red-500 dark:hover:border-red-500 dark:focus:border-red-500 dark:focus-visible:outline-red-500";

const field =
  "h-8 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] tabular-nums text-neutral-900 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white";

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

const primaryButton =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const secondaryButton =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const iconButton =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-600 transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const STEP = 30;
const TIME_OPTIONS: { value: number; label: string }[] = [];
for (let m = 0; m <= 1440; m += STEP) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  let label: string;
  if (m === 0 || m === 1440) {
    label = "12:00 AM";
  } else {
    const period = h < 12 ? "AM" : "PM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    label = `${hr}:${min === 0 ? "00" : min} ${period}`;
  }
  TIME_OPTIONS.push({ value: m, label });
}

type Interval = { from: number; to: number };
type Day = { open: boolean; intervals: Interval[] };

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const WEEKDAYS = [1, 2, 3, 4];

const INITIAL_DAYS: Day[] = [
  {
    open: true,
    intervals: [
      { from: 480, to: 720 },
      { from: 780, to: 1080 },
    ],
  },
  {
    open: true,
    intervals: [
      { from: 480, to: 720 },
      { from: 780, to: 1080 },
    ],
  },
  {
    open: true,
    intervals: [
      { from: 480, to: 720 },
      { from: 780, to: 1080 },
    ],
  },
  {
    open: true,
    intervals: [
      { from: 480, to: 720 },
      { from: 780, to: 1140 },
    ],
  },
  {
    open: true,
    intervals: [
      { from: 480, to: 720 },
      { from: 780, to: 1020 },
    ],
  },
  { open: true, intervals: [{ from: 540, to: 780 }] },
  { open: false, intervals: [{ from: 540, to: 780 }] },
];

const TIMEZONES = [
  { value: "america-new_york", label: "New York (GMT-05:00)" },
  { value: "america-chicago", label: "Chicago (GMT-06:00)" },
  { value: "america-denver", label: "Denver (GMT-07:00)" },
  { value: "america-los_angeles", label: "Los Angeles (GMT-08:00)" },
  { value: "europe-london", label: "London (GMT+00:00)" },
];

const INITIAL_TZ = "america-chicago";
const INITIAL_HOLIDAYS = false;

const cloneDays = (days: Day[]): Day[] =>
  days.map((d) => ({
    open: d.open,
    intervals: d.intervals.map((iv) => ({ ...iv })),
  }));

function validateDay(day: Day): { bad: Set<number>; message: string | null } {
  const bad = new Set<number>();
  if (!day.open) return { bad, message: null };

  let message: string | null = null;
  day.intervals.forEach((iv, i) => {
    if (iv.to <= iv.from) {
      bad.add(i);
      if (!message) message = "End time must be later than the start time.";
    }
  });

  for (let i = 0; i < day.intervals.length; i++) {
    for (let j = i + 1; j < day.intervals.length; j++) {
      const a = day.intervals[i];
      const b = day.intervals[j];
      if (a.to <= a.from || b.to <= b.from) continue;
      if (a.from < b.to && b.from < a.to) {
        bad.add(i);
        bad.add(j);
        message =
          "These time ranges overlap. Adjust them so they do not clash.";
      }
    }
  }

  return { bad, message };
}

function dayMinutes(day: Day): number {
  if (!day.open) return 0;
  return day.intervals.reduce(
    (sum, iv) => sum + (iv.to > iv.from ? iv.to - iv.from : 0),
    0,
  );
}

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function TimeSelect({
  id,
  value,
  invalid,
  ariaLabel,
  onChange,
}: {
  id: string;
  value: number;
  invalid: boolean;
  ariaLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <Select
      id={id}
      value={String(value)}
      ariaLabel={ariaLabel}
      onChange={(v) => onChange(Number(v))}
      options={TIME_OPTIONS.map((o) => ({
        value: String(o.value),
        label: o.label,
      }))}
      className="min-w-0 flex-1"
      triggerClassName={cx(invalid && selectError)}
    />
  );
}

export default function Forms9() {
  const [mounted, setMounted] = useState(false);
  const [days, setDays] = useState<Day[]>(() => cloneDays(INITIAL_DAYS));
  const [timezone, setTimezone] = useState(INITIAL_TZ);
  const [holidays, setHolidays] = useState(INITIAL_HOLIDAYS);
  const [baseline, setBaseline] = useState(() => ({
    days: cloneDays(INITIAL_DAYS),
    timezone: INITIAL_TZ,
    holidays: INITIAL_HOLIDAYS,
  }));
  const [justSaved, setJustSaved] = useState(false);
  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!justSaved) return;
    const t = window.setTimeout(() => setJustSaved(false), 2500);
    return () => window.clearTimeout(t);
  }, [justSaved]);

  const validations = useMemo(() => days.map(validateDay), [days]);
  const hasErrors = validations.some((v) => v.message !== null);

  const weeklyMinutes = useMemo(
    () => days.reduce((sum, d) => sum + dayMinutes(d), 0),
    [days],
  );

  const dirty = useMemo(() => {
    if (timezone !== baseline.timezone || holidays !== baseline.holidays)
      return true;
    return JSON.stringify(days) !== JSON.stringify(baseline.days);
  }, [days, timezone, holidays, baseline]);

  const mutateDay = (index: number, next: (day: Day) => Day) => {
    setDays((prev) => prev.map((d, i) => (i === index ? next(d) : d)));
  };

  const toggleDay = (index: number) => {
    mutateDay(index, (d) => ({ ...d, open: !d.open }));
  };

  const setInterval = (
    dayIndex: number,
    ivIndex: number,
    key: keyof Interval,
    value: number,
  ) => {
    mutateDay(dayIndex, (d) => ({
      ...d,
      intervals: d.intervals.map((iv, i) =>
        i === ivIndex ? { ...iv, [key]: value } : iv,
      ),
    }));
  };

  const addInterval = (dayIndex: number) => {
    mutateDay(dayIndex, (d) => ({
      ...d,
      intervals: [...d.intervals, { from: 780, to: 1020 }],
    }));
  };

  const removeInterval = (dayIndex: number, ivIndex: number) => {
    mutateDay(dayIndex, (d) => ({
      ...d,
      intervals: d.intervals.filter((_, i) => i !== ivIndex),
    }));
  };

  const copyMondayToWeekdays = () => {
    setDays((prev) => {
      const monday = prev[0];
      return prev.map((d, i) =>
        WEEKDAYS.includes(i)
          ? {
              open: monday.open,
              intervals: monday.intervals.map((iv) => ({ ...iv })),
            }
          : d,
      );
    });
  };

  const reset = () => {
    setDays(cloneDays(baseline.days));
    setTimezone(baseline.timezone);
    setHolidays(baseline.holidays);
  };

  const save = () => {
    setBaseline({ days: cloneDays(days), timezone, holidays });
    setJustSaved(true);
  };

  return (
    <div className="flex h-full min-h-[800px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div
        className="mx-auto w-full max-w-[760px]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? undefined : "translateY(4px)",
          transition: "opacity 200ms ease-out, transform 200ms ease-out",
        }}
      >
        <div className="overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4 bg-neutral-50 px-5 py-4 dark:bg-neutral-900/60">
            <div className="min-w-0">
              <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Opening hours
              </h2>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                When your veterinary practice takes appointments.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                Weekly total
              </p>
              <p className="text-lg font-medium tabular-nums tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                {formatHours(weeklyMinutes)} h
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 bg-white px-5 py-3.5 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <label
                htmlFor="hours-timezone"
                className="shrink-0 text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
              >
                Time zone
              </label>
              <Select
                id="hours-timezone"
                value={timezone}
                onChange={(v) => setTimezone(v)}
                options={TIMEZONES.map((tz) => ({
                  value: tz.value,
                  label: tz.label,
                }))}
                className="min-w-0 flex-1 sm:w-56 sm:flex-none"
              />
            </div>
            <button
              type="button"
              onClick={copyMondayToWeekdays}
              className={cx(secondaryButton, "h-8 shrink-0")}
            >
              <Copy
                aria-hidden="true"
                className="h-3.5 w-3.5 text-neutral-500"
              />
              Copy Monday to weekdays
            </button>
          </div>

          <div className="relative bg-neutral-50 dark:bg-neutral-900/60">
            <div
              ref={ref}
              onScroll={onScroll}
              className="max-h-[404px] overflow-y-auto p-1.5"
            >
              <div className="flex flex-col gap-1.5">
                {days.map((day, dayIndex) => {
                  const v = validations[dayIndex];
                  const subtotal = dayMinutes(day);
                  const errorId = `hours-day-${dayIndex}-error`;
                  return (
                    <div
                      key={DAY_NAMES[dayIndex]}
                      className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
                      style={{
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? undefined : "translateY(4px)",
                        transition:
                          "opacity 200ms ease-out, transform 200ms ease-out",
                        transitionDelay: `${Math.min(dayIndex, 8) * 20}ms`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={day.open}
                          aria-label={`${DAY_NAMES[dayIndex]} open`}
                          onClick={() => toggleDay(dayIndex)}
                          className={cx(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-out",
                            "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                            day.open
                              ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                              : "bg-neutral-200 dark:bg-neutral-700",
                          )}
                        >
                          <span
                            className={cx(
                              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-neutral-900",
                              day.open
                                ? "translate-x-[18px]"
                                : "translate-x-0.5",
                            )}
                          />
                        </button>

                        <span className="w-24 shrink-0 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                          {DAY_NAMES[dayIndex]}
                        </span>

                        <span className="ml-auto text-[13px] tabular-nums text-neutral-500">
                          {day.open ? `${formatHours(subtotal)} h` : "Closed"}
                        </span>
                      </div>

                      <div
                        className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
                        style={{ gridTemplateRows: day.open ? "1fr" : "0fr" }}
                      >
                        <div className="overflow-hidden">
                          {day.open && (
                            <div className="mt-3 space-y-2">
                              {day.intervals.map((iv, ivIndex) => {
                                const invalid = v.bad.has(ivIndex);
                                return (
                                  <div
                                    key={ivIndex}
                                    className="flex items-center gap-2"
                                  >
                                    <TimeSelect
                                      id={`hours-${dayIndex}-${ivIndex}-from`}
                                      value={iv.from}
                                      invalid={invalid}
                                      ariaLabel={`${DAY_NAMES[dayIndex]} interval ${ivIndex + 1} opens at`}
                                      onChange={(value) =>
                                        setInterval(
                                          dayIndex,
                                          ivIndex,
                                          "from",
                                          value,
                                        )
                                      }
                                    />
                                    <span
                                      aria-hidden="true"
                                      className="shrink-0 text-[13px] text-neutral-400"
                                    >
                                      to
                                    </span>
                                    <TimeSelect
                                      id={`hours-${dayIndex}-${ivIndex}-to`}
                                      value={iv.to}
                                      invalid={invalid}
                                      ariaLabel={`${DAY_NAMES[dayIndex]} interval ${ivIndex + 1} closes at`}
                                      onChange={(value) =>
                                        setInterval(
                                          dayIndex,
                                          ivIndex,
                                          "to",
                                          value,
                                        )
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeInterval(dayIndex, ivIndex)
                                      }
                                      disabled={day.intervals.length === 1}
                                      title={
                                        day.intervals.length === 1
                                          ? "Keep at least one time range, or close the day."
                                          : "Remove this time range"
                                      }
                                      className={iconButton}
                                    >
                                      <Trash2
                                        aria-hidden="true"
                                        className="h-4 w-4"
                                      />
                                      <span className="sr-only">
                                        Remove time range
                                      </span>
                                    </button>
                                  </div>
                                );
                              })}

                              {v.message && (
                                <p
                                  id={errorId}
                                  className="text-xs text-red-600 dark:text-red-400"
                                >
                                  {v.message}
                                </p>
                              )}

                              <button
                                type="button"
                                onClick={() => addInterval(dayIndex)}
                                className={cx(
                                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                                  transition,
                                  focus,
                                )}
                              >
                                <Plus
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5"
                                />
                                Add hours
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                edges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                edges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>

          <div className="bg-white px-5 py-3.5 dark:bg-neutral-900">
            <label
              htmlFor="hours-holidays"
              className="flex cursor-pointer items-center gap-2.5"
            >
              <span className={checkboxBox}>
                <input
                  id="hours-holidays"
                  type="checkbox"
                  checked={holidays}
                  onChange={(e) => setHolidays(e.target.checked)}
                  className={checkboxClass}
                />
                <Check
                  aria-hidden="true"
                  strokeWidth={3}
                  className={checkboxMark}
                />
              </span>
              <span className="text-[13px] text-neutral-900 dark:text-neutral-100">
                Accept bookings on public holidays
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 bg-neutral-50 px-5 py-3.5 dark:bg-neutral-900/60">
            <p className="text-xs text-neutral-500">
              {hasErrors
                ? "Fix the highlighted time ranges to save."
                : justSaved
                  ? "Opening hours saved."
                  : dirty
                    ? "You have unsaved changes."
                    : "All hours are up to date."}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={!dirty}
                title={dirty ? undefined : "No changes to reset"}
                className={secondaryButton}
              >
                <RotateCcw
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-neutral-500"
                />
                Reset
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!dirty || hasErrors}
                title={
                  hasErrors
                    ? "Resolve the errors above before saving."
                    : !dirty
                      ? "No changes to save"
                      : undefined
                }
                className={primaryButton}
              >
                Save hours
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

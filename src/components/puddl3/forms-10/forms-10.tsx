"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, CheckCircle2, ChevronDown } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

function useScrollFadeX<T extends HTMLElement>() {
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

const inputClass =
  "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const textareaClass =
  "min-h-20 w-full resize-none rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const radioClass =
  "h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border border-neutral-300 bg-white transition-colors duration-150 checked:border-[5px] checked:border-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxClass =
  "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border border-neutral-300 bg-white transition-colors duration-150 checked:border-neutral-900 checked:bg-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:checked:bg-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxBox =
  "relative inline-flex h-4 w-4 shrink-0 items-center justify-center";

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

const PROPERTIES = [
  { value: "harbour-court", label: "Harbour Court, Bristol" },
  { value: "the-old-mill", label: "The Old Mill, Bath" },
  { value: "west-quay", label: "West Quay, Falmouth" },
  { value: "granary-house", label: "Granary House, York" },
];

const MATRIX_STATEMENTS = [
  "The room was clean and well kept",
  "Check-in and check-out were smooth",
  "Staff were attentive and helpful",
  "Breakfast met your expectations",
];

const MATRIX_RATINGS = [
  "Poor",
  "Fair",
  "Good",
  "Very good",
  "Excellent",
] as const;

const STOOD_OUT = [
  { value: "location", label: "The location" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "front-desk", label: "The front desk team" },
  { value: "breakfast", label: "Breakfast" },
  { value: "value", label: "Value for money" },
];

const NOTHING = "nothing";
const FOLLOWUP_LIMIT = 300;

function ScoreScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rovingIndex = value ?? 0;

  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = [
      "ArrowRight",
      "ArrowLeft",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    let next = rovingIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowUp")
      next = Math.min(10, rovingIndex + 1);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown")
      next = Math.max(0, rovingIndex - 1);
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = 10;
    onChange(next);
    btnRefs.current[next]?.focus({ preventScroll: true });
  };

  return (
    <div
      role="radiogroup"
      aria-label="How likely are you to recommend us"
      onKeyDown={move}
      className="flex flex-wrap gap-1.5"
    >
      {Array.from({ length: 11 }, (_, i) => {
        const selected = value === i;
        return (
          <button
            key={i}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${i} out of 10`}
            tabIndex={i === rovingIndex ? 0 : -1}
            onClick={() => onChange(i)}
            className={cx(
              "flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-md,8px)] border text-sm tabular-nums",
              transition,
              focus,
              selected
                ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900",
            )}
          >
            {i}
          </button>
        );
      })}
    </div>
  );
}

export default function Forms10() {
  const [mounted, setMounted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [property, setProperty] = useState("");
  const [reference, setReference] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<(number | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [stoodOut, setStoodOut] = useState<string[]>([]);
  const [followup, setFollowup] = useState("");

  const {
    ref: matrixRef,
    edges: matrixEdges,
    onScroll: onMatrixScroll,
  } = useScrollFadeX<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  const lowScore = score !== null && score <= 6;

  const toggleStoodOut = (value: string) => {
    if (value === NOTHING) {
      setStoodOut((prev) => (prev.includes(NOTHING) ? [] : [NOTHING]));
      return;
    }
    setStoodOut((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev.filter((v) => v !== NOTHING), value],
    );
  };

  const setMatrixRow = (row: number, rating: number) => {
    setMatrix((prev) => prev.map((v, i) => (i === row ? rating : v)));
  };

  const questions = useMemo(() => {
    const list = [
      property !== "",
      score !== null,
      matrix[0] !== null,
      matrix[1] !== null,
      matrix[2] !== null,
      matrix[3] !== null,
      stoodOut.length > 0,
    ];
    if (lowScore) list.push(followup.trim() !== "");
    return list;
  }, [property, score, matrix, stoodOut, lowScore, followup]);

  const answered = questions.filter(Boolean).length;
  const total = questions.length;
  const canSubmit = answered === total;

  const fieldWrap = (delay: number, node: React.ReactNode) => (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? undefined : "translateY(4px)",
        transition: "opacity 200ms ease-out, transform 200ms ease-out",
        transitionDelay: `${delay}ms`,
      }}
    >
      {node}
    </div>
  );

  return (
    <div className="flex h-full min-h-[1080px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {submitted ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--rb-r-2xl,14px)] bg-neutral-100 dark:bg-neutral-800">
                <CheckCircle2
                  aria-hidden="true"
                  className="h-6 w-6 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <h2 className="text-lg font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Thank you for your feedback
              </h2>
              <p className="mt-1.5 max-w-sm text-[13px] text-neutral-500">
                We logged your visit to{" "}
                {PROPERTIES.find((p) => p.value === property)?.label ??
                  "our property"}{" "}
                with a recommendation score of{" "}
                <span className="font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                  {score}
                </span>{" "}
                out of 10. The property manager reads every response.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className={cx(secondaryButton, "mt-5")}
              >
                Edit my answers
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 bg-neutral-50 px-5 py-4 dark:bg-neutral-900/60">
                <div className="min-w-0">
                  <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                    How was your stay
                  </h2>
                  <p className="mt-0.5 text-[13px] text-neutral-500">
                    A few questions about your recent visit.
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] tabular-nums text-neutral-500">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {answered}
                    </span>{" "}
                    / {total} answered
                  </p>
                  <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] transition-[width] duration-200 ease-out dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                      style={{ width: `${(answered / total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 px-5 py-5">
                {fieldWrap(
                  0,
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="survey-property"
                        className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                      >
                        Property visited
                        <span aria-hidden="true" className="text-neutral-400">
                          {" "}
                          *
                        </span>
                      </label>
                      <Select
                        id="survey-property"
                        value={property}
                        onChange={(v) => setProperty(v)}
                        options={PROPERTIES.map((p) => ({
                          value: p.value,
                          label: p.label,
                        }))}
                        placeholder="Select a property"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="survey-reference"
                        className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                      >
                        Reservation reference
                      </label>
                      <input
                        id="survey-reference"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="e.g. HC-48213"
                        className={inputClass}
                      />
                      <p className="text-xs text-neutral-500">
                        Optional. Found on your booking email.
                      </p>
                    </div>
                  </div>,
                )}

                {fieldWrap(
                  20,
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      How likely are you to recommend us to a friend
                      <span aria-hidden="true" className="text-neutral-400">
                        {" "}
                        *
                      </span>
                    </label>
                    <ScoreScale value={score} onChange={setScore} />
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>0: Would not recommend</span>
                      <span>10: Would recommend</span>
                    </div>
                  </div>,
                )}

                <div
                  className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
                  style={{ gridTemplateRows: lowScore ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    {lowScore && (
                      <div className="space-y-1.5 pt-0.5">
                        <label
                          htmlFor="survey-followup"
                          className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                        >
                          What would have made your stay better
                          <span aria-hidden="true" className="text-neutral-400">
                            {" "}
                            *
                          </span>
                        </label>
                        <textarea
                          id="survey-followup"
                          value={followup}
                          maxLength={FOLLOWUP_LIMIT}
                          onChange={(e) => setFollowup(e.target.value)}
                          aria-describedby="survey-followup-help"
                          placeholder="Tell us what fell short so we can put it right."
                          className={textareaClass}
                        />
                        <div className="flex items-center justify-between">
                          <p
                            id="survey-followup-help"
                            className="text-xs text-neutral-500"
                          >
                            Required because you scored 6 or below.
                          </p>
                          <p className="text-xs tabular-nums text-neutral-400">
                            {followup.length} / {FOLLOWUP_LIMIT}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {fieldWrap(
                  40,
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Rate the following
                      <span aria-hidden="true" className="text-neutral-400">
                        {" "}
                        *
                      </span>
                    </p>
                    <div className="relative overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <div
                        ref={matrixRef}
                        onScroll={onMatrixScroll}
                        style={{ touchAction: "pan-x" }}
                        className="overflow-x-auto"
                      >
                        <div className="min-w-[460px] p-3">
                          <div className="grid grid-cols-[minmax(140px,1.4fr)_repeat(5,minmax(52px,1fr))] items-end gap-y-2">
                            <span aria-hidden="true" />
                            {MATRIX_RATINGS.map((r) => (
                              <span
                                key={r}
                                aria-hidden="true"
                                className="px-1 text-center text-[11px] leading-tight text-neutral-500"
                              >
                                {r}
                              </span>
                            ))}
                            {MATRIX_STATEMENTS.map((statement, row) => (
                              <div
                                key={statement}
                                role="radiogroup"
                                aria-label={statement}
                                className="col-span-6 grid grid-cols-subgrid items-center rounded-[var(--rb-r-md,8px)] bg-white px-2 py-2 dark:bg-neutral-950"
                              >
                                <span className="pr-2 text-[13px] text-neutral-900 dark:text-neutral-100">
                                  {statement}
                                </span>
                                {MATRIX_RATINGS.map((rating, col) => (
                                  <label
                                    key={rating}
                                    className="flex cursor-pointer items-center justify-center"
                                  >
                                    <span className="sr-only">
                                      {statement}: {rating}
                                    </span>
                                    <input
                                      type="radio"
                                      name={`survey-matrix-${row}`}
                                      checked={matrix[row] === col}
                                      onChange={() => setMatrixRow(row, col)}
                                      className={radioClass}
                                    />
                                  </label>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div
                        aria-hidden="true"
                        className={cx(
                          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                          matrixEdges.start ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div
                        aria-hidden="true"
                        className={cx(
                          "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                          matrixEdges.end ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </div>
                  </div>,
                )}

                {fieldWrap(
                  60,
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      What stood out
                      <span aria-hidden="true" className="text-neutral-400">
                        {" "}
                        *
                      </span>
                    </legend>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {STOOD_OUT.map((opt) => {
                        const nothingChecked = stoodOut.includes(NOTHING);
                        return (
                          <label
                            key={opt.value}
                            className={cx(
                              "flex cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200/70 bg-white px-3 py-2 text-[13px] text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
                              transition,
                              nothingChecked && "cursor-not-allowed opacity-50",
                            )}
                          >
                            <span className={checkboxBox}>
                              <input
                                type="checkbox"
                                checked={stoodOut.includes(opt.value)}
                                disabled={nothingChecked}
                                onChange={() => toggleStoodOut(opt.value)}
                                className={checkboxClass}
                              />
                              <Check
                                aria-hidden="true"
                                strokeWidth={3}
                                className={checkboxMark}
                              />
                            </span>
                            {opt.label}
                          </label>
                        );
                      })}
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200/70 bg-white px-3 py-2 text-[13px] text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 sm:col-span-2">
                        <span className={checkboxBox}>
                          <input
                            type="checkbox"
                            checked={stoodOut.includes(NOTHING)}
                            onChange={() => toggleStoodOut(NOTHING)}
                            className={checkboxClass}
                          />
                          <Check
                            aria-hidden="true"
                            strokeWidth={3}
                            className={checkboxMark}
                          />
                        </span>
                        Nothing in particular
                      </label>
                    </div>
                  </fieldset>,
                )}
              </div>

              <div className="flex items-center justify-between gap-3 bg-neutral-50 px-5 py-3.5 dark:bg-neutral-900/60">
                <p className="text-xs text-neutral-500">
                  {canSubmit
                    ? "Ready to send."
                    : `${total - answered} question${total - answered === 1 ? "" : "s"} left.`}
                </p>
                <button
                  type="button"
                  onClick={() => canSubmit && setSubmitted(true)}
                  disabled={!canSubmit}
                  title={
                    canSubmit
                      ? undefined
                      : "Answer every required question to submit."
                  }
                  className={primaryButton}
                >
                  Submit feedback
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

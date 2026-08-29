"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown, FileText, Upload, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
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
    const el = ref.current;
    if (!el) return;
    update();
    const RO = el.ownerDocument.defaultView?.ResizeObserver;
    const ro = RO ? new RO(update) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [update]);
  return { ref, edges, onScroll: update };
}

const inputClass =
  "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const focusRing =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

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
          focusRing,
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

const textareaClass =
  "min-h-24 w-full resize-none rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const errorBox =
  "border-red-500 hover:border-red-500 focus:border-red-500 focus-visible:outline-red-500 dark:border-red-500 dark:hover:border-red-500 dark:focus:border-red-500";

const primaryButton =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const secondaryButton =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const labelClass =
  "block text-[13px] font-medium text-neutral-900 dark:text-neutral-100";

const checkboxClass =
  "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border border-neutral-300 bg-white transition-colors duration-150 checked:border-neutral-900 checked:bg-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:checked:bg-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxBox =
  "relative inline-flex h-4 w-4 shrink-0 items-center justify-center";

const checkboxMark =
  "pointer-events-none absolute h-3 w-3 text-[var(--rb-accent-fg,oklch(100%_0_0))] opacity-0 transition-opacity duration-150 peer-checked:opacity-100 motion-reduce:transition-none dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]";

const FOCUS_AREAS = [
  "Visual arts",
  "Performing arts",
  "Music and sound",
  "Literary arts",
  "Community media",
];

type Tier = {
  id: string;
  name: string;
  blurb: string;
  amount: string;
};

const TIERS: Tier[] = [
  {
    id: "seed",
    name: "Seed grant",
    blurb: "Early-stage work and prototypes",
    amount: "$2,500",
  },
  {
    id: "project",
    name: "Project grant",
    blurb: "A full season or production run",
    amount: "$10,000",
  },
  {
    id: "residency",
    name: "Residency grant",
    blurb: "A funded studio placement",
    amount: "$25,000",
  },
];

const SUMMARY_LIMIT = 400;
const MAX_FILES = 5;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type UploadFile = { name: string; size: number };

const SEED_FILES: UploadFile[] = [
  { name: "project-budget-2026.pdf", size: 184320 },
  { name: "community-letters-of-support.pdf", size: 962560 },
];

export default function Forms7() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [title, setTitle] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [focus, setFocus] = useState("");
  const [tier, setTier] = useState("");
  const [summary, setSummary] = useState("");
  const [consent, setConsent] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [tagError, setTagError] = useState("");

  const [files, setFiles] = useState<UploadFile[]>(SEED_FILES);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    if (!draftSaved) return;
    const t = window.setTimeout(() => setDraftSaved(false), 2500);
    return () => window.clearTimeout(t);
  }, [draftSaved]);

  const { ref: scrollRef, edges, onScroll } = useScrollFade<HTMLDivElement>();

  const remaining = SUMMARY_LIMIT - summary.length;
  const overLimit = remaining < 0;
  const emailInvalid = email !== "" && !isEmail(email);

  const requirements = useMemo(
    () => [
      title.trim() !== "",
      org.trim() !== "",
      isEmail(email),
      focus !== "",
      tags.length > 0,
      tier !== "",
      summary.trim() !== "" && !overLimit,
      consent,
    ],
    [title, org, email, focus, tags.length, tier, summary, overLimit, consent],
  );

  const filled = requirements.filter(Boolean).length;
  const pct = Math.round((filled / requirements.length) * 100);
  const valid = filled === requirements.length;

  const addTag = () => {
    const value = tagDraft.trim();
    if (value === "") return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setTagError(`"${value}" is already added.`);
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagDraft("");
    setTagError("");
  };

  const onTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
      setTagError("");
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => {
      const next = [...prev];
      for (const f of Array.from(list)) {
        if (next.length >= MAX_FILES) break;
        if (!next.some((x) => x.name === f.name))
          next.push({ name: f.name, size: f.size });
      }
      return next;
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (files.length >= MAX_FILES) return;
    addFiles(e.dataTransfer.files);
  };

  const full = files.length >= MAX_FILES;

  const resetForm = () => {
    setTitle("");
    setOrg("");
    setEmail("");
    setFocus("");
    setTier("");
    setSummary("");
    setConsent(false);
    setTags([]);
    setTagDraft("");
    setTagError("");
    setFiles(SEED_FILES);
    setSubmitted(false);
  };

  const sectionStyle = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? undefined : "translateY(4px)",
    transition: "opacity 200ms ease-out, transform 200ms ease-out",
    transitionDelay: `${Math.min(i, 8) * 20}ms`,
  });

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className="mx-auto flex min-h-0 w-full max-w-[760px] flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {submitted ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
                <Check
                  aria-hidden="true"
                  className="h-6 w-6"
                  strokeWidth={2.5}
                />
              </span>
              <h2 className="mt-4 text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Application received
              </h2>
              <p className="mt-1 max-w-sm text-sm text-neutral-500">
                Our panel reviews new applications within ten working days. Keep
                your reference code for any follow-up.
              </p>
              <div className="mt-4 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-4 py-2.5 dark:bg-neutral-800/50">
                <span className="text-xs text-neutral-500">Reference code</span>
                <p className="font-mono text-sm tabular-nums text-neutral-900 dark:text-neutral-100">
                  ARTS-2026-4718
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className={cx(secondaryButton, "mt-6")}
              >
                Start another application
              </button>
            </div>
          ) : (
            <>
              <div className="bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                      Community arts fund application
                    </h2>
                    <p className="mt-0.5 text-[13px] text-neutral-500">
                      Tell us about your project and the support you need.
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] tabular-nums text-neutral-500">
                    {pct}%
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-[var(--rb-r-xs,4px)] bg-neutral-200 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-[var(--rb-r-xs,4px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] transition-[width] duration-200 ease-out motion-reduce:transition-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="relative min-h-0 flex-1">
                <div
                  ref={scrollRef}
                  onScroll={onScroll}
                  className="h-full space-y-5 overflow-y-auto px-4 py-5"
                >
                  <section className="space-y-4" style={sectionStyle(0)}>
                    <div className="space-y-1.5">
                      <label htmlFor="frm7-title" className={labelClass}>
                        Project title
                        <span aria-hidden="true" className="text-neutral-400">
                          {" "}
                          *
                        </span>
                      </label>
                      <input
                        id="frm7-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="A short, memorable name"
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="frm7-org" className={labelClass}>
                          Organization or artist
                          <span aria-hidden="true" className="text-neutral-400">
                            {" "}
                            *
                          </span>
                        </label>
                        <input
                          id="frm7-org"
                          value={org}
                          onChange={(e) => setOrg(e.target.value)}
                          placeholder="Who is applying"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="frm7-email" className={labelClass}>
                          Contact email
                          <span aria-hidden="true" className="text-neutral-400">
                            {" "}
                            *
                          </span>
                        </label>
                        <input
                          id="frm7-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          aria-invalid={emailInvalid}
                          placeholder="you@example.org"
                          className={cx(inputClass, emailInvalid && errorBox)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="frm7-focus" className={labelClass}>
                        Focus area
                        <span aria-hidden="true" className="text-neutral-400">
                          {" "}
                          *
                        </span>
                      </label>
                      <Select
                        id="frm7-focus"
                        value={focus}
                        onChange={(v) => setFocus(v)}
                        options={FOCUS_AREAS.map((f) => ({
                          value: f,
                          label: f,
                        }))}
                        placeholder="Select a focus area"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="frm7-tags" className={labelClass}>
                        Discipline tags
                        <span aria-hidden="true" className="text-neutral-400">
                          {" "}
                          *
                        </span>
                      </label>
                      <div className="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2 py-1.5 transition-colors duration-150 focus-within:border-neutral-900 focus-within:outline-none focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-within:border-white dark:focus-within:outline-white">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex h-6 items-center gap-1 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 pl-2 pr-1 text-[13px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                          >
                            {t}
                            <button
                              type="button"
                              onClick={() => {
                                setTags((prev) => prev.filter((x) => x !== t));
                                setTagError("");
                              }}
                              className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-[var(--rb-r-xs,4px)] text-neutral-400 transition-colors duration-150 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                            >
                              <X aria-hidden="true" className="h-3 w-3" />
                              <span className="sr-only">Remove {t}</span>
                            </button>
                          </span>
                        ))}
                        <input
                          id="frm7-tags"
                          value={tagDraft}
                          onChange={(e) => {
                            setTagDraft(e.target.value);
                            if (tagError) setTagError("");
                          }}
                          onKeyDown={onTagKeyDown}
                          placeholder={
                            tags.length === 0 ? "Add a tag and press Enter" : ""
                          }
                          className="h-6 min-w-[8rem] flex-1 border-0 bg-transparent px-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500"
                        />
                      </div>
                      <p
                        className={cx(
                          "text-xs",
                          tagError
                            ? "text-red-600 dark:text-red-400"
                            : "text-neutral-500",
                        )}
                      >
                        {tagError ||
                          "Press Enter to add, Backspace to remove the last tag."}
                      </p>
                    </div>
                  </section>

                  <section className="space-y-2" style={sectionStyle(1)}>
                    <p className={labelClass}>
                      Funding tier
                      <span aria-hidden="true" className="text-neutral-400">
                        {" "}
                        *
                      </span>
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {TIERS.map((t) => {
                        const selected = tier === t.id;
                        return (
                          <label
                            key={t.id}
                            className={cx(
                              "cursor-pointer rounded-[var(--rb-r-lg,10px)] border p-3 transition-[border-color,box-shadow] duration-150 focus-within:outline-none focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-neutral-900 dark:focus-within:outline-white",
                              selected
                                ? "border-neutral-900 ring-1 ring-neutral-900 dark:border-white dark:ring-white"
                                : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
                            )}
                          >
                            <input
                              type="radio"
                              name="frm7-tier"
                              value={t.id}
                              checked={selected}
                              onChange={() => setTier(t.id)}
                              className="sr-only"
                            />
                            <span className="block text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                              {t.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-neutral-500">
                              {t.blurb}
                            </span>
                            <span className="mt-2 block text-sm tabular-nums text-neutral-900 dark:text-neutral-100">
                              {t.amount}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-1.5" style={sectionStyle(2)}>
                    <label htmlFor="frm7-summary" className={labelClass}>
                      Project summary
                      <span aria-hidden="true" className="text-neutral-400">
                        {" "}
                        *
                      </span>
                    </label>
                    <textarea
                      id="frm7-summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      aria-invalid={overLimit}
                      placeholder="Describe the work, who it reaches, and what the funding covers."
                      className={cx(textareaClass, overLimit && errorBox)}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-neutral-500">
                        A panel reads this first.
                      </p>
                      <p
                        className={cx(
                          "text-xs tabular-nums",
                          overLimit
                            ? "text-red-600 dark:text-red-400"
                            : "text-neutral-500",
                        )}
                      >
                        {overLimit
                          ? `${Math.abs(remaining)} over limit`
                          : `${remaining} left`}
                      </p>
                    </div>
                  </section>

                  <section className="space-y-2" style={sectionStyle(3)}>
                    <p className={labelClass}>Supporting documents</p>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!full) setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      style={{ touchAction: "pan-y" }}
                      className={cx(
                        "flex flex-col items-center rounded-[var(--rb-r-lg,10px)] border border-dashed px-4 py-6 text-center transition-colors duration-150",
                        dragging
                          ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800/50"
                          : "border-neutral-300 dark:border-neutral-700",
                        full && "opacity-60",
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-neutral-100 dark:bg-neutral-800">
                        <Upload
                          aria-hidden="true"
                          className="h-4 w-4 text-neutral-500"
                        />
                      </span>
                      <p className="mt-2 text-[13px] text-neutral-700 dark:text-neutral-300">
                        Drag files here to attach
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Budgets, work samples or letters of support, up to{" "}
                        {MAX_FILES} files.
                      </p>
                      <button
                        type="button"
                        disabled={full}
                        onClick={() => fileInputRef.current?.click()}
                        className={cx(
                          secondaryButton,
                          "mt-3 h-8 px-2.5 text-[13px]",
                        )}
                      >
                        Choose files
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          addFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    {files.length > 0 && (
                      <ul className="space-y-1.5">
                        {files.map((f) => (
                          <li
                            key={f.name}
                            className="flex items-center gap-2.5 rounded-[var(--rb-r-md,8px)] bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50"
                          >
                            <FileText
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-neutral-500"
                            />
                            <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                              {f.name}
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-neutral-500">
                              {formatSize(f.size)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFiles((prev) =>
                                  prev.filter((x) => x.name !== f.name),
                                )
                              }
                              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-500 transition-colors duration-150 hover:bg-neutral-200 hover:text-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:hover:text-neutral-100"
                            >
                              <X aria-hidden="true" className="h-3.5 w-3.5" />
                              <span className="sr-only">Remove {f.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {full && (
                      <p className="text-xs text-neutral-500">
                        Maximum of {MAX_FILES} files reached. Remove one to add
                        another.
                      </p>
                    )}
                  </section>

                  <section style={sectionStyle(4)}>
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <span className={checkboxBox}>
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className={checkboxClass}
                        />
                        <Check
                          aria-hidden="true"
                          strokeWidth={3}
                          className={checkboxMark}
                        />
                      </span>
                      <span className="text-[13px] text-neutral-700 dark:text-neutral-300">
                        I confirm the information here is accurate and I am
                        authorized to apply on behalf of the organization.
                      </span>
                    </label>
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

              <div className="flex flex-col-reverse gap-2 bg-neutral-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900/60">
                <button
                  type="button"
                  onClick={() => setDraftSaved(true)}
                  className={secondaryButton}
                >
                  {draftSaved ? "Draft saved" : "Save draft"}
                </button>
                <div className="flex items-center gap-3">
                  {!valid && (
                    <span className="hidden text-xs text-neutral-500 sm:inline">
                      {filled} of {requirements.length} required fields complete
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={!valid}
                    onClick={() => setSubmitted(true)}
                    className={cx(primaryButton, "flex-1 sm:flex-none")}
                  >
                    Submit application
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

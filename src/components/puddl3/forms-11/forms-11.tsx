"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Info, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

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

const inputClass =
  "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const inputError =
  "border-red-500 hover:border-red-500 focus:border-red-500 focus-visible:outline-red-500 dark:border-red-500 dark:hover:border-red-500 dark:focus:border-red-500 dark:focus-visible:outline-red-500";

const textareaClass =
  "min-h-20 w-full resize-none rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

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

type Kind = "preview" | "staging" | "production";

const KINDS: { value: Kind; label: string; blurb: string }[] = [
  {
    value: "preview",
    label: "Preview",
    blurb:
      "Created for each pull request and removed on merge. Best for reviewing changes in isolation.",
  },
  {
    value: "staging",
    label: "Staging",
    blurb:
      "A shared pre-release environment for QA and sign-off before a change reaches customers.",
  },
  {
    value: "production",
    label: "Production",
    blurb:
      "Serves live traffic. Deploys are gated behind approval and every change is recorded.",
  },
];

const REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
];

const EXISTING = [
  "production",
  "staging",
  "preview-api",
  "dev-sandbox",
  "load-test",
];

const COPY_SOURCES: Record<Kind, { value: string; label: string }[]> = {
  preview: [
    { value: "staging", label: "staging" },
    { value: "dev-sandbox", label: "dev-sandbox" },
  ],
  staging: [
    { value: "production", label: "production" },
    { value: "dev-sandbox", label: "dev-sandbox" },
  ],
  production: [{ value: "staging", label: "staging" }],
};

const DESC_LIMIT = 160;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function Forms11() {
  const [mounted, setMounted] = useState(false);
  const [created, setCreated] = useState(false);

  const [kind, setKind] = useState<Kind>("preview");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [region, setRegion] = useState(REGIONS[0].value);
  const [copyFrom, setCopyFrom] = useState("none");
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [description, setDescription] = useState("");

  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  useEffect(() => setMounted(true), []);

  const slug = slugify(name);
  const activeKind = KINDS.find((k) => k.value === kind)!;
  const sources = COPY_SOURCES[kind];

  const nameTaken = slug !== "" && EXISTING.includes(slug);
  const nameEmpty = name.trim() === "";
  const nameError = touched && (nameEmpty || nameTaken);
  const valid = !nameEmpty && !nameTaken;

  const selectKind = (next: Kind) => {
    setKind(next);
    if (
      next !== kind &&
      !COPY_SOURCES[next].some((s) => s.value === copyFrom)
    ) {
      setCopyFrom("none");
    }
  };

  const kindRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const dismiss = () => {
    setKind("preview");
    setName("");
    setTouched(false);
    setRegion(REGIONS[0].value);
    setCopyFrom("none");
    setAutoDeploy(true);
    setDescription("");
  };
  const onKindKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const index = KINDS.findIndex((k) => k.value === kind);
    let next = index;
    if (e.key === "ArrowRight") next = Math.min(KINDS.length - 1, index + 1);
    if (e.key === "ArrowLeft") next = Math.max(0, index - 1);
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = KINDS.length - 1;
    selectKind(KINDS[next].value);
    kindRefs.current[next]?.focus({ preventScroll: true });
  };

  const thumbIndex = KINDS.findIndex((k) => k.value === kind);

  const submit = () => {
    setTouched(true);
    if (valid) setCreated(true);
  };

  const errorId = "env-name-error";
  const helpId = "env-name-help";

  return (
    <div className="flex h-full min-h-[680px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div
        className="mx-auto w-full max-w-[560px]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? undefined : "translateY(4px)",
          transition: "opacity 200ms ease-out, transform 200ms ease-out",
        }}
      >
        <div
          role="dialog"
          aria-labelledby="env-title"
          aria-describedby="env-subtitle"
          className="flex flex-col overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          {created ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--rb-r-2xl,14px)] bg-neutral-100 dark:bg-neutral-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <h2 className="text-lg font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                Environment created
              </h2>
              <p className="mt-1.5 max-w-xs text-[13px] text-neutral-500">
                <span className="font-mono text-neutral-900 dark:text-neutral-100">
                  {slug}
                </span>{" "}
                is provisioning in{" "}
                {REGIONS.find((r) => r.value === region)?.label}. It will be
                ready in a moment.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCreated(false);
                  setName("");
                  setTouched(false);
                  setCopyFrom("none");
                  setDescription("");
                  setKind("preview");
                }}
                className={cx(secondaryButton, "mt-5")}
              >
                Create another
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 bg-neutral-50 px-5 py-4 dark:bg-neutral-900/60">
                <div className="min-w-0">
                  <h2
                    id="env-title"
                    className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100"
                  >
                    New environment
                  </h2>
                  <p
                    id="env-subtitle"
                    className="mt-0.5 text-[13px] text-neutral-500"
                  >
                    Provision an isolated place to deploy your app.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className={cx(
                    "-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                    transition,
                    focus,
                  )}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              <div className="relative">
                <div
                  ref={ref}
                  onScroll={onScroll}
                  className="max-h-[430px] space-y-5 overflow-y-auto px-5 py-5"
                >
                  <div className="space-y-2">
                    <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Environment kind
                    </span>
                    <div
                      role="radiogroup"
                      aria-label="Environment kind"
                      onKeyDown={onKindKey}
                      className="relative flex h-9 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800/60"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1 left-1 rounded-[var(--rb-r-sm,6px)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-transform duration-200 ease-out motion-reduce:transition-none dark:bg-neutral-950"
                        style={{
                          width: "calc((100% - 8px) / 3)",
                          transform: `translateX(${thumbIndex * 100}%)`,
                        }}
                      />
                      {KINDS.map((k, i) => {
                        const active = k.value === kind;
                        return (
                          <button
                            key={k.value}
                            ref={(el) => {
                              kindRefs.current[i] = el;
                            }}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            tabIndex={active ? 0 : -1}
                            onClick={() => selectKind(k.value)}
                            className={cx(
                              "relative z-10 h-7 flex-1 cursor-pointer rounded-[var(--rb-r-sm,6px)] text-[13px] font-medium",
                              focus,
                              "transition-colors duration-150 ease-out",
                              active
                                ? "text-neutral-900 dark:text-neutral-100"
                                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200",
                            )}
                          >
                            {k.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-start gap-2 rounded-[var(--rb-r-md,8px)] bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/40">
                      <Info
                        aria-hidden="true"
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
                      />
                      <p className="text-[13px] text-neutral-500">
                        {activeKind.blurb}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="env-name"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      Name
                      <span aria-hidden="true" className="text-neutral-400">
                        {" "}
                        *
                      </span>
                    </label>
                    <input
                      id="env-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouched(true)}
                      aria-invalid={nameError || undefined}
                      aria-describedby={nameError ? errorId : helpId}
                      placeholder="e.g. Release candidate"
                      className={cx(inputClass, nameError && inputError)}
                    />
                    {nameError ? (
                      <p
                        id={errorId}
                        className="text-xs text-red-600 dark:text-red-400"
                      >
                        {nameEmpty
                          ? "Give the environment a name."
                          : `An environment named "${slug}" already exists.`}
                      </p>
                    ) : (
                      <p id={helpId} className="text-xs text-neutral-500">
                        Deploys to{" "}
                        <span className="font-mono text-neutral-500">
                          {slug || "your-environment"}
                        </span>
                        .yourapp.dev
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="env-region"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      Region
                    </label>
                    <Select
                      id="env-region"
                      value={region}
                      onChange={(v) => setRegion(v)}
                      options={REGIONS.map((r) => ({
                        value: r.value,
                        label: r.label,
                      }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="env-copy"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      Copy variables from
                    </label>
                    <Select
                      id="env-copy"
                      value={copyFrom}
                      onChange={(v) => setCopyFrom(v)}
                      options={[
                        { value: "none", label: "Start with no variables" },
                        ...sources.map((s) => ({
                          value: s.value,
                          label: s.label,
                        })),
                      ]}
                    />
                    <p className="text-xs text-neutral-500">
                      Sources are limited to environments compatible with a{" "}
                      {activeKind.label.toLowerCase()} environment.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/40">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        Auto-deploy on push
                      </p>
                      <p className="mt-0.5 text-[13px] text-neutral-500">
                        Build and deploy whenever the tracked branch changes.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoDeploy}
                      aria-label="Auto-deploy on push"
                      onClick={() => setAutoDeploy((v) => !v)}
                      className={cx(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                        autoDeploy
                          ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                          : "bg-neutral-200 dark:bg-neutral-700",
                      )}
                    >
                      <span
                        className={cx(
                          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-neutral-900",
                          autoDeploy ? "translate-x-[18px]" : "translate-x-0.5",
                        )}
                      />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="env-description"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      Description
                    </label>
                    <textarea
                      id="env-description"
                      value={description}
                      maxLength={DESC_LIMIT}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this environment for?"
                      className={textareaClass}
                    />
                    <div className="flex justify-end">
                      <p className="text-xs tabular-nums text-neutral-400">
                        {description.length} / {DESC_LIMIT}
                      </p>
                    </div>
                  </div>
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

              <div className="flex items-center justify-end gap-2 bg-neutral-50 px-5 py-3.5 dark:bg-neutral-900/60">
                <button
                  type="button"
                  onClick={dismiss}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!valid}
                  title={
                    valid
                      ? undefined
                      : "Enter a unique name to create the environment."
                  }
                  className={primaryButton}
                >
                  Create environment
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ArrowUp, Check, ChevronDown, Globe, Square } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Option = {
  name: string;
  hint: string;
};

const MODELS: Option[] = [
  { name: "Atlas", hint: "Best for coding" },
  { name: "Ember", hint: "Fast, general purpose" },
  { name: "Atlas Long", hint: "Long context" },
];

const MAX_TOKENS = 8000;

const MAX_COMPOSER_HEIGHT = 200;

function Dropdown({
  label,
  options,
  value,
  onChange,
  triggerMaxWidth,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (next: string) => void;
  triggerMaxWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const doc = rootRef.current?.ownerDocument ?? document;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setShown(false);
      }
    };
    doc.addEventListener("pointerdown", onPointerDown);
    return () => doc.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) menuRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current ?? 0), []);

  const openMenu = (index: number, withAnimation: boolean) => {
    setActive(index);
    setOpen(true);
    if (withAnimation) {
      setShown(false);
      frameRef.current = requestAnimationFrame(() => setShown(true));
    } else {
      setShown(true);
    }
  };

  const close = (restoreFocus = true) => {
    setOpen(false);
    setShown(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  };

  const select = (index: number) => {
    onChange(options[index].name);
    close();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(0, false);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(options.length - 1, false);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "ArrowDown":
        event.preventDefault();
        setActive((i) => (i + 1) % options.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((i) => (i - 1 + options.length) % options.length);
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        select(active);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className={cx(
            "absolute bottom-full left-0 z-30 mb-2 w-64 origin-bottom-left overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white p-1 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] outline-none transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none",
            shown ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
        >
          {options.map((item, index) => {
            const selected = item.name === value;
            return (
              <button
                key={item.name}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                onClick={() => select(index)}
                onPointerMove={() => setActive(index)}
                className={cx(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] px-2 py-1.5 text-left transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99]",
                  index === active
                    ? "bg-neutral-100 dark:bg-neutral-800"
                    : "bg-transparent",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {item.name}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {item.hint}
                  </span>
                </span>
                {selected && (
                  <Check
                    className="h-3.5 w-3.5 shrink-0 text-neutral-900 dark:text-neutral-100"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
        onClick={() => (open ? close() : openMenu(0, true))}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
      >
        <span className={cx("truncate", triggerMaxWidth)}>{value}</span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-neutral-500"
          aria-hidden
        />
      </button>
    </div>
  );
}

export default function PromptInput2() {
  const [value, setValue] = useState(
    "Refactor the checkout flow to use the new pricing service.\nKeep the existing analytics events intact, add a feature flag for a 10% rollout, and write a short migration note for the on-call engineer covering the rollback steps.",
  );
  const [model, setModel] = useState(MODELS[0].name);
  const [searchOn, setSearchOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const resize = () => {
      el.style.height = "auto";
      if (el.scrollHeight === 0) return;
      el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
    };

    resize();
    const frame = requestAnimationFrame(resize);
    el.ownerDocument.fonts?.ready.then(resize).catch(() => {});

    let lastWidth = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === lastWidth) return;
      lastWidth = el.clientWidth;
      resize();
    });
    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [value]);

  useEffect(() => () => clearTimeout(sendTimer.current), []);

  const tokens = useMemo(() => {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    return Math.min(MAX_TOKENS, 128 + words * 6);
  }, [value]);

  const canSend = value.trim().length > 0 && !busy;

  const submit = () => {
    if (!canSend) return;
    setBusy(true);
    setValue("");
    sendTimer.current = setTimeout(() => setBusy(false), 1800);
  };

  const cancel = () => {
    clearTimeout(sendTimer.current);
    setBusy(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative flex h-full w-full min-h-[400px] flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <div className="relative w-full">
          <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white transition-colors focus-within:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-neutral-700">
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything"
              className="block max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />

            <div className="flex flex-wrap items-center gap-1 px-2.5 pb-2.5 pt-1">
              <Dropdown
                label="Model"
                options={MODELS}
                value={model}
                onChange={setModel}
                triggerMaxWidth="max-w-[9rem]"
              />

              <button
                type="button"
                aria-pressed={searchOn}
                onClick={() => setSearchOn((v) => !v)}
                className={cx(
                  "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-2 text-[13px] font-medium transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                  searchOn
                    ? "bg-neutral-200 text-neutral-900 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
                )}
              >
                <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Search
              </button>

              <div className="ml-auto flex items-center gap-2.5">
                <span className="min-w-[4.5rem] text-right text-xs tabular-nums text-neutral-500">
                  {tokens.toLocaleString()} / 8K
                </span>
                {busy ? (
                  <button
                    type="button"
                    onClick={cancel}
                    aria-label="Stop generating"
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-95 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                  >
                    <Square className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Send"
                    disabled={!canSend}
                    onClick={submit}
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-95 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))] dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
                  >
                    <ArrowUp className="h-4 w-4 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="mt-3 px-1 text-xs text-neutral-500">
            Responses can be inaccurate: check anything important.
          </p>
        </div>
      </div>
    </div>
  );
}

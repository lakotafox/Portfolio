"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ArrowUp, AtSign, File, Hash, Square, User, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type SourceType = "file" | "channel" | "person";

const ICONS: Record<SourceType, typeof File> = {
  file: File,
  channel: Hash,
  person: User,
};

const CANDIDATES: { type: SourceType; label: string; group: string }[] = [
  { type: "file", label: "pricing.ts", group: "Files" },
  { type: "file", label: "checkout.tsx", group: "Files" },
  { type: "person", label: "Marcus Lindqvist", group: "People" },
  { type: "channel", label: "launch", group: "Channels" },
];

const INITIAL_SOURCES: { type: SourceType; label: string }[] = [
  { type: "file", label: "auth-service.ts" },
  { type: "channel", label: "billing" },
  { type: "person", label: "Dana Whitfield" },
];

const MAX_COMPOSER_HEIGHT = 200;

export default function PromptInput6() {
  const [value, setValue] = useState("");
  const [sources, setSources] = useState(INITIAL_SOURCES);
  const [dismissed, setDismissed] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listId = useId();
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

  const mentionQuery = useMemo(() => {
    const match = value.match(/@(\w*)$/);
    return match ? match[1].toLowerCase() : null;
  }, [value]);

  const matches = useMemo(() => {
    if (mentionQuery === null) return [];
    return CANDIDATES.filter(
      (c) =>
        c.label.toLowerCase().includes(mentionQuery) &&
        !sources.some((s) => s.label === c.label),
    );
  }, [mentionQuery, sources]);

  const menuOpen = matches.length > 0 && !busy && !dismissed;
  const activeMention = Math.min(mentionIndex, Math.max(0, matches.length - 1));
  const canSend = value.trim().length > 0 && !busy;

  const addSource = (item: { type: SourceType; label: string }) => {
    setSources((prev) => [...prev, { type: item.type, label: item.label }]);
    setValue((prev) => prev.replace(/@(\w*)$/, ""));
    textareaRef.current?.focus({ preventScroll: true });
  };

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
    if (menuOpen) {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          setDismissed(true);
          return;
        case "ArrowDown":
          event.preventDefault();
          setMentionIndex((i) => (i + 1) % matches.length);
          return;
        case "ArrowUp":
          event.preventDefault();
          setMentionIndex((i) => (i - 1 + matches.length) % matches.length);
          return;
        case "Home":
          event.preventDefault();
          setMentionIndex(0);
          return;
        case "End":
          event.preventDefault();
          setMentionIndex(matches.length - 1);
          return;
        case "Enter":
        case "Tab":
          event.preventDefault();
          addSource(matches[activeMention]);
          return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const onChange = (next: string) => {
    setDismissed(false);
    setMentionIndex(0);
    setValue(next);
  };

  return (
    <div className="relative flex h-full w-full min-h-[400px] flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <div className="relative w-full">
          {menuOpen && (
            <div
              id={`${listId}-menu`}
              role="listbox"
              aria-label="Add context"
              className="absolute bottom-full left-0 z-30 mb-2 max-h-[140px] origin-bottom-left w-72 overflow-y-auto rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white p-1 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
            >
              {matches.map((item, index) => {
                const Icon = ICONS[item.type];
                return (
                  <button
                    key={item.label}
                    id={`${listId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeMention}
                    tabIndex={-1}
                    onClick={() => addSource(item)}
                    onPointerMove={() => setMentionIndex(index)}
                    className={cx(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] px-2 py-1.5 text-left transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99]",
                      index === activeMention
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : "bg-transparent",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                      {item.label}
                    </span>
                    <span className="shrink-0 text-xs text-neutral-500">
                      {item.group}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white transition-colors focus-within:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-neutral-700">
            {sources.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2.5 pt-2.5">
                {sources.map((source) => {
                  const Icon = ICONS[source.type];
                  return (
                    <span
                      key={source.label}
                      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 pl-2 pr-1 text-[13px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                      <span className="min-w-0 truncate">{source.label}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${source.label}`}
                        onClick={() =>
                          setSources((prev) =>
                            prev.filter((s) => s.label !== source.label),
                          )
                        }
                        className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-xs,4px)] bg-white text-neutral-500 transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything"
              aria-label="Message"
              role="combobox"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? `${listId}-menu` : undefined}
              aria-activedescendant={
                menuOpen ? `${listId}-option-${activeMention}` : undefined
              }
              aria-autocomplete="list"
              className="block max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />

            <div className="flex items-center gap-1 px-2.5 pb-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setValue((prev) => `${prev}@`);
                  textareaRef.current?.focus({ preventScroll: true });
                }}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <AtSign className="h-3.5 w-3.5 shrink-0" />
                Add context
              </button>
              {busy ? (
                <button
                  type="button"
                  onClick={cancel}
                  aria-label="Stop generating"
                  className="ml-auto inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-95 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                >
                  <Square className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Send"
                  disabled={!canSend}
                  onClick={submit}
                  className="ml-auto inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-95 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))] dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
                >
                  <ArrowUp className="h-4 w-4 shrink-0" />
                </button>
              )}
            </div>
          </div>

          <p className="mt-3 px-1 text-xs text-neutral-500">
            Type @ to pull a file, person, or channel into context.
          </p>
        </div>
      </div>
    </div>
  );
}

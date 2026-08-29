"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowUp,
  BarChart3,
  LayoutTemplate,
  ListChecks,
  Paperclip,
  ShoppingBag,
  Square,
  X,
} from "lucide-react";

const SUGGESTIONS = [
  { label: "Landing page", icon: LayoutTemplate },
  { label: "Analytics dashboard", icon: BarChart3 },
  { label: "Storefront", icon: ShoppingBag },
  { label: "Onboarding flow", icon: ListChecks },
];

const MAX_COMPOSER_HEIGHT = 200;

export default function PromptInput3() {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<
    { name: string; size: string }[]
  >([]);
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

  const canSend = value.trim().length > 0 && !busy;

  const addAttachment = () => {
    setAttachments((prev) => [
      ...prev,
      {
        name: `reference-${prev.length + 1}.png`,
        size: `${120 + prev.length * 40} KB`,
      },
    ]);
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
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative flex h-full w-full min-h-[480px] flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-8 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
            What do you want to build?
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Describe it in a sentence and get a working first draft.
          </p>
        </div>

        <div className="w-full rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white transition-colors focus-within:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-neutral-700">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-2.5 pt-2.5">
              {attachments.map((file) => (
                <span
                  key={file.name}
                  className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 pl-2 pr-1 text-[13px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                  <span className="min-w-0 truncate">{file.name}</span>
                  <span className="shrink-0 tabular-nums text-neutral-500">
                    {file.size}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() =>
                      setAttachments((prev) =>
                        prev.filter((f) => f.name !== file.name),
                      )
                    }
                    className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-xs,4px)] bg-white text-neutral-500 transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything"
            className="block max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
          <div className="flex items-center gap-1 px-2.5 pb-2.5 pt-1">
            <button
              type="button"
              aria-label="Attach a file"
              onClick={addAttachment}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-500 transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <Paperclip className="h-4 w-4 shrink-0" />
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

        <div className="flex flex-wrap items-center justify-center gap-2">
          {SUGGESTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setValue(item.label);
                  textareaRef.current?.focus({ preventScroll: true });
                }}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

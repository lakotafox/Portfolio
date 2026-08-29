"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Square } from "lucide-react";

const TEMPLATE =
  "Write a {{tone}} announcement for {{audience}} introducing {{product}}.";

const FIELDS = [
  { key: "tone", label: "Tone", placeholder: "warm, direct, playful" },
  {
    key: "audience",
    label: "Audience",
    placeholder: "existing customers",
  },
  { key: "product", label: "Product", placeholder: "the feature you ship" },
];

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

export default function PromptInput4() {
  const [values, setValues] = useState<Record<string, string>>({
    tone: "warm",
    audience: "existing customers",
    product: "",
  });
  const [busy, setBusy] = useState(false);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(sendTimer.current), []);

  const segments = useMemo(() => {
    return TEMPLATE.split(/(\{\{\s*\w+\s*\}\})/g).filter(Boolean);
  }, []);

  const missing = FIELDS.filter((f) => !values[f.key].trim()).length;
  const complete = missing === 0;

  const run = () => {
    if (!complete || busy) return;
    setBusy(true);
    sendTimer.current = setTimeout(() => setBusy(false), 1800);
  };

  const cancel = () => {
    clearTimeout(sendTimer.current);
    setBusy(false);
  };

  return (
    <div className="relative flex h-full w-full min-h-[480px] flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-3 px-4 py-8 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Prompt template
        </p>

        <div className="space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3.5 py-3 dark:border-neutral-800 dark:bg-neutral-950">
            <p className="text-sm leading-relaxed text-neutral-900 dark:text-neutral-100">
              {segments.map((seg, i) => {
                const match = seg.match(/\{\{\s*(\w+)\s*\}\}/);
                if (!match) return <span key={i}>{seg}</span>;
                const key = match[1];
                const filled = values[key]?.trim();
                return (
                  <span
                    key={i}
                    className={cx(
                      "mx-0.5 inline-flex items-center rounded-[var(--rb-r-sm,6px)] px-1.5 py-0.5 text-[13px]",
                      filled
                        ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                        : "border border-dashed border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400",
                    )}
                  >
                    {filled || key}
                  </span>
                );
              })}
            </p>
          </div>

          <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3.5 py-3.5 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {FIELDS.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`tpl-${field.key}`}
                    className="text-[13px] font-medium text-neutral-600 dark:text-neutral-400"
                  >
                    {field.label}
                  </label>
                  <input
                    id={`tpl-${field.key}`}
                    value={values[field.key]}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="h-9 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] text-neutral-900 transition-colors duration-150 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
            <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
              <span
                className={cx(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  busy
                    ? "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500"
                    : complete
                      ? "bg-neutral-300 dark:bg-neutral-600"
                      : "bg-amber-500 dark:bg-amber-500",
                )}
              />
              {busy
                ? "Running the template…"
                : complete
                  ? "Ready to run"
                  : `${missing} variable${missing > 1 ? "s" : ""} needs a value`}
            </span>
            {busy ? (
              <button
                type="button"
                onClick={cancel}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-3 text-sm font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Stop
              </button>
            ) : (
              <button
                type="button"
                disabled={!complete}
                onClick={run}
                className="inline-flex h-9 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))] dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
              >
                Run template
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

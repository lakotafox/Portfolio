"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, Copy } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({
    top: false,
    bottom: false,
    left: false,
    right: false,
  });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollLeft,
      scrollWidth,
      clientWidth,
    } = el;
    setEdges({
      top: scrollTop > 1,
      bottom: Math.ceil(scrollTop + clientHeight) < scrollHeight - 1,
      left: scrollLeft > 1,
      right: Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1,
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

type CommandResult = {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: string;
};

const COMMAND = "pnpm test payments --runInBand";

const STDOUT = `> payments@1.4.0 test
> jest --config jest.config.ts --runInBand

 PASS  services/payments/retry.test.ts
   withRetry
     retries on transient errors (18 ms)
     applies exponential backoff with jitter (24 ms)
     gives up after maxAttempts (9 ms)
 PASS  services/payments/idempotency.test.ts
   keyFor
     derives a stable key from the request (6 ms)
 FAIL  services/payments/charge.test.ts
   createCharge
     rejects duplicate idempotency keys (31 ms)

Test Suites: 1 failed, 2 passed, 3 total
Tests:       1 failed, 5 passed, 6 total
Time:        4.12 s`;

const STDERR = `  ● createCharge › rejects duplicate idempotency keys

    expect(received).rejects.toThrow(DuplicateKeyError)

    Received promise resolved instead of rejected
    Resolved to: { id: "ch_3Pd…", status: "succeeded" }

      at Object.<anonymous> (services/payments/charge.test.ts:48:7)
      at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

const TABS = [
  { id: "stdout", label: "stdout" },
  { id: "stderr", label: "stderr", count: 1 },
] as const;

type Tab = (typeof TABS)[number]["id"];

const RESULT: CommandResult = {
  command: COMMAND,
  stdout: STDOUT,
  stderr: STDERR,
  exitCode: 1,
  duration: "4.12s",
};

export default function ToolCalls5() {
  const uid = useId();
  const [tab, setTab] = useState<Tab>("stdout");
  const [copied, setCopied] = useState(false);
  const out = useScrollFade<HTMLDivElement>();
  const { command, exitCode, duration } = RESULT;
  const failed = exitCode !== 0;
  const text = tab === "stdout" ? RESULT.stdout : RESULT.stderr;

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const copyTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }
    setCopied(true);
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
  }, [command]);

  const onTabKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const last = TABS.length - 1;
      const next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? last
            : e.key === "ArrowLeft"
              ? (index + last) % TABS.length
              : (index + 1) % TABS.length;
      setTab(TABS[next].id);
      tabRefs.current[next]?.focus({ preventScroll: true });
    },
    [],
  );

  return (
    <div className="relative flex h-full min-h-[560px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <header className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-xs text-neutral-500 dark:text-neutral-500">
            run_terminal
          </span>
          <h2 className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Command output
          </h2>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
          {duration}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex shrink-0 items-center gap-2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-2.5 py-2 dark:border-neutral-800 dark:bg-neutral-950">
          <span className="shrink-0 select-none font-mono text-xs text-neutral-400 dark:text-neutral-600">
            $
          </span>
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-neutral-800 dark:text-neutral-200">
            {command}
          </code>
          <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs tabular-nums">
            <span
              aria-hidden="true"
              className={cx(
                "h-1.5 w-1.5 rounded-full",
                failed ? "bg-red-500" : "bg-neutral-300 dark:bg-neutral-600",
              )}
            />
            <span className="text-neutral-500 dark:text-neutral-500">exit</span>
            <span className="text-neutral-900 dark:text-neutral-100">
              {exitCode}
            </span>
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Command copied" : "Copy command"}
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-500 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
          >
            {copied ? (
              <Check
                aria-hidden="true"
                className="h-3.5 w-3.5 text-neutral-900 dark:text-neutral-100"
              />
            ) : (
              <Copy aria-hidden="true" className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex shrink-0 items-center p-2">
            <div
              role="tablist"
              aria-label="Output stream"
              className="inline-flex h-8 items-center gap-0.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 p-0.5 dark:bg-neutral-800"
            >
              {TABS.map((t, i) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`${uid}-tab-${t.id}`}
                    aria-selected={active}
                    aria-controls={`${uid}-panel-${t.id}`}
                    tabIndex={active ? 0 : -1}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    onKeyDown={(e) => onTabKeyDown(e, i)}
                    onClick={() => setTab(t.id)}
                    className={cx(
                      "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] px-2.5 font-mono text-xs transition-[background-color,color,box-shadow] duration-150 ease-out",
                      "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                      active
                        ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:text-neutral-100"
                        : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100",
                    )}
                  >
                    {t.label}
                    {"count" in t && t.count ? (
                      <span className="tabular-nums">{t.count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              role="tabpanel"
              id={`${uid}-panel-${tab}`}
              aria-labelledby={`${uid}-tab-${tab}`}
              tabIndex={0}
              ref={out.ref}
              onScroll={out.onScroll}
              className="h-full overflow-auto px-3 pb-2.5 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <pre className="min-w-max whitespace-pre font-mono text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                {text}
              </pre>
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                out.edges.top ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-[var(--rb-r-lg,10px)] bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                out.edges.bottom ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                out.edges.left ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                out.edges.right ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

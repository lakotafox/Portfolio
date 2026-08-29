"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

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

type Line = {
  kind: "context" | "add" | "del" | "hunk";
  old: number | null;
  new: number | null;
  text: string;
};

type FileDiff = {
  id: string;
  path: string;
  additions: number;
  deletions: number;
  lines: Line[];
};

const FILES: FileDiff[] = [
  {
    id: "f1",
    path: "services/payments/retry.ts",
    additions: 9,
    deletions: 3,
    lines: [
      {
        kind: "hunk",
        old: null,
        new: null,
        text: "@@ -18,13 +18,19 @@ export function withRetry(",
      },
      {
        kind: "context",
        old: 18,
        new: 18,
        text: "  const max = options.maxAttempts ?? 5;",
      },
      { kind: "context", old: 19, new: 19, text: "  let attempt = 0;" },
      { kind: "del", old: 20, new: null, text: "  const backoff = 100;" },
      {
        kind: "add",
        old: null,
        new: 20,
        text: "  const baseBackoff = options.backoffMs ?? 200;",
      },
      {
        kind: "add",
        old: null,
        new: 21,
        text: "  const jitter = () => Math.random() * baseBackoff;",
      },
      { kind: "context", old: 21, new: 22, text: "" },
      { kind: "context", old: 22, new: 23, text: "  while (attempt < max) {" },
      {
        kind: "del",
        old: 23,
        new: null,
        text: "    await sleep(backoff * attempt);",
      },
      {
        kind: "add",
        old: null,
        new: 24,
        text: "    await sleep(baseBackoff * 2 ** attempt + jitter());",
      },
      { kind: "context", old: 24, new: 25, text: "    try {" },
      { kind: "context", old: 25, new: 26, text: "      return await run();" },
      { kind: "del", old: 26, new: null, text: "    } catch (err) {" },
      { kind: "add", old: null, new: 27, text: "    } catch (err: unknown) {" },
      {
        kind: "add",
        old: null,
        new: 28,
        text: "      if (!isRetryable(err)) throw err;",
      },
      { kind: "context", old: 27, new: 29, text: "      attempt += 1;" },
      { kind: "context", old: 28, new: 30, text: "    }" },
      { kind: "context", old: 29, new: 31, text: "  }" },
      { kind: "context", old: 30, new: 32, text: "" },
      {
        kind: "context",
        old: 31,
        new: 33,
        text: "  throw new RetryError(max);",
      },
      { kind: "context", old: 32, new: 34, text: "}" },
    ],
  },
  {
    id: "f2",
    path: "services/payments/idempotency.ts",
    additions: 6,
    deletions: 1,
    lines: [
      {
        kind: "hunk",
        old: null,
        new: null,
        text: '@@ -4,7 +4,12 @@ import { createHash } from "crypto";',
      },
      {
        kind: "context",
        old: 4,
        new: 4,
        text: "export function keyFor(request: ChargeRequest) {",
      },
      { kind: "del", old: 5, new: null, text: "  return request.id;" },
      {
        kind: "add",
        old: null,
        new: 5,
        text: "  const seed = [request.customerId, request.amount, request.currency];",
      },
      { kind: "add", old: null, new: 6, text: '  return createHash("sha256")' },
      { kind: "add", old: null, new: 7, text: '    .update(seed.join(":"))' },
      { kind: "add", old: null, new: 8, text: '    .digest("hex")' },
      { kind: "add", old: null, new: 9, text: "    .slice(0, 32);" },
      { kind: "context", old: 6, new: 10, text: "}" },
    ],
  },
];

function Counts({ add, del }: { add: number; del: number }) {
  return (
    <span className="shrink-0 font-mono text-xs tabular-nums">
      <span className="text-emerald-600 dark:text-emerald-400">+{add}</span>{" "}
      <span className="text-red-600 dark:text-red-400">&minus;{del}</span>
    </span>
  );
}

function Diff({ lines }: { lines: Line[] }) {
  const scroll = useScrollFadeX<HTMLDivElement>();
  return (
    <div className="relative">
      <div
        ref={scroll.ref}
        onScroll={scroll.onScroll}
        className="overflow-x-auto"
      >
        <div className="min-w-max pb-1 font-mono text-xs leading-relaxed">
          {lines.map((l, i) => {
            if (l.kind === "hunk") {
              return (
                <div
                  key={i}
                  className="whitespace-pre bg-neutral-100 px-2 py-0.5 text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-500"
                >
                  {l.text}
                </div>
              );
            }
            return (
              <div
                key={i}
                className={cx(
                  "flex",
                  l.kind === "add" &&
                    "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12]",
                  l.kind === "del" &&
                    "bg-red-500/[0.08] dark:bg-red-500/[0.12]",
                )}
              >
                <span className="w-10 shrink-0 select-none px-2 text-right tabular-nums text-neutral-500 dark:text-neutral-500">
                  {l.old ?? ""}
                </span>
                <span className="w-10 shrink-0 select-none px-2 text-right tabular-nums text-neutral-500 dark:text-neutral-500">
                  {l.new ?? ""}
                </span>
                <span className="w-4 shrink-0 select-none text-center text-neutral-500 dark:text-neutral-500">
                  {l.kind === "add" ? "+" : l.kind === "del" ? "\u2212" : ""}
                </span>
                <span className="whitespace-pre pr-4 text-neutral-800 dark:text-neutral-200">
                  {l.text || " "}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        aria-hidden="true"
        className={cx(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
          scroll.edges.start ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cx(
          "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
          scroll.edges.end ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

export default function ToolCalls3() {
  const uid = useId();
  const files = FILES;
  const [openId, setOpenId] = useState<string>("f1");
  const body = useScrollFade<HTMLDivElement>();
  const totalAdd = files.reduce((s, f) => s + f.additions, 0);
  const totalDel = files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="relative flex h-full min-h-[560px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <header className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-xs text-neutral-500 dark:text-neutral-500">
            edit_file
          </span>
          <h2 className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Applied 2 file edits
          </h2>
        </div>
        <Counts add={totalAdd} del={totalDel} />
      </header>

      <div className="relative min-h-0 flex-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <div
          ref={body.ref}
          onScroll={body.onScroll}
          className="h-full space-y-1 overflow-y-auto overscroll-contain rounded-[var(--rb-r-lg,10px)]"
        >
          {files.map((f) => {
            const open = openId === f.id;
            const panelId = `${uid}-${f.id}`;
            const header = (
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? "" : f.id)}
                className={cx(
                  "flex h-10 w-full cursor-pointer items-center gap-2 px-2 text-left transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                  open
                    ? "rounded-t-[var(--rb-r-md,8px)] hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    : "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white hover:bg-neutral-50 active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900 dark:active:bg-neutral-800/70",
                )}
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 dark:bg-neutral-800">
                  <ChevronRight
                    aria-hidden="true"
                    className={cx(
                      "h-3.5 w-3.5 text-neutral-500 transition-transform duration-150 ease-out dark:text-neutral-500",
                      open && "rotate-90",
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-neutral-900 dark:text-neutral-100">
                  {f.path}
                </span>
                <Counts add={f.additions} del={f.deletions} />
              </button>
            );
            return open ? (
              <div
                key={f.id}
                className="overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950"
              >
                {header}
                <div id={panelId}>
                  <Diff lines={f.lines} />
                </div>
              </div>
            ) : (
              <div key={f.id}>{header}</div>
            );
          })}
        </div>

        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-1 top-1 h-8 rounded-t-[var(--rb-r-lg,10px)] bg-gradient-to-b from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
            body.edges.start ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-1 bottom-1 h-8 rounded-b-[var(--rb-r-lg,10px)] bg-gradient-to-t from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
            body.edges.end ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
}

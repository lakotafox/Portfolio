"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Database, RefreshCw } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const states = ["Loading", "Empty", "Error"] as const;
type ViewState = (typeof states)[number];

const SKELETON_WIDTHS: readonly (readonly [string, string])[] = [
  ["w-40", "w-24"],
  ["w-32", "w-20"],
  ["w-48", "w-28"],
  ["w-36", "w-20"],
  ["w-28", "w-24"],
  ["w-44", "w-16"],
  ["w-32", "w-28"],
  ["w-40", "w-20"],
  ["w-24", "w-24"],
  ["w-44", "w-24"],
  ["w-36", "w-20"],
];

const headBase =
  "h-9 px-3 text-xs font-medium text-neutral-500 first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6";
const cellBase =
  "px-3 text-[13px] first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6";

function HeadRow() {
  return (
    <thead className="sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-900">
      <tr>
        <th scope="col" className={headBase}>
          Source
        </th>
        <th scope="col" className={cx(headBase, "w-[180px]")}>
          Owner
        </th>
        <th scope="col" className={cx(headBase, "w-[150px]")}>
          Status
        </th>
        <th scope="col" className={cx(headBase, "w-[120px] text-right")}>
          Records
        </th>
      </tr>
    </thead>
  );
}

function Bar({ className }: { className: string }) {
  return (
    <span
      className={cx(
        "block h-3 rounded-[var(--rb-r-sm,6px)] bg-neutral-200 dark:bg-neutral-800",
        className,
      )}
    />
  );
}

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

export default function DataTable7() {
  const body = useScrollFade<HTMLDivElement>();
  const [view, setView] = useState<ViewState>("Loading");

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 bg-neutral-50 px-4 sm:px-6 dark:bg-neutral-900">
          <h2 className="min-w-0 flex-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Connected sources
          </h2>
          <div
            role="group"
            aria-label="Preview state"
            className="flex h-8 shrink-0 items-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 p-0.5 dark:bg-neutral-800"
          >
            {states.map((s) => {
              const active = view === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setView(s)}
                  className={cx(
                    "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] font-medium transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                    active
                      ? "bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </header>

        <div className="relative min-h-0 flex-1">
          <div
            ref={body.ref}
            onScroll={body.onScroll}
            aria-busy={view === "Loading"}
            className="h-full overflow-y-auto"
          >
            <table
              className={cx(
                "w-full min-w-[640px] border-collapse text-left",
                view !== "Loading" && "h-full",
              )}
            >
              <caption className="sr-only">
                {view === "Loading"
                  ? "Loading connected sources"
                  : view === "Empty"
                    ? "No connected sources"
                    : "Connected sources failed to load"}
              </caption>
              <HeadRow />

              {view === "Loading" && (
                <tbody
                  aria-hidden
                  className="animate-pulse divide-y divide-neutral-100 motion-reduce:animate-none dark:divide-neutral-800/70"
                >
                  {SKELETON_WIDTHS.map((w, i) => (
                    <tr key={i} className="h-11">
                      <td className={cellBase}>
                        <Bar className={w[0]} />
                      </td>
                      <td className={cellBase}>
                        <Bar className={w[1]} />
                      </td>
                      <td className={cellBase}>
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                          <Bar className="w-16" />
                        </div>
                      </td>
                      <td className={cellBase}>
                        <Bar className="ml-auto w-14" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}

              {view === "Empty" && (
                <tbody>
                  <tr>
                    <td colSpan={4} className="px-4 py-16 align-middle sm:px-6">
                      <div className="flex flex-col items-center justify-center text-center">
                        <span
                          aria-hidden
                          className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                        >
                          <Database className="h-5 w-5" />
                        </span>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          No sources connected
                        </p>
                        <p className="mt-1 max-w-xs text-xs text-neutral-600 dark:text-neutral-400">
                          Connect a warehouse, billing system, or event stream
                          to start syncing records.
                        </p>
                        <button
                          type="button"
                          className="mt-4 inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                        >
                          Connect a source
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              )}

              {view === "Error" && (
                <tbody>
                  <tr>
                    <td colSpan={4} className="px-4 py-16 align-middle sm:px-6">
                      <div
                        role="alert"
                        className="mx-auto flex w-full max-w-sm items-start gap-2.5 rounded-[var(--rb-r-md,8px)] border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10"
                      >
                        <AlertCircle
                          aria-hidden
                          className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                            Couldn&rsquo;t load sources
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                            The sync service didn&rsquo;t respond within 30
                            seconds.
                          </p>
                          <button
                            type="button"
                            onClick={() => setView("Loading")}
                            className="mt-2.5 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-900 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-100 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                          >
                            <RefreshCw
                              aria-hidden
                              className="h-3.5 w-3.5 shrink-0"
                            />
                            Try again
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              body.edges.end ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <footer
          aria-live="polite"
          className="flex h-12 shrink-0 items-center bg-neutral-50 px-4 text-xs text-neutral-600 sm:px-6 dark:bg-neutral-900 dark:text-neutral-400"
        >
          {view === "Loading"
            ? "Loading sources…"
            : view === "Empty"
              ? "0 sources"
              : "Last synced 30 minutes ago"}
        </footer>
      </div>
    </div>
  );
}

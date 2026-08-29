"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Row = {
  title: string;
  planned: number;
  actual: number | null;
};

const ROWS: Row[] = [
  { title: "Read the billing contract notes", planned: 2, actual: 3 },
  { title: "Map the entitlement resolver", planned: 3, actual: 2 },
  { title: "Patch the tier lookup fallback", planned: 6, actual: 11 },
  { title: "Add a renewal-grace test", planned: 5, actual: 5 },
  { title: "Summarize the handoff", planned: 1, actual: null },
];

const plannedTotal = ROWS.reduce((sum, r) => sum + r.planned, 0);
const actualTotal = ROWS.reduce((sum, r) => sum + (r.actual ?? 0), 0);
const drift = actualTotal - plannedTotal;
const stepsLeft = ROWS.filter((r) => r.actual === null).length;
const scaleMax = Math.max(
  ...ROWS.map((r) => Math.max(r.planned, r.actual ?? 0)),
);

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-neutral-400 dark:text-neutral-600">, </span>;
  }
  const over = value > 0;
  return (
    <span
      className={cx(
        "tabular-nums",
        over
          ? "text-red-600 dark:text-red-400"
          : "text-neutral-600 dark:text-neutral-400",
      )}
    >
      {over ? "+" : "−"}
      {Math.abs(value)}m
    </span>
  );
}

function DurationBar({
  planned,
  actual,
}: {
  planned: number;
  actual: number | null;
}) {
  return (
    <span
      aria-hidden="true"
      className="relative block h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-neutral-900 transition-[width] duration-500 ease-out motion-reduce:transition-none dark:bg-neutral-100"
        style={{ width: `${((actual ?? 0) / scaleMax) * 100}%` }}
      />
      <span
        className="absolute inset-y-0 w-px bg-neutral-400 dark:bg-neutral-500"
        style={{ left: `${(planned / scaleMax) * 100}%` }}
      />
    </span>
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

export default function AgentPlan4() {
  const body = useScrollFade<HTMLElement>();
  return (
    <div className="relative flex h-full min-h-[480px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <header className="mb-3 flex shrink-0 items-center gap-3">
        <h2 className="min-w-0 flex-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Plan vs actual
        </h2>
        <span className="shrink-0 text-[13px] tabular-nums text-neutral-500 dark:text-neutral-400">
          {stepsLeft} step{stepsLeft === 1 ? "" : "s"} left
        </span>
      </header>

      <div className="mb-3 grid shrink-0 grid-cols-3 gap-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="min-w-0 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
            Planned
          </p>
          <p className="mt-1 text-lg font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
            {plannedTotal}m
          </p>
        </div>
        <div className="min-w-0 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
            Actual
          </p>
          <p className="mt-1 text-lg font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
            {actualTotal}m
          </p>
        </div>
        <div className="min-w-0 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
            Drift
          </p>
          <p className="mt-1 text-lg font-medium">
            <Delta value={drift} />
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <main
            ref={body.ref}
            onScroll={body.onScroll}
            className="h-full overflow-y-auto overscroll-contain"
          >
            <table className="w-full table-fixed border-collapse">
              <caption className="sr-only">
                Planned versus actual duration for each step
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="h-9 w-[38%] px-3 text-left text-xs font-medium text-neutral-500 sm:px-4 dark:text-neutral-500"
                  >
                    Step
                  </th>
                  <th
                    scope="col"
                    className="hidden h-9 px-3 text-left text-xs font-medium text-neutral-500 sm:table-cell dark:text-neutral-500"
                  >
                    Duration
                  </th>
                  <th
                    scope="col"
                    className="h-9 w-14 px-3 text-right sm:w-20 text-xs font-medium text-neutral-500 dark:text-neutral-500"
                  >
                    Planned
                  </th>
                  <th
                    scope="col"
                    className="h-9 w-14 px-3 text-right sm:w-20 text-xs font-medium text-neutral-500 dark:text-neutral-500"
                  >
                    Actual
                  </th>
                  <th
                    scope="col"
                    className="h-9 w-14 px-3 text-right sm:w-20 text-xs font-medium text-neutral-500 sm:px-4 dark:text-neutral-500"
                  >
                    Drift
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {ROWS.map((row) => {
                  const pending = row.actual === null;
                  return (
                    <tr
                      key={row.title}
                      className="transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <th
                        scope="row"
                        className="h-11 truncate px-3 text-left text-[13px] font-medium text-neutral-900 sm:px-4 dark:text-neutral-100"
                      >
                        {row.title}
                      </th>
                      <td className="hidden h-11 px-3 align-middle sm:table-cell">
                        <DurationBar
                          planned={row.planned}
                          actual={row.actual}
                        />
                      </td>
                      <td className="h-11 px-3 text-right text-[13px] tabular-nums text-neutral-500 dark:text-neutral-500">
                        {row.planned}m
                      </td>
                      <td className="h-11 px-3 text-right text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                        {pending ? (
                          <span className="text-neutral-400 dark:text-neutral-600">
                            -
                          </span>
                        ) : (
                          `${row.actual}m`
                        )}
                      </td>
                      <td className="h-11 px-3 text-right text-[13px] sm:px-4">
                        {pending ? (
                          <span className="text-neutral-400 dark:text-neutral-600">
                            -
                          </span>
                        ) : (
                          <Delta value={(row.actual ?? 0) - row.planned} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </main>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              body.edges.start ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              body.edges.end ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      </div>
    </div>
  );
}

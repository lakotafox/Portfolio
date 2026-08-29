"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Order = {
  id: string;
  customer: string;
  lane: string;
  status: "On time" | "Watch" | "Delayed";
  pallets: number;
  eta: string;
};

type Group = { label: string; orders: Order[] };

const groups: Group[] = [
  {
    label: "Today",
    orders: [
      {
        id: "ORD-4418",
        customer: "Tidal Packworks",
        lane: "Oakland → Reno",
        status: "On time",
        pallets: 18,
        eta: "11:30",
      },
      {
        id: "ORD-4419",
        customer: "Harborline Grocers",
        lane: "Tacoma → Boise",
        status: "Watch",
        pallets: 26,
        eta: "13:45",
      },
      {
        id: "ORD-4420",
        customer: "Juniper Health Distribution",
        lane: "Dallas → Tulsa",
        status: "On time",
        pallets: 12,
        eta: "16:10",
      },
      {
        id: "ORD-4421",
        customer: "Blue Orchard Cooperative",
        lane: "Fresno → Phoenix",
        status: "Delayed",
        pallets: 31,
        eta: "18:20",
      },
    ],
  },
  {
    label: "Tomorrow",
    orders: [
      {
        id: "ORD-4423",
        customer: "Cedar Mill Provisions",
        lane: "Portland → Eugene",
        status: "On time",
        pallets: 14,
        eta: "08:15",
      },
      {
        id: "ORD-4424",
        customer: "Ridgeway Medical Supply",
        lane: "Denver → Cheyenne",
        status: "Watch",
        pallets: 22,
        eta: "10:40",
      },
      {
        id: "ORD-4425",
        customer: "Marble Arch Importers",
        lane: "Newark → Hartford",
        status: "On time",
        pallets: 7,
        eta: "12:00",
      },
    ],
  },
  {
    label: "This week",
    orders: [
      {
        id: "ORD-4428",
        customer: "Bellwether Cold Storage",
        lane: "Atlanta → Nashville",
        status: "On time",
        pallets: 24,
        eta: "Wed 09:20",
      },
      {
        id: "ORD-4429",
        customer: "Kestrel Outdoor",
        lane: "Salt Lake City → Boise",
        status: "On time",
        pallets: 11,
        eta: "Thu 11:10",
      },
      {
        id: "ORD-4430",
        customer: "Vermillion Paper Mills",
        lane: "Duluth → Fargo",
        status: "Watch",
        pallets: 33,
        eta: "Thu 15:45",
      },
    ],
  },
];

const headBase =
  "h-9 px-3 text-xs font-medium text-neutral-500 first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6";
const cellBase =
  "px-3 text-[13px] first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6";

function StatusCell({ status }: { status: Order["status"] }) {
  const dot =
    status === "Delayed"
      ? "bg-red-500"
      : status === "Watch"
        ? "bg-amber-500"
        : "bg-neutral-300 dark:bg-neutral-600";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-neutral-600 dark:text-neutral-400">
      <span
        aria-hidden
        className={cx("h-1.5 w-1.5 shrink-0 rounded-full", dot)}
      />
      {status}
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

export default function DataTable5() {
  const body = useScrollFade<HTMLDivElement>();
  const [dense, setDense] = useState(false);
  const rowH = dense ? "h-9" : "h-11";
  const total = groups.reduce((n, g) => n + g.orders.length, 0);

  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 bg-neutral-50 px-4 sm:px-6 dark:bg-neutral-900">
          <h2 className="min-w-0 flex-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Dispatch board
          </h2>
          <div className="flex h-8 shrink-0 items-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 p-0.5 dark:bg-neutral-800">
            {[
              { key: false, label: "Comfortable" },
              { key: true, label: "Compact" },
            ].map((opt) => {
              const active = dense === opt.key;
              return (
                <button
                  key={opt.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDense(opt.key)}
                  className={cx(
                    "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] font-medium transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                    active
                      ? "bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </header>

        <div className="relative min-h-0 flex-1">
          <div
            ref={body.ref}
            onScroll={body.onScroll}
            className="h-full overflow-auto"
          >
            <table className="w-full min-w-[760px] border-collapse text-left">
              <caption className="sr-only">
                Dispatch orders grouped by day
              </caption>
              <thead className="sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th scope="col" className={headBase}>
                    Order
                  </th>
                  <th scope="col" className={headBase}>
                    Lane
                  </th>
                  <th scope="col" className={cx(headBase, "w-[140px]")}>
                    Status
                  </th>
                  <th
                    scope="col"
                    className={cx(headBase, "w-[100px] text-right")}
                  >
                    Pallets
                  </th>
                  <th
                    scope="col"
                    className={cx(headBase, "w-[120px] text-right")}
                  >
                    ETA
                  </th>
                </tr>
              </thead>
              {groups.map((group) => (
                <tbody
                  key={group.label}
                  className="divide-y divide-neutral-100 dark:divide-neutral-800/70"
                >
                  <tr>
                    <th
                      colSpan={5}
                      scope="colgroup"
                      className="sticky top-9 z-10 bg-neutral-50 py-1.5 pl-4 pr-4 text-left sm:pl-6 sm:pr-6 dark:bg-neutral-900"
                    >
                      <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                        {group.label}
                      </span>
                      <span className="ml-2 text-[11px] tabular-nums text-neutral-400 dark:text-neutral-600">
                        {group.orders.length}
                      </span>
                    </th>
                  </tr>
                  {group.orders.map((o) => (
                    <tr
                      key={o.id}
                      className={cx(
                        rowH,
                        "transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
                      )}
                    >
                      <td
                        className={cx(
                          cellBase,
                          "max-w-[260px] font-medium text-neutral-900 dark:text-neutral-100",
                        )}
                      >
                        <span className="block truncate">{o.customer}</span>
                        {!dense && (
                          <span className="block font-mono text-xs text-neutral-500">
                            {o.id}
                          </span>
                        )}
                      </td>
                      <td
                        className={cx(
                          cellBase,
                          "truncate text-neutral-600 dark:text-neutral-400",
                        )}
                      >
                        {o.lane}
                      </td>
                      <td className={cellBase}>
                        <StatusCell status={o.status} />
                      </td>
                      <td
                        className={cx(
                          cellBase,
                          "text-right tabular-nums text-neutral-900 dark:text-neutral-100",
                        )}
                      >
                        {o.pallets}
                      </td>
                      <td
                        className={cx(
                          cellBase,
                          "whitespace-nowrap text-right tabular-nums text-neutral-600 dark:text-neutral-400",
                        )}
                      >
                        {o.eta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
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

        <footer className="flex h-12 shrink-0 items-center bg-neutral-50 px-4 text-xs tabular-nums text-neutral-600 sm:px-6 dark:bg-neutral-900 dark:text-neutral-400">
          {total} orders across {groups.length} windows
        </footer>
      </div>
    </div>
  );
}

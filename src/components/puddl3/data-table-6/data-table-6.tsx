"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Search, SearchX } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Event = { time: string; text: string };

type Shipment = {
  id: string;
  client: string;
  lane: string;
  status: "In transit" | "At risk" | "Delivered";
  owner: string;
  temp: string;
  value: number;
  carrier: string;
  eta: string;
  notes: string;
  activity: Event[];
};

const shipments: Shipment[] = [
  {
    id: "SHP-9284",
    client: "Everbranch Foods",
    lane: "Fresno → Denver",
    status: "In transit",
    owner: "Lena Moore",
    temp: "2.4°C",
    value: 48200,
    carrier: "Crossline Freight",
    eta: "Today 17:40",
    notes:
      "Driver confirmed a replacement seal after the weigh-station inspection outside Grand Junction.",
    activity: [
      { time: "14:02", text: "Passed weigh station, seal replaced" },
      { time: "11:18", text: "Departed Fresno cold dock" },
      { time: "09:50", text: "Trailer pre-cooled to 2°C" },
    ],
  },
  {
    id: "SHP-9285",
    client: "Meridian Lab Supply",
    lane: "Boston → Raleigh",
    status: "At risk",
    owner: "Omar Diaz",
    temp: "6.1°C",
    value: 71900,
    carrier: "Beacon Cold Lines",
    eta: "Today 20:10",
    notes:
      "Temperature held above threshold for 18 minutes near Richmond. Quality team requested photos before delivery.",
    activity: [
      { time: "15:26", text: "Temperature excursion cleared" },
      { time: "15:08", text: "Reefer alarm above 6°C" },
      { time: "12:40", text: "Departed Boston" },
      { time: "10:15", text: "Quality hold placed and released" },
    ],
  },
  {
    id: "SHP-9286",
    client: "North Pier Robotics",
    lane: "Austin → Mesa",
    status: "Delivered",
    owner: "Ivy Zhang",
    temp: "-",
    value: 33450,
    carrier: "Sunbelt Haul",
    eta: "Delivered 13:05",
    notes:
      "Dock appointment closed with no shortage claim. Signed by receiving lead.",
    activity: [
      { time: "13:05", text: "Delivered, no exceptions" },
      { time: "12:20", text: "Arrived at Mesa dock" },
      { time: "07:45", text: "Departed Austin" },
    ],
  },
  {
    id: "SHP-9287",
    client: "Longleaf Clinical Research Network International",
    lane: "Newark → Montreal",
    status: "In transit",
    owner: "Sofia Martins",
    temp: "1.9°C",
    value: 126300,
    carrier: "Borderline Logistics",
    eta: "Tomorrow 09:30",
    notes:
      "Customs broker cleared paperwork. Final border scan expected before 17:00.",
    activity: [
      { time: "13:40", text: "Customs paperwork cleared" },
      { time: "11:02", text: "Approaching border crossing" },
      { time: "06:15", text: "Departed Newark" },
    ],
  },
  {
    id: "SHP-9288",
    client: "Cedar Mill Provisions",
    lane: "Portland → Eugene",
    status: "In transit",
    owner: "Marcus Lund",
    temp: "3.2°C",
    value: 18700,
    carrier: "Willamette Transport",
    eta: "Today 18:55",
    notes: "On schedule. No exceptions logged.",
    activity: [
      { time: "16:10", text: "Passed Salem checkpoint" },
      { time: "15:00", text: "Departed Portland" },
    ],
  },
  {
    id: "SHP-9289",
    client: "Bellwether Cold Storage",
    lane: "Atlanta → Nashville",
    status: "Delivered",
    owner: "Asha Malik",
    temp: "-",
    value: 27400,
    carrier: "Piedmont Reefer",
    eta: "Delivered 16:22",
    notes:
      "Delivered complete. Receiving flagged one pallet for a minor label reprint.",
    activity: [
      { time: "16:22", text: "Delivered with note" },
      { time: "15:30", text: "Arrived Nashville" },
    ],
  },
  {
    id: "SHP-9290",
    client: "Ridgeway Medical Supply",
    lane: "Denver → Cheyenne",
    status: "At risk",
    owner: "Theo Grant",
    temp: "5.4°C",
    value: 54800,
    carrier: "Frontier Cold",
    eta: "Today 21:30",
    notes:
      "Delay expected from mountain weather advisory north of Fort Collins.",
    activity: [
      { time: "16:45", text: "Weather advisory on I-25" },
      { time: "14:20", text: "Departed Denver" },
    ],
  },
  {
    id: "SHP-9291",
    client: "Anchor Point Seafood",
    lane: "Seattle → Spokane",
    status: "In transit",
    owner: "Rhea Flores",
    temp: "0.8°C",
    value: 39900,
    carrier: "Cascade Freight",
    eta: "Today 22:15",
    notes: "Running on schedule across the pass.",
    activity: [
      { time: "17:05", text: "Cleared Snoqualmie Pass" },
      { time: "14:30", text: "Departed Seattle" },
    ],
  },
  {
    id: "SHP-9292",
    client: "Harbor Grove Dairy",
    lane: "Sacramento → Reno",
    status: "In transit",
    owner: "Dana Cole",
    temp: "3.7°C",
    value: 21600,
    carrier: "Sierra Reefer",
    eta: "Today 19:20",
    notes: "On schedule over the Donner summit route.",
    activity: [
      { time: "16:50", text: "Cleared Donner summit" },
      { time: "15:10", text: "Departed Sacramento" },
    ],
  },
  {
    id: "SHP-9293",
    client: "Vantage Pharma Distribution",
    lane: "Chicago → Columbus",
    status: "At risk",
    owner: "Priya Nair",
    temp: "5.9°C",
    value: 88400,
    carrier: "Great Lakes Cold",
    eta: "Today 23:05",
    notes: "Reefer running warm near Gary; driver monitoring closely.",
    activity: [
      { time: "17:12", text: "Reefer trending warm" },
      { time: "13:55", text: "Departed Chicago" },
    ],
  },
  {
    id: "SHP-9294",
    client: "Tidewater Produce",
    lane: "Norfolk → Richmond",
    status: "Delivered",
    owner: "Grant Ellis",
    temp: "-",
    value: 15200,
    carrier: "Bayfront Haul",
    eta: "Delivered 12:48",
    notes: "Delivered complete with signed receipt.",
    activity: [
      { time: "12:48", text: "Delivered, no exceptions" },
      { time: "10:30", text: "Departed Norfolk" },
    ],
  },
];

function StatusCell({ status }: { status: Shipment["status"] }) {
  const dot =
    status === "At risk"
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

const currency = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

function Field({
  label,
  value,
  numeric,
}: {
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </dt>
      <dd
        className={cx(
          "mt-0.5 truncate text-[13px] text-neutral-900 dark:text-neutral-100",
          numeric && "tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
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

export default function DataTable6() {
  const list = useScrollFade<HTMLUListElement>();
  const detail = useScrollFade<HTMLDivElement>();
  const [selectedId, setSelectedId] = useState(shipments[0].id);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter(
      (s) =>
        s.client.toLowerCase().includes(q) ||
        s.lane.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    );
  }, [query]);

  const selected =
    rows.find((s) => s.id === selectedId) ?? rows[0] ?? shipments[0];

  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 bg-neutral-50 px-4 sm:px-6 dark:bg-neutral-900">
          <h2 className="min-w-0 flex-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Live shipments
          </h2>
          <span className="shrink-0 text-xs tabular-nums text-neutral-500">
            {shipments.length} moving
          </span>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex w-full min-w-0 flex-col bg-neutral-50 lg:w-80 lg:shrink-0 dark:bg-neutral-900">
            <div className="flex h-12 shrink-0 items-center px-1.5">
              <label className="relative w-full">
                <span className="sr-only">Search shipments</span>
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search shipments"
                  className="h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                />
              </label>
            </div>
            <div className="relative min-h-0 flex-1">
              <ul
                ref={list.ref}
                onScroll={list.onScroll}
                className="flex h-full flex-col gap-1 overflow-y-auto p-1.5"
              >
                {rows.map((s) => {
                  const isSel = s.id === selected.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        aria-current={isSel ? "true" : undefined}
                        onClick={() => setSelectedId(s.id)}
                        className={cx(
                          "flex w-full items-center gap-3 rounded-[var(--rb-r-lg,10px)] px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                          isSel
                            ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-950 dark:shadow-none"
                            : "hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={cx(
                              "truncate text-[13px] text-neutral-900 dark:text-neutral-100",
                              isSel && "font-medium",
                            )}
                          >
                            {s.client}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <p className="min-w-0 flex-1 truncate text-xs text-neutral-500">
                              {s.lane}
                            </p>
                            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-neutral-500">
                              <span
                                aria-hidden
                                className={cx(
                                  "h-1.5 w-1.5 shrink-0 rounded-full",
                                  s.status === "At risk"
                                    ? "bg-amber-500"
                                    : "bg-neutral-300 dark:bg-neutral-600",
                                )}
                              />
                              {s.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
                {rows.length === 0 && (
                  <li className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <span
                      aria-hidden
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    >
                      <SearchX className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      No shipments found
                    </p>
                    <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                      Try a client, a lane, or a shipment ID.
                    </p>
                  </li>
                )}
              </ul>

              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                  list.edges.start ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                  list.edges.end ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 flex-col lg:flex">
            <div className="flex h-[86px] shrink-0 items-start gap-3 bg-neutral-50 px-5 py-4 dark:bg-neutral-900">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-500">
                    {selected.id}
                  </span>
                  <StatusCell status={selected.status} />
                </div>
                <h3 className="mt-1 truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                  {selected.client}
                </h3>
                <p className="truncate text-[13px] text-neutral-600 dark:text-neutral-400">
                  {selected.lane}
                </p>
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              <div
                ref={detail.ref}
                onScroll={detail.onScroll}
                className="h-full overflow-y-auto px-5 py-4"
              >
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 p-4 dark:bg-neutral-900">
                  <Field label="Owner" value={selected.owner} />
                  <Field label="Carrier" value={selected.carrier} />
                  <Field label="Temperature" value={selected.temp} numeric />
                  <Field
                    label="Declared value"
                    value={currency(selected.value)}
                    numeric
                  />
                  <Field label="ETA" value={selected.eta} numeric />
                </dl>

                <div className="mt-4 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 p-4 dark:bg-neutral-900">
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Notes
                  </h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {selected.notes}
                  </p>
                </div>

                <div className="mt-4 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 p-4 dark:bg-neutral-900">
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Activity
                  </h4>
                  <ol className="mt-3 space-y-3">
                    {selected.activity.map((e, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] text-neutral-900 dark:text-neutral-100">
                            {e.text}
                          </p>
                          <p className="text-xs tabular-nums text-neutral-500">
                            {e.time}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                  detail.edges.start ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                  detail.edges.end ? "opacity-100" : "opacity-0",
                )}
              />
            </div>

            <div className="flex h-16 shrink-0 items-center justify-end gap-2 bg-neutral-50 px-5 dark:bg-neutral-900">
              <button
                type="button"
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-100 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <MessageSquare aria-hidden className="h-4 w-4 shrink-0" />
                Message driver
              </button>
              <button
                type="button"
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                Mark delivered
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

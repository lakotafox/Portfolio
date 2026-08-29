"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { MoreHorizontal } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const TILES = [
  {
    label: "Active users",
    value: "8,472",
    delta: "+3.2%",
    positive: true,
    spark: [40, 44, 42, 48, 52, 50, 58, 62],
  },
  {
    label: "Sessions",
    value: "21,908",
    delta: "+5.1%",
    positive: true,
    spark: [60, 62, 66, 64, 70, 74, 78, 83],
  },
  {
    label: "Avg. session",
    value: "4m 12s",
    delta: "−1.4%",
    positive: false,
    spark: [55, 54, 56, 52, 51, 50, 49, 47],
  },
  {
    label: "Bounce rate",
    value: "38.6%",
    delta: "+0.9 pp",
    positive: false,
    spark: [30, 31, 33, 32, 34, 35, 37, 39],
  },
];

const SESSIONS = [
  520, 486, 543, 610, 588, 640, 705, 672, 718, 690, 748, 760, 795, 812,
];

const PAGES = [
  { path: "/", views: "48,210" },
  { path: "/pricing", views: "22,984" },
  { path: "/docs/quickstart", views: "18,663" },
  { path: "/changelog", views: "9,120" },
  { path: "/blog/series-b", views: "6,845" },
];

const DEVICES = [
  { label: "Desktop", pct: 62 },
  { label: "Mobile", pct: 31 },
  { label: "Tablet", pct: 7 },
];

const FUNNEL = [
  { label: "Visited", value: "21,908" },
  { label: "Signed up", value: "3,914" },
  { label: "Activated", value: "2,180" },
  { label: "Subscribed", value: "1,024" },
];

const CARD =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900";

const REFRESH_MS = 900;

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 92 - ((v - min) / span) * 84;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      className="hidden h-8 w-16 shrink-0 sm:block"
    >
      <polyline
        points={points}
        fill="none"
        vectorEffect="non-scaling-stroke"
        className="stroke-neutral-900 dark:stroke-neutral-100"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

function WidgetMenu({
  title,
  onRefresh,
  onHide,
}: {
  title: string;
  onRefresh: () => void;
  onHide: () => void;
}) {
  const items = [
    { label: "Refresh data", run: onRefresh },
    { label: "Hide widget", run: onHide },
  ];
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

  const openMenu = (index: number, withTransition: boolean) => {
    setActive(index);
    setOpen(true);
    if (withTransition) {
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

  const choose = (index: number) => {
    close();
    items[index].run();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(0, false);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(items.length - 1, false);
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
        setActive((i) => (i + 1) % items.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((i) => (i - 1 + items.length) % items.length);
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(items.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${title} options`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : openMenu(0, true))}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-500 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
      >
        <MoreHorizontal className="h-4 w-4 shrink-0" aria-hidden />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`${title} options`}
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className={cx(
            "absolute right-0 top-full z-30 mt-1.5 w-40 origin-top-right overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-1 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] outline-none transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none",
            shown ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => choose(index)}
              onPointerMove={() => setActive(index)}
              className={cx(
                "flex h-8 w-full cursor-pointer items-center rounded-[var(--rb-r-lg,10px)] px-2 text-left text-[13px] text-neutral-700 transition-colors duration-150 dark:text-neutral-300",
                index === active
                  ? "bg-neutral-100 dark:bg-neutral-800"
                  : "bg-transparent",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Widget({
  id,
  title,
  className,
  refreshing,
  skeleton,
  onRefresh,
  onHide,
  children,
}: {
  id: string;
  title: string;
  className?: string;
  refreshing: boolean;
  skeleton: ReactNode;
  onRefresh: (id: string) => void;
  onHide: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <section className={cx(CARD, className)} aria-busy={refreshing}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        <WidgetMenu
          title={title}
          onRefresh={() => onRefresh(id)}
          onHide={() => onHide(id)}
        />
      </div>
      {refreshing ? (
        <div aria-hidden className="animate-pulse motion-reduce:animate-none">
          {skeleton}
        </div>
      ) : (
        children
      )}
    </section>
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

export default function Dashboard3() {
  const body = useScrollFade<HTMLDivElement>();
  const [hidden, setHidden] = useState<string[]>([]);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const maxSession = Math.max(...SESSIONS);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const refresh = (id: string) => {
    window.clearTimeout(timerRef.current);
    setRefreshingId(id);
    timerRef.current = window.setTimeout(
      () => setRefreshingId(null),
      REFRESH_MS,
    );
  };

  const hide = (id: string) => setHidden((prev) => [...prev, id]);

  const widget = (id: string) => ({
    id,
    refreshing: refreshingId === id,
    onRefresh: refresh,
    onHide: hide,
  });

  return (
    <div className="relative flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 sm:px-6 dark:border-neutral-800">
        <h1 className="truncate text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
          Web analytics
        </h1>
        {hidden.length > 0 ? (
          <button
            type="button"
            onClick={() => setHidden([])}
            className="inline-flex h-8 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium tabular-nums text-neutral-900 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
          >
            Show {hidden.length} hidden
          </button>
        ) : (
          <span className="shrink-0 text-[13px] tabular-nums text-neutral-500">
            Updated 2 min ago
          </span>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={body.ref}
          onScroll={body.onScroll}
          className="h-full overflow-y-auto p-4 sm:p-6"
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {TILES.map((t) => (
              <div key={t.label} className={CARD}>
                <p className="truncate text-[13px] text-neutral-500">
                  {t.label}
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="truncate text-2xl font-medium tabular-nums tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                    {t.value}
                  </p>
                  <Sparkline values={t.spark} />
                </div>
                <p className="mt-1.5 truncate text-[13px] tabular-nums">
                  <span
                    className={
                      t.positive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {t.delta}
                  </span>
                  <span className="text-neutral-500"> vs. last week</span>
                </p>
              </div>
            ))}

            {!hidden.includes("sessions") && (
              <Widget
                {...widget("sessions")}
                title="Sessions, last 14 days"
                className="flex flex-col sm:col-span-2"
                skeleton={
                  <>
                    <div className="mt-4 h-40 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 dark:bg-neutral-800" />
                    <div className="mt-2 flex justify-between">
                      <Bar className="w-10" />
                      <Bar className="w-10" />
                    </div>
                  </>
                }
              >
                <div className="mt-4 flex h-40 items-end gap-1.5">
                  {SESSIONS.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-[var(--rb-r-xs,4px)] bg-neutral-900 dark:bg-neutral-100"
                      style={{ height: `${(v / maxSession) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] tabular-nums text-neutral-500">
                  <span>Mar 1</span>
                  <span>Mar 14</span>
                </div>
              </Widget>
            )}

            {!hidden.includes("pages") && (
              <Widget
                {...widget("pages")}
                title="Top pages"
                className="sm:col-span-2"
                skeleton={
                  <div className="mt-3 flex flex-col gap-1.5">
                    {PAGES.map((p) => (
                      <div
                        key={p.path}
                        className="h-9 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 dark:bg-neutral-800"
                      />
                    ))}
                  </div>
                }
              >
                <ul className="mt-3 flex flex-col gap-1.5">
                  {PAGES.map((p) => (
                    <li
                      key={p.path}
                      className="flex h-9 items-center justify-between gap-3 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 dark:bg-neutral-800/50"
                    >
                      <span className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                        {p.path}
                      </span>
                      <span className="shrink-0 text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                        {p.views}
                      </span>
                    </li>
                  ))}
                </ul>
              </Widget>
            )}

            {!hidden.includes("devices") && (
              <Widget
                {...widget("devices")}
                title="Devices"
                className="sm:col-span-2"
                skeleton={
                  <div className="mt-3 space-y-3">
                    {DEVICES.map((d) => (
                      <div key={d.label}>
                        <div className="flex items-center justify-between">
                          <Bar className="w-16" />
                          <Bar className="w-8" />
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                      </div>
                    ))}
                  </div>
                }
              >
                <ul className="mt-3 space-y-3">
                  {DEVICES.map((d) => (
                    <li key={d.label}>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {d.label}
                        </span>
                        <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                          {d.pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100"
                          style={{ width: `${d.pct}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Widget>
            )}

            {!hidden.includes("funnel") && (
              <Widget
                {...widget("funnel")}
                title="Signup funnel"
                className="sm:col-span-2"
                skeleton={
                  <div className="mt-3 space-y-3">
                    {FUNNEL.map((f) => (
                      <div
                        key={f.label}
                        className="flex items-center justify-between"
                      >
                        <Bar className="w-24" />
                        <Bar className="w-14" />
                      </div>
                    ))}
                  </div>
                }
              >
                <ul className="mt-3 space-y-3">
                  {FUNNEL.map((f, i) => (
                    <li
                      key={f.label}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="inline-flex items-center gap-2 text-[13px] text-neutral-700 dark:text-neutral-300">
                        <span className="w-4 tabular-nums text-neutral-400">
                          {i + 1}
                        </span>
                        {f.label}
                      </span>
                      <span className="text-[13px] tabular-nums text-neutral-900 dark:text-neutral-100">
                        {f.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </Widget>
            )}

            {hidden.length === 4 && (
              <div className="col-span-full flex flex-col items-center justify-center rounded-[var(--rb-r-2xl,14px)] border border-dashed border-neutral-200 px-6 py-12 text-center dark:border-neutral-800">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  All widgets hidden
                </p>
                <p className="mt-1 max-w-xs text-xs text-neutral-600 dark:text-neutral-400">
                  Restore them from the button in the header to see traffic,
                  pages, devices and funnel again.
                </p>
              </div>
            )}
          </div>
        </div>

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
  );
}

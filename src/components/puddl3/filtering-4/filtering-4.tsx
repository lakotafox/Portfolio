"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Layers, Search, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const field =
  "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white";

const checkboxBox =
  "relative inline-flex h-4 w-4 shrink-0 items-center justify-center";

const checkboxClass =
  "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[var(--rb-r-xs,4px)] border border-neutral-300 bg-white transition-colors duration-150 checked:border-neutral-900 checked:bg-neutral-900 hover:border-neutral-400 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:checked:border-white dark:checked:bg-white dark:hover:border-neutral-600 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const checkboxMark =
  "pointer-events-none absolute h-3 w-3 text-[var(--rb-accent-fg,oklch(100%_0_0))] opacity-0 transition-opacity duration-150 peer-checked:opacity-100 motion-reduce:transition-none dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]";

type SelectOption = { value: string; label: string; hint?: string };

function Select({
  id,
  value,
  onChange,
  options,
  disabled,
  placeholder = "Select…",
  className,
  triggerClassName,
  leading,
  ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  leading?: ReactNode;
  ariaLabel?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [flip, setFlip] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ buffer: "", at: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const openList = (index?: number) => {
    if (disabled) return;
    const node = rootRef.current;
    const win = node?.ownerDocument.defaultView;
    if (node && win) {
      const r = node.getBoundingClientRect();
      const room = win.innerHeight - r.bottom;
      const needed = Math.min(options.length * 32 + 8, 264);
      setFlip(room < needed + 8 && r.top > room);
    }
    setActive(index ?? (selectedIndex >= 0 ? selectedIndex : 0));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const node = rootRef.current;
    const doc = node?.ownerDocument;
    if (!doc) return;
    const onPointer = (e: Event) => {
      if (!node.contains(e.target as Node)) setOpen(false);
    };
    doc.addEventListener("mousedown", onPointer);
    doc.addEventListener("touchstart", onPointer);
    return () => {
      doc.removeEventListener("mousedown", onPointer);
      doc.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = bottom - list.clientHeight;
  }, [open, active]);

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    rootRef.current?.querySelector("button")?.focus({ preventScroll: true });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(active);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = Date.now();
      const t = typeahead.current;
      t.buffer = now - t.at > 700 ? e.key : t.buffer + e.key;
      t.at = now;
      const hit = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(t.buffer.toLowerCase()),
      );
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <div ref={rootRef} className={cx("relative", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        className={cx(
          field,
          "flex cursor-pointer items-center justify-between gap-2 pr-2.5 text-left",
          focus,
          "focus-visible:outline-offset-[-2px]",
          open && "border-neutral-900 dark:border-white",
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {leading}
          <span
            className={cx(
              "truncate",
              !selected && "text-neutral-400 dark:text-neutral-500",
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cx(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-150 ease-out motion-reduce:transition-none dark:text-neutral-600",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className={cx(
            "absolute z-30 max-h-[264px] w-full overflow-y-auto rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-900",
            flip ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                data-index={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(i)}
                className={cx(
                  "flex h-8 cursor-pointer items-center justify-between gap-2 rounded-[var(--rb-r-sm,6px)] px-2.5 text-sm text-neutral-900 dark:text-neutral-100",
                  i === active && "bg-neutral-100 dark:bg-neutral-800",
                )}
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate">{o.label}</span>
                  {o.hint && (
                    <span className="shrink-0 text-xs text-neutral-500">
                      {o.hint}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <Check
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-neutral-900 dark:text-white"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
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

type Level = "debug" | "info" | "warn" | "error";

type LogEntry = {
  id: string;
  minutesAgo: number;
  sec: number;
  level: Level;
  service: string;
  message: string;
};

const LEVELS: {
  value: Level;
  label: string;
  dot: string;
  text: string;
}[] = [
  {
    value: "debug",
    label: "Debug",
    dot: "bg-neutral-300 dark:bg-neutral-600",
    text: "text-neutral-500 dark:text-neutral-400",
  },
  {
    value: "info",
    label: "Info",
    dot: "bg-neutral-400 dark:bg-neutral-500",
    text: "text-neutral-600 dark:text-neutral-300",
  },
  {
    value: "warn",
    label: "Warn",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  {
    value: "error",
    label: "Error",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
];

const LEVEL_META = Object.fromEntries(
  LEVELS.map((l) => [l.value, l]),
) as Record<Level, (typeof LEVELS)[number]>;

const SERVICES = [
  { value: "api-gateway", label: "api-gateway" },
  { value: "auth-service", label: "auth-service" },
  { value: "payments", label: "payments" },
  { value: "checkout", label: "checkout" },
  { value: "search-indexer", label: "search-indexer" },
  { value: "notifications", label: "notifications" },
  { value: "scheduler", label: "scheduler" },
  { value: "cdn-edge", label: "cdn-edge" },
];

const RANGES = [
  { value: "15", label: "Last 15 minutes" },
  { value: "60", label: "Last hour" },
  { value: "240", label: "Last 4 hours" },
  { value: "1440", label: "Last 24 hours" },
];

const LOGS: LogEntry[] = [
  {
    id: "l01",
    minutesAgo: 1,
    sec: 8,
    level: "error",
    service: "payments",
    message: "Charge declined: gateway returned 402 for intent pi_3Qa",
  },
  {
    id: "l02",
    minutesAgo: 2,
    sec: 41,
    level: "info",
    service: "checkout",
    message: "Order osq_8841 moved to state confirmed",
  },
  {
    id: "l03",
    minutesAgo: 3,
    sec: 12,
    level: "warn",
    service: "api-gateway",
    message: "Upstream latency 1420ms exceeded p95 budget of 800ms",
  },
  {
    id: "l04",
    minutesAgo: 4,
    sec: 55,
    level: "info",
    service: "auth-service",
    message: "Issued access token for user 44182, scope read:profile",
  },
  {
    id: "l05",
    minutesAgo: 5,
    sec: 3,
    level: "debug",
    service: "search-indexer",
    message: "Flushed 512 documents to shard idx-03 in 84ms",
  },
  {
    id: "l06",
    minutesAgo: 6,
    sec: 27,
    level: "info",
    service: "notifications",
    message: "Delivered email receipt to queue, template order_paid",
  },
  {
    id: "l07",
    minutesAgo: 8,
    sec: 19,
    level: "warn",
    service: "auth-service",
    message: "Rate limit reached for client mobile-ios, throttling 30s",
  },
  {
    id: "l08",
    minutesAgo: 9,
    sec: 46,
    level: "info",
    service: "api-gateway",
    message: "Routed GET /v2/catalog to region eu-west-1",
  },
  {
    id: "l09",
    minutesAgo: 11,
    sec: 2,
    level: "debug",
    service: "scheduler",
    message: "Tick 90210 processed 3 due jobs, next run in 60s",
  },
  {
    id: "l10",
    minutesAgo: 12,
    sec: 33,
    level: "error",
    service: "search-indexer",
    message: "Reindex job failed: connection reset by shard idx-07",
  },
  {
    id: "l11",
    minutesAgo: 14,
    sec: 9,
    level: "info",
    service: "payments",
    message: "Refund rf_2210 settled for order osq_8109",
  },
  {
    id: "l12",
    minutesAgo: 16,
    sec: 51,
    level: "info",
    service: "cdn-edge",
    message: "Cache hit ratio 0.94 for asset bundle app.4c2.js",
  },
  {
    id: "l13",
    minutesAgo: 18,
    sec: 24,
    level: "debug",
    service: "checkout",
    message: "Validated cart snapshot with 4 line items, subtotal 128.40",
  },
  {
    id: "l14",
    minutesAgo: 21,
    sec: 7,
    level: "warn",
    service: "payments",
    message: "Retrying webhook delivery to merchant m_5521, attempt 2 of 5",
  },
  {
    id: "l15",
    minutesAgo: 23,
    sec: 38,
    level: "info",
    service: "notifications",
    message: "Push token refreshed for device 8f21ac, platform android",
  },
  {
    id: "l16",
    minutesAgo: 26,
    sec: 14,
    level: "info",
    service: "api-gateway",
    message: "Handled 1284 requests in window, error rate 0.3%",
  },
  {
    id: "l17",
    minutesAgo: 29,
    sec: 59,
    level: "debug",
    service: "auth-service",
    message: "Rotated signing key kid-19, previous kept for 24h grace",
  },
  {
    id: "l18",
    minutesAgo: 33,
    sec: 5,
    level: "error",
    service: "checkout",
    message: "Inventory oversold for sku TS-114, reserved 3 over stock",
  },
  {
    id: "l19",
    minutesAgo: 37,
    sec: 42,
    level: "info",
    service: "scheduler",
    message: "Enqueued nightly digest job for 12840 subscribers",
  },
  {
    id: "l20",
    minutesAgo: 41,
    sec: 18,
    level: "warn",
    service: "cdn-edge",
    message: "Origin fetch slow: 2100ms for region ap-south-1",
  },
  {
    id: "l21",
    minutesAgo: 45,
    sec: 30,
    level: "info",
    service: "payments",
    message: "Captured payment pi_3Qb for amount 64.00 USD",
  },
  {
    id: "l22",
    minutesAgo: 49,
    sec: 11,
    level: "debug",
    service: "search-indexer",
    message: "Merged segments on idx-01, freed 240MB of heap",
  },
  {
    id: "l23",
    minutesAgo: 54,
    sec: 47,
    level: "info",
    service: "auth-service",
    message: "Password reset link generated for user 20915",
  },
  {
    id: "l24",
    minutesAgo: 58,
    sec: 22,
    level: "warn",
    service: "api-gateway",
    message: "Circuit half-open for upstream catalog after 3 failures",
  },
  {
    id: "l25",
    minutesAgo: 64,
    sec: 6,
    level: "info",
    service: "notifications",
    message: "SMS provider switched to fallback carrier for +44 numbers",
  },
  {
    id: "l26",
    minutesAgo: 71,
    sec: 39,
    level: "error",
    service: "auth-service",
    message: "Token verification failed: signature mismatch on kid-17",
  },
  {
    id: "l27",
    minutesAgo: 78,
    sec: 15,
    level: "info",
    service: "checkout",
    message: "Coupon SPRING20 applied to order osq_7742",
  },
  {
    id: "l28",
    minutesAgo: 85,
    sec: 52,
    level: "debug",
    service: "scheduler",
    message: "Skipped job cleanup-tmp, already ran this hour",
  },
  {
    id: "l29",
    minutesAgo: 92,
    sec: 28,
    level: "info",
    service: "cdn-edge",
    message: "Purged 812 objects for tag release-2024-06",
  },
  {
    id: "l30",
    minutesAgo: 100,
    sec: 4,
    level: "warn",
    service: "payments",
    message: "Fraud score 0.72 above threshold for order osq_7610",
  },
  {
    id: "l31",
    minutesAgo: 108,
    sec: 44,
    level: "info",
    service: "api-gateway",
    message: "TLS handshake renegotiated for client edge-pool-2",
  },
  {
    id: "l32",
    minutesAgo: 117,
    sec: 20,
    level: "debug",
    service: "search-indexer",
    message: "Warm query cache primed with 1280 top terms",
  },
  {
    id: "l33",
    minutesAgo: 126,
    sec: 57,
    level: "info",
    service: "notifications",
    message: "Batched 340 in-app notices for digest window",
  },
  {
    id: "l34",
    minutesAgo: 135,
    sec: 33,
    level: "error",
    service: "cdn-edge",
    message: "Edge node ap-1 unreachable, draining traffic to ap-2",
  },
  {
    id: "l35",
    minutesAgo: 146,
    sec: 9,
    level: "info",
    service: "checkout",
    message: "Guest session upgraded to account for user 45120",
  },
  {
    id: "l36",
    minutesAgo: 158,
    sec: 48,
    level: "warn",
    service: "scheduler",
    message: "Job queue depth 1420 growing, workers scaled to 12",
  },
  {
    id: "l37",
    minutesAgo: 170,
    sec: 25,
    level: "info",
    service: "payments",
    message: "Payout batch pb_0912 initiated for 84 merchants",
  },
  {
    id: "l38",
    minutesAgo: 183,
    sec: 1,
    level: "debug",
    service: "auth-service",
    message: "Session store evicted 90 idle entries older than 30m",
  },
  {
    id: "l39",
    minutesAgo: 197,
    sec: 36,
    level: "info",
    service: "api-gateway",
    message: "Config reloaded, 6 routes updated without downtime",
  },
  {
    id: "l40",
    minutesAgo: 210,
    sec: 13,
    level: "warn",
    service: "search-indexer",
    message: "Query timeout on idx-05, returned partial results to caller",
  },
  {
    id: "l41",
    minutesAgo: 224,
    sec: 50,
    level: "info",
    service: "notifications",
    message: "Webhook subscriber wh_44 re-subscribed to order events",
  },
  {
    id: "l42",
    minutesAgo: 236,
    sec: 17,
    level: "info",
    service: "cdn-edge",
    message: "Compression enabled for text assets on region us-east-1",
  },
];

const BASE_MIN = 14 * 60 + 32;
const pad = (n: number) => String(n).padStart(2, "0");
const clockOf = (minutesAgo: number, sec: number) => {
  const total = BASE_MIN - minutesAgo;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}:${pad(sec)}`;
};

type Facets = {
  levels: Level[];
  services: string[];
  range: string;
  query: string;
};

const EMPTY: Facets = { levels: [], services: [], range: "240", query: "" };

const HIST_BARS = 30;

const matches = (log: LogEntry, f: Facets, exclude?: keyof Facets) => {
  if (exclude !== "levels" && f.levels.length && !f.levels.includes(log.level))
    return false;
  if (
    exclude !== "services" &&
    f.services.length &&
    !f.services.includes(log.service)
  )
    return false;
  if (exclude !== "range" && log.minutesAgo > Number(f.range)) return false;
  if (
    exclude !== "query" &&
    f.query.trim() &&
    !log.message.toLowerCase().includes(f.query.trim().toLowerCase())
  )
    return false;
  return true;
};

function ServicePopover({
  selected,
  counts,
  onToggle,
  onClear,
}: {
  selected: string[];
  counts: Record<string, number>;
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = rootRef.current;
    const doc = node?.ownerDocument;
    if (!doc) return;
    const onPointer = (e: Event) => {
      if (!node.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    doc.addEventListener("mousedown", onPointer);
    doc.addEventListener("touchstart", onPointer);
    doc.addEventListener("keydown", onKey);
    return () => {
      doc.removeEventListener("mousedown", onPointer);
      doc.removeEventListener("touchstart", onPointer);
      doc.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = SERVICES.filter((s) =>
    s.label.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] border px-3 text-sm",
          transition,
          focus,
          selected.length
            ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
            : "border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700",
        )}
      >
        <Layers aria-hidden="true" className="h-4 w-4 text-neutral-400" />
        Services
        {selected.length > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] px-1.5 text-[11px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] tabular-nums dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
            {selected.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Filter by service"
          className="absolute left-0 top-full z-30 mt-1.5 w-[264px] rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white p-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="relative mb-1.5">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search services…"
              aria-label="Search services"
              className={cx(field, "h-8 pl-8 text-[13px]")}
            />
          </div>
          <ul className="max-h-[220px] space-y-0.5 overflow-y-auto">
            {visible.map((s) => {
              const on = selected.includes(s.value);
              const n = counts[s.value] ?? 0;
              return (
                <li key={s.value}>
                  <label
                    className={cx(
                      "flex h-8 cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-sm,6px)] px-2 text-[13px] text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/60",
                      transition,
                      n === 0 && !on && "opacity-40",
                    )}
                  >
                    <span className={checkboxBox}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => onToggle(s.value)}
                        className={checkboxClass}
                      />
                      <Check
                        aria-hidden="true"
                        strokeWidth={3}
                        className={checkboxMark}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px]">
                      {s.label}
                    </span>
                    <span className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                      {n}
                    </span>
                  </label>
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="px-2 py-6 text-center text-[13px] text-neutral-500">
                No services match “{q}”
              </li>
            )}
          </ul>
          {selected.length > 0 && (
            <div className="mt-1.5 flex justify-end border-t border-neutral-100 pt-1.5 dark:border-neutral-800">
              <button
                type="button"
                onClick={onClear}
                className={cx(
                  "h-7 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-2 text-[13px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                  transition,
                  focus,
                )}
              >
                Clear services
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Filtering4() {
  const [facets, setFacets] = useState<Facets>(EMPTY);
  const {
    ref: listRef,
    edges: listEdges,
    onScroll: onListScroll,
  } = useScrollFade<HTMLDivElement>();

  const toggleLevel = (value: Level) =>
    setFacets((f) => ({
      ...f,
      levels: f.levels.includes(value)
        ? f.levels.filter((v) => v !== value)
        : [...f.levels, value],
    }));

  const toggleService = (value: string) =>
    setFacets((f) => ({
      ...f,
      services: f.services.includes(value)
        ? f.services.filter((v) => v !== value)
        : [...f.services, value],
    }));

  const results = useMemo(
    () =>
      LOGS.filter((l) => matches(l, facets)).sort(
        (a, b) => a.minutesAgo - b.minutesAgo,
      ),
    [facets],
  );

  const levelCount = (value: Level) =>
    LOGS.filter((l) => matches(l, facets, "levels") && l.level === value)
      .length;

  const serviceCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of SERVICES)
      out[s.value] = LOGS.filter(
        (l) => matches(l, facets, "services") && l.service === s.value,
      ).length;
    return out;
  }, [facets]);

  const histogram = useMemo(() => {
    const span = Number(facets.range);
    const bars = new Array(HIST_BARS).fill(0);
    for (const l of results) {
      const idx = Math.min(
        HIST_BARS - 1,
        Math.max(0, Math.floor((1 - l.minutesAgo / span) * (HIST_BARS - 1))),
      );
      bars[idx] += 1;
    }
    return bars;
  }, [results, facets.range]);
  const histMax = Math.max(1, ...histogram);

  const activeCount =
    facets.levels.length +
    facets.services.length +
    (facets.query.trim() ? 1 : 0);

  const rangeLabel =
    RANGES.find((r) => r.value === facets.range)?.label ?? "range";

  return (
    <div className="flex h-full min-h-[920px] w-full flex-col overflow-y-auto bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl tracking-[-0.015em] text-neutral-900 dark:text-white">
              Log explorer
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="tabular-nums">{results.length}</span> events over{" "}
              {rangeLabel.toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ServicePopover
              selected={facets.services}
              counts={serviceCounts}
              onToggle={toggleService}
              onClear={() => setFacets((f) => ({ ...f, services: [] }))}
            />
            <Select
              value={facets.range}
              onChange={(range) => setFacets((f) => ({ ...f, range }))}
              options={RANGES}
              ariaLabel="Time range"
              className="w-[168px]"
            />
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Severity"
            className="flex flex-wrap items-center gap-1.5"
          >
            {LEVELS.map((lvl) => {
              const on = facets.levels.includes(lvl.value);
              const n = levelCount(lvl.value);
              return (
                <button
                  key={lvl.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleLevel(lvl.value)}
                  className={cx(
                    "inline-flex h-8 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] border px-2.5 text-[13px]",
                    transition,
                    focus,
                    on
                      ? "border-neutral-900 bg-neutral-50 text-neutral-900 dark:border-white dark:bg-neutral-900 dark:text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700",
                    n === 0 && !on && "opacity-40",
                  )}
                >
                  <span
                    className={cx("h-1.5 w-1.5 shrink-0 rounded-full", lvl.dot)}
                  />
                  <span className={cx(on && lvl.text)}>{lvl.label}</span>
                  <span className="text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                    {n}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative ml-auto w-full sm:w-[280px]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            />
            <input
              value={facets.query}
              onChange={(e) =>
                setFacets((f) => ({ ...f, query: e.target.value }))
              }
              placeholder="Filter messages…"
              aria-label="Filter messages"
              className={cx(field, "pl-9", facets.query && "pr-9")}
            />
            {facets.query && (
              <button
                type="button"
                aria-label="Clear message filter"
                onClick={() => setFacets((f) => ({ ...f, query: "" }))}
                className={cx(
                  "absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white",
                  transition,
                  focus,
                )}
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <section
          aria-label="Matched volume"
          className="mt-4 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Volume · {rangeLabel.toLowerCase()}
            </span>
            <span className="text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
              peak {histMax}/bucket
            </span>
          </div>
          <div className="flex h-14 items-end gap-[3px]">
            {histogram.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-[2px] bg-neutral-200 dark:bg-neutral-800"
                style={{ height: `${Math.max(3, (v / histMax) * 100)}%` }}
              >
                <div
                  className={cx(
                    "h-full w-full rounded-[2px]",
                    v > 0
                      ? "bg-neutral-400 dark:bg-neutral-500"
                      : "bg-transparent",
                  )}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 tabular-nums dark:text-neutral-600">
            <span>oldest</span>
            <span>now</span>
          </div>
        </section>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {results.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-[var(--rb-r-2xl,14px)] border border-dashed border-neutral-200 px-6 py-16 text-center dark:border-neutral-800">
              <p className="text-sm text-neutral-900 dark:text-neutral-100">
                No log lines match these filters
              </p>
              <p className="mt-1 max-w-[300px] text-[13px] text-neutral-500 dark:text-neutral-400">
                Widen the time range, clear a severity, or loosen the message
                query to see more events.
              </p>
              <button
                type="button"
                onClick={() => setFacets(EMPTY)}
                className={cx(
                  "mt-5 inline-flex h-9 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3.5 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] active:scale-[0.97] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                  transition,
                  focus,
                )}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 dark:border-neutral-800">
              <div
                ref={listRef}
                onScroll={onListScroll}
                className="h-full overflow-y-auto"
              >
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                  {results.map((l) => {
                    const meta = LEVEL_META[l.level];
                    return (
                      <li
                        key={l.id}
                        className="flex items-start gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                      >
                        <span className="mt-0.5 shrink-0 font-mono text-[12px] text-neutral-400 tabular-nums dark:text-neutral-500">
                          {clockOf(l.minutesAgo, l.sec)}
                        </span>
                        <span className="mt-0.5 flex w-[52px] shrink-0 items-center gap-1.5">
                          <span
                            className={cx(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              meta.dot,
                            )}
                          />
                          <span
                            className={cx(
                              "font-mono text-[11px] uppercase tracking-[0.04em]",
                              meta.text,
                            )}
                          >
                            {l.level}
                          </span>
                        </span>
                        <span className="mt-0.5 hidden w-[124px] shrink-0 truncate font-mono text-[12px] text-neutral-500 sm:block dark:text-neutral-400">
                          {l.service}
                        </span>
                        <span className="min-w-0 flex-1 font-mono text-[12px] leading-5 text-neutral-800 dark:text-neutral-200">
                          {l.message}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                  listEdges.start ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                  listEdges.end ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              {activeCount > 0 ? (
                <>
                  <span className="tabular-nums">{activeCount}</span> active
                  filter{activeCount === 1 ? "" : "s"}
                </>
              ) : (
                "No filters applied"
              )}
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => setFacets(EMPTY)}
                className={cx(
                  "cursor-pointer rounded-[var(--rb-r-sm,6px)] px-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
                  focus,
                )}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

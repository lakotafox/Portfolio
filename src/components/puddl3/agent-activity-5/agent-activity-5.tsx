"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, Square } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Severity = "info" | "warning" | "error";

type LogLine = { at: number; sev: Severity; text: string };

const LINES: LogLine[] = [
  { at: 0.0, sev: "info", text: "Starting run for workspace acme-analytics" },
  { at: 0.6, sev: "info", text: "Loaded 3 source connectors" },
  { at: 1.4, sev: "info", text: "Connector postgres queued 1,284 rows" },
  { at: 2.1, sev: "info", text: "Connector halcyon queued 642 records" },
  { at: 2.9, sev: "info", text: "Connector lumendesk queued 318 tickets" },
  { at: 3.7, sev: "info", text: "Fetching postgres batch 1 of 3" },
  { at: 4.5, sev: "info", text: "Fetched 512 rows in 0.8s" },
  {
    at: 5.2,
    sev: "warning",
    text: "Rate limit hit on halcyon, backing off 2s",
  },
  { at: 7.3, sev: "info", text: "Resumed halcyon after backoff" },
  { at: 8.0, sev: "info", text: "Fetched 642 halcyon records" },
  {
    at: 8.8,
    sev: "info",
    text: "Transforming records to the canonical schema",
  },
  { at: 9.6, sev: "info", text: "Dropped 14 rows that failed validation" },
  {
    at: 10.4,
    sev: "warning",
    text: "Missing owner on 6 accounts, defaulting to unassigned",
  },
  { at: 11.2, sev: "info", text: "Writing batch to the warehouse" },
  {
    at: 12.0,
    sev: "error",
    text: "Write to reporting.accounts timed out after 30s",
  },
  { at: 12.4, sev: "info", text: "Retrying write with a smaller batch size" },
  { at: 13.9, sev: "info", text: "Write succeeded on retry" },
  { at: 14.6, sev: "info", text: "Indexed 2,244 documents" },
  { at: 15.3, sev: "info", text: "Building embeddings for 318 tickets" },
  { at: 17.1, sev: "info", text: "Embeddings complete" },
  { at: 17.8, sev: "info", text: "Refreshing materialised views" },
  { at: 18.5, sev: "info", text: "View account_health refreshed" },
  { at: 19.2, sev: "info", text: "View revenue_daily refreshed" },
  { at: 19.9, sev: "info", text: "Verifying row counts against the sources" },
  { at: 20.6, sev: "info", text: "Row counts match across 3 connectors" },
  { at: 21.3, sev: "info", text: "Run complete, 2,244 records processed" },
];

const SEED = 22;
const CATCH_UP_MS = 180;
const FLOOR_CPS = 55;

const FILTERS: { id: Severity | "all"; label: string; short: string }[] = [
  { id: "all", label: "All", short: "All" },
  { id: "info", label: "Info", short: "Info" },
  { id: "warning", label: "Warnings", short: "Warn" },
  { id: "error", label: "Errors", short: "Err" },
];

function fmtTs(at: number) {
  const total = Math.floor(at);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const cs = Math.round((at - total) * 10);
  return `${m}:${String(s).padStart(2, "0")}.${cs}`;
}

function lastWordBoundary(source: string, cut: number) {
  if (cut >= source.length) return source.length;
  const i = source.lastIndexOf(" ", cut);
  return i === -1 ? 0 : i;
}

function useSmoothedText() {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const targetRef = useRef("");
  const shownRef = useRef(0);
  const endedRef = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const target = targetRef.current;
      const behind = target.length - shownRef.current;
      if (behind > 0) {
        shownRef.current = reduceMotion
          ? target.length
          : Math.min(
              target.length,
              shownRef.current +
                behind * (1 - Math.exp(-dt / CATCH_UP_MS)) +
                (FLOOR_CPS * dt) / 1000,
            );
        const cut = Math.floor(shownRef.current);
        const finished = endedRef.current && cut >= target.length;
        const safe = finished ? target.length : lastWordBoundary(target, cut);
        setText(target.slice(0, safe));
        if (finished) setDone(true);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);

  return {
    text,
    done,
    push: useCallback((chunk: string) => {
      targetRef.current += chunk;
    }, []),
    end: useCallback(() => {
      endedRef.current = true;
    }, []),
    reset: useCallback(() => {
      targetRef.current = "";
      shownRef.current = 0;
      endedRef.current = false;
      setText("");
      setDone(false);
    }, []),
  };
}

function SeverityDot({ sev }: { sev: Severity }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full",
        sev === "info" && "bg-neutral-300 dark:bg-neutral-600",
        sev === "warning" && "bg-amber-500",
        sev === "error" && "bg-red-500",
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

export default function AgentActivity5() {
  const reduceMotion = useReducedMotion();
  const { text, done, push, end, reset } = useSmoothedText();
  const [committed, setCommitted] = useState<number[]>(() =>
    Array.from({ length: SEED }, (_, i) => i),
  );
  const [idx, setIdx] = useState(SEED);
  const [stopped, setStopped] = useState(false);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const filterRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const logFade = useScrollFade<HTMLDivElement>();
  const scrollRef = logFade.ref;
  const stickRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const finished = idx >= LINES.length || stopped;

  useEffect(() => {
    if (idx >= LINES.length || stopped) return;
    reset();
    push(LINES[idx].text);
    end();
  }, [idx, stopped, reset, push, end]);

  useEffect(() => {
    if (!done || idx >= LINES.length || stopped) return;
    const t = setTimeout(() => {
      setCommitted((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
      setIdx((i) => i + 1);
    }, 260);
    return () => clearTimeout(t);
  }, [done, idx, stopped]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const sync = () => {
      const overflowing = el.scrollHeight - el.clientHeight > 1;
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      const atBottom = !overflowing || distance < 24;
      stickRef.current = atBottom;
      setShowJump(overflowing && !atBottom);
    };

    const onIntent = (e: WheelEvent | TouchEvent) => {
      const up = "deltaY" in e ? e.deltaY < 0 : true;
      if (!up) return;
      if (el.scrollHeight - el.clientHeight > 1 && el.scrollTop > 0) {
        stickRef.current = false;
      }
    };

    const observer = new ResizeObserver(() => {
      if (stickRef.current) el.scrollTop = el.scrollHeight;
      sync();
    });
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    el.addEventListener("wheel", onIntent, { passive: true });
    el.addEventListener("touchmove", onIntent, { passive: true });
    el.addEventListener("scroll", sync, { passive: true });

    el.scrollTop = el.scrollHeight;
    sync();
    return () => {
      observer.disconnect();
      el.removeEventListener("wheel", onIntent);
      el.removeEventListener("touchmove", onIntent);
      el.removeEventListener("scroll", sync);
    };
  }, []);

  const onFilterKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = FILTERS.findIndex((f) => f.id === filter);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = (current + 1) % FILTERS.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = (current - 1 + FILTERS.length) % FILTERS.length;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = FILTERS.length - 1;
    }
    if (next === -1) return;
    e.preventDefault();
    setFilter(FILTERS[next].id);
    filterRefs.current[next]?.focus({ preventScroll: true });
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = true;
    setShowJump(false);
    el.scrollTop = el.scrollHeight;
  };

  const visible = committed.filter(
    (i) => filter === "all" || LINES[i].sev === filter,
  );
  const activeLine =
    !finished && !done && (filter === "all" || LINES[idx]?.sev === filter)
      ? LINES[idx]
      : null;
  const words = text.length ? text.split(/(\s+)/) : [];

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col gap-3 overflow-hidden bg-white p-4 sm:gap-4 sm:p-6 dark:bg-neutral-950">
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap">
        <div className="order-1 flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className={cx(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              stopped
                ? "bg-neutral-300 dark:bg-neutral-600"
                : finished
                  ? "bg-neutral-300 dark:bg-neutral-600"
                  : "animate-pulse bg-neutral-400 motion-reduce:animate-none dark:bg-neutral-500",
            )}
          />
          <h2 className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Run log
          </h2>
        </div>

        <div
          role="radiogroup"
          aria-label="Filter log by severity"
          onKeyDown={onFilterKeyDown}
          className="order-3 flex w-full items-center gap-1 rounded-[var(--rb-r-md,8px)] bg-neutral-100 p-0.5 sm:order-2 sm:ml-auto sm:w-auto dark:bg-neutral-800"
        >
          {FILTERS.map((f, i) => {
            const selected = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                ref={(node) => {
                  filterRefs.current[i] = node;
                }}
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setFilter(f.id)}
                className={cx(
                  "h-7 flex-1 cursor-pointer rounded-[var(--rb-r-sm,6px)] px-2 text-[13px] font-medium sm:flex-none transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                  selected
                    ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                )}
              >
                <span className="sm:hidden">{f.short}</span>
                <span className="hidden sm:inline">{f.label}</span>
              </button>
            );
          })}
        </div>

        <div className="order-2 ml-auto flex w-[76px] shrink-0 justify-end sm:order-3 sm:ml-0 sm:w-[86px]">
          {finished ? (
            <span className="truncate text-[13px] tabular-nums text-neutral-500 dark:text-neutral-400">
              {committed.length} lines
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setStopped(true)}
              className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <Square aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div
            ref={scrollRef}
            onScroll={logFade.onScroll}
            className="h-full overflow-y-auto overscroll-contain p-3 font-mono text-xs leading-relaxed [overflow-anchor:none]"
          >
            <ol>
              {visible.length === 0 && !activeLine && (
                <li className="mt-2 rounded-[var(--rb-r-md,8px)] bg-neutral-50 p-4 text-center font-sans dark:bg-neutral-900">
                  <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
                    No {filter} entries in this run.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="mt-2.5 inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                  >
                    Clear filter
                  </button>
                </li>
              )}
              {visible.map((i) => (
                <li key={i} className="flex gap-3 py-0.5">
                  <span className="shrink-0 tabular-nums text-neutral-500 dark:text-neutral-500">
                    {fmtTs(LINES[i].at)}
                  </span>
                  <SeverityDot sev={LINES[i].sev} />
                  <span
                    className={cx(
                      "min-w-0 flex-1",
                      LINES[i].sev === "error"
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-700 dark:text-neutral-300",
                    )}
                  >
                    {LINES[i].text}
                  </span>
                </li>
              ))}

              {activeLine && (
                <li className="flex gap-3 py-0.5">
                  <span className="shrink-0 tabular-nums text-neutral-500 dark:text-neutral-500">
                    {fmtTs(activeLine.at)}
                  </span>
                  <SeverityDot sev={activeLine.sev} />
                  <span
                    className={cx(
                      "min-w-0 flex-1",
                      activeLine.sev === "error"
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-700 dark:text-neutral-300",
                    )}
                  >
                    {reduceMotion
                      ? text
                      : words.map((w, i) =>
                          /\s+/.test(w) ? (
                            <span key={i} className="whitespace-pre-wrap">
                              {w}
                            </span>
                          ) : (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, filter: "blur(4px)" }}
                              animate={{ opacity: 1, filter: "blur(0px)" }}
                              transition={{
                                duration: 0.24,
                                ease: [0.23, 1, 0.32, 1],
                              }}
                              className="inline-block whitespace-pre-wrap"
                            >
                              {w}
                            </motion.span>
                          ),
                        )}
                    <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] align-baseline motion-reduce:animate-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]" />
                  </span>
                </li>
              )}
            </ol>
          </div>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 top-0 h-8 rounded-t-[var(--rb-r-lg,10px)] bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              logFade.edges.start ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-[var(--rb-r-lg,10px)] bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
              logFade.edges.end ? "opacity-100" : "opacity-0",
            )}
          />

          {showJump && (
            <motion.button
              type="button"
              onClick={jumpToLatest}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="absolute bottom-4 left-1/2 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] cursor-pointer transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:shadow-none dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <ArrowDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              Jump to latest
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

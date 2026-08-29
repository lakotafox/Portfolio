"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Check,
  Clock,
  Database,
  FolderArchive,
  Layers,
  ScrollText,
  Search,
  Zap,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      start: scrollTop > 1,
      end: scrollTop + clientHeight < scrollHeight - 1,
    });
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const RO = el.ownerDocument.defaultView?.ResizeObserver;
    const ro = RO ? new RO(update) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [update]);
  return { ref, edges, onScroll: update };
}

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const STEPS = ["Region", "Services", "Limits", "Review"];
const ACTIVE_STEP = 1;

const SERVICES = [
  {
    id: "postgres",
    icon: Database,
    name: "Managed Postgres",
    blurb: "Primary store with nightly snapshots.",
    boot: 12,
  },
  {
    id: "cache",
    icon: Zap,
    name: "In-memory cache",
    blurb: "Shared key store for sessions.",
    boot: 4,
  },
  {
    id: "objects",
    icon: FolderArchive,
    name: "Object storage",
    blurb: "Buckets for uploads and exports.",
    boot: 6,
  },
  {
    id: "queue",
    icon: Layers,
    name: "Background queue",
    blurb: "Retries and dead-letter handling.",
    boot: 8,
  },
  {
    id: "cron",
    icon: Clock,
    name: "Scheduled jobs",
    blurb: "Cron runners with a shared log.",
    boot: 5,
  },
  {
    id: "search",
    icon: Search,
    name: "Search index",
    blurb: "Rebuilt from Postgres on write.",
    boot: 14,
  },
  {
    id: "metrics",
    icon: Activity,
    name: "Metrics pipeline",
    blurb: "Request, queue, and job counters.",
    boot: 7,
  },
  {
    id: "logs",
    icon: ScrollText,
    name: "Log retention",
    blurb: "Thirty days of searchable output.",
    boot: 3,
  },
];

export default function Wizard4() {
  const body = useScrollFade<HTMLDivElement>();
  const [selected, setSelected] = useState<string[]>([
    "postgres",
    "cache",
    "queue",
  ]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const boot = SERVICES.filter((s) => selected.includes(s.id)).reduce(
    (total, s) => total + s.boot,
    0,
  );

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="shrink-0 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            aria-label="Back to region"
            className={cx(
              "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.97] dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              New environment
            </h1>
            <p className="truncate text-xs text-neutral-500">
              staging · eu-west
            </p>
          </div>

          <button
            type="button"
            className={cx(
              "inline-flex h-8 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
              transition,
              focus,
            )}
          >
            Save and exit
          </button>
        </div>

        <ol className="mx-auto flex w-full max-w-[560px] items-center gap-3 px-4 pb-3 sm:px-6">
          {STEPS.map((label, i) => {
            const done = i < ACTIVE_STEP;
            const active = i === ACTIVE_STEP;

            return (
              <li
                key={label}
                className={cx(
                  "flex min-w-0 items-center gap-3",
                  i < STEPS.length - 1 && "flex-1",
                )}
              >
                <span
                  aria-current={active ? "step" : undefined}
                  className="flex min-w-0 items-center gap-2"
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums",
                      done &&
                        "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                      active &&
                        "border border-dashed border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100",
                      !done &&
                        !active &&
                        "border border-neutral-200 bg-white text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950",
                    )}
                  >
                    {done ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cx(
                      "hidden truncate text-[13px] sm:block",
                      active || done
                        ? "font-medium text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-500",
                    )}
                  >
                    {label}
                  </span>
                </span>

                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cx(
                      "h-px min-w-4 flex-1",
                      done
                        ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                        : "bg-neutral-200 dark:bg-neutral-800",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={body.ref}
          onScroll={body.onScroll}
          className="h-full overflow-y-auto px-4 py-6 sm:px-6"
        >
          <div className="mx-auto w-full max-w-[880px]">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Pick the services this environment runs
            </h2>
            <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
              Anything left out can be attached later without a rebuild.
            </p>

            <div
              role="group"
              aria-label="Available services"
              className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {SERVICES.map((service) => {
                const on = selected.includes(service.id);
                const Icon = service.icon;

                return (
                  <button
                    key={service.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(service.id)}
                    className={cx(
                      "group relative cursor-pointer rounded-[var(--rb-r-xl,12px)] border p-4 text-left active:scale-[0.99]",
                      on
                        ? "border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
                        : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900",
                      transition,
                      focus,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        "absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-[var(--rb-r-xs,4px)] border",
                        on
                          ? "border-neutral-900 bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:border-white dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                          : "border-neutral-300 text-transparent dark:border-neutral-700",
                      )}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>

                    <span
                      aria-hidden="true"
                      className={cx(
                        "flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-md,8px)] border",
                        on
                          ? "border-neutral-300 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                          : "border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="mt-3 block truncate pr-6 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {service.name}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                      {service.blurb}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs leading-relaxed text-neutral-500">
              Every selected service is provisioned inside the same private
              network. Nothing is exposed publicly until you add a route.
            </p>
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

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50 px-4 py-4 sm:px-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
            {selected.length} of {SERVICES.length} selected
          </p>
          <p className="truncate text-xs tabular-nums text-neutral-500">
            {selected.length === 0
              ? "Pick at least one service to continue"
              : `Adds about ${boot}s to each deploy`}
          </p>
        </div>

        <button
          type="button"
          disabled={selected.length === 0}
          className={cx(
            "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
            transition,
            focus,
          )}
        >
          Set limits
        </button>
      </div>
    </div>
  );
}

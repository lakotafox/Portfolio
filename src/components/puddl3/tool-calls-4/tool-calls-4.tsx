"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

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

type Result = {
  id: string;
  title: string;
  source: string;
  domain: string;
  snippet: string;
  relevance: number;
};

const QUERY = "Halcyon Pay idempotency key best practices";

const RESULTS: Result[] = [
  {
    id: "r1",
    title: "Idempotent requests",
    source: "Halcyon Pay Docs",
    domain: "docs.halcyonpay.com",
    snippet:
      "Pass a unique Idempotency-Key header so a retried request is only executed once, even if the network fails after the charge is created.",
    relevance: 98,
  },
  {
    id: "r2",
    title: "Designing robust and predictable APIs with idempotency",
    source: "Halcyon Pay Blog",
    domain: "halcyonpay.com",
    snippet:
      "How Halcyon Pay stores the first response against a key and replays it for 24 hours, and why keys should be derived from the client request.",
    relevance: 94,
  },
  {
    id: "r3",
    title: "Handling retries and idempotency in payment systems",
    source: "Increase Engineering",
    domain: "increase.com",
    snippet:
      "A survey of key derivation strategies, including hashing the customer, amount, and currency to avoid duplicate charges under retry storms.",
    relevance: 89,
  },
  {
    id: "r4",
    title: "Idempotency-Key HTTP header field",
    source: "IETF Draft",
    domain: "datatracker.ietf.org",
    snippet:
      "The proposed standard header that lets clients express at-most-once semantics for unsafe HTTP methods across intermediaries.",
    relevance: 82,
  },
  {
    id: "r5",
    title: "What is an idempotency key and when should you use one?",
    source: "Fly.io",
    domain: "fly.io",
    snippet:
      "A practical walkthrough of adding idempotency to a checkout endpoint, with a Postgres table keyed on the request fingerprint.",
    relevance: 76,
  },
  {
    id: "r6",
    title: "Exactly-once delivery is a myth. Idempotency is the answer",
    source: "Confluent",
    domain: "confluent.io",
    snippet:
      "Why distributed systems cannot guarantee exactly-once side effects, and how idempotent consumers make duplicate delivery harmless.",
    relevance: 71,
  },
  {
    id: "r7",
    title: "Add idempotency keys to your webhook handlers",
    source: "Svix",
    domain: "svix.com",
    snippet:
      "Store processed event IDs so a redelivered webhook is acknowledged without running the handler a second time.",
    relevance: 64,
  },
];

export default function ToolCalls4() {
  const query = QUERY;
  const results = RESULTS;
  const body = useScrollFade<HTMLDivElement>();
  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <header className="mb-3 flex shrink-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-500">
            web_search
          </span>
          <p className="mt-0.5 truncate text-sm font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            {query}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] text-neutral-500 dark:text-neutral-400">
          <span
            className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"
            aria-hidden="true"
          />
          Done
          <span className="text-neutral-300 dark:text-neutral-700">
            &middot;
          </span>
          <span className="tabular-nums">{results.length} results</span>
        </span>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <div
          ref={body.ref}
          onScroll={body.onScroll}
          className="min-h-0 flex-1 space-y-1 overflow-y-auto"
        >
          {results.map((r, i) => (
            <a
              key={r.id}
              href="#"
              className="group flex items-start gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 transition-colors duration-150 ease-out hover:bg-neutral-50 active:bg-neutral-100 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900 dark:active:bg-neutral-800/70 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <span className="mt-0.5 w-4 shrink-0 text-xs tabular-nums text-neutral-400 dark:text-neutral-600">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {r.title}
                  </p>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-neutral-400 transition-colors duration-150 ease-out group-hover:text-neutral-600 dark:text-neutral-600 dark:group-hover:text-neutral-400"
                  />
                </div>
                <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-500">
                  {r.source}
                  <span className="mx-1 text-neutral-300 dark:text-neutral-700">
                    /
                  </span>
                  {r.domain}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {r.snippet}
                </p>
              </div>
              <span
                className={cx(
                  "shrink-0 text-xs tabular-nums",
                  r.relevance >= 90
                    ? "text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 dark:text-neutral-500",
                )}
              >
                {r.relevance}%
              </span>
            </a>
          ))}
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

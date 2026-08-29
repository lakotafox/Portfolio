"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  KeyRound,
  MessageSquare,
  Plug,
  Search,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

const TOPICS = [
  {
    icon: KeyRound,
    title: "Accounts and access",
    body: "Sign in, SSO, roles and invitations.",
    count: 24,
  },
  {
    icon: CreditCard,
    title: "Billing and plans",
    body: "Invoices, seats, upgrades and refunds.",
    count: 18,
  },
  {
    icon: Plug,
    title: "Integrations",
    body: "Warehouses, webhooks and the API.",
    count: 31,
  },
  {
    icon: BookOpen,
    title: "Reports and exports",
    body: "Scheduling, formats and delivery.",
    count: 27,
  },
];

const POPULAR = [
  { title: "Why did my scheduled export arrive empty?", reads: "4.2k" },
  { title: "Move a workspace to a different owner", reads: "3.1k" },
  { title: "Set up SAML with your identity provider", reads: "2.8k" },
  { title: "Understand seat counts on the Pro plan", reads: "2.4k" },
];

export default function Support1() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-full min-h-[720px] w-full flex-col overflow-y-auto bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="text-center">
          <h2 className="text-[20px] font-medium tracking-[-0.015em] text-neutral-900 sm:text-2xl dark:text-neutral-100">
            How can we help?
          </h2>
          <p className="mx-auto mt-1.5 max-w-[420px] text-[13px] leading-relaxed text-neutral-500">
            Search the guides, or open a ticket and a person will reply. Median
            first response today is 11 minutes.
          </p>
        </div>

        <div className="relative mx-auto mt-5 max-w-[520px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <label htmlFor="support-1-search" className="sr-only">
            Search help articles
          </label>
          <input
            id="support-1-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, guides and answers"
            className="h-11 w-full rounded-[var(--rb-r-xl,12px)] border border-neutral-200 bg-white pr-3 pl-10 text-[14px] text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white"
          />
        </div>

        <div className={cx(frame, "mt-5 grid gap-1 sm:grid-cols-2")}>
          {TOPICS.map(({ icon: Icon, title, body, count }) => (
            <button
              key={title}
              type="button"
              className={cx(
                panel,
                "group flex cursor-pointer items-start gap-3 p-4 text-left hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-700 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 dark:border-neutral-800"
              >
                <Icon className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {title}
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-neutral-500">
                  {body}
                </span>
              </span>
              <span className="shrink-0 text-[12px] text-neutral-400 tabular-nums">
                {count}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-5 px-1 text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
          Read most this week
        </p>

        <div className={cx(frame, "mt-2 space-y-1")}>
          {POPULAR.map((a) => (
            <button
              key={a.title}
              type="button"
              className={cx(
                panel,
                "group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-700 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                {a.title}
              </span>
              <span className="shrink-0 text-[12px] text-neutral-400 tabular-nums">
                {a.reads}
              </span>
              <ArrowRight
                className="h-3.5 w-3.5 shrink-0 text-neutral-300 transition-colors duration-150 ease-out group-hover:text-neutral-900 dark:text-neutral-600 dark:group-hover:text-neutral-100"
                aria-hidden
              />
            </button>
          ))}
        </div>

        <div className={cx(frame, "mt-3")}>
          <div
            className={cx(
              panel,
              "flex flex-col gap-3 p-4 sm:flex-row sm:items-center",
            )}
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200 dark:border-neutral-800"
            >
              <MessageSquare className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                Still stuck?
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
                Support is online now, 09:00 to 21:00 UTC on weekdays.
              </p>
            </div>
            <button
              type="button"
              className={cx(
                "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              Contact support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

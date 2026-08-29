"use client";

import { useState } from "react";
import {
  Archive,
  ArrowUpRight,
  Circle,
  Globe,
  Mail,
  MessageSquare,
  Tag,
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

const SOURCE_ICON = {
  widget: MessageSquare,
  email: Mail,
  survey: Globe,
} as const;

const ITEMS = [
  {
    id: "f1",
    plan: "Pro",
    seats: "42 of 50",
    age: "2y 3m",
    history: "9 notes",
    related: [
      {
        quote: "The CSV export loses a column now and then.",
        person: "R. Okafor",
      },
      {
        quote: "Export ran twice and produced different totals.",
        person: "L. Fontaine",
      },
    ],

    person: "Amelia Whitfield",
    company: "Halcyon Pay",
    source: "widget" as const,
    sentiment: "Negative" as const,
    time: "12m",
    unread: true,
    subject: "Export silently drops the last column",
    body: "Running the Monday revenue export drops the final column about one time in five. It is always the last one, whatever it happens to be. We only noticed because a total stopped matching the invoice run.",
    tags: ["Exports", "Data loss"],
    page: "/reports/revenue",
  },
  {
    id: "f2",
    plan: "Scale",
    seats: "118 of 150",
    age: "1y 1m",
    history: "3 notes",
    related: [
      {
        quote: "Saved views finally let us delete the master sheet.",
        person: "K. Osei",
      },
      {
        quote: "Shared a view with finance and they stopped emailing me.",
        person: "D. Ferreira",
      },
    ],

    person: "Jonas Vikander",
    company: "Meridian",
    source: "survey" as const,
    sentiment: "Positive" as const,
    time: "1h",
    unread: true,
    subject: "Saved views replaced our spreadsheet",
    body: "We retired a 40 tab spreadsheet last month. The team stopped asking me to rebuild charts, which is the first time that has happened in two years.",
    tags: ["Saved views"],
    page: "NPS survey",
  },
  {
    id: "f3",
    plan: "Pro",
    seats: "64 of 80",
    age: "8m",
    history: "5 notes",
    related: [
      {
        quote: "SAML is the only thing blocking our rollout.",
        person: "H. Lindqvist",
      },
      { quote: "We need SSO before legal will renew.", person: "M. Rahimi" },
    ],

    person: "Wei Chen",
    company: "Acme",
    source: "email" as const,
    sentiment: "Neutral" as const,
    time: "3h",
    unread: false,
    subject: "Can we get SSO on the Pro plan?",
    body: "Security will not sign off without SAML. We do not need the rest of the Scale tier, so paying triple for one control is a hard sell internally.",
    tags: ["Billing", "SSO"],
    page: "Reply to onboarding email",
  },
  {
    id: "f4",
    plan: "Starter",
    seats: "6 of 10",
    age: "4m",
    history: "2 notes",
    related: [
      { quote: "My date range resets every single visit.", person: "A. Nowak" },
      { quote: "Filters do not survive a page reload.", person: "P. Sandoval" },
    ],

    person: "Tomás Guerrero",
    company: "Lumendesk",
    source: "widget" as const,
    sentiment: "Negative" as const,
    time: "Yesterday",
    unread: false,
    subject: "Filter resets when I switch tabs",
    body: "Every time I move between the two dashboards my date range goes back to the last 7 days. I have started keeping the range in a note so I can retype it.",
    tags: ["Filters"],
    page: "/dashboards/ops",
  },
  {
    id: "f5",
    plan: "Scale",
    seats: "203 of 250",
    age: "3y 7m",
    history: "14 notes",
    related: [
      { quote: "Board view is unusable past 200 rows.", person: "S. Adeyemi" },
      { quote: "Scrolling the board pins my laptop fan.", person: "N. Petrov" },
    ],
    person: "Priya Nandakumar",
    company: "Northwind",
    source: "widget" as const,
    sentiment: "Neutral" as const,
    time: "Yesterday",
    unread: false,
    subject: "Board view slows down past 200 rows",
    body: "Scrolling gets choppy somewhere around two hundred rows and the whole tab locks up for a second or two when I drag a card. Table view on the same data is fine.",
    tags: ["Performance", "Board view"],
    page: "/projects/board",
  },
  {
    id: "f6",
    plan: "Pro",
    seats: "18 of 25",
    age: "11m",
    history: "4 notes",
    related: [
      { quote: "Invite emails land in spam for us too.", person: "C. Bianchi" },
      { quote: "Had to resend three invites this week.", person: "T. Iwu" },
    ],
    person: "Marcus Bell",
    company: "Meridian",
    source: "email" as const,
    sentiment: "Negative" as const,
    time: "2d",
    unread: false,
    subject: "Invite emails keep landing in spam",
    body: "Roughly half our invites end up in junk. New starters assume the account was never created and open a ticket with our own helpdesk instead.",
    tags: ["Invites", "Deliverability"],
    page: "Reply to invite email",
  },
  {
    id: "f7",
    plan: "Starter",
    seats: "3 of 10",
    age: "2m",
    history: "1 note",
    related: [
      {
        quote: "The tour covers things I will never use.",
        person: "V. Marchand",
      },
      { quote: "I skipped onboarding and got lost.", person: "E. Haddad" },
    ],
    person: "Sofia Alvarez",
    company: "Orbital",
    source: "survey" as const,
    sentiment: "Neutral" as const,
    time: "3d",
    unread: false,
    subject: "Onboarding tour skips the part I needed",
    body: "The tour walked me through sharing before I had any data in the account. By the time I had something worth sharing the tour was gone and I could not replay it.",
    tags: ["Onboarding"],
    page: "Activation survey",
  },
];

const SENTIMENT_STYLE = {
  Positive:
    "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100",
  Neutral:
    "border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400",
  Negative:
    "border-neutral-400 text-neutral-700 dark:border-neutral-500 dark:text-neutral-300",
} as const;

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export default function Feedback5() {
  const [selected, setSelected] = useState(ITEMS[0].id);
  const active = ITEMS.find((i) => i.id === selected) ?? ITEMS[0];

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Feedback inbox
          </h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            {ITEMS.filter((i) => i.unread).length} unread · 42 this week
          </p>
        </div>
        <button
          type="button"
          className={cx(
            "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-2.5 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800",
            transition,
            focus,
          )}
        >
          <Archive className="h-3.5 w-3.5" aria-hidden />
          Archive read
        </button>
      </div>

      <div className={cx(frame, "mt-3 flex min-h-0 flex-1 flex-col")}>
        <div className="grid min-h-0 flex-1 gap-1 lg:grid-cols-[300px_1fr]">
          <div
            className={cx(
              panel,
              "flex max-h-[220px] min-h-0 flex-col overflow-hidden lg:max-h-none",
            )}
          >
            <ul className="min-h-0 flex-1 overflow-y-auto p-1">
              {ITEMS.map((item) => {
                const Icon = SOURCE_ICON[item.source];
                const isActive = item.id === selected;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={isActive}
                      onClick={() => setSelected(item.id)}
                      className={cx(
                        "w-full cursor-pointer rounded-[var(--rb-r-sm,6px)] px-2.5 py-2 text-left",
                        isActive
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
                        transition,
                        focus,
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {item.unread ? (
                          <Circle
                            className="h-1.5 w-1.5 shrink-0 fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white"
                            aria-label="Unread"
                          />
                        ) : (
                          <span className="h-1.5 w-1.5 shrink-0" aria-hidden />
                        )}
                        <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                          {item.person}
                        </span>
                        <span className="ml-auto shrink-0 text-[11px] text-neutral-400">
                          {item.time}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate pl-3.5 text-[12px] text-neutral-500">
                        {item.subject}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 pl-3.5 text-[11px] text-neutral-400">
                        <Icon className="h-3 w-3" aria-hidden />
                        <span className="truncate">{item.company}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={cx(panel, "flex min-h-0 flex-col overflow-hidden")}>
            <div className="flex items-start gap-3 px-4 pt-4">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] bg-neutral-100 text-[12px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {initials(active.person)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                  {active.person}
                </p>
                <p className="truncate text-[12px] text-neutral-500">
                  {active.company} · {active.page} · {active.time} ago
                </p>
              </div>
              <span
                className={cx(
                  "inline-flex h-5 shrink-0 items-center rounded-[var(--rb-r-xs,4px)] border px-1.5 text-[11px] font-medium",
                  SENTIMENT_STYLE[active.sentiment],
                )}
              >
                {active.sentiment}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3">
              <h3 className="text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                {active.subject}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {active.body}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {active.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex h-6 items-center gap-1 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    <Tag className="h-2.5 w-2.5" aria-hidden />
                    {t}
                  </span>
                ))}
                <button
                  type="button"
                  className={cx(
                    "inline-flex h-6 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] border border-dashed border-neutral-300 px-2 text-[11px] font-medium text-neutral-500 hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:text-neutral-100",
                    transition,
                    focus,
                  )}
                >
                  Add tag
                </button>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
                {[
                  ["Plan", active.plan],
                  ["Seats", active.seats],
                  ["Account age", active.age],
                  ["Past feedback", active.history],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] tracking-[0.06em] text-neutral-400 uppercase">
                      {k}
                    </dt>
                    <dd className="mt-0.5 text-[13px] text-neutral-900 dark:text-neutral-100">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-5 text-[12px] font-medium text-neutral-900 dark:text-neutral-100">
                Others said the same thing
              </p>
              <ul className="mt-2 space-y-1.5">
                {active.related.map((r) => (
                  <li
                    key={r.person}
                    className="flex items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-neutral-50 px-2.5 py-2 dark:bg-neutral-800/50"
                  >
                    <span className="truncate text-[12px] text-neutral-700 dark:text-neutral-300">
                      {r.quote}
                    </span>
                    <span className="ml-auto shrink-0 text-[11px] text-neutral-400">
                      {r.person}
                    </span>
                  </li>
                ))}
              </ul>

              <label htmlFor="feedback-5-note" className="sr-only">
                Internal note
              </label>
              <textarea
                id="feedback-5-note"
                rows={2}
                placeholder="Add an internal note for the team"
                className="mt-4 mb-1 w-full resize-none rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[12px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                  transition,
                  focus,
                )}
              >
                Reply
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-2.5 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                Create issue
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[12px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

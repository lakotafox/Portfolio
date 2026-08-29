"use client";

import { useState } from "react";
import {
  Banknote,
  Building2,
  CreditCard,
  MoreHorizontal,
  Plus,
  ShieldCheck,
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

const tile =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";

const METHODS = [
  {
    id: "pm-7741",
    icon: CreditCard,
    label: "Visa ending 4242",
    detail: "Expires 04 / 2029 · Amelia Whitfield",
    note: "Charged for subscriptions",
    expiring: false,
  },
  {
    id: "pm-7743",
    icon: CreditCard,
    label: "Mastercard ending 8829",
    detail: "Expires 09 / 2026 · Marcus Bell",
    note: "Backup for failed charges",
    expiring: true,
  },
  {
    id: "pm-7748",
    icon: Banknote,
    label: "ACH · Northwind Trust 1190",
    detail: "Verified 12 Mar · 2 business days to settle",
    note: "Used for invoices over $5,000",
    expiring: false,
  },
];

const CONTACTS = [
  {
    name: "Amelia Whitfield",
    email: "amelia@cedarlabs.com",
    role: "Owner · receives every invoice",
  },
  {
    name: "Tomás Guerrero",
    email: "ap@cedarlabs.com",
    role: "Accounts payable · receipts only",
  },
];

export default function Billing6() {
  const [primary, setPrimary] = useState("pm-7741");

  return (
    <div className="flex h-full min-h-[800px] w-full flex-col overflow-y-auto bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[860px] flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[17px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Payment methods
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              How Cedar Labs pays for its subscription and usage.
            </p>
          </div>
          <button
            type="button"
            className={cx(
              "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
              transition,
              focus,
            )}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add method
          </button>
        </div>

        <div className={cx(frame, "mt-4 space-y-1")}>
          {METHODS.map((m) => {
            const isPrimary = m.id === primary;
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className={cx(
                  panel,
                  "flex flex-col gap-3 px-3.5 py-3 sm:flex-row sm:items-center",
                )}
              >
                <span className={tile} aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {m.label}
                    </p>
                    {isPrimary && (
                      <span className="inline-flex h-5 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        Primary
                      </span>
                    )}
                    {m.expiring && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full bg-amber-500"
                        />
                        Expires soon
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                    {m.detail}{" "}
                    <span className="text-neutral-400">· {m.note}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(m.id)}
                      className={cx(
                        "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                        transition,
                        focus,
                      )}
                    >
                      Make primary
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Actions for ${m.label}`}
                    className={cx(
                      "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                      transition,
                      focus,
                    )}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="mt-5 text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
          Billing contacts
        </h3>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Everyone here receives invoices and payment failures.
        </p>

        <div className={cx(frame, "mt-3 space-y-1")}>
          {CONTACTS.map((c) => (
            <div
              key={c.email}
              className={cx(panel, "flex items-center gap-3 p-3.5")}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                aria-hidden
              >
                {c.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {c.name}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                  {c.email} · {c.role}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Actions for ${c.name}`}
                className={cx(
                  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className={cx(
              panel,
              "flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Invite a billing contact
          </button>
        </div>

        <div className={cx(frame, "mt-5 grid gap-1 sm:grid-cols-2")}>
          <div className={cx(panel, "p-4")}>
            <p className="flex items-center gap-2 text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              Billing address
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-900 dark:text-neutral-100">
              Cedar Labs Inc.
              <br />
              14 Warren Street, Suite 620
              <br />
              New York, NY 10007
            </p>
            <button
              type="button"
              className={cx(
                "mt-3 inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              Edit address
            </button>
          </div>
          <div className={cx(panel, "p-4")}>
            <p className="flex items-center gap-2 text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Tax and compliance
            </p>
            <dl className="mt-2 space-y-2">
              {[
                { k: "Tax ID", v: "US-88-2947135" },
                { k: "Status", v: "Verified 12 Mar" },
                { k: "Invoices", v: "Emailed on issue" },
              ].map((r) => (
                <div key={r.k} className="flex justify-between gap-3">
                  <dt className="text-[13px] text-neutral-500">{r.k}</dt>
                  <dd className="text-[13px] text-neutral-900 tabular-nums dark:text-neutral-100">
                    {r.v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[12px] text-neutral-500">
              Card details are held by the payment processor. We store only the
              last four digits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

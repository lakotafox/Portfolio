"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  Clock,
  KeyRound,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const field =
  "h-10 w-full rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white";

const btnPrimary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]";

const btnSecondary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-50 active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

type Tenant = {
  org: string;
  provider: string;
  members: string;
  session: string;
  enforced: string[];
  admin: string;
};

const DIRECTORY: Record<string, Tenant> = {
  "northwind.com": {
    org: "Northwind Operations",
    provider: "Okta",
    members: "412 members",
    session: "8 hours, then re-authenticate",
    enforced: [
      "Two-factor enforced by your admin",
      "Directory sync adds and removes access",
      "Device posture checked at sign-in",
    ],
    admin: "it-help@northwind.com",
  },
  "ardentfreight.co": {
    org: "Ardent Freight",
    provider: "Microsoft Entra ID",
    members: "1,284 members",
    session: "12 hours, then re-authenticate",
    enforced: [
      "Two-factor enforced by your admin",
      "Directory sync adds and removes access",
      "Sign-in restricted to managed devices",
    ],
    admin: "identity@ardentfreight.co",
  },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Authentication8() {
  const emailId = useId();

  const [email, setEmail] = useState("dana.whitfield@northwind.com");
  const [pending, setPending] = useState(false);

  const domain = email.split("@")[1]?.trim().toLowerCase() ?? "";
  const tenant = useMemo(() => DIRECTORY[domain], [domain]);
  const valid = EMAIL.test(email.trim());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || pending) return;
    setPending(true);
    setTimeout(() => setPending(false), 1400);
  };

  return (
    <div className="relative flex h-full min-h-[640px] w-full overflow-hidden bg-white dark:bg-neutral-950">
      <div className="flex min-w-0 flex-1 flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
            N
          </span>
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Northwind
          </span>
        </div>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-[380px] py-8">
            <h1 className="text-2xl font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
              Sign in with your company account
            </h1>
            <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Enter your work email and we route you to the identity provider
              your organization uses.
            </p>

            <form onSubmit={submit} noValidate className="mt-6">
              <label
                htmlFor={emailId}
                className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
              >
                Work email
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={cx(field, focus, "mt-1.5")}
              />
              <p
                aria-live="polite"
                className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400"
              >
                {tenant
                  ? `${domain} signs in through ${tenant.provider}.`
                  : valid
                    ? `No provider is configured for ${domain}. You can use a password instead.`
                    : "Try northwind.com or ardentfreight.co to see a matched provider."}
              </p>

              <button
                type="submit"
                disabled={!valid || pending}
                className={cx(btnPrimary, transition, focus, "group mt-4")}
              >
                {pending ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <KeyRound aria-hidden="true" className="h-4 w-4" />
                )}
                {pending
                  ? "Redirecting"
                  : tenant
                    ? `Continue with ${tenant.provider}`
                    : "Continue"}
                {!pending && (
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                )}
              </button>

              <button
                type="button"
                className={cx(btnSecondary, transition, focus, "mt-2")}
              >
                Use a password instead
              </button>
            </form>

            <p className="mt-6 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              Sign-in is logged with the time, device and location, and your
              admin can review it at any time.
            </p>
          </div>
        </div>
      </div>

      <aside className="hidden w-[42%] shrink-0 flex-col border-l border-neutral-200/70 bg-neutral-50 p-8 lg:flex dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-[11px] font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          {tenant ? "Matched organization" : "No match yet"}
        </p>

        {tenant ? (
          <div className="mt-4 flex flex-1 flex-col">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                <Building2
                  aria-hidden="true"
                  className="h-[18px] w-[18px] text-neutral-700 dark:text-neutral-300"
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-50">
                  {tenant.org}
                </p>
                <p className="truncate text-[13px] text-neutral-500 dark:text-neutral-400">
                  {domain}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950">
              <div className={cx(panel, "px-3 py-2.5")}>
                <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <Users aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="text-xs">Directory</span>
                </div>
                <p className="mt-1 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {tenant.members}
                </p>
              </div>
              <div className={cx(panel, "px-3 py-2.5")}>
                <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="text-xs">Provider</span>
                </div>
                <p className="mt-1 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {tenant.provider}
                </p>
              </div>
              <div className={cx(panel, "col-span-2 px-3 py-2.5")}>
                <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="text-xs">Session length</span>
                </div>
                <p className="mt-1 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {tenant.session}
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-1.5">
              {tenant.enforced.map((rule) => (
                <li
                  key={rule}
                  className="flex items-start gap-2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2 text-[13px] leading-5 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                >
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500"
                  />
                  {rule}
                </li>
              ))}
            </ul>

            <p className="mt-auto pt-6 text-xs text-neutral-500 dark:text-neutral-400">
              Locked out? Your workspace admin is at{" "}
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {tenant.admin}
              </span>
              .
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-1 flex-col items-start justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
              <Building2
                aria-hidden="true"
                className="h-[18px] w-[18px] text-neutral-400 dark:text-neutral-500"
              />
            </span>
            <p className="mt-4 text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-50">
              We look up your domain
            </p>
            <p className="mt-1.5 max-w-[280px] text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
              Once your email matches a configured organization, its provider,
              directory size and security rules appear here before you continue.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

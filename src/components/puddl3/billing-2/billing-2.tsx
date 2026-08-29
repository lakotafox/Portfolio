"use client";

import { useMemo, useState } from "react";
import {
  Database,
  Layers,
  Pencil,
  Plus,
  Shield,
  Sparkles,
  Users,
  Zap,
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

const ICONS = {
  seats: Users,
  api: Zap,
  storage: Database,
  environments: Layers,
  insights: Sparkles,
  sso: Shield,
} as const;

type IconKey = keyof typeof ICONS;

type Plan = {
  id: string;
  name: string;
  code: string;
  price: number;
  subscribers: number;
  features: { icon: IconKey; label: string; value: string }[];
  addOns: { icon: IconKey; label: string; value: string }[];
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    code: "PLAN-Starter",
    price: 29,
    subscribers: 1840,
    features: [
      { icon: "seats", label: "Seats", value: "5 included" },
      { icon: "api", label: "API calls", value: "50k / month" },
      { icon: "storage", label: "Storage", value: "10 GB" },
      { icon: "environments", label: "Environments", value: "1" },
    ],
    addOns: [{ icon: "storage", label: "Extra storage", value: "$9 / mo" }],
  },
  {
    id: "growth",
    name: "Growth",
    code: "PLAN-Growth",
    price: 89,
    subscribers: 1120,
    features: [
      { icon: "seats", label: "Seats", value: "20 included" },
      { icon: "api", label: "API calls", value: "500k / month" },
      { icon: "storage", label: "Storage", value: "100 GB" },
      { icon: "environments", label: "Environments", value: "3" },
    ],
    addOns: [{ icon: "insights", label: "Usage insights", value: "$19 / mo" }],
  },
  {
    id: "scale",
    name: "Scale",
    code: "PLAN-Scale",
    price: 249,
    subscribers: 214,
    features: [
      { icon: "seats", label: "Seats", value: "100 included" },
      { icon: "api", label: "API calls", value: "5M / month" },
      { icon: "storage", label: "Storage", value: "1 TB" },
      { icon: "environments", label: "Environments", value: "10" },
    ],
    addOns: [
      { icon: "sso", label: "SSO and SAML", value: "$99 / mo" },
      { icon: "insights", label: "Usage insights", value: "$19 / mo" },
    ],
  },
];

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
        checked
          ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
          : "bg-neutral-200 dark:bg-neutral-700",
      )}
    >
      <span
        className={cx(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-neutral-900",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export default function Billing2() {
  const [state, setState] = useState<
    Record<string, { active: boolean; publicListing: boolean }>
  >({
    starter: { active: true, publicListing: true },
    growth: { active: true, publicListing: true },
    scale: { active: true, publicListing: false },
  });

  const live = useMemo(
    () => Object.values(state).filter((s) => s.active).length,
    [state],
  );

  return (
    <div className="flex h-full min-h-[680px] w-full flex-col overflow-y-auto bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[17px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Plans
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              {PLANS.length} plans · {live} live · edited 14 min ago by Amelia
              Whitfield
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
            New plan
          </button>
        </div>

        <div
          className={cx(
            panel,
            "mt-3 flex flex-col gap-3 p-3 pl-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              aria-hidden
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                Unsaved changes
              </p>
              <p className="mt-0.5 text-[12px] text-neutral-500">
                4 edits across Scale and Enterprise are not published yet.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className={cx(
                "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              Discard
            </button>
            <button
              type="button"
              className={cx(
                "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              Save changes
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const s = state[plan.id];
            return (
              <div key={plan.id} className={cx(frame, "flex flex-col gap-1")}>
                <div className={cx(panel, "p-4")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
                          {plan.name}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500">
                          <span
                            className={cx(
                              "h-1.5 w-1.5 rounded-full",
                              s.active
                                ? "bg-neutral-300 dark:bg-neutral-600"
                                : "bg-amber-500",
                            )}
                            aria-hidden
                          />
                          {s.active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-neutral-500 tabular-nums">
                        {plan.code} · {plan.subscribers.toLocaleString("en-US")}{" "}
                        subscribers
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Edit ${plan.name}`}
                      className={cx(
                        "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                        transition,
                        focus,
                      )}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[28px] leading-none font-medium tracking-[-0.02em] text-neutral-900 tabular-nums dark:text-neutral-100">
                      ${plan.price}
                    </span>
                    <span className="text-[13px] text-neutral-500">
                      per seat / mo
                    </span>
                  </p>
                </div>

                <div className={cx(panel, "flex-1 p-4")}>
                  <p className="text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
                    Entitlements
                  </p>
                  <ul className="mt-2.5 space-y-2.5">
                    {plan.features.map((f) => {
                      const Icon = ICONS[f.icon];
                      return (
                        <li
                          key={f.label}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="flex min-w-0 items-center gap-2 text-[13px] text-neutral-900 dark:text-neutral-100">
                            <Icon
                              className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                              aria-hidden
                            />
                            <span className="truncate">{f.label}</span>
                          </span>
                          <span className="shrink-0 text-[13px] text-neutral-500 tabular-nums">
                            {f.value}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {plan.addOns.length > 0 && (
                    <>
                      <p className="mt-4 text-[12px] tracking-[0.06em] text-neutral-400 uppercase">
                        Add-ons
                      </p>
                      <ul className="mt-2.5 space-y-2.5">
                        {plan.addOns.map((f) => {
                          const Icon = ICONS[f.icon];
                          return (
                            <li
                              key={f.label}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="flex min-w-0 items-center gap-2 text-[13px] text-neutral-900 dark:text-neutral-100">
                                <Icon
                                  className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                                  aria-hidden
                                />
                                <span className="truncate">{f.label}</span>
                              </span>
                              <span className="shrink-0 text-[13px] text-neutral-500 tabular-nums">
                                {f.value}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  className={cx(
                    panel,
                    "flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    transition,
                    focus,
                  )}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add entitlement
                </button>

                <div className={cx(panel, "px-4 py-3")}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-neutral-900 dark:text-neutral-100">
                      Active
                    </span>
                    <Switch
                      checked={s.active}
                      label={`${plan.name} active`}
                      onChange={(v) =>
                        setState((prev) => ({
                          ...prev,
                          [plan.id]: { ...prev[plan.id], active: v },
                        }))
                      }
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <span className="text-[13px] text-neutral-900 dark:text-neutral-100">
                      Listed publicly
                    </span>
                    <Switch
                      checked={s.publicListing}
                      label={`${plan.name} listed publicly`}
                      onChange={(v) =>
                        setState((prev) => ({
                          ...prev,
                          [plan.id]: { ...prev[plan.id], publicListing: v },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

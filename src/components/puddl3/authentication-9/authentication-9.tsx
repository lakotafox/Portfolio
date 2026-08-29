"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Fingerprint,
  Laptop,
  Mail,
  ShieldCheck,
  Smartphone,
  Usb,
  X,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const btnPrimary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]";

const btnTertiary =
  "inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700";

const CREDENTIALS = [
  {
    id: "mac",
    icon: Laptop,
    name: "MacBook Pro",
    meta: "Touch ID · used 2 days ago",
  },
  {
    id: "phone",
    icon: Smartphone,
    name: "Dana's iPhone",
    meta: "Face ID · used 3 weeks ago",
  },
  {
    id: "key",
    icon: Usb,
    name: "Security key",
    meta: "Hardware key · used in March",
  },
] as const;

export default function Authentication9() {
  const [selected, setSelected] = useState<string>("mac");
  const [phase, setPhase] = useState<"idle" | "waiting" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const credential =
    CREDENTIALS.find((c) => c.id === selected) ?? CREDENTIALS[0];

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const start = () => {
    setPhase("waiting");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPhase("done"), 2200);
  };

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("idle");
  };

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center">
        <div className="rounded-[var(--rb-r-4xl,18px)] border border-neutral-200/70 bg-white p-6 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="min-h-[404px]">
            {phase === "idle" && (
              <div className="animate-[fade_200ms_ease-out] motion-reduce:animate-none">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                  <Fingerprint
                    aria-hidden="true"
                    className="h-[18px] w-[18px] text-neutral-700 dark:text-neutral-300"
                  />
                </div>

                <h1 className="mt-4 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                  Sign in with a passkey
                </h1>
                <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Your device confirms it is you. There is nothing to type and
                  nothing to remember.
                </p>

                <fieldset className="mt-5">
                  <legend className="sr-only">Choose a passkey</legend>
                  <div className="space-y-1.5">
                    {CREDENTIALS.map((item) => {
                      const Icon = item.icon;
                      const active = item.id === selected;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelected(item.id)}
                          className={cx(
                            "flex w-full cursor-pointer items-center gap-3 rounded-[var(--rb-r-lg,10px)] border px-3 py-2.5 text-left active:scale-[0.99]",
                            transition,
                            focus,
                            active
                              ? "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
                              : "border-neutral-200/70 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800",
                          )}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                            <Icon
                              aria-hidden="true"
                              className="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                              {item.name}
                            </span>
                            <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                              {item.meta}
                            </span>
                          </span>
                          {active && (
                            <Check
                              aria-hidden="true"
                              strokeWidth={2.5}
                              className="h-4 w-4 shrink-0 text-neutral-900 dark:text-white"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <button
                  type="button"
                  onClick={start}
                  className={cx(btnPrimary, transition, focus, "mt-4")}
                >
                  <Fingerprint aria-hidden="true" className="h-4 w-4" />
                  Continue with {credential.name}
                </button>

                <div className="mt-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Other ways in
                  </span>
                  <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={cx(btnTertiary, transition, focus)}
                  >
                    <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    Password
                  </button>
                  <button
                    type="button"
                    className={cx(btnTertiary, transition, focus)}
                  >
                    <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                    Email link
                  </button>
                </div>
              </div>
            )}

            {phase === "waiting" && (
              <div className="flex h-[404px] animate-[fade_200ms_ease-out] flex-col items-center justify-center text-center motion-reduce:animate-none">
                <span className="relative flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-neutral-200 motion-reduce:animate-none dark:bg-neutral-800" />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                    <Fingerprint
                      aria-hidden="true"
                      className="h-7 w-7 text-neutral-700 dark:text-neutral-300"
                    />
                  </span>
                </span>

                <h1 className="mt-6 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                  Confirm on {credential.name}
                </h1>
                <p
                  aria-live="polite"
                  className="mt-1.5 max-w-[280px] text-sm leading-6 text-neutral-500 dark:text-neutral-400"
                >
                  Waiting for your device. This request expires in two minutes.
                </p>

                <button
                  type="button"
                  onClick={cancel}
                  className={cx(
                    "mt-6 inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                    transition,
                    focus,
                  )}
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                  Cancel request
                </button>
              </div>
            )}

            {phase === "done" && (
              <div className="flex h-[404px] animate-[fade_200ms_ease-out] flex-col items-center justify-center text-center motion-reduce:animate-none">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]">
                  <Check
                    aria-hidden="true"
                    strokeWidth={2.5}
                    className="h-6 w-6 text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                  />
                </span>
                <h1 className="mt-5 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                  Signed in
                </h1>
                <p className="mt-1.5 max-w-[280px] text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {credential.name} confirmed it was you. Taking you to the
                  Northwind workspace.
                </p>
                <button
                  type="button"
                  onClick={() => setPhase("idle")}
                  className={cx(
                    "mt-6 inline-flex h-9 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                    transition,
                    focus,
                  )}
                >
                  Use a different passkey
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          Passkeys stay on your device and are never sent to Northwind.
        </p>
      </div>

      <style>{`@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

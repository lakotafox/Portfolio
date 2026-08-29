"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

type Key = {
  id: string;
  label: string;
  env: "Production" | "Staging" | "Local";
  secret: string;
  created: string;
  used: string;
  scope: "Read" | "Read & write";
};

const SEED: Key[] = [
  {
    id: "k1",
    label: "Billing worker",
    env: "Production",
    secret: "rbk_live_8fc2a41d9b7e4c06a5d3",
    created: "Jan 12, 2025",
    used: "2 minutes ago",
    scope: "Read & write",
  },
  {
    id: "k2",
    label: "Warehouse sync",
    env: "Production",
    secret: "rbk_live_2ad7f60c1e894b35c7f1",
    created: "Nov 30, 2024",
    used: "1 hour ago",
    scope: "Read",
  },
  {
    id: "k3",
    label: "Preview environment",
    env: "Staging",
    secret: "rbk_test_51bd9e73a4c6408fb2ee",
    created: "Feb 04, 2025",
    used: "3 days ago",
    scope: "Read & write",
  },
  {
    id: "k4",
    label: "Ana's laptop",
    env: "Local",
    secret: "rbk_test_c93f14a08de74b62915a",
    created: "Feb 21, 2025",
    used: "Never",
    scope: "Read",
  },
];

const mask = (s: string) => `${s.slice(0, 8)}${"•".repeat(16)}${s.slice(-4)}`;

export default function Integrations3() {
  const uid = useId();
  const reduce = useReducedMotion();
  const [keys, setKeys] = useState(SEED);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const seq = useRef(0);
  const timer = useRef<number | null>(null);

  const copy = (id: string) => {
    setCopied(id);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1600);
  };

  const rotate = (id: string) =>
    setKeys((prev) =>
      prev.map((k) =>
        k.id === id
          ? {
              ...k,
              secret: `${k.secret.slice(0, 9)}${k.secret
                .slice(9)
                .split("")
                .reverse()
                .join("")}`,
              used: "Never",
              created: "Just now",
            }
          : k,
      ),
    );

  const create = () => {
    seq.current += 1;
    setKeys((prev) => [
      {
        id: `new-${seq.current}`,
        label: `Untitled key ${seq.current}`,
        env: "Local",
        secret: `rbk_test_${`${seq.current}`.padStart(4, "0")}e7b1c4a9d63f082a`,
        created: "Just now",
        used: "Never",
        scope: "Read",
      },
      ...prev,
    ]);
  };

  return (
    <div className="relative flex h-full min-h-[680px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <div>
          <h2 className="text-[17px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-white">
            API keys
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
            Keys inherit the permissions of the workspace they belong to.
          </p>
        </div>
        <button
          type="button"
          onClick={create}
          className={cx(
            "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
            "hover:bg-neutral-800 dark:hover:bg-neutral-200",
            transition,
            focus,
          )}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Create key
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {keys.length > 0 ? (
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                {["Name", "Key", "Scope", "Last used", ""].map((h, i) => (
                  <th
                    key={h || i}
                    scope="col"
                    className={cx(
                      "h-9 px-4 text-[12px] font-medium text-neutral-500 dark:text-neutral-400",
                      i === 4 && "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {keys.map((k) => {
                  const open = !!shown[k.id];
                  return (
                    <motion.tr
                      key={k.id}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduce ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="group border-b border-neutral-200/70 last:border-0 hover:bg-neutral-50 dark:border-neutral-800/70 dark:hover:bg-neutral-900/60"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <span
                            aria-hidden
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200/70 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500"
                          >
                            <KeyRound
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] text-neutral-900 dark:text-white">
                              {k.label}
                            </p>
                            <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
                              {k.env} · created {k.created}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-[12.5px] text-neutral-600 dark:text-neutral-400">
                            {open ? k.secret : mask(k.secret)}
                          </code>
                          <button
                            type="button"
                            aria-label={open ? "Hide key" : "Reveal key"}
                            aria-pressed={open}
                            onClick={() =>
                              setShown((p) => ({ ...p, [k.id]: !p[k.id] }))
                            }
                            className={cx(
                              "inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white",
                              transition,
                              focus,
                            )}
                          >
                            {open ? (
                              <EyeOff
                                className="h-3.5 w-3.5"
                                strokeWidth={1.75}
                              />
                            ) : (
                              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label="Copy key"
                            onClick={() => copy(k.id)}
                            className={cx(
                              "inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white",
                              transition,
                              focus,
                            )}
                          >
                            <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                          <AnimatePresence>
                            {copied === k.id && (
                              <motion.span
                                initial={reduce ? false : { opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={reduce ? undefined : { opacity: 0 }}
                                transition={{ duration: 0.14 }}
                                className="text-[12px] text-emerald-600 dark:text-emerald-500"
                              >
                                Copied
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span className="inline-flex h-5.5 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[12px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                          {k.scope}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle text-[13px] text-neutral-500 dark:text-neutral-400">
                        {k.used}
                      </td>

                      <td className="px-4 py-3 text-right align-middle">
                        <div className="inline-flex items-center gap-1 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => rotate(k.id)}
                            className={cx(
                              "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-2 text-[12px] text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
                              "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                              transition,
                              focus,
                            )}
                          >
                            <RotateCw className="h-3 w-3" strokeWidth={1.75} />
                            Rotate
                          </button>
                          <button
                            type="button"
                            aria-label={`Revoke ${k.label}`}
                            onClick={() =>
                              setKeys((p) => p.filter((x) => x.id !== k.id))
                            }
                            className={cx(
                              "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400",
                              "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400",
                              transition,
                              focus,
                            )}
                          >
                            <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-xl,12px)] border border-neutral-200/70 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500">
              <KeyRound className="h-4.5 w-4.5" strokeWidth={1.5} />
            </span>
            <p className="mt-3 text-[14px] font-medium text-neutral-900 dark:text-white">
              No API keys
            </p>
            <p className="mt-1 max-w-[300px] text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
              Create a key to call the API from a server you control. Keys are
              shown once and can be rotated at any time.
            </p>
            <button
              type="button"
              onClick={create}
              className={cx(
                "mt-4 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]",
                "hover:bg-neutral-800 dark:hover:bg-neutral-200",
                transition,
                focus,
              )}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Create key
            </button>
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-neutral-200 px-5 py-2.5 text-[12px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <span className="tabular-nums">{keys.length}</span> keys · revoking
        takes effect immediately
      </footer>
      <p className="sr-only" aria-live="polite" id={`${uid}-live`}>
        {keys.length} API keys
      </p>
    </div>
  );
}

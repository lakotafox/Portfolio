"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  MoreHorizontal,
  Plus,
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

type ApiKey = {
  id: string;
  name: string;
  token: string;
  created: string;
  lastUsed: string;
};

const initialKeys: ApiKey[] = [
  {
    id: "k1",
    name: "Production server",
    token: "sk_live_9f2c7b1e8d5a4a2f6c0b",
    created: "Mar 2, 2026",
    lastUsed: "3 minutes ago",
  },
  {
    id: "k2",
    name: "Staging",
    token: "sk_test_41ab88de20cf7719ee02",
    created: "Jan 18, 2026",
    lastUsed: "Yesterday",
  },
  {
    id: "k3",
    name: "Data warehouse sync",
    token: "sk_live_0d3e6a9c1f7b2e5a8c4d",
    created: "Nov 9, 2025",
    lastUsed: "Never",
  },
];

const integrations = [
  {
    id: "slack",
    name: "Slack",
    detail: "Post alerts to #ops-notifications.",
    connected: true,
  },
  {
    id: "github",
    name: "GitHub",
    detail: "Link commits to deployments.",
    connected: false,
  },
  {
    id: "linear",
    name: "Linear",
    detail: "Create follow-up issues from incidents.",
    connected: true,
  },
];

const primaryButton =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const iconButton =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-500 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const miniIconButton =
  "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-500 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const menuItemClass =
  "flex h-8 w-full cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2 text-left text-[13px] text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const menuItemDangerClass =
  "flex h-8 w-full cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2 text-left text-[13px] text-red-600 transition-colors duration-150 hover:bg-red-50 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red-600 disabled:pointer-events-none disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:outline-red-400";

const maskToken = (token: string) =>
  `${token.slice(0, 8)}${"\u2022".repeat(12)}${token.slice(-8)}`;

function Switch({
  checked,
  onChange,
  labelledBy,
  describedBy,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  labelledBy: string;
  describedBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
        "disabled:pointer-events-none disabled:opacity-50",
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

type MenuItem = {
  id: string;
  label: string;
  danger?: boolean;
  run: () => void;
};

function RowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    setShown(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    const doc = wrapRef.current?.ownerDocument ?? document;
    const raf = requestAnimationFrame(() => setShown(true));
    const onDown = (e: Event) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(true);
      }
    };
    doc.addEventListener("pointerdown", onDown);
    doc.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      doc.removeEventListener("pointerdown", onDown);
      doc.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[active]?.focus({ preventScroll: true });
  }, [open, active]);

  const openAt = (index: number) => {
    setShown(false);
    setActive(index);
    setOpen(true);
  };

  const move = (delta: number) =>
    setActive((cur) => (cur + delta + items.length) % items.length);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close(false) : openAt(0))}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            openAt(0);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            openAt(items.length - 1);
          }
        }}
        className={iconButton}
      >
        <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={label}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              move(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              move(-1);
            } else if (e.key === "Home") {
              e.preventDefault();
              setActive(0);
            } else if (e.key === "End") {
              e.preventDefault();
              setActive(items.length - 1);
            } else if (e.key === "Tab") {
              close(false);
            }
          }}
          className={cx(
            "absolute right-0 top-9 z-30 w-40 origin-top-right rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-1 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none",
            shown ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={i === active ? 0 : -1}
              onFocus={() => setActive(i)}
              onClick={() => {
                item.run();
                close(true);
              }}
              className={item.danger ? menuItemDangerClass : menuItemClass}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function SettingsForm5() {
  const body = useScrollFade<HTMLDivElement>();
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map((i) => [i.id, i.connected])),
  );
  const nextId = useRef(initialKeys.length);
  const copyTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const randomToken = (prefix: string) => {
    let out = "";
    for (let i = 0; i < 20; i += 1)
      out += "0123456789abcdef"[Math.floor(Math.random() * 16)];
    return `${prefix}${out}`;
  };

  const copy = (key: ApiKey) => {
    void navigator.clipboard?.writeText(key.token);
    setCopied(key.id);
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(null), 2000);
  };

  const create = () => {
    nextId.current += 1;
    const id = `k${nextId.current}`;
    setKeys((prev) => [
      {
        id,
        name: `New key ${nextId.current}`,
        token: randomToken("sk_live_"),
        created: "Just now",
        lastUsed: "Never",
      },
      ...prev,
    ]);
    setRevealed((r) => ({ ...r, [id]: true }));
  };

  const rotate = (id: string) => {
    setKeys((prev) =>
      prev.map((k) =>
        k.id === id
          ? {
              ...k,
              token: randomToken(k.token.slice(0, 8)),
              created: "Just now",
              lastUsed: "Never",
            }
          : k,
      ),
    );
    setRevealed((r) => ({ ...r, [id]: true }));
  };

  const revoke = (id: string) =>
    setKeys((prev) => prev.filter((k) => k.id !== id));

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="shrink-0 px-4 sm:px-6">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-3">
          <h2 className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            API keys
          </h2>
          <button
            type="button"
            onClick={create}
            className={cx(primaryButton, "ml-auto")}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Create key
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={body.ref}
          onScroll={body.onScroll}
          className="h-full overflow-y-auto px-4 sm:px-6"
        >
          <div className="mx-auto w-full max-w-2xl space-y-4 pb-4 sm:pb-6">
            <div className="overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Secret keys
                </h3>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  Rotate credentials and copy tokens for server-side services.
                </p>
              </div>

              {keys.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  >
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      No secret keys
                    </p>
                    <p className="mt-1 text-[13px] text-neutral-500">
                      Create a key to let a server-side service call the API.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={create}
                    className={cx(primaryButton, "mt-1")}
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Create key
                  </button>
                </div>
              ) : (
                <ul className="flex flex-col gap-1.5 p-1.5">
                  {keys.map((k) => {
                    const show = revealed[k.id];
                    return (
                      <li
                        key={k.id}
                        className="rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                              {k.name}
                            </p>
                            <p className="mt-0.5 text-xs text-neutral-500">
                              Created {k.created}.{" "}
                              {k.lastUsed === "Never"
                                ? "Never used."
                                : `Last used ${k.lastUsed}.`}
                            </p>
                          </div>
                          <RowMenu
                            label={`Actions for ${k.name}`}
                            items={[
                              {
                                id: "rotate",
                                label: "Rotate key",
                                run: () => rotate(k.id),
                              },
                              {
                                id: "revoke",
                                label: "Revoke key",
                                danger: true,
                                run: () => revoke(k.id),
                              },
                            ]}
                          />
                        </div>

                        <div className="mt-2 flex h-9 items-center gap-1 rounded-[var(--rb-r-md,8px)] bg-white pl-3 pr-1 dark:bg-neutral-900">
                          <code className="min-w-0 flex-1 truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                            {show ? k.token : maskToken(k.token)}
                          </code>
                          <button
                            type="button"
                            aria-label={
                              show ? `Hide ${k.name}` : `Reveal ${k.name}`
                            }
                            onClick={() =>
                              setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))
                            }
                            className={miniIconButton}
                          >
                            {show ? (
                              <EyeOff
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                            ) : (
                              <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label={`Copy ${k.name}`}
                            onClick={() => copy(k)}
                            className={miniIconButton}
                          >
                            {copied === k.id ? (
                              <Check
                                aria-hidden="true"
                                className="h-3.5 w-3.5 text-neutral-900 dark:text-neutral-100"
                              />
                            ) : (
                              <Copy
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                            )}
                          </button>
                          <span className="sr-only" role="status">
                            {copied === k.id ? `${k.name} copied` : ""}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Integrations
                </h3>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  Allow connected services to act on this account.
                </p>
              </div>

              <ul className="flex flex-col gap-1.5 p-1.5">
                {integrations.map((i) => {
                  const on = connected[i.id];
                  return (
                    <li
                      key={i.id}
                      className="flex items-center justify-between gap-4 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/50"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            id={`integration-${i.id}-label`}
                            className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
                          >
                            {i.name}
                          </span>
                          {on ? (
                            <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                              Connected
                            </span>
                          ) : null}
                        </div>
                        <p
                          id={`integration-${i.id}-hint`}
                          className="mt-0.5 truncate text-[13px] text-neutral-500"
                        >
                          {i.detail}
                        </p>
                      </div>
                      <Switch
                        checked={on}
                        onChange={(next) =>
                          setConnected((c) => ({ ...c, [i.id]: next }))
                        }
                        labelledBy={`integration-${i.id}-label`}
                        describedBy={`integration-${i.id}-hint`}
                      />
                    </li>
                  );
                })}
              </ul>

              <div className="bg-neutral-50 px-4 py-3 text-[13px] text-neutral-600 dark:bg-neutral-900/60 dark:text-neutral-400">
                Key rotations and integration changes are audit logged.
              </div>
            </div>
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
    </div>
  );
}

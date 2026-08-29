"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";
import { AlertCircle, Check, ChevronDown, Loader2 } from "lucide-react";

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

const inputClass =
  "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const selectClass =
  "h-9 w-full cursor-pointer appearance-none rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pl-3 pr-8 text-sm text-neutral-900 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const errorBox =
  "border-red-500 hover:border-red-500 focus:border-red-500 focus-visible:outline-red-500 focus-within:border-red-500 focus-within:outline-red-500 dark:border-red-500 dark:hover:border-red-500 dark:focus:border-red-500 dark:focus-visible:outline-red-500 dark:focus-within:border-red-500 dark:focus-within:outline-red-500";

const secondaryButton =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-50 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const destructiveButton =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-red-600 px-3 text-sm font-medium text-white transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-red-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-red-500";

const rowTitleClass =
  "text-[13px] font-medium text-neutral-900 dark:text-neutral-100";

const rowDescClass = "mt-0.5 text-[13px] text-neutral-500";

const WORKSPACE = "northwind";

const admins = [
  { value: "devan", label: "Devan Rao" },
  { value: "priyanka", label: "Priyanka Balasubramanian" },
  { value: "sofia", label: "Sofia Castellano" },
];

function ActionRow({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className={rowTitleClass}>{title}</p>
          <p className={rowDescClass}>{description}</p>
        </div>
        {action ? <div className="sm:shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}

export default function SettingsForm6() {
  const body = useScrollFade<HTMLDivElement>();
  const reduce = useReducedMotion();
  const [owner, setOwner] = useState("You");
  const [transferring, setTransferring] = useState(false);
  const [nextOwner, setNextOwner] = useState(admins[0].value);
  const [archived, setArchived] = useState(false);
  const [confirming, setConfirming] = useState(true);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const matches = typed.trim() === WORKSPACE;
  const mismatch = (attempted || typed.trim().length > 0) && !matches;

  const submit = () => {
    if (deleting) return;
    if (!matches) {
      setAttempted(true);
      return;
    }
    setDeleting(true);
    window.setTimeout(
      () => {
        setDeleting(false);
        setDeleted(true);
        setTyped("");
        setAttempted(false);
      },
      reduce ? 0 : 900,
    );
  };

  const restore = () => {
    setDeleted(false);
    setConfirming(true);
  };

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="shrink-0 px-4 sm:px-6">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center">
          <h2 className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Danger zone
          </h2>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={body.ref}
          onScroll={body.onScroll}
          className="h-full overflow-y-auto px-4 sm:px-6"
        >
          <div className="mx-auto w-full max-w-2xl pb-4 sm:pb-6">
            <div className="overflow-hidden rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Workspace controls
                </h3>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  These actions affect everyone in the workspace. Review before
                  you confirm.
                </p>
              </div>

              {deleted ? (
                <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <p
                      role="status"
                      className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      northwind was deleted
                    </p>
                    <p className="mt-1 text-[13px] text-neutral-500">
                      All 24 members have lost access. Data is held for 30 days
                      before it is erased.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={restore}
                    className={cx(secondaryButton, "mt-1")}
                  >
                    Restore workspace
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 p-1.5">
                  <ActionRow
                    title="Transfer ownership"
                    description={
                      owner === "You"
                        ? "Hand the workspace to another admin. You keep your account."
                        : `${owner} owns this workspace. You keep your account.`
                    }
                    action={
                      transferring ? null : (
                        <button
                          type="button"
                          onClick={() => setTransferring(true)}
                          className={cx(secondaryButton, "w-full sm:w-auto")}
                        >
                          {owner === "You" ? "Transfer" : "Change owner"}
                        </button>
                      )
                    }
                  >
                    {transferring ? (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor="next-owner"
                            className="block text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
                          >
                            New owner
                          </label>
                          <div className="relative mt-1.5">
                            <select
                              id="next-owner"
                              value={nextOwner}
                              onChange={(e) => setNextOwner(e.target.value)}
                              className={selectClass}
                            >
                              {admins.map((a) => (
                                <option key={a.value} value={a.value}>
                                  {a.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              aria-hidden="true"
                              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => setTransferring(false)}
                            className={cx(secondaryButton, "w-full sm:w-auto")}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOwner(
                                admins.find((a) => a.value === nextOwner)
                                  ?.label ?? "You",
                              );
                              setTransferring(false);
                            }}
                            className={cx(secondaryButton, "w-full sm:w-auto")}
                          >
                            Confirm transfer
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </ActionRow>

                  <ActionRow
                    title="Export and archive"
                    description={
                      archived
                        ? "The workspace is read-only. Members can view but not edit."
                        : "Download all data, then make the workspace read-only."
                    }
                    action={
                      <button
                        type="button"
                        onClick={() => setArchived((a) => !a)}
                        className={cx(secondaryButton, "w-full sm:w-auto")}
                      >
                        {archived ? "Restore access" : "Archive workspace"}
                      </button>
                    }
                  />

                  <ActionRow
                    title="Delete workspace"
                    description="Permanently remove northwind and everything in it."
                    action={
                      confirming ? null : (
                        <button
                          type="button"
                          onClick={() => setConfirming(true)}
                          className={cx(secondaryButton, "w-full sm:w-auto")}
                        >
                          Review deletion
                        </button>
                      )
                    }
                  >
                    {confirming ? (
                      <div className="mt-3">
                        <p className={rowTitleClass}>
                          Deleting removes, for all 24 members:
                        </p>
                        <ul className="mt-2 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                          {[
                            "1,284 projects and their history",
                            "All API keys and connected integrations",
                            "The northwind.app subdomain, released for reuse",
                          ].map((line) => (
                            <li key={line} className="flex items-start gap-2">
                              <span
                                aria-hidden="true"
                                className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-600"
                              />
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3">
                          <label
                            htmlFor="confirm-name"
                            className="block text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
                          >
                            Type <span className="font-mono">{WORKSPACE}</span>{" "}
                            to confirm
                          </label>
                          <input
                            id="confirm-name"
                            value={typed}
                            autoComplete="off"
                            spellCheck={false}
                            aria-invalid={mismatch ? true : undefined}
                            aria-describedby={
                              mismatch ? "confirm-name-error" : undefined
                            }
                            onChange={(e) => {
                              setTyped(e.target.value);
                              if (attempted) setAttempted(false);
                            }}
                            className={cx(
                              inputClass,
                              "mt-1.5 font-mono",
                              mismatch && errorBox,
                            )}
                          />
                          {mismatch ? (
                            <p
                              id="confirm-name-error"
                              role="alert"
                              className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400"
                            >
                              <AlertCircle
                                aria-hidden="true"
                                className="mt-px h-3.5 w-3.5 shrink-0"
                              />
                              {typed.trim().length === 0
                                ? `Type ${WORKSPACE} to confirm deletion.`
                                : `The name does not match ${WORKSPACE}.`}
                            </p>
                          ) : null}
                        </div>

                        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirming(false);
                              setTyped("");
                              setAttempted(false);
                            }}
                            className={cx(secondaryButton, "w-full sm:w-auto")}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={submit}
                            disabled={deleting}
                            className={cx(
                              destructiveButton,
                              "w-full min-w-[10rem] sm:w-auto",
                            )}
                          >
                            {deleting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                                Deleting
                              </>
                            ) : (
                              "Delete this workspace"
                            )}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </ActionRow>
                </div>
              )}

              <div className="bg-neutral-50 px-4 py-3 text-[13px] text-neutral-600 dark:bg-neutral-900/60 dark:text-neutral-400">
                Export data before irreversible workspace changes.
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

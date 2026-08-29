"use client";

import { useId, useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, Folder, Users } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const field =
  "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white";

const btnPrimary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]";

const btnProvider =
  "inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-900 hover:bg-neutral-50 active:scale-[0.97] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

const linkClass =
  "cursor-pointer rounded-[var(--rb-r-xs,4px)] underline decoration-neutral-300 underline-offset-[3px] transition-colors duration-150 hover:decoration-neutral-900 dark:decoration-neutral-600 dark:hover:decoration-white";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M21.35 11.1H12v2.98h5.35c-.24 1.4-1.75 4.1-5.35 4.1a5.95 5.95 0 0 1 0-11.9c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.62 14.53 2.7 12 2.7a9.3 9.3 0 1 0 0 18.6c5.25 0 8.73-3.69 8.73-8.88 0-.6-.06-1.05-.14-1.52Z" />
    </svg>
  );
}

const TEAM = ["MB", "PN", "SA", "WC", "TG"];

const PROJECTS = [
  { name: "Q3 network rollout", meta: "18 open tasks" },
  { name: "Carrier scorecards", meta: "6 open tasks" },
  { name: "Depot capacity model", meta: "2 open tasks" },
];

export default function Authentication12() {
  const nameId = useId();
  const passwordId = useId();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const ready = name.trim().length > 1 && password.length >= 10;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) setAccepted(true);
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
          <div className="mx-auto w-full max-w-[380px] py-6">
            {accepted ? (
              <div className="animate-[fade_200ms_ease-out] motion-reduce:animate-none">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]">
                  <Check
                    aria-hidden="true"
                    strokeWidth={2.5}
                    className="h-6 w-6 text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                  />
                </span>
                <h1 className="mt-5 text-2xl font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
                  You&rsquo;re in
                </h1>
                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Your account is ready and Northwind Operations is now in your
                  workspace list.
                </p>
                <button
                  type="button"
                  className={cx(btnPrimary, transition, focus, "mt-6")}
                >
                  Open Northwind Operations
                </button>
                <button
                  type="button"
                  onClick={() => setAccepted(false)}
                  className={cx(
                    "mt-4 text-sm text-neutral-500 dark:text-neutral-400",
                    linkClass,
                    focus,
                  )}
                >
                  Review the invitation again
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    MB
                  </span>
                  <p className="min-w-0 text-[13px] text-neutral-500 dark:text-neutral-400">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      Marcus Bell
                    </span>{" "}
                    invited you as an editor
                  </p>
                </div>

                <h1 className="mt-4 text-2xl leading-8 font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
                  Join Northwind Operations
                </h1>
                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Set a name and password for{" "}
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    dana.whitfield@northwind.com
                  </span>
                  . The invitation expires on 14 August.
                </p>

                <button
                  type="button"
                  className={cx(btnProvider, transition, focus, "mt-6")}
                >
                  <GoogleMark className="h-4 w-4" />
                  Continue with Google
                </button>

                <div className="mt-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    or set a password
                  </span>
                  <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                </div>

                <form onSubmit={submit} className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor={nameId}
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      Full name
                    </label>
                    <input
                      id={nameId}
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dana Whitfield"
                      className={cx(field, focus)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={passwordId}
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id={passwordId}
                        type={reveal ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 10 characters"
                        className={cx(field, focus, "pr-10")}
                      />
                      <button
                        type="button"
                        onClick={() => setReveal((v) => !v)}
                        aria-label={reveal ? "Hide password" : "Show password"}
                        className={cx(
                          "absolute top-1 right-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                          transition,
                          focus,
                        )}
                      >
                        {reveal ? (
                          <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
                        ) : (
                          <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!ready}
                    className={cx(btnPrimary, transition, focus)}
                  >
                    Accept invitation
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  Not expecting this?{" "}
                  <button
                    type="button"
                    className={cx(
                      "text-neutral-700 dark:text-neutral-300",
                      linkClass,
                      focus,
                    )}
                  >
                    Decline the invitation
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <aside className="hidden w-[42%] shrink-0 flex-col border-l border-neutral-200/70 bg-neutral-50 p-8 lg:flex dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-[11px] font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          What you are joining
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white text-sm font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
            NO
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-50">
              Northwind Operations
            </p>
            <p className="truncate text-[13px] text-neutral-500 dark:text-neutral-400">
              northwind.com
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex shrink-0 items-center">
            {TEAM.map((mark, i) => (
              <span
                key={mark}
                className={cx(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-[10px] font-medium text-neutral-700 dark:border-neutral-950 dark:bg-neutral-800 dark:text-neutral-200",
                  i > 0 && "-ml-1.5",
                )}
              >
                {mark}
              </span>
            ))}
            <span className="-ml-1 flex h-7 items-center rounded-full border-2 border-white bg-neutral-100 px-2 text-[10px] font-medium text-neutral-600 dark:border-neutral-950 dark:bg-neutral-800 dark:text-neutral-300">
              +407
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-neutral-500 dark:text-neutral-400">
            <Users aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">412 members</span>
          </div>
        </div>

        <p className="mt-6 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Projects shared with you
        </p>
        <ul className="mt-2 space-y-1.5">
          {PROJECTS.map((project) => (
            <li
              key={project.name}
              className="flex items-center gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <Folder
                  aria-hidden="true"
                  className="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  {project.name}
                </span>
                <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {project.meta}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-auto pt-6 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          Editors can create and change work but cannot manage billing or remove
          members.
        </p>
      </aside>

      <style>{`@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

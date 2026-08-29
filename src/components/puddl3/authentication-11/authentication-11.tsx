"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, Check, Plus, Search } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const btnPrimary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]";

const badge =
  "inline-flex h-5 shrink-0 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-1.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";

type Workspace = {
  id: string;
  name: string;
  members: string;
  role: string;
  state: "member" | "invited";
  mark: string;
};

const WORKSPACES: Workspace[] = [
  {
    id: "northwind-ops",
    name: "Northwind Operations",
    members: "412 members",
    role: "Admin",
    state: "member",
    mark: "NO",
  },
  {
    id: "northwind-design",
    name: "Northwind Design",
    members: "38 members",
    role: "Editor",
    state: "member",
    mark: "ND",
  },
  {
    id: "ardent",
    name: "Ardent Freight",
    members: "1,284 members",
    role: "Contractor",
    state: "member",
    mark: "AF",
  },
  {
    id: "kestrel",
    name: "Kestrel Data Platform",
    members: "96 members",
    role: "Viewer",
    state: "member",
    mark: "KD",
  },
  {
    id: "aurelia",
    name: "Aurelia Product Studio",
    members: "24 members",
    role: "Invited by Mina Park",
    state: "invited",
    mark: "AP",
  },
  {
    id: "harbour",
    name: "Harbour Logistics Consortium",
    members: "3,410 members",
    role: "Invited by Daniel Osei",
    state: "invited",
    mark: "HL",
  },
];

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      start: scrollTop > 1,
      end: Math.ceil(scrollTop + clientHeight) < scrollHeight - 1,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view?.ResizeObserver) return;
    const observer = new view.ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  return { ref, edges, onScroll: update };
}

export default function Authentication11() {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("northwind-ops");
  const { ref, edges, onScroll } = useScrollFade<HTMLDivElement>();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORKSPACES;
    return WORKSPACES.filter((w) => w.name.toLowerCase().includes(q));
  }, [query]);

  const active = WORKSPACES.find((w) => w.id === selected);
  const invited = active?.state === "invited";

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[13px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            DW
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Dana Whitfield
            </p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              dana.whitfield@northwind.com
            </p>
          </div>
          <button
            type="button"
            className={cx(
              "inline-flex h-8 shrink-0 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
              transition,
              focus,
            )}
          >
            Sign out
          </button>
        </div>

        <h1 className="mt-6 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
          Pick a workspace
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          You belong to four workspaces and have two open invitations.
        </p>

        <div className="relative mt-4">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
          />
          <input
            id={searchId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspaces"
            aria-label="Search workspaces"
            className={cx(
              "h-9 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pr-3 pl-9 text-sm text-neutral-900 transition-colors duration-150 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white",
              focus,
            )}
          />
        </div>

        <div className="relative mt-3 h-[300px] shrink-0">
          <div
            ref={ref}
            onScroll={onScroll}
            className="h-full space-y-1.5 overflow-y-auto pr-0.5"
          >
            {results.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  No workspace matches &ldquo;{query}&rdquo;
                </p>
                <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                  Check the spelling, or ask an admin to invite you.
                </p>
              </div>
            ) : (
              results.map((workspace) => {
                const isActive = workspace.id === selected;
                return (
                  <button
                    key={workspace.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelected(workspace.id)}
                    className={cx(
                      "flex w-full cursor-pointer items-center gap-3 rounded-[var(--rb-r-lg,10px)] border px-3 py-2.5 text-left active:scale-[0.995]",
                      transition,
                      focus,
                      isActive
                        ? "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
                        : "border-neutral-200/70 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900",
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white text-[13px] font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                      {workspace.mark}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                          {workspace.name}
                        </span>
                        {workspace.state === "invited" && (
                          <span className={badge}>Invitation</span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {workspace.members} · {workspace.role}
                      </span>
                    </span>
                    {isActive && (
                      <Check
                        aria-hidden="true"
                        strokeWidth={2.5}
                        className="h-4 w-4 shrink-0 text-neutral-900 dark:text-white"
                      />
                    )}
                  </button>
                );
              })
            )}

            <button
              type="button"
              className={cx(
                "flex w-full cursor-pointer items-center gap-3 rounded-[var(--rb-r-lg,10px)] border border-dashed border-neutral-300 bg-white px-3 py-2.5 text-left hover:bg-neutral-50 active:scale-[0.995] dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-900",
                transition,
                focus,
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <Plus
                  aria-hidden="true"
                  className="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                  Create a workspace
                </span>
                <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                  Start fresh and invite your team later
                </span>
              </span>
            </button>
          </div>

          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-150 dark:from-neutral-950",
              edges.start ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-150 dark:from-neutral-950",
              edges.end ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <div className="mt-4 shrink-0">
          <button
            type="button"
            className={cx(btnPrimary, transition, focus, "group")}
          >
            {invited ? "Accept and open" : "Open"} {active?.name ?? "workspace"}
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
          <p className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
            Your last workspace opens automatically next time.
          </p>
        </div>
      </div>
    </div>
  );
}

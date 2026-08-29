"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

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

type RequestStatus = "pending" | "approved" | "denied";

type ApprovalRequest = {
  id: string;
  tool: string;
  sentence: string;
  rawInput: string;
  status: RequestStatus;
  auto?: boolean;
};

const INITIAL_REQUESTS: ApprovalRequest[] = [
  {
    id: "call_e1",
    tool: "send_email",
    sentence: "Send the Q3 renewal summary to 4 recipients",
    rawInput: `{
  "to": ["ops@northstar.io", "finance@northstar.io", "cs@northstar.io", "am@northstar.io"],
  "subject": "Q3 renewal summary",
  "attachments": ["q3-renewals.pdf"]
}`,
    status: "pending",
  },
  {
    id: "call_m1",
    tool: "run_migration",
    sentence: "Apply migration 0042_add_idempotency_key to production",
    rawInput: `{ "target": "production", "file": "0042_add_idempotency_key.sql" }`,
    status: "pending",
  },
  {
    id: "call_r1",
    tool: "read_file",
    sentence: "Read services/payments/retry.ts",
    rawInput: `{ "path": "services/payments/retry.ts" }`,
    status: "approved",
    auto: true,
  },
];

type Perm = { id: string; tool: string; scope: string; enabled: boolean };
type Group = { label: string; perms: Perm[] };

const GROUPS: Group[] = [
  {
    label: "Filesystem",
    perms: [
      {
        id: "read_file",
        tool: "read_file",
        scope: "Read any file inside the workspace",
        enabled: true,
      },
      {
        id: "edit_file",
        tool: "edit_file",
        scope: "Modify files and show a diff before saving",
        enabled: true,
      },
      {
        id: "delete_file",
        tool: "delete_file",
        scope: "Remove files, asking before each deletion",
        enabled: false,
      },
    ],
  },
  {
    label: "Network",
    perms: [
      {
        id: "web_search",
        tool: "web_search",
        scope: "Search the web for public documentation",
        enabled: true,
      },
      {
        id: "send_email",
        tool: "send_email",
        scope: "Send email, asking approval each time",
        enabled: false,
      },
    ],
  },
];

function Switch({
  on,
  onToggle,
  labelId,
}: {
  on: boolean;
  onToggle: () => void;
  labelId: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelId}
      onClick={onToggle}
      className={cx(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
        "disabled:pointer-events-none disabled:opacity-50",
        on
          ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
          : "bg-neutral-200 dark:bg-neutral-700",
      )}
    >
      <span
        className={cx(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-neutral-900",
          on ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function SettledLine({ request }: { request: ApprovalRequest }) {
  const denied = request.status === "denied";
  return (
    <div className="flex min-h-11 items-center gap-2.5 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600"
      />
      <span className="shrink-0 font-mono text-xs text-neutral-900 dark:text-neutral-100">
        {request.tool}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-neutral-500 dark:text-neutral-500">
        {request.sentence}
      </span>
      <span className="shrink-0 text-[13px] text-neutral-500 dark:text-neutral-500">
        {denied
          ? "Skipped, not approved"
          : request.auto
            ? "Auto-approved"
            : "Approved"}
      </span>
    </div>
  );
}

function ActiveRequest({
  request,
  actionable,
  onDecide,
}: {
  request: ApprovalRequest;
  actionable: boolean;
  onDecide: (approved: boolean) => void;
}) {
  const [showRaw, setShowRaw] = useState(false);
  return (
    <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={cx(
            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
            actionable ? "bg-amber-500" : "bg-neutral-300 dark:bg-neutral-600",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-neutral-900 dark:text-neutral-100">
            {request.sentence}
          </p>
          <p className="mt-0.5 font-mono text-xs text-neutral-500 dark:text-neutral-500">
            {request.tool}
          </p>

          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            aria-expanded={showRaw}
            className="mt-2 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2 text-xs font-medium text-neutral-600 transition-[transform,background-color,border-color,color] duration-150 ease-out hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
          >
            <ChevronRight
              aria-hidden="true"
              className={cx(
                "h-3.5 w-3.5 transition-transform duration-150 ease-out",
                showRaw && "rotate-90",
              )}
            />
            View request
          </button>
          {showRaw && (
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre rounded-[var(--rb-r-sm,6px)] bg-neutral-50 p-3 font-mono text-xs leading-relaxed text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
              {request.rawInput}
            </pre>
          )}

          {actionable ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDecide(true)}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color,border-color,color] duration-150 ease-out hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
                Approve
              </button>
              <button
                type="button"
                onClick={() => onDecide(false)}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-3 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,border-color,color] duration-150 ease-out hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-500">
              Waiting for the request above
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ToolCalls6() {
  const uid = useId();
  const [requests, setRequests] = useState<ApprovalRequest[]>(INITIAL_REQUESTS);
  const [perms, setPerms] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      GROUPS.flatMap((g) => g.perms.map((p) => [p.id, p.enabled])),
    ),
  );

  const pending = requests.filter((r) => r.status === "pending");
  const activeId = pending[0]?.id;

  const requestsRef = useRef<HTMLUListElement>(null);
  const body = useScrollFade<HTMLDivElement>();

  const decideRequest = useCallback((id: string, approved: boolean) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: approved ? "approved" : "denied" } : r,
      ),
    );
    requestsRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="relative flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="mx-4 mb-1 mt-4 flex shrink-0 items-center justify-between gap-3 sm:mx-6">
        <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          Tool permissions
        </h2>
        <span className="tabular-nums text-xs text-neutral-500 dark:text-neutral-500">
          {pending.length} pending
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={body.ref}
          onScroll={body.onScroll}
          className="h-full overflow-y-auto overscroll-contain [overflow-anchor:none]"
        >
          <section>
            <h3 className="px-4 pb-1.5 pt-5 text-[11px] font-medium uppercase tracking-wider text-neutral-500 sm:px-6 dark:text-neutral-500">
              Requests
            </h3>
            <ul
              ref={requestsRef}
              tabIndex={-1}
              aria-live="polite"
              className="mx-4 space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 focus:outline-none sm:mx-6 dark:border-neutral-800 dark:bg-neutral-900"
            >
              {requests.map((r) => (
                <li key={r.id}>
                  {r.status === "pending" ? (
                    <ActiveRequest
                      request={r}
                      actionable={r.id === activeId}
                      onDecide={(approved) => decideRequest(r.id, approved)}
                    />
                  ) : (
                    <SettledLine request={r} />
                  )}
                </li>
              ))}
            </ul>
          </section>

          {GROUPS.map((g) => (
            <section key={g.label}>
              <h3 className="px-4 pb-1.5 pt-5 text-[11px] font-medium uppercase tracking-wider text-neutral-500 sm:px-6 dark:text-neutral-500">
                {g.label}
              </h3>
              <ul className="mx-4 space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 sm:mx-6 dark:border-neutral-800 dark:bg-neutral-900">
                {g.perms.map((p) => {
                  const labelId = `${uid}-${p.id}`;
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-4 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <div className="min-w-0">
                        <p
                          id={labelId}
                          className="font-mono text-xs text-neutral-900 dark:text-neutral-100"
                        >
                          {p.tool}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-500">
                          {p.scope}
                        </p>
                      </div>
                      <Switch
                        on={perms[p.id]}
                        labelId={labelId}
                        onToggle={() =>
                          setPerms((s) => ({ ...s, [p.id]: !s[p.id] }))
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <div className="h-4" />
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

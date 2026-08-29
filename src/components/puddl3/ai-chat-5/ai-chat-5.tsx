"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, ChevronRight, Plus, Square } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Decision = "pending" | "approved" | "denied";

type OutputTool = {
  kind: "output";
  id: string;
  name: string;
  output: string;
  duration: string;
};
type ApprovalTool = {
  kind: "approval";
  id: string;
  decision: Decision;
  action?: string;
  consequence?: string;
  input?: string;
  result?: string;
};
type Tool = OutputTool | ApprovalTool;

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text?: string; tools?: Tool[] };

const CATCH_UP_MS = 180;
const FLOOR_CPS = 45;

function lastWordBoundary(source: string, cut: number) {
  if (cut >= source.length) return source.length;
  const i = source.lastIndexOf(" ", cut);
  return i === -1 ? 0 : i;
}

function useSmoothedText() {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const targetRef = useRef("");
  const shownRef = useRef(0);
  const endedRef = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const target = targetRef.current;
      const behind = target.length - shownRef.current;
      if (behind > 0) {
        shownRef.current = reduceMotion
          ? target.length
          : Math.min(
              target.length,
              shownRef.current +
                behind * (1 - Math.exp(-dt / CATCH_UP_MS)) +
                (FLOOR_CPS * dt) / 1000,
            );
        const cut = Math.floor(shownRef.current);
        const finished = endedRef.current && cut >= target.length;
        const safe = finished ? target.length : lastWordBoundary(target, cut);
        setText(target.slice(0, safe));
        if (finished) setDone(true);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);

  const push = useCallback((chunk: string) => {
    targetRef.current += chunk;
  }, []);
  const end = useCallback(() => {
    endedRef.current = true;
  }, []);
  const reset = useCallback(() => {
    targetRef.current = "";
    shownRef.current = 0;
    endedRef.current = false;
    setText("");
    setDone(false);
  }, []);
  return { text, done, push, end, reset };
}

function StreamingWords({ text }: { text: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{text}</>;
  const words = text.match(/\S+\s*/g) ?? [];
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          className="inline-block whitespace-pre-wrap"
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

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

function useStickToBottom(scrollRef: RefObject<HTMLDivElement | null>) {
  const stickRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const sync = () => {
      const overflowing = el.scrollHeight - el.clientHeight > 1;
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      const atBottom = !overflowing || distance < 24;
      stickRef.current = atBottom;
      setShowJump(overflowing && !atBottom);
    };

    const onIntent = (e: WheelEvent | TouchEvent) => {
      const up = "deltaY" in e ? e.deltaY < 0 : true;
      if (!up) return;
      if (el.scrollHeight - el.clientHeight > 1 && el.scrollTop > 0) {
        stickRef.current = false;
      }
    };

    const observer = new ResizeObserver(() => {
      if (stickRef.current) el.scrollTop = el.scrollHeight;
      sync();
    });
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    el.addEventListener("wheel", onIntent, { passive: true });
    el.addEventListener("touchmove", onIntent, { passive: true });
    el.addEventListener("scroll", sync, { passive: true });

    el.scrollTop = el.scrollHeight;
    sync();
    return () => {
      observer.disconnect();
      el.removeEventListener("wheel", onIntent);
      el.removeEventListener("touchmove", onIntent);
      el.removeEventListener("scroll", sync);
    };
  }, []);

  const jumpToLatest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = true;
    setShowJump(false);
    el.scrollTop = el.scrollHeight;
  }, []);

  return { showJump, jumpToLatest };
}

const SCAN_OUTPUT = [
  "resource            last used     status",
  "db/preview-fern       31 days     idle",
  "db/preview-oak        44 days     idle",
  "key/svc-legacy-1: unused",
  "key/svc-legacy-2: unused",
  "key/svc-import: unused",
].join("\n");

const APPROVAL_ID = "call_keys";
const APPROVAL_INPUT =
  'delete_api_keys({\n  project: "staging",\n  keys: ["svc-legacy-1", "svc-legacy-2", "svc-import"],\n})';

const SUMMARY_APPROVED =
  "The staging project is cleaned up. Two databases and three keys are removed, " +
  "so the demo will run against a fresh environment.";
const SUMMARY_DENIED =
  "I left the API keys in place. The two preview databases are still removed, so " +
  "staging is lighter but nothing is broken.";

const INITIAL_MESSAGES: Message[] = [
  {
    id: "u1",
    role: "user",
    text: "Clean up the staging environment before tomorrow’s demo.",
  },
  {
    id: "a1",
    role: "assistant",
    text: "I scanned the staging project and found two preview databases that have not been queried in 30 days and three API keys with no recent requests. I’ll remove them in a few steps so you can approve each one.",
    tools: [
      {
        kind: "output",
        id: "call_scan",
        name: "Scanned staging resources",
        output: SCAN_OUTPUT,
        duration: "0.9s",
      },
      {
        kind: "approval",
        id: "call_db",
        decision: "approved",
        result: "Deleted 2 preview databases",
      },
      {
        kind: "approval",
        id: "call_sess",
        decision: "approved",
        result: "Cleared 5 idle sessions",
      },
      {
        kind: "approval",
        id: APPROVAL_ID,
        decision: "pending",
        action: "Delete 3 unused API keys from the staging project",
        consequence:
          "Any service still using them will start returning 401 errors. This cannot be undone.",
        input: APPROVAL_INPUT,
      },
    ],
  },
];

function ToolOutputRow({ tool }: { tool: OutputTool }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer flex h-8 w-full items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-neutral-50 px-2 text-left transition-colors duration-150 ease-out hover:bg-neutral-100 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-900/60 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
      >
        <ChevronRight
          className={cx(
            "h-3.5 w-3.5 shrink-0 text-neutral-500 transition-transform duration-150 ease-out",
            open && "rotate-90",
          )}
        />
        <span className="text-[13px] text-neutral-700 dark:text-neutral-300">
          {tool.name}
        </span>
        <span className="min-w-14 text-xs text-neutral-500">Done</span>
        <span className="ml-auto text-xs tabular-nums text-neutral-500">
          {tool.duration}
        </span>
      </button>
      {open && (
        <pre className="mt-2 max-h-40 overflow-y-auto rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-3 py-2.5 font-mono text-xs leading-relaxed text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
          {tool.output}
        </pre>
      )}
    </div>
  );
}

function SettledApproval({
  denied,
  result,
}: {
  denied?: boolean;
  result: string;
}) {
  return (
    <div className="flex h-8 items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
      <span>{denied ? "Skipped" : "Approved"}</span>
      <span className="text-neutral-400 dark:text-neutral-600">·</span>
      <span className="min-w-0 truncate">{result}</span>
    </div>
  );
}

function ApprovalRequest({
  tool,
  onDecision,
}: {
  tool: ApprovalTool;
  onDecision: (approved: boolean) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  return (
    <div className="space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
            Needs approval
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {tool.action}. {tool.consequence}
        </p>
      </div>

      <div className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-wrap items-center gap-1">
          {tool.input && (
            <button
              type="button"
              onClick={() => setShowInput((s) => !s)}
              className="cursor-pointer inline-flex h-8 items-center gap-1 rounded-[var(--rb-r-sm,6px)] px-2 text-xs text-neutral-500 transition-colors duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <ChevronRight
                className={cx(
                  "h-3 w-3 shrink-0 transition-transform duration-150 ease-out",
                  showInput && "rotate-90",
                )}
              />
              {showInput ? "Hide request" : "Show request"}
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDecision(true)}
              className="cursor-pointer inline-flex h-8 items-center rounded-[var(--rb-r-sm,6px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-2.5 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              Delete keys
            </button>
            <button
              type="button"
              onClick={() => onDecision(false)}
              className="cursor-pointer inline-flex h-8 items-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-900 transition-[transform,background-color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              Keep them
            </button>
          </div>
        </div>
        {tool.input && showInput && (
          <pre className="mt-1 overflow-x-auto rounded-[var(--rb-r-sm,6px)] bg-neutral-50 px-3 py-2.5 font-mono text-xs leading-relaxed text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
            {tool.input}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function AiChat5() {
  const reduced = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [value, setValue] = useState("");

  const { text: streamText, done, push, end, reset } = useSmoothedText();
  const transcript = useScrollFade<HTMLDivElement>();
  const { showJump, jumpToLatest } = useStickToBottom(transcript.ref);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transportRef = useRef<number | null>(null);

  const decision: Decision =
    messages
      .flatMap((m) => (m.role === "assistant" ? (m.tools ?? []) : []))
      .find(
        (t): t is ApprovalTool => t.kind === "approval" && t.id === APPROVAL_ID,
      )?.decision ?? "pending";

  const summaryTarget =
    decision === "approved"
      ? SUMMARY_APPROVED
      : decision === "denied"
        ? SUMMARY_DENIED
        : "";

  const streaming = summaryTarget !== "" && !done;

  useEffect(() => {
    if (!summaryTarget) return;
    reset();
    if (reduced) {
      push(summaryTarget);
      end();
      return;
    }
    const chunks = summaryTarget.match(/\S+\s*/g) ?? [];
    let i = 0;
    transportRef.current = window.setInterval(() => {
      const n = 1 + Math.floor(Math.random() * 3);
      push(chunks.slice(i, i + n).join(""));
      i += n;
      if (i >= chunks.length) {
        end();
        if (transportRef.current) window.clearInterval(transportRef.current);
        transportRef.current = null;
      }
    }, 130);
    return () => {
      if (transportRef.current) window.clearInterval(transportRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryTarget, reduced]);

  const autosize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const decide = useCallback((toolId: string, approved: boolean) => {
    setMessages((m) =>
      m.map((msg) => {
        if (msg.role !== "assistant" || !msg.tools) return msg;
        return {
          ...msg,
          tools: msg.tools.map((t) => {
            if (t.kind !== "approval" || t.id !== toolId) return t;
            return {
              ...t,
              decision: approved ? "approved" : "denied",
            };
          }),
        };
      }),
    );
  }, []);

  const handleSend = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: "user", text: t },
    ]);
    setValue("");
  }, []);

  const handleStop = useCallback(() => {
    if (transportRef.current) {
      window.clearInterval(transportRef.current);
      transportRef.current = null;
    }
    end();
  }, [end]);

  return (
    <div className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="shrink-0">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <h1 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Staging cleanup
          </h1>
          <span className="text-[13px] text-neutral-500">
            Atlas · Needs review
          </span>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={transcript.ref}
          onScroll={transcript.onScroll}
          className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-y-auto overscroll-contain [overflow-anchor:none]"
        >
          <div className="mt-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
            {messages.map((message) => {
              if (message.role === "user") {
                return (
                  <div key={message.id} className="flex">
                    <div className="ml-auto max-w-[85%] rounded-[var(--rb-r-2xl,14px)] bg-neutral-100 px-3.5 py-2.5 text-sm leading-6 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
                      {message.text}
                    </div>
                  </div>
                );
              }
              return (
                <div key={message.id} className="flex flex-col gap-3">
                  {message.text && (
                    <p className="max-w-prose text-sm leading-relaxed text-neutral-900 dark:text-neutral-100">
                      {message.text}
                    </p>
                  )}
                  {(message.tools ?? []).map((tool, i) => {
                    if (tool.kind === "output")
                      return <ToolOutputRow key={i} tool={tool} />;
                    if (tool.decision === "approved")
                      return (
                        <SettledApproval key={i} result={tool.result ?? ""} />
                      );
                    if (tool.decision === "denied")
                      return (
                        <SettledApproval
                          key={i}
                          denied
                          result="Skipped, not approved"
                        />
                      );
                    return (
                      <ApprovalRequest
                        key={i}
                        tool={tool}
                        onDecision={(approved) => decide(tool.id, approved)}
                      />
                    );
                  })}
                </div>
              );
            })}

            {summaryTarget && (
              <div className="flex flex-col gap-3">
                <p className="max-w-prose text-sm leading-relaxed text-neutral-900 dark:text-neutral-100">
                  {streaming ? (
                    <StreamingWords text={streamText} />
                  ) : (
                    summaryTarget
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            transcript.edges.start ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
            transcript.edges.end ? "opacity-100" : "opacity-0",
          )}
        />

        {showJump && (
          <motion.button
            type="button"
            onClick={jumpToLatest}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="cursor-pointer absolute bottom-3 left-1/2 z-10 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200/70 bg-white px-3 text-[13px] font-medium text-neutral-700 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:shadow-none dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
          >
            <ArrowDown className="h-3.5 w-3.5 shrink-0" />
            Jump to latest
          </motion.button>
        )}
      </div>

      <div className="shrink-0">
        <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6">
          <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white transition-colors focus-within:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-neutral-700">
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                autosize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(value);
                }
              }}
              placeholder="Ask anything"
              className="block max-h-40 w-full resize-none bg-transparent px-3 pt-3 text-sm leading-6 text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100"
            />
            <div className="flex items-center gap-1 px-3 pb-3 pt-1">
              <button
                type="button"
                aria-label="Add attachment"
                className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-500 transition-[transform,background-color,color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <Plus className="h-4 w-4 shrink-0" />
              </button>
              <div className="ml-auto flex items-center gap-1">
                {streaming ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    key="stop"
                    aria-label="Stop generating"
                    className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-95 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                  >
                    <Square className="h-3.5 w-3.5 shrink-0" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSend(value)}
                    key="send"
                    aria-label="Send"
                    disabled={value.trim().length === 0}
                    className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-95 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))] dark:disabled:bg-neutral-700"
                  >
                    <ArrowUp className="h-4 w-4 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

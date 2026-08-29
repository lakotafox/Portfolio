"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileCode,
  Plus,
  Square,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; file?: string };

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

const CODE = `type Plan = {
  name: string
  price: string
  period: string
  cta: string
}

export function PricingTable({
  plans,
}: {
  plans: Plan[]
}) {
  return (
    <div className="grid gap-4">
      {plans.map((plan) => (
        <article key={plan.name}>
          <h3>{plan.name}</h3>
          <p>{plan.price}</p>
          <span>{plan.period}</span>
          <button>{plan.cta}</button>
        </article>
      ))}
    </div>
  )
}`;

const DOC = [
  "Three tiers, billed monthly or annually. Annual saves two months.",
  "Starter covers a single project and one editor seat.",
  "Growth adds unlimited projects, five seats, and priority review.",
  "Scale adds SSO, audit logs, and a named contact.",
  "Every tier includes the component library and future updates.",
];

const VERSIONS = ["v3", "v2", "v1"];

const SEG_TRACK =
  "inline-flex items-center gap-1 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800";

function segButton(active: boolean) {
  return cx(
    "inline-flex h-7 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2.5 text-[13px] font-medium tabular-nums transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
    active
      ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-700 dark:text-neutral-100 dark:shadow-none"
      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
  );
}

const STREAM_TARGET =
  "I marked Growth as the recommended plan without leaning on colour: it now " +
  "carries a small “Recommended” label, a slightly heavier border, and a touch " +
  "more vertical padding so it reads as primary.";

const LIVE_ID = "a3";

const INITIAL_MESSAGES: Message[] = [
  {
    id: "u1",
    role: "user",
    text: "Build a three-tier pricing table component for the marketing site.",
  },
  {
    id: "a1",
    role: "assistant",
    text: "Here is a responsive pricing table with Starter, Growth, and Scale. It maps over a plans array so you can edit copy without touching markup.",
    file: "pricing-table.tsx",
  },
  {
    id: "u2",
    role: "user",
    text: "Add a short plan description under each price.",
  },
  {
    id: "a2",
    role: "assistant",
    text: "Done. I added a description line beneath each price and wrote the copy for all three tiers. This is version 3, so compare it against the earlier versions from the panel.",
  },
  {
    id: "u3",
    role: "user",
    text: "Can you make the middle plan stand out?",
  },
  {
    id: LIVE_ID,
    role: "assistant",
    text: STREAM_TARGET,
  },
];

export default function AiChat2() {
  const reduced = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [stopped, setStopped] = useState(false);
  const [tab, setTab] = useState<"code" | "doc">("code");
  const [version, setVersion] = useState("v3");
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState("");
  const [runId, setRunId] = useState(0);

  const { text: streamText, done, push, end, reset } = useSmoothedText();
  const transcript = useScrollFade<HTMLDivElement>();
  const panel = useScrollFade<HTMLDivElement>();
  const { showJump, jumpToLatest } = useStickToBottom(transcript.ref);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transportRef = useRef<number | null>(null);

  const streaming = !done && !stopped;

  useEffect(() => {
    if (reduced) {
      push(STREAM_TARGET);
      end();
      return;
    }
    const chunks = STREAM_TARGET.match(/\S+\s*/g) ?? [];
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
  }, [reduced, push, end, runId]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  const autosize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

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
    setStopped(true);
  }, [end]);

  const handleRegenerate = useCallback(() => {
    reset();
    setStopped(false);
    setRunId((n) => n + 1);
  }, [reset]);

  return (
    <div className="relative flex h-full min-h-[640px] w-full min-w-0 flex-col overflow-hidden bg-white lg:flex-row dark:bg-neutral-950">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0">
          <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
            <h1 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Build assistant
            </h1>
            <span className="text-[13px] text-neutral-500">Draft</span>
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

                const live = message.id === LIVE_ID && streaming;
                const settled = message.id === LIVE_ID && !streaming;

                return (
                  <div key={message.id} className="space-y-3">
                    <p className="max-w-prose text-sm leading-relaxed text-neutral-900 dark:text-neutral-100">
                      {live ? (
                        <StreamingWords text={streamText} />
                      ) : (
                        message.text
                      )}
                    </p>

                    {message.file && (
                      <button
                        type="button"
                        onClick={() => setTab("code")}
                        className="cursor-pointer flex h-9 w-full items-center gap-2 rounded-[var(--rb-r-lg,10px)] bg-neutral-50 px-3 text-left transition-colors duration-150 ease-out hover:bg-neutral-100 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-900/60 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                      >
                        <FileCode className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                        <span className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                          {message.file}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-neutral-500">
                          Open in panel
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                      </button>
                    )}

                    {settled && (
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        className="cursor-pointer inline-flex h-8 items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-2.5 text-[13px] font-medium text-neutral-700 transition-[transform,background-color,color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                      >
                        Regenerate
                      </button>
                    )}
                  </div>
                );
              })}
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

      <aside className="hidden min-h-0 shrink-0 flex-col bg-white p-4 lg:flex lg:w-96 dark:bg-neutral-950">
        <div className="flex min-h-0 flex-1 flex-col space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="shrink-0 space-y-2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                {tab === "code" ? "pricing-table.tsx" : "pricing-copy.md"}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Copy artifact"
                  onClick={() => setCopied(true)}
                  className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-600 transition-[transform,background-color,color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Download artifact"
                  className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-sm,6px)] bg-neutral-100 text-neutral-600 transition-[transform,background-color,color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={SEG_TRACK}>
                {(["code", "doc"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    aria-pressed={tab === t}
                    className={segButton(tab === t)}
                  >
                    {t === "code" ? "Code" : "Document"}
                  </button>
                ))}
              </div>
              <div className={cx(SEG_TRACK, "ml-auto")}>
                {VERSIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVersion(v)}
                    aria-pressed={version === v}
                    className={segButton(version === v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div
              ref={panel.ref}
              onScroll={panel.onScroll}
              className="h-full overflow-y-auto p-3"
            >
              {tab === "code" ? (
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {CODE}
                </pre>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                    Plans and pricing
                  </h3>
                  {DOC.map((line) => (
                    <p
                      key={line}
                      className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                panel.edges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ease-out dark:from-neutral-950",
                panel.edges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

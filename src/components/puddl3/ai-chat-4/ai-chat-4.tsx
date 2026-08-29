"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Plus,
  Settings2,
  Square,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

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

const MODELS = [
  { name: "Atlas", hint: "Balanced · fast" },
  { name: "Atlas Pro", hint: "Deep reasoning" },
  { name: "Quill", hint: "Lowest latency" },
];

const TOKENS_USED = 12400;
const TOKENS_MAX = 32000;

const compactTokens = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`;

const STREAM_TARGET =
  "Onboarding completion reached 71% this quarter, up eight points, driven by " +
  "a faster setup step; the invite step is the next place to improve.";

const LIVE_ID = "a3";

const INITIAL_MESSAGES: Message[] = [
  {
    id: "u1",
    role: "user",
    text: "Compare our onboarding completion rate to last quarter.",
  },
  {
    id: "a1",
    role: "assistant",
    text: "Completion rose to 71%, up from 63% last quarter. The largest gain came from the shortened setup step, which cut median time to first project from nine minutes to five.",
  },
  {
    id: "u2",
    role: "user",
    text: "Where do people still drop off?",
  },
  {
    id: "a2",
    role: "assistant",
    text: "The biggest remaining drop is at the invite-teammates step, where 22% leave without adding anyone. Making that step optional would likely lift completion by another three to four points based on the last experiment.",
  },
  {
    id: "u3",
    role: "user",
    text: "Draft a one-line summary for the weekly update.",
  },
  {
    id: LIVE_ID,
    role: "assistant",
    text: STREAM_TARGET,
  },
];

export default function AiChat4() {
  const reduced = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [stopped, setStopped] = useState(false);
  const [open, setOpen] = useState<"model" | "settings" | null>(null);
  const [activeModel, setActiveModel] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuWrapRef = useRef<HTMLElement>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const [model, setModel] = useState("Atlas");
  const [cite, setCite] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);
  const [value, setValue] = useState("");
  const [runId, setRunId] = useState(0);

  const { text: streamText, done, push, end, reset } = useSmoothedText();
  const transcript = useScrollFade<HTMLDivElement>();
  const { showJump, jumpToLatest } = useStickToBottom(transcript.ref);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transportRef = useRef<number | null>(null);

  const streaming = !done && !stopped;
  const pct = Math.round((TOKENS_USED / TOKENS_MAX) * 100);

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
    if (!open) return;
    const doc = rootRef.current?.ownerDocument ?? document;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(null);
      (open === "model" ? modelTriggerRef : settingsTriggerRef).current?.focus({
        preventScroll: true,
      });
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!menuWrapRef.current?.contains(e.target as Node)) setOpen(null);
    };
    doc.addEventListener("keydown", onKey);
    doc.addEventListener("pointerdown", onPointerDown);
    return () => {
      doc.removeEventListener("keydown", onKey);
      doc.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (open === "model") modelMenuRef.current?.focus({ preventScroll: true });
  }, [open]);

  const closeModel = (restoreFocus = true) => {
    setOpen(null);
    if (restoreFocus) modelTriggerRef.current?.focus({ preventScroll: true });
  };

  const onModelTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveModel(0);
      setOpen("model");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveModel(MODELS.length - 1);
      setOpen("model");
    }
  };

  const onModelMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveModel((i) => (i + 1) % MODELS.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveModel((i) => (i - 1 + MODELS.length) % MODELS.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveModel(0);
        break;
      case "End":
        e.preventDefault();
        setActiveModel(MODELS.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        setModel(MODELS[activeModel].name);
        closeModel();
        break;
      case "Tab":
        closeModel(false);
        break;
    }
  };

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
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      <header ref={menuWrapRef} className="relative z-30 shrink-0">
        <div className="mx-auto flex h-12 w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
          <h1 className="text-sm font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Onboarding analysis
          </h1>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                ref={modelTriggerRef}
                type="button"
                onClick={() =>
                  open === "model" ? closeModel() : setOpen("model")
                }
                onKeyDown={onModelTriggerKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open === "model"}
                aria-label={`Model: ${model}`}
                className="cursor-pointer inline-flex h-8 items-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-2 text-[13px] text-neutral-500 transition-[transform,background-color,color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-100 hover:text-neutral-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                {model}
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
              </button>
              {open === "model" && (
                <div
                  ref={modelMenuRef}
                  role="listbox"
                  aria-label="Model"
                  tabIndex={-1}
                  onKeyDown={onModelMenuKeyDown}
                  className="absolute left-0 top-full z-50 mt-1 w-56 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-1 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
                >
                  {MODELS.map((m, index) => (
                    <button
                      key={m.name}
                      type="button"
                      role="option"
                      aria-selected={model === m.name}
                      tabIndex={-1}
                      onClick={() => {
                        setModel(m.name);
                        closeModel();
                      }}
                      onPointerMove={() => setActiveModel(index)}
                      className={cx(
                        "flex w-full items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2 py-1.5 text-left transition-colors duration-150 ease-out",
                        index === activeModel
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : "bg-transparent",
                      )}
                    >
                      <span className="cursor-pointer min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                          {m.name}
                        </span>
                        <span className="block text-xs text-neutral-500">
                          {m.hint}
                        </span>
                      </span>
                      {model === m.name && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-neutral-900 dark:text-neutral-100" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-1 w-28 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className={cx(
                    "h-full rounded-full",
                    pct >= 95
                      ? "bg-red-500"
                      : pct >= 80
                        ? "bg-amber-500"
                        : "bg-neutral-900 dark:bg-neutral-100",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-neutral-500">
                {compactTokens(TOKENS_USED)} / {compactTokens(TOKENS_MAX)}{" "}
                tokens
              </span>
            </div>

            <div className="relative">
              <button
                ref={settingsTriggerRef}
                type="button"
                onClick={() =>
                  setOpen((o) => (o === "settings" ? null : "settings"))
                }
                aria-label="Conversation settings"
                aria-haspopup="dialog"
                aria-expanded={open === "settings"}
                className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-600 transition-[transform,background-color,color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <Settings2 className="h-4 w-4 shrink-0" />
              </button>
              {open === "settings" && (
                <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-white p-3 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                    Conversation
                  </p>
                  <div className="space-y-1 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950">
                    <SettingsToggle
                      label="Cite sources"
                      checked={cite}
                      onChange={() => setCite((v) => !v)}
                    />
                    <SettingsToggle
                      label="Show reasoning"
                      checked={showReasoning}
                      onChange={() => setShowReasoning((v) => !v)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
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
                    {live ? <StreamingWords text={streamText} /> : message.text}
                  </p>
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
  );
}

function SettingsToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-2 rounded-[var(--rb-r-sm,6px)] border border-neutral-200/70 bg-white px-2 py-2 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="min-w-0 flex-1 text-[13px] text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
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
    </div>
  );
}

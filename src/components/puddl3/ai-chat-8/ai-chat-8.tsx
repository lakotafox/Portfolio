"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUp, ImageIcon, Mic, Paperclip, Square, X } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

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

const BAR_COUNT = 28;
const IDLE_BARS = Array.from({ length: BAR_COUNT }, () => 12);
const TRANSCRIPT =
  "Pull the three designs from the shared folder and tell me which one has the " +
  "strongest contrast in dark mode.";

const ATTACHMENTS = [
  { name: "hero-option-a.png", kind: "image" as const },
  { name: "hero-option-b.png", kind: "image" as const },
  { name: "brand-guidelines.pdf", kind: "file" as const },
];

export default function AiChat8() {
  const reduced = useReducedMotion();
  const [recording, setRecording] = useState(true);
  const [sent, setSent] = useState(false);
  const [runId, setRunId] = useState(0);
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 30),
  );
  const [elapsed, setElapsed] = useState(14);

  const { text: transcript, done, push, end, reset } = useSmoothedText();
  const transportRef = useRef<number | null>(null);

  const transcribing = recording && !done;
  const canSend = !sent && !recording && transcript.trim().length > 0;

  useEffect(() => {
    if (!recording || reduced) return;
    const id = window.setInterval(() => {
      setBars(Array.from({ length: BAR_COUNT }, () => 18 + Math.random() * 82));
    }, 130);
    return () => window.clearInterval(id);
  }, [recording, reduced]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    if (!recording) return;
    if (reduced) {
      push(TRANSCRIPT);
      end();
      return;
    }
    const chunks = TRANSCRIPT.match(/\S+\s*/g) ?? [];
    let i = 0;
    transportRef.current = window.setInterval(() => {
      const n = 1 + Math.floor(Math.random() * 2);
      push(chunks.slice(i, i + n).join(""));
      i += n;
      if (i >= chunks.length) {
        end();
        if (transportRef.current) window.clearInterval(transportRef.current);
        transportRef.current = null;
      }
    }, 150);
    return () => {
      if (transportRef.current) window.clearInterval(transportRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, runId, reduced]);

  const handleStop = useCallback(() => {
    if (transportRef.current) {
      window.clearInterval(transportRef.current);
      transportRef.current = null;
    }
    end();
    setRecording(false);
  }, [end]);

  const startRecording = useCallback(() => {
    reset();
    setSent(false);
    setElapsed(0);
    setRecording(true);
    setRunId((n) => n + 1);
  }, [reset]);

  const handleSend = useCallback(() => {
    if (recording || transcript.trim().length === 0) return;
    setSent(true);
  }, [recording, transcript]);

  const displayBars = recording ? bars : IDLE_BARS;

  return (
    <div className="relative flex h-full min-h-[480px] w-full flex-col overflow-hidden bg-white p-6 sm:p-8 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3">
          <h1 className="text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Voice message
          </h1>
          <div className="flex items-center gap-1.5 text-[13px] text-neutral-500">
            <span
              className={cx(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                recording
                  ? "bg-neutral-400 dark:bg-neutral-500 animate-pulse motion-reduce:animate-none"
                  : "bg-neutral-300 dark:bg-neutral-600",
              )}
            />
            <span>
              {sent ? "Sent" : recording ? "Listening" : "Transcript ready"}
            </span>
            <span className="text-neutral-400 dark:text-neutral-600">·</span>
            <span className="tabular-nums">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            </span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
          <p className="text-xl leading-relaxed tracking-[-0.015em] text-neutral-900 dark:text-neutral-100">
            {transcribing ? <StreamingWords text={transcript} /> : transcript}
            {transcribing && (
              <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-1 animate-pulse bg-[var(--rb-accent,oklch(20.5%_0_0))] motion-reduce:animate-none dark:bg-[var(--rb-accent,oklch(100%_0_0))]" />
            )}
          </p>

          <div className="flex h-14 items-center gap-[3px]" aria-hidden="true">
            {displayBars.map((h, i) => (
              <div
                key={i}
                className="w-full flex-1 rounded-full bg-neutral-300 transition-[height] duration-150 ease-out dark:bg-neutral-700"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="shrink-0 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-wrap gap-1.5">
            {ATTACHMENTS.map((a) => (
              <span
                key={a.name}
                className="inline-flex h-7 items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] bg-neutral-100 pl-1.5 pr-1 text-[13px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {a.kind === "image" ? (
                  <ImageIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                ) : (
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                )}
                <span className="max-w-32 truncate">{a.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${a.name}`}
                  className="cursor-pointer inline-flex h-5 w-5 items-center justify-center rounded-[var(--rb-r-xs,4px)] bg-white text-neutral-500 transition-colors duration-150 ease-out hover:bg-neutral-200 hover:text-neutral-700 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-900 dark:hover:bg-neutral-700 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
                >
                  <X className="h-3.5 w-3.5 shrink-0" />
                </button>
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              aria-label={recording ? "Stop recording" : "Start recording"}
              onClick={recording ? handleStop : startRecording}
              className={cx(
                "inline-flex h-9 w-9 items-center justify-center rounded-[var(--rb-r-md,8px)] transition-[transform,background-color,color] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]",
                recording
                  ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-300",
              )}
            >
              {recording ? (
                <Square className="cursor-pointer h-4 w-4 shrink-0" />
              ) : (
                <Mic className="h-4 w-4 shrink-0" />
              )}
            </button>
            <span className="w-28 text-[13px] text-neutral-500">
              {recording
                ? "Tap to stop"
                : sent
                  ? "Message sent"
                  : "Tap to re-record"}
            </span>
            <div className="ml-auto">
              <button
                type="button"
                aria-label="Send"
                onClick={handleSend}
                disabled={!canSend}
                className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-95 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))] dark:disabled:bg-neutral-700"
              >
                <ArrowUp className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

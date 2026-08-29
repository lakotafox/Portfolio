"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowLeft, Check, Loader2, ShieldCheck } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const btnPrimary =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]";

const btnTertiary =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-neutral-100 px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700";

const linkClass =
  "cursor-pointer rounded-[var(--rb-r-xs,4px)] text-neutral-900 underline decoration-neutral-300 underline-offset-[3px] transition-colors duration-150 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-white";

const LENGTH = 6;
const COOLDOWN = 28;

const clock = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Authentication6() {
  const groupId = useId();
  const recoveryId = useId();

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [status, setStatus] = useState<"idle" | "checking" | "done">("idle");
  const [left, setLeft] = useState(COOLDOWN);
  const [recovery, setRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const code = digits.join("");
  const complete = code.length === LENGTH;

  useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [left]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const verify = () => {
    if (status !== "idle") return;
    setStatus("checking");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("done"), 1100);
  };

  const write = (next: string[], caret: number) => {
    setDigits(next);
    boxes.current[Math.min(caret, LENGTH - 1)]?.focus({ preventScroll: true });
    if (next.every(Boolean)) {
      if (timer.current) clearTimeout(timer.current);
      setStatus("checking");
      timer.current = setTimeout(() => setStatus("done"), 1100);
    }
  };

  const onChange =
    (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
      const typed = event.target.value.replace(/\D/g, "");
      if (!typed) return;
      const next = [...digits];
      let caret = index;
      for (const char of typed) {
        if (caret >= LENGTH) break;
        next[caret] = char;
        caret += 1;
      }
      write(next, caret);
    };

  const onKeyDown =
    (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace") {
        event.preventDefault();
        const next = [...digits];
        if (next[index]) {
          next[index] = "";
          setDigits(next);
        } else if (index > 0) {
          next[index - 1] = "";
          setDigits(next);
          boxes.current[index - 1]?.focus({ preventScroll: true });
        }
        return;
      }
      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        boxes.current[index - 1]?.focus({ preventScroll: true });
      }
      if (event.key === "ArrowRight" && index < LENGTH - 1) {
        event.preventDefault();
        boxes.current[index + 1]?.focus({ preventScroll: true });
      }
    };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    event.preventDefault();
    const next = Array(LENGTH)
      .fill("")
      .map((_, i) => text[i] ?? "");
    write(next, text.length);
  };

  const reset = () => {
    setDigits(Array(LENGTH).fill(""));
    setStatus("idle");
    boxes.current[0]?.focus({ preventScroll: true });
  };

  return (
    <div className="relative flex h-full min-h-[560px] w-full flex-col overflow-hidden bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <div className="rounded-[var(--rb-r-4xl,18px)] border border-neutral-200/70 bg-white p-6 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
          {status === "done" ? (
            <div className="animate-[fade_200ms_ease-out] text-center motion-reduce:animate-none">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]">
                <Check
                  aria-hidden="true"
                  strokeWidth={2.5}
                  className="h-5 w-5 text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                />
              </div>
              <h1 className="mt-4 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                Device verified
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                This browser is trusted for 30 days. You will not need a code
                again until then.
              </p>

              <div className="mt-5 space-y-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 text-left dark:border-neutral-800 dark:bg-neutral-950">
                {[
                  { label: "Method", value: "Text message" },
                  { label: "Trusted until", value: "9 September 2026" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
                      {row.label}
                    </span>
                    <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={cx(btnPrimary, transition, focus, "mt-5")}
              >
                Continue to Northwind
              </button>
              <button
                type="button"
                onClick={reset}
                className={cx(
                  "mt-3 text-xs text-neutral-500 dark:text-neutral-400",
                  linkClass,
                  focus,
                )}
              >
                Verify another device
              </button>
            </div>
          ) : (
            <form
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                verify();
              }}
              className="animate-[fade_200ms_ease-out] motion-reduce:animate-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                <ShieldCheck
                  aria-hidden="true"
                  className="h-[18px] w-[18px] text-neutral-700 dark:text-neutral-300"
                />
              </div>

              <h1 className="mt-4 text-xl font-medium tracking-[-0.015em] text-neutral-900 dark:text-neutral-50">
                {recovery ? "Enter a recovery code" : "Verify it is you"}
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                {recovery
                  ? "Use one of the eight codes saved when two-factor sign-in was turned on."
                  : "We sent a six-digit code to the phone ending 4417."}
              </p>

              {recovery ? (
                <div className="mt-6">
                  <label
                    htmlFor={recoveryId}
                    className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                  >
                    Recovery code
                  </label>
                  <input
                    id={recoveryId}
                    value={recoveryCode}
                    onChange={(e) =>
                      setRecoveryCode(e.target.value.toUpperCase().slice(0, 11))
                    }
                    placeholder="XXXXX-XXXXX"
                    className={cx(
                      "mt-1.5 h-10 w-full rounded-[var(--rb-r-lg,10px)] border border-neutral-200 bg-white px-3.5 font-mono text-sm tracking-[0.14em] text-neutral-900 uppercase placeholder:tracking-[0.14em] placeholder:text-neutral-400 transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-white",
                      focus,
                    )}
                  />
                  <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Each recovery code works once.
                  </p>
                </div>
              ) : (
                <div className="mt-6">
                  <div
                    role="group"
                    aria-labelledby={groupId}
                    className="flex items-center gap-2"
                  >
                    <span id={groupId} className="sr-only">
                      Six-digit verification code
                    </span>
                    {digits.map((digit, i) => (
                      <div key={i} className="contents">
                        {i === 3 && (
                          <span
                            aria-hidden="true"
                            className="h-px w-3 shrink-0 bg-neutral-300 dark:bg-neutral-700"
                          />
                        )}
                        <input
                          ref={(el) => {
                            boxes.current[i] = el;
                          }}
                          inputMode="numeric"
                          autoComplete={i === 0 ? "one-time-code" : "off"}
                          maxLength={1}
                          value={digit}
                          onChange={onChange(i)}
                          onKeyDown={onKeyDown(i)}
                          onPaste={onPaste}
                          aria-label={`Digit ${i + 1}`}
                          disabled={status === "checking"}
                          className={cx(
                            "h-11 w-full min-w-0 rounded-[var(--rb-r-lg,10px)] border bg-white text-center text-lg text-neutral-900 tabular-nums transition-colors duration-150 hover:border-neutral-300 focus:border-neutral-900 disabled:opacity-60 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-700 dark:focus:border-white",
                            digit
                              ? "border-neutral-300 dark:border-neutral-700"
                              : "border-neutral-200 dark:border-neutral-800",
                            focus,
                          )}
                        />
                      </div>
                    ))}
                  </div>
                  <p
                    aria-live="polite"
                    className="mt-2 text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    {status === "checking"
                      ? "Checking your code"
                      : "Paste the whole code and it fills every box."}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  status === "checking" ||
                  (recovery ? recoveryCode.length < 11 : !complete)
                }
                className={cx(btnPrimary, transition, focus, "mt-5")}
              >
                {status === "checking" && (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  />
                )}
                {status === "checking" ? "Verifying" : "Verify and continue"}
              </button>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setLeft(COOLDOWN)}
                  disabled={left > 0 || recovery}
                  className={cx(btnTertiary, transition, focus)}
                >
                  {left > 0 ? (
                    <span className="tabular-nums">
                      Resend in {clock(left)}
                    </span>
                  ) : (
                    "Resend code"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRecovery((v) => !v)}
                  className={cx(
                    "text-[13px] text-neutral-500 dark:text-neutral-400",
                    linkClass,
                    focus,
                  )}
                >
                  {recovery ? "Use the texted code" : "Use a recovery code"}
                </button>
              </div>
            </form>
          )}
        </div>

        <button
          type="button"
          className={cx(
            "mx-auto mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-xs,4px)] text-sm text-neutral-500 transition-colors duration-150 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
            focus,
          )}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to sign in
        </button>
      </div>

      <style>{`@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

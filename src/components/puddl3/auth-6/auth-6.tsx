"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ChangeEvent,
  ClipboardEvent,
  FocusEvent,
  FormEvent,
  KeyboardEvent,
} from "react";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CODE_LENGTH = 6;

export function Auth6() {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(30);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const reduce = useReducedMotion();
  const isComplete = code.every(Boolean);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value.replace(/\D/g, "").slice(-1);
    setCode((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    if (value && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      focusInput(index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH)
      .fill("")
      .map((_, index) => pasted[index] ?? "");
    setCode(next);
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Verify code:", code.join(""));
  };

  const handleResend = () => {
    setCode(Array(CODE_LENGTH).fill(""));
    setCooldown(30);
    focusInput(0);
  };

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };

  const renderInput = (index: number) => (
    <input
      key={index}
      ref={(element) => {
        inputsRef.current[index] = element;
      }}
      id={`auth6-digit-${index + 1}`}
      name={`digit-${index + 1}`}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={1}
      autoComplete={index === 0 ? "one-time-code" : "off"}
      value={code[index]}
      onChange={(event) => handleChange(index, event)}
      onKeyDown={(event) => handleKeyDown(index, event)}
      onPaste={handlePaste}
      onFocus={handleFocus}
      aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
      className={`h-12 w-11 rounded-xl border bg-white text-center text-lg font-semibold tabular-nums text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white dark:focus:ring-white/10 sm:h-14 sm:w-12 sm:text-xl ${
        code[index]
          ? "border-neutral-900 dark:border-white"
          : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600"
      }`}
    />
  );

  return (
    <section className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-16 dark:bg-neutral-950 sm:px-6 lg:items-center">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="flex w-full max-w-sm flex-col items-center text-center"
      >
        <motion.span
          variants={item}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2l10 10-10 10L2 12z" />
          </svg>
        </motion.span>

        <motion.div variants={item} className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Check your email
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Enter the 6-digit code we sent to{" "}
            <span className="font-medium text-neutral-900 dark:text-white">
              amara@lumen.co
            </span>
            . It expires in 10 minutes.
          </p>
        </motion.div>

        <motion.form
          variants={item}
          onSubmit={handleSubmit}
          className="mt-8 w-full"
        >
          <fieldset>
            <legend className="sr-only">6-digit verification code</legend>
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-2">{[0, 1, 2].map(renderInput)}</div>
              <span
                className="h-px w-3 shrink-0 bg-neutral-300 dark:bg-neutral-700"
                aria-hidden="true"
              />
              <div className="flex gap-2">{[3, 4, 5].map(renderInput)}</div>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={!isComplete}
            className="mt-8 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-900 text-sm font-medium text-white transition-colors enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-neutral-900 dark:enabled:hover:bg-neutral-200 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950"
          >
            {isComplete ? "Verify code" : "Enter all 6 digits"}
          </button>
        </motion.form>

        <motion.p
          variants={item}
          className="mt-6 text-sm text-neutral-600 dark:text-neutral-400"
          aria-live="polite"
        >
          Didn&apos;t receive it?{" "}
          {cooldown > 0 ? (
            <span className="tabular-nums text-neutral-500 dark:text-neutral-500">
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="cursor-pointer rounded-lg font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white dark:hover:text-neutral-300 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950"
            >
              Resend code
            </button>
          )}
        </motion.p>

        <motion.div variants={item} className="mt-12">
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sign in
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Auth6;

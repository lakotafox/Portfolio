"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";

const QUESTIONS = [
  {
    id: "volume",
    title: "How much do you ship a month?",
    blurb: "This sets your default rate card.",
    options: ["Under 100 parcels", "100 to 1,000", "1,000 to 10,000", "More"],
  },
  {
    id: "regions",
    title: "Where do you ship to?",
    blurb: "We enable the right customs forms.",
    options: ["Domestic only", "Europe", "Worldwide", "Not sure yet"],
  },
  {
    id: "handoff",
    title: "How do parcels leave your site?",
    blurb: "Pickups can be scheduled automatically.",
    options: ["Courier pickup", "Drop-off point", "Own fleet", "Mixed"],
  },
  {
    id: "system",
    title: "What do you use for orders today?",
    blurb: "We can import the last 90 days.",
    options: [
      "A storefront platform",
      "A spreadsheet",
      "Custom system",
      "Nothing yet",
    ],
  },
  {
    id: "priority",
    title: "What matters most right now?",
    blurb: "This orders the dashboard you land on.",
    options: [
      "Lower cost",
      "Faster delivery",
      "Fewer support tickets",
      "Better tracking",
    ],
  },
];

export default function Wizard7() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({
    volume: "100 to 1,000",
    regions: "Europe",
  });

  const question = QUESTIONS[step];
  const last = step === QUESTIONS.length - 1;
  const answer = answers[question.id];

  return (
    <div className="relative flex h-full min-h-[480px] w-full flex-col justify-center overflow-y-auto bg-white p-8 sm:p-10 dark:bg-neutral-950">
      <section className="mx-auto my-auto w-full max-w-[420px] rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <ol className="flex items-center gap-1.5">
            {QUESTIONS.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  aria-current={i === step ? "step" : undefined}
                  aria-label={`Go to question ${i + 1}`}
                  className={cx(
                    "block h-1.5 cursor-pointer rounded-full",
                    i === step
                      ? "w-6 bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                      : i < step
                        ? "w-1.5 bg-neutral-400 dark:bg-neutral-500"
                        : "w-1.5 bg-neutral-200 dark:bg-neutral-800",
                    "transition-[width,background-color] duration-200 ease-out",
                    focus,
                  )}
                />
              </li>
            ))}
          </ol>
          <p className="shrink-0 text-xs tabular-nums text-neutral-500">
            {step + 1} of {QUESTIONS.length}
          </p>
        </div>

        <h2 className="mt-5 text-base font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
          {question.title}
        </h2>
        <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          {question.blurb}
        </p>

        <div
          role="radiogroup"
          aria-label={question.title}
          className="mt-4 space-y-2"
        >
          {question.options.map((option) => {
            const selected = option === answer;

            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  setAnswers((prev) => ({ ...prev, [question.id]: option }))
                }
                className={cx(
                  "flex h-10 w-full cursor-pointer items-center gap-3 rounded-[var(--rb-r-lg,10px)] border px-3 text-left active:scale-[0.99]",
                  selected
                    ? "border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
                    : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900",
                  transition,
                  focus,
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                    selected
                      ? "bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]"
                      : "border border-neutral-300 text-transparent dark:border-neutral-600",
                  )}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            aria-label="Previous question"
            className={cx(
              "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
              transition,
              focus,
            )}
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              setStep((s) => Math.min(QUESTIONS.length - 1, s + 1))
            }
            disabled={!answer}
            className={cx(
              "inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-4 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
              transition,
              focus,
            )}
          >
            {last ? "Finish" : "Continue"}
            {!last && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="button"
          className={cx(
            "mt-3 block w-full cursor-pointer text-center text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100",
            focus,
          )}
        >
          Skip and use defaults
        </button>
      </section>
    </div>
  );
}

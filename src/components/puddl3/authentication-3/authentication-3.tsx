"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Github,
} from "lucide-react";

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
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-900 hover:bg-neutral-50 active:scale-[0.97] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

const iconBtn =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-white text-neutral-600 hover:bg-neutral-100 active:scale-[0.97] dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800";

const linkClass =
  "cursor-pointer rounded-[var(--rb-r-xs,4px)] text-neutral-900 underline decoration-neutral-300 underline-offset-[3px] transition-colors duration-150 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-white";

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

type Quote = {
  body: string;
  name: string;
  role: string;
  stats: { label: string; value: string }[];
};

const QUOTES: Quote[] = [
  {
    body: "We replaced four spreadsheets and a weekly status call with one board. Reviews now start with everyone already agreeing on the numbers.",
    name: "Mina Park",
    role: "Head of product design, Aurelia",
    stats: [
      { label: "Setup", value: "1 day" },
      { label: "Weekly hours saved", value: "9.5" },
      { label: "Teams onboarded", value: "24" },
    ],
  },
  {
    body: "The audit trail is the part nobody expected to love. Every approval has a name and a timestamp, so compliance stopped chasing us.",
    name: "Daniel Osei",
    role: "Director of operations, Ardent Freight",
    stats: [
      { label: "Approval time", value: "-62%" },
      { label: "Audit findings", value: "0" },
      { label: "Sites live", value: "31" },
    ],
  },
  {
    body: "Our on-call handover used to take half an hour. It takes four minutes now, and the incoming engineer already knows what changed.",
    name: "Rachel Lindqvist",
    role: "Staff engineer, Kestrel Data",
    stats: [
      { label: "Handover", value: "4 min" },
      { label: "Escalations", value: "-38%" },
      { label: "Services tracked", value: "112" },
    ],
  },
];

export default function Authentication3() {
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("dana.whitfield@northwind.com");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const quote = QUOTES[index];

  const step = useCallback((delta: number) => {
    setIndex((i) => (i + delta + QUOTES.length) % QUOTES.length);
  }, []);

  useEffect(() => {
    const id = setInterval(() => step(1), 7000);
    return () => clearInterval(id);
  }, [step]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[640px] w-full overflow-hidden bg-white dark:bg-neutral-950"
    >
      <div className="flex min-w-0 flex-1 flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-sm font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
            N
          </span>
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Northwind
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-[360px] py-8">
            <h1 className="text-2xl font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-50">
              Sign in
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
              Use your Northwind account to continue.
            </p>

            <form onSubmit={submit} noValidate className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor={emailId}
                  className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  Work email
                </label>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={cx(field, focus)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <label
                    htmlFor={passwordId}
                    className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className={cx("text-xs", linkClass, focus)}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id={passwordId}
                    type={reveal ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
                className={cx(btnPrimary, transition, focus)}
              >
                Sign in
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Or continue with
              </span>
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                className={cx(btnProvider, transition, focus)}
              >
                <GoogleMark className="h-4 w-4" />
                Google
              </button>
              <button
                type="button"
                className={cx(btnProvider, transition, focus)}
              >
                <Apple aria-hidden="true" className="h-4 w-4" />
                Apple
              </button>
              <button
                type="button"
                className={cx(btnProvider, transition, focus)}
              >
                <Github aria-hidden="true" className="h-4 w-4" />
                GitHub
              </button>
            </div>
          </div>
        </div>

        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          New to Northwind?{" "}
          <button type="button" className={cx("font-medium", linkClass, focus)}>
            Create an account
          </button>
        </p>
      </div>

      <aside className="hidden w-[44%] shrink-0 flex-col justify-between border-l border-neutral-200/70 bg-neutral-50 p-10 lg:flex dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-[11px] font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          Why teams switch
        </p>

        <div>
          <blockquote
            key={index}
            className="animate-[fadeIn_240ms_ease-out] text-lg leading-7 text-neutral-900 motion-reduce:animate-none dark:text-neutral-100"
          >
            {quote.body}
          </blockquote>

          <div className="mt-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-[13px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {quote.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {quote.name}
              </p>
              <p className="truncate text-[13px] text-neutral-500 dark:text-neutral-400">
                {quote.role}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-1 rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950">
            {quote.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <p className="text-base font-medium tracking-[-0.01em] text-neutral-900 tabular-nums dark:text-neutral-50">
                  {stat.value}
                </p>
                <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {QUOTES.map((q, i) => (
              <button
                key={q.name}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show quote from ${q.name}`}
                aria-current={i === index}
                className={cx(
                  "h-1.5 cursor-pointer rounded-full transition-[width,background-color] duration-200 ease-out",
                  focus,
                  i === index
                    ? "w-5 bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                    : "w-1.5 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous quote"
              className={cx(iconBtn, transition, focus)}
            >
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next quote"
              className={cx(iconBtn, transition, focus)}
            >
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

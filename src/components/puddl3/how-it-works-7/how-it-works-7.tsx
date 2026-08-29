"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const steps = [
  {
    number: "01",
    title: "Capture the mandate once",
    copy: "Scope, entities, and signatories arrive through a single intake link, no email archaeology required.",
    card: "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950",
    copyTone: "text-neutral-300 dark:text-neutral-600",
    placement: "lg:col-start-1 lg:row-start-1",
  },
  {
    number: "02",
    title: "Screen every party automatically",
    copy: "KYC and sanctions checks run in the background and surface only the exceptions worth a human look.",
    card: "bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-white",
    copyTone: "text-neutral-600 dark:text-neutral-400",
    placement: "lg:col-start-3 lg:row-start-1",
  },
  {
    number: "03",
    title: "Open accounts without re-keying",
    copy: "Approved details flow straight into your CRM, billing, and document vault the moment review clears.",
    card: "border border-neutral-200 bg-white text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white",
    copyTone: "text-neutral-600 dark:text-neutral-400",
    placement: "lg:col-start-1 lg:row-start-2",
  },
  {
    number: "04",
    title: "Hand off fully briefed",
    copy: "The engagement team starts with owners, deadlines, and context already in place on day one.",
    card: "bg-neutral-200 text-neutral-950 dark:bg-neutral-800 dark:text-white",
    copyTone: "text-neutral-700 dark:text-neutral-300",
    placement: "lg:col-start-3 lg:row-start-2",
  },
];

function StepCard({
  step,
  variants,
}: {
  step: (typeof steps)[number];
  variants: Variants;
}) {
  return (
    <motion.article
      variants={variants}
      aria-label={`Step ${step.number}: ${step.title}`}
      className={`${step.card} ${step.placement} flex min-h-[240px] flex-col justify-between gap-10 rounded-[2.75rem] p-7 sm:min-h-[280px] sm:p-8 lg:min-h-[320px]`}
    >
      <span
        aria-hidden="true"
        className="font-serif text-5xl italic leading-none opacity-30 sm:text-6xl"
      >
        {step.number}
      </span>
      <div>
        <h3 className="text-[1.375rem] font-medium leading-snug tracking-tight text-balance sm:text-2xl">
          {step.title}
        </h3>
        <p
          className={`mt-3 max-w-sm text-sm leading-relaxed sm:text-[15px] ${step.copyTone}`}
        >
          {step.copy}
        </p>
      </div>
    </motion.article>
  );
}

export function HowItWorks7() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: EASE },
    },
  };

  return (
    <section
      aria-labelledby="hiw7-heading"
      className="w-full bg-white px-4 py-16 dark:bg-neutral-950 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-12 flex flex-col gap-6 sm:mb-16 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-2xl">
            <h2
              id="hiw7-heading"
              className="text-3xl font-medium leading-[1.1] tracking-tight text-neutral-900 text-balance dark:text-white sm:text-4xl lg:text-5xl"
            >
              From signed engagement to day-one ready.
            </h2>
          </div>
          <a
            href="#"
            className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950"
          >
            See a live onboarding
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-[1fr_minmax(300px,0.85fr)_1fr] lg:grid-rows-2 lg:gap-6"
        >
          {steps.slice(0, 2).map((step) => (
            <StepCard key={step.number} step={step} variants={item} />
          ))}

          <motion.div
            variants={item}
            aria-hidden="true"
            className="relative min-h-[420px] w-full overflow-hidden rounded-t-[200px] rounded-b-[2.75rem] border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 sm:col-span-2 sm:mx-auto sm:min-h-[520px] sm:max-w-md lg:col-span-1 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:h-full lg:min-h-0 lg:max-w-none"
          >
            <img
              src="/svg/placeholder.svg"
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>

          {steps.slice(2).map((step) => (
            <StepCard key={step.number} step={step} variants={item} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default HowItWorks7;

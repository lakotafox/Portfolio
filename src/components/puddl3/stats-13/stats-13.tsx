"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const rows = [
  {
    index: "01",
    value: 4.6,
    decimals: 1,
    unit: "B",
    label: "Requests served daily",
    detail:
      "Sustained traffic across 14 regions, absorbed without a single paging incident this fiscal year.",
    delta: "+38% vs FY24",
    improved: "up",
  },
  {
    index: "02",
    value: 99.98,
    decimals: 2,
    unit: "%",
    label: "Fleet-wide availability",
    detail:
      "Measured against every production workload we run, including the ones customers never see.",
    delta: "+0.12 pts vs FY24",
    improved: "up",
  },
  {
    index: "03",
    value: 142,
    decimals: 0,
    unit: "ms",
    label: "p99 response time",
    detail:
      "Cold paths included. Smarter routing and edge caching carried most of the drop.",
    delta: "−41% vs FY24",
    improved: "down",
  },
];

function CountUp({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shouldReduceMotion) {
      el.textContent = value.toFixed(decimals);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = v.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [value, decimals, shouldReduceMotion]);

  return <span ref={ref}>{(0).toFixed(decimals)}</span>;
}

export default function Stats13() {
  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-end"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight text-neutral-900 dark:text-white">
              Proof, measured quarterly.
            </h2>
          </div>
          <p className="max-w-md text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 lg:justify-self-end">
            Every figure below comes from the same telemetry our customers see.
            No rounding up, no vanity windows.
          </p>
        </motion.div>

        <div className="mt-12 sm:mt-16 border-t border-neutral-200 dark:border-neutral-800">
          {rows.map((row) => (
            <motion.article
              key={row.index}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: EASE }}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 border-b border-neutral-200 dark:border-neutral-800 py-10 sm:py-14 md:items-start"
            >
              <span className="md:col-span-1 text-sm font-medium tabular-nums text-neutral-400 dark:text-neutral-600 md:pt-2">
                {row.index}
              </span>
              <div className="min-w-0 md:col-span-6 flex items-baseline gap-2">
                <span className="text-7xl sm:text-8xl lg:text-[9rem] font-semibold tracking-[-0.04em] leading-[0.9] tabular-nums text-neutral-900 dark:text-white">
                  <CountUp value={row.value} decimals={row.decimals} />
                </span>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-400 dark:text-neutral-500">
                  {row.unit}
                </span>
              </div>
              <div className="md:col-span-5">
                <h3 className="text-lg sm:text-xl font-medium tracking-tight text-neutral-900 dark:text-white">
                  {row.label}
                </h3>
                <p className="mt-2 max-w-md text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {row.detail}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 px-3 py-1 text-xs font-medium tabular-nums text-neutral-600 dark:text-neutral-400">
                  {row.improved === "up" ? (
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  )}
                  {row.delta}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

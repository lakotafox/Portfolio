"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CHART_W = 240;
const CHART_H = 72;

function buildChart(series: number[]) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const points = series.map((value, i) => ({
    x: 5 + (i / (series.length - 1)) * (CHART_W - 10),
    y: CHART_H - 10 - ((value - min) / span) * (CHART_H - 22),
  }));
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${CHART_H - 4} L ${points[0].x.toFixed(1)} ${CHART_H - 4} Z`;
  return { line, area, last: points[points.length - 1] };
}

const metrics = [
  {
    label: "Median build time",
    value: 46,
    decimals: 0,
    unit: "s",
    delta: "−18%",
    improved: "down",
    caption: "Rolling 90-day window",
    series: [88, 84, 86, 79, 74, 76, 68, 63, 65, 58, 52, 46],
  },
  {
    label: "Deploys per week",
    value: 312,
    decimals: 0,
    unit: "",
    delta: "+24%",
    improved: "up",
    caption: "Across 41 production services",
    series: [180, 195, 188, 210, 224, 218, 246, 252, 268, 284, 296, 312],
  },
  {
    label: "Error budget intact",
    value: 99.2,
    decimals: 1,
    unit: "%",
    delta: "+0.4 pts",
    improved: "up",
    caption: "Fleet-wide, current quarter",
    series: [
      97.1, 97.4, 97.2, 97.8, 98.1, 97.9, 98.4, 98.6, 98.5, 98.9, 99.0, 99.2,
    ],
  },
].map((metric) => ({ ...metric, chart: buildChart(metric.series) }));

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE, delayChildren: 0.3 },
  },
};

const lineVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.2, ease: EASE },
  },
};

const areaVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, ease: EASE, delay: 0.6 },
  },
};

const dotVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: EASE, delay: 1.2 },
  },
};

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
      duration: 1.2,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = v.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [value, decimals, shouldReduceMotion]);

  return <span ref={ref}>{(0).toFixed(decimals)}</span>;
}

export default function Stats14() {
  const shouldReduceMotion = useReducedMotion();
  const lineAnim = shouldReduceMotion ? undefined : lineVariants;
  const areaAnim = shouldReduceMotion ? undefined : areaVariants;
  const dotAnim = shouldReduceMotion ? undefined : dotVariants;

  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-2xl"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight text-neutral-900 dark:text-white">
            The pipeline, at a glance.
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
            Ninety days of delivery data, reduced to the three numbers our own
            team checks every morning.
          </p>
        </motion.div>

        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
        >
          {metrics.map((metric) => (
            <motion.article
              key={metric.label}
              variants={cardVariants}
              className="flex flex-col rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {metric.label}
                </h3>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 text-xs font-medium tabular-nums text-neutral-600 dark:text-neutral-400">
                  {metric.improved === "up" ? (
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
                  )}
                  {metric.delta}
                </span>
              </div>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-5xl sm:text-6xl font-semibold tracking-tight tabular-nums text-neutral-900 dark:text-white">
                  <CountUp value={metric.value} decimals={metric.decimals} />
                </span>
                {metric.unit && (
                  <span className="text-2xl font-medium text-neutral-400 dark:text-neutral-500">
                    {metric.unit}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {metric.caption}
              </p>
              <div className="mt-8 border-t border-neutral-100 dark:border-neutral-900 pt-6">
                <svg
                  viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  className="h-auto w-full"
                  aria-hidden="true"
                >
                  <line
                    x1="5"
                    y1={CHART_H - 4}
                    x2={CHART_W - 5}
                    y2={CHART_H - 4}
                    stroke="currentColor"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    className="text-neutral-200 dark:text-neutral-800"
                  />
                  <line
                    x1="5"
                    y1="14"
                    x2={CHART_W - 5}
                    y2="14"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                    vectorEffect="non-scaling-stroke"
                    className="text-neutral-200 dark:text-neutral-800"
                  />
                  <motion.path
                    variants={areaAnim}
                    d={metric.chart.area}
                    fill="currentColor"
                    className="text-neutral-900/[0.05] dark:text-white/[0.07]"
                  />
                  <motion.path
                    variants={lineAnim}
                    d={metric.chart.line}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neutral-900 dark:text-white"
                  />
                  <motion.circle
                    variants={dotAnim}
                    cx={metric.chart.last.x}
                    cy={metric.chart.last.y}
                    r="3.5"
                    fill="currentColor"
                    className="text-neutral-900 dark:text-white"
                  />
                </svg>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

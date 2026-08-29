"use client";

import { useEffect, useRef } from "react";
import { animate, motion } from "motion/react";

const cards = [
  {
    value: 2400,
    format: (n: number) => `${Math.round(n).toString().padStart(4, "0")}+`,
    label: "Teams shipping every week with our platform",
    bg: "#e4f1e8",
    fg: "#0e2a18",
  },
  {
    value: 4.9,
    format: (n: number) => n.toFixed(2),
    label: "Average developer rating across 8,200 reviews",
    bg: "#122018",
    fg: "#c7e8d4",
  },
  {
    value: 83,
    format: (n: number) => `${Math.round(n).toString().padStart(2, "0")}%`,
    label: "Faster time-to-first-deploy for new engineers",
    bg: "#dcd0f5",
    fg: "#1e163d",
  },
  {
    value: 99.99,
    format: (n: number) => `${n.toFixed(2).padStart(5, "0")}%`,
    label: "Platform uptime measured over the last 12 months",
    bg: "#ffd4b8",
    fg: "#3a1a08",
  },
];

function CountUp({
  to,
  format,
  duration = 2.4,
}: {
  to: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [to, duration, format]);

  return <span ref={ref}>{format(0)}</span>;
}

export default function Stats10() {
  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start sm:items-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl sm:text-5xl md:text-6xl font-normal text-neutral-900 dark:text-white tracking-tight leading-[1.1]"
        >
          Built for teams
          <br />
          who ship <em className="font-serif italic">relentlessly</em>
        </motion.h2>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 sm:p-8 flex flex-col justify-between min-h-[280px] sm:min-h-[340px]"
              style={{ backgroundColor: c.bg, color: c.fg }}
            >
              <span className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight tabular-nums">
                <CountUp to={c.value} format={c.format} />
              </span>
              <span className="text-sm sm:text-base leading-snug max-w-[220px]">
                {c.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

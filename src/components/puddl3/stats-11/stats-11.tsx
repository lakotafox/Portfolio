"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const cards = [
  {
    title: "Active developers",
    label: "Monthly",
    value: "184K",
    source: "Analytics",
    bg: "#c7e8d4",
    tint: "#4a8f6b",
  },
  {
    title: "Requests served",
    label: "Per day",
    value: "92.4M",
    source: "Edge network",
    bg: "#dcd0f5",
    tint: "#6b5aa3",
  },
  {
    title: "Uptime",
    label: "Last 12 months",
    value: "99.9%",
    source: "Status page",
    bg: "#ffd4b8",
    tint: "#b86535",
  },
];

const SHORT = 380;
const TALL = 470;
const CYCLE_MS = 2200;

export default function Stats11() {
  const [active, setActive] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % cards.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [isDesktop]);

  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-neutral-900 dark:text-white tracking-tight">
            The numbers
          </h2>
          <p className="mt-3 text-base sm:text-lg text-neutral-500 dark:text-neutral-500">
            A live look at the platform, refreshed continuously.
          </p>
        </motion.div>

        <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {cards.map((c, i) => (
            <div key={i} className="md:h-[470px] flex items-end">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                animate={
                  isDesktop
                    ? {
                        height: active === i ? TALL : SHORT,
                        color: active === i ? "#171717" : c.tint,
                      }
                    : { height: "auto", color: "#171717" }
                }
                transition={{
                  opacity: { duration: 0.5, delay: 0.1 * i },
                  y: { duration: 0.5, delay: 0.1 * i },
                  height: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                  color: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                }}
                style={{ backgroundColor: c.bg }}
                className="w-full rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-10 overflow-hidden"
              >
                <span className="text-xl sm:text-2xl font-medium">
                  {c.title}
                </span>
                <div className="flex flex-col gap-2">
                  {c.label && (
                    <span className="text-2xl sm:text-3xl font-medium">
                      {c.label}
                    </span>
                  )}
                  <span className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight">
                    {c.value}
                  </span>
                  <a
                    href="#"
                    className="mt-4 inline-flex items-center gap-1 text-xs sm:text-sm font-bold hover:underline"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {c.source}
                  </a>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

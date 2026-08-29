"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";

const rows: {
  label: string;
  bold?: boolean;
  us: boolean;
  them: boolean;
}[] = [
  { label: "Real-time collaboration", bold: true, us: true, them: true },
  { label: "Version history", bold: true, us: true, them: false },
  { label: "Unlimited workspaces", bold: true, us: true, them: false },
  { label: "Custom integrations", us: true, them: false },
  { label: "Offline support", us: true, them: false },
  { label: "Private sharing", us: true, them: false },
  { label: "Advanced analytics", us: true, them: false },
  { label: "Role-based access", us: true, them: false },
  { label: "Priority support", bold: true, us: true, them: true },
  { label: "24/7 monitoring", bold: true, us: true, them: false },
];

export default function Comparison4() {
  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-medium text-neutral-900 dark:text-white leading-[1.05] tracking-tight sm:whitespace-nowrap"
          style={{ fontSize: "clamp(1.75rem, 5.2vw, 4.75rem)" }}
        >
          Only Northwind gives you full coverage
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10 sm:mt-14 lg:pr-32 xl:pr-56"
        >
          <div className="grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr] items-center pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <span />
            <span className="text-center text-sm sm:text-base text-neutral-700 dark:text-neutral-300">
              Northwind
            </span>
            <span className="text-center text-sm sm:text-base text-neutral-700 dark:text-neutral-300">
              Competitors
            </span>
          </div>

          {rows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
              className="grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr] items-center py-4 sm:py-5 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0"
            >
              <span
                className={`text-sm sm:text-base text-neutral-900 dark:text-neutral-100 ${
                  row.bold ? "font-semibold" : "font-normal"
                }`}
              >
                {row.label}
              </span>
              <span className="flex justify-center">
                {row.us ? (
                  <Check
                    className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-500"
                    strokeWidth={3}
                  />
                ) : (
                  <X
                    className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-500"
                    strokeWidth={3}
                  />
                )}
              </span>
              <span className="flex justify-center">
                {row.them ? (
                  <Check
                    className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-500"
                    strokeWidth={3}
                  />
                ) : (
                  <X
                    className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-500"
                    strokeWidth={3}
                  />
                )}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-6 text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">
          Comparison is based on public information and free offerings by top
          competitors as of 04/26.
        </p>
      </div>
    </section>
  );
}

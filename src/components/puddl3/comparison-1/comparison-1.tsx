"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";

export default function Comparison1() {
  const features = [
    {
      name: "Unlimited storage",
      brand1: true,
      brand2: false,
    },
    {
      name: "Unlimited uploads",
      brand1: true,
      brand2: false,
    },
    {
      name: "Advanced encryption",
      brand1: true,
      brand2: false,
    },
    {
      name: "Team collaboration",
      brand1: true,
      brand2: true,
    },
    {
      name: "Mobile sync",
      brand1: true,
      brand2: true,
    },
  ];

  return (
    <section className="relative w-full bg-white px-4 py-12 sm:px-6 lg:px-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            <h2 className="mb-6 text-4xl font-medium tracking-tight text-neutral-950 dark:text-white">
              Skyvault vs. Cloudbox
            </h2>
            <p className="mb-8 text-md max-w-md leading-relaxed text-neutral-600 dark:text-neutral-400">
              SkyVault and CloudBox are both cloud storage solutions for your
              files and data, but SkyVault includes unlimited storage, unlimited
              uploads, and advanced encryption on all plans.
            </p>
            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-full bg-neutral-950 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 md:w-auto"
              >
                Try Skyvault Free
              </motion.button>
            </div>
          </motion.div>

          <div className="w-full">
            <div className="mb-8 grid grid-cols-2 gap-4 md:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex items-center"
              >
                <span className="text-2xl font-bold text-neutral-950 dark:text-white md:text-3xl">
                  SkyVault
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center"
              >
                <span className="text-2xl font-bold tracking-wider text-neutral-950 dark:text-white md:text-3xl">
                  CloudBox
                </span>
              </motion.div>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="grid grid-cols-2 gap-4 md:gap-6"
                >
                  <div className="flex items-center gap-3 py-4">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                        feature.brand1
                          ? "bg-neutral-950 dark:bg-white"
                          : "border-2 border-neutral-300 dark:border-neutral-700"
                      }`}
                    >
                      {feature.brand1 && (
                        <Check
                          className="h-4 w-4 text-white dark:text-neutral-950"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-neutral-950 dark:text-white md:text-base">
                      {feature.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 py-4">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                        feature.brand2
                          ? "bg-neutral-950 dark:bg-white"
                          : "border-2 border-neutral-300 dark:border-neutral-700"
                      }`}
                    >
                      {feature.brand2 && (
                        <Check
                          className="h-4 w-4 text-white dark:text-neutral-950"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium md:text-base ${
                        feature.brand2
                          ? "text-neutral-950 dark:text-white"
                          : "text-neutral-400 dark:text-neutral-600"
                      }`}
                    >
                      {feature.name}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

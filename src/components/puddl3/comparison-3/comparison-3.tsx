"use client";

import { Zap, Database } from "lucide-react";
import { motion } from "motion/react";

export default function Comparison3() {
  return (
    <section className="relative w-full bg-white px-4 py-12 sm:px-6 lg:px-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            <h2 className="mb-6 text-5xl font-medium tracking-tight text-neutral-950 dark:text-white">
              CloudSync vs. DataVault
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-xl">
              Deciding between CloudSync and DataVault? Dig into the details of
              these storage tools to compare speed, security, and collaboration
              features.
            </p>
            <div>
              <button className="cursor-pointer w-full rounded-full bg-neutral-900 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-300 md:w-auto">
                Get CloudSync for free
              </button>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, delay: 0.2 },
              },
            }}
            className="relative"
          >
            <div className="relative h-[520px]">
              <div className="absolute left-0 right-0 top-8 bottom-0 flex flex-col justify-between">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-px w-full bg-neutral-300 dark:bg-neutral-700"
                  />
                ))}
              </div>

              <div className="absolute left-0 right-0 top-8 bottom-0 flex items-end justify-center gap-6">
                <div
                  className="relative w-40 overflow-hidden"
                  style={{ height: "95%" }}
                >
                  <motion.div
                    variants={{
                      hidden: { y: "100%" },
                      visible: {
                        y: 0,
                        transition: {
                          duration: 1,
                          delay: 0.4,
                          ease: "easeOut",
                        },
                      },
                    }}
                    className="absolute inset-0 w-40 bg-purple-700 dark:bg-purple-600"
                    style={{
                      borderTopLeftRadius: "200px",
                      borderTopRightRadius: "200px",
                    }}
                  >
                    <motion.div
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { duration: 0.5, delay: 1.1 },
                        },
                      }}
                      className="absolute left-1/2 top-8 -translate-x-1/2"
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-neutral-100">
                        <Zap className="h-12 w-12 text-purple-700" />
                      </div>
                    </motion.div>

                    <motion.div
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { duration: 0.5, delay: 0.9 },
                        },
                      }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
                    >
                      <div className="text-7xl font-bold text-white md:text-8xl">
                        95
                      </div>
                      <div className="mt-2 text-xs font-medium text-white/90">
                        G2 Score for Cloud Storage
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                <div
                  className="relative w-40 overflow-hidden"
                  style={{ height: "62%" }}
                >
                  <motion.div
                    variants={{
                      hidden: { y: "100%" },
                      visible: {
                        y: 0,
                        transition: {
                          duration: 1,
                          delay: 0.5,
                          ease: "easeOut",
                        },
                      },
                    }}
                    className="absolute inset-0 w-40 bg-emerald-700 dark:bg-emerald-600"
                    style={{
                      borderTopLeftRadius: "200px",
                      borderTopRightRadius: "200px",
                    }}
                  >
                    <motion.div
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { duration: 0.5, delay: 1.2 },
                        },
                      }}
                      className="absolute left-1/2 top-8 -translate-x-1/2"
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-neutral-100">
                        <Database className="h-12 w-12 text-emerald-700" />
                      </div>
                    </motion.div>

                    <motion.div
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { duration: 0.5, delay: 1.0 },
                        },
                      }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
                    >
                      <div className="text-7xl font-bold text-white md:text-8xl">
                        62
                      </div>
                      <div className="mt-2 text-xs font-medium text-white/90">
                        G2 Score for Cloud Storage
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <a
                href="#"
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Data powered by Databuddy
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

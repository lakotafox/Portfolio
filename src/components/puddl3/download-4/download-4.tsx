"use client";

import { motion } from "motion/react";
import { Download } from "lucide-react";

export default function Download4() {
  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start py-10 sm:py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-stretch">
          <div className="flex flex-col justify-between min-h-[560px] lg:min-h-[680px]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-xs sm:text-sm tracking-[0.2em] uppercase text-neutral-500 dark:text-neutral-500"
            >
              Now available
            </motion.div>

            <div className="flex flex-col gap-6 max-w-lg py-12">
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-serif text-5xl sm:text-6xl lg:text-7xl text-neutral-900 dark:text-white leading-[1.02] tracking-tight"
              >
                The sound of your next session.
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-md"
              >
                A hand-curated library of stems, loops and one-shots: delivered
                straight to your DAW. Download the full pack and start shaping
                your next track in seconds, not hours.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="self-start inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-pink-600 hover:bg-pink-500 text-white cursor-pointer transition-colors"
              >
                <span className="text-sm sm:text-base font-medium">
                  Download the pack
                </span>
                <span className="w-8 h-8 rounded-full bg-pink-500/80 flex items-center justify-center">
                  <Download className="w-3.5 h-3.5" />
                </span>
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300"
            >
              <span className="tracking-[0.2em] uppercase">Vol. 04</span>
              <span>/</span>
              <span className="font-semibold">Dusk Sessions</span>
              <span className="text-neutral-400 dark:text-neutral-600">·</span>
              <span className="text-neutral-500 dark:text-neutral-500">
                240 samples · 1.2GB
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 min-h-[400px] lg:min-h-[680px]"
          >
            <img
              src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1400&q=80"
              alt="Studio session"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                <span>In the studio</span>
              </div>
              <span className="text-xs text-white/80">24-bit · WAV</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

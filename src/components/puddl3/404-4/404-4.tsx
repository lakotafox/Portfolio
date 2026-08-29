"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const cards = [
  {
    title: "Fresh Arrivals",
    cta: "Shop New",
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80&auto=format&fit=crop",
  },
  {
    title: "The Journal",
    cta: "Read Stories",
    img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80&auto=format&fit=crop",
  },
  {
    title: "Studio Notes",
    cta: "Take A Look",
    img: "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=1200&q=80&auto=format&fit=crop",
  },
];

export default function NotFound4() {
  return (
    <section className="w-full min-h-screen flex items-start py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-neutral-900 dark:text-white leading-none tracking-tight uppercase pb-6 sm:pb-8"
        >
          404 Page Missing
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ originX: 0 }}
          className="w-full h-px bg-neutral-200 dark:bg-neutral-800"
        />

        <div className="py-6 sm:py-8 flex flex-col gap-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-xl sm:text-3xl md:text-4xl font-normal text-neutral-900 dark:text-white tracking-tight leading-tight max-w-4xl"
          >
            Looks like this page took the day off. Let&apos;s get you back on
            track.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 text-[10px] sm:text-xs font-medium tracking-wider uppercase w-fit cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200"
          >
            <ArrowRight className="w-3 h-3" />
            Back to the home page
          </motion.button>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ originX: 0 }}
          className="w-full h-px bg-neutral-200 dark:bg-neutral-800 mb-6 sm:mb-8"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.08 }}
              className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-5/4 cursor-pointer group bg-neutral-100 dark:bg-neutral-900"
            >
              <img
                src={card.img}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col gap-3">
                <span className="text-xl sm:text-2xl font-semibold text-white leading-none uppercase tracking-tight">
                  {card.title}
                </span>
                <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-neutral-900 text-[10px] sm:text-xs font-medium uppercase tracking-wider w-fit cursor-pointer hover:bg-neutral-100 transition-colors duration-200">
                  <ArrowRight className="w-3 h-3" />
                  {card.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

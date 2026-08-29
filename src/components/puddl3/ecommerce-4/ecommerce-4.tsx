"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";

const sizes = [
  { label: "XS", out: true },
  { label: "S", out: false },
  { label: "M", out: false },
  { label: "L", out: true },
  { label: "XL", out: true },
];

const colorways = [
  {
    name: "Cream",
    bg: "#eae3d2",
    image:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1400&q=80",
  },
  {
    name: "Charcoal",
    bg: "#2a2a2a",
    image:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1400&q=80",
  },
];

const highlights = [
  "100% BIODEGRADABLE",
  "ORGANIC COTTON",
  "LOW-IMPACT DYE",
  "PFC-FREE",
  "ALGAE INK PRINT",
  "LIMITED RUN OF 500",
];

const sections = [
  {
    label: "Description",
    body: "A heavyweight loopback hoodie cut from certified organic cotton and printed with algae-based ink. Designed for the long run: wash after wash, it only softens.",
  },
  {
    label: "Product Details",
    body: "Relaxed fit. Ribbed cuffs and hem. Brushed-back interior. Reinforced kangaroo pocket. Woven loop label at side seam. 520 gsm.",
  },
  {
    label: "Shipping",
    body: "Free carbon-neutral shipping on orders over $100. Pre-orders ship within 3 weeks of release date. 30-day free returns on all full-price items.",
  },
];

export default function Ecommerce4() {
  const [open, setOpen] = useState<number | null>(null);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);

  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] py-10 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="relative aspect-4/5 rounded-3xl bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={colorways[color].image}
              src={colorways[color].image}
              alt=""
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-6 lg:pt-6">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 dark:text-neutral-500">
            Limited stock
          </p>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-neutral-900 dark:text-white tracking-tight leading-[1.05]"
          >
            The World&rsquo;s Healthiest Hoodie
          </motion.h1>

          <p className="text-xs tracking-[0.2em] uppercase text-neutral-600 dark:text-neutral-400">
            100% Biodegradable &middot; 100% Cotton &middot; 0% Toxin
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {sizes.map((s) => (
                <button
                  key={s.label}
                  disabled={s.out}
                  onClick={() => setSize(s.label)}
                  className={`h-10 w-10 rounded text-xs font-medium transition ${
                    s.out
                      ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 line-through cursor-not-allowed"
                      : size === s.label
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 cursor-pointer"
                        : "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white cursor-pointer"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white">
              $229 USD
            </p>
          </div>

          <div className="flex items-center gap-3">
            {colorways.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setColor(i)}
                style={{ backgroundColor: c.bg }}
                className={`h-9 w-9 rounded-full cursor-pointer transition ${
                  color === i
                    ? "ring-1 ring-offset-2 ring-neutral-900 dark:ring-white dark:ring-offset-neutral-950"
                    : "ring-1 ring-neutral-200 dark:ring-neutral-700 hover:scale-105"
                }`}
                aria-label={c.name}
              />
            ))}
            <span className="text-sm text-neutral-700 dark:text-neutral-300 ml-2">
              {colorways[color].name}
            </span>
          </div>

          <button
            onClick={() => setNotified(true)}
            className="w-full py-5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex flex-col items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <span className="text-xs tracking-[0.2em] uppercase font-semibold">
              {notified ? "We'll let you know" : "Get notified"}
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase opacity-70 mt-0.5">
              {notified ? "You're on the list" : "Out of stock"}
            </span>
          </button>

          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              Highlights
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {highlights.map((h) => (
                <span
                  key={h}
                  className="px-3 py-1.5 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] tracking-[0.15em] uppercase text-neutral-800 dark:text-neutral-200"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-800">
            {sections.map((s, i) => (
              <div
                key={s.label}
                className="border-b border-neutral-200 dark:border-neutral-800"
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between py-4 text-sm text-neutral-900 dark:text-white cursor-pointer"
                >
                  {s.label}
                  <Plus
                    className={`h-4 w-4 transition-transform ${open === i ? "rotate-45" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed overflow-hidden"
                    >
                      <span className="block pb-4">{s.body}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

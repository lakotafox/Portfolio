"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpLeft } from "lucide-react";

const colors = [
  { name: "Dune", className: "bg-amber-200", ring: "ring-amber-500" },
  { name: "Clay", className: "bg-rose-300", ring: "ring-rose-500" },
  { name: "Plum", className: "bg-purple-700", ring: "ring-purple-500" },
  { name: "Ink", className: "bg-neutral-900", ring: "ring-neutral-500" },
  { name: "Fern", className: "bg-emerald-200", ring: "ring-emerald-500" },
  { name: "Sage", className: "bg-emerald-400", ring: "ring-emerald-600" },
];

const imageByColor: Record<string, [string, string]> = {
  Dune: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80",
    "https://images.unsplash.com/photo-1590739225287-bd31519780c3?w=1200&q=80",
  ],
  Clay: [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=80",
    "https://images.unsplash.com/photo-1590739225287-bd31519780c3?w=1200&q=80",
  ],
  Plum: [
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&q=80",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80",
  ],
  Ink: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&q=80",
  ],
  Fern: [
    "https://images.unsplash.com/photo-1591561954555-607968c989ab?w=1200&q=80",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80",
  ],
  Sage: [
    "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&q=80",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&q=80",
  ],
};

const tabs = ["DETAILS", "MATERIALS", "SHIPPING"];

const copy = {
  DETAILS: {
    intro:
      "A soft, rounded silhouette inspired by a fresh-baked loaf. Roomy enough for your essentials, structured enough to keep its shape through the day.",
    bullets: [
      "Interior zip pocket",
      "Interior key leash",
      "Charm loop & brushed-metal charm",
      '39" adjustable webbing strap',
      'Fits a 13" laptop sleeve',
      '11" W  5" H  5" D',
    ],
  },
  MATERIALS: {
    intro:
      "Crafted from recycled, durable materials with a water-resistant finish.",
    bullets: [
      "Recycled heavyweight nylon shell",
      "Ripstop nylon lining",
      "YKK zippers",
      "Solid brass hardware",
      "PFC-free DWR coating",
      "Machine wash cold",
    ],
  },
  SHIPPING: {
    intro: "Free carbon-neutral shipping on orders over $50.",
    bullets: [
      "Standard: 3-5 business days",
      "Express: 1-2 business days",
      "Free returns within 30 days",
      "Ships from Portland, OR",
      "International: 7-14 days",
      "Lifetime repair program",
    ],
  },
};

export default function Ecommerce3() {
  const [tab, setTab] = useState<keyof typeof copy>("DETAILS");
  const [color, setColor] = useState("Dune");
  const [imgs, setImgs] = useState(imageByColor["Dune"]);

  const selectColor = (name: string) => {
    setColor(name);
    setImgs(imageByColor[name]);
  };

  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] bg-white dark:bg-neutral-950">
      <div className="grid grid-cols-2 min-h-[420px] lg:min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={color + "-a"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden"
          >
            <img
              src={imgs[0]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div
            key={color + "-b"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="relative overflow-hidden"
          >
            <img
              src={imgs[1]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8 sm:p-12 flex flex-col justify-start gap-6">
        <button className="inline-flex items-center gap-1 text-xs tracking-[0.15em] uppercase text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer w-fit">
          <ArrowUpLeft className="h-3 w-3" />
          Back
        </button>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-neutral-900 dark:text-white tracking-tight leading-[1.05]"
          style={{ fontFamily: "ui-serif, Georgia, serif" }}
        >
          Nylon Loaf Bag
        </motion.h1>

        <div className="flex items-end gap-4">
          <p className="text-3xl font-semibold text-neutral-900 dark:text-white">
            $54
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug max-w-[220px] pb-1">
            or 4 interest-free payments of $13.50
          </p>
        </div>

        <div>
          <p className="text-xs tracking-wider text-neutral-700 dark:text-neutral-300 uppercase">
            Color:{" "}
            <span className="text-neutral-900 dark:text-white">{color}</span>
          </p>
          <div className="mt-3 flex items-center gap-3">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => selectColor(c.name)}
                className={`h-9 w-9 rounded-full ${c.className} cursor-pointer transition ${
                  color === c.name
                    ? "ring-1 ring-offset-2 ring-neutral-900 dark:ring-white dark:ring-offset-neutral-950"
                    : "hover:scale-105"
                }`}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold tracking-[0.15em] hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          ADD TO CART
        </motion.button>

        <div className="flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-800 relative">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as keyof typeof copy)}
              className={`relative pb-2 text-xs tracking-[0.15em] uppercase cursor-pointer transition-colors ${
                tab === t
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {t}
              {tab === t && (
                <motion.span
                  layoutId="ec3-tab"
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-neutral-900 dark:bg-white"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {copy[tab].intro}
            </p>
            <ul className="text-sm text-neutral-700 dark:text-neutral-300 space-y-1.5">
              {copy[tab].bullets.map((b) => (
                <li key={b}>&bull; {b}</li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

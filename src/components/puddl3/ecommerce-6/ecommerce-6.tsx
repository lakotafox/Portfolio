"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type Category = "ALL" | "APPAREL" | "OBJECTS";

type Product = {
  name: string;
  price: string;
  soldOut?: boolean;
  accent?: boolean;
  category: Exclude<Category, "ALL">;
  image: string;
};

const products: Product[] = [
  {
    name: "Orchid ORC-1",
    price: "SOLD OUT",
    soldOut: true,
    category: "OBJECTS",
    image:
      "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?w=900&q=80",
  },
  {
    name: "Black Wavelength Beanie",
    price: "$30.00 USD",
    accent: true,
    category: "APPAREL",
    image:
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=900&q=80",
  },
  {
    name: "Forest Orchid Eye Tee",
    price: "$50.00 USD",
    category: "APPAREL",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80",
  },
  {
    name: "Field Tote",
    price: "$20.00 USD",
    category: "OBJECTS",
    image:
      "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=900&q=80",
  },
  {
    name: "Charcoal Logo Tee",
    price: "$45.00 USD",
    category: "APPAREL",
    image:
      "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=900&q=80",
  },
  {
    name: "Cream Orchid Hoodie",
    price: "$110.00 USD",
    category: "APPAREL",
    image:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&q=80",
  },
  {
    name: "Moss Orchid Tee",
    price: "$50.00 USD",
    category: "APPAREL",
    image:
      "https://images.unsplash.com/photo-1622445275576-721325763afe?w=900&q=80",
  },
  {
    name: "Corduroy Field Cap",
    price: "$35.00 USD",
    category: "APPAREL",
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=900&q=80",
  },
];

const tabs: Category[] = ["ALL", "APPAREL", "OBJECTS"];

export default function Ecommerce6() {
  const [active, setActive] = useState<Category>("ALL");

  const shown = useMemo(() => {
    if (active === "ALL") return products;
    return products.filter((p) => p.category === active);
  }, [active]);

  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] py-10 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-semibold text-neutral-900 dark:text-white tracking-tight"
          >
            Our Catalog
          </motion.h1>

          <div className="relative flex items-center gap-1 rounded-full border border-neutral-200 dark:border-neutral-800 p-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActive(t)}
                className={`relative px-4 py-1.5 rounded-full text-xs tracking-[0.15em] transition-colors cursor-pointer ${
                  active === t
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {active === t && (
                  <motion.span
                    layoutId="ec6-pill"
                    className="absolute inset-0 rounded-full bg-neutral-100 dark:bg-neutral-800"
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
                <span className="relative">{t}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          layout
          className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {shown.map((p, i) => (
              <motion.article
                key={p.name}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{
                  layout: { type: "spring", stiffness: 260, damping: 30 },
                  duration: 0.35,
                  delay: (i % 4) * 0.04,
                }}
                className="group flex flex-col gap-3"
              >
                <div className="relative aspect-square rounded-md bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                  <img
                    src={p.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                  />
                  {p.soldOut && (
                    <span className="absolute inset-0 bg-neutral-950/30 grid place-items-center text-white text-[11px] tracking-[0.25em] font-medium">
                      SOLD OUT
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm font-medium ${p.accent ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-900 dark:text-white"}`}
                >
                  {p.name}
                </p>
                <p
                  className={`text-xs tracking-wider ${p.soldOut ? "text-neutral-500 uppercase" : "text-neutral-700 dark:text-neutral-300"}`}
                >
                  {p.price}
                </p>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

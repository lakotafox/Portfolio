"use client";

import { useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { Check } from "lucide-react";

type Product = {
  name: string;
  category: "Outerwear" | "Knitwear" | "Accessories";
  price: number;
  compareAt?: number;
  badge?: string;
  sizes: string[];
};

const products: Product[] = [
  {
    name: "Transit Parka",
    category: "Outerwear",
    price: 310,
    badge: "New",
    sizes: ["S", "M", "L"],
  },
  {
    name: "Merino Rib Crew",
    category: "Knitwear",
    price: 148,
    sizes: ["S", "M", "L"],
  },
  {
    name: "Loop Sling",
    category: "Accessories",
    price: 86,
    sizes: ["One size"],
  },
  {
    name: "Quilted Field Vest",
    category: "Outerwear",
    price: 224,
    badge: "Low stock",
    sizes: ["S", "M", "L"],
  },
  {
    name: "Soft Collar Cardigan",
    category: "Knitwear",
    price: 192,
    compareAt: 240,
    badge: "Sale",
    sizes: ["S", "M", "L"],
  },
  {
    name: "Packable Cap",
    category: "Accessories",
    price: 46,
    sizes: ["One size"],
  },
];

const filters = ["All", "Outerwear", "Knitwear", "Accessories"] as const;

export default function Ecommerce9() {
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>("All");
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, string>>({});
  const prefersReducedMotion = useReducedMotion();

  const shown = useMemo(() => {
    if (activeFilter === "All") return products;
    return products.filter((product) => product.category === activeFilter);
  }, [activeFilter]);

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.08 },
    },
  };

  const grid: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.06 },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="w-full bg-white dark:bg-neutral-950 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="max-w-[1400px] mx-auto w-full"
      >
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-12">
          <motion.div variants={fadeUp} className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-tight text-neutral-900 dark:text-white text-balance">
              Layers for the in-between months
            </h2>
          </motion.div>
          <motion.p
            variants={fadeUp}
            className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400"
          >
            <span className="tabular-nums">{shown.length}</span> pieces · Free
            exchanges, always
          </motion.p>
        </div>

        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white ${
                activeFilter === filter
                  ? "text-white dark:text-neutral-900"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {activeFilter === filter && (
                <motion.span
                  layoutId="ecommerce9-filter"
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 rounded-full bg-neutral-900 dark:bg-white"
                />
              )}
              <span className="relative">{filter}</span>
            </button>
          ))}
        </motion.div>

        <motion.div
          variants={grid}
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10"
        >
          <AnimatePresence mode="popLayout">
            {shown.map((product) => (
              <motion.article
                key={product.name}
                layout
                variants={fadeUp}
                exit={{
                  opacity: 0,
                  y: prefersReducedMotion ? 0 : -8,
                  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
                }}
                transition={{
                  layout: {
                    duration: prefersReducedMotion ? 0 : 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
                onMouseEnter={() => setActiveCard(product.name)}
                onMouseLeave={() =>
                  setActiveCard((current) =>
                    current === product.name ? null : current,
                  )
                }
                onFocusCapture={() => setActiveCard(product.name)}
                onBlurCapture={(event) => {
                  if (
                    !event.currentTarget.contains(event.relatedTarget as Node)
                  ) {
                    setActiveCard((current) =>
                      current === product.name ? null : current,
                    );
                  }
                }}
                className="group"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
                  <img
                    src="/svg/placeholder.svg"
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                  {product.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 dark:bg-neutral-950/90 backdrop-blur px-2.5 py-1 text-[11px] font-medium tracking-wide text-neutral-700 dark:text-neutral-300">
                      {product.badge}
                    </span>
                  )}
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: activeCard === product.name ? 1 : 0,
                      y: activeCard === product.name ? 0 : 10,
                    }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.25,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      pointerEvents:
                        activeCard === product.name ? "auto" : "none",
                    }}
                    className="absolute inset-x-3 bottom-3"
                  >
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur p-1.5">
                      <p className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                        Quick add
                      </p>
                      <div
                        className={`grid gap-1.5 ${product.sizes.length > 1 ? "grid-cols-3" : "grid-cols-1"}`}
                      >
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() =>
                              setAdded((current) => ({
                                ...current,
                                [product.name]: size,
                              }))
                            }
                            aria-label={`Add ${product.name}, size ${size}, to bag`}
                            className="flex h-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
                          >
                            {added[product.name] === size ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              size
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-medium text-neutral-900 dark:text-white">
                      {product.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                      {product.category}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums text-neutral-900 dark:text-white">
                    {product.compareAt && (
                      <s className="mr-2 font-normal text-neutral-400 dark:text-neutral-500">
                        ${product.compareAt}
                      </s>
                    )}
                    ${product.price}
                  </p>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  );
}

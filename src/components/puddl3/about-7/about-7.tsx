"use client";

import { motion } from "motion/react";

const people = [
  {
    name: "Magdalena Ron",
    title: "Founder & CEO, Keystone",
    image:
      "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=600&q=80",
  },
  {
    name: "Martin Osei",
    title: "Head of Research, Meridian",
    image:
      "https://images.unsplash.com/photo-1624298357597-fd92dfbec01d?w=600&q=80",
  },
  {
    name: "Bob Dufort",
    title: "Head of Design, Northwind",
    image:
      "https://images.unsplash.com/photo-1623605931891-d5b95ee98459?w=600&q=80",
  },
  {
    name: "Clara Reichmann",
    title: "Partner, Atlas",
    image:
      "https://images.unsplash.com/photo-1605405748313-a416a1b84491?w=600&q=80",
  },
  {
    name: "Rhea Lindqvist",
    title: "VP Engineering, Fieldnotes",
    image:
      "https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=600&q=80",
  },
];

const institutions = ["acmecorp", "boltshift", "catalog"];

export default function About7() {
  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950 overflow-hidden">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8"
        >
          <div className="flex flex-col gap-3 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-neutral-900 dark:text-white tracking-tight leading-tight">
              Shaped by the operators who did the work
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
              An advisory circle of founders, researchers, and designers
              pressure-testing every decision we ship.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 sm:gap-8 lg:gap-10 opacity-60 dark:opacity-50 max-w-full">
            {institutions.map((logo) => (
              <img
                key={logo}
                src={`/mock-logos/${logo}.svg`}
                alt=""
                className="h-5 sm:h-6 lg:h-7 w-auto object-contain shrink-0"
              />
            ))}
          </div>
        </motion.div>

        <div className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
          {people.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              whileHover={{ y: -4 }}
              className="flex flex-col gap-4"
            >
              <div className="aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                <img
                  src={d.image}
                  alt={d.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                  {d.name}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-snug">
                  {d.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "motion/react";
import { Globe, TrendingUp, BarChart3, Zap } from "lucide-react";
import { useEffect, useRef } from "react";

export function Features3() {
  const marquee1Ref = useRef<HTMLDivElement>(null);
  const marquee2Ref = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: Globe,
      description: "Curated selection of premium properties",
    },
    {
      icon: TrendingUp,
      description: "Over 200 luxury properties available",
    },
    {
      icon: BarChart3,
      description: "Detailed listings with market analysis",
    },
    {
      icon: Zap,
      description: "New beautiful properties added weekly",
    },
  ];

  const images = [
    {
      name: "Modern House",
      url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop",
    },
    {
      name: "Luxury Apartment",
      url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop",
    },
    {
      name: "Penthouse",
      url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop",
    },
    {
      name: "Villa",
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
    },
    {
      name: "Mansion",
      url: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=2070&auto=format&fit=crop",
    },
    {
      name: "Estate",
      url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=2084&auto=format&fit=crop",
    },
  ];

  useEffect(() => {
    const marquee1 = marquee1Ref.current;
    const marquee2 = marquee2Ref.current;

    if (!marquee1 || !marquee2) return;

    let animation1: number;
    let progress1 = 0;
    let progress2 = 50;

    const animate = () => {
      progress1 += 0.03;
      if (progress1 >= 50) {
        progress1 = 0;
      }
      marquee1.style.transform = `translateY(-${progress1}%)`;

      progress2 -= 0.03;
      if (progress2 <= 0) {
        progress2 = 50;
      }
      marquee2.style.transform = `translateY(-${progress2}%)`;

      animation1 = requestAnimationFrame(animate);
    };

    animation1 = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animation1);
    };
  }, []);

  return (
    <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2 flex flex-col">
            <div className="mb-8 md:mb-12">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4"
              >
                Premium Properties
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-neutral-900 dark:text-white mb-6"
              >
                Invest in luxury real estate
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl"
              >
                Access exclusive investment opportunities in high-value
                properties across major cities, focusing on prime locations with
                proven returns.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-3 sm:gap-4"
                  >
                    <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-center shadow-lg">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-900 dark:text-white" />
                    </div>

                    <p className="text-xs max-w-[20ch] tracking-tighter sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1 relative h-[200px] lg:h-[700px]">
            <div className="grid grid-cols-2 gap-4 h-full relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-b from-white dark:from-neutral-950 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white dark:from-neutral-950 to-transparent" />
              </div>

              <div className="relative overflow-hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  ref={marquee1Ref}
                  className="flex flex-col gap-4"
                >
                  {[...images, ...images].map((image, index) => (
                    <div
                      key={`marquee1-${index}`}
                      className="w-full aspect-square rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover grayscale opacity-80 hover:opacity-100 transition-opacity duration-300"
                      />
                    </div>
                  ))}
                </motion.div>
              </div>

              <div className="relative overflow-hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  ref={marquee2Ref}
                  className="flex flex-col gap-4"
                >
                  {[...images, ...images].map((image, index) => (
                    <div
                      key={`marquee2-${index}`}
                      className="w-full aspect-square rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover grayscale opacity-80 hover:opacity-100 transition-opacity duration-300"
                      />
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features3;

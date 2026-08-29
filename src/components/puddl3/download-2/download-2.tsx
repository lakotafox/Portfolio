"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rating);
        const partial = !filled && star === Math.ceil(rating);
        const fillPercent = partial ? (rating % 1) * 100 : 0;

        return (
          <div key={star} className="relative w-6 h-6">
            <Star className="absolute inset-0 w-6 h-6 text-amber-400/20 dark:text-amber-400/30" />
            {filled && (
              <Star className="absolute inset-0 w-6 h-6 text-amber-400 fill-amber-400" />
            )}
            {partial && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercent}%` }}
              >
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StoreCard({
  store,
  rating,
  reviews,
  delay = 0,
}: {
  store: "appstore" | "playstore";
  rating: number;
  reviews: string;
  delay?: number;
}) {
  const storeName = store === "appstore" ? "App Store" : "Google Play";
  const storeLabel = store === "appstore" ? "Download on the" : "GET IT ON";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-5xl sm:text-6xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            {rating}
          </span>
          <span className="text-2xl text-neutral-400 dark:text-neutral-600 font-light">
            / 5
          </span>
        </div>

        <StarRating rating={rating} />

        <span className="text-sm text-neutral-500 dark:text-neutral-500">
          Based on {reviews} reviews
        </span>
      </div>

      <motion.a
        href="#"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full sm:w-auto"
      >
        <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-md px-5 py-3.5 flex items-center justify-center sm:justify-start gap-3 cursor-pointer hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
          {store === "appstore" ? (
            <svg
              className="w-7 h-7"
              fill="currentColor"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.7,31C10.7,31,10.7,31,10.7,31c-2.6,0-4.4-2.3-5.7-4.3c-3.3-5.1-4-11.5-1.6-15.2c1.6-2.5,4.2-4,6.7-4 c1.3,0,2.4,0.4,3.3,0.7c0.7,0.3,1.4,0.5,2.1,0.5c0.6,0,1.1-0.2,1.8-0.5c0.9-0.3,2-0.7,3.5-0.7c2.2,0,4.5,1.2,6.1,3.2 c0.2,0.2,0.3,0.5,0.2,0.8c-0.1,0.3-0.2,0.5-0.5,0.7c-1.8,1-2.8,2.8-2.6,4.8c0.1,2.1,1.4,3.8,3.3,4.5c0.3,0.1,0.5,0.3,0.6,0.6 c0.1,0.3,0.1,0.5,0,0.8c-0.7,1.5-1,2.2-1.9,3.5c-1.5,2.2-3.3,4.5-5.7,4.5c-1.1,0-1.8-0.3-2.4-0.6c-0.6-0.3-1.2-0.6-2.4-0.6 c-1.1,0-1.7,0.3-2.4,0.6C12.5,30.7,11.8,31,10.7,31z" />
              <path d="M14.7,7.7c-0.1,0-0.1,0-0.2,0c-0.5,0-0.9-0.4-1-0.8c-0.3-1.7,0.3-3.7,1.6-5.3c1.2-1.5,3.2-2.5,5-2.7c0.5,0,1,0.3,1.1,0.9 c0.3,1.8-0.3,3.7-1.6,5.3l0,0C18.5,6.7,16.5,7.7,14.7,7.7z" />
            </svg>
          ) : (
            <svg
              className="w-7 h-7"
              fill="currentColor"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17,14.5l4.2-4.5L4.9,1.2C4.8,1.1,4.6,1.1,4.3,1L17,14.5z" />
              <path d="M23,21l5.9-3.2c0.7-0.4,1.1-1,1.1-1.8s-0.4-1.5-1.1-1.8L23,11l-4.7,5L23,21z" />
              <path d="M2.4,1.9C2.1,2.2,2,2.6,2,3V29c0,0.4,0.1,0.8,0.4,1.2L15.6,16L2.4,1.9z" />
              <path d="M17,17.5L4.3,31c0.2,0,0.4-0.1,0.6-0.2L21.2,22L17,17.5z" />
            </svg>
          )}
          <div className="flex flex-col">
            <span className="text-[10px] leading-tight opacity-70">
              {storeLabel}
            </span>
            <span className="text-base font-medium leading-tight">
              {storeName}
            </span>
          </div>
        </div>
      </motion.a>
    </motion.div>
  );
}

export function Download2() {
  return (
    <section
      className="w-full py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950"
      aria-label="Download app"
    >
      <div className="max-w-[800px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight text-neutral-900 dark:text-white uppercase leading-[1.1] mb-5">
            Download the top-rated
            <br />
            productivity app
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            Rating as of December 2025
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <StoreCard store="appstore" rating={4.6} reviews="21K" delay={0.1} />
          <StoreCard store="playstore" rating={4.7} reviews="23K" delay={0.2} />
        </div>
      </div>
    </section>
  );
}

export default Download2;

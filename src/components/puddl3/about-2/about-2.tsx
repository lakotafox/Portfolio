"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TimelineEntry {
  id: number;
  title: string;
  date: string;
  month: string;
  year: string;
  description: string;
  image: string;
}

interface About2Props {
  displayNavigation?: boolean;
}

const TIMELINE_DATA: TimelineEntry[] = [
  {
    id: 1,
    title: "Beta Launch",
    date: "Jan 2020",
    month: "Jan",
    year: "2020",
    description:
      "Released our first AI code assistant with intelligent suggestions and automated refactoring for developers.",
    image: "/svg/placeholder.svg",
  },
  {
    id: 2,
    title: "GPT Integration",
    date: "Aug 2021",
    month: "Aug",
    year: "2021",
    description:
      "Integrated GPT-3 for natural language code generation, boosting developer productivity across all languages.",
    image: "/svg/placeholder.svg",
  },
  {
    id: 3,
    title: "Team Edition",
    date: "Mar 2022",
    month: "Mar",
    year: "2022",
    description:
      "Launched Team Edition with collaborative features and analytics to help engineering teams scale.",
    image: "/svg/placeholder.svg",
  },
  {
    id: 4,
    title: "Code Security",
    date: "Oct 2022",
    month: "Oct",
    year: "2022",
    description:
      "Introduced AI-powered security scanning that detects vulnerabilities in real-time.",
    image: "/svg/placeholder.svg",
  },
  {
    id: 5,
    title: "Mobile SDK",
    date: "Apr 2023",
    month: "Apr",
    year: "2023",
    description:
      "Released mobile SDK for iOS and Android with platform-specific AI optimizations.",
    image: "/svg/placeholder.svg",
  },
  {
    id: 6,
    title: "Enterprise",
    date: "Nov 2023",
    month: "Nov",
    year: "2023",
    description:
      "Launched Enterprise tier with on-premise deployment and custom model training.",
    image: "/svg/placeholder.svg",
  },
];

export default function About2({ displayNavigation = true }: About2Props = {}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % TIMELINE_DATA.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [resetKey]);

  const scrollToIndex = (index: number) => {
    if (timelineRef.current) {
      const container = timelineRef.current;
      const itemWidth = container.scrollWidth / TIMELINE_DATA.length;
      const scrollPosition = itemWidth * index;
      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  };

  const handlePrevious = () => {
    const newIndex = Math.max(0, activeIndex - 1);
    setActiveIndex(newIndex);
    scrollToIndex(newIndex);
    setResetKey((prev) => prev + 1);
  };

  const handleNext = () => {
    const newIndex = Math.min(TIMELINE_DATA.length - 1, activeIndex + 1);
    setActiveIndex(newIndex);
    scrollToIndex(newIndex);
    setResetKey((prev) => prev + 1);
  };

  const handleIndexChange = (index: number) => {
    setActiveIndex(index);
    scrollToIndex(index);
    setResetKey((prev) => prev + 1);
  };

  const activeEntry = TIMELINE_DATA[activeIndex];

  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <Header />

        <ContentCard entry={activeEntry} />

        <div className="mt-12 sm:mt-16">
          <Timeline
            activeIndex={activeIndex}
            onIndexChange={handleIndexChange}
            displayNavigation={displayNavigation}
            onPrevious={handlePrevious}
            onNext={handleNext}
            timelineRef={timelineRef}
          />
        </div>
      </div>
    </section>
  );
}

function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 sm:mb-12"
    >
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white">
        Our journey in AI
      </h1>
    </motion.div>
  );
}

function ContentCard({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="relative bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-6 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="flex flex-col justify-between h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={`year-${entry.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-sm sm:text-base font-medium text-purple-500">
                {entry.year}
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${entry.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white">
                {entry.title}
              </h2>

              <p className="text-base tracking-tight text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                {entry.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <AnimatePresence mode="wait">
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative w-full lg:max-w-xs aspect-square max-h-[300px] mx-auto lg:mx-0 lg:ml-auto"
            >
              <div className="w-full h-full rounded-md bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                <img
                  src={entry.image}
                  alt={entry.title}
                  className="w-3/4 h-3/4 object-contain"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Timeline({
  activeIndex,
  onIndexChange,
  displayNavigation,
  onPrevious,
  onNext,
  timelineRef,
}: {
  activeIndex: number;
  onIndexChange: (index: number) => void;
  displayNavigation: boolean;
  onPrevious: () => void;
  onNext: () => void;
  timelineRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="space-y-8">
      <div
        ref={timelineRef}
        className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="min-w-[900px] space-y-8">
          <div className="grid grid-cols-6 gap-8">
            {TIMELINE_DATA.map((entry, index) => (
              <button
                key={entry.id}
                onClick={() => onIndexChange(index)}
                className="text-left whitespace-nowrap"
              >
                <div
                  className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
                    index === activeIndex
                      ? "text-neutral-900 dark:text-white"
                      : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  {entry.title}
                </div>
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-800 -translate-y-1/2" />

            <motion.div
              className="absolute top-1/2 left-0 h-0.5 bg-neutral-900 dark:bg-white -translate-y-1/2"
              initial={false}
              animate={{
                width:
                  activeIndex === 0
                    ? 0
                    : `calc(((100% - (5 * 2rem)) / 6) * ${activeIndex} + (2rem * ${activeIndex}))`,
              }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            />

            <div className="relative grid grid-cols-6 gap-8">
              {TIMELINE_DATA.map((entry, index) => {
                const isActive = index === activeIndex;
                const isPassed = index <= activeIndex;

                return (
                  <button
                    key={entry.id}
                    onClick={() => onIndexChange(index)}
                    className="flex flex-col items-start"
                  >
                    <div className="relative w-full flex justify-start">
                      <motion.div
                        className={`w-3 h-3 rounded-full border-2 transition-colors duration-200 ${
                          isPassed
                            ? "bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white"
                            : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                        }`}
                        animate={{
                          scale: isActive ? 1.4 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-6 gap-8">
            {TIMELINE_DATA.map((entry, index) => (
              <button
                key={entry.id}
                onClick={() => onIndexChange(index)}
                className="text-left whitespace-nowrap"
              >
                <div
                  className={`text-xs sm:text-sm transition-colors duration-200 ${
                    index === activeIndex
                      ? "text-neutral-900 dark:text-white font-medium"
                      : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  {entry.date}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {displayNavigation && (
        <div className="flex justify-center gap-2 md:hidden">
          <button
            onClick={onPrevious}
            disabled={activeIndex === 0}
            className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-900 dark:text-white" />
          </button>
          <button
            onClick={onNext}
            disabled={activeIndex === TIMELINE_DATA.length - 1}
            className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-neutral-900 dark:text-white" />
          </button>
        </div>
      )}

      <div className="hidden md:block space-y-8">
        <div className="grid grid-cols-6 gap-2 sm:gap-4">
          {TIMELINE_DATA.map((entry, index) => (
            <button
              key={entry.id}
              onClick={() => onIndexChange(index)}
              className="text-left"
            >
              <div
                className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
                  index === activeIndex
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-400 dark:text-neutral-600"
                }`}
              >
                {entry.title}
              </div>
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-800 -translate-y-1/2" />

          <motion.div
            className="absolute top-1/2 left-0 h-0.5 bg-neutral-900 dark:bg-white -translate-y-1/2 sm:hidden"
            initial={false}
            animate={{
              width:
                activeIndex === 0
                  ? 0
                  : `calc(((100% - (5 * 0.5rem)) / 6) * ${activeIndex} + (0.5rem * ${activeIndex}))`,
            }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />

          <motion.div
            className="hidden sm:block absolute top-1/2 left-0 h-0.5 bg-neutral-900 dark:bg-white -translate-y-1/2"
            initial={false}
            animate={{
              width:
                activeIndex === 0
                  ? 0
                  : `calc(((100% - (5 * 1rem)) / 6) * ${activeIndex} + (1rem * ${activeIndex}))`,
            }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />

          <div className="relative grid grid-cols-6 gap-2 sm:gap-4">
            {TIMELINE_DATA.map((entry, index) => {
              const isActive = index === activeIndex;
              const isPassed = index <= activeIndex;

              return (
                <button
                  key={entry.id}
                  onClick={() => onIndexChange(index)}
                  className="flex flex-col items-start"
                >
                  <div className="relative w-full flex justify-start">
                    <motion.div
                      className={`w-3 h-3 rounded-full border-2 transition-colors duration-200 ${
                        isPassed
                          ? "bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white"
                          : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                      }`}
                      animate={{
                        scale: isActive ? 1.4 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-4">
          {TIMELINE_DATA.map((entry, index) => (
            <button
              key={entry.id}
              onClick={() => onIndexChange(index)}
              className="text-left"
            >
              <div
                className={`text-xs border transition-colors w-fit px-2 py-1 rounded-full duration-200 ${
                  index === activeIndex
                    ? "text-white bg-neutral-900 border-neutral-500/20"
                    : "text-neutral-400 dark:text-neutral-600 border-transparent"
                }`}
              >
                {entry.date}
              </div>
            </button>
          ))}
        </div>

        {displayNavigation && (
          <div className="hidden md:flex justify-end gap-2">
            <button
              onClick={onPrevious}
              disabled={activeIndex === 0}
              className="w-8 h-8 rounded-md border border-neutral-300 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-900 dark:text-white" />
            </button>
            <button
              onClick={onNext}
              disabled={activeIndex === TIMELINE_DATA.length - 1}
              className="w-8 h-8 rounded-md border border-neutral-300 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 text-neutral-900 dark:text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

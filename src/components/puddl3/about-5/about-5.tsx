"use client";

import { useEffect, useRef } from "react";

interface ContentItem {
  id: number;
  type: "image" | "text";
  content: string;
  row: 1 | 2;
  size: "small" | "medium" | "large";
}

const CONTENT_ITEMS: ContentItem[] = [
  {
    id: 1,
    type: "image",
    content:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    row: 1,
    size: "large",
  },
  {
    id: 2,
    type: "image",
    content:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    row: 1,
    size: "medium",
  },
  {
    id: 3,
    type: "image",
    content:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
    row: 1,
    size: "large",
  },
  {
    id: 4,
    type: "image",
    content:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
    row: 1,
    size: "small",
  },
  {
    id: 5,
    type: "image",
    content:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
    row: 2,
    size: "medium",
  },
  {
    id: 6,
    type: "text",
    content: "We have a world-class team working to make this a reality.",
    row: 2,
    size: "large",
  },
  {
    id: 7,
    type: "image",
    content:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
    row: 2,
    size: "medium",
  },
  {
    id: 8,
    type: "image",
    content:
      "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&q=80",
    row: 2,
    size: "medium",
  },
];

const SIZES = {
  small: { width: "320px", height: "200px" },
  medium: { width: "480px", height: "200px" },
  large: { width: "640px", height: "200px" },
};

function ImageCard({ item }: { item: ContentItem }) {
  const dimensions = SIZES[item.size];
  return (
    <div
      className="flex-shrink-0 rounded-[2.5rem] overflow-hidden shadow-2xl bg-neutral-200 dark:bg-neutral-800"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <img
        src={item.content}
        alt="Team"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function TextCard({ item }: { item: ContentItem }) {
  const dimensions = SIZES[item.size];
  return (
    <div
      className="flex-shrink-0 rounded-[2.5rem] bg-neutral-100 dark:bg-neutral-900 shadow-2xl flex items-center justify-center px-12"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <h3 className="text-4xl lg:text-5xl font-light tracking-tight text-neutral-900 dark:text-white text-center leading-tight">
        {item.content}
      </h3>
    </div>
  );
}

export default function About5() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initLenis = async () => {
      const Lenis = (await import("lenis")).default;

      const lenis = new Lenis({
        wrapper: containerRef.current!,
        content: containerRef.current!.querySelector(
          ".scroll-content",
        ) as HTMLElement,
        orientation: "horizontal",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: true,
      });

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      return () => {
        lenis.destroy();
      };
    };

    const cleanup = initLenis();
    return () => {
      cleanup.then((fn) => fn && fn());
    };
  }, []);

  const row1Items = CONTENT_ITEMS.filter((item) => item.row === 1);
  const row2Items = CONTENT_ITEMS.filter((item) => item.row === 2);

  const duplicatedRow1 = [
    ...row1Items,
    ...row1Items,
    ...row1Items,
    ...row1Items,
    ...row1Items,
    ...row1Items,
    ...row1Items,
    ...row1Items,
    ...row1Items,
    ...row1Items,
  ];
  const duplicatedRow2 = [
    ...row2Items,
    ...row2Items,
    ...row2Items,
    ...row2Items,
    ...row2Items,
    ...row2Items,
    ...row2Items,
    ...row2Items,
    ...row2Items,
    ...row2Items,
  ];

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden"
    >
      <div className="scroll-content h-full flex flex-col justify-center gap-8 py-12">
        <div className="row-1 flex gap-8 pl-8 ml-0">
          {duplicatedRow1.map((item, index) =>
            item.type === "image" ? (
              <ImageCard key={`${item.id}-${index}`} item={item} />
            ) : (
              <TextCard key={`${item.id}-${index}`} item={item} />
            ),
          )}
        </div>

        <div className="row-2 flex gap-8 pl-8 ml-32">
          {duplicatedRow2.map((item, index) =>
            item.type === "image" ? (
              <ImageCard key={`${item.id}-${index}`} item={item} />
            ) : (
              <TextCard key={`${item.id}-${index}`} item={item} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

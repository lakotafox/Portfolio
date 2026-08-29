"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, type PanInfo, type Transition } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./slant-reel.css";

export interface SlantReelItem {
  /** Image source */
  src: string;
  /** Caption rendered over the focused slide */
  title: string;
  /** Alt text, defaults to the title */
  alt?: string;
}

export interface SlantReelProps {
  /** Slides rendered by the carousel */
  items?: SlantReelItem[];
  /** Slide focused on mount */
  initialIndex?: number;
  /** Slide width in pixels */
  cardWidth?: number;
  /** Aspect ratio of each slide */
  aspectRatio?: string;
  /** Degrees each slide turns per step away from the focused one */
  rotation?: number;
  /** Scale applied to every unfocused slide */
  inactiveScale?: number;
  /** Perspective depth applied to each slide in pixels */
  perspective?: number;
  /** Corner radius of the slides in pixels */
  borderRadius?: number;
  /** Blur applied to unfocused captions in pixels */
  titleBlur?: number;
  /** Multiplier for the transition duration */
  speed?: number;
  /** Render the caption over the focused slide */
  showTitles?: boolean;
  /** Show the previous and next buttons */
  showControls?: boolean;
  /** Show the segmented progress rail */
  showDots?: boolean;
  /** Wrap around at either end */
  loop?: boolean;
  /** Advance on a timer */
  autoplay?: boolean;
  /** Delay between automatic advances in milliseconds */
  autoplayDelay?: number;
  /** Allow dragging across the strip to navigate */
  enableDrag?: boolean;
  /** Allow arrow keys to navigate when focused */
  enableKeyboard?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Fired whenever the focused slide changes */
  onIndexChange?: (index: number) => void;
}

const DEFAULT_ITEMS: SlantReelItem[] = [
  {
    src: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?q=80&w=500&auto=format&fit=crop",
    title: "Vanishing Point",
  },
  {
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop",
    title: "Glass and Gravity",
  },
  {
    src: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=500&auto=format&fit=crop",
    title: "Cut From the Sky",
  },
  {
    src: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?q=80&w=500&auto=format&fit=crop",
    title: "Stacked in White",
  },
  {
    src: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=500&auto=format&fit=crop",
    title: "The Long Curve",
  },
  {
    src: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=500&auto=format&fit=crop",
    title: "Quiet Lines",
  },
  {
    src: "https://images.unsplash.com/photo-1470075801209-17f9ec0cada6?q=80&w=500&auto=format&fit=crop",
    title: "Cobalt Facade",
  },
  {
    src: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=500&auto=format&fit=crop",
    title: "Concrete Chorus",
  },
  {
    src: "https://images.unsplash.com/photo-1470723710355-95304d8aece4?q=80&w=500&auto=format&fit=crop",
    title: "City in Motion",
  },
  {
    src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=500&auto=format&fit=crop",
    title: "Water and Stone",
  },
];

const FLICK_DISTANCE = 45;
const FLICK_WEIGHT = 0.08;

const settle = (value: number, count: number, wrap: boolean) => {
  if (count < 1) return 0;
  if (wrap) return ((value % count) + count) % count;
  return value < 0 ? 0 : value > count - 1 ? count - 1 : value;
};

const spring = (
  bounce: number,
  seconds: number,
  speed: number,
): Transition => ({
  type: "spring",
  bounce,
  duration: seconds * speed,
});

interface SlideProps {
  item: SlantReelItem;
  offset: number;
  focused: boolean;
  width: number;
  aspectRatio: string;
  rotation: number;
  scale: number;
  perspective: number;
  radius: number;
  blur: number;
  captioned: boolean;
  transition: Transition;
  onPick: () => void;
}

const Slide = ({
  item,
  offset,
  focused,
  width,
  aspectRatio,
  rotation,
  scale,
  perspective,
  radius,
  blur,
  captioned,
  transition,
  onPick,
}: SlideProps) => (
  <div style={{ perspective }}>
    <motion.div
      className="slant-reel-slide"
      style={{ width, aspectRatio }}
      animate={{ rotateY: offset * -rotation, scale: focused ? 1 : scale }}
      transition={transition}
    >
      <button
        type="button"
        onClick={onPick}
        tabIndex={focused ? 0 : -1}
        aria-label={item.title}
        aria-current={focused}
        style={{ borderRadius: radius }}
        className="slant-reel-frame"
      >
        <img
          src={item.src}
          alt={item.alt ?? item.title}
          draggable={false}
          className="slant-reel-image"
        />

        {captioned && (
          <>
            <motion.span
              aria-hidden
              className="slant-reel-scrim"
              animate={{ opacity: focused ? 1 : 0 }}
              transition={transition}
            />
            <motion.span
              aria-hidden={!focused}
              className="slant-reel-title"
              animate={{
                opacity: focused ? 1 : 0,
                filter: `blur(${focused ? 0 : blur}px)`,
                y: focused ? 0 : 10,
              }}
              transition={transition}
            >
              {item.title}
            </motion.span>
          </>
        )}
      </button>
    </motion.div>
  </div>
);

interface RailProps {
  items: SlantReelItem[];
  current: number;
  token: string;
  transition: Transition;
  onPick: (index: number) => void;
}

const Rail = ({ items, current, token, transition, onPick }: RailProps) => (
  <div className="slant-reel-rail">
    {items.map((item, index) => (
      <button
        key={`rail-${item.src}-${index}`}
        type="button"
        onClick={() => onPick(index)}
        aria-label={`Show ${item.title}`}
        aria-current={index === current}
        className="slant-reel-segment"
      >
        {index === current && (
          <motion.span
            layoutId={token}
            className="slant-reel-indicator"
            transition={transition}
          />
        )}
      </button>
    ))}
  </div>
);

const Arrow = ({
  side,
  disabled,
  onPress,
}: {
  side: "prev" | "next";
  disabled: boolean;
  onPress: () => void;
}) => {
  const Glyph = side === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={side === "prev" ? "Previous slide" : "Next slide"}
      className="slant-reel-arrow"
    >
      <Glyph size={16} strokeWidth={2.25} />
    </button>
  );
};

const SlantReel: React.FC<SlantReelProps> = ({
  items = DEFAULT_ITEMS,
  initialIndex = 3,
  cardWidth = 200,
  aspectRatio = "3 / 4",
  rotation = 60,
  inactiveScale = 0.85,
  perspective = 800,
  borderRadius = 8,
  titleBlur = 2,
  speed = 1,
  showTitles = true,
  showControls = true,
  showDots = true,
  loop = false,
  autoplay = false,
  autoplayDelay = 3000,
  enableDrag = true,
  enableKeyboard = true,
  className,
  onIndexChange,
}) => {
  const count = items.length;
  const token = useId();
  const [focused, setFocused] = useState(() =>
    settle(initialIndex, count, false),
  );
  const report = useRef(onIndexChange);

  useEffect(() => {
    report.current = onIndexChange;
  }, [onIndexChange]);

  useEffect(() => {
    report.current?.(focused);
  }, [focused]);

  const focusSlide = useCallback(
    (index: number) => setFocused(settle(index, count, loop)),
    [count, loop],
  );

  const step = useCallback(
    (delta: number) => setFocused((from) => settle(from + delta, count, loop)),
    [count, loop],
  );

  useEffect(() => {
    if (!autoplay || count <= 1) return;
    const tick = window.setInterval(
      () =>
        setFocused((from) =>
          from + 1 >= count && !loop ? from : settle(from + 1, count, loop),
        ),
      Math.max(autoplayDelay, 400),
    );
    return () => window.clearInterval(tick);
  }, [autoplay, autoplayDelay, count, loop]);

  const motions = useMemo(
    () => ({
      strip: spring(0.2, 0.8, speed),
      card: spring(0.1, 1, speed),
      rail: spring(0.25, 0.5, speed),
    }),
    [speed],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enableKeyboard) return;
    const delta =
      event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (!delta) return;
    event.preventDefault();
    step(delta);
  };

  const onPanEnd = (_: unknown, info: PanInfo) => {
    const thrown = info.offset.x + info.velocity.x * FLICK_WEIGHT;
    if (Math.abs(thrown) < FLICK_DISTANCE) return;
    step(thrown < 0 ? 1 : -1);
  };

  const head = !loop && focused === 0;
  const tail = !loop && focused >= count - 1;

  return (
    <div
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label="Image carousel"
      onKeyDown={onKeyDown}
      className={["slant-reel", className].filter(Boolean).join(" ")}
    >
      <div style={{ width: cardWidth }}>
        <motion.div
          className="slant-reel-track"
          animate={{ x: -focused * cardWidth }}
          transition={motions.strip}
          onPanEnd={enableDrag ? onPanEnd : undefined}
        >
          {items.map((item, index) => (
            <Slide
              key={`${item.src}-${index}`}
              item={item}
              offset={index - focused}
              focused={index === focused}
              width={cardWidth}
              aspectRatio={aspectRatio}
              rotation={rotation}
              scale={inactiveScale}
              perspective={perspective}
              radius={borderRadius}
              blur={titleBlur}
              captioned={showTitles}
              transition={motions.card}
              onPick={() => focusSlide(index)}
            />
          ))}
        </motion.div>
      </div>

      {(showControls || showDots) && (
        <div className="slant-reel-controls">
          {showControls && (
            <Arrow side="prev" disabled={head} onPress={() => step(-1)} />
          )}
          {showDots && (
            <Rail
              items={items}
              current={focused}
              token={token}
              transition={motions.rail}
              onPick={focusSlide}
            />
          )}
          {showControls && (
            <Arrow side="next" disabled={tail} onPress={() => step(1)} />
          )}
        </div>
      )}
    </div>
  );
};

export default SlantReel;

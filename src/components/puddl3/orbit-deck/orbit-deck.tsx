"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import "./orbit-deck.css";

export interface Card {
  /** Unique identifier for the card */
  id: string | number;
  /** Card content - can be any React node */
  content: React.ReactNode;
  /** Optional background color for the card */
  background?: string;
  /** Optional image URL for preloading */
  image?: string;
}

export interface OrbitDeckProps {
  /** Array of cards to display in the rotating circle */
  cards: Card[];
  /** Radius of the circle in pixels */
  radius?: number;
  /** Duration of one full rotation in seconds */
  duration?: number;
  /** Card width in pixels */
  cardWidth?: number;
  /** Card height in pixels */
  cardHeight?: number;
  /** Pause rotation on hover */
  pauseOnHover?: boolean;
  /** Reverse rotation direction */
  reverse?: boolean;
  /** Enable drag to rotate */
  draggable?: boolean;
  /** Auto-play rotation animation */
  autoPlay?: boolean;
  /** Callback when a card is clicked */
  onCardClick?: (card: Card, index: number) => void;
  /** Enable mouse wheel to control rotation */
  mouseWheel?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for individual cards */
  cardClassName?: string;
  /** Initial rotation offset in degrees */
  initialRotation?: number;
}

const OrbitDeck: React.FC<OrbitDeckProps> = ({
  cards,
  radius = 360,
  duration = 20,
  cardWidth = 160,
  cardHeight = 190,
  pauseOnHover = true,
  reverse = false,
  draggable = false,
  autoPlay = true,
  onCardClick,
  mouseWheel = false,
  className = "",
  cardClassName = "",
  initialRotation = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const cardsKey = useMemo(() => cards.map((c) => c.id).join(","), [cards]);
  const hasImages = cards.some((card) => card.image);
  const [loaded, setLoaded] = useState({ key: cardsKey, value: !hasImages });

  if (loaded.key !== cardsKey) {
    setLoaded({ key: cardsKey, value: !hasImages });
  }

  const isLoaded = loaded.value;

  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(initialRotation);
  const lastTimeRef = useRef<number | null>(null);
  const dragStartAngleRef = useRef(0);
  const dragStartRotationRef = useRef(0);

  const rotation = useMotionValue(initialRotation);
  const smoothRotation = useSpring(rotation, {
    damping: 30,
    stiffness: 200,
    mass: 0.5,
  });

  const cardPositions = useMemo(() => {
    const totalCards = cards.length;
    const angleStep = (2 * Math.PI) / totalCards;

    return cards.map((_, index) => {
      const angle = angleStep * index + (initialRotation * Math.PI) / 180;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      return {
        x,
        y,
        angle: (angle * 180) / Math.PI,
      };
    });
  }, [cards, radius, initialRotation]);

  useEffect(() => {
    let cancelled = false;

    const preloadImages = async () => {
      const imagePromises = cards
        .filter((card) => card.image)
        .map((card) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = card.image!;
            img.onload = resolve;
            img.onerror = reject;
          });
        });

      try {
        await Promise.all(imagePromises);
        if (!cancelled) {
          setLoaded({ key: cardsKey, value: true });
        }
      } catch (error) {
        console.error("Failed to load images", error);
        if (!cancelled) {
          setLoaded({ key: cardsKey, value: true });
        }
      }
    };

    if (cards.some((card) => card.image)) {
      preloadImages();
    }

    return () => {
      cancelled = true;
    };
  }, [cards, cardsKey]);

  useEffect(() => {
    let animationFrameId: number;
    lastTimeRef.current = null;

    const animate = (time: number) => {
      if (
        lastTimeRef.current !== null &&
        !isHovered &&
        !isDragging &&
        autoPlay &&
        isLoaded
      ) {
        const deltaTime = (time - lastTimeRef.current) / 1000;
        const degreesPerSecond = 360 / duration;
        const rotationDelta = degreesPerSecond * deltaTime * (reverse ? -1 : 1);

        rotationRef.current += rotationDelta;
        rotation.set(rotationRef.current);
      }

      lastTimeRef.current = time;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [duration, reverse, isHovered, isDragging, autoPlay, rotation, isLoaded]);

  const getAngleFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return 0;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const angle = Math.atan2(clientY - centerY, clientX - centerX);
      return (angle * 180) / Math.PI;
    },
    [],
  );

  const handleDragStart = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent) => {
      setIsDragging(true);
      const clientX =
        "clientX" in event
          ? event.clientX
          : (event as TouchEvent).touches[0].clientX;
      const clientY =
        "clientY" in event
          ? event.clientY
          : (event as TouchEvent).touches[0].clientY;

      dragStartAngleRef.current = getAngleFromPointer(clientX, clientY);
      dragStartRotationRef.current = rotationRef.current;
    },
    [getAngleFromPointer],
  );

  const handleDrag = useCallback(
    (
      event: MouseEvent | TouchEvent | PointerEvent,
      info: { point: { x: number; y: number } },
    ) => {
      if (!isDragging) return;

      const currentAngle = getAngleFromPointer(info.point.x, info.point.y);
      const angleDelta = currentAngle - dragStartAngleRef.current;
      const newRotation = dragStartRotationRef.current + angleDelta;

      rotationRef.current = newRotation;
      rotation.set(newRotation);
    },
    [isDragging, getAngleFromPointer, rotation],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!mouseWheel || !containerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.5;
      rotationRef.current += delta * (reverse ? -1 : 1);
      rotation.set(rotationRef.current);
    };

    const container = containerRef.current;
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [mouseWheel, reverse, rotation]);

  const handleCardClick = useCallback(
    (card: Card, index: number) => {
      if (onCardClick) {
        onCardClick(card, index);
      }
    },
    [onCardClick],
  );

  return (
    <div
      ref={containerRef}
      className={`orbit-deck-container ${className}`}
      style={{
        width: `${radius * 2 + cardWidth}px`,
        height: `${radius * 2 + cardHeight}px`,
      }}
    >
      <motion.div
        key={cards.length}
        className="orbit-deck-wrapper"
        style={{
          rotate: smoothRotation,
          willChange: "transform",
        }}
        drag={draggable}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {cards.map((card, index) => {
          const position = cardPositions[index];

          return (
            <motion.div
              key={`${card.id}-${cards.length}`}
              className={`rotating-card ${cardClassName}`}
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                left: "50%",
                top: "50%",
                x: position.x,
                y: position.y,
                marginLeft: `-${cardWidth / 2}px`,
                marginTop: `-${cardHeight / 2}px`,
                background:
                  card.background ||
                  (card.image
                    ? `url(${card.image}) center/cover`
                    : undefined) ||
                  "rgba(255, 255, 255, 0.1)",
                willChange: "transform",
                rotate: position.angle + 90,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: isLoaded ? 1 : 0,
                scale: isLoaded ? 1 : 0,
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: "easeOut",
              }}
              onMouseEnter={() => pauseOnHover && setIsHovered(true)}
              onMouseLeave={() => pauseOnHover && setIsHovered(false)}
              onClick={() => handleCardClick(card, index)}
              whileHover={
                pauseOnHover
                  ? {
                      scale: 1.05,
                      transition: { duration: 0.2 },
                    }
                  : undefined
              }
            >
              <div className="rotating-card-content">{card.content}</div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

OrbitDeck.displayName = "OrbitDeck";

export default OrbitDeck;

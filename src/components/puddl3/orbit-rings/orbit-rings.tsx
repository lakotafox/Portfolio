"use client";

import React, { useMemo } from "react";
import "./orbit-rings.css";

export interface OrbitRingsProps {
  /** Array of rows, where each row is an array of image URLs */
  rows?: string[][];
  /** Size of each circle/image in pixels */
  circleSize?: number;
  /** Base radius for the first orbit in pixels */
  baseRadius?: number;
  /** Gap between each orbit ring in pixels */
  orbitGap?: number;
  /** Duration of one complete rotation in seconds */
  rotationDuration?: number;
  /** Delay between each row's animation start in seconds */
  rowDelay?: number;
  /** Direction of rotation */
  direction?: "clockwise" | "counterclockwise";
  /** Alternate direction for each row */
  alternateDirection?: boolean;
  /** Fade mode for rows - 'in' fades from outside to inside, 'out' fades from inside to outside */
  fadeMode?: "in" | "out" | "none";
  /** Apply incremental blur along with fade */
  fadeBlur?: boolean;
  /** Show dashed orbital paths */
  showPaths?: boolean;
  /** Enable entrance animation on mount */
  animate?: boolean;
  /** Duration of entrance animation in seconds */
  animationDuration?: number;
  /** Stagger delay between each row's entrance in seconds */
  animationStagger?: number;
  /** Scale factor for each additional row - negative values shrink outer rows, positive values grow them */
  staggerScaleFactor?: number;
  /** Additional CSS classes for the container */
  className?: string;
}

const OrbitRings: React.FC<OrbitRingsProps> = ({
  rows = [
    [
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    ],
  ],
  circleSize = 64,
  baseRadius = 120,
  orbitGap = 100,
  rotationDuration = 20,
  rowDelay = 0.5,
  direction = "clockwise",
  alternateDirection = false,
  fadeMode = "none",
  fadeBlur = false,
  showPaths = true,
  animate = true,
  animationDuration = 0.6,
  animationStagger = 0.15,
  staggerScaleFactor = 0,
  className,
}) => {
  const stableRows = useMemo(() => {
    return rows.map((row) => [...row]);
  }, [rows]);

  const maxRadius = baseRadius + (stableRows.length - 1) * orbitGap;
  const containerSize = (maxRadius + circleSize) * 2;

  return (
    <div
      className={`orbit-rings-container ${className || ""}`}
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        animation: animate
          ? "orbit-rings-container-fade-in 0.8s ease-out"
          : undefined,
      }}
    >
      <div className="orbit-rings-wrapper">
        {showPaths && (
          <svg
            className="orbit-rings-paths"
            style={{
              width: `${containerSize}px`,
              height: `${containerSize}px`,
            }}
          >
            {stableRows.map((_, rowIndex) => {
              const radius = baseRadius + rowIndex * orbitGap;
              return (
                <circle
                  key={rowIndex}
                  cx="50%"
                  cy="50%"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  className="orbit-rings-path-ring"
                  style={{
                    opacity: 0.5,
                    animation: animate
                      ? `orbit-rings-path-entrance ${animationDuration}s ease-out ${rowIndex * animationStagger}s backwards`
                      : undefined,
                  }}
                />
              );
            })}
          </svg>
        )}

        {stableRows.map((row, rowIndex) => {
          const radius = baseRadius + rowIndex * orbitGap;
          const ringDuration = rotationDuration + rowIndex * rowDelay;

          let rowDirection = direction;
          if (alternateDirection && rowIndex % 2 === 1) {
            rowDirection =
              direction === "clockwise" ? "counterclockwise" : "clockwise";
          }
          const animationDirection =
            rowDirection === "clockwise" ? "normal" : "reverse";

          return (
            <ul
              key={rowIndex}
              className="orbit-rings-ring"
              style={{
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                animation: `orbit-rings-orbit ${ringDuration}s linear infinite ${animationDirection}`,
              }}
            >
              {row.map((imageUrl, circleIndex) => {
                const angle = ((360 / row.length) * circleIndex - 90) % 360;
                const scaledCircleSize =
                  circleSize * (1 + rowIndex * staggerScaleFactor);

                return (
                  <li
                    key={circleIndex}
                    className="circle-item"
                    style={
                      {
                        width: `${scaledCircleSize}px`,
                        height: `${scaledCircleSize}px`,
                        margin: `-${scaledCircleSize / 2}px`,
                        transform: `rotate(${angle}deg) translateX(${radius}px)`,
                        "--item-angle": `${angle}deg`,
                        "--entrance-delay": `${rowIndex * animationStagger}s`,
                        "--target-opacity":
                          fadeMode === "in"
                            ? 0.2 + (rowIndex / (stableRows.length - 1)) * 0.8
                            : fadeMode === "out"
                              ? 0.2 +
                                ((stableRows.length - rowIndex - 1) /
                                  (stableRows.length - 1)) *
                                  0.8
                              : 1,
                        "--target-blur":
                          fadeBlur && fadeMode !== "none"
                            ? fadeMode === "in"
                              ? `${((stableRows.length - rowIndex - 1) / (stableRows.length - 1)) * 8}px`
                              : `${(rowIndex / (stableRows.length - 1)) * 8}px`
                            : "0px",
                      } as React.CSSProperties
                    }
                  >
                    <div
                      className="circle-content"
                      style={{
                        animation: animate
                          ? `orbit-rings-entrance ${animationDuration}s cubic-bezier(0.34, 1.56, 0.64, 1) ${rowIndex * animationStagger}s both, orbit-rings-counter-orbit ${ringDuration}s linear infinite ${rowIndex * animationStagger}s ${animationDirection}`
                          : `orbit-rings-counter-orbit ${ringDuration}s linear infinite ${animationDirection}`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={`Circle ${rowIndex}-${circleIndex}`}
                        className="circle-image"
                        loading="lazy"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        })}
      </div>
    </div>
  );
};

OrbitRings.displayName = "OrbitRings";

export default OrbitRings;

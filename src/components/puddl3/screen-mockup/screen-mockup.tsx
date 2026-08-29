"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useSpring, useMotionValue } from "motion/react";
import { ReactLenis } from "lenis/react";
import "./screen-mockup.css";

export interface ScreenMockupProps {
  /** Image URL for the screen-mockup screen */
  image?: string;

  /** Scale factor for the screen-mockup size (0.5 to 1.5) */
  scale?: number;

  /** Whether the image can scroll vertically (for long screenshots) */
  isScrollable?: boolean;

  /** Enable parallax effect on hover */
  enableParallax?: boolean;

  /** Parallax movement strength in pixels (default: 15) */
  parallaxStrength?: number;

  /** Enable rotation effect on hover */
  enableRotate?: boolean;

  /** Rotation strength in degrees (default: 3) */
  rotateStrength?: number;

  /** Auto-animate with simulated cursor movement */
  autoAnimate?: boolean;

  /** Additional CSS classes for the wrapper */
  className?: string;

  /** Content to display inside the screen-mockup screen */
  children?: React.ReactNode;
}

const ScreenMockup = React.forwardRef<HTMLDivElement, ScreenMockupProps>(
  (
    {
      image = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
      scale = 1,
      isScrollable = false,
      enableParallax = true,
      parallaxStrength = 15,
      enableRotate = true,
      rotateStrength = 3,
      autoAnimate = false,
      className,
      children,
    },
    ref,
  ) => {
    const deviceRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const animationFrameRef = useRef<number | undefined>(undefined);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const rotateZ = useMotionValue(0);

    const springX = useSpring(x, {
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    });
    const springY = useSpring(y, {
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    });
    const springRotateX = useSpring(rotateX, {
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    });
    const springRotateY = useSpring(rotateY, {
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    });
    const springRotateZ = useSpring(rotateZ, {
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    });

    useEffect(() => {
      if (!autoAnimate) return;

      let time = 0;
      const animate = () => {
        time += 0.005;

        const mouseX = Math.sin(time) * 0.8;
        const mouseY = Math.sin(time * 1.3) * 0.6;

        if (enableParallax) {
          x.set(mouseX * parallaxStrength);
          y.set(-mouseY * parallaxStrength);
        }

        if (enableRotate) {
          rotateX.set(-mouseY * rotateStrength);
          rotateY.set(mouseX * rotateStrength);
          rotateZ.set(mouseX * rotateStrength * 0.5);
        }

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [
      autoAnimate,
      enableParallax,
      enableRotate,
      parallaxStrength,
      rotateStrength,
      x,
      y,
      rotateX,
      rotateY,
      rotateZ,
    ]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (autoAnimate || !deviceRef.current) return;

      const rect = deviceRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = (e.clientX - centerX) / (rect.width / 2);
      const mouseY = (e.clientY - centerY) / (rect.height / 2);

      if (enableParallax) {
        x.set(mouseX * parallaxStrength);
        y.set(-mouseY * parallaxStrength);
      }

      if (enableRotate) {
        rotateX.set(-mouseY * rotateStrength);
        rotateY.set(mouseX * rotateStrength);
        rotateZ.set(mouseX * rotateStrength * 0.5);
      }
    };

    const handleMouseEnter = () => {
      if (!autoAnimate) {
        setIsHovering(true);
      }
    };

    const handleMouseLeave = () => {
      if (!autoAnimate) {
        setIsHovering(false);
        x.set(0);
        y.set(0);
        rotateX.set(0);
        rotateY.set(0);
        rotateZ.set(0);
      }
    };

    const scaleStyle = {
      transform: `scale(${scale})`,
      transformOrigin: "center center",
    };

    const screenContent = isScrollable ? (
      <ReactLenis
        options={{
          lerp: 0.1,
          duration: 1.2,
          smoothWheel: true,
        }}
        className="screen-mockup-content screen-mockup-content-scrollable"
      >
        {children ? (
          children
        ) : (
          <img
            src={image}
            alt="ScreenMockup screen"
            className="screen-mockup-screen-image screen-mockup-screen-image-scrollable"
            draggable={false}
          />
        )}
      </ReactLenis>
    ) : (
      <div className="screen-mockup-content">
        {children ? (
          children
        ) : (
          <img
            src={image}
            alt="ScreenMockup screen"
            className="screen-mockup-screen-image"
            draggable={false}
          />
        )}
      </div>
    );

    return (
      <div
        ref={ref}
        className={`screen-mockup-wrapper ${className || ""}`}
        style={scaleStyle}
      >
        <motion.div
          ref={deviceRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            x: springX,
            y: springY,
            rotateX: springRotateX,
            rotateY: springRotateY,
            rotateZ: springRotateZ,
            transformStyle: "preserve-3d",
          }}
          animate={{
            scale: isHovering || autoAnimate ? 1.02 : 1,
          }}
          transition={{
            scale: {
              type: "spring",
              stiffness: 300,
              damping: 25,
            },
          }}
          className="screen-mockup-motion-wrapper"
        >
          <div
            className="screen-mockup-body"
            style={{
              boxShadow:
                isHovering || autoAnimate
                  ? "0 30px 60px -12px rgba(0, 0, 0, 0.3), 0 18px 36px -18px rgba(0, 0, 0, 0.25)"
                  : "0 0 2rem 1rem rgba(0, 0, 0, 0.1)",
            }}
          >
            {screenContent}

            <div className="screen-mockup-dynamic-island">
              <div className="screen-mockup-sensors">
                <div className="screen-mockup-sensor" />
                <div className="screen-mockup-sensor" />
              </div>

              <div className="screen-mockup-speaker-grill">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="screen-mockup-speaker-grill-line" />
                ))}
              </div>

              <div className="screen-mockup-camera" />
            </div>

            <div className="screen-mockup-button screen-mockup-button-silent" />

            <div className="screen-mockup-button screen-mockup-button-volume-up" />

            <div className="screen-mockup-button screen-mockup-button-volume-down" />

            <div className="screen-mockup-button screen-mockup-button-power" />

            <div className="screen-mockup-layer screen-mockup-layer-1" />

            <div className="screen-mockup-layer screen-mockup-layer-2" />

            <div className="screen-mockup-layer screen-mockup-layer-gradient-1" />

            <div className="screen-mockup-layer screen-mockup-layer-gradient-2" />
          </div>
        </motion.div>
      </div>
    );
  },
);

ScreenMockup.displayName = "ScreenMockup";

export default ScreenMockup;

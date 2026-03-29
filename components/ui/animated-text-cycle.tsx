"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

interface AnimatedTextCycleProps {
  words: string[];
  interval?: number;
  className?: string;
}

const containerVariants = {
  hidden: {
    y: -20,
    opacity: 0,
    filter: "blur(8px)",
  },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    y: 20,
    opacity: 0,
    filter: "blur(8px)",
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
} as const;

export default function AnimatedTextCycle({
  words,
  interval = 5000,
  className = "",
}: AnimatedTextCycleProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [widths, setWidths] = React.useState<number[]>([]);
  const measureRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!words.length) {
      return;
    }

    const measureWidths = () => {
      if (!measureRef.current) {
        return;
      }

      const nextWidths = Array.from(measureRef.current.children).map((element) =>
        Math.ceil((element as HTMLElement).getBoundingClientRect().width) + 2,
      );

      setWidths(nextWidths);
    };

    measureWidths();

    window.addEventListener("resize", measureWidths);

    return () => {
      window.removeEventListener("resize", measureWidths);
    };
  }, [className, words]);

  React.useEffect(() => {
    if (words.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, interval);

    return () => {
      window.clearInterval(timer);
    };
  }, [interval, words.length]);

  if (!words.length) {
    return null;
  }

  const width = widths[currentIndex] ? `${widths[currentIndex]}px` : "auto";

  return (
    <>
      <div
        ref={measureRef}
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none"
        style={{ visibility: "hidden" }}
      >
        {words.map((word, index) => (
          <span key={index} className={`font-bold ${className}`}>
            {word}
          </span>
        ))}
      </div>

      <motion.span
        className="relative inline-block align-top"
        animate={{
          width,
          transition: {
            type: "spring",
            stiffness: 150,
            damping: 15,
            mass: 1.2,
          },
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={words[currentIndex]}
            className={`inline-block whitespace-nowrap font-bold ${className}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
}

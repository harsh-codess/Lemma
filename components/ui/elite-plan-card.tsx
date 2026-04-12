"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Adapted for Lemma ────────────────────────────────────────────────────────
// Original: imageUrl + title + subtitle + description + highlights + onAction
// Lemma:    panel (ReactNode) + title + subtitle + description + highlights (ReactNode[]) + footer (ReactNode)
//           + all motion div props so the parent can attach onClick, onMouseEnter, etc.

interface ElitePlanCardProps extends HTMLMotionProps<"div"> {
  /** Top visual area — replaces the original image. Render status panels here. */
  panel: React.ReactNode;
  /** Height of the top panel area */
  panelHeight?: number;
  /** Overlay rendered above the panel (e.g. a menu button) */
  panelOverlay?: React.ReactNode;
  title: string;
  subtitle: string;
  description?: string;
  /** 2-column highlight grid — pass ReactNode[] for full control over each cell */
  highlights?: React.ReactNode[];
  /** Bottom CTA area — replaces the original Button */
  footer?: React.ReactNode;
  /** Disable the outer spring-scale hover (useful during drag) */
  disableHover?: boolean;
}

export const ElitePlanCard = React.forwardRef<
  HTMLDivElement,
  ElitePlanCardProps
>(
  (
    {
      className,
      panel,
      panelHeight = 196,
      panelOverlay,
      title,
      subtitle,
      description,
      highlights = [],
      footer,
      disableHover,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={disableHover ? undefined : { scale: 1.02 }}
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
        className={cn(
          "relative w-full overflow-hidden rounded-3xl bg-[#05070a]",
          "hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
          className,
        )}
        {...props}
      >
        {/* Top panel with parallax zoom */}
        <div className="relative overflow-hidden" style={{ height: panelHeight }}>
          <motion.div
            className="absolute inset-0"
            whileHover={{ scale: 1.07 }}
            transition={{ duration: 0.45 }}
          >
            {panel}
          </motion.div>

          {/* Overlay (menu button, etc.) */}
          {panelOverlay}

          {/* Gradient fade — connects panel to card body */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#05070a] via-[#05070a]/80 to-transparent" />
        </div>

        {/* Bottom content */}
        <div className="relative z-10 flex flex-col gap-2.5 bg-[#05070a] p-5 pt-0">
          {/* Subtitle / eyebrow */}
          <p className="truncate text-sm uppercase tracking-wider text-gray-400">
            {subtitle}
          </p>

          {/* Title */}
          <h3
            className="mt-1 line-clamp-2 text-2xl font-bold text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            {title}
          </h3>

          {/* Description (optional) */}
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-gray-400 line-clamp-2">{description}</p>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {highlights.map((node, idx) => (
                <React.Fragment key={idx}>{node}</React.Fragment>
              ))}
            </div>
          )}

          {/* Footer / CTA */}
          {footer}
        </div>
      </motion.div>
    );
  },
);

ElitePlanCard.displayName = "ElitePlanCard";

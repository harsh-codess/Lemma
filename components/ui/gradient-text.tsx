import React from "react";

import { cn } from "@/lib/utils";

interface GradientTextProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

function GradientText({
  className,
  children,
  as: Component = "span",
  ...props
}: GradientTextProps) {
  return (
    <Component
      className={cn("relative inline-block align-baseline", className)}
      {...props}
    >
      <span
        className={cn(
          "inline-block bg-[length:180%_180%] bg-clip-text text-transparent [background-image:radial-gradient(circle_at_18%_18%,hsl(var(--color-4))_0,transparent_34%),radial-gradient(circle_at_82%_16%,hsl(var(--color-1))_0,transparent_36%),radial-gradient(circle_at_20%_84%,hsl(var(--color-3))_0,transparent_36%),radial-gradient(circle_at_82%_82%,hsl(var(--color-2))_0,transparent_34%),linear-gradient(120deg,hsl(var(--color-4)),hsl(var(--color-1))_28%,hsl(var(--color-2))_62%,hsl(var(--color-3)))] animate-gradient-flow",
        )}
        style={{ WebkitTextFillColor: "transparent" }}
      >
        {children}
      </span>
    </Component>
  );
}

export { GradientText };

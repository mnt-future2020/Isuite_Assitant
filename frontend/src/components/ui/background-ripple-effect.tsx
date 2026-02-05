"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BackgroundRippleEffectProps {
  className?: string;
  rippleColor?: string;
  backgroundColor?: string;
}

export const BackgroundRippleEffect: React.FC<BackgroundRippleEffectProps> = ({
  className,
  rippleColor = "rgba(59, 130, 246, 0.3)",
  backgroundColor = "transparent",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  const createRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 1000);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden cursor-pointer",
        className
      )}
      style={{ backgroundColor }}
      onClick={createRipple}
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Ripples */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            animation: "ripple 1s ease-out forwards",
          }}
        />
      ))}

      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
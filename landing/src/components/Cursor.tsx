"use client";

import { useEffect, useState } from "react";

export default function Cursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      setIsPointer(
        window.getComputedStyle(target).cursor === "pointer" ||
        target.tagName === "BUTTON" ||
        target.tagName === "A"
      );
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <div
        className="cursor-dot"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      />
      <div
        className={`cursor-outline ${isPointer ? "scale-150 opacity-50" : ""}`}
        style={{
          transform: `translate(${position.x - 16}px, ${position.y - 16}px)`,
        }}
      />
    </>
  );
}

"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[System Error Boundry Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-white selection:text-black font-[var(--font-body)]">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-3 font-[var(--font-display)]">System Exception</h1>
        <p className="text-white/50 mb-8 text-sm leading-relaxed">
          A critical error occurred while executing this route. Our engineering telemetry has been updated.
        </p>
        
        <button
          onClick={() => reset()}
          className="bg-white text-black px-6 py-3 text-sm font-bold tracking-wide uppercase hover:bg-white/90 transition-colors w-full flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-4 h-4" /> Initialize Recovery
        </button>
      </div>
    </div>
  );
}

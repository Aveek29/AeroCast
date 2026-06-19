"use client";

import { useRef, useEffect, useCallback } from "react";
import { useAtmosphere } from "@/components/AtmosphereProvider";

export default function LightningOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { atmosphere } = useAtmosphere();
  const { lightningEnabled, lightningFrequency, performanceTier } = atmosphere;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLow = performanceTier === "low";
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const flash = useCallback(() => {
    if (!overlayRef.current || isLow || reducedMotion) return;
    overlayRef.current.style.opacity = "0.15";
    overlayRef.current.style.transition = "opacity 0ms";
    requestAnimationFrame(() => {
      if (!overlayRef.current) return;
      overlayRef.current.style.transition = "opacity 200ms ease-out";
      overlayRef.current.style.opacity = "0";
    });
  }, [isLow, reducedMotion]);

  useEffect(() => {
    if (!lightningEnabled || isLow || reducedMotion) return;

    function schedule() {
      const delay = 2000 + Math.random() * (1 / (lightningFrequency || 0.008)) * 1000;
      timerRef.current = setTimeout(() => {
        flash();
        schedule();
      }, Math.min(delay, 15000));
    }

    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [lightningEnabled, lightningFrequency, flash, isLow, reducedMotion]);

  if (!lightningEnabled || isLow || reducedMotion) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-10 pointer-events-none bg-white"
      style={{ opacity: 0 }}
    />
  );
}

"use client";

import { useMemo } from "react";
import { useAtmosphere } from "@/components/AtmosphereProvider";

export default function SkyRenderer() {
  const { atmosphere } = useAtmosphere();
  const { skyGradient, timePhase, particleType, performanceTier } = atmosphere;

  const skyStyle = useMemo(() => ({
    background: `linear-gradient(175deg, ${skyGradient.join(", ")})`,
    transition: "background 3s ease-in-out",
  }), [skyGradient]);

  const isNight = ["night", "dusk"].includes(timePhase);
  const hasStars = particleType === "stars" || isNight;

  const celestialOpacity = useMemo(() => {
    if (timePhase === "night") return 1;
    if (timePhase === "dusk" || timePhase === "dawn") return 0.4;
    if (timePhase === "sunrise" || timePhase === "sunset") return 0.15;
    return 0;
  }, [timePhase]);

  return (
    <>
      <div className="fixed inset-0 z-0" style={skyStyle} />

      {hasStars && performanceTier !== "low" && (
        <div
          className="fixed inset-0 z-[1] pointer-events-none"
          style={{ opacity: celestialOpacity, transition: "opacity 3s ease" }}
        >
          <div className="stars-layer" />
        </div>
      )}

      {isNight && (
        <div
          className="fixed top-[5%] right-[15%] z-[1] pointer-events-none w-16 h-16 rounded-full"
          style={{
            background: celestialOpacity > 0.5
              ? "radial-gradient(circle, rgba(230,230,230,0.8) 0%, rgba(200,200,200,0.3) 40%, transparent 70%)"
              : "none",
            boxShadow: celestialOpacity > 0.5 ? "0 0 30px rgba(200,200,200,0.3)" : "none",
            opacity: celestialOpacity,
            transition: "opacity 3s ease",
          }}
        />
      )}
    </>
  );
}

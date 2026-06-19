"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { useAtmosphere } from "./AtmosphereProvider";
import { conditionToEmoji, getTimeEmoji } from "@/lib/atmosphere";

export default function Navbar() {
  const { atmosphere } = useAtmosphere();

  return (
    <nav className="relative z-50 w-full p-4 flex justify-between items-center backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 transition-colors duration-700">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          <Compass className="w-8 h-8 text-[var(--accent)]" />
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tighter">AeroCast</h1>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs opacity-60 flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full">
          <span className="text-base">{conditionToEmoji(atmosphere.conditionIcon)}</span>
          <span>{atmosphere.conditionLabel || "Loading…"}</span>
        </span>
        <span className="text-xs opacity-40 flex items-center gap-1 bg-black/10 px-2 py-1.5 rounded-full">
          <span>{getTimeEmoji(atmosphere.timePhase)}</span>
          <span className="capitalize">{atmosphere.timePhase}</span>
        </span>
      </div>
    </nav>
  );
}

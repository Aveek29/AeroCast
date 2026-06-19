"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Languages } from "lucide-react";
import type { WeatherData } from "@/lib/weather";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface ChatbotProps {
  city?: string;
  weather?: WeatherData;
  rainProbability?: number;
}

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

const greetings: Record<string, string> = {
  en: "Hello! I'm SkyPulse AI. Ask me about weather, activities, or travel plans!",
  hi: "नमस्ते! मैं SkyPulse AI हूँ। मौसम, गतिविधियों या यात्रा योजनाओं के बारे में पूछें!",
  es: "¡Hola! Soy SkyPulse AI. ¡Pregúntame sobre el clima, actividades o planes de viaje!",
  fr: "Bonjour! Je suis SkyPulse AI. Demandez-moi sur la météo, les activités ou les voyages!",
  de: "Hallo! Ich bin SkyPulse AI. Fragen Sie mich nach Wetter, Aktivitäten oder Reiseplänen!",
  zh: "你好！我是SkyPulse AI。问我关于天气、活动或旅行计划的问题！",
  ar: "مرحباً! أنا SkyPulse AI. اسألني عن الطقس أو الأنشطة أو خطط السفر!",
  ja: "こんにちは！SkyPulse AIです。天気、アクティビティ、旅行計画についてお聞きください！",
};

const examplePairs: Message[] = [
  { role: "assistant", content: "Ready to plan your day! Here are some things I can help with:" },
  { role: "user", content: "Should I carry an umbrella?" },
  { role: "assistant", content: "With 40% rain probability today, I'd suggest carrying a light umbrella! The rain is likely in the late afternoon, so morning plans should be fine." },
  { role: "user", content: "Plan a 3-day trip to Mumbai" },
  { role: "assistant", content: "Mumbai in June: Day 1 — Marine Drive & Gateway of India (25°C, partly cloudy). Day 2 — Sanjay Gandhi National Park (morning best). Day 3 — Street food tour in Colaba (carry umbrella, 60% rain chance)." },
];

const quickActions = [
  { msg: "Should I carry an umbrella?", label: "Umbrella?" },
  { msg: "Plan a 3-day trip", label: "3-Day Trip" },
  { msg: "Best time to go out today?", label: "Best time?" },
];

function Chatbot({ city, weather, rainProbability }: ChatbotProps) {
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: "assistant", content: greetings.en },
    ...examplePairs,
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback(async (msg?: string) => {
    const text = msg ?? input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text, city, lang,
          weather: weather ? {
            temperature: weather.temperature, condition: weather.condition,
            humidity: weather.humidity, windSpeed: weather.windSpeed,
            uvIndex: weather.uvIndex, rainProbability: rainProbability ?? 40,
          } : null,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't process that." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [city, lang, loading, input, weather, rainProbability]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] backdrop-blur-xl rounded-3xl flex flex-col overflow-hidden shadow-2xl h-[400px] sm:h-[420px] md:h-[520px]">
      <div className="shrink-0 p-3 md:p-4 border-b border-[var(--card-border)] bg-black/10 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white">
            <Bot className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs md:text-sm leading-tight">SkyPulse AI</h3>
            <span className="text-[9px] md:text-[10px] opacity-70 font-medium uppercase tracking-wider">Travel Assistant</span>
          </div>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setShowLang(!showLang)} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded-full px-2 py-1 md:px-2.5 md:py-1.5 text-xs transition-colors">
            <Languages className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>{languages.find((l) => l.code === lang)?.flag}</span>
          </button>
          {showLang && (
            <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-white/10 rounded-xl p-1.5 shadow-2xl z-20 grid grid-cols-2 gap-1 w-40 md:w-44">
              {languages.map((l) => (
                <button key={l.code} type="button" onClick={() => { setLang(l.code); setMessages([{ role: "assistant", content: greetings[l.code] }, ...examplePairs]); setShowLang(false); }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${lang === l.code ? "bg-[var(--accent)] text-white" : "hover:bg-white/10"}`}>
                  <span>{l.flag}</span><span className="truncate">{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto overscroll-contain scroll-smooth p-3 md:p-4 space-y-3 md:space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3 h-3 md:w-4 md:h-4 text-[var(--accent)]" />
                </div>
              )}
              <div className={`max-w-[88%] p-2.5 md:p-3 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-[var(--accent)] text-white rounded-tr-sm" : "bg-white/10 backdrop-blur-sm rounded-tl-sm"}`}>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              )}
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
                <Bot className="w-3 h-3 md:w-4 md:h-4 text-[var(--accent)]" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm p-2.5 md:p-3">
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 p-2.5 md:p-3 border-t border-[var(--card-border)] bg-black/20">
        <div className="flex gap-1.5 md:gap-2 mb-2 overflow-x-auto pb-1">
          {quickActions.map((qa) => (
            <button key={qa.msg} type="button" onClick={() => sendMessage(qa.msg)}
              className="text-[10px] md:text-xs bg-white/10 hover:bg-white/20 rounded-full px-2 py-1 md:px-3 md:py-1.5 whitespace-nowrap transition-colors shrink-0">
              {qa.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 bg-black/20 rounded-full p-1.5 md:p-2 border border-white/10">
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={lang === "en" ? "Ask about your trip..." : "पूछें..."}
            className="bg-transparent flex-1 outline-none px-2 md:px-3 text-xs md:text-sm placeholder:opacity-50 min-w-0" />
          <button type="button" onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="bg-[var(--accent)] text-white p-1.5 md:p-2 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shrink-0"
            aria-label={lang === "en" ? "Send message" : lang === "hi" ? "संदेश भेजें" : "Send message"}>
            <Send className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(Chatbot);

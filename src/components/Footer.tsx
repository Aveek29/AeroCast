import { ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-white/5 py-4 md:py-5">
      <div className="max-w-7xl mx-auto px-3 md:px-5 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
        <span>
          Built by{" "}
          <a href="https://github.com/Aveek29" target="_blank" rel="noopener noreferrer"
            className="text-white/60 hover:text-[var(--accent)] transition-colors underline underline-offset-2 decoration-white/10 hover:decoration-[var(--accent)]">
            Aveek29
          </a>
        </span>
        <span className="flex items-center gap-1">
          AeroCast &middot; Weather Intelligence Platform
          <a href="https://github.com/Aveek29" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-white/60 hover:text-[var(--accent)] transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        </span>
      </div>
    </footer>
  );
}

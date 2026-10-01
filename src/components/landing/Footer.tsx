"use client";

import Link from "next/link";
import { TrendingUp, ShieldAlert, ArrowUp } from "lucide-react";
import { EVENT_DETAILS } from "@/src/lib/market-data";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-[#1e1e1e] bg-[#030303] py-12 px-4 md:px-8 font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 flex items-center justify-center text-[#FF5F1F]">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">
              BULLS<span className="text-[#FF5F1F]">&</span>BEARS
            </div>
            <div className="text-[10px] text-[#71717a] uppercase">
              {EVENT_DETAILS.institution} • {EVENT_DETAILS.department}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-[11px] text-[#a1a1aa] uppercase tracking-wider">
          <Link href="/trade" className="hover:text-[#FF5F1F] transition-colors">
            Participant Terminal
          </Link>
          <Link href="/stage" target="_blank" className="hover:text-[#FF5F1F] transition-colors">
            Stage Display
          </Link>
          <Link href="/admin" className="hover:text-[#FF5F1F] transition-colors">
            Admin Portal
          </Link>
        </div>

        <button
          onClick={scrollToTop}
          className="p-2.5 rounded-sm border border-[#27272a] bg-[#09090b] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-all flex items-center gap-2"
          title="Return to top"
        >
          <span className="text-[10px] uppercase">Top</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#18181b] text-center text-[10px] text-[#52525b] uppercase tracking-widest flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Bulls & Bears Trading Simulation. All rights reserved.</span>
        <span>Venue: {EVENT_DETAILS.venue} • Free Registration</span>
      </div>
    </footer>
  );
}

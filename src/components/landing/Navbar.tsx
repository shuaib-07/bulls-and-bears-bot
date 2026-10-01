"use client";

import Link from "next/link";
import { TrendingUp, Tv, Play } from "lucide-react";

export function Navbar() {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 backdrop-blur-xl bg-[#030303]/80 border-b border-[var(--border)] transition-colors duration-500">
      <div className="max-w-[1500px] h-full mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Institution Info */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 group">
          <div className="w-8 h-8 rounded-sm bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 flex items-center justify-center text-[#FF5F1F] group-hover:border-[#FF5F1F] group-hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,95,31,0.2)]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="font-display font-bold text-[11px] min-[400px]:text-sm tracking-wider text-white group-hover:text-[#FF5F1F] transition-colors">
              BULLS<span className="text-[#FF5F1F]">&</span>BEARS
            </div>
            <div className="text-[9px] uppercase tracking-widest text-[#a1a1aa] font-mono -mt-0.5 hidden sm:block">
              RUAS Trading Simulation
            </div>
          </div>
        </Link>

        {/* Center Scroll Spy Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 2xl:gap-8 font-mono">
          <a
            href="#pinned-stage"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#pinned-stage");
            }}
            className="nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium is-active"
          >
            Overview
          </a>
          <a
            href="#rules"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#rules");
            }}
            className="nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium"
          >
            Rules
          </a>
          <a
            href="#structure"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#structure");
            }}
            className="nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium"
          >
            Phases
          </a>
          <a
            href="#demo"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#demo");
            }}
            className="nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium"
          >
            Sandbox
          </a>
          <a
            href="#event"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#event");
            }}
            className="nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium"
          >
            Schedule
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#faq");
            }}
            className="nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium"
          >
            FAQ
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live Engine Latency Indicator */}
          <div className="hidden xl:flex flex-col items-end text-[10px] font-mono tracking-widest uppercase text-[var(--muted)] pr-3 border-r border-[#27272a]">
            <span className="text-[var(--accent)] flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-none animate-pulse" />
              System.Online
            </span>
            <span className="text-[9px] text-[#71717a]">Latency: 12ms</span>
          </div>

          {/* Stage View Button */}
          <Link
            href="/stage"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider px-3.5 py-2 border border-[var(--border)] bg-[#09090b] text-[#d4d4d8] hover:text-white hover:border-[#3f3f46] hover:bg-[#121215] rounded-sm transition-all shadow-sm"
            title="Open Auditorium Projector View"
          >
            <Tv className="w-3.5 h-3.5 text-[#FF5F1F]" />
            <span>Stage View</span>
          </Link>

          {/* Register Now CTA */}
          <a
            href="https://tally.so/r/NpkK20"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider px-4 sm:px-5 py-2 bg-[var(--accent)] text-black hover:bg-white transition-all shadow-[0_0_20px_rgba(255,95,31,0.35)] rounded-sm active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="sm:hidden">Register</span><span className="hidden sm:inline">Register Now</span>
          </a>
        </div>
      </div>
    </header>
  );
}

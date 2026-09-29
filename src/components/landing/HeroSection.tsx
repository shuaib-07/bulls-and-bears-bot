"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Shield, DollarSign, Users, Play, Sparkles } from "lucide-react";
import { EVENT_DETAILS } from "@/src/lib/market-data";

export function HeroSection() {
  return (
    <section className="relative min-h-[88vh] flex items-center justify-center pt-10 sm:pt-14 pb-16 px-4 md:px-8 cyber-grid overflow-hidden">
      {/* Dynamic Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-[#FF5F1F]/10 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-[350px] h-[350px] bg-[#10B981]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-[#F43F5E]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Animated Campus Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#27272a] bg-[#09090b]/80 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(255,95,31,0.15)]"
        >
          <span className="w-2 h-2 rounded-full bg-[#FF5F1F] animate-pulse"></span>
          <span className="text-xs font-mono font-medium tracking-widest text-[#d4d4d8]">
            {EVENT_DETAILS.institution} • {EVENT_DETAILS.department}
          </span>
        </motion.div>

        {/* Masked Slide-Up Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight text-white mb-4 uppercase drop-shadow-2xl">
            BULLS <span className="text-[#FF5F1F]">&</span> BEARS
          </h1>
          <p className="text-lg sm:text-2xl md:text-3xl font-display font-semibold text-[#d4d4d8] max-w-3xl mb-4 tracking-wide">
            THE ULTIMATE TRADING SIMULATION
          </p>
        </motion.div>

        {/* Subtitle Slogan */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm font-mono text-[#FF5F1F] font-bold uppercase tracking-widest mb-6"
        >
          <span>READ THE NEWS</span>
          <span className="text-[#52525b]">•</span>
          <span>MAKE YOUR MOVE</span>
          <span className="text-[#52525b]">•</span>
          <span>OUTSMART THE MARKET</span>
        </motion.div>

        {/* Narrative Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-sm md:text-base text-[#a1a1aa] max-w-2xl leading-relaxed mb-10 font-normal"
        >
          A fast-paced, information-driven multiplayer trading arena. Start with <strong className="text-white">$100,000</strong> in virtual capital, decode encrypted sector news, compete for scarce <strong className="text-white">100-share float caps</strong>, and negotiate peer-to-peer stock swaps.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-14"
        >
          <a
            href="https://tally.so/r/NpkK20"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-[#FF5F1F] text-black font-bold text-xs font-mono uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 rounded-sm shadow-[0_0_30px_rgba(255,95,31,0.4)] flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            REGISTER NOW
          </a>

          <Link
            href="/stage"
            target="_blank"
            className="w-full sm:w-auto px-8 py-4 border border-[#27272a] bg-[#09090b]/80 backdrop-blur-md text-white font-semibold text-xs font-mono uppercase tracking-widest hover:bg-[#18181b] hover:border-[#3f3f46] transition-all rounded-sm flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4 text-[#FF5F1F]" />
            Stage Projector Display
          </Link>
        </motion.div>

        {/* Animated Highlights Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-left font-mono"
        >
          <motion.div
            whileHover={{ y: -4, borderColor: "#27272a" }}
            className="p-4 rounded-sm border border-[#1e1e1e] bg-[#0a0a0c]/80 backdrop-blur-md transition-all"
          >
            <div className="flex items-center gap-2 text-[#a3a3a3] text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Seed Capital</span>
            </div>
            <div className="text-lg md:text-xl font-bold text-white">$100,000</div>
            <div className="text-[10px] text-[#71717a]">Virtual balance per team</div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, borderColor: "#27272a" }}
            className="p-4 rounded-sm border border-[#1e1e1e] bg-[#0a0a0c]/80 backdrop-blur-md transition-all"
          >
            <div className="flex items-center gap-2 text-[#a3a3a3] text-xs mb-1">
              <Flame className="w-3.5 h-3.5 text-[#FF5F1F]" />
              <span>Simulation</span>
            </div>
            <div className="text-lg md:text-xl font-bold text-white">Timed Rounds</div>
            <div className="text-[10px] text-[#71717a]">10 mins per window</div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, borderColor: "#27272a" }}
            className="p-4 rounded-sm border border-[#1e1e1e] bg-[#0a0a0c]/80 backdrop-blur-md transition-all"
          >
            <div className="flex items-center gap-2 text-[#a3a3a3] text-xs mb-1">
              <Shield className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span>Market Float</span>
            </div>
            <div className="text-lg md:text-xl font-bold text-white">100 Shares Float</div>
            <div className="text-[10px] text-[#71717a]">Scarcity & P2P Swaps</div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, borderColor: "#27272a" }}
            className="p-4 rounded-sm border border-[#1e1e1e] bg-[#0a0a0c]/80 backdrop-blur-md transition-all"
          >
            <div className="flex items-center gap-2 text-[#a3a3a3] text-xs mb-1">
              <Users className="w-3.5 h-3.5 text-[#eab308]" />
              <span>Eligibility</span>
            </div>
            <div className="text-lg md:text-xl font-bold text-white">1–2 Members</div>
            <div className="text-[10px] text-[#71717a]">BSc Data Science Only</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";

interface PriceTickerMarqueeProps {
  className?: string;
  speed?: number; // duration in seconds
  stocks?: Array<{
    ticker: string;
    currentPrice: number;
    roundChangePercent: number;
  }>;
}

export function PriceTickerMarquee({
  className = "",
  speed = 45,
  stocks,
}: PriceTickerMarqueeProps) {
  const tickerItems = stocks || [];

  const reduceMotion = useReducedMotion();

  return (
    <div className={`w-full overflow-hidden bg-[#050508] border-y border-[#1e1e1e] py-2.5 relative select-none font-mono ${className}`}>
      {/* Side Fade Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-36 bg-gradient-to-r from-[#030303] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-36 bg-gradient-to-l from-[#030303] to-transparent z-10 pointer-events-none" />

      <motion.div
        className={`flex items-center whitespace-nowrap ${reduceMotion ? "w-full overflow-x-auto" : "w-max will-change-transform"}`}
        animate={reduceMotion ? { x: 0 } : { x: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: speed,
        }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-3 sm:gap-6 pr-3 sm:pr-6">
        {tickerItems.map((item) => {
          const isUp = item.roundChangePercent >= 0;
          return (
            <div
              key={item.ticker}
              className="inline-flex shrink-0 items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[#09090b]/80 border border-[#27272a] hover:border-[#FF5F1F]/60 transition-all shadow-sm group"
            >
              <CompanyLogo ticker={item.ticker} size="sm" />
              <span className="font-bold text-white text-xs tracking-wider group-hover:text-[#FF5F1F] transition-colors">
                {item.ticker}
              </span>
              <span className="text-xs font-semibold text-[#d4d4d8]">
                ${item.currentPrice.toFixed(2)}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
                  isUp ? "text-[#10B981]" : "text-[#F43F5E]"
                }`}
              >
                {isUp ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {isUp ? "+" : ""}
                {item.roundChangePercent}%
              </span>
            </div>
          );
        })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { STOCKS_DATA } from "@/src/lib/market-data";
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
  // Use live stocks or default master data
  const tickerItems = stocks && stocks.length > 0
    ? stocks
    : STOCKS_DATA.map((s) => ({
        ticker: s.ticker,
        currentPrice: s.startingPrice,
        roundChangePercent: Math.round((Math.sin(s.startingPrice) * 15) * 10) / 10,
      }));

  // Duplicate for seamless infinite loop
  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div className={`w-full overflow-hidden bg-[#050508] border-y border-[#1e1e1e] py-2.5 relative select-none font-mono ${className}`}>
      {/* Side Fade Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-r from-[#030303] via-[#030303]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-l from-[#030303] via-[#030303]/80 to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex items-center gap-4 sm:gap-6 whitespace-nowrap will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: speed,
        }}
      >
        {duplicatedItems.map((item, index) => {
          const isUp = item.roundChangePercent >= 0;
          return (
            <div
              key={`${item.ticker}-${index}`}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#09090b]/80 border border-[#27272a] hover:border-[#FF5F1F]/60 transition-all shadow-sm group"
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
      </motion.div>
    </div>
  );
}

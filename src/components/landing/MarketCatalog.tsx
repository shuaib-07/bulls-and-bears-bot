"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { STOCKS_DATA } from "@/src/lib/market-data";
import { Search, Sparkles } from "lucide-react";
import { CompanyLogo } from "@/src/components/ui/CompanyLogo";

export function MarketCatalog() {
  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState("ALL");

  const sectors = ["ALL", ...Array.from(new Set(STOCKS_DATA.map((s) => s.sector.split(" / ")[0])))];

  const filteredStocks = STOCKS_DATA.filter((s) => {
    const matchesSearch = s.ticker.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase());
    const matchesSector = selectedSector === "ALL" || s.sector.includes(selectedSector);
    return matchesSearch && matchesSector;
  });

  return (
    <section id="stocks" className="relative py-24 px-4 md:px-8">
      <div className="section-slab">
        <div className="section-inner max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#FF5F1F] mb-3">
              <span className="w-1.5 h-1.5 bg-[#FF5F1F]"></span>
              ASSET UNIVERSE // 30 REAL STOCKS
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4">
              THE TRADING UNIVERSE
            </h2>
            <p className="text-sm md:text-base text-[#a1a1aa] leading-relaxed">
              20 foundational equities active at Round 0, plus 10 high-growth stocks introduced during the secret mid-game expansion.
            </p>
          </motion.div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 font-mono">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticker or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-[#FF5F1F] rounded-sm pl-9 pr-4 py-2 text-xs text-white placeholder-[#71717a] outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
              {sectors.slice(0, 6).map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedSector === sec
                      ? "bg-[#FF5F1F]/20 border border-[#FF5F1F] text-[#FF5F1F] font-bold"
                      : "bg-[#09090b] border border-[#1e1e1e] text-[#a1a1aa] hover:text-white"
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Stocks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStocks.map((stock, idx) => (
              <motion.div
                key={stock.ticker}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                whileHover={{ y: -3, borderColor: "#3f3f46" }}
                className="p-4 bg-[#09090b]/80 border border-[#1e1e1e] rounded-sm transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <CompanyLogo ticker={stock.ticker} size="md" />
                      <span className="text-base font-display font-bold text-white group-hover:text-[#FF5F1F] transition-colors">
                        {stock.ticker}
                      </span>
                    </div>
                    {stock.entryRound === 2 ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Sparkles className="w-2.5 h-2.5" /> Expansion
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#71717a]">Round 0 Float</span>
                    )}
                  </div>
                  <div className="text-xs text-[#a1a1aa] truncate mb-1">
                    {stock.name}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-[#71717a] mb-4">
                    {stock.sector}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#18181b] flex items-end justify-between font-mono">
                  <div>
                    <div className="text-[9px] text-[#71717a] uppercase">Starting Baseline</div>
                    <div className="text-sm font-bold text-[#10B981]">
                      ${stock.startingPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-[#71717a] uppercase">Max Float</div>
                    <div className="text-xs font-semibold text-white">100 Shares</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

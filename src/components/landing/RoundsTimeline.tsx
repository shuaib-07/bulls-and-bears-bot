"use client";

import { useState } from "react";
import { ROUNDS_DATA } from "@/src/lib/market-data";
import { Clock, Newspaper, Sparkles, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export function RoundsTimeline() {
  const [selectedRound, setSelectedRound] = useState(0);

  const activeRound = ROUNDS_DATA[selectedRound];

  return (
    <section id="rounds" className="relative py-24 px-4 md:px-8 cyber-grid">
      <div className="section-slab">
        <div className="section-inner max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#FF5F1F] mb-3">
              <span className="w-1.5 h-1.5 bg-[#FF5F1F]"></span>
              OFFICIAL TIMELINE // MARKET CHRONOLOGY
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4">
              6 VOLATILE ROUNDS
            </h2>
            <p className="text-sm md:text-base text-[#a1a1aa] leading-relaxed">
              From the initial opening bell to the Round 2 market expansion twist and the final round AI supercycle liquidation.
            </p>
          </div>

          {/* Round Selector Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none font-mono">
            {ROUNDS_DATA.map((r, idx) => (
              <button
                key={r.round}
                onClick={() => setSelectedRound(idx)}
                className={`px-4 py-2.5 rounded-sm border text-xs uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                  selectedRound === idx
                    ? "bg-[#FF5F1F] text-black border-[#FF5F1F] font-bold shadow-[0_0_20px_rgba(255,95,31,0.3)]"
                    : "bg-[#09090b] text-[#a3a3a3] border-[#1e1e1e] hover:border-[#3f3f46] hover:text-white"
                }`}
              >
                <span>R{r.round}</span>
                {r.round === 2 && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-normal">
                    +10 Stocks
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Round Showcase Card */}
          <div className="bg-[#09090b]/90 border border-[#27272a] rounded-sm p-6 md:p-10 relative overflow-hidden">
            {/* Round 2 Special Banner */}
            {activeRound.round === 2 && (
              <div className="mb-6 p-3 bg-gradient-to-r from-[#FF5F1F]/20 via-amber-500/10 to-transparent border-l-2 border-[#FF5F1F] flex items-center gap-2 text-xs font-mono text-[#FF5F1F]">
                <Sparkles className="w-4 h-4 text-[#FF5F1F]" />
                <strong className="text-white">ROUND 2 MARKET TWIST:</strong> 10 new high-growth stocks enter the market immediately during this round!
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Round Title & News Stories */}
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3 text-xs font-mono text-[#FF5F1F] mb-2 uppercase">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{activeRound.durationMinutes} MINUTE TRADING WINDOW</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
                  {activeRound.title}
                </h3>
                <p className="text-xs sm:text-sm font-mono text-[#a1a1aa] mb-6">
                  {activeRound.subtitle}
                </p>

                <div className="space-y-3 font-mono">
                  <div className="text-[11px] uppercase tracking-widest text-[#71717a] flex items-center gap-2 mb-2">
                    <Newspaper className="w-3.5 h-3.5 text-[#FF5F1F]" />
                    <span>Cryptic News Flashes (6 Developments):</span>
                  </div>

                  {activeRound.newsStories.map((story) => (
                    <div
                      key={story.id}
                      className="p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm hover:border-[#27272a] transition-colors flex items-start gap-3"
                    >
                      <span className="text-[10px] font-bold text-[#FF5F1F] px-1.5 py-0.5 bg-[#FF5F1F]/10 rounded border border-[#FF5F1F]/20 mt-0.5">
                        #{story.id}
                      </span>
                      <div className="flex-1">
                        <div className="text-xs text-[#fafafa] font-normal leading-relaxed">
                          {story.headline}
                        </div>
                        <div className="text-[10px] text-[#71717a] mt-1 flex items-center gap-2">
                          <span className="text-[#a1a1aa]">Sector: {story.sector}</span>
                          <span>•</span>
                          <span className="text-[#FF5F1F]/80">Hint: {story.clueSummary}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Pre-calculated Volatility Impact */}
              <div className="lg:col-span-5 bg-[#030303] border border-[#1e1e1e] p-6 rounded-sm flex flex-col justify-between font-mono">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e1e1e] mb-4">
                    <span className="text-xs uppercase tracking-wider text-[#a1a1aa]">
                      Sample Market Shock Rates
                    </span>
                    <span className="text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">
                      ±30% Max Swings
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(activeRound.marketChanges).slice(0, 10).map(([ticker, pct]) => {
                      const isPositive = pct > 0;
                      return (
                        <div
                          key={ticker}
                          className="flex items-center justify-between p-2 rounded-sm bg-[#09090b] border border-[#1e1e1e]"
                        >
                          <span className="font-bold text-white">{ticker}</span>
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              isPositive ? "text-[#10B981]" : "text-[#F43F5E]"
                            }`}
                          >
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isPositive ? `+${pct}%` : `${pct}%`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#1e1e1e] text-[11px] text-[#71717a]">
                  <p>
                    *Note: Actual percentage shifts remain secret until the round ends and the administrator applies price updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RotateCcw } from "lucide-react";
import { sounds } from "@/src/lib/sounds";
import { formatCurrency } from "@/src/lib/utils";

export function InteractiveDemo() {
  const [cash, setCash] = useState(100000);
  const [portfolio, setPortfolio] = useState<Record<string, number>>({ ALPHA: 15, BETA: 10 });
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({
    ALPHA: 150,
    BETA: 220,
    GAMMA: 350,
    DELTA: 480,
  });
  const [stockFloats, setStockFloats] = useState<Record<string, number>>({
    ALPHA: 85,
    BETA: 90,
    GAMMA: 100,
    DELTA: 100,
  });
  const [selectedTicker, setSelectedTicker] = useState("ALPHA");
  const [tradeQty, setTradeQty] = useState(5);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const calculateHoldingsValue = () => {
    return Object.entries(portfolio).reduce((acc, [ticker, qty]) => {
      const price = stockPrices[ticker] || 0;
      return acc + price * qty;
    }, 0);
  };

  const holdingsValue = calculateHoldingsValue();
  const totalPortfolioValue = cash + holdingsValue;
  const pnl = totalPortfolioValue - 100000;

  const handleBuy = () => {
    const price = stockPrices[selectedTicker];
    const available = stockFloats[selectedTicker] || 0;
    const cost = price * tradeQty;

    if (tradeQty > available) {
      sounds.playTradeError();
      setActionMessage(`❌ Float exhausted! Only ${available} shares remaining in market pool.`);
      return;
    }

    if (cost > cash) {
      sounds.playTradeError();
      setActionMessage(`❌ Insufficient cash for this order.`);
      return;
    }

    sounds.playTradeSuccess();
    setCash((c) => c - cost);
    setStockFloats((sf) => ({ ...sf, [selectedTicker]: (sf[selectedTicker] || 0) - tradeQty }));
    setPortfolio((p) => ({ ...p, [selectedTicker]: (p[selectedTicker] || 0) + tradeQty }));
    setActionMessage(`✅ Bought ${tradeQty} shares of ${selectedTicker} for ${formatCurrency(cost)}!`);
  };

  const handleSell = () => {
    const price = stockPrices[selectedTicker];
    const owned = portfolio[selectedTicker] || 0;
    const proceeds = price * tradeQty;

    if (tradeQty > owned) {
      sounds.playTradeError();
      setActionMessage(`❌ You only hold ${owned} shares of ${selectedTicker}.`);
      return;
    }

    sounds.playTradeSuccess();
    setCash((c) => c + proceeds);
    setStockFloats((sf) => ({ ...sf, [selectedTicker]: (sf[selectedTicker] || 0) + tradeQty }));
    setPortfolio((p) => {
      const next = { ...p, [selectedTicker]: p[selectedTicker] - tradeQty };
      if (next[selectedTicker] === 0) delete next[selectedTicker];
      return next;
    });
    setActionMessage(`✅ Sold ${tradeQty} shares of ${selectedTicker} for ${formatCurrency(proceeds)}!`);
  };

  const handleSimulateShock = () => {
    sounds.playNewsAlert();
    setStockPrices({
      ALPHA: 198.50,
      BETA: 264.00,
      GAMMA: 297.50,
      DELTA: 552.00,
    });
    setActionMessage(`⚡ Sample Market Shock Applied: Sector Momentum (+32% ALPHA, +20% BETA, -15% GAMMA, +15% DELTA)!`);
  };

  const handleReset = () => {
    setCash(100000);
    setPortfolio({ ALPHA: 15, BETA: 10 });
    setStockPrices({ ALPHA: 150, BETA: 220, GAMMA: 350, DELTA: 480 });
    setStockFloats({ ALPHA: 85, BETA: 90, GAMMA: 100, DELTA: 100 });
    setActionMessage(null);
  };

  return (
    <section id="demo" className="relative py-24 px-4 md:px-8 cyber-grid">
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
              LIVE INTERACTIVE PREVIEW
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4">
              TRY THE SIMULATOR MECHANICS
            </h2>
            <p className="text-sm md:text-base text-[#a1a1aa] leading-relaxed">
              Test out the execution speed, remaining float mechanics, and simulated price shocks below before entering the live terminal.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#09090b] border border-[#27272a] rounded-sm p-3 sm:p-6 md:p-8"
          >
            {/* Top Stat Bar */}
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-3 pb-6 mb-6 border-b border-[#1e1e1e] font-mono">
              <div className="p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm">
                <div className="text-[10px] text-[#71717a] uppercase">Cash Balance</div>
                <div className="text-lg font-bold text-white">{formatCurrency(cash)}</div>
              </div>
              <div className="p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm">
                <div className="text-[10px] text-[#71717a] uppercase">Holdings Value</div>
                <div className="text-lg font-bold text-[#3b82f6]">{formatCurrency(holdingsValue)}</div>
              </div>
              <div className="p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm">
                <div className="text-[10px] text-[#71717a] uppercase">Total Portfolio</div>
                <div className="text-lg font-bold text-white">{formatCurrency(totalPortfolioValue)}</div>
              </div>
              <div className="p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm">
                <div className="text-[10px] text-[#71717a] uppercase">Total P/L</div>
                <div className={`text-lg font-bold ${pnl >= 0 ? "text-[#10B981]" : "text-[#F43F5E]"}`}>
                  {pnl >= 0 ? `+${formatCurrency(pnl)}` : formatCurrency(pnl)}
                </div>
              </div>
            </div>

            {/* Interactive Control Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Quick Order Slip */}
              <div className="lg:col-span-5 p-5 bg-[#030303] border border-[#1e1e1e] rounded-sm">
                <div className="flex items-center justify-between mb-4 font-mono">
                  <span className="text-xs uppercase text-[#a1a1aa] font-bold">Quick Order Slip</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                    SANDBOX OPEN
                  </span>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] text-[#71717a] uppercase mb-1">Select Asset</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["ALPHA", "BETA", "GAMMA", "DELTA"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTicker(t)}
                          className={`py-2 rounded-sm border text-center transition-all ${
                            selectedTicker === t
                              ? "bg-[#FF5F1F] text-black border-[#FF5F1F] font-bold"
                              : "bg-[#09090b] text-[#a3a3a3] border-[#1e1e1e] hover:border-[#3f3f46]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#09090b] border border-[#1e1e1e] rounded-sm">
                    <div>
                      <div className="text-[10px] text-[#71717a]">Current Price</div>
                      <div className="text-base font-bold text-white">${stockPrices[selectedTicker].toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[#71717a]">Available Float</div>
                      <div className="text-xs font-bold text-[#FF5F1F]">{stockFloats[selectedTicker]} / 100</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#71717a] uppercase mb-1">Order Quantity</label>
                    <div className="flex items-center gap-2">
                      {[1, 5, 10, 20].map((q) => (
                        <button
                          key={q}
                          onClick={() => setTradeQty(q)}
                          className={`flex-1 py-1.5 rounded-sm border text-xs ${
                            tradeQty === q ? "bg-white text-black font-bold" : "bg-[#09090b] text-[#a1a1aa] border-[#1e1e1e]"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={handleBuy}
                      className="flex-1 py-3 bg-[#10B981] text-black font-bold uppercase rounded-sm hover:bg-white transition-colors"
                    >
                      Buy {tradeQty}
                    </button>
                    <button
                      onClick={handleSell}
                      className="flex-1 py-3 bg-[#F43F5E] text-white font-bold uppercase rounded-sm hover:bg-white hover:text-black transition-colors"
                    >
                      Sell {tradeQty}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Portfolio & News Impact Simulator */}
              <div className="lg:col-span-7 space-y-4 font-mono">
                <div className="p-5 bg-[#030303] border border-[#1e1e1e] rounded-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase text-[#a1a1aa] font-bold">Simulated Portfolio</span>
                    <span className="text-[10px] text-[#71717a]">{Object.keys(portfolio).length} Active Holdings</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(portfolio).map(([ticker, qty]) => {
                      const value = (stockPrices[ticker] || 0) * qty;
                      return (
                        <div key={ticker} className="p-2.5 bg-[#09090b] border border-[#1e1e1e] rounded-sm">
                          <div className="flex justify-between items-center text-xs font-bold text-white">
                            <span>{ticker}</span>
                            <span className="text-[#FF5F1F]">{qty} shares</span>
                          </div>
                          <div className="text-[11px] text-[#a1a1aa] mt-1">{formatCurrency(value)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* News Shock & Reset Buttons */}
                <div className="p-5 bg-[#030303] border border-[#1e1e1e] rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF5F1F]" />
                      Simulate Sample Market Shock
                    </div>
                    <div className="text-[11px] text-[#71717a]">
                      Applies pre-calculated price shifts based on sample scenario news.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleSimulateShock}
                      className="px-4 py-2 bg-[#FF5F1F]/20 border border-[#FF5F1F] text-[#FF5F1F] hover:bg-[#FF5F1F] hover:text-black font-semibold text-xs rounded-sm transition-all whitespace-nowrap"
                    >
                      Trigger Shock
                    </button>
                    <button
                      onClick={handleReset}
                      className="p-2 border border-[#27272a] text-[#71717a] hover:text-white rounded-sm"
                      title="Reset Sandbox"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Feedback Toast */}
                {actionMessage && (
                  <div className="p-3 bg-[#09090b] border border-[#27272a] text-xs text-white rounded-sm flex items-center gap-2 animate-pulse">
                    <span>{actionMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

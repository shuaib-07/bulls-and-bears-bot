"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/src/lib/utils";
import { CompanyLogo } from "./CompanyLogo";
import { ArrowUp, ArrowDown, Activity, AlertCircle, ShieldAlert } from "lucide-react";

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderBookDepthProps {
  currentPrice: number;
  ticker?: string;
  name?: string;
  sector?: string;
  availableSupply?: number; // 0 to 100 float
  roundChangePercent?: number;
  className?: string;
}

export function OrderBookDepth({
  currentPrice,
  ticker = "NVDA",
  name = "NVIDIA Corporation",
  sector = "Semiconductors",
  availableSupply = 100,
  roundChangePercent = 0,
  className = "",
}: OrderBookDepthProps) {
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [bids, setBids] = useState<OrderBookLevel[]>([]);

  // Generate float-aware live orderbook depth around current market price
  useEffect(() => {
    const step = 0.01;
    const generateLevels = () => {
      // 1. Float-Aware Ask Scaling:
      // If float is exhausted (0), ask size is 0.
      // If float is critical (< 30), ask size is 1-4 shares per tier.
      // If float is high (>= 70), ask size is 10-25 shares per tier.
      const floatRatio = Math.max(0, Math.min(1, availableSupply / 100));

      let cumulativeAsk = 0;
      const newAsks: OrderBookLevel[] = [];
      for (let i = 8; i >= 1; i--) {
        let size = 0;
        if (availableSupply > 0) {
          const baseSize = Math.floor(floatRatio * 35) + 2;
          const randomVariation = Math.floor(Math.random() * (floatRatio * 15 + 3));
          size = Math.max(1, Math.min(availableSupply, baseSize + randomVariation));
        }
        cumulativeAsk += size;
        newAsks.push({
          price: Number((currentPrice + i * step).toFixed(2)),
          size,
          total: cumulativeAsk,
        });
      }

      // 2. Bid Demand Scaling:
      // Lower available supply creates higher bidding competition
      const bidMultiplier = availableSupply < 30 ? 1.5 : 1.0;
      let cumulativeBid = 0;
      const newBids: OrderBookLevel[] = [];
      for (let i = 1; i <= 8; i++) {
        const baseSize = Math.floor(Math.random() * 30 * bidMultiplier) + 15;
        cumulativeBid += baseSize;
        newBids.push({
          price: Number((currentPrice - i * step).toFixed(2)),
          size: baseSize,
          total: cumulativeBid,
        });
      }

      setAsks(newAsks);
      setBids(newBids);
    };

    generateLevels();
    const interval = setInterval(generateLevels, 2000);
    return () => clearInterval(interval);
  }, [currentPrice, availableSupply]);

  const maxTotal = Math.max(
    asks[0]?.total || 1,
    bids[bids.length - 1]?.total || 1,
    150
  );

  const spread = 0.02;
  const spreadPct = ((spread / Math.max(currentPrice, 1)) * 100).toFixed(3);
  const isUp = roundChangePercent >= 0;

  return (
    <div className={`bg-[#050507] border border-[#1e1e1e] rounded-xl p-3.5 font-mono text-xs select-none space-y-3 ${className}`}>
      {/* Inspected Stock Header HUD */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#18181b]">
        <div className="flex items-center gap-2.5 min-w-0">
          <CompanyLogo ticker={ticker} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <span className="text-[#FF5F1F]">{ticker}</span>
              <span className="text-[#71717a] truncate max-w-[100px] hidden sm:inline">{name}</span>
            </div>
            <div className="text-[10px] text-[#71717a] truncate">
              {sector}
            </div>
          </div>
        </div>

        {/* Float Supply Scarcity Badge */}
        <div className="text-right shrink-0">
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
              availableSupply === 0
                ? "bg-red-950/80 text-red-400 border-red-800 animate-pulse"
                : availableSupply < 30
                ? "bg-amber-950/80 text-amber-400 border-amber-800"
                : "bg-emerald-950/60 text-emerald-400 border-emerald-800"
            }`}
          >
            {availableSupply === 0 ? (
              <>
                <AlertCircle className="w-2.5 h-2.5" />
                <span>FLOAT 0/100 (EMPTY)</span>
              </>
            ) : availableSupply < 30 ? (
              <>
                <Activity className="w-2.5 h-2.5" />
                <span>FLOAT {availableSupply}/100 (SCARCE)</span>
              </>
            ) : (
              <span>FLOAT {availableSupply}/100</span>
            )}
          </span>
        </div>
      </div>

      {/* Orderbook Header Columns */}
      <div className="grid grid-cols-3 text-[10px] uppercase text-[#71717a] font-bold pb-1.5 border-b border-[#18181b]">
        <span>Price ($)</span>
        <span className="text-right">Ask Size</span>
        <span className="text-right">Total Depth</span>
      </div>

      {/* Asks (Sell Orders - Red Ladder) */}
      <div className="space-y-0.5">
        {availableSupply === 0 ? (
          <div className="p-3 text-center text-[10px] text-red-400/80 bg-red-950/20 border border-red-900/40 rounded-lg">
            NO SELL LIQUIDITY (100% OF SHARES OWNED BY TEAMS)
          </div>
        ) : (
          asks.map((ask) => {
            const depthPct = Math.min(100, Math.round((ask.total / maxTotal) * 100));
            return (
              <div
                key={ask.price}
                className="grid grid-cols-3 text-[11px] py-0.5 px-1 relative items-center hover:bg-red-950/20 transition-colors"
              >
                {/* Red Depth Volume Bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-red-950/40 border-r border-red-500/50 pointer-events-none transition-all duration-300"
                  style={{ width: `${depthPct}%` }}
                />
                <span className="text-[#F43F5E] font-semibold relative z-10">
                  ${ask.price.toFixed(2)}
                </span>
                <span className="text-right text-[#a1a1aa] relative z-10">
                  {ask.size}
                </span>
                <span className="text-right text-white font-medium relative z-10">
                  {ask.total}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Mid Market Price & Live Spread Banner */}
      <div className="py-2 px-2.5 bg-[#09090b] border border-[#1e1e1e] rounded-lg flex items-center justify-between shadow-inner">
        <div className="flex items-baseline gap-2">
          <span className="text-sm sm:text-base font-bold text-white">
            ${currentPrice.toFixed(2)}
          </span>
          <span
            className={`text-[10px] font-bold flex items-center gap-0.5 ${
              isUp ? "text-[#10B981]" : "text-[#F43F5E]"
            }`}
          >
            {isUp ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
            {isUp ? "+" : ""}{roundChangePercent}%
          </span>
        </div>
        <div className="text-[10px] text-[#a1a1aa]">
          Spread: <span className="text-white font-semibold">${spread} ({spreadPct}%)</span>
        </div>
      </div>

      {/* Bids (Buy Orders - Green Ladder) */}
      <div className="space-y-0.5">
        {bids.map((bid) => {
          const depthPct = Math.min(100, Math.round((bid.total / maxTotal) * 100));
          return (
            <div
              key={bid.price}
              className="grid grid-cols-3 text-[11px] py-0.5 px-1 relative items-center hover:bg-emerald-950/20 transition-colors"
            >
              {/* Green Depth Volume Bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-emerald-950/40 border-r border-[#10B981]/50 pointer-events-none transition-all duration-300"
                style={{ width: `${depthPct}%` }}
              />
              <span className="text-[#10B981] font-semibold relative z-10">
                ${bid.price.toFixed(2)}
              </span>
              <span className="text-right text-[#a1a1aa] relative z-10">
                {bid.size}
              </span>
              <span className="text-right text-white font-medium relative z-10">
                {bid.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderBookDepth;

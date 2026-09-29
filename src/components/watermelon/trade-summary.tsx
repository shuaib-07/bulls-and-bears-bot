'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { cn, formatCurrency } from '@/src/lib/utils';

export interface TradeItem {
  id: string;
  asset: string;
  session: string;
  market: string;
  strategy: string;
  description: string;
  pnl: number;
  sparklineData: number[];
  tags: string[];
  contracts: number;
  side: 'LONG' | 'SHORT';
}

interface TradeSummaryProps {
  date: string;
  trades: TradeItem[];
  onAddTrade?: () => void;
}

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const width = 80;
  const height = 24;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padding - ((d - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <motion.polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
};

export const TradeSummary: React.FC<TradeSummaryProps> = ({ date, trades, onAddTrade }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const totalPnl = trades.reduce((acc, curr) => acc + curr.pnl, 0);
  const isPositiveTotal = totalPnl >= 0;

  const filteredTrades = trades.filter(
    (t) =>
      t.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.strategy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-xl font-mono select-none">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[#27272a] bg-[#09090b] shadow-2xl backdrop-blur-xl">
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#1e1e1e] bg-[#030303]/80">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F]">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-white uppercase tracking-wider">Performance Journal</span>
              <div className="text-[10px] text-[#71717a]">{date}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-[#71717a] uppercase">Aggregate P&L</div>
            <div className={`text-sm font-extrabold ${isPositiveTotal ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
              {isPositiveTotal ? '+' : ''}
              {formatCurrency(totalPnl)}
            </div>
          </div>
        </header>

        {/* Search Filter Bar */}
        <div className="p-3 bg-[#0c0c0e] border-b border-[#1e1e1e]">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-[#71717a] w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search positions, sectors, or strategies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#27272a] bg-[#030303] py-2 pr-3 pl-9 text-xs text-white placeholder-[#71717a] outline-none focus:border-[#FF5F1F]"
            />
          </div>
        </div>

        {/* Positions List */}
        <div className="max-h-[360px] overflow-y-auto p-4 space-y-3 bg-[#09090b]">
          <AnimatePresence mode="popLayout">
            {filteredTrades.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#71717a]">
                No active positions found matching your search.
              </div>
            ) : (
              filteredTrades.map((trade) => {
                const isPositive = trade.pnl >= 0;
                const accentColor = isPositive ? '#10B981' : '#F43F5E';

                return (
                  <motion.div
                    key={trade.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-3.5 rounded-xl border border-[#1e1e1e] bg-[#030303] hover:border-[#27272a] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-wide">{trade.asset}</h4>
                        <div className="text-[10px] text-[#71717a] flex items-center gap-1.5 mt-0.5">
                          <span>{trade.session}</span>
                          <span>•</span>
                          <span className="text-[#FF5F1F] font-semibold">{trade.market}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Sparkline data={trade.sparklineData} color={accentColor} />
                        <div className="text-right">
                          <span className={`text-xs font-bold ${isPositive ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                            {isPositive ? '+' : ''}${Math.abs(trade.pnl).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed mb-2.5">
                      {trade.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#18181b] text-[10px]">
                      <div className="flex flex-wrap gap-1.5">
                        {trade.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#a1a1aa]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800 text-purple-300 font-bold">
                          {trade.contracts} Shares
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            trade.side === 'LONG'
                              ? 'bg-emerald-950/40 border border-emerald-800 text-[#10B981]'
                              : 'bg-rose-950/40 border border-rose-800 text-[#F43F5E]'
                          }`}
                        >
                          {trade.side}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="px-5 py-3 border-t border-[#1e1e1e] bg-[#030303] flex items-center justify-between text-[11px] text-[#71717a]">
          <span>Total Positions: <strong className="text-white">{filteredTrades.length}</strong></span>
          <span className="text-[#a1a1aa]">Realtime Portfolio Synced</span>
        </footer>
      </div>
    </div>
  );
};

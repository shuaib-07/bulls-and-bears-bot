"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeSummary = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("motion/react");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/src/lib/utils");
const Sparkline = ({ data, color }) => {
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
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: `0 0 ${width} ${height}`, className: "overflow-visible", children: (0, jsx_runtime_1.jsx)(react_2.motion.polyline, { fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", points: points, initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 0.8, ease: 'easeOut' } }) }));
};
const TradeSummary = ({ date, trades, onAddTrade }) => {
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const totalPnl = trades.reduce((acc, curr) => acc + curr.pnl, 0);
    const isPositiveTotal = totalPnl >= 0;
    const filteredTrades = trades.filter((t) => t.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.strategy.toLowerCase().includes(searchQuery.toLowerCase()));
    return ((0, jsx_runtime_1.jsx)("div", { className: "w-full max-w-xl font-mono select-none", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col overflow-hidden rounded-2xl border border-[#27272a] bg-[#09090b] shadow-2xl backdrop-blur-xl", children: [(0, jsx_runtime_1.jsxs)("header", { className: "flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#1e1e1e] bg-[#030303]/80", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-xs", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-6 h-6 rounded bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "w-3.5 h-3.5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-bold text-white uppercase tracking-wider", children: "Performance Journal" }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a]", children: date })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Aggregate P&L" }), (0, jsx_runtime_1.jsxs)("div", { className: `text-sm font-extrabold ${isPositiveTotal ? 'text-[#10B981]' : 'text-[#F43F5E]'}`, children: [isPositiveTotal ? '+' : '', (0, utils_1.formatCurrency)(totalPnl)] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-3 bg-[#0c0c0e] border-b border-[#1e1e1e]", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute top-1/2 left-3 -translate-y-1/2 text-[#71717a] w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search positions, sectors, or strategies...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full rounded-lg border border-[#27272a] bg-[#030303] py-2 pr-3 pl-9 text-xs text-white placeholder-[#71717a] outline-none focus:border-[#FF5F1F]" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "max-h-[360px] overflow-y-auto p-4 space-y-3 bg-[#09090b]", children: (0, jsx_runtime_1.jsx)(react_2.AnimatePresence, { mode: "popLayout", children: filteredTrades.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "py-8 text-center text-xs text-[#71717a]", children: "No active positions found matching your search." })) : (filteredTrades.map((trade) => {
                            const isPositive = trade.pnl >= 0;
                            const accentColor = isPositive ? '#10B981' : '#F43F5E';
                            return ((0, jsx_runtime_1.jsxs)(react_2.motion.div, { layout: true, initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.98 }, className: "p-3.5 rounded-xl border border-[#1e1e1e] bg-[#030303] hover:border-[#27272a] transition-all", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2 mb-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-xs font-bold text-white tracking-wide", children: trade.asset }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#71717a] flex items-center gap-1.5 mt-0.5", children: [(0, jsx_runtime_1.jsx)("span", { children: trade.session }), (0, jsx_runtime_1.jsx)("span", { children: "\u2022" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F] font-semibold", children: trade.market })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(Sparkline, { data: trade.sparklineData, color: accentColor }), (0, jsx_runtime_1.jsx)("div", { className: "text-right", children: (0, jsx_runtime_1.jsxs)("span", { className: `text-xs font-bold ${isPositive ? 'text-[#10B981]' : 'text-[#F43F5E]'}`, children: [isPositive ? '+' : '', "$", Math.abs(trade.pnl).toLocaleString()] }) })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-[#a1a1aa] leading-relaxed mb-2.5", children: trade.description }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pt-2 border-t border-[#18181b] text-[10px]", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1.5", children: trade.tags.map((tag) => ((0, jsx_runtime_1.jsx)("span", { className: "px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#a1a1aa]", children: tag }, tag))) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800 text-purple-300 font-bold", children: [trade.contracts, " Shares"] }), (0, jsx_runtime_1.jsx)("span", { className: `px-2 py-0.5 rounded font-bold ${trade.side === 'LONG'
                                                            ? 'bg-emerald-950/40 border border-emerald-800 text-[#10B981]'
                                                            : 'bg-rose-950/40 border border-rose-800 text-[#F43F5E]'}`, children: trade.side })] })] })] }, trade.id));
                        })) }) }), (0, jsx_runtime_1.jsxs)("footer", { className: "px-5 py-3 border-t border-[#1e1e1e] bg-[#030303] flex items-center justify-between text-[11px] text-[#71717a]", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Total Positions: ", (0, jsx_runtime_1.jsx)("strong", { className: "text-white", children: filteredTrades.length })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[#a1a1aa]", children: "Realtime Portfolio Synced" })] })] }) }));
};
exports.TradeSummary = TradeSummary;

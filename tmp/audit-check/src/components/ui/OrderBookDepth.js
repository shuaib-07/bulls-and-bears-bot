"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBookDepth = OrderBookDepth;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const CompanyLogo_1 = require("./CompanyLogo");
const lucide_react_1 = require("lucide-react");
function OrderBookDepth({ currentPrice, ticker = "NVDA", name = "NVIDIA Corporation", sector = "Semiconductors", availableSupply = 100, roundChangePercent = 0, className = "", }) {
    const [asks, setAsks] = (0, react_1.useState)([]);
    const [bids, setBids] = (0, react_1.useState)([]);
    // Generate float-aware live orderbook depth around current market price
    (0, react_1.useEffect)(() => {
        const step = 0.01;
        const generateLevels = () => {
            // 1. Float-Aware Ask Scaling:
            // If float is exhausted (0), ask size is 0.
            // If float is critical (< 30), ask size is 1-4 shares per tier.
            // If float is high (>= 70), ask size is 10-25 shares per tier.
            const floatRatio = Math.max(0, Math.min(1, availableSupply / 100));
            let cumulativeAsk = 0;
            const newAsks = [];
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
            const newBids = [];
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
    const maxTotal = Math.max(asks[0]?.total || 1, bids[bids.length - 1]?.total || 1, 150);
    const spread = 0.02;
    const spreadPct = ((spread / Math.max(currentPrice, 1)) * 100).toFixed(3);
    const isUp = roundChangePercent >= 0;
    return ((0, jsx_runtime_1.jsxs)("div", { className: `bg-[#050507] border border-[#1e1e1e] rounded-xl p-3.5 font-mono text-xs select-none space-y-3 ${className}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-2.5 border-b border-[#18181b]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5 min-w-0", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: ticker, size: "sm" }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 font-bold text-white text-xs", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F]", children: ticker }), (0, jsx_runtime_1.jsx)("span", { className: "text-[#71717a] truncate max-w-[100px] hidden sm:inline", children: name })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] truncate", children: sector })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-right shrink-0", children: (0, jsx_runtime_1.jsx)("span", { className: `text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${availableSupply === 0
                                ? "bg-red-950/80 text-red-400 border-red-800 animate-pulse"
                                : availableSupply < 30
                                    ? "bg-amber-950/80 text-amber-400 border-amber-800"
                                    : "bg-emerald-950/60 text-emerald-400 border-emerald-800"}`, children: availableSupply === 0 ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-2.5 h-2.5" }), (0, jsx_runtime_1.jsx)("span", { children: "FLOAT 0/100 (EMPTY)" })] })) : availableSupply < 30 ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "w-2.5 h-2.5" }), (0, jsx_runtime_1.jsxs)("span", { children: ["FLOAT ", availableSupply, "/100 (SCARCE)"] })] })) : ((0, jsx_runtime_1.jsxs)("span", { children: ["FLOAT ", availableSupply, "/100"] })) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 text-[10px] uppercase text-[#71717a] font-bold pb-1.5 border-b border-[#18181b]", children: [(0, jsx_runtime_1.jsx)("span", { children: "Price ($)" }), (0, jsx_runtime_1.jsx)("span", { className: "text-right", children: "Ask Size" }), (0, jsx_runtime_1.jsx)("span", { className: "text-right", children: "Total Depth" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-0.5", children: availableSupply === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "p-3 text-center text-[10px] text-red-400/80 bg-red-950/20 border border-red-900/40 rounded-lg", children: "NO SELL LIQUIDITY (100% OF SHARES OWNED BY TEAMS)" })) : (asks.map((ask) => {
                    const depthPct = Math.min(100, Math.round((ask.total / maxTotal) * 100));
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 text-[11px] py-0.5 px-1 relative items-center hover:bg-red-950/20 transition-colors", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute right-0 top-0 bottom-0 bg-red-950/40 border-r border-red-500/50 pointer-events-none transition-all duration-300", style: { width: `${depthPct}%` } }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[#F43F5E] font-semibold relative z-10", children: ["$", ask.price.toFixed(2)] }), (0, jsx_runtime_1.jsx)("span", { className: "text-right text-[#a1a1aa] relative z-10", children: ask.size }), (0, jsx_runtime_1.jsx)("span", { className: "text-right text-white font-medium relative z-10", children: ask.total })] }, ask.price));
                })) }), (0, jsx_runtime_1.jsxs)("div", { className: "py-2 px-2.5 bg-[#09090b] border border-[#1e1e1e] rounded-lg flex items-center justify-between shadow-inner", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-baseline gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-sm sm:text-base font-bold text-white", children: ["$", currentPrice.toFixed(2)] }), (0, jsx_runtime_1.jsxs)("span", { className: `text-[10px] font-bold flex items-center gap-0.5 ${isUp ? "text-[#10B981]" : "text-[#F43F5E]"}`, children: [isUp ? (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUp, { className: "w-2.5 h-2.5" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDown, { className: "w-2.5 h-2.5" }), isUp ? "+" : "", roundChangePercent, "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#a1a1aa]", children: ["Spread: ", (0, jsx_runtime_1.jsxs)("span", { className: "text-white font-semibold", children: ["$", spread, " (", spreadPct, "%)"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-0.5", children: bids.map((bid) => {
                    const depthPct = Math.min(100, Math.round((bid.total / maxTotal) * 100));
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 text-[11px] py-0.5 px-1 relative items-center hover:bg-emerald-950/20 transition-colors", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute right-0 top-0 bottom-0 bg-emerald-950/40 border-r border-[#10B981]/50 pointer-events-none transition-all duration-300", style: { width: `${depthPct}%` } }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[#10B981] font-semibold relative z-10", children: ["$", bid.price.toFixed(2)] }), (0, jsx_runtime_1.jsx)("span", { className: "text-right text-[#a1a1aa] relative z-10", children: bid.size }), (0, jsx_runtime_1.jsx)("span", { className: "text-right text-white font-medium relative z-10", children: bid.total })] }, bid.price));
                }) })] }));
}
exports.default = OrderBookDepth;

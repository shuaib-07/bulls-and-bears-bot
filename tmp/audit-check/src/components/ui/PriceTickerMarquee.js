"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceTickerMarquee = PriceTickerMarquee;
const jsx_runtime_1 = require("react/jsx-runtime");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const market_data_1 = require("@/src/lib/market-data");
const CompanyLogo_1 = require("./CompanyLogo");
function PriceTickerMarquee({ className = "", speed = 45, stocks, }) {
    // Use live stocks or default master data
    const tickerItems = stocks && stocks.length > 0
        ? stocks
        : market_data_1.STOCKS_DATA.map((s) => ({
            ticker: s.ticker,
            currentPrice: s.startingPrice,
            roundChangePercent: Math.round((Math.sin(s.startingPrice) * 15) * 10) / 10,
        }));
    // Duplicate for seamless infinite loop
    const duplicatedItems = [...tickerItems, ...tickerItems];
    return ((0, jsx_runtime_1.jsxs)("div", { className: `w-full overflow-hidden bg-[#050508] border-y border-[#1e1e1e] py-2.5 relative select-none font-mono ${className}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute left-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-r from-[#030303] via-[#030303]/80 to-transparent z-10 pointer-events-none" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute right-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-l from-[#030303] via-[#030303]/80 to-transparent z-10 pointer-events-none" }), (0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { className: "flex items-center gap-4 sm:gap-6 whitespace-nowrap will-change-transform", animate: { x: ["0%", "-50%"] }, transition: {
                    repeat: Infinity,
                    ease: "linear",
                    duration: speed,
                }, children: duplicatedItems.map((item, index) => {
                    const isUp = item.roundChangePercent >= 0;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#09090b]/80 border border-[#27272a] hover:border-[#FF5F1F]/60 transition-all shadow-sm group", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: item.ticker, size: "sm" }), (0, jsx_runtime_1.jsx)("span", { className: "font-bold text-white text-xs tracking-wider group-hover:text-[#FF5F1F] transition-colors", children: item.ticker }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-semibold text-[#d4d4d8]", children: ["$", item.currentPrice.toFixed(2)] }), (0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center gap-0.5 text-[11px] font-bold ${isUp ? "text-[#10B981]" : "text-[#F43F5E]"}`, children: [isUp ? ((0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUpRight, { className: "w-3.5 h-3.5" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDownRight, { className: "w-3.5 h-3.5" })), isUp ? "+" : "", item.roundChangePercent, "%"] })] }, `${item.ticker}-${index}`));
                }) })] }));
}

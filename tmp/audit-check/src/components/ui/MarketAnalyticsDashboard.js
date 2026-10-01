"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketAnalyticsDashboard = MarketAnalyticsDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const market_data_1 = require("@/src/lib/market-data");
const CompanyLogo_1 = require("./CompanyLogo");
// Synthetic historical series generator
function generateSeries(base, drift) {
    const out = [base];
    for (let i = 1; i < 24; i++) {
        const noise = (Math.sin(i * 1.7 + base) * 0.5 + Math.cos(i * 0.6) * 0.3) * 0.6;
        out.push(out[i - 1] * (1 + drift / 6 + noise / 100));
    }
    return out;
}
const ALLOCATION = [
    { name: "Tech & Chips", pct: 42, color: "rgb(255 95 31)" },
    { name: "Financials", pct: 23, color: "rgb(56 189 248)" },
    { name: "Energy & Oil", pct: 18, color: "rgb(16 185 129)" },
    { name: "Healthcare", pct: 9, color: "rgb(168 85 247)" },
    { name: "Cash Reserve", pct: 8, color: "rgb(127 127 127)" },
];
function MarketAnalyticsDashboard({ stocks = market_data_1.STOCKS_DATA, }) {
    const [selectedTicker, setSelectedTicker] = (0, react_1.useState)("NVDA");
    const [selectedRange, setSelectedRange] = (0, react_1.useState)("1D");
    const currentStock = stocks.find((s) => s.ticker === selectedTicker) || stocks[0];
    const isPositive = (currentStock.prices.r1 - currentStock.prices.start) >= 0;
    const changePct = (((currentStock.prices.r1 - currentStock.prices.start) / currentStock.prices.start) * 100);
    const seriesData = generateSeries(currentStock.startingPrice, isPositive ? 0.015 : -0.012);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full space-y-6 font-mono", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-px overflow-hidden rounded-sm border border-[#27272a] bg-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-8 bg-[#09090b] p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-baseline justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: currentStock.ticker, size: "md" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-display text-xl sm:text-2xl font-bold text-white", children: currentStock.ticker }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-[#71717a] uppercase ml-2", children: currentStock.name })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-3 flex items-baseline gap-3", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-3xl sm:text-4xl font-bold text-white tabular-nums", children: ["$", currentStock.startingPrice.toFixed(2)] }), (0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${isPositive ? "text-[#10B981]" : "text-[#F43F5E]"}`, children: [isPositive ? (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUpRight, { className: "w-4 h-4" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDownRight, { className: "w-4 h-4" }), isPositive ? "+" : "", changePct.toFixed(2), "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] text-[#71717a] mt-1", children: ["Sector: ", currentStock.sector, " \u2022 Baseline 100 Shares Float"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-1", children: ["1D", "1W", "1M", "1Y", "ALL"].map((range) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setSelectedRange(range), className: `px-2.5 py-1 text-[10px] uppercase font-bold rounded-sm transition-colors ${selectedRange === range
                                                ? "bg-[#FF5F1F] text-black"
                                                : "text-[#71717a] hover:text-white bg-[#030303] border border-[#1e1e1e]"}`, children: range }, range))) })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6", children: (0, jsx_runtime_1.jsx)(PriceChart, { values: seriesData, positive: isPositive }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-4 bg-[#09090b] p-6 flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase tracking-widest", children: "Simulated Baseline Capital" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-2 text-3xl font-bold text-white tabular-nums font-display", children: "$100,000.00" }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#10B981]", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUpRight, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Full Liquidity at Opening Bell" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase tracking-widest mb-2", children: "Optimal Sector Diversification" }), (0, jsx_runtime_1.jsx)("div", { className: "flex h-2.5 overflow-hidden rounded-full bg-[#1e1e1e]", children: ALLOCATION.map((a) => ((0, jsx_runtime_1.jsx)("div", { style: { width: `${a.pct}%`, backgroundColor: a.color }, className: "h-full transition-all" }, a.name))) }), (0, jsx_runtime_1.jsx)("ul", { className: "mt-4 space-y-2 text-xs", children: ALLOCATION.map((a) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2 text-[#d4d4d8]", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: a.color } }), a.name] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[#a1a1aa] font-semibold", children: [a.pct, "%"] })] }, a.name))) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "pt-4 border-t border-[#1e1e1e] text-[10px] text-[#71717a]", children: "*Diversification mitigates single-stock -30% event shocks." })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-[#09090b] border border-[#27272a] rounded-sm overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-4 border-b border-[#1e1e1e] flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-bold text-white uppercase flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { className: "w-4 h-4 text-[#FF5F1F]" }), "Market Watchlist & Float Depletion Monitor"] }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a] uppercase", children: "Click row to view chart" })] }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-xs", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-[#1e1e1e] text-[10px] text-[#71717a] uppercase", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2.5 font-medium", children: "Asset" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2.5 font-medium", children: "Sector" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2.5 text-right font-medium", children: "Price" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2.5 text-right font-medium", children: "Expected \u0394" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2.5 font-medium text-center", children: "Trend (24h)" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2.5 text-right font-medium", children: "Float Status" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-[#18181b]", children: stocks.slice(0, 8).map((stock) => {
                                        const isStockUp = (stock.prices.r1 - stock.prices.start) >= 0;
                                        const pct = (((stock.prices.r1 - stock.prices.start) / stock.prices.start) * 100);
                                        const sparkData = generateSeries(stock.startingPrice, isStockUp ? 0.012 : -0.01);
                                        const sparkColor = isStockUp ? "#10B981" : "#F43F5E";
                                        return ((0, jsx_runtime_1.jsxs)("tr", { onClick: () => setSelectedTicker(stock.ticker), className: `hover:bg-[#18181b] cursor-pointer transition-colors ${selectedTicker === stock.ticker ? "bg-[#FF5F1F]/10" : ""}`, children: [(0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: stock.ticker, size: "sm" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "font-bold text-white", children: stock.ticker }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] truncate max-w-[120px]", children: stock.name })] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-[#a1a1aa] text-[11px]", children: stock.sector }), (0, jsx_runtime_1.jsxs)("td", { className: "px-4 py-3 text-right font-bold text-white", children: ["$", stock.startingPrice.toFixed(2)] }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-right", children: (0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center gap-0.5 font-bold ${isStockUp ? "text-[#10B981]" : "text-[#F43F5E]"}`, children: [isStockUp ? "+" : "", pct.toFixed(1), "%"] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: (0, jsx_runtime_1.jsx)("div", { className: "h-6 w-28 mx-auto", children: (0, jsx_runtime_1.jsx)(Spark, { values: sparkData, color: sparkColor }) }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-right", children: (0, jsx_runtime_1.jsx)("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20", children: "100 / 100 Float" }) })] }, stock.ticker));
                                    }) })] }) })] })] }));
}
// SVG Area Chart Component
function PriceChart({ values, positive }) {
    const w = 700;
    const h = 180;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = Math.max(0.001, max - min);
    const stepX = w / (values.length - 1);
    const pts = values
        .map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 20) - 10}`)
        .join(" L ");
    const color = positive ? "#10B981" : "#F43F5E";
    return ((0, jsx_runtime_1.jsxs)("svg", { viewBox: `0 0 ${w} ${h}`, className: "h-44 w-full", preserveAspectRatio: "none", children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: "chart-grad", x1: "0", y1: "0", x2: "0", y2: "1", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "0%", stopColor: color, stopOpacity: "0.3" }), (0, jsx_runtime_1.jsx)("stop", { offset: "100%", stopColor: color, stopOpacity: "0" })] }) }), [0.25, 0.5, 0.75].map((y) => ((0, jsx_runtime_1.jsx)("line", { x1: "0", x2: w, y1: h * y, y2: h * y, stroke: "rgba(255, 255, 255, 0.06)", strokeDasharray: "2 4" }, y))), (0, jsx_runtime_1.jsx)("path", { d: `M 0,${h} L ${pts} L ${w},${h} Z`, fill: "url(#chart-grad)" }), (0, jsx_runtime_1.jsx)("path", { d: `M ${pts}`, fill: "none", stroke: color, strokeWidth: "2" })] }));
}
// Inline SVG Sparkline Component
function Spark({ values, color }) {
    const w = 120;
    const h = 24;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = Math.max(0.001, max - min);
    const stepX = w / (values.length - 1);
    const pts = values
        .map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 4) - 2}`)
        .join(" L ");
    return ((0, jsx_runtime_1.jsx)("svg", { viewBox: `0 0 ${w} ${h}`, className: "h-full w-full", preserveAspectRatio: "none", children: (0, jsx_runtime_1.jsx)("path", { d: `M ${pts}`, fill: "none", stroke: color, strokeWidth: "1.75" }) }));
}

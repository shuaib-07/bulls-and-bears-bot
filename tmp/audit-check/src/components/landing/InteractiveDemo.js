"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractiveDemo = InteractiveDemo;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const sounds_1 = require("@/src/lib/sounds");
const utils_1 = require("@/src/lib/utils");
function InteractiveDemo() {
    const [cash, setCash] = (0, react_1.useState)(100000);
    const [portfolio, setPortfolio] = (0, react_1.useState)({ ALPHA: 15, BETA: 10 });
    const [stockPrices, setStockPrices] = (0, react_1.useState)({
        ALPHA: 150,
        BETA: 220,
        GAMMA: 350,
        DELTA: 480,
    });
    const [stockFloats, setStockFloats] = (0, react_1.useState)({
        ALPHA: 85,
        BETA: 90,
        GAMMA: 100,
        DELTA: 100,
    });
    const [selectedTicker, setSelectedTicker] = (0, react_1.useState)("ALPHA");
    const [tradeQty, setTradeQty] = (0, react_1.useState)(5);
    const [actionMessage, setActionMessage] = (0, react_1.useState)(null);
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
            sounds_1.sounds.playTradeError();
            setActionMessage(`❌ Float exhausted! Only ${available} shares remaining in market pool.`);
            return;
        }
        if (cost > cash) {
            sounds_1.sounds.playTradeError();
            setActionMessage(`❌ Insufficient cash for this order.`);
            return;
        }
        sounds_1.sounds.playTradeSuccess();
        setCash((c) => c - cost);
        setStockFloats((sf) => ({ ...sf, [selectedTicker]: (sf[selectedTicker] || 0) - tradeQty }));
        setPortfolio((p) => ({ ...p, [selectedTicker]: (p[selectedTicker] || 0) + tradeQty }));
        setActionMessage(`✅ Bought ${tradeQty} shares of ${selectedTicker} for ${(0, utils_1.formatCurrency)(cost)}!`);
    };
    const handleSell = () => {
        const price = stockPrices[selectedTicker];
        const owned = portfolio[selectedTicker] || 0;
        const proceeds = price * tradeQty;
        if (tradeQty > owned) {
            sounds_1.sounds.playTradeError();
            setActionMessage(`❌ You only hold ${owned} shares of ${selectedTicker}.`);
            return;
        }
        sounds_1.sounds.playTradeSuccess();
        setCash((c) => c + proceeds);
        setStockFloats((sf) => ({ ...sf, [selectedTicker]: (sf[selectedTicker] || 0) + tradeQty }));
        setPortfolio((p) => {
            const next = { ...p, [selectedTicker]: p[selectedTicker] - tradeQty };
            if (next[selectedTicker] === 0)
                delete next[selectedTicker];
            return next;
        });
        setActionMessage(`✅ Sold ${tradeQty} shares of ${selectedTicker} for ${(0, utils_1.formatCurrency)(proceeds)}!`);
    };
    const handleSimulateShock = () => {
        sounds_1.sounds.playNewsAlert();
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
    return ((0, jsx_runtime_1.jsx)("section", { id: "demo", className: "relative py-24 px-4 md:px-8 cyber-grid", children: (0, jsx_runtime_1.jsx)("div", { className: "section-slab", children: (0, jsx_runtime_1.jsxs)("div", { className: "section-inner max-w-7xl mx-auto", children: [(0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center max-w-3xl mx-auto mb-12", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#FF5F1F] mb-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 bg-[#FF5F1F]" }), "LIVE INTERACTIVE PREVIEW"] }), (0, jsx_runtime_1.jsx)("h2", { className: "text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4", children: "TRY THE SIMULATOR MECHANICS" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm md:text-base text-[#a1a1aa] leading-relaxed", children: "Test out the execution speed, remaining float mechanics, and simulated price shocks below before entering the live terminal." })] }), (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.2 }, className: "bg-[#09090b] border border-[#27272a] rounded-sm p-6 md:p-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 mb-6 border-b border-[#1e1e1e] font-mono", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Cash Balance" }), (0, jsx_runtime_1.jsx)("div", { className: "text-lg font-bold text-white", children: (0, utils_1.formatCurrency)(cash) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Holdings Value" }), (0, jsx_runtime_1.jsx)("div", { className: "text-lg font-bold text-[#3b82f6]", children: (0, utils_1.formatCurrency)(holdingsValue) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Total Portfolio" }), (0, jsx_runtime_1.jsx)("div", { className: "text-lg font-bold text-white", children: (0, utils_1.formatCurrency)(totalPortfolioValue) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Total P/L" }), (0, jsx_runtime_1.jsx)("div", { className: `text-lg font-bold ${pnl >= 0 ? "text-[#10B981]" : "text-[#F43F5E]"}`, children: pnl >= 0 ? `+${(0, utils_1.formatCurrency)(pnl)}` : (0, utils_1.formatCurrency)(pnl) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-5 p-5 bg-[#030303] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-4 font-mono", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs uppercase text-[#a1a1aa] font-bold", children: "Quick Order Slip" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20", children: "SANDBOX OPEN" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 text-xs font-mono", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] text-[#71717a] uppercase mb-1", children: "Select Asset" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-4 gap-2", children: ["ALPHA", "BETA", "GAMMA", "DELTA"].map((t) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setSelectedTicker(t), className: `py-2 rounded-sm border text-center transition-all ${selectedTicker === t
                                                                        ? "bg-[#FF5F1F] text-black border-[#FF5F1F] font-bold"
                                                                        : "bg-[#09090b] text-[#a3a3a3] border-[#1e1e1e] hover:border-[#3f3f46]"}`, children: t }, t))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 bg-[#09090b] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a]", children: "Current Price" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-base font-bold text-white", children: ["$", stockPrices[selectedTicker].toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a]", children: "Available Float" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs font-bold text-[#FF5F1F]", children: [stockFloats[selectedTicker], " / 100"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] text-[#71717a] uppercase mb-1", children: "Order Quantity" }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-2", children: [1, 5, 10, 20].map((q) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setTradeQty(q), className: `flex-1 py-1.5 rounded-sm border text-xs ${tradeQty === q ? "bg-white text-black font-bold" : "bg-[#09090b] text-[#a1a1aa] border-[#1e1e1e]"}`, children: q }, q))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "pt-2 flex gap-3", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: handleBuy, className: "flex-1 py-3 bg-[#10B981] text-black font-bold uppercase rounded-sm hover:bg-white transition-colors", children: ["Buy ", tradeQty] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleSell, className: "flex-1 py-3 bg-[#F43F5E] text-white font-bold uppercase rounded-sm hover:bg-white hover:text-black transition-colors", children: ["Sell ", tradeQty] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-7 space-y-4 font-mono", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-5 bg-[#030303] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs uppercase text-[#a1a1aa] font-bold", children: "Simulated Portfolio" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] text-[#71717a]", children: [Object.keys(portfolio).length, " Active Holdings"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: Object.entries(portfolio).map(([ticker, qty]) => {
                                                            const value = (stockPrices[ticker] || 0) * qty;
                                                            return ((0, jsx_runtime_1.jsxs)("div", { className: "p-2.5 bg-[#09090b] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center text-xs font-bold text-white", children: [(0, jsx_runtime_1.jsx)("span", { children: ticker }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[#FF5F1F]", children: [qty, " shares"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[11px] text-[#a1a1aa] mt-1", children: (0, utils_1.formatCurrency)(value) })] }, ticker));
                                                        }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-5 bg-[#030303] border border-[#1e1e1e] rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs font-bold text-white flex items-center gap-1.5 mb-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "w-3.5 h-3.5 text-[#FF5F1F]" }), "Simulate Sample Market Shock"] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[11px] text-[#71717a]", children: "Applies pre-calculated price shifts based on sample scenario news." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 w-full sm:w-auto", children: [(0, jsx_runtime_1.jsx)("button", { onClick: handleSimulateShock, className: "px-4 py-2 bg-[#FF5F1F]/20 border border-[#FF5F1F] text-[#FF5F1F] hover:bg-[#FF5F1F] hover:text-black font-semibold text-xs rounded-sm transition-all whitespace-nowrap", children: "Trigger Shock" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleReset, className: "p-2 border border-[#27272a] text-[#71717a] hover:text-white rounded-sm", title: "Reset Sandbox", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RotateCcw, { className: "w-4 h-4" }) })] })] }), actionMessage && ((0, jsx_runtime_1.jsx)("div", { className: "p-3 bg-[#09090b] border border-[#27272a] text-xs text-white rounded-sm flex items-center gap-2 animate-pulse", children: (0, jsx_runtime_1.jsx)("span", { children: actionMessage }) }))] })] })] })] }) }) }));
}

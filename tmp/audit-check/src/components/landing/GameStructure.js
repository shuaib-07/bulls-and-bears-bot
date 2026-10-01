"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStructure = GameStructure;
const jsx_runtime_1 = require("react/jsx-runtime");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
function GameStructure() {
    const phases = [
        {
            step: "01",
            title: "Phase 1: Capital Deployment & Market Launch",
            subtitle: "Initial Allocation & Zero-Hour Readiness",
            desc: "Each registered team receives starting seed capital. The market opens under strict float constraints and active liquidity pools. Strategize early, position your cash, and brace for volatility.",
            badge: "Market Launch",
            accent: "#FF5F1F",
            icon: lucide_react_1.DollarSign,
        },
        {
            step: "02",
            title: "Phase 2: The Information Battleground",
            subtitle: "Cryptic News Flashes & Market Shocks",
            desc: "Classified macroeconomic intelligence and breaking industry headlines drop each round. Teams race against real-time countdown clocks to decode developments, predict price movements, and execute orders.",
            badge: "Timed Windows",
            accent: "#3b82f6",
            icon: lucide_react_1.Clock,
        },
        {
            step: "03",
            title: "Phase 3: Unforeseen Market Shocks",
            subtitle: "Classified Mid-Game Events",
            desc: "Expect the unexpected. Sudden structural disruptions, shifting market dynamics, and high-stakes negotiation windows will test which teams can adapt under intense pressure.",
            badge: "Classified Event",
            accent: "#eab308",
            icon: lucide_react_1.Sparkles,
        },
        {
            step: "04",
            title: "Phase 4: The Final Showdown & Settlement",
            subtitle: "Portfolio Liquidation & Victor Ascendance",
            desc: "All asset positions settle at closing market valuations. The team with the highest total capital dominance when the closing bell sounds claims the championship.",
            badge: "Grand Finale",
            accent: "#10B981",
            icon: lucide_react_1.TrendingUp,
        },
    ];
    return ((0, jsx_runtime_1.jsx)("section", { id: "structure", className: "relative py-24 px-4 md:px-8 cyber-grid", children: (0, jsx_runtime_1.jsx)("div", { className: "section-slab", children: (0, jsx_runtime_1.jsxs)("div", { className: "section-inner max-w-7xl mx-auto", children: [(0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center max-w-3xl mx-auto mb-16", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#FF5F1F] mb-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 bg-[#FF5F1F]" }), "SIMULATION BLUEPRINT // GAMEPLAY FLOW"] }), (0, jsx_runtime_1.jsx)("h2", { className: "text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4", children: "HOW THE TOURNAMENT WORKS" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm md:text-base text-[#a1a1aa] leading-relaxed", children: "A carefully orchestrated, 4-phase competitive progression designed to test market intuition, speed, and peer-to-peer negotiation." })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: phases.map((phase, idx) => {
                            const Icon = phase.icon;
                            return ((0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: idx * 0.1 }, whileHover: { y: -4 }, className: "group relative p-6 sm:p-8 bg-[#09090b]/80 border border-[#1e1e1e] hover:border-[#3f3f46] rounded-sm transition-all duration-300 flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-6", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-mono font-bold text-[#71717a] group-hover:text-[#FF5F1F] transition-colors", children: ["PHASE // ", phase.step] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-mono font-semibold px-2.5 py-1 rounded-sm border", style: {
                                                            backgroundColor: `${phase.accent}15`,
                                                            borderColor: `${phase.accent}40`,
                                                            color: phase.accent,
                                                        }, children: phase.badge })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-4 mb-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-sm flex items-center justify-center border flex-shrink-0 mt-1", style: {
                                                            backgroundColor: `${phase.accent}10`,
                                                            borderColor: `${phase.accent}30`,
                                                            color: phase.accent,
                                                        }, children: (0, jsx_runtime_1.jsx)(Icon, { className: "w-5 h-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg sm:text-xl font-display font-bold text-white group-hover:text-[#FF5F1F] transition-colors", children: phase.title }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-[#71717a] font-mono mt-0.5", children: phase.subtitle })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs sm:text-sm text-[#a1a1aa] leading-relaxed", children: phase.desc })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 pt-4 border-t border-[#18181b] flex items-center justify-between text-[10px] font-mono uppercase text-[#52525b]", children: [(0, jsx_runtime_1.jsx)("span", { children: "STATUS: LIVE SIMULATION" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[#10B981] flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" }), "SCHEDULED"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500", style: { backgroundColor: phase.accent } })] }, phase.step));
                        }) }), (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.4 }, className: "mt-8 p-4 bg-[#09090b] border border-[#27272a] rounded-sm flex items-center gap-3 text-xs text-[#a1a1aa]", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Lock, { className: "w-4 h-4 text-[#FF5F1F] flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { className: "text-white", children: "Confidential Market Logic:" }), " Round-by-round news headlines, sector clues, and price movement percentages remain classified until released live by the administrator during each round."] })] })] }) }) }));
}

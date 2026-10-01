"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesSection = RulesSection;
const jsx_runtime_1 = require("react/jsx-runtime");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
function RulesSection() {
    const rules = [
        {
            step: "01",
            title: "Real Stocks, Fictional News",
            desc: "Trade publicly listed global market leaders across Tech, Finance, Energy, and Healthcare. Each round releases 5–6 plausible scenario developments without explicit hints. You must deduce the supply chain impact.",
            icon: lucide_react_1.Zap,
            accent: "#FF5F1F",
        },
        {
            step: "02",
            title: "100-Share Scarcity Float",
            desc: "Each stock has an initial market pool of exactly 100 shares. Once depleted, the market cannot sell you more. You must negotiate directly with rival teams holding those shares.",
            icon: lucide_react_1.Lock,
            accent: "#3b82f6",
        },
        {
            step: "03",
            title: "Bilateral P2P Swaps & Direct Sales",
            desc: "Negotiate stock-for-stock trades or direct OTC sales with other teams. No cash combos, no multi-party trades, and NO algorithmic valuation. The value is strictly whatever you negotiate.",
            icon: lucide_react_1.ArrowLeftRight,
            accent: "#10B981",
        },
        {
            step: "04",
            title: "Strict 10-Minute Windows",
            desc: "Rounds operate under strict real-time countdown clocks. Once the timer hits 00:00, all buy, sell, and swap orders instantly freeze. Market prices shift based on the round's event shocks.",
            icon: lucide_react_1.Clock,
            accent: "#eab308",
        },
        {
            step: "05",
            title: "Final Liquidation & Victory",
            desc: "After the final round, all remaining portfolio shares are automatically liquidated at closing prices. The team with the highest total cash balance takes 1st place.",
            icon: lucide_react_1.DollarSign,
            accent: "#F43F5E",
        },
        {
            step: "06",
            title: "Anti-Cheat Ledger",
            desc: "Every order and swap is verified with atomic inventory locks. Short selling, overdrafts, and unconfirmed swaps are programmatically rejected.",
            icon: lucide_react_1.ShieldCheck,
            accent: "#a855f7",
        },
    ];
    return ((0, jsx_runtime_1.jsx)("section", { id: "rules", className: "relative py-24 px-4 md:px-8", children: (0, jsx_runtime_1.jsx)("div", { className: "section-slab", children: (0, jsx_runtime_1.jsxs)("div", { className: "section-inner max-w-7xl mx-auto", children: [(0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center max-w-3xl mx-auto mb-16", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#FF5F1F] mb-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 bg-[#FF5F1F]" }), "SYSTEM ARCHITECTURE // GAME RULES"] }), (0, jsx_runtime_1.jsx)("h2", { className: "text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4", children: "NOT A GENERIC SIMULATOR" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm md:text-base text-[#a1a1aa] leading-relaxed", children: "Bulls & Bears is a strategic war of incomplete information, float scarcity, and high-stakes negotiation designed to test real analytical acuity." })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: rules.map((rule, idx) => {
                            const Icon = rule.icon;
                            return ((0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: idx * 0.08 }, whileHover: { y: -4 }, className: "group relative p-6 md:p-8 bg-[#09090b]/80 border border-[#1e1e1e] hover:border-[#3f3f46] transition-all duration-300 rounded-sm flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-6", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-mono tracking-widest text-[#71717a] group-hover:text-white transition-colors", children: ["RULE // ", rule.step] }), (0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-sm flex items-center justify-center border", style: {
                                                            borderColor: `${rule.accent}40`,
                                                            backgroundColor: `${rule.accent}15`,
                                                            color: rule.accent,
                                                        }, children: (0, jsx_runtime_1.jsx)(Icon, { className: "w-4 h-4" }) })] }), (0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-display font-bold text-white mb-3 group-hover:text-[#FF5F1F] transition-colors", children: rule.title }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs sm:text-sm text-[#a1a1aa] leading-relaxed", children: rule.desc })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 pt-4 border-t border-[#18181b] flex items-center justify-between text-[10px] font-mono uppercase text-[#52525b]", children: [(0, jsx_runtime_1.jsx)("span", { children: "STATUS: ENFORCED" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[#10B981]", children: "SYSTEM ACTIVE" })] }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500", style: { backgroundColor: rule.accent } })] }, rule.step));
                        }) })] }) }) }));
}

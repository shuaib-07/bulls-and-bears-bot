"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQSection = FAQSection;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
function FAQSection() {
    const [openIndex, setOpenIndex] = (0, react_1.useState)(0);
    const faqs = [
        {
            q: "How does the 100-share scarcity float work?",
            a: "Every stock in the simulation begins with a maximum market float of exactly 100 shares. When teams buy shares from the market, the available float decreases. Once it hits 0, nobody can buy that stock from the market anymore. The only way to acquire it is through direct Player-to-Player (P2P) Bilateral Swaps.",
        },
        {
            q: "How do Player-to-Player (P2P) Bilateral Swaps & Direct Sales work?",
            a: "If another team holds a stock you want or you wish to sell directly to a rival team, you can propose direct trades or bilateral swaps from your terminal. The recipient receives an instant countdown modal on their screen and has a strict timed window to accept or decline. Counterparties must act before market conditions shift.",
        },
        {
            q: "Are the news flashes real or fictional?",
            a: "All news headlines and developments are fictional scenarios created specifically for the competition. However, they are grounded in realistic macroeconomic and industry mechanisms (e.g., semiconductor supply chain shortages, interest rate decisions, energy corridor disruptions). The news will never say 'Buy X'—you must deduce which sectors will win or lose.",
        },
        {
            q: "Can both teammates log in from separate devices simultaneously?",
            a: "Yes! Simply use the same Team Name and Passcode on both laptops or mobile devices. Both teammates share the exact same real-time synchronized cash balance, portfolio, and live order stream.",
        },
        {
            q: "How is the ultimate champion determined?",
            a: "At the conclusion of the tournament, all teams undergo automated portfolio liquidation back to the market at closing prices. The system converts all remaining stock holdings into cash, and the team with the highest final cash balance is declared champion.",
        },
    ];
    return ((0, jsx_runtime_1.jsx)("section", { id: "faq", className: "relative py-24 px-4 md:px-8 cyber-grid", children: (0, jsx_runtime_1.jsx)("div", { className: "section-slab", children: (0, jsx_runtime_1.jsxs)("div", { className: "section-inner max-w-4xl mx-auto", children: [(0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center mb-16", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#FF5F1F] mb-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 bg-[#FF5F1F]" }), "INTEL BRIEFING // FREQUENTLY ASKED QUESTIONS"] }), (0, jsx_runtime_1.jsx)("h2", { className: "text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4", children: "QUESTIONS & PROTOCOLS" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm md:text-base text-[#a1a1aa] leading-relaxed", children: "Everything you need to know about trading mechanics, execution windows, and competition strategy." })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: faqs.map((faq, index) => {
                            const isOpen = openIndex === index;
                            return ((0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.3, delay: index * 0.05 }, className: "bg-[#09090b]/80 border border-[#1e1e1e] hover:border-[#27272a] rounded-sm overflow-hidden transition-colors", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setOpenIndex(isOpen ? null : index), className: "w-full p-5 text-left flex items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm sm:text-base font-semibold text-white", children: faq.q }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: `w-4 h-4 text-[#FF5F1F] transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}` })] }), (0, jsx_runtime_1.jsx)(framer_motion_1.AnimatePresence, { children: isOpen && ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.25 }, className: "overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "px-5 pb-5 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed border-t border-[#18181b] pt-3", children: faq.a }) })) })] }, index));
                        }) })] }) }) }));
}

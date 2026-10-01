"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = Footer;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const market_data_1 = require("@/src/lib/market-data");
function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    return ((0, jsx_runtime_1.jsxs)("footer", { className: "relative border-t border-[#1e1e1e] bg-[#030303] py-12 px-4 md:px-8 font-mono text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-7 h-7 rounded-sm bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 flex items-center justify-center text-[#FF5F1F]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-3.5 h-3.5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "font-display font-bold text-white text-sm", children: ["BULLS", (0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F]", children: "&" }), "BEARS"] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#71717a] uppercase", children: [market_data_1.EVENT_DETAILS.institution, " \u2022 ", market_data_1.EVENT_DETAILS.department] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-6 text-[11px] text-[#a1a1aa] uppercase tracking-wider", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/trade", className: "hover:text-[#FF5F1F] transition-colors", children: "Participant Terminal" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/stage", target: "_blank", className: "hover:text-[#FF5F1F] transition-colors", children: "Stage Display" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/admin", className: "hover:text-[#FF5F1F] transition-colors", children: "Admin Portal" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: scrollToTop, className: "p-2.5 rounded-sm border border-[#27272a] bg-[#09090b] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-all flex items-center gap-2", title: "Return to top", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-[10px] uppercase", children: "Top" }), (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUp, { className: "w-3.5 h-3.5" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "max-w-7xl mx-auto mt-8 pt-6 border-t border-[#18181b] text-center text-[10px] text-[#52525b] uppercase tracking-widest flex flex-col sm:flex-row items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u00A9 2026 Bulls & Bears Trading Simulation. All rights reserved." }), (0, jsx_runtime_1.jsxs)("span", { children: ["Venue: ", market_data_1.EVENT_DETAILS.venue, " \u2022 Free Registration"] })] })] }));
}

"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Navbar = Navbar;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
function Navbar() {
    const scrollTo = (id) => {
        const el = document.querySelector(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };
    return ((0, jsx_runtime_1.jsx)("header", { className: "fixed top-0 inset-x-0 z-50 h-16 backdrop-blur-xl bg-[#030303]/80 border-b border-[var(--border)] transition-colors duration-500", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-[1500px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: "flex items-center gap-3 shrink-0 group", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-sm bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 flex items-center justify-center text-[#FF5F1F] group-hover:border-[#FF5F1F] group-hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,95,31,0.2)]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col", children: [(0, jsx_runtime_1.jsxs)("div", { className: "font-display font-bold text-sm tracking-wider text-white group-hover:text-[#FF5F1F] transition-colors", children: ["BULLS", (0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F]", children: "&" }), "BEARS"] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[9px] uppercase tracking-widest text-[#a1a1aa] font-mono -mt-0.5 hidden sm:block", children: "RUAS Trading Simulation" })] })] }), (0, jsx_runtime_1.jsxs)("nav", { className: "hidden lg:flex items-center gap-6 2xl:gap-8 font-mono", children: [(0, jsx_runtime_1.jsx)("a", { href: "#pinned-stage", onClick: (e) => {
                                e.preventDefault();
                                scrollTo("#pinned-stage");
                            }, className: "nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium is-active", children: "Overview" }), (0, jsx_runtime_1.jsx)("a", { href: "#rules", onClick: (e) => {
                                e.preventDefault();
                                scrollTo("#rules");
                            }, className: "nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium", children: "Rules" }), (0, jsx_runtime_1.jsx)("a", { href: "#structure", onClick: (e) => {
                                e.preventDefault();
                                scrollTo("#structure");
                            }, className: "nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium", children: "Phases" }), (0, jsx_runtime_1.jsx)("a", { href: "#demo", onClick: (e) => {
                                e.preventDefault();
                                scrollTo("#demo");
                            }, className: "nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium", children: "Sandbox" }), (0, jsx_runtime_1.jsx)("a", { href: "#event", onClick: (e) => {
                                e.preventDefault();
                                scrollTo("#event");
                            }, className: "nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium", children: "Schedule" }), (0, jsx_runtime_1.jsx)("a", { href: "#faq", onClick: (e) => {
                                e.preventDefault();
                                scrollTo("#faq");
                            }, className: "nav-link text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors relative pb-1 font-medium", children: "FAQ" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 shrink-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "hidden xl:flex flex-col items-end text-[10px] font-mono tracking-widest uppercase text-[var(--muted)] pr-3 border-r border-[#27272a]", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-[var(--accent)] flex items-center gap-1.5 font-bold", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 bg-[var(--accent)] rounded-none animate-pulse" }), "System.Online"] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[9px] text-[#71717a]", children: "Latency: 12ms" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/stage", target: "_blank", className: "hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider px-3.5 py-2 border border-[var(--border)] bg-[#09090b] text-[#d4d4d8] hover:text-white hover:border-[#3f3f46] hover:bg-[#121215] rounded-sm transition-all shadow-sm", title: "Open Auditorium Projector View", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Tv, { className: "w-3.5 h-3.5 text-[#FF5F1F]" }), (0, jsx_runtime_1.jsx)("span", { children: "Stage View" })] }), (0, jsx_runtime_1.jsxs)("a", { href: "https://tally.so/r/NpkK20", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider px-4 sm:px-5 py-2 bg-[var(--accent)] text-black hover:bg-white transition-all shadow-[0_0_20px_rgba(255,95,31,0.35)] rounded-sm active:scale-95", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Play, { className: "w-3.5 h-3.5 fill-current" }), (0, jsx_runtime_1.jsx)("span", { children: "Register Now" })] })] })] }) }));
}

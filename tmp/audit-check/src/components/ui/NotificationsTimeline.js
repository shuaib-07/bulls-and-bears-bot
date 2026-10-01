"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsTimeline = NotificationsTimeline;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const SAMPLE_NOTIFICATIONS = [
    {
        id: "1",
        who: "Alpha Capital",
        initials: "AC",
        what: "executed a market BUY on",
        context: "20 NVDA @ $180.00",
        time: "2m",
        type: "TRADE",
        unread: true,
    },
    {
        id: "2",
        who: "Beta Quant",
        initials: "BQ",
        what: "proposed a bilateral P2P swap for",
        context: "15 AAPL ⇄ 20 TSLA",
        time: "8m",
        type: "SWAP",
        unread: true,
    },
    {
        id: "3",
        who: "Game Engine",
        initials: "RU",
        what: "broadcast Round 1 scenario intel",
        context: "Semiconductor supply chain alerts",
        time: "15m",
        type: "NEWS",
    },
    {
        id: "4",
        who: "Gamma Ventures",
        initials: "GV",
        what: "exhausted market float on",
        context: "AMD pool (100/100 acquired)",
        time: "22m",
        type: "TRADE",
    },
];
function NotificationsTimeline({ notifications = SAMPLE_NOTIFICATIONS, }) {
    const [filter, setFilter] = (0, react_1.useState)("ALL");
    const filtered = notifications.filter((n) => {
        if (filter === "ALL")
            return true;
        return n.type === filter;
    });
    const getIcon = (type) => {
        switch (type) {
            case "SWAP":
                return (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeftRight, { className: "w-3 h-3 text-[#FF5F1F]" });
            case "TRADE":
                return (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-3 h-3 text-[#10B981]" });
            case "NEWS":
                return (0, jsx_runtime_1.jsx)(lucide_react_1.Newspaper, { className: "w-3 h-3 text-[#3b82f6]" });
            default:
                return (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "w-3 h-3 text-[#a855f7]" });
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-[#09090b] border border-[#27272a] rounded-sm overflow-hidden font-mono text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between border-b border-[#1e1e1e] px-4 py-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bell, { className: "w-4 h-4 text-[#FF5F1F]" }), (0, jsx_runtime_1.jsx)("span", { className: "font-bold text-white text-xs uppercase", children: "Terminal Feed" }), (0, jsx_runtime_1.jsx)("span", { className: "rounded-full bg-[#FF5F1F] px-1.5 py-0.2 font-mono text-[9px] text-black font-bold", children: notifications.filter((n) => n.unread).length })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a] uppercase", children: "Realtime Synced" })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-1 border-b border-[#18181b] px-3 py-2 bg-[#030303]", children: ["ALL", "TRADE", "SWAP"].map((tab) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setFilter(tab), className: `rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase transition-colors ${filter === tab
                        ? "bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/40"
                        : "text-[#71717a] hover:text-white"}`, children: tab }, tab))) }), (0, jsx_runtime_1.jsxs)("ul", { className: "divide-y divide-[#18181b] max-h-80 overflow-y-auto", children: [filtered.length === 0 && ((0, jsx_runtime_1.jsx)("li", { className: "px-4 py-6 text-xs text-[#71717a] text-center", children: "No activity recorded yet." })), filtered.map((n) => ((0, jsx_runtime_1.jsxs)("li", { className: `relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#18181b] ${n.unread ? "bg-[#FF5F1F]/5" : ""}`, children: [n.unread && ((0, jsx_runtime_1.jsx)("span", { className: "absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-[#FF5F1F] animate-pulse" })), (0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-sm bg-[#18181b] border border-[#27272a] flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0", children: n.initials }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0 flex-1 leading-snug", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-bold text-white", children: n.who }), " ", (0, jsx_runtime_1.jsx)("span", { className: "text-[#a1a1aa]", children: n.what }), " ", n.context && (0, jsx_runtime_1.jsx)("strong", { className: "text-[#d4d4d8]", children: n.context })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-1 text-[10px] text-[#71717a] flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { children: n.time }), (0, jsx_runtime_1.jsx)("span", { children: "\u2022" }), (0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1", children: [getIcon(n.type), " ", n.type] })] })] })] }, n.id)))] })] }));
}

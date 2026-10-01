"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAMPAIGNS = exports.DAY_PARTING_DATA = exports.HOURLY_PERFORMANCE = void 0;
exports.KpiCard = KpiCard;
exports.HeatmapCell = HeatmapCell;
exports.StatusBadge = StatusBadge;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/src/lib/utils");
// --- MOCK DATA ---
exports.HOURLY_PERFORMANCE = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    spend: Math.floor(Math.random() * 500) + 100,
    conversions: Math.floor(Math.random() * 20),
    roas: (Math.random() * 3 + 1).toFixed(2),
}));
// A dense heatmap dataset (7 days x 24 hours would be too big for code, simulating simplified version)
exports.DAY_PARTING_DATA = [
    { day: "Mon", hours: [1, 2, 5, 8, 9, 10, 4, 2] }, // 0-3, 3-6, 6-9, 9-12... intensity scores
    { day: "Tue", hours: [2, 3, 6, 9, 10, 8, 5, 3] },
    { day: "Wed", hours: [2, 2, 7, 10, 10, 9, 6, 4] },
    { day: "Thu", hours: [3, 4, 8, 9, 8, 7, 5, 4] },
    { day: "Fri", hours: [4, 5, 9, 7, 6, 5, 8, 7] },
    { day: "Sat", hours: [6, 7, 5, 4, 3, 4, 9, 9] },
    { day: "Sun", hours: [7, 8, 4, 3, 2, 3, 8, 8] },
];
exports.CAMPAIGNS = [
    { id: 1, name: "US_Search_Brand_Alpha", status: "active", budget: 500, spend: 420, impr: 12500, clicks: 850, ctr: 6.8, cpc: 0.49, conv: 95, cpa: 4.42, roas: 4.8 },
    { id: 2, name: "US_Search_NonBrand_Gen", status: "learning", budget: 1200, spend: 890, impr: 45000, clicks: 1200, ctr: 2.6, cpc: 0.74, conv: 42, cpa: 21.19, roas: 1.2 },
    { id: 3, name: "EU_Display_Retargeting", status: "active", budget: 300, spend: 285, impr: 89000, clicks: 450, ctr: 0.5, cpc: 0.63, conv: 28, cpa: 10.17, roas: 3.5 },
    { id: 4, name: "Global_PMax_Shopping", status: "active", budget: 2000, spend: 1950, impr: 120000, clicks: 3100, ctr: 2.5, cpc: 0.62, conv: 410, cpa: 4.75, roas: 5.2 },
    { id: 5, name: "US_Social_Reels_TopFunnel", status: "limited", budget: 800, spend: 800, impr: 65000, clicks: 900, ctr: 1.4, cpc: 0.88, conv: 12, cpa: 66.66, roas: 0.8 },
    { id: 6, name: "US_Search_Competitor", status: "paused", budget: 400, spend: 0, impr: 0, clicks: 0, ctr: 0, cpc: 0, conv: 0, cpa: 0, roas: 0 },
];
// --- COMPONENTS ---
function KpiCard({ title, value, subValue, trend, trendVal, isCurrency = false }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-zinc-900 border border-zinc-800 p-4 rounded-sm flex flex-col justify-between h-28 hover:border-zinc-700 transition-colors", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-zinc-400 text-xs font-mono uppercase tracking-wider", children: title }), (0, jsx_runtime_1.jsxs)("span", { className: (0, utils_1.cn)("text-xs font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1", trend === 'up' ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"), children: [trend === 'up' ? (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUp, { className: "w-3 h-3" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDown, { className: "w-3 h-3" }), trendVal] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-3xl font-mono font-medium text-zinc-100 tracking-tight", children: [isCurrency ? "$" : "", value] }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-zinc-400 font-mono mt-1", children: (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-300", children: subValue }) })] })] }));
}
function HeatmapCell({ intensity }) {
    // Intensity 0-10
    const opacity = intensity / 10;
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex-1 h-8 bg-blue-500 rounded-sm border border-zinc-900 hover:border-white/50 transition-colors relative group", style: { backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, opacity)})` }, children: (0, jsx_runtime_1.jsxs)("div", { className: "opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-zinc-800 text-xs text-white whitespace-nowrap z-20 pointer-events-none", children: ["Conv. Rate: ", (intensity * 0.8).toFixed(1), "%"] }) }));
}
function StatusBadge({ status }) {
    const styles = {
        active: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        learning: "text-blue-400 bg-blue-400/10 border-blue-400/20",
        limited: "text-amber-400 bg-amber-400/10 border-amber-400/20",
        paused: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
    };
    const icons = {
        active: lucide_react_1.PlayCircle,
        learning: lucide_react_1.RefreshCw,
        limited: lucide_react_1.AlertCircle,
        paused: lucide_react_1.PauseCircle
    };
    // @ts-ignore
    const Icon = icons[status] || lucide_react_1.AlertCircle;
    return ((0, jsx_runtime_1.jsxs)("span", { className: (0, utils_1.cn)("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-wide w-fit", styles[status]), children: [(0, jsx_runtime_1.jsx)(Icon, { className: "w-3 h-3" }), status] }));
}

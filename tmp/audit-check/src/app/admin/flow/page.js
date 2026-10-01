"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminFlowSpecification;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const sonner_1 = require("sonner");
const CompanyLogo_1 = require("@/src/components/ui/CompanyLogo");
const market_data_1 = require("@/src/lib/market-data");
function AdminFlowSpecification() {
    const [selectedRound, setSelectedRound] = (0, react_1.useState)(0);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [selectedSector, setSelectedSector] = (0, react_1.useState)("ALL");
    const [viewMode, setViewMode] = (0, react_1.useState)("round");
    // Custom Scenario Editor State for selected round
    const [adminPin, setAdminPin] = (0, react_1.useState)("9988");
    const [customTitle, setCustomTitle] = (0, react_1.useState)("");
    const [customSubtitle, setCustomSubtitle] = (0, react_1.useState)("");
    const [customNews, setCustomNews] = (0, react_1.useState)([]);
    const [customShifts, setCustomShifts] = (0, react_1.useState)({});
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    const sectors = ["ALL", ...Array.from(new Set(market_data_1.STOCKS_DATA.map((s) => s.sector)))];
    const roundInfo = market_data_1.ROUNDS_DATA.find((r) => r.round === selectedRound) || market_data_1.ROUNDS_DATA[0];
    // Initialize editor whenever selected round changes
    (0, react_1.useEffect)(() => {
        setCustomTitle(roundInfo.title);
        setCustomSubtitle(roundInfo.subtitle);
        setCustomNews(JSON.parse(JSON.stringify(roundInfo.newsStories)));
        setCustomShifts({ ...roundInfo.marketChanges });
    }, [selectedRound, roundInfo]);
    // Save custom scenario & price shifts to server
    const handleSaveScenario = async () => {
        setIsSaving(true);
        try {
            // 1. Update Scenario (Title & News)
            const resScenario = await fetch("/api/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pin: adminPin,
                    action: "UPDATE_CUSTOM_SCENARIO",
                    payload: {
                        round: selectedRound,
                        title: customTitle,
                        subtitle: customSubtitle,
                        newsStories: customNews,
                    },
                }),
            });
            // 2. Update Custom Price Shifts
            const resShifts = await fetch("/api/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pin: adminPin,
                    action: "UPDATE_PRICE_SHIFTS",
                    payload: {
                        round: selectedRound,
                        shifts: customShifts,
                    },
                }),
            });
            if (resScenario.ok && resShifts.ok) {
                sonner_1.toast.success(`Custom Scenario & Price Shifts saved for Round ${selectedRound}!`);
            }
            else {
                sonner_1.toast.error("Failed to save custom scenario. Verify Admin PIN.");
            }
        }
        catch (e) {
            console.error(e);
            sonner_1.toast.error("Error saving scenario.");
        }
        finally {
            setIsSaving(false);
        }
    };
    // Reset to default
    const handleResetScenario = async () => {
        if (!confirm(`Reset Round ${selectedRound} to tournament master defaults?`))
            return;
        try {
            const res = await fetch("/api/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pin: adminPin,
                    action: "RESET_CUSTOM_SCENARIO",
                    payload: { round: selectedRound },
                }),
            });
            if (res.ok) {
                setCustomTitle(roundInfo.title);
                setCustomSubtitle(roundInfo.subtitle);
                setCustomNews(JSON.parse(JSON.stringify(roundInfo.newsStories)));
                setCustomShifts({ ...roundInfo.marketChanges });
                sonner_1.toast.info(`Round ${selectedRound} reset to default master plan.`);
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    // Helper to compute round starting and ending prices
    const getRoundPriceDetails = (stock, roundNum) => {
        const isAvailable = stock.entryRound <= roundNum;
        if (!isAvailable) {
            return {
                isAvailable: false,
                startPrice: 0,
                endPrice: 0,
                percentChange: 0,
                dollarChange: 0,
            };
        }
        let startPrice = 0;
        let endPrice = 0;
        if (roundNum === 0) {
            startPrice = stock.prices.start;
            endPrice = stock.prices.r0;
        }
        else if (roundNum === 1) {
            startPrice = stock.prices.r0;
            endPrice = stock.prices.r1;
        }
        else if (roundNum === 2) {
            startPrice = stock.entryRound === 2 ? stock.prices.start : stock.prices.r1;
            endPrice = stock.prices.r2;
        }
        else if (roundNum === 3) {
            startPrice = stock.prices.r2;
            endPrice = stock.prices.r3;
        }
        else if (roundNum === 4) {
            startPrice = stock.prices.r3;
            endPrice = stock.prices.r4;
        }
        else if (roundNum === 5) {
            startPrice = stock.prices.r4;
            endPrice = stock.prices.r5;
        }
        const percentChange = customShifts[stock.ticker] !== undefined ? customShifts[stock.ticker] : (roundInfo.marketChanges[stock.ticker] || 0);
        const computedEndPrice = parseFloat((startPrice * (1 + percentChange / 100)).toFixed(2));
        const dollarChange = computedEndPrice - startPrice;
        return {
            isAvailable: true,
            startPrice,
            endPrice: computedEndPrice,
            percentChange,
            dollarChange,
        };
    };
    // Filter stocks
    const filteredStocks = market_data_1.STOCKS_DATA.filter((s) => {
        const matchesSearch = s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector = selectedSector === "ALL" || s.sector === selectedSector;
        return matchesSearch && matchesSector;
    });
    // Calculate Round Stats
    const roundChangesList = Object.entries(roundInfo.marketChanges).map(([ticker, pct]) => {
        const stock = market_data_1.STOCKS_DATA.find((s) => s.ticker === ticker);
        const currentShift = customShifts[ticker] !== undefined ? customShifts[ticker] : pct;
        return { ticker, pct: currentShift, stock };
    });
    const biggestGainer = [...roundChangesList].sort((a, b) => b.pct - a.pct)[0];
    const biggestLoser = [...roundChangesList].sort((a, b) => a.pct - b.pct)[0];
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-[#030303] text-[#fafafa] font-mono p-4 sm:p-6 lg:p-10 select-none cyber-grid print:bg-white print:text-black print:p-0", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-7xl mx-auto space-y-8 print:space-y-4", children: [(0, jsx_runtime_1.jsxs)("header", { className: "flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#1e1e1e] print:hidden", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 mb-2", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/admin", className: "p-2 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-[#a1a1aa] hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: "Admin God-Mode" })] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-widest flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { className: "w-3.5 h-3.5" }), "HOST CONFIDENTIAL SPECIFICATION"] })] }), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl sm:text-3xl font-display font-extrabold text-white tracking-wide", children: "MASTER PRICE SHIFT & TOURNAMENT FLOW" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs sm:text-sm text-[#a1a1aa] mt-1", children: "Complete round-by-round news stories, sector catalysts, starting prices, and pre-calculated shift matrices." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5 flex-wrap", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => window.print(), className: "px-3.5 py-2 bg-[#18181b] border border-[#27272a] hover:border-[#10B981] hover:text-[#10B981] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2", title: "Print high-density judge/host reference cheat sheet", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Printer, { className: "w-4 h-4 text-[#10B981]" }), (0, jsx_runtime_1.jsx)("span", { children: "Print Cheat Sheet (PDF)" })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/stage", target: "_blank", className: "px-3 py-2 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-xs text-white rounded-lg transition-all", children: "Stage Projector" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/trade", target: "_blank", className: "px-3 py-2 bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 text-[#FF5F1F] hover:bg-[#FF5F1F] hover:text-black font-bold text-xs rounded-lg transition-all", children: "Participant Terminal" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "hidden print:block border-b-2 border-black pb-4 mb-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-bold text-black uppercase", children: "Ramaiah University of Applied Sciences \u2022 BSc Data Science" }), (0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-extrabold text-black", children: "Bulls & Bears Trading Tournament \u2014 Master Flow & Shifts Cheat Sheet" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-700", children: "Official Judges & Host Confidential Dossier \u2022 Event Date: October 1st, 2026 \u2022 Location: SLH 15" })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-right text-xs", children: (0, jsx_runtime_1.jsx)("span", { className: "font-bold border border-black px-2 py-1", children: "CONFIDENTIAL" }) })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "p-6 bg-gradient-to-r from-[#0d0d10] via-[#09090b] to-[#0d0d10] border-2 border-[#FF5F1F]/30 rounded-2xl shadow-[0_0_50px_rgba(255,95,31,0.1)] relative overflow-hidden space-y-4 print:hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-xl bg-[#FF5F1F]/20 border border-[#FF5F1F]/50 flex items-center justify-center text-[#FF5F1F] shrink-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "w-5 h-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg sm:text-xl font-bold text-white flex items-center gap-2", children: (0, jsx_runtime_1.jsx)("span", { children: "What Happens When You Click \"Apply Master Price Shifts\"?" }) }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs sm:text-sm text-[#d4d4d8] mt-1 leading-relaxed", children: ["During the 10-minute trading window of each round, participants trade stocks at the ", (0, jsx_runtime_1.jsx)("strong", { children: "current fixed price" }), ". When the market closes and you click ", (0, jsx_runtime_1.jsx)("strong", { children: "\"Apply Master Price Shifts\"" }), ", the market macroeconomic reaction occurs:"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3 pt-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-3.5 bg-[#030303]/80 border border-[#27272a] rounded-xl space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs font-bold text-[#FF5F1F] flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: "1. Macro Shock Applied" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-[#a1a1aa] leading-relaxed", children: "Every stock shifts up or down by the master percentage derived from that round's 6 news stories." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3.5 bg-[#030303]/80 border border-[#27272a] rounded-xl space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs font-bold text-[#10B981] flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: "2. Instant Portfolio P&L" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-[#a1a1aa] leading-relaxed", children: "All team holdings are immediately revalued. Teams that correctly deduced the news see immediate net profit." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3.5 bg-[#030303]/80 border border-[#27272a] rounded-xl space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs font-bold text-amber-400 flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: "3. Baseline Carry-Forward" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-[#a1a1aa] leading-relaxed", children: "The shifted price becomes the permanent starting opening price for the next round." })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-[#27272a] p-4 rounded-xl print:hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 bg-[#030303] p-1 border border-[#1e1e1e] rounded-lg", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setViewMode("round"), className: `px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "round"
                                        ? "bg-[#FF5F1F] text-black shadow-lg"
                                        : "text-[#a1a1aa] hover:text-white"}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Newspaper, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Round Breakdown" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setViewMode("matrix"), className: `px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "matrix"
                                        ? "bg-[#FF5F1F] text-black shadow-lg"
                                        : "text-[#a1a1aa] hover:text-white"}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BarChart3, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Complete Master Matrix" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setViewMode("editor"), className: `px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "editor"
                                        ? "bg-amber-400 text-black shadow-lg"
                                        : "text-amber-400/80 hover:text-amber-300"}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Edit3, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "\u26A1 Live Scenario & Shift Override Editor" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0", children: [0, 1, 2, 3, 4, 5].map((r) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => setSelectedRound(r), className: `px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${selectedRound === r
                                    ? "bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]"
                                    : "bg-[#030303] text-[#a1a1aa] border border-[#1e1e1e] hover:border-[#27272a] hover:text-white"}`, children: ["Round ", r] }, r))) })] }), viewMode === "round" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-6 bg-[#09090b] border border-[#27272a] rounded-2xl relative overflow-hidden space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs px-2.5 py-0.5 rounded bg-[#FF5F1F]/20 text-[#FF5F1F] font-bold uppercase border border-[#FF5F1F]/30", children: ["Round ", selectedRound] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-[#a1a1aa] uppercase", children: [roundInfo.durationMinutes, " Minutes Window"] })] }), (0, jsx_runtime_1.jsx)("h2", { className: "text-xl sm:text-2xl font-display font-bold text-white mt-1", children: customTitle || roundInfo.title }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs sm:text-sm text-[#a1a1aa] mt-0.5", children: customSubtitle || roundInfo.subtitle })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [biggestGainer && ((0, jsx_runtime_1.jsxs)("div", { className: "p-2.5 bg-[#030303] border border-[#10B981]/30 rounded-xl text-left", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#10B981] font-bold uppercase", children: "Top Gainer" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-sm font-bold text-white flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { children: biggestGainer.ticker }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[#10B981] font-mono", children: ["+", biggestGainer.pct, "%"] })] })] })), biggestLoser && ((0, jsx_runtime_1.jsxs)("div", { className: "p-2.5 bg-[#030303] border border-[#F43F5E]/30 rounded-xl text-left", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#F43F5E] font-bold uppercase", children: "Top Loser" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-sm font-bold text-white flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { children: biggestLoser.ticker }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[#F43F5E] font-mono", children: [biggestLoser.pct, "%"] })] })] }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 pt-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-xs uppercase text-[#FF5F1F] font-bold tracking-wider flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Newspaper, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: "6 Released News Stories & Clue Deductions" })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a]", children: "Broadcasted to stage projector & terminals" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: (customNews.length > 0 ? customNews : roundInfo.newsStories).map((news) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-[#030303] border border-[#1e1e1e] hover:border-[#27272a] rounded-xl space-y-2.5 transition-all shadow-md flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] font-bold text-[#FF5F1F] bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 px-2 py-0.5 rounded", children: ["Story #", news.id] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wide", children: news.sector })] }), (0, jsx_runtime_1.jsx)("h4", { className: "text-xs font-bold text-white leading-relaxed", children: news.headline })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-2.5 bg-[#09090b] border border-[#18181b] rounded-lg text-[10px] text-[#d4d4d8] leading-relaxed", children: [(0, jsx_runtime_1.jsx)("strong", { className: "text-amber-400", children: "Catalyst / Deduction:" }), " ", news.clueSummary] })] }, news.id))) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-[#09090b] border border-[#27272a] rounded-2xl p-6 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-sm font-bold text-white uppercase flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-4 h-4 text-[#FF5F1F]" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Round ", selectedRound, " Stock Price Shifts & Start/End Values"] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-[#71717a]", children: "Shows exact opening price, applied shift %, and closing shifted value." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-wrap", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717a]" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search stock...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none w-36 sm:w-48" })] }), (0, jsx_runtime_1.jsx)("select", { value: selectedSector, onChange: (e) => setSelectedSector(e.target.value), className: "bg-[#030303] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none", children: sectors.map((sec) => ((0, jsx_runtime_1.jsx)("option", { value: sec, children: sec }, sec))) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-xs", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-[#1e1e1e] text-[10px] uppercase text-[#71717a]", children: [(0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium", children: "Asset" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium", children: "Sector" }), (0, jsx_runtime_1.jsxs)("th", { className: "pb-3 font-medium text-right", children: ["Round ", selectedRound, " Start"] }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium text-right", children: "Applied Shift (%)" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium text-right", children: "Shifted Close ($)" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium text-right", children: "Dollar Movement" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium text-center", children: "Status" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-[#18181b]", children: filteredStocks.map((stock) => {
                                                    const details = getRoundPriceDetails(stock, selectedRound);
                                                    const isUp = details.percentChange >= 0;
                                                    if (!details.isAvailable) {
                                                        return ((0, jsx_runtime_1.jsxs)("tr", { className: "opacity-40 hover:opacity-60 transition-opacity", children: [(0, jsx_runtime_1.jsx)("td", { className: "py-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: stock.ticker, size: "sm" }), (0, jsx_runtime_1.jsx)("span", { className: "font-bold text-white", children: stock.ticker }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a]", children: stock.name })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-[11px] text-[#71717a]", children: stock.sector }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-right text-[#71717a]", children: "\u2014" }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-right text-[#71717a]", children: "Locked (Enters R2)" }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-right text-[#71717a]", children: "\u2014" }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-right text-[#71717a]", children: "\u2014" }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500", children: "Expansion Lock" }) })] }, stock.ticker));
                                                    }
                                                    return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-[#18181b]/50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "py-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: stock.ticker, size: "sm" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "font-bold text-white flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { children: stock.ticker }), stock.entryRound === 2 && selectedRound >= 2 && ((0, jsx_runtime_1.jsx)("span", { title: "R2 Expansion Stock", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "w-3 h-3 text-amber-400" }) }))] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] truncate max-w-[130px]", children: stock.name })] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-[11px] text-[#a1a1aa]", children: stock.sector }), (0, jsx_runtime_1.jsxs)("td", { className: "py-3 text-right font-semibold text-white", children: ["$", details.startPrice.toFixed(2)] }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-right", children: (0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold ${isUp
                                                                        ? "bg-emerald-950/60 text-[#10B981] border border-emerald-800"
                                                                        : "bg-rose-950/60 text-[#F43F5E] border border-rose-800"}`, children: [isUp ? (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUp, { className: "w-3 h-3" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDown, { className: "w-3 h-3" }), isUp ? `+${details.percentChange}%` : `${details.percentChange}%`] }) }), (0, jsx_runtime_1.jsxs)("td", { className: "py-3 text-right font-extrabold text-white text-sm", children: ["$", details.endPrice.toFixed(2)] }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-right font-medium", children: (0, jsx_runtime_1.jsx)("span", { className: isUp ? "text-[#10B981]" : "text-[#F43F5E]", children: details.dollarChange >= 0
                                                                        ? `+$${details.dollarChange.toFixed(2)}`
                                                                        : `-$${Math.abs(details.dollarChange).toFixed(2)}` }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-center", children: (0, jsx_runtime_1.jsx)("span", { className: `text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isUp
                                                                        ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                                                                        : "bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30"}`, children: isUp ? "Bull Shift" : "Bear Drop" }) })] }, stock.ticker));
                                                }) })] }) })] })] })), viewMode === "matrix" && ((0, jsx_runtime_1.jsx)("div", { className: "space-y-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-[#09090b] border border-[#27272a] rounded-2xl p-6 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-base font-bold text-white uppercase flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BarChart3, { className: "w-4 h-4 text-[#FF5F1F]" }), (0, jsx_runtime_1.jsx)("span", { children: "Tournament Master Price Matrix (Start \u2192 R5 Close)" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-[#71717a]", children: "Every stock's complete price evolution across the full 6-round simulation." })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-2", children: (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search ticker...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3 py-1.5 text-xs text-white outline-none" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-xs", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-[#1e1e1e] bg-[#030303] text-[10px] uppercase text-[#71717a]", children: [(0, jsx_runtime_1.jsx)("th", { className: "py-3.5 px-3 font-medium", children: "Stock Asset" }), (0, jsx_runtime_1.jsx)("th", { className: "py-3.5 px-3 font-medium text-right", children: "Start" }), (0, jsx_runtime_1.jsx)("th", { className: "py-3.5 px-3 font-medium text-right", children: "R0 Close" }), (0, jsx_runtime_1.jsx)("th", { className: "py-3.5 px-3 font-medium text-right", children: "R1 Close" }), (0, jsx_runtime_1.jsx)("th", { className: "py-3.5 px-3 font-medium text-right", children: "R2 Close" }), (0, jsx_runtime_1.jsx)("th", { className: "py-3.5 px-3 font-medium text-right", children: "R3 Close" }), (0, jsx_runtime_1.jsx)("th", { className: "py-3.5 px-3 font-medium text-right", children: "R4 Close" }), (0, jsx_runtime_1.jsx)("th", { className: "py-3.5 px-3 font-medium text-right", children: "R5 Final" }), (0, jsx_runtime_1.jsx)("th", { className: "py-3.5 px-3 font-medium text-right", children: "Total Net Return" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-[#18181b]", children: filteredStocks.map((stock) => {
                                                const initialPrice = stock.startingPrice;
                                                const finalPrice = stock.prices.r5;
                                                const overallReturn = ((finalPrice - initialPrice) / initialPrice) * 100;
                                                const isNetUp = overallReturn >= 0;
                                                return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-[#18181b]/50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "py-3 px-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: stock.ticker, size: "sm" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-bold text-white", children: stock.ticker }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a] ml-1.5 hidden sm:inline", children: stock.sector })] })] }) }), (0, jsx_runtime_1.jsxs)("td", { className: "py-3 px-3 text-right text-white font-medium", children: ["$", stock.startingPrice.toFixed(2)] }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 px-3 text-right", children: stock.entryRound === 0 ? ((0, jsx_runtime_1.jsxs)("span", { className: "text-white", children: ["$", stock.prices.r0.toFixed(2)] })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-[#52525b]", children: "\u2014" })) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 px-3 text-right", children: stock.entryRound === 0 ? ((0, jsx_runtime_1.jsxs)("span", { className: "text-white", children: ["$", stock.prices.r1.toFixed(2)] })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-[#52525b]", children: "\u2014" })) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 px-3 text-right", children: (0, jsx_runtime_1.jsxs)("span", { className: "text-white", children: ["$", stock.prices.r2.toFixed(2)] }) }), (0, jsx_runtime_1.jsxs)("td", { className: "py-3 px-3 text-right text-white", children: ["$", stock.prices.r3.toFixed(2)] }), (0, jsx_runtime_1.jsxs)("td", { className: "py-3 px-3 text-right text-white", children: ["$", stock.prices.r4.toFixed(2)] }), (0, jsx_runtime_1.jsxs)("td", { className: "py-3 px-3 text-right font-extrabold text-[#10B981]", children: ["$", stock.prices.r5.toFixed(2)] }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 px-3 text-right font-bold", children: (0, jsx_runtime_1.jsx)("span", { className: `px-2 py-0.5 rounded text-[11px] ${isNetUp
                                                                    ? "bg-emerald-950/50 text-[#10B981] border border-emerald-800"
                                                                    : "bg-rose-950/50 text-[#F43F5E] border border-rose-800"}`, children: isNetUp ? `+${overallReturn.toFixed(1)}%` : `${overallReturn.toFixed(1)}%` }) })] }, stock.ticker));
                                            }) })] }) })] }) })), viewMode === "editor" && ((0, jsx_runtime_1.jsx)("div", { className: "space-y-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "p-6 bg-[#09090b] border-2 border-amber-500/30 rounded-2xl space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs px-2.5 py-0.5 rounded bg-amber-400 text-black font-extrabold uppercase", children: ["Round ", selectedRound, " Live Editor"] }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-[#a1a1aa]", children: "Real-time tournament scenario tuning" })] }), (0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-bold text-white mt-1", children: "Customize News Clues & Override Stock Price Shifts" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-[#a1a1aa]", children: "Modify headlines or tweak individual stock percentage shifts live during the simulation." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: handleResetScenario, className: "px-3 py-2 bg-[#18181b] border border-[#27272a] hover:border-rose-500 hover:text-rose-400 text-xs text-[#a1a1aa] rounded-lg transition-colors flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RotateCcw, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Reset Defaults" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleSaveScenario, disabled: isSaving, className: "px-4 py-2 bg-amber-400 hover:bg-white text-black font-bold text-xs uppercase rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Save, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: isSaving ? "Saving..." : "Save Overrides to Server" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[11px] font-bold text-amber-400 uppercase mb-1", children: "Round Theme Title" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: customTitle, onChange: (e) => setCustomTitle(e.target.value), className: "w-full bg-[#030303] border border-[#27272a] focus:border-amber-400 rounded-lg p-2.5 text-xs text-white outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[11px] font-bold text-amber-400 uppercase mb-1", children: "Round Macro Scenario Subtitle" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: customSubtitle, onChange: (e) => setCustomSubtitle(e.target.value), className: "w-full bg-[#030303] border border-[#27272a] focus:border-amber-400 rounded-lg p-2.5 text-xs text-white outline-none" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("h4", { className: "text-xs uppercase font-bold text-white flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Newspaper, { className: "w-4 h-4 text-amber-400" }), (0, jsx_runtime_1.jsx)("span", { children: "Customize 6 News Stories & Clues" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: customNews.map((news, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-3.5 bg-[#030303] border border-[#1e1e1e] rounded-xl space-y-2 text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] font-bold text-amber-400", children: ["Story #", news.id] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: news.sector, onChange: (e) => {
                                                                const updated = [...customNews];
                                                                updated[idx].sector = e.target.value;
                                                                setCustomNews(updated);
                                                            }, placeholder: "Sector", className: "bg-[#09090b] border border-[#27272a] rounded px-2 py-0.5 text-[10px] text-[#a1a1aa] w-28 text-right outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[9px] uppercase text-[#71717a]", children: "Headline" }), (0, jsx_runtime_1.jsx)("textarea", { value: news.headline, rows: 2, onChange: (e) => {
                                                                const updated = [...customNews];
                                                                updated[idx].headline = e.target.value;
                                                                setCustomNews(updated);
                                                            }, className: "w-full bg-[#09090b] border border-[#27272a] focus:border-amber-400 rounded p-1.5 text-[11px] text-white outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[9px] uppercase text-[#71717a]", children: "Deduction Hint" }), (0, jsx_runtime_1.jsx)("textarea", { value: news.clueSummary, rows: 2, onChange: (e) => {
                                                                const updated = [...customNews];
                                                                updated[idx].clueSummary = e.target.value;
                                                                setCustomNews(updated);
                                                            }, className: "w-full bg-[#09090b] border border-[#27272a] focus:border-amber-400 rounded p-1.5 text-[10px] text-[#d4d4d8] outline-none" })] })] }, news.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 pt-4 border-t border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("h4", { className: "text-xs uppercase font-bold text-white flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Sliders, { className: "w-4 h-4 text-amber-400" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Override Stock Shift Percentages for Round ", selectedRound] })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5", children: market_data_1.STOCKS_DATA.filter((s) => s.entryRound <= selectedRound).map((stock) => {
                                            const currentVal = customShifts[stock.ticker] !== undefined ? customShifts[stock.ticker] : (roundInfo.marketChanges[stock.ticker] || 0);
                                            const isPositive = currentVal >= 0;
                                            return ((0, jsx_runtime_1.jsxs)("div", { className: "p-2.5 bg-[#030303] border border-[#1e1e1e] rounded-xl flex items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 min-w-0", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: stock.ticker, size: "sm" }), (0, jsx_runtime_1.jsx)("span", { className: "font-bold text-white text-xs", children: stock.ticker })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("input", { type: "number", value: currentVal, onChange: (e) => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    setCustomShifts({
                                                                        ...customShifts,
                                                                        [stock.ticker]: val,
                                                                    });
                                                                }, className: `w-16 text-right font-bold text-xs p-1 rounded bg-[#09090b] border ${isPositive
                                                                    ? "border-emerald-800 text-[#10B981]"
                                                                    : "border-rose-800 text-[#F43F5E]"} outline-none` }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a]", children: "%" })] })] }, stock.ticker));
                                        }) })] })] }) }))] }) }));
}

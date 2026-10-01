"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TradingTerminal;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const react_2 = require("motion/react");
const lucide_react_1 = require("lucide-react");
const sonner_1 = require("sonner");
const Quantumanalytics_1 = require("@/src/components/ui/Quantumanalytics");
const CompanyLogo_1 = require("@/src/components/ui/CompanyLogo");
const PriceTickerMarquee_1 = require("@/src/components/ui/PriceTickerMarquee");
const OrderBookDepth_1 = require("@/src/components/ui/OrderBookDepth");
const NotificationsTimeline_1 = require("@/src/components/ui/NotificationsTimeline");
const FloatingDockMenu_1 = require("@/src/components/ui/FloatingDockMenu");
const stepper_1 = require("@/src/components/watermelon/stepper");
const trade_summary_1 = require("@/src/components/watermelon/trade-summary");
const transaction_list_1 = require("@/src/components/watermelon/transaction-list");
const sounds_1 = require("@/src/lib/sounds");
const utils_1 = require("@/src/lib/utils");
const eye_tracking_1 = require("@/src/components/ui/eye-tracking");
const flipping_word_swap_1 = require("@/src/components/ui/flipping-word-swap");
const CYCLING_STANDBY_PHRASES = [
    { w1: "TERMINAL INITIALIZED", w2: "AWAITING ROUND 1" },
    { w1: "MARKET INTEL ENCRYPTED", w2: "STAND BY FOR NEWS FLASH" },
    { w1: "SQUAD PROTOCOL READY", w2: "SIGNAL THE HOST" },
    { w1: "BULLS & BEARS PROTOCOL", w2: "PREPARE YOUR STRATEGY" },
];
function TradingTerminal() {
    // Auth state
    const [teamId, setTeamId] = (0, react_1.useState)(null);
    const [teamNameInput, setTeamNameInput] = (0, react_1.useState)("");
    const [passcodeInput, setPasscodeInput] = (0, react_1.useState)("");
    const [authError, setAuthError] = (0, react_1.useState)(null);
    // Live state
    const [gameState, setGameState] = (0, react_1.useState)(null);
    const [activeStocks, setActiveStocks] = (0, react_1.useState)([]);
    const [teamData, setTeamData] = (0, react_1.useState)(null);
    const [allTeams, setAllTeams] = (0, react_1.useState)([]);
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    const [swaps, setSwaps] = (0, react_1.useState)([]);
    const [directSellOffers, setDirectSellOffers] = (0, react_1.useState)([]);
    const [timeRemaining, setTimeRemaining] = (0, react_1.useState)("10:00");
    const [phraseIdx, setPhraseIdx] = (0, react_1.useState)(0);
    const [isTogglingReady, setIsTogglingReady] = (0, react_1.useState)(false);
    // Direct P2P Selling State
    const [sellTargetMode, setSellTargetMode] = (0, react_1.useState)("DIRECT_TEAM");
    const [sellTargetTeamId, setSellTargetTeamId] = (0, react_1.useState)("");
    // Search & Multi-Select Sector Filtering State
    const [tableSearchQuery, setTableSearchQuery] = (0, react_1.useState)("");
    const [selectedSectors, setSelectedSectors] = (0, react_1.useState)([]);
    const [isSectorDropdownOpen, setIsSectorDropdownOpen] = (0, react_1.useState)(false);
    const [inspectedTicker, setInspectedTicker] = (0, react_1.useState)("NVDA");
    // Modals & Drawers
    const [orderModal, setOrderModal] = (0, react_1.useState)({
        isOpen: false,
        stock: null,
        action: "BUY",
    });
    const [orderQty, setOrderQty] = (0, react_1.useState)(5);
    const [isSubmittingOrder, setIsSubmittingOrder] = (0, react_1.useState)(false);
    const [orderError, setOrderError] = (0, react_1.useState)(null);
    const [orderSuccess, setOrderSuccess] = (0, react_1.useState)(null);
    const [showNewsDrawer, setShowNewsDrawer] = (0, react_1.useState)(false);
    const [showSwapModal, setShowSwapModal] = (0, react_1.useState)(false);
    const [showJournalModal, setShowJournalModal] = (0, react_1.useState)(false);
    const [showAuditModal, setShowAuditModal] = (0, react_1.useState)(false);
    const [newsCarouselIdx, setNewsCarouselIdx] = (0, react_1.useState)(null);
    // Swap Proposal State
    const [targetTeamId, setTargetTeamId] = (0, react_1.useState)("");
    const [giveTicker, setGiveTicker] = (0, react_1.useState)("");
    const [giveQty, setGiveQty] = (0, react_1.useState)(5);
    const [receiveTicker, setReceiveTicker] = (0, react_1.useState)("");
    const [receiveQty, setReceiveQty] = (0, react_1.useState)(5);
    const [swapMessage, setSwapMessage] = (0, react_1.useState)(null);
    // Fetch live state
    const fetchState = (0, react_1.useCallback)(async () => {
        try {
            const url = teamId ? `/api/state?teamId=${teamId}` : `/api/state`;
            const res = await fetch(url);
            if (!res.ok)
                return;
            const data = await res.json();
            setGameState(data.gameState);
            setActiveStocks(data.activeStocks);
            setAllTeams(data.leaderboard || []);
            setTransactions(data.transactions || []);
            setSwaps(data.swaps || []);
            setDirectSellOffers(data.directSellOffers || []);
            if (data.activeTeam) {
                setTeamData(data.activeTeam);
            }
        }
        catch (e) {
            console.error("Failed to sync state", e);
        }
    }, [teamId]);
    // Initial load & Polling interval
    (0, react_1.useEffect)(() => {
        // Check local storage for session
        const savedTeamId = localStorage.getItem("bb_team_id");
        if (savedTeamId) {
            setTeamId(savedTeamId);
        }
        fetchState();
        const interval = setInterval(fetchState, 1200);
        return () => clearInterval(interval);
    }, [fetchState]);
    // Rotate Standby cycling text every 4 seconds
    (0, react_1.useEffect)(() => {
        const cycleInterval = setInterval(() => {
            setPhraseIdx((prev) => (prev + 1) % CYCLING_STANDBY_PHRASES.length);
        }, 4000);
        return () => clearInterval(cycleInterval);
    }, []);
    // Keyboard navigation for News Carousel
    (0, react_1.useEffect)(() => {
        if (newsCarouselIdx === null || !gameState?.roundInfo?.newsStories?.length)
            return;
        const storiesCount = gameState.roundInfo.newsStories.length;
        const handleKeyDown = (e) => {
            if (e.key === "ArrowRight") {
                setNewsCarouselIdx((prev) => (prev !== null ? (prev + 1) % storiesCount : 0));
                sounds_1.sounds.playTick();
            }
            else if (e.key === "ArrowLeft") {
                setNewsCarouselIdx((prev) => (prev !== null ? (prev - 1 + storiesCount) % storiesCount : 0));
                sounds_1.sounds.playTick();
            }
            else if (e.key === "Escape") {
                setNewsCarouselIdx(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [newsCarouselIdx, gameState]);
    // Sync Timer countdown
    (0, react_1.useEffect)(() => {
        if (!gameState?.tradingExpiresAt || gameState.status !== "TRADING_OPEN") {
            setTimeRemaining(gameState?.status === "TRADING_OPEN" ? "10:00" : "00:00");
            return;
        }
        const updateTimer = () => {
            const remainingMs = Math.max(0, gameState.tradingExpiresAt - Date.now());
            const totalSec = Math.floor(remainingMs / 1000);
            const min = Math.floor(totalSec / 60);
            const sec = totalSec % 60;
            setTimeRemaining(`${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`);
        };
        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
        return () => clearInterval(timerInterval);
    }, [gameState]);
    // Readiness Toggle Handler
    const handleToggleReady = async () => {
        if (!teamId)
            return;
        setIsTogglingReady(true);
        try {
            const res = await fetch("/api/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "TOGGLE_READY", teamId }),
            });
            const data = await res.json();
            if (!res.ok) {
                sounds_1.sounds.playTradeError();
                sonner_1.toast.error(data.error || "Failed to update readiness status.");
                return;
            }
            sounds_1.sounds.playTradeSuccess();
            sonner_1.toast.success(data.message || (data.isReady ? "Marked READY for Round 1!" : "Marked STANDBY."));
            fetchState();
        }
        catch (e) {
            sonner_1.toast.error("Network error updating readiness.");
        }
        finally {
            setIsTogglingReady(false);
        }
    };
    // Auth Handler
    const handleAuth = async (action) => {
        setAuthError(null);
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, teamName: teamNameInput, passcode: passcodeInput }),
            });
            const data = await res.json();
            if (!res.ok) {
                setAuthError(data.error || "Authentication failed");
                sonner_1.toast.error(data.error || "Authentication failed");
                return;
            }
            setTeamId(data.team.id);
            localStorage.setItem("bb_team_id", data.team.id);
            sounds_1.sounds.playTradeSuccess();
            sonner_1.toast.success(`Welcome back, ${data.team.teamName}! Portfolio unlocked.`);
        }
        catch (e) {
            setAuthError("Network error. Please try again.");
            sonner_1.toast.error("Network error. Please try again.");
        }
    };
    const handleLogout = () => {
        setTeamId(null);
        localStorage.removeItem("bb_team_id");
        sonner_1.toast.info("Logged out of trading terminal.");
    };
    // Order Execution Handler
    const handleExecuteOrder = async () => {
        if (!orderModal.stock || !teamId)
            return;
        if (orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM" && !sellTargetTeamId) {
            sonner_1.toast.error("Please select a buyer team from the dropdown to sell to.");
            return;
        }
        setIsSubmittingOrder(true);
        setOrderError(null);
        setOrderSuccess(null);
        try {
            const res = await fetch("/api/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamId,
                    action: orderModal.action,
                    ticker: orderModal.stock.ticker,
                    quantity: orderQty,
                    targetTeamId: orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM"
                        ? sellTargetTeamId
                        : "MARKET_POOL",
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                sounds_1.sounds.playTradeError();
                setOrderError(data.error || "Order failed to execute.");
                sonner_1.toast.error(data.error || "Order failed to execute.");
                setIsSubmittingOrder(false);
                return;
            }
            sounds_1.sounds.playTradeSuccess();
            setOrderSuccess(data.message);
            if (data.isDirectSell) {
                sonner_1.toast.success(`120s Direct Sell Offer Transmitted!`, {
                    description: `Offer for ${orderQty} ${orderModal.stock.ticker} sent to counterparty. Active for 120 seconds.`,
                });
            }
            else {
                sonner_1.toast.success(`Executed ${orderModal.action}: ${orderQty} shares of ${orderModal.stock.ticker}`, {
                    description: `Total position value: ${(0, utils_1.formatCurrency)(orderModal.stock.currentPrice * orderQty)}`,
                });
            }
            fetchState();
            setTimeout(() => {
                setOrderModal({ isOpen: false, stock: null, action: "BUY" });
                setOrderSuccess(null);
            }, 1200);
        }
        catch (e) {
            sounds_1.sounds.playTradeError();
            setOrderError("Network error. Please try again.");
            sonner_1.toast.error("Network error. Please try again.");
        }
        finally {
            setIsSubmittingOrder(false);
        }
    };
    // Direct Sell Offer Actions
    const handleAcceptDirectSell = async (offerId) => {
        try {
            const res = await fetch("/api/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "ACCEPT_DIRECT_SELL",
                    teamId,
                    offerId,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                sounds_1.sounds.playTradeError();
                sonner_1.toast.error(data.error || "Failed to accept sell offer.");
                fetchState();
                return;
            }
            sounds_1.sounds.playTradeSuccess();
            sonner_1.toast.success(data.message || "Purchase completed! Stock added to your portfolio.");
            fetchState();
        }
        catch (e) {
            sounds_1.sounds.playTradeError();
            sonner_1.toast.error("Network error accepting sell offer.");
        }
    };
    const handleRejectDirectSell = async (offerId) => {
        try {
            await fetch("/api/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "REJECT_DIRECT_SELL",
                    teamId,
                    offerId,
                }),
            });
            sonner_1.toast.info("Declined purchase offer.");
            fetchState();
        }
        catch (e) {
            console.error(e);
        }
    };
    const handleCancelDirectSell = async (offerId) => {
        try {
            await fetch("/api/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "CANCEL_DIRECT_SELL",
                    teamId,
                    offerId,
                }),
            });
            sonner_1.toast.info("Direct sell offer cancelled.");
            fetchState();
        }
        catch (e) {
            console.error(e);
        }
    };
    // Swap Proposal Handler
    const handleProposeSwap = async () => {
        if (!teamId || !targetTeamId || !giveTicker || !receiveTicker)
            return;
        try {
            const res = await fetch("/api/swap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "PROPOSE",
                    senderId: teamId,
                    receiverId: targetTeamId,
                    giveTicker,
                    giveQty,
                    receiveTicker,
                    receiveQty,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                sounds_1.sounds.playTradeError();
                setSwapMessage(`❌ ${data.error}`);
                sonner_1.toast.error(data.error || "Failed to transmit swap proposal.");
                return;
            }
            sounds_1.sounds.playTradeSuccess();
            setSwapMessage(`✅ ${data.message}`);
            sonner_1.toast.success("Trade proposal sent!", {
                description: `Offered ${giveQty} ${giveTicker} for ${receiveQty} ${receiveTicker}. Counterparty has 60s.`,
            });
            fetchState();
            setTimeout(() => {
                setShowSwapModal(false);
                setSwapMessage(null);
            }, 1500);
        }
        catch (e) {
            setSwapMessage("❌ Network error");
            sonner_1.toast.error("Network error sending swap proposal.");
        }
    };
    // Accept / Reject Swap
    const handleSwapAction = async (swapId, action) => {
        try {
            const res = await fetch("/api/swap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, swapId }),
            });
            const data = await res.json();
            if (!res.ok) {
                sounds_1.sounds.playTradeError();
                sonner_1.toast.error(data.error || "Swap action failed");
                return;
            }
            if (action === "ACCEPT") {
                sounds_1.sounds.playTradeSuccess();
                sonner_1.toast.success("Swap agreement confirmed! Portfolio balances updated.");
            }
            else {
                sonner_1.toast.info("Swap proposal declined.");
            }
            fetchState();
        }
        catch (e) {
            console.error(e);
            sonner_1.toast.error("Failed to process swap response.");
        }
    };
    // --- 1. AUTHENTICATION MODAL (If Not Logged In) ---
    if (!teamId || !teamData) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-[#030303] flex items-center justify-center p-4 font-mono relative cyber-grid", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-md bg-[#09090b] border border-[#27272a] p-6 sm:p-8 rounded-sm shadow-2xl relative z-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-7 h-7 rounded-sm bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 flex items-center justify-center text-[#FF5F1F]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "font-display font-bold text-white text-base", children: "BULLS & BEARS TERMINAL" }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Ramaiah University Trading Engine" })] })] }), (0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-display font-semibold text-white mb-2", children: "Team Authentication" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-[#a1a1aa] mb-6", children: "Enter your team credentials to access your synchronized $100,000 trading portfolio." }), authError && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4 p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-sm flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: authError })] })), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] uppercase text-[#71717a] mb-1", children: "Team Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: teamNameInput, onChange: (e) => setTeamNameInput(e.target.value), placeholder: "e.g. Quant Squad", className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-sm px-3 py-2 text-white outline-none" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] uppercase text-[#71717a] mb-1", children: "Passcode / PIN" }), (0, jsx_runtime_1.jsx)("input", { type: "password", value: passcodeInput, onChange: (e) => setPasscodeInput(e.target.value), placeholder: "4-digit PIN", className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-sm px-3 py-2 text-white outline-none" })] }), (0, jsx_runtime_1.jsx)("div", { className: "pt-2", children: (0, jsx_runtime_1.jsx)("button", { onClick: () => handleAuth("login"), className: "w-full py-3 bg-[#FF5F1F] text-black font-bold uppercase rounded-sm hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#FF5F1F]/20", children: "Access Terminal" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 text-center", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/", className: "text-[11px] text-[#71717a] hover:text-[#FF5F1F] transition-colors", children: "\u2190 Return to Event Overview & Rules" }) })] }) }));
    }
    // Incoming pending swaps for this team
    const incomingSwaps = swaps.filter((s) => s.receiverId === teamId && s.status === "PENDING");
    // Incoming and Outgoing 120s Direct P2P Sell Offers
    const incomingDirectOffers = directSellOffers.filter((o) => o.buyerTeamId === teamId && o.status === "PENDING" && Date.now() < o.expiresAt);
    const outgoingDirectOffers = directSellOffers.filter((o) => o.sellerTeamId === teamId && o.status === "PENDING" && Date.now() < o.expiresAt);
    // Dynamic Sectors & Search Filtering
    const uniqueSectors = Array.from(new Set(activeStocks.map((s) => s.sector))).filter(Boolean);
    const filteredActiveStocks = activeStocks.filter((s) => {
        const query = tableSearchQuery.toLowerCase();
        const matchesSearch = s.ticker.toLowerCase().includes(query) ||
            s.name.toLowerCase().includes(query) ||
            s.sector.toLowerCase().includes(query);
        const matchesSector = selectedSectors.length === 0 || selectedSectors.includes(s.sector);
        return matchesSearch && matchesSector;
    });
    // --- 1.5 STANDBY / EMPTY STATE (BEFORE ROUND 0 / ROUND 1 STARTS) ---
    const isStandbyState = gameState && (gameState.currentRound === 0 && gameState.status === "SETUP");
    if (isStandbyState) {
        const currentPhrase = CYCLING_STANDBY_PHRASES[phraseIdx];
        const readyCount = allTeams.filter((t) => t.isReady).length;
        const totalCount = allTeams.length || 1;
        const readyPct = Math.round((readyCount / totalCount) * 100);
        const isReady = teamData.isReady || false;
        return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-[#020202] text-[#fafafa] font-mono p-4 sm:p-6 md:p-10 flex flex-col justify-between select-none cyber-grid relative overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-[#FF5F1F]/10 blur-[130px] rounded-full pointer-events-none" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-10 right-1/4 w-[300px] h-[300px] bg-[#10B981]/5 blur-[120px] rounded-full pointer-events-none" }), (0, jsx_runtime_1.jsxs)("header", { className: "flex flex-wrap items-center justify-between pb-5 border-b border-[#1e1e1e] gap-4 relative z-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-9 h-9 rounded-sm bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-5 h-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("h1", { className: "text-base sm:text-lg font-display font-extrabold text-white tracking-wider", children: ["BULLS ", (0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F]", children: "&" }), " BEARS"] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] px-2 py-0.5 rounded bg-[#FF5F1F]/15 text-[#FF5F1F] border border-[#FF5F1F]/30 font-bold", children: "STANDBY LOBBY" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] sm:text-xs text-[#a1a1aa] uppercase tracking-wider", children: [teamData.teamName, " \u2022 ", teamData.tableNumber || "Main Arena Floor"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-3 py-1.5 rounded bg-[#09090b] border border-[#27272a] text-xs font-bold text-white flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "w-3.5 h-3.5 text-[#10B981]" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Balance: ", (0, jsx_runtime_1.jsx)("strong", { className: "text-[#10B981]", children: (0, utils_1.formatCurrency)(teamData.cashBalance) })] })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleLogout, className: "p-2 bg-[#09090b] border border-[#27272a] hover:border-red-500/50 text-[#71717a] hover:text-red-400 rounded-sm transition-colors text-xs flex items-center gap-1.5", title: "Switch Team / Logout", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Logout" })] })] })] }), (0, jsx_runtime_1.jsxs)("main", { className: "flex-1 flex flex-col items-center justify-center text-center my-6 relative z-10 max-w-3xl mx-auto w-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-6 flex flex-col items-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF5F1F] font-bold mb-2.5 px-3 py-1 rounded bg-[#FF5F1F]/10 border border-[#FF5F1F]/30", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 bg-[#FF5F1F] animate-ping" }), "SIMULATION ENGINE // TRADING TERMINAL STANDBY"] }), (0, jsx_runtime_1.jsx)("div", { className: "h-12 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(flipping_word_swap_1.FlippingWordSwap, { word1: currentPhrase.w1, word2: currentPhrase.w2, duration: 450, stagger: 35, className: "text-xl sm:text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight", toClassName: "text-[#FF5F1F]" }, phraseIdx) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-[#71717a] max-w-md mt-1", children: "When the host releases Step 1 \"News Flash\" on the main auditorium stage, Round 1 stock floats and intelligence will automatically unlock on this terminal." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-6 sm:p-8 bg-[#09090b]/80 border border-[#27272a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative group hover:border-[#FF5F1F]/50 transition-colors duration-500 mb-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-3 left-3 text-[9px] text-[#52525b] uppercase tracking-widest font-mono", children: "[ TERMINAL RADAR // LIVE OPTICALS ]" }), (0, jsx_runtime_1.jsx)(eye_tracking_1.EyeTracking, { eyeSize: 110, gap: 28, irisColor: isReady ? "#10B981" : "#FF5F1F", irisColorSecondary: isReady ? "#34D399" : "#FF8C38", pupilColor: "#050505", scleraColor: "#121216", variant: "cyber", pupilRange: 0.75, idleAnimation: true, blinkInterval: 3800 })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full max-w-md mb-6", children: (0, jsx_runtime_1.jsxs)("button", { onClick: handleToggleReady, disabled: isTogglingReady, className: `w-full py-4 px-6 rounded-xl border font-bold uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-2xl relative overflow-hidden group ${isReady
                                    ? "bg-emerald-950/40 border-[#10B981] text-white hover:bg-emerald-900/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                                    : "bg-[#FF5F1F]/15 border-[#FF5F1F] text-white hover:bg-[#FF5F1F]/25 shadow-[0_0_30px_rgba(255,95,31,0.25)] animate-pulse"}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-2 text-sm sm:text-base font-extrabold", children: isReady ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "w-6 h-6 rounded-full bg-[#10B981] text-black flex items-center justify-center shrink-0 shadow-md", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-4 h-4 stroke-[3]" }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-[#10B981]", children: "SQUAD STATUS: READY FOR ROUND 1" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "w-6 h-6 rounded-full bg-[#FF5F1F] text-black flex items-center justify-center shrink-0 shadow-md", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "w-4 h-4 fill-current" }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F]", children: "PRESS TO MARK SQUAD AS READY" })] })) }), (0, jsx_runtime_1.jsx)("div", { className: "text-[11px] text-[#a1a1aa] normal-case font-normal", children: isReady
                                            ? "✓ Synced with Stage & Admin Dashboard. Click to switch back to Standby."
                                            : "Signals the host and auditorium stage that your team is seated and ready." })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "w-full bg-[#09090b] border border-[#1e1e1e] rounded-xl p-4 text-left font-mono", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-xs pb-2.5 border-b border-[#18181b]", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a] uppercase font-bold tracking-wider", children: "Arena Readiness Status" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[11px] font-bold text-white", children: [(0, jsx_runtime_1.jsx)("strong", { className: "text-[#10B981]", children: readyCount }), " / ", totalCount, " Squads Ready (", readyPct, "%)"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full h-1.5 bg-[#18181b] rounded-full overflow-hidden mt-2.5 mb-3", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-gradient-to-r from-[#FF5F1F] to-[#10B981] transition-all duration-500 rounded-full", style: { width: `${readyPct}%` } }) }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1.5 max-h-24 overflow-y-auto", children: allTeams.map((t) => ((0, jsx_runtime_1.jsxs)("div", { className: `text-[10px] px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${t.id === teamData.id
                                            ? t.isReady
                                                ? "bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold"
                                                : "bg-[#FF5F1F]/20 border-[#FF5F1F] text-[#FF5F1F] font-bold"
                                            : t.isReady
                                                ? "bg-emerald-950/30 border-emerald-800 text-emerald-300"
                                                : "bg-[#121216] border-[#27272a] text-[#71717a]"}`, children: [(0, jsx_runtime_1.jsx)("span", { className: `w-1.5 h-1.5 rounded-full ${t.isReady ? "bg-[#10B981] shadow-[0_0_6px_#10B981]" : "bg-amber-400"}` }), (0, jsx_runtime_1.jsx)("span", { children: t.teamName }), t.id === teamData.id && (0, jsx_runtime_1.jsx)("span", { className: "text-[9px] opacity-75", children: "(You)" })] }, t.id))) })] })] }), (0, jsx_runtime_1.jsxs)("footer", { className: "pt-3 border-t border-[#18181b] flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] text-[#52525b] uppercase tracking-wider relative z-10 gap-2", children: [(0, jsx_runtime_1.jsx)("span", { children: "Ramaiah University Trading Simulation \u2022 SLH 15 Auditorium" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/", className: "hover:text-[#FF5F1F] transition-colors", children: "\u2190 Event Overview & Rules" })] })] }));
    }
    // --- 2. ACTIVE TRADING TERMINAL INTERFACE ---
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-[#030303] text-[#fafafa] font-mono pb-32", children: [(0, jsx_runtime_1.jsxs)("header", { className: "sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-[#1e1e1e] px-3 sm:px-6 lg:px-8 xl:px-10 py-3.5 flex flex-wrap items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: "flex items-center gap-2 group", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-7 h-7 rounded-sm bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 flex items-center justify-center text-[#FF5F1F]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsxs)("span", { className: "font-display font-bold text-white text-sm", children: ["BULLS", (0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F]", children: "&" }), "BEARS"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-px bg-[#27272a] hidden sm:block" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-bold text-white", children: teamData.teamName }), (0, jsx_runtime_1.jsx)(Quantumanalytics_1.StatusBadge, { status: teamData.isFrozen ? "paused" : "active" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 bg-[#030303] border border-[#27272a] px-3.5 py-1.5 rounded-sm", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-[#FF5F1F] font-bold", children: ["R", gameState?.currentRound || 0] }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-[#71717a]", children: "\u2022" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 text-sm font-display font-semibold text-white", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "w-3.5 h-3.5 text-[#FF5F1F]" }), (0, jsx_runtime_1.jsx)("span", { children: timeRemaining })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-[#71717a]", children: "\u2022" }), (0, jsx_runtime_1.jsx)("span", { className: `text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${gameState?.status === "TRADING_OPEN"
                                    ? "bg-[#10B981]/20 text-[#10B981]"
                                    : gameState?.status === "NEWS_RELEASED"
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "bg-rose-500/20 text-rose-400"}`, children: gameState?.status.replace("_", " ") })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setShowNewsDrawer(true), className: "px-3.5 py-1.5 bg-gradient-to-r from-[#FF5F1F] via-[#FF8C38] to-[#FF5F1F] bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-black text-xs rounded-md flex items-center gap-2 shadow-[0_0_20px_rgba(255,95,31,0.4)] hover:shadow-[0_0_28px_rgba(255,95,31,0.65)] transition-all transform hover:-translate-y-0.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-5 h-5 rounded bg-black/20 flex items-center justify-center shrink-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Newspaper, { className: "w-3.5 h-3.5 text-black fill-current" }) }), (0, jsx_runtime_1.jsx)("span", { className: "tracking-wider uppercase font-display", children: "News Intel" }), gameState?.roundInfo?.newsStories && ((0, jsx_runtime_1.jsx)("span", { className: "px-1.5 py-0.2 bg-black text-[#FF5F1F] rounded-full text-[10px] font-black shrink-0", children: gameState.roundInfo.newsStories.length }))] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                    setGiveTicker(Object.keys(teamData.portfolio)[0] || "AAPL");
                                    setReceiveTicker("NVDA");
                                    setShowSwapModal(true);
                                }, className: "px-3 py-1.5 bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 hover:border-[#FF5F1F] text-xs text-[#FF5F1F] font-bold rounded-sm flex items-center gap-1.5 transition-all", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeftRight, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Propose Swap" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: handleLogout, className: "p-1.5 text-[#71717a] hover:text-white rounded-sm transition-colors", title: "Log Out", children: (0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "w-4 h-4" }) })] })] }), (0, jsx_runtime_1.jsx)(PriceTickerMarquee_1.PriceTickerMarquee, { stocks: activeStocks, speed: 35 }), (0, jsx_runtime_1.jsxs)("main", { className: "w-full px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 space-y-6", children: [incomingDirectOffers.map((offer) => {
                        const secondsRemaining = Math.max(0, Math.floor((offer.expiresAt - Date.now()) / 1000));
                        const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / 120) * 100));
                        return ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-gradient-to-r from-emerald-950/40 via-[#09090b] to-emerald-950/30 border-2 border-[#10B981]/50 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] space-y-3 relative overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[#18181b]", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-gradient-to-r from-[#10B981] via-amber-400 to-[#FF5F1F] transition-all duration-1000", style: { width: `${progressPercent}%` } }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/50 flex items-center justify-center text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Handshake, { className: "w-5 h-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#10B981] text-black uppercase tracking-wider", children: "DIRECT P2P SELL OFFER" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-amber-400 font-bold flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Timer, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsxs)("span", { children: [secondsRemaining, "s remaining"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-sm font-bold text-white mt-0.5", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F]", children: offer.sellerTeamName }), " is offering to sell you", " ", (0, jsx_runtime_1.jsxs)("strong", { className: "text-white", children: [offer.quantity, " shares"] }), " of", " ", (0, jsx_runtime_1.jsx)("span", { className: "text-[#10B981]", children: offer.ticker }), " @ ", (0, utils_1.formatCurrency)(offer.price), "!"] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] text-[#a1a1aa]", children: ["Total Purchase Value: ", (0, jsx_runtime_1.jsx)("strong", { className: "text-white", children: (0, utils_1.formatCurrency)(offer.total) }), " \u2022 Direct settlement from your cash balance."] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 shrink-0", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => handleAcceptDirectSell(offer.id), className: "px-4 py-2 bg-[#10B981] text-black font-extrabold text-xs uppercase rounded-lg hover:bg-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]", children: ["Accept & Buy (", (0, utils_1.formatCurrency)(offer.total), ")"] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleRejectDirectSell(offer.id), className: "px-3 py-2 bg-[#18181b] border border-[#27272a] hover:border-rose-500 text-[#a1a1aa] hover:text-rose-400 text-xs font-bold rounded-lg transition-all", children: "Decline" })] })] })] }, offer.id));
                    }), outgoingDirectOffers.map((offer) => {
                        const secondsRemaining = Math.max(0, Math.floor((offer.expiresAt - Date.now()) / 1000));
                        return ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#09090b] border border-[#27272a] rounded-xl flex items-center justify-between text-xs text-[#d4d4d8]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-2 h-2 rounded-full bg-amber-400 animate-ping" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Outgoing Sell Offer to ", (0, jsx_runtime_1.jsx)("strong", { className: "text-white", children: offer.buyerTeamName }), ":", " ", (0, jsx_runtime_1.jsxs)("span", { className: "text-[#FF5F1F] font-bold", children: [offer.quantity, " ", offer.ticker] }), " for", " ", (0, jsx_runtime_1.jsx)("strong", { className: "text-[#10B981]", children: (0, utils_1.formatCurrency)(offer.total) })] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] text-amber-400 font-mono", children: ["(", secondsRemaining, "s left)"] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleCancelDirectSell(offer.id), className: "text-[10px] text-[#71717a] hover:text-rose-400 underline font-semibold", children: "Cancel Offer" })] }, offer.id));
                    }), incomingSwaps.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-gradient-to-r from-amber-500/20 via-[#FF5F1F]/10 to-transparent border border-amber-500/40 rounded-xl animate-pulse-fast flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "w-5 h-5 text-amber-400" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs font-bold text-white", children: ["Incoming Trade Proposal from ", (0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F]", children: incomingSwaps[0].senderTeam }), "!"] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] text-[#d4d4d8]", children: ["Offer: You give ", (0, jsx_runtime_1.jsxs)("strong", { className: "text-white", children: [incomingSwaps[0].receiveQty, " ", incomingSwaps[0].receiveTicker] }), " \u21C4 You receive ", (0, jsx_runtime_1.jsxs)("strong", { className: "text-[#10B981]", children: [incomingSwaps[0].giveQty, " ", incomingSwaps[0].giveTicker] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => handleSwapAction(incomingSwaps[0].id, "ACCEPT"), className: "px-3 py-1.5 bg-[#10B981] text-black font-bold text-xs uppercase rounded-lg hover:bg-white", children: "Accept Swap" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleSwapAction(incomingSwaps[0].id, "REJECT"), className: "px-3 py-1.5 bg-[#18181b] border border-[#27272a] text-white text-xs uppercase rounded-lg hover:bg-red-950 hover:text-red-400", children: "Decline" })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4", children: [(0, jsx_runtime_1.jsx)(Quantumanalytics_1.KpiCard, { title: "Available Cash", value: (0, utils_1.formatNumber)(Math.floor(teamData.cashBalance)), subValue: `$${(0, utils_1.formatNumber)(100000)} starting`, trend: teamData.cashBalance >= 50000 ? "up" : "down", trendVal: `${((teamData.cashBalance / 100000) * 100).toFixed(0)}% float`, isCurrency: true }), (0, jsx_runtime_1.jsx)(Quantumanalytics_1.KpiCard, { title: "Holdings Valuation", value: (0, utils_1.formatNumber)(Math.floor(teamData.holdingsValue)), subValue: `${Object.keys(teamData.portfolio).length} distinct equities`, trend: "up", trendVal: `${Object.values(teamData.portfolio).reduce((a, b) => a + b, 0)} shares`, isCurrency: true }), (0, jsx_runtime_1.jsx)(Quantumanalytics_1.KpiCard, { title: "Total Net Worth", value: (0, utils_1.formatNumber)(Math.floor(teamData.totalPortfolioValue)), subValue: "$100,000 baseline", trend: teamData.pnl >= 0 ? "up" : "down", trendVal: teamData.pnl >= 0 ? `+${teamData.pnlPercent.toFixed(1)}%` : `${teamData.pnlPercent.toFixed(1)}%`, isCurrency: true }), (0, jsx_runtime_1.jsx)(Quantumanalytics_1.KpiCard, { title: "Total Profit / Loss", value: (0, utils_1.formatNumber)(Math.floor(Math.abs(teamData.pnl))), subValue: teamData.pnl >= 0 ? "Net Profit" : "Net Drawdown", trend: teamData.pnl >= 0 ? "up" : "down", trendVal: teamData.pnl >= 0 ? `+${(0, utils_1.formatCurrency)(teamData.pnl)}` : `-${(0, utils_1.formatCurrency)(Math.abs(teamData.pnl))}`, isCurrency: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 xl:grid-cols-12 gap-6 items-start", children: [(0, jsx_runtime_1.jsxs)("div", { className: "xl:col-span-7 bg-[#09090b] border border-[#1e1e1e] rounded-xl p-4 sm:p-6 shadow-xl space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-sm sm:text-base font-bold text-white uppercase flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { children: "Market Float & Order Book" }), gameState?.marketExpanded && ((0, jsx_runtime_1.jsx)("span", { className: "text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30", children: "30 Stocks Active" }))] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-[#71717a]", children: "Fixed 100-share float limit per stock. Prices update at round resolution." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] text-[#a1a1aa] flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-2 h-2 rounded-full bg-[#10B981] animate-pulse" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Active Universe: ", (0, jsx_runtime_1.jsxs)("strong", { className: "text-white", children: [filteredActiveStocks.length, " of ", activeStocks.length, " Stocks"] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#030303] border border-[#1e1e1e] p-2.5 rounded-lg", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Filter stocks by ticker, company, or sector (e.g. NVDA, Apple)...", value: tableSearchQuery, onChange: (e) => setTableSearchQuery(e.target.value), className: "w-full bg-[#09090b] border border-[#27272a] focus:border-[#FF5F1F] rounded-md pl-8 pr-7 py-1.5 text-xs text-white outline-none" }), tableSearchQuery && ((0, jsx_runtime_1.jsx)("button", { onClick: () => setTableSearchQuery(""), className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#71717a] hover:text-white", children: "\u2715" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "relative shrink-0", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setIsSectorDropdownOpen((prev) => !prev), className: "flex items-center justify-between gap-2 px-3 py-1.5 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] rounded-md text-xs text-white min-w-[170px] transition-colors", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 truncate", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { className: "w-3.5 h-3.5 text-[#FF5F1F] shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate", children: selectedSectors.length === 0
                                                                            ? `All Sectors (${uniqueSectors.length})`
                                                                            : selectedSectors.length === 1
                                                                                ? selectedSectors[0]
                                                                                : `${selectedSectors.length} Sectors Active` })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "w-3.5 h-3.5 text-[#71717a] shrink-0" })] }), isSectorDropdownOpen && ((0, jsx_runtime_1.jsxs)("div", { className: "absolute right-0 top-full mt-1.5 w-64 bg-[#09090b] border border-[#27272a] rounded-xl shadow-2xl p-2.5 z-30 space-y-2 font-mono", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-1.5 border-b border-[#1e1e1e] text-[10px]", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-bold text-[#71717a] uppercase", children: "Filter by Sectors" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setSelectedSectors([]), className: "text-[#FF5F1F] hover:underline", children: "Select All" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setSelectedSectors([]), className: "text-[#71717a] hover:text-white", children: "Reset" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "max-h-48 overflow-y-auto space-y-1 pr-1", children: uniqueSectors.map((sector) => {
                                                                    const isSelected = selectedSectors.includes(sector);
                                                                    const count = activeStocks.filter((s) => s.sector === sector).length;
                                                                    return ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center justify-between p-1.5 rounded hover:bg-[#18181b] cursor-pointer text-xs group", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 min-w-0", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isSelected, onChange: (e) => {
                                                                                            if (e.target.checked) {
                                                                                                setSelectedSectors([...selectedSectors, sector]);
                                                                                            }
                                                                                            else {
                                                                                                setSelectedSectors(selectedSectors.filter((s) => s !== sector));
                                                                                            }
                                                                                        }, className: "accent-[#FF5F1F] rounded" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate text-[#d4d4d8] group-hover:text-white text-[11px]", children: sector })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a] font-mono px-1 rounded bg-[#030303] border border-[#1e1e1e]", children: count })] }, sector));
                                                                }) })] }))] })] }), (0, jsx_runtime_1.jsx)("div", { className: "hidden md:block overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-xs", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-[#1e1e1e] text-[10px] uppercase text-[#71717a]", children: [(0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium", children: "Asset" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium", children: "Sector" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium text-right", children: "Price" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium text-right", children: "Round \u0394" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium text-center", children: "Float Left" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium text-center", children: "Owned" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-3 font-medium text-right", children: "Action" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-[#18181b]", children: filteredActiveStocks.map((stock) => {
                                                        const ownedQty = teamData.portfolio[stock.ticker] || 0;
                                                        const isUp = stock.roundChangePercent >= 0;
                                                        const isInspected = inspectedTicker === stock.ticker;
                                                        return ((0, jsx_runtime_1.jsxs)("tr", { onClick: () => setInspectedTicker(stock.ticker), className: `cursor-pointer transition-all ${isInspected
                                                                ? "bg-[#FF5F1F]/10 text-white font-medium shadow-[inset_3px_0_0_#FF5F1F]"
                                                                : "hover:bg-[#18181b]/60"}`, title: "Click row to inspect live L2 Order Book Depth", children: [(0, jsx_runtime_1.jsx)("td", { className: "py-3 pl-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: stock.ticker, size: "md" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "font-bold text-white flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { children: stock.ticker }), stock.entryRound === 2 && ((0, jsx_runtime_1.jsx)("span", { title: "R2 Expansion Stock", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "w-3 h-3 text-amber-400" }) })), isInspected && ((0, jsx_runtime_1.jsx)("span", { className: "text-[8px] font-bold px-1 rounded bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/30", children: "L2 ACTIVE" }))] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] truncate max-w-[140px]", children: stock.name })] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-[11px] text-[#a1a1aa]", children: stock.sector }), (0, jsx_runtime_1.jsxs)("td", { className: "py-3 text-right font-bold text-white", children: ["$", stock.currentPrice.toFixed(2)] }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-right", children: (0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center gap-0.5 text-[11px] font-semibold ${isUp ? "text-[#10B981]" : "text-[#F43F5E]"}`, children: [isUp ? (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUp, { className: "w-3 h-3" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDown, { className: "w-3 h-3" }), stock.roundChangePercent, "%"] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-center", children: (0, jsx_runtime_1.jsxs)("span", { className: `text-xs font-bold px-2 py-0.5 rounded ${stock.availableSupply === 0
                                                                            ? "bg-red-950 text-red-400 border border-red-800"
                                                                            : stock.availableSupply < 30
                                                                                ? "bg-amber-950 text-amber-400 border border-amber-800"
                                                                                : "bg-[#18181b] text-white border border-[#27272a]"}`, children: [stock.availableSupply, " / 100"] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-center", children: (0, jsx_runtime_1.jsx)("span", { className: "font-bold text-[#FF5F1F]", children: ownedQty > 0 ? ownedQty : "—" }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 text-right pr-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-1.5", onClick: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                                                                    setOrderModal({ isOpen: true, stock, action: "BUY" });
                                                                                    setOrderQty(5);
                                                                                }, disabled: gameState?.status !== "TRADING_OPEN" || stock.availableSupply === 0, className: "px-2.5 py-1 bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981] hover:text-black font-bold rounded text-[10px] uppercase transition-all disabled:opacity-30", children: "Buy" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                                                                    setOrderModal({ isOpen: true, stock, action: "SELL" });
                                                                                    setOrderQty(Math.min(ownedQty || 1, 5));
                                                                                }, disabled: gameState?.status !== "TRADING_OPEN" || ownedQty === 0, className: "px-2.5 py-1 bg-[#F43F5E]/15 text-[#F43F5E] hover:bg-[#F43F5E] hover:text-white font-bold rounded text-[10px] uppercase transition-all disabled:opacity-30", children: "Sell" })] }) })] }, stock.ticker));
                                                    }) })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "block md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3", children: filteredActiveStocks.map((stock) => {
                                            const ownedQty = teamData.portfolio[stock.ticker] || 0;
                                            const isUp = stock.roundChangePercent >= 0;
                                            const isInspected = inspectedTicker === stock.ticker;
                                            return ((0, jsx_runtime_1.jsxs)("div", { onClick: () => setInspectedTicker(stock.ticker), className: `p-3.5 bg-[#030303] border rounded-xl space-y-3 relative overflow-hidden transition-all shadow-md cursor-pointer ${isInspected
                                                    ? "border-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)] bg-[#09090b]"
                                                    : "border-[#1e1e1e] hover:border-[#27272a]"}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5 min-w-0", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: stock.ticker, size: "md" }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "font-bold text-white text-sm flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { children: stock.ticker }), stock.entryRound === 2 && ((0, jsx_runtime_1.jsx)("span", { className: "text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30", children: "R2" })), isInspected && ((0, jsx_runtime_1.jsx)("span", { className: "text-[8px] font-bold px-1 rounded bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/30", children: "L2" }))] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] truncate max-w-[130px]", children: stock.name })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right shrink-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-sm font-extrabold text-white", children: ["$", stock.currentPrice.toFixed(2)] }), (0, jsx_runtime_1.jsxs)("div", { className: `inline-flex items-center gap-0.5 text-[10px] font-bold ${isUp ? "text-[#10B981]" : "text-[#F43F5E]"}`, children: [isUp ? (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUp, { className: "w-3 h-3" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDown, { className: "w-3 h-3" }), stock.roundChangePercent, "%"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-[11px] bg-[#09090b] p-2 rounded-lg border border-[#18181b]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-[#71717a] text-[10px] truncate max-w-[110px]", children: ["Sector: ", (0, jsx_runtime_1.jsx)("span", { className: "text-white font-medium", children: stock.sector })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 shrink-0", children: [(0, jsx_runtime_1.jsxs)("span", { className: `text-[10px] font-bold px-1.5 py-0.5 rounded ${stock.availableSupply === 0
                                                                            ? "bg-red-950/60 text-red-400 border border-red-800"
                                                                            : stock.availableSupply < 30
                                                                                ? "bg-amber-950/60 text-amber-400 border border-amber-800"
                                                                                : "bg-[#18181b] text-white border border-[#27272a]"}`, children: ["Float: ", stock.availableSupply, "/100"] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FF5F1F]/15 text-[#FF5F1F] border border-[#FF5F1F]/30", children: ["Owned: ", ownedQty > 0 ? ownedQty : "0"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2 pt-1", onClick: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                                                    setOrderModal({ isOpen: true, stock, action: "BUY" });
                                                                    setOrderQty(5);
                                                                }, disabled: gameState?.status !== "TRADING_OPEN" || stock.availableSupply === 0, className: "py-2.5 bg-[#10B981]/15 border border-[#10B981]/30 hover:bg-[#10B981] hover:text-black text-[#10B981] font-bold rounded-lg text-xs uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUp, { className: "w-3.5 h-3.5" }), "Buy"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                                                    setOrderModal({ isOpen: true, stock, action: "SELL" });
                                                                    setOrderQty(Math.min(ownedQty || 1, 5));
                                                                }, disabled: gameState?.status !== "TRADING_OPEN" || ownedQty === 0, className: "py-2.5 bg-[#F43F5E]/15 border border-[#F43F5E]/30 hover:bg-[#F43F5E] hover:text-white text-[#F43F5E] font-bold rounded-lg text-xs uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDown, { className: "w-3.5 h-3.5" }), "Sell"] })] })] }, stock.ticker));
                                        }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-5 xl:col-span-5 space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-[#09090b] border border-[#1e1e1e] rounded-sm p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-3 mb-3 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-bold text-white uppercase", children: "Your Stock Holdings" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] text-[#71717a]", children: [Object.keys(teamData.portfolio).length, " assets"] })] }), Object.keys(teamData.portfolio).length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-6 text-xs text-[#71717a]", children: "No shares owned yet. Execute a BUY order or negotiate a P2P swap!" })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: Object.entries(teamData.portfolio).map(([ticker, qty]) => {
                                                    const price = activeStocks.find((s) => s.ticker === ticker)?.currentPrice || 0;
                                                    const val = price * qty;
                                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "p-2.5 bg-[#030303] border border-[#1e1e1e] rounded-sm flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "font-bold text-white text-xs", children: ticker }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#71717a]", children: [qty, " shares @ $", price.toFixed(2)] })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-right font-bold text-[#10B981] text-xs", children: (0, utils_1.formatCurrency)(val) })] }, ticker));
                                                }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-[#09090b] border border-[#1e1e1e] rounded-xl p-4 shadow-lg space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-2 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-bold text-white uppercase", children: "Order Book Depth (L2)" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[9px] px-2 py-0.5 rounded-full bg-[#FF5F1F]/20 text-[#FF5F1F] font-bold border border-[#FF5F1F]/30", children: ["INSPECTING ", activeStocks.find((s) => s.ticker === inspectedTicker)?.ticker || activeStocks[0]?.ticker || "NVDA"] })] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] text-[#10B981] font-semibold flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" }), "Live Float Sync"] })] }), (0, jsx_runtime_1.jsx)(OrderBookDepth_1.OrderBookDepth, { currentPrice: activeStocks.find((s) => s.ticker === inspectedTicker)?.currentPrice ||
                                                    activeStocks[0]?.currentPrice ||
                                                    182.47, ticker: activeStocks.find((s) => s.ticker === inspectedTicker)?.ticker ||
                                                    activeStocks[0]?.ticker ||
                                                    "NVDA", name: activeStocks.find((s) => s.ticker === inspectedTicker)?.name ||
                                                    activeStocks[0]?.name ||
                                                    "NVIDIA Corporation", sector: activeStocks.find((s) => s.ticker === inspectedTicker)?.sector ||
                                                    activeStocks[0]?.sector ||
                                                    "Semiconductors", availableSupply: activeStocks.find((s) => s.ticker === inspectedTicker)?.availableSupply !== undefined
                                                    ? activeStocks.find((s) => s.ticker === inspectedTicker).availableSupply
                                                    : activeStocks[0]?.availableSupply ?? 100, roundChangePercent: activeStocks.find((s) => s.ticker === inspectedTicker)?.roundChangePercent ||
                                                    activeStocks[0]?.roundChangePercent ||
                                                    0 })] }), (0, jsx_runtime_1.jsx)(NotificationsTimeline_1.NotificationsTimeline, { notifications: transactions.map((tx) => ({
                                            id: tx.id,
                                            who: tx.teamName,
                                            initials: tx.teamName.split(/\s+/).map((word) => word[0]).join("").slice(0, 2),
                                            what: tx.type === "SWAP" ? "completed a trade involving" : `executed a ${tx.type} on`,
                                            context: tx.type === "SWAP" ? tx.ticker : `${tx.quantity} ${tx.ticker} @ ${(0, utils_1.formatCurrency)(tx.price)}`,
                                            time: tx.timestamp,
                                            type: tx.type === "SWAP" ? "SWAP" : "TRADE",
                                        })) }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-[#09090b] border border-[#1e1e1e] rounded-sm p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-3 mb-3 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-bold text-white uppercase", children: "Live Audit Stream" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#10B981]", children: "Realtime" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2 max-h-52 overflow-y-auto pr-1", children: transactions.slice(0, 8).map((tx) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-2 bg-[#030303] border border-[#18181b] rounded-sm text-[11px] flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-white", children: tx.teamName }), " ", (0, jsx_runtime_1.jsx)("span", { className: tx.type === "BUY"
                                                                        ? "text-[#10B981]"
                                                                        : tx.type === "SELL"
                                                                            ? "text-[#F43F5E]"
                                                                            : "text-[#3b82f6]", children: tx.type }), " ", (0, jsx_runtime_1.jsx)("span", { className: "text-[#a1a1aa]", children: tx.ticker })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a]", children: tx.timestamp })] }, tx.id))) })] })] })] })] }), orderModal.isOpen && orderModal.stock && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-xl p-6 shadow-2xl space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-3 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: orderModal.stock.ticker, size: "md" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-base font-bold text-white flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { children: orderModal.stock.ticker }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[11px] text-[#71717a] font-normal", children: ["\u2022 ", orderModal.stock.name] })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#a1a1aa] uppercase", children: orderModal.stock.sector })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setOrderModal({ isOpen: false, stock: null, action: "BUY" }), className: "text-[#71717a] hover:text-white p-1 rounded hover:bg-[#18181b]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-5 h-5" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex bg-[#030303] p-1 border border-[#1e1e1e] rounded-lg", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                        setOrderModal((prev) => ({ ...prev, action: "BUY" }));
                                        setOrderQty(5);
                                    }, className: `flex-1 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${orderModal.action === "BUY"
                                        ? "bg-[#10B981] text-black shadow-md"
                                        : "text-[#71717a] hover:text-white"}`, children: "Buy Shares" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                        setOrderModal((prev) => ({ ...prev, action: "SELL" }));
                                        const currentOwned = teamData?.portfolio[orderModal.stock?.ticker || ""] || 0;
                                        setOrderQty(Math.min(currentOwned || 1, 5));
                                    }, className: `flex-1 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${orderModal.action === "SELL"
                                        ? "bg-[#F43F5E] text-white shadow-md"
                                        : "text-[#71717a] hover:text-white"}`, children: "Sell / Liquidate" })] }), orderModal.action === "SELL" && (teamData?.portfolio[orderModal.stock.ticker] || 0) === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-red-950/60 border border-red-800 text-red-400 text-xs rounded-lg flex items-start gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { className: "w-4 h-4 shrink-0 text-red-400 mt-0.5" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "font-bold", children: "Zero Shares Owned \u2014 Cannot Sell" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] text-red-300/80 mt-0.5 leading-relaxed", children: ["You own ", (0, jsx_runtime_1.jsx)("strong", { children: "0 shares" }), " of ", (0, jsx_runtime_1.jsx)("strong", { children: orderModal.stock.ticker }), ". Short selling is not allowed; you can only liquidate stocks currently in your portfolio."] })] })] })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] text-[#71717a] uppercase mb-1 font-bold", children: orderModal.action === "BUY" ? "Choose Stock to Buy" : "Choose Position to Sell" }), (0, jsx_runtime_1.jsx)("select", { value: orderModal.stock.ticker, onChange: (e) => {
                                        const nextStock = activeStocks.find((s) => s.ticker === e.target.value);
                                        if (nextStock) {
                                            setOrderModal((prev) => ({ ...prev, stock: nextStock }));
                                            const owned = teamData?.portfolio[nextStock.ticker] || 0;
                                            const maxQty = orderModal.action === "BUY"
                                                ? Math.max(1, nextStock.availableSupply)
                                                : Math.max(1, owned || 1);
                                            setOrderQty(Math.min(5, maxQty));
                                        }
                                    }, className: "w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg p-2.5 text-white outline-none text-xs", children: orderModal.action === "SELL" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("optgroup", { label: "Your Owned Holdings", children: activeStocks
                                                    .filter((s) => (teamData?.portfolio[s.ticker] || 0) > 0)
                                                    .map((s) => ((0, jsx_runtime_1.jsxs)("option", { value: s.ticker, children: [s.ticker, " \u2014 ", s.name, " \u2022 [", teamData?.portfolio[s.ticker], " Shares Owned] ($", s.currentPrice.toFixed(2), ")"] }, s.ticker))) }), activeStocks.filter((s) => (teamData?.portfolio[s.ticker] || 0) === 0).length > 0 && ((0, jsx_runtime_1.jsx)("optgroup", { label: "Other Equities (0 Owned - Locked)", children: activeStocks
                                                    .filter((s) => (teamData?.portfolio[s.ticker] || 0) === 0)
                                                    .map((s) => ((0, jsx_runtime_1.jsxs)("option", { value: s.ticker, disabled: true, children: [s.ticker, " \u2014 ", s.name, " \u2022 [0 Owned - Cannot Sell]"] }, s.ticker))) }))] })) : (activeStocks.map((s) => {
                                        const owned = teamData?.portfolio[s.ticker] || 0;
                                        return ((0, jsx_runtime_1.jsxs)("option", { value: s.ticker, children: [s.ticker, " \u2014 ", s.name, " ($", s.currentPrice.toFixed(2), ") ", owned > 0 ? `• [${owned} Owned]` : ""] }, s.ticker));
                                    })) })] }), orderError && ((0, jsx_runtime_1.jsx)("div", { className: "p-2.5 bg-red-950/50 border border-red-800 text-red-400 text-xs rounded-lg", children: orderError })), orderSuccess && ((0, jsx_runtime_1.jsxs)("div", { className: "p-2.5 bg-emerald-950/50 border border-emerald-800 text-[#10B981] text-xs rounded-lg flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: orderSuccess })] })), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3.5 text-xs pt-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-2.5 bg-[#030303] border border-[#1e1e1e] rounded-lg", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Current Price" }), (0, jsx_runtime_1.jsxs)("div", { className: "font-bold text-white text-sm mt-0.5", children: ["$", orderModal.stock.currentPrice.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-2.5 bg-[#030303] border border-[#1e1e1e] rounded-lg", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: orderModal.action === "BUY" ? "Float Available" : "Shares Owned" }), (0, jsx_runtime_1.jsx)("div", { className: "font-bold text-[#FF5F1F] text-sm mt-0.5", children: orderModal.action === "BUY"
                                                        ? `${orderModal.stock.availableSupply} / 100`
                                                        : `${teamData?.portfolio[orderModal.stock.ticker] || 0} Shares` })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "py-1", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] text-[#71717a] uppercase mb-2 text-center font-bold tracking-wider", children: "Select Share Quantity" }), (0, jsx_runtime_1.jsx)(stepper_1.Stepper, { value: orderQty, min: 1, max: orderModal.action === "BUY"
                                                ? Math.max(1, orderModal.stock.availableSupply)
                                                : Math.max(1, teamData?.portfolio[orderModal.stock.ticker] || 1), onChange: setOrderQty })] }), orderModal.action === "SELL" && ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#030303] border border-[#27272a] rounded-lg space-y-2.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] text-[#FF5F1F] uppercase font-bold tracking-wider", children: "Sell Destination / Buyer Team" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[9px] px-1.5 py-0.5 rounded bg-[#FF5F1F]/10 text-[#FF5F1F] font-bold", children: "120s P2P TRADE" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setSellTargetMode("DIRECT_TEAM"), className: `py-1.5 px-2 rounded text-[11px] font-bold transition-all ${sellTargetMode === "DIRECT_TEAM"
                                                        ? "bg-[#FF5F1F] text-black shadow-sm"
                                                        : "bg-[#09090b] text-[#71717a] border border-[#1e1e1e] hover:text-white"}`, children: "\uD83E\uDD1D Direct to Team (120s)" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setSellTargetMode("MARKET_POOL"), className: `py-1.5 px-2 rounded text-[11px] font-bold transition-all ${sellTargetMode === "MARKET_POOL"
                                                        ? "bg-[#27272a] text-white"
                                                        : "bg-[#09090b] text-[#71717a] border border-[#1e1e1e] hover:text-white"}`, children: "\uD83C\uDFDB\uFE0F Market Pool" })] }), sellTargetMode === "DIRECT_TEAM" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5 pt-1", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] text-[#71717a] uppercase font-bold", children: "Choose Counterparty Team to Buy These Shares:" }), (0, jsx_runtime_1.jsxs)("select", { value: sellTargetTeamId, onChange: (e) => setSellTargetTeamId(e.target.value), className: "w-full bg-[#09090b] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3 py-2 text-white text-xs font-semibold outline-none", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select a buyer team..." }), allTeams
                                                            .filter((t) => t.id !== teamId)
                                                            .map((t) => ((0, jsx_runtime_1.jsxs)("option", { value: t.id, children: [t.teamName, " (", t.tableNumber || "Station", ")"] }, t.id)))] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-[10px] text-[#71717a] leading-tight", children: ["*This sell request will be transmitted to the selected team with an active ", (0, jsx_runtime_1.jsx)("strong", { children: "120-second countdown" }), ". If another team acquires these shares before they accept, this offer will automatically cancel."] })] }))] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center p-3 bg-[#030303] border border-[#27272a] rounded-lg text-sm", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-[#71717a] uppercase text-xs font-semibold", children: "Total Order Value:" }), (0, jsx_runtime_1.jsx)("span", { className: "font-extrabold text-[#FF5F1F] text-base", children: (0, utils_1.formatCurrency)(orderModal.stock.currentPrice * orderQty) })] }), (0, jsx_runtime_1.jsx)("button", { onClick: handleExecuteOrder, disabled: isSubmittingOrder ||
                                        (orderModal.action === "BUY" && orderModal.stock.availableSupply === 0) ||
                                        (orderModal.action === "SELL" && (!teamData?.portfolio[orderModal.stock.ticker] || teamData?.portfolio[orderModal.stock.ticker] === 0)) ||
                                        (orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM" && !sellTargetTeamId), className: `w-full py-3 font-bold uppercase rounded-lg text-xs tracking-wider transition-all ${orderModal.action === "BUY"
                                        ? "bg-[#10B981] text-black hover:bg-white"
                                        : "bg-[#F43F5E] text-white hover:bg-white hover:text-black"} disabled:opacity-30 disabled:cursor-not-allowed`, children: isSubmittingOrder
                                        ? "Transmitting Order..."
                                        : orderModal.action === "SELL" && (!teamData?.portfolio[orderModal.stock.ticker] || teamData?.portfolio[orderModal.stock.ticker] === 0)
                                            ? "Cannot Sell (0 Shares Owned)"
                                            : orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM"
                                                ? `Send 120s Sell Offer to ${allTeams.find((t) => t.id === sellTargetTeamId)?.teamName || "Selected Team"} →`
                                                : `Confirm ${orderModal.action} (${orderQty} Shares of ${orderModal.stock.ticker})` })] })] }) })), showSwapModal && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-sm p-6 shadow-2xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-3 mb-4 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeftRight, { className: "w-4 h-4 text-[#FF5F1F]" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-bold text-white uppercase", children: "Propose Bilateral Swap" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowSwapModal(false), className: "text-[#71717a] hover:text-white", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-5 h-5" }) })] }), swapMessage && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-2.5 bg-[#030303] border border-[#27272a] text-xs text-white rounded-sm", children: swapMessage })), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] text-[#71717a] uppercase mb-1", children: "Target Counterparty Team" }), (0, jsx_runtime_1.jsxs)("select", { value: targetTeamId, onChange: (e) => setTargetTeamId(e.target.value), className: "w-full bg-[#030303] border border-[#27272a] rounded-sm px-3 py-2 text-white outline-none", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select a team to trade with..." }), allTeams
                                                    .filter((t) => t.id !== teamId)
                                                    .map((t) => ((0, jsx_runtime_1.jsx)("option", { value: t.id, children: t.teamName }, t.id)))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] text-[#F43F5E] uppercase font-bold mb-1", children: "You Give" }), (0, jsx_runtime_1.jsx)("select", { value: giveTicker, onChange: (e) => setGiveTicker(e.target.value), className: "w-full bg-[#09090b] border border-[#27272a] rounded-sm px-2 py-1.5 text-white mb-2", children: Object.keys(teamData.portfolio).map((t) => ((0, jsx_runtime_1.jsxs)("option", { value: t, children: [t, " (", teamData.portfolio[t], " owned)"] }, t))) }), (0, jsx_runtime_1.jsx)(stepper_1.Stepper, { value: giveQty, min: 1, max: Math.max(1, teamData.portfolio[giveTicker] || 1), onChange: setGiveQty })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-[10px] text-[#10B981] uppercase font-bold mb-1", children: "You Receive" }), (0, jsx_runtime_1.jsx)("select", { value: receiveTicker, onChange: (e) => setReceiveTicker(e.target.value), className: "w-full bg-[#09090b] border border-[#27272a] rounded-sm px-2 py-1.5 text-white mb-2", children: activeStocks.map((s) => ((0, jsx_runtime_1.jsx)("option", { value: s.ticker, children: s.ticker }, s.ticker))) }), (0, jsx_runtime_1.jsx)(stepper_1.Stepper, { value: receiveQty, min: 1, max: 50, onChange: setReceiveQty })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-[#71717a]", children: "*No automated valuation. The recipient team will have 60 seconds to accept or decline." }), (0, jsx_runtime_1.jsx)("button", { onClick: handleProposeSwap, disabled: !targetTeamId || !giveTicker || !receiveTicker, className: "w-full py-2.5 bg-[#FF5F1F] text-black font-bold uppercase rounded-sm hover:bg-white transition-colors disabled:opacity-40", children: "Send Trade Proposal" })] })] }) })), (0, jsx_runtime_1.jsx)(react_2.AnimatePresence, { children: showNewsDrawer && gameState?.roundInfo && ((0, jsx_runtime_1.jsxs)("div", { className: "fixed inset-0 z-50 overflow-hidden font-mono", children: [(0, jsx_runtime_1.jsx)(react_2.motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.22 }, onClick: () => setShowNewsDrawer(false), className: "absolute inset-0 bg-black/80 backdrop-blur-sm" }), (0, jsx_runtime_1.jsxs)(react_2.motion.div, { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" }, transition: { type: "spring", stiffness: 380, damping: 35 }, className: "absolute inset-y-0 right-0 w-full max-w-lg bg-[#09090b] border-l border-[#27272a] h-full p-6 overflow-y-auto flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] z-10", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-4 mb-4 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-9 h-9 rounded-lg bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Newspaper, { className: "w-5 h-5 text-[#FF5F1F]" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-[#FF5F1F] font-bold tracking-wider", children: ["ROUND ", gameState.currentRound, " INTEL"] }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm font-bold text-white", children: gameState.roundInfo.title })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowNewsDrawer(false), className: "p-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[#71717a] hover:text-white hover:border-[#FF5F1F] transition-all", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-4 h-4" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-[11px] text-[#a1a1aa] mb-3 px-1", children: [(0, jsx_runtime_1.jsx)("span", { children: "Click any card to open full carousel view" }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                                        setNewsCarouselIdx(0);
                                                        sounds_1.sounds.playTick();
                                                    }, className: "text-[#FF5F1F] hover:underline font-bold flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("span", { children: "Open Carousel" }), (0, jsx_runtime_1.jsx)("span", { children: "\u2197" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: gameState.roundInfo.newsStories.map((story, idx) => ((0, jsx_runtime_1.jsxs)(react_2.motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.08 + idx * 0.04 }, onClick: () => {
                                                    setNewsCarouselIdx(idx);
                                                    sounds_1.sounds.playTick();
                                                }, className: "p-4 bg-[#030303] border border-[#1e1e1e] hover:border-[#FF5F1F] rounded-xl space-y-2.5 shadow-sm transition-all cursor-pointer group hover:bg-[#09090b]/80 relative overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-2", children: (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] font-bold text-[#FF5F1F] px-2 py-0.5 rounded bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 group-hover:bg-[#FF5F1F] group-hover:text-black transition-colors", children: ["DEVELOPMENT #", story.id] }) }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] text-[#71717a] group-hover:text-[#FF5F1F] flex items-center gap-1 font-semibold transition-colors", children: [(0, jsx_runtime_1.jsx)("span", { children: "Carousel View" }), (0, jsx_runtime_1.jsx)("span", { children: "\u2197" })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold text-white group-hover:text-[#FF5F1F] transition-colors leading-relaxed", children: story.headline }), gameState.currentRound === 0 && story.clueSummary && ((0, jsx_runtime_1.jsxs)("p", { className: "text-[11px] text-[#a1a1aa] leading-relaxed", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Consider:" }), " ", story.clueSummary] }))] }, story.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "pt-6 border-t border-[#1e1e1e] mt-6 flex gap-3", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                                setNewsCarouselIdx(0);
                                                sounds_1.sounds.playTick();
                                            }, className: "flex-1 py-2.5 bg-[#FF5F1F] hover:bg-white text-black font-extrabold text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)] text-center", children: "Launch Carousel Mode" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowNewsDrawer(false), className: "px-4 py-2.5 bg-[#18181b] border border-[#27272a] hover:border-[#FF5F1F] text-white font-bold text-xs uppercase rounded-xl hover:bg-[#27272a] transition-all", children: "Close" })] })] })] })) }), (0, jsx_runtime_1.jsx)(react_2.AnimatePresence, { children: newsCarouselIdx !== null && gameState?.roundInfo?.newsStories && ((0, jsx_runtime_1.jsxs)("div", { className: "fixed inset-0 z-[60] overflow-hidden font-mono flex items-center justify-center p-3 sm:p-6", children: [(0, jsx_runtime_1.jsx)(react_2.motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setNewsCarouselIdx(null), className: "absolute inset-0 bg-black/90 backdrop-blur-md" }), (0, jsx_runtime_1.jsx)(react_2.motion.div, { initial: { opacity: 0, scale: 0.95, y: 15 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 15 }, transition: { type: "spring", stiffness: 350, damping: 30 }, className: "relative w-full max-w-3xl bg-[#09090b] border-2 border-[#FF5F1F]/50 rounded-2xl p-5 sm:p-8 shadow-[0_0_80px_rgba(255,95,31,0.25)] z-10 flex flex-col justify-between max-h-[92vh] overflow-y-auto", children: (() => {
                                const stories = gameState.roundInfo.newsStories;
                                const safeIdx = Math.max(0, Math.min(newsCarouselIdx, stories.length - 1));
                                const currentStory = stories[safeIdx];
                                const handlePrev = () => {
                                    setNewsCarouselIdx((safeIdx - 1 + stories.length) % stories.length);
                                    sounds_1.sounds.playTick();
                                };
                                const handleNext = () => {
                                    setNewsCarouselIdx((safeIdx + 1) % stories.length);
                                    sounds_1.sounds.playTick();
                                };
                                return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-4 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-lg bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Newspaper, { className: "w-5 h-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-[#FF5F1F] font-bold tracking-wider uppercase", children: ["ROUND ", gameState.currentRound, " INTEL CAROUSEL"] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold", children: ["STORY ", safeIdx + 1, " OF ", stories.length] })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm font-bold text-white", children: gameState.roundInfo.title })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setNewsCarouselIdx(null), className: "p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-[#71717a] hover:text-white hover:border-[#FF5F1F] transition-all", title: "Close Carousel", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-5 h-5" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "relative overflow-hidden py-2 min-h-[220px] flex flex-col justify-center", children: (0, jsx_runtime_1.jsx)(react_2.AnimatePresence, { mode: "wait", children: (0, jsx_runtime_1.jsxs)(react_2.motion.div, { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 }, transition: { duration: 0.2 }, className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap items-center gap-2", children: (0, jsx_runtime_1.jsxs)("span", { className: "px-3 py-1 bg-[#FF5F1F] text-black font-extrabold text-xs uppercase tracking-wider rounded shadow-[0_0_15px_rgba(255,95,31,0.4)]", children: ["DEVELOPMENT #", currentStory.id] }) }), (0, jsx_runtime_1.jsx)("h2", { className: "text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight leading-snug", children: currentStory.headline }), gameState.currentRound === 0 && currentStory.clueSummary && ((0, jsx_runtime_1.jsxs)("p", { className: "text-xs sm:text-sm text-[#a1a1aa] leading-relaxed", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Consider:" }), " ", currentStory.clueSummary] }))] }, currentStory.id) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "pt-4 border-t border-[#1e1e1e] flex flex-col sm:flex-row items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: handlePrev, className: "w-full sm:w-auto px-4 py-2.5 bg-[#18181b] border border-[#27272a] hover:border-[#FF5F1F] hover:bg-[#27272a] text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ChevronLeft, { className: "w-4 h-4 group-hover:-translate-x-0.5 transition-transform" }), (0, jsx_runtime_1.jsx)("span", { children: "Previous Story" })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-2", children: stories.map((s, idx) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                                            setNewsCarouselIdx(idx);
                                                            sounds_1.sounds.playTick();
                                                        }, className: `h-2.5 rounded-full transition-all duration-300 ${idx === safeIdx
                                                            ? "w-8 bg-[#FF5F1F] shadow-[0_0_10px_#FF5F1F]"
                                                            : "w-2.5 bg-[#27272a] hover:bg-[#52525b]"}`, title: `Jump to Development #${s.id}` }, s.id))) }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleNext, className: "w-full sm:w-auto px-4 py-2.5 bg-[#FF5F1F] hover:bg-white text-black font-extrabold text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)] group", children: [(0, jsx_runtime_1.jsx)("span", { children: "Next Story" }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "w-4 h-4 group-hover:translate-x-0.5 transition-transform" })] })] })] }));
                            })() })] })) }), showJournalModal && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative max-h-[92vh] overflow-y-auto", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setShowJournalModal(false), className: "absolute top-2 right-2 z-50 p-2 bg-zinc-900 border border-zinc-700 text-white rounded-full hover:bg-zinc-800", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsx)(trade_summary_1.TradeSummary, { date: `OCT 1 • R${gameState?.currentRound || 0}`, trades: Object.keys(teamData.portfolio).length > 0
                                ? Object.entries(teamData.portfolio).map(([ticker, qty], idx) => {
                                    const stock = activeStocks.find((s) => s.ticker === ticker);
                                    const pnl = stock ? (stock.currentPrice - stock.startingPrice) * qty : 0;
                                    return {
                                        id: `trade-${ticker}-${idx}`,
                                        asset: `${ticker} — ${stock?.name || ticker}`,
                                        session: `Round ${gameState?.currentRound || 1}`,
                                        market: stock?.sector || "Equities",
                                        strategy: pnl >= 0 ? "Momentum Gain" : "Value Position",
                                        description: `Holding ${qty} shares of ${stock?.name || ticker} at $${(stock?.currentPrice || 0).toFixed(2)}.`,
                                        pnl,
                                        sparklineData: [
                                            stock?.startingPrice || 100,
                                            ((stock?.startingPrice || 100) + (stock?.currentPrice || 100)) / 2,
                                            stock?.currentPrice || 100,
                                        ],
                                        tags: [stock?.sector || "Market", `${qty} Shares`, `${stock?.roundChangePercent || 0}%`],
                                        contracts: qty,
                                        side: "LONG",
                                    };
                                })
                                : [
                                    {
                                        id: "default-trade-1",
                                        asset: "AAPL — Apple Inc.",
                                        session: "Round 1",
                                        market: "Big Tech",
                                        strategy: "Base Allocation",
                                        description: "Initial portfolio liquidity ready for allocation.",
                                        pnl: 1250,
                                        sparklineData: [210, 218, 225],
                                        tags: ["Tech", "Liquid", "+5%"],
                                        contracts: 10,
                                        side: "LONG",
                                    },
                                ], onAddTrade: () => {
                                setShowJournalModal(false);
                                if (activeStocks.length > 0) {
                                    setOrderModal({ isOpen: true, stock: activeStocks[0], action: "BUY" });
                                }
                            } })] }) })), showAuditModal && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative max-h-[92vh] overflow-y-auto", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setShowAuditModal(false), className: "absolute top-2 right-2 z-50 p-2 bg-zinc-900 border border-zinc-700 text-white rounded-full hover:bg-zinc-800", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsx)(transaction_list_1.TransactionList, { transactions: transactions.map((tx, idx) => ({
                                id: tx.id || `tx-${idx}`,
                                icon: tx.type === "BUY" ? ((0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUp, { className: "w-4 h-4 text-emerald-400" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDown, { className: "w-4 h-4 text-rose-400" })),
                                name: `${tx.teamName || "Team"} • ${tx.ticker}`,
                                category: `${tx.type} Order`,
                                amount: `$${(0, utils_1.formatNumber)(tx.total ?? tx.price * tx.quantity)}`,
                                date: "Oct 1, 2026",
                                time: tx.timestamp || "Live",
                                transactionId: `TX-${tx.id?.slice(0, 8) || Math.random().toString(36).slice(2, 8)}`,
                                paymentMethod: "Trading Margin Float",
                                cardNumber: `${tx.quantity} Shares`,
                                cardType: tx.type || "BUY",
                            })) })] }) })), (0, jsx_runtime_1.jsx)(FloatingDockMenu_1.FloatingDockMenu, { isFixed: true, menuWidth: 360, searchSuggestions: activeStocks.length > 0
                    ? activeStocks.map((s) => `${s.ticker} — ${s.name}`).slice(0, 10)
                    : [
                        "NVDA — NVIDIA Corp",
                        "AAPL — Apple Inc",
                        "TSLA — Tesla Inc",
                        "MSFT — Microsoft Corp",
                        "XOM — ExxonMobil",
                        "LMT — Lockheed Martin",
                    ], onSearch: (query) => {
                    const cleanQuery = query.split("—")[0].trim();
                    setTableSearchQuery(cleanQuery);
                    const exactStock = activeStocks.find((s) => s.ticker.toLowerCase() === cleanQuery.toLowerCase() ||
                        s.name.toLowerCase().includes(cleanQuery.toLowerCase()));
                    if (exactStock) {
                        setOrderModal({ isOpen: true, stock: exactStock, action: "BUY" });
                        setOrderQty(5);
                        sonner_1.toast.info(`Selected ${exactStock.ticker} for Quick Order`);
                    }
                    else if (cleanQuery) {
                        sonner_1.toast.info(`Filtering market universe for "${cleanQuery}"`);
                    }
                }, tabs: [
                    {
                        id: "trade",
                        label: "Trade",
                        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-4 h-4 text-emerald-400" }),
                        menuItems: [
                            {
                                id: "quick-buy",
                                label: "Execute Buy Order",
                                sublabel: "Select equity & allocate cash",
                                icon: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUp, { className: "w-4 h-4 text-emerald-400" }),
                                type: "action",
                                onClick: () => {
                                    if (activeStocks.length > 0) {
                                        setOrderModal({ isOpen: true, stock: activeStocks[0], action: "BUY" });
                                        setOrderQty(5);
                                    }
                                },
                            },
                            {
                                id: "quick-sell",
                                label: "Liquidate Position",
                                sublabel: "Sell owned shares back to pool",
                                icon: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowDown, { className: "w-4 h-4 text-rose-400" }),
                                type: "action",
                                onClick: () => {
                                    const ownedTicker = Object.keys(teamData?.portfolio || {})[0];
                                    const stockToSell = activeStocks.find((s) => s.ticker === ownedTicker) || activeStocks[0];
                                    if (stockToSell) {
                                        setOrderModal({ isOpen: true, stock: stockToSell, action: "SELL" });
                                        setOrderQty(Math.min(teamData?.portfolio[stockToSell.ticker] || 1, 5));
                                    }
                                },
                            },
                        ],
                    },
                    {
                        id: "swap",
                        label: "Swap",
                        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeftRight, { className: "w-4 h-4 text-[#FF5F1F]" }),
                        menuItems: [
                            {
                                id: "propose-swap",
                                label: "Propose Bilateral Swap",
                                sublabel: "Trade directly with other teams",
                                icon: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeftRight, { className: "w-4 h-4 text-[#FF5F1F]" }),
                                type: "action",
                                onClick: () => {
                                    setGiveTicker(Object.keys(teamData?.portfolio || {})[0] || "AAPL");
                                    setReceiveTicker("NVDA");
                                    setShowSwapModal(true);
                                },
                            },
                            {
                                id: "inbound-deals",
                                label: `Incoming Deals (${incomingSwaps.length})`,
                                sublabel: "Review counterparty swap offers",
                                badge: `${incomingSwaps.length}`,
                                type: "action",
                                onClick: () => {
                                    if (incomingSwaps.length > 0) {
                                        setShowSwapModal(true);
                                    }
                                    else {
                                        sonner_1.toast.info("No pending inbound swap proposals right now.");
                                    }
                                },
                            },
                        ],
                    },
                    {
                        id: "intel",
                        label: "Intel",
                        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Newspaper, { className: "w-4 h-4 text-amber-400" }),
                        menuItems: [
                            {
                                id: "round-news",
                                label: `Round ${gameState?.currentRound || 0} Briefing`,
                                sublabel: "Read breaking news & deduction hints",
                                icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Newspaper, { className: "w-4 h-4 text-amber-400" }),
                                type: "action",
                                onClick: () => setShowNewsDrawer(true),
                            },
                        ],
                    },
                    {
                        id: "journal",
                        label: "Journal",
                        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "w-4 h-4 text-cyan-400" }),
                        menuItems: [
                            {
                                id: "trade-journal",
                                label: "Trade Summary Journal",
                                sublabel: "Sparklines, strategies & PnL",
                                badge: "VIEW",
                                type: "action",
                                onClick: () => setShowJournalModal(true),
                            },
                            {
                                id: "audit-stream",
                                label: "Expandable Transaction List",
                                sublabel: "Detailed receipt ledger",
                                badge: "AUDIT",
                                type: "action",
                                onClick: () => setShowAuditModal(true),
                            },
                        ],
                    },
                ] })] }));
}

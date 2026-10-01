"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StageProjectorView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const CompanyLogo_1 = require("@/src/components/ui/CompanyLogo");
const PriceTickerMarquee_1 = require("@/src/components/ui/PriceTickerMarquee");
const eye_tracking_1 = require("@/src/components/ui/eye-tracking");
const flipping_word_swap_1 = require("@/src/components/ui/flipping-word-swap");
const sounds_1 = require("@/src/lib/sounds");
const utils_1 = require("@/src/lib/utils");
const CYCLING_PHRASES = [
    { w1: "MARKET ENGINE INITIALIZING", w2: "AWAITING HOST SIGNAL" },
    { w1: "INTEL FLASH ENCRYPTED", w2: "DECODE THE DEVELOPMENTS" },
    { w1: "ZERO HOUR IMMINENT", w2: "STAND BY TRADERS" },
    { w1: "BULLS & BEARS PROTOCOL", w2: "OUTSMART THE MARKET" },
];
function StageProjectorView() {
    const [gameState, setGameState] = (0, react_1.useState)(null);
    const [activeStocks, setActiveStocks] = (0, react_1.useState)([]);
    const [leaderboard, setLeaderboard] = (0, react_1.useState)([]);
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    const [timeRemaining, setTimeRemaining] = (0, react_1.useState)("10:00");
    const [soundEnabled, setSoundEnabled] = (0, react_1.useState)(true);
    const [activeNewsIdx, setActiveNewsIdx] = (0, react_1.useState)(0);
    const [phraseIdx, setPhraseIdx] = (0, react_1.useState)(0);
    const prevStatusRef = (0, react_1.useRef)("");
    const fetchState = (0, react_1.useCallback)(async () => {
        try {
            const res = await fetch("/api/state");
            if (!res.ok)
                return;
            const data = await res.json();
            setGameState(data.gameState);
            setActiveStocks(data.activeStocks);
            setLeaderboard(data.leaderboard || []);
            setTransactions(data.transactions || []);
            // Play audio cues on status changes
            if (soundEnabled && prevStatusRef.current && prevStatusRef.current !== data.gameState.status) {
                if (data.gameState.status === "TRADING_OPEN") {
                    sounds_1.sounds.playMarketBell();
                }
                else if (data.gameState.status === "NEWS_RELEASED") {
                    sounds_1.sounds.playNewsAlert();
                }
                else if (data.gameState.status === "TRADING_CLOSED") {
                    sounds_1.sounds.playMarketClose();
                }
            }
            prevStatusRef.current = data.gameState.status;
        }
        catch (e) {
            console.error(e);
        }
    }, [soundEnabled]);
    (0, react_1.useEffect)(() => {
        fetchState();
        const interval = setInterval(fetchState, 1000);
        return () => clearInterval(interval);
    }, [fetchState]);
    // Sync Timer
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
    // Rotate News Headlines every 3 seconds on Stage
    (0, react_1.useEffect)(() => {
        if (!gameState?.roundInfo?.newsStories?.length)
            return;
        setActiveNewsIdx(0);
        const newsInterval = setInterval(() => {
            setActiveNewsIdx((prev) => (prev + 1) % gameState.roundInfo.newsStories.length);
        }, 3000);
        return () => clearInterval(newsInterval);
    }, [gameState?.currentRound, gameState?.roundInfo?.newsStories?.length]);
    // Rotate Empty State Cycling Text every 4 seconds
    (0, react_1.useEffect)(() => {
        const cycleInterval = setInterval(() => {
            setPhraseIdx((prev) => (prev + 1) % CYCLING_PHRASES.length);
        }, 4000);
        return () => clearInterval(cycleInterval);
    }, []);
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        }
        else {
            document.exitFullscreen();
        }
    };
    const isResetState = !gameState || (gameState.currentRound === 0 && gameState.status === "SETUP");
    const currentNews = gameState?.roundInfo?.newsStories?.[activeNewsIdx];
    // --------------------------------------------------------------------------
    // A. RESET / STANDBY EMPTY STATE WITH EYE-TRACKING & FLIPPING WORD SWAP
    // --------------------------------------------------------------------------
    if (isResetState) {
        const currentPhrase = CYCLING_PHRASES[phraseIdx];
        const readyTeams = leaderboard.filter((t) => t.isReady);
        const readyCount = readyTeams.length;
        const totalSquads = leaderboard.length || 1;
        const readyPct = Math.round((readyCount / totalSquads) * 100);
        return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-[#020202] text-[#fafafa] font-mono p-6 md:p-12 flex flex-col justify-between select-none cyber-grid relative overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#FF5F1F]/10 blur-[140px] rounded-full pointer-events-none" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-10 right-1/4 w-[300px] h-[300px] bg-[#10B981]/5 blur-[120px] rounded-full pointer-events-none" }), (0, jsx_runtime_1.jsxs)("header", { className: "flex items-center justify-between pb-6 border-b border-[#1e1e1e] relative z-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-sm bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_20px_rgba(255,95,31,0.2)]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-6 h-6" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h1", { className: "text-xl sm:text-2xl font-display font-extrabold text-white tracking-wider", children: ["BULLS ", (0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F]", children: "&" }), " BEARS"] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] sm:text-xs text-[#a1a1aa] uppercase tracking-widest", children: "Ramaiah University \u2022 BSc Data Science \u2022 SLH 15" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-3.5 py-1.5 rounded bg-[#09090b] border border-[#27272a] text-xs font-bold text-amber-400 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-2 h-2 rounded-full bg-amber-400 animate-pulse" }), (0, jsx_runtime_1.jsx)("span", { children: "STANDBY // AWAITING HOST SIGNAL" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: toggleFullscreen, className: "p-2.5 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-[#a1a1aa] hover:text-white rounded-sm transition-colors", title: "Toggle Fullscreen", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Maximize2, { className: "w-4 h-4" }) })] })] }), (0, jsx_runtime_1.jsxs)("main", { className: "flex-1 flex flex-col items-center justify-center text-center my-6 relative z-10 max-w-4xl mx-auto w-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-6 flex flex-col items-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-[#FF5F1F] font-bold mb-3 px-3 py-1 rounded bg-[#FF5F1F]/10 border border-[#FF5F1F]/30", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 bg-[#FF5F1F] animate-ping" }), "SIMULATION ENGINE // LIVE AUDITORIUM STANDBY"] }), (0, jsx_runtime_1.jsx)("div", { className: "h-14 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(flipping_word_swap_1.FlippingWordSwap, { word1: currentPhrase.w1, word2: currentPhrase.w2, duration: 450, stagger: 35, className: "text-2xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight", toClassName: "text-[#FF5F1F]" }, phraseIdx) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs sm:text-sm text-[#71717a] max-w-lg mt-2", children: "Round 1 classified intelligence and initial stock floats will unlock when the host releases the news flash." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-8 sm:p-10 bg-[#09090b]/80 border border-[#27272a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative group hover:border-[#FF5F1F]/50 transition-colors duration-500 mb-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-3 left-3 text-[9px] text-[#52525b] uppercase tracking-widest font-mono", children: "[ OPTICAL RADAR // TRACKING ACTIVE ]" }), (0, jsx_runtime_1.jsx)(eye_tracking_1.EyeTracking, { eyeSize: 125, gap: 32, irisColor: readyCount === leaderboard.length && leaderboard.length > 0 ? "#10B981" : "#FF5F1F", irisColorSecondary: readyCount === leaderboard.length && leaderboard.length > 0 ? "#34D399" : "#FF8C38", pupilColor: "#050505", scleraColor: "#121216", variant: "cyber", pupilRange: 0.75, idleAnimation: true, blinkInterval: 3800 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "w-full bg-[#09090b]/90 border border-[#1e1e1e] rounded-xl p-4 sm:p-5 text-left mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#18181b]", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase font-bold tracking-wider", children: "Squad Terminal Readiness Matrix" }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-[#a1a1aa] mt-0.5", children: "Teams must confirm readiness on their individual /trade terminals." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-sm font-extrabold text-white", children: [(0, jsx_runtime_1.jsx)("strong", { className: readyCount > 0 ? "text-[#10B981]" : "text-amber-400", children: readyCount }), " / ", leaderboard.length, " Squads Ready"] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs px-2 py-0.5 rounded bg-[#18181b] text-[#a1a1aa] border border-[#27272a] font-bold", children: [readyPct, "%"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full h-2 bg-[#18181b] rounded-full overflow-hidden my-3", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-gradient-to-r from-[#FF5F1F] to-[#10B981] transition-all duration-700 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]", style: { width: `${readyPct}%` } }) }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1", children: leaderboard.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "col-span-full text-center text-xs text-[#71717a] py-2", children: "Awaiting team logins..." })) : (leaderboard.map((team) => ((0, jsx_runtime_1.jsxs)("div", { className: `p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${team.isReady
                                            ? "bg-emerald-950/40 border-[#10B981]/60 text-white shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                                            : "bg-[#121216] border-[#27272a] text-[#71717a]"}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 truncate", children: [(0, jsx_runtime_1.jsx)("span", { className: `w-2 h-2 rounded-full shrink-0 ${team.isReady
                                                            ? "bg-[#10B981] shadow-[0_0_8px_#10B981]"
                                                            : "bg-amber-400/70 animate-pulse"}` }), (0, jsx_runtime_1.jsx)("span", { className: "font-semibold truncate", children: team.teamName })] }), (0, jsx_runtime_1.jsx)("span", { className: `text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${team.isReady
                                                    ? "bg-[#10B981]/20 text-[#10B981]"
                                                    : "bg-[#18181b] text-[#71717a]"}`, children: team.isReady ? "Ready" : "Standby" })] }, team.id)))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 w-full font-mono text-left", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-3.5 bg-[#09090b] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Arena Roster" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-base font-bold text-white mt-0.5", children: [leaderboard.length, " Squads"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3.5 bg-[#09090b] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Starting Capital" }), (0, jsx_runtime_1.jsx)("div", { className: "text-base font-bold text-[#10B981] mt-0.5", children: "$100,000 / Team" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3.5 bg-[#09090b] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Round Time Limit" }), (0, jsx_runtime_1.jsx)("div", { className: "text-base font-bold text-amber-400 mt-0.5", children: "10:00 Clocks" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3.5 bg-[#09090b] border border-[#1e1e1e] rounded-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase", children: "Float Scarcity" }), (0, jsx_runtime_1.jsx)("div", { className: "text-base font-bold text-[#FF5F1F] mt-0.5", children: "100 Shares / Stock" })] })] })] }), (0, jsx_runtime_1.jsxs)("footer", { className: "pt-4 border-t border-[#18181b] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#52525b] uppercase tracking-wider relative z-10", children: [(0, jsx_runtime_1.jsx)("span", { children: "Host Portal: Step 1 \"Release News Flash\" initiates Round 1" }), (0, jsx_runtime_1.jsx)("span", { children: "SLH 15 Auditorium \u2022 Ramaiah University of Applied Sciences" })] })] }));
    }
    // --------------------------------------------------------------------------
    // B. ACTIVE STAGE BOARD (ROUND 1-5 ACTIVE TRADING & NEWS BROADCAST)
    // --------------------------------------------------------------------------
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-[#020202] text-[#fafafa] font-mono p-4 md:p-6 flex flex-col justify-between select-none cyber-grid", children: [(0, jsx_runtime_1.jsxs)("header", { className: "flex items-center justify-between pb-4 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-sm bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "w-6 h-6" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h1", { className: "text-xl sm:text-2xl font-display font-extrabold text-white tracking-wider", children: ["BULLS ", (0, jsx_runtime_1.jsx)("span", { className: "text-[#FF5F1F]", children: "&" }), " BEARS"] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] sm:text-xs text-[#a1a1aa] uppercase tracking-widest", children: "Ramaiah University \u2022 BSc Data Science \u2022 SLH 15" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#71717a] uppercase tracking-widest font-bold", children: gameState?.roundInfo?.title || `ROUND ${gameState?.currentRound}` }), (0, jsx_runtime_1.jsx)("div", { className: `text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded inline-block border ${gameState?.status === "TRADING_OPEN"
                                            ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                            : gameState?.status === "NEWS_RELEASED"
                                                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                                : "bg-rose-500/20 text-rose-400 border-rose-500/40"}`, children: gameState?.status.replace("_", " ") })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-[#09090b] border border-[#27272a] px-5 py-2 rounded-sm flex items-center gap-3 shadow-[0_0_30px_rgba(255,95,31,0.15)]", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "w-6 h-6 text-[#FF5F1F] animate-pulse" }), (0, jsx_runtime_1.jsx)("span", { className: "text-3xl sm:text-4xl font-display font-extrabold text-white tracking-widest", children: timeRemaining })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                            setGameState((prev) => ({
                                                ...prev,
                                                stageAuditVisible: prev?.stageAuditVisible !== false ? false : true,
                                            }));
                                        }, className: `p-2.5 bg-[#09090b] border rounded-sm transition-colors ${gameState?.stageAuditVisible !== false
                                            ? "border-[#10B981]/50 text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                            : "border-[#27272a] text-[#71717a] hover:text-white"}`, title: "Toggle Live Audit Tape", children: (0, jsx_runtime_1.jsx)(lucide_react_1.History, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setSoundEnabled(!soundEnabled), className: "p-2.5 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-[#a1a1aa] hover:text-white rounded-sm transition-colors", title: "Toggle Audio Cues", children: soundEnabled ? (0, jsx_runtime_1.jsx)(lucide_react_1.Volume2, { className: "w-4 h-4 text-[#10B981]" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.VolumeX, { className: "w-4 h-4 text-[#71717a]" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: toggleFullscreen, className: "p-2.5 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-[#a1a1aa] hover:text-white rounded-sm transition-colors", title: "Toggle Fullscreen", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Maximize2, { className: "w-4 h-4" }) })] })] })] }), currentNews && ((0, jsx_runtime_1.jsxs)("div", { className: "my-3 p-4 bg-gradient-to-r from-[#111115] via-[#0d0d10] to-[#111115] border-2 border-[#FF5F1F]/40 rounded-lg space-y-2 shadow-[0_0_35px_rgba(255,95,31,0.12)] relative overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#27272a]", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-3", children: (0, jsx_runtime_1.jsxs)("span", { className: "px-2.5 py-0.5 bg-[#FF5F1F] text-black font-extrabold text-[11px] uppercase tracking-widest rounded flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,95,31,0.5)] animate-pulse", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-white animate-ping" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Newspaper, { className: "w-3.5 h-3.5 fill-current" }), "ROUND ", gameState.currentRound, " INTEL #", currentNews.id] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-xs text-[#a1a1aa]", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Story ", activeNewsIdx + 1, " of ", gameState.roundInfo.newsStories.length] }), (0, jsx_runtime_1.jsx)("div", { className: "flex gap-1.5", children: gameState.roundInfo.newsStories.map((_, i) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setActiveNewsIdx(i), className: `h-1.5 rounded-full transition-all ${i === activeNewsIdx ? "w-6 bg-[#FF5F1F]" : "w-2 bg-[#27272a]"}` }, i))) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "py-1", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight leading-snug", children: currentNews.headline }), gameState.currentRound === 0 && currentNews.clueSummary && ((0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-xs text-[#a1a1aa] leading-relaxed", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Consider:" }), " ", currentNews.clueSummary] }))] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 my-2 flex flex-col lg:flex-row gap-4 min-h-0", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 min-w-0 flex flex-col", children: gameState?.leaderboardVisible ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex-1 bg-[#09090b] border border-[#27272a] rounded-sm p-6 flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-widest mb-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Trophy, { className: "w-4 h-4" }), "OFFICIAL EVENT STANDINGS"] }), (0, jsx_runtime_1.jsx)("h2", { className: "text-2xl sm:text-3xl font-display font-extrabold text-white", children: "LIVE HALL LEADERBOARD" })] }), (0, jsx_runtime_1.jsx)("div", { className: `grid gap-3 max-w-6xl mx-auto w-full ${gameState?.stageAuditVisible !== false
                                        ? "grid-cols-1 md:grid-cols-2"
                                        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`, children: leaderboard.slice(0, 8).map((team, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-sm border flex items-center justify-between ${idx === 0
                                            ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
                                            : idx === 1
                                                ? "bg-slate-300/10 border-slate-400/40"
                                                : idx === 2
                                                    ? "bg-amber-700/10 border-amber-700/40"
                                                    : "bg-[#030303] border-[#1e1e1e]"}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)("span", { className: `w-7 h-7 rounded-sm flex items-center justify-center font-bold text-xs ${idx === 0
                                                            ? "bg-amber-400 text-black"
                                                            : idx === 1
                                                                ? "bg-slate-300 text-black"
                                                                : idx === 2
                                                                    ? "bg-amber-700 text-white"
                                                                    : "bg-[#18181b] text-[#a1a1aa]"}`, children: ["#", idx + 1] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "font-bold text-white text-sm truncate max-w-[140px]", children: team.teamName }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#71717a]", children: [(0, utils_1.formatCurrency)(team.cashBalance), " cash"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm sm:text-base font-bold text-[#10B981]", children: (0, utils_1.formatCurrency)(team.totalPortfolioValue) }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-[#a1a1aa]", children: team.pnl >= 0 ? `+${team.pnlPercent.toFixed(1)}%` : `${team.pnlPercent.toFixed(1)}%` })] })] }, team.id))) }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center text-[10px] text-[#71717a] uppercase mt-4", children: ["Total Teams Competing: ", leaderboard.length, " \u2022 Auto-refreshed every second"] })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "flex-1 bg-[#09090b] border border-[#27272a] rounded-sm p-4 flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-3 mb-3 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-xs uppercase font-bold text-[#FF5F1F]", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsxs)("span", { children: ["ACTIVE MARKET WALL // ROUND ", gameState.currentRound] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-[#71717a]", children: [activeStocks.length, " Equities Listed \u2022 100-Share Scarcity Caps"] })] }), (0, jsx_runtime_1.jsx)("div", { className: `grid gap-2.5 overflow-y-auto max-h-[520px] pr-1 ${gameState?.stageAuditVisible !== false
                                        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                                        : "grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6"}`, children: activeStocks.map((stock) => {
                                        const isUp = (stock.roundChangePercent || 0) >= 0;
                                        const floatRatio = (stock.availableSupply || 0) / 100;
                                        return ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[#030303] border border-[#1e1e1e] hover:border-[#27272a] rounded-sm flex flex-col justify-between transition-all", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(CompanyLogo_1.CompanyLogo, { ticker: stock.ticker, size: "sm" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "font-bold text-white text-xs", children: stock.ticker }), (0, jsx_runtime_1.jsx)("div", { className: "text-[9px] text-[#71717a] truncate max-w-[80px]", children: stock.name })] })] }), (0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center text-[10px] font-bold px-1 rounded ${isUp ? "text-[#10B981] bg-[#10B981]/10" : "text-[#F43F5E] bg-[#F43F5E]/10"}`, children: [isUp ? "+" : "", stock.roundChangePercent || 0, "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "my-2 flex items-baseline justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-sm sm:text-base font-bold text-white tracking-tight", children: ["$", stock.currentPrice.toFixed(2)] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a] uppercase truncate max-w-[70px]", children: stock.sector.split(" / ")[0] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between text-[9px] text-[#71717a] mb-0.5", children: [(0, jsx_runtime_1.jsx)("span", { children: "Float Pool" }), (0, jsx_runtime_1.jsxs)("span", { className: stock.availableSupply <= 20
                                                                        ? "text-[#F43F5E] font-bold"
                                                                        : "text-[#d4d4d8]", children: [stock.availableSupply, " / 100"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full bg-[#18181b] h-1.5 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full transition-all duration-500 ${floatRatio < 0.25
                                                                    ? "bg-[#F43F5E]"
                                                                    : floatRatio < 0.6
                                                                        ? "bg-amber-400"
                                                                        : "bg-[#10B981]"}`, style: { width: `${Math.max(0, Math.min(100, floatRatio * 100))}%` } }) })] })] }, stock.ticker));
                                    }) })] })) }), gameState?.stageAuditVisible !== false && ((0, jsx_runtime_1.jsxs)("aside", { className: "w-full lg:w-96 bg-[#09090b] border border-[#27272a] rounded-sm p-4 flex flex-col justify-between shrink-0 max-h-[600px]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-3 mb-2 border-b border-[#1e1e1e]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-xs uppercase font-bold text-[#10B981]", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-2 h-2 rounded-full bg-[#10B981] animate-pulse" }), (0, jsx_runtime_1.jsx)("span", { children: "LIVE TRANSACTION AUDIT" })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[#71717a] uppercase font-mono", children: "Realtime Tape" })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-y-auto space-y-2 pr-1 text-xs", children: transactions.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "p-8 text-center text-xs text-[#71717a]", children: ["No orders executed yet in Round ", gameState.currentRound, "."] })) : (transactions.slice(0, 15).map((tx) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-2.5 bg-[#030303] border border-[#1e1e1e] hover:border-[#27272a] rounded-sm flex items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { className: `text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${tx.type === "BUY"
                                                                ? "bg-[#10B981]/20 text-[#10B981]"
                                                                : tx.type === "SELL"
                                                                    ? "bg-[#F43F5E]/20 text-[#F43F5E]"
                                                                    : tx.type === "DIRECT_SELL"
                                                                        ? "bg-[#FF5F1F]/20 text-[#FF5F1F]"
                                                                        : "bg-[#3b82f6]/20 text-[#3b82f6]"}`, children: tx.type }), (0, jsx_runtime_1.jsx)("span", { className: "font-bold text-white text-xs", children: tx.teamName })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-[#71717a] mt-0.5", children: [tx.quantity, "x ", tx.ticker, " @ $", tx.price.toFixed(2), tx.counterparty && ((0, jsx_runtime_1.jsxs)("span", { className: "text-[#a1a1aa] ml-1", children: ["\u2192 ", tx.counterparty] }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("div", { className: "font-bold text-white text-xs", children: (0, utils_1.formatCurrency)(tx.total) }), (0, jsx_runtime_1.jsx)("div", { className: "text-[9px] text-[#71717a]", children: tx.timestamp })] })] }, tx.id)))) }), (0, jsx_runtime_1.jsx)("div", { className: "pt-2.5 border-t border-[#18181b] text-center text-[10px] text-[#52525b] uppercase", children: "Audited by Central Simulation Ledger" })] }))] }), (0, jsx_runtime_1.jsx)("footer", { className: "pt-2", children: (0, jsx_runtime_1.jsx)(PriceTickerMarquee_1.PriceTickerMarquee, { speed: 35, stocks: activeStocks }) })] }));
}

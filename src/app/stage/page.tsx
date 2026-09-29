"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  Newspaper,
  Trophy,
  Maximize2,
  ArrowUp,
  ArrowDown,
  Activity,
  History,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { CompanyLogo } from "@/src/components/ui/CompanyLogo";
import { PriceTickerMarquee } from "@/src/components/ui/PriceTickerMarquee";
import { EyeTracking } from "@/src/components/ui/eye-tracking";
import { FlippingWordSwap } from "@/src/components/ui/flipping-word-swap";
import { sounds } from "@/src/lib/sounds";
import { formatCurrency, formatNumber } from "@/src/lib/utils";

const CYCLING_PHRASES = [
  { w1: "MARKET ENGINE INITIALIZING", w2: "AWAITING HOST SIGNAL" },
  { w1: "INTEL FLASH ENCRYPTED", w2: "DECODE THE DEVELOPMENTS" },
  { w1: "ZERO HOUR IMMINENT", w2: "STAND BY TRADERS" },
  { w1: "BULLS & BEARS PROTOCOL", w2: "OUTSMART THE MARKET" },
];

export default function StageProjectorView() {
  const [gameState, setGameState] = useState<any>(null);
  const [activeStocks, setActiveStocks] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>("10:00");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeNewsIdx, setActiveNewsIdx] = useState<number>(0);
  const [phraseIdx, setPhraseIdx] = useState<number>(0);

  const prevStatusRef = useRef<string>("");

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) return;
      const data = await res.json();

      setGameState(data.gameState);
      setActiveStocks(data.activeStocks);
      setLeaderboard(data.leaderboard || []);
      setTransactions(data.transactions || []);

      // Play audio cues on status changes
      if (soundEnabled && prevStatusRef.current && prevStatusRef.current !== data.gameState.status) {
        if (data.gameState.status === "TRADING_OPEN") {
          sounds.playMarketBell();
        } else if (data.gameState.status === "NEWS_RELEASED") {
          sounds.playNewsAlert();
        } else if (data.gameState.status === "TRADING_CLOSED") {
          sounds.playMarketClose();
        }
      }
      prevStatusRef.current = data.gameState.status;
    } catch (e) {
      console.error(e);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Sync Timer
  useEffect(() => {
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
  useEffect(() => {
    if (!gameState?.roundInfo?.newsStories?.length) return;
    const newsInterval = setInterval(() => {
      setActiveNewsIdx((prev) => (prev + 1) % gameState.roundInfo.newsStories.length);
    }, 3000);
    return () => clearInterval(newsInterval);
  }, [gameState]);

  // Rotate Empty State Cycling Text every 4 seconds
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % CYCLING_PHRASES.length);
    }, 4000);
    return () => clearInterval(cycleInterval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
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

    return (
      <div className="min-h-screen bg-[#020202] text-[#fafafa] font-mono p-6 md:p-12 flex flex-col justify-between select-none cyber-grid relative overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#FF5F1F]/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] bg-[#10B981]/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Top Header */}
        <header className="flex items-center justify-between pb-6 border-b border-[#1e1e1e] relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_20px_rgba(255,95,31,0.2)]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-wider">
                BULLS <span className="text-[#FF5F1F]">&</span> BEARS
              </h1>
              <div className="text-[10px] sm:text-xs text-[#a1a1aa] uppercase tracking-widest">
                Ramaiah University • BSc Data Science • SLH 15
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded bg-[#09090b] border border-[#27272a] text-xs font-bold text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>STANDBY // AWAITING HOST SIGNAL</span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-[#a1a1aa] hover:text-white rounded-sm transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Center Empty State Stage */}
        <main className="flex-1 flex flex-col items-center justify-center text-center my-6 relative z-10 max-w-4xl mx-auto w-full">
          {/* Animated Flipping Word Swap Cycling Header */}
          <div className="mb-6 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-[#FF5F1F] font-bold mb-3 px-3 py-1 rounded bg-[#FF5F1F]/10 border border-[#FF5F1F]/30">
              <span className="w-1.5 h-1.5 bg-[#FF5F1F] animate-ping" />
              SIMULATION ENGINE // LIVE AUDITORIUM STANDBY
            </div>

            <div className="h-14 flex items-center justify-center">
              <FlippingWordSwap
                key={phraseIdx}
                word1={currentPhrase.w1}
                word2={currentPhrase.w2}
                duration={450}
                stagger={35}
                className="text-2xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight"
                toClassName="text-[#FF5F1F]"
              />
            </div>

            <p className="text-xs sm:text-sm text-[#71717a] max-w-lg mt-2">
              Round 1 classified intelligence and initial stock floats will unlock when the host releases the news flash.
            </p>
          </div>

          {/* Eye Tracking Cyber Visualizer */}
          <div className="p-8 sm:p-10 bg-[#09090b]/80 border border-[#27272a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative group hover:border-[#FF5F1F]/50 transition-colors duration-500 mb-6">
            <div className="absolute top-3 left-3 text-[9px] text-[#52525b] uppercase tracking-widest font-mono">
              [ OPTICAL RADAR // TRACKING ACTIVE ]
            </div>
            <EyeTracking
              eyeSize={125}
              gap={32}
              irisColor={readyCount === leaderboard.length && leaderboard.length > 0 ? "#10B981" : "#FF5F1F"}
              irisColorSecondary={readyCount === leaderboard.length && leaderboard.length > 0 ? "#34D399" : "#FF8C38"}
              pupilColor="#050505"
              scleraColor="#121216"
              variant="cyber"
              pupilRange={0.75}
              idleAnimation={true}
              blinkInterval={3800}
            />
          </div>

          {/* SQUAD READINESS MATRIX HUD */}
          <div className="w-full bg-[#09090b]/90 border border-[#1e1e1e] rounded-xl p-4 sm:p-5 text-left mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#18181b]">
              <div>
                <div className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider">
                  Squad Terminal Readiness Matrix
                </div>
                <div className="text-xs text-[#a1a1aa] mt-0.5">
                  Teams must confirm readiness on their individual /trade terminals.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">
                  <strong className={readyCount > 0 ? "text-[#10B981]" : "text-amber-400"}>{readyCount}</strong> / {leaderboard.length} Squads Ready
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#18181b] text-[#a1a1aa] border border-[#27272a] font-bold">
                  {readyPct}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-[#18181b] rounded-full overflow-hidden my-3">
              <div
                className="h-full bg-gradient-to-r from-[#FF5F1F] to-[#10B981] transition-all duration-700 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                style={{ width: `${readyPct}%` }}
              />
            </div>

            {/* Team Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
              {leaderboard.length === 0 ? (
                <div className="col-span-full text-center text-xs text-[#71717a] py-2">
                  Awaiting team logins...
                </div>
              ) : (
                leaderboard.map((team) => (
                  <div
                    key={team.id}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                      team.isReady
                        ? "bg-emerald-950/40 border-[#10B981]/60 text-white shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                        : "bg-[#121216] border-[#27272a] text-[#71717a]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          team.isReady
                            ? "bg-[#10B981] shadow-[0_0_8px_#10B981]"
                            : "bg-amber-400/70 animate-pulse"
                        }`}
                      />
                      <span className="font-semibold truncate">{team.teamName}</span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                        team.isReady
                          ? "bg-[#10B981]/20 text-[#10B981]"
                          : "bg-[#18181b] text-[#71717a]"
                      }`}
                    >
                      {team.isReady ? "Ready" : "Standby"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Key Event Metrics HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full font-mono text-left">
            <div className="p-3.5 bg-[#09090b] border border-[#1e1e1e] rounded-sm">
              <div className="text-[10px] text-[#71717a] uppercase">Arena Roster</div>
              <div className="text-base font-bold text-white mt-0.5">{leaderboard.length} Squads</div>
            </div>
            <div className="p-3.5 bg-[#09090b] border border-[#1e1e1e] rounded-sm">
              <div className="text-[10px] text-[#71717a] uppercase">Starting Capital</div>
              <div className="text-base font-bold text-[#10B981] mt-0.5">$100,000 / Team</div>
            </div>
            <div className="p-3.5 bg-[#09090b] border border-[#1e1e1e] rounded-sm">
              <div className="text-[10px] text-[#71717a] uppercase">Round Time Limit</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">10:00 Clocks</div>
            </div>
            <div className="p-3.5 bg-[#09090b] border border-[#1e1e1e] rounded-sm">
              <div className="text-[10px] text-[#71717a] uppercase">Float Scarcity</div>
              <div className="text-base font-bold text-[#FF5F1F] mt-0.5">100 Shares / Stock</div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="pt-4 border-t border-[#18181b] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#52525b] uppercase tracking-wider relative z-10">
          <span>Host Portal: Step 1 &quot;Release News Flash&quot; initiates Round 1</span>
          <span>SLH 15 Auditorium • Ramaiah University of Applied Sciences</span>
        </footer>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // B. ACTIVE STAGE BOARD (ROUND 1-5 ACTIVE TRADING & NEWS BROADCAST)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#020202] text-[#fafafa] font-mono p-4 md:p-6 flex flex-col justify-between select-none cyber-grid">
      {/* 1. TOP STAGE HEADER */}
      <header className="flex items-center justify-between pb-4 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-wider">
              BULLS <span className="text-[#FF5F1F]">&</span> BEARS
            </h1>
            <div className="text-[10px] sm:text-xs text-[#a1a1aa] uppercase tracking-widest">
              Ramaiah University • BSc Data Science • SLH 15
            </div>
          </div>
        </div>

        {/* Big Synced Clock & Status */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-[10px] text-[#71717a] uppercase tracking-widest font-bold">
              {gameState?.roundInfo?.title || `ROUND ${gameState?.currentRound}`}
            </div>
            <div
              className={`text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded inline-block border ${
                gameState?.status === "TRADING_OPEN"
                  ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : gameState?.status === "NEWS_RELEASED"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-rose-500/20 text-rose-400 border-rose-500/40"
              }`}
            >
              {gameState?.status.replace("_", " ")}
            </div>
          </div>

          <div className="bg-[#09090b] border border-[#27272a] px-5 py-2 rounded-sm flex items-center gap-3 shadow-[0_0_30px_rgba(255,95,31,0.15)]">
            <Clock className="w-6 h-6 text-[#FF5F1F] animate-pulse" />
            <span className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-widest">
              {timeRemaining}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setGameState((prev: any) => ({
                  ...prev,
                  stageAuditVisible: prev?.stageAuditVisible !== false ? false : true,
                }));
              }}
              className={`p-2.5 bg-[#09090b] border rounded-sm transition-colors ${
                gameState?.stageAuditVisible !== false
                  ? "border-[#10B981]/50 text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "border-[#27272a] text-[#71717a] hover:text-white"
              }`}
              title="Toggle Live Audit Tape"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-[#a1a1aa] hover:text-white rounded-sm transition-colors"
              title="Toggle Audio Cues"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#10B981]" /> : <VolumeX className="w-4 h-4 text-[#71717a]" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-[#a1a1aa] hover:text-white rounded-sm transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. CINEMATIC BREAKING NEWS INTEL BROADCAST BANNER */}
      {currentNews && (
        <div className="my-3 p-4 bg-gradient-to-r from-[#111115] via-[#0d0d10] to-[#111115] border-2 border-[#FF5F1F]/40 rounded-lg space-y-2 shadow-[0_0_35px_rgba(255,95,31,0.12)] relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 bg-[#FF5F1F] text-black font-extrabold text-[11px] uppercase tracking-widest rounded flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,95,31,0.5)] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <Newspaper className="w-3.5 h-3.5 fill-current" />
                ROUND {gameState.currentRound} INTEL #{currentNews.id}
              </span>
              <span className="px-2 py-0.5 bg-[#18181b] border border-[#27272a] text-[11px] font-bold text-white uppercase tracking-wider rounded">
                Sector: <span className="text-[#FF5F1F]">{currentNews.sector}</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
              <span>Story {activeNewsIdx + 1} of {gameState.roundInfo.newsStories.length}</span>
              <div className="flex gap-1.5">
                {gameState.roundInfo.newsStories.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveNewsIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeNewsIdx ? "w-6 bg-[#FF5F1F]" : "w-2 bg-[#27272a]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="py-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight leading-snug">
              {currentNews.headline}
            </h2>
            {currentNews.clueSummary && (
              <div className="mt-1 text-xs text-[#a1a1aa] flex items-center gap-2">
                <span className="text-[#FF5F1F] font-bold">ANALYSIS:</span>
                <span>{currentNews.clueSummary}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MAIN STAGE CONTENT: MARKET WALL / LEADERBOARD + TRANSACTION AUDIT STREAM */}
      <div className="flex-1 my-2 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* LEFT / MAIN COLUMN: STOCKS MARKET WALL OR LEADERBOARD */}
        <div className="flex-1 min-w-0 flex flex-col">
          {gameState?.leaderboardVisible ? (
            /* Hall Leaderboard Mode */
            <div className="flex-1 bg-[#09090b] border border-[#27272a] rounded-sm p-6 flex flex-col justify-between">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-widest mb-1">
                  <Trophy className="w-4 h-4" />
                  OFFICIAL EVENT STANDINGS
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                  LIVE HALL LEADERBOARD
                </h2>
              </div>

              <div
                className={`grid gap-3 max-w-6xl mx-auto w-full ${
                  gameState?.stageAuditVisible !== false
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {leaderboard.slice(0, 8).map((team, idx) => (
                  <div
                    key={team.id}
                    className={`p-4 rounded-sm border flex items-center justify-between ${
                      idx === 0
                        ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
                        : idx === 1
                        ? "bg-slate-300/10 border-slate-400/40"
                        : idx === 2
                        ? "bg-amber-700/10 border-amber-700/40"
                        : "bg-[#030303] border-[#1e1e1e]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-sm flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? "bg-amber-400 text-black"
                            : idx === 1
                            ? "bg-slate-300 text-black"
                            : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-[#18181b] text-[#a1a1aa]"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white text-sm truncate max-w-[140px]">{team.teamName}</div>
                        <div className="text-[10px] text-[#71717a]">{formatCurrency(team.cashBalance)} cash</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm sm:text-base font-bold text-[#10B981]">
                        {formatCurrency(team.totalPortfolioValue)}
                      </div>
                      <div className="text-[10px] text-[#a1a1aa]">
                        {team.pnl >= 0 ? `+${team.pnlPercent.toFixed(1)}%` : `${team.pnlPercent.toFixed(1)}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center text-[10px] text-[#71717a] uppercase mt-4">
                Total Teams Competing: {leaderboard.length} • Auto-refreshed every second
              </div>
            </div>
          ) : (
            /* Active Stocks Grid Market Wall */
            <div className="flex-1 bg-[#09090b] border border-[#27272a] rounded-sm p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2 text-xs uppercase font-bold text-[#FF5F1F]">
                  <Activity className="w-4 h-4" />
                  <span>ACTIVE MARKET WALL // ROUND {gameState.currentRound}</span>
                </div>
                <div className="text-xs text-[#71717a]">
                  {activeStocks.length} Equities Listed • 100-Share Scarcity Caps
                </div>
              </div>

              <div
                className={`grid gap-2.5 overflow-y-auto max-h-[520px] pr-1 ${
                  gameState?.stageAuditVisible !== false
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                    : "grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6"
                }`}
              >
                {activeStocks.map((stock) => {
                  const isUp = (stock.roundChangePercent || 0) >= 0;
                  const floatRatio = (stock.availableSupply || 0) / 100;

                  return (
                    <div
                      key={stock.ticker}
                      className="p-3 bg-[#030303] border border-[#1e1e1e] hover:border-[#27272a] rounded-sm flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <CompanyLogo ticker={stock.ticker} size="sm" />
                          <div>
                            <div className="font-bold text-white text-xs">{stock.ticker}</div>
                            <div className="text-[9px] text-[#71717a] truncate max-w-[80px]">{stock.name}</div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-1 rounded ${
                            isUp ? "text-[#10B981] bg-[#10B981]/10" : "text-[#F43F5E] bg-[#F43F5E]/10"
                          }`}
                        >
                          {isUp ? "+" : ""}
                          {stock.roundChangePercent || 0}%
                        </span>
                      </div>

                      <div className="my-2 flex items-baseline justify-between">
                        <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                          ${stock.currentPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#71717a] uppercase truncate max-w-[70px]">
                          {stock.sector.split(" / ")[0]}
                        </span>
                      </div>

                      {/* Remaining Float Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[9px] text-[#71717a] mb-0.5">
                          <span>Float Pool</span>
                          <span
                            className={
                              stock.availableSupply <= 20
                                ? "text-[#F43F5E] font-bold"
                                : "text-[#d4d4d8]"
                            }
                          >
                            {stock.availableSupply} / 100
                          </span>
                        </div>
                        <div className="w-full bg-[#18181b] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              floatRatio < 0.25
                                ? "bg-[#F43F5E]"
                                : floatRatio < 0.6
                                ? "bg-amber-400"
                                : "bg-[#10B981]"
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, floatRatio * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE TRANSACTION AUDIT STREAM (TOGGLEABLE) */}
        {gameState?.stageAuditVisible !== false && (
          <aside className="w-full lg:w-96 bg-[#09090b] border border-[#27272a] rounded-sm p-4 flex flex-col justify-between shrink-0 max-h-[600px]">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1e1e1e]">
              <div className="flex items-center gap-2 text-xs uppercase font-bold text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>LIVE TRANSACTION AUDIT</span>
              </div>
              <span className="text-[10px] text-[#71717a] uppercase font-mono">Realtime Tape</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#71717a]">
                  No orders executed yet in Round {gameState.currentRound}.
                </div>
              ) : (
                transactions.slice(0, 15).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 bg-[#030303] border border-[#1e1e1e] hover:border-[#27272a] rounded-sm flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            tx.type === "BUY"
                              ? "bg-[#10B981]/20 text-[#10B981]"
                              : tx.type === "SELL"
                              ? "bg-[#F43F5E]/20 text-[#F43F5E]"
                              : tx.type === "DIRECT_SELL"
                              ? "bg-[#FF5F1F]/20 text-[#FF5F1F]"
                              : "bg-[#3b82f6]/20 text-[#3b82f6]"
                          }`}
                        >
                          {tx.type}
                        </span>
                        <span className="font-bold text-white text-xs">{tx.teamName}</span>
                      </div>
                      <div className="text-[10px] text-[#71717a] mt-0.5">
                        {tx.quantity}x {tx.ticker} @ ${tx.price.toFixed(2)}
                        {tx.counterparty && (
                          <span className="text-[#a1a1aa] ml-1">→ {tx.counterparty}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-white text-xs">{formatCurrency(tx.total)}</div>
                      <div className="text-[9px] text-[#71717a]">{tx.timestamp}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2.5 border-t border-[#18181b] text-center text-[10px] text-[#52525b] uppercase">
              Audited by Central Simulation Ledger
            </div>
          </aside>
        )}
      </div>

      {/* 4. BOTTOM PRICE TICKER MARQUEE */}
      <footer className="pt-2">
        <PriceTickerMarquee speed={35} stocks={activeStocks} />
      </footer>
    </div>
  );
}

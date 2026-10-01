"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ScoresAnnouncement } from "@/src/lib/final-scores";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Newspaper,
  Lock,
  Unlock,
  Sparkles,
  RotateCcw,
  Trophy,
  DollarSign,
  Activity,
  Users,
  Layers,
  FileText,
  Sliders,
  Tv,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { CompanyLogo } from "@/src/components/ui/CompanyLogo";
import { sounds } from "@/src/lib/sounds";
import { formatCurrency, formatNumber } from "@/src/lib/utils";
import { ROUNDS_DATA } from "@/src/lib/market-data";



interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const SECTIONS: NavSection[] = [
  { id: "phase-engine", label: "Phase & Engine", icon: <Activity className="w-4 h-4" /> },
  { id: "registered-teams", label: "Registered Teams", icon: <Users className="w-4 h-4" /> },
  { id: "market-universe", label: "Market Universe", icon: <Layers className="w-4 h-4" /> },
  { id: "confidential-clues", label: "Confidential Clues", icon: <FileText className="w-4 h-4" /> },
  { id: "special-ops", label: "Special Operations", icon: <Sparkles className="w-4 h-4" /> },
  { id: "audit-trail", label: "Audit Trail", icon: <Sliders className="w-4 h-4" /> },
];

const ROUND_NAMES = [
  "Round 0: Baseline Intro",
  "Round 1: Tech Surge",
  "Round 2: Global Expansion",
  "Round 3: Bear Resistance",
  "Round 4: Commodity Shock",
  "Round 5: Final Settlement",
];

export default function AdminControlCenter() {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const resetDialogRef = useRef<HTMLDialogElement>(null);
  const [commissionDraft, setCommissionDraft] = useState("5");
  const [activeSection, setActiveSection] = useState<string>("phase-engine");
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00");

  // Cash adjust modal
  useEffect(() => {
    if (gameState?.marketSellCommissionPercent !== undefined) setCommissionDraft(String(gameState.marketSellCommissionPercent));
  }, [gameState?.marketSellCommissionPercent]);

  const [adjustModalTeam, setAdjustModalTeam] = useState<any | null>(null);
  const [customCashDelta, setCustomCashDelta] = useState<string>("5000");

  // Smooth Zoom Round Confirmation Modal
  const [roundConfirmModal, setRoundConfirmModal] = useState<{
    targetRound: number;
    actionType: "ADVANCE" | "PREVIOUS" | "JUMP";
  } | null>(null);

  // Stock filter in admin view
  const [stockSearchQuery, setStockSearchQuery] = useState("");

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { headers: { "x-admin-pin": pin } });
      if (!res.ok) return;
      const data = await res.json();
      setGameState(data.gameState);
      setLeaderboard(data.leaderboard || []);
      setTransactions(data.transactions || []);
      setStocks(data.stocks || []);
    } catch (e) {
      console.error(e);
    }
  }, [pin]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Synchronized Countdown Clock
  useEffect(() => {
    if (!gameState?.tradingExpiresAt || gameState.status !== "TRADING_OPEN") {
      setTimeRemaining(gameState?.status === "TRADING_OPEN" ? "10:00" : "00:00");
      return;
    }

    const updateTimer = () => {
      const remainingMs = Math.max(0, gameState.tradingExpiresAt! - Date.now());
      const totalSec = Math.floor(remainingMs / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      setTimeRemaining(`${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`);
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [gameState]);

  // Scrollspy active section observer
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAuthenticated]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleAdminAction = async (action: string, payload: any = {}) => {
    setIsProcessing(true);
    setActionStatus(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, action, payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionStatus(`❌ Error: ${data.error}`);
        sounds.playTradeError();
        setIsProcessing(false);
        return;
      }

      setActionStatus(`✅ ${data.message}`);
      if (action === "OPEN_TRADING" || action === "EXTEND_TIMER") sounds.playMarketBell();
      if (action === "RELEASE_NEWS") sounds.playNewsAlert();
      if (action === "CLOSE_TRADING") sounds.playMarketClose();
      if (action === "FINAL_LIQUIDATION" || action === "ADVANCE_ROUND" || action === "PREVIOUS_ROUND") {
        sounds.playTradeSuccess();
      }

      await fetchState();
      return true;
    } catch (e) {
      setActionStatus("❌ Network error executing admin command.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="responsive-page min-h-screen bg-[#030303] flex items-center justify-center p-4 font-mono cyber-grid">
        <div className="w-full max-w-sm bg-[#09090b] border border-[#27272a] p-6 rounded-xl shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5 text-[#FF5F1F]">
            <div className="w-8 h-8 rounded-lg bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" />
            </div>
            <span className="font-display font-black text-white text-base tracking-wider">ADMIN GOD-MODE</span>
          </div>

          <p className="text-xs text-[#a1a1aa] leading-relaxed">
            Enter the host authorization PIN to access the live simulation orchestration center.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, action: "AUTHENTICATE" }) });
              if (response.ok) {
                setIsAuthenticated(true);
                sounds.playTradeSuccess();
              } else {
                alert("Incorrect host PIN.");
              }
            }}
            className="space-y-4 pt-1"
          >
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#71717a] mb-1.5">Host PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Host PIN"
                className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2.5 text-white outline-none text-xs tracking-widest font-bold"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#FF5F1F] text-black font-bold uppercase rounded-lg hover:bg-white transition-all text-xs shadow-[0_0_15px_rgba(255,95,31,0.3)]"
            >
              Unlock Control Center
            </button>
          </form>

          <div className="pt-2 text-center border-t border-[#18181b]">
            <Link href="/" className="text-[11px] text-[#71717a] hover:text-[#FF5F1F] transition-colors">
              ← Return to Main Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentRound = gameState?.currentRound || 0;
  const announcement = gameState?.scoresAnnouncement as ScoresAnnouncement | null | undefined;
  const nextScore = announcement?.teams[announcement.teams.length - announcement.revealedCount - 1];
  const filteredStocks = stocks.filter(
    (s) =>
      s.ticker.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      s.sector.toLowerCase().includes(stockSearchQuery.toLowerCase())
  );

  return (
    <div className="responsive-page min-h-screen bg-[#030303] text-[#fafafa] font-mono">
      {/* ========================================================================= */}
      {/* TOP STICKY COMMAND BAR                                                    */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-xl border-b border-[#1e1e1e] px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FF5F1F]/15 border border-[#FF5F1F]/50 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)]">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-display font-black text-white tracking-wider">
                ADMIN GOD-MODE CONTROL CENTER
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden sm:inline-block font-bold">
                RAMAIAH EVENT LIVE
              </span>
            </div>
            <div className="text-[10px] text-[#71717a] uppercase hidden sm:block">
              Full Orchestrator • BSc Data Science • SLH 15
            </div>
          </div>
        </div>

        {/* Global Action Links */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/admin/teams"
            className="px-3 py-1.5 bg-[#FF5F1F] hover:bg-white text-black font-extrabold text-xs rounded-md transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,95,31,0.3)]"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Teams &amp; Rosters</span>
          </Link>

          <Link
            href="/admin/flow"
            className="px-3 py-1.5 bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 hover:bg-[#FF5F1F] hover:text-black font-bold text-xs text-[#FF5F1F] rounded-md transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>📊</span>
            <span className="hidden md:inline">Flow Matrix &amp; Shift Breakdown</span>
            <span className="md:hidden">Matrix</span>
          </Link>

          <Link
            href="/stage"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-xs text-white rounded-md transition-all"
            title="Auditorium Wall View"
          >
            <Tv className="w-3.5 h-3.5 text-[#FF5F1F]" />
            <span>Stage</span>
          </Link>

          <Link
            href="/trade"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] border border-[#27272a] hover:border-[#FF5F1F] text-xs text-white rounded-md transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Terminal</span>
          </Link>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-3 py-1.5 border border-red-900/60 text-red-400 hover:bg-red-950/80 text-xs rounded-md font-bold transition-all"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionStatus && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-3 bg-[#09090b] border border-[#27272a] text-xs rounded-xl flex items-center justify-between shadow-lg">
          <span className="font-semibold">{actionStatus}</span>
          <button onClick={() => setActionStatus(null)} className="text-[#71717a] hover:text-white text-xs px-2 py-1 rounded bg-[#18181b]">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTAINER WITH STICKY SCROLLSPY SIDEBAR                              */}
      {/* ========================================================================= */}
      <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row items-start gap-6 relative">
          
          {/* --------------------------------------------------------------------- */}
          {/* STICKY SCROLLSPY SIDEBAR RAIL                                         */}
          {/* --------------------------------------------------------------------- */}
          <aside className="w-full lg:w-64 lg:sticky lg:top-20 shrink-0 space-y-4">
            {/* Quick Status HUD Card */}
            <div className="p-4 bg-[#09090b] border border-[#1e1e1e] rounded-xl space-y-3 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-[#18181b]">
                <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Engine Status</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  LIVE
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#a1a1aa]">Current Round:</span>
                  <strong className="text-white">R{currentRound} / 5</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a1a1aa]">Clock:</span>
                  <strong className={gameState?.status === "TRADING_OPEN" ? "text-[#10B981]" : "text-[#71717a]"}>
                    {timeRemaining}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a1a1aa]">Phase:</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      gameState?.status === "TRADING_OPEN"
                        ? "bg-[#10B981]/20 text-[#10B981]"
                        : gameState?.status === "NEWS_RELEASED"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {gameState?.status || "INITIALIZING"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a1a1aa]">Teams Active:</span>
                  <strong className="text-[#FF5F1F]">{leaderboard.length} Teams</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a1a1aa]">Universe Float:</span>
                  <strong className="text-white">{stocks.length} Equities</strong>
                </div>
              </div>
            </div>

            {/* Scrollspy Navigation Menu */}
            <nav className="p-2 bg-[#09090b] border border-[#1e1e1e] rounded-xl space-y-1 shadow-md">
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#71717a] uppercase tracking-wider">
                Quick Navigation
              </div>

              {SECTIONS.map((sec, idx) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                      isActive
                        ? "bg-[#FF5F1F]/20 text-white border border-[#FF5F1F]/50 shadow-[0_0_12px_rgba(255,95,31,0.2)]"
                        : "text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? "text-[#FF5F1F]" : "text-[#71717a]"}>
                        {sec.icon}
                      </span>
                      <span>
                        <span className="text-[#71717a] mr-1">{idx + 1}.</span>
                        {sec.label}
                      </span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F1F] animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Refresh Live Data Button */}
            <button
              onClick={() => {
                fetchState();
                sounds.playTick();
              }}
              className="w-full py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#d4d4d8] hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Force State Refresh</span>
            </button>
          </aside>

          {/* --------------------------------------------------------------------- */}
          {/* MAIN CONTENT AREA: ORCHESTRATION & GOD-MODE PANELS                   */}
          {/* --------------------------------------------------------------------- */}
          <main className="flex-1 w-full space-y-6">

            {/* =================================================================== */}
            {/* 1. PHASE & ENGINE SECTION                                           */}
            {/* =================================================================== */}
            <section id="phase-engine" className="p-5 sm:p-6 bg-[#09090b] border border-[#27272a] rounded-xl space-y-5 shadow-xl">
              
              {/* Header with Live Phase and Timer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e1e1e]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#FF5F1F] uppercase font-bold tracking-wider">
                      Phase &amp; Engine Controller
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F1F]" />
                    <span className="text-xs text-[#71717a]">Round {currentRound} of 5</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                    {gameState?.roundInfo?.title || `Round ${currentRound}`}
                  </h2>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">
                    {gameState?.roundInfo?.subtitle || "Active market trading simulation window."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Countdown Clock Display */}
                  <div className="px-3 py-1.5 bg-[#030303] border border-[#27272a] rounded-lg flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FF5F1F]" />
                    <span className="text-sm font-bold text-white tracking-widest">{timeRemaining}</span>
                  </div>

                  <span
                    className={`text-xs uppercase font-extrabold px-3 py-1.5 rounded-md border ${
                      gameState?.status === "TRADING_OPEN"
                        ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : gameState?.status === "NEWS_RELEASED"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                    }`}
                  >
                    {gameState?.status?.replace("_", " ") || "UNKNOWN"}
                  </span>
                </div>
              </div>

              {/* ROUND STEPPER & QUICK JUMP RAIL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#71717a]">
                  <span>Round Selector &amp; Quick Jump</span>
                  <span>Active: Round {currentRound}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((rNum) => {
                    const isCurrent = currentRound === rNum;
                    return (
                      <button
                        key={rNum}
                        onClick={() => {
                          if (rNum === currentRound) return;
                          setRoundConfirmModal({
                            targetRound: rNum,
                            actionType: rNum > currentRound ? "ADVANCE" : rNum < currentRound ? "PREVIOUS" : "JUMP",
                          });
                        }}
                        disabled={isProcessing}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isCurrent
                            ? "bg-[#FF5F1F]/20 border-[#FF5F1F] text-white shadow-[0_0_15px_rgba(255,95,31,0.25)]"
                            : "bg-[#030303] border-[#1e1e1e] text-[#71717a] hover:border-[#27272a] hover:text-white"
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase flex items-center justify-between">
                          <span>R{rNum}</span>
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F1F]" />}
                        </div>
                        <div className="text-[10px] font-medium truncate mt-0.5 text-[#d4d4d8]">
                          {rNum === 0 ? "Baseline" : rNum === 2 ? "Expansion" : `Wave ${rNum}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TIMER EXTENSION QUICK HUD */}
              <div className="p-3.5 bg-[#030303] border border-[#1e1e1e] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Live Timer Extension Controls</div>
                    <div className="text-[10px] text-[#71717a]">Add extra trading time live across all client screens</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 5, 10].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleAdminAction("EXTEND_TIMER", { minutes: mins })}
                      disabled={isProcessing}
                      className="px-2.5 py-1.5 bg-[#18181b] hover:bg-amber-500/20 border border-[#27272a] hover:border-amber-500/50 text-amber-300 font-bold text-xs rounded-lg transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{mins}m</span>
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      const customMin = prompt("Enter extra minutes to add to clock:", "3");
                      if (customMin && !isNaN(Number(customMin))) {
                        handleAdminAction("EXTEND_TIMER", { minutes: Number(customMin) });
                      }
                    }}
                    className="px-2.5 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-white text-xs font-bold rounded-lg transition-all"
                  >
                    Custom +
                  </button>
                </div>
              </div>

              {/* SQUAD READINESS GATE (ROUND 0 / SETUP PHASE) */}
              {currentRound === 0 && gameState?.status === "SETUP" && (
                <div className="p-4 bg-[#030303] border border-[#FF5F1F]/40 rounded-xl space-y-3 shadow-lg relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1e1e1e]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F1F] animate-ping" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Squad Readiness Gate // Pre-Flight Check
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdminAction("SET_ALL_TEAMS_READY", { isReady: true })}
                        disabled={isProcessing}
                        className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 rounded text-[10px] font-bold uppercase transition-all"
                      >
                        ✓ Mark All Ready
                      </button>
                      <button
                        onClick={() => handleAdminAction("SET_ALL_TEAMS_READY", { isReady: false })}
                        disabled={isProcessing}
                        className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] hover:border-[#FF5F1F] text-[#a1a1aa] rounded text-[10px] font-bold uppercase transition-all"
                      >
                        Reset to Standby
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <p className="text-xs text-[#a1a1aa] max-w-xl">
                      Squads mark ready on their individual <code className="text-[#FF5F1F]">/trade</code> terminals. Once seated and confirmed, launch the simulation by executing <strong>Step 1: Release News Flash</strong> below.
                    </p>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-white">
                        <strong className="text-[#10B981]">{leaderboard.filter((t) => t.isReady).length}</strong> / {leaderboard.length} Squads Ready
                      </span>
                    </div>
                  </div>

                  {/* Ready badges grid */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {leaderboard.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleAdminAction("TOGGLE_TEAM_READY", { teamId: team.id })}
                        title="Click to toggle readiness"
                        className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1.5 transition-all cursor-pointer ${
                          team.isReady
                            ? "bg-emerald-950/40 border-[#10B981] text-[#10B981] font-bold"
                            : "bg-[#121216] border-[#27272a] text-[#71717a] hover:border-amber-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${team.isReady ? "bg-[#10B981]" : "bg-amber-400"}`} />
                        <span>{team.teamName}</span>
                        <span className="text-[9px] opacity-80">{team.isReady ? "(Ready)" : "(Standby)"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4-Step Orchestration Sequence Grid */}
              <div className="space-y-3">
                <div className="text-[11px] uppercase text-[#71717a] font-bold tracking-wider">
                  Step-by-Step Round Orchestration Sequence:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {/* Step 1: Release News */}
                  <button
                    onClick={() => handleAdminAction("RELEASE_NEWS")}
                    disabled={isProcessing}
                    className="p-3.5 bg-[#030303] border border-[#1e1e1e] hover:border-[#FF5F1F] rounded-xl text-left group transition-all shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#FF5F1F] uppercase tracking-wider">Step 1</span>
                      <Newspaper className="w-4 h-4 text-[#FF5F1F] group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="font-bold text-white text-xs mt-1 group-hover:text-[#FF5F1F] transition-colors">
                      Release News Flash
                    </div>
                    <div className="text-[10px] text-[#71717a] mt-1 line-clamp-2">
                      Broadcasts clues to player terminals and stage screen.
                    </div>
                  </button>

                  {/* Step 2: Open Trading (10 min) */}
                  <button
                    onClick={() => handleAdminAction("OPEN_TRADING", { minutes: 10 })}
                    disabled={isProcessing}
                    className="p-3.5 bg-[#030303] border border-[#1e1e1e] hover:border-[#10B981] rounded-xl text-left group transition-all shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">Step 2</span>
                      <Play className="w-4 h-4 text-[#10B981] group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="font-bold text-white text-xs mt-1 group-hover:text-[#10B981] transition-colors">
                      Open Trading (10m Clock)
                    </div>
                    <div className="text-[10px] text-[#71717a] mt-1 line-clamp-2">
                      Starts synchronized timer and unlocks buy/sell/swap.
                    </div>
                  </button>

                  {/* Step 3: Close Market */}
                  <button
                    onClick={() => handleAdminAction("CLOSE_TRADING")}
                    disabled={isProcessing}
                    className="p-3.5 bg-[#030303] border border-[#1e1e1e] hover:border-[#F43F5E] rounded-xl text-left group transition-all shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#F43F5E] uppercase tracking-wider">Step 3</span>
                      <Pause className="w-4 h-4 text-[#F43F5E] group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="font-bold text-white text-xs mt-1 group-hover:text-[#F43F5E] transition-colors">
                      Close Market (Lock)
                    </div>
                    <div className="text-[10px] text-[#71717a] mt-1 line-clamp-2">
                      Instantly halts all buy/sell/swap orders.
                    </div>
                  </button>

                  {/* Step 4: Apply Price Updates */}
                  <div className="p-3.5 bg-[#030303] border border-[#1e1e1e] hover:border-amber-400 rounded-xl text-left group transition-all shadow-md relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Step 4</span>
                        <Link
                          href="/admin/flow"
                          className="text-[10px] text-amber-400 underline hover:text-white"
                          title="Preview shifts"
                        >
                          Breakdown ↗
                        </Link>
                      </div>
                      <div className="font-bold text-white text-xs mt-1 group-hover:text-amber-400 transition-colors">
                        Apply Master Shifts
                      </div>
                      <div className="text-[10px] text-[#71717a] mt-1 line-clamp-2">
                        Calculates price shifts from master plan.
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdminAction("APPLY_PRICE_UPDATE")}
                      disabled={isProcessing}
                      className="mt-2.5 w-full py-1.5 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500 hover:text-black text-amber-300 font-bold text-[10px] uppercase rounded-md transition-all text-center"
                    >
                      Execute Shifts Now
                    </button>
                  </div>
                </div>

                {/* DUAL ACTION: PREVIOUS ROUND / NEXT ROUND */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (currentRound > 0) {
                        setRoundConfirmModal({
                          targetRound: currentRound - 1,
                          actionType: "PREVIOUS",
                        });
                      }
                    }}
                    disabled={isProcessing || currentRound <= 0}
                    className="py-3 bg-[#18181b] border border-[#27272a] hover:border-[#FF5F1F] text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#FF5F1F]" />
                    <span>← Previous Round (R{Math.max(0, currentRound - 1)})</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentRound < 5) {
                        setRoundConfirmModal({
                          targetRound: currentRound + 1,
                          actionType: "ADVANCE",
                        });
                      }
                    }}
                    disabled={isProcessing || currentRound >= 5}
                    className="py-3 bg-gradient-to-r from-[#18181b] via-[#27272a] to-[#18181b] border border-[#27272a] hover:border-[#FF5F1F] text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,95,31,0.25)] disabled:opacity-30"
                  >
                    <span>Advance to Next Round (R{currentRound + 1}) →</span>
                    <ArrowRight className="w-4 h-4 text-[#FF5F1F]" />
                  </button>
                </div>
              </div>
            </section>

            {/* =================================================================== */}
            {/* 2. REGISTERED TEAMS & PORTFOLIO OVERRIDES                           */}
            {/* =================================================================== */}
            <section aria-label="Final score announcements" className="p-4 sm:p-6 bg-[#09090b] border border-amber-500/40 rounded-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm sm:text-lg font-bold text-amber-400 flex items-center gap-2"><Trophy className="w-5 h-5" /> Announce Final Scores</h2>
                <Link href="/stage" target="_blank" className="text-xs text-[#a1a1aa] underline">Open results on /stage ↗</Link>
              </div>
              {!announcement ? (
                <>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">Available in Round 5. Apply the final price updates first. Starting closes trading, cancels pending offers, and freezes every team’s cash and stock values. Reveal results manually from last place to first.</p>
                  <button type="button" disabled={isProcessing || currentRound !== 5 || !leaderboard.length} onClick={() => handleAdminAction("START_SCORE_ANNOUNCEMENT")} className="w-full sm:w-auto px-4 py-3 rounded-lg bg-amber-400 text-black text-xs font-bold disabled:opacity-40">Start Final Score Announcement</button>
                </>
              ) : (
                <>
                  <p className="text-xs text-[#a1a1aa]">Final scores frozen · {announcement.revealedCount} / {announcement.teams.length} teams announced. Game changes remain locked until the simulation is reset.</p>
                  {nextScore && <p className="text-sm text-white">Next: #{nextScore.rank} · {nextScore.teamName}</p>}
                  <button type="button" disabled={isProcessing || !nextScore} onClick={() => handleAdminAction("REVEAL_NEXT_SCORE")} className="w-full sm:w-auto px-4 py-3 rounded-lg bg-amber-400 text-black text-xs font-bold disabled:opacity-40">{nextScore ? "Reveal Next Team" : "All Teams Announced"}</button>
                </>
              )}
            </section>

            <section id="registered-teams" className="p-5 sm:p-6 bg-[#09090b] border border-[#27272a] rounded-xl space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e1e1e]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#FF5F1F] uppercase font-bold tracking-wider">
                      Registered Teams &amp; Portfolios
                    </span>
                    <span className="text-xs text-[#71717a]">({leaderboard.length} teams participating)</span>
                  </div>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">
                    Live balance audit, portfolio valuation, freeze trading privileges, and manual cash adjustments.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/admin/teams"
                    className="px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#FF5F1F] text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Users className="w-3.5 h-3.5 text-[#FF5F1F]" />
                    <span>Open Team Roster Center ↗</span>
                  </Link>

                  <div className="text-[11px] text-[#10B981] font-semibold hidden sm:flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                    <span>Sync: 1.5s</span>
                  </div>
                </div>
              </div>

              {/* Teams Table / Grid */}
              <div className="space-y-2.5">
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#71717a] border border-dashed border-[#27272a] rounded-xl">
                    No teams registered in the current session.
                  </div>
                ) : (
                  leaderboard.map((team, idx) => (
                    <div
                      key={team.id}
                      className="p-3.5 bg-[#030303] border border-[#1e1e1e] hover:border-[#27272a] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center font-bold text-xs text-[#FF5F1F] shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                            <span>{team.teamName}</span>
                            {team.isReady ? (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                READY
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                STANDBY
                              </span>
                            )}
                            {team.isFrozen ? (
                              <span className="text-[9px] font-bold text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                                FROZEN
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#71717a] mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                            <span>Cash: <strong className="text-white">{formatCurrency(team.cashBalance)}</strong></span>
                            <span>Round peer trades: <strong className="text-[#FF5F1F]">{team.qualifyingPeerTrades || 0}/2</strong></span>
                            <span>Holdings: <strong className="text-[#a1a1aa]">{formatCurrency(team.holdingsValue)}</strong></span>
                            <span>Net Worth: <strong className="text-[#10B981]">{formatCurrency(team.totalPortfolioValue)}</strong></span>
                            <span>PnL: <strong className={team.pnl >= 0 ? "text-[#10B981]" : "text-[#F43F5E]"}>
                              {team.pnl >= 0 ? `+${formatCurrency(team.pnl)}` : `-${formatCurrency(Math.abs(team.pnl))}`}
                            </strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleAdminAction("TOGGLE_TEAM_READY", { teamId: team.id })}
                          className={`p-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            team.isReady
                              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900"
                              : "bg-amber-950/30 border-amber-800 text-amber-300 hover:bg-amber-900/50"
                          }`}
                          title={team.isReady ? "Click to set team to Standby" : "Click to mark team as Ready"}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${team.isReady ? "text-[#10B981]" : "text-amber-400"}`} />
                          <span className="text-[10px]">{team.isReady ? "Ready" : "Mark Ready"}</span>
                        </button>

                        <button
                          onClick={() => handleAdminAction("FREEZE_TEAM", { teamId: team.id, isFrozen: !team.isFrozen })}
                          className={`p-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            team.isFrozen
                              ? "bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900"
                              : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#FF5F1F]"
                          }`}
                          title={team.isFrozen ? "Unfreeze trading privileges" : "Freeze team orders"}
                        >
                          {team.isFrozen ? <Unlock className="w-3.5 h-3.5 text-[#10B981]" /> : <Lock className="w-3.5 h-3.5 text-[#71717a]" />}
                          <span className="text-[10px]">{team.isFrozen ? "Unfreeze" : "Freeze"}</span>
                        </button>

                        <button
                          onClick={() => {
                            setAdjustModalTeam(team);
                            setCustomCashDelta("5000");
                          }}
                          className="px-3 py-2 bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 hover:bg-[#FF5F1F] hover:text-black rounded-lg text-xs font-bold text-[#FF5F1F] transition-all flex items-center gap-1"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Adjust $</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* =================================================================== */}
            {/* 3. LIVE MARKET UNIVERSE & FLOAT STATUS                              */}
            {/* =================================================================== */}
            <section id="market-universe" className="p-5 sm:p-6 bg-[#09090b] border border-[#27272a] rounded-xl space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e1e1e]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#FF5F1F] uppercase font-bold tracking-wider">
                      Live Market Universe &amp; Float
                    </span>
                    <span className="text-xs text-[#71717a]">({filteredStocks.length} equities)</span>
                  </div>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">
                    Real-time prices, supply availability per stock, and round change percentages.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    placeholder="Search universe..."
                    className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Equities Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredStocks.map((stock) => {
                  const isUp = (stock.roundChangePercent || 0) >= 0;
                  return (
                    <div
                      key={stock.ticker}
                      className="p-3 bg-[#030303] border border-[#1e1e1e] hover:border-[#27272a] rounded-xl flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CompanyLogo ticker={stock.ticker} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs flex items-center gap-1">
                            <span>{stock.ticker}</span>
                            {stock.entryRound === 2 && (
                              <span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                R2
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#71717a] truncate max-w-[90px]">
                            {stock.name}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-white">
                          ${stock.currentPrice?.toFixed(2)}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-[10px]">
                          <span className={isUp ? "text-[#10B981] font-bold" : "text-[#F43F5E] font-bold"}>
                            {isUp ? "+" : ""}{stock.roundChangePercent || 0}%
                          </span>
                          <span className="text-[#52525b]">•</span>
                          <span className="text-[#a1a1aa] font-semibold">{stock.availableSupply}/100</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* =================================================================== */}
            {/* 4. CONFIDENTIAL ROUND INTEL & DEDUCTION MATRIX                      */}
            {/* =================================================================== */}
            <section id="confidential-clues" className="p-5 sm:p-6 bg-[#09090b] border border-[#27272a] rounded-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e1e]">
                <div>
                  <span className="text-xs text-[#FF5F1F] uppercase font-bold tracking-wider">
                    Confidential Round News &amp; Deduction Matrix
                  </span>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">
                    Host eyes only: breaking developments and expected price direction clues for Round {currentRound}.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  HOST CHEAT SHEET
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gameState?.roundInfo?.newsStories?.map((story: any) => (
                  <div key={story.id} className="p-4 bg-[#030303] border border-[#1e1e1e] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#FF5F1F]">Development #{story.id}</span>
                      <span className="text-[10px] font-bold text-[#71717a] uppercase px-1.5 py-0.5 rounded bg-[#09090b] border border-[#18181b]">
                        Sector: {story.sector}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white leading-snug">{story.headline}</p>
                    <div className="text-[11px] text-amber-300/90 bg-[#09090b] p-2 rounded-lg border border-[#18181b]">
                      <strong className="text-amber-400">Expected Impact:</strong> {story.clueSummary}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* =================================================================== */}
            {/* 5. SPECIAL OPERATIONS & EMERGENCY CONTROLS                         */}
            {/* =================================================================== */}
            <section id="special-ops" className="p-5 sm:p-6 bg-[#09090b] border border-[#27272a] rounded-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e1e]">
                <div>
                  <span className="text-xs text-[#FF5F1F] uppercase font-bold tracking-wider">
                    Special Event Operations &amp; Overrides
                  </span>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">
                    Trigger market expansions, toggle auditorium stage displays, liquidate all portfolios, or emergency reset.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(gameState?.marketSellLockEnabled)}
                  disabled={isProcessing}
                  onClick={() => handleAdminAction("SET_MARKET_SELL_LOCK", { enabled: !gameState?.marketSellLockEnabled })}
                  className="p-4 bg-[#030303] border border-[#1e1e1e] hover:border-[#FF5F1F] rounded-xl text-left transition-all disabled:opacity-40"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#FF5F1F]">
                    <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Lock Selling to Market</span>
                    <span>{gameState?.marketSellLockEnabled ? "ON" : "OFF"}</span>
                  </div>
                  <p className="text-[10px] text-[#a1a1aa] mt-2 leading-relaxed">
                    {gameState?.marketSellLockEnabled
                      ? "Each team must complete 2 accepted swaps per round before selling to the market."
                      : "Teams can sell to the market at any time during open trading."}
                  </p>
                </button>
                <div className="p-4 bg-[#030303] border border-[#1e1e1e] rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-[#FF5F1F]"><DollarSign className="w-4 h-4" /> Market-Sale Commission</span>
                    <button type="button" role="switch" aria-checked={Boolean(gameState?.marketSellCommissionEnabled)} disabled={isProcessing}
                      onClick={() => handleAdminAction("SET_MARKET_SELL_COMMISSION", { enabled: !gameState?.marketSellCommissionEnabled, percent: gameState?.marketSellCommissionPercent ?? 5 })}
                      className="px-2 py-1 rounded border border-[#27272a] text-[11px] text-white disabled:opacity-40">
                      {gameState?.marketSellCommissionEnabled ? "ON" : "OFF"}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#a1a1aa] leading-relaxed">Deducted from gross market-sale proceeds. Share swaps are exempt. Current rate: {gameState?.marketSellCommissionPercent ?? 5}%.</p>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label htmlFor="market-sale-commission" className="block text-[10px] text-[#71717a] mb-1">Commission percentage (0–100)</label>
                      <input id="market-sale-commission" type="number" min="0" max="100" step="any" value={commissionDraft} onChange={(event) => setCommissionDraft(event.target.value)} className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-2 py-1.5 text-white text-xs" />
                    </div>
                    <button type="button" disabled={isProcessing || commissionDraft.trim() === "" || !Number.isFinite(Number(commissionDraft)) || Number(commissionDraft) < 0 || Number(commissionDraft) > 100}
                      onClick={() => handleAdminAction("SET_MARKET_SELL_COMMISSION", { enabled: Boolean(gameState?.marketSellCommissionEnabled), percent: Number(commissionDraft) })}
                      className="px-3 py-2 rounded-lg bg-[#FF5F1F] text-black text-xs font-bold disabled:opacity-40">Save Rate</button>
                  </div>
                </div>
                <button
                  onClick={() => handleAdminAction("TRIGGER_EXPANSION")}
                  className="p-4 bg-[#030303] border border-[#1e1e1e] hover:border-amber-500 rounded-xl text-left transition-all group shadow-md"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Release 10 Expansion Stocks</span>
                  </div>
                  <div className="text-[10px] text-[#71717a] mt-1.5 leading-relaxed">
                    Unlocks TSMC, Broadcom, Oracle, Netflix, LMT, and defense equities.
                  </div>
                </button>

                {/* Toggle Stage Leaderboard */}
                <button
                  onClick={() => handleAdminAction("TOGGLE_LEADERBOARD")}
                  className="p-4 bg-[#030303] border border-[#1e1e1e] hover:border-[#3b82f6] rounded-xl text-left transition-all group shadow-md"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#3b82f6]">
                    <Trophy className="w-4 h-4" />
                    <span>Toggle Stage Leaderboard</span>
                  </div>
                  <div className="text-[10px] text-[#71717a] mt-1.5">
                    Status: <strong className="text-white">{gameState?.leaderboardVisible ? "VISIBLE ON STAGE" : "HIDDEN (MARKET WALL)"}</strong>
                  </div>
                </button>

                {/* Toggle Stage Live Transaction Audit Stream */}
                <button
                  onClick={() => handleAdminAction("TOGGLE_STAGE_AUDIT")}
                  className="p-4 bg-[#030303] border border-[#1e1e1e] hover:border-[#10B981] rounded-xl text-left transition-all group shadow-md"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#10B981]">
                    <Activity className="w-4 h-4" />
                    <span>Toggle Stage Audit Stream</span>
                  </div>
                  <div className="text-[10px] text-[#71717a] mt-1.5">
                    Live Audit Tape: <strong className={gameState?.stageAuditVisible !== false ? "text-[#10B981]" : "text-[#71717a]"}>
                      {gameState?.stageAuditVisible !== false ? "STREAMING ON STAGE" : "HIDDEN FROM STAGE"}
                    </strong>
                  </div>
                </button>

                {/* Final Liquidation */}
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to trigger FINAL LIQUIDATION? All player stocks will be liquidated to cash at closing prices!")) {
                      handleAdminAction("FINAL_LIQUIDATION");
                    }
                  }}
                  className="p-4 bg-[#030303] border border-amber-900/40 hover:border-amber-500 rounded-xl text-left transition-all group shadow-md"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <DollarSign className="w-4 h-4" />
                    <span>Execute Final Liquidation</span>
                  </div>
                  <div className="text-[10px] text-[#71717a] mt-1.5 leading-relaxed">
                    Auto-sells all holdings at closing prices &amp; calculates winner.
                  </div>
                </button>

                {/* Emergency Reset */}
                <button
                  onClick={() => {
                    setActionStatus(null);
                    resetDialogRef.current?.showModal();
                  }}
                  disabled={isProcessing}
                  className="p-4 bg-[#030303] border border-red-900/40 hover:border-red-500 rounded-xl text-left transition-all group shadow-md"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Simulation</span>
                  </div>
                  <div className="text-[10px] text-[#71717a] mt-1.5 leading-relaxed">
                    Re-initializes all $100k balances and baseline 100-share float.
                  </div>
                </button>
              </div>
            </section>

            {/* =================================================================== */}
            {/* 6. TRANSACTION AUDIT STREAM                                         */}
            {/* =================================================================== */}
            <section id="audit-trail" className="p-5 sm:p-6 bg-[#09090b] border border-[#27272a] rounded-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e1e]">
                <div>
                  <span className="text-xs text-[#FF5F1F] uppercase font-bold tracking-wider">
                    Transaction Audit Stream
                  </span>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">
                    Real-time stream of all executed BUY, SELL, and P2P SWAP contracts.
                  </p>
                </div>
                <span className="text-[10px] text-[#71717a] font-bold">
                  {transactions.length} total entries recorded
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#71717a]">
                    No transactions executed yet in this simulation session.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-[#030303] border border-[#18181b] hover:border-[#27272a] rounded-xl text-xs flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            tx.type === "BUY"
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                              : tx.type === "SELL"
                              ? "bg-rose-950/80 text-rose-400 border border-rose-800"
                              : "bg-purple-950/80 text-purple-400 border border-purple-800"
                          }`}
                        >
                          {tx.type}
                        </span>
                        <div>
                          <strong className="text-white">{tx.teamName}</strong>{" "}
                          <span className="text-[#a1a1aa]">
                            {tx.quantity ? `${tx.quantity} shares of ` : ""}
                            <strong className="text-[#FF5F1F]">{tx.ticker}</strong>
                          </span>
                          {tx.total !== undefined && (
                            <span className="text-[#71717a] ml-2">
                              • {formatCurrency(tx.total)}
                            </span>
                          )}
                          {tx.commissionAmount !== undefined && <span className="text-rose-400 ml-2">Fee: {formatCurrency(tx.commissionAmount)} ({tx.commissionPercent}%)</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#71717a] shrink-0">{tx.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CASH ADJUSTMENT MODAL                                                     */}
      {/* ========================================================================= */}
      <dialog
        ref={resetDialogRef}
        aria-labelledby="reset-simulation-title"
        aria-describedby="reset-simulation-description"
        onCancel={(event) => { if (isProcessing) event.preventDefault(); }}
        className="modal-panel m-auto w-[calc(100%_-_2rem)] max-w-md bg-[#09090b] border border-[#27272a] p-6 rounded-2xl shadow-2xl text-white backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <h2 id="reset-simulation-title" className="text-lg font-bold flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-[#FF5F1F]" /> Reset Simulation
        </h2>
        <p id="reset-simulation-description" className="mt-3 text-sm text-[#a1a1aa] leading-relaxed">
          Start again at Round 0. All previous transactions, swaps, and direct sale offers will be cleared.
        </p>
        <p className="mt-3 text-xs text-[#a1a1aa] leading-relaxed">
          Keep teams to retain their names, PINs, rosters, and table assignments. Each team starts with $100,000, no holdings, and fresh readiness and trading access.
        </p>
        {actionStatus && <p role="alert" className="mt-3 text-xs text-red-400">{actionStatus}</p>}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={async () => {
              if (await handleAdminAction("RESET_GAME", { keepTeams: true })) resetDialogRef.current?.close();
            }}
            className="py-2.5 bg-[#FF5F1F] text-black hover:bg-white rounded-xl text-xs font-bold disabled:opacity-40"
          >
            Reset &amp; Keep Teams
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={async () => {
              if (await handleAdminAction("RESET_GAME", { keepTeams: false })) resetDialogRef.current?.close();
            }}
            className="py-2.5 bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-950 rounded-xl text-xs font-bold disabled:opacity-40"
          >
            Reset &amp; Remove All Teams
          </button>
          <button
            type="button"
            autoFocus
            disabled={isProcessing}
            onClick={() => resetDialogRef.current?.close()}
            className="py-2.5 text-[#a1a1aa] hover:text-white rounded-xl text-xs font-bold disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </dialog>

      {adjustModalTeam && (
        <div className="modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md bg-[#09090b] border border-[#27272a] p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e1e1e]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#FF5F1F]" />
                <h3 className="font-bold text-white text-base">
                  Adjust Cash for {adjustModalTeam.teamName}
                </h3>
              </div>
              <button
                onClick={() => setAdjustModalTeam(null)}
                className="text-[#71717a] hover:text-white text-xs px-2 py-1 rounded bg-[#18181b]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#a1a1aa]">
                <span>Current Cash Balance:</span>
                <strong className="text-white text-sm">{formatCurrency(adjustModalTeam.cashBalance)}</strong>
              </div>
              <div className="flex items-center justify-between text-[#a1a1aa]">
                <span>Total Portfolio Net Worth:</span>
                <strong className="text-[#10B981]">{formatCurrency(adjustModalTeam.totalPortfolioValue)}</strong>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-[10px] font-bold text-[#71717a] uppercase mb-1.5">
                Quick Preset Deltas:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["+5000", "+10000", "-5000", "-10000"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomCashDelta(preset.replace("+", ""))}
                    className="py-1.5 bg-[#030303] border border-[#27272a] hover:border-[#FF5F1F] rounded-lg text-xs font-bold text-white transition-all text-center"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <label className="block text-[10px] font-bold text-[#71717a] uppercase mb-1.5">
                Custom Delta Amount ($ positive to grant, negative to deduct):
              </label>
              <input
                type="number"
                value={customCashDelta}
                onChange={(e) => setCustomCashDelta(e.target.value)}
                className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3.5 py-2 text-white font-bold text-sm outline-none"
              />
            </div>

            {/* Modal Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModalTeam(null)}
                className="py-2.5 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const delta = Number(customCashDelta);
                  if (!isNaN(delta)) {
                    handleAdminAction("ADJUST_BALANCE", {
                      teamId: adjustModalTeam.id,
                      cashDelta: delta,
                    });
                    setAdjustModalTeam(null);
                  }
                }}
                className="py-2.5 bg-[#FF5F1F] text-black hover:bg-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)]"
              >
                Apply Cash Delta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SMOOTH ZOOM ANIMATED ROUND CONFIRMATION MODAL                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {roundConfirmModal && (() => {
          const target = roundConfirmModal.targetRound;
          const targetData = ROUNDS_DATA.find((r) => r.round === target) || ROUNDS_DATA[0];
          const customScenario = gameState?.customScenarios?.[target];
          const title = customScenario?.title || targetData.title;
          const subtitle = customScenario?.subtitle || targetData.subtitle;
          const news = customScenario?.newsStories || targetData.newsStories || [];
          const isAdvancing = roundConfirmModal.actionType === "ADVANCE" || target > currentRound;
          const isReverting = roundConfirmModal.actionType === "PREVIOUS" || target < currentRound;
          const isExpansion = target === 2;

          return (
            <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="modal-panel w-full max-w-lg bg-[#09090b] border border-[#27272a] p-6 rounded-2xl shadow-2xl space-y-4 relative overflow-hidden font-mono"
              >
                {/* Ambient Top Glow */}
                <div
                  className={`absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                    isReverting ? "bg-amber-500/15" : "bg-[#FF5F1F]/20"
                  }`}
                />

                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#1e1e1e]">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        isReverting
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                          : "bg-[#FF5F1F]/15 border-[#FF5F1F]/40 text-[#FF5F1F]"
                      }`}
                    >
                      {isReverting ? <ArrowLeft className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">
                        Phase Orchestrator
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {isAdvancing
                          ? `Advance to Round ${target}`
                          : isReverting
                          ? `Revert to Round ${target}`
                          : `Jump to Round ${target}`}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setRoundConfirmModal(null)}
                    className="text-[#71717a] hover:text-white text-xs px-2.5 py-1 rounded-lg bg-[#18181b] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Flow indicator pills */}
                <div className="flex items-center justify-between p-3 bg-[#030303] border border-[#1e1e1e] rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#71717a]">Current:</span>
                    <span className="px-2 py-0.5 rounded bg-[#18181b] text-white font-bold text-xs">
                      Round {currentRound}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#FF5F1F]" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#71717a]">Next Phase:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded font-bold text-xs border ${
                        isReverting
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-[#FF5F1F]/20 text-white border-[#FF5F1F]/50 shadow-[0_0_10px_rgba(255,95,31,0.3)]"
                      }`}
                    >
                      Round {target}
                    </span>
                  </div>
                </div>

                {/* Target Round Info Card */}
                <div className="p-3.5 bg-[#030303] border border-[#27272a] rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-[#FF5F1F]" />
                    <span className="text-xs font-bold text-white">{title}</span>
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] leading-relaxed">{subtitle}</p>

                  {/* News preview */}
                  {news.length > 0 && (
                    <div className="pt-2 border-t border-[#18181b] space-y-1.5">
                      <span className="text-[10px] font-bold text-[#71717a] uppercase">Upcoming Breaking Intel Preview:</span>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {news.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="text-[11px] text-[#d4d4d8] bg-[#09090b] p-1.5 rounded border border-[#1e1e1e] flex items-start gap-1.5">
                            <span className="text-[#FF5F1F] font-bold">•</span>
                            <span className="line-clamp-1">{item.headline || item.title || item.story}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Market Expansion Callout if advancing to Round 2 */}
                {isExpansion && (
                  <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="text-[11px]">
                      <strong className="text-white block font-bold">Market Float Expansion Event</strong>
                      <span className="text-amber-200/80">10 new expansion equities will be unlocked and tradable for all teams.</span>
                    </div>
                  </div>
                )}

                {/* Automated Synchronizations Checklist */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="text-[10px] font-bold text-[#71717a] uppercase">Automatic Synchronizations:</div>
                  <div className="flex items-center gap-2 text-[#d4d4d8]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span>Calculates &amp; updates stock prices to Round {target} baseline/custom shifts</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#d4d4d8]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span>Broadcasts live news intelligence to all trader terminals (<code className="text-[#FF5F1F]">/trade</code>) and stage projector (<code className="text-[#FF5F1F]">/stage</code>)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#d4d4d8]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span>Sets status to <strong className="text-amber-400">SETUP</strong> and resets timer ready for host signal</span>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRoundConfirmModal(null)}
                    className="py-2.5 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel / Stay in R{currentRound}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleAdminAction("SET_ROUND", { round: target });
                      setRoundConfirmModal(null);
                    }}
                    className={`py-2.5 font-bold rounded-xl text-xs uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isReverting
                        ? "bg-amber-500 text-black hover:bg-white shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        : "bg-[#FF5F1F] text-black hover:bg-white shadow-[0_0_15px_rgba(255,95,31,0.3)]"
                    }`}
                  >
                    <span>Confirm &amp; Go to R{target}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

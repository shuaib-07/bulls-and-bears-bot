"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Newspaper,
  Sparkles,
  Zap,
  Info,
  Layers,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  BarChart3,
  DollarSign,
  ShieldAlert,
  Printer,
  Edit3,
  Save,
  RotateCcw,
  Sliders,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { CompanyLogo } from "@/src/components/ui/CompanyLogo";
import { STOCKS_DATA, ROUNDS_DATA } from "@/src/lib/market-data";
import { formatCurrency, formatNumber } from "@/src/lib/utils";

export default function AdminFlowSpecification() {
  const [selectedRound, setSelectedRound] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"round" | "matrix" | "editor">("round");

  // Custom Scenario Editor State for selected round
  const [adminPin, setAdminPin] = useState("9988");
  const [customTitle, setCustomTitle] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [customNews, setCustomNews] = useState<Array<{ id: number; headline: string; sector: string; clueSummary: string }>>([]);
  const [customShifts, setCustomShifts] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const sectors = ["ALL", ...Array.from(new Set(STOCKS_DATA.map((s) => s.sector)))];

  const roundInfo = ROUNDS_DATA.find((r) => r.round === selectedRound) || ROUNDS_DATA[0];

  // Initialize editor whenever selected round changes
  useEffect(() => {
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
        toast.success(`Custom Scenario & Price Shifts saved for Round ${selectedRound}!`);
      } else {
        toast.error("Failed to save custom scenario. Verify Admin PIN.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error saving scenario.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleResetScenario = async () => {
    if (!confirm(`Reset Round ${selectedRound} to tournament master defaults?`)) return;
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
        toast.info(`Round ${selectedRound} reset to default master plan.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to compute round starting and ending prices
  const getRoundPriceDetails = (stock: (typeof STOCKS_DATA)[0], roundNum: number) => {
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
    } else if (roundNum === 1) {
      startPrice = stock.prices.r0;
      endPrice = stock.prices.r1;
    } else if (roundNum === 2) {
      startPrice = stock.entryRound === 2 ? stock.prices.start : stock.prices.r1;
      endPrice = stock.prices.r2;
    } else if (roundNum === 3) {
      startPrice = stock.prices.r2;
      endPrice = stock.prices.r3;
    } else if (roundNum === 4) {
      startPrice = stock.prices.r3;
      endPrice = stock.prices.r4;
    } else if (roundNum === 5) {
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
  const filteredStocks = STOCKS_DATA.filter((s) => {
    const matchesSearch =
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === "ALL" || s.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  // Calculate Round Stats
  const roundChangesList = Object.entries(roundInfo.marketChanges).map(([ticker, pct]) => {
    const stock = STOCKS_DATA.find((s) => s.ticker === ticker);
    const currentShift = customShifts[ticker] !== undefined ? customShifts[ticker] : pct;
    return { ticker, pct: currentShift, stock };
  });

  const biggestGainer = [...roundChangesList].sort((a, b) => b.pct - a.pct)[0];
  const biggestLoser = [...roundChangesList].sort((a, b) => a.pct - b.pct)[0];

  return (
    <div className="min-h-screen bg-[#030303] text-[#fafafa] font-mono p-4 sm:p-6 lg:p-10 select-none cyber-grid print:bg-white print:text-black print:p-0">
      <div className="max-w-7xl mx-auto space-y-8 print:space-y-4">
        {/* 1. TOP HEADER & NAVIGATION (Hidden in Print) */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#1e1e1e] print:hidden">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/admin"
                className="p-2 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-[#a1a1aa] hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Admin God-Mode</span>
              </Link>
              <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                HOST CONFIDENTIAL SPECIFICATION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-wide">
              MASTER PRICE SHIFT & TOURNAMENT FLOW
            </h1>
            <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1">
              Complete round-by-round news stories, sector catalysts, starting prices, and pre-calculated shift matrices.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-[#18181b] border border-[#27272a] hover:border-[#10B981] hover:text-[#10B981] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
              title="Print high-density judge/host reference cheat sheet"
            >
              <Printer className="w-4 h-4 text-[#10B981]" />
              <span>Print Cheat Sheet (PDF)</span>
            </button>
            <Link
              href="/stage"
              target="_blank"
              className="px-3 py-2 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] text-xs text-white rounded-lg transition-all"
            >
              Stage Projector
            </Link>
            <Link
              href="/trade"
              target="_blank"
              className="px-3 py-2 bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 text-[#FF5F1F] hover:bg-[#FF5F1F] hover:text-black font-bold text-xs rounded-lg transition-all"
            >
              Participant Terminal
            </Link>
          </div>
        </header>

        {/* PRINT HEADER ONLY (Visible in Print) */}
        <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-black uppercase">Ramaiah University of Applied Sciences • BSc Data Science</h1>
              <h2 className="text-lg font-extrabold text-black">Bulls & Bears Trading Tournament — Master Flow & Shifts Cheat Sheet</h2>
              <p className="text-xs text-gray-700">Official Judges & Host Confidential Dossier • Event Date: October 1st, 2026 • Location: SLH 15</p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold border border-black px-2 py-1">CONFIDENTIAL</span>
            </div>
          </div>
        </div>

        {/* 2. WHAT DOES APPLYING MASTER PRICE SHIFTS MEAN? (EXPLANATION HERO CARD) */}
        <div className="p-6 bg-gradient-to-r from-[#0d0d10] via-[#09090b] to-[#0d0d10] border-2 border-[#FF5F1F]/30 rounded-2xl shadow-[0_0_50px_rgba(255,95,31,0.1)] relative overflow-hidden space-y-4 print:hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5F1F]/20 border border-[#FF5F1F]/50 flex items-center justify-center text-[#FF5F1F] shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>What Happens When You Click &quot;Apply Master Price Shifts&quot;?</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#d4d4d8] mt-1 leading-relaxed">
                During the 10-minute trading window of each round, participants trade stocks at the <strong>current fixed price</strong>.
                When the market closes and you click <strong>&quot;Apply Master Price Shifts&quot;</strong>, the market macroeconomic reaction occurs:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-[#030303]/80 border border-[#27272a] rounded-xl space-y-1">
              <div className="text-xs font-bold text-[#FF5F1F] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>1. Macro Shock Applied</span>
              </div>
              <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                Every stock shifts up or down by the master percentage derived from that round&apos;s 6 news stories.
              </p>
            </div>

            <div className="p-3.5 bg-[#030303]/80 border border-[#27272a] rounded-xl space-y-1">
              <div className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>2. Instant Portfolio P&amp;L</span>
              </div>
              <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                All team holdings are immediately revalued. Teams that correctly deduced the news see immediate net profit.
              </p>
            </div>

            <div className="p-3.5 bg-[#030303]/80 border border-[#27272a] rounded-xl space-y-1">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>3. Baseline Carry-Forward</span>
              </div>
              <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                The shifted price becomes the permanent starting opening price for the next round.
              </p>
            </div>
          </div>
        </div>

        {/* 3. VIEW MODE & ROUND SELECTION CONTROLS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] border border-[#27272a] p-4 rounded-xl print:hidden">
          {/* Left: View Mode Tabs */}
          <div className="flex items-center gap-1.5 bg-[#030303] p-1 border border-[#1e1e1e] rounded-lg">
            <button
              onClick={() => setViewMode("round")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "round"
                  ? "bg-[#FF5F1F] text-black shadow-lg"
                  : "text-[#a1a1aa] hover:text-white"
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Round Breakdown</span>
            </button>
            <button
              onClick={() => setViewMode("matrix")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "matrix"
                  ? "bg-[#FF5F1F] text-black shadow-lg"
                  : "text-[#a1a1aa] hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Complete Master Matrix</span>
            </button>
            <button
              onClick={() => setViewMode("editor")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "editor"
                  ? "bg-amber-400 text-black shadow-lg"
                  : "text-amber-400/80 hover:text-amber-300"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>⚡ Live Scenario &amp; Shift Override Editor</span>
            </button>
          </div>

          {/* Right: Round Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {[0, 1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRound(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                  selectedRound === r
                    ? "bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]"
                    : "bg-[#030303] text-[#a1a1aa] border border-[#1e1e1e] hover:border-[#27272a] hover:text-white"
                }`}
              >
                Round {r}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW MODE 1: ROUND BREAKDOWN (News + Starting Prices + Shifts)             */}
        {/* ========================================================================= */}
        {viewMode === "round" && (
          <div className="space-y-6">
            {/* Round Summary Banner */}
            <div className="p-6 bg-[#09090b] border border-[#27272a] rounded-2xl relative overflow-hidden space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e1e1e]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded bg-[#FF5F1F]/20 text-[#FF5F1F] font-bold uppercase border border-[#FF5F1F]/30">
                      Round {selectedRound}
                    </span>
                    <span className="text-xs text-[#a1a1aa] uppercase">{roundInfo.durationMinutes} Minutes Window</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
                    {customTitle || roundInfo.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">{customSubtitle || roundInfo.subtitle}</p>
                </div>

                {/* Key Gainers / Losers Pills */}
                <div className="flex items-center gap-3">
                  {biggestGainer && (
                    <div className="p-2.5 bg-[#030303] border border-[#10B981]/30 rounded-xl text-left">
                      <div className="text-[10px] text-[#10B981] font-bold uppercase">Top Gainer</div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{biggestGainer.ticker}</span>
                        <span className="text-[#10B981] font-mono">+{biggestGainer.pct}%</span>
                      </div>
                    </div>
                  )}

                  {biggestLoser && (
                    <div className="p-2.5 bg-[#030303] border border-[#F43F5E]/30 rounded-xl text-left">
                      <div className="text-[10px] text-[#F43F5E] font-bold uppercase">Top Loser</div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{biggestLoser.ticker}</span>
                        <span className="text-[#F43F5E] font-mono">{biggestLoser.pct}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 6 NEWS STORIES WITH CATALYST CLUES */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase text-[#FF5F1F] font-bold tracking-wider flex items-center gap-1.5">
                    <Newspaper className="w-4 h-4" />
                    <span>6 Released News Stories &amp; Clue Deductions</span>
                  </h3>
                  <span className="text-[10px] text-[#71717a]">Broadcasted to stage projector &amp; terminals</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(customNews.length > 0 ? customNews : roundInfo.newsStories).map((news) => (
                    <div
                      key={news.id}
                      className="p-4 bg-[#030303] border border-[#1e1e1e] hover:border-[#27272a] rounded-xl space-y-2.5 transition-all shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#FF5F1F] bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 px-2 py-0.5 rounded">
                            Story #{news.id}
                          </span>
                          <span className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wide">
                            {news.sector}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-relaxed">{news.headline}</h4>
                      </div>

                      <div className="p-2.5 bg-[#09090b] border border-[#18181b] rounded-lg text-[10px] text-[#d4d4d8] leading-relaxed">
                        <strong className="text-amber-400">Catalyst / Deduction:</strong> {news.clueSummary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* STOCKS TABLE WITH PRICE MOVEMENTS FOR THIS ROUND */}
            <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1e1e1e]">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#FF5F1F]" />
                    <span>Round {selectedRound} Stock Price Shifts &amp; Start/End Values</span>
                  </h3>
                  <p className="text-[11px] text-[#71717a]">
                    Shows exact opening price, applied shift %, and closing shifted value.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717a]" />
                    <input
                      type="text"
                      placeholder="Search stock..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none w-36 sm:w-48"
                    />
                  </div>

                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="bg-[#030303] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  >
                    {sectors.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1e1e1e] text-[10px] uppercase text-[#71717a]">
                      <th className="pb-3 font-medium">Asset</th>
                      <th className="pb-3 font-medium">Sector</th>
                      <th className="pb-3 font-medium text-right">Round {selectedRound} Start</th>
                      <th className="pb-3 font-medium text-right">Applied Shift (%)</th>
                      <th className="pb-3 font-medium text-right">Shifted Close ($)</th>
                      <th className="pb-3 font-medium text-right">Dollar Movement</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#18181b]">
                    {filteredStocks.map((stock) => {
                      const details = getRoundPriceDetails(stock, selectedRound);
                      const isUp = details.percentChange >= 0;

                      if (!details.isAvailable) {
                        return (
                          <tr key={stock.ticker} className="opacity-40 hover:opacity-60 transition-opacity">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <CompanyLogo ticker={stock.ticker} size="sm" />
                                <span className="font-bold text-white">{stock.ticker}</span>
                                <span className="text-[10px] text-[#71717a]">{stock.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-[11px] text-[#71717a]">{stock.sector}</td>
                            <td className="py-3 text-right text-[#71717a]">—</td>
                            <td className="py-3 text-right text-[#71717a]">Locked (Enters R2)</td>
                            <td className="py-3 text-right text-[#71717a]">—</td>
                            <td className="py-3 text-right text-[#71717a]">—</td>
                            <td className="py-3 text-center">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500">
                                Expansion Lock
                              </span>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={stock.ticker} className="hover:bg-[#18181b]/50 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <CompanyLogo ticker={stock.ticker} size="sm" />
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{stock.ticker}</span>
                                  {stock.entryRound === 2 && selectedRound >= 2 && (
                                    <span title="R2 Expansion Stock">
                                      <Sparkles className="w-3 h-3 text-amber-400" />
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#71717a] truncate max-w-[130px]">
                                  {stock.name}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 text-[11px] text-[#a1a1aa]">{stock.sector}</td>

                          <td className="py-3 text-right font-semibold text-white">
                            ${details.startPrice.toFixed(2)}
                          </td>

                          <td className="py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                                isUp
                                  ? "bg-emerald-950/60 text-[#10B981] border border-emerald-800"
                                  : "bg-rose-950/60 text-[#F43F5E] border border-rose-800"
                              }`}
                            >
                              {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              {isUp ? `+${details.percentChange}%` : `${details.percentChange}%`}
                            </span>
                          </td>

                          <td className="py-3 text-right font-extrabold text-white text-sm">
                            ${details.endPrice.toFixed(2)}
                          </td>

                          <td className="py-3 text-right font-medium">
                            <span className={isUp ? "text-[#10B981]" : "text-[#F43F5E]"}>
                              {details.dollarChange >= 0
                                ? `+$${details.dollarChange.toFixed(2)}`
                                : `-$${Math.abs(details.dollarChange).toFixed(2)}`}
                            </span>
                          </td>

                          <td className="py-3 text-center">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                isUp
                                  ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                                  : "bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30"
                              }`}
                            >
                              {isUp ? "Bull Shift" : "Bear Drop"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 2: COMPLETE MASTER MATRIX (All 30 Stocks Across All Rounds)      */}
        {/* ========================================================================= */}
        {viewMode === "matrix" && (
          <div className="space-y-6">
            <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1e1e1e]">
                <div>
                  <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#FF5F1F]" />
                    <span>Tournament Master Price Matrix (Start → R5 Close)</span>
                  </h3>
                  <p className="text-[11px] text-[#71717a]">
                    Every stock&apos;s complete price evolution across the full 6-round simulation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search ticker..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1e1e1e] bg-[#030303] text-[10px] uppercase text-[#71717a]">
                      <th className="py-3.5 px-3 font-medium">Stock Asset</th>
                      <th className="py-3.5 px-3 font-medium text-right">Start</th>
                      <th className="py-3.5 px-3 font-medium text-right">R0 Close</th>
                      <th className="py-3.5 px-3 font-medium text-right">R1 Close</th>
                      <th className="py-3.5 px-3 font-medium text-right">R2 Close</th>
                      <th className="py-3.5 px-3 font-medium text-right">R3 Close</th>
                      <th className="py-3.5 px-3 font-medium text-right">R4 Close</th>
                      <th className="py-3.5 px-3 font-medium text-right">R5 Final</th>
                      <th className="py-3.5 px-3 font-medium text-right">Total Net Return</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#18181b]">
                    {filteredStocks.map((stock) => {
                      const initialPrice = stock.startingPrice;
                      const finalPrice = stock.prices.r5;
                      const overallReturn = ((finalPrice - initialPrice) / initialPrice) * 100;
                      const isNetUp = overallReturn >= 0;

                      return (
                        <tr key={stock.ticker} className="hover:bg-[#18181b]/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <CompanyLogo ticker={stock.ticker} size="sm" />
                              <div>
                                <span className="font-bold text-white">{stock.ticker}</span>
                                <span className="text-[10px] text-[#71717a] ml-1.5 hidden sm:inline">
                                  {stock.sector}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right text-white font-medium">
                            ${stock.startingPrice.toFixed(2)}
                          </td>

                          <td className="py-3 px-3 text-right">
                            {stock.entryRound === 0 ? (
                              <span className="text-white">${stock.prices.r0.toFixed(2)}</span>
                            ) : (
                              <span className="text-[#52525b]">—</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            {stock.entryRound === 0 ? (
                              <span className="text-white">${stock.prices.r1.toFixed(2)}</span>
                            ) : (
                              <span className="text-[#52525b]">—</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className="text-white">${stock.prices.r2.toFixed(2)}</span>
                          </td>

                          <td className="py-3 px-3 text-right text-white">
                            ${stock.prices.r3.toFixed(2)}
                          </td>

                          <td className="py-3 px-3 text-right text-white">
                            ${stock.prices.r4.toFixed(2)}
                          </td>

                          <td className="py-3 px-3 text-right font-extrabold text-[#10B981]">
                            ${stock.prices.r5.toFixed(2)}
                          </td>

                          <td className="py-3 px-3 text-right font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                isNetUp
                                  ? "bg-emerald-950/50 text-[#10B981] border border-emerald-800"
                                  : "bg-rose-950/50 text-[#F43F5E] border border-rose-800"
                              }`}
                            >
                              {isNetUp ? `+${overallReturn.toFixed(1)}%` : `${overallReturn.toFixed(1)}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 3: LIVE CUSTOM SCENARIO & PRICE SHIFT OVERRIDE EDITOR             */}
        {/* ========================================================================= */}
        {viewMode === "editor" && (
          <div className="space-y-6">
            <div className="p-6 bg-[#09090b] border-2 border-amber-500/30 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e1e1e]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded bg-amber-400 text-black font-extrabold uppercase">
                      Round {selectedRound} Live Editor
                    </span>
                    <span className="text-xs text-[#a1a1aa]">Real-time tournament scenario tuning</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Customize News Clues &amp; Override Stock Price Shifts
                  </h3>
                  <p className="text-xs text-[#a1a1aa]">
                    Modify headlines or tweak individual stock percentage shifts live during the simulation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetScenario}
                    className="px-3 py-2 bg-[#18181b] border border-[#27272a] hover:border-rose-500 hover:text-rose-400 text-xs text-[#a1a1aa] rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    onClick={handleSaveScenario}
                    disabled={isSaving}
                    className="px-4 py-2 bg-amber-400 hover:bg-white text-black font-bold text-xs uppercase rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Saving..." : "Save Overrides to Server"}</span>
                  </button>
                </div>
              </div>

              {/* 1. Round Title & Subtitle Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">
                    Round Theme Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-[#030303] border border-[#27272a] focus:border-amber-400 rounded-lg p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">
                    Round Macro Scenario Subtitle
                  </label>
                  <input
                    type="text"
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    className="w-full bg-[#030303] border border-[#27272a] focus:border-amber-400 rounded-lg p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* 2. Editable 6 News Stories */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold text-white flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-amber-400" />
                  <span>Customize 6 News Stories &amp; Clues</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {customNews.map((news, idx) => (
                    <div
                      key={news.id}
                      className="p-3.5 bg-[#030303] border border-[#1e1e1e] rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-amber-400">Story #{news.id}</span>
                        <input
                          type="text"
                          value={news.sector}
                          onChange={(e) => {
                            const updated = [...customNews];
                            updated[idx].sector = e.target.value;
                            setCustomNews(updated);
                          }}
                          placeholder="Sector"
                          className="bg-[#09090b] border border-[#27272a] rounded px-2 py-0.5 text-[10px] text-[#a1a1aa] w-28 text-right outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase text-[#71717a]">Headline</label>
                        <textarea
                          value={news.headline}
                          rows={2}
                          onChange={(e) => {
                            const updated = [...customNews];
                            updated[idx].headline = e.target.value;
                            setCustomNews(updated);
                          }}
                          className="w-full bg-[#09090b] border border-[#27272a] focus:border-amber-400 rounded p-1.5 text-[11px] text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase text-[#71717a]">Deduction Hint</label>
                        <textarea
                          value={news.clueSummary}
                          rows={2}
                          onChange={(e) => {
                            const updated = [...customNews];
                            updated[idx].clueSummary = e.target.value;
                            setCustomNews(updated);
                          }}
                          className="w-full bg-[#09090b] border border-[#27272a] focus:border-amber-400 rounded p-1.5 text-[10px] text-[#d4d4d8] outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Editable Stock Shift Percentages */}
              <div className="space-y-3 pt-4 border-t border-[#1e1e1e]">
                <h4 className="text-xs uppercase font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Override Stock Shift Percentages for Round {selectedRound}</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {STOCKS_DATA.filter((s) => s.entryRound <= selectedRound).map((stock) => {
                    const currentVal = customShifts[stock.ticker] !== undefined ? customShifts[stock.ticker] : (roundInfo.marketChanges[stock.ticker] || 0);
                    const isPositive = currentVal >= 0;

                    return (
                      <div
                        key={stock.ticker}
                        className="p-2.5 bg-[#030303] border border-[#1e1e1e] rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CompanyLogo ticker={stock.ticker} size="sm" />
                          <span className="font-bold text-white text-xs">{stock.ticker}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={currentVal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCustomShifts({
                                ...customShifts,
                                [stock.ticker]: val,
                              });
                            }}
                            className={`w-16 text-right font-bold text-xs p-1 rounded bg-[#09090b] border ${
                              isPositive
                                ? "border-emerald-800 text-[#10B981]"
                                : "border-rose-800 text-[#F43F5E]"
                            } outline-none`}
                          />
                          <span className="text-[10px] text-[#71717a]">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

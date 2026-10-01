"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  ArrowLeftRight,
  Newspaper,
  Shield,
  RefreshCw,
  LogOut,
  Sparkles,
  AlertTriangle,
  X,
  Check,
  Zap,
  Flame,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  Handshake,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { KpiCard, StatusBadge } from "@/src/components/ui/Quantumanalytics";
import { CompanyLogo } from "@/src/components/ui/CompanyLogo";
import { PriceTickerMarquee } from "@/src/components/ui/PriceTickerMarquee";
import { OrderBookDepth } from "@/src/components/ui/OrderBookDepth";
import { NotificationsTimeline } from "@/src/components/ui/NotificationsTimeline";
import { FloatingDockMenu, NavTabItem } from "@/src/components/ui/FloatingDockMenu";
import { Stepper } from "@/src/components/watermelon/stepper";
import { TradeSummary, TradeItem } from "@/src/components/watermelon/trade-summary";
import { TransactionList, Transaction } from "@/src/components/watermelon/transaction-list";
import { sounds } from "@/src/lib/sounds";
import { formatCurrency, formatNumber } from "@/src/lib/utils";
import { EyeTracking } from "@/src/components/ui/eye-tracking";
import { FlippingWordSwap } from "@/src/components/ui/flipping-word-swap";
import { createDemoMarket, requestDemo, addDemoOffers, applyDemoPriceMove, DEMO_TEAM_ID, DEMO_STARTING_CASH } from "@/src/lib/demo-market";
import { REQUIRED_PEER_TRADES } from "@/src/lib/peer-trades";
import { calculateMarketSale, isValidPeerPrice } from "@/src/lib/market-sale";

const CYCLING_STANDBY_PHRASES = [
  { w1: "TERMINAL INITIALIZED", w2: "AWAITING ROUND 0" },
  { w1: "MARKET INTEL ENCRYPTED", w2: "STAND BY FOR NEWS FLASH" },
  { w1: "SQUAD PROTOCOL READY", w2: "SIGNAL THE HOST" },
  { w1: "BULLS & BEARS PROTOCOL", w2: "PREPARE YOUR STRATEGY" },
];

const PRACTICE_GUIDE = [
  { title: "Portfolio", text: "Cash is available to spend. Holdings show your shares; net worth adds both together. This fictional session starts with $25,000 and two sample positions." },
  { title: "Buy", text: "Choose a stock, enter a whole number of shares, and submit a buy. Watch your cash, holdings, available float, and audit update." },
  { title: "Sell", text: "Sell shares you own back to the market or choose a practice bot as the buyer. Bots accept direct sales immediately here; participants decide for themselves in the competition." },
  { title: "News", text: "Read the fictional Pebblewick developments and consider which companies might be affected. Use Sample price move to see holdings and profit/loss respond. These headlines and prices have no connection to the competition." },
  { title: "Swap", text: "Trade owned shares for another company's shares. Choose a bot, the shares to give, and the shares to receive. Practice bots accept valid swaps immediately." },
  { title: "Audit", text: "Inspect your practice transaction receipts. Use Sample offers to try accepting or declining an incoming swap or direct sale. Reset practice to start over." },
];

interface ActiveStock {
  ticker: string;
  name: string;
  sector: string;
  startingPrice: number;
  currentPrice: number;
  availableSupply: number;
  roundChangePercent: number;
  entryRound: number;
}

interface TeamPortfolio {
  id: string;
  teamName: string;
  tableNumber?: string;
  members?: string[];
  cashBalance: number;
  portfolio: Record<string, number>;
  holdingsValue: number;
  totalPortfolioValue: number;
  pnl: number;
  pnlPercent: number;
  isFrozen: boolean;
  isReady?: boolean;
  qualifyingPeerTrades?: number;
}

interface GameStatePayload {
  simulationId?: string;
  databaseRevision?: number;
  currentRound: number;
  roundInfo: {
    round: number;
    title: string;
    subtitle: string;
    durationMinutes: number;
    newsStories: Array<{ id: number; headline: string; sector: string; clueSummary: string }>;
  };
  status: "SETUP" | "NEWS_RELEASED" | "TRADING_OPEN" | "TRADING_CLOSED" | "FINISHED";
  tradingExpiresAt: number | null;
  marketExpanded: boolean;
  leaderboardVisible: boolean;
  serverTime: number;
  marketSellLockEnabled?: boolean;
  marketSellCommissionEnabled?: boolean;
  marketSellCommissionPercent?: number;
  negotiatedPricesEnabled?: boolean;
}

export default function TradingTerminal({ demo = false }: { demo?: boolean }) {
  const [demoMarket] = useState(() => demo ? createDemoMarket() : null);
  const [guideStep, setGuideStep] = useState(0);
  const startingCash = demo ? DEMO_STARTING_CASH : 100000;
  const simulationRef = useRef<string | null>(null);
  const revisionRef = useRef(-1);
  const request = useCallback(async (url: string, init?: RequestInit) => {
    if (demoMarket) return requestDemo(demoMarket, url, init);
    if ((url === "/api/trade" || url === "/api/swap") && typeof init?.body === "string") {
      init = { ...init, body: JSON.stringify({ ...JSON.parse(init.body), simulationId: simulationRef.current }) };
    }
    return fetch(url, init);
  }, [demoMarket]);
  // Auth state
  const [teamId, setTeamId] = useState<string | null>(demo ? DEMO_TEAM_ID : null);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [passcodeInput, setPasscodeInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Live state
  const [gameState, setGameState] = useState<GameStatePayload | null>(null);
  const [activeStocks, setActiveStocks] = useState<ActiveStock[]>([]);
  const [teamData, setTeamData] = useState<TeamPortfolio | null>(null);
  const [allTeams, setAllTeams] = useState<Array<{ id: string; teamName: string; tableNumber?: string; totalPortfolioValue: number; isReady?: boolean }>>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [directSellOffers, setDirectSellOffers] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>("10:00");
  const [phraseIdx, setPhraseIdx] = useState<number>(0);
  const [isTogglingReady, setIsTogglingReady] = useState<boolean>(false);

  // Direct P2P Selling State
  const [sellTargetMode, setSellTargetMode] = useState<"DIRECT_TEAM" | "MARKET_POOL">("DIRECT_TEAM");
  const [sellTargetTeamId, setSellTargetTeamId] = useState<string>("");

  // Search & Multi-Select Sector Filtering State
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [inspectedTicker, setInspectedTicker] = useState<string>(demo ? "LUMA-X" : "NVDA");

  // Modals & Drawers
  const [orderModal, setOrderModal] = useState<{ isOpen: boolean; stock: ActiveStock | null; action: "BUY" | "SELL" }>({
    isOpen: false,
    stock: null,
    action: "BUY",
  });
  const [orderQty, setOrderQty] = useState(5);
  const [offerPriceDraft, setOfferPriceDraft] = useState("");
  useEffect(() => {
    if (orderModal.isOpen && orderModal.stock) setOfferPriceDraft(orderModal.stock.currentPrice.toFixed(2));
  }, [orderModal.isOpen, orderModal.stock?.ticker]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const [showNewsDrawer, setShowNewsDrawer] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [newsCarouselIdx, setNewsCarouselIdx] = useState<number | null>(null);

  // Swap Proposal State
  const [targetTeamId, setTargetTeamId] = useState("");
  const [giveTicker, setGiveTicker] = useState("");
  const [giveQty, setGiveQty] = useState(5);
  const [receiveTicker, setReceiveTicker] = useState("");
  const [receiveQty, setReceiveQty] = useState(5);
  const [swapMessage, setSwapMessage] = useState<string | null>(null);

  // Fetch live state
  const fetchState = useCallback(async () => {
    try {
      const url = teamId ? `/api/state?teamId=${teamId}` : `/api/state`;
      const res = await request(url);
      if (!res.ok) return;
      const data = await res.json();

      const revision = data.gameState.databaseRevision;
      if (revision !== undefined && revision < revisionRef.current) return;
      if (revision !== undefined) revisionRef.current = revision;
      if (simulationRef.current && simulationRef.current !== data.gameState.simulationId) {
        setOrderModal({ isOpen: false, stock: null, action: "BUY" });
        setShowSwapModal(false);
        setShowNewsDrawer(false);
        setShowJournalModal(false);
        setShowAuditModal(false);
        setNewsCarouselIdx(null);
      }
      simulationRef.current = data.gameState.simulationId || null;
      setGameState(data.gameState);
      setActiveStocks(data.activeStocks);
      setAllTeams(data.leaderboard || []);
      setTransactions(data.transactions || []);
      setSwaps(data.swaps || []);
      setDirectSellOffers(data.directSellOffers || []);

      if (data.activeTeam) {
        setTeamData(data.activeTeam);
      } else if (teamId && !demoMarket) {
        setTeamData(null);
        setTeamId(null);
        localStorage.removeItem("bb_team_id");
      }
    } catch (e) {
      console.error("Failed to sync state", e);
    }
  }, [teamId, request]);

  // Initial load & Polling interval
  useEffect(() => {
    // Check local storage for session
    const savedTeamId = demo ? null : localStorage.getItem("bb_team_id");
    if (savedTeamId) {
      setTeamId(savedTeamId);
    }

    fetchState();
    const interval = setInterval(fetchState, 1200);
    return () => clearInterval(interval);
  }, [fetchState, demo]);

  // Rotate Standby cycling text every 4 seconds
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % CYCLING_STANDBY_PHRASES.length);
    }, 4000);
    return () => clearInterval(cycleInterval);
  }, []);

  // Keyboard navigation for News Carousel
  useEffect(() => {
    if (newsCarouselIdx === null || !gameState?.roundInfo?.newsStories?.length) return;
    const storiesCount = gameState.roundInfo.newsStories.length;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setNewsCarouselIdx((prev) => (prev !== null ? (prev + 1) % storiesCount : 0));
        sounds.playTick();
      } else if (e.key === "ArrowLeft") {
        setNewsCarouselIdx((prev) => (prev !== null ? (prev - 1 + storiesCount) % storiesCount : 0));
        sounds.playTick();
      } else if (e.key === "Escape") {
        setNewsCarouselIdx(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [newsCarouselIdx, gameState]);

  // Sync Timer countdown
  useEffect(() => {
    if (demo) {
      setTimeRemaining("PRACTICE");
      return;
    }
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
  }, [gameState, demo]);

  // Readiness Toggle Handler
  const handleToggleReady = async () => {
    if (!teamId) return;
    setIsTogglingReady(true);
    try {
      const res = await request("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_READY", teamId }),
      });
      const data = await res.json();
      if (!res.ok) {
        sounds.playTradeError();
        toast.error(data.error || "Failed to update readiness status.");
        return;
      }
      sounds.playTradeSuccess();
      toast.success(data.message || (data.isReady ? "Marked READY for Round 0!" : "Marked STANDBY."));
      fetchState();
    } catch (e) {
      toast.error("Network error updating readiness.");
    } finally {
      setIsTogglingReady(false);
    }
  };

  // Auth Handler
  const handleAuth = async (action: "login" | "register") => {
    setAuthError(null);
    if (!/^[0-9]{4}$/.test(passcodeInput)) {
      setAuthError("Enter a PIN containing exactly 4 digits.");
      return;
    }
    try {
      const res = await request("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, teamName: teamNameInput, passcode: passcodeInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication failed");
        toast.error(data.error || "Authentication failed");
        return;
      }
      setTeamId(data.team.id);
      if (!demo) localStorage.setItem("bb_team_id", data.team.id);
      sounds.playTradeSuccess();
      toast.success(`Welcome back, ${data.team.teamName}! Portfolio unlocked.`);
    } catch (e) {
      setAuthError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    }
  };

  const handleLogout = () => {
    if (demo) {
      window.location.assign("/");
      return;
    }
    setTeamId(null);
    localStorage.removeItem("bb_team_id");
    toast.info("Logged out of trading terminal.");
  };

  // Order Execution Handler
  const tradingAllowed = gameState?.status === "TRADING_OPEN" && !teamData?.isFrozen &&
    (demo || !gameState.tradingExpiresAt || gameState.tradingExpiresAt > Date.now());

  const handleExecuteOrder = async () => {
    if (!orderModal.stock || !teamId) return;
    if (!tradingAllowed) {
      setOrderError("Trading is closed. Orders are available only while the trading floor is open.");
      return;
    }

    if (orderModal.action === "SELL" && sellTargetMode === "MARKET_POOL" && gameState?.marketSellLockEnabled && (teamData?.qualifyingPeerTrades || 0) < REQUIRED_PEER_TRADES) {
      toast.error("Complete two direct trades or accepted swaps this round before selling to the market.");
      return;
    }

    if (orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM" && !sellTargetTeamId) {
      toast.error("Please select a buyer team from the dropdown to sell to.");
      return;
    }
    if (orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM" && gameState?.negotiatedPricesEnabled && !isValidPeerPrice(Number(offerPriceDraft))) {
      setOrderError("Enter a positive offer price with up to two decimal places.");
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError(null);
    setOrderSuccess(null);

    try {
      const res = await request("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          action: orderModal.action,
          ticker: orderModal.stock.ticker,
          quantity: orderQty,
          pricePerShare: orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM" && gameState?.negotiatedPricesEnabled ? Number(offerPriceDraft) : undefined,
          targetTeamId:
            orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM"
              ? sellTargetTeamId
              : "MARKET_POOL",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        sounds.playTradeError();
        setOrderError(data.error || "Order failed to execute.");
        toast.error(data.error || "Order failed to execute.");
        setIsSubmittingOrder(false);
        return;
      }

      sounds.playTradeSuccess();
      setOrderSuccess(data.message);
      if (data.isDirectSell) {
        toast.success(`120s Direct Sell Offer Transmitted!`, {
          description: `Offer for ${orderQty} ${orderModal.stock.ticker} sent to counterparty. Active for 120 seconds.`,
        });
      } else {
        toast.success(`Executed ${orderModal.action}: ${orderQty} shares of ${orderModal.stock.ticker}`, {
          description: data.sale ? `Net cash after commission: ${formatCurrency(data.sale.netTotal)}` : `Total position value: ${formatCurrency(orderModal.stock.currentPrice * orderQty)}`,
        });
      }
      fetchState();
      setTimeout(() => {
        setOrderModal({ isOpen: false, stock: null, action: "BUY" });
        setOrderSuccess(null);
      }, 1200);
    } catch (e) {
      sounds.playTradeError();
      setOrderError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Direct Sell Offer Actions
  const handleAcceptDirectSell = async (offerId: string) => {
    if (!tradingAllowed) { toast.error("Trading is closed."); return; }
    try {
      const res = await request("/api/trade", {
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
        sounds.playTradeError();
        toast.error(data.error || "Failed to accept sell offer.");
        fetchState();
        return;
      }

      sounds.playTradeSuccess();
      toast.success(data.message || "Purchase completed! Stock added to your portfolio.");
      fetchState();
    } catch (e) {
      sounds.playTradeError();
      toast.error("Network error accepting sell offer.");
    }
  };

  const handleRejectDirectSell = async (offerId: string) => {
    try {
      await request("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT_DIRECT_SELL",
          teamId,
          offerId,
        }),
      });
      toast.info("Declined purchase offer.");
      fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelDirectSell = async (offerId: string) => {
    try {
      await request("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL_DIRECT_SELL",
          teamId,
          offerId,
        }),
      });
      toast.info("Direct sell offer cancelled.");
      fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Swap Proposal Handler
  const handleProposeSwap = async () => {
    if (!tradingAllowed) { setSwapMessage("Trading is closed. Wait for the host to open the floor."); return; }
    if (!teamId || !targetTeamId || !giveTicker || !receiveTicker) return;
    try {
      const res = await request("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROPOSE",
          teamId,
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
        sounds.playTradeError();
        setSwapMessage(`❌ ${data.error}`);
        toast.error(data.error || "Failed to transmit swap proposal.");
        return;
      }
      sounds.playTradeSuccess();
      setSwapMessage(`✅ ${data.message}`);
      toast.success(demo ? "Practice swap completed!" : "Trade proposal sent!", {
        description: demo ? data.message : `Offered ${giveQty} ${giveTicker} for ${receiveQty} ${receiveTicker}. Counterparty has 60s.`,
      });
      fetchState();
      setTimeout(() => {
        setShowSwapModal(false);
        setSwapMessage(null);
      }, 1500);
    } catch (e) {
      setSwapMessage("❌ Network error");
      toast.error("Network error sending swap proposal.");
    }
  };

  // Accept / Reject Swap
  const handleSwapAction = async (swapId: string, action: "ACCEPT" | "REJECT") => {
    if (action === "ACCEPT" && !tradingAllowed) { toast.error("Trading is closed."); return; }
    try {
      const res = await request("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, swapId, teamId }),
      });
      const data = await res.json();
      if (!res.ok) {
        sounds.playTradeError();
        toast.error(data.error || "Swap action failed");
        return;
      }
      if (action === "ACCEPT") {
        sounds.playTradeSuccess();
        toast.success("Swap agreement confirmed! Portfolio balances updated.");
      } else {
        toast.info("Swap proposal declined.");
      }
      fetchState();
    } catch (e) {
      console.error(e);
      toast.error("Failed to process swap response.");
    }
  };

  // --- 1. AUTHENTICATION MODAL (If Not Logged In) ---
  if (demo && !teamData) {
    return <main className="min-h-screen bg-[#030303] text-white grid place-items-center font-mono" aria-live="polite">Preparing your fictional practice terminal...</main>;
  }
  if (!teamId || !teamData) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4 font-mono relative cyber-grid">
        <div className="w-full max-w-md bg-[#09090b] border border-[#27272a] p-6 sm:p-8 rounded-sm shadow-2xl relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-sm bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 flex items-center justify-center text-[#FF5F1F]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-base">BULLS & BEARS TERMINAL</div>
              <div className="text-[10px] text-[#71717a] uppercase">Ramaiah University Trading Engine</div>
            </div>
          </div>

          <h2 className="text-xl font-display font-semibold text-white mb-2">Team Authentication</h2>
          <p className="text-xs text-[#a1a1aa] mb-6">
            Enter your team credentials to access your synchronized $100,000 trading portfolio.
          </p>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] uppercase text-[#71717a] mb-1">Team Name</label>
              <input
                type="text"
                value={teamNameInput}
                onChange={(e) => setTeamNameInput(e.target.value)}
                placeholder="e.g. Quant Squad"
                className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-sm px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[#71717a] mb-1">Passcode / PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]{4}"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder="4-digit PIN"
                className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-sm px-3 py-2 text-white outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleAuth("login")}
                className="w-full py-3 bg-[#FF5F1F] text-black font-bold uppercase rounded-sm hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#FF5F1F]/20"
              >
                Access Terminal
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-[11px] text-[#71717a] hover:text-[#FF5F1F] transition-colors">
              ← Return to Event Overview & Rules
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Incoming pending swaps for this team
  const incomingSwaps = swaps.filter((s) => s.receiverId === teamId && s.status === "PENDING");

  // Incoming and Outgoing 120s Direct P2P Sell Offers
  const incomingDirectOffers = directSellOffers.filter(
    (o) => o.buyerTeamId === teamId && o.status === "PENDING" && Date.now() < o.expiresAt
  );
  const outgoingDirectOffers = directSellOffers.filter(
    (o) => o.sellerTeamId === teamId && o.status === "PENDING" && Date.now() < o.expiresAt
  );

  // Dynamic Sectors & Search Filtering
  const uniqueSectors = Array.from(new Set(activeStocks.map((s) => s.sector))).filter(Boolean);
  const filteredActiveStocks = activeStocks.filter((s) => {
    const query = tableSearchQuery.toLowerCase();
    const matchesSearch =
      s.ticker.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query) ||
      s.sector.toLowerCase().includes(query);
    const matchesSector =
      selectedSectors.length === 0 || selectedSectors.includes(s.sector);
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

    return (
      <div className="min-h-screen bg-[#020202] text-[#fafafa] font-mono p-4 sm:p-6 md:p-10 flex flex-col justify-between select-none cyber-grid relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-[#FF5F1F]/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] bg-[#10B981]/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between pb-5 border-b border-[#1e1e1e] gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-display font-extrabold text-white tracking-wider">
                  BULLS <span className="text-[#FF5F1F]">&</span> BEARS
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#FF5F1F]/15 text-[#FF5F1F] border border-[#FF5F1F]/30 font-bold">
                  STANDBY LOBBY
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-[#a1a1aa] uppercase tracking-wider">
                {teamData.teamName} • {teamData.tableNumber || "Main Arena Floor"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded bg-[#09090b] border border-[#27272a] text-xs font-bold text-white flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Balance: <strong className="text-[#10B981]">{formatCurrency(teamData.cashBalance)}</strong></span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 bg-[#09090b] border border-[#27272a] hover:border-red-500/50 text-[#71717a] hover:text-red-400 rounded-sm transition-colors text-xs flex items-center gap-1.5"
              title="Switch Team / Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Center Standby Stage */}
        <main className="flex-1 flex flex-col items-center justify-center text-center my-6 relative z-10 max-w-3xl mx-auto w-full">
          {/* Cycling Header with FlippingWordSwap */}
          <div className="mb-6 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF5F1F] font-bold mb-2.5 px-3 py-1 rounded bg-[#FF5F1F]/10 border border-[#FF5F1F]/30">
              <span className="w-1.5 h-1.5 bg-[#FF5F1F] animate-ping" />
              SIMULATION ENGINE // TRADING TERMINAL STANDBY
            </div>

            <div className="h-12 flex items-center justify-center">
              <FlippingWordSwap
                key={phraseIdx}
                word1={currentPhrase.w1}
                word2={currentPhrase.w2}
                duration={450}
                stagger={35}
                className="text-xl sm:text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight"
                toClassName="text-[#FF5F1F]"
              />
            </div>

            <p className="text-xs text-[#71717a] max-w-md mt-1">
              When the host releases the news flash, Round 0 headlines and the market will appear here. Read the news and prepare your orders; trading begins when the host opens the trading window.
            </p>
          </div>

          {/* Eye Tracking Cyber Visualizer */}
          <div className="p-6 sm:p-8 bg-[#09090b]/80 border border-[#27272a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative group hover:border-[#FF5F1F]/50 transition-colors duration-500 mb-6">
            <div className="absolute top-3 left-3 text-[9px] text-[#52525b] uppercase tracking-widest font-mono">
              [ TERMINAL RADAR // LIVE OPTICALS ]
            </div>
            <EyeTracking
              eyeSize={110}
              gap={28}
              irisColor={isReady ? "#10B981" : "#FF5F1F"}
              irisColorSecondary={isReady ? "#34D399" : "#FF8C38"}
              pupilColor="#050505"
              scleraColor="#121216"
              variant="cyber"
              pupilRange={0.75}
              idleAnimation={true}
              blinkInterval={3800}
            />
          </div>

          {/* READY / NOT READY ACTION CONTROLLER */}
          <div className="w-full max-w-md mb-6">
            <button
              onClick={handleToggleReady}
              disabled={isTogglingReady}
              className={`w-full py-4 px-6 rounded-xl border font-bold uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-2xl relative overflow-hidden group ${
                isReady
                  ? "bg-emerald-950/40 border-[#10B981] text-white hover:bg-emerald-900/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                  : "bg-[#FF5F1F]/15 border-[#FF5F1F] text-white hover:bg-[#FF5F1F]/25 shadow-[0_0_30px_rgba(255,95,31,0.25)] animate-pulse"
              }`}
            >
              <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold">
                {isReady ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-[#10B981] text-black flex items-center justify-center shrink-0 shadow-md">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span className="text-[#10B981]">SQUAD STATUS: READY FOR ROUND 0</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-[#FF5F1F] text-black flex items-center justify-center shrink-0 shadow-md">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-[#FF5F1F]">PRESS TO MARK SQUAD AS READY</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-[#a1a1aa] normal-case font-normal">
                {isReady
                  ? "✓ Synced with Stage & Admin Dashboard. Click to switch back to Standby."
                  : "Signals the host and auditorium stage that your team is seated and ready."}
              </div>
            </button>
          </div>

          {/* ARENA READINESS MATRIX */}
          <div className="w-full bg-[#09090b] border border-[#1e1e1e] rounded-xl p-4 text-left font-mono">
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-[#18181b]">
              <span className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider">
                Arena Readiness Status
              </span>
              <span className="text-[11px] font-bold text-white">
                <strong className="text-[#10B981]">{readyCount}</strong> / {totalCount} Squads Ready ({readyPct}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[#18181b] rounded-full overflow-hidden mt-2.5 mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#FF5F1F] to-[#10B981] transition-all duration-500 rounded-full"
                style={{ width: `${readyPct}%` }}
              />
            </div>

            {/* Squad chips */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {allTeams.map((t) => (
                <div
                  key={t.id}
                  className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                    t.id === teamData.id
                      ? t.isReady
                        ? "bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold"
                        : "bg-[#FF5F1F]/20 border-[#FF5F1F] text-[#FF5F1F] font-bold"
                      : t.isReady
                      ? "bg-emerald-950/30 border-emerald-800 text-emerald-300"
                      : "bg-[#121216] border-[#27272a] text-[#71717a]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      t.isReady ? "bg-[#10B981] shadow-[0_0_6px_#10B981]" : "bg-amber-400"
                    }`}
                  />
                  <span>{t.teamName}</span>
                  {t.id === teamData.id && <span className="text-[9px] opacity-75">(You)</span>}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="pt-3 border-t border-[#18181b] flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] text-[#52525b] uppercase tracking-wider relative z-10 gap-2">
          <span>Ramaiah University Trading Simulation • SLH 15 Auditorium</span>
          <Link href="/" className="hover:text-[#FF5F1F] transition-colors">
            ← Event Overview &amp; Rules
          </Link>
        </footer>
      </div>
    );
  }

  // --- 2. ACTIVE TRADING TERMINAL INTERFACE ---
  const peerTradeCount = teamData.qualifyingPeerTrades || 0;
  const marketSellLocked = Boolean(gameState?.marketSellLockEnabled) && peerTradeCount < REQUIRED_PEER_TRADES;
  const commissionPercent = gameState?.marketSellCommissionEnabled && sellTargetMode === "MARKET_POOL" ? gameState.marketSellCommissionPercent || 0 : 0;
  const negotiatedOffer = orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM" && gameState?.negotiatedPricesEnabled;
  const orderPrice = negotiatedOffer ? Number(offerPriceDraft) : orderModal.stock?.currentPrice || 0;
  const salePreview = orderModal.stock ? calculateMarketSale(orderPrice, orderQty, commissionPercent) : null;
  return (
    <div className="responsive-page min-h-screen bg-[#030303] text-[#fafafa] font-mono pb-32">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-[#1e1e1e] px-3 sm:px-6 lg:px-8 xl:px-10 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand & Team */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-sm bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 flex items-center justify-center text-[#FF5F1F]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-white text-sm">BULLS<span className="text-[#FF5F1F]">&</span>BEARS</span>
          </Link>

          <div className="h-4 w-px bg-[#27272a] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">{teamData.teamName}</span>
            <StatusBadge status={teamData.isFrozen ? "paused" : "active"} />
          </div>
        </div>

        {/* Center: Global Timer & Round Info */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-[#030303] border border-[#27272a] px-2 sm:px-3.5 py-1.5 rounded-sm">
          <span className="text-xs text-[#FF5F1F] font-bold">R{gameState?.currentRound || 0}</span>
          <span className="text-xs text-[#71717a]">•</span>
          <div className="flex items-center gap-1.5 text-sm font-display font-semibold text-white">
            <Clock className="w-3.5 h-3.5 text-[#FF5F1F]" />
            <span>{timeRemaining}</span>
          </div>
          <span className="text-xs text-[#71717a]">•</span>
          <span
            className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
              gameState?.status === "TRADING_OPEN"
                ? "bg-[#10B981]/20 text-[#10B981]"
                : gameState?.status === "NEWS_RELEASED"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-rose-500/20 text-rose-400"
            }`}
          >
            {gameState?.status.replace("_", " ")}
          </span>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Prominent Glowing News Intel Button */}
          <button
            onClick={() => setShowNewsDrawer(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF5F1F] via-[#FF8C38] to-[#FF5F1F] bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-black text-xs rounded-md flex items-center gap-2 shadow-[0_0_20px_rgba(255,95,31,0.4)] hover:shadow-[0_0_28px_rgba(255,95,31,0.65)] transition-all transform hover:-translate-y-0.5"
          >
            <div className="w-5 h-5 rounded bg-black/20 flex items-center justify-center shrink-0">
              <Newspaper className="w-3.5 h-3.5 text-black fill-current" />
            </div>
            <span className="tracking-wider uppercase font-display">News Intel</span>
            {gameState?.roundInfo?.newsStories && (
              <span className="px-1.5 py-0.2 bg-black text-[#FF5F1F] rounded-full text-[10px] font-black shrink-0">
                {gameState.roundInfo.newsStories.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setGiveTicker(Object.keys(teamData.portfolio)[0] || activeStocks[0]?.ticker || "");
              setReceiveTicker(activeStocks.find((stock) => stock.ticker !== Object.keys(teamData.portfolio)[0])?.ticker || activeStocks[0]?.ticker || "");
              setShowSwapModal(true);
            }}
            className="px-3 py-1.5 bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 hover:border-[#FF5F1F] text-xs text-[#FF5F1F] font-bold rounded-sm flex items-center gap-1.5 transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Propose Swap</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 text-[#71717a] hover:text-white rounded-sm transition-colors"
            title={demo ? "Exit Demo" : "Log Out"}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {demo && (
        <>
        <div className="demo-badge fixed bottom-[calc(4.75rem_+_env(safe-area-inset-bottom))] sm:bottom-3 left-3 z-[90] rounded border border-[#FF5F1F]/50 bg-[#09090b] px-2 py-1 text-[9px] text-[#FF5F1F] font-bold tracking-wider pointer-events-none">DEMO · FICTIONAL DATA</div>
        <section aria-label="Practice terminal guide" className="px-3 sm:px-6 lg:px-8 xl:px-10 py-4 border-b border-[#FF5F1F]/30 bg-[#FF5F1F]/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#FF5F1F] uppercase tracking-wider">Demo only · Fictional data · Browser practice</p>
              <h1 className="mt-1 text-lg font-display font-bold">Learn your trading terminal</h1>
              <p className="mt-1 text-xs text-[#a1a1aa]">Practice freely. Reloading clears this session; it never reads or changes the live game.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => {
                if (!demoMarket) return;
                demoMarket.gameState.marketSellLockEnabled = !demoMarket.gameState.marketSellLockEnabled;
                fetchState();
              }} className="px-3 py-2 border border-[#27272a] rounded-lg text-xs text-white hover:border-[#FF5F1F]">Practice sale lock: {gameState?.marketSellLockEnabled ? "ON" : "OFF"}</button>
              <button type="button" onClick={() => {
                if (!demoMarket) return;
                demoMarket.gameState.marketSellCommissionEnabled = !demoMarket.gameState.marketSellCommissionEnabled;
                fetchState();
              }} className="px-3 py-2 border border-[#27272a] rounded-lg text-xs text-white hover:border-[#FF5F1F]">Practice commission: {gameState?.marketSellCommissionEnabled ? `${gameState.marketSellCommissionPercent}%` : "OFF"}</button>
              <button type="button" onClick={() => {
                if (!demoMarket) return;
                applyDemoPriceMove(demoMarket);
                fetchState();
                toast.info("Fictional prices updated. Check your holdings and profit/loss.");
              }} className="px-3 py-2 border border-[#27272a] rounded-lg text-xs text-white hover:border-[#FF5F1F]">Sample price move</button>
              <button type="button" onClick={() => {
                if (!demoMarket) return;
                addDemoOffers(demoMarket);
                fetchState();
                toast.info("Sample incoming offers added. Review the alerts below.");
              }} className="px-3 py-2 border border-[#27272a] rounded-lg text-xs text-white hover:border-[#FF5F1F]">Sample offers</button>
              <button type="button" onClick={() => {
                if (!demoMarket) return;
                Object.assign(demoMarket, createDemoMarket());
                setGuideStep(0);
                setTableSearchQuery("");
                setSelectedSectors([]);
                setOrderModal({ isOpen: false, stock: null, action: "BUY" });
                setShowSwapModal(false);
                setShowNewsDrawer(false);
                setShowJournalModal(false);
                setShowAuditModal(false);
                setNewsCarouselIdx(null);
                fetchState();
                toast.info("Practice reset. Your fictional starting portfolio is restored.");
              }} className="px-3 py-2 border border-[#FF5F1F]/40 rounded-lg text-xs text-[#FF5F1F] hover:bg-[#FF5F1F]/10">Reset practice</button>
            </div>
          </div>
          <nav aria-label="Practice steps" className="mt-4 flex flex-wrap gap-2">
            {PRACTICE_GUIDE.map((step, index) => (
              <button key={step.title} type="button" aria-current={guideStep === index ? "step" : undefined} onClick={() => {
                setGuideStep(index);
                if (index === 1 || index === 2) {
                  const ticker = index === 2 ? Object.keys(teamData.portfolio)[0] : activeStocks[0]?.ticker;
                  const stock = activeStocks.find((entry) => entry.ticker === ticker);
                  if (!stock) { toast.info("Buy some practice shares before selling."); return; }
                  setOrderQty(index === 2 ? Math.min(2, teamData.portfolio[stock.ticker]) : 2);
                  setSellTargetMode(marketSellLocked ? "DIRECT_TEAM" : "MARKET_POOL");
                  setSellTargetTeamId("practice-comet");
                  setOrderError(null);
                  setOrderSuccess(null);
                  setOrderModal({ isOpen: true, stock, action: index === 2 ? "SELL" : "BUY" });
                }
                if (index === 3) setShowNewsDrawer(true);
                if (index === 4) {
                  setGiveTicker(Object.keys(teamData.portfolio)[0] || activeStocks[0]?.ticker || "");
                  setReceiveTicker("RILL-X");
                  setTargetTeamId("practice-comet");
                  setGiveQty(1);
                  setReceiveQty(2);
                  setSwapMessage(null);
                  setShowSwapModal(true);
                }
                if (index === 5) setShowAuditModal(true);
              }} className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${guideStep === index ? "border-[#FF5F1F] bg-[#FF5F1F]/15 text-[#FF5F1F]" : "border-[#27272a] text-[#a1a1aa] hover:text-white"}`}>
                {index + 1}. {step.title}
              </button>
            ))}
          </nav>
          <p className="mt-3 max-w-4xl text-xs text-[#d4d4d8] leading-relaxed" aria-live="polite">{PRACTICE_GUIDE[guideStep].text}</p>
        </section>
        </>
      )}

      {/* Live Continuous Marquee Ticker */}
      <PriceTickerMarquee stocks={activeStocks} speed={35} />

      {/* Main Terminal Grid (Full Widescreen Desktop + Adaptive Mobile Cards) */}
      <main className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 space-y-6">
        {/* Incoming 120s Direct Purchase Offers Alert */}
        {incomingDirectOffers.map((offer) => {
          const secondsRemaining = Math.max(0, Math.floor((offer.expiresAt - Date.now()) / 1000));
          const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / 120) * 100));

          return (
            <div
              key={offer.id}
              className="p-4 bg-gradient-to-r from-emerald-950/40 via-[#09090b] to-emerald-950/30 border-2 border-[#10B981]/50 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] space-y-3 relative overflow-hidden"
            >
              {/* Animated Progress Timer Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#18181b]">
                <div
                  className="h-full bg-gradient-to-r from-[#10B981] via-amber-400 to-[#FF5F1F] transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/50 flex items-center justify-center text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
                    <Handshake className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#10B981] text-black uppercase tracking-wider">
                        DIRECT P2P SELL OFFER
                      </span>
                      <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        <span>{secondsRemaining}s remaining</span>
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      <span className="text-[#FF5F1F]">{offer.sellerTeamName}</span> is offering to sell you{" "}
                      <strong className="text-white">{offer.quantity} shares</strong> of{" "}
                      <span className="text-[#10B981]">{offer.ticker}</span> @ {formatCurrency(offer.price)}!
                    </div>
                    <div className="text-[11px] text-[#a1a1aa]">
                      Total Purchase Value: <strong className="text-white">{formatCurrency(offer.total)}</strong> • Direct settlement from your cash balance.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={!tradingAllowed}
                    onClick={() => handleAcceptDirectSell(offer.id)}
                    className="px-4 py-2 bg-[#10B981] text-black font-extrabold text-xs uppercase rounded-lg hover:bg-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  >
                    Accept &amp; Buy ({formatCurrency(offer.total)})
                  </button>
                  <button
                    onClick={() => handleRejectDirectSell(offer.id)}
                    className="px-3 py-2 bg-[#18181b] border border-[#27272a] hover:border-rose-500 text-[#a1a1aa] hover:text-rose-400 text-xs font-bold rounded-lg transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Outgoing Pending Direct Sell Offers Notification */}
        {outgoingDirectOffers.map((offer) => {
          const secondsRemaining = Math.max(0, Math.floor((offer.expiresAt - Date.now()) / 1000));
          return (
            <div
              key={offer.id}
              className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl flex items-center justify-between text-xs text-[#d4d4d8]"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>
                  Outgoing Sell Offer to <strong className="text-white">{offer.buyerTeamName}</strong>:{" "}
                  <span className="text-[#FF5F1F] font-bold">{offer.quantity} {offer.ticker}</span> for{" "}
                  <strong className="text-[#10B981]">{formatCurrency(offer.total)}</strong>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">({secondsRemaining}s left)</span>
              </div>

              <button
                onClick={() => handleCancelDirectSell(offer.id)}
                className="text-[10px] text-[#71717a] hover:text-rose-400 underline font-semibold"
              >
                Cancel Offer
              </button>
            </div>
          );
        })}

        {/* Incoming Swap Toast Alert */}
        {incomingSwaps.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-amber-500/20 via-[#FF5F1F]/10 to-transparent border border-amber-500/40 rounded-xl animate-pulse-fast flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-white">
                  Incoming Trade Proposal from <span className="text-[#FF5F1F]">{incomingSwaps[0].senderTeam}</span>!
                </div>
                <div className="text-[11px] text-[#d4d4d8]">
                  Offer: You give <strong className="text-white">{incomingSwaps[0].receiveQty} {incomingSwaps[0].receiveTicker}</strong> ⇄ You receive <strong className="text-[#10B981]">{incomingSwaps[0].giveQty} {incomingSwaps[0].giveTicker}</strong>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={!tradingAllowed}
                onClick={() => handleSwapAction(incomingSwaps[0].id, "ACCEPT")}
                className="px-3 py-1.5 bg-[#10B981] text-black font-bold text-xs uppercase rounded-lg hover:bg-white"
              >
                Accept Swap
              </button>
              <button
                onClick={() => handleSwapAction(incomingSwaps[0].id, "REJECT")}
                className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] text-white text-xs uppercase rounded-lg hover:bg-red-950 hover:text-red-400"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Quantumanalytics Style KPI Header */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4">
          <KpiCard
            title="Available Cash"
            value={formatNumber(Math.floor(teamData.cashBalance))}
            subValue={`${formatCurrency(startingCash)} starting`}
            trend={teamData.cashBalance >= startingCash / 2 ? "up" : "down"}
            trendVal={`${((teamData.cashBalance / startingCash) * 100).toFixed(0)}% float`}
            isCurrency={true}
          />

          <KpiCard
            title="Holdings Valuation"
            value={formatNumber(Math.floor(teamData.holdingsValue))}
            subValue={`${Object.keys(teamData.portfolio).length} distinct equities`}
            trend="up"
            trendVal={`${Object.values(teamData.portfolio).reduce((a, b) => a + b, 0)} shares`}
            isCurrency={true}
          />

          <KpiCard
            title="Total Net Worth"
            value={formatNumber(Math.floor(teamData.totalPortfolioValue))}
            subValue={`${formatCurrency(startingCash)} baseline`}
            trend={teamData.pnl >= 0 ? "up" : "down"}
            trendVal={teamData.pnl >= 0 ? `+${teamData.pnlPercent.toFixed(1)}%` : `${teamData.pnlPercent.toFixed(1)}%`}
            isCurrency={true}
          />

          <KpiCard
            title="Total Profit / Loss"
            value={formatNumber(Math.floor(Math.abs(teamData.pnl)))}
            subValue={teamData.pnl >= 0 ? "Net Profit" : "Net Drawdown"}
            trend={teamData.pnl >= 0 ? "up" : "down"}
            trendVal={teamData.pnl >= 0 ? `+${formatCurrency(teamData.pnl)}` : `-${formatCurrency(Math.abs(teamData.pnl))}`}
            isCurrency={true}
          />
        </div>

        {/* Two Columns: Left Market Grid (7 cols), Expanded Right Sidebar (5 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Market Grid (7 cols in xl, full on mobile/tablet) */}
          <div className="xl:col-span-7 bg-[#09090b] border border-[#1e1e1e] rounded-xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-[#1e1e1e]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white uppercase flex items-center gap-2">
                  <span>Market Float & Order Book</span>
                  {gameState?.marketExpanded && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      30 Stocks Active
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#71717a]">
                  Fixed 100-share float limit per stock. Prices update at round resolution.
                </p>
              </div>

              <div className="text-[11px] text-[#a1a1aa] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <span>Active Universe: <strong className="text-white">{filteredActiveStocks.length} of {activeStocks.length} Stocks</strong></span>
              </div>
            </div>

            {/* REAL-TIME MARKET SEARCH & MULTI-SELECT SECTOR COMBOBOX */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#030303] border border-[#1e1e1e] p-2.5 rounded-lg">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter stocks by ticker, company, or sector..."
                  value={tableSearchQuery}
                  onChange={(e) => setTableSearchQuery(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] focus:border-[#FF5F1F] rounded-md pl-8 pr-7 py-1.5 text-xs text-white outline-none"
                />
                {tableSearchQuery && (
                  <button
                    onClick={() => setTableSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#71717a] hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Multi-Select Sector Combobox Dropdown */}
              <div className="relative w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSectorDropdownOpen((prev) => !prev)}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#09090b] border border-[#27272a] hover:border-[#FF5F1F] rounded-md text-xs text-white w-full sm:w-auto min-w-0 sm:min-w-[170px] transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Filter className="w-3.5 h-3.5 text-[#FF5F1F] shrink-0" />
                    <span className="truncate">
                      {selectedSectors.length === 0
                        ? `All Sectors (${uniqueSectors.length})`
                        : selectedSectors.length === 1
                        ? selectedSectors[0]
                        : `${selectedSectors.length} Sectors Active`}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
                </button>

                {isSectorDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-full sm:w-64 bg-[#09090b] border border-[#27272a] rounded-xl shadow-2xl p-2.5 z-30 space-y-2 font-mono">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#1e1e1e] text-[10px]">
                      <span className="font-bold text-[#71717a] uppercase">Filter by Sectors</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSectors([])}
                          className="text-[#FF5F1F] hover:underline"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSectors([])}
                          className="text-[#71717a] hover:text-white"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {uniqueSectors.map((sector) => {
                        const isSelected = selectedSectors.includes(sector);
                        const count = activeStocks.filter((s) => s.sector === sector).length;
                        return (
                          <label
                            key={sector}
                            className="flex items-center justify-between p-1.5 rounded hover:bg-[#18181b] cursor-pointer text-xs group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSectors([...selectedSectors, sector]);
                                  } else {
                                    setSelectedSectors(selectedSectors.filter((s) => s !== sector));
                                  }
                                }}
                                className="accent-[#FF5F1F] rounded"
                              />
                              <span className="truncate text-[#d4d4d8] group-hover:text-white text-[11px]">{sector}</span>
                            </div>
                            <span className="text-[10px] text-[#71717a] font-mono px-1 rounded bg-[#030303] border border-[#1e1e1e]">
                              {count}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 1. DESKTOP / TABLET WIDESCREEN TABLE (Visible on md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e1e1e] text-[10px] uppercase text-[#71717a]">
                    <th className="pb-3 font-medium">Asset</th>
                    <th className="pb-3 font-medium">Sector</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Round Δ</th>
                    <th className="pb-3 font-medium text-center">Float Left</th>
                    <th className="pb-3 font-medium text-center">Owned</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18181b]">
                  {filteredActiveStocks.map((stock) => {
                    const ownedQty = teamData.portfolio[stock.ticker] || 0;
                    const isUp = stock.roundChangePercent >= 0;
                    const isInspected = inspectedTicker === stock.ticker;

                    return (
                      <tr
                        key={stock.ticker}
                        onClick={() => setInspectedTicker(stock.ticker)}
                        className={`cursor-pointer transition-all ${
                          isInspected
                            ? "bg-[#FF5F1F]/10 text-white font-medium shadow-[inset_3px_0_0_#FF5F1F]"
                            : "hover:bg-[#18181b]/60"
                        }`}
                        title="Click row to inspect live L2 Order Book Depth"
                      >
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-2.5">
                            <CompanyLogo ticker={stock.ticker} size="md" />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{stock.ticker}</span>
                                {stock.entryRound === 2 && (
                                  <span title="R2 Expansion Stock">
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                  </span>
                                )}
                                {isInspected && (
                                  <span className="text-[8px] font-bold px-1 rounded bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/30">
                                    L2 ACTIVE
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#71717a] truncate max-w-[140px]">
                                {stock.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 text-[11px] text-[#a1a1aa]">{stock.sector}</td>

                        <td className="py-3 text-right font-bold text-white">
                          ${stock.currentPrice.toFixed(2)}
                        </td>

                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                              isUp ? "text-[#10B981]" : "text-[#F43F5E]"
                            }`}
                          >
                            {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {stock.roundChangePercent}%
                          </span>
                        </td>

                        <td className="py-3 text-center">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              stock.availableSupply === 0
                                ? "bg-red-950 text-red-400 border border-red-800"
                                : stock.availableSupply < 30
                                ? "bg-amber-950 text-amber-400 border border-amber-800"
                                : "bg-[#18181b] text-white border border-[#27272a]"
                            }`}
                          >
                            {stock.availableSupply} / 100
                          </span>
                        </td>

                        <td className="py-3 text-center">
                          <span className="font-bold text-[#FF5F1F]">
                            {ownedQty > 0 ? ownedQty : "—"}
                          </span>
                        </td>

                        <td className="py-3 text-right pr-2">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setOrderModal({ isOpen: true, stock, action: "BUY" });
                                setOrderQty(5);
                              }}
                              disabled={!tradingAllowed || stock.availableSupply === 0}
                              className="px-2.5 py-1 bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981] hover:text-black font-bold rounded text-[10px] uppercase transition-all disabled:opacity-30"
                            >
                              Buy
                            </button>
                            <button
                              onClick={() => {
                                setOrderModal({ isOpen: true, stock, action: "SELL" });
                                setOrderQty(Math.min(ownedQty || 1, 5));
                              }}
                              disabled={!tradingAllowed || ownedQty === 0}
                              className="px-2.5 py-1 bg-[#F43F5E]/15 text-[#F43F5E] hover:bg-[#F43F5E] hover:text-white font-bold rounded text-[10px] uppercase transition-all disabled:opacity-30"
                            >
                              Sell
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. MOBILE CARD GRID VIEW (Visible on screens < md) */}
            <div className="block md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredActiveStocks.map((stock) => {
                const ownedQty = teamData.portfolio[stock.ticker] || 0;
                const isUp = stock.roundChangePercent >= 0;
                const isInspected = inspectedTicker === stock.ticker;

                return (
                  <div
                    key={stock.ticker}
                    onClick={() => setInspectedTicker(stock.ticker)}
                    className={`p-3.5 bg-[#030303] border rounded-xl space-y-3 relative overflow-hidden transition-all shadow-md cursor-pointer ${
                      isInspected
                        ? "border-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)] bg-[#09090b]"
                        : "border-[#1e1e1e] hover:border-[#27272a]"
                    }`}
                  >
                    {/* Top Row: Logo, Ticker, Name, Price & Delta */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CompanyLogo ticker={stock.ticker} size="md" />
                        <div className="min-w-0">
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <span>{stock.ticker}</span>
                            {stock.entryRound === 2 && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                R2
                              </span>
                            )}
                            {isInspected && (
                              <span className="text-[8px] font-bold px-1 rounded bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/30">
                                L2
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#71717a] truncate max-w-[130px]">
                            {stock.name}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-white">
                          ${stock.currentPrice.toFixed(2)}
                        </div>
                        <div
                          className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
                            isUp ? "text-[#10B981]" : "text-[#F43F5E]"
                          }`}
                        >
                          {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {stock.roundChangePercent}%
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Sector, Float Left, Owned Badge */}
                    <div className="flex items-center justify-between text-[11px] bg-[#09090b] p-2 rounded-lg border border-[#18181b]">
                      <div className="text-[#71717a] text-[10px] truncate max-w-[110px]">
                        Sector: <span className="text-white font-medium">{stock.sector}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            stock.availableSupply === 0
                              ? "bg-red-950/60 text-red-400 border border-red-800"
                              : stock.availableSupply < 30
                              ? "bg-amber-950/60 text-amber-400 border border-amber-800"
                              : "bg-[#18181b] text-white border border-[#27272a]"
                          }`}
                        >
                          Float: {stock.availableSupply}/100
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FF5F1F]/15 text-[#FF5F1F] border border-[#FF5F1F]/30">
                          Owned: {ownedQty > 0 ? ownedQty : "0"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons (Large Touch Targets) */}
                    <div className="grid grid-cols-2 gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setOrderModal({ isOpen: true, stock, action: "BUY" });
                          setOrderQty(5);
                        }}
                        disabled={!tradingAllowed || stock.availableSupply === 0}
                        className="py-2.5 bg-[#10B981]/15 border border-[#10B981]/30 hover:bg-[#10B981] hover:text-black text-[#10B981] font-bold rounded-lg text-xs uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-1"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        Buy
                      </button>
                      <button
                        onClick={() => {
                          setOrderModal({ isOpen: true, stock, action: "SELL" });
                          setOrderQty(Math.min(ownedQty || 1, 5));
                        }}
                        disabled={!tradingAllowed || ownedQty === 0}
                        className="py-2.5 bg-[#F43F5E]/15 border border-[#F43F5E]/30 hover:bg-[#F43F5E] hover:text-white text-[#F43F5E] font-bold rounded-lg text-xs uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-1"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        Sell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Portfolio & Swap History (5 cols out of 12) */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6">
            {/* Holdings Summary Card */}
            <div className="bg-[#09090b] border border-[#1e1e1e] rounded-sm p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1e1e1e]">
                <span className="text-xs font-bold text-white uppercase">Your Stock Holdings</span>
                <span className="text-[10px] text-[#71717a]">
                  {Object.keys(teamData.portfolio).length} assets
                </span>
              </div>

              {Object.keys(teamData.portfolio).length === 0 ? (
                <div className="text-center py-6 text-xs text-[#71717a]">
                  No shares owned yet. Execute a BUY order or negotiate a P2P swap!
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(teamData.portfolio).map(([ticker, qty]) => {
                    const price = activeStocks.find((s) => s.ticker === ticker)?.currentPrice || 0;
                    const val = price * qty;
                    return (
                      <div
                        key={ticker}
                        className="p-2.5 bg-[#030303] border border-[#1e1e1e] rounded-sm flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-xs">{ticker}</div>
                          <div className="text-[10px] text-[#71717a]">{qty} shares @ ${price.toFixed(2)}</div>
                        </div>
                        <div className="text-right font-bold text-[#10B981] text-xs">
                          {formatCurrency(val)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Book Depth Visualizer (Real-time L2 Depth with Click-to-Inspect) */}
            <div className="bg-[#09090b] border border-[#1e1e1e] rounded-xl p-4 shadow-lg space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase">Order Book Depth (L2)</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FF5F1F]/20 text-[#FF5F1F] font-bold border border-[#FF5F1F]/30">
                    INSPECTING {activeStocks.find((s) => s.ticker === inspectedTicker)?.ticker || activeStocks[0]?.ticker || "NVDA"}
                  </span>
                </div>
                <span className="text-[10px] text-[#10B981] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  Live Float Sync
                </span>
              </div>
              <OrderBookDepth
                currentPrice={
                  activeStocks.find((s) => s.ticker === inspectedTicker)?.currentPrice ||
                  activeStocks[0]?.currentPrice ||
                  182.47
                }
                ticker={
                  activeStocks.find((s) => s.ticker === inspectedTicker)?.ticker ||
                  activeStocks[0]?.ticker ||
                  "NVDA"
                }
                name={
                  activeStocks.find((s) => s.ticker === inspectedTicker)?.name ||
                  activeStocks[0]?.name ||
                  "NVIDIA Corporation"
                }
                sector={
                  activeStocks.find((s) => s.ticker === inspectedTicker)?.sector ||
                  activeStocks[0]?.sector ||
                  "Semiconductors"
                }
                availableSupply={
                  activeStocks.find((s) => s.ticker === inspectedTicker)?.availableSupply !== undefined
                    ? activeStocks.find((s) => s.ticker === inspectedTicker)!.availableSupply
                    : activeStocks[0]?.availableSupply ?? 100
                }
                roundChangePercent={
                  activeStocks.find((s) => s.ticker === inspectedTicker)?.roundChangePercent ||
                  activeStocks[0]?.roundChangePercent ||
                  0
                }
              />
            </div>

            {/* Real-time Activity & Notifications Feed */}
            <NotificationsTimeline
              notifications={transactions.map((tx) => ({
                id: tx.id,
                who: tx.teamName,
                initials: tx.teamName.split(/\s+/).map((word: string) => word[0]).join("").slice(0, 2),
                what: tx.type === "SWAP" ? "completed a trade involving" : `executed a ${tx.type} on`,
                context: tx.type === "SWAP" ? tx.ticker : `${tx.quantity} ${tx.ticker} @ ${formatCurrency(tx.price)}`,
                time: tx.timestamp,
                type: tx.type === "SWAP" ? "SWAP" : "TRADE",
              }))}
            />

            {/* Recent Transaction Log */}
            <div className="bg-[#09090b] border border-[#1e1e1e] rounded-sm p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1e1e1e]">
                <span className="text-xs font-bold text-white uppercase">Live Audit Stream</span>
                <span className="text-[10px] text-[#10B981]">Realtime</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {transactions.slice(0, 8).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2 bg-[#030303] border border-[#18181b] rounded-sm text-[11px] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white">{tx.teamName}</span>{" "}
                      <span
                        className={
                          tx.type === "BUY"
                            ? "text-[#10B981]"
                            : tx.type === "SELL"
                            ? "text-[#F43F5E]"
                            : "text-[#3b82f6]"
                        }
                      >
                        {tx.type}
                      </span>{" "}
                      <span className="text-[#a1a1aa]">{tx.ticker}</span>
                    </div>
                    <span className="text-[10px] text-[#71717a]">{tx.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- ORDER EXECUTION MODAL WITH STOCK SELECTOR & STRICT SELL CHECKS --- */}
      {orderModal.isOpen && orderModal.stock && (
        <div className="modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
          <div className="modal-panel w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e1e1e]">
              <div className="flex items-center gap-2.5 min-w-0">
                <CompanyLogo ticker={orderModal.stock.ticker} size="md" />
                <div>
                  <div className="text-base font-bold text-white flex flex-wrap items-center gap-1.5">
                    <span>{orderModal.stock.ticker}</span>
                    <span className="text-[11px] text-[#71717a] font-normal">• {orderModal.stock.name}</span>
                  </div>
                  <div className="text-[10px] text-[#a1a1aa] uppercase">{orderModal.stock.sector}</div>
                </div>
              </div>
              <button
                onClick={() => setOrderModal({ isOpen: false, stock: null, action: "BUY" })}
                className="shrink-0 text-[#71717a] hover:text-white p-2 rounded hover:bg-[#18181b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher: BUY vs SELL */}
            {!tradingAllowed && <p role="status" className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300">Trading floor closed. Buying, selling, and swaps are locked until the host opens trading.</p>}
            <div role="status" className={`p-3 rounded-lg border text-xs leading-relaxed ${marketSellLocked ? "border-amber-500/40 bg-amber-500/5 text-amber-300" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"}`}>
              <p className="font-bold">Market-sale lock: {gameState?.marketSellLockEnabled ? "ENABLED" : "DISABLED"}</p>
              {gameState?.marketSellLockEnabled ? (
                <p className="mt-1">
                  Round {gameState.currentRound}: {peerTradeCount}/{REQUIRED_PEER_TRADES} qualifying peer trades.
                  {marketSellLocked ? ` Complete ${REQUIRED_PEER_TRADES - peerTradeCount} more direct trade(s) or accepted swap(s) to unlock market sales.` : " Market sales are unlocked for your team."}
                  {" "}Market buys are allowed and do not count toward unlocking.
                </p>
              ) : <p className="mt-1">You can sell to the market freely while trading is open.</p>}
            </div>
            <div className="flex bg-[#030303] p-1 border border-[#1e1e1e] rounded-lg">
              <button
                onClick={() => {
                  setOrderModal((prev) => ({ ...prev, action: "BUY" }));
                  setOrderQty(5);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                  orderModal.action === "BUY"
                    ? "bg-[#10B981] text-black shadow-md"
                    : "text-[#71717a] hover:text-white"
                }`}
              >
                Buy Shares
              </button>
              <button
                onClick={() => {
                  setOrderModal((prev) => ({ ...prev, action: "SELL" }));
                  const currentOwned = teamData?.portfolio[orderModal.stock?.ticker || ""] || 0;
                  setOrderQty(Math.min(currentOwned || 1, 5));
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                  orderModal.action === "SELL"
                    ? "bg-[#F43F5E] text-white shadow-md"
                    : "text-[#71717a] hover:text-white"
                }`}
              >
                Sell / Liquidate
              </button>
            </div>

            {/* Strict Block Sell Warning Banner if 0 Owned */}
            {orderModal.action === "SELL" && (teamData?.portfolio[orderModal.stock.ticker] || 0) === 0 && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-400 text-xs rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <div className="font-bold">Zero Shares Owned — Cannot Sell</div>
                  <div className="text-[11px] text-red-300/80 mt-0.5 leading-relaxed">
                    You own <strong>0 shares</strong> of <strong>{orderModal.stock.ticker}</strong>. Short selling is not allowed; you can only liquidate stocks currently in your portfolio.
                  </div>
                </div>
              </div>
            )}

            {/* Stock Chooser Dropdown */}
            <div>
              <label className="block text-[10px] text-[#71717a] uppercase mb-1 font-bold">
                {orderModal.action === "BUY" ? "Choose Stock to Buy" : "Choose Position to Sell"}
              </label>
              <select
                value={orderModal.stock.ticker}
                onChange={(e) => {
                  const nextStock = activeStocks.find((s) => s.ticker === e.target.value);
                  if (nextStock) {
                    setOrderModal((prev) => ({ ...prev, stock: nextStock }));
                    const owned = teamData?.portfolio[nextStock.ticker] || 0;
                    const maxQty =
                      orderModal.action === "BUY"
                        ? Math.max(1, nextStock.availableSupply)
                        : Math.max(1, owned || 1);
                    setOrderQty(Math.min(5, maxQty));
                  }
                }}
                className="w-full bg-[#030303] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg p-2.5 text-white outline-none text-xs"
              >
                {orderModal.action === "SELL" ? (
                  <>
                    <optgroup label="Your Owned Holdings">
                      {activeStocks
                        .filter((s) => (teamData?.portfolio[s.ticker] || 0) > 0)
                        .map((s) => (
                          <option key={s.ticker} value={s.ticker}>
                            {s.ticker} — {s.name} • [{teamData?.portfolio[s.ticker]} Shares Owned] (${s.currentPrice.toFixed(2)})
                          </option>
                        ))}
                    </optgroup>
                    {activeStocks.filter((s) => (teamData?.portfolio[s.ticker] || 0) === 0).length > 0 && (
                      <optgroup label="Other Equities (0 Owned - Locked)">
                        {activeStocks
                          .filter((s) => (teamData?.portfolio[s.ticker] || 0) === 0)
                          .map((s) => (
                            <option key={s.ticker} value={s.ticker} disabled>
                              {s.ticker} — {s.name} • [0 Owned - Cannot Sell]
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </>
                ) : (
                  activeStocks.map((s) => {
                    const owned = teamData?.portfolio[s.ticker] || 0;
                    return (
                      <option key={s.ticker} value={s.ticker}>
                        {s.ticker} — {s.name} (${s.currentPrice.toFixed(2)}) {owned > 0 ? `• [${owned} Owned]` : ""}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {orderError && (
              <div className="p-2.5 bg-red-950/50 border border-red-800 text-red-400 text-xs rounded-lg">
                {orderError}
              </div>
            )}

            {orderSuccess && (
              <div className="p-2.5 bg-emerald-950/50 border border-emerald-800 text-[#10B981] text-xs rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{orderSuccess}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#030303] border border-[#1e1e1e] rounded-lg">
                  <div className="text-[10px] text-[#71717a] uppercase">Current Price</div>
                  <div className="font-bold text-white text-sm mt-0.5">${orderModal.stock.currentPrice.toFixed(2)}</div>
                </div>
                <div className="p-2.5 bg-[#030303] border border-[#1e1e1e] rounded-lg">
                  <div className="text-[10px] text-[#71717a] uppercase">
                    {orderModal.action === "BUY" ? "Float Available" : "Shares Owned"}
                  </div>
                  <div className="font-bold text-[#FF5F1F] text-sm mt-0.5">
                    {orderModal.action === "BUY"
                      ? `${orderModal.stock.availableSupply} / 100`
                      : `${teamData?.portfolio[orderModal.stock.ticker] || 0} Shares`}
                  </div>
                </div>
              </div>

              <div className="py-1">
                <label className="block text-[10px] text-[#71717a] uppercase mb-2 text-center font-bold tracking-wider">
                  Select Share Quantity
                </label>
                <Stepper
                  value={orderQty}
                  min={1}
                  max={
                    orderModal.action === "BUY"
                      ? Math.max(1, orderModal.stock.availableSupply)
                      : Math.max(1, teamData?.portfolio[orderModal.stock.ticker] || 1)
                  }
                  onChange={setOrderQty}
                />
              </div>

              {/* Counterparty Team Selector for SELL action */}
              {orderModal.action === "SELL" && (
                <div className="p-3 bg-[#030303] border border-[#27272a] rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-[#FF5F1F] uppercase font-bold tracking-wider">
                      Sell Destination / Buyer Team
                    </label>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FF5F1F]/10 text-[#FF5F1F] font-bold">
                      120s P2P TRADE
                    </span>
                  </div>

                  {/* Mode selector: Direct Team vs Market Pool */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSellTargetMode("DIRECT_TEAM")}
                      className={`py-1.5 px-2 rounded text-[11px] font-bold transition-all ${
                        sellTargetMode === "DIRECT_TEAM"
                          ? "bg-[#FF5F1F] text-black shadow-sm"
                          : "bg-[#09090b] text-[#71717a] border border-[#1e1e1e] hover:text-white"
                      }`}
                    >
                      🤝 Direct to Team (120s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellTargetMode("MARKET_POOL")}
                      disabled={marketSellLocked}
                      title={marketSellLocked ? "Complete 2 peer trades this round to unlock market sales" : "Sell shares back to the market"}
                      className={`py-1.5 px-2 rounded text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        sellTargetMode === "MARKET_POOL"
                          ? "bg-[#27272a] text-white"
                          : "bg-[#09090b] text-[#71717a] border border-[#1e1e1e] hover:text-white"
                      }`}
                    >
                      🏛️ Market Pool
                    </button>
                  </div>

                  {sellTargetMode === "DIRECT_TEAM" && (
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[10px] text-[#71717a] uppercase font-bold">
                        Choose Counterparty Team to Buy These Shares:
                      </label>
                      <select
                        value={sellTargetTeamId}
                        onChange={(e) => setSellTargetTeamId(e.target.value)}
                        className="w-full bg-[#09090b] border border-[#27272a] focus:border-[#FF5F1F] rounded-lg px-3 py-2 text-white text-xs font-semibold outline-none"
                      >
                        <option value="">Select a buyer team...</option>
                        {allTeams
                          .filter((t) => t.id !== teamId)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.teamName} ({t.tableNumber || "Station"})
                            </option>
                          ))}
                      </select>
                      <p className="text-[10px] text-[#71717a] leading-tight">
                        *This sell request will be transmitted to the selected team with an active <strong>120-second countdown</strong>. If another team acquires these shares before they accept, this offer will automatically cancel.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM" && (
                <div className="p-3 rounded-lg border border-[#27272a] bg-[#030303] space-y-2">
                  <p className="text-xs font-bold text-[#FF5F1F]">Negotiated pricing: {gameState?.negotiatedPricesEnabled ? "ENABLED" : "DISABLED"}</p>
                  {gameState?.negotiatedPricesEnabled ? <>
                    <label htmlFor="direct-offer-price" className="block text-xs text-[#a1a1aa]">Offer price per share ($)</label>
                    <input id="direct-offer-price" type="number" inputMode="decimal" min="0.01" max="99999999.99" step="0.01" value={offerPriceDraft} onChange={(event) => setOfferPriceDraft(event.target.value)} className="w-full rounded-lg border border-[#27272a] px-3 py-2 bg-[#09090b] text-white text-sm" />
                    <p className="text-[10px] text-[#71717a]">Market reference: {formatCurrency(orderModal.stock.currentPrice)} per share. The buyer must accept your price; pending offers keep this price until they expire.</p>
                  </> : <p className="text-xs text-[#a1a1aa]">New direct offers use the current market price.</p>}
                </div>
              )}

              {orderModal.action === "SELL" && salePreview && (
                <div className="p-3 bg-[#030303] border border-[#27272a] rounded-lg space-y-2 text-xs">
                  <p className="text-[#a1a1aa]">Market commission: {gameState?.marketSellCommissionEnabled ? `${gameState.marketSellCommissionPercent}% enabled` : "disabled"}. {sellTargetMode === "DIRECT_TEAM" && "Direct sales are exempt."}</p>
                  <div className="flex justify-between"><span className="text-[#71717a]">Gross sale proceeds</span><span>{formatCurrency(salePreview.grossTotal)}</span></div>
                  <div className="flex justify-between"><span className="text-[#71717a]">Commission ({commissionPercent}%)</span><span className="text-rose-400">−{formatCurrency(salePreview.commissionAmount)}</span></div>
                </div>
              )}
              <div className="flex justify-between items-center p-3 bg-[#030303] border border-[#27272a] rounded-lg text-sm">
                <span className="text-[#71717a] uppercase text-xs font-semibold">{orderModal.action === "SELL" ? "Net Cash Received:" : "Total Order Value:"}</span>
                <span className="font-extrabold text-[#FF5F1F] text-base">
                  {formatCurrency(orderModal.action === "SELL" && salePreview ? salePreview.netTotal : orderModal.stock.currentPrice * orderQty)}
                </span>
              </div>

              <button
                onClick={handleExecuteOrder}
                disabled={
                  isSubmittingOrder || !tradingAllowed ||
                  (Boolean(negotiatedOffer) && !isValidPeerPrice(Number(offerPriceDraft))) ||
                  (orderModal.action === "SELL" && sellTargetMode === "MARKET_POOL" && marketSellLocked) ||
                  (orderModal.action === "BUY" && orderModal.stock.availableSupply === 0) ||
                  (orderModal.action === "SELL" && (!teamData?.portfolio[orderModal.stock.ticker] || teamData?.portfolio[orderModal.stock.ticker] === 0)) ||
                  (orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM" && !sellTargetTeamId)
                }
                className={`w-full py-3 font-bold uppercase rounded-lg text-xs tracking-wider transition-all ${
                  orderModal.action === "BUY"
                    ? "bg-[#10B981] text-black hover:bg-white"
                    : "bg-[#F43F5E] text-white hover:bg-white hover:text-black"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {isSubmittingOrder
                  ? "Transmitting Order..."
                  : !tradingAllowed
                  ? "Trading Closed — Orders Locked"
                  : orderModal.action === "SELL" && (!teamData?.portfolio[orderModal.stock.ticker] || teamData?.portfolio[orderModal.stock.ticker] === 0)
                  ? "Cannot Sell (0 Shares Owned)"
                  : orderModal.action === "SELL" && sellTargetMode === "MARKET_POOL" && marketSellLocked
                  ? "Market Sale Locked — Complete 2 Peer Trades"
                  : orderModal.action === "SELL" && sellTargetMode === "DIRECT_TEAM"
                  ? `Send 120s Sell Offer to ${allTeams.find((t) => t.id === sellTargetTeamId)?.teamName || "Selected Team"} →`
                  : `Confirm ${orderModal.action} (${orderQty} Shares of ${orderModal.stock.ticker})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PROPOSE P2P SWAP MODAL --- */}
      {showSwapModal && (
        <div className="modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
          <div className="modal-panel w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1e1e1e]">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-[#FF5F1F]" />
                <span className="text-sm font-bold text-white uppercase">Propose Bilateral Swap</span>
              </div>
              <button onClick={() => setShowSwapModal(false)} className="text-[#71717a] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {swapMessage && (
              <div className="mb-4 p-2.5 bg-[#030303] border border-[#27272a] text-xs text-white rounded-sm">
                {swapMessage}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-[#71717a] uppercase mb-1">Target Counterparty Team</label>
                <select
                  value={targetTeamId}
                  onChange={(e) => setTargetTeamId(e.target.value)}
                  className="w-full bg-[#030303] border border-[#27272a] rounded-sm px-3 py-2 text-white outline-none"
                >
                  <option value="">Select a team to trade with...</option>
                  {allTeams
                    .filter((t) => t.id !== teamId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.teamName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm space-y-2">
                  <label className="block text-[10px] text-[#F43F5E] uppercase font-bold mb-1">You Give</label>
                  <select
                    value={giveTicker}
                    onChange={(e) => setGiveTicker(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-sm px-2 py-1.5 text-white mb-2"
                  >
                    {Object.keys(teamData.portfolio).map((t) => (
                      <option key={t} value={t}>
                        {t} ({teamData.portfolio[t]} owned)
                      </option>
                    ))}
                  </select>
                  <Stepper
                    value={giveQty}
                    min={1}
                    max={Math.max(1, teamData.portfolio[giveTicker] || 1)}
                    onChange={setGiveQty}
                  />
                </div>

                <div className="p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm space-y-2">
                  <label className="block text-[10px] text-[#10B981] uppercase font-bold mb-1">You Receive</label>
                  <select
                    value={receiveTicker}
                    onChange={(e) => setReceiveTicker(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-sm px-2 py-1.5 text-white mb-2"
                  >
                    {activeStocks.map((s) => (
                      <option key={s.ticker} value={s.ticker}>
                        {s.ticker}
                      </option>
                    ))}
                  </select>
                  <Stepper
                    value={receiveQty}
                    min={1}
                    max={50}
                    onChange={setReceiveQty}
                  />
                </div>
              </div>

              <p className="text-[10px] text-[#71717a]">
                *No automated valuation. The recipient team will have 60 seconds to accept or decline.
              </p>

              <button
                onClick={handleProposeSwap}
                disabled={!tradingAllowed || !targetTeamId || !giveTicker || !receiveTicker}
                className="w-full py-2.5 bg-[#FF5F1F] text-black font-bold uppercase rounded-sm hover:bg-white transition-colors disabled:opacity-40"
              >
                {tradingAllowed ? "Send Trade Proposal" : "Trading Closed — Swaps Locked"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ANIMATED BREAKING NEWS INTEL SIDE SHEET --- */}
      <AnimatePresence>
        {showNewsDrawer && gameState?.roundInfo && (
          <div className="modal-overlay fixed inset-0 z-50 overflow-hidden font-mono">
            {/* Backdrop Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setShowNewsDrawer(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Slide-In Sheet from Right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 35 }}
              className="modal-panel modal-drawer absolute inset-y-0 right-0 w-full max-w-lg bg-[#09090b] border-l border-[#27272a] h-full p-6 overflow-y-auto flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] z-10"
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1e1e1e]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)]">
                      <Newspaper className="w-5 h-5 text-[#FF5F1F]" />
                    </div>
                    <div>
                      <div className="text-xs text-[#FF5F1F] font-bold tracking-wider">ROUND {gameState.currentRound} INTEL</div>
                      <div className="text-sm font-bold text-white">{gameState.roundInfo.title}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewsDrawer(false)}
                    className="p-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[#71717a] hover:text-white hover:border-[#FF5F1F] transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#a1a1aa] mb-3 px-1">
                  <span>Click any card to open full carousel view</span>
                  <button
                    onClick={() => {
                      setNewsCarouselIdx(0);
                      sounds.playTick();
                    }}
                    className="text-[#FF5F1F] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Open Carousel</span>
                    <span>↗</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {gameState.roundInfo.newsStories.map((story, idx) => (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + idx * 0.04 }}
                      onClick={() => {
                        setNewsCarouselIdx(idx);
                        sounds.playTick();
                      }}
                      className="p-4 bg-[#030303] border border-[#1e1e1e] hover:border-[#FF5F1F] rounded-xl space-y-2.5 shadow-sm transition-all cursor-pointer group hover:bg-[#09090b]/80 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#FF5F1F] px-2 py-0.5 rounded bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 group-hover:bg-[#FF5F1F] group-hover:text-black transition-colors">
                            DEVELOPMENT #{story.id}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#71717a] group-hover:text-[#FF5F1F] flex items-center gap-1 font-semibold transition-colors">
                          <span>Carousel View</span>
                          <span>↗</span>
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white group-hover:text-[#FF5F1F] transition-colors leading-relaxed">
                        {story.headline}
                      </p>
                      {gameState.currentRound === 0 && story.clueSummary && (
                        <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                          <span className="font-medium">Consider:</span> {story.clueSummary}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-[#1e1e1e] mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setNewsCarouselIdx(0);
                    sounds.playTick();
                  }}
                  className="flex-1 py-2.5 bg-[#FF5F1F] hover:bg-white text-black font-extrabold text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)] text-center"
                >
                  Launch Carousel Mode
                </button>
                <button
                  onClick={() => setShowNewsDrawer(false)}
                  className="px-4 py-2.5 bg-[#18181b] border border-[#27272a] hover:border-[#FF5F1F] text-white font-bold text-xs uppercase rounded-xl hover:bg-[#27272a] transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- INTERACTIVE ROUND NEWS CAROUSEL MODAL --- */}
      <AnimatePresence>
        {newsCarouselIdx !== null && gameState?.roundInfo?.newsStories && (
          <div className="modal-overlay fixed inset-0 z-[60] overflow-hidden font-mono flex items-center justify-center p-3 sm:p-6">
            {/* Dark Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNewsCarouselIdx(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="modal-panel relative w-full max-w-3xl bg-[#09090b] border-2 border-[#FF5F1F]/50 rounded-2xl p-5 sm:p-8 shadow-[0_0_80px_rgba(255,95,31,0.25)] z-10 flex flex-col justify-between max-h-[92vh] overflow-y-auto"
            >
              {(() => {
                const stories = gameState.roundInfo.newsStories;
                const safeIdx = Math.max(0, Math.min(newsCarouselIdx, stories.length - 1));
                const currentStory = stories[safeIdx];

                const handlePrev = () => {
                  setNewsCarouselIdx((safeIdx - 1 + stories.length) % stories.length);
                  sounds.playTick();
                };
                const handleNext = () => {
                  setNewsCarouselIdx((safeIdx + 1) % stories.length);
                  sounds.playTick();
                };

                return (
                  <div className="space-y-6">
                    {/* Top Header Bar */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#1e1e1e]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#FF5F1F]/15 border border-[#FF5F1F]/40 flex items-center justify-center text-[#FF5F1F] shadow-[0_0_15px_rgba(255,95,31,0.2)]">
                          <Newspaper className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-[#FF5F1F] font-bold tracking-wider uppercase">
                              ROUND {gameState.currentRound} INTEL CAROUSEL
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                              STORY {safeIdx + 1} OF {stories.length}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white">{gameState.roundInfo.title}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setNewsCarouselIdx(null)}
                        className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-[#71717a] hover:text-white hover:border-[#FF5F1F] transition-all"
                        title="Close Carousel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Active Story Card Container with slide animation */}
                    <div className="relative overflow-hidden py-2 min-h-[220px] flex flex-col justify-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentStory.id}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-[#FF5F1F] text-black font-extrabold text-xs uppercase tracking-wider rounded shadow-[0_0_15px_rgba(255,95,31,0.4)]">
                              DEVELOPMENT #{currentStory.id}
                            </span>
                          </div>

                          {/* Big Bold Headline */}
                          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight leading-snug">
                            {currentStory.headline}
                          </h2>

                          {gameState.currentRound === 0 && currentStory.clueSummary && (
                            <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
                              <span className="font-medium">Consider:</span> {currentStory.clueSummary}
                            </p>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Navigation Controller & Dot Indicators */}
                    <div className="pt-4 border-t border-[#1e1e1e] flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Left: Previous Button */}
                      <button
                        onClick={handlePrev}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#18181b] border border-[#27272a] hover:border-[#FF5F1F] hover:bg-[#27272a] text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group"
                      >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Previous Story</span>
                      </button>

                      {/* Center: Story Dots Matrix */}
                      <div className="flex items-center gap-2">
                        {stories.map((s, idx) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setNewsCarouselIdx(idx);
                              sounds.playTick();
                            }}
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              idx === safeIdx
                                ? "w-8 bg-[#FF5F1F] shadow-[0_0_10px_#FF5F1F]"
                                : "w-2.5 bg-[#27272a] hover:bg-[#52525b]"
                            }`}
                            title={`Jump to Development #${s.id}`}
                          />
                        ))}
                      </div>

                      {/* Right: Next Button */}
                      <button
                        onClick={handleNext}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#FF5F1F] hover:bg-white text-black font-extrabold text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)] group"
                      >
                        <span>Next Story</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TRADE SUMMARY JOURNAL MODAL --- */}
      {showJournalModal && (
        <div className="modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="modal-panel relative w-full max-w-xl">
            <button
              onClick={() => setShowJournalModal(false)}
              className="absolute top-2 right-2 z-50 p-2 bg-zinc-900 border border-zinc-700 text-white rounded-full hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
            <TradeSummary
              date={`OCT 1 • R${gameState?.currentRound || 0}`}
              trades={
                Object.keys(teamData.portfolio).length > 0
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
                  : []
              }
              onAddTrade={() => {
                setShowJournalModal(false);
                if (activeStocks.length > 0) {
                  setOrderModal({ isOpen: true, stock: activeStocks[0], action: "BUY" });
                }
              }}
            />
          </div>
        </div>
      )}

      {/* --- TRANSACTION LIST AUDIT MODAL --- */}
      {showAuditModal && (
        <div className="modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="modal-panel relative w-full max-w-xl">
            <button
              onClick={() => setShowAuditModal(false)}
              className="absolute top-2 right-2 z-50 p-2 bg-zinc-900 border border-zinc-700 text-white rounded-full hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
            <TransactionList
              transactions={
                transactions.map((tx, idx) => ({
                      id: tx.id || `tx-${idx}`,
                      icon:
                        tx.type === "BUY" ? (
                          <ArrowUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-rose-400" />
                        ),
                      name: `${tx.teamName || "Team"} • ${tx.ticker}`,
                      category: `${tx.type} Order`,
                      amount: `$${formatNumber(tx.total ?? tx.price * tx.quantity)}`,
                      grossTotal: tx.grossTotal,
                      commissionAmount: tx.commissionAmount,
                      commissionPercent: tx.commissionPercent,
                      date: demo ? "Practice session" : "Oct 1, 2026",
                      time: tx.timestamp || "Live",
                      transactionId: `TX-${tx.id?.slice(0, 8) || Math.random().toString(36).slice(2, 8)}`,
                      paymentMethod: "Trading Margin Float",
                      cardNumber: `${tx.quantity} Shares`,
                      cardType: tx.type || "BUY",
                    }))
              }
            />
          </div>
        </div>
      )}

      {/* --- UNIFIED FLOATING DOCK ACTION MENU WITH MORPHING SEARCH (Buy, Sell, Swap, Intel, Journal, Search) --- */}
      <FloatingDockMenu
        isFixed={true}
        menuWidth={360}
        searchSuggestions={
          activeStocks.map((s) => `${s.ticker} — ${s.name}`).slice(0, 10)
        }
        onSearch={(query) => {
          const cleanQuery = query.split("—")[0].trim();
          setTableSearchQuery(cleanQuery);
          const exactStock = activeStocks.find(
            (s) =>
              s.ticker.toLowerCase() === cleanQuery.toLowerCase() ||
              s.name.toLowerCase().includes(cleanQuery.toLowerCase())
          );
          if (exactStock) {
            setOrderModal({ isOpen: true, stock: exactStock, action: "BUY" });
            setOrderQty(5);
            toast.info(`Selected ${exactStock.ticker} for Quick Order`);
          } else if (cleanQuery) {
            toast.info(`Filtering market universe for "${cleanQuery}"`);
          }
        }}
        tabs={[
          {
            id: "trade",
            label: "Trade",
            icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
            menuItems: [
              {
                id: "quick-buy",
                label: "Execute Buy Order",
                sublabel: "Select equity & allocate cash",
                icon: <ArrowUp className="w-4 h-4 text-emerald-400" />,
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
                icon: <ArrowDown className="w-4 h-4 text-rose-400" />,
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
            icon: <ArrowLeftRight className="w-4 h-4 text-[#FF5F1F]" />,
            menuItems: [
              {
                id: "propose-swap",
                label: "Propose Bilateral Swap",
                sublabel: "Trade directly with other teams",
                icon: <ArrowLeftRight className="w-4 h-4 text-[#FF5F1F]" />,
                type: "action",
                onClick: () => {
                  setGiveTicker(Object.keys(teamData?.portfolio || {})[0] || activeStocks[0]?.ticker || "");
                  setReceiveTicker(activeStocks.find((stock) => stock.ticker !== Object.keys(teamData.portfolio)[0])?.ticker || activeStocks[0]?.ticker || "");
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
                  } else {
                    toast.info("No pending inbound swap proposals right now.");
                  }
                },
              },
            ],
          },
          {
            id: "intel",
            label: "Intel",
            icon: <Newspaper className="w-4 h-4 text-amber-400" />,
            menuItems: [
              {
                id: "round-news",
                label: `Round ${gameState?.currentRound || 0} Briefing`,
                sublabel: "Read breaking news & deduction hints",
                icon: <Newspaper className="w-4 h-4 text-amber-400" />,
                type: "action",
                onClick: () => setShowNewsDrawer(true),
              },
            ],
          },
          {
            id: "journal",
            label: "Journal",
            icon: <DollarSign className="w-4 h-4 text-cyan-400" />,
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
        ]}
      />
    </div>
  );
}

import { NextResponse } from "next/server";
import { getGameState } from "@/src/lib/db";
import { STOCKS_DATA, ROUNDS_DATA } from "@/src/lib/market-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId");

  const state = getGameState();

  // Automatically transition to TRADING_CLOSED when timer countdown hits 0
  if (state.status === "TRADING_OPEN" && state.tradingExpiresAt && Date.now() >= state.tradingExpiresAt) {
    state.status = "TRADING_CLOSED";
  }

  // Calculate team portfolios and leaderboards
  const teamsList = Object.values(state.teams).map((team) => {
    let holdingsValue = 0;
    Object.entries(team.portfolio).forEach(([ticker, qty]) => {
      const price = state.stockPrices[ticker] || 0;
      holdingsValue += price * qty;
    });
    const totalPortfolioValue = team.cashBalance + holdingsValue;
    const pnl = totalPortfolioValue - 100000;
    const pnlPercent = (pnl / 100000) * 100;

    return {
      id: team.id,
      teamName: team.teamName,
      passcode: team.passcode,
      tableNumber: team.tableNumber || `Table ${team.id.slice(0, 4)}`,
      members: team.members || [],
      cashBalance: team.cashBalance,
      portfolio: team.portfolio,
      holdingsValue,
      totalPortfolioValue,
      pnl,
      pnlPercent,
      isFrozen: team.isFrozen,
      isReady: team.isReady || false,
    };
  });

  // Sort leaderboard by highest portfolio value
  const leaderboard = [...teamsList].sort((a, b) => b.totalPortfolioValue - a.totalPortfolioValue);

  const defaultRoundData = ROUNDS_DATA.find((r) => r.round === state.currentRound) || ROUNDS_DATA[0];
  const customScenario = state.customScenarios?.[state.currentRound];
  const customShifts = state.customPriceShifts?.[state.currentRound] || {};

  const currentRoundData = {
    ...defaultRoundData,
    title: customScenario?.title || defaultRoundData.title,
    subtitle: customScenario?.subtitle || defaultRoundData.subtitle,
    newsStories: customScenario?.newsStories || defaultRoundData.newsStories,
    marketChanges: {
      ...defaultRoundData.marketChanges,
      ...customShifts,
    },
  };

  // Active stocks list based on whether Round 2 expansion is triggered or current round >= 2
  const activeStocks = STOCKS_DATA.filter((s) => {
    if (s.entryRound === 0) return true;
    return state.marketExpanded || state.currentRound >= 2;
  }).map((s) => ({
    ...s,
    currentPrice: state.stockPrices[s.ticker] || s.startingPrice,
    availableSupply: state.stockFloats[s.ticker] !== undefined ? state.stockFloats[s.ticker] : 100,
    roundChangePercent: customShifts[s.ticker] !== undefined ? customShifts[s.ticker] : (currentRoundData.marketChanges[s.ticker] || 0),
  }));

  // Auto-expire and auto-check direct sell offers
  const now = Date.now();
  (state.directSellOffers || []).forEach((offer) => {
    if (offer.status === "PENDING") {
      if (now >= offer.expiresAt) {
        offer.status = "EXPIRED";
      } else {
        const sellerShares = state.teams[offer.sellerTeamId]?.portfolio[offer.ticker] || 0;
        if (sellerShares < offer.quantity) {
          offer.status = "SOLD_OUT";
        }
      }
    }
  });

  const relevantDirectOffers = (state.directSellOffers || []).filter(
    (o) =>
      o.status === "PENDING" ||
      (teamId && (o.sellerTeamId === teamId || o.buyerTeamId === teamId))
  );

  const activeTeam = teamId ? teamsList.find((t) => t.id === teamId) || null : null;

  return NextResponse.json({
    gameState: {
      currentRound: state.currentRound,
      roundInfo: currentRoundData,
      status: state.status,
      tradingExpiresAt: state.tradingExpiresAt,
      marketExpanded: state.marketExpanded,
      leaderboardVisible: state.leaderboardVisible,
      stageAuditVisible: state.stageAuditVisible !== undefined ? state.stageAuditVisible : true,
      serverTime: Date.now(),
    },
    activeStocks,
    leaderboard,
    activeTeam,
    transactions: state.transactions.slice(-50).reverse(),
    swaps: state.swaps.filter((s) => s.status === "PENDING" || (teamId && (s.senderId === teamId || s.receiverId === teamId))),
    directSellOffers: relevantDirectOffers,
  });
}

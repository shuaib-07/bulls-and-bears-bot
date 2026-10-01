// Fictional practice data only. This module never imports or calls the live game.
import { getPeerTradeCount, recordPeerTrade, REQUIRED_PEER_TRADES } from "./peer-trades";
import { calculateMarketSale, isValidPeerPrice } from "./market-sale";
export const DEMO_TEAM_ID = "practice-you";
export const DEMO_STARTING_CASH = 25000;

interface PracticeTeam {
  id: string;
  teamName: string;
  tableNumber: string;
  cashBalance: number;
  portfolio: Record<string, number>;
  isFrozen: boolean;
  isReady: boolean;
  peerTradesByRound?: Record<number, number>;
}

interface PracticeTransaction {
  id: string;
  timestamp: string;
  round: number;
  teamName: string;
  type: "BUY" | "SELL" | "SWAP";
  ticker: string;
  quantity: number;
  price: number;
  total: number;
  counterparty?: string;
  grossTotal?: number;
  commissionAmount?: number;
  commissionPercent?: number;
}

interface PracticeSwap {
  id: string;
  senderId: string;
  senderTeam: string;
  receiverId: string;
  receiverTeam: string;
  giveTicker: string;
  giveQty: number;
  receiveTicker: string;
  receiveQty: number;
  status: string;
  expiresAt: number;
}

interface PracticeOffer {
  id: string;
  sellerTeamId: string;
  sellerTeamName: string;
  buyerTeamId: string;
  buyerTeamName: string;
  ticker: string;
  quantity: number;
  price: number;
  total: number;
  status: string;
  expiresAt: number;
}

export function createDemoMarket() {
  const stocks = [
    { ticker: "LUMA-X", name: "Luma Lantern Works", sector: "Light systems", startingPrice: 74 },
    { ticker: "BRIK-X", name: "Brik Workshop Co.", sector: "Workshop supplies", startingPrice: 130 },
    { ticker: "RILL-X", name: "Rill Water Networks", sector: "Water networks", startingPrice: 92 },
    { ticker: "POD-X", name: "Pod Parcel Labs", sector: "Delivery pods", startingPrice: 58 },
    { ticker: "QUIL-X", name: "Quil Learning Studio", sector: "Learning tools", startingPrice: 165 },
    { ticker: "SPRO-X", name: "Spro Kitchen Gardens", sector: "Food labs", startingPrice: 43 },
  ].map((stock) => ({ ...stock, currentPrice: stock.startingPrice, availableSupply: 100, roundChangePercent: 0, entryRound: 0 }));
  const teams: Record<string, PracticeTeam> = {
    [DEMO_TEAM_ID]: { id: DEMO_TEAM_ID, teamName: "Your Practice Crew", tableNumber: "Practice desk", cashBalance: 24110, portfolio: { "LUMA-X": 5, "BRIK-X": 4 }, isFrozen: false, isReady: true },
    "practice-comet": { id: "practice-comet", teamName: "Comet Crew (Bot)", tableNumber: "Fictional desk A", cashBalance: 23100, portfolio: { "RILL-X": 10, "POD-X": 10, "LUMA-X": 5, "BRIK-X": 2, "QUIL-X": 5, "SPRO-X": 10 }, isFrozen: false, isReady: true },
    "practice-moss": { id: "practice-moss", teamName: "Moss Club (Bot)", tableNumber: "Fictional desk B", cashBalance: 22750, portfolio: { "LUMA-X": 10, "BRIK-X": 10, "RILL-X": 5, "POD-X": 5, "QUIL-X": 5, "SPRO-X": 10 }, isFrozen: false, isReady: true },
  };
  Object.values(teams).forEach((team) => {
    const holdings = stocks.reduce((total, stock) => total + stock.currentPrice * (team.portfolio[stock.ticker] || 0), 0);
    team.cashBalance = DEMO_STARTING_CASH - holdings;
  });
  stocks.forEach((stock) => {
    stock.availableSupply -= Object.values(teams).reduce((total, team) => total + (team.portfolio[stock.ticker] || 0), 0);
  });
  return {
    stocks, teams,
    gameState: {
      currentRound: 1,
      roundInfo: {
        round: 1, title: "Practice: The Lantern Festival", subtitle: "Entirely fictional practice scenario", durationMinutes: 15,
        newsStories: [
          { id: 1, headline: "The imaginary city of Pebblewick doubles its order for reusable festival lanterns.", sector: "", clueSummary: "" },
          { id: 2, headline: "A new footbridge closes the delivery shortcut used by local parcel pods.", sector: "", clueSummary: "" },
          { id: 3, headline: "Festival kitchens reserve rooftop garden harvests for the next three weekends.", sector: "", clueSummary: "" },
          { id: 4, headline: "Pebblewick workshops postpone equipment purchases while awaiting a design contest result.", sector: "", clueSummary: "" },
        ],
      },
      status: "TRADING_OPEN" as const, tradingExpiresAt: null,
      marketExpanded: false, leaderboardVisible: false, serverTime: Date.now(), marketSellLockEnabled: true, marketSellCommissionEnabled: true, marketSellCommissionPercent: 2.5, negotiatedPricesEnabled: true,
    },
    transactions: [] as PracticeTransaction[],
    swaps: [] as PracticeSwap[],
    directSellOffers: [] as PracticeOffer[],
    sequence: 0,
  };
}

export type DemoMarket = ReturnType<typeof createDemoMarket>;

export function requestDemo(market: DemoMarket, url: string, init?: RequestInit): Response {
  const path = url.split("?")[0];
  const ok = (extra: object = {}) => Response.json({ success: true, message: "Practice action completed.", ...extra });
  const fail = (error: string) => Response.json({ error }, { status: 400 });
  const id = () => `practice-${++market.sequence}`;
  const team = market.teams[DEMO_TEAM_ID];
  const record = (type: PracticeTransaction["type"], ticker: string, quantity: number, price: number, counterparty?: string) => {
    market.transactions.unshift({ id: id(), timestamp: new Date().toLocaleTimeString(), round: 1, teamName: team.teamName, type, ticker, quantity, price, total: type === "SWAP" ? 0 : quantity * price, counterparty });
  };

  if (path === "/api/state") {
    const now = Date.now();
    [...market.swaps, ...market.directSellOffers].forEach((offer) => {
      if (offer.status === "PENDING" && offer.expiresAt <= now) offer.status = "EXPIRED";
    });
    const leaderboard = Object.values(market.teams).map((entry) => {
      const holdingsValue = market.stocks.reduce((total, stock) => total + (entry.portfolio[stock.ticker] || 0) * stock.currentPrice, 0);
      const totalPortfolioValue = entry.cashBalance + holdingsValue;
      const pnl = totalPortfolioValue - DEMO_STARTING_CASH;
      return { ...entry, holdingsValue, totalPortfolioValue, pnl, pnlPercent: pnl / DEMO_STARTING_CASH * 100, qualifyingPeerTrades: getPeerTradeCount(entry, 1), marketSellLocked: market.gameState.marketSellLockEnabled && getPeerTradeCount(entry, 1) < REQUIRED_PEER_TRADES };
    });
    return Response.json({ gameState: { ...market.gameState, serverTime: now }, activeStocks: market.stocks, activeTeam: leaderboard.find((entry) => entry.id === DEMO_TEAM_ID), leaderboard, transactions: market.transactions, swaps: market.swaps.filter((offer) => offer.status === "PENDING"), directSellOffers: market.directSellOffers });
  }

  const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
  if (path === "/api/trade") {
    if (["ACCEPT_DIRECT_SELL", "REJECT_DIRECT_SELL", "CANCEL_DIRECT_SELL"].includes(body.action)) {
      const offer = market.directSellOffers.find((entry) => entry.id === body.offerId);
      if (!offer || offer.status !== "PENDING" || offer.expiresAt <= Date.now()) return fail("This practice offer is no longer available.");
      if (body.action !== "ACCEPT_DIRECT_SELL") {
        offer.status = body.action === "CANCEL_DIRECT_SELL" ? "CANCELLED" : "REJECTED";
        return ok();
      }
      const seller = market.teams[offer.sellerTeamId];
      if (team.cashBalance < offer.total || (seller.portfolio[offer.ticker] || 0) < offer.quantity) return fail("Not enough cash or shares to complete this practice offer.");
      team.cashBalance -= offer.total;
      seller.cashBalance += offer.total;
      seller.portfolio[offer.ticker] -= offer.quantity;
      team.portfolio[offer.ticker] = (team.portfolio[offer.ticker] || 0) + offer.quantity;
      offer.status = "ACCEPTED";
      recordPeerTrade(team, 1);
      recordPeerTrade(seller, 1);
      record("BUY", offer.ticker, offer.quantity, offer.price, seller.teamName);
      return ok();
    }
    const stock = market.stocks.find((entry) => entry.ticker === body.ticker);
    const qty = Number(body.quantity);
    if (!stock || !Number.isInteger(qty) || qty <= 0) return fail("Choose a practice stock and a positive whole number of shares.");
    const total = stock.currentPrice * qty;
    if (body.action === "BUY") {
      if (qty > stock.availableSupply) return fail("The practice market does not have enough shares available.");
      if (total > team.cashBalance) return fail("Not enough practice cash for this order.");
      team.cashBalance -= total;
      team.portfolio[stock.ticker] = (team.portfolio[stock.ticker] || 0) + qty;
      stock.availableSupply -= qty;
      record("BUY", stock.ticker, qty, stock.currentPrice);
      return ok();
    }
    if (body.action === "SELL") {
      if ((team.portfolio[stock.ticker] || 0) < qty) return fail("You can only sell practice shares you own.");
      const buyer = market.teams[body.targetTeamId];
      if (body.targetTeamId !== "MARKET_POOL" && !buyer) return fail("Choose a practice buyer.");
      if (buyer && body.pricePerShare !== undefined && !isValidPeerPrice(body.pricePerShare)) return fail("Enter a positive offer price with up to two decimal places.");
      const price = buyer && market.gameState.negotiatedPricesEnabled && body.pricePerShare !== undefined ? body.pricePerShare : stock.currentPrice;
      const offerTotal = Math.round(price * qty * 100) / 100;
      if (buyer && offerTotal > buyer.cashBalance) return fail("That practice bot does not have enough cash.");
      if (!buyer && market.gameState.marketSellLockEnabled && getPeerTradeCount(team, 1) < REQUIRED_PEER_TRADES) return fail("Complete two practice trades with other teams to unlock market sales, or turn off the practice sale lock.");
      team.portfolio[stock.ticker] -= qty;
      if (!team.portfolio[stock.ticker]) delete team.portfolio[stock.ticker];
      const percent = !buyer && market.gameState.marketSellCommissionEnabled ? market.gameState.marketSellCommissionPercent : 0;
      const sale = calculateMarketSale(price, qty, percent);
      team.cashBalance = Number((team.cashBalance + sale.netTotal).toFixed(2));
      if (buyer) {
        buyer.cashBalance = Number((buyer.cashBalance - offerTotal).toFixed(2));
        buyer.portfolio[stock.ticker] = (buyer.portfolio[stock.ticker] || 0) + qty;
        recordPeerTrade(team, 1);
        recordPeerTrade(buyer, 1);
      } else stock.availableSupply += qty;
      record("SELL", stock.ticker, qty, price, buyer?.teamName);
      if (!buyer) Object.assign(market.transactions[0], { grossTotal: sale.grossTotal, commissionAmount: sale.commissionAmount, commissionPercent: percent, total: sale.netTotal });
      return ok({ sale, message: buyer ? "Practice bot accepted your direct sale. Shares and cash updated." : `Practice market sale complete. Commission: $${sale.commissionAmount.toFixed(2)}; net received: $${sale.netTotal.toFixed(2)}.` });
    }
  }

  if (path === "/api/swap") {
    if (body.action === "PROPOSE") {
      const bot = market.teams[body.receiverId];
      const give = Number(body.giveQty), receive = Number(body.receiveQty);
      if (!bot || bot.id === team.id || !Number.isInteger(give) || give <= 0 || !Number.isInteger(receive) || receive <= 0) return fail("Choose a practice bot and positive whole-number quantities.");
      if ((team.portfolio[body.giveTicker] || 0) < give || (bot.portfolio[body.receiveTicker] || 0) < receive) return fail("Both sides need to own the offered practice shares.");
      team.portfolio[body.giveTicker] -= give;
      bot.portfolio[body.giveTicker] = (bot.portfolio[body.giveTicker] || 0) + give;
      bot.portfolio[body.receiveTicker] -= receive;
      team.portfolio[body.receiveTicker] = (team.portfolio[body.receiveTicker] || 0) + receive;
      if (!team.portfolio[body.giveTicker]) delete team.portfolio[body.giveTicker];
      recordPeerTrade(team, 1);
      recordPeerTrade(bot, 1);
      record("SWAP", `${give} ${body.giveTicker} ⇄ ${receive} ${body.receiveTicker}`, give, 0, bot.teamName);
      return ok({ message: "Practice bot accepted your swap. In the competition, the other team chooses whether to accept." });
    }
    const swap = market.swaps.find((entry) => entry.id === body.swapId);
    if (!swap || swap.status !== "PENDING" || swap.expiresAt <= Date.now()) return fail("This practice swap has expired.");
    if (body.action === "REJECT") { swap.status = "REJECTED"; return ok(); }
    if (body.action === "ACCEPT") {
      const bot = market.teams[swap.senderId];
      if ((team.portfolio[swap.receiveTicker] || 0) < swap.receiveQty || (bot.portfolio[swap.giveTicker] || 0) < swap.giveQty) return fail("Both sides need to own the offered practice shares.");
      team.portfolio[swap.receiveTicker] -= swap.receiveQty;
      bot.portfolio[swap.receiveTicker] = (bot.portfolio[swap.receiveTicker] || 0) + swap.receiveQty;
      bot.portfolio[swap.giveTicker] -= swap.giveQty;
      team.portfolio[swap.giveTicker] = (team.portfolio[swap.giveTicker] || 0) + swap.giveQty;
      if (!team.portfolio[swap.receiveTicker]) delete team.portfolio[swap.receiveTicker];
      swap.status = "ACCEPTED";
      recordPeerTrade(team, 1);
      recordPeerTrade(bot, 1);
      record("SWAP", `${swap.receiveQty} ${swap.receiveTicker} ⇄ ${swap.giveQty} ${swap.giveTicker}`, swap.receiveQty, 0, bot.teamName);
      return ok();
    }
  }
  return fail("This action is unavailable in the practice terminal.");
}

export function addDemoOffers(market: DemoMarket) {
  const bot = market.teams["practice-comet"];
  market.swaps.push({ id: `practice-swap-${++market.sequence}`, senderId: bot.id, senderTeam: bot.teamName, receiverId: DEMO_TEAM_ID, receiverTeam: market.teams[DEMO_TEAM_ID].teamName, giveTicker: "RILL-X", giveQty: 2, receiveTicker: "LUMA-X", receiveQty: 1, status: "PENDING", expiresAt: Date.now() + 60000 });
  market.directSellOffers.push({ id: `practice-offer-${++market.sequence}`, sellerTeamId: bot.id, sellerTeamName: bot.teamName, buyerTeamId: DEMO_TEAM_ID, buyerTeamName: market.teams[DEMO_TEAM_ID].teamName, ticker: "POD-X", quantity: 2, price: 58, total: 116, status: "PENDING", expiresAt: Date.now() + 120000 });
}

export function applyDemoPriceMove(market: DemoMarket) {
  const changes = [12, -7, 3, -9, 5, 8];
  market.stocks.forEach((stock, index) => {
    stock.roundChangePercent = changes[index];
    stock.currentPrice = Number((stock.startingPrice * (1 + changes[index] / 100)).toFixed(2));
  });
}

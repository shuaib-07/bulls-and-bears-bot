import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { STOCKS_DATA, ROUNDS_DATA } from "../market-data";
import { recordPeerTrade } from "../peer-trades";
import type { ScoresAnnouncement } from "../final-scores";
import { randomUUID } from "node:crypto";
import { gameStateContext } from "./context";

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "";

export const db = connectionString ? drizzle(neon(connectionString), { schema }) : null;

// --- IN-MEMORY FALLBACK STORE (Allows instant run out-of-the-box and local zero-config play) ---

export interface TeamMember {
  id: string;
  name: string;
  rollNo?: string;
  phone?: string;
  role?: string; // Leader, Analyst, Trader, Member
}

export interface MemoryTeam {
  id: string;
  teamName: string;
  passcode: string;
  cashBalance: number;
  isFrozen: boolean;
  isReady?: boolean;
  tableNumber?: string;
  members?: TeamMember[];
  portfolio: Record<string, number>; // ticker -> qty
  peerTradesByRound?: Record<number, number>;
}

export interface DirectSellOffer {
  id: string;
  sellerTeamId: string;
  sellerTeamName: string;
  buyerTeamId: string;
  buyerTeamName: string;
  ticker: string;
  quantity: number;
  price: number;
  total: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "SOLD_OUT" | "CANCELLED";
  expiresAt: number; // 120-second countdown timestamp
  createdAt: number;
  round?: number;
}

export interface MemoryGameState {
  simulationId: string;
  databaseRevision?: number;
  currentRound: number;
  status: "SETUP" | "NEWS_RELEASED" | "TRADING_OPEN" | "TRADING_CLOSED" | "FINISHED";
  tradingExpiresAt: number | null; // unix timestamp ms
  marketExpanded: boolean;
  leaderboardVisible: boolean;
  stageAuditVisible?: boolean;
  marketSellLockEnabled?: boolean;
  marketSellCommissionEnabled?: boolean;
  marketSellCommissionPercent?: number;
  negotiatedPricesEnabled?: boolean;
  scoresAnnouncement?: ScoresAnnouncement | null;
  stockPrices: Record<string, number>;
  stockFloats: Record<string, number>; // remaining available float
  customScenarios?: Record<number, {
    title?: string;
    subtitle?: string;
    newsStories?: Array<{ id: number; headline: string; sector: string; clueSummary: string }>;
  }>;
  customPriceShifts?: Record<number, Record<string, number>>; // round -> { ticker -> percentChange }
  teams: Record<string, MemoryTeam>;
  transactions: Array<{
    id: string;
    timestamp: string;
    round: number;
    teamId?: string;
    teamName: string;
    type: "BUY" | "SELL" | "SWAP" | "DIRECT_SELL" | "LIQUIDATION";
    ticker: string;
    quantity: number;
    price: number;
    total: number;
    counterparty?: string;
    counterpartyTeamId?: string;
    grossTotal?: number;
    commissionAmount?: number;
    commissionPercent?: number;
  }>;
  swaps: Array<{
    id: string;
    senderId: string;
    senderTeam: string;
    receiverId: string;
    receiverTeam: string;
    giveTicker: string;
    giveQty: number;
    receiveTicker: string;
    receiveQty: number;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
    expiresAt: number;
    createdAt: number;
    round?: number;
  }>;
  directSellOffers: DirectSellOffer[];
}

// Global in-memory singleton
const globalStore = globalThis as unknown as { __bullsBearsStore?: MemoryGameState };

export function getInitialGameState(): MemoryGameState {
  const stockPrices: Record<string, number> = {};
  const stockFloats: Record<string, number> = {};

  STOCKS_DATA.forEach((s) => {
    stockPrices[s.ticker] = s.prices.start;
    stockFloats[s.ticker] = 100; // 100 shares float limit
  });

  return {
    simulationId: randomUUID(),
    currentRound: 0,
    status: "SETUP",
    tradingExpiresAt: null,
    marketExpanded: false,
    leaderboardVisible: false,
    stageAuditVisible: true,
    marketSellLockEnabled: true,
    marketSellCommissionEnabled: true,
    marketSellCommissionPercent: 5,
    negotiatedPricesEnabled: true,
    scoresAnnouncement: null,
    stockPrices,
    stockFloats,
    customScenarios: {},
    customPriceShifts: {},
    directSellOffers: [],
    teams: {},
    transactions: [],
    swaps: [],
  };
}

export function getGameState(): MemoryGameState {
  if (!globalStore.__bullsBearsStore) {
    globalStore.__bullsBearsStore = getInitialGameState();
  }
  const state = gameStateContext.getStore() || globalStore.__bullsBearsStore;
  state.simulationId ??= randomUUID();
  state.marketSellLockEnabled ??= true;
  state.marketSellCommissionEnabled ??= true;
  state.marketSellCommissionPercent ??= 5;
  state.negotiatedPricesEnabled ??= true;
  const teamsByName = new Map(Object.values(state.teams).map((team) => [team.teamName, team]));

  // Migrate older name-only records and remove records belonging to deleted teams.
  state.transactions = state.transactions.filter((tx) => {
    const legacyName = tx.teamName.includes(" ➔ ") ? tx.teamName.split(" ➔ ").at(-1)! : tx.teamName;
    const team = tx.teamId ? state.teams[tx.teamId] : teamsByName.get(legacyName);
    const counterparty = tx.counterpartyTeamId
      ? state.teams[tx.counterpartyTeamId]
      : tx.counterparty ? teamsByName.get(tx.counterparty) : undefined;
    if (!team || ((tx.counterpartyTeamId || tx.counterparty) && !counterparty)) return false;
    tx.teamId = team.id;
    tx.teamName = team.teamName;
    if (counterparty) {
      tx.counterpartyTeamId = counterparty.id;
      tx.counterparty = counterparty.teamName;
    }
    return true;
  });
  state.swaps = state.swaps.filter((swap) => {
    const sender = state.teams[swap.senderId];
    const receiver = state.teams[swap.receiverId];
    if (!sender || !receiver) return false;
    swap.senderTeam = sender.teamName;
    swap.receiverTeam = receiver.teamName;
    if (swap.status === "PENDING" && swap.round !== undefined && swap.round !== state.currentRound) swap.status = "CANCELLED";
    return true;
  });
  state.directSellOffers = (state.directSellOffers || []).filter((offer) => {
    const seller = state.teams[offer.sellerTeamId];
    const buyer = state.teams[offer.buyerTeamId];
    if (!seller || !buyer) return false;
    offer.sellerTeamName = seller.teamName;
    offer.buyerTeamName = buyer.teamName;
    if (offer.status === "PENDING" && offer.round !== undefined && offer.round !== state.currentRound) offer.status = "CANCELLED";
    return true;
  });
  // Preserve credit for completed peer trades in sessions created before this rule.
  Object.values(state.teams).forEach((team) => {
    if (team.peerTradesByRound) return;
    team.peerTradesByRound = {};
    state.transactions.forEach((tx) => {
      if ((tx.type === "SWAP" || tx.type === "DIRECT_SELL") && tx.counterpartyTeamId && (tx.teamId === team.id || tx.counterpartyTeamId === team.id)) {
        recordPeerTrade(team, tx.round);
      }
    });
  });
  return state;
}

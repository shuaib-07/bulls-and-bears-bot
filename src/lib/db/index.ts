import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { STOCKS_DATA, ROUNDS_DATA } from "../market-data";

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
}

export interface MemoryGameState {
  currentRound: number;
  status: "SETUP" | "NEWS_RELEASED" | "TRADING_OPEN" | "TRADING_CLOSED" | "FINISHED";
  tradingExpiresAt: number | null; // unix timestamp ms
  marketExpanded: boolean;
  leaderboardVisible: boolean;
  stageAuditVisible?: boolean;
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
    teamName: string;
    type: "BUY" | "SELL" | "SWAP" | "LIQUIDATION";
    ticker: string;
    quantity: number;
    price: number;
    total: number;
    counterparty?: string;
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
    currentRound: 0,
    status: "SETUP",
    tradingExpiresAt: null,
    marketExpanded: false,
    leaderboardVisible: false,
    stageAuditVisible: true,
    stockPrices,
    stockFloats,
    customScenarios: {},
    customPriceShifts: {},
    directSellOffers: [],
    teams: {
      "demo-alpha": {
        id: "demo-alpha",
        teamName: "Alpha Capital",
        passcode: "1234",
        cashBalance: 100000,
        isFrozen: false,
        tableNumber: "Table 1",
        members: [
          { id: "m-1", name: "Aarav Sharma", rollNo: "RUAS22DS01", phone: "9876543210", role: "Leader" },
          { id: "m-2", name: "Priya Patel", rollNo: "RUAS22DS02", phone: "9876543211", role: "Analyst" },
          { id: "m-3", name: "Rohan Nair", rollNo: "RUAS22DS03", phone: "9876543212", role: "Trader" },
        ],
        portfolio: { NVDA: 20, AAPL: 15, MSFT: 10 },
      },
      "demo-beta": {
        id: "demo-beta",
        teamName: "Beta Quant",
        passcode: "5678",
        cashBalance: 85000,
        isFrozen: false,
        tableNumber: "Table 2",
        members: [
          { id: "m-4", name: "Vikram Reddy", rollNo: "RUAS22DS04", phone: "9876543213", role: "Leader" },
          { id: "m-5", name: "Sneha Rao", rollNo: "RUAS22DS05", phone: "9876543214", role: "Trader" },
        ],
        portfolio: { TSLA: 25, JPM: 30, XOM: 40 },
      },
      "demo-gamma": {
        id: "demo-gamma",
        teamName: "Gamma Ventures",
        passcode: "9012",
        cashBalance: 92000,
        isFrozen: false,
        tableNumber: "Table 3",
        members: [
          { id: "m-6", name: "Aditya Kumar", rollNo: "RUAS22DS06", phone: "9876543215", role: "Leader" },
          { id: "m-7", name: "Ananya Iyer", rollNo: "RUAS22DS07", phone: "9876543216", role: "Analyst" },
        ],
        portfolio: { AMD: 35, V: 15, GOOGL: 20 },
      },
    },
    transactions: [
      {
        id: "tx-init-1",
        timestamp: new Date().toLocaleTimeString(),
        round: 0,
        teamName: "Alpha Capital",
        type: "BUY",
        ticker: "NVDA",
        quantity: 20,
        price: 180,
        total: 3600,
      },
    ],
    swaps: [],
  };
}

export function getGameState(): MemoryGameState {
  if (!globalStore.__bullsBearsStore) {
    globalStore.__bullsBearsStore = getInitialGameState();
  }
  return globalStore.__bullsBearsStore;
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.getInitialGameState = getInitialGameState;
exports.getGameState = getGameState;
const serverless_1 = require("@neondatabase/serverless");
const neon_http_1 = require("drizzle-orm/neon-http");
const schema = __importStar(require("./schema"));
const market_data_1 = require("../market-data");
const peer_trades_1 = require("../peer-trades");
const node_crypto_1 = require("node:crypto");
const context_1 = require("./context");
const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "";
exports.db = connectionString ? (0, neon_http_1.drizzle)((0, serverless_1.neon)(connectionString), { schema }) : null;
// Global in-memory singleton
const globalStore = globalThis;
function getInitialGameState() {
    const stockPrices = {};
    const stockFloats = {};
    market_data_1.STOCKS_DATA.forEach((s) => {
        stockPrices[s.ticker] = s.prices.start;
        stockFloats[s.ticker] = 100; // 100 shares float limit
    });
    return {
        simulationId: (0, node_crypto_1.randomUUID)(),
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
        priceUpdateBases: {},
        directSellOffers: [],
        teams: {},
        transactions: [],
        swaps: [],
    };
}
function getGameState() {
    if (!globalStore.__bullsBearsStore) {
        globalStore.__bullsBearsStore = getInitialGameState();
    }
    const state = context_1.gameStateContext.getStore() || globalStore.__bullsBearsStore;
    state.simulationId ??= (0, node_crypto_1.randomUUID)();
    state.marketSellLockEnabled ??= true;
    state.marketSellCommissionEnabled ??= true;
    state.marketSellCommissionPercent ??= 5;
    state.negotiatedPricesEnabled ??= true;
    const teamsByName = new Map(Object.values(state.teams).map((team) => [team.teamName, team]));
    // Migrate older name-only records and remove records belonging to deleted teams.
    state.transactions = state.transactions.filter((tx) => {
        const legacyName = tx.teamName.includes(" ➔ ") ? tx.teamName.split(" ➔ ").at(-1) : tx.teamName;
        const team = tx.teamId ? state.teams[tx.teamId] : teamsByName.get(legacyName);
        const counterparty = tx.counterpartyTeamId
            ? state.teams[tx.counterpartyTeamId]
            : tx.counterparty ? teamsByName.get(tx.counterparty) : undefined;
        if (!team || ((tx.counterpartyTeamId || tx.counterparty) && !counterparty))
            return false;
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
        if (!sender || !receiver)
            return false;
        swap.senderTeam = sender.teamName;
        swap.receiverTeam = receiver.teamName;
        if (swap.status === "PENDING" && swap.round !== undefined && swap.round !== state.currentRound)
            swap.status = "CANCELLED";
        return true;
    });
    state.directSellOffers = (state.directSellOffers || []).filter((offer) => {
        const seller = state.teams[offer.sellerTeamId];
        const buyer = state.teams[offer.buyerTeamId];
        if (!seller || !buyer)
            return false;
        offer.sellerTeamName = seller.teamName;
        offer.buyerTeamName = buyer.teamName;
        if (offer.status === "PENDING" && offer.round !== undefined && offer.round !== state.currentRound)
            offer.status = "CANCELLED";
        return true;
    });
    // Preserve credit for completed peer trades in sessions created before this rule.
    Object.values(state.teams).forEach((team) => {
        if (team.peerTradesByRound)
            return;
        team.peerTradesByRound = {};
        state.transactions.forEach((tx) => {
            if ((tx.type === "SWAP" || tx.type === "DIRECT_SELL") && tx.counterpartyTeamId && (tx.teamId === team.id || tx.counterpartyTeamId === team.id)) {
                (0, peer_trades_1.recordPeerTrade)(team, tx.round);
            }
        });
    });
    return state;
}

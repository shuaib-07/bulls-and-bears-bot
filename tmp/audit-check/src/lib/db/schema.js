"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactions = exports.swapOffers = exports.directSellOffers = exports.gameState = exports.stocks = exports.teamMembers = exports.teams = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.teams = (0, pg_core_1.pgTable)("teams", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    teamName: (0, pg_core_1.text)("team_name").notNull().unique(),
    passcode: (0, pg_core_1.text)("passcode").notNull(),
    cashBalance: (0, pg_core_1.numeric)("cash_balance", { precision: 12, scale: 2 }).default("100000.00").notNull(),
    isFrozen: (0, pg_core_1.boolean)("is_frozen").default(false).notNull(),
    tableNumber: (0, pg_core_1.text)("table_number"),
    portfolio: (0, pg_core_1.jsonb)("portfolio").$type().default({}).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.teamMembers = (0, pg_core_1.pgTable)("team_members", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    teamId: (0, pg_core_1.text)("team_id").references(() => exports.teams.id, { onDelete: "cascade" }).notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    rollNo: (0, pg_core_1.text)("roll_no"),
    phone: (0, pg_core_1.text)("phone"),
    role: (0, pg_core_1.text)("role").default("Member").notNull(), // Leader, Analyst, Trader, Member
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.stocks = (0, pg_core_1.pgTable)("stocks", {
    ticker: (0, pg_core_1.text)("ticker").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    sector: (0, pg_core_1.text)("sector").notNull(),
    maxSupply: (0, pg_core_1.integer)("max_supply").default(100).notNull(),
    availableSupply: (0, pg_core_1.integer)("available_supply").default(100).notNull(),
    currentPrice: (0, pg_core_1.numeric)("current_price", { precision: 10, scale: 2 }).notNull(),
    entryRound: (0, pg_core_1.integer)("entry_round").default(0).notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
});
exports.gameState = (0, pg_core_1.pgTable)("game_state", {
    id: (0, pg_core_1.integer)("id").primaryKey().default(1),
    currentRound: (0, pg_core_1.integer)("current_round").default(0).notNull(),
    status: (0, pg_core_1.text)("status").default("SETUP").notNull(), // SETUP, NEWS_RELEASED, TRADING_OPEN, TRADING_CLOSED, FINISHED
    tradingExpiresAt: (0, pg_core_1.timestamp)("trading_expires_at"),
    marketExpanded: (0, pg_core_1.boolean)("market_expanded").default(false).notNull(),
    leaderboardVisible: (0, pg_core_1.boolean)("leaderboard_visible").default(false).notNull(),
    stageAuditVisible: (0, pg_core_1.boolean)("stage_audit_visible").default(true).notNull(),
    stockPrices: (0, pg_core_1.jsonb)("stock_prices").$type().default({}).notNull(),
    stockFloats: (0, pg_core_1.jsonb)("stock_floats").$type().default({}).notNull(),
    customScenarios: (0, pg_core_1.jsonb)("custom_scenarios").$type().default({}).notNull(),
    customPriceShifts: (0, pg_core_1.jsonb)("custom_price_shifts").$type().default({}).notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.directSellOffers = (0, pg_core_1.pgTable)("direct_sell_offers", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    sellerTeamId: (0, pg_core_1.text)("seller_team_id").references(() => exports.teams.id, { onDelete: "cascade" }).notNull(),
    sellerTeamName: (0, pg_core_1.text)("seller_team_name").notNull(),
    buyerTeamId: (0, pg_core_1.text)("buyer_team_id").references(() => exports.teams.id, { onDelete: "cascade" }).notNull(),
    buyerTeamName: (0, pg_core_1.text)("buyer_team_name").notNull(),
    ticker: (0, pg_core_1.text)("ticker").notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    price: (0, pg_core_1.numeric)("price", { precision: 10, scale: 2 }).notNull(),
    total: (0, pg_core_1.numeric)("total", { precision: 12, scale: 2 }).notNull(),
    status: (0, pg_core_1.text)("status").default("PENDING").notNull(), // PENDING, ACCEPTED, REJECTED, EXPIRED, SOLD_OUT, CANCELLED
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.swapOffers = (0, pg_core_1.pgTable)("swap_offers", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    senderTeamId: (0, pg_core_1.text)("sender_team_id").references(() => exports.teams.id, { onDelete: "cascade" }).notNull(),
    receiverTeamId: (0, pg_core_1.text)("receiver_team_id").references(() => exports.teams.id, { onDelete: "cascade" }).notNull(),
    giveTicker: (0, pg_core_1.text)("give_ticker").notNull(),
    giveQuantity: (0, pg_core_1.integer)("give_quantity").notNull(),
    receiveTicker: (0, pg_core_1.text)("receive_ticker").notNull(),
    receiveQuantity: (0, pg_core_1.integer)("receive_quantity").notNull(),
    status: (0, pg_core_1.text)("status").default("PENDING").notNull(), // PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.transactions = (0, pg_core_1.pgTable)("transactions", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    roundNumber: (0, pg_core_1.integer)("round_number").notNull(),
    teamId: (0, pg_core_1.text)("team_id").references(() => exports.teams.id, { onDelete: "cascade" }).notNull(),
    teamName: (0, pg_core_1.text)("team_name").notNull(),
    transactionType: (0, pg_core_1.text)("transaction_type").notNull(), // BUY, SELL, SWAP, LIQUIDATION, DIRECT_SELL
    ticker: (0, pg_core_1.text)("ticker").notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    pricePerShare: (0, pg_core_1.numeric)("price_per_share", { precision: 10, scale: 2 }).notNull(),
    totalAmount: (0, pg_core_1.numeric)("total_amount", { precision: 12, scale: 2 }).notNull(),
    counterpartyTeamId: (0, pg_core_1.text)("counterparty_team_id"),
    counterpartyTeamName: (0, pg_core_1.text)("counterparty_team_name"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});

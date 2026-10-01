import { pgTable, text, integer, bigint, numeric, timestamp, boolean, uuid, jsonb } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  teamName: text("team_name").notNull().unique(),
  passcode: text("passcode").notNull(),
  cashBalance: numeric("cash_balance", { precision: 12, scale: 2 }).default("100000.00").notNull(),
  isFrozen: boolean("is_frozen").default(false).notNull(),
  isReady: boolean("is_ready").default(false).notNull(),
  peerTradesByRound: jsonb("peer_trades_by_round").$type<Record<number, number>>().default({}).notNull(),
  tableNumber: text("table_number"),
  portfolio: jsonb("portfolio").$type<Record<string, number>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: text("id").primaryKey(),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  rollNo: text("roll_no"),
  phone: text("phone"),
  role: text("role").default("Member").notNull(), // Leader, Analyst, Trader, Member
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stocks = pgTable("stocks", {
  ticker: text("ticker").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  maxSupply: integer("max_supply").default(100).notNull(),
  availableSupply: integer("available_supply").default(100).notNull(),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }).notNull(),
  entryRound: integer("entry_round").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const gameState = pgTable("game_state", {
  simulationId: uuid("simulation_id"),
  simulationSnapshot: jsonb("simulation_snapshot"),
  revision: bigint("revision", { mode: "number" }).default(0).notNull(),
  lastWriteToken: uuid("last_write_token"),
  id: integer("id").primaryKey().default(1),
  currentRound: integer("current_round").default(0).notNull(),
  status: text("status").default("SETUP").notNull(), // SETUP, NEWS_RELEASED, TRADING_OPEN, TRADING_CLOSED, FINISHED
  tradingExpiresAt: timestamp("trading_expires_at"),
  marketExpanded: boolean("market_expanded").default(false).notNull(),
  leaderboardVisible: boolean("leaderboard_visible").default(false).notNull(),
  stageAuditVisible: boolean("stage_audit_visible").default(true).notNull(),
  stockPrices: jsonb("stock_prices").$type<Record<string, number>>().default({}).notNull(),
  stockFloats: jsonb("stock_floats").$type<Record<string, number>>().default({}).notNull(),
  customScenarios: jsonb("custom_scenarios").$type<Record<string, any>>().default({}).notNull(),
  customPriceShifts: jsonb("custom_price_shifts").$type<Record<string, any>>().default({}).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const directSellOffers = pgTable("direct_sell_offers", {
  simulationId: uuid("simulation_id"),
  roundNumber: integer("round_number"),
  id: text("id").primaryKey(),
  sellerTeamId: text("seller_team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  sellerTeamName: text("seller_team_name").notNull(),
  buyerTeamId: text("buyer_team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  buyerTeamName: text("buyer_team_name").notNull(),
  ticker: text("ticker").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("PENDING").notNull(), // PENDING, ACCEPTED, REJECTED, EXPIRED, SOLD_OUT, CANCELLED
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const swapOffers = pgTable("swap_offers", {
  simulationId: uuid("simulation_id"),
  roundNumber: integer("round_number"),
  id: text("id").primaryKey(),
  senderTeamId: text("sender_team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  receiverTeamId: text("receiver_team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  giveTicker: text("give_ticker").notNull(),
  giveQuantity: integer("give_quantity").notNull(),
  receiveTicker: text("receive_ticker").notNull(),
  receiveQuantity: integer("receive_quantity").notNull(),
  status: text("status").default("PENDING").notNull(), // PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  simulationId: uuid("simulation_id"),
  grossTotal: numeric("gross_total", { precision: 12, scale: 2 }),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }),
  commissionPercent: numeric("commission_percent"),
  displayTimestamp: text("display_timestamp"),
  id: text("id").primaryKey(),
  roundNumber: integer("round_number").notNull(),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  teamName: text("team_name").notNull(),
  transactionType: text("transaction_type").notNull(), // BUY, SELL, SWAP, LIQUIDATION, DIRECT_SELL
  ticker: text("ticker").notNull(),
  quantity: integer("quantity").notNull(),
  pricePerShare: numeric("price_per_share", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  counterpartyTeamId: text("counterparty_team_id"),
  counterpartyTeamName: text("counterparty_team_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
exports.initializeDatabase = initializeDatabase;
const serverless_1 = require("@neondatabase/serverless");
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
dotenv.config({ path: (0, path_1.resolve)(process.cwd(), ".env") });
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
async function initializeDatabase() {
    if (!databaseUrl) {
        console.error("❌ No DATABASE_URL found in environment variables.");
        return { success: false, error: "No DATABASE_URL configured" };
    }
    const sql = (0, serverless_1.neon)(databaseUrl);
    try {
        console.log("🚀 Connecting to Neon PostgreSQL database and ensuring all tables exist...");
        // 1. Teams Table
        await sql `
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        team_name TEXT NOT NULL UNIQUE,
        passcode TEXT NOT NULL,
        cash_balance NUMERIC(12, 2) DEFAULT 100000.00 NOT NULL,
        is_frozen BOOLEAN DEFAULT FALSE NOT NULL,
        table_number TEXT,
        portfolio JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
        // 2. Team Members Table
        await sql `
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        roll_no TEXT,
        phone TEXT,
        role TEXT DEFAULT 'Member' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
        // 3. Stocks Table
        await sql `
      CREATE TABLE IF NOT EXISTS stocks (
        ticker TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sector TEXT NOT NULL,
        max_supply INTEGER DEFAULT 100 NOT NULL,
        available_supply INTEGER DEFAULT 100 NOT NULL,
        current_price NUMERIC(10, 2) NOT NULL,
        entry_round INTEGER DEFAULT 0 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      );
    `;
        // 4. Game State Table
        await sql `
      CREATE TABLE IF NOT EXISTS game_state (
        id INTEGER PRIMARY KEY DEFAULT 1,
        current_round INTEGER DEFAULT 0 NOT NULL,
        status TEXT DEFAULT 'SETUP' NOT NULL,
        trading_expires_at TIMESTAMP WITH TIME ZONE,
        market_expanded BOOLEAN DEFAULT FALSE NOT NULL,
        leaderboard_visible BOOLEAN DEFAULT FALSE NOT NULL,
        stage_audit_visible BOOLEAN DEFAULT TRUE NOT NULL,
        stock_prices JSONB DEFAULT '{}'::jsonb NOT NULL,
        stock_floats JSONB DEFAULT '{}'::jsonb NOT NULL,
        custom_scenarios JSONB DEFAULT '{}'::jsonb NOT NULL,
        custom_price_shifts JSONB DEFAULT '{}'::jsonb NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
        // 5. Direct Sell Offers (120-second peer trading)
        await sql `
      CREATE TABLE IF NOT EXISTS direct_sell_offers (
        id TEXT PRIMARY KEY,
        seller_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        seller_team_name TEXT NOT NULL,
        buyer_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        buyer_team_name TEXT NOT NULL,
        ticker TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        total NUMERIC(12, 2) NOT NULL,
        status TEXT DEFAULT 'PENDING' NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
        // 6. Swap Offers Table
        await sql `
      CREATE TABLE IF NOT EXISTS swap_offers (
        id TEXT PRIMARY KEY,
        sender_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        receiver_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        give_ticker TEXT NOT NULL,
        give_quantity INTEGER NOT NULL,
        receive_ticker TEXT NOT NULL,
        receive_quantity INTEGER NOT NULL,
        status TEXT DEFAULT 'PENDING' NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
        // 7. Transactions Audit Log Table
        await sql `
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        round_number INTEGER NOT NULL,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        team_name TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        ticker TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price_per_share NUMERIC(10, 2) NOT NULL,
        total_amount NUMERIC(12, 2) NOT NULL,
        counterparty_team_id TEXT,
        counterparty_team_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
        console.log("✅ All PostgreSQL tables successfully created & verified on Neon DB!");
        return { success: true };
    }
    catch (error) {
        console.error("❌ Database table initialization failed:", error);
        return { success: false, error: error.message };
    }
}
// Execute if run directly via node / ts-node
if (require.main === module) {
    initializeDatabase().then((res) => {
        if (res.success) {
            process.exit(0);
        }
        else {
            process.exit(1);
        }
    });
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const db_1 = require("../src/lib/db");
const route_1 = require("../src/app/api/admin/route");
const route_2 = require("../src/app/api/trade/route");
const route_3 = require("../src/app/api/state/route");
async function run() {
    const state = (0, db_1.getGameState)();
    Object.assign(state, (0, db_1.getInitialGameState)());
    state.teams["round-test"] = { id: "round-test", teamName: "Round Test", passcode: "1234", cashBalance: 100000, portfolio: {}, isFrozen: false, isReady: true };
    const command = (action, payload = {}) => (0, route_1.POST)(new Request("http://localhost/api/admin", {
        method: "POST", body: JSON.stringify({ pin: "9988", action, payload }),
    }));
    strict_1.default.equal((await command("RELEASE_NEWS")).status, 200);
    strict_1.default.equal(state.currentRound, 0);
    strict_1.default.equal(state.status, "NEWS_RELEASED");
    strict_1.default.equal(state.tradingExpiresAt, null);
    const snapshot = await (await (0, route_3.GET)(new Request("http://localhost/api/state"))).json();
    strict_1.default.equal(snapshot.gameState.currentRound, 0);
    strict_1.default.equal(snapshot.gameState.roundInfo.round, 0);
    strict_1.default.ok(snapshot.gameState.roundInfo.newsStories.length > 0);
    strict_1.default.equal((await (0, route_2.POST)(new Request("http://localhost/api/trade", {
        method: "POST", body: JSON.stringify({ action: "BUY", teamId: "round-test", ticker: "AAPL", quantity: 1 }),
    }))).status, 403);
    strict_1.default.equal((await command("OPEN_TRADING", { minutes: 10 })).status, 200);
    strict_1.default.equal(state.currentRound, 0);
    strict_1.default.equal(state.status, "TRADING_OPEN");
    strict_1.default.ok(state.tradingExpiresAt > Date.now());
    strict_1.default.equal((await command("CLOSE_TRADING")).status, 200);
    strict_1.default.equal((await command("APPLY_PRICE_UPDATE")).status, 200);
    strict_1.default.equal(state.currentRound, 0);
    strict_1.default.equal((await command("ADVANCE_ROUND")).status, 200);
    strict_1.default.equal(state.currentRound, 1);
    strict_1.default.equal((await command("RELEASE_NEWS")).status, 200);
    strict_1.default.equal(state.currentRound, 1);
    console.log("Round checks passed: Round 0 news, closed reading period, manual trading start, and explicit round advance.");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });

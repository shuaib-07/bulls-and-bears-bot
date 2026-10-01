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
    for (const id of ["a", "b"])
        state.teams[id] = { id, teamName: id, passcode: "1234", cashBalance: 100000, portfolio: { AAPL: 5 }, isFrozen: false, peerTradesByRound: { 0: 2 } };
    state.stockFloats.AAPL = 90;
    const request = (body) => new Request("http://localhost/api/test", { method: "POST", body: JSON.stringify({ simulationId: state.simulationId, ...body }) });
    await (0, route_1.POST)(request({ pin: "9988", action: "OPEN_TRADING" }));
    state.directSellOffers.push({ id: "old-offer", sellerTeamId: "a", sellerTeamName: "a", buyerTeamId: "b", buyerTeamName: "b", ticker: "AAPL", quantity: 1, price: 1, total: 1, status: "PENDING", expiresAt: Date.now() + 120000, createdAt: Date.now(), round: 0 });
    state.transactions.push({ id: "past-direct", timestamp: "10:00", round: 0, teamId: "b", teamName: "b", type: "DIRECT_SELL", ticker: "AAPL", quantity: 1, price: 100, total: 100, counterpartyTeamId: "a", counterparty: "a" });
    delete state.peerTradeRule;
    state.negotiatedPricesEnabled = true;
    const balances = JSON.stringify(Object.values(state.teams).map((team) => [team.cashBalance, team.portfolio]));
    for (const action of ["ACCEPT_DIRECT_SELL", "REJECT_DIRECT_SELL", "CANCEL_DIRECT_SELL"]) {
        const result = await (0, route_2.POST)(request({ teamId: "b", action, offerId: "old-offer" }));
        strict_1.default.equal(result.status, 403);
        strict_1.default.equal((await result.json()).code, "DIRECT_SALES_DISABLED");
    }
    strict_1.default.equal(state.directSellOffers[0].status, "CANCELLED");
    strict_1.default.equal(state.negotiatedPricesEnabled, false);
    strict_1.default.equal(state.teams.a.peerTradesByRound?.[0] || 0, 0);
    strict_1.default.equal(state.teams.b.peerTradesByRound?.[0] || 0, 0);
    strict_1.default.equal(state.transactions.length, 1); // Historical receipts remain intact.
    strict_1.default.equal(JSON.stringify(Object.values(state.teams).map((team) => [team.cashBalance, team.portfolio])), balances);
    strict_1.default.equal((await (0, route_2.POST)(request({ teamId: "a", action: "SELL", ticker: "AAPL", quantity: 1, targetTeamId: "b", pricePerShare: 500 }))).status, 403);
    strict_1.default.equal((await (0, route_1.POST)(request({ pin: "9988", action: "SET_NEGOTIATED_PRICES", payload: { enabled: true } }))).status, 403);
    await (0, route_1.POST)(request({ pin: "9988", action: "SET_MARKET_SELL_LOCK", payload: { enabled: false } }));
    const price = state.stockPrices.AAPL;
    const result = await (0, route_2.POST)(request({ teamId: "a", action: "SELL", ticker: "AAPL", quantity: 1, targetTeamId: "MARKET_POOL", pricePerShare: 500 }));
    strict_1.default.equal(result.status, 200);
    strict_1.default.equal((await result.json()).sale.grossTotal, price);
    strict_1.default.equal(state.stockFloats.AAPL, 91);
    const snapshot = await (await (0, route_3.GET)(new Request("http://localhost/api/state"))).json();
    strict_1.default.ok(snapshot.directSellOffers.every((offer) => offer.status !== "PENDING"));
    console.log("Direct-sale checks passed: API rejection, pending-offer cancellation, old-credit migration, preserved audit history, and market-price settlement.");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });

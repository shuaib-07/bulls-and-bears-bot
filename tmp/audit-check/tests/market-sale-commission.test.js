"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const db_1 = require("../src/lib/db");
const route_1 = require("../src/app/api/admin/route");
const route_2 = require("../src/app/api/trade/route");
const market_sale_1 = require("../src/lib/market-sale");
async function run() {
    const state = (0, db_1.getGameState)();
    Object.assign(state, (0, db_1.getInitialGameState)());
    state.teams.a = { id: "a", teamName: "Seller", passcode: "1234", cashBalance: 1000, portfolio: { AAPL: 20 }, isFrozen: false };
    state.teams.b = { id: "b", teamName: "Buyer", passcode: "2345", cashBalance: 1000, portfolio: {}, isFrozen: false };
    state.stockPrices.AAPL = 100;
    state.stockFloats.AAPL = 80;
    const request = (body) => new Request("http://localhost/api/test", { method: "POST", body: JSON.stringify({ simulationId: state.simulationId, ...body }) });
    const command = (action, payload = {}) => (0, route_1.POST)(request({ pin: "9988", action, payload }));
    const sell = (quantity, targetTeamId = "MARKET_POOL") => (0, route_2.POST)(request({ teamId: "a", action: "SELL", ticker: "AAPL", quantity, targetTeamId, commissionPercent: 0 }));
    strict_1.default.equal(state.marketSellCommissionEnabled, true);
    strict_1.default.equal(state.marketSellCommissionPercent, 5);
    await command("SET_MARKET_SELL_LOCK", { enabled: false });
    await command("OPEN_TRADING");
    let result = await (await sell(4)).json();
    strict_1.default.deepEqual(result.sale, { grossTotal: 400, commissionAmount: 20, netTotal: 380 });
    strict_1.default.equal(state.teams.a.cashBalance, 1380);
    strict_1.default.equal(state.transactions.at(-1)?.total, 380);
    strict_1.default.equal(state.transactions.at(-1)?.commissionPercent, 5);
    await command("SET_MARKET_SELL_COMMISSION", { enabled: true, percent: 2.5 });
    result = await (await sell(2)).json();
    strict_1.default.deepEqual(result.sale, { grossTotal: 200, commissionAmount: 5, netTotal: 195 });
    strict_1.default.equal(state.teams.a.cashBalance, 1575);
    const offer = await (await sell(1, "b")).json();
    strict_1.default.equal((await (0, route_2.POST)(request({ teamId: "b", action: "ACCEPT_DIRECT_SELL", offerId: offer.offer.id }))).status, 200);
    strict_1.default.equal(state.teams.a.cashBalance, 1675);
    strict_1.default.equal(state.teams.b.cashBalance, 900);
    strict_1.default.equal(state.transactions.at(-1)?.commissionAmount, undefined);
    await command("SET_MARKET_SELL_COMMISSION", { enabled: false, percent: 2.5 });
    strict_1.default.equal((await (await sell(1)).json()).sale.netTotal, 100);
    await command("SET_MARKET_SELL_COMMISSION", { enabled: true, percent: 0 });
    strict_1.default.equal((await (await sell(1)).json()).sale.netTotal, 100);
    await command("SET_MARKET_SELL_COMMISSION", { enabled: true, percent: 100 });
    strict_1.default.equal((await (await sell(1)).json()).sale.netTotal, 0);
    for (const percent of [-1, 100.1, "5", null]) {
        strict_1.default.equal((await command("SET_MARKET_SELL_COMMISSION", { enabled: true, percent })).status, 400);
        strict_1.default.equal(state.marketSellCommissionPercent, 100);
    }
    strict_1.default.deepEqual((0, market_sale_1.calculateMarketSale)(19.99, 3, 2.5), { grossTotal: 59.97, commissionAmount: 1.5, netTotal: 58.47 });
    await command("RESET_GAME", { keepTeams: true });
    strict_1.default.equal(state.marketSellCommissionEnabled, true);
    strict_1.default.equal(state.marketSellCommissionPercent, 5);
    strict_1.default.equal(state.transactions.length, 0);
    console.log("Commission checks passed: default, decimals, cents, exemptions, toggling, validation, client bypass, and reset.");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });

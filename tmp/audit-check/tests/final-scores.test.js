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
    const command = (action, payload = {}) => (0, route_1.POST)(new Request("http://localhost/api/admin", { method: "POST", body: JSON.stringify({ pin: "9988", action, payload }) }));
    for (const [id, cashBalance] of [["a", 110000], ["b", 90000], ["c", 110000]]) {
        state.teams[id] = { id, teamName: id, passcode: "1234", cashBalance, portfolio: {}, isFrozen: false };
    }
    state.teams.a.portfolio = { AAPL: 10 };
    state.stockPrices.AAPL = 100;
    strict_1.default.equal((await command("START_SCORE_ANNOUNCEMENT")).status, 400);
    state.currentRound = 5;
    state.status = "TRADING_OPEN";
    state.tradingExpiresAt = Date.now() + 60000;
    strict_1.default.equal((await command("START_SCORE_ANNOUNCEMENT")).status, 200);
    const snapshot = state.scoresAnnouncement;
    strict_1.default.deepEqual(snapshot.teams.map((team) => team.id), ["a", "c", "b"]);
    strict_1.default.equal(snapshot.teams[0].totalValue, 111000);
    strict_1.default.equal(snapshot.teams[0].holdings[0].value, 1000);
    strict_1.default.equal(state.status, "FINISHED");
    strict_1.default.equal(state.tradingExpiresAt, null);
    strict_1.default.equal(snapshot.revealedCount, 0);
    strict_1.default.equal((await command("OPEN_TRADING")).status, 409);
    strict_1.default.equal((await command("EXTEND_TIMER")).status, 409);
    strict_1.default.equal((await (0, route_2.POST)(new Request("http://localhost/api/trade", { method: "POST", body: JSON.stringify({ teamId: "a", action: "BUY", ticker: "AAPL", quantity: 1 }) }))).status, 403);
    const frozen = JSON.stringify(snapshot.teams);
    state.stockPrices.AAPL = 200;
    state.teams.a.cashBalance = 0;
    strict_1.default.equal(JSON.stringify(snapshot.teams), frozen);
    for (const expected of ["b", "c", "a"]) {
        strict_1.default.equal((await command("REVEAL_NEXT_SCORE")).status, 200);
        strict_1.default.equal(snapshot.teams[snapshot.teams.length - snapshot.revealedCount].id, expected);
    }
    strict_1.default.equal((await command("REVEAL_NEXT_SCORE")).status, 400);
    await command("START_SCORE_ANNOUNCEMENT");
    strict_1.default.equal(snapshot.revealedCount, 3);
    const data = await (await (0, route_3.GET)(new Request("http://localhost/api/state"))).json();
    strict_1.default.deepEqual(data.gameState.scoresAnnouncement.teams, snapshot.teams);
    await command("RESET_GAME", { keepTeams: true });
    strict_1.default.equal(state.scoresAnnouncement, null);
    state.currentRound = 5;
    await command("START_SCORE_ANNOUNCEMENT");
    strict_1.default.deepEqual(state.scoresAnnouncement.teams.map((team) => team.rank), [1, 1, 1]);
    console.log("Final score checks passed: Round 5 gate, frozen values, reverse reveals, ties, trading lock, and reset.");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });

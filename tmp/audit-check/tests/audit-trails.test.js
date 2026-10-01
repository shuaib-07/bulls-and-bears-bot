"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const db_1 = require("../src/lib/db");
const route_1 = require("../src/app/api/admin/route");
const route_2 = require("../src/app/api/state/route");
async function run() {
    const state = (0, db_1.getGameState)();
    Object.assign(state, (0, db_1.getInitialGameState)());
    strict_1.default.deepEqual(state.teams, {});
    strict_1.default.deepEqual(state.transactions, []);
    state.teams = {
        "demo-alpha": { id: "demo-alpha", teamName: "Alpha Capital", passcode: "1234", cashBalance: 100000, isFrozen: false, portfolio: { NVDA: 20 } },
        "demo-beta": { id: "demo-beta", teamName: "Beta Quant", passcode: "5678", cashBalance: 85000, isFrozen: false, portfolio: {} },
        "demo-gamma": { id: "demo-gamma", teamName: "Gamma Ventures", passcode: "9012", cashBalance: 92000, isFrozen: false, portfolio: {} },
    };
    const transaction = {
        id: "initial", timestamp: "10:00:00", round: 0, teamId: "demo-alpha",
        teamName: "Alpha Capital", type: "BUY", ticker: "NVDA", quantity: 20, price: 180, total: 3600,
    };
    state.transactions = [
        { ...transaction, id: "legacy", teamId: undefined },
        { ...transaction, id: "survivor", teamId: "demo-beta", teamName: "Beta Quant" },
        { ...transaction, id: "legacy-direct", teamId: undefined, teamName: "Alpha Capital ➔ Beta Quant", counterparty: "Alpha Capital" },
        { ...transaction, id: "swap", teamId: "demo-beta", teamName: "Beta Quant", counterpartyTeamId: "demo-alpha", counterparty: "Alpha Capital" },
        { ...transaction, id: "already-deleted", teamId: undefined, teamName: "Deleted Team" },
    ];
    state.stockFloats.NVDA = 80;
    const baseSwap = {
        id: "swap", senderId: "demo-alpha", senderTeam: "Alpha Capital",
        receiverId: "demo-beta", receiverTeam: "Beta Quant", giveTicker: "NVDA", giveQty: 1,
        receiveTicker: "TSLA", receiveQty: 1, status: "PENDING",
        expiresAt: Date.now() + 60000, createdAt: Date.now(),
    };
    state.swaps = [baseSwap, { ...baseSwap, id: "unrelated", senderId: "demo-gamma" }];
    const baseOffer = {
        id: "offer", sellerTeamId: "demo-alpha", sellerTeamName: "Alpha Capital",
        buyerTeamId: "demo-beta", buyerTeamName: "Beta Quant", ticker: "NVDA", quantity: 1,
        price: 180, total: 180, status: "PENDING",
        expiresAt: Date.now() + 120000, createdAt: Date.now(),
    };
    state.directSellOffers = [baseOffer, { ...baseOffer, id: "unrelated", sellerTeamId: "demo-gamma" }];
    const command = (action, payload) => (0, route_1.POST)(new Request("http://localhost/api/admin", {
        method: "POST", body: JSON.stringify({ pin: "9988", action, payload }),
    }));
    strict_1.default.equal((await command("UPDATE_TEAM", { teamId: "demo-alpha", teamName: "Renamed Alpha" })).status, 200);
    let data = await (await (0, route_2.GET)(new Request("http://localhost/api/state"))).json();
    strict_1.default.equal(data.transactions.find((tx) => tx.id === "legacy").teamName, "Renamed Alpha");
    strict_1.default.equal(data.transactions.find((tx) => tx.id === "swap").counterparty, "Renamed Alpha");
    strict_1.default.equal(state.swaps[0].senderTeam, "Renamed Alpha");
    strict_1.default.equal(state.directSellOffers[0].sellerTeamName, "Renamed Alpha");
    strict_1.default.ok(!data.transactions.some((tx) => tx.id === "already-deleted"));
    strict_1.default.equal((await command("DELETE_TEAM", { teamId: "demo-alpha" })).status, 200);
    strict_1.default.deepEqual(state.transactions.map((tx) => tx.id), ["survivor"]);
    strict_1.default.deepEqual(state.swaps.map((swap) => swap.id), ["unrelated"]);
    strict_1.default.deepEqual(state.directSellOffers.map((offer) => offer.id), ["unrelated"]);
    strict_1.default.equal(state.stockFloats.NVDA, 100);
    strict_1.default.equal(state.teams["demo-beta"].cashBalance, 85000);
    // Reusing a deleted team's name must not revive records tied to its ID.
    state.transactions.push({ ...transaction, id: "old-id", teamName: "Beta Quant" });
    data = await (await (0, route_2.GET)(new Request("http://localhost/api/state"))).json();
    strict_1.default.deepEqual(data.transactions.map((tx) => tx.id), ["survivor"]);
    strict_1.default.equal((await command("DELETE_TEAM", { teamId: "demo-beta" })).status, 200);
    strict_1.default.equal(state.transactions.length, 0);
    strict_1.default.equal(state.swaps.length, 0);
    strict_1.default.equal(state.directSellOffers.length, 0);
    const keptTeam = state.teams["demo-gamma"];
    keptTeam.cashBalance = 75000;
    keptTeam.portfolio = { NVDA: 10 };
    keptTeam.isFrozen = true;
    keptTeam.isReady = true;
    keptTeam.tableNumber = "Table 9";
    keptTeam.members = [{ id: "member-1", name: "Test Member", role: "Leader" }];
    state.transactions = [{ ...transaction, id: "previous-session", teamId: keptTeam.id, teamName: keptTeam.teamName }];
    state.swaps = [{ ...baseSwap, senderId: keptTeam.id, receiverId: keptTeam.id }];
    state.directSellOffers = [{ ...baseOffer, sellerTeamId: keptTeam.id, buyerTeamId: keptTeam.id }];
    state.status = "TRADING_OPEN";
    state.currentRound = 3;
    state.tradingExpiresAt = Date.now() + 60000;
    state.stockFloats.NVDA = 90;
    strict_1.default.equal((await command("RESET_GAME", { keepTeams: true })).status, 200);
    strict_1.default.deepEqual(Object.keys(state.teams), [keptTeam.id]);
    strict_1.default.deepEqual(state.teams[keptTeam.id], {
        ...keptTeam, cashBalance: 100000, portfolio: {}, isFrozen: false, isReady: false,
    });
    strict_1.default.equal(state.transactions.length, 0);
    strict_1.default.equal(state.swaps.length, 0);
    strict_1.default.equal(state.directSellOffers.length, 0);
    strict_1.default.equal(state.tradingExpiresAt, null);
    strict_1.default.equal(state.currentRound, 0);
    strict_1.default.equal(state.status, "SETUP");
    strict_1.default.equal(state.stockFloats.NVDA, 100);
    data = await (await (0, route_2.GET)(new Request("http://localhost/api/state"))).json();
    strict_1.default.deepEqual(data.transactions, []);
    strict_1.default.deepEqual(data.swaps, []);
    strict_1.default.deepEqual(data.directSellOffers, []);
    // Removing teams also clears any new activity from the retained session.
    state.transactions = [{ ...transaction, teamId: keptTeam.id, teamName: keptTeam.teamName }];
    state.swaps = [{ ...baseSwap, senderId: keptTeam.id, receiverId: keptTeam.id }];
    state.directSellOffers = [{ ...baseOffer, sellerTeamId: keptTeam.id, buyerTeamId: keptTeam.id }];
    strict_1.default.equal((await command("RESET_GAME", { keepTeams: false })).status, 200);
    strict_1.default.deepEqual(state.teams, {});
    strict_1.default.deepEqual(state.transactions, []);
    strict_1.default.deepEqual(state.swaps, []);
    strict_1.default.deepEqual(state.directSellOffers, []);
    strict_1.default.equal((await command("RESET_GAME", {})).status, 200);
    strict_1.default.deepEqual(state.teams, {});
    strict_1.default.deepEqual(state.transactions, []);
    strict_1.default.deepEqual(state.swaps, []);
    strict_1.default.deepEqual(state.directSellOffers, []);
    strict_1.default.equal(state.status, "SETUP");
    strict_1.default.equal(state.currentRound, 0);
    strict_1.default.ok(Object.values(state.stockFloats).every((float) => float === 100));
    console.log("Checks passed: audit cleanup, renames, counterparties, shared API, and empty fresh/reset simulations.");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });

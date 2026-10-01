import assert from "node:assert/strict";
import { getGameState, getInitialGameState } from "../src/lib/db";
import { POST as admin } from "../src/app/api/admin/route";
import { GET as readState } from "../src/app/api/state/route";

async function run() {
  const state = getGameState();
  Object.assign(state, getInitialGameState());
  assert.deepEqual(state.teams, {});
  assert.deepEqual(state.transactions, []);
  state.teams = {
    "demo-alpha": { id: "demo-alpha", teamName: "Alpha Capital", passcode: "1234", cashBalance: 100000, isFrozen: false, portfolio: { NVDA: 20 } },
    "demo-beta": { id: "demo-beta", teamName: "Beta Quant", passcode: "5678", cashBalance: 85000, isFrozen: false, portfolio: {} },
    "demo-gamma": { id: "demo-gamma", teamName: "Gamma Ventures", passcode: "9012", cashBalance: 92000, isFrozen: false, portfolio: {} },
  };
  const transaction = {
    id: "initial", timestamp: "10:00:00", round: 0, teamId: "demo-alpha",
    teamName: "Alpha Capital", type: "BUY" as const, ticker: "NVDA", quantity: 20, price: 180, total: 3600,
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
    receiveTicker: "TSLA", receiveQty: 1, status: "PENDING" as const,
    expiresAt: Date.now() + 60000, createdAt: Date.now(),
  };
  state.swaps = [baseSwap, { ...baseSwap, id: "unrelated", senderId: "demo-gamma" }];
  const baseOffer = {
    id: "offer", sellerTeamId: "demo-alpha", sellerTeamName: "Alpha Capital",
    buyerTeamId: "demo-beta", buyerTeamName: "Beta Quant", ticker: "NVDA", quantity: 1,
    price: 180, total: 180, status: "PENDING" as const,
    expiresAt: Date.now() + 120000, createdAt: Date.now(),
  };
  state.directSellOffers = [baseOffer, { ...baseOffer, id: "unrelated", sellerTeamId: "demo-gamma" }];

  const command = (action: string, payload: object) => admin(new Request("http://localhost/api/admin", {
    method: "POST", body: JSON.stringify({ pin: "9988", action, payload }),
  }));
  assert.equal((await command("UPDATE_TEAM", { teamId: "demo-alpha", teamName: "Renamed Alpha" })).status, 200);
  let data = await (await readState(new Request("http://localhost/api/state"))).json();
  assert.equal(data.transactions.find((tx: { id: string }) => tx.id === "legacy").teamName, "Renamed Alpha");
  assert.equal(data.transactions.find((tx: { id: string }) => tx.id === "swap").counterparty, "Renamed Alpha");
  assert.equal(state.swaps[0].senderTeam, "Renamed Alpha");
  assert.equal(state.directSellOffers[0].sellerTeamName, "Renamed Alpha");
  assert.ok(!data.transactions.some((tx: { id: string }) => tx.id === "already-deleted"));

  assert.equal((await command("DELETE_TEAM", { teamId: "demo-alpha" })).status, 200);
  assert.deepEqual(state.transactions.map((tx) => tx.id), ["survivor"]);
  assert.deepEqual(state.swaps.map((swap) => swap.id), ["unrelated"]);
  assert.deepEqual(state.directSellOffers.map((offer) => offer.id), ["unrelated"]);
  assert.equal(state.stockFloats.NVDA, 100);
  assert.equal(state.teams["demo-beta"].cashBalance, 85000);

  // Reusing a deleted team's name must not revive records tied to its ID.
  state.transactions.push({ ...transaction, id: "old-id", teamName: "Beta Quant" });
  data = await (await readState(new Request("http://localhost/api/state"))).json();
  assert.deepEqual(data.transactions.map((tx: { id: string }) => tx.id), ["survivor"]);
  assert.equal((await command("DELETE_TEAM", { teamId: "demo-beta" })).status, 200);
  assert.equal(state.transactions.length, 0);
  assert.equal(state.swaps.length, 0);
  assert.equal(state.directSellOffers.length, 0);
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
  assert.equal((await command("RESET_GAME", { keepTeams: true })).status, 200);
  assert.deepEqual(Object.keys(state.teams), [keptTeam.id]);
  assert.deepEqual(state.teams[keptTeam.id], {
    ...keptTeam, cashBalance: 100000, portfolio: {}, isFrozen: false, isReady: false,
  });
  assert.equal(state.transactions.length, 0);
  assert.equal(state.swaps.length, 0);
  assert.equal(state.directSellOffers.length, 0);
  assert.equal(state.tradingExpiresAt, null);
  assert.equal(state.currentRound, 0);
  assert.equal(state.status, "SETUP");
  assert.equal(state.stockFloats.NVDA, 100);
  data = await (await readState(new Request("http://localhost/api/state"))).json();
  assert.deepEqual(data.transactions, []);
  assert.deepEqual(data.swaps, []);
  assert.deepEqual(data.directSellOffers, []);

  // Removing teams also clears any new activity from the retained session.
  state.transactions = [{ ...transaction, teamId: keptTeam.id, teamName: keptTeam.teamName }];
  state.swaps = [{ ...baseSwap, senderId: keptTeam.id, receiverId: keptTeam.id }];
  state.directSellOffers = [{ ...baseOffer, sellerTeamId: keptTeam.id, buyerTeamId: keptTeam.id }];
  assert.equal((await command("RESET_GAME", { keepTeams: false })).status, 200);
  assert.deepEqual(state.teams, {});
  assert.deepEqual(state.transactions, []);
  assert.deepEqual(state.swaps, []);
  assert.deepEqual(state.directSellOffers, []);
  assert.equal((await command("RESET_GAME", {})).status, 200);
  assert.deepEqual(state.teams, {});
  assert.deepEqual(state.transactions, []);
  assert.deepEqual(state.swaps, []);
  assert.deepEqual(state.directSellOffers, []);
  assert.equal(state.status, "SETUP");
  assert.equal(state.currentRound, 0);
  assert.ok(Object.values(state.stockFloats).every((float) => float === 100));
  console.log("Checks passed: audit cleanup, renames, counterparties, shared API, and empty fresh/reset simulations.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });

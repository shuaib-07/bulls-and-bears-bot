import assert from "node:assert/strict";
import { getGameState, getInitialGameState } from "../src/lib/db";
import { POST as admin } from "../src/app/api/admin/route";
import { POST as trade } from "../src/app/api/trade/route";
import { GET as readState } from "../src/app/api/state/route";

async function run() {
  const state = getGameState();
  Object.assign(state, getInitialGameState());
  for (const id of ["a", "b"]) state.teams[id] = { id, teamName: id, passcode: "1234", cashBalance: 100000, portfolio: { AAPL: 5 }, isFrozen: false, peerTradesByRound: { 0: 2 } };
  state.stockFloats.AAPL = 90;
  const request = (body: object) => new Request("http://localhost/api/test", { method: "POST", body: JSON.stringify({ simulationId: state.simulationId, ...body }) });
  await admin(request({ pin: "9988", action: "OPEN_TRADING" }));
  state.directSellOffers.push({ id: "old-offer", sellerTeamId: "a", sellerTeamName: "a", buyerTeamId: "b", buyerTeamName: "b", ticker: "AAPL", quantity: 1, price: 1, total: 1, status: "PENDING", expiresAt: Date.now() + 120000, createdAt: Date.now(), round: 0 });
  state.transactions.push({ id: "past-direct", timestamp: "10:00", round: 0, teamId: "b", teamName: "b", type: "DIRECT_SELL", ticker: "AAPL", quantity: 1, price: 100, total: 100, counterpartyTeamId: "a", counterparty: "a" });
  delete state.peerTradeRule;
  state.negotiatedPricesEnabled = true;
  const balances = JSON.stringify(Object.values(state.teams).map((team) => [team.cashBalance, team.portfolio]));
  for (const action of ["ACCEPT_DIRECT_SELL", "REJECT_DIRECT_SELL", "CANCEL_DIRECT_SELL"]) {
    const result = await trade(request({ teamId: "b", action, offerId: "old-offer" }));
    assert.equal(result.status, 403);
    assert.equal((await result.json()).code, "DIRECT_SALES_DISABLED");
  }
  assert.equal(state.directSellOffers[0].status, "CANCELLED");
  assert.equal(state.negotiatedPricesEnabled, false);
  assert.equal(state.teams.a.peerTradesByRound?.[0] || 0, 0);
  assert.equal(state.teams.b.peerTradesByRound?.[0] || 0, 0);
  assert.equal(state.transactions.length, 1); // Historical receipts remain intact.
  assert.equal(JSON.stringify(Object.values(state.teams).map((team) => [team.cashBalance, team.portfolio])), balances);
  assert.equal((await trade(request({ teamId: "a", action: "SELL", ticker: "AAPL", quantity: 1, targetTeamId: "b", pricePerShare: 500 }))).status, 403);
  assert.equal((await admin(request({ pin: "9988", action: "SET_NEGOTIATED_PRICES", payload: { enabled: true } }))).status, 403);
  await admin(request({ pin: "9988", action: "SET_MARKET_SELL_LOCK", payload: { enabled: false } }));
  const price = state.stockPrices.AAPL;
  const result = await trade(request({ teamId: "a", action: "SELL", ticker: "AAPL", quantity: 1, targetTeamId: "MARKET_POOL", pricePerShare: 500 }));
  assert.equal(result.status, 200);
  assert.equal((await result.json()).sale.grossTotal, price);
  assert.equal(state.stockFloats.AAPL, 91);
  const snapshot = await (await readState(new Request("http://localhost/api/state"))).json();
  assert.ok(snapshot.directSellOffers.every((offer: { status: string }) => offer.status !== "PENDING"));
  console.log("Direct-sale checks passed: API rejection, pending-offer cancellation, old-credit migration, preserved audit history, and market-price settlement.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });

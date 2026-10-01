import assert from "node:assert/strict";
import { createDemoMarket, requestDemo, addDemoOffers, applyDemoPriceMove, DEMO_TEAM_ID, DEMO_STARTING_CASH } from "../src/lib/demo-market";

async function run() {
  const market = createDemoMarket();
  const independentMarket = createDemoMarket();
  const unchanged = JSON.stringify(independentMarket);
  const command = async (path: string, body: object) => requestDemo(market, path, { method: "POST", body: JSON.stringify(body) });
  const read = async () => requestDemo(market, "/api/state").json();
  const assertSupply = () => market.stocks.forEach((stock) => {
    const owned = Object.values(market.teams).reduce((total, team) => total + (team.portfolio[stock.ticker] || 0), 0);
    assert.equal(stock.availableSupply + owned, 100);
  });
  const initial = await read();
  assert.equal(initial.activeTeam.totalPortfolioValue, DEMO_STARTING_CASH);
  assert.ok(initial.activeStocks.every((stock: { ticker: string }) => stock.ticker.endsWith("-X")));
  assert.deepEqual(initial.transactions, []);
  assertSupply();

  assert.equal((await command("/api/trade", { action: "BUY", ticker: "LUMA-X", quantity: 2 })).status, 200);
  assert.equal(market.teams[DEMO_TEAM_ID].portfolio["LUMA-X"], 7);
  assert.equal((await read()).activeTeam.totalPortfolioValue, DEMO_STARTING_CASH);
  assert.equal((await command("/api/trade", { action: "BUY", ticker: "LUMA-X", quantity: 101 })).status, 400);
  assert.equal((await command("/api/trade", { action: "BUY", ticker: "LUMA-X", quantity: 0.5 })).status, 400);
  assert.equal((await command("/api/trade", { action: "SELL", ticker: "LUMA-X", quantity: 100, targetTeamId: "MARKET_POOL" })).status, 400);
  assert.equal((await command("/api/trade", { action: "SELL", ticker: "LUMA-X", quantity: 2, targetTeamId: "MARKET_POOL" })).status, 400);
  market.gameState.marketSellLockEnabled = false;
  assert.equal((await command("/api/trade", { action: "SELL", ticker: "LUMA-X", quantity: 2, targetTeamId: "MARKET_POOL" })).status, 200);
  assert.equal((await command("/api/trade", { action: "SELL", ticker: "BRIK-X", quantity: 1, targetTeamId: "practice-moss" })).status, 200);
  assertSupply();

  assert.equal((await command("/api/swap", { action: "PROPOSE", receiverId: "practice-comet", giveTicker: "LUMA-X", giveQty: 1, receiveTicker: "RILL-X", receiveQty: 2 })).status, 200);
  assert.equal((await command("/api/swap", { action: "PROPOSE", receiverId: "practice-comet", giveTicker: "LUMA-X", giveQty: 999, receiveTicker: "RILL-X", receiveQty: 2 })).status, 400);
  addDemoOffers(market);
  assert.equal((await command("/api/swap", { action: "ACCEPT", swapId: market.swaps[0].id })).status, 200);
  assert.equal((await command("/api/trade", { action: "ACCEPT_DIRECT_SELL", offerId: market.directSellOffers[0].id })).status, 200);
  addDemoOffers(market);
  assert.equal((await command("/api/swap", { action: "REJECT", swapId: market.swaps[1].id })).status, 200);
  assert.equal((await command("/api/trade", { action: "REJECT_DIRECT_SELL", offerId: market.directSellOffers[1].id })).status, 200);
  assertSupply();

  addDemoOffers(market);
  market.directSellOffers.at(-1)!.expiresAt = 0;
  assert.equal((await command("/api/trade", { action: "ACCEPT_DIRECT_SELL", offerId: market.directSellOffers.at(-1)!.id })).status, 400);
  applyDemoPriceMove(market);
  assert.notEqual((await read()).activeTeam.pnl, 0);
  assert.equal(JSON.stringify(independentMarket), unchanged);
  assert.equal(requestDemo(market, "/api/admin", { method: "POST", body: JSON.stringify({ action: "RESET_GAME" }) }).status, 400);
  Object.assign(market, createDemoMarket());
  const reset = await read();
  assert.deepEqual(reset.transactions, []);
  assert.deepEqual(reset.swaps, []);
  assert.deepEqual(reset.directSellOffers, []);
  assert.equal(reset.activeTeam.totalPortfolioValue, DEMO_STARTING_CASH);
  assert.equal(reset.gameState.marketSellLockEnabled, true);
  assert.equal(reset.activeTeam.qualifyingPeerTrades, 0);
  assertSupply();
  console.log("Demo checks passed: trades, swaps, offers, price moves, reset, supply, and isolated sessions.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });

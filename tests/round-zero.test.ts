import assert from "node:assert/strict";
import { getGameState, getInitialGameState } from "../src/lib/db";
import { POST as admin } from "../src/app/api/admin/route";
import { POST as trade } from "../src/app/api/trade/route";
import { GET as readState } from "../src/app/api/state/route";

async function run() {
  const state = getGameState();
  Object.assign(state, getInitialGameState());
  state.teams["round-test"] = { id: "round-test", teamName: "Round Test", passcode: "1234", cashBalance: 100000, portfolio: {}, isFrozen: false, isReady: true };
  const command = (action: string, payload: object = {}) => admin(new Request("http://localhost/api/admin", {
    method: "POST", body: JSON.stringify({ pin: "9988", action, payload }),
  }));
  assert.equal((await command("RELEASE_NEWS")).status, 200);
  assert.equal(state.currentRound, 0);
  assert.equal(state.status, "NEWS_RELEASED");
  assert.equal(state.tradingExpiresAt, null);
  const snapshot = await (await readState(new Request("http://localhost/api/state"))).json();
  assert.equal(snapshot.gameState.currentRound, 0);
  assert.equal(snapshot.gameState.roundInfo.round, 0);
  assert.ok(snapshot.gameState.roundInfo.newsStories.length > 0);
  assert.equal((await trade(new Request("http://localhost/api/trade", {
    method: "POST", body: JSON.stringify({ simulationId: state.simulationId, action: "BUY", teamId: "round-test", ticker: "AAPL", quantity: 1 }),
  }))).status, 403);
  assert.equal((await command("OPEN_TRADING", { minutes: 10 })).status, 200);
  assert.equal(state.currentRound, 0);
  assert.equal(state.status, "TRADING_OPEN");
  assert.ok(state.tradingExpiresAt! > Date.now());
  assert.equal((await command("CLOSE_TRADING")).status, 200);
  assert.equal((await command("APPLY_PRICE_UPDATE")).status, 200);
  assert.equal(state.currentRound, 0);
  assert.equal((await command("ADVANCE_ROUND")).status, 200);
  assert.equal(state.currentRound, 1);
  assert.equal((await command("RELEASE_NEWS")).status, 200);
  assert.equal(state.currentRound, 1);
  const before = state.stockPrices.AAPL;
  await command("UPDATE_PRICE_SHIFTS", { round: 1, shifts: { AAPL: 10 } });
  await command("RELEASE_NEWS");
  assert.equal(state.stockPrices.AAPL, before);
  await command("APPLY_PRICE_UPDATE");
  assert.equal(state.stockPrices.AAPL, Math.round(before * 1.1 * 100) / 100);
  await command("APPLY_PRICE_UPDATE");
  assert.equal(state.stockPrices.AAPL, Math.round(before * 1.1 * 100) / 100);
  console.log("Round checks passed: Round 0 news, closed reading period, manual trading start, and explicit round advance.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });

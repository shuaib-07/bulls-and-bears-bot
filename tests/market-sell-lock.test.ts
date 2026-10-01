import assert from "node:assert/strict";
import { getGameState, getInitialGameState } from "../src/lib/db";
import { POST as admin } from "../src/app/api/admin/route";
import { POST as trade } from "../src/app/api/trade/route";
import { POST as swap } from "../src/app/api/swap/route";
import { GET as readState } from "../src/app/api/state/route";
import { getPeerTradeCount } from "../src/lib/peer-trades";

async function run() {
  const state = getGameState();
  Object.assign(state, getInitialGameState());
  for (const id of ["a", "b", "c"]) {
    state.teams[id] = { id, teamName: `Team ${id}`, passcode: "1234", cashBalance: 100000, portfolio: { AAPL: 10, MSFT: 10 }, isFrozen: false };
  }
  state.stockFloats.AAPL = 70;
  state.stockFloats.MSFT = 70;
  const request = (route: string, body: object) => new Request(`http://localhost/api/${route}`, { method: "POST", body: JSON.stringify({ simulationId: state.simulationId, ...body }) });
  const command = (action: string, payload: object = {}) => admin(request("admin", { pin: "9988", action, payload }));
  const sell = (teamId: string, targetTeamId = "MARKET_POOL") => trade(request("trade", { action: "SELL", teamId, ticker: "AAPL", quantity: 1, targetTeamId }));
  const count = (id: string) => getPeerTradeCount(state.teams[id], state.currentRound);
  assert.equal(state.marketSellLockEnabled, true);
  await command("OPEN_TRADING");
  assert.equal((await trade(request("trade", { action: "BUY", teamId: "a", ticker: "AAPL", quantity: 1 }))).status, 200);
  assert.equal(count("a"), 0);
  const before = JSON.stringify(state.teams.a);
  assert.equal((await sell("a")).status, 403);
  assert.equal((await sell("a", "")).status, 403);
  assert.equal(JSON.stringify(state.teams.a), before);

  assert.equal((await sell("a", "b")).status, 403);
  assert.equal(count("a"), 0);
  assert.equal(state.directSellOffers.length, 0);
  assert.equal((await trade(request("trade", { action: "ACCEPT_DIRECT_SELL", teamId: "b", offerId: "old-offer" }))).status, 403);
  assert.equal((await command("SET_NEGOTIATED_PRICES", { enabled: true })).status, 403);
  const firstProposal = await (await swap(request("swap", { action: "PROPOSE", teamId: "b", senderId: "b", receiverId: "a", giveTicker: "MSFT", giveQty: 1, receiveTicker: "AAPL", receiveQty: 1 }))).json();
  assert.equal(count("a"), 0);
  assert.equal((await swap(request("swap", { action: "ACCEPT", teamId: "a", swapId: firstProposal.swap.id }))).status, 200);
  assert.equal(count("a"), 1);
  assert.equal(count("b"), 1);
  assert.equal((await swap(request("swap", { action: "ACCEPT", teamId: "a", swapId: firstProposal.swap.id }))).status, 400);
  assert.equal(count("a"), 1);
  assert.equal((await sell("a")).status, 403);

  const proposal = await (await swap(request("swap", { action: "PROPOSE", teamId: "b", senderId: "b", receiverId: "a", giveTicker: "MSFT", giveQty: 1, receiveTicker: "AAPL", receiveQty: 1 }))).json();
  assert.equal(count("b"), 1);
  assert.equal((await swap(request("swap", { action: "ACCEPT", teamId: "a", swapId: proposal.swap.id }))).status, 200);
  assert.equal(count("a"), 2);
  assert.equal(count("b"), 2);
  assert.equal((await swap(request("swap", { action: "ACCEPT", teamId: "a", swapId: proposal.swap.id }))).status, 400);
  assert.equal(count("b"), 2);
  assert.equal((await sell("a")).status, 200);
  assert.equal((await sell("c")).status, 403);
  const snapshot = await (await readState(new Request("http://localhost/api/state?teamId=a"))).json();
  assert.equal(snapshot.activeTeam.qualifyingPeerTrades, 2);
  assert.equal(snapshot.activeTeam.marketSellLocked, false);
  assert.equal(snapshot.leaderboard.find((team: { id: string }) => team.id === "c").marketSellLocked, true);

  await command("ADVANCE_ROUND");
  await command("OPEN_TRADING");
  assert.equal(count("a"), 0);
  assert.equal((await sell("a")).status, 403);
  await command("SET_MARKET_SELL_LOCK", { enabled: false });
  assert.equal((await sell("a")).status, 200);
  await command("SET_MARKET_SELL_LOCK", { enabled: true });
  assert.equal((await sell("a")).status, 403);

  const expiring = await (await swap(request("swap", { action: "PROPOSE", teamId: "b", senderId: "b", receiverId: "a", giveTicker: "MSFT", giveQty: 1, receiveTicker: "AAPL", receiveQty: 1 }))).json();
  state.swaps.find((offer) => offer.id === expiring.swap.id)!.expiresAt = 0;
  assert.equal((await swap(request("swap", { action: "ACCEPT", teamId: "a", swapId: expiring.swap.id }))).status, 400);
  assert.equal(count("a"), 0);
  await command("RESET_GAME", { keepTeams: true });
  assert.equal(state.marketSellLockEnabled, true);
  assert.equal(count("a"), 0);
  console.log("Sale-lock checks passed: completion-only credit for both teams, bypass rejection, rounds, toggling, expiry, and reset.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });

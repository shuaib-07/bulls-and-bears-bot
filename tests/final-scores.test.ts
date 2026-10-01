import assert from "node:assert/strict";
import { getGameState, getInitialGameState } from "../src/lib/db";
import { POST as admin } from "../src/app/api/admin/route";
import { POST as trade } from "../src/app/api/trade/route";
import { GET as readState } from "../src/app/api/state/route";

async function run() {
  const state = getGameState();
  Object.assign(state, getInitialGameState());
  const command = (action: string, payload: object = {}) => admin(new Request("http://localhost/api/admin", { method: "POST", body: JSON.stringify({ pin: "9988", action, payload }) }));
  for (const [id, cashBalance] of [["a", 110000], ["b", 90000], ["c", 110000]] as const) {
    state.teams[id] = { id, teamName: id, passcode: "1234", cashBalance, portfolio: {}, isFrozen: false };
  }
  state.teams.a.portfolio = { AAPL: 10 };
  state.stockPrices.AAPL = 100;
  assert.equal((await command("START_SCORE_ANNOUNCEMENT")).status, 400);
  state.currentRound = 5;
  state.status = "TRADING_OPEN";
  state.tradingExpiresAt = Date.now() + 60000;
  assert.equal((await command("START_SCORE_ANNOUNCEMENT")).status, 200);
  const snapshot = state.scoresAnnouncement!;
  assert.deepEqual(snapshot.teams.map((team) => team.id), ["a", "c", "b"]);
  assert.equal(snapshot.teams[0].totalValue, 111000);
  assert.equal(snapshot.teams[0].holdings[0].value, 1000);
  assert.equal(state.status, "FINISHED");
  assert.equal(state.tradingExpiresAt, null);
  assert.equal(snapshot.revealedCount, 0);
  assert.equal((await command("OPEN_TRADING")).status, 409);
  assert.equal((await command("EXTEND_TIMER")).status, 409);
  assert.equal((await trade(new Request("http://localhost/api/trade", { method: "POST", body: JSON.stringify({ simulationId: state.simulationId, teamId: "a", action: "BUY", ticker: "AAPL", quantity: 1 }) }))).status, 403);
  const frozen = JSON.stringify(snapshot.teams);
  state.stockPrices.AAPL = 200;
  state.teams.a.cashBalance = 0;
  assert.equal(JSON.stringify(snapshot.teams), frozen);
  for (const expected of ["b", "c", "a"]) {
    assert.equal((await command("REVEAL_NEXT_SCORE")).status, 200);
    assert.equal(snapshot.teams[snapshot.teams.length - snapshot.revealedCount].id, expected);
  }
  assert.equal((await command("REVEAL_NEXT_SCORE")).status, 400);
  await command("START_SCORE_ANNOUNCEMENT");
  assert.equal(snapshot.revealedCount, 3);
  const data = await (await readState(new Request("http://localhost/api/state"))).json();
  assert.deepEqual(data.gameState.scoresAnnouncement.teams, snapshot.teams);
  await command("RESET_GAME", { keepTeams: true });
  assert.equal(state.scoresAnnouncement, null);
  state.currentRound = 5;
  await command("START_SCORE_ANNOUNCEMENT");
  assert.deepEqual(state.scoresAnnouncement!.teams.map((team) => team.rank), [1, 1, 1]);
  console.log("Final score checks passed: Round 5 gate, frozen values, reverse reveals, ties, trading lock, and reset.");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });

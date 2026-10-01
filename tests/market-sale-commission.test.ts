import assert from "node:assert/strict";
import { getGameState, getInitialGameState } from "../src/lib/db";
import { POST as admin } from "../src/app/api/admin/route";
import { POST as trade } from "../src/app/api/trade/route";
import { calculateMarketSale } from "../src/lib/market-sale";

async function run() {
  const state = getGameState();
  Object.assign(state, getInitialGameState());
  state.teams.a = { id: "a", teamName: "Seller", passcode: "1234", cashBalance: 1000, portfolio: { AAPL: 20 }, isFrozen: false };
  state.teams.b = { id: "b", teamName: "Buyer", passcode: "2345", cashBalance: 1000, portfolio: {}, isFrozen: false };
  state.stockPrices.AAPL = 100;
  state.stockFloats.AAPL = 80;
  const request = (body: object) => new Request("http://localhost/api/test", { method: "POST", body: JSON.stringify(body) });
  const command = (action: string, payload: object = {}) => admin(request({ pin: "9988", action, payload }));
  const sell = (quantity: number, targetTeamId = "MARKET_POOL") => trade(request({ teamId: "a", action: "SELL", ticker: "AAPL", quantity, targetTeamId, commissionPercent: 0 }));
  assert.equal(state.marketSellCommissionEnabled, true);
  assert.equal(state.marketSellCommissionPercent, 5);
  await command("SET_MARKET_SELL_LOCK", { enabled: false });
  await command("OPEN_TRADING");
  let result = await (await sell(4)).json();
  assert.deepEqual(result.sale, { grossTotal: 400, commissionAmount: 20, netTotal: 380 });
  assert.equal(state.teams.a.cashBalance, 1380);
  assert.equal(state.transactions.at(-1)?.total, 380);
  assert.equal(state.transactions.at(-1)?.commissionPercent, 5);
  await command("SET_MARKET_SELL_COMMISSION", { enabled: true, percent: 2.5 });
  result = await (await sell(2)).json();
  assert.deepEqual(result.sale, { grossTotal: 200, commissionAmount: 5, netTotal: 195 });
  assert.equal(state.teams.a.cashBalance, 1575);

  const offer = await (await sell(1, "b")).json();
  assert.equal((await trade(request({ teamId: "b", action: "ACCEPT_DIRECT_SELL", offerId: offer.offer.id }))).status, 200);
  assert.equal(state.teams.a.cashBalance, 1675);
  assert.equal(state.teams.b.cashBalance, 900);
  assert.equal(state.transactions.at(-1)?.commissionAmount, undefined);
  await command("SET_MARKET_SELL_COMMISSION", { enabled: false, percent: 2.5 });
  assert.equal((await (await sell(1)).json()).sale.netTotal, 100);
  await command("SET_MARKET_SELL_COMMISSION", { enabled: true, percent: 0 });
  assert.equal((await (await sell(1)).json()).sale.netTotal, 100);
  await command("SET_MARKET_SELL_COMMISSION", { enabled: true, percent: 100 });
  assert.equal((await (await sell(1)).json()).sale.netTotal, 0);
  for (const percent of [-1, 100.1, "5", null]) {
    assert.equal((await command("SET_MARKET_SELL_COMMISSION", { enabled: true, percent })).status, 400);
    assert.equal(state.marketSellCommissionPercent, 100);
  }
  assert.deepEqual(calculateMarketSale(19.99, 3, 2.5), { grossTotal: 59.97, commissionAmount: 1.5, netTotal: 58.47 });
  await command("RESET_GAME", { keepTeams: true });
  assert.equal(state.marketSellCommissionEnabled, true);
  assert.equal(state.marketSellCommissionPercent, 5);
  assert.equal(state.transactions.length, 0);
  console.log("Commission checks passed: default, decimals, cents, exemptions, toggling, validation, client bypass, and reset.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });

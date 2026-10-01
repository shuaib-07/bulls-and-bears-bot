// Run after compiling tests with tmp/audit-tsconfig.json. Uses a disposable Neon schema.
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ quiet: true });
const actual = require('@neondatabase/serverless');
const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!url) throw new Error('Database connection required for integration verification');
const sql = actual.neon(url);
const schema = 'bb_verify_' + randomBytes(8).toString('hex');
const tables = ['game_state','teams','team_members','stocks','transactions','direct_sell_offers','swap_offers'];
const qualify = (text) => text.replace(/\b(game_state|teams|team_members|stocks|transactions|direct_sell_offers|swap_offers)\b/g, (_, name) => '"' + schema + '"."' + name + '"');
const originalLoad = Module._load;
Module._load = function(id, ...args) {
  if (id !== '@neondatabase/serverless') return originalLoad.call(this, id, ...args);
  return { ...actual, neon: (...options) => {
    const real = actual.neon(...options);
    const wrapper = (strings, ...values) => {
      const tagged = strings.map(qualify);
      tagged.raw = strings.raw.map(qualify);
      return real(tagged, ...values);
    };
    Object.assign(wrapper, real);
    wrapper.query = (text, ...values) => real.query(qualify(text), ...values);
    wrapper.transaction = (...args) => real.transaction(...args);
    return wrapper;
  }};
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(id, parent, ...rest) {
  return originalResolve.call(this, id.startsWith('@/') ? path.resolve('tmp/audit-check', id.slice(2)) : id, parent, ...rest);
};
async function run() {
  await sql.query(`CREATE SCHEMA "${schema}"`);
  try {
    for (const table of tables) await sql.query(`CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL)`);
    const { getGameState, getInitialGameState } = require('../tmp/audit-check/src/lib/db');
    const memory = getGameState();
    Object.assign(memory, getInitialGameState());
    for (let i=0; i<10; i++) memory.teams['test-'+i] = { id:'test-'+i,teamName:'Test '+i,passcode:'1234',cashBalance:100000,portfolio:{},isFrozen:false };
    memory.stockFloats.AAPL = 5;
    const { POST: admin } = require('../tmp/audit-check/src/app/api/admin/route');
    const { POST: swap } = require('../tmp/audit-check/src/app/api/swap/route');
    const { POST: auth } = require('../tmp/audit-check/src/app/api/auth/route');
    const { POST: trade } = require('../tmp/audit-check/src/app/api/trade/route');
    const { GET: read } = require('../tmp/audit-check/src/app/api/state/route');
    const cookies = {};
    const request = (body) => new Request('http://localhost/api/test', {method:'POST',headers: cookies[body.teamId] ? {cookie: cookies[body.teamId]} : {},body:JSON.stringify(body)});
    const command = (action,payload={}) => admin(request({pin:'9988',action,payload}));
    let result = await command('OPEN_TRADING');
    assert.equal(result.status,200,JSON.stringify(await result.clone().json()));
    const simulationId = memory.simulationId;
    assert.equal((await trade(request({simulationId,teamId:'test-0',action:'BUY',ticker:'AAPL',quantity:1}))).status,401);
    for (let i=0; i<10; i++) {
      const login = await auth(request({action:'login',teamName:'Test '+i,passcode:'1234'}));
      assert.equal(login.status,200);
      cookies['test-'+i] = login.headers.get('set-cookie').split(';')[0];
    }
    const publicState = await (await read(new Request('http://localhost/api/state'))).json();
    assert.ok(publicState.leaderboard.every(team => team.passcode === undefined && team.members.length === 0));
    assert.ok(publicState.activeStocks.every(stock => stock.prices === undefined));
    const responses = await Promise.all(Array.from({length:10},(_,i) => trade(request({simulationId,teamId:'test-'+i,action:'BUY',ticker:'AAPL',quantity:5}))));
    assert.equal(responses.filter(r=>r.status===200).length,1);
    assert.equal(responses.filter(r=>r.status===400).length,9);
    const saved = (await sql.query(`SELECT simulation_snapshot FROM "${schema}".game_state WHERE id=1`))[0].simulation_snapshot;
    assert.equal(saved.stockFloats.AAPL,0);
    assert.equal(saved.transactions.length,1);
    const winner = Object.values(saved.teams).find(t=>t.portfolio.AAPL===5);
    assert.ok(winner);
    assert.equal(winner.cashBalance,100000-5*saved.stockPrices.AAPL);
    assert.equal((await sql.query(`SELECT count(*)::int AS n FROM "${schema}".transactions`))[0].n,1);
    assert.equal((await sql.query(`SELECT available_supply FROM "${schema}".stocks WHERE ticker='AAPL'`))[0].available_supply,0);
    const buyer = Object.values(saved.teams).find(t=>t.id!==winner.id);
    assert.equal((await trade(new Request('http://localhost/api/trade', {method:'POST', headers:{cookie:cookies[buyer.id]}, body:JSON.stringify({simulationId,action:'BUY',teamId:winner.id,ticker:'AAPL',quantity:1})}))).status,401);
    assert.equal((await trade(request({simulationId,action:'SELL',teamId:winner.id,targetTeamId:buyer.id,ticker:'AAPL',quantity:1,pricePerShare:12.345}))).status,400);
    const offer = await trade(request({simulationId,action:'SELL',teamId:winner.id,targetTeamId:buyer.id,ticker:'AAPL',quantity:1,pricePerShare:12.34}));
    assert.equal(offer.status,200,JSON.stringify(await offer.clone().json()));
    const offerId = (await offer.json()).offer.id;
    assert.equal((await command('SET_NEGOTIATED_PRICES',{enabled:false})).status,200);
    assert.equal((await trade(request({simulationId,action:'SELL',teamId:winner.id,targetTeamId:buyer.id,ticker:'AAPL',quantity:1,pricePerShare:12.34}))).status,409);
    const accepted = await trade(request({simulationId,action:'ACCEPT_DIRECT_SELL',teamId:buyer.id,offerId}));
    assert.equal(accepted.status,200);
    assert.equal((await trade(request({simulationId,action:'ACCEPT_DIRECT_SELL',teamId:buyer.id,offerId}))).status,400);
    assert.equal((await trade(request({simulationId,action:'BUY',teamId:winner.id,ticker:'MSFT',quantity:1}))).status,200);
    const proposed = await swap(request({simulationId,action:'PROPOSE',teamId:winner.id,senderId:winner.id,receiverId:buyer.id,giveTicker:'MSFT',giveQty:1,receiveTicker:'AAPL',receiveQty:1}));
    assert.equal(proposed.status,200);
    const swapId = (await proposed.json()).swap.id;
    const swapResponses = await Promise.all([1,2].map(() => swap(request({simulationId,action:'ACCEPT',teamId:buyer.id,swapId}))));
    assert.equal(swapResponses.filter(response=>response.status===200).length,1);
    assert.equal(swapResponses.filter(response=>response.status===400).length,1);
    await command('SET_MARKET_SELL_LOCK',{enabled:false});
    await command('SET_MARKET_SELL_COMMISSION',{enabled:true,percent:2.5});
    const sale = await trade(request({simulationId,action:'SELL',teamId:buyer.id,targetTeamId:'MARKET_POOL',ticker:'MSFT',quantity:1}));
    assert.equal(sale.status,200);
    let database = (await sql.query(`SELECT simulation_snapshot FROM "${schema}".game_state WHERE id=1`))[0].simulation_snapshot;
    assert.equal(database.marketSellCommissionPercent,2.5);
    assert.equal(database.transactions.at(-1).commissionPercent,2.5);
    assert.equal(database.teams[buyer.id].peerTradesByRound[0],2);
    assert.equal((await command('RESET_GAME',{keepTeams:true})).status,200);
    database = (await sql.query(`SELECT simulation_snapshot FROM "${schema}".game_state WHERE id=1`))[0].simulation_snapshot;
    assert.notEqual(database.simulationId,simulationId);
    assert.equal(Object.keys(database.teams).length,10);
    assert.equal(database.transactions.length,0);
    assert.equal(database.marketSellCommissionPercent,5);
    assert.equal(database.marketSellLockEnabled,true);
    assert.equal((await trade(request({simulationId,teamId:winner.id,action:'BUY',ticker:'AAPL',quantity:1}))).status,409);
    for (const table of ['transactions','direct_sell_offers','swap_offers']) assert.equal((await sql.query(`SELECT count(*)::int AS n FROM "${schema}"."${table}"`))[0].n,0);
    assert.equal((await command('EXTEND_TIMER',{minutes:1})).status,409);
    const state = await (await read(new Request('http://localhost/api/state'))).json();
    assert.equal(state.gameState.simulationId,database.simulationId);
    console.log('Neon integration passed: ten concurrent buyers, one complete fill, persisted balances/supply/audits, negotiated sales, commission, duplicate acceptance, reset isolation, and saved admin controls.');
  } finally {
    assert.match(schema,/^bb_verify_[a-f0-9]{16}$/);
    await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
  }
}
run().catch(error=>{console.error(error);process.exitCode=1;});

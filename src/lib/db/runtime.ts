import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getGameState, type MemoryGameState } from "./index";
import { gameStateContext } from "./context";
import { STOCKS_DATA } from "../market-data";
import { migrationSql } from "./migration";

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const sql = connectionString ? neon(connectionString) : null;
let initialization: Promise<void> | undefined;

async function initialize() {
  if (!sql) return;
  initialization ??= (async () => {
    await sql.transaction(migrationSql.split(";").map((statement) => statement.trim()).filter(Boolean).map((statement) => sql.query(statement)));
    await sql`INSERT INTO game_state (id, simulation_snapshot) VALUES (1, ${JSON.stringify(getGameState())}::jsonb)
      ON CONFLICT (id) DO UPDATE SET simulation_snapshot = COALESCE(game_state.simulation_snapshot, EXCLUDED.simulation_snapshot)`;
    const rows = await sql`SELECT simulation_snapshot, revision::text FROM game_state WHERE id=1`;
    if (rows[0].revision === "0") await commit(rows[0].simulation_snapshot as MemoryGameState, rows[0].revision);
  })().catch((error) => { initialization = undefined; throw error; });
  await initialization;
}

async function commit(state: MemoryGameState, revision: string) {
  if (!sql) return true;
  const token = randomUUID();
  const snapshot = JSON.stringify(state);
  const teams = JSON.stringify(Object.values(state.teams));
  const members = JSON.stringify(Object.values(state.teams).flatMap((team) => (team.members || []).map((member) => ({ ...member, id: `${team.id}:${member.id}`, teamId: team.id }))));
  const stocks = JSON.stringify(STOCKS_DATA.map((stock) => ({ ...stock, price: state.stockPrices[stock.ticker], float: state.stockFloats[stock.ticker], active: stock.entryRound === 0 || state.marketExpanded || state.currentRound >= 2 })));
  // ponytail: one versioned game row serializes writes for this 10-team event; split locks by stock if throughput grows.
  // The token gates every write: a losing revision cannot alter balances, shares, or audit records.
  const gate = sql`SELECT 1 FROM game_state WHERE id = 1 AND last_write_token = ${token}::uuid`;
  const result = await sql.transaction([
    sql`UPDATE game_state SET simulation_snapshot=${snapshot}::jsonb, revision=revision+1, last_write_token=${token}::uuid,
      simulation_id=${state.simulationId}::uuid, current_round=${state.currentRound}, status=${state.status},
      trading_expires_at=${state.tradingExpiresAt ? new Date(state.tradingExpiresAt).toISOString() : null}::timestamptz,
      market_expanded=${state.marketExpanded}, leaderboard_visible=${state.leaderboardVisible}, stage_audit_visible=${state.stageAuditVisible !== false},
      stock_prices=${JSON.stringify(state.stockPrices)}::jsonb, stock_floats=${JSON.stringify(state.stockFloats)}::jsonb,
      custom_scenarios=${JSON.stringify(state.customScenarios || {})}::jsonb, custom_price_shifts=${JSON.stringify(state.customPriceShifts || {})}::jsonb,
      updated_at=NOW() WHERE id=1 AND revision=${revision}::bigint RETURNING revision`,
    sql`DELETE FROM transactions WHERE EXISTS (${gate}) AND id NOT IN (SELECT value->>'id' FROM jsonb_array_elements(${JSON.stringify(state.transactions)}::jsonb))`,
    sql`DELETE FROM direct_sell_offers WHERE EXISTS (${gate}) AND id NOT IN (SELECT value->>'id' FROM jsonb_array_elements(${JSON.stringify(state.directSellOffers)}::jsonb))`,
    sql`DELETE FROM swap_offers WHERE EXISTS (${gate}) AND id NOT IN (SELECT value->>'id' FROM jsonb_array_elements(${JSON.stringify(state.swaps)}::jsonb))`,
    sql`DELETE FROM team_members WHERE EXISTS (${gate})`,
    sql`DELETE FROM teams WHERE EXISTS (${gate}) AND id NOT IN (SELECT value->>'id' FROM jsonb_array_elements(${teams}::jsonb))`,
    sql`INSERT INTO teams (id,team_name,passcode,cash_balance,is_frozen,is_ready,table_number,portfolio,peer_trades_by_round)
      SELECT x->>'id',x->>'teamName',x->>'passcode',(x->>'cashBalance')::numeric,(x->>'isFrozen')::boolean,COALESCE((x->>'isReady')::boolean,false),x->>'tableNumber',x->'portfolio',COALESCE(x->'peerTradesByRound','{}'::jsonb)
      FROM jsonb_array_elements(${teams}::jsonb) x WHERE EXISTS (${gate})
      ON CONFLICT(id) DO UPDATE SET team_name=EXCLUDED.team_name,passcode=EXCLUDED.passcode,cash_balance=EXCLUDED.cash_balance,is_frozen=EXCLUDED.is_frozen,is_ready=EXCLUDED.is_ready,table_number=EXCLUDED.table_number,portfolio=EXCLUDED.portfolio,peer_trades_by_round=EXCLUDED.peer_trades_by_round`,
    sql`INSERT INTO team_members (id,team_id,name,roll_no,phone,role)
      SELECT x->>'id',x->>'teamId',x->>'name',x->>'rollNo',x->>'phone',COALESCE(x->>'role','Member') FROM jsonb_array_elements(${members}::jsonb) x WHERE EXISTS (${gate})`,
    sql`INSERT INTO stocks (ticker,name,sector,max_supply,available_supply,current_price,entry_round,is_active)
      SELECT x->>'ticker',x->>'name',x->>'sector',100,(x->>'float')::integer,(x->>'price')::numeric,(x->>'entryRound')::integer,(x->>'active')::boolean FROM jsonb_array_elements(${stocks}::jsonb) x WHERE EXISTS (${gate})
      ON CONFLICT(ticker) DO UPDATE SET available_supply=EXCLUDED.available_supply,current_price=EXCLUDED.current_price,is_active=EXCLUDED.is_active`,
    sql`INSERT INTO direct_sell_offers (id,seller_team_id,seller_team_name,buyer_team_id,buyer_team_name,ticker,quantity,price,total,status,expires_at,created_at,simulation_id,round_number)
      SELECT x->>'id',x->>'sellerTeamId',x->>'sellerTeamName',x->>'buyerTeamId',x->>'buyerTeamName',x->>'ticker',(x->>'quantity')::integer,(x->>'price')::numeric,(x->>'total')::numeric,x->>'status',to_timestamp((x->>'expiresAt')::numeric/1000),to_timestamp((x->>'createdAt')::numeric/1000),${state.simulationId}::uuid,(x->>'round')::integer FROM jsonb_array_elements(${JSON.stringify(state.directSellOffers)}::jsonb) x WHERE EXISTS (${gate})
      ON CONFLICT(id) DO UPDATE SET status=EXCLUDED.status,seller_team_name=EXCLUDED.seller_team_name,buyer_team_name=EXCLUDED.buyer_team_name`,
    sql`INSERT INTO swap_offers (id,sender_team_id,receiver_team_id,give_ticker,give_quantity,receive_ticker,receive_quantity,status,expires_at,created_at,simulation_id,round_number)
      SELECT x->>'id',x->>'senderId',x->>'receiverId',x->>'giveTicker',(x->>'giveQty')::integer,x->>'receiveTicker',(x->>'receiveQty')::integer,x->>'status',to_timestamp((x->>'expiresAt')::numeric/1000),to_timestamp((x->>'createdAt')::numeric/1000),${state.simulationId}::uuid,(x->>'round')::integer FROM jsonb_array_elements(${JSON.stringify(state.swaps)}::jsonb) x WHERE EXISTS (${gate})
      ON CONFLICT(id) DO UPDATE SET status=EXCLUDED.status`,
    sql`INSERT INTO transactions (id,round_number,team_id,team_name,transaction_type,ticker,quantity,price_per_share,total_amount,counterparty_team_id,counterparty_team_name,simulation_id,gross_total,commission_amount,commission_percent,display_timestamp)
      SELECT x->>'id',(x->>'round')::integer,x->>'teamId',x->>'teamName',x->>'type',x->>'ticker',(x->>'quantity')::integer,(x->>'price')::numeric,(x->>'total')::numeric,x->>'counterpartyTeamId',x->>'counterparty',${state.simulationId}::uuid,(x->>'grossTotal')::numeric,(x->>'commissionAmount')::numeric,(x->>'commissionPercent')::numeric,x->>'timestamp' FROM jsonb_array_elements(${JSON.stringify(state.transactions)}::jsonb) x WHERE EXISTS (${gate})
      ON CONFLICT(id) DO UPDATE SET team_name=EXCLUDED.team_name,counterparty_team_name=EXCLUDED.counterparty_team_name`,
  ]);
  return result[0].length === 1;
}

export async function runGameStateRequest(request: Request, handler: (request: Request) => Promise<Response>): Promise<Response> {
  if (!sql) {
    if (process.env.VERCEL) return NextResponse.json({ error: "Database connection is not configured for this deployment." }, { status: 503 });
    return handler(request);
  }
  try {
    await initialize();
    for (let attempt = 0; attempt < 20; attempt++) {
      const rows = await sql`SELECT simulation_snapshot, revision::text FROM game_state WHERE id=1`;
      const state = rows[0].simulation_snapshot as MemoryGameState;
      state.databaseRevision = Number(rows[0].revision);
      const before = JSON.stringify(state);
      const response = await gameStateContext.run(state, () => handler(request.clone()));
      if (response.status >= 500) return response;
      if (JSON.stringify(state) === before || await commit(state, rows[0].revision)) return response;
      // Revalidate the entire order against the winning commit's balances and supply.
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 40 + 5));
    }
    return NextResponse.json({ error: "The market is busy. No order was executed; please try again." }, { status: 503 });
  } catch (error) {
    console.error("Game database operation failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "The database is unavailable. No order was confirmed. Please try again." }, { status: 503 });
  }
}

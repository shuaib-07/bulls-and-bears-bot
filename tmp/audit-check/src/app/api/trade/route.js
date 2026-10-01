"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const session_1 = require("@/src/lib/session");
const node_crypto_1 = require("node:crypto");
const runtime_1 = require("@/src/lib/db/runtime");
const server_1 = require("next/server");
const db_1 = require("@/src/lib/db");
const peer_trades_1 = require("@/src/lib/peer-trades");
const market_sale_1 = require("@/src/lib/market-sale");
const market_data_1 = require("@/src/lib/market-data");
async function execute(request) {
    try {
        const { teamId, action, ticker, quantity, targetTeamId, simulationId } = await request.json();
        const state = (0, db_1.getGameState)();
        if (!(0, session_1.isTeamAuthenticated)(request, state.teams[teamId]))
            return server_1.NextResponse.json({ error: "Your login expired. Please log in again." }, { status: 401 });
        if (simulationId !== state.simulationId)
            return server_1.NextResponse.json({ error: "The simulation was reset. Refresh your terminal before trading." }, { status: 409 });
        // 0. Toggle Team Readiness (Allowed in SETUP / Standby)
        if (action === "TOGGLE_READY") {
            const team = state.teams[teamId];
            if (!team) {
                return server_1.NextResponse.json({ error: "Team not found. Please log in." }, { status: 404 });
            }
            team.isReady = !team.isReady;
            return server_1.NextResponse.json({
                success: true,
                isReady: team.isReady,
                message: team.isReady ? `"${team.teamName}" marked READY for Round 0!` : `"${team.teamName}" marked STANDBY.`,
            });
        }
        // 1. Verify trading window is open
        if (state.status !== "TRADING_OPEN") {
            return server_1.NextResponse.json({ error: "Trading is currently CLOSED. Wait for the host to open the trading window." }, { status: 403 });
        }
        if (state.tradingExpiresAt && Date.now() >= state.tradingExpiresAt) {
            state.status = "TRADING_CLOSED";
            return server_1.NextResponse.json({ error: "Round trading time has EXPIRED! Market is locked." }, { status: 403 });
        }
        // 2. Verify team
        const team = state.teams[teamId];
        if (!team) {
            return server_1.NextResponse.json({ error: "Team not found. Please log in." }, { status: 404 });
        }
        if (team.isFrozen) {
            return server_1.NextResponse.json({ error: "Your team has been frozen by the game administrator." }, { status: 403 });
        }
        if (["ACCEPT_DIRECT_SELL", "REJECT_DIRECT_SELL", "CANCEL_DIRECT_SELL"].includes(action) ||
            (action === "SELL" && targetTeamId && targetTeamId !== "MARKET_POOL")) {
            return server_1.NextResponse.json({ error: "Direct sales between teams are disabled. Sell to the market or propose a share swap.", code: "DIRECT_SALES_DISABLED" }, { status: 403 });
        }
        const qty = quantity;
        if (!Number.isSafeInteger(qty) || qty <= 0) {
            return server_1.NextResponse.json({ error: "Quantity must be a positive integer." }, { status: 400 });
        }
        const price = state.stockPrices[ticker];
        const stock = market_data_1.STOCKS_DATA.find((item) => item.ticker === ticker);
        if (!stock || !(stock.entryRound === 0 || state.marketExpanded || state.currentRound >= 2) || typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
            return server_1.NextResponse.json({ error: `Stock ${ticker} not found in active market.` }, { status: 404 });
        }
        const totalCost = Math.round(price * qty * 100) / 100;
        // -------------------------------------------------------------------------
        // ACTION: BUY FROM OPEN MARKET FLOAT
        // -------------------------------------------------------------------------
        if (action === "BUY") {
            const availableFloat = state.stockFloats[ticker] || 0;
            if (qty > availableFloat) {
                return server_1.NextResponse.json({ error: `Insufficient market float! Only ${availableFloat} shares of ${ticker} available in the market pool. Use share swaps to trade with other teams.` }, { status: 400 });
            }
            if (team.cashBalance < totalCost) {
                return server_1.NextResponse.json({ error: `Insufficient cash! Total cost is $${totalCost.toLocaleString()}, but your balance is $${team.cashBalance.toLocaleString()}.` }, { status: 400 });
            }
            // Execute BUY
            team.cashBalance = Math.round((team.cashBalance - totalCost) * 100) / 100;
            state.stockFloats[ticker] -= qty;
            team.portfolio[ticker] = (team.portfolio[ticker] || 0) + qty;
            state.transactions.push({
                id: (0, node_crypto_1.randomUUID)(),
                timestamp: new Date().toLocaleTimeString(),
                round: state.currentRound,
                teamName: team.teamName,
                type: "BUY",
                teamId: team.id,
                ticker,
                quantity: qty,
                price,
                total: totalCost,
            });
            return server_1.NextResponse.json({
                success: true,
                message: `Successfully purchased ${qty} shares of ${ticker} for $${totalCost.toLocaleString()}!`,
                team,
                availableFloat: state.stockFloats[ticker],
            });
        }
        // -------------------------------------------------------------------------
        // ACTION: SELL TO MARKET POOL
        // -------------------------------------------------------------------------
        if (action === "SELL") {
            const ownedQty = team.portfolio[ticker] || 0;
            if (qty > ownedQty) {
                return server_1.NextResponse.json({ error: `Cannot sell ${qty} shares. You only own ${ownedQty} shares of ${ticker}.` }, { status: 400 });
            }
            // Market sales require the configured swap progress.
            const peerTrades = (0, peer_trades_1.getPeerTradeCount)(team, state.currentRound);
            if (state.marketSellLockEnabled && peerTrades < peer_trades_1.REQUIRED_PEER_TRADES) {
                return server_1.NextResponse.json({
                    error: `Market sales are locked. Complete ${peer_trades_1.REQUIRED_PEER_TRADES - peerTrades} more accepted swap(s) with other teams in Round ${state.currentRound}.`,
                    code: "MARKET_SELL_LOCKED",
                    qualifyingPeerTrades: peerTrades,
                }, { status: 403 });
            }
            const commissionPercent = state.marketSellCommissionEnabled ? state.marketSellCommissionPercent || 0 : 0;
            const sale = (0, market_sale_1.calculateMarketSale)(price, qty, commissionPercent);
            team.cashBalance = Number((team.cashBalance + sale.netTotal).toFixed(2));
            state.stockFloats[ticker] = (state.stockFloats[ticker] || 0) + qty;
            team.portfolio[ticker] -= qty;
            if (team.portfolio[ticker] <= 0) {
                delete team.portfolio[ticker];
            }
            state.transactions.push({
                id: (0, node_crypto_1.randomUUID)(),
                timestamp: new Date().toLocaleTimeString(),
                round: state.currentRound,
                teamName: team.teamName,
                type: "SELL",
                teamId: team.id,
                ticker,
                quantity: qty,
                price,
                total: sale.netTotal,
                grossTotal: sale.grossTotal,
                commissionAmount: sale.commissionAmount,
                commissionPercent,
            });
            return server_1.NextResponse.json({
                success: true,
                message: `Sold ${qty} shares of ${ticker} to the market. Gross: $${sale.grossTotal.toFixed(2)}; commission: $${sale.commissionAmount.toFixed(2)} (${commissionPercent}%); net received: $${sale.netTotal.toFixed(2)}.`,
                sale,
                team,
                availableFloat: state.stockFloats[ticker],
            });
        }
        return server_1.NextResponse.json({ error: "Invalid trading action." }, { status: 400 });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: "Failed to execute order." }, { status: 500 });
    }
}
async function POST(request) {
    return (0, runtime_1.runGameStateRequest)(request, execute);
}

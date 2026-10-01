"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const session_1 = require("@/src/lib/session");
const node_crypto_1 = require("node:crypto");
const runtime_1 = require("@/src/lib/db/runtime");
const server_1 = require("next/server");
const db_1 = require("@/src/lib/db");
const peer_trades_1 = require("@/src/lib/peer-trades");
const market_data_1 = require("@/src/lib/market-data");
async function execute(request) {
    try {
        const { action, swapId, senderId, receiverId, giveTicker, giveQty, receiveTicker, receiveQty, teamId, simulationId } = await request.json();
        const state = (0, db_1.getGameState)();
        if (!(0, session_1.isTeamAuthenticated)(request, state.teams[teamId]))
            return server_1.NextResponse.json({ error: "Your login expired. Please log in again." }, { status: 401 });
        if (simulationId !== state.simulationId)
            return server_1.NextResponse.json({ error: "The simulation was reset. Refresh your terminal before trading." }, { status: 409 });
        if (state.status !== "TRADING_OPEN" || (state.tradingExpiresAt && Date.now() >= state.tradingExpiresAt)) {
            if (state.status === "TRADING_OPEN" && state.tradingExpiresAt && Date.now() >= state.tradingExpiresAt) {
                state.status = "TRADING_CLOSED";
            }
            return server_1.NextResponse.json({ error: "Trading window is CLOSED. Swaps are locked." }, { status: 403 });
        }
        if (action === "PROPOSE") {
            if (teamId !== senderId)
                return server_1.NextResponse.json({ error: "Only the offering team can propose its shares." }, { status: 403 });
            const sender = state.teams[senderId];
            const receiver = state.teams[receiverId];
            if (!sender || !receiver) {
                return server_1.NextResponse.json({ error: "Invalid teams selected." }, { status: 400 });
            }
            if (sender.id === receiver.id) {
                return server_1.NextResponse.json({ error: "Cannot swap with your own team." }, { status: 400 });
            }
            if (sender.isFrozen || receiver.isFrozen)
                return server_1.NextResponse.json({ error: "Frozen teams cannot swap shares." }, { status: 403 });
            const tickersActive = [giveTicker, receiveTicker].every((ticker) => market_data_1.STOCKS_DATA.some((stock) => stock.ticker === ticker && (stock.entryRound === 0 || state.marketExpanded || state.currentRound >= 2)));
            if (!tickersActive)
                return server_1.NextResponse.json({ error: "Choose stocks listed in the active market." }, { status: 400 });
            const gQty = giveQty;
            const rQty = receiveQty;
            if (!Number.isSafeInteger(gQty) || gQty <= 0 || !Number.isSafeInteger(rQty) || rQty <= 0) {
                return server_1.NextResponse.json({ error: "Quantities must be positive numbers." }, { status: 400 });
            }
            const senderOwned = sender.portfolio[giveTicker] || 0;
            if (gQty > senderOwned) {
                return server_1.NextResponse.json({ error: `You do not own enough ${giveTicker}. Owned: ${senderOwned}, Offered: ${gQty}.` }, { status: 400 });
            }
            const newSwap = {
                id: (0, node_crypto_1.randomUUID)(),
                senderId: sender.id,
                senderTeam: sender.teamName,
                receiverId: receiver.id,
                receiverTeam: receiver.teamName,
                giveTicker,
                giveQty: gQty,
                receiveTicker,
                receiveQty: rQty,
                status: "PENDING",
                expiresAt: Date.now() + 60000, // 60-second interactive countdown
                createdAt: Date.now(),
                round: state.currentRound,
            };
            state.swaps.push(newSwap);
            return server_1.NextResponse.json({ success: true, message: `Trade proposal sent to ${receiver.teamName}!`, swap: newSwap });
        }
        if (action === "ACCEPT") {
            const swap = state.swaps.find((s) => s.id === swapId);
            if (!swap) {
                return server_1.NextResponse.json({ error: "Swap offer not found." }, { status: 404 });
            }
            if (teamId !== swap.receiverId)
                return server_1.NextResponse.json({ error: "Only the receiving team can accept this swap." }, { status: 403 });
            if (swap.status !== "PENDING") {
                return server_1.NextResponse.json({ error: `Swap is already ${swap.status}.` }, { status: 400 });
            }
            const sender = state.teams[swap.senderId];
            if (Date.now() >= swap.expiresAt) {
                swap.status = "EXPIRED";
                return server_1.NextResponse.json({ error: "This swap offer has expired." }, { status: 400 });
            }
            const receiver = state.teams[swap.receiverId];
            if (!sender || !receiver) {
                return server_1.NextResponse.json({ error: "One or both teams not found." }, { status: 404 });
            }
            if (sender.isFrozen || receiver.isFrozen)
                return server_1.NextResponse.json({ error: "Frozen teams cannot swap shares." }, { status: 403 });
            // Final inventory verification
            const senderStock = sender.portfolio[swap.giveTicker] || 0;
            const receiverStock = receiver.portfolio[swap.receiveTicker] || 0;
            if (senderStock < swap.giveQty) {
                swap.status = "CANCELLED";
                return server_1.NextResponse.json({ error: `${sender.teamName} no longer has ${swap.giveQty} ${swap.giveTicker}.` }, { status: 400 });
            }
            if (receiverStock < swap.receiveQty) {
                return server_1.NextResponse.json({ error: `You do not have ${swap.receiveQty} ${swap.receiveTicker} to complete this trade.` }, { status: 400 });
            }
            // Execute Atomic Swap
            // 1. Deduct & Grant to Sender
            sender.portfolio[swap.giveTicker] -= swap.giveQty;
            if (sender.portfolio[swap.giveTicker] === 0)
                delete sender.portfolio[swap.giveTicker];
            sender.portfolio[swap.receiveTicker] = (sender.portfolio[swap.receiveTicker] || 0) + swap.receiveQty;
            // 2. Deduct & Grant to Receiver
            receiver.portfolio[swap.receiveTicker] -= swap.receiveQty;
            if (receiver.portfolio[swap.receiveTicker] === 0)
                delete receiver.portfolio[swap.receiveTicker];
            receiver.portfolio[swap.giveTicker] = (receiver.portfolio[swap.giveTicker] || 0) + swap.giveQty;
            swap.status = "ACCEPTED";
            (0, peer_trades_1.recordPeerTrade)(sender, state.currentRound);
            (0, peer_trades_1.recordPeerTrade)(receiver, state.currentRound);
            state.transactions.push({
                id: (0, node_crypto_1.randomUUID)(),
                timestamp: new Date().toLocaleTimeString(),
                round: state.currentRound,
                teamName: sender.teamName,
                teamId: sender.id,
                type: "SWAP",
                ticker: `${swap.giveQty} ${swap.giveTicker} ⇄ ${swap.receiveQty} ${swap.receiveTicker}`,
                quantity: swap.giveQty,
                price: state.stockPrices[swap.giveTicker] || 0,
                total: 0,
                counterparty: receiver.teamName,
                counterpartyTeamId: receiver.id,
            });
            return server_1.NextResponse.json({ success: true, message: `Trade executed successfully between ${sender.teamName} and ${receiver.teamName}!` });
        }
        if (action === "REJECT") {
            const swap = state.swaps.find((s) => s.id === swapId);
            if (swap && swap.receiverId === teamId && swap.status === "PENDING") {
                swap.status = "REJECTED";
            }
            return server_1.NextResponse.json({ success: true, message: "Swap offer rejected." });
        }
        return server_1.NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: "Failed to process swap." }, { status: 500 });
    }
}
async function POST(request) {
    return (0, runtime_1.runGameStateRequest)(request, execute);
}

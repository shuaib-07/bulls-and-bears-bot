import { isTeamAuthenticated } from "@/src/lib/session";
import { randomUUID } from "node:crypto";
import { runGameStateRequest } from "@/src/lib/db/runtime";
import { NextResponse } from "next/server";
import { getGameState } from "@/src/lib/db";
import { recordPeerTrade } from "@/src/lib/peer-trades";
import { STOCKS_DATA } from "@/src/lib/market-data";

async function execute(request: Request) {
  try {
    const { action, swapId, senderId, receiverId, giveTicker, giveQty, receiveTicker, receiveQty, teamId, simulationId } = await request.json();

    const state = getGameState();
    if (!isTeamAuthenticated(request, state.teams[teamId])) return NextResponse.json({ error: "Your login expired. Please log in again." }, { status: 401 });
    if (simulationId !== state.simulationId) return NextResponse.json({ error: "The simulation was reset. Refresh your terminal before trading." }, { status: 409 });

    if (state.status !== "TRADING_OPEN" || (state.tradingExpiresAt && Date.now() >= state.tradingExpiresAt)) {
      if (state.status === "TRADING_OPEN" && state.tradingExpiresAt && Date.now() >= state.tradingExpiresAt) {
        state.status = "TRADING_CLOSED";
      }
      return NextResponse.json({ error: "Trading window is CLOSED. Swaps are locked." }, { status: 403 });
    }

    if (action === "PROPOSE") {
      if (teamId !== senderId) return NextResponse.json({ error: "Only the offering team can propose its shares." }, { status: 403 });
      const sender = state.teams[senderId];
      const receiver = state.teams[receiverId];

      if (!sender || !receiver) {
        return NextResponse.json({ error: "Invalid teams selected." }, { status: 400 });
      }

      if (sender.id === receiver.id) {
        return NextResponse.json({ error: "Cannot swap with your own team." }, { status: 400 });
      }
      if (sender.isFrozen || receiver.isFrozen) return NextResponse.json({ error: "Frozen teams cannot swap shares." }, { status: 403 });
      const tickersActive = [giveTicker, receiveTicker].every((ticker) => STOCKS_DATA.some((stock) => stock.ticker === ticker && (stock.entryRound === 0 || state.marketExpanded || state.currentRound >= 2)));
      if (!tickersActive) return NextResponse.json({ error: "Choose stocks listed in the active market." }, { status: 400 });

      const gQty = giveQty;
      const rQty = receiveQty;

      if (!Number.isSafeInteger(gQty) || gQty <= 0 || !Number.isSafeInteger(rQty) || rQty <= 0) {
        return NextResponse.json({ error: "Quantities must be positive numbers." }, { status: 400 });
      }

      const senderOwned = sender.portfolio[giveTicker] || 0;
      if (gQty > senderOwned) {
        return NextResponse.json(
          { error: `You do not own enough ${giveTicker}. Owned: ${senderOwned}, Offered: ${gQty}.` },
          { status: 400 }
        );
      }

      const newSwap = {
        id: randomUUID(),
        senderId: sender.id,
        senderTeam: sender.teamName,
        receiverId: receiver.id,
        receiverTeam: receiver.teamName,
        giveTicker,
        giveQty: gQty,
        receiveTicker,
        receiveQty: rQty,
        status: "PENDING" as const,
        expiresAt: Date.now() + 60000, // 60-second interactive countdown
        createdAt: Date.now(),
        round: state.currentRound,
      };

      state.swaps.push(newSwap);

      return NextResponse.json({ success: true, message: `Trade proposal sent to ${receiver.teamName}!`, swap: newSwap });
    }

    if (action === "ACCEPT") {
      const swap = state.swaps.find((s) => s.id === swapId);
      if (!swap) {
        return NextResponse.json({ error: "Swap offer not found." }, { status: 404 });
      }
      if (teamId !== swap.receiverId) return NextResponse.json({ error: "Only the receiving team can accept this swap." }, { status: 403 });

      if (swap.status !== "PENDING") {
        return NextResponse.json({ error: `Swap is already ${swap.status}.` }, { status: 400 });
      }

      const sender = state.teams[swap.senderId];
      if (Date.now() >= swap.expiresAt) {
        swap.status = "EXPIRED";
        return NextResponse.json({ error: "This swap offer has expired." }, { status: 400 });
      }
      const receiver = state.teams[swap.receiverId];

      if (!sender || !receiver) {
        return NextResponse.json({ error: "One or both teams not found." }, { status: 404 });
      }
      if (sender.isFrozen || receiver.isFrozen) return NextResponse.json({ error: "Frozen teams cannot swap shares." }, { status: 403 });

      // Final inventory verification
      const senderStock = sender.portfolio[swap.giveTicker] || 0;
      const receiverStock = receiver.portfolio[swap.receiveTicker] || 0;

      if (senderStock < swap.giveQty) {
        swap.status = "CANCELLED";
        return NextResponse.json({ error: `${sender.teamName} no longer has ${swap.giveQty} ${swap.giveTicker}.` }, { status: 400 });
      }

      if (receiverStock < swap.receiveQty) {
        return NextResponse.json({ error: `You do not have ${swap.receiveQty} ${swap.receiveTicker} to complete this trade.` }, { status: 400 });
      }

      // Execute Atomic Swap
      // 1. Deduct & Grant to Sender
      sender.portfolio[swap.giveTicker] -= swap.giveQty;
      if (sender.portfolio[swap.giveTicker] === 0) delete sender.portfolio[swap.giveTicker];
      sender.portfolio[swap.receiveTicker] = (sender.portfolio[swap.receiveTicker] || 0) + swap.receiveQty;

      // 2. Deduct & Grant to Receiver
      receiver.portfolio[swap.receiveTicker] -= swap.receiveQty;
      if (receiver.portfolio[swap.receiveTicker] === 0) delete receiver.portfolio[swap.receiveTicker];
      receiver.portfolio[swap.giveTicker] = (receiver.portfolio[swap.giveTicker] || 0) + swap.giveQty;

      swap.status = "ACCEPTED";
      recordPeerTrade(sender, state.currentRound);
      recordPeerTrade(receiver, state.currentRound);

      state.transactions.push({
        id: randomUUID(),
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

      return NextResponse.json({ success: true, message: `Trade executed successfully between ${sender.teamName} and ${receiver.teamName}!` });
    }

    if (action === "REJECT") {
      const swap = state.swaps.find((s) => s.id === swapId);
      if (swap && swap.receiverId === teamId && swap.status === "PENDING") {
        swap.status = "REJECTED";
      }
      return NextResponse.json({ success: true, message: "Swap offer rejected." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process swap." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return runGameStateRequest(request, execute);
}

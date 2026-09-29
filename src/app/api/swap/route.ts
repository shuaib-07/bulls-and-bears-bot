import { NextResponse } from "next/server";
import { getGameState } from "@/src/lib/db";

export async function POST(request: Request) {
  try {
    const { action, swapId, senderId, receiverId, giveTicker, giveQty, receiveTicker, receiveQty } = await request.json();

    const state = getGameState();

    if (state.status !== "TRADING_OPEN" || (state.tradingExpiresAt && Date.now() >= state.tradingExpiresAt)) {
      if (state.status === "TRADING_OPEN" && state.tradingExpiresAt && Date.now() >= state.tradingExpiresAt) {
        state.status = "TRADING_CLOSED";
      }
      return NextResponse.json({ error: "Trading window is CLOSED. Swaps are locked." }, { status: 403 });
    }

    if (action === "PROPOSE") {
      const sender = state.teams[senderId];
      const receiver = state.teams[receiverId];

      if (!sender || !receiver) {
        return NextResponse.json({ error: "Invalid teams selected." }, { status: 400 });
      }

      if (sender.id === receiver.id) {
        return NextResponse.json({ error: "Cannot swap with your own team." }, { status: 400 });
      }

      const gQty = parseInt(giveQty, 10);
      const rQty = parseInt(receiveQty, 10);

      if (isNaN(gQty) || gQty <= 0 || isNaN(rQty) || rQty <= 0) {
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
        id: `swap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
      };

      state.swaps.push(newSwap);

      return NextResponse.json({ success: true, message: `Trade proposal sent to ${receiver.teamName}!`, swap: newSwap });
    }

    if (action === "ACCEPT") {
      const swap = state.swaps.find((s) => s.id === swapId);
      if (!swap) {
        return NextResponse.json({ error: "Swap offer not found." }, { status: 404 });
      }

      if (swap.status !== "PENDING") {
        return NextResponse.json({ error: `Swap is already ${swap.status}.` }, { status: 400 });
      }

      const sender = state.teams[swap.senderId];
      const receiver = state.teams[swap.receiverId];

      if (!sender || !receiver) {
        return NextResponse.json({ error: "One or both teams not found." }, { status: 404 });
      }

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

      state.transactions.push({
        id: `tx-swap-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        round: state.currentRound,
        teamName: sender.teamName,
        type: "SWAP",
        ticker: `${swap.giveQty} ${swap.giveTicker} ⇄ ${swap.receiveQty} ${swap.receiveTicker}`,
        quantity: swap.giveQty,
        price: state.stockPrices[swap.giveTicker] || 0,
        total: 0,
        counterparty: receiver.teamName,
      });

      return NextResponse.json({ success: true, message: `Trade executed successfully between ${sender.teamName} and ${receiver.teamName}!` });
    }

    if (action === "REJECT") {
      const swap = state.swaps.find((s) => s.id === swapId);
      if (swap) {
        swap.status = "REJECTED";
      }
      return NextResponse.json({ success: true, message: "Swap offer rejected." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process swap." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getGameState } from "@/src/lib/db";

export async function POST(request: Request) {
  try {
    const { teamId, action, ticker, quantity, targetTeamId, offerId } = await request.json();

    const state = getGameState();

    // 0. Toggle Team Readiness (Allowed in SETUP / Standby)
    if (action === "TOGGLE_READY") {
      const team = state.teams[teamId];
      if (!team) {
        return NextResponse.json({ error: "Team not found. Please log in." }, { status: 404 });
      }
      team.isReady = !team.isReady;
      return NextResponse.json({
        success: true,
        isReady: team.isReady,
        message: team.isReady ? `"${team.teamName}" marked READY for Round 1!` : `"${team.teamName}" marked STANDBY.`,
      });
    }

    // 1. Verify trading window is open
    if (state.status !== "TRADING_OPEN") {
      return NextResponse.json(
        { error: "Trading is currently CLOSED. Wait for the host to open the trading window." },
        { status: 403 }
      );
    }

    if (state.tradingExpiresAt && Date.now() > state.tradingExpiresAt) {
      state.status = "TRADING_CLOSED";
      return NextResponse.json(
        { error: "Round trading time has EXPIRED! Market is locked." },
        { status: 403 }
      );
    }

    // 2. Verify team
    const team = state.teams[teamId];
    if (!team) {
      return NextResponse.json({ error: "Team not found. Please log in." }, { status: 404 });
    }

    if (team.isFrozen) {
      return NextResponse.json({ error: "Your team has been frozen by the game administrator." }, { status: 403 });
    }

    // -------------------------------------------------------------------------
    // ACTION: ACCEPT DIRECT SELL OFFER (120s P2P PURCHASE)
    // -------------------------------------------------------------------------
    if (action === "ACCEPT_DIRECT_SELL") {
      const offer = (state.directSellOffers || []).find((o) => o.id === offerId);
      if (!offer) {
        return NextResponse.json({ error: "Sell offer not found or no longer available." }, { status: 404 });
      }

      if (offer.status === "SOLD_OUT" || offer.status === "ACCEPTED" || offer.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Stock was sold to another team / Offer no longer available!", code: "SOLD_TO_ANOTHER" },
          { status: 400 }
        );
      }

      if (offer.status === "EXPIRED" || Date.now() >= offer.expiresAt) {
        offer.status = "EXPIRED";
        return NextResponse.json(
          { error: "The 120-second offer window for this trade has EXPIRED." },
          { status: 400 }
        );
      }

      const seller = state.teams[offer.sellerTeamId];
      if (!seller) {
        offer.status = "CANCELLED";
        return NextResponse.json({ error: "Seller team is no longer active." }, { status: 400 });
      }

      // Verify seller STILL owns the shares (Collision / multi-team buy check)
      const currentSellerShares = seller.portfolio[offer.ticker] || 0;
      if (currentSellerShares < offer.quantity) {
        offer.status = "SOLD_OUT";
        return NextResponse.json(
          { error: "Stock was sold to another team / Offer no longer available!", code: "SOLD_TO_ANOTHER" },
          { status: 400 }
        );
      }

      // Verify buyer has enough cash
      if (team.cashBalance < offer.total) {
        return NextResponse.json(
          {
            error: `Insufficient cash! Total purchase cost is $${offer.total.toLocaleString()}, but your balance is $${team.cashBalance.toLocaleString()}.`,
          },
          { status: 400 }
        );
      }

      // Execute P2P Transfer
      seller.portfolio[offer.ticker] -= offer.quantity;
      if (seller.portfolio[offer.ticker] <= 0) {
        delete seller.portfolio[offer.ticker];
      }
      seller.cashBalance += offer.total;

      team.portfolio[offer.ticker] = (team.portfolio[offer.ticker] || 0) + offer.quantity;
      team.cashBalance -= offer.total;

      offer.status = "ACCEPTED";

      // Check if seller has any other pending offers for this stock that now exceed their remaining shares
      const remainingSellerShares = seller.portfolio[offer.ticker] || 0;
      (state.directSellOffers || []).forEach((otherOffer) => {
        if (
          otherOffer.id !== offer.id &&
          otherOffer.sellerTeamId === seller.id &&
          otherOffer.ticker === offer.ticker &&
          otherOffer.status === "PENDING" &&
          otherOffer.quantity > remainingSellerShares
        ) {
          otherOffer.status = "SOLD_OUT";
        }
      });

      state.transactions.push({
        id: `tx-p2p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        round: state.currentRound,
        teamName: `${seller.teamName} ➔ ${team.teamName}`,
        type: "SWAP",
        ticker: offer.ticker,
        quantity: offer.quantity,
        price: offer.price,
        total: offer.total,
        counterparty: seller.teamName,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully purchased ${offer.quantity} shares of ${offer.ticker} from ${seller.teamName} for $${offer.total.toLocaleString()}!`,
        team,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: REJECT DIRECT SELL OFFER
    // -------------------------------------------------------------------------
    if (action === "REJECT_DIRECT_SELL") {
      const offer = (state.directSellOffers || []).find((o) => o.id === offerId);
      if (offer) {
        offer.status = "REJECTED";
      }
      return NextResponse.json({ success: true, message: "Sell offer declined." });
    }

    // -------------------------------------------------------------------------
    // ACTION: CANCEL DIRECT SELL OFFER (By Seller)
    // -------------------------------------------------------------------------
    if (action === "CANCEL_DIRECT_SELL") {
      const offer = (state.directSellOffers || []).find((o) => o.id === offerId);
      if (offer && offer.sellerTeamId === team.id) {
        offer.status = "CANCELLED";
      }
      return NextResponse.json({ success: true, message: "Sell offer cancelled." });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive integer." }, { status: 400 });
    }

    const price = state.stockPrices[ticker];
    if (!price) {
      return NextResponse.json({ error: `Stock ${ticker} not found in active market.` }, { status: 404 });
    }

    const totalCost = price * qty;

    // -------------------------------------------------------------------------
    // ACTION: BUY FROM OPEN MARKET FLOAT
    // -------------------------------------------------------------------------
    if (action === "BUY") {
      const availableFloat = state.stockFloats[ticker] || 0;
      if (qty > availableFloat) {
        return NextResponse.json(
          { error: `Insufficient market float! Only ${availableFloat} shares of ${ticker} available in the market pool. Use P2P Swaps or Direct Offers to trade with other teams.` },
          { status: 400 }
        );
      }

      if (team.cashBalance < totalCost) {
        return NextResponse.json(
          { error: `Insufficient cash! Total cost is $${totalCost.toLocaleString()}, but your balance is $${team.cashBalance.toLocaleString()}.` },
          { status: 400 }
        );
      }

      // Execute BUY
      team.cashBalance -= totalCost;
      state.stockFloats[ticker] -= qty;
      team.portfolio[ticker] = (team.portfolio[ticker] || 0) + qty;

      state.transactions.push({
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        round: state.currentRound,
        teamName: team.teamName,
        type: "BUY",
        ticker,
        quantity: qty,
        price,
        total: totalCost,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully purchased ${qty} shares of ${ticker} for $${totalCost.toLocaleString()}!`,
        team,
        availableFloat: state.stockFloats[ticker],
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: SELL (DIRECT TO TEAM OR TO MARKET POOL)
    // -------------------------------------------------------------------------
    if (action === "SELL") {
      const ownedQty = team.portfolio[ticker] || 0;
      if (qty > ownedQty) {
        return NextResponse.json(
          { error: `Cannot sell ${qty} shares. You only own ${ownedQty} shares of ${ticker}.` },
          { status: 400 }
        );
      }

      // Case A: DIRECT P2P SELL OFFER TO TARGET TEAM (120-Second Window)
      if (targetTeamId && targetTeamId !== "MARKET_POOL") {
        const targetTeam = state.teams[targetTeamId];
        if (!targetTeam) {
          return NextResponse.json({ error: "Selected buyer team not found." }, { status: 404 });
        }

        if (targetTeam.id === team.id) {
          return NextResponse.json({ error: "Cannot sell shares to your own team." }, { status: 400 });
        }

        const newOffer = {
          id: `offer-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          sellerTeamId: team.id,
          sellerTeamName: team.teamName,
          buyerTeamId: targetTeam.id,
          buyerTeamName: targetTeam.teamName,
          ticker,
          quantity: qty,
          price,
          total: totalCost,
          status: "PENDING" as const,
          expiresAt: Date.now() + 120 * 1000, // 120 seconds countdown
          createdAt: Date.now(),
        };

        if (!state.directSellOffers) state.directSellOffers = [];
        state.directSellOffers.push(newOffer);

        return NextResponse.json({
          success: true,
          message: `Direct sell offer for ${qty} ${ticker} transmitted to ${targetTeam.teamName}! Recipient has 120 seconds to accept.`,
          offer: newOffer,
          isDirectSell: true,
        });
      }

      // Case B: SELL TO OPEN MARKET POOL
      team.cashBalance += totalCost;
      state.stockFloats[ticker] = (state.stockFloats[ticker] || 0) + qty;
      team.portfolio[ticker] -= qty;
      if (team.portfolio[ticker] <= 0) {
        delete team.portfolio[ticker];
      }

      // Check if seller's remaining shares invalidate any pending direct offers
      const remainingShares = team.portfolio[ticker] || 0;
      (state.directSellOffers || []).forEach((offer) => {
        if (
          offer.sellerTeamId === team.id &&
          offer.ticker === ticker &&
          offer.status === "PENDING" &&
          offer.quantity > remainingShares
        ) {
          offer.status = "SOLD_OUT";
        }
      });

      state.transactions.push({
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        round: state.currentRound,
        teamName: team.teamName,
        type: "SELL",
        ticker,
        quantity: qty,
        price,
        total: totalCost,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully sold ${qty} shares of ${ticker} to market pool for $${totalCost.toLocaleString()}!`,
        team,
        availableFloat: state.stockFloats[ticker],
      });
    }

    return NextResponse.json({ error: "Invalid trading action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to execute order." }, { status: 500 });
  }
}
